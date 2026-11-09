// SPDX-License-Identifier: AGPL-3.0-only
// Cisco hash-sigs caller wrapper; pinned producer recipe in scripts/lms-source.lock.json.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "hash-sigs/hss.h" 
#include "hash-sigs/hss_verify.h"
#include "hash-sigs/common_defs.h"
#include "hash-sigs/hash.h"

// Use Emscripten's /dev/urandom path; failure remains an operation error.
bool generate_random_impl(void *output, size_t length) {
    FILE *f = fopen("/dev/urandom", "rb");
    if (!f) return false;
    size_t n = fread(output, 1, length, f);
    fclose(f);
    return n == length;
}

// Key Generation
int generate_keypair_wasm(unsigned char *pub_key_out, unsigned char *priv_key_out, int lms_type, int lmots_type) {
    // Preserve the existing one-level HSS sample generation contract.
    int levels = 1;
    param_set_t lm_type_arr[1] = { (param_set_t)lms_type };
    param_set_t lm_ots_type_arr[1] = { (param_set_t)lmots_type };
    
    // Aux data (optional, improves performance)
    size_t aux_len = hss_get_aux_data_len(10000, levels, lm_type_arr, lm_ots_type_arr);
    unsigned char *aux_data = malloc(aux_len);
    
    // Existing caller provides public/private storage buffers.
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

/* Bounded signing ABI v1: output capacity is supplied by the actual caller. */
#include <stdint.h>
#include <limits.h>
#include "hash-sigs/hss_common.h"
#include "hash-sigs/hss_internal.h"
#ifdef __EMSCRIPTEN__
#include <emscripten/heap.h>
#endif

static bool region_ok(const void *ptr, size_t len) {
    uintptr_t start = (uintptr_t)ptr;
    if (len == 0) return true;
    if (!ptr || len > UINTPTR_MAX - start) return false;
#ifdef __EMSCRIPTEN__
    size_t heap = emscripten_get_heap_size();
    return start <= heap && len <= heap - start;
#else
    return true; /* Native harness supplies actual allocated regions. */
#endif
}
static bool overlaps(const void *a, size_t an, const void *b, size_t bn) {
    return an && bn && (uintptr_t)a < (uintptr_t)b + bn && (uintptr_t)b < (uintptr_t)a + an;
}

uint32_t get_signature_length_wasm(const unsigned char *private_key, size_t private_capacity) {
    if (private_capacity < PRIVATE_KEY_LEN || !region_ok(private_key, private_capacity)) return 0;
    unsigned levels;
    param_set_t lm[MAX_HSS_LEVELS], ots[MAX_HSS_LEVELS];
    /* This parses bounded existing metadata only; no working key/state update. */
    if (!hss_get_parameter_set(&levels, lm, ots, NULL, (void *)private_key)) return 0;
    size_t required = hss_get_signature_len(levels, lm, ots);
    return required && required <= UINT32_MAX ? (uint32_t)required : 0;
}

int sign_message_bounded_wasm(unsigned char *private_key, size_t private_capacity,
        const unsigned char *message, size_t message_len,
        unsigned char *signature, size_t signature_capacity, uint32_t *written) {
    if (!region_ok(written, sizeof *written) ||
        !region_ok(private_key, private_capacity) || !region_ok(message, message_len) ||
        !region_ok(signature, signature_capacity)) return -1;
    if (overlaps(written, sizeof *written, private_key, private_capacity) ||
        overlaps(written, sizeof *written, message, message_len) ||
        overlaps(written, sizeof *written, signature, signature_capacity) ||
        overlaps(signature, signature_capacity, private_key, private_capacity) ||
        overlaps(signature, signature_capacity, message, message_len)) return -1;
    *written = 0;
    uint32_t required = get_signature_length_wasm(private_key, private_capacity);
    if (!required) return -1;
    /* Refuse before loading a working key or consuming any signature state. */
    if (signature_capacity < required) return -2;
    struct hss_working_key *working = hss_load_private_key(NULL, private_key, 0, NULL, 0, NULL);
    if (!working) return -1;
    size_t actual = hss_get_signature_len_from_working_key(working);
    if (actual != required) { hss_free_working_key(working); return -1; }
    bool ok = hss_generate_signature(working, NULL, private_key, message, message_len,
                                    signature, signature_capacity, NULL);
    hss_free_working_key(working);
    if (!ok) return -1;
    *written = required;
    return 0;
}

int verify_wasm(unsigned char *pub_key, const unsigned char *msg, size_t msg_len, unsigned char *sig, size_t sig_len) {
    // hss_validate_signature(pub_key, msg, msg_len, sig, sig_len, info)
    // defined in hss_verify.h
    // It returns true on success.
    
    return hss_validate_signature(pub_key, (void*)msg, msg_len, sig, sig_len, NULL) ? 1 : 0;
}

