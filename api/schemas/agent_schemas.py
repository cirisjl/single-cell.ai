"""Pydantic contracts for the parameter-recommendation assistant.

The response is intentionally shaped as ``{reply, actions[]}`` so the UI stays
decoupled from the engine behind ``/api/agent/recommend``: whether that engine is
GPT-5.6 Luna today or a Deep-Agents pipeline later, the frontend contract is the
same.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class RecommendContext(BaseModel):
    """What the frontend knows about the current tool form."""
    category: Optional[str] = None       # e.g. "quality_control"  (schema dir name)
    method: Optional[str] = None         # e.g. "quality_control_scanpy" (schema file name)
    datasetId: Optional[str] = None      # e.g. "DS-123" or "U-abc"
    formData: Optional[Dict[str, Any]] = None  # current form values (the `.parameters` object)


class RecommendRequest(BaseModel):
    messages: List[ChatMessage] = []
    context: Optional[RecommendContext] = None


class PrefillAction(BaseModel):
    """A recommendation the UI can apply directly onto the RJSF form's `.parameters`."""
    type: str = "prefill_form"
    category: Optional[str] = None
    method: Optional[str] = None
    # `parameters` mirrors the shape of formData.parameters, e.g.
    # {"species": "human", "qc_params": {"min_genes": 500, "doublet_rate": 0.08}}
    parameters: Dict[str, Any] = Field(default_factory=dict)
    rationale: Optional[str] = None


class RecommendResponse(BaseModel):
    reply: str
    actions: List[PrefillAction] = Field(default_factory=list)
    # "luna" | "heuristic" | "chat" — lets the UI/telemetry know how the answer was produced
    source: Optional[str] = None
