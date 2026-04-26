/*
 * pkcs11_static_shim.c — Static softhsmv3 linker shim for OpenSSL TLS WASM build.
 *
 * pkcs11-provider's interface.c calls dlopen("pkcs11-module-path") at runtime
 * and then dlsym's "C_GetInterface" (PKCS#11 v3) or "C_GetFunctionList" (v2)
 * to bind to the underlying token. In the WASM build there is no dynamic
 * linker; softhsmv3 is statically archived into this same binary at link time.
 * This shim intercepts dlopen/dlsym/dlclose and routes them to the linked-in
 * softhsmv3 entry-point symbols.
 *
 * Mirrors the proven pattern at
 *   pqctoday-hsm/strongswan-wasm-v2-shims/pkcs11_static.c
 * which is in production use for the strongSwan VPN tool.
 *
 * Guard: only compiled under Emscripten.
 */

#ifdef __EMSCRIPTEN__

#include <dlfcn.h>
#include <stdint.h>
#include <string.h>

/* Minimal PKCS#11 typedefs — we never dereference these here, just forward
 * the raw symbol pointers. The full headers are visible to pkcs11-provider. */
typedef unsigned long CK_RV;
struct CK_FUNCTION_LIST;
struct CK_INTERFACE;
typedef struct CK_FUNCTION_LIST **CK_FUNCTION_LIST_PTR_PTR;

/* softhsmv3's statically-linked PKCS#11 v2 + v3 entry points.
 * Both symbols come from libsofthsmv3-static.a. */
extern CK_RV C_GetFunctionList(CK_FUNCTION_LIST_PTR_PTR ppFunctionList);
extern CK_RV C_GetInterface(unsigned char *pInterfaceName,
                            void *pVersion,
                            struct CK_INTERFACE **ppInterface,
                            unsigned long flags);
extern CK_RV C_GetInterfaceList(struct CK_INTERFACE *pInterfacesList,
                                unsigned long *pulCount);

/* Sentinel handle that pkcs11-provider passes back to dlsym/dlclose. Any
 * non-NULL value works; this one is mnemonic without being a valid hex. */
#define SOFTHSM_FAKE_HANDLE  ((void *)(uintptr_t)0x51050F03)  /* "SoftHsm3" */

/* Recognized PKCS#11 module name patterns. We match by substring on the
 * filename so the same shim works whether the OpenSSL conf points at
 * "/usr/lib/softhsm/libsofthsmv3.so", "wasm:softhsmv3", or just "softhsm". */
static int is_softhsm_path(const char *path) {
    if (!path) return 0;
    return strstr(path, "softhsm")    != NULL
        || strstr(path, "libpkcs11")  != NULL
        || strstr(path, "libsofthsm") != NULL
        /* WASM-internal sentinel path (set by tls_simulation.c). */
        || strcmp(path, "wasm:softhsmv3") == 0;
}

void *dlopen(const char *filename, int flags) {
    (void)flags;
    if (is_softhsm_path(filename)) {
        return SOFTHSM_FAKE_HANDLE;
    }
    return NULL;
}

void *dlsym(void *handle, const char *symbol) {
    if (handle != SOFTHSM_FAKE_HANDLE || !symbol) {
        return NULL;
    }
    if (strcmp(symbol, "C_GetFunctionList")  == 0) return (void *)C_GetFunctionList;
    if (strcmp(symbol, "C_GetInterface")     == 0) return (void *)C_GetInterface;
    if (strcmp(symbol, "C_GetInterfaceList") == 0) return (void *)C_GetInterfaceList;
    return NULL;
}

int dlclose(void *handle) {
    (void)handle;
    return 0;
}

/* dlerror() intentionally not overridden — Emscripten's libc provides one
 * that returns NULL for successful dl* calls, which matches our behavior.
 *
 * Single-threaded pthread surface (rwlock / mutex / etc.) is also intentionally
 * NOT supplied here: emcc's libc-debug.a ships library_pthread_stub.o, which
 * provides single-threaded no-op implementations of all pthread_* functions.
 * Linking pkcs11-provider against that gives us the correct behavior for
 * free, without the `--shared-memory` overhead that `-pthread` would force. */

#endif /* __EMSCRIPTEN__ */
