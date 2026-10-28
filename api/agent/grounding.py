"""Dataset grounding: fetch the characteristics that should drive parameter choices.

Uses a lightweight, self-contained pymongo client (same MONGO_URL as
``utils/mongodb.py``) so the agent module stays decoupled and importable in
isolation for tests. Reads only metadata fields stored in Mongo — never loads
AnnData.
"""
from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from typing import Any, Callable, Dict, List, Optional

_MONGO_URL = os.getenv("MONGO_URL", "mongodb://oscbdb:65530")

# Metadata fields that help choose parameters. `info` is AnnData's text summary
# (shape, obs/obsm/uns keys); `cell_metadata` holds the unique values of the
# categorical obs columns, LZString-compressed by the React app.
_DATASET_PROJECTION = {
    "_id": 0,
    "Id": 1,
    "Title": 1,
    "Species": 1,
    "Organ Part": 1,
    "Cell Count Estimate": 1,
    "obs_names": 1,
    "layers": 1,
    "nGenes": 1,
    "nCells": 1,
    "process_ids": 1,
    "Disease Status (Donor)": 1,
    "Disease Status(Donor)": 1,  # older spelling, kept in case some records use it
    "Development Stage": 1,
    "info": 1,
    "embeddings": 1,
    "cell_metadata": 1,
}

# Caps so one dataset with many labels can't flood the prompt.
_MAX_CATEGORY_VALUES = 25
_MAX_CATEGORY_COLUMNS = 10


@lru_cache(maxsize=1)
def _client():
    from pymongo import MongoClient  # lazy so the module imports without pymongo present
    return MongoClient(_MONGO_URL, serverSelectionTimeoutMS=3000)


def _db():
    return _client()["oscb"]


def get_dataset_metadata(dataset_id: Optional[str]) -> Dict[str, Any]:
    """Return a small metadata dict for a dataset, or {} if unavailable.

    Public datasets live in ``datasets``; user datasets (Id starts with "U")
    live in ``user_datasets``. Any DB error degrades to {} so recommendations
    still work (just less grounded).
    """
    if not dataset_id:
        return {}
    try:
        db = _db()
        collection = db.user_datasets if dataset_id.split("-")[0] == "U" else db.datasets
        doc = collection.find_one({"Id": dataset_id}, _DATASET_PROJECTION) or {}

        # Enrich with nCells/layers from the latest pre-process result if missing.
        if ("nCells" not in doc or "layers" not in doc) and doc.get("process_ids"):
            pp = db.pp_results.find_one(
                {"process_id": {"$in": doc["process_ids"]}},
                {"_id": 0, "nCells": 1, "layers": 1, "default_assay": 1},
            )
            if pp:
                doc.setdefault("nCells", pp.get("nCells"))
                doc.setdefault("layers", pp.get("layers"))
                doc.setdefault("default_assay", pp.get("default_assay"))
        doc.pop("process_ids", None)  # not useful to the model
        return _derive(doc)
    except Exception as exc:  # noqa: BLE001 - grounding is best-effort
        print(f"[agent.grounding] metadata lookup failed for {dataset_id}: {exc}")
        return {}


