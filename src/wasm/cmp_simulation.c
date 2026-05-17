/* SPDX-License-Identifier: GPL-3.0-only */
/*
 * cmp_simulation.c — In-process CMP client ↔ CMP server bridge.
 *
 * Mirrors the pattern in tls_simulation.c: both ends of a CMP exchange run in
 * the same WASM process, connected via OSSL_CMP_CTX_set_transfer_cb instead of
 * memory BIOs. The server is a real OSSL_CMP_SRV_CTX with a custom
 * process_cert_request callback that ACTUALLY ISSUES the certificate (parses
 * the CRMF cert template, builds an X509, signs it with the CA's ML-DSA-65
 * key) — NOT an echo of a pre-canned cert like OpenSSL's apps/lib/cmp_mock_srv.c.
 *
 * Exposed:
 *   char *execute_cmp_simulation(const char *ee_key_path,
 *                                const char *subject_dn,
 *                                const char *reference,
 *                                const char *secret,
 *                                const char *ca_cert_path,
 *                                const char *ca_key_path,
 *                                const char *out_cert_path);
 *
 * Returns a malloc'd JSON string: { "ok": bool, "transcript": [...], "error": "..." }.
 * Issued cert PEM is written to `out_cert_path` on the WASM FS; JS reads it back.
 */

#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <openssl/cmp.h>
#include <openssl/crmf.h>
#include <openssl/core_names.h>
#include <openssl/err.h>
#include <openssl/pem.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>
#include <openssl/rand.h>

/* ------------------------------------------------------------------------- *
 * Transcript / log buffer (resettable per call, JSON-safe)
 * ------------------------------------------------------------------------- */

#define LOG_CAP 16384
static char g_log[LOG_CAP];
static size_t g_log_used;

static void log_reset(void) {
    g_log[0] = '\0';
    g_log_used = 0;
}

static void log_json_escape_append(const char *s) {
    while (*s && g_log_used + 2 < LOG_CAP - 1) {
        unsigned char c = (unsigned char)*s++;
        if (c == '"' || c == '\\') {
            g_log[g_log_used++] = '\\';
            g_log[g_log_used++] = (char)c;
        } else if (c == '\n') {
            if (g_log_used + 2 < LOG_CAP - 1) {
                g_log[g_log_used++] = '\\';
                g_log[g_log_used++] = 'n';
            }
        } else if (c < 0x20) {
            char esc[8];
            int n = snprintf(esc, sizeof(esc), "\\u%04x", c);
            if (g_log_used + (size_t)n < LOG_CAP - 1) {
                memcpy(g_log + g_log_used, esc, (size_t)n);
                g_log_used += (size_t)n;
            }
        } else {
            g_log[g_log_used++] = (char)c;
        }
    }
    g_log[g_log_used] = '\0';
}

/* Append a single transcript entry. JSON array elements; caller manages commas. */
static int g_first_entry = 1;
static void log_event(const char *side, const char *event, const char *fmt, ...) {
    char detail[1024];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(detail, sizeof(detail), fmt, ap);
    va_end(ap);

    if (g_log_used + 64 + strlen(side) + strlen(event) + strlen(detail) >= LOG_CAP) return;
    if (!g_first_entry) {
        g_log[g_log_used++] = ',';
    }
    g_first_entry = 0;
    /* {"side":"...","event":"...","detail":"..."} */
    int n = snprintf(g_log + g_log_used, LOG_CAP - g_log_used,
                     "{\"side\":\"%s\",\"event\":\"%s\",\"detail\":\"", side, event);
    if (n < 0) return;
    g_log_used += (size_t)n;
    log_json_escape_append(detail);
    if (g_log_used + 3 < LOG_CAP) {
        g_log[g_log_used++] = '"';
        g_log[g_log_used++] = '}';
        g_log[g_log_used] = '\0';
    }
}

static void log_openssl_err(const char *where) {
    unsigned long e;
    char ebuf[256];
    while ((e = ERR_get_error()) != 0) {
        ERR_error_string_n(e, ebuf, sizeof(ebuf));
        log_event(where, "openssl_err", "%s", ebuf);
    }
}

