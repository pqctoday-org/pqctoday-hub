// SPDX-License-Identifier: GPL-3.0-only
/*
 * cms_provider_init.c — Standalone entry point that registers the
 * statically-linked pkcs11-provider with OpenSSL so the `openssl cms`
 * command can route operations to softhsmv3 via `pkcs11:` URIs.
 *
 * The existing `tls_simulation_hsm.c` already registers the provider, but
 * the registration is buried inside `hsm_load_provider()` (file-static)
 * called from the TLS handshake flow. The CMS workshop needs to register
 * the provider WITHOUT running a TLS handshake, so we expose a dedicated
 * exported function the worker can call once at boot.
 *
 * Build wiring: see ../../build-wasm.sh — this file is compiled with the
 * other shims and `_pqctoday_cms_init` is added to EXPORTED_FUNCTIONS.
 *
 * Idempotent — safe to call repeatedly; only the first call actually
 * loads the provider. Returns 0 on success, negative on error.
 *
 * Composite extension (added 2026-05): three more exports drive LAMPS
 * draft-19 composite signatures end-to-end. The openssl CLI cannot mint
 * / sign / verify composite CMS because the IMPORT path in
 * pkcs11-provider's composite.c needs a C pointer (no CLI surface). The
 * three exports below close that gap:
 *   _pqctoday_composite_mkcert  — self-signed cert with composite OID
 *   _pqctoday_composite_cms_sign — CMS SignedData with composite SignerInfo
 *   _pqctoday_composite_cms_verify — manual two-half verify per draft-19 §5
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/provider.h>
#include <openssl/err.h>
#include <openssl/evp.h>
#include <openssl/x509.h>
#include <openssl/pem.h>
#include <openssl/bio.h>
#include <openssl/cms.h>
#include <openssl/core_names.h>
#include <openssl/param_build.h>
#include <openssl/objects.h>
#include <openssl/asn1.h>

/* Symbol comes from libpkcs11-provider.a (renamed by -DOSSL_provider_init=p11prov_OSSL_provider_init). */
extern int p11prov_OSSL_provider_init(const void *handle,
                                      const void *in,
                                      const void **out,
                                      void **provctx);

/* Forward decls into pkcs11-provider's composite layer — see
 * pqctoday-hsm/src/vendor/pkcs11-provider/src/composite.h. We declare
 * the few symbols we need here rather than including composite.h
 * directly because that header transitively pulls in the provider's
 * config.h and internal struct definitions. */
struct p11prov_composite_profile;
typedef struct p11prov_ctx P11PROV_CTX;

extern const struct p11prov_composite_profile *
p11prov_composite_profile_by_oid(const char *oid);

extern EVP_PKEY *p11prov_composite_evp_pkey_from_uris(
    P11PROV_CTX *provctx,
    const struct p11prov_composite_profile *profile,
    const char *pq_uri,
    const char *classical_uri);

extern int p11prov_composite_build_mprime(
    const struct p11prov_composite_profile *profile,
    const unsigned char *msg, size_t msg_len,
    const unsigned char *ctx, size_t ctx_len,
    unsigned char *out, size_t *out_sz);

extern size_t p11prov_composite_profile_mldsa_pk_bytes(
    const struct p11prov_composite_profile *);
extern size_t p11prov_composite_profile_mldsa_sig_bytes(
    const struct p11prov_composite_profile *);
extern int p11prov_composite_profile_pre_hash_nid(
    const struct p11prov_composite_profile *);
extern const char *p11prov_composite_profile_label(
    const struct p11prov_composite_profile *);
extern const char *p11prov_composite_profile_signature_label(
    const struct p11prov_composite_profile *);
extern const char *p11prov_composite_profile_classical_alg_oid(
    const struct p11prov_composite_profile *);
extern int p11prov_composite_profile_mldsa_strength(
    const struct p11prov_composite_profile *);

static OSSL_PROVIDER *g_cms_pkcs11_provider = NULL;

/* OPENSSL_CONF stanza so pkcs11-provider picks up its module-path / pin
 * during init. `module = wasm:softhsmv3` is intercepted by
 * pkcs11_static_shim.c which returns the in-process softhsmv3 entry table
 * instead of dlopen'ing a file. */
