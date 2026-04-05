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
echo "Running configure..."
emconfigure ./configure \
  --host=wasm32-unknown-emscripten \
  --disable-shared \
  --enable-static \
  --disable-defaults \
  --enable-charon \
  --enable-monolithic \
  --enable-pkcs11 \
  --enable-socket-wasm \
  --enable-nonce \
  --enable-random \
  --enable-sha1 \
  --enable-sha2 \
  --enable-aes \
  --enable-hmac \
  --disable-kernel-netlink

# 4. Compile via Emscripten
echo "Running emmake..."
emmake make -j4 LDFLAGS="-s ALLOW_MEMORY_GROWTH=1 -s ALLOW_TABLE_GROWTH=1 -s ERROR_ON_UNDEFINED_SYMBOLS=0"
echo "Copying WASM to public directory..."
mkdir -p /Users/ericamador/antigravity/pqc-timeline-app/public/wasm
cp src/charon/charon /Users/ericamador/antigravity/pqc-timeline-app/public/wasm/strongswan.js
cp src/charon/charon.wasm /Users/ericamador/antigravity/pqc-timeline-app/public/wasm/strongswan.wasm

echo "Successfully built strongSwan WASM."
