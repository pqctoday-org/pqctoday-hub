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
 */

#include <stdio.h>
#include <string.h>
#include <openssl/provider.h>
#include <openssl/err.h>

/* Symbol comes from libpkcs11-provider.a (renamed by -DOSSL_provider_init=p11prov_OSSL_provider_init). */
extern int p11prov_OSSL_provider_init(const void *handle,
                                      const void *in,
                                      const void **out,
                                      void **provctx);

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