/* ------------------------------------------------------------------------- *
 * PEM helpers
 * ------------------------------------------------------------------------- */

static X509 *load_x509_pem(const char *path) {
    BIO *b = BIO_new_file(path, "r");
    if (!b) return NULL;
    X509 *x = PEM_read_bio_X509(b, NULL, NULL, NULL);
    BIO_free(b);
    return x;
}

static EVP_PKEY *load_pkey_pem(const char *path) {
    BIO *b = BIO_new_file(path, "r");
    if (!b) return NULL;
    EVP_PKEY *k = PEM_read_bio_PrivateKey(b, NULL, NULL, NULL);
    BIO_free(b);
    return k;
}

static int write_x509_pem(const char *path, X509 *cert) {
    BIO *b = BIO_new_file(path, "w");
    if (!b) return 0;
    int ok = PEM_write_bio_X509(b, cert);
    BIO_free(b);
    return ok;
}

/* ------------------------------------------------------------------------- *
 * Server-side: real issuance callback
 * ------------------------------------------------------------------------- */

typedef struct {
    X509 *ca_cert;
    EVP_PKEY *ca_key;
} srv_state_t;

/*
 * process_cert_request — invoked by OSSL_CMP_SRV_process_request when the
 * server is handed an IR/CR/KUR. We extract the CertTemplate from the CRMF,
 * build a fresh X509 with the requested subject + pubkey, sign with the CA
 * key, and return it via *certOut. Returns NULL on success (status implied
 * "accepted"); a non-NULL OSSL_CMP_PKISI on rejection.
 */
