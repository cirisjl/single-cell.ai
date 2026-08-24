"""Tool catalog built from the RJSF JSON-schema files.

The single source of truth for "what tools exist and what parameters they take"
already lives in the React app at
``oscb-ui/oscb-react/src/schema/react-json-schema/Tools/<category>/<method>.json``.
Rather than duplicate that, we read those files directly and expose:

* :func:`describe_tool` – a compact, prompt-friendly description of a tool's
  tunable parameters (name, type, default, allowed values, help text).
* :func:`validate_and_filter` – keep only keys that exist in the schema and
  coerce/enum-check their values, so a recommendation can never inject an
  invalid field into the form.

Set ``TOOL_SCHEMA_DIR`` to override the schema location (needed when the API runs
in a container that doesn't ship the React source tree).
"""
from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any, Dict, List, Optional

# category (schema dir name) -> the *_params group key used inside formData.parameters
PARAMS_KEY_BY_CATEGORY = {
    "quality_control": "qc_params",
    "normalization": "normalization_params",
    "imputation": "imputation_params",
    "integration": "integration_params",
    "annotation": "annotation_params",
    "visualization": "reduction_params",
    # "formatting" has no *_params group
}


def _schema_dir() -> str:
    override = os.getenv("TOOL_SCHEMA_DIR")
    if override:
        return override
    here = os.path.dirname(os.path.abspath(__file__))          # api/agent
    repo_root = os.path.abspath(os.path.join(here, "..", ".."))  # single-cell.ai
    return os.path.join(
        repo_root, "oscb-ui", "oscb-react", "src", "schema",
        "react-json-schema", "Tools",
    )


@lru_cache(maxsize=None)
def load_raw_schema(category: str, method: str) -> Optional[dict]:
    """Return the raw JSON schema dict for a tool, or None if not found."""
    if not category or not method:
        return None
    path = os.path.join(_schema_dir(), category, f"{method}.json")
    if not os.path.isfile(path):
        return None
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def list_methods(category: str) -> List[str]:
    """All method file-stems available for a category."""
    d = os.path.join(_schema_dir(), category)
    if not os.path.isdir(d):
        return []
    return sorted(f[:-5] for f in os.listdir(d) if f.endswith(".json"))


def _params_root(schema: dict) -> Dict[str, Any]:
    """The `properties.parameters.properties` object, or {}."""
    return (
        schema.get("properties", {})
        .get("parameters", {})
        .get("properties", {})
    )


def _leaf(name: str, spec: dict) -> Dict[str, Any]:
    return {
        "name": name,
        "type": spec.get("type"),
        "title": spec.get("title", name),
        "description": spec.get("description"),
        "default": spec.get("default"),
        "enum": (spec.get("items", {}) or {}).get("enum") or spec.get("enum"),
    }


def describe_tool(category: str, method: str) -> Optional[Dict[str, Any]]:
    """Compact description of a tool's tunable parameters for prompting."""
    schema = load_raw_schema(category, method)
    if schema is None:
        return None

    root = _params_root(schema)
    group_key = PARAMS_KEY_BY_CATEGORY.get(category)

    top_params: List[Dict[str, Any]] = []
    group_params: List[Dict[str, Any]] = []
    methods: List[str] = []

    for name, spec in root.items():
        if not isinstance(spec, dict):
            continue
        if name == group_key and spec.get("type") == "object":
            for pname, pspec in (spec.get("properties", {}) or {}).items():
                if pname == "methods":
                    methods = _leaf(pname, pspec).get("enum") or []
                    continue
                group_params.append(_leaf(pname, pspec))
        elif spec.get("type") != "object":
            top_params.append(_leaf(name, spec))

    return {
        "category": category,
        "method": method,
        "group_key": group_key,
        "methods": methods,
        "top_params": top_params,
        "group_params": group_params,
    }


def prompt_text(desc: Dict[str, Any]) -> str:
    """Render a tool description as human/LLM-readable text."""
    lines = [f"Tool: {desc['method']} (category: {desc['category']})"]
    if desc.get("methods"):
        lines.append(f"Underlying method(s): {', '.join(desc['methods'])}")

    def fmt(p: Dict[str, Any]) -> str:
        bits = [f"- {p['name']} ({p.get('type')})"]
        if p.get("default") is not None:
            bits.append(f"default={p['default']!r}")
        if p.get("enum"):
            bits.append(f"allowed={p['enum']}")
        if p.get("description"):
            bits.append(f"— {p['description']}")
        return " ".join(bits)

    if desc.get("group_params"):
        lines.append(f"\nParameters (belong under `{desc['group_key']}`):")
        lines += [fmt(p) for p in desc["group_params"]]
    if desc.get("top_params"):
        lines.append("\nTop-level parameters (belong directly under `parameters`):")
        lines += [fmt(p) for p in desc["top_params"]]
    return "\n".join(lines)


def _coerce(value: Any, spec: Dict[str, Any]) -> Any:
    """Best-effort coercion to the leaf's declared type; returns value unchanged on failure."""
    t = spec.get("type")
    try:
        if t == "integer":
            return int(value)
        if t == "number":
            return float(value)
        if t == "boolean":
            if isinstance(value, str):
                return value.strip().lower() in ("true", "1", "yes")
            return bool(value)
    except (TypeError, ValueError):
        return value
    return value


def validate_and_filter(category: str, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Drop unknown keys and enum-violating values; coerce types.

    Accepts params shaped like formData.parameters (top-level keys + one *_params
    group) and returns a cleaned copy. Never raises on bad input.
    """
    schema = load_raw_schema(category, method)
    if schema is None or not isinstance(params, dict):
        return {}

    root = _params_root(schema)
    group_key = PARAMS_KEY_BY_CATEGORY.get(category)
    out: Dict[str, Any] = {}

    def clean_leaf(spec: Dict[str, Any], value: Any) -> Any:
        enum = spec.get("enum")
        item_enum = (spec.get("items", {}) or {}).get("enum")
        if spec.get("type") == "array" and item_enum and isinstance(value, list):
            return [v for v in value if v in item_enum]
        if enum is not None and value not in enum:
            return None  # reject out-of-enum scalar
        return _coerce(value, spec)

    for key, value in params.items():
        if key == group_key and isinstance(value, dict) and isinstance(root.get(key), dict):
            group_props = root[key].get("properties", {})
            cleaned_group: Dict[str, Any] = {}
            for pk, pv in value.items():
                if pk in group_props:
                    cv = clean_leaf(group_props[pk], pv)
                    if cv is not None:
                        cleaned_group[pk] = cv
            if cleaned_group:
                out[key] = cleaned_group
        elif key in root and root[key].get("type") != "object":
            cv = clean_leaf(root[key], value)
            if cv is not None:
                out[key] = cv
    return out