static const char *PKCS11_CMS_CONF =
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

/* Exported entry point. Called from JS (the CMS worker) once per module instance.
 *
 * EXIT_RUNTIME=1 in the WASM build means each callMain() runs atexit handlers
 * which call OPENSSL_cleanup() — freeing all provider contexts including the
 * OSSL_PROVIDER pointed to by g_cms_pkcs11_provider. On the NEXT module
 * instance, g_cms_pkcs11_provider is a dangling (non-NULL!) pointer.  Using
 * OSSL_PROVIDER_available() instead of the raw pointer check is safe across
 * callMain boundaries because it re-checks the live provider store.
 *
 * Return codes:
 *    0 — provider registered and loaded successfully
 *   -1 — OSSL_PROVIDER_add_builtin failed
 *   -2 — could not write /ssl/pkcs11.cnf
 *   -3 — OSSL_LIB_CTX_load_config failed
 *   -4 — OSSL_PROVIDER_load failed
 *    1 — already initialized (no-op)
 */
int pqctoday_cms_init(void) {
    /* Idempotency guard: check the live provider store, not the potentially
     * stale g_cms_pkcs11_provider pointer (freed by atexit OPENSSL_cleanup). */
    if (OSSL_PROVIDER_available(NULL, "pkcs11")) {
        g_cms_pkcs11_provider = OSSL_PROVIDER_load(NULL, "pkcs11");
        return 1;
    }
    g_cms_pkcs11_provider = NULL;

    if (OSSL_PROVIDER_add_builtin(NULL, "pkcs11",
            (OSSL_provider_init_fn *)p11prov_OSSL_provider_init) != 1) {
        return -1;
    }

    FILE *f = fopen("/ssl/pkcs11.cnf", "w");
    if (!f) return -2;
    fputs(PKCS11_CMS_CONF, f);
    fclose(f);

    if (OSSL_LIB_CTX_load_config(NULL, "/ssl/pkcs11.cnf") != 1) {
        return -3;
    }

    g_cms_pkcs11_provider = OSSL_PROVIDER_load(NULL, "pkcs11");
    if (!g_cms_pkcs11_provider) return -4;

    return 0;
}

/* Reverse of init — releases the provider handle. Optional; runtime exit
 * will tear it down anyway. Returns 0 on success, -1 if not initialized. */
int pqctoday_cms_shutdown(void) {
    if (!g_cms_pkcs11_provider) return -1;
    OSSL_PROVIDER_unload(g_cms_pkcs11_provider);
    g_cms_pkcs11_provider = NULL;
    return 0;
}

/* ===========================================================================
 *  LAMPS composite signature shims — mint / sign / verify
 * =========================================================================
 *
 * All three shims share a small helper that resolves the pkcs11 provctx
 * and the composite profile by OID. Callers (the cms.worker.ts) must have
 * invoked pqctoday_cms_init() at least once before any of these run. */

struct composite_ctx {
    OSSL_PROVIDER *prov;     /* OSSL_PROVIDER_load handle — caller-owned */
    P11PROV_CTX *provctx;    /* opaque pkcs11-provider context */
    const struct p11prov_composite_profile *profile;
};

static int composite_setup(struct composite_ctx *cc, const char *oid)
{
    cc->prov = NULL;
    cc->provctx = NULL;
    cc->profile = NULL;

    cc->profile = p11prov_composite_profile_by_oid(oid);
    if (cc->profile == NULL) {
        return -10;
    }
    /* The provider must be loaded already (pqctoday_cms_init has run). */
    cc->prov = OSSL_PROVIDER_load(NULL, "pkcs11");
    if (cc->prov == NULL) {
        return -11;
    }
    cc->provctx = (P11PROV_CTX *)OSSL_PROVIDER_get0_provider_ctx(cc->prov);
    if (cc->provctx == NULL) {
        OSSL_PROVIDER_unload(cc->prov);
        cc->prov = NULL;
        return -12;
    }
    return 0;
}

static void composite_teardown(struct composite_ctx *cc)
{
    if (cc->prov != NULL) {
        OSSL_PROVIDER_unload(cc->prov);
        cc->prov = NULL;
    }
}