static OSSL_CMP_PKISI *process_cert_request(OSSL_CMP_SRV_CTX *srv_ctx,
                                            const OSSL_CMP_MSG *cert_req,
                                            ossl_unused int certReqId,
                                            const OSSL_CRMF_MSG *crm,
                                            const X509_REQ *p10cr,
                                            X509 **certOut,
                                            STACK_OF(X509) **chainOut,
                                            STACK_OF(X509) **caPubs) {
    (void)cert_req;
    (void)p10cr;
    (void)chainOut;
    (void)caPubs;
    srv_state_t *st = (srv_state_t *)OSSL_CMP_SRV_CTX_get0_custom_ctx(srv_ctx);
    if (!st || !st->ca_cert || !st->ca_key) {
        log_event("server", "error", "missing CA materials");
        return NULL;
    }
    log_event("server", "cert_request_cb", "received CRMF, building cert from template");

    *certOut = NULL;
    X509 *new_cert = NULL;

    if (crm == NULL) {
        log_event("server", "error", "no CRMF in request");
        return NULL;
    }
    OSSL_CRMF_CERTTEMPLATE *tmpl = OSSL_CRMF_MSG_get0_tmpl(crm);
    if (!tmpl) {
        log_event("server", "error", "no cert template");
        return NULL;
    }

    X509_PUBKEY *req_pub = OSSL_CRMF_CERTTEMPLATE_get0_publicKey(tmpl);
    const X509_NAME *req_subj = OSSL_CRMF_CERTTEMPLATE_get0_subject(tmpl);
    if (!req_pub) {
        log_event("server", "error", "template has no publicKey");
        return NULL;
    }
    X509_NAME *subject = NULL;
    if (req_subj) {
        subject = X509_NAME_dup((X509_NAME *)req_subj);
        char sbuf[256];
        X509_NAME_oneline((X509_NAME *)req_subj, sbuf, sizeof(sbuf));
        log_event("server", "template_subject", "%s", sbuf);
    } else {
        subject = X509_NAME_new();
        X509_NAME_add_entry_by_txt(subject, "CN", MBSTRING_UTF8,
                                   (const unsigned char *)"Workshop EE (default)", -1, -1, 0);
        log_event("server", "template_subject", "(empty — using default CN=Workshop EE)");
    }

    new_cert = X509_new();
    if (!new_cert) {
        X509_NAME_free(subject);
        log_event("server", "error", "X509_new failed");
        log_openssl_err("server");
        return NULL;
    }

    unsigned char serial_bytes[8];
    if (RAND_bytes(serial_bytes, sizeof(serial_bytes)) != 1) {
        memset(serial_bytes, 0x42, sizeof(serial_bytes));
    }
    serial_bytes[0] &= 0x7f;
    ASN1_INTEGER *serial = ASN1_INTEGER_new();
    BIGNUM *bn = BN_bin2bn(serial_bytes, sizeof(serial_bytes), NULL);
    BN_to_ASN1_INTEGER(bn, serial);
    BN_free(bn);
    X509_set_serialNumber(new_cert, serial);
    char serhex[20] = {0};
    for (int i = 0; i < 8; i++) snprintf(serhex + i * 2, 3, "%02x", serial_bytes[i]);
    log_event("server", "assigned_serial", "0x%s", serhex);
    ASN1_INTEGER_free(serial);

    X509_set_version(new_cert, 2);
    X509_set_issuer_name(new_cert, X509_get_subject_name(st->ca_cert));
    X509_set_subject_name(new_cert, subject);
    X509_NAME_free(subject);

    X509_gmtime_adj(X509_getm_notBefore(new_cert), 0);
    X509_gmtime_adj(X509_getm_notAfter(new_cert), 60L * 60L * 24L * 365L);

    EVP_PKEY *req_pkey = X509_PUBKEY_get0(req_pub);
    if (!req_pkey) {
        X509_free(new_cert);
        log_event("server", "error", "X509_PUBKEY_get0 failed");
        log_openssl_err("server");
        return NULL;
    }
    if (X509_set_pubkey(new_cert, req_pkey) != 1) {
        X509_free(new_cert);
        log_event("server", "error", "X509_set_pubkey failed");
        log_openssl_err("server");
        return NULL;
    }

    if (X509_sign(new_cert, st->ca_key, NULL) == 0) {
        X509_free(new_cert);
        log_event("server", "error", "X509_sign failed");
        log_openssl_err("server");
        return NULL;
    }
    log_event("server", "signed", "issued cert signed with CA ML-DSA-65 key");

    *certOut = new_cert;
    /* IMPORTANT: cmp_server.c:277-278 treats a NULL return from this callback
     * as failure and aborts the whole exchange (response goes out unprotected,
     * client errors with "missing protection"). For SUCCESS we must return a
     * non-NULL PKISI with status=accepted. */
    OSSL_CMP_PKISI *ok_si = OSSL_CMP_STATUSINFO_new(OSSL_CMP_PKISTATUS_accepted, 0, NULL);
    if (!ok_si) {
        log_event("server", "error", "OSSL_CMP_STATUSINFO_new(accepted) failed");
        log_openssl_err("server");
    }
    return ok_si;
}

/* ------------------------------------------------------------------------- *
 * In-process transfer callback (client → server, no sockets)
 * ------------------------------------------------------------------------- */

static OSSL_CMP_MSG *transfer_cb(OSSL_CMP_CTX *ctx, const OSSL_CMP_MSG *req) {
    OSSL_CMP_SRV_CTX *srv_ctx = (OSSL_CMP_SRV_CTX *)OSSL_CMP_CTX_get_transfer_cb_arg(ctx);
    if (!srv_ctx) return NULL;
    log_event("client", "send", "transmitting PKIMessage to server (in-process)");
    OSSL_CMP_MSG *resp = OSSL_CMP_SRV_process_request(srv_ctx, req);
    log_event("client", "recv", resp ? "received PKIMessage response" : "no response from server");
    return resp;
}

/* ------------------------------------------------------------------------- *
 * Public: generate ML-DSA-65 self-signed CA root (bypasses CLI req -x509,
 * which breaks on ML-DSA because apps/req.c defaults to SHA256 hash-then-sign
 * and ML-DSA refuses non-NULL md). Writes key + cert PEMs to the given paths.
 * Returns malloc'd JSON: { "ok": bool, "error": "..." }.
 * ------------------------------------------------------------------------- */

