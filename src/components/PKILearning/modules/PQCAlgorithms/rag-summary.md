# The PQC Algorithms: How They Work and How to Choose

## Overview

The PQC Algorithms: How They Work and How to Choose module (40 minutes, intermediate, Foundations track) reads the standardised post-quantum algorithms from the documents that define and guide their use, one sentence at a time. Each sentence below comes from a named document; the lesson shows the document, its edition and the place in it beside every sentence. The workshop runs ML-KEM and ML-DSA in the browser and compares sizes.

## Key Concepts

### Two jobs, new tools

**Key establishment and key derivation**

- NIST SP 800-227 explains that after a KEM establishes a shared secret key, an application may use key derivation to produce multiple symmetric keys from that initial key.
- NIST SP 800-227 states that when an application needs a different amount of keying material than a KEM outputs, the shared secret key may be supplied to an approved key-derivation method from SP 800-108 or SP 800-56C.
- NIST SP 800-56C Rev. 2 requires that derived keying material be computed in full before output and used only as secret keying material, such as symmetric keys for data encryption or message integrity.

**Authentication and digital signatures**

- NIST SP 800-227 states that most applications require authentication and cryptographic integrity checking, for example to prevent machine-in-the-middle attacks, typically using additional elements such as digital signatures and certificates.
- NIST SP 800-227 requires that an encapsulating party obtaining another party's static encapsulation key have assurance of the other party's ownership before or during key establishment, such as from a trusted party like a certificate authority or from proof of possession combined with verification of real-world identity.
- According to FIPS 204, digital signatures detect unauthorized modifications to data, authenticate the signatory's identity, and provide non-repudiation by giving recipients evidence for a third party that the claimed signatory generated the signature.

**Symmetric algorithms in the transition**

- NIST IR 8547 states that existing symmetric-cryptography standards, including hash functions, are significantly less vulnerable to known quantum attacks than public-key standards; NIST does not expect to need to transition away from them as part of the PQC migration, although applications should move away from 112-bit symmetric standards.
- The NSA CNSA 2.0 FAQ specifies the Advanced Encryption Standard (AES) with 256-bit keys and Secure Hash Algorithm (SHA) SHA-384 or SHA-512 for all classification levels.

### The families at a glance

**Mathematical families**

- NIST IR 8413 states that NIST aims to standardize schemes from different cryptographic families so a single advance in cryptanalysis does not leave the world without a viable standard.
- NIST IR 8413 explains that NIST selected hash-based SPHINCS+ so its signature standards do not rely entirely on lattices, providing a fallback against unforeseen cryptanalytic attacks.
- NIST IR 8413 describes CRYSTALS-Kyber as a module-learning-with-errors-based KEM and notes that CRYSTALS-Dilithium and Falcon are both based on structured lattices.
- NIST IR 8413 describes SPHINCS+ as a stateless hash-based signature scheme whose cryptographic security relies only on the security of its underlying hash functions.
- NIST IR 8413 explains that the learning with errors (LWE) problem for public-key encryption relates quantum security to the worst-case hardness of finding short vectors in lattices, known as the approximate Shortest Vector Problem (SVP).

**FALCON and HQC**

- Although Dilithium and Falcon are based on structured lattices, NIST decided to standardize Falcon as well because some applications cannot work as designed when signatures and signed data exceed one internet packet.
- On March 11, 2025, NIST announced that HQC, like ML-KEM, is a key encapsulation mechanism, built around error-correcting codes rather than structured lattices.
- NIST's announcement explains that HQC will serve as a backup to ML-KEM using different mathematics in case a weakness is discovered in ML-KEM, while ML-KEM remains the recommended choice.
- NIST's announcement states that NIST plans to release a draft HQC standard for public comment in about a year, followed by a 90-day comment period and a finalized standard in 2027.
- NIST IR 8547 states that NIST is developing a FIPS specifying a digital signature algorithm derived from FALCON as an additional alternative to its other digital signature standards.

### ML-KEM (FIPS 203)

**What ML-KEM is and how KEMs compare to classical methods**

