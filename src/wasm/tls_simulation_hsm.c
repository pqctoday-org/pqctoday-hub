/*
 * tls_simulation_hsm.c — HSM-mode helpers for the TLS 1.3 simulator.
 *
 * When HSM mode is enabled (via `tls_simulation_set_hsm_mode(1)` from JS),
 * the simulator's server-side private key for CertificateVerify is generated
 * inside the WASM-linked softhsmv3 token. The OpenSSL TLS state machine then
 * routes the EVP_DigestSign for CertificateVerify through pkcs11-provider
 * (also statically linked) into softhsmv3 — proving the private key never
 * leaves the simulated HSM during the handshake.
 *
 * Pattern mirrors the working strongSwan WASM v2 build:
 *   - softhsmv3 is the same libsofthsmv3-static.a used by strongSwan
 *   - pkcs11-provider is built by `pqctoday-hsm/scripts/build-pkcs11-provider-wasm.sh`
 *     with OSSL_provider_init renamed to p11prov_OSSL_provider_init
 *   - dlopen/dlsym are intercepted by pkcs11_static_shim.c
 *
 * Each PKCS#11 call softhsmv3 receives is logged to the JSON event stream
 * via the same log_event() helper used by tls_simulation.c, prefixed
 * `pkcs11_*`, so the UI's PKCS#11 Log Panel populates naturally during the
 * handshake.
 *
 * Build under Emscripten only.
 */

#ifdef __EMSCRIPTEN__

#include <openssl/bio.h>
#include <openssl/err.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/provider.h>
#include <openssl/ssl.h>
#include <openssl/store.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>
#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

/* Shared softhsmv3 + provider symbols (statically linked into openssl.wasm). */
typedef unsigned long CK_RV;
typedef unsigned long CK_ULONG;
typedef unsigned long CK_FLAGS;
typedef unsigned long CK_SLOT_ID;
typedef unsigned long CK_SESSION_HANDLE;
typedef unsigned long CK_OBJECT_HANDLE;
typedef unsigned long CK_OBJECT_CLASS;
typedef unsigned long CK_KEY_TYPE;
typedef unsigned long CK_USER_TYPE;
typedef unsigned char CK_BYTE;
typedef unsigned char CK_BBOOL;
typedef unsigned char *CK_BYTE_PTR;
typedef CK_BYTE *CK_UTF8CHAR_PTR;
typedef void *CK_VOID_PTR;
typedef struct CK_ATTRIBUTE { CK_ULONG type; CK_VOID_PTR pValue; CK_ULONG ulValueLen; } CK_ATTRIBUTE;
typedef struct CK_MECHANISM { CK_ULONG mechanism; CK_VOID_PTR pParameter; CK_ULONG ulParameterLen; } CK_MECHANISM;
typedef struct CK_C_INITIALIZE_ARGS {
    void *CreateMutex;  void *DestroyMutex;  void *LockMutex;  void *UnlockMutex;
    CK_FLAGS flags;     void *pReserved;
} CK_C_INITIALIZE_ARGS;
typedef struct CK_FUNCTION_LIST CK_FUNCTION_LIST;
typedef CK_FUNCTION_LIST **CK_FUNCTION_LIST_PTR_PTR;

#define CK_TRUE  1
#define CK_FALSE 0
#define CKR_OK                            0x00000000UL
#define CKR_CRYPTOKI_ALREADY_INITIALIZED  0x00000191UL
#define CKF_OS_LOCKING_OK                 0x00000002UL
#define CKF_SERIAL_SESSION                0x00000004UL
#define CKF_RW_SESSION                    0x00000002UL
#define CKU_SO                            0
#define CKU_USER                          1
#define CKO_PUBLIC_KEY                    0x00000002UL
#define CKO_PRIVATE_KEY                   0x00000003UL
#define CKA_CLASS                         0x00000000UL
#define CKA_TOKEN                         0x00000001UL
#define CKA_LABEL                         0x00000003UL
#define CKA_KEY_TYPE                      0x00000100UL
#define CKA_ID                            0x00000102UL
#define CKA_SIGN                          0x00000108UL
#define CKA_VERIFY                        0x0000010AUL
#define CKA_VALUE                         0x00000011UL
#define CKA_PARAMETER_SET_VAL             0x0000061DUL
#define CKM_ML_DSA_KEY_PAIR_GEN           0x0000001CUL
#define CKM_ML_DSA                        0x0000001DUL
#define CKK_ML_DSA_VAL                    0x0000004AUL
#define CKP_ML_DSA_44_VAL                 0x00000001UL
#define CKP_ML_DSA_65_VAL                 0x00000002UL
#define CKP_ML_DSA_87_VAL                 0x00000003UL