char *generate_mock_ca_root(const char *alg_name,
                            const char *subject_dn,
                            const char *key_out_path,
                            const char *cert_out_path,
                            int days) {
    int ok = 0;
    const char *err = NULL;
    EVP_PKEY *pkey = NULL;
    X509 *cert = NULL;
    X509_NAME *name = NULL;
    BIO *kbio = NULL, *cbio = NULL;

    /* 1. Keygen via EVP API (no MD parameter, ML-DSA-friendly). */
    pkey = EVP_PKEY_Q_keygen(NULL, NULL, alg_name);
    if (!pkey) { err = "EVP_PKEY_Q_keygen failed"; goto done; }

    /* 2. Write private key as PEM. */
    kbio = BIO_new_file(key_out_path, "w");
    if (!kbio) { err = "open key file failed"; goto done; }
    if (PEM_write_bio_PrivateKey(kbio, pkey, NULL, NULL, 0, NULL, NULL) != 1) {
        err = "PEM_write_bio_PrivateKey failed"; goto done;
    }

    /* 3. Build a self-signed v3 cert. */
    cert = X509_new();
    if (!cert) { err = "X509_new failed"; goto done; }
    X509_set_version(cert, 2);

    ASN1_INTEGER *sn = ASN1_INTEGER_new();
    ASN1_INTEGER_set(sn, 1);
    X509_set_serialNumber(cert, sn);
    ASN1_INTEGER_free(sn);

    name = X509_NAME_new();
    const char *p = subject_dn;
    if (*p == '/') p++;
    while (*p) {
        const char *eq = strchr(p, '=');
        if (!eq) break;
        char attr[64]; size_t alen = (size_t)(eq - p);
        if (alen >= sizeof(attr)) alen = sizeof(attr) - 1;
        memcpy(attr, p, alen); attr[alen] = '\0';
        const char *vs = eq + 1; const char *ve = strchr(vs, '/');
        size_t vl = ve ? (size_t)(ve - vs) : strlen(vs);
        char val[256]; if (vl >= sizeof(val)) vl = sizeof(val) - 1;
        memcpy(val, vs, vl); val[vl] = '\0';
        X509_NAME_add_entry_by_txt(name, attr, MBSTRING_UTF8,
                                   (const unsigned char *)val, -1, -1, 0);
        if (!ve) break;
        p = ve + 1;
    }
    X509_set_subject_name(cert, name);
    X509_set_issuer_name(cert, name);

    X509_gmtime_adj(X509_getm_notBefore(cert), 0);
    X509_gmtime_adj(X509_getm_notAfter(cert), 60L * 60L * 24L * (long)days);

    X509_set_pubkey(cert, pkey);

    /* CA basic constraints + keyUsage for a proper CA root. */
    {
        BASIC_CONSTRAINTS *bc = BASIC_CONSTRAINTS_new();
        bc->ca = 1;
        X509_EXTENSION *ext = X509V3_EXT_i2d(NID_basic_constraints, 1, bc);
        if (ext) { X509_add_ext(cert, ext, -1); X509_EXTENSION_free(ext); }
        BASIC_CONSTRAINTS_free(bc);

        ASN1_BIT_STRING *ku = ASN1_BIT_STRING_new();
        /* keyCertSign | cRLSign */
        ASN1_BIT_STRING_set_bit(ku, 5, 1);
        ASN1_BIT_STRING_set_bit(ku, 6, 1);
        ext = X509V3_EXT_i2d(NID_key_usage, 1, ku);
        if (ext) { X509_add_ext(cert, ext, -1); X509_EXTENSION_free(ext); }
        ASN1_BIT_STRING_free(ku);
    }

    /* 4. Self-sign with NULL md — ML-DSA wants no hash. */
    if (X509_sign(cert, pkey, NULL) == 0) {
        err = "X509_sign (self) failed"; goto done;
    }

    /* 5. Write cert PEM. */
    cbio = BIO_new_file(cert_out_path, "w");
    if (!cbio) { err = "open cert file failed"; goto done; }
    if (PEM_write_bio_X509(cbio, cert) != 1) {
        err = "PEM_write_bio_X509 failed"; goto done;
    }

    ok = 1;
done:
    if (kbio) BIO_free(kbio);
    if (cbio) BIO_free(cbio);
    if (name) X509_NAME_free(name);
    if (cert) X509_free(cert);
    if (pkey) EVP_PKEY_free(pkey);

    char *out = (char *)malloc(256);
    if (!out) return NULL;
    if (ok) snprintf(out, 256, "{\"ok\":true}");
    else    snprintf(out, 256, "{\"ok\":false,\"error\":\"%s\"}", err ? err : "unknown");
    return out;
}