/* Read a whole file into a fresh buffer. Caller frees with free().
 * Returns 0 on success and populates *out / *out_len; negative on error. */
static int read_file_all(const char *path, unsigned char **out, size_t *out_len)
{
    FILE *f = fopen(path, "rb");
    if (f == NULL) {
        return -1;
    }
    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return -2;
    }
    long sz = ftell(f);
    if (sz < 0) {
        fclose(f);
        return -3;
    }
    if (fseek(f, 0, SEEK_SET) != 0) {
        fclose(f);
        return -4;
    }
    unsigned char *buf = (unsigned char *)malloc((size_t)sz + 1);
    if (buf == NULL) {
        fclose(f);
        return -5;
    }
    size_t got = fread(buf, 1, (size_t)sz, f);
    fclose(f);
    if (got != (size_t)sz) {
        free(buf);
        return -6;
    }
    buf[sz] = 0;
    *out = buf;
    *out_len = (size_t)sz;
    return 0;
}

static int write_file_all(const char *path,
                          const unsigned char *buf, size_t buf_len)
{
    FILE *f = fopen(path, "wb");
    if (f == NULL) {
        return -1;
    }
    size_t written = fwrite(buf, 1, buf_len, f);
    fclose(f);
    return written == buf_len ? 0 : -2;
}

/* ---------------------------------------------------------------------------
 * Shim 1: mint a self-signed composite cert.
 *
 *   - Loads both subkeys via their pkcs11: URIs.
 *   - Builds a composite EVP_PKEY via the pkcs11-provider bridge.
 *   - X509_sign() routes through composite.c's signature dispatch,
 *     producing a real composite-OID signature over the TBSCertificate.
 *   - Cert is written to out_path as PEM.
 *
 * Return codes:
 *    0  success
 *  -10 unknown composite OID
 *  -11 provider not loaded (call pqctoday_cms_init first)
 *  -12 could not get provctx
 *  -13 composite EVP_PKEY construction failed
 *  -14 X509_new failed
 *  -15 X509_set_pubkey failed
 *  -16 X509_sign failed (composite signature dispatch path errored)
 *  -17 could not open out_path for write
 *  -18 PEM_write_bio_X509 failed
 */
int pqctoday_composite_mkcert(const char *composite_oid,
                              const char *pq_uri,
                              const char *classical_uri,
                              const char *subject_cn,
                              int days,
                              const char *out_path)
{
    struct composite_ctx cc;
    fprintf(stderr, "[composite-mkcert] enter oid=%s pq=%s cl=%s cn=%s days=%d out=%s\n",
            composite_oid ? composite_oid : "(null)",
            pq_uri ? pq_uri : "(null)",
            classical_uri ? classical_uri : "(null)",
            subject_cn ? subject_cn : "(null)", days,
            out_path ? out_path : "(null)");
    int rc = composite_setup(&cc, composite_oid);
    if (rc != 0) {
        fprintf(stderr, "[composite-mkcert] composite_setup FAILED rc=%d\n", rc);
        return rc;
    }
    fprintf(stderr, "[composite-mkcert] composite_setup OK profile=%p\n", (void *)cc.profile);

    EVP_PKEY *pkey = NULL;
    X509 *cert = NULL;
    X509_NAME *name = NULL;
    BIO *out_bio = NULL;

    pkey = p11prov_composite_evp_pkey_from_uris(cc.provctx, cc.profile,
                                                pq_uri, classical_uri);
    if (pkey == NULL) {
        fprintf(stderr, "[composite-mkcert] evp_pkey_from_uris returned NULL\n");
        rc = -13;
        goto done;
    }
    fprintf(stderr, "[composite-mkcert] EVP_PKEY constructed\n");

    cert = X509_new();
    if (cert == NULL) {
        rc = -14;
        goto done;
    }
    fprintf(stderr, "[composite-mkcert] X509_new OK\n");
    X509_set_version(cert, 2L); /* v3 */
    ASN1_INTEGER_set(X509_get_serialNumber(cert), 1);
    X509_gmtime_adj(X509_get_notBefore(cert), 0);
    X509_gmtime_adj(X509_get_notAfter(cert),
                    (long)60L * 60L * 24L * (long)(days > 0 ? days : 30));

    name = X509_NAME_new();
    if (name != NULL && subject_cn != NULL) {
        X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_UTF8,
                                   (const unsigned char *)subject_cn,
                                   -1, -1, 0);
    }
    X509_set_subject_name(cert, name);
    X509_set_issuer_name(cert, name); /* self-signed */
    X509_NAME_free(name);
    name = NULL;
    fprintf(stderr, "[composite-mkcert] X509 setup done; calling set_pubkey\n");

    if (X509_set_pubkey(cert, pkey) != 1) {
        fprintf(stderr, "[composite-mkcert] X509_set_pubkey FAILED\n");
        ERR_print_errors_fp(stderr);
        rc = -15;
        goto done;
    }
    fprintf(stderr, "[composite-mkcert] X509_set_pubkey OK; calling X509_sign\n");

    /* X509_sign with NULL md — composite is a "pre-hash, then sign with
     * label-bound context" algorithm whose digest is internal to the
     * signature dispatch. OpenSSL handles md=NULL for non-digest algs. */
    int sign_ret = X509_sign(cert, pkey, NULL);
    fprintf(stderr, "[composite-mkcert] X509_sign returned %d\n", sign_ret);
    if (sign_ret <= 0) {
        ERR_print_errors_fp(stderr);
        rc = -16;
        goto done;
    }

    out_bio = BIO_new_file(out_path, "w");
    if (out_bio == NULL) {
        rc = -17;
        goto done;
    }
    if (PEM_write_bio_X509(out_bio, cert) != 1) {
        rc = -18;
        goto done;
    }
    rc = 0;

