#!/bin/bash
set -e

echo "Starting LMS WASM Build..."

# Create directory if not exists
mkdir -p lms-wasm
cd lms-wasm

# Clone hash-sigs if not present
if [ ! -d "hash-sigs" ]; then
    echo "Cloning hash-sigs..."
    git clone https://github.com/cisco/hash-sigs.git
fi

# Patch sha256.h to disable OpenSSL dependency
# We replace the define line completely to force it to 0
if grep -q "#define USE_OPENSSL 1" hash-sigs/sha256.h; then
    echo "Patching sha256.h to disable USE_OPENSSL..."
    # Replace the line containing "#define USE_OPENSSL 1" with "#define USE_OPENSSL 0"
    sed -i '' 's/#define USE_OPENSSL 1.*/#define USE_OPENSSL 0/' hash-sigs/sha256.h
fi

# Create Wrapper C File
echo "Creating wrapper..."
cat > lms_wasm_wrapper.c <<EOF
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "hash-sigs/hss.h" 
#include "hash-sigs/hss_verify.h"
#include "hash-sigs/common_defs.h"
#include "hash-sigs/hash.h"

// Simple random generator for WASM environment
// In production this should use crypto.getRandomValues from JS via callback
bool generate_random_impl(void *output, size_t length) {
    // For playground demo purposes, simple pseudo-random is sufficient if secure random is hard to link.
    // However, Emscripten usually supports /dev/urandom or arc4random.
    // Let's try reading from /dev/urandom which Emscripten emulates via crypto API.
    FILE *f = fopen("/dev/urandom", "rb");
    if (!f) return false;
    size_t n = fread(output, 1, length, f);
    fclose(f);
    return n == length;
}

// Key Generation
int generate_keypair_wasm(unsigned char *pub_key_out, unsigned char *priv_key_out, int lms_type, int lmots_type) {
    // Parameters: 1 level HSS for simplicity if mapping directly from LMS types
    // But HSS needs explicit levels.
    // If the user selects "LMS", they essentially want a 1-level HSS.
    
    int levels = 1;
    param_set_t lm_type_arr[1] = { (param_set_t)lms_type };
    param_set_t lm_ots_type_arr[1] = { (param_set_t)lmots_type };
    
    // Aux data (optional, improves performance)
    size_t aux_len = hss_get_aux_data_len(10000, levels, lm_type_arr, lm_ots_type_arr);
    unsigned char *aux_data = malloc(aux_len);
    
    // Public key length check
    // size_t pub_len = hss_get_public_key_len(levels, lm_type_arr, lm_ots_type_arr);
    // (We assume caller allocated enough, typically ~60 bytes)
    
    // Context for private key - we just write to memory
    // hss_generate_private_key writes to a buffer if update_private_key is NULL
    // But it expects a context? No, if update_private_key is NULL, it writes to 'context' 
    // interpreting it as 'unsigned char *' of length HSS_MAX_PRIVATE_KEY_LEN?
    // Let's check header comments:
    // "If the passed update_private_key function pointer is NULL, the private will will be written to the context pointer (which is expected to hold 48 bytes of data)"
    // Wait, 48 bytes? That seems small. Ah, that's the "secure storage" part (seed etc).
    // The WORKING key is large.
    
    // Wait, so the private key we export/import is just the seed (48 bytes)?
    // "The API to do this is hss_generate_private_key; this is done once per private key; and you should write the private key to secure storage"
    
    // So 'priv_key_out' should be roughly 48 bytes (plus length prefix maybe?).
    // HSS_MAX_PRIVATE_KEY_LEN is defined as (8 + 8 + SEED_LEN + 16). approx 48-64 bytes.
    
    bool success = hss_generate_private_key(
        generate_random_impl,
        levels,
        lm_type_arr,
        lm_ots_type_arr,
        NULL, // No update function, write to context
        priv_key_out,
        pub_key_out, 64, // Max pub key len
        aux_data, aux_len,
        NULL // info
    );
    
    free(aux_data);
    return success ? 0 : -1;
}

/* 
   Sign Message
   We need to:
   1. Load private key into working key (hss_load_private_key)
   2. Reserve signature (optional but good practice)
   3. Sign (hss_generate_signature)
   4. Export updated private key? 
      Since LMS is stateful, the private key MUST be updated.
      Our 'priv_key_out' buffer acts as the storage.
      We should allow reading/writing it.
*/
int sign_message_wasm(unsigned char *priv_key, unsigned char *pub_key_dummy, 
                     const unsigned char *msg, size_t msg_len,
                     unsigned char *sig_out) {
    
    // 1. Load private key
    // We need to know memory target? 0 is fine.
    // We assume 'priv_key' contains the current state.
    
    // hss_load_private_key takes a read function.
    // If NULL, context is the buffer.
    
    struct hss_working_key *w = hss_load_private_key(
        NULL, priv_key,
        0, // minimal memory
        NULL, 0, // no aux
        NULL
    );
    
    if (!w) return -1;
    
    // 2. Sign
    // hss_generate_signature updates the private key!
    // We pass NULL for update function, so it updates 'context' (priv_key buffer).
    // This is perfect for our stateless-server/stateful-client model where we return the blob.
    
    // Check signature length
    size_t sig_len = hss_get_signature_len_from_working_key(w);
    // We assume sig_out is big enough.
    
    bool success = hss_generate_signature(
        w,
        NULL, priv_key, // update inplace
        msg, msg_len,
        sig_out, sig_len,
        NULL
    );
    
    hss_free_working_key(w);
    return success ? 0 : -1;
}

int verify_wasm(unsigned char *pub_key, const unsigned char *msg, size_t msg_len, unsigned char *sig, size_t sig_len) {
    // hss_validate_signature(pub_key, msg, msg_len, sig, sig_len, info)
    // defined in hss_verify.h
    // It returns true on success.
    
    return hss_validate_signature(pub_key, (void*)msg, msg_len, sig, sig_len, NULL) ? 1 : 0;
}

EOF

echo "Compiling hash-sigs sources..."
# List of source files based on directory listing
SOURCES="hash-sigs/sha256.c hash-sigs/hash.c hash-sigs/lm_common.c hash-sigs/lm_ots_common.c hash-sigs/lm_ots_sign.c hash-sigs/lm_ots_verify.c hash-sigs/lm_verify.c hash-sigs/hss_common.c hash-sigs/hss_generate.c hash-sigs/hss_sign.c hash-sigs/hss_verify.c hash-sigs/hss_compute.c hash-sigs/hss_derive.c hash-sigs/hss_keygen.c hash-sigs/hss_param.c hash-sigs/hss_reserve.c hash-sigs/hss_aux.c hash-sigs/endian.c hash-sigs/hss_thread_single.c hash-sigs/hss_zeroize.c hash-sigs/hss.c hash-sigs/hss_alloc.c hash-sigs/hss_sign_inc.c hash-sigs/hss_verify_inc.c"

echo "Building WASM module..."
emcc -Ihash-sigs \
    lms_wasm_wrapper.c \
    $SOURCES \
    -O3 \
    -DUSE_OPENSSL=0 \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS="['_generate_keypair_wasm', '_sign_message_wasm', '_verify_wasm', '_malloc', '_free']" \
    -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'setValue', 'HEAPU8', 'HEAP32']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="createLmsModule" \
    -o lms.js

echo "Build Complete. Artifacts in lms-wasm/"
