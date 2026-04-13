# SLH-DSA Module (FIPS 205)

The SLH-DSA module covers FIPS 205 (Stateless Hash-Based Digital Signature Standard), NIST's standardized stateless hash-based signature scheme. Unlike stateful schemes (LMS, XMSS), SLH-DSA requires no per-key state tracking — it can be safely deployed in distributed, serverless, and multi-instance environments. Security rests entirely on the collision resistance and second-preimage resistance of the underlying hash function (SHA-256, SHA-512, or SHAKE256), making it independent of any algebraic hardness assumption. The module covers the full FIPS 205 specification: WOTS+ one-time signatures, FORS few-time signatures, hypertree construction, the twelve parameter sets from Table 2, context strings for domain separation, deterministic signing mode, and the HashSLH-DSA pre-hash variant.

## Key Concepts

- SLH-DSA is stateless: each signing operation internally selects a fresh WOTS+ leaf using a pseudorandom index derived from the secret key and message, eliminating the state tracking burden of LMS/XMSS
- WOTS+ (Winternitz OTS Plus): one-time signature component; signs a message digest by hashing chains of n-byte values; the Winternitz parameter lg_w=4 is fixed in FIPS 205; chain lengths balance signature size vs. hash-round cost
- FORS (Forest of Random Subsets): the few-time signature layer between WOTS+ and the hypertree; signs a k-subset of values using a-level hash trees; parameters (k, a) directly control signature size and security against multi-target attacks
- Hypertree: d layers of Merkle trees each of height h/d; the bottom layer authenticates a FORS public key; higher layers each authenticate a WOTS+ public key; the root of the topmost tree is the SLH-DSA public key
- The s vs. f tradeoff: -s (small) variants use fewer hypertree layers (lower d) producing smaller signatures but requiring more hash rounds per layer; -f (fast) variants use more layers for faster signing at the cost of larger signatures
- FIPS 205 Table 2 defines twelve parameter sets across three security levels (NIST Levels 1, 3, 5) and two hash families (SHA-2, SHAKE), with signature sizes ranging from 7,856 B (SHA2-128s) to 49,856 B (SHAKE-256f)
- Context strings (FIPS 205 §9.2): an optional byte string bound into the signature; provides domain separation between protocols; verification with a different context string produces CKR_SIGNATURE_INVALID even for a valid (SK, M) pair
- Deterministic mode (FIPS 205 §10): when opt_rand is set to the zero byte string, signing is fully deterministic — identical inputs produce identical signatures; useful for audit and reproducibility at the cost of RNG-failure protection
- HashSLH-DSA (FIPS 205 §11): a pre-hash variant that accepts an already-hashed message; the pre-hash OID is embedded in the signed payload as M' = 0x01 || len(ctx) || ctx || OID_DER || H(M); context strings are NOT permitted in HashSLH-DSA mode
- Comparison with stateful schemes: SLH-DSA offers unlimited signings and zero state-management risk; LMS/XMSS offer smaller signatures (1.3–9 KB) and faster operations; CNSA 2.0 mandates LMS/XMSS for firmware signing and permits SLH-DSA as the stateless alternative

## Workshop Activities

- **Step 1 -- Key Generation & Parameter Explorer**: Generate SLH-DSA key pairs across all twelve FIPS 205 parameter sets; observe how n, h, d, k, a determine key size, signature size, and the security-performance tradeoff
- **Step 2 -- Sign & Verify (Pure + HashSLH-DSA)**: Sign messages with Pure SLH-DSA (CKM_SLH_DSA) and HashSLH-DSA (CKM_HASH_SLH_DSA_SHA256); observe the PKCS#11 mechanism change and the pre-hash payload construction
- **Step 3 -- Context Strings & Deterministic Mode**: Demonstrate context string domain separation (CKR_SIGNATURE_INVALID on context mismatch) and randomized vs. deterministic signing (identical output when opt_rand is zeroed)
- **Step 4 -- LMS vs XMSS vs SLH-DSA Comparison**: Side-by-side comparison of all three hash-based signature families on key size, signature size, signing speed, state requirement, and deployment model

## Related Standards

- FIPS 205 (SLH-DSA Stateless Hash-Based Digital Signature Standard, August 2024)
- FIPS 204 (ML-DSA, lattice-based alternative), SP 800-208 (LMS/XMSS stateful counterparts)
- PKCS#11 v3.2: CKM_SLH_DSA, CKM_HASH_SLH_DSA_SHA256, CKM_HASH_SLH_DSA_SHA384, CKM_HASH_SLH_DSA_SHA512, CKM_HASH_SLH_DSA_SHAKE128, CKM_HASH_SLH_DSA_SHAKE256
- CNSA 2.0 (NSA, September 2022): permits SLH-DSA as stateless alternative for signature use cases not requiring LMS/XMSS
- BSI TR-02102-1 (German Federal Office; recommends SLH-DSA-SHA2-192s or stronger for long-term security)
- ANSSI (French ANSSI PQC recommendations: SLH-DSA at NIST Level 3 or 5 for government use)