done:
    BIO_free(out_bio);
    X509_free(cert);
    EVP_PKEY_free(pkey);
    composite_teardown(&cc);
    return rc;
}

/* ---------------------------------------------------------------------------
 * Shim 2: sign a payload as CMS SignedData with a composite SignerInfo.
 *
 * Return codes:
 *    0  success
 *  -10 unknown composite OID
 *  -11 provider not loaded
 *  -12 could not get provctx
 *  -13 composite EVP_PKEY construction failed
 *  -20 could not read cert at cert_path
 *  -21 could not read payload at payload_path
 *  -22 CMS_sign failed
 *  -23 could not open out_p7m_path for write
 *  -24 i2d_CMS_bio failed
 */
int pqctoday_composite_cms_sign(const char *composite_oid,
                                const char *pq_uri,
                                const char *classical_uri,
                                const char *cert_path,
                                const char *payload_path,
                                const char *out_p7m_path)
{
    struct composite_ctx cc;
    fprintf(stderr,
            "[composite-cms-sign] enter oid=%s cert=%s payload=%s out=%s\n",
            composite_oid ? composite_oid : "(null)",
            cert_path ? cert_path : "(null)",
            payload_path ? payload_path : "(null)",
            out_p7m_path ? out_p7m_path : "(null)");
    int rc = composite_setup(&cc, composite_oid);
    if (rc != 0) {
        fprintf(stderr, "[composite-cms-sign] composite_setup FAILED rc=%d\n", rc);
        return rc;
    }
    fprintf(stderr, "[composite-cms-sign] composite_setup OK\n");

    EVP_PKEY *pkey = NULL;
    X509 *cert = NULL;
    BIO *cert_bio = NULL;
    BIO *payload_bio = NULL;
    BIO *out_bio = NULL;
    CMS_ContentInfo *cms = NULL;

    pkey = p11prov_composite_evp_pkey_from_uris(cc.provctx, cc.profile,
                                                pq_uri, classical_uri);
    if (pkey == NULL) {
        fprintf(stderr, "[composite-cms-sign] evp_pkey_from_uris NULL\n");
        rc = -13;
        goto done;
    }
    fprintf(stderr, "[composite-cms-sign] EVP_PKEY constructed\n");

    cert_bio = BIO_new_file(cert_path, "r");
    if (cert_bio == NULL) {
        fprintf(stderr, "[composite-cms-sign] BIO_new_file(cert) FAILED\n");
        ERR_print_errors_fp(stderr);
        rc = -20;
        goto done;
    }
    cert = PEM_read_bio_X509(cert_bio, NULL, NULL, NULL);
    if (cert == NULL) {
        fprintf(stderr, "[composite-cms-sign] PEM_read_bio_X509 FAILED\n");
        ERR_print_errors_fp(stderr);
        rc = -20;
        goto done;
    }
    fprintf(stderr, "[composite-cms-sign] cert loaded\n");

    payload_bio = BIO_new_file(payload_path, "rb");
    if (payload_bio == NULL) {
        fprintf(stderr, "[composite-cms-sign] BIO_new_file(payload) FAILED\n");
        ERR_print_errors_fp(stderr);
        rc = -21;
        goto done;
    }
    fprintf(stderr, "[composite-cms-sign] payload BIO opened; calling CMS_sign\n");
    /* Drain any pre-existing errors before CMS_sign so we can be sure the
     * stack only contains CMS_sign-specific failures afterward. */
    while (ERR_get_error() != 0) { /* drain */ }

    /* CMS_BINARY: treat payload as binary (no canonicalisation). No
     * CMS_DETACHED — eContent is embedded so verify can re-read the
     * exact bytes that were signed. */
    cms = CMS_sign(cert, pkey, NULL, payload_bio, CMS_BINARY);
    fprintf(stderr, "[composite-cms-sign] CMS_sign returned cms=%p\n", (void *)cms);
    if (cms == NULL) {
        /* Pop the OpenSSL error stack into stderr explicitly so we see
         * lib/reason codes even if ERR_print_errors_fp's buffering hides
         * them from the worker stderr mirror. */
        unsigned long err;
        int err_count = 0;
        while ((err = ERR_get_error()) != 0) {
            const char *lib = ERR_lib_error_string(err);
            const char *reason = ERR_reason_error_string(err);
            fprintf(stderr,
                    "[composite-cms-sign] ERR[%d]: 0x%08lx lib=%s reason=%s\n",
                    err_count++, err, lib ? lib : "(null)",
                    reason ? reason : "(null)");
        }
        if (err_count == 0) {
            fprintf(stderr, "[composite-cms-sign] CMS_sign NULL but error stack empty\n");
        }
        rc = -22;
        goto done;
    }

    out_bio = BIO_new_file(out_p7m_path, "wb");
    if (out_bio == NULL) {
        fprintf(stderr, "[composite-cms-sign] BIO_new_file(out) FAILED\n");
        rc = -23;
        goto done;
    }
    int i2d_rc = i2d_CMS_bio(out_bio, cms);
    fprintf(stderr, "[composite-cms-sign] i2d_CMS_bio returned %d\n", i2d_rc);
    if (i2d_rc != 1) {
        ERR_print_errors_fp(stderr);
        rc = -24;
        goto done;
    }
    rc = 0;
    fprintf(stderr, "[composite-cms-sign] SUCCESS\n");

done:
    BIO_free(out_bio);
    CMS_ContentInfo_free(cms);
    BIO_free(payload_bio);
    X509_free(cert);
    BIO_free(cert_bio);
    EVP_PKEY_free(pkey);
    composite_teardown(&cc);
    return rc;
}

