"""Pretty-print the recommendation agent's prompt/response log.

    python api/agent/view_logs.py                 # last 5 requests, newest log file
    python api/agent/view_logs.py -n 1            # just the latest request
    python api/agent/view_logs.py --id 3f2a9c1b   # one request by id
    python api/agent/view_logs.py --file logs/agent/recommend-2026-10-19.jsonl

Default log directory is ./logs/agent (where docker-compose-dev.yml mounts it);
override with --dir or AGENT_LOG_DIR. Uses only the standard library.
"""
import argparse
import glob
import json
import os
import sys

RULE = "=" * 80


def _print_record(rec):
    ctx = rec.get("context") or {}
    print(RULE)
    print(f"id: {rec.get('id')}   time: {rec.get('timestamp')}   "
          f"duration: {rec.get('duration_s')}s")
    result = rec.get("result") or {}
    answered = result.get("source")
    if result.get("model"):
        answered = f"{answered} ({result['model']})"
    print(f"selected model: {rec.get('selected_model')}   answered by: {answered}")
    print(f"tool: {ctx.get('category')}/{ctx.get('method')}   dataset: {ctx.get('datasetId')}")
    if rec.get("error"):
        print(f"ERROR: {rec['error']}")

    calls = rec.get("llm_calls") or []
    if not calls:
        print("\n(no LLM call: answered by the offline heuristic)")
    for i, call in enumerate(calls, 1):
        print(f"\n--- LLM call {i}: {call.get('model')} "
              f"(reasoning_effort={call.get('reasoning_effort')}, {call.get('latency_s')}s) ---")
        for m in call.get("messages", []):
            print(f"\n[{m.get('role', '?').upper()}]")
            print(m.get("content", ""))
        if call.get("error"):
            print(f"\n[ERROR] {call['error']}")
        else:
            print("\n[RAW RESPONSE]")
            print(call.get("raw_response"))
            if call.get("usage"):
                print(f"\nusage: {call['usage']}")

    result = rec.get("result")
    if result:
        print("\n--- Returned to UI (after schema validation) ---")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    print()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-n", type=int, default=5, help="number of most recent requests to show")
    ap.add_argument("--id", help="show only the request with this id")
    ap.add_argument("--file", help="a specific .jsonl log file")
    ap.add_argument("--dir", default=os.getenv("AGENT_LOG_DIR", os.path.join("logs", "agent")))
    args = ap.parse_args()

    path = args.file
    if not path:
        files = sorted(glob.glob(os.path.join(args.dir, "recommend-*.jsonl")))
        if not files:
            sys.exit(f"No log files found in {args.dir}")
        path = files[-1]

    with open(path, encoding="utf-8") as fh:
        records = [json.loads(line) for line in fh if line.strip()]
    if args.id:
        records = [r for r in records if r.get("id") == args.id]
    else:
        records = records[-args.n:]

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(f"{path}: showing {len(records)} request(s)")
    for rec in records:
        _print_record(rec)


if __name__ == "__main__":
    main()