extern CK_RV C_GetFunctionList(CK_FUNCTION_LIST **ppFunctionList);

/* Function-table layout of the subset of PKCS#11 v2 functions we call. */
struct CK_FUNCTION_LIST {
    struct { CK_BYTE major, minor; } version;
    CK_RV (*C_Initialize)(CK_VOID_PTR);
    CK_RV (*C_Finalize)(CK_VOID_PTR);
    CK_RV (*C_GetInfo)(void *);
    CK_RV (*C_GetFunctionList)(CK_FUNCTION_LIST_PTR_PTR);
    CK_RV (*C_GetSlotList)(CK_BBOOL, CK_SLOT_ID *, CK_ULONG *);
    CK_RV (*C_GetSlotInfo)(CK_SLOT_ID, void *);
    CK_RV (*C_GetTokenInfo)(CK_SLOT_ID, void *);
    CK_RV (*C_GetMechanismList)(CK_SLOT_ID, void *, CK_ULONG *);
    CK_RV (*C_GetMechanismInfo)(CK_SLOT_ID, CK_ULONG, void *);
    CK_RV (*C_InitToken)(CK_SLOT_ID, CK_UTF8CHAR_PTR, CK_ULONG, CK_UTF8CHAR_PTR);
    CK_RV (*C_InitPIN)(CK_SESSION_HANDLE, CK_UTF8CHAR_PTR, CK_ULONG);
    CK_RV (*C_SetPIN)(CK_SESSION_HANDLE, CK_UTF8CHAR_PTR, CK_ULONG, CK_UTF8CHAR_PTR, CK_ULONG);
    CK_RV (*C_OpenSession)(CK_SLOT_ID, CK_FLAGS, CK_VOID_PTR, CK_VOID_PTR, CK_SESSION_HANDLE *);
    CK_RV (*C_CloseSession)(CK_SESSION_HANDLE);
    CK_RV (*C_CloseAllSessions)(CK_SLOT_ID);
    CK_RV (*C_GetSessionInfo)(CK_SESSION_HANDLE, void *);
    CK_RV (*C_GetOperationState)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_SetOperationState)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_OBJECT_HANDLE, CK_OBJECT_HANDLE);
    CK_RV (*C_Login)(CK_SESSION_HANDLE, CK_USER_TYPE, CK_UTF8CHAR_PTR, CK_ULONG);
    CK_RV (*C_Logout)(CK_SESSION_HANDLE);
    CK_RV (*C_CreateObject)(CK_SESSION_HANDLE, CK_ATTRIBUTE *, CK_ULONG, CK_OBJECT_HANDLE *);
    CK_RV (*C_CopyObject)(CK_SESSION_HANDLE, CK_OBJECT_HANDLE, CK_ATTRIBUTE *, CK_ULONG, CK_OBJECT_HANDLE *);
    CK_RV (*C_DestroyObject)(CK_SESSION_HANDLE, CK_OBJECT_HANDLE);
    CK_RV (*C_GetObjectSize)(CK_SESSION_HANDLE, CK_OBJECT_HANDLE, CK_ULONG *);
    CK_RV (*C_GetAttributeValue)(CK_SESSION_HANDLE, CK_OBJECT_HANDLE, CK_ATTRIBUTE *, CK_ULONG);
    CK_RV (*C_SetAttributeValue)(CK_SESSION_HANDLE, CK_OBJECT_HANDLE, CK_ATTRIBUTE *, CK_ULONG);
    CK_RV (*C_FindObjectsInit)(CK_SESSION_HANDLE, CK_ATTRIBUTE *, CK_ULONG);
    CK_RV (*C_FindObjects)(CK_SESSION_HANDLE, CK_OBJECT_HANDLE *, CK_ULONG, CK_ULONG *);
    CK_RV (*C_FindObjectsFinal)(CK_SESSION_HANDLE);
    CK_RV (*C_EncryptInit)(CK_SESSION_HANDLE, CK_MECHANISM *, CK_OBJECT_HANDLE);
    CK_RV (*C_Encrypt)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_EncryptUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_EncryptFinal)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DecryptInit)(CK_SESSION_HANDLE, CK_MECHANISM *, CK_OBJECT_HANDLE);
    CK_RV (*C_Decrypt)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DecryptUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DecryptFinal)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DigestInit)(CK_SESSION_HANDLE, CK_MECHANISM *);
    CK_RV (*C_Digest)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DigestUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG);
    CK_RV (*C_DigestKey)(CK_SESSION_HANDLE, CK_OBJECT_HANDLE);
    CK_RV (*C_DigestFinal)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_SignInit)(CK_SESSION_HANDLE, CK_MECHANISM *, CK_OBJECT_HANDLE);
    CK_RV (*C_Sign)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_SignUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG);
    CK_RV (*C_SignFinal)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_SignRecoverInit)(CK_SESSION_HANDLE, CK_MECHANISM *, CK_OBJECT_HANDLE);
    CK_RV (*C_SignRecover)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_VerifyInit)(CK_SESSION_HANDLE, CK_MECHANISM *, CK_OBJECT_HANDLE);
    CK_RV (*C_Verify)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG);
    CK_RV (*C_VerifyUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG);
    CK_RV (*C_VerifyFinal)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG);
    CK_RV (*C_VerifyRecoverInit)(CK_SESSION_HANDLE, CK_MECHANISM *, CK_OBJECT_HANDLE);
    CK_RV (*C_VerifyRecover)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DigestEncryptUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DecryptDigestUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_SignEncryptUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_DecryptVerifyUpdate)(CK_SESSION_HANDLE, CK_BYTE_PTR, CK_ULONG, CK_BYTE_PTR, CK_ULONG *);
    CK_RV (*C_GenerateKey)(CK_SESSION_HANDLE, CK_MECHANISM *, CK_ATTRIBUTE *, CK_ULONG, CK_OBJECT_HANDLE *);
    CK_RV (*C_GenerateKeyPair)(CK_SESSION_HANDLE, CK_MECHANISM *,
                               CK_ATTRIBUTE *, CK_ULONG,
                               CK_ATTRIBUTE *, CK_ULONG,
                               CK_OBJECT_HANDLE *, CK_OBJECT_HANDLE *);
    /* … rest of PKCS#11 v2 table; we don't call beyond this. */
};