/* ---------------------------------------------------------------------------
 * Shim 3: verify a composite CMS SignedData.
 *
 * pkcs11-provider has no SPKI decoder for composite keys, so CMS_verify()
 * cannot reconstruct the composite EVP_PKEY from the signer cert chain.
 * We perform the verify manually per draft-19 §5:
 *
 *   1. Load cert from cert_path; extract the SPKI BIT STRING bytes.
 *      Those are `mldsaPK || classicalPK` per draft-19 §4.1.
 *   2. Split the public-key concat using profile->mldsa_pk_bytes.
 *   3. Build a software EVP_PKEY for each half (ML-DSA via the raw_pub
 *      constructor; ECDSA / RSA via OSSL_PARAM fromdata).
 *   4. Load the .p7m, extract SignerInfo.signature bytes + the embedded
 *      eContent payload.
 *   5. Split the signature using profile->mldsa_sig_bytes.
 *   6. Compute M' over the eContent with p11prov_composite_build_mprime,
 *      passing the profile->signature_label as ctx (draft-19 §3.2).
 *   7. EVP_DigestVerify each half against M'. For ML-DSA we additionally
 *      set the OSSL_SIGNATURE_PARAM_CONTEXT_STRING param to
 *      profile->signature_label so the ML-DSA primitive runs with the
 *      same ctx used at sign time.
 *   8. On success write the eContent payload to out_payload_path and
 *      return 0.
 *
 * Return codes:
 *    0  success (both halves verified)
 *  -10 unknown composite OID
 *  -30 could not parse cert
 *  -31 SPKI parse / split failed
 *  -32 could not parse .p7m
 *  -33 unexpected number of SignerInfos (expected 1)
 *  -34 could not extract signature / payload from CMS
 *  -35 sig length mismatch (composite must be mldsa_sig_bytes + classical sig bytes)
 *  -36 M' build failed
 *  -37 ML-DSA software EVP_PKEY construction failed
 *  -38 classical software EVP_PKEY construction failed
 *  -39 ML-DSA half verify failed
 *  -40 classical half verify failed
 *  -41 could not write payload out_payload_path
 */
