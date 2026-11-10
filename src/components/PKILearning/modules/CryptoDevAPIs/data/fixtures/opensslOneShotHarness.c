// SPDX-License-Identifier: AGPL-3.0-only
// Test driver only. examples-under-test.inc is written verbatim from CODE_EXAMPLES.
#include <openssl/evp.h>
#include <openssl/crypto.h>
#include <openssl/pem.h>
#include <openssl/err.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef HARNESS_FAULTS
// Artificial call failures test error handling, not cryptographic rejection.
static const char *fault;
static int fault_hits;
static int hit(const char *name) {
    if (fault != NULL && strcmp(fault, name) == 0) {
        fault_hits++;
        return 1;
    }
    return 0;
}
static EVP_PKEY_CTX *test_key_ctx(OSSL_LIB_CTX *libctx, const char *name,
                                const char *props) {
    return hit("key-context") ? NULL : EVP_PKEY_CTX_new_from_name(libctx, name, props);
}
static int test_key_init(EVP_PKEY_CTX *ctx) {
    return hit("key-init") ? 0 : EVP_PKEY_keygen_init(ctx);
}
static int test_keygen(EVP_PKEY_CTX *ctx, EVP_PKEY **key) {
    return hit("keygen") ? 0 : EVP_PKEY_keygen(ctx, key);
}
static EVP_MD_CTX *test_md_ctx(void) {
    return hit("md-context") ? NULL : EVP_MD_CTX_new();
}
static void *test_malloc(size_t length) {
    return hit("allocation") ? NULL : CRYPTO_malloc(length, __FILE__, __LINE__);
}
static int test_sign_init(EVP_MD_CTX *ctx, EVP_PKEY_CTX **pctx, const char *mdname,
                          OSSL_LIB_CTX *libctx, const char *props, EVP_PKEY *key,
                          const OSSL_PARAM params[]) {
    return hit("sign-init") ? 0 : EVP_DigestSignInit_ex(ctx, pctx, mdname, libctx, props, key, params);
}
static int test_sign(EVP_MD_CTX *ctx, unsigned char *sig, size_t *length,
                     const unsigned char *message, size_t message_length) {
    if (hit(sig == NULL ? "size-query" : "signature-write")) return 0;
    return EVP_DigestSign(ctx, sig, length, message, message_length);
}
static int test_verify_init(EVP_MD_CTX *ctx, EVP_PKEY_CTX **pctx, const char *mdname,
                            OSSL_LIB_CTX *libctx, const char *props, EVP_PKEY *key,
                            const OSSL_PARAM params[]) {
    return hit("verify-init") ? 0 : EVP_DigestVerifyInit_ex(ctx, pctx, mdname, libctx, props, key, params);
}
static int test_verify(EVP_MD_CTX *ctx, const unsigned char *sig, size_t length,
                       const unsigned char *message, size_t message_length) {
    return hit("verify-operation") ? -7 : EVP_DigestVerify(ctx, sig, length, message, message_length);
}
#define EVP_PKEY_CTX_new_from_name test_key_ctx
#define EVP_PKEY_keygen_init test_key_init
#define EVP_PKEY_keygen test_keygen
#define EVP_MD_CTX_new test_md_ctx
#undef OPENSSL_malloc
#define OPENSSL_malloc test_malloc
#define EVP_DigestSignInit_ex test_sign_init
#define EVP_DigestSign test_sign
#define EVP_DigestVerifyInit_ex test_verify_init
#define EVP_DigestVerify test_verify
#endif

#include "examples-under-test.inc"