- FIPS 203 standardizes ML-KEM, a key-encapsulation mechanism that is believed to be secure even against adversaries who possess a quantum computer.
- FIPS 203 states that ML-KEM is derived from the round-three version of the CRYSTALS-KYBER KEM submitted in the NIST Post-Quantum Cryptography Standardization effort.
- FIPS 203 states that ML-KEM's security is based on the presumed hardness of the Module Learning with Errors (MLWE) problem, which rests on computational problems in module lattices.
- In FIPS 203, a key-encapsulation mechanism is a set of algorithms that two parties can use, under certain conditions, to establish a shared secret key over a public channel.
- NIST SP 800-227 explains that in key agreement such as Diffie-Hellman both parties contribute to the shared secret key, whereas in key transport one party selects the key and transmits it.
- NIST SP 800-227 notes that a KEM can be viewed as either key agreement or key transport depending on its encapsulation function; ML-KEM's shared secret depends on both Bob's randomness and Alice's encapsulation key.

**How key generation, encapsulation, and decapsulation work**

- NIST SP 800-227 states that using a KEM should produce a shared secret key that is random, unknown to adversaries, and identical for both parties with high probability.
- In a KEM, the receiving party begins by running KeyGen to generate a public encapsulation key and a private decapsulation key.
- Using the encapsulation key, the other party runs Encaps to produce a copy of the shared secret key and an associated ciphertext, then sends the ciphertext back.
- The first party completes key establishment by running Decaps with the decapsulation key and the received ciphertext to produce a copy of the shared secret key.
- In FIPS 203, when a re-encrypted ciphertext does not match the provided ciphertext, decapsulation performs an implicit rejection and outputs a hash of the ciphertext with a secret random value.

**Parameter sets and sizes**

- FIPS 203 specifies three ML-KEM parameter sets in order of increasing security strength and decreasing performance: ML-KEM-512, ML-KEM-768, and ML-KEM-1024.
- FIPS 203 states that ML-KEM-512 is claimed for security category 1, ML-KEM-768 for security category 3, and ML-KEM-1024 for security category 5.
- In FIPS 203, ML-KEM-512 uses an 800-byte encapsulation key, a 1632-byte decapsulation key, and a 768-byte ciphertext.
- In FIPS 203, ML-KEM-768 uses an 1184-byte encapsulation key, a 2400-byte decapsulation key, and a 1088-byte ciphertext.
- In FIPS 203, ML-KEM-1024 uses a 1568-byte encapsulation key, a 3168-byte decapsulation key, and a 1568-byte ciphertext.
- In FIPS 203, ML-KEM-512, ML-KEM-768, and ML-KEM-1024 all produce a shared secret key that is 32 bytes long.

**Input checks, rejection handling, and key formats** (for developers)

- FIPS 203 requires that ML-KEM.Encaps must not run with an unchecked encapsulation key; checking verifies its byte length and that its encoded integers fall in the valid range.
- FIPS 203 requires that ML-KEM.Decaps must not run unless both the decapsulation key and ciphertext have been checked, and ciphertext checking must be performed on every execution.
- FIPS 203 requires implementations to destroy the implicit-reject comparison flag before decapsulation terminates and prohibits returning that flag as an output in any form.
- FIPS 203 permits storing the key-generation seed (d, z) for later expansion with ML-KEM.KeyGen_internal, and requires that it be protected with the same safeguards as a decapsulation key.
- NIST SP 800-227 states that a cryptographic module may store, import, or export keys in alternative formats, such as a short seed or an expanded format that allows faster computations.

**Randomness and intermediate data requirements** (for validation engineers)

- FIPS 203 requires random bytes to be generated using an approved RBG with at least 128 bits of security strength for ML-KEM-512, 192 bits for ML-KEM-768, and 256 bits for ML-KEM-1024.
- FIPS 203 requires implementers to destroy intermediate data as soon as it is no longer needed and, except for specified storage exceptions, retain only the designated output in memory after an ML-KEM algorithm terminates.

### ML-DSA (FIPS 204)

**What ML-DSA is and how it works**

