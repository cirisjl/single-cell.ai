"""Parameter-recommendation assistant endpoint.

POST /api/agent/recommend
  Given the current tool context (+ dataset) and the conversation, returns a
  natural-language reply plus zero or more `prefill_form` actions the UI can
  apply onto the RJSF form. It never submits jobs.
"""
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

from schemas.agent_schemas import RecommendRequest, RecommendResponse, RecommendContext
from agent import engine, catalog

router = APIRouter(prefix="/api/agent", tags=["agent"],
                   responses={404: {"Description": "API Not found"}})


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/catalog/{category}")
async def catalog_for_category(category: str) -> dict:
    """List the methods available for a category (handy for debugging/UX)."""
    return {"category": category, "methods": catalog.list_methods(category)}


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest) -> RecommendResponse:
    context = req.context or RecommendContext()
    # engine.recommend() does blocking I/O (OpenAI SDK, pymongo). Run it in a
    # worker thread so a slow model call never blocks the FastAPI event loop.
    return await run_in_threadpool(engine.recommend, req.messages, context, req.model)
