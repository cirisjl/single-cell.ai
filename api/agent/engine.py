"""Recommendation engine.

Primary path: an OpenAI model (``AGENT_MODEL``, default ``gpt-5.6-luna``) via the
OpenAI SDK, asked to return a JSON object matching :class:`RecommendResponse`. Recommended parameters are then
re-validated against the tool's own JSON schema before they leave the server.

Private path: when the user selects Qwen, the same prompt goes to a self-hosted
Qwen model served by Ollama (OpenAI-compatible API), so dataset metadata never
leaves infrastructure we control. This path never falls back to OpenAI.

Fallback path: if no ``OPENAI_API_KEY`` is configured (or the call fails), a
schema-default + metadata heuristic produces a usable recommendation so the whole
feature is testable offline.

The engine is deliberately behind a single ``recommend`` function so it can later
be swapped for a Deep-Agents pipeline without touching the router or the UI.
"""
from __future__ import annotations

import json
import os
import re
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from schemas.agent_schemas import (
    ChatMessage, PrefillAction, RecommendContext, RecommendResponse,
)
from agent import catalog, grounding, prompt_log

MODEL = os.getenv("AGENT_MODEL", "gpt-5.6-luna")

# Self-hosted Qwen via Ollama. host.docker.internal reaches Ollama running on the
# Docker host; override OLLAMA_BASE_URL if it runs elsewhere (e.g. a GPU server).
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434/v1")
QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen3.5:0.8b")

_SYSTEM = (
    "You are an expert bioinformatician embedded in the OSCB single-cell analysis "
    "platform. You help users configure a data-processing tool by recommending "
    "concrete parameter VALUES for the tool they are currently setting up. You do "
    "not run anything — you only recommend settings the user can review and apply.\n"
    "Base your choices on the dataset characteristics, the parameter schema and the "
    "tool notes provided. Change a value from its default when the dataset gives a "
    "reason to, and keep the default otherwise; say why for each value you change. "
    "If the dataset looks unsuitable for this tool (for example already processed, "
    "or not raw counts when the tool needs them), say so plainly in the `reply`."
)

_RESPONSE_INSTRUCTIONS = """\
Respond with a single JSON object, no markdown fences, of exactly this shape:
{{
  "reply": "<short markdown explanation for the user>",
  "actions": [
    {{
      "type": "prefill_form",
      "category": "{category}",
      "method": "{method}",
      "parameters": {{ ... }},
      "rationale": "<why each changed value was chosen>"
    }}
  ]
}}
`parameters` MUST mirror the form structure: tunable settings for this tool go
under the "{group_key}" key (an object), and any top-level settings go directly in
`parameters`. Only include keys that appear in the schema below. Use the exact
allowed values for enum fields. `use_default` is set automatically; leave it out.

{schema_text}
"""


def _read_api_key():
    """Resolve the OpenAI key from an env var or a Docker secret file.

    Order: OPENAI_API_KEY env -> OPENAI_API_KEY_FILE -> /run/secrets/openai_api_key
    (the secret name used in docker-compose). Lets the agent reuse the same key
    the existing chatbot already ships as a secret, with no extra config.
    """
    key = os.getenv("OPENAI_API_KEY")
    if key and key.strip():
        return key.strip()
    candidates = [
        os.getenv("OPENAI_API_KEY_FILE"),
        "/run/secrets/openai_api_key",
        "/run/secrets/openai_api_key.txt",
    ]
    for path in candidates:
        try:
            if path and os.path.isfile(path):
                with open(path, "r", encoding="utf-8") as fh:
                    val = fh.read().strip()
                    if val:
                        return val
        except OSError:
            continue
    return None


def _client():
    try:
        from openai import OpenAI  # imported lazily so the module loads without the dep
    except ImportError:
        return None
    key = _read_api_key()
    if not key:
        return None
    # Bounded timeout + limited retries so a slow/unreachable call fails over to
    # the heuristic quickly instead of hanging the request.
    try:
        timeout = float(os.getenv("AGENT_TIMEOUT", "45"))
    except ValueError:
        timeout = 45.0
    # max_retries=0 so a slow call fails over to the heuristic in one timeout
    # window instead of doubling.
    return OpenAI(api_key=key, timeout=timeout, max_retries=0)


