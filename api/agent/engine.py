"""Recommendation engine.

Primary path: GPT-5.6 Luna (``gpt-5.6-luna``) via the OpenAI SDK, asked to return
a JSON object matching :class:`RecommendResponse`. Recommended parameters are then
re-validated against the tool's own JSON schema before they leave the server.

Fallback path: if no ``OPENAI_API_KEY`` is configured (or the call fails), a
schema-default + metadata heuristic produces a usable recommendation so the whole
feature is testable offline.

The engine is deliberately behind a single ``recommend`` function so it can later
be swapped for a Deep-Agents pipeline without touching the router or the UI.
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from schemas.agent_schemas import (
    ChatMessage, PrefillAction, RecommendContext, RecommendResponse,
)
from agent import catalog, grounding

MODEL = os.getenv("AGENT_MODEL", "gpt-5.6-luna")

_SYSTEM = (
    "You are an expert bioinformatician embedded in the OSCB single-cell analysis "
    "platform. You help users configure a data-processing tool by recommending "
    "concrete parameter VALUES for the tool they are currently setting up. You do "
    "not run anything — you only recommend settings the user can review and apply.\n"
    "Base your choices on the dataset characteristics and the parameter schema "
    "provided. Prefer the schema defaults unless the dataset suggests otherwise, and "
    "explain briefly WHY in the `rationale`."
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
      "rationale": "<one sentence on why these values>"
    }}
  ]
}}
`parameters` MUST mirror the form structure: tunable settings for this tool go
under the "{group_key}" key (an object), and any top-level settings go directly in
`parameters`. Only include keys that appear in the schema below. Use the exact
allowed values for enum fields.

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


# --------------------------------------------------------------------------- #
# Heuristic fallback
# --------------------------------------------------------------------------- #
def _heuristic(desc: Dict[str, Any], context: RecommendContext,
               meta: Dict[str, Any]) -> RecommendResponse:
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
    if meta.get("Species") and "species" in params:
        params["species"] = str(meta["Species"]).lower()
        notes.append(f"species set from dataset ({params['species']})")
    if meta.get("Organ Part") and "organ_part" in params:
        params["organ_part"] = meta["Organ Part"]

    if group_key and group:
        params[group_key] = group

    params = catalog.validate_and_filter(context.category, context.method, params)
    reply = (
        f"Here are recommended parameters for **{context.method}**. "
        + ("Adjustments: " + "; ".join(notes) + "." if notes
           else "These follow the tool defaults (no dataset metadata was available to refine them).")
        + "\n\n*(Generated offline from schema defaults — set `OPENAI_API_KEY` on the API "
        "service to enable GPT-5.6 Luna recommendations.)*"
    )
    action = PrefillAction(
        category=context.category, method=context.method,
        parameters=params, rationale="; ".join(notes) or "Schema defaults for this tool.",
    )
    return RecommendResponse(reply=reply, actions=[action], source="heuristic")


# --------------------------------------------------------------------------- #
# LLM path
# --------------------------------------------------------------------------- #
def _luna(client, messages: List[ChatMessage], context: RecommendContext,
          desc: Optional[Dict[str, Any]], meta: Dict[str, Any]) -> RecommendResponse:
    sys_parts = [_SYSTEM, "\n## Dataset\n" + grounding.summarize_metadata(meta)]

    want_actions = desc is not None
    if want_actions:
        sys_parts.append("\n## Task\n" + _RESPONSE_INSTRUCTIONS.format(
            category=context.category, method=context.method,
            group_key=desc.get("group_key") or "parameters",
            schema_text="## Parameter schema\n" + catalog.prompt_text(desc),
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
        model=MODEL,
        messages=convo,
        response_format={"type": "json_object"},
    )
    # Parameter-picking doesn't need deep reasoning; minimal effort keeps latency
    # low and consistent for the UI. Fall back gracefully if the model/SDK rejects
    # the arg.
    effort = os.getenv("AGENT_REASONING_EFFORT", "minimal")
    try:
        completion = client.chat.completions.create(reasoning_effort=effort, **create_kwargs)
    except TypeError:
        completion = client.chat.completions.create(**create_kwargs)
    except Exception as exc:  # noqa: BLE001
        if "reasoning_effort" in str(exc):
            completion = client.chat.completions.create(**create_kwargs)
        else:
            raise
    raw = completion.choices[0].message.content or "{}"
    data = json.loads(raw)

    actions: List[PrefillAction] = []
    for a in data.get("actions", []) or []:
        cleaned = catalog.validate_and_filter(
            context.category, context.method, a.get("parameters", {}) or {})
        actions.append(PrefillAction(
            category=context.category or a.get("category"),
            method=context.method or a.get("method"),
            parameters=cleaned,
            rationale=a.get("rationale"),
        ))
    return RecommendResponse(
        reply=data.get("reply", "").strip() or "Here is my recommendation.",
        actions=actions,
        source="luna" if want_actions else "chat",
    )


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
def recommend(messages: List[ChatMessage], context: RecommendContext) -> RecommendResponse:
    context = context or RecommendContext()
    meta = grounding.get_dataset_metadata(context.datasetId)
    desc = catalog.describe_tool(context.category, context.method) if context.category and context.method else None

    client = _client()
    if client is not None:
        try:
            return _luna(client, messages, context, desc, meta)
        except Exception as exc:  # noqa: BLE001 - fall back rather than 500
            print(f"[agent.engine] Luna call failed ({exc}); falling back.")

    if desc is not None:
        return _heuristic(desc, context, meta)

    # No schema and no LLM: we can only acknowledge.
    return RecommendResponse(
        reply=("The AI assistant isn't fully configured (no `OPENAI_API_KEY` on the API "
               "service), and there's no tool context to recommend parameters for. Open a "
               "specific tool and use **Recommend parameters** to get schema-based suggestions."),
        actions=[], source="unavailable",
    )
