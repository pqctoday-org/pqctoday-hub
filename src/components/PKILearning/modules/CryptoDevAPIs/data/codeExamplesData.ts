// SPDX-License-Identifier: GPL-3.0-only

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
      'Built into JDK 24+ (first LTS: JDK 25). On JDK 21, register the Bouncy Castle provider. Algorithm name is string-based.',
  },
  {
    apiId: 'openssl',
    operation: 'keygen',
    language: 'C',
    algorithm: 'ML-DSA-65',
    code: `// OpenSSL 3.5+ — ML-DSA is in the default provider
EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(
    NULL, "ML-DSA-65", NULL
);
EVP_PKEY_keygen_init(ctx);
EVP_PKEY *pkey = NULL;
EVP_PKEY_keygen(ctx, &pkey);

EVP_PKEY_CTX_free(ctx);
// pkey now holds ML-DSA-65 key pair`,
    notes:
      'Native since OpenSSL 3.5. oqsprovider is only needed on OpenSSL before 3.5 or for non-standardised algorithms. EVP API is algorithm-agnostic.',
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
    code: `// OpenSSL EVP signing with ML-DSA-65
EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
EVP_DigestSignInit(mdctx, NULL, NULL,
    NULL, pkey);
EVP_DigestSignUpdate(mdctx, msg, msgLen);
size_t sigLen;
EVP_DigestSignFinal(mdctx, NULL, &sigLen);
unsigned char *sig = OPENSSL_malloc(sigLen);
EVP_DigestSignFinal(mdctx, sig, &sigLen);
EVP_MD_CTX_free(mdctx);`,
    notes:
      'EVP_DigestSign* works for all asymmetric signature algorithms. Two-call pattern for buffer sizing.',
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
    notes: 'HSM performs the signing operation internally. Private key never leaves hardware.',
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
    code: `// OpenSSL EVP verification
EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
EVP_DigestVerifyInit(mdctx, NULL, NULL,
    NULL, pkey);
EVP_DigestVerifyUpdate(mdctx, msg, msgLen);
int rc = EVP_DigestVerifyFinal(
    mdctx, sig, sigLen);
// rc == 1: valid, rc == 0: invalid
EVP_MD_CTX_free(mdctx);`,
    notes: 'Return code 1 = valid, 0 = invalid, < 0 = error.',
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
