import argparse

from google import genai


DEFAULT_MODEL = "gemini-3-flash-preview"
MODEL_PRESETS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a generation request with Gemini.")
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

    # The client gets the API key from the environment variable `GEMINI_API_KEY`.
    client = genai.Client()

    response = client.models.generate_content(
        model=args.model, contents="Explain how AI works in a few words"
    )
    print(response.text)


if __name__ == "__main__":
    main()