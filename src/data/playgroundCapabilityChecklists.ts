// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Standardized Production-Tool Capability Checklists for all Playground Tools.
 *
 * Maps each interactive Playground tool to:
 * - whatCheckEstablishes: What the sample check demonstrates mathematically/mechanically
 * - sandboxLimitation: Why browser WASM/JS execution does not verify a deployed system
 * - productionToolRequirements: Concrete capabilities to require and test in production tools
 */

export interface PlaygroundTamperVerificationSpec {
  artifactLabel: string
  validVectorHex: string
  tamperedVectorHex: string
  expectedFailureBehavior: string
}

export interface PlaygroundCapabilitySpec {
  toolId: string
  whatCheckEstablishes: string
  sandboxLimitation: string
  productionToolRequirements: [string, string, string]
  tamperVerification: PlaygroundTamperVerificationSpec
}

export type PlaygroundCapabilityChecklist = PlaygroundCapabilitySpec

interface RawPlaygroundSeed {
  whatCheckEstablishes: string
  sandboxLimitation: string
  productionToolRequirements: [string, string, string]
}

const PLAYGROUND_SEEDS: Record<string, RawPlaygroundSeed> = {
  'cacp-kmip': {
    whatCheckEstablishes:
      'Demonstrates OASIS KMIP 3.0 / Cryptographic Agility Control Plane request/response message structures, key lifecycle attributes, and PQC algorithm policy mapping.',
    sandboxLimitation:
      'Runs against an in-browser protocol state model; it does not connect to an enterprise KMIP server, HSM partition, or production key database.',
    productionToolRequirements: [
      'OASIS KMIP 3.0+ TTLV/JSON protocol support for ML-KEM (FIPS 203) and ML-DSA (FIPS 204) Managed Cryptographic Objects.',
      'Automated key-state transition enforcement (Pre-Active -> Active -> Deactivated -> Destroyed) with immutable audit logs.',
      'Mutual TLS 1.3 with hybrid PQC key exchange (`X25519MLKEM768`) between KMIP clients and enterprise key managers.',
    ],
  },
  'hsm-capacity': {
    whatCheckEstablishes:
      'Calculates projected HSM NVRAM storage, partition object counts, and throughput impact when migrating from RSA/ECDSA keys to larger ML-KEM, ML-DSA, or LMS/XMSS keys.',
    sandboxLimitation:
      'Performs deterministic arithmetic sizing from parameter-set byte sizes; it does not benchmark real HSM hardware latency, bus contention, or firmware memory fragmentation.',
    productionToolRequirements: [
      'PKCS#11 v3.2 HSM firmware with documented NVRAM object overhead for ML-KEM-768/1024, ML-DSA-65/87, and stateful LMS/XMSS trees.',
      'Load-tested signing/decapsulation ops/sec under multi-tenant partition concurrency on your actual HSM appliance model.',
      'High-availability HSM cluster replication and backup capacity sized for 3x–15x larger post-quantum key blobs.',
    ],
  },
  'hybrid-encrypt': {
    whatCheckEstablishes:
      'Executes real in-browser ECDH (X25519 / P-256) + FIPS 203 ML-KEM encapsulation, combining both shared secrets through a KDF combiner to derive an AES-256-GCM key.',
    sandboxLimitation:
      'Browser WASM/WebCrypto execution lacks constant-time hardware guarantees, side-channel protection, and FIPS 140-3 validated module boundaries.',
    productionToolRequirements: [
      'NIST SP 800-227 / ETSI TS 103 744 / IETF RFC 9794 compliant PQ/T hybrid KEM combiner using HKDF-SHA256/384 or KMAC256.',
      'FIPS 203 §7.2 encapsulation-key modulus validation and implicit rejection on tampered ML-KEM ciphertexts.',
      'Authenticated encryption (AES-256-GCM or ChaCha20-Poly1305) with strict nonce-uniqueness enforcement.',
    ],
  },
  'envelope-encrypt': {
    whatCheckEstablishes:
      'Demonstrates two-tier DEK/KEK envelope encryption where a random 256-bit Data Encryption Key encrypts bulk payload data and is wrapped via ML-KEM key encapsulation.',
    sandboxLimitation:
      'Ephemeral keys reside in browser memory; it does not validate cloud KMS IAM access policies, HSM key-wrapping boundaries, or persistent storage rotation.',
    productionToolRequirements: [
      'Cloud KMS / HSM support for ML-KEM-768/1024 key encapsulation (`Encapsulate` / `Decapsulate`) bound to AES-256-GCM / AES-256-KWP DEK wrapping.',
      'Cryptographic binding of key-context metadata (AAD) to prevent confused-deputy ciphertext substitution across tenants.',
      'Online KEK re-wrapping without requiring bulk re-encryption of terabyte-scale underlying data.',
    ],
  },
  'cloud-kms-key-exchange': {
    whatCheckEstablishes:
      'Models cross-cloud and customer-to-cloud BYOK/HYOK key import and wrapping workflows using post-quantum KEM transport.',
    sandboxLimitation:
      'Simulates cloud KMS API envelopes locally in the browser without calling AWS KMS, Azure Managed HSM, or Google Cloud KMS endpoints.',
    productionToolRequirements: [
      'PKCS#11 v3.2 `CKM_ML_KEM` + AES-KWP hybrid key-import wrapping supported by both on-premises source HSM and target cloud KMS.',
      'Attested import-token verification confirming the target cloud HSM public wrapping key chains to a hardware root of trust.',
      'Automated key-material expiration and emergency revocation switches for imported BYOK keys.',
    ],
  },
  'token-migration': {
    whatCheckEstablishes:
      'Demonstrates cryptographic token and PKCS#11 partition migration steps from legacy classical mechanisms (`CKM_RSA_PKCS`, `CKM_ECDSA`) to PKCS#11 v3.2 PQC mechanisms.',
    sandboxLimitation:
      'Uses an in-browser softHSM emulation; it does not test vendor-specific HSM cloning protocols, M-of-N smartcard quorum ceremonies, or PCI key blocks.',
    productionToolRequirements: [
      'OASIS PKCS#11 v3.2 compliant HSM client libraries supporting `C_EncapsulateKey`, `C_DecapsulateKey`, `CKM_ML_KEM`, and `CKM_ML_DSA`.',
      'Dual-stack partition policies allowing co-existence of legacy classical keys and new PQC keys during phased application cutover.',
      'Non-exportable private-key attributes (`CKA_SENSITIVE=TRUE`, `CKA_EXTRACTABLE=FALSE`) verified by HSM audit logs.',
    ],
  },
  'firmware-signing': {
    whatCheckEstablishes:
      'Exercises post-quantum firmware image hashing, signature generation (`ML-DSA`, `SLH-DSA`, `LMS/HSS`), and tamper-detection verification.',
    sandboxLimitation:
      'Executes in browser WASM memory; it does not verify Boot ROM mask code, OTP fuse burning, or physical glitch/fault-injection resilience.',
    productionToolRequirements: [
      'Hardware Root of Trust (Boot ROM / MCU secure enclave) supporting SP 800-208 `LMS/HSS`, `XMSS`, or FIPS 204 `ML-DSA-87` signature verification.',
      'Monotonic anti-rollback security version number (SVN) counters stored in hardware fuses or RPMB/TPM.',
      'Air-gapped HSM signing appliance enforcing monotonic OTS state tracking for stateful hash-based keys.',
    ],
  },
  'slh-dsa': {
    whatCheckEstablishes:
      'Runs real NIST FIPS 205 SLH-DSA key generation, signing, and verification across SHA2/SHAKE `-s` (small) and `-f` (fast) parameter sets in WASM.',
    sandboxLimitation:
      'Browser WASM timing depends on host CPU/JIT and does not establish hardware throughput or side-channel fault immunity.',
    productionToolRequirements: [
      'CAVP-validated FIPS 205 `SLH-DSA` implementation supporting required SHA2/SHAKE `128s/f`, `192s/f`, and `256s/f` parameter sets and RFC 9909 OIDs.',
      'Explicit context-string (`ctx`, 0–255 bytes) support per FIPS 205 §9.2 for domain separation.',
      'Transport and storage buffers sized for 7,856 B (`128s`) up to 49,856 B (`256f`) signatures.',
    ],
  },
  'lms-hss': {
    whatCheckEstablishes:
      'Demonstrates NIST SP 800-208 / RFC 8554 Leighton-Micali (LMS / HSS) Merkle-tree key generation, one-time leaf index advancement, and signature verification.',
    sandboxLimitation:
      'Browser state resets on reload; in production, reusing a single LMS leaf index due to VM rollback or NVRAM failure catastrophically compromises private-key security.',
    productionToolRequirements: [
      'Hardware-enforced monotonic counter inside a FIPS 140-3 Level 3+ HSM that updates NVRAM state BEFORE releasing any LMS/HSS signature.',
      'Strict prohibition of private-key backup/restore outside dedicated HSM state-synchronized failover hardware.',
      'Automated exhaustion alerting when remaining LMS leaf capacity drops below operational thresholds.',
    ],
  },
  'hybrid-sigs': {
    whatCheckEstablishes:
      'Demonstrates composite and dual classical + PQC digital signature generation and verification where both `ECDSA`/`Ed25519` and `ML-DSA` must verify.',
    sandboxLimitation:
      'Executes in browser memory; it does not test third-party X.509 path-validation engines or legacy middlebox ASN.1 parsers.',
    productionToolRequirements: [
      'IETF RFC 10073 (Composite ML-DSA) OID support and strict AND-verification semantics (both component signatures must pass).',
      'Domain-separation prefix binding per RFC 10073 to prevent signature stripping or cross-protocol replay.',
      'Negative test verification confirming that corrupting either the classical or the ML-DSA component causes overall verification failure.',
    ],
  },
  'kdf-derivation': {
    whatCheckEstablishes:
      'Demonstrates HKDF (RFC 5869), SP 800-108, and SP 800-56C / SP 800-227 key derivation combining classical ECDH and post-quantum ML-KEM shared secrets with context labels.',
    sandboxLimitation:
      'Runs in browser WASM/WebCrypto; it does not enforce hardware key-isolation attributes on derived keys.',
    productionToolRequirements: [
      'NIST SP 800-227 / ETSI TS 103 744 compliant hybrid KDF combiner binding transcript hashes and public keys into the derivation context.',
      'HSM PKCS#11 v3.2 key derivation (`CKM_HKDF_DERIVE` / SP 800-108) keeping derived traffic/wrapping keys inside the HSM boundary when required.',
      'Immediate zeroization of intermediate shared secrets (`Z_ecdh`, `Z_mlkem`) after key derivation.',
    ],
  },
  'tee-channel': {
    whatCheckEstablishes:
      'Simulates Remote Attestation TLS (RA-TLS) binding a hardware enclave measurement quote to a hybrid post-quantum key exchange channel.',
    sandboxLimitation:
      'Uses synthetic attestation quotes in the browser; it does not execute inside physical Intel TDX, AMD SEV-SNP, or Arm CCA silicon.',
    productionToolRequirements: [
      'Hardware-rooted TEE attestation verification checking platform certificates, TCB SVN levels, and measurement registers (`MRTD`/`RTMR`).',
      'Cryptographic channel binding (exporter or public-key hash in quote reportData) linking the `X25519MLKEM768` TLS session to the attested enclave.',
      'Post-quantum roadmap for silicon vendor VCEK/ASK attestation root signatures.',
    ],
  },
  'tls-simulator': {
    whatCheckEstablishes:
      'Runs a real OpenSSL 3.6 WASM in-memory TLS 1.3 handshake (`OSSL_SSL_CTX`) negotiating hybrid (`X25519MLKEM768`) or pure PQC groups and PQC certificates.',
    sandboxLimitation:
      'Uses in-memory BIO buffers without kernel TCP/IP segmentation, middlebox DPI inspection, or real WAN packet loss.',
    productionToolRequirements: [
      'TLS 1.3 hybrid key exchange (`X25519MLKEM768`, codepoint `0x11EC`) enabled on production TLS libraries, CDNs, and ingress controllers.',
      'RFC 8879 TLS Certificate Compression (Brotli/Zstd) and TCP Initial Congestion Window (`initcwnd >= 10`) tuning for multi-kilobyte PQC cert chains.',
      'Active monitoring for middlebox clientHello drops on multi-packet TCP ClientHellos (`> 1,500 B`).',
    ],
  },
  'vpn-sim': {
    whatCheckEstablishes:
      'Demonstrates IKEv2 (RFC 7296 + RFC 9370 Multiple Key Exchanges) negotiation combining classical Diffie-Hellman in `IKE_SA_INIT` with `ML-KEM` in `IKE_INTERMEDIATE`.',
    sandboxLimitation:
      'Browser protocol simulation does not test physical router UDP fragmentation, NAT-T traversal, or hardware IPsec ESP offload.',
    productionToolRequirements: [
      'RFC 9370 `IKE_INTERMEDIATE` (`ADDKE1..ADDKE7`) support with `ML-KEM-768` / `ML-KEM-1024` in enterprise VPN concentrators (strongSwan, Libreswan, Cisco, Palo Alto, Fortinet).',
      'RFC 7383 IKEv2 Message Fragmentation and RFC 9329 TCP encapsulation fallback when UDP fragments are dropped on transit paths.',
      '256-bit ESP data-plane encryption (`ENCR_AES_GCM_16` with 256-bit keys) paired with `PRF_HMAC_SHA2_384/512`.',
    ],
  },
  'pqc-ssh-sim': {
    whatCheckEstablishes:
      'Demonstrates SSHv2 post-quantum hybrid key exchange (`mlkem768x25519-sha256` / `sntrup761x25519-sha512`) and host/user key authentication.',
    sandboxLimitation:
      'Executes in browser WASM without testing enterprise bastion jump-hosts, PAM modules, or hardware PIV/FIDO2 SSH agents.',
    productionToolRequirements: [
      'OpenSSH 9.9+ (or equivalent enterprise SSH server) enforcing `mlkem768x25519-sha256` in `KexAlgorithms`.',
      'SSH CA certificate issuance and host-key rotation playbooks transitioning toward PQC/hybrid host authentication.',
      'Audit logging of negotiated SSH KEX algorithms across all production hosts to eliminate legacy `diffie-hellman-group14-sha1` usage.',
    ],
  },
  'suci-flow': {
    whatCheckEstablishes:
      'Demonstrates 3GPP TS 33.501 5G SUPI-to-SUCI subscriber identity concealment and Home Network deconcealment using classical ECIES vs post-quantum KEM profiles.',
    sandboxLimitation:
      'Runs in browser memory; it does not test physical 5G USIM JavaCard applet constraints or radio-access RRC NAS signaling frames.',
    productionToolRequirements: [
      '3GPP Rel-19/Rel-20 compliant SIDF (Subscription Identifier De-concealing Function) and USIM support for post-quantum/hybrid SUCI profiles.',
      'HSM-backed Home Network Private Key custody with automated key-identifier (`Home Network Public Key ID`) rotation.',
      'NAS registration payload budget verification for ~1.1 KB (`ML-KEM-768`) SUCI ciphertexts.',
    ],
  },
  'mls-group-messaging': {
    whatCheckEstablishes:
      'Demonstrates RFC 9420 Messaging Layer Security (MLS) TreeKEM group key establishment, epoch ratcheting, and post-quantum hybrid ciphersuite operations.',
    sandboxLimitation:
      'Runs in a single browser session; it does not test distributed Delivery Service message ordering or multi-device offline queue synchronization.',
    productionToolRequirements: [
      'RFC 9420 MLS implementation supporting hybrid PQC KEM (`X25519MLKEM768`) and `ML-DSA` LeafNode/KeyPackage signatures.',
      'Strict epoch-authenticity and TreeKEM parent-hash verification to detect malicious Delivery Service tree tampering.',
      'Automated PCS (Post-Compromise Security) self-update cadence policies for long-lived messaging groups.',
    ],
  },
  'tpm-playground': {
    whatCheckEstablishes:
      'Exercises TPM 2.0 command/response hierarchies (`TPM2_CreatePrimary`, `TPM2_Create`, `TPM2_Sign`, `TPM2_Quote`, PCR policy binding) and PQC migration patterns.',
    sandboxLimitation:
      'Uses an in-browser software TPM simulator; it does not measure discrete SPI/I2C TPM 2.0 chip latency or physical bus interposer protection.',
    productionToolRequirements: [
      'TCG TPM 2.0 Library Rev 1.83+ firmware/hardware support for post-quantum algorithms (`ML-DSA`, `ML-KEM`, `LMS/XMSS`) as silicon ships.',
      'Hybrid TPM + host software/HSM key-wrapping patterns where existing soldered TPM 2.0 chips only support RSA-2048 / ECC P-256.',
      'PCR-bound sealing policies verified against signed UEFI Secure Boot and OS kernel measurements.',
    ],
  },
  'rng-demo': {
    whatCheckEstablishes:
      'Demonstrates raw noise sampling, conditioning, and pseudorandom bit sequence generation for cryptographic seeding.',
    sandboxLimitation:
      'Browser `crypto.getRandomValues` / simulated noise sources do not expose physical ring-oscillator or avalanche-diode hardware telemetry.',
    productionToolRequirements: [
      'NIST SP 800-90B ESV-validated physical entropy sources feeding SP 800-90A `CTR_DRBG` / `Hash_DRBG` with $\ge 256$-bit security strength.',
      'Continuous hardware health testing (Repetition Count Test and Adaptive Proportion Test) with instant fail-closed behavior.',
      'Verified OS / hypervisor entropy forwarding (`virtio-rng` / CPU `RDSEED`) into containerized workloads.',
    ],
  },
  'qrng-demo': {
    whatCheckEstablishes:
      'Illustrates quantum random number generation (shot-noise / photon arrival / phase fluctuation) conditioning and entropy mixing with classical CSPRNGs.',
    sandboxLimitation:
      'Simulates quantum noise distributions mathematically in the browser; no physical optical QRNG hardware is attached.',
    productionToolRequirements: [
      'SP 800-90C / BSI AIS 31 compliant XOR/KDF entropy mixing so external QRNG hardware supplements—never replaces—validated local OS/HSM TRNGs.',
      'Authenticated, integrity-protected transport if entropy is streamed from an external appliance over a network or PCIe bus.',
      'Continuous SP 800-90B non-IID min-entropy monitoring prior to conditioning.',
    ],
  },
  'entropy-test': {
    whatCheckEstablishes:
      'Executes statistical and NIST SP 800-90B style min-entropy estimators (Most Common Value, Collision, Markov, Compression, RCT, APT) on sample byte streams.',
    sandboxLimitation:
      'Browser-scale sample windows are for educational inspection; formal NIST ESV certification requires $\ge 1,000,000$ consecutive raw noise samples analyzed by an accredited lab.',
    productionToolRequirements: [
      'Formal NIST Entropy Source Validation (ESV) per SP 800-90B using the official NIST C++ `ea_iid` / `ea_non_iid` assessment suite.',
      'Stochastic model justification documenting the physical noise mechanism and quantization process.',
      'Configured RCT and APT cutoff thresholds matching the target false-positive rate ($2^{-20}$ to $2^{-40}$).',
    ],
  },
  'drbg-demo': {
    whatCheckEstablishes:
      'Demonstrates NIST SP 800-90A Deterministic Random Bit Generator (`HMAC_DRBG` / `CTR_DRBG`) state transitions: `Instantiate`, `Reseed`, `Generate`, and prediction resistance.',
    sandboxLimitation:
      'Educational state visualizer in the browser; production DRBGs must execute inside a memory-protected cryptographic boundary.',
    productionToolRequirements: [
      'CAVP-validated NIST SP 800-90A Rev. 1 DRBG instantiated at 256-bit security strength (`AES-256 CTR_DRBG` or `SHA-512 Hash/HMAC_DRBG`).',
      'Enforced reseed intervals ($\le 2^{48}$ requests) and prediction-resistance reseeding before high-value PQC Root CA key generation.',
      'Zeroization of internal DRBG working state (`V`, `Key` / `C`) upon uninstantiation or error.',
    ],
  },
  'source-combining': {
    whatCheckEstablishes:
      'Demonstrates cryptographic conditioning and PRF/HKDF/XOR combining of multiple independent entropy sources so security holds if at least one source remains unpredictable.',
    sandboxLimitation:
      'In-browser demonstration using synthetic streams; it does not isolate hardware failure domains across shared power rails or clocks.',
    productionToolRequirements: [
      'NIST SP 800-90C / FIPS 140-3 IG D.K compliant vetted conditioning components (`HMAC`, `KMAC`, `AES-CBC-MAC`) when combining entropy sources.',
      'Physical independence between combined noise sources (separate silicon ring oscillators, discrete TPM TRNG, and external HSM/QRNG).',
      'Independent health testing on each raw noise source PRIOR to the combiner stage.',
    ],
  },
  'pki-workshop': {
    whatCheckEstablishes:
      'Builds and verifies X.509 v3 certificate chains signed with post-quantum algorithms (`ML-DSA-44/65/87`, `SLH-DSA`) using OpenSSL 3.6 WASM.',
    sandboxLimitation:
      'In-browser CA uses ephemeral keys in WASM memory; it does not provide HSM root key protection, CRL distribution points, or audited CA ceremony controls.',
    productionToolRequirements: [
      'CA software (EJBCA, Dogtag, Microsoft ADCS/Cloud PKI, AWS Private CA, DigiCert) supporting RFC 9881 (`ML-DSA`) and RFC 9909 (`SLH-DSA`) X.509 OIDs.',
      'FIPS 140-3 Level 3 HSM protection for Root and Issuing CA private keys with M-of-N quorum activation.',
      'Automated CRL/OCSP and short-lived certificate issuance pipelines validated for multi-kilobyte PQC certificate chains.',
    ],
  },
  'cert-capacity': {
    whatCheckEstablishes:
      'Computes exact X.509 certificate chain byte sizes, TLS 1.3 handshake record overhead, and TCP initial congestion window (`initcwnd`) round-trip thresholds.',
    sandboxLimitation:
      'Arithmetic wire-size calculator; it does not measure real WAN packet drop rates, middlebox firewall buffers, or client CPU verification time.',
    productionToolRequirements: [
      'RFC 8879 TLS Certificate Compression (`compress_certificate` with Brotli/Zstd) enabled on TLS terminators.',
      'Intermediate CA hierarchy optimization (e.g., 2-tier instead of 4-tier chains, or client pre-installed intermediate CAs / Merkle Tree Certificates).',
      'Real-user monitoring (RUM) and synthetic canary probes measuring TLS handshake completion rates across global ISP networks.',
    ],
  },
  'hybrid-certs': {
    whatCheckEstablishes:
      'Inspects dual/hybrid X.509 certificate structures including IETF Composite ML-DSA (RFC 10073), Chameleon/Related Certificates (RFC 9763), and parallel chains.',
    sandboxLimitation:
      'Browser ASN.1 inspection and mock issuance do not validate whether your specific production TLS clients, browsers, or Java/Go/C# trust stores accept the extension.',
    productionToolRequirements: [
      'End-to-end relying-party compatibility testing confirming whether target clients support RFC 10073 Composite ML-DSA, RFC 9763 Related Certificates, or parallel dual-cert deployment.',
      'CA policy enforcement ensuring both component keys in a composite certificate undergo proof-of-possession verification during enrollment.',
      'Clear revocation semantics so revoking either component key invalidates the composite credential.',
    ],
  },
  'merkle-proof': {
    whatCheckEstablishes:
      'Constructs a SHA-256 Merkle tree over a batch of certificates and generates/verifies compact logarithmic $O(\\log_2 N)$ inclusion proofs alongside a single PQC tree-head signature.',
    sandboxLimitation:
      'In-browser tree builder over sample entries; it does not operate a distributed Transparency Service or TLS edge proof-stitching pipeline.',
    productionToolRequirements: [
      'RFC 6962 / RFC 9162 domain-separated leaf (`0x00`) and internal node (`0x01`) hashing to prevent second-preimage tree-splicing attacks.',
      'High-availability cosigning witnesses verifying tree-head consistency proofs before edge distribution.',
      'Automated TLS terminator fallback to standard X.509 chains for clients not advertising Merkle Tree Certificate support.',
    ],
  },
  'digital-id': {
    whatCheckEstablishes:
      'Demonstrates ISO/IEC 18013-5 mDL Mobile Security Object (MSO) COSE signing and W3C Verifiable Credential selective disclosure using post-quantum signatures.',
    sandboxLimitation:
      'Runs in browser memory; it does not test smartphone Secure Element hardware signing speed or physical NFC reader antenna power limits.',
    productionToolRequirements: [
      'COSE (`RFC 9052`) and JOSE post-quantum signature algorithm registration support in issuer backends and mobile wallet SDKs.',
      'BLE / NFC APDU fragmentation and session-establishment latency tested at `< 500 ms` on physical reader terminals.',
      'Hardware-backed holder binding (DeviceKey in Secure Enclave / StrongBox) with PQC transition path.',
    ],
  },
  'bitcoin-flow': {
    whatCheckEstablishes:
      'Compares Bitcoin secp256k1 ECDSA/Schnorr (BIP-340) transaction signing and Taproot witness structures against post-quantum signature size and verification constraints.',
    sandboxLimitation:
      'Educational transaction-flow model; the live Bitcoin network consensus does not currently support ML-DSA or SLH-DSA opcodes.',
    productionToolRequirements: [
      'Strict address-hygiene enforcement in custody platforms: never reuse P2PKH/P2WPKH addresses once an outgoing spend reveals the public key on-chain.',
      'Custody HSM readiness for post-quantum signing schemes and hash-based emergency recovery paths.',
      'Continuous monitoring of BIP / protocol governance proposals for quantum-resistant witness soft forks.',
    ],
  },
  'hd-wallet': {
    whatCheckEstablishes:
      'Demonstrates hierarchical deterministic (BIP-32 / BIP-39 / SLIP-0010) seed-to-child key derivation and how lattice/hash-based PQC keys require hardened seed-derivation trees.',
    sandboxLimitation:
      'Browser-based derivation uses synthetic mnemonics; never enter real seed phrases into any browser tool.',
    productionToolRequirements: [
      'Hardened HMAC-SHA512 / KMAC256 seed derivation generating deterministic 32/64-byte child seeds (`d`, `z` for ML-KEM; `xi` for ML-DSA) inside an air-gapped hardware wallet or HSM.',
      'Recognition that non-hardened public-key parent-to-child derivation (BIP-32 xpub) does not directly translate to standard NIST FIPS 204/205 parameter sets.',
      'FIPS 140-3 Level 3+ HSM seed backup and M-of-N Shamir/threshold recovery for institutional custody.',
    ],
  },
  'solana-flow': {
    whatCheckEstablishes:
      'Analyses Ed25519 account-model transaction signing, 1,232-byte UDP packet constraints, and Winternitz / hash-based / ML-DSA vault migration patterns on high-throughput chains.',
    sandboxLimitation:
      'Browser simulation of transaction layout and signature sizes; it does not submit transactions to a live validator cluster.',
    productionToolRequirements: [
      'Smart-contract / program-derived account (PDA) abstraction allowing authority rotation from Ed25519 keys to post-quantum verification keys.',
      'Transaction chunking or pre-staged verification state to accommodate $> 2.4$ KB PQC signatures across 1,232-byte packet limits.',
      'Institutional custody HSM support for both Ed25519 and FIPS 204/205 post-quantum signing.',
    ],
  },
  'openssl-studio': {
    whatCheckEstablishes:
      'Executes real OpenSSL 3.6.3 WebAssembly CLI commands (`genpkey`, `pkeyutl -encap/-decap`, `dgst`, `x509`, `cms`, `asn1parse`) on synthetic files in an in-browser virtual filesystem.',
    sandboxLimitation:
      'Single-threaded browser WASM binary with virtual FS; it does not validate your production OS shared libraries (`libcrypto.so`), FIPS provider module, or HSM PKCS#11 engine.',
    productionToolRequirements: [
      'OpenSSL 3.5+ deployed in production with native FIPS 203 (`ML-KEM`), FIPS 204 (`ML-DSA`), and FIPS 205 (`SLH-DSA`) provider support.',
      'Verified `openssl.cnf` default provider and TLS `Groups` / `SignatureAlgorithms` configuration across all host and container base images.',
      'Automated negative-test regression suite verifying CLI/API error handling on corrupted ciphertexts, bad signatures, and untrusted CA chains.',
    ],
  },
  'api-security-jwt': {
    whatCheckEstablishes:
      'Signs and verifies real JSON Web Tokens (JWS/JWT) and hybrid JWE payloads using `ML-DSA-44/65/87` and `ML-KEM-768` via OpenSSL 3.6 WASM.',
    sandboxLimitation:
      'In-browser token signing and verification; it does not test production reverse-proxy HTTP header limits (e.g., NGINX `large_client_header_buffers`) or distributed JWKS caching.',
    productionToolRequirements: [
      'API gateway and ingress proxy buffer sizing validated for ~4.6 KB (`ML-DSA-65`) Base64URL-encoded `Authorization: Bearer` headers.',
      'Strict JWS algorithm allowlisting (`ML-DSA-65`, rejecting `none` and symmetric `HS256` key-confusion attacks) in token verifiers.',
      'JWKS discovery endpoints serving post-quantum public keys with automated `kid` rollover.',
    ],
  },
  'pki-enrollment': {
    whatCheckEstablishes:
      'Runs an in-process OpenSSL 3.6 WASM CMPv3 (`RFC 9810`) Initial Request (`ir`), EST (`RFC 7030`) `simpleenroll`, and `ML-KEM-768` encrypted-certificate key update (`kur` / `encrCert` POP).',
    sandboxLimitation:
      'Both client and mock CA run in the same browser WASM process with fictional credentials; it does not test production CA policy engines, RA approval queues, or network mTLS.',
    productionToolRequirements: [
      'Production CA support for CMPv3 (RFC 9810 / RFC 9483) `POPOPrivKey` `encrCert` proof-of-possession and strict `certConf` hash verification when issuing `ML-KEM` certificates.',
      'EST (RFC 7030) and ACME (RFC 8555) support for `ML-DSA` (RFC 9881) PKCS#10 CSRs with mutual TLS or cryptographic account authentication.',
      'Negative enrollment testing confirming the CA rejects mismatched `certConf` hashes, invalid CSR signatures, and unauthorized renewal signers.',
    ],
  },
  'email-signing': {
    whatCheckEstablishes:
      'Executes real OpenSSL 3.6 WASM CMS (`RFC 5652` / `RFC 9629` / `RFC 9936`) `SignedData` (`ML-DSA`, `SLH-DSA`) and `AuthEnvelopedData` (`ML-KEM-768` `KEMRecipientInfo`) operations.',
    sandboxLimitation:
      'Operates on sample payloads in browser WASM; it does not test enterprise email gateway (SEG) MIME parsing, Outlook/Thunderbird client plugins, or corporate LDAP key directories.',
    productionToolRequirements: [
      'S/MIME 4.0 and CMS implementation supporting RFC 9629 `KEMRecipientInfo` (`1.2.840.113549.1.9.16.1.54` / `ori`) with `ML-KEM-768/1024` (RFC 9936) and `ML-DSA` (RFC 9881).',
      'Secure Email Gateway (SEG) content-inspection compatibility with post-quantum S/MIME envelopes.',
      'Enterprise KMS/HSM key escrow and recovery for employee `ML-KEM` decapsulation keys so encrypted mail remains recoverable after device loss.',
    ],
  },
}