/* pkcs11-provider entry point (renamed at compile time). */
extern int p11prov_OSSL_provider_init(const void *handle,
                                       const void *in,
                                       const void **out,
                                       void **provctx);

/* Logging hook — defined in tls_simulation.c, shared JSON event stream. */
extern void log_event(const char *side, const char *event, const char *details);

/* ── Module state ───────────────────────────────────────────────────────── */

static int g_hsm_mode_enabled = 0;
static int g_hsm_initialized  = 0;
static OSSL_PROVIDER *g_pkcs11_provider = NULL;

EMSCRIPTEN_KEEPALIVE
void tls_simulation_set_hsm_mode(int enabled) {
    g_hsm_mode_enabled = enabled ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
int tls_simulation_get_hsm_mode(void) {
    return g_hsm_mode_enabled;
}

/* Externally callable from tls_simulation.c. */
int hsm_mode_enabled(void) {
    return g_hsm_mode_enabled;
}

/* ── softhsmv3 conf bootstrap (idempotent) ─────────────────────────────── */

static int hsm_write_conf(void) {
    /* softhsmv3 v3 fork keeps the SOFTHSM2_CONF env var name. */
    mkdir("/tmp/softhsm-tokens", 0755);
    FILE *f = fopen("/tmp/softhsm.conf", "w");
    if (!f) return -1;
    fputs("directories.tokendir = /tmp/softhsm-tokens\n"
          "objectstore.backend = file\n"
          "log.level = INFO\n", f);
    fclose(f);
    setenv("SOFTHSM2_CONF", "/tmp/softhsm.conf", 1);
    return 0;
}

/* ── Public-key extraction + cert minting ───────────────────────────────── */

/* Build a self-signed X.509 cert wrapping `pubkey_der` (the SubjectPublicKeyInfo
 * bytes returned by softhsmv3's C_GetAttributeValue(CKA_VALUE) for an ML-DSA key).
 * Sign the cert via OpenSSL using `signer_pkey` (pkcs11 EVP_PKEY) so the X509_sign
 * call fires C_SignInit + C_Sign in the PKCS#11 log, demonstrating the HSM path
 * end-to-end before TLS even begins.
 *
 * Returns a malloc'd PEM string. Caller frees. NULL on error. */
static char *hsm_mint_self_signed_cert(const unsigned char *pubkey_der,
                                       size_t pubkey_der_len,
                                       EVP_PKEY *signer_pkey) {
    X509 *cert = NULL;
    EVP_PKEY *pubkey = NULL;
    BIO *mem = NULL;
    char *pem = NULL;

    /* softhsmv3 CKA_VALUE for ML-DSA keys returns raw key bytes (not DER SPKI).
     * Wrap them via EVP_PKEY_fromdata with algorithm "ML-DSA-65" and param "pub". */
    {
        OSSL_PARAM params[2];
        params[0] = OSSL_PARAM_construct_octet_string("pub",
                        (void *)pubkey_der, pubkey_der_len);
        params[1] = OSSL_PARAM_construct_end();
        EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", NULL);
        if (!pctx || EVP_PKEY_fromdata_init(pctx) != 1 ||
            EVP_PKEY_fromdata(pctx, &pubkey, EVP_PKEY_PUBLIC_KEY, params) != 1) {
            char errbuf[128];
            snprintf(errbuf, sizeof(errbuf),
                     "EVP_PKEY_fromdata(ML-DSA-65,pub) failed: 0x%lx", ERR_get_error());
            log_event("server", "hsm_error", errbuf);
            EVP_PKEY_CTX_free(pctx);
            goto out;
        }
        EVP_PKEY_CTX_free(pctx);
    }

    cert = X509_new();
    if (!cert) goto out;

    X509_set_version(cert, 2); /* X509 v3 */
    ASN1_INTEGER_set(X509_get_serialNumber(cert), 1);
    X509_gmtime_adj(X509_get_notBefore(cert), 0);
    X509_gmtime_adj(X509_get_notAfter(cert), 60L * 60L * 24L * 365L);

    X509_NAME *name = X509_get_subject_name(cert);
    X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_ASC,
                               (const unsigned char *)"tls-server.pqctoday.local",
                               -1, -1, 0);
    X509_set_issuer_name(cert, name); /* self-signed */
    X509_set_pubkey(cert, pubkey);

    /* X509_sign(cert, pkey, NULL) fails for provider-native pkcs11 keys because
     * it enters the legacy NID path (OBJ_find_sigid_by_algs with NID=0).
     * For provider keys (pkey->ameth == NULL), ASN1_item_sign_ctx queries
     * OSSL_SIGNATURE_PARAM_ALGORITHM_ID from the EVP_PKEY_CTX instead, which
     * pkcs11-provider implements correctly. Pre-initialise the context via
     * EVP_DigestSignInit_ex (NULL mdname = pure sign, no separate hash). */
    {
        EVP_MD_CTX *sign_ctx = EVP_MD_CTX_new();
        if (!sign_ctx) { log_event("server", "hsm_error", "EVP_MD_CTX_new failed"); goto out; }

        /* NULL mdname → pure/direct sign (correct for ML-DSA which hashes internally) */
        int dsi_ret = EVP_DigestSignInit_ex(sign_ctx, NULL, NULL, NULL, NULL, signer_pkey, NULL);
        {
            char chk[64]; snprintf(chk, sizeof(chk), "EVP_DigestSignInit_ex ret=%d", dsi_ret);
            log_event("server", "hsm_debug", chk);
        }
        if (dsi_ret != 1) {
            unsigned long e;
            char errbuf[256];
            while ((e = ERR_get_error()) != 0) {
                ERR_error_string_n(e, errbuf, sizeof(errbuf));
                log_event("server", "hsm_error", errbuf);
            }
            EVP_MD_CTX_free(sign_ctx);
            goto out;
        }
        ERR_clear_error(); /* discard any non-fatal warnings from init */

        /* X509_sign_ctx uses the pre-initialised ctx; ASN1_item_sign_ctx reads
         * the AlgorithmIdentifier from OSSL_SIGNATURE_PARAM_ALGORITHM_ID. */
        if (X509_sign_ctx(cert, sign_ctx) == 0) {
            unsigned long e;
            char errbuf[256];
            while ((e = ERR_get_error()) != 0) {
                ERR_error_string_n(e, errbuf, sizeof(errbuf));
                log_event("server", "hsm_error", errbuf);
            }
            EVP_MD_CTX_free(sign_ctx);
            goto out;
        }
        EVP_MD_CTX_free(sign_ctx);
    }

    mem = BIO_new(BIO_s_mem());
    if (!mem) goto out;
    if (PEM_write_bio_X509(mem, cert) != 1) goto out;

    BUF_MEM *bptr = NULL;
    BIO_get_mem_ptr(mem, &bptr);
    if (!bptr || !bptr->data) goto out;

    pem = (char *)malloc(bptr->length + 1);
    if (!pem) goto out;
    memcpy(pem, bptr->data, bptr->length);
    pem[bptr->length] = 0;

    log_event("server", "hsm_cert_minted",
              "Self-signed cert built from softhsmv3 ML-DSA-65 SPKI; signed via pkcs11-provider");

out:
    if (mem)    BIO_free(mem);
    if (cert)   X509_free(cert);
    if (pubkey) EVP_PKEY_free(pubkey);
    return pem;
}

