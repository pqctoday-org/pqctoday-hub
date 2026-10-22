# SLH-DSA Module (FIPS 205)

The SLH-DSA module covers FIPS 205 (Stateless Hash-Based Digital Signature Standard), NIST's standardized stateless hash-based signature scheme. Unlike stateful schemes (LMS, XMSS), SLH-DSA requires no per-key state tracking — it can be safely deployed in distributed, serverless, and multi-instance environments. Security rests entirely on the collision resistance and second-preimage resistance of the underlying hash function (SHA-256, SHA-512, or SHAKE256), making it independent of any algebraic hardness assumption. The module covers the full FIPS 205 specification: WOTS+ one-time signatures, FORS few-time signatures, hypertree construction, the twelve parameter sets from Table 2, context strings for domain separation, deterministic signing mode, and the HashSLH-DSA pre-hash variant.

## Key Concepts

Organizational-control example: set a maximum signing-key lifetime and rotate on schedule; inventory deployments, copies and backups; conservatively estimate aggregate signing volume over that lifetime and revisit changes; preserve the original retirement date after backup restore. These controls document expected use below the analysis bound, not an enforced exact count. This is practical planning guidance, not a FIPS 205-prescribed checklist or sufficient certification evidence by itself.

Keep planned use within the FIPS 205 analysis bound: even one billion signatures per second with the same key would take about 585 years to reach 2^64. Exact technical enforcement is difficult across key copies and devices: a local HSM counter is insufficient, and coordinated accounting must resist backup-restore resets and rollback. No HSM enforcement has been verified in this review. A practical planning approach is to conservatively bound total signing volume across all copies over the key lifetime, far below the limit; this is not a recommendation to add an LMS/XMSS-style per-signature counter.

- SLH-DSA is stateless: each signing operation internally selects a fresh WOTS+ leaf using a pseudorandom index derived from the secret key and message, eliminating the state tracking burden of LMS/XMSS
- WOTS+ (Winternitz OTS Plus): one-time signature component; signs a message digest by hashing chains of n-byte values; the Winternitz parameter lg_w=4 is fixed in FIPS 205; chain lengths balance signature size vs. hash-round cost
- FORS (Forest of Random Subsets): the few-time signature layer between WOTS+ and the hypertree; signs a k-subset of values using a-level hash trees; parameters (k, a) directly control signature size and security against multi-target attacks
- Hypertree: d layers of Merkle trees each of height h/d; the bottom layer authenticates a FORS public key; higher layers each authenticate a WOTS+ public key; the root of the topmost tree is the SLH-DSA public key
- The s vs. f tradeoff: -s (small) variants use fewer hypertree layers (lower d) producing smaller signatures but requiring more hash rounds per layer; -f (fast) variants use more layers for faster signing at the cost of larger signatures
- FIPS 205 Table 2 defines twelve parameter sets across three security levels (NIST Levels 1, 3, 5) and two hash families (SHA-2, SHAKE), with signature sizes ranging from 7,856 B (SHA2-128s) to 49,856 B (SHAKE-256f)
- Context strings (FIPS 205 §9.2): an optional byte string bound into the signature; provides domain separation between protocols; verification with a different context string produces CKR_SIGNATURE_INVALID even for a valid (SK, M) pair
- Deterministic versus hedged signing (FIPS 205 §9.2): identical key, message, context and settings produce identical deterministic signatures; hedged signing adds fresh randomness and normally produces different signatures. Both should verify. Comparing signatures demonstrates mode behavior, not random-generator quality or resistance to attacks. Deterministic signing still requires randomness for key generation. Internally opt_rand uses the public PK.seed value, not zeros.
- HashSLH-DSA (FIPS 205 §10.2.2, Algorithm 23): hashes the message with the selected pre-hash function and constructs M' = 0x01 || len(ctx) || ctx || OID_DER || H(M). Context strings of 0–255 bytes are permitted; verification uses the same context (§10.3.2, Algorithm 25). The live demo now exposes separate signing and verification contexts, empty by default, for pure and fixed-hash pre-hash modes. UTF-8 byte lengths are shown, whitespace is preserved, and overlong inputs are rejected. Tests of the shipped Rust WASM cover matching/mismatched contexts and length boundaries for SHA2-128f pure and SHA-256 pre-hash, plus an upstream pre-hash reference signature. This is not a full conformance claim for every parameter combination.
- Signing capacity: SLH-DSA needs no persistent leaf counter, but FIPS 205 §11 bases the security claims for its 12 parameter sets on at most 2^64 messages per key pair. This is an assumption of the security analysis, not a requirement to persist an LMS/XMSS-style counter, and not a prediction of immediate failure beyond the limit. Absence of a leaf counter does not remove key-management obligations.

## Workshop Activities

- **Step 1 -- Key Generation & Parameter Explorer**: Generate SLH-DSA key pairs across all twelve FIPS 205 parameter sets; observe how n, h, d, k, a determine key size, signature size, and the security-performance tradeoff
- **Step 2 -- Sign & Verify (Pure + HashSLH-DSA)**: Sign messages with Pure SLH-DSA (CKM_SLH_DSA) and HashSLH-DSA (CKM_HASH_SLH_DSA_SHA256); observe the PKCS#11 mechanism change and the pre-hash payload construction
- **Step 3 -- Context Strings & Deterministic Mode**: Demonstrate matching and mismatched contexts using separate fields; empty and a space differ. Expected signature rejection is distinct from an engine error. Explicit deterministic-required and hedged-required signing choices now drive the existing demo. “Sign twice and compare” signs identical inputs twice, compares full signature bytes and verifies both; expandable hex shows both signatures. Saved inputs/mode accompany results. This demonstrates behavior, not RNG quality, attack resistance or certification compliance.
- **Step 4 -- LMS vs XMSS vs SLH-DSA Comparison**: Side-by-side comparison of all three hash-based signature families on key size, signature size, signing speed, state requirement, and deployment model

## Related Standards

- FIPS 205 (SLH-DSA Stateless Hash-Based Digital Signature Standard, August 2024)
- FIPS 204 (ML-DSA, lattice-based alternative), SP 800-208 (LMS/XMSS stateful counterparts)
- PKCS#11 v3.2: CKM_SLH_DSA, CKM_HASH_SLH_DSA_SHA256, CKM_HASH_SLH_DSA_SHA384, CKM_HASH_SLH_DSA_SHA512, CKM_HASH_SLH_DSA_SHAKE128, CKM_HASH_SLH_DSA_SHAKE256
- CNSA 2.0 (NSA, September 2022): permits SLH-DSA as stateless alternative for signature use cases not requiring LMS/XMSS
- BSI TR-02102-1 (German Federal Office; recommends SLH-DSA-SHA2-192s or stronger for long-term security)
- ANSSI (French ANSSI PQC recommendations: SLH-DSA at NIST Level 3 or 5 for government use)