def _qwen_client():
    try:
        from openai import OpenAI
    except ImportError:
        return None
    # Local CPU inference is much slower than the OpenAI API, so allow longer.
    try:
        timeout = float(os.getenv("QWEN_TIMEOUT", "180"))
    except ValueError:
        timeout = 180.0
    # Ollama ignores the key, but the SDK requires a non-empty one.
    return OpenAI(base_url=OLLAMA_BASE_URL, api_key="ollama", timeout=timeout, max_retries=0)


def _qwen_sampling() -> Dict[str, Any]:
    """Fixed sampling for Qwen so output doesn't depend on each model's Ollama preset.

    Qwen 3.5 ships with temperature=1 and presence_penalty=1.5, tuned for creative
    or thinking use. JSON constantly repeats tokens (quotes, colons, key names), so
    a presence penalty fights the format; a lower temperature keeps it consistent.
    """
    try:
        temperature = float(os.getenv("QWEN_TEMPERATURE", "0.3"))
    except ValueError:
        temperature = 0.3
    return {"temperature": temperature, "presence_penalty": 0}


def _dump(model) -> Dict[str, Any]:
    """Pydantic v2 ``model_dump()`` with a v1 ``dict()`` fallback."""
    return model.model_dump() if hasattr(model, "model_dump") else model.dict()


def _parse_json(raw: str) -> Dict[str, Any]:
    """Parse the model's JSON reply, tolerating <think> blocks or stray text
    around the object (smaller local models don't always obey JSON mode)."""
    raw = re.sub(r"<think>.*?</think>", "", raw or "", flags=re.DOTALL).strip()
    try:
        return json.loads(raw or "{}")
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start != -1 and end > start:
            return json.loads(raw[start:end + 1])
        raise


# --------------------------------------------------------------------------- #
# Heuristic fallback
# --------------------------------------------------------------------------- #
_OFFLINE_NOTE = ("*(Generated offline from schema defaults — set `OPENAI_API_KEY` on the API "
                 "service to enable model recommendations.)*")
_QWEN_OFFLINE_NOTE = ("*(Generated offline from schema defaults — the local Qwen model could "
                      "not be reached. Check that Ollama is running and `" + QWEN_MODEL + "` is pulled.)*")


def _heuristic(desc: Dict[str, Any], context: RecommendContext,
               meta: Dict[str, Any], note: str = _OFFLINE_NOTE) -> RecommendResponse:
    group_key = desc.get("group_key")
    params: Dict[str, Any] = {}
    group: Dict[str, Any] = {}

    # Start from schema defaults.
    for p in desc.get("group_params", []):
        if p.get("default") is not None:
            group[p["name"]] = p["default"]
    for p in desc.get("top_params", []):
        if p.get("default") is not None:
            params[p["name"]] = p["default"]

    notes: List[str] = []

    # Ground a few well-understood knobs in dataset characteristics.
    n_cells = grounding.cell_count(meta)
    if n_cells and "doublet_rate" in group:
        # ~0.8% doublets per 1,000 cells (10x-style), capped at 10%.
        group["doublet_rate"] = round(min(0.10, 0.008 * (n_cells / 1000.0)), 3)
        notes.append(f"doublet_rate scaled to ~{group['doublet_rate']} for ~{n_cells} cells")
    # Check the schema, not `params`: these fields have no default, so they are
    # never in `params` yet.
    top_names = {p["name"] for p in desc.get("top_params", [])}
    if grounding.species_name(meta) and "species" in top_names:
        params["species"] = grounding.species_name(meta)
        notes.append(f"species set from dataset ({params['species']})")
    if grounding.organ_part(meta) and "organ_part" in top_names:
        params["organ_part"] = grounding.organ_part(meta)

    if group_key and group:
        params[group_key] = group

    params = _sync_use_default(desc, catalog.validate_and_filter(context.category, context.method, params))
    reply = (
        f"Here are recommended parameters for **{context.method}**. "
        + ("Adjustments: " + "; ".join(notes) + "." if notes
           else "These follow the tool defaults (no dataset metadata was available to refine them).")
        + "\n\n" + note
    )
    action = PrefillAction(
        category=context.category, method=context.method,
        parameters=params, rationale="; ".join(notes) or "Schema defaults for this tool.",
    )
    return RecommendResponse(reply=reply, actions=[action], source="heuristic", model=None)


