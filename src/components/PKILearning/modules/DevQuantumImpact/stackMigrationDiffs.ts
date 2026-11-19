// SPDX-License-Identifier: AGPL-3.0-only

export interface StackMigrationDiff {
  id: 'go' | 'openssl' | 'nodejs' | 'java'
  stackLabel: string
  runtimeFloor: string
  language: string
  summary: string
  sizeImpact: string
  beforeTitle: string
  beforeCode: string
  afterTitle: string
  afterCode: string
  apiCapability: string
  interopCaveats: string
  verificationBoundary: string
}

export const STACK_MIGRATION_DIFFS: readonly StackMigrationDiff[] = [
  {
    id: 'go',
    stackLabel: 'Go 1.24+',
    runtimeFloor: 'Go 1.24+ (crypto/mlkem, crypto/tls); Go 1.27+ for crypto/mldsa',
    language: 'Go',
    summary:
      'Replace symmetric X25519 ECDH with crypto/mlkem and unblock hybrid X25519MLKEM768 negotiation in crypto/tls.',
    sizeImpact:
      'ML-KEM-768: 1,184 B encapsulation key, 1,088 B ciphertext, 32 B shared secret (vs 32 B X25519 public key).',
    beforeTitle: 'Before (Classical X25519 + Pinned Classical TLS)',
    beforeCode: `import (
    "crypto/ecdh"
    "crypto/rand"
    "crypto/tls"
)

// Classical symmetric key agreement
priv, err := ecdh.X25519().GenerateKey(rand.Reader)
if err != nil { return err }
shared, err := priv.ECDH(peerPub)

// Explicit classical CurvePreferences disables hybrid PQC
tlsCfg := &tls.Config{
    MinVersion:       tls.VersionTLS13,
    CurvePreferences: []tls.CurveID{tls.X25519, tls.CurveP256},
}`,
    afterTitle: 'After (Go 1.24+ crypto/mlkem + X25519MLKEM768 Hybrid TLS)',
    afterCode: `import (
    "crypto/mlkem"
    "crypto/tls"
)

// ML-KEM-768 asymmetric encapsulation / decapsulation
dk, err := mlkem.GenerateKey768()
if err != nil { return err }
ek := dk.EncapsulationKey() // 1,184 bytes via ek.Bytes()
senderSecret, ciphertext := ek.Encapsulate() // 32 B secret, 1,088 B ct
receiverSecret, err := dk.Decapsulate(ciphertext)
if err != nil { return err }

// Hybrid TLS 1.3: prepend X25519MLKEM768 (or leave nil for Go 1.24+ default)
tlsCfg := &tls.Config{
    MinVersion:       tls.VersionTLS13,
    CurvePreferences: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256},
}`,
    apiCapability:
      'Pure Go stdlib with zero cgo. Go 1.24+ negotiates X25519MLKEM768 by default whenever CurvePreferences is nil, and crypto/mlkem provides ML-KEM-768 and ML-KEM-1024.',
    interopCaveats:
      'Keep tls.X25519 after tls.X25519MLKEM768 so classical-only peers fall back cleanly. Do not assume ML-KEM-512 (omitted from crypto/mlkem) or stdlib ML-DSA on Go < 1.27.',
    verificationBoundary:
      'Compiling this diff does not prove your services negotiate X25519MLKEM768 through corporate proxies or satisfy FIPS 140-3 requirements. Assert tls.ConnectionState.CurveID in staging tests and verify GOFIPS140 scope separately.',
  },
  {
    id: 'openssl',
    stackLabel: 'OpenSSL 3.5+',
    runtimeFloor: 'OpenSSL 3.5.0+ default provider (no oqsprovider required for FIPS 203/204/205)',
    language: 'C',
    summary:
      'Switch EVP keygen/signing from RSA+SHA-256 to one-shot pure ML-DSA-65, adopt EVP_PKEY_encapsulate for ML-KEM-768, and offer X25519MLKEM768 in TLS.',
    sizeImpact:
      'ML-DSA-65: 1,952 B public key, 3,309 B signature (vs 384 B RSA-3072). ML-KEM-768 ciphertext: 1,088 B.',
    beforeTitle: 'Before (Classical RSA-3072 + Classical TLS Groups)',
    beforeCode: `#include <openssl/evp.h>
#include <openssl/ssl.h>

EVP_PKEY *pkey = NULL;
EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_from_name(NULL, "RSA", NULL);
EVP_PKEY_keygen_init(ctx);
EVP_PKEY_CTX_set_rsa_keygen_bits(ctx, 3072);
EVP_PKEY_keygen(ctx, &pkey);

EVP_MD_CTX *mctx = EVP_MD_CTX_new();
EVP_DigestSignInit_ex(mctx, NULL, "SHA256", NULL, NULL, pkey, NULL);
EVP_DigestSignUpdate(mctx, msg, msg_len);
EVP_DigestSignFinal(mctx, sig, &sig_len);

SSL_CTX_set1_groups_list(ssl_ctx, "X25519:P-256");`,
    afterTitle: 'After (OpenSSL 3.5+ ML-DSA-65, ML-KEM-768 & Hybrid TLS)',
    afterCode: `#include <openssl/evp.h>
#include <openssl/ssl.h>

// 1. ML-DSA-65 keygen + one-shot pure signature (NULL digest)
EVP_PKEY *sig_key = NULL;
EVP_PKEY_CTX *sctx = EVP_PKEY_CTX_new_from_name(NULL, "ML-DSA-65", NULL);
if (!sctx || EVP_PKEY_keygen_init(sctx) != 1 || EVP_PKEY_keygen(sctx, &sig_key) != 1) { /* error */ }
EVP_MD_CTX *mctx = EVP_MD_CTX_new();
size_t sig_len = 0; // two-call size query (~3,309 bytes)
EVP_DigestSignInit_ex(mctx, NULL, NULL, NULL, NULL, sig_key, NULL);
EVP_DigestSign(mctx, NULL, &sig_len, msg, msg_len);
EVP_DigestSign(mctx, sig, &sig_len, msg, msg_len);

// 2. ML-KEM-768 encapsulation (1,088 B ct, 32 B shared secret)
EVP_PKEY_CTX *kctx = EVP_PKEY_CTX_new_from_pkey(NULL, peer_pub, NULL);
EVP_PKEY_encapsulate_init(kctx, NULL);
EVP_PKEY_encapsulate(kctx, NULL, &ct_len, NULL, &ss_len);
EVP_PKEY_encapsulate(kctx, ct, &ct_len, ss, &ss_len);

// 3. Hybrid TLS 1.3 group list with classical fallback
SSL_CTX_set1_groups_list(ssl_ctx, "X25519MLKEM768:X25519:P-256");`,
    apiCapability:
      'OpenSSL 3.5+ exposes ML-KEM, ML-DSA, and SLH-DSA in the default provider via standard EVP_PKEY and SSL_CTX APIs, and offers X25519MLKEM768 by default.',
    interopCaveats:
      'Pure ML-DSA requires one-shot EVP_DigestSign / EVP_DigestVerify with a NULL digest name (not streaming Update/Final with SHA-256). Check return values strictly (1 = valid on verify, 0 = invalid, other = error).',
    verificationBoundary:
      'This diff does not verify that your OS/container ships OpenSSL 3.5+, that your FIPS provider certificate approves ML-KEM/ML-DSA, or that fixed-size buffers in callers accommodate 3,309-byte signatures.',
  },
  {
    id: 'nodejs',
    stackLabel: 'Node.js 24+',
    runtimeFloor: 'Node.js 24+ (OpenSSL 3.5+ native KEM/DSA); 24.5.0+ default X25519MLKEM768 TLS',
    language: 'TypeScript',
    summary:
      'Move from symmetric createECDH / SHA-256 ECDSA to native node:crypto encapsulate/decapsulate and null-digest ML-DSA-65, plus hybrid node:tls groups.',
    sizeImpact:
      'ML-KEM-768: 1,088 B ciphertext, 32 B sharedKey. ML-DSA-65: 3,309 B signature (4,412 base64url chars in JWTs).',
    beforeTitle: 'Before (Classical ECDH + ECDSA + Pinned Classical TLS)',
    beforeCode: `import { createECDH, generateKeyPairSync, sign, verify } from 'node:crypto'
import tls from 'node:tls'

// Symmetric ECDH key exchange
const ecdh = createECDH('prime256v1')
ecdh.generateKeys()
const shared = ecdh.computeSecret(peerPubBytes)

// ECDSA P-256 signing with SHA-256
const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
})
const sig = sign('sha256', message, privateKey)
const valid = verify('sha256', message, publicKey, sig)

// Classical-only ecdhCurve blocks hybrid TLS
const server = tls.createServer({ key, cert, ecdhCurve: 'X25519:P-256' })`,
    afterTitle: 'After (Node.js 24+ Native node:crypto + Hybrid node:tls)',
    afterCode: `import {
  generateKeyPairSync,
  encapsulate,
  decapsulate,
  sign,
  verify,
} from 'node:crypto'
import tls from 'node:tls'

// 1. ML-KEM-768 encapsulation / decapsulation
const kem = generateKeyPairSync('ml-kem-768')
const { sharedKey, ciphertext } = encapsulate(kem.publicKey)
const recovered = decapsulate(kem.privateKey, ciphertext)

// 2. Pure ML-DSA-65 signing: pass null digest (3,309-byte signature)
const dsa = generateKeyPairSync('ml-dsa-65')
const sig = sign(null, message, dsa.privateKey)
const valid = verify(null, message, dsa.publicKey, sig)

// 3. Hybrid TLS 1.3: prepend X25519MLKEM768 (or leave default on 24.5.0+)
const server = tls.createServer({
  key,
  cert,
  ecdhCurve: 'X25519MLKEM768:X25519:P-256',
})`,
    apiCapability:
      'Node.js 24+ exposes OpenSSL 3.5+ ML-KEM and ML-DSA natively in node:crypto without third-party native addons. Node 24.5.0+ (and backported 22.20.0+) defaults to X25519MLKEM768 in node:tls.',
    interopCaveats:
      'ML-KEM decapsulation uses implicit rejection: corrupted ciphertext returns a pseudorandom 32-byte Buffer instead of throwing, so always authenticate ciphertext or check the AEAD tag before using recovered keys.',
    verificationBoundary:
      'This diff does not confirm your production containers run Node 24+ / OpenSSL 3.5+, that @types/node matches runtime overloads, or that HTTP cookie/header budgets fit 3,309-byte ML-DSA-65 JWT signatures.',
  },
  {
    id: 'java',
    stackLabel: 'Java 24+ JCA',
    runtimeFloor: 'JDK 24+, JDK 25 LTS, or Oracle JDK 21.0.13+ / 17.0.21+ (JEP 496 / JEP 497)',
    language: 'Java',
    summary:
      'Replace KeyAgreement ("XDH") with javax.crypto.KEM ("ML-KEM") and switch Signature from SHA256withRSA to ML-DSA-65 using standard JCA engines.',
    sizeImpact:
      'ML-KEM-768: 1,184 B raw ek, 1,088 B ciphertext. ML-DSA-65: 1,952 B raw pk, 3,309 B signature (plus X.509 SPKI DER overhead).',
    beforeTitle: 'Before (Classical X25519 KeyAgreement + RSA-3072 Signature)',
    beforeCode: `// Classical key agreement (XDH)
KeyPair xdhKp = KeyPairGenerator.getInstance("X25519").generateKeyPair();
KeyAgreement ka = KeyAgreement.getInstance("XDH");
ka.init(xdhKp.getPrivate());
ka.doPhase(peerPublicKey, true);
byte[] sharedSecret = ka.generateSecret();

// Classical RSA-3072 signature
KeyPairGenerator rsaKpg = KeyPairGenerator.getInstance("RSA");
rsaKpg.initialize(3072);
KeyPair rsaKp = rsaKpg.generateKeyPair();
Signature sig = Signature.getInstance("SHA256withRSA");
sig.initSign(rsaKp.getPrivate());
sig.update(message);
byte[] signature = sig.sign(); // 384 bytes`,
    afterTitle: 'After (JDK 24+ JCA ML-KEM-768 & ML-DSA-65)',
    afterCode: `// 1. ML-KEM-768 via javax.crypto.KEM (JEP 496)
KeyPair kemKp = KeyPairGenerator.getInstance("ML-KEM-768").generateKeyPair();
KEM kem = KEM.getInstance("ML-KEM");
KEM.Encapsulated enc = kem.newEncapsulator(kemKp.getPublic()).encapsulate();
byte[] ciphertext = enc.encapsulation();     // 1,088 bytes
SecretKey senderSecret = enc.key();          // 32 bytes
SecretKey receiverSecret = kem.newDecapsulator(kemKp.getPrivate())
    .decapsulate(ciphertext);

// 2. ML-DSA-65 via java.security.Signature (JEP 497)
KeyPair dsaKp = KeyPairGenerator.getInstance("ML-DSA-65").generateKeyPair();
Signature sig = Signature.getInstance("ML-DSA-65");
sig.initSign(dsaKp.getPrivate());
sig.update(message);
byte[] signature = sig.sign();               // 3,309 bytes`,
    apiCapability:
      'JEP 496 and JEP 497 ship ML-KEM and ML-DSA in the default JDK providers. Standard JCA Signature code changes only the algorithm string and key type, while KEM uses javax.crypto.KEM.',
    interopCaveats:
      'On JDK builds without JEP 496/497 (or when SLH-DSA is required), register Bouncy Castle ("BC") and handle NoSuchAlgorithmException explicitly. JSSE hybrid TLS (JEP 527) requires JDK 27 or Oracle JDK 25.0.5+.',
    verificationBoundary:
      'A local JCA round-trip does not validate PKCS#12/JKS keystore tooling, JSSE TLS peer interoperability, or FIPS 140-3 approval (BC-FIPS #4943 does not list ML-KEM or ML-DSA).',
  },
]
