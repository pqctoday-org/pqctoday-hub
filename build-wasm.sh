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
  enable-trace \
  -DOPENSSL_NO_SECURE_MEMORY \
  -DOPENSSL_NO_CONST_TIME \
  $EM_FLAGS

echo "Compiling..."
make -j8 build_sw

echo "Building TLS Simulation Wrapper..."
emcc -Iinclude ../src/wasm/tls_simulation.c -c -o tls_simulation.o

echo "Linking Custom OpenSSL..."
# Link CLI parts + Custom Wrapper
# We redefine EM_FLAGS to include our new export
LINK_FLAGS="-sMODULARIZE=1 -sEXPORT_NAME=createOpenSSLModule -sINVOKE_RUN=0 -sEXIT_RUNTIME=1 -sALLOW_MEMORY_GROWTH=1 -sWASM_BIGINT=1"
EXPORTS="-sEXPORTED_FUNCTIONS=['_main','_execute_tls_simulation'] -sEXPORTED_RUNTIME_METHODS=['FS','callMain','cwrap','stringToUTF8','UTF8ToString','ENV']"

# Filter out problematic object files (like cmp which requires test mocks)
APPS_OBJS=$(ls apps/openssl-bin-*.o | grep -v "cmp")

emcc -o apps/openssl.js \
  $APPS_OBJS \
  apps/libapps.a \
  libssl.a \
  libcrypto.a \
  tls_simulation.o \
  $LINK_FLAGS \
  $EXPORTS

echo "Deploying..."
cp apps/openssl.wasm ../public/wasm/openssl.wasm
cp apps/openssl.js ../public/wasm/openssl.js

echo "Build Complete!"