static EVP_PKEY *build_mldsa_pub_evp(OSSL_LIB_CTX *libctx, int strength,
                                     const unsigned char *raw, size_t raw_len)
{
    const char *name;
    switch (strength) {
    case 44: name = "ML-DSA-44"; break;
    case 65: name = "ML-DSA-65"; break;
    case 87: name = "ML-DSA-87"; break;
    default: return NULL;
    }
    /* OpenSSL 3.5+ exposes ML-DSA natively. raw_public_key_ex creates an
     * EVP_PKEY whose verifier we drive with EVP_DigestVerify below. */
    return EVP_PKEY_new_raw_public_key_ex(libctx, name, NULL, raw, raw_len);
}

static EVP_PKEY *build_ecdsa_pub_evp(OSSL_LIB_CTX *libctx,
                                     const unsigned char *raw_point,
                                     size_t raw_point_len)
{
    /* Curve selection by point length:
     *   65 bytes (0x04 || X32 || Y32) → P-256
     *   97 bytes (0x04 || X48 || Y48) → P-384 */
    const char *curve;
    if (raw_point_len == 65) {
        curve = "P-256";
    } else if (raw_point_len == 97) {
        curve = "P-384";
    } else {
        return NULL;
    }
    EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_from_name(libctx, "EC", NULL);
    if (pctx == NULL) return NULL;
    OSSL_PARAM params[3];
    params[0] = OSSL_PARAM_construct_utf8_string(
        OSSL_PKEY_PARAM_GROUP_NAME, (char *)curve, 0);
    params[1] = OSSL_PARAM_construct_octet_string(
        OSSL_PKEY_PARAM_PUB_KEY, (void *)raw_point, raw_point_len);
    params[2] = OSSL_PARAM_construct_end();
    EVP_PKEY *pkey = NULL;
    if (EVP_PKEY_fromdata_init(pctx) != 1
        || EVP_PKEY_fromdata(pctx, &pkey, EVP_PKEY_PUBLIC_KEY, params) != 1) {
        EVP_PKEY_free(pkey);
        pkey = NULL;
    }
    EVP_PKEY_CTX_free(pctx);
    return pkey;
}

static EVP_PKEY *build_rsa_pub_evp(OSSL_LIB_CTX *libctx,
                                   const unsigned char *rsa_pkcs1_der,
                                   size_t rsa_pkcs1_der_len)
{
    /* The DER blob is a PKCS#1 RSAPublicKey (NOT SPKI). Decode via
     * d2i_PublicKey with EVP_PKEY_RSA hint. */
    const unsigned char *p = rsa_pkcs1_der;
    EVP_PKEY *pkey = d2i_PublicKey(EVP_PKEY_RSA, NULL, &p, (long)rsa_pkcs1_der_len);
    (void)libctx;
    return pkey;
}

