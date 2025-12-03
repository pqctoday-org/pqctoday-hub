#!/bin/bash
set -e

echo "Starting OpenSSL WASM Build (Retry)..."

cd openssl-build

# Clean previous build
echo "Cleaning..."
make clean || true

# Set compilers
export CC=emcc
export CXX=em++
export AR=emar
export RANLIB=emranlib

# Emscripten flags
# Use -sOPTION=VALUE format to avoid splitting issues
# Use comma-separated lists for arrays if supported, or quoted brackets
EM_FLAGS="-sMODULARIZE=1 -sEXPORT_NAME=createOpenSSLModule -sINVOKE_RUN=0 -sEXIT_RUNTIME=1 -sALLOW_MEMORY_GROWTH=1 -sEXPORTED_RUNTIME_METHODS=FS,callMain -sEXPORTED_FUNCTIONS=_main -sWASM_BIGINT=1"

echo "Configuring..."
./Configure linux-generic32 \
  no-asm \
  no-async \
  no-threads \
  no-shared \
  no-afalgeng \
  enable-legacy \
  -DOPENSSL_NO_SECURE_MEMORY \
  -DOPENSSL_NO_CONST_TIME \
  $EM_FLAGS

echo "Compiling..."
make -j4

echo "Deploying..."
cp apps/openssl.wasm ../public/wasm/openssl.wasm
cp apps/openssl ../public/wasm/openssl.js

echo "Build Complete!"