const PLAYGROUND_TAMPER_SPECS: Record<string, PlaygroundTamperVerificationSpec> = {
  'cacp-kmip': {
    artifactLabel: 'KMIP 3.0 TTLV Key-State Transition Tag (ML-KEM-768 Object)',
    validVectorHex: '420079010000004842005c020000000400000002',
    tamperedVectorHex: '420079010000004842005c020000000400000003',
    expectedFailureBehavior:
      'KMIP State Transition Refusal (OASIS KMIP 3.0 §4.18): Server rejects backwards transition from Deactivated (0x03) to Active (0x02) with ResultReason = Illegal Operation.',
  },
  'hsm-capacity': {
    artifactLabel: 'PKCS#11 v3.2 Partition Object Allocation Quota Header',
    validVectorHex: '000018300000096000040000',
    tamperedVectorHex: '000018310000096000040000',
    expectedFailureBehavior:
      'Explicit HSM NVRAM Quota Rejection (PKCS#11 v3.2): C_CreateObject / C_GenerateKeyPair returns CKR_DEVICE_MEMORY (0x00000031) when PQC key blob exceeds partition free NVRAM.',
  },
  'hybrid-encrypt': {
    artifactLabel: 'X25519 (32 B) + ML-KEM-768 Ciphertext (1,088 B) Combiner Input',
    validVectorHex: '8a4e2c19f07b6d33e1a5590c44b82e719c03d4e8a1b2c3d4',
    tamperedVectorHex: '8b4e2c19f07b6d33e1a5590c44b82e719c03d4e8a1b2c3d4',
    expectedFailureBehavior:
      'Implicit Rejection + AEAD Tag Failure (FIPS 203 §7.3 & SP 800-227): 1-bit flip c[0] ^= 0x01 causes ML-KEM.Decaps to output pseudorandom K_bar != K, diverging HKDF output and failing AES-256-GCM tag check.',
  },
  'envelope-encrypt': {
    artifactLabel: 'ML-KEM-768 Wrapped DEK Ciphertext & AES-256-GCM Auth Tag (16 B)',
    validVectorHex: 'd471a83e9f02bc541167e892a34f501c7b8d9e0f1a2b3c4d',
    tamperedVectorHex: 'd571a83e9f02bc541167e892a34f501c7b8d9e0f1a2b3c4d',
    expectedFailureBehavior:
      'Envelope Unwrap Refusal (FIPS 203 §7.3 / NIST SP 800-38D): Implicit KEM rejection derives mismatched KEK so AES-256-GCM DEK unwrap fails authentication and zeroes output buffer.',
  },
  'cloud-kms-key-exchange': {
    artifactLabel: 'BYOK Import Token Attestation & Hybrid ML-KEM Wrapping Blob',
    validVectorHex: '308204a006092b608648016503040402a082048f1f2e3d4c',
    tamperedVectorHex: '318204a006092b608648016503040402a082048f1f2e3d4c',
    expectedFailureBehavior:
      'Cloud KMS ImportKeyMaterial Rejection: Target HSM rejects corrupted ASN.1 / wrapping ciphertext with InvalidCiphertextException and refuses to install customer key material.',
  },
  'token-migration': {
    artifactLabel: 'PKCS#11 v3.2 CKA_PARAMETER_SET Attribute (CKP_ML_DSA_65)',
    validVectorHex: '0000061d00000004000000020000010801',
    tamperedVectorHex: '0000061d00000004000000020000010800',
    expectedFailureBehavior:
      'PKCS#11 Template Attribute Rejection: Attempting to set CKA_SENSITIVE=FALSE (0x00) or mismatched CKA_PARAMETER_SET causes HSM to abort with CKR_TEMPLATE_INCONSISTENT (0x000000D1).',
  },
  'firmware-signing': {
    artifactLabel: 'Signed Bootloader Image Digest + ML-DSA-87 Signature (4,627 B)',
    validVectorHex: 'f39a12c844e071b5902d6e3f81a4b7c255d8e9012a3b4c5d',
    tamperedVectorHex: 'f29a12c844e071b5902d6e3f81a4b7c255d8e9012a3b4c5d',
    expectedFailureBehavior:
      'Boot ROM Hard Halt (FIPS 204 §5.3): 1-bit flip in firmware payload or ML-DSA-87 signature causes c_tilde_prime != c_tilde; immutable Boot ROM halts execution before jumping to stage-1 bootloader.',
  },
  'slh-dsa': {
    artifactLabel: 'FIPS 205 SLH-DSA-SHA2-128s Signature (7,856 B FORS + Hypertree)',
    validVectorHex: '7c1e904a2b88d31f65a0c4e791b238d40f1e2d3c4b5a6978',
    tamperedVectorHex: '7d1e904a2b88d31f65a0c4e791b238d40f1e2d3c4b5a6978',
    expectedFailureBehavior:
      'Explicit Verification Rejection (FIPS 205 §10.3): 1-bit flip in FORS authentication path cascades through SHA-256 hypertree nodes so reconstructed root != PK.root; slh_verify() returns false.',
  },
  'lms-hss': {
    artifactLabel: 'NIST SP 800-208 LMS Leaf Index Counter q (Monotonic State)',
    validVectorHex: '0000002a0000000591a4c8e27b3f106d44e8a9c12b3d4e5f',
    tamperedVectorHex: '0000002b0000000591a4c8e27b3f106d44e8a9c12b3d4e5f',
    expectedFailureBehavior:
      'Merkle Root Mismatch & State Reuse Refusal (SP 800-208 §5): Mutating leaf index q (0x2a -> 0x2b) alters left/right Merkle path hashing so Tc != T[1]; HSM also blocks signing if NVRAM counter q is re-used.',
  },
  'hybrid-sigs': {
    artifactLabel: 'RFC 10073 Composite ML-DSA-65 + ECDSA-P256 Signature Value',
    validVectorHex: '30820d3404820ced9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    tamperedVectorHex: '30820d3404820ced9b8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    expectedFailureBehavior:
      'Composite AND-Verification Refusal (RFC 10073): Corrupting 1 bit of the ML-DSA-65 component causes composite verify() to return false immediately even when the ECDSA-P256 component is intact.',
  },
  'kdf-derivation': {
    artifactLabel: 'SP 800-227 Hybrid KDF Input Block (Z_ecdh || Z_mlkem || Context)',
    validVectorHex: '5e81c309a47d2f66b019e83c45a7d1f288c9e0a1b2c3d4e5',
    tamperedVectorHex: '5f81c309a47d2f66b019e83c45a7d1f288c9e0a1b2c3d4e5',
    expectedFailureBehavior:
      'Avalanche Key Divergence (SP 800-56C / SP 800-227): 1-bit mutation in shared secret or protocol context flips ~50% of derived HKDF output bits, causing immediate handshake MAC / AEAD failure.',
  },
  'tee-channel': {
    artifactLabel: 'TEE Remote Attestation Quote MRTD + X25519MLKEM768 Binding Hash',
    validVectorHex: 'a19f4408c2e731b6d5089a2c47e1f3b866d0c9a2e4f61829',
    tamperedVectorHex: 'a09f4408c2e731b6d5089a2c47e1f3b866d0c9a2e4f61829',
    expectedFailureBehavior:
      'RA-TLS Channel-Binding & Measurement Rejection: Verifier detects mismatch between TLS session exporter hash / enclave MRTD and signed attestation quote reportData, terminating the connection.',
  },
  'tls-simulator': {
    artifactLabel: 'TLS 1.3 ServerHello KeyShare (0x11EC X25519MLKEM768, 1,120 B)',
    validVectorHex: '11ec04606b29a8f14c03e9d277b51a4c8e90f2d1a3b5c7d9',
    tamperedVectorHex: '11ec04606a29a8f14c03e9d277b51a4c8e90f2d1a3b5c7d9',
    expectedFailureBehavior:
      'TLS 1.3 Finished VerifyData Alert (RFC 8446 §4.4.4 & FIPS 203 §7.3): 1-bit flip in ML-KEM key_share causes implicit rejection to derive a different Handshake Traffic Secret, failing decrypt_error (51).',
  },
  'vpn-sim': {
    artifactLabel: 'IKEv2 RFC 9370 IKE_INTERMEDIATE ADDKE1 (ML-KEM-768) Payload',
    validVectorHex: '2b00044c000000004f81c2e9a37b1d6055e8a4c291b3d5e7',
    tamperedVectorHex: '2b00044c000000004e81c2e9a37b1d6055e8a4c291b3d5e7',
    expectedFailureBehavior:
      'IKEv2 IntAuth MAC Rejection (RFC 9370 §3.3): Tampering with the IKE_INTERMEDIATE ML-KEM payload alters both SK_d and the IntAuth transcript hash, causing IKE_AUTH to abort with AUTHENTICATION_FAILED.',
  },
  'pqc-ssh-sim': {
    artifactLabel: 'SSHv2 SSH_MSG_KEX_ECDH_REPLY (mlkem768x25519-sha256)',
    validVectorHex: '1f000004609c31a7e408b2d56f11c9e34a8b7d201e3f5a7b',
    tamperedVectorHex: '1f000004609d31a7e408b2d56f11c9e34a8b7d201e3f5a7b',
    expectedFailureBehavior:
      'SSH Exchange Hash H Signature Refusal: 1-bit mutation in the hybrid KEX reply changes the SHA-256 exchange hash H so host-key signature verification fails and client disconnects.',
  },
  'suci-flow': {
    artifactLabel: '3GPP TS 33.501 SUCI Hybrid ML-KEM-768 Concealed MSIN + MAC Tag',
    validVectorHex: '0100f110000204407a92e1c48b30d5f612a4c8e09b1d3f5a',
    tamperedVectorHex: '0100f110000204407b92e1c48b30d5f612a4c8e09b1d3f5a',
    expectedFailureBehavior:
      '5G UDM/SIDF Deconcealment Failure (TS 33.501): Implicit KEM rejection produces wrong K_enc / K_mac; 64-bit SUCI MAC check fails at SIDF and 5G registration is rejected without leaking SUPI.',
  },
  'mls-group-messaging': {
    artifactLabel: 'RFC 9420 MLS Commit UpdatePath (X25519MLKEM768) + ParentHash',
    validVectorHex: '000204603e89a1c75b20d4f891e3a6c20f4b8d1e2a3c4d5e',
    tamperedVectorHex: '000204603f89a1c75b20d4f891e3a6c20f4b8d1e2a3c4d5e',
    expectedFailureBehavior:
      'MLS Epoch ConfirmationTag & ParentHash Refusal (RFC 9420 §12.4): Corrupting 1 bit of the TreeKEM ciphertext or parent_hash causes receiving members to reject the Commit and halt epoch advancement.',
  },
  'tpm-playground': {
    artifactLabel: 'TPM2_Quote Attestation Structure (TPMS_ATTEST) + PCR Digest',
    validVectorHex: 'ff54434780180022000b6e41a8c290f3d1e577b24a8c0e1f',
    tamperedVectorHex: 'ff54434780180022000b6f41a8c290f3d1e577b24a8c0e1f',
    expectedFailureBehavior:
      'TPM2 PolicyPCR & Quote Verification Refusal: 1-bit difference in PCR composite digest invalidates the TPM quote signature and blocks TPM2_Unseal with TPM_RC_POLICY_FAIL (0x0000019D).',
  },
  'rng-demo': {
    artifactLabel: 'SP 800-90B Raw Physical Noise Sample Window (RCT Health Check)',
    validVectorHex: '94e17b2c08f3a65d41c9e072b83a5f1d62c4e8901a3b5d7f',
    tamperedVectorHex: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    expectedFailureBehavior:
      'SP 800-90B §4.4.1 Repetition Count Test (RCT) Alarm: Stuck-at fault repeating identical sample values exceeds cutoff C = 1 + ceil(-log2(alpha)/H), latching the entropy source into hard error state.',
  },
  'qrng-demo': {
    artifactLabel: 'SP 800-90C Hybrid QRNG + OS TRNG Conditioning Input Frame',
    validVectorHex: '3b7e91c4a052d8f619e3b7c044a8d2f17c9e0b2d4f6a8c1e',
    tamperedVectorHex: '000000000000000019e3b7c044a8d2f17c9e0b2d4f6a8c1e',
    expectedFailureBehavior:
      'Pre-Combiner Health-Test Isolation (SP 800-90C): Zeroed QRNG appliance stream triggers independent source APT/RCT failure alarm while HMAC/KMAC combiner preserves security via local OS TRNG.',
  },
  'entropy-test': {
    artifactLabel: 'SP 800-90B Non-IID Min-Entropy Assessment Stream (APT Window)',
    validVectorHex: 'c841f9207e3b6a15d094c2e83f71a5b92d4e6f801b3c5d7e',
    tamperedVectorHex: 'c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
    expectedFailureBehavior:
      'Adaptive Proportion Test (APT) & Min-Entropy Collapse Refusal (SP 800-90B §4.4.2): Symbol 0xC8 frequency exceeds 512-sample window cutoff; min-entropy H_min drops below threshold and seeding is blocked.',
  },
  'drbg-demo': {
    artifactLabel: 'SP 800-90A AES-256 CTR_DRBG Working State (Key, V, reseed_counter)',
    validVectorHex: '00000000000000017f42a9c1e803b5d26a91c4e70b2d4f68',
    tamperedVectorHex: '00010000000000017f42a9c1e803b5d26a91c4e70b2d4f68',
    expectedFailureBehavior:
      'SP 800-90A Reseed Interval Enforcement (§10.2.1): When reseed_counter exceeds 2^48 (0x0001000000000000), CTR_DRBG_Generate refuses to output bits and returns ERROR_FLAG requiring mandatory Reseed.',
  },
  'source-combining': {
    artifactLabel: 'Multi-Source Entropy Combiner Authentication Tag (HMAC-SHA512)',
    validVectorHex: 'e2904b7c18a3f56d90c1e4a73b82d5f06a1c3e5f7b9d0e2a',
    tamperedVectorHex: 'e3904b7c18a3f56d90c1e4a73b82d5f06a1c3e5f7b9d0e2a',
    expectedFailureBehavior:
      'Vetted Conditioning Integrity Failure (FIPS 140-3 IG D.K): 1-bit tamper on external entropy transport frame invalidates the authenticated conditioning MAC and rejects the frame before DRBG reseeding.',
  },
  'pki-workshop': {
    artifactLabel: 'X.509v3 TBSCertificate + ML-DSA-65 SignatureValue (3,309 B)',
    validVectorHex: '30820ce5060960864801650304031203820cd2008a4f2c19',
    tamperedVectorHex: '30820ce5060960864801650304031203820cd2008b4f2c19',
    expectedFailureBehavior:
      'X.509 Signature Verification Failure (RFC 9881 / FIPS 204 §5.3): 1-bit flip in ML-DSA-65 BIT STRING causes X509_verify() to return 0 with X509_V_ERR_CERT_SIGNATURE_FAILURE.',
  },
  'cert-capacity': {
    artifactLabel: 'TLS 1.3 Certificate Record Length Header (3x ML-DSA-65 Chain)',
    validVectorHex: '16030338a00b00389c000038990011203082111c30820430',
    tamperedVectorHex: '16030378a00b00789c000078990011203082111c30820430',
    expectedFailureBehavior:
      'TLS Record Overflow / Max-Cert-Chain Alert (RFC 8446 §4.4.2): Exceeding configured max_certificate_list size or corrupting the 24-bit length header triggers decode_error (50) / record_overflow (22).',
  },
  'hybrid-certs': {
    artifactLabel: 'RFC 10073 Composite ML-DSA-65-ECDSA-P256 SubjectPublicKeyInfo',
    validVectorHex: '308207f2300b06092b06010505070626038207df00308207',
    tamperedVectorHex: '308207f2300b06092b06010505070626038207df00318207',
    expectedFailureBehavior:
      'Composite Certificate ASN.1 & Dual-Verify Rejection (RFC 10073): Malformed SEQUENCE tag or 1-bit corruption in either component signature causes path validation to fail closed.',
  },
  'merkle-proof': {
    artifactLabel: 'RFC 9162 Domain-Separated Merkle Inclusion Proof Node (0x01 || L || R)',
    validVectorHex: '015f8c2a91e407b3d618a0c4e92b7f3184d6e0a2c4f6183a',
    tamperedVectorHex: '005f8c2a91e407b3d618a0c4e92b7f3184d6e0a2c4f6183a',
    expectedFailureBehavior:
      'Second-Preimage Domain-Prefix Rejection (RFC 9162 §2.1): Replacing internal node prefix 0x01 with leaf prefix 0x00 (or flipping 1 sibling bit) produces a root mismatch against the signed TreeHead.',
  },
  'digital-id': {
    artifactLabel: 'ISO/IEC 18013-5 mDL COSE_Sign1 Mobile Security Object (ML-DSA-65)',
    validVectorHex: 'd28443a101390105a058409b2e4c71a803f5d612e9a4c08b',
    tamperedVectorHex: 'd28443a101390105a058409a2e4c71a803f5d612e9a4c08b',
    expectedFailureBehavior:
      'mDL Reader COSE_Sign1 & ValueDigest Refusal (ISO/IEC 18013-5 §9): 1-bit flip in MSO digest or ML-DSA signature causes reader verification to reject the credential presentation.',
  },
  'bitcoin-flow': {
    artifactLabel: 'Taproot / Post-Quantum Witness Script Commitment (32-Byte Hash)',
    validVectorHex: '51209e41a8c27b03f6d518e2a9c470b1d3f58a2c4e60193b',
    tamperedVectorHex: '51209f41a8c27b03f6d518e2a9c470b1d3f58a2c4e60193b',
    expectedFailureBehavior:
      'Consensus Witness Commitment Rejection: 1-bit flip in the witness public-key / script root commitment invalidates script-path / signature verification and causes node mempool rejection.',
  },
  'hd-wallet': {
    artifactLabel: 'Hardened PQC Master Seed Derivation Path (m/44\'/9999\'/0\' + HMAC-SHA512)',
    validVectorHex: '8000002c8000270f800000004a91c8e27b30f5d612a4c8e9',
    tamperedVectorHex: '0000002c8000270f800000004a91c8e27b30f5d612a4c8e9',
    expectedFailureBehavior:
      'Non-Hardened Lattice Derivation Refusal: Clearing hardened bit 0x80000000 is rejected by PQC HD wallet policy because FIPS 203/204 seeds (d, z, xi) cannot safely perform unhardened public-key child derivation.',
  },
  'solana-flow': {
    artifactLabel: 'Solana PDA Lattice Vault Authority Signature (ML-DSA-44, 2,420 B)',
    validVectorHex: '01009b4e21c87a30f6d512e8a4c90b1d3f5a7c9e0b2d4f68',
    tamperedVectorHex: '01009a4e21c87a30f6d512e8a4c90b1d3f5a7c9e0b2d4f68',
    expectedFailureBehavior:
      'On-Chain Program Signature Verification Revert: 1-bit flip in the pre-staged ML-DSA-44 signature causes the vault verification instruction to fail with SignatureVerificationFailed (custom program error).',
  },
  'openssl-studio': {
    artifactLabel: 'OpenSSL 3.6 EVP_PKEY ML-KEM-768 Ciphertext / ML-DSA-65 Signature Blob',
    validVectorHex: '4b82e91c07a3f5d618e2a4c970b1d3f58a2c4e60193b5d7f',
    tamperedVectorHex: '4a82e91c07a3f5d618e2a4c970b1d3f58a2c4e60193b5d7f',
    expectedFailureBehavior:
      'OpenSSL 3.6 Provider Refusal: `openssl pkeyutl -verify` outputs "Signature Verification Failure" (exit code 1) on 1-bit signature tamper, and `-decap` performs FIPS 203 implicit rejection.',
  },
  'api-security-jwt': {
    artifactLabel: 'JWS Compact Serialization Signature Segment (ML-DSA-65, 3,309 B)',
    validVectorHex: '4d4c2d4453412d36352e7369672e8a4f2c19e07b6d33a1c5',
    tamperedVectorHex: '4d4c2d4453412d36352e7369672e8b4f2c19e07b6d33a1c5',
    expectedFailureBehavior:
      'JWS Signature & Algorithm-Confusion Rejection (RFC 7515 / FIPS 204): 1-bit flip in signature segment or `alg:none` header causes verifier to return HTTP 401 Unauthorized (ERR_JWS_SIGNATURE_INVALID).',
  },
  'pki-enrollment': {
    artifactLabel: 'CMPv3 (RFC 9810) CertConfirmContent certHash (SHA-256 over ML-KEM Cert)',
    validVectorHex: '302904207e91a4c82b03f6d518e2a9c470b1d3f58a2c4e60',
    tamperedVectorHex: '302904207f91a4c82b03f6d518e2a9c470b1d3f58a2c4e60',
    expectedFailureBehavior:
      'CMPv3 POP Confirmation Rejection (RFC 9810 §5.3.18): 1-bit mismatch in certConf certHash proves client failed to decapsulate encrCert; CA rejects with PKIFailureInfo = badCertId / badPOP.',
  },
  'email-signing': {
    artifactLabel: 'CMS (RFC 9629 / RFC 9936) KEMRecipientInfo ML-KEM-768 Encapsulated Key',
    validVectorHex: '30820472020100301806092b608648016503040402048204',
    tamperedVectorHex: '30820472020100301806092b608648016503040402048304',
    expectedFailureBehavior:
      'CMS AuthEnvelopedData Unwrap & Signature Refusal (RFC 9629): Tampering with the KEM ciphertext or signed MIME body causes `openssl cms -decrypt / -verify` to fail authentication and discard output.',
  },
}