- FIPS 204 specifies ML-DSA, a set of algorithms for generating and verifying digital signatures that is believed to be secure even against adversaries with a large-scale quantum computer.
- After three rounds of evaluation and analysis, NIST selected four algorithms for standardization, and FIPS 204 states that ML-DSA is derived from one of those schemes, CRYSTALS-DILITHIUM.
- FIPS 204 states that ML-DSA's security is based on the Module Learning With Errors (MLWE) problem and SelfTargetMSIS, a nonstandard variant of the Module Short Integer Solution (MSIS) problem.
- FIPS 204 specifies three main ML-DSA algorithms covering key generation (ML-DSA.KeyGen), signature generation (ML-DSA.Sign), and signature verification (ML-DSA.Verify).
- Only the user who possesses the private key can generate a signature that verifies under the corresponding public key, while anyone can verify the signature using the signatory's public key.

**Parameter sets and sizes**

- FIPS 204 defines three ML-DSA parameter sets with different claimed security strength categories: ML-DSA-44 in category 2, ML-DSA-65 in category 3, and ML-DSA-87 in category 5.
- In the names ML-DSA-44, ML-DSA-65, and ML-DSA-87, FIPS 204 explains that the numerical suffix refers to the dimensions of the matrix A, such as a 6 × 5 matrix in ML-DSA-65.
- In FIPS 204, ML-DSA-44 has a private key of 2560 bytes, a public key of 1312 bytes, and a signature size of 2420 bytes.
- In FIPS 204, ML-DSA-65 has a private key of 4032 bytes, a public key of 1952 bytes, and a signature size of 3309 bytes.
- In FIPS 204, ML-DSA-87 has a private key of 4896 bytes, a public key of 2592 bytes, and a signature size of 4627 bytes.
- NIST IR 8413 reports that structured lattice finalists for KEMs and signatures could replace existing public-key algorithms in widely used protocols like TLS, IPSec, and SSH, and in certificates, with relatively small or no performance loss.
- NIST IR 8413 notes that some applications will not work as currently designed if a signature and signed data cannot fit in a single internet packet, so modifying them for Dilithium’s larger signature size may create a transition barrier.

**Hedged and deterministic signing** (for developers)

- By default, FIPS 204 specifies a hedged signing variant that uses both fresh signing-time randomness to help mitigate side-channel attacks and precomputed randomness to protect against flaws in the signer's random number generator.
- For hedged signing in ML-DSA and HashML-DSA, FIPS 204 states that the signing randomness should ideally be generated by an approved RBG, though other methods for generating fresh random values may be used.
- FIPS 204 also permits a fully deterministic signing variant when the signer has no access to fresh randomness at signing time, and states that implementing only the hedged variant suffices for interoperability because the same verification algorithm verifies both.
- Because the lack of randomness in deterministic signing makes side-channel attacks, particularly fault attacks, harder to mitigate, FIPS 204 states this variant should not be used on platforms where side-channel attacks are a concern and cannot be otherwise mitigated.

**Context strings, pre-hashing, and seed storage** (for developers)

- In FIPS 204, both ML-DSA signing and verification take a context string as input, encoded as a byte string of 255 or fewer bytes.
- By default in FIPS 204, the context string is the empty string, though applications may specify a non-empty context string, which should be indicated by the signature's identifier or by the application.
- FIPS 204 defines a pre-hash variant called HashML-DSA that signs a message digest with domain separation information rather than signing the message directly, though FIPS 204 states that pure ML-DSA is generally preferred.
- HashML-DSA is domain-separated from ML-DSA and shares the same ML-DSA.KeyGen algorithm for key generation, but adds a pre-hashing step before signing through its separate HashML-DSA.Sign and HashML-DSA.Verify algorithms.
- To reduce private-key storage space, FIPS 204 notes that an implementation can store only the 32-byte key-generation seed, which is sufficient to generate the other parts of the private key.
- Because the seed generated during ML-DSA.KeyGen can be stored for later expansion into the private key, FIPS 204 requires that it be treated with the same safeguards as a private key.

### Hash-based signatures in brief

**SLH-DSA**

