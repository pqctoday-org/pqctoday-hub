#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
#
# Copy a finished build (from build-wasm.sh) into public/wasm/entropy90b/ and
# verify every staged file against the build's own BUILDINFO.json hashes.
#
#   scripts/entropy-90b/stage-wasm.sh OUT_DIR
set -euo pipefail
OUT="${1:?build output dir}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/public/wasm/entropy90b"
mkdir -p "$DEST/licenses"
cp "$OUT"/ea_*.mjs "$OUT"/ea_*.wasm "$OUT/BUILDINFO.json" "$DEST/"
cp "$OUT"/licenses/* "$DEST/licenses/"
python3 - "$DEST" <<'EOF'
import hashlib, json, os, sys
dest = sys.argv[1]
info = json.load(open(os.path.join(dest, 'BUILDINFO.json')))
bad = 0
for name, meta in info['files'].items():
    p = os.path.join(dest, name)
    h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    ok = h == meta['sha256'] and os.path.getsize(p) == meta['bytes']
    bad += not ok
    print(('OK  ' if ok else 'BAD ') + f"{name} {os.path.getsize(p)} {h}")
sys.exit(1 if bad else 0)
EOF