def _sync_use_default(desc: Optional[Dict[str, Any]], params: Dict[str, Any]) -> Dict[str, Any]:
    """Set `use_default` from the recommended values instead of trusting the model.

    The backend ignores `use_default`; in the UI it is a "reset to defaults" switch
    (toolsDetailsComponent.js). A recommendation that changes values but says
    use_default=true could later be reset to defaults by the form, so it is true
    only when the recommendation covers every defaulted setting and leaves all of
    them at their defaults.
    """
    if not desc or not desc.get("group_key"):
        return params
    group = params.get(desc["group_key"])
    names = {p["name"] for p in desc.get("group_params", [])}
    if "use_default" not in names or not isinstance(group, dict):
        return params
    defaults = {p["name"]: p["default"] for p in desc["group_params"]
                if p.get("default") is not None and p["name"] != "use_default"}
    covers_all = all(name in group for name in defaults)
    unchanged = all(group[name] == value for name, value in defaults.items() if name in group)
    group["use_default"] = covers_all and unchanged
    return params


# --------------------------------------------------------------------------- #
# LLM path
# --------------------------------------------------------------------------- #
def _llm(client, messages: List[ChatMessage], context: RecommendContext,
         desc: Optional[Dict[str, Any]], meta: Dict[str, Any],
         model: str = MODEL, source: str = "openai",
         effort: Optional[str] = None,
         log: Optional[Dict[str, Any]] = None,
         sampling: Optional[Dict[str, Any]] = None) -> RecommendResponse:
    sys_parts = [_SYSTEM, "\n## Dataset\n" + grounding.summarize_metadata(meta)]

    want_actions = desc is not None
    if want_actions:
        sys_parts.append("\n## Task\n" + _RESPONSE_INSTRUCTIONS.format(
            category=context.category, method=context.method,
            group_key=desc.get("group_key") or "parameters",
            schema_text=_schema_section(context, desc),
        ))
    else:
        sys_parts.append(
            "\n## Task\nAnswer the user's single-cell analysis question. Respond with a "
            'JSON object {"reply": "<markdown answer>", "actions": []}.'
        )

    convo = [{"role": "system", "content": "\n".join(sys_parts)}]
    convo += [{"role": m.role, "content": m.content} for m in messages if m.role in ("user", "assistant")]
    if not any(m.role == "user" for m in messages) and want_actions:
        convo.append({"role": "user",
                      "content": f"Recommend parameter values for {context.method}."})

    create_kwargs = dict(
        model=model,
        messages=convo,
        response_format={"type": "json_object"},
        **(sampling or {}),
    )
    # Parameter-picking doesn't need deep reasoning; low effort keeps latency
    # low and consistent for the UI. Fall back gracefully if the model/SDK rejects
    # the arg.
    if effort is None:
        # GPT-5.6 models accept none | low | medium | high | xhigh.
        effort = os.getenv("AGENT_REASONING_EFFORT", "low")

    def create(**extra):
        # Record exactly what is sent and what comes back, for the prompt log.
        call = {"model": model, "reasoning_effort": extra.get("reasoning_effort"),
                "response_format": create_kwargs["response_format"],
                "sampling": sampling, "messages": convo}
        if log is not None:
            log["llm_calls"].append(call)
        started = time.time()
        try:
            completion = client.chat.completions.create(**extra, **create_kwargs)
        except Exception as exc:  # noqa: BLE001
            call["error"] = repr(exc)
            raise
        finally:
            call["latency_s"] = round(time.time() - started, 2)
        call["raw_response"] = completion.choices[0].message.content
        call["finish_reason"] = completion.choices[0].finish_reason
        if getattr(completion, "usage", None) is not None:
            call["usage"] = completion.usage.model_dump()
        return completion

    try:
        completion = create(reasoning_effort=effort)
    except TypeError:
        completion = create()
    except Exception as exc:  # noqa: BLE001
        if "reasoning_effort" in str(exc):
            # Retrying without the setting uses the model's default effort, which is
            # slower; warn so a rejected AGENT_REASONING_EFFORT doesn't go unnoticed.
            print(f"[agent.engine] WARNING: {model} rejected reasoning_effort={effort!r}; "
                  "retrying with the model default. Set AGENT_REASONING_EFFORT to a supported value.")
            completion = create()
        else:
            raise
    data = _parse_json(completion.choices[0].message.content)

    actions: List[PrefillAction] = []
    for a in data.get("actions", []) or []:
        cleaned = _sync_use_default(desc, catalog.validate_and_filter(
            context.category, context.method, a.get("parameters", {}) or {}))
        actions.append(PrefillAction(
            category=context.category or a.get("category"),
            method=context.method or a.get("method"),
            parameters=cleaned,
            rationale=a.get("rationale"),
        ))
    return RecommendResponse(
        reply=data.get("reply", "").strip() or "Here is my recommendation.",
        actions=actions,
        source=source if want_actions else "chat",
        model=model,
    )


