import argparse
import sys

from google import genai


DEFAULT_MODEL = "gemini-3-flash-preview"
MODEL_PRESETS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash", 
    "gemini-2.5-pro",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a Gemini prompt from the command line.")
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        metavar="MODEL",
        help="Model to use for the request. Suggested presets: " + ", ".join(MODEL_PRESETS),
    )
    parser.add_argument(
        "--prompt",
        metavar="TEXT",
        help="Prompt text to send to Gemini. If omitted, the script will read from stdin or ask interactively.",
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

    prompt = args.prompt
    if not prompt:
        if not sys.stdin.isatty():
            prompt = sys.stdin.read().strip()
        else:
            prompt = input("Enter your Gemini prompt: ").strip()

    if not prompt:
        raise SystemExit("No prompt provided.")

    # The client gets the API key from the environment variable `GEMINI_API_KEY`.
    client = genai.Client()

    response = client.models.generate_content(model=args.model, contents=prompt)
    print(response.text)


if __name__ == "__main__":
    main()