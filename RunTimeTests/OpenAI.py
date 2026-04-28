import argparse

from openai import OpenAI


DEFAULT_MODEL = "gpt-4o-mini"
MODEL_PRESETS = [
    "gpt-4o-mini",
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-4o",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a chat completion with OpenAI.")
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        metavar="MODEL",
        help="Model to use for the request. Suggested presets: " + ", ".join(MODEL_PRESETS),
    )
    parser.add_argument(
        "--list-models",
        action="store_true",
        help="Print the available model presets and exit.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.list_models:
        print("Available model presets:")
        for model_name in MODEL_PRESETS:
            print(f"- {model_name}")
        return

    # The client gets the API key from the environment variable `OPENAI_API_KEY`.
    client = OpenAI()

    response = client.chat.completions.create(
        model=args.model,
        messages=[
            {
                "role": "user",
                "content": "Explain how AI works in a few words",
            }
        ],
    )
    print(response.choices[0].message.content)


if __name__ == "__main__":
    main()