def _schema_section(context: RecommendContext, desc: Dict[str, Any]) -> str:
    text = "## Parameter schema\n" + catalog.prompt_text(desc)
    notes = catalog.guidance_text(context.category, context.method)
    if notes:
        text += "\n\n## Tool notes (how this tool actually uses its parameters)\n" + notes
    return text


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
def recommend(messages: List[ChatMessage], context: RecommendContext,
              model: Optional[str] = None) -> RecommendResponse:
    """Answer one recommend request and append it to the prompt log."""
    context = context or RecommendContext()
    log: Dict[str, Any] = {
        "id": uuid.uuid4().hex[:8],
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "selected_model": model,
        "context": _dump(context),
        "messages_from_ui": [_dump(m) for m in messages],
        "llm_calls": [],
    }
    started = time.time()
    try:
        response = _recommend(messages, context, model, log)
        log["result"] = _dump(response)
        return response
    except Exception as exc:
        log["error"] = repr(exc)
        raise
    finally:
        log["duration_s"] = round(time.time() - started, 2)
        prompt_log.write(log)


def _recommend(messages: List[ChatMessage], context: RecommendContext,
               model: Optional[str], log: Dict[str, Any]) -> RecommendResponse:
    meta = grounding.get_dataset_metadata(context.datasetId)
    desc = catalog.describe_tool(context.category, context.method) if context.category and context.method else None

    if model == "qwen":
        # Privacy mode: only the self-hosted model, never an external API.
        client = _qwen_client()
        if client is not None:
            try:
                # "none" disables Qwen3's thinking phase, which is slow on CPU.
                return _llm(client, messages, context, desc, meta,
                            model=QWEN_MODEL, source="qwen", effort="none", log=log,
                            sampling=_qwen_sampling())
            except Exception as exc:  # noqa: BLE001
                print(f"[agent.engine] Qwen call failed ({exc}); falling back to heuristic.")
        if desc is not None:
            return _heuristic(desc, context, meta, note=_QWEN_OFFLINE_NOTE)
        return RecommendResponse(
            reply=("The local Qwen model could not be reached. Check that Ollama is running "
                   f"and `{QWEN_MODEL}` is pulled."),
            actions=[], source="unavailable",
        )

    client = _client()
    if client is not None:
        try:
            return _llm(client, messages, context, desc, meta, log=log)
        except Exception as exc:  # noqa: BLE001 - fall back rather than 500
            print(f"[agent.engine] {MODEL} call failed ({exc}); falling back.")

    if desc is not None:
        return _heuristic(desc, context, meta)

    # No schema and no LLM: we can only acknowledge.
    return RecommendResponse(
        reply=("The AI assistant isn't fully configured (no `OPENAI_API_KEY` on the API "
               "service), and there's no tool context to recommend parameters for. Open a "
               "specific tool and use **Recommend parameters** to get schema-based suggestions."),
        actions=[], source="unavailable",
    )