static int require(int condition, const char *label) {
    if (!condition) fprintf(stderr, "Failed: %s\n", label);
    return condition;
}
#ifndef HARNESS_FAULTS
static int write_bytes(const char *name, const unsigned char *data, size_t length) {
    FILE *file = fopen(name, "wb");
    if (file == NULL) return 0;
    int ok = fwrite(data, 1, length, file) == length;
    if (fclose(file) != 0) ok = 0;
    return ok;
}
static int write_public(const char *name, EVP_PKEY *key) {
    FILE *file = fopen(name, "wb");
    if (file == NULL) return 0;
    int ok = PEM_write_PUBKEY(file, key) == 1;
    if (fclose(file) != 0) ok = 0;
    return ok;
}
#endif
int main(int argc, char **argv) {
    const unsigned char message[] = "Fictional one-shot sample";
#ifndef HARNESS_FAULTS
    unsigned char changed_message[sizeof message];
#endif
    EVP_PKEY *key = NULL, *wrong_key = NULL;
    unsigned char *signature = NULL;
    size_t signature_length = 0;
    int ok = 0;
    if (argc != 2 || strcmp(argv[1], "run") != 0) return 2;
    key = sample_generate_mldsa65_key();
    wrong_key = sample_generate_mldsa65_key();
    if (!require(key != NULL && wrong_key != NULL, "real key generation")) goto done;
    if (!require(sample_sign_mldsa65(key, message, sizeof message - 1,
                                    &signature, &signature_length) == 1 &&
                 signature != NULL && signature_length > 0, "real signing")) goto done;
#ifdef HARNESS_FAULTS
    const char *key_faults[] = {"key-context", "key-init", "keygen"};
    for (size_t i = 0; i < sizeof key_faults / sizeof key_faults[0]; i++) {
        fault = key_faults[i]; fault_hits = 0;
        EVP_PKEY *failed = sample_generate_mldsa65_key();
        int expected = failed == NULL && fault_hits == 1;
        EVP_PKEY_free(failed);
        if (!require(expected, fault)) goto done;
    }
    const char *sign_faults[] = {"md-context", "sign-init", "size-query", "allocation", "signature-write"};
    for (size_t i = 0; i < sizeof sign_faults / sizeof sign_faults[0]; i++) {
        unsigned char *output = (unsigned char *)message;
        size_t output_length = 99;
        fault = sign_faults[i]; fault_hits = 0;
        int rc = sample_sign_mldsa65(key, message, sizeof message - 1, &output, &output_length);
        if (!require(rc == 0 && output == NULL && output_length == 0 && fault_hits == 1, fault)) goto done;
    }
    const char *verify_faults[] = {"md-context", "verify-init", "verify-operation"};
    for (size_t i = 0; i < sizeof verify_faults / sizeof verify_faults[0]; i++) {
        fault = verify_faults[i]; fault_hits = 0;
        int rc = sample_verify_mldsa65(key, message, sizeof message - 1, signature, signature_length);
        if (!require(rc < 0 && fault_hits == 1, fault)) goto done;
    }
    fault = NULL;
    puts("{\"harnessOnlyFaultCases\":11,\"allRejectedAsOperationFailures\":true}");
#else
    if (!require(sample_verify_mldsa65(key, message, sizeof message - 1, signature, signature_length) == 1,
                 "valid signature")) goto done;
    memcpy(changed_message, message, sizeof message);
    changed_message[0] ^= 1;
    if (!require(sample_verify_mldsa65(key, changed_message, sizeof message - 1, signature, signature_length) == 0,
                 "changed message invalid")) goto done;
    if (!require(sample_verify_mldsa65(wrong_key, message, sizeof message - 1, signature, signature_length) == 0,
                 "wrong ML-DSA-65 key invalid")) goto done;
    signature[0] ^= 1;
    if (!require(sample_verify_mldsa65(key, message, sizeof message - 1, signature, signature_length) == 0,
                 "changed signature invalid")) goto done;
    if (!require(write_bytes("changed-signature.bin", signature, signature_length), "write changed signature")) goto done;
    signature[0] ^= 1;
    if (!require(sample_verify_mldsa65(key, message, sizeof message - 1, signature, signature_length) == 1,
                 "valid retry with fresh verification context")) goto done;
    if (!require(sample_verify_mldsa65(NULL, message, sizeof message - 1, signature, signature_length) < 0,
                 "missing key is an operation error")) goto done;
    if (!require(write_public("public.pem", key) && write_public("wrong-public.pem", wrong_key) &&
                 write_bytes("message.bin", message, sizeof message - 1) &&
                 write_bytes("changed-message.bin", changed_message, sizeof message - 1) &&
                 write_bytes("signature.bin", signature, signature_length), "public artifacts only")) goto done;
    printf("{\"valid\":1,\"changedMessage\":0,\"wrongKey\":0,\"changedSignature\":0,\"retry\":1,\"missingKey\":-1,\"signatureBytes\":%zu}\n", signature_length);
#endif
    ok = 1;
done:
    OPENSSL_free(signature);
    EVP_PKEY_free(key);
    EVP_PKEY_free(wrong_key);
    ERR_clear_error();
    return ok ? 0 : 1;
}