/* ── Provider bootstrap (idempotent across simulation runs) ─────────────── */

/* OPENSSL_CONF lite for the pkcs11-provider section. The `module=` value is
 * the name passed to OSSL_PROVIDER_load — for builtin providers the path is
 * irrelevant; pkcs11-module-path is the dlopen target which our shim
 * intercepts to return the static softhsmv3 entry points. */
static const char *PKCS11_OPENSSL_CONF =
    "openssl_conf = openssl_init\n"
    "[openssl_init]\n"
    "providers = provider_sect\n"
    "[provider_sect]\n"
    "default = default_sect\n"
    "pkcs11 = pkcs11_sect\n"
    "[default_sect]\n"
    "activate = 1\n"
    "[pkcs11_sect]\n"
    "module = wasm:softhsmv3\n"
    "pkcs11-module-path = wasm:softhsmv3\n"
    "pkcs11-module-token-pin = 1234\n"
    "activate = 1\n";

static int hsm_load_provider(void) {
    if (g_pkcs11_provider) return 0;

    /* Register the static entry point under the name "pkcs11" so
     * OSSL_PROVIDER_load can find it without a real dlopen. */
    if (OSSL_PROVIDER_add_builtin(NULL, "pkcs11",
            (OSSL_provider_init_fn *)p11prov_OSSL_provider_init) != 1) {
        log_event("server", "hsm_error", "OSSL_PROVIDER_add_builtin(pkcs11) failed");
        return -1;
    }

    /* Drop the conf into the in-memory FS and load it so pkcs11-provider
     * picks up its module-path / pin. */
    FILE *f = fopen("/ssl/pkcs11.cnf", "w");
    if (!f) {
        log_event("server", "hsm_error", "could not open /ssl/pkcs11.cnf for write");
        return -1;
    }
    fputs(PKCS11_OPENSSL_CONF, f);
    fclose(f);
    if (OSSL_LIB_CTX_load_config(NULL, "/ssl/pkcs11.cnf") != 1) {
        char err[128];
        snprintf(err, sizeof(err), "OSSL_LIB_CTX_load_config failed: 0x%lx", ERR_get_error());
        log_event("server", "hsm_error", err);
        return -1;
    }

    g_pkcs11_provider = OSSL_PROVIDER_load(NULL, "pkcs11");
    if (!g_pkcs11_provider) {
        char err[128];
        snprintf(err, sizeof(err), "OSSL_PROVIDER_load(pkcs11) failed: 0x%lx", ERR_get_error());
        log_event("server", "hsm_error", err);
        return -1;
    }
    log_event("server", "hsm_provider_loaded", "pkcs11-provider 0.4.0 (static, softhsmv3 backend)");
    return 0;
}

