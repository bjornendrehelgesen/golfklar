#!/usr/bin/env python3
import json
import sys
import urllib.request
from datetime import datetime


SOURCE_URL = "https://www.golfforbundet.no/assets/golfklubber.json"
OUTPUT_PATH = "data/golfklubber.json"


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"Request failed: {response.status}")
        payload = response.read().decode("utf-8")
        return json.loads(payload)


def main():
    try:
        data = fetch_json(SOURCE_URL)
    except Exception as exc:
        print(f"Failed to fetch NGF list: {exc}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, dict) or "data" not in data:
        print("Unexpected NGF payload shape.", file=sys.stderr)
        sys.exit(1)

    data["source"] = SOURCE_URL
    data["fetched"] = datetime.now().isoformat(timespec="seconds")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)

    print(f"Wrote {OUTPUT_PATH} with {len(data.get('data', []))} entries.")


if __name__ == "__main__":
    main()
