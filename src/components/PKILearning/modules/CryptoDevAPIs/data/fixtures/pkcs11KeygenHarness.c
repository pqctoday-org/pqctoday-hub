/* SPDX-License-Identifier: AGPL-3.0-only */
/* Native test fixture: only an explicitly supplied, task-private in-memory module.
 * No persistence configuration, token discovery or private-value extraction. */
#include "example-under-test.inc"
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static CK_FUNCTION_LIST_PTR api;
static CK_SESSION_HANDLE session = CK_INVALID_HANDLE;
static CK_OBJECT_HANDLE pub = CK_INVALID_HANDLE, priv = CK_INVALID_HANDLE;
static CK_OBJECT_HANDLE wrong_pub = CK_INVALID_HANDLE, wrong_priv = CK_INVALID_HANDLE;
static const char *stage = "load";
static CK_RV rv = CKR_GENERAL_ERROR;
#define CHECK(call) do { stage = #call; rv = (call); if (rv != CKR_OK) goto done; } while (0)

static int destroy_pair(void) {
    int ok = 1;
    if (priv != CK_INVALID_HANDLE) {
        if (api->C_DestroyObject(session, priv) != CKR_OK) ok = 0;
        priv = CK_INVALID_HANDLE;
    }
    if (pub != CK_INVALID_HANDLE) {
        if (api->C_DestroyObject(session, pub) != CKR_OK) ok = 0;
        pub = CK_INVALID_HANDLE;
    }
    if (wrong_priv != CK_INVALID_HANDLE && api->C_DestroyObject(session, wrong_priv) != CKR_OK) ok = 0;
    if (wrong_pub != CK_INVALID_HANDLE && api->C_DestroyObject(session, wrong_pub) != CKR_OK) ok = 0;
    return ok;
}