/* ------------------------------------------------------------------------- *
 * Public entry point
 * ------------------------------------------------------------------------- */

char *execute_cmp_simulation(const char *ee_key_path,
                             const char *subject_dn,
                             const char *reference,
                             const char *secret,
                             const char *ca_cert_path,
                             const char *ca_key_path,
                             const char *out_cert_path) {
    log_reset();
    g_first_entry = 1;

    int ok = 0;
    const char *err_short = NULL;
    X509 *ca_cert = NULL;
    EVP_PKEY *ca_key = NULL;
    EVP_PKEY *ee_key = NULL;
    X509_NAME *subj = NULL;
    X509_STORE *trust = NULL;
    OSSL_CMP_CTX *cctx = NULL;
    OSSL_CMP_SRV_CTX *sctx = NULL;
    X509 *issued = NULL;
    srv_state_t srv_state = {0};

    log_event("client", "start", "in-process CMP IR simulation");

    ca_cert = load_x509_pem(ca_cert_path);
    if (!ca_cert) {
        err_short = "load CA cert failed";
        log_event("client", "error", "load CA cert %s", ca_cert_path);
        log_openssl_err("client");
        goto done;
    }
    ca_key = load_pkey_pem(ca_key_path);
    if (!ca_key) {
        err_short = "load CA key failed";
        log_event("client", "error", "load CA key %s", ca_key_path);
        log_openssl_err("client");
        goto done;
    }
    ee_key = load_pkey_pem(ee_key_path);
    if (!ee_key) {
        err_short = "load EE key failed";
        log_event("client", "error", "load EE key %s", ee_key_path);
        log_openssl_err("client");
        goto done;
    }
    log_event("client", "loaded", "EE key + mock CA materials");

    sctx = OSSL_CMP_SRV_CTX_new(NULL, NULL);
    if (!sctx) {
        err_short = "OSSL_CMP_SRV_CTX_new failed";
        log_event("server", "error", "OSSL_CMP_SRV_CTX_new");
        log_openssl_err("server");
        goto done;
    }
    srv_state.ca_cert = ca_cert;
    srv_state.ca_key = ca_key;
    if (OSSL_CMP_SRV_CTX_init(sctx, &srv_state,
                              process_cert_request,
                              NULL, NULL, NULL, NULL, NULL) != 1) {
        err_short = "OSSL_CMP_SRV_CTX_init failed";
        log_event("server", "error", "OSSL_CMP_SRV_CTX_init");
        log_openssl_err("server");
        goto done;
    }
    OSSL_CMP_SRV_CTX_set_grant_implicit_confirm(sctx, 1);
    OSSL_CMP_SRV_CTX_set_send_unprotected_errors(sctx, 1);
    /* Accept RAVERIFIED POP — required for ML-KEM (and other non-signing key)
     * enrollment, where the client cannot sign the CRMF as proof-of-possession.
     * In production this requires an out-of-band trust path (e.g. an RA that
     * vetted the request); for this workshop the in-process server is the RA. */
    OSSL_CMP_SRV_CTX_set_accept_raverified(sctx, 1);
    {
        OSSL_CMP_CTX *srv_inner = OSSL_CMP_SRV_CTX_get0_cmp_ctx(sctx);
        if (srv_inner) {
            /* PBM-MAC only. Setting cert+pkey here would make libcrypto prefer
             * signature-based protection — that path tries to sign the IP
             * header with ML-DSA via EVP_DigestSign + a default md, ML-DSA
             * refuses, the response goes out unprotected, the client rejects
             * with "missing protection". So: just the shared secret here. */
            OSSL_CMP_CTX_set1_secretValue(srv_inner,
                                          (const unsigned char *)secret, (int)strlen(secret));
            OSSL_CMP_CTX_set1_referenceValue(srv_inner,
                                             (const unsigned char *)reference, (int)strlen(reference));
            /* When the server builds a response header, ossl_cmp_hdr_init picks
             * the sender DN from ctx->cert → ctx->oldCert → ctx->p10CSR →
             * ctx->subjectName (cmp_hdr.c:282-284). Since we deliberately left
             * cert/oldCert/p10CSR NULL, we set subjectName to the CA's subject
             * so the response sender matches what the client (which has srvCert
             * set) expects — otherwise the client rejects with
             * "unexpected sender". */
            OSSL_CMP_CTX_set1_subjectName(srv_inner, X509_get_subject_name(ca_cert));
        }
    }
    log_event("server", "configured", "PBM-MAC secret wired, sender DN aligned to CA subject, cert_request_cb installed");

    cctx = OSSL_CMP_CTX_new(NULL, NULL);
    if (!cctx) {
        err_short = "OSSL_CMP_CTX_new failed";
        log_event("client", "error", "OSSL_CMP_CTX_new");
        log_openssl_err("client");
        goto done;
    }
    /* Set srvCert: gives the client (a) a trust anchor for response validation
     * and (b) a recipient DN for outgoing requests. The server is configured
     * to use the same CA-cert subject as its sender (see srv_inner subjectName
     * below) so the sender check passes. */
    OSSL_CMP_CTX_set1_srvCert(cctx, ca_cert);
    OSSL_CMP_CTX_set1_secretValue(cctx, (const unsigned char *)secret, (int)strlen(secret));
    OSSL_CMP_CTX_set1_referenceValue(cctx, (const unsigned char *)reference, (int)strlen(reference));

    subj = X509_NAME_new();
    {
        const char *p = subject_dn;
        if (*p == '/') p++;
        while (*p) {
            const char *eq = strchr(p, '=');
            if (!eq) break;
            char attr[64];
            size_t alen = (size_t)(eq - p);
            if (alen >= sizeof(attr)) alen = sizeof(attr) - 1;
            memcpy(attr, p, alen);
            attr[alen] = '\0';
            const char *vstart = eq + 1;
            const char *vend = strchr(vstart, '/');
            size_t vlen = vend ? (size_t)(vend - vstart) : strlen(vstart);
            char val[256];
            if (vlen >= sizeof(val)) vlen = sizeof(val) - 1;
            memcpy(val, vstart, vlen);
            val[vlen] = '\0';
            X509_NAME_add_entry_by_txt(subj, attr, MBSTRING_UTF8,
                                       (const unsigned char *)val, -1, -1, 0);
            if (!vend) break;
            p = vend + 1;
        }
    }
    OSSL_CMP_CTX_set1_subjectName(cctx, subj);

    /* Detect whether the EE key can sign. ML-KEM (and any other pure KEM) has
     * no signing capability, so the OSSL_CRMF_POPO_SIGNATURE default would
     * fail at request-build time. For non-signing keys, accept the cert via
     * raVerified — the server's accept_raverified flag below tells it to
     * trust the request without verifying POP. (For real production CMP with
     * KEM keys, the right choice is encrCert POP per RFC 9810; we exercise
     * that round trip separately in the workshop's "encap/decap" panel.) */
    {
        int can_sign = 0;
        if (EVP_PKEY_is_a(ee_key, "ML-KEM-512")
            || EVP_PKEY_is_a(ee_key, "ML-KEM-768")
            || EVP_PKEY_is_a(ee_key, "ML-KEM-1024")
            || EVP_PKEY_is_a(ee_key, "X25519")
            || EVP_PKEY_is_a(ee_key, "X448")) {
            can_sign = 0;
        } else {
            can_sign = 1;
        }
        if (can_sign) {
            OSSL_CMP_CTX_set_option(cctx, OSSL_CMP_OPT_POPO_METHOD,
                                    OSSL_CRMF_POPO_SIGNATURE);
            log_event("client", "popo", "signature POP selected (signing key)");
        } else {
            OSSL_CMP_CTX_set_option(cctx, OSSL_CMP_OPT_POPO_METHOD,
                                    OSSL_CRMF_POPO_RAVERIFIED);
            /* Server must accept RAVERIFIED — set below before exec_IR_ses. */
            log_event("client", "popo", "raVerified POP selected (KEM key, can't sign)");
        }
    }

    OSSL_CMP_CTX_set0_newPkey(cctx, 1, ee_key);
    ee_key = NULL;

    trust = X509_STORE_new();
    X509_STORE_add_cert(trust, ca_cert);
    OSSL_CMP_CTX_set0_trustedStore(cctx, trust);
    trust = NULL;

    OSSL_CMP_CTX_set_transfer_cb(cctx, transfer_cb);
    OSSL_CMP_CTX_set_transfer_cb_arg(cctx, sctx);

    /* Ask the server to grant IMPLICIT_CONFIRM in the IR, so the exchange ends
     * after the IP and we don't follow up with certConf / pkiconf. The server
     * is already configured with OSSL_CMP_SRV_CTX_set_grant_implicit_confirm,
     * but it only grants when the CLIENT request header asks for it
     * (cmp_server.c:282-288). Without this we'd need a process_certConf
     * callback on the server too — easier to just skip the round trip. */
    OSSL_CMP_CTX_set_option(cctx, OSSL_CMP_OPT_IMPLICIT_CONFIRM, 1);
    log_event("client", "configured", "CTX ready, transfer_cb → in-process server, implicit-confirm requested");

    log_event("client", "ir_send", "calling OSSL_CMP_exec_IR_ses");
    issued = OSSL_CMP_exec_IR_ses(cctx);
    if (!issued) {
        int s = OSSL_CMP_CTX_get_status(cctx);
        err_short = "OSSL_CMP_exec_IR_ses returned NULL";
        log_event("client", "error", "exec_IR_ses NULL, status=%d", s);
        log_openssl_err("client");
        goto done;
    }
    log_event("client", "validated", "IP response validated against trust store");

    if (!write_x509_pem(out_cert_path, issued)) {
        err_short = "write issued cert failed";
        log_event("client", "error", "write cert to %s", out_cert_path);
        log_openssl_err("client");
        goto done;
    }
    log_event("client", "wrote_cert", "issued cert PEM at %s", out_cert_path);
    ok = 1;

done:
    if (issued) X509_free(issued);
    if (cctx) OSSL_CMP_CTX_free(cctx);
    if (sctx) OSSL_CMP_SRV_CTX_free(sctx);
    if (subj) X509_NAME_free(subj);
    if (trust) X509_STORE_free(trust);
    if (ee_key) EVP_PKEY_free(ee_key);
    if (ca_key) EVP_PKEY_free(ca_key);
    if (ca_cert) X509_free(ca_cert);

    /* Build final JSON: { "ok": bool, "error": "...", "transcript": [...], "certPath": "..." } */
    size_t needed = strlen(g_log) + 256;
    char *out = (char *)malloc(needed);
    if (!out) return NULL;
    if (ok) {
        snprintf(out, needed,
                 "{\"ok\":true,\"certPath\":\"%s\",\"transcript\":[%s]}",
                 out_cert_path, g_log);
    } else {
        snprintf(out, needed,
                 "{\"ok\":false,\"error\":\"%s\",\"transcript\":[%s]}",
                 err_short ? err_short : "unknown", g_log);
    }
    return out;
}