def _derive(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Turn raw stored fields into model-friendly ones."""
    if "Disease Status(Donor)" in doc:
        doc.setdefault("Disease Status (Donor)", doc.pop("Disease Status(Donor)"))

    info = doc.pop("info", None)
    if isinstance(info, str):
        doc.update({f"file_{k}": v for k, v in parse_info(info).items()})

    raw_categories = doc.pop("cell_metadata", None)
    if raw_categories:
        categories = decode_cell_metadata(raw_categories)
        if categories:
            doc["categories"] = categories

    return {k: v for k, v in doc.items() if v not in (None, "", [], {})}


# --------------------------------------------------------------------------- #
# Stored-field decoding
# --------------------------------------------------------------------------- #
_SHAPE_RE = re.compile(r"n_obs\s*[×x]\s*n_vars\s*=\s*(\d+)\s*[×x]\s*(\d+)")


def parse_info(info: str) -> Dict[str, Any]:
    """Parse AnnData's repr, e.g. ``AnnData object with n_obs × n_vars = 2638 × 1838``
    followed by ``obs: 'n_genes', ...`` lines, into ``{n_obs, n_vars, obs, obsm, ...}``."""
    out: Dict[str, Any] = {}
    match = _SHAPE_RE.search(info)
    if match:
        out["n_obs"], out["n_vars"] = int(match.group(1)), int(match.group(2))
    for line in info.splitlines()[1:]:
        key, sep, rest = line.strip().partition(":")
        if sep and key.strip().isidentifier():
            names = re.findall(r"'([^']*)'", rest)
            if names:
                out[key.strip()] = names
    return out


def decode_cell_metadata(raw: Any) -> Dict[str, List[Any]]:
    """Return ``{column: [unique values]}`` for the categorical obs columns.

    The upload step stores ``{column: {column: [values]}}`` (see ``df_to_dict``),
    which the React app saves as LZString ``compressToBase64`` JSON.
    """
    try:
        data = json.loads(_lz_decompress_base64(raw)) if isinstance(raw, str) else raw
    except Exception:  # noqa: BLE001 - malformed or unknown encoding
        return {}
    if not isinstance(data, dict):
        return {}
    out: Dict[str, List[Any]] = {}
    for column, value in data.items():
        if isinstance(value, dict):
            value = value.get(column, next(iter(value.values()), None))
        if isinstance(value, list):
            out[column] = value
    return out


_B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="


def _lz_decompress_base64(data: str) -> str:
    """Python port of lz-string's ``decompressFromBase64`` (MIT, pieroxy/lz-string)."""
    if not data:
        return ""
    lookup = {ch: i for i, ch in enumerate(_B64_ALPHABET)}
    length = len(data)
    return _lz_decompress(length, 32, lambda i: lookup.get(data[i], 0) if i < length else 0)


def _lz_decompress(length: int, reset_value: int, get_next: Callable[[int], int]) -> str:
    dictionary: Dict[int, str] = {}
    enlarge_in, dict_size, num_bits = 4, 4, 3
    state = {"val": get_next(0), "position": reset_value, "index": 1}

    def read_bits(n: int) -> int:
        bits, power = 0, 1
        while power != 1 << n:
            bit = state["val"] & state["position"]
            state["position"] >>= 1
            if state["position"] == 0:
                state["position"] = reset_value
                state["val"] = get_next(state["index"])
                state["index"] += 1
            if bit:
                bits |= power
            power <<= 1
        return bits

    first = read_bits(2)
    if first == 2:
        return ""
    w = chr(read_bits(8 if first == 0 else 16))
    dictionary[3] = w
    result = [w]
    while True:
        if state["index"] > length:
            return ""
        code = read_bits(num_bits)
        if code in (0, 1):
            dictionary[dict_size] = chr(read_bits(8 if code == 0 else 16))
            code = dict_size
            dict_size += 1
            enlarge_in -= 1
        elif code == 2:
            # JS strings are UTF-16; rejoin any surrogate pairs.
            return "".join(result).encode("utf-16", "surrogatepass").decode("utf-16")
        if enlarge_in == 0:
            enlarge_in = 1 << num_bits
            num_bits += 1
        if code in dictionary:
            entry = dictionary[code]
        elif code == dict_size:
            entry = w + w[0]
        else:
            raise ValueError("invalid LZString data")
        result.append(entry)
        dictionary[dict_size] = w + entry[0]
        dict_size += 1
        enlarge_in -= 1
        w = entry
        if enlarge_in == 0:
            enlarge_in = 1 << num_bits
            num_bits += 1


# --------------------------------------------------------------------------- #
# Prompt helpers
# --------------------------------------------------------------------------- #
def _plain(value: Any) -> Any:
    """Form selects store some fields as {"value": "h", "label": "Human"}; use the label."""
    if isinstance(value, dict):
        return value.get("label") or value.get("value")
    if isinstance(value, list):
        labels = [str(_plain(v)) for v in value if _plain(v) not in (None, "")]
        return ", ".join(labels) if labels else None
    return value


def species_name(meta: Dict[str, Any]) -> Optional[str]:
    """Species as the tools expect it ("human", "mouse"), or None."""
    value = _plain(meta.get("Species")) if meta else None
    return str(value).strip().lower() if value else None


def organ_part(meta: Dict[str, Any]) -> Optional[str]:
    value = _plain(meta.get("Organ Part")) if meta else None
    return str(value).strip() if value else None


def _list(values: List[Any], limit: int) -> str:
    shown = ", ".join(str(v) for v in values[:limit])
    return shown + (f", … ({len(values)} in total)" if len(values) > limit else "")


def summarize_metadata(meta: Dict[str, Any]) -> str:
    if not meta:
        return "No dataset metadata available (recommend from schema defaults + user's description)."
    parts = []
    if meta.get("Title"):
        parts.append(f"Title: {meta['Title']}")
    if species_name(meta):
        parts.append(f"Species: {species_name(meta)}")
    for label, key in [("Organ/Tissue", "Organ Part"),
                       ("Disease status (donor)", "Disease Status (Donor)"),
                       ("Development stage", "Development Stage")]:
        if _plain(meta.get(key)):
            parts.append(f"{label}: {_plain(meta[key])}")

    n_cells = cell_count(meta)
    if meta.get("file_n_obs") is not None:
        note = (f"; entered estimate {_plain(meta['Cell Count Estimate'])}"
                if meta.get("Cell Count Estimate") not in (None, "") else "")
        parts.append(f"Cells: {n_cells} (from the data file{note})")
    elif n_cells is not None:
        parts.append(f"Cells (estimate): {n_cells}")
    genes = meta.get("file_n_vars", meta.get("nGenes"))
    if genes is not None:
        parts.append(f"Genes: {genes}")

    for label, key in [("Layers", "layers"), ("Default assay", "default_assay"),
                       ("obs columns", "obs_names")]:
        if meta.get(key):
            parts.append(f"{label}: {_plain(meta[key])}")

    # What the file already contains, e.g. existing PCA/UMAP/clusters, which tells
    # the model whether the data has been processed before.
    done = []
    embeddings = meta.get("file_obsm") or meta.get("embeddings")
    if embeddings:
        done.append(f"embeddings {', '.join(embeddings)}")
    if meta.get("file_uns"):
        done.append(f"analysis results (uns) {', '.join(meta['file_uns'])}")
    if meta.get("file_layers") and not meta.get("layers"):
        done.append(f"layers {', '.join(meta['file_layers'])}")
    if done:
        parts.append("Already in the data file: " + "; ".join(done))

    categories = meta.get("categories") or {}
    if categories:
        parts.append("Categorical obs columns and their values:")
        for column, values in list(categories.items())[:_MAX_CATEGORY_COLUMNS]:
            parts.append(f"- {column} ({len(values)} values): {_list(values, _MAX_CATEGORY_VALUES)}")
    return "\n".join(parts) if parts else "No usable dataset metadata."


def cell_count(meta: Dict[str, Any]) -> Optional[int]:
    """Best-effort integer cell count: the data file's own count first, then
    a pre-processing result, then the hand-entered estimate."""
    for key in ("file_n_obs", "nCells", "Cell Count Estimate"):
        val = _plain(meta.get(key))
        if val is None:
            continue
        try:
            return int(str(val).replace(",", "").strip())
        except (TypeError, ValueError):
            continue
    return None