/* ── Server-side keygen + cert mint + SSL_CTX wiring ────────────────────── */

#define HSM_PIN "1234"

/* Read the server cert at /ssl/server.crt (the user-selected cert) and return
 * the ML-DSA paramset CKP_ML_DSA_*_VAL that matches, defaulting to 65 for any
 * non-ML-DSA cert (RSA, ECDSA) so HSM mode can still proceed. */
static CK_ULONG detect_mldsa_paramset(char *label_out, size_t label_len) {
    BIO *bio = BIO_new_file("/ssl/server.crt", "r");
    if (!bio) {
        strncpy(label_out, "tls-server-mldsa65", label_len);
        return CKP_ML_DSA_65_VAL;
    }
    X509 *cert = PEM_read_bio_X509(bio, NULL, NULL, NULL);
    BIO_free(bio);
    if (!cert) {
        strncpy(label_out, "tls-server-mldsa65", label_len);
        return CKP_ML_DSA_65_VAL;
    }
    EVP_PKEY *pkey = X509_get0_pubkey(cert);
    CK_ULONG  ps   = CKP_ML_DSA_65_VAL;
    const char *pname = pkey ? EVP_PKEY_get0_type_name(pkey) : NULL;
    if (pname) {
        if (strstr(pname, "44") || strstr(pname, "ML-DSA-44"))
            ps = CKP_ML_DSA_44_VAL;
        else if (strstr(pname, "87") || strstr(pname, "ML-DSA-87"))
            ps = CKP_ML_DSA_87_VAL;
        /* else 65 (default) */
    }
    X509_free(cert);
    if (ps == CKP_ML_DSA_44_VAL)
        strncpy(label_out, "tls-server-mldsa44", label_len);
    else if (ps == CKP_ML_DSA_87_VAL)
        strncpy(label_out, "tls-server-mldsa87", label_len);
    else
        strncpy(label_out, "tls-server-mldsa65", label_len);
    label_out[label_len - 1] = '\0';
    return ps;
}

