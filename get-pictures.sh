#!/bin/sh
cd "$(dirname "$0")" && python3 tools/fetch_images.py "$@"