static int verify_half(EVP_PKEY *pkey, const char *mldsa_ctx,
                       const unsigned char *sig, size_t sig_len,
                       const unsigned char *mprime, size_t mprime_len)
{
    EVP_MD_CTX *mdctx = NULL;
    EVP_PKEY_CTX *pctx = NULL;
    int rc = 0;

    mdctx = EVP_MD_CTX_new();
    if (mdctx == NULL) return 0;

    OSSL_PARAM params[2];
    int nparams = 0;
    if (mldsa_ctx != NULL && mldsa_ctx[0] != 0) {
        params[nparams++] = OSSL_PARAM_construct_octet_string(
            OSSL_SIGNATURE_PARAM_CONTEXT_STRING,
            (void *)mldsa_ctx, strlen(mldsa_ctx));
    }
    params[nparams] = OSSL_PARAM_construct_end();

    /* md=NULL: signature alg includes its own pre-hash (ML-DSA pure mode
     * or classical signatures over a pre-computed M'). */
    if (EVP_DigestVerifyInit_ex(mdctx, &pctx, NULL, NULL, NULL, pkey,
                                nparams > 0 ? params : NULL) != 1) {
        goto done;
    }
    if (EVP_DigestVerify(mdctx, sig, sig_len, mprime, mprime_len) == 1) {
        rc = 1;
    }

done:
    EVP_MD_CTX_free(mdctx);
    return rc;
}