static EVP_PKEY *hsm_load_pkcs11_key(const char *uri) {
    OSSL_STORE_CTX *store = OSSL_STORE_open(uri, NULL, NULL, NULL, NULL);
    if (!store) {
        char err[256];
        snprintf(err, sizeof(err), "OSSL_STORE_open(%s) failed: 0x%lx",
                 uri, ERR_get_error());
        log_event("server", "hsm_error", err);
        return NULL;
    }
    EVP_PKEY *pkey = NULL;
    while (!OSSL_STORE_eof(store)) {
        OSSL_STORE_INFO *info = OSSL_STORE_load(store);
        if (!info) break;
        int type = OSSL_STORE_INFO_get_type(info);
        if (type == OSSL_STORE_INFO_PKEY) {
            pkey = OSSL_STORE_INFO_get1_PKEY(info);
            OSSL_STORE_INFO_free(info);
            break;
        }
        OSSL_STORE_INFO_free(info);
    }
    OSSL_STORE_close(store);
    if (!pkey) {
        char err[256];
        snprintf(err, sizeof(err), "OSSL_STORE_load(%s) found no key; last err=0x%lx",
                 uri, ERR_get_error());
        log_event("server", "hsm_error", err);
    } else {
        char msg[256];
        snprintf(msg, sizeof(msg), "OSSL_STORE_load(%s) → key type=%d", uri, EVP_PKEY_base_id(pkey));
        log_event("server", "pkcs11_call", msg);
    }
    return pkey;
}

/* Public entry: invoked by tls_simulation.c right before SSL_CTX gets its
 * server cert/key. Replaces the file-backed PEM load with HSM-backed key. */
