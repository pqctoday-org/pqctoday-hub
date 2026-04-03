#!/bin/bash
# scripts/build_strongswan_wasm.sh
set -e

# Use homebrew Python (3.10+) since Emscripten requires it for 'match' syntax
export PATH="/opt/homebrew/bin:$PATH"

echo "Building strongSwan WASM with PKCS#11 PQC offload..."

# 1. Setup Build Environment
cd /tmp/strongswan-build/strongswan-6.0.5

# 2. Reconfigure automake (since we changed Makefile.am)
echo "Running autoreconf..."
autoreconf -i

# 3. Emscripten Configure
# We strip everything out except the charon daemon and the pkcs11 plugin!
echo "Running emconfigure..."
emconfigure ./configure \
    --disable-shared \
    --enable-static \
    --enable-monolithic \
    --disable-defaults \
    --enable-charon \
    --enable-ikev2 \
    --disable-ikev1 \
    --disable-scripts \
    --disable-vici \
    --disable-socket-default \
    --enable-pkcs11 \
    CFLAGS="-O3 -Wno-error" \
    LDFLAGS="-O3 -s EXPORTED_RUNTIME_METHODS=[\"ccall\",\"cwrap\"] -s ALLOW_MEMORY_GROWTH=1"

# 4. Compile via Emscripten
echo "Running emmake..."
emmake make -j4 LDFLAGS="-O3 -s EXPORTED_FUNCTIONS=[\"_main\"] -s EXPORTED_RUNTIME_METHODS=[\"ccall\",\"cwrap\",\"addFunction\",\"removeFunction\"] -s ALLOW_MEMORY_GROWTH=1 -s ALLOW_TABLE_GROWTH=1 -s ERROR_ON_UNDEFINED_SYMBOLS=0"

# 5. Export to React Public Directory
echo "Copying WASM to public directory..."
mkdir -p /Users/ericamador/antigravity/pqc-timeline-app/public/wasm
cp src/charon/charon /Users/ericamador/antigravity/pqc-timeline-app/public/wasm/strongswan.js
cp src/charon/charon.wasm /Users/ericamador/antigravity/pqc-timeline-app/public/wasm/strongswan.wasm

echo "Successfully built strongSwan WASM."