int pqctoday_composite_cms_verify(const char *composite_oid,
                                  const char *cert_path,
                                  const char *signed_p7m_path,
                                  const char *out_payload_path)
{
    struct composite_ctx cc;
    int rc = composite_setup(&cc, composite_oid);
    if (rc != 0) {
        return rc;
    }

    OSSL_LIB_CTX *libctx = NULL;
    BIO *cert_bio = NULL;
    BIO *p7m_bio = NULL;
    X509 *cert = NULL;
    CMS_ContentInfo *cms = NULL;
    EVP_PKEY *mldsa_pkey = NULL;
    EVP_PKEY *classical_pkey = NULL;
    unsigned char *mprime = NULL;
    BIO *content_bio = NULL;
    BIO *content_mem = NULL;
    unsigned char *content_buf = NULL;
    long content_len = 0;
    unsigned char *combined_sig = NULL;
    int combined_sig_len = 0;

    /* libctx — provider context's libctx. We bypass cc.provctx accessor
     * since it's opaque from this TU; use the default libctx (NULL) which
     * picks up the same provider config the worker loaded. */
    libctx = NULL;

    size_t mldsa_pk_bytes = p11prov_composite_profile_mldsa_pk_bytes(cc.profile);
    size_t mldsa_sig_bytes = p11prov_composite_profile_mldsa_sig_bytes(cc.profile);
    int mldsa_strength = p11prov_composite_profile_mldsa_strength(cc.profile);
    const char *sig_label = p11prov_composite_profile_signature_label(cc.profile);

    /* 1. Load + parse the cert. */
    cert_bio = BIO_new_file(cert_path, "r");
    if (cert_bio == NULL) { rc = -30; goto done; }
    cert = PEM_read_bio_X509(cert_bio, NULL, NULL, NULL);
    if (cert == NULL) { rc = -30; goto done; }

    /* 2. Extract SPKI BIT STRING bytes from the cert. */
    X509_PUBKEY *xpubkey = X509_get_X509_PUBKEY(cert);
    if (xpubkey == NULL) { rc = -31; goto done; }
    const unsigned char *spki_bytes = NULL;
    int spki_len = 0;
    ASN1_OBJECT *algoid_obj = NULL;
    if (X509_PUBKEY_get0_param(&algoid_obj, &spki_bytes, &spki_len, NULL,
                               xpubkey) != 1
        || spki_bytes == NULL || (size_t)spki_len <= mldsa_pk_bytes) {
        rc = -31;
        goto done;
    }
    size_t classical_pk_len = (size_t)spki_len - mldsa_pk_bytes;

    /* 3. Build software EVP_PKEYs for the two halves. */
    mldsa_pkey = build_mldsa_pub_evp(libctx, mldsa_strength,
                                     spki_bytes, mldsa_pk_bytes);
    if (mldsa_pkey == NULL) { rc = -37; goto done; }

    if (mldsa_strength == 44) {
        /* MLDSA44-RSA2048-PSS — classical half is PKCS#1 RSAPublicKey DER */
        classical_pkey = build_rsa_pub_evp(libctx,
                                           spki_bytes + mldsa_pk_bytes,
                                           classical_pk_len);
    } else {
        /* MLDSA65/87 — classical half is uncompressed X9.62 EC point */
        classical_pkey = build_ecdsa_pub_evp(libctx,
                                             spki_bytes + mldsa_pk_bytes,
                                             classical_pk_len);
    }
    if (classical_pkey == NULL) { rc = -38; goto done; }

    /* 4. Parse the CMS SignedData. */
    p7m_bio = BIO_new_file(signed_p7m_path, "rb");
    if (p7m_bio == NULL) { rc = -32; goto done; }
    cms = d2i_CMS_bio(p7m_bio, NULL);
    if (cms == NULL) { rc = -32; goto done; }

    /* 5. Extract the signer's signature bytes. CMS_verify-style API
     * exposes SignerInfo via STACK_OF(CMS_SignerInfo); composite produces
     * exactly one signer. */
    STACK_OF(CMS_SignerInfo) *sinfos = CMS_get0_SignerInfos(cms);
    if (sinfos == NULL || sk_CMS_SignerInfo_num(sinfos) != 1) {
        rc = -33;
        goto done;
    }
    CMS_SignerInfo *si = sk_CMS_SignerInfo_value(sinfos, 0);

    ASN1_OCTET_STRING *sig_os = CMS_SignerInfo_get0_signature(si);
    if (sig_os == NULL || sig_os->data == NULL) { rc = -34; goto done; }

    if ((size_t)sig_os->length <= mldsa_sig_bytes) {
        rc = -35;
        goto done;
    }
    size_t classical_sig_len = (size_t)sig_os->length - mldsa_sig_bytes;
    combined_sig = sig_os->data;
    combined_sig_len = sig_os->length;

    /* 6. Extract the eContent payload. CMS_get0_eContent returns the
     * embedded payload bytes when the eContent is present (non-detached). */
    {
        ASN1_OCTET_STRING **econ = CMS_get0_content(cms);
        if (econ == NULL || *econ == NULL) {
            rc = -34;
            goto done;
        }
        content_buf = (*econ)->data;
        content_len = (long)(*econ)->length;
    }

    /* 7. Compute M' over the content. */
    {
        const EVP_MD *md =
            EVP_get_digestbynid(p11prov_composite_profile_pre_hash_nid(cc.profile));
        if (md == NULL) { rc = -36; goto done; }
        size_t ph_size = (size_t)EVP_MD_get_size(md);
        size_t label_len = strlen(sig_label);
        size_t mprime_cap = 32 /* prefix */ + label_len + 1 + label_len + ph_size;
        mprime = (unsigned char *)malloc(mprime_cap);
        if (mprime == NULL) { rc = -36; goto done; }
        size_t mprime_len = mprime_cap;
        if (p11prov_composite_build_mprime(cc.profile,
                                           content_buf, (size_t)content_len,
                                           (const unsigned char *)sig_label,
                                           label_len,
                                           mprime, &mprime_len) != 1) {
            rc = -36;
            goto done;
        }
        /* 8. Verify both halves. */
        if (!verify_half(mldsa_pkey, sig_label,
                         combined_sig, mldsa_sig_bytes,
                         mprime, mprime_len)) {
            rc = -39;
            goto done;
        }
        if (!verify_half(classical_pkey, NULL,
                         combined_sig + mldsa_sig_bytes, classical_sig_len,
                         mprime, mprime_len)) {
            rc = -40;
            goto done;
        }
    }

    /* 9. Write payload out. */
    if (out_payload_path != NULL && out_payload_path[0] != 0) {
        if (write_file_all(out_payload_path,
                           content_buf, (size_t)content_len) != 0) {
            rc = -41;
            goto done;
        }
    }
    rc = 0;

done:
    free(mprime);
    BIO_free(content_mem);
    BIO_free(content_bio);
    CMS_ContentInfo_free(cms);
    BIO_free(p7m_bio);
    EVP_PKEY_free(classical_pkey);
    EVP_PKEY_free(mldsa_pkey);
    X509_free(cert);
    BIO_free(cert_bio);
    composite_teardown(&cc);
    return rc;
}
