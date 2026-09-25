#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
#
# Build the NIST SP 800-90B estimator tool to WebAssembly in the pinned emsdk
# container (OrbStack / Docker BuildKit) and export the artefacts.
#
#   scripts/entropy-90b/build-wasm.sh [OUT_DIR]      (default: build/entropy90b-wasm)
#
# Then stage into the hub with:
#   scripts/entropy-90b/stage-wasm.sh OUT_DIR
#
# Proof of a fresh build is the artefact, not this script's exit code: the
# BUILDINFO.json written into OUT_DIR carries sha256 of every output.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-build/entropy90b-wasm}"
mkdir -p "$OUT"
rm -f "$OUT"/ea_*.mjs "$OUT"/ea_*.wasm "$OUT"/BUILDINFO.json
docker buildx build --progress=plain -f "$HERE/Dockerfile.wasm" --target artifacts \
  --output "type=local,dest=$OUT" "$HERE"
test -s "$OUT/BUILDINFO.json" || { echo "no BUILDINFO.json produced" >&2; exit 1; }
ls -l "$OUT"