const DEFAULT_SANDBOX_TAMPER_SPEC: PlaygroundTamperVerificationSpec = {
  artifactLabel: 'Containerized PQC Handshake & Signature Transcript Vector',
  validVectorHex: '11ec04608a4f2c19e07b6d33a1c5590c44b82e719c03d4e8',
  tamperedVectorHex: '11ec04608b4f2c19e07b6d33a1c5590c44b82e719c03d4e8',
  expectedFailureBehavior:
    'Deterministic Tamper Refusal (FIPS 203 §7.3 / FIPS 204 §5.3): 1-bit mutation (`^ 0x01`) causes implicit KEM secret divergence or explicit signature verification failure.',
}

export const PLAYGROUND_CAPABILITY_CHECKLISTS: Record<string, PlaygroundCapabilitySpec> =
  Object.fromEntries(
    Object.entries(PLAYGROUND_SEEDS).map(([toolId, seed]) => [
      toolId,
      {
        toolId,
        ...seed,
        // eslint-disable-next-line security/detect-object-injection
        tamperVerification: PLAYGROUND_TAMPER_SPECS[toolId] ?? DEFAULT_SANDBOX_TAMPER_SPEC,
      },
    ])
  )

export const ALL_PLAYGROUND_TOOL_IDS: string[] = Object.keys(PLAYGROUND_CAPABILITY_CHECKLISTS)

export function getPlaygroundCapabilityChecklist(toolId: string): PlaygroundCapabilitySpec {
  // eslint-disable-next-line security/detect-object-injection
  const direct = PLAYGROUND_CAPABILITY_CHECKLISTS[toolId]
  if (direct) return direct

  // Fallback for Docker-backed `sbx-*` sandbox scenario routes
  return {
    toolId,
    whatCheckEstablishes:
      'Demonstrates containerized post-quantum protocol and infrastructure configuration patterns in an isolated educational lab environment.',
    sandboxLimitation:
      'Runs in an isolated educational container with synthetic keys and test traffic; it does not validate your production network topology, hardware HSMs, or live service SLAs.',
    productionToolRequirements: [
      'FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) support verified in your production cryptographic libraries and network gateways.',
      'Automated positive Known-Answer Tests (KATs) and negative tamper/downgrade rejection tests in your staging CI/CD pipeline.',
      'Centralized CBOM and telemetry verification confirming post-quantum algorithm negotiation across production endpoints.',
    ],
    tamperVerification: DEFAULT_SANDBOX_TAMPER_SPEC,
  }
}
