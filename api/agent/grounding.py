"""Dataset grounding: fetch the characteristics that should drive parameter choices.

Uses a lightweight, self-contained pymongo client (same MONGO_URL as
``utils/mongodb.py``) so the agent module stays decoupled and importable in
isolation for tests. Reads only small metadata fields — never loads AnnData.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Any, Dict, Optional

_MONGO_URL = os.getenv("MONGO_URL", "mongodb://oscbdb:65530")

# Small metadata fields that help choose parameters. Deliberately excludes heavy
# blobs (cell_metadata, embeddings arrays, etc.).
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
    "Disease Status(Donor)": 1,
    "Development Stage": 1,
}


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
        return {k: v for k, v in doc.items() if v not in (None, [], {})}
    except Exception as exc:  # noqa: BLE001 - grounding is best-effort
        print(f"[agent.grounding] metadata lookup failed for {dataset_id}: {exc}")
        return {}


def summarize_metadata(meta: Dict[str, Any]) -> str:
    if not meta:
        return "No dataset metadata available (recommend from schema defaults + user's description)."
    parts = []
    for label, key in [
        ("Title", "Title"), ("Species", "Species"), ("Organ/Tissue", "Organ Part"),
        ("Cells (estimate)", "Cell Count Estimate"), ("nCells", "nCells"),
        ("nGenes", "nGenes"), ("Layers", "layers"), ("Default assay", "default_assay"),
        ("obs columns", "obs_names"),
    ]:
        if key in meta:
            parts.append(f"{label}: {meta[key]}")
    return "\n".join(parts) if parts else "No usable dataset metadata."


def cell_count(meta: Dict[str, Any]) -> Optional[int]:
    """Best-effort integer cell count from whichever field is present."""
    for key in ("nCells", "Cell Count Estimate"):
        val = meta.get(key)
        if val is None:
            continue
        try:
            return int(str(val).replace(",", "").strip())
        except (TypeError, ValueError):
            continue
    return None
