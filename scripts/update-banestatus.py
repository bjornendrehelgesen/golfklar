#!/usr/bin/env python3
import json
import re
import sys
import urllib.request
from datetime import datetime
from html import unescape


SOURCE_URL = "https://mingolf.no/banestatus-er-golfbanen-apen/"
OUTPUT_PATH = "data/banestatus.json"


def fetch_html(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"Request failed: {response.status}")
        return response.read().decode("utf-8")


def strip_tags(value):
    return re.sub(r"<.*?>", "", value, flags=re.S).strip()


def parse_rows(html):
    rows = re.findall(r"<tr>(.*?)</tr>", html, flags=re.S)
    items = []
    for row in rows:
        cols = re.findall(r"<td>(.*?)</td>", row, flags=re.S)
        if len(cols) < 3:
            continue
        name_html, status_html, updated_html = cols[0], cols[1], cols[2]
        name = unescape(strip_tags(name_html))
        status = unescape(strip_tags(status_html))
        updated = unescape(strip_tags(updated_html))
        if not name or not status:
            continue
        items.append(
            {
                "name": name,
                "status": status,
                "updated": updated,
            }
        )
    return items


def main():
    try:
        html = fetch_html(SOURCE_URL)
    except Exception as exc:
        print(f"Failed to fetch banestatus: {exc}", file=sys.stderr)
        sys.exit(1)

    items = parse_rows(html)
    if not items:
        print("No banestatus rows found.", file=sys.stderr)
        sys.exit(1)

    payload = {
        "source": SOURCE_URL,
        "fetched": datetime.now().isoformat(timespec="seconds"),
        "items": items,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)

    print(f"Wrote {OUTPUT_PATH} with {len(items)} rows.")


if __name__ == "__main__":
    main()