- FIPS 205 specifies SLH-DSA, a stateless hash-based digital signature algorithm used to detect unauthorized modifications to data and authenticate identity.
- FIPS 205 bases SLH-DSA on SPHINCS+, which was selected for standardization as part of the NIST Post-Quantum Cryptography Standardization process.
- The security of SLH-DSA relies on the presumed difficulty of finding preimages for hash functions and related hash-function properties, and it is designed to resist attacks from a large-scale quantum computer.
- In FIPS 205 parameter set names, the suffix 's' indicates relatively small signatures, whereas 'f' indicates relatively fast signature generation.

**LMS and XMSS**

- NIST SP 800-208 specifies two stateful hash-based signature schemes, the Leighton-Micali Signature (LMS) system and the eXtended Merkle Signature Scheme (XMSS), along with their multi-tree variants, HSS and multi-tree XMSS.
- RFC 8391 states that XMSS can sign a potentially large but fixed number of messages, using a tree of height h to produce a key pair that can sign 2^h messages.
- NIST SP 800-208 states that stateful hash-based signature schemes are not suitable for general use because they require careful state management that is often difficult to assure.
- NIST SP 800-208 says stateful HBS schemes are primarily intended where a signature scheme is needed soon, the implementation will have a long lifetime, and post-deployment transition is impractical; constrained-device firmware-update authentication may fit this profile.

**SLH-DSA parameter sets and signature sizes** (for developers)

- FIPS 205 approves 12 parameter sets for SLH-DSA, instantiated using either the SHA2 or SHAKE hash function family.
- In FIPS 205 Table 2, the parameter set SLH-DSA-SHA2-128s has a 32-byte public key and a 7,856-byte signature.
- In FIPS 205 Table 2, the parameter set SLH-DSA-SHA2-256f has a 64-byte public key and a 49,856-byte signature.

**Validation and hardware-module requirements** (for validation engineers)

- FIPS 205 states that parameter sets with n = 16 are claimed to be in security category 1, those with n = 24 in category 3, and those with n = 32 in category 5.
- NIST SP 800-208 requires that key and signature generation be performed in hardware cryptographic modules that do not allow secret keying material to be exported.

### How standards bodies map use cases to algorithms

**Security categories**

- NIST IR 8547 explains that post-quantum security is described using broad security categories, each defined by a symmetric-cryptography reference primitive whose security serves as a floor.
- In NIST IR 8547 Table 1, Categories 1, 3, and 5 correspond to key search on block ciphers with 128-bit, 192-bit, and 256-bit keys, exemplified by AES-128, AES-192, and AES-256.
- In NIST IR 8547 Table 1, Categories 2 and 4 correspond to collision search on 256-bit and 384-bit hash functions, exemplified by SHA-256 and SHA3-384.

**NIST**

- NIST IR 8547 gives its document number as NIST IR 8547, lists its publication date as October 2026, and records NIST Editorial Review Board approval on 2026-10-21.
- FIPS 203 states that NIST recommends ML-KEM-768 as the default parameter set because it provides a large security margin at a reasonable performance cost, while other parameter sets may be used when needed.
- For post-quantum digital signatures, NIST IR 8547 names FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), and SP 800-208 for stateful hash-based signature schemes, and notes a Falcon-based FIPS is under development.

**NSA CNSA 2.0**

- The NSA CNSA 2.0 FAQ document is dated October 2026 and marked as Version 2.2 in its page footer.
- The NSA CNSA 2.0 FAQ states that CNSA 2.0 requirements are for National Security System (NSS) owners, operators, and vendors, and are not mandated outside NSS, though they may serve as guidance.
- The NSA CNSA 2.0 FAQ lists ML-KEM (previously CRYSTALS-Kyber) as the asymmetric algorithm for key establishment, using ML-KEM-1024 for all classification levels.
- The NSA CNSA 2.0 FAQ lists ML-DSA (previously CRYSTALS-Dilithium) for digital signatures in any use case, using ML-DSA-87 for all classification levels.

**BSI**

