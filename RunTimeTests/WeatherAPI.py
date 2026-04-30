import argparse
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Get current weather data from public APIs.")
    parser.add_argument(
        "city",
        nargs="?",
        default="London",
        help="City name to look up. Defaults to London.",
    )
    parser.add_argument(
        "--units",
        choices=["celsius", "fahrenheit"],
        default="celsius",
        help="Temperature unit to request.",
    )
    return parser.parse_args()


def fetch_json(url: str, params: dict[str, str]) -> dict:
    query = urlencode(params)
    request_url = f"{url}?{query}"
    request = Request(
        request_url,
        headers={"User-Agent": "weather-runtime-test/1.0"},
    )

    try:
        with urlopen(request, timeout=15) as response:
            return json.load(response)
    except HTTPError as error:
        raise RuntimeError(f"HTTP error while calling {url}: {error.code}") from error
    except URLError as error:
        raise RuntimeError(f"Network error while calling {url}: {error.reason}") from error


def get_city_coordinates(city: str) -> tuple[float, float, str, str]:
    data = fetch_json(
        GEOCODING_API_URL,
        {
            "name": city,
            "count": "1",
            "language": "en",
            "format": "json",
        },
    )

    results = data.get("results") or []
    if not results:
        raise RuntimeError(f"No location found for city: {city}")

    location = results[0]
    return (
        location["latitude"],
        location["longitude"],
        location["name"],
        location.get("country", "Unknown"),
    )


def get_current_weather(latitude: float, longitude: float, units: str) -> dict:
    data = fetch_json(
        WEATHER_API_URL,
        {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m",
            "temperature_unit": units,
            "wind_speed_unit": "kmh",
        },
    )

    current = data.get("current")
    if not current:
        raise RuntimeError("Weather API response did not include current weather.")
    return current


def main() -> None:
    args = parse_args()

    latitude, longitude, location_name, country = get_city_coordinates(args.city)
    weather = get_current_weather(latitude, longitude, args.units)

    temperature = weather.get("temperature_2m")
    feels_like = weather.get("apparent_temperature")
    humidity = weather.get("relative_humidity_2m")
    wind_speed = weather.get("wind_speed_10m")

    unit_symbol = "C" if args.units == "celsius" else "F"

    print(f"Location: {location_name}, {country}")
    print(f"Coordinates: {latitude}, {longitude}")
    print(f"Temperature: {temperature} {unit_symbol}")
    print(f"Feels like: {feels_like} {unit_symbol}")
    print(f"Humidity: {humidity}%")
    print(f"Wind speed: {wind_speed} km/h")


if __name__ == "__main__":
    main()
