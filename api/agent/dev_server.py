"""Minimal standalone server to test the recommendation agent in isolation.

The full `main.py` pulls in scanpy/celery/R and is heavy to run locally. This
app mounts ONLY the agent router, so you can smoke-test parameter recommendations
with a light dependency set:

    pip install fastapi uvicorn pydantic openai pymongo
    cd api
    uvicorn agent.dev_server:app --host 0.0.0.0 --port 5005 --reload

Then POST to http://localhost:5005/api/agent/recommend (see the walkthrough).
Without OPENAI_API_KEY it uses the offline heuristic; without MongoDB it simply
recommends from schema defaults.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import agent

app = FastAPI(title="OSCB Agent (dev)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
app.include_router(agent.router)


@app.get("/status")
def status() -> dict:
    return {"status": "ok"}