- BSI TR-02102-1 identifies itself as Version 2026-01, dated January 23, 2026, and its version-history table lists 23.01.2026 in the Date column for version 2026-01.
- BSI TR-02102-1 recommends ML-KEM with the parameter sets ML-KEM-768 and ML-KEM-1024, corresponding to NIST Security Strength Categories 3 and 5, for long-term protection of confidential information.
- BSI TR-02102-1 recommends the hedged variant of ML-DSA with parameter sets ML-DSA-65 and ML-DSA-87, corresponding to NIST Security Strength Categories 3 and 5.

**ANSSI**

- ANSSI's follow-up paper, titled ANSSI views on the Post-Quantum Cryptography transition, states a date of December 21, 2023 on its first page.
- ANSSI's 2023 follow-up paper does not give a closed list of recommended algorithms, and names CRYSTALS-Kyber (ML-KEM) and FrodoKEM as appropriate post-quantum KEMs, preferring NIST security level 5 or level 3.
- In its non-exhaustive list of post-quantum digital signatures, ANSSI's 2023 follow-up paper names CRYSTALS-Dilithium (ML-DSA), Falcon (FN-DSA), XMSS/LMS, and SPHINCS+ (SLH-DSA) as appropriate choices.

**UK NCSC**

- The UK NCSC white paper states that it was originally published in November 2023, updated in August 2024, and published on 14 August 2024.
- The UK NCSC white paper states that ML-KEM and ML-DSA are suitable for general-purpose use and recommends ML-KEM-768 and ML-DSA-65 for most use cases.

**TLS 1.3**

- RFC 10024 defines three hybrid key agreement mechanisms for TLS 1.3—X25519MLKEM768, SecP256r1MLKEM768, and SecP384r1MLKEM1024—that combine post-quantum ML-KEM with ephemeral elliptic curve Diffie-Hellman (ECDHE).
- The draft-ietf-tls-mlkem-11 specification defines standalone ML-KEM-512, ML-KEM-768, and ML-KEM-1024 as NamedGroups in the IANA TLS Supported Groups registry for post-quantum key establishment in TLS 1.3.

### Implementation considerations

**Pre-standard Kyber and Dilithium differences**

- FIPS 203 lists differences between CRYSTALS-KYBER and ML-KEM that change input-output behavior, including fixing the shared secret key to 256 bits and no longer including a hash of the ciphertext in ML-KEM.Encaps’s shared-secret derivation.
- FIPS 203 also adds explicit input checking that was not part of the third-round specification, and introduces domain separation in K-PKE.KeyGen to prevent a saved seed from being misused across security levels.
- Unlike Version 3.1 of the CRYSTALS-DILITHIUM submission, where signing was deterministic by default, FIPS 204 makes ML-DSA signing hedged by default by incorporating a 256-bit random string.
- Compared with CRYSTALS-DILITHIUM Version 3.1, ML-DSA increases tr to 512 bits and c-tilde to 384 and 512 bits for ML-DSA-65 and ML-DSA-87; the final standard also adds direct-versus-pre-hash domain separation.

**KEM key confirmation and ephemeral key handling**

- NIST SP 800-227 recommends using key confirmation during KEM usage because confirming successful establishment of the shared secret key can address transmission or decapsulation errors.
- NIST SP 800-227 requires that an ephemeral KEM key pair be used for only one key-establishment execution and destroyed as soon as possible afterward.

**Stateful key reuse and compliance pitfalls** (for developers)

- NIST SP 800-208 says that signatures on two messages using one OTS key make forgery computationally feasible; if the private key is stored in nonvolatile memory, its state must mark that OTS key unavailable before its signature is exported.
- The NSA CNSA 2.0 FAQ states that only ML-KEM and ML-DSA are in CNSA 2.0, and any algorithm called CRYSTALS-Kyber or CRYSTALS-Dilithium that does not adhere to FIPS 203 or 204 is not CNSA 2.0 compliant.

## Workshop

ML-KEM Round Trip: generate a key pair, encapsulate, decapsulate, then change one byte of the ciphertext and decapsulate again.

ML-DSA Sign and Verify: generate a key pair, sign in the hedged or deterministic mode with or without a context string, and verify against the same or a changed message or context.

Size Comparator: compare key, signature and ciphertext sizes from the algorithm registry next to the sentences that state them.
