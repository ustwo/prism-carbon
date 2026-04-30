import argparse
import os
from typing import Any

from openai import OpenAI


OPENAI_ENDPOINT = "https://api.openai.com/v1/responses"

# Map local aliases to endpoint-safe model IDs + optional reasoning effort.
MODEL_ALIAS_MAP: dict[str, dict[str, str]] = {
    "o4-mini-high": {"endpoint_model": "o4-mini", "reasoning_effort": "high"},
    "o3-pro": {"endpoint_model": "o3-pro"},
    "o3-mini-high": {"endpoint_model": "o3-mini", "reasoning_effort": "high"},
    "o3-mini": {"endpoint_model": "o3-mini"},
    "o3": {"endpoint_model": "o3"},
    "o1": {"endpoint_model": "o1"},
    "gpt-5-mini-high": {"endpoint_model": "gpt-5-mini", "reasoning_effort": "high"},
    "gpt-5-mini-medium": {"endpoint_model": "gpt-5-mini", "reasoning_effort": "medium"},
    "gpt-5-nano-high": {"endpoint_model": "gpt-5-nano", "reasoning_effort": "high"},
    "gpt-5-nano-medium": {"endpoint_model": "gpt-5-nano", "reasoning_effort": "medium"},
    "gpt-5-nano-minimal": {"endpoint_model": "gpt-5-nano", "reasoning_effort": "minimal"},
    "gpt-5-minimal": {"endpoint_model": "gpt-5", "reasoning_effort": "minimal"},
    "gpt-5-mini": {"endpoint_model": "gpt-5-mini"},
    "gpt-5-high": {"endpoint_model": "gpt-5", "reasoning_effort": "high"},
    "gpt-5-medium": {"endpoint_model": "gpt-5", "reasoning_effort": "medium"},
    "gpt-5-low": {"endpoint_model": "gpt-5", "reasoning_effort": "low"},
    "gpt-5": {"endpoint_model": "gpt-5"},
    "gpt-4-turbo": {"endpoint_model": "gpt-4-turbo"},
    "gpt-4.1-nano": {"endpoint_model": "gpt-4.1-nano"},
    "gpt-4.1-mini": {"endpoint_model": "gpt-4.1-mini"},
    "gpt-4.1": {"endpoint_model": "gpt-4.1"},
    "gpt-4o-2024-11-20": {"endpoint_model": "gpt-4o-2024-11-20"},
    "gpt-4o-2024-08-06": {"endpoint_model": "gpt-4o-2024-08-06"},
    "gpt-4o-2024-05-13": {"endpoint_model": "gpt-4o-2024-05-13"},
    "gpt-4o-mini": {"endpoint_model": "gpt-4o-mini"},
    "gpt-4o": {"endpoint_model": "gpt-4o"},
}

OPENAI_MODEL_KEYS = list(MODEL_ALIAS_MAP.keys())


def resolve_openai_model(requested_model: str) -> dict[str, str] | None:
    normalized = requested_model.strip().lower()
    if not normalized:
        return None

    mapped = MODEL_ALIAS_MAP.get(normalized)
    if not mapped:
        return None

    result = {
        "requested_model": normalized,
        "endpoint_model": mapped["endpoint_model"],
    }
    if "reasoning_effort" in mapped:
        result["reasoning_effort"] = mapped["reasoning_effort"]
    return result


def call_openai_model(
    client: OpenAI,
    requested_model: str,
    user_input: str = "Return exactly the word: pong",
) -> dict[str, Any]:
    resolved = resolve_openai_model(requested_model)
    if not resolved:
        return {
            "requested_model": requested_model,
            "endpoint_model": requested_model,
            "ok": False,
            "error": "Model is not mapped to a valid OpenAI endpoint model.",
        }

    payload: dict[str, Any] = {
        "model": resolved["endpoint_model"],
        "input": user_input,
    }
    if "reasoning_effort" in resolved:
        payload["reasoning"] = {"effort": resolved["reasoning_effort"]}

    try:
        response = client.responses.create(**payload)
        return {
            "requested_model": resolved["requested_model"],
            "endpoint_model": resolved["endpoint_model"],
            "reasoning_effort": resolved.get("reasoning_effort"),
            "ok": True,
            "response_id": getattr(response, "id", None),
        }
    except Exception as error:
        return {
            "requested_model": resolved["requested_model"],
            "endpoint_model": resolved["endpoint_model"],
            "reasoning_effort": resolved.get("reasoning_effort"),
            "ok": False,
            "error": str(error),
        }


def call_all_openai_models(client: OpenAI, user_input: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    total = len(OPENAI_MODEL_KEYS)
    for index, model_name in enumerate(OPENAI_MODEL_KEYS, start=1):
        print(f"Running {index}/{total}: {model_name}")
        result = call_openai_model(client, model_name, user_input)
        results.append(result)
    return results


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Call OpenAI responses endpoint using local model aliases."
    )
    parser.add_argument(
        "--model",
        default="gpt-4o-mini",
        help="Local model alias to call (ignored with --all).",
    )
    parser.add_argument(
        "--input",
        default="Return exactly the word: pong",
        help="Input prompt for the model request.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Call all mapped OpenAI models.",
    )
    parser.add_argument(
        "--list-models",
        action="store_true",
        help="List mapped model aliases and exit.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.list_models:
        print("Mapped model aliases:")
        for model_name in OPENAI_MODEL_KEYS:
            resolved = resolve_openai_model(model_name)
            endpoint_model = resolved["endpoint_model"] if resolved else "unknown"
            effort = resolved.get("reasoning_effort") if resolved else None
            effort_text = f", effort={effort}" if effort else ""
            print(f"- {model_name} -> {endpoint_model}{effort_text}")
        return

    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not set.")

    client = OpenAI()

    if args.all:
        results = call_all_openai_models(client, args.input)
        for result in results:
            if result["ok"]:
                suffix = f" effort={result['reasoning_effort']}" if result.get("reasoning_effort") else ""
                print(
                    f"OK  {result['requested_model']} -> {result['endpoint_model']}{suffix} "
                    f"response_id={result.get('response_id')}"
                )
            else:
                print(
                    f"ERR {result['requested_model']} -> {result['endpoint_model']} "
                    f"error={result.get('error')}"
                )
        return

    result = call_openai_model(client, args.model, args.input)
    if result["ok"]:
        print(
            f"OK  {result['requested_model']} -> {result['endpoint_model']} "
            f"response_id={result.get('response_id')}"
        )
    else:
        print(
            f"ERR {result['requested_model']} -> {result['endpoint_model']} "
            f"error={result.get('error')}"
        )


if __name__ == "__main__":
    main()