int main(int argc, char **argv) {
    void *library = NULL;
    CK_C_GetFunctionList get_list;
    CK_C_GetInterface get_interface;
    CK_INTERFACE_PTR interface = NULL_PTR;
    CK_VERSION wanted = {3, 2};
    CK_INFO info;
    CK_TOKEN_INFO token;
    CK_MECHANISM_INFO mechanism_info;
    CK_UTF8CHAR label[32];
    CK_UTF8CHAR so_pin[] = "sample-so-1234", user_pin[] = "sample-user-1234";
    CK_BBOOL yes = CK_TRUE;
    CK_ML_DSA_PARAMETER_SET_TYPE actual = 0, private_parameter = 0, parameter = CKP_ML_DSA_65;
    CK_ATTRIBUTE attrs[] = {{CKA_PARAMETER_SET, &actual, sizeof(actual)}, {CKA_VALUE, NULL_PTR, 0}};
    CK_ULONG public_size = 0, signature_size = 0;
    CK_BYTE *signature = NULL;
    CK_BYTE message[] = "fictional PKCS11 sample";
    CK_MECHANISM sign_mechanism = {CKM_ML_DSA, NULL_PTR, 0};
    int initialized = 0, logged = 0, status = 1, message_rejected = 0, signature_rejected = 0, wrong_key_rejected = 0;
    const char *mode = argc == 3 ? argv[2] : "valid";
    if (argc < 2 || argc > 3 || getenv("SOFTHSMRUST_STATE_FILE") != NULL ||
        getenv("SOFTHSMRUST_SLOTS") != NULL) return 2;
    library = dlopen(argv[1], RTLD_NOW | RTLD_LOCAL);
    if (library == NULL) { fprintf(stderr, "module unavailable: %s\n", dlerror()); goto done; }
    get_list = (CK_C_GetFunctionList)dlsym(library, "C_GetFunctionList");
    get_interface = (CK_C_GetInterface)dlsym(library, "C_GetInterface");
    if (get_list == NULL || get_interface == NULL) goto done;
    CHECK(get_list(&api));
    CHECK(get_interface(NULL_PTR, &wanted, &interface, 0));
    if (interface == NULL_PTR || interface->pFunctionList == NULL_PTR) goto done;
    CHECK(api->C_Initialize(NULL_PTR)); initialized = 1;
    CHECK(api->C_GetInfo(&info));
    CHECK(api->C_GetMechanismInfo(0, CKM_ML_DSA_KEY_PAIR_GEN, &mechanism_info));
    CHECK(api->C_GetTokenInfo(0, &token));
    stage = "fresh process-local token required";
    if ((token.flags & CKF_TOKEN_INITIALIZED) != 0) goto done;
    memset(label, ' ', sizeof(label)); memcpy(label, "Fictional sample only", 20);
    CHECK(api->C_InitToken(0, so_pin, sizeof(so_pin) - 1, label));
    CHECK(api->C_OpenSession(0, CKF_SERIAL_SESSION | CKF_RW_SESSION, NULL_PTR, NULL_PTR, &session));
    CHECK(api->C_Login(session, CKU_SO, so_pin, sizeof(so_pin) - 1)); logged = 1;
    CHECK(api->C_InitPIN(session, user_pin, sizeof(user_pin) - 1));
    CHECK(api->C_Logout(session)); logged = 0;
    CHECK(api->C_Login(session, CKU_USER, user_pin, sizeof(user_pin) - 1)); logged = 1;
    if (strcmp(mode, "valid") == 0) {
        CHECK(generate_sample_mldsa65(api, session, &pub, &priv));
    } else {
        CK_MECHANISM mechanism = {CKM_ML_DSA_KEY_PAIR_GEN, NULL_PTR, 0};
        CK_ATTRIBUTE public_template[] = {
            {CKA_TOKEN, &yes, sizeof(yes)}, {CKA_VERIFY, &yes, sizeof(yes)},
            {CKA_PARAMETER_SET, &parameter, sizeof(parameter)}
        };
        CK_ATTRIBUTE private_template[] = {
            {CKA_TOKEN, &yes, sizeof(yes)}, {CKA_SIGN, &yes, sizeof(yes)},
            {CKA_SENSITIVE, &yes, sizeof(yes)}
        };
        CK_ULONG count = 3;
        if (strcmp(mode, "wrong-valid-44") == 0) parameter = CKP_ML_DSA_44;
        else if (strcmp(mode, "unsupported") == 0) parameter = 999;
        else if (strcmp(mode, "short") == 0) public_template[2].ulValueLen = 1;
        else if (strcmp(mode, "string") == 0) {
            public_template[2].pValue = "ML-DSA-65"; public_template[2].ulValueLen = 9;
        } else if (strcmp(mode, "missing") == 0) count = 2;
        else { stage = "unknown fixture mode"; goto done; }
        stage = "contrary key generation";
        rv = api->C_GenerateKeyPair(session, &mechanism, public_template, count,
                                  private_template, 3, &pub, &priv);
        if (rv != CKR_OK) {
            printf("{\"mode\":\"%s\",\"generationRv\":%lu,\"declared65\":false}\n", mode, rv);
            status = 0; goto done;
        }
    }
    CHECK(api->C_GetAttributeValue(session, pub, attrs, 2));
    public_size = attrs[1].ulValueLen;
    if (strcmp(mode, "valid") != 0) {
        printf("{\"mode\":\"%s\",\"generationRv\":0,\"parameter\":%lu,\"publicBytes\":%lu,\"declared65\":%s}\n",
               mode, actual, public_size, actual == CKP_ML_DSA_65 && public_size == 1952 ? "true" : "false");
        status = 0; goto done;
    }
    stage = "ML-DSA-65 numeric parameter and public length";
    if (attrs[0].ulValueLen != sizeof(actual) || actual != CKP_ML_DSA_65 || public_size != 1952) goto done;
    {
        CK_ATTRIBUTE private_attribute = {CKA_PARAMETER_SET, &private_parameter, sizeof(private_parameter)};
        CHECK(api->C_GetAttributeValue(session, priv, &private_attribute, 1));
        stage = "inherited private parameter";
        if (private_parameter != CKP_ML_DSA_65 || private_attribute.ulValueLen != sizeof(private_parameter)) goto done;
    }
    CHECK(api->C_SignInit(session, &sign_mechanism, priv));
    CHECK(api->C_Sign(session, message, sizeof(message) - 1, NULL_PTR, &signature_size));
    signature = malloc(signature_size);
    if (signature == NULL) goto done;
    CHECK(api->C_Sign(session, message, sizeof(message) - 1, signature, &signature_size));
    CHECK(api->C_VerifyInit(session, &sign_mechanism, pub));
    CHECK(api->C_Verify(session, message, sizeof(message) - 1, signature, signature_size));
    CHECK(generate_sample_mldsa65(api, session, &wrong_pub, &wrong_priv));
    CHECK(api->C_VerifyInit(session, &sign_mechanism, wrong_pub));
    rv = api->C_Verify(session, message, sizeof(message) - 1, signature, signature_size);
    wrong_key_rejected = rv == CKR_SIGNATURE_INVALID;
    message[0] ^= 1;
    CHECK(api->C_VerifyInit(session, &sign_mechanism, pub));
    rv = api->C_Verify(session, message, sizeof(message) - 1, signature, signature_size);
    message_rejected = rv == CKR_SIGNATURE_INVALID; message[0] ^= 1;
    signature[0] ^= 1;
    CHECK(api->C_VerifyInit(session, &sign_mechanism, pub));
    rv = api->C_Verify(session, message, sizeof(message) - 1, signature, signature_size);
    signature_rejected = rv == CKR_SIGNATURE_INVALID;
    stage = "changed message/signature rejection";
    if (!message_rejected || !signature_rejected || !wrong_key_rejected) goto done;
    printf("{\"mode\":\"valid\",\"generationRv\":0,\"parameter\":%lu,\"privateParameter\":%lu,\"publicBytes\":%lu,\"signatureBytes\":%lu,\"ulongBytes\":%lu,\"declared65\":true,\"verified\":true,\"changedMessageRejected\":true,\"changedSignatureRejected\":true,\"wrongKeyRejected\":true}\n",
           actual, private_parameter, public_size, signature_size, (unsigned long)sizeof(CK_ULONG));
    status = 0;
done:
    free(signature);
    if (api != NULL_PTR && session != CK_INVALID_HANDLE) {
        if (!destroy_pair()) status = 1;
        if (logged && api->C_Logout(session) != CKR_OK) status = 1;
        if (api->C_CloseSession(session) != CKR_OK) status = 1;
    }
    if (initialized && api->C_Finalize(NULL_PTR) != CKR_OK) status = 1;
    if (library != NULL && dlclose(library) != 0) status = 1;
    if (status != 0) fprintf(stderr, "failed at %s; CK_RV=0x%lx\n", stage, rv);
    return status;
}