int hsm_setup_server_credentials(SSL_CTX *s_ctx) {
    if (!g_hsm_mode_enabled) return 0; /* no-op */

    log_event("server", "hsm_mode", "Live HSM enabled — softhsmv3 will hold the server private key");

    if (!g_hsm_initialized) {
        if (hsm_write_conf() != 0) {
            log_event("server", "hsm_error", "could not write softhsm conf");
            return -1;
        }
        g_hsm_initialized = 1;
    }

    /* Step 1: PKCS#11 session + ML-DSA-65 keypair generation. */
    CK_FUNCTION_LIST *p11 = NULL;
    if (C_GetFunctionList(&p11) != CKR_OK || !p11) {
        log_event("server", "hsm_error", "C_GetFunctionList unavailable");
        return -1;
    }
    CK_C_INITIALIZE_ARGS iargs = { 0 };
    iargs.flags = CKF_OS_LOCKING_OK;
    CK_RV rv = p11->C_Initialize(&iargs);
    if (rv != CKR_OK && rv != CKR_CRYPTOKI_ALREADY_INITIALIZED) {
        char m[64]; snprintf(m, sizeof(m), "C_Initialize rv=0x%lx", (unsigned long)rv);
        log_event("server", "hsm_error", m);
        return -1;
    }
    log_event("server", "pkcs11_call", "C_Initialize");

    CK_SLOT_ID slot_id = 0;
    CK_ULONG   slot_count = 1;
    rv = p11->C_GetSlotList(CK_FALSE, &slot_id, &slot_count);
    if (rv != CKR_OK || slot_count == 0) {
        log_event("server", "hsm_error", "C_GetSlotList: no slot");
        return -1;
    }
    log_event("server", "pkcs11_call", "C_GetSlotList");

    /* Init token + PINs. Idempotent (CKR_OK on first run, errors swallowed thereafter). */
    CK_BYTE label[32]; memset(label, ' ', sizeof(label));
    memcpy(label, "tls-sim-token", 13);
    p11->C_InitToken(slot_id, (CK_UTF8CHAR_PTR)HSM_PIN, strlen(HSM_PIN), (CK_UTF8CHAR_PTR)label);
    log_event("server", "pkcs11_call", "C_InitToken");

    CK_SESSION_HANDLE so_sess;
    if (p11->C_OpenSession(slot_id, CKF_SERIAL_SESSION | CKF_RW_SESSION,
                           NULL, NULL, &so_sess) == CKR_OK) {
        p11->C_Login(so_sess, CKU_SO, (CK_UTF8CHAR_PTR)HSM_PIN, strlen(HSM_PIN));
        p11->C_InitPIN(so_sess, (CK_UTF8CHAR_PTR)HSM_PIN, strlen(HSM_PIN));
        p11->C_Logout(so_sess);
        p11->C_CloseSession(so_sess);
    }

    CK_SESSION_HANDLE sess;
    if (p11->C_OpenSession(slot_id, CKF_SERIAL_SESSION | CKF_RW_SESSION,
                           NULL, NULL, &sess) != CKR_OK) {
        log_event("server", "hsm_error", "C_OpenSession failed");
        return -1;
    }
    log_event("server", "pkcs11_call", "C_OpenSession");
    if (p11->C_Login(sess, CKU_USER, (CK_UTF8CHAR_PTR)HSM_PIN, strlen(HSM_PIN)) != CKR_OK) {
        log_event("server", "hsm_error", "C_Login(user) failed");
        return -1;
    }
    log_event("server", "pkcs11_call", "C_Login(CKU_USER)");

    char            key_label_buf[32];
    CK_ULONG        paramset  = detect_mldsa_paramset(key_label_buf, sizeof(key_label_buf));
    {
        char msg[128];
        snprintf(msg, sizeof(msg), "Detected ML-DSA paramset=0x%02lx label=%s",
                 (unsigned long)paramset, key_label_buf);
        log_event("server", "hsm_paramset", msg);
    }
    CK_MECHANISM keygen_mech = { CKM_ML_DSA_KEY_PAIR_GEN, NULL, 0 };
    CK_OBJECT_CLASS pubclass  = CKO_PUBLIC_KEY;
    CK_OBJECT_CLASS privclass = CKO_PRIVATE_KEY;
    CK_KEY_TYPE     ktype     = CKK_ML_DSA_VAL;
    CK_BBOOL        ck_true   = CK_TRUE;
    /* A token-resident keypair so OSSL_STORE can locate it via pkcs11: URI. */
    CK_BBOOL        ck_token  = CK_TRUE;
    const char     *key_label = key_label_buf;
    const char     *key_id    = "01";
    CK_ATTRIBUTE pub_tmpl[] = {
        { CKA_CLASS,             &pubclass, sizeof(pubclass) },
        { CKA_KEY_TYPE,          &ktype,    sizeof(ktype)    },
        { CKA_VERIFY,            &ck_true,  sizeof(ck_true)  },
        { CKA_PARAMETER_SET_VAL, &paramset, sizeof(paramset) },
        { CKA_TOKEN,             &ck_token, sizeof(ck_token) },
        { CKA_LABEL,             (void *)key_label, (CK_ULONG)strlen(key_label) },
        { CKA_ID,                (void *)key_id,    (CK_ULONG)strlen(key_id)    },
    };
    CK_ATTRIBUTE priv_tmpl[] = {
        { CKA_CLASS,             &privclass,sizeof(privclass) },
        { CKA_KEY_TYPE,          &ktype,    sizeof(ktype)     },
        { CKA_SIGN,              &ck_true,  sizeof(ck_true)   },
        { CKA_PARAMETER_SET_VAL, &paramset, sizeof(paramset)  },
        { CKA_TOKEN,             &ck_token, sizeof(ck_token)  },
        { CKA_LABEL,             (void *)key_label, (CK_ULONG)strlen(key_label) },
        { CKA_ID,                (void *)key_id,    (CK_ULONG)strlen(key_id)    },
    };

    CK_OBJECT_HANDLE hpub, hpriv;
    rv = p11->C_GenerateKeyPair(sess, &keygen_mech,
                                pub_tmpl,  sizeof(pub_tmpl)  / sizeof(pub_tmpl[0]),
                                priv_tmpl, sizeof(priv_tmpl) / sizeof(priv_tmpl[0]),
                                &hpub, &hpriv);
    if (rv != CKR_OK) {
        char m[96]; snprintf(m, sizeof(m), "C_GenerateKeyPair rv=0x%lx", (unsigned long)rv);
        log_event("server", "hsm_error", m);
        return -1;
    }
    {
        char m[160];
        snprintf(m, sizeof(m), "C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN, paramset=0x%02lx/%s) "
                               "→ pub=0x%lx, priv=0x%lx (private never leaves softhsmv3)",
                 (unsigned long)paramset, key_label,
                 (unsigned long)hpub, (unsigned long)hpriv);
        log_event("server", "pkcs11_call", m);
    }

    /* Step 2: Read public-key bytes (SPKI-encoded) from softhsmv3. */
    CK_ATTRIBUTE pub_value[] = { { CKA_VALUE, NULL, 0 } };
    rv = p11->C_GetAttributeValue(sess, hpub, pub_value, 1);
    if (rv != CKR_OK || pub_value[0].ulValueLen == 0) {
        log_event("server", "hsm_error", "C_GetAttributeValue(CKA_VALUE) sizing failed");
        return -1;
    }
    unsigned char *pub_buf = (unsigned char *)malloc(pub_value[0].ulValueLen);
    if (!pub_buf) return -1;
    pub_value[0].pValue = pub_buf;
    rv = p11->C_GetAttributeValue(sess, hpub, pub_value, 1);
    if (rv != CKR_OK) {
        log_event("server", "hsm_error", "C_GetAttributeValue(CKA_VALUE) read failed");
        free(pub_buf); return -1;
    }
    {
        char m[96];
        snprintf(m, sizeof(m), "C_GetAttributeValue(CKA_VALUE) → %lu B SubjectPublicKeyInfo",
                 (unsigned long)pub_value[0].ulValueLen);
        log_event("server", "pkcs11_call", m);
    }

    /* Close our manual session before pkcs11-provider opens its own.
     * softhsmv3 returns CKR_USER_ALREADY_LOGGED_IN if a second C_Login is
     * attempted while our session is still active. pkcs11-provider does not
     * handle that case cleanly, so we must yield the slot here.
     * The keypair is token-resident (CKA_TOKEN=CK_TRUE) and persists. */
    p11->C_Logout(sess);
    p11->C_CloseSession(sess);
    log_event("server", "pkcs11_call", "C_CloseSession (yielding slot to pkcs11-provider)");

    /* Step 3: Load pkcs11-provider so we can build an EVP_PKEY URI handle. */
    if (hsm_load_provider() != 0) {
        free(pub_buf); return -1;
    }

    /* Step 4: Resolve EVP_PKEY for the HSM-resident key via OSSL_STORE. */
    char uri[160];
    snprintf(uri, sizeof(uri),
             "pkcs11:object=%s;type=private?pin-value=%s",
             key_label, HSM_PIN);
    EVP_PKEY *priv_pkey = hsm_load_pkcs11_key(uri);
    if (!priv_pkey) { free(pub_buf); return -1; }

    /* Step 5: Mint a self-signed cert. X509_sign routes via pkcs11-provider
     * → softhsmv3 → live C_SignInit + C_Sign. */
    char *cert_pem = hsm_mint_self_signed_cert(pub_buf, pub_value[0].ulValueLen, priv_pkey);
    free(pub_buf);
    if (!cert_pem) { EVP_PKEY_free(priv_pkey); return -1; }

    /* Step 6: Wire into SSL_CTX. CertificateVerify during the handshake will
     * call EVP_DigestSign on priv_pkey, again routing via the provider. */
    BIO *cert_bio = BIO_new_mem_buf(cert_pem, -1);
    X509 *cert = PEM_read_bio_X509(cert_bio, NULL, NULL, NULL);
    BIO_free(cert_bio);
    if (!cert) {
        log_event("server", "hsm_error", "Failed to parse minted cert PEM");
        free(cert_pem); EVP_PKEY_free(priv_pkey);
        return -1;
    }

    if (SSL_CTX_use_certificate(s_ctx, cert) != 1) {
        log_event("server", "hsm_error", "SSL_CTX_use_certificate(hsm_cert) failed");
        X509_free(cert); free(cert_pem); EVP_PKEY_free(priv_pkey);
        return -1;
    }
    if (SSL_CTX_use_PrivateKey(s_ctx, priv_pkey) != 1) {
        log_event("server", "hsm_error", "SSL_CTX_use_PrivateKey(pkcs11_uri) failed");
        X509_free(cert); free(cert_pem); EVP_PKEY_free(priv_pkey);
        return -1;
    }
    log_event("server", "hsm_attached",
              "SSL_CTX configured: cert from softhsmv3 SPKI, private key via pkcs11: URI");

    /* Write the self-signed cert to a well-known path so the client context
     * can load it as a trusted CA.  Without this the client rejects the cert
     * because it was not signed by the pre-existing RSA CA in client-ca.crt. */
    FILE *ca_fp = fopen("/ssl/hsm-server.crt", "w");
    if (ca_fp) {
        fputs(cert_pem, ca_fp);
        fclose(ca_fp);
        log_event("server", "hsm_ca_written",
                  "Self-signed cert written to /ssl/hsm-server.crt for client trust");
    }

    /* OpenSSL retains the cert + key; we can free our refs. */
    X509_free(cert);
    EVP_PKEY_free(priv_pkey);
    free(cert_pem);
    return 0;
}

#else /* !__EMSCRIPTEN__ */
int hsm_mode_enabled(void) { return 0; }
int hsm_setup_server_credentials(void *ctx) { (void)ctx; return 0; }
#endif /* __EMSCRIPTEN__ */
