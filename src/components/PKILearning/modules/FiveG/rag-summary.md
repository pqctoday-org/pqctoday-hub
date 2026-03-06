# 5G Security Architecture Module

The 5G Security Architecture module teaches the three pillars of 3GPP 5G security -- subscriber privacy (SUCI concealment), mutual authentication (5G-AKA), and SIM key provisioning -- with detailed focus on the post-quantum migration path. Defined by 3GPP TS 33.501, 5G security introduced SUCI (Subscription Concealed Identifier) to solve the longstanding IMSI catcher problem of previous generations. The module covers classical ECIES-based concealment profiles (Profile A using X25519, Profile B using P-256) alongside the emerging Profile C (ML-KEM/Kyber), the MILENAGE authentication algorithm, the 5G key hierarchy, and supply chain security for SIM manufacturing.

## Key Concepts

- SUCI concealment: encrypts the subscriber permanent identity (SUPI/IMSI) before transmission over the air interface, preventing IMSI catcher surveillance attacks that plagued 2G/3G/4G networks
- Profile A (X25519): Curve25519 ECDH key agreement, 32-byte public keys, AES-128-CTR encryption, HMAC-SHA-256 integrity; quantum-vulnerable
- Profile B (P-256): NIST secp256r1 ECDH, 65-byte uncompressed public keys, AES-128-CTR encryption, HMAC-SHA-256 integrity; quantum-vulnerable
- Profile C (ML-KEM): lattice-based KEM (ML-KEM-768) with 1,184-byte public keys, AES-256-CTR encryption, HMAC-SHA3-256 integrity; quantum-resistant; supports both hybrid (X25519 + ML-KEM) and pure PQC modes; under 3GPP SA3 study (TR 33.841)
- SUCI construction pipeline: retrieve HN public key from USIM, generate ephemeral key pair, compute shared secret (ECDH or KEM encapsulation), derive encryption and MAC keys via ANSI X9.63 KDF, encrypt MSIN with AES-CTR, compute HMAC tag, assemble SUCI structure
- 5G-AKA authentication: mutual authentication using MILENAGE algorithm (AES-128 based, five functions f1-f5 producing MAC-A, XRES, CK, IK, AK); AES-128 is quantum-resistant (Grover's algorithm only halves effective key length to 64 bits)
- 5G key hierarchy: CK and IK feed KAUSF (anchor key) derived with HMAC-SHA-256 bound to Serving Network Name, then KAUSF to KSEAF to KAMF to KNASint/KNASenc to KgNB for radio layer protection
- SIM provisioning supply chain: K generation in factory HSM (TRNG), OPc computation (AES(K, OP) XOR OP), USIM personalization, encrypted transport (eK), and import into operator's encrypted subscriber database
- Differential quantum vulnerability: SUCI concealment (asymmetric ECDH) is broken by Shor's algorithm and needs PQC migration; MILENAGE/5G-AKA (symmetric AES) and SIM provisioning (symmetric encryption) remain quantum-resistant

## Workshop Activities

- **Part 1 -- SUCI Deconcealment**: Step through the full 11-step SUCI construction and deconcealment process for Profile A (X25519), Profile B (P-256), and Profile C (ML-KEM), with real OpenSSL commands showing key generation, ECDH/KEM operations, KDF derivation, AES encryption, and HMAC computation
- **Part 2 -- 5G-AKA Authentication**: Simulate the mutual authentication flow including credential retrieval from subscriber database via ARPF/HSM, RAND challenge generation, MILENAGE computation (f1-f5), AUTN construction, and KAUSF derivation through the 5G key hierarchy
- **Part 3 -- SIM Key Provisioning**: Walk through the secure SIM manufacturing supply chain from K generation and OPc computation through USIM personalization, encrypted transport, and import into operator's encrypted subscriber database

## Related Standards

- 3GPP TS 33.501 (5G security architecture), 3GPP TS 35.206 (MILENAGE algorithm), 3GPP TR 33.841 (PQC study for 5G)
- 3GPP TS 23.003 (SUPI/SUCI identifier formats), 3GPP TS 31.102 (USIM application)
- FIPS 203 (ML-KEM), NIST SP 800-56C (KDF recommendations)
- RFC 7748 (X25519 Diffie-Hellman), ANSI X9.63 (Key Derivation Function)
