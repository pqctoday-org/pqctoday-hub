// SPDX-License-Identifier: AGPL-3.0-only

export type CryptoOperation = 'keygen' | 'sign' | 'verify' | 'encrypt' | 'kem-encapsulate'

export interface CodeExample {
  apiId: string
  operation: CryptoOperation
  language: string
  algorithm: string
  code: string
  notes: string
}

export const OPERATION_LABELS: Record<CryptoOperation, string> = {
  keygen: 'Key Generation',
  sign: 'Sign',
  verify: 'Verify',
  encrypt: 'Encrypt',
  'kem-encapsulate': 'KEM Encapsulate',
}

export const CODE_EXAMPLES: CodeExample[] = [
  // Key Generation — ML-DSA-65
  {
    apiId: 'jca-jce',
    operation: 'keygen',
    language: 'Java',
    algorithm: 'ML-DSA-65',
    code: `// JCA/JCE — JDK 24+ built-in provider (JEP 497)
KeyPairGenerator kpg =
    KeyPairGenerator.getInstance("ML-DSA");
kpg.initialize(NamedParameterSpec.ML_DSA_65);
KeyPair kp = kpg.generateKeyPair();
PublicKey pub = kp.getPublic();
PrivateKey priv = kp.getPrivate();

// JDK 21 or earlier: register Bouncy Castle and use
// KeyPairGenerator.getInstance("ML-DSA-65", "BC")`,
    notes:
      'Built into JDK 24+, JDK 25 LTS and Oracle JDK 21.0.13 / 17.0.21 (October 2026). On a JDK without it, register the Bouncy Castle provider. Algorithm name is string-based.',
  },
  {
    apiId: 'openssl',
    operation: 'keygen',
    language: 'C',
    algorithm: 'ML-DSA-65',
    code: `#include <openssl/evp.h>

// OpenSSL 3.5+: caller owns the returned key, or receives NULL on failure.
EVP_PKEY *sample_generate_mldsa65_key(void) {
    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", NULL);
    EVP_PKEY *key = NULL;
    if (ctx == NULL || EVP_PKEY_keygen_init(ctx) != 1 ||
        EVP_PKEY_keygen(ctx, &key) != 1) {
        EVP_PKEY_free(key);
        key = NULL;
    }
    EVP_PKEY_CTX_free(ctx);
    return key;
}`,
    notes:
      'Native ML-DSA is available in the default provider from OpenSSL 3.5. Check the returned key before use and release it with EVP_PKEY_free. The signing and verification examples below use the pure ML-DSA one-shot interface; provider availability and operation mode must be checked for the selected algorithm.',
  },
  {
    apiId: 'pkcs11',
    operation: 'keygen',
    language: 'C',
    algorithm: 'ML-DSA-65',
    code: `// PKCS#11 v3.2 — ML-DSA key pair generation
CK_MECHANISM mech = {CKM_ML_DSA_KEY_PAIR_GEN, NULL, 0};
CK_ATTRIBUTE pubTmpl[] = {
    {CKA_TOKEN, &ckTrue, sizeof(CK_BBOOL)},
    {CKA_VERIFY, &ckTrue, sizeof(CK_BBOOL)},
    {CKA_ML_DSA_PARAMETER_SET,
     "ML-DSA-65", 9}
};
CK_ATTRIBUTE privTmpl[] = {
    {CKA_TOKEN, &ckTrue, sizeof(CK_BBOOL)},
    {CKA_SIGN, &ckTrue, sizeof(CK_BBOOL)},
    {CKA_SENSITIVE, &ckTrue, sizeof(CK_BBOOL)}
};
CK_OBJECT_HANDLE hPub, hPriv;
C_GenerateKeyPair(session, &mech,
    pubTmpl, 3, privTmpl, 3,
    &hPub, &hPriv);`,
    notes: 'Keys stored on HSM token. Handles are opaque — key material never exposed.',
  },
  {
    apiId: 'ksp-cng',
    operation: 'keygen',
    language: 'C',
    algorithm: 'ML-DSA-65',
    code: `// Windows CNG (BCrypt) — Windows 11 24H2+ / Server 2025
BCRYPT_ALG_HANDLE hAlg;
BCryptOpenAlgorithmProvider(&hAlg,
    BCRYPT_MLDSA_ALGORITHM, NULL, 0);

BCRYPT_KEY_HANDLE hKey;
BCryptGenerateKeyPair(hAlg, &hKey, 0, 0);
// Parameter set must be set before finalizing
BCryptSetProperty(hKey, BCRYPT_PARAMETER_SET_NAME,
    (PUCHAR)BCRYPT_MLDSA_PARAMETER_SET_65,
    sizeof(BCRYPT_MLDSA_PARAMETER_SET_65), 0);
BCryptFinalizeKeyPair(hKey, 0);`,
    notes:
      'ML-KEM and ML-DSA are generally available in the default CNG provider; SLH-DSA is defined but not implemented by it. Older Windows builds return STATUS_NOT_SUPPORTED. Use NCrypt with a KSP for persisted keys.',
  },
  {
    apiId: 'bouncy-castle',
    operation: 'keygen',
    language: 'Java',
    algorithm: 'ML-DSA-65',
    code: `// Bouncy Castle lightweight API (no JCA)
MLDSAKeyPairGenerator gen =
    new MLDSAKeyPairGenerator();
gen.init(new MLDSAKeyGenerationParameters(
    new SecureRandom(),
    MLDSAParameters.ml_dsa_65
));
AsymmetricCipherKeyPair kp =
    gen.generateKeyPair();

MLDSAPublicKeyParameters pub =
    (MLDSAPublicKeyParameters) kp.getPublic();
MLDSAPrivateKeyParameters priv =
    (MLDSAPrivateKeyParameters) kp.getPrivate();`,
    notes: 'Lightweight API — direct class instantiation, no provider registration.',
  },
  {
    apiId: 'bouncy-castle',
    operation: 'keygen',
    language: 'C#',
    algorithm: 'ML-DSA-65',
    code: `// Bouncy Castle C# — ML-DSA key generation
var gen = new MLDsaKeyPairGenerator();
gen.Init(new MLDsaKeyGenerationParameters(
    new SecureRandom(),
    MLDsaParameters.ML_DSA_65
));
var kp = gen.GenerateKeyPair();

var pub = (MLDsaPublicKeyParameters)kp.Public;
var priv = (MLDsaPrivateKeyParameters)kp.Private;`,
    notes: 'Identical pattern to Java Bouncy Castle — same API design in C#.',
  },

  // OpenSSL one-shot API reference: https://docs.openssl.org/3.5/man7/EVP_SIGNATURE-ML-DSA/
  // Sign — ML-DSA-65
  {
    apiId: 'jca-jce',
    operation: 'sign',
    language: 'Java',
    algorithm: 'ML-DSA-65',
    code: `// JCA/JCE signing with ML-DSA (JDK 24+)
// The parameter set comes from the key
Signature signer = Signature.getInstance("ML-DSA");
signer.initSign(privateKey);
signer.update(message);
byte[] signature = signer.sign();`,
    notes:
      'Same Signature engine calls as RSA or ECDSA; what changes is the algorithm name, the key type and the ~3.3 KB signature size your storage and protocols must carry.',
  },
  {
    apiId: 'openssl',
    operation: 'sign',
    language: 'C',
    algorithm: 'ML-DSA-65',
    code: `#include <openssl/evp.h>
#include <openssl/crypto.h>

// Pure ML-DSA-65: no external digest. Only 1 means a signature was produced.
// On success the caller owns *signature and releases it with OPENSSL_free.
int sample_sign_mldsa65(EVP_PKEY *key, const unsigned char *message,
                       size_t message_length, unsigned char **signature,
                       size_t *signature_length) {
    if (signature != NULL) *signature = NULL;
    if (signature_length != NULL) *signature_length = 0;
    if (signature == NULL || signature_length == NULL) return 0;
    if (key == NULL || message == NULL || !EVP_PKEY_is_a(key, "ML-DSA-65"))
        return 0;
    EVP_MD_CTX *ctx = EVP_MD_CTX_new();
    unsigned char *buffer = NULL;
    size_t length = 0;
    int ok = 0;
    if (ctx == NULL ||
        EVP_DigestSignInit_ex(ctx, NULL, NULL, NULL, NULL, key, NULL) != 1 ||
        EVP_DigestSign(ctx, NULL, &length, message, message_length) != 1 ||
        length == 0) goto done;
    buffer = OPENSSL_malloc(length);
    if (buffer == NULL ||
        EVP_DigestSign(ctx, buffer, &length, message, message_length) != 1 ||
        length == 0) goto done;
    *signature = buffer;
    *signature_length = length;
    buffer = NULL;
    ok = 1;
done:
    OPENSSL_free(buffer);
    EVP_MD_CTX_free(ctx);
    return ok;
}`,
    notes:
      'Use EVP_DigestSign with a NULL digest name for pure ML-DSA, rather than Update/Final streaming calls. The first one-shot call queries capacity; the second writes the signature. Check the result before using either output. This helper accepts only the declared ML-DSA-65 key type. Reference: OpenSSL 3.5 manual, EVP_SIGNATURE-ML-DSA, Notes section.',
  },
  {
    apiId: 'pkcs11',
    operation: 'sign',
    language: 'C',
    algorithm: 'ML-DSA-65',
    code: `// PKCS#11 signing with ML-DSA
CK_MECHANISM mech = {CKM_ML_DSA, NULL, 0};
C_SignInit(session, &mech, hPrivKey);

CK_ULONG sigLen;
C_Sign(session, msg, msgLen, NULL, &sigLen);
CK_BYTE_PTR sig = malloc(sigLen);
C_Sign(session, msg, msgLen, sig, &sigLen);`,
    notes:
      'HSM performs the signing operation internally. Whether the key can leave the token depends on its CKA_EXTRACTABLE/CKA_SENSITIVE attributes and token policy.',
  },

  // KEM Encapsulate — ML-KEM-768
  {
    apiId: 'jca-jce',
    operation: 'kem-encapsulate',
    language: 'Java',
    algorithm: 'ML-KEM-768',
    code: `// JCA/JCE KEM encapsulation — JDK 24+ ML-KEM (JEP 496)
KEM kem = KEM.getInstance("ML-KEM");

// Sender: encapsulate to the recipient's public key
KEM.Encapsulator enc = kem.newEncapsulator(publicKey);
KEM.Encapsulated e = enc.encapsulate();
byte[] ciphertext = e.encapsulation();
SecretKey sharedSecret = e.key();

// Receiver: decapsulate with the private key
KEM.Decapsulator dec = kem.newDecapsulator(privateKey);
SecretKey decSecret = dec.decapsulate(ciphertext);`,
    notes:
      'KEM is a new operation type — not sign or encrypt. The javax.crypto.KEM API arrived in JDK 21; the ML-KEM implementation behind it in JDK 24 (on JDK 21, use Bouncy Castle).',
  },
  {
    apiId: 'openssl',
    operation: 'kem-encapsulate',
    language: 'C',
    algorithm: 'ML-KEM-768',
    code: `// OpenSSL 3.x KEM encapsulation
EVP_PKEY_CTX *ctx =
    EVP_PKEY_CTX_new(recipientPubKey, NULL);
EVP_PKEY_encapsulate_init(ctx, NULL);

size_t ctLen, ssLen;
EVP_PKEY_encapsulate(ctx,
    NULL, &ctLen, NULL, &ssLen);
unsigned char *ct = OPENSSL_malloc(ctLen);
unsigned char *ss = OPENSSL_malloc(ssLen);
EVP_PKEY_encapsulate(ctx,
    ct, &ctLen, ss, &ssLen);
EVP_PKEY_CTX_free(ctx);`,
    notes:
      'EVP_PKEY_encapsulate arrived in OpenSSL 3.0; ML-KEM keys for it are native from OpenSSL 3.5.',
  },
  {
    apiId: 'pkcs11',
    operation: 'kem-encapsulate',
    language: 'C',
    algorithm: 'ML-KEM-768',
    code: `// PKCS#11 v3.2 KEM encapsulation
CK_MECHANISM mech = {
    CKM_ML_KEM, NULL, 0
};
CK_ATTRIBUTE deriveTmpl[] = {
    {CKA_CLASS, &secretClass,
     sizeof(CK_OBJECT_CLASS)},
    {CKA_KEY_TYPE, &aesType,
     sizeof(CK_KEY_TYPE)},
    {CKA_VALUE_LEN, &aesLen,
     sizeof(CK_ULONG)}
};
CK_ULONG ctLen;
CK_OBJECT_HANDLE hDerivedKey;
C_EncapsulateKey(session, &mech,
    hPubKey,
    deriveTmpl, 3,
    NULL, &ctLen,
    &hDerivedKey);
CK_BYTE_PTR ct = malloc(ctLen);
C_EncapsulateKey(session, &mech,
    hPubKey,
    deriveTmpl, 3,
    ct, &ctLen,
    &hDerivedKey);`,
    notes:
      'C_EncapsulateKey is new in PKCS#11 v3.2. Returns both ciphertext and a derived key handle.',
  },

  // Verify — ML-DSA-65
  {
    apiId: 'jca-jce',
    operation: 'verify',
    language: 'Java',
    algorithm: 'ML-DSA-65',
    code: `// JCA/JCE verification (JDK 24+)
Signature verifier = Signature.getInstance("ML-DSA");
verifier.initVerify(publicKey);
verifier.update(message);
boolean valid = verifier.verify(signature);`,
    notes: 'Returns boolean — no exception on invalid signature.',
  },
  {
    apiId: 'openssl',
    operation: 'verify',
    language: 'C',
    algorithm: 'ML-DSA-65',
    code: `#include <openssl/evp.h>

// A fresh context per check: 1 = valid, 0 = invalid, other values = error.
int sample_verify_mldsa65(EVP_PKEY *key, const unsigned char *message,
                         size_t message_length, const unsigned char *signature,
                         size_t signature_length) {
    if (key == NULL || message == NULL || signature == NULL ||
        !EVP_PKEY_is_a(key, "ML-DSA-65")) return -1;
    EVP_MD_CTX *ctx = EVP_MD_CTX_new();
    int result = -1;
    if (ctx != NULL &&
        EVP_DigestVerifyInit_ex(ctx, NULL, NULL, NULL, NULL, key, NULL) == 1)
        result = EVP_DigestVerify(ctx, signature, signature_length,
                                 message, message_length);
    EVP_MD_CTX_free(ctx);
    return result;
}`,
    notes:
      'Use the one-shot EVP_DigestVerify call for pure ML-DSA. Only return value 1 establishes a valid signature; 0 means invalid, and other values indicate an error, which can also include a malformed signature. Both the public key and message must belong to the intended check; changing either requires verification again.',
  },

  // Encrypt — AES-256-GCM (classical, for pattern comparison)
  {
    apiId: 'jca-jce',
    operation: 'encrypt',
    language: 'Java',
    algorithm: 'AES-256-GCM',
    code: `// JCA/JCE symmetric encryption
Cipher cipher = Cipher.getInstance(
    "AES/GCM/NoPadding"
);
GCMParameterSpec spec =
    new GCMParameterSpec(128, iv);
cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);
cipher.updateAAD(aad);
byte[] ciphertext = cipher.doFinal(plaintext);`,
    notes:
      'Symmetric encryption pattern is the same regardless of how the key was derived (classical or PQC KEM).',
  },
  {
    apiId: 'openssl',
    operation: 'encrypt',
    language: 'C',
    algorithm: 'AES-256-GCM',
    code: `// OpenSSL EVP symmetric encryption
EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
EVP_EncryptInit_ex(ctx,
    EVP_aes_256_gcm(), NULL, key, iv);
EVP_EncryptUpdate(ctx, NULL, &len, aad, aadLen);
EVP_EncryptUpdate(ctx, ct, &len, pt, ptLen);
EVP_EncryptFinal_ex(ctx, ct + len, &len);
EVP_CIPHER_CTX_ctrl(ctx,
    EVP_CTRL_GCM_GET_TAG, 16, tag);
EVP_CIPHER_CTX_free(ctx);`,
    notes: 'EVP_Encrypt* API handles all symmetric ciphers. Tag retrieval is GCM-specific.',
  },
]
