#!/bin/bash
# Test which hash algorithms are available in OpenSSL WASM

echo "Testing OpenSSL hash algorithm support..."
echo ""

algorithms=(
  "sha256"
  "sha384" 
  "sha512"
  "sha3-256"
  "sha3-384"
  "sha3-512"
  "ripemd160"
  "blake2b512"
  "blake2s256"
)

for algo in "${algorithms[@]}"; do
  if echo "test" | openssl dgst -$algo > /dev/null 2>&1; then
    echo "✅ $algo - SUPPORTED"
  else
    echo "❌ $algo - NOT SUPPORTED"
  fi
done
