#!/usr/bin/env bash
set -euo pipefail

python3 scripts/update-golfklubber.py
python3 scripts/update-banestatus.py
