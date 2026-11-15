// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Standardized Production-Tool Capability Checklists for all Playground Tools.
 *
 * Maps each interactive Playground tool to:
 * - whatCheckEstablishes: What the sample check demonstrates mathematically/mechanically
 * - sandboxLimitation: Why browser WASM/JS execution does not verify a deployed system
 * - productionToolRequirements: Concrete capabilities to require and test in production tools
 */

export interface PlaygroundCapabilitySpec {
  toolId: string
  whatCheckEstablishes: string
  sandboxLimitation: string
  productionToolRequirements: [string, string, string]
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
      'Automated key-state transition enforcement per the KMIP state model (Pre-Active, Active, Deactivated, Compromised, Destroyed, Destroyed Compromised) with tamper-evident audit logs.',
      'Mutual TLS 1.3 with a hybrid PQC key-exchange group (for example `X25519MLKEM768`) between KMIP clients and key managers, where both ends support it (KMIP 3.0 itself does not mandate TLS 1.3 or hybrid groups).',
    ],
  },
  'hsm-capacity': {
    whatCheckEstablishes:
      'Calculates projected HSM NVRAM storage, partition object counts, and throughput impact when migrating from RSA/ECDSA keys to larger ML-KEM, ML-DSA, or LMS/XMSS keys.',
    sandboxLimitation:
      'Performs deterministic arithmetic sizing from parameter-set byte sizes; it does not benchmark real HSM hardware latency, bus contention, or firmware memory fragmentation.',
    productionToolRequirements: [
      'HSM firmware with vendor-documented NVRAM object overhead for ML-KEM-768/1024, ML-DSA-65/87, and stateful LMS/XMSS trees (PKCS#11 v3.2 defines the mechanisms but not storage overhead).',
      'Load-tested signing/decapsulation ops/sec under multi-tenant partition concurrency on your actual HSM appliance model.',
      'High-availability HSM cluster replication and backup capacity sized for substantially larger post-quantum key and signature objects (for example an ML-DSA-65 signature is 3,309 B against 256 B for RSA-2048).',
    ],
  },
  'hybrid-encrypt': {
    whatCheckEstablishes:
      'Executes real in-browser ECDH (X25519 / P-256) + FIPS 203 ML-KEM encapsulation, combining both shared secrets through a KDF combiner to derive an AES-256-GCM key.',
    sandboxLimitation:
      'Browser WASM/WebCrypto execution lacks constant-time hardware guarantees, side-channel protection, and FIPS 140-3 validated module boundaries.',
    productionToolRequirements: [
      'PQ/T hybrid KEM combiner built from an SP 800-56C-approved key-derivation method (SP 800-227 §4.6.2; ETSI TS 103 744), using HKDF-SHA256/384 or KMAC256; IETF RFC 9794 supplies the terminology.',
      'FIPS 203 §7.2 encapsulation-key (modulus) check, and implicit rejection in decapsulation (§6.3/§7.3), on tampered ML-KEM ciphertexts.',
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
      'HSM signing appliance (FIPS 140 Level 3+, SP 800-208 §8) that stores the incremented leaf index in non-volatile memory before exporting any signature.',
    ],
  },
  'slh-dsa': {
    whatCheckEstablishes:
      'Runs real NIST FIPS 205 SLH-DSA key generation, signing, and verification across SHA2/SHAKE `-s` (small) and `-f` (fast) parameter sets in WASM.',
    sandboxLimitation:
      'Browser WASM timing depends on host CPU/JIT and does not establish hardware throughput or side-channel fault immunity.',
    productionToolRequirements: [
      'CAVP-validated FIPS 205 `SLH-DSA` implementation supporting the SLH-DSA SHA2/SHAKE parameter sets your policy needs (`128s/f`, `192s/f`, `256s/f`) and RFC 9909 OIDs.',
      'Context-string (`ctx`, 0–255 bytes, default empty) support per FIPS 205 §10.2.1 for domain separation.',
      'Transport and storage buffers sized for 7,856 B (`128s`) up to 49,856 B (`256f`) signatures.',
    ],
  },
  'lms-hss': {
    whatCheckEstablishes:
      'Demonstrates NIST SP 800-208 / RFC 8554 Leighton-Micali (LMS / HSS) Merkle-tree key generation, one-time leaf index advancement, and signature verification.',
    sandboxLimitation:
      "Browser state resets on reload; in production, reusing a single LMS leaf index due to VM rollback or NVRAM failure allows signature forgery and breaks the key's security.",
    productionToolRequirements: [
      'A FIPS 140 Level 3+ hardware module that stores the incremented LMS/HSS leaf index in non-volatile memory before releasing any signature (SP 800-208 §8); a monotonic counter is a useful aid, not a requirement.',
      'No export, backup or cloning of LMS/HSS/XMSS private keying material (SP 800-208 §8); use multi-tree HSS/XMSS^MT with sub-trees on separate modules for redundancy.',
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
      'Prefix/Label domain separation as defined in RFC 10073 §2.2 and §9.4, and no reuse of component keys outside the composite (RFC 10073 §9.4 MUST).',
      'Negative test verification confirming that corrupting either the classical or the ML-DSA component causes overall verification failure.',
    ],
  },
  'kdf-derivation': {
    whatCheckEstablishes:
      'Demonstrates HKDF (RFC 5869), SP 800-108, and SP 800-56C / SP 800-227 key derivation combining classical ECDH and post-quantum ML-KEM shared secrets with context labels.',
    sandboxLimitation:
      'Runs in browser WASM/WebCrypto; it does not enforce hardware key-isolation attributes on derived keys.',
    productionToolRequirements: [
      'SP 800-227 / ETSI TS 103 744 compliant hybrid KDF combiner, preferably one that binds ciphertexts, encapsulation keys and a domain separator into the derivation (SP 800-227 §4.6.2).',
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
      'Hardware-rooted TEE attestation verification checking platform certificates, TCB SVN levels, and measurement registers (for example Intel TDX `MRTD`/`RTMR`).',
      'Cryptographic channel binding (exporter or public-key hash in quote reportData) linking the `X25519MLKEM768` TLS session to the attested enclave.',
      'Post-quantum roadmap for silicon vendor VCEK/ASK attestation root signatures.',
    ],
  },
  'tls-simulator': {
    whatCheckEstablishes:
      'Runs a real OpenSSL 3.6 WASM in-memory TLS 1.3 handshake (`SSL_CTX`) negotiating hybrid (`X25519MLKEM768`) or pure PQC groups and PQC certificates.',
    sandboxLimitation:
      'Uses in-memory BIO buffers without kernel TCP/IP segmentation, middlebox DPI inspection, or real WAN packet loss.',
    productionToolRequirements: [
      'TLS 1.3 hybrid key exchange (`X25519MLKEM768`, codepoint `0x11EC`) enabled on production TLS libraries, CDNs, and ingress controllers.',
      'RFC 8879 TLS Certificate Compression (Brotli/Zstd) and TCP Initial Congestion Window (`initcwnd >= 10`) tuning for multi-kilobyte PQC cert chains, enabled where supported, and measured against your own chains.',
      'Active monitoring for middlebox clientHello drops on multi-packet TCP ClientHellos (`> 1,500 B`).',
    ],
  },
  'vpn-sim': {
    whatCheckEstablishes:
      'Demonstrates IKEv2 (RFC 7296 + RFC 9370 Multiple Key Exchanges) negotiation combining classical Diffie-Hellman in `IKE_SA_INIT` with `ML-KEM` in `IKE_INTERMEDIATE`.',
    sandboxLimitation:
      'Browser protocol simulation does not test physical router UDP fragmentation, NAT-T traversal, or hardware IPsec ESP offload.',
    productionToolRequirements: [
      'IKEv2 additional key exchanges per RFC 9370 (`ADDKE1..ADDKE7`) over `IKE_INTERMEDIATE` (RFC 9242), with ML-KEM-768/1024 (draft-ietf-ipsecme-ikev2-mlkem), in your VPN concentrators; confirm per product (strongSwan 6.x, Cisco IOS XE 26 and Fortinet FortiOS 7.6+ document ML-KEM IKEv2).',
      'RFC 7383 IKEv2 Message Fragmentation and RFC 9329 TCP encapsulation fallback when UDP fragments are dropped on transit paths.',
      'AES-256-GCM (`ENCR_AES_GCM_16`, 256-bit keys) for ESP and `PRF_HMAC_SHA2_384/512` for the IKE SA, where policy requires 256-bit strength.',
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
      'SIDF and USIM support for operator-defined post-quantum SUCI protection schemes (TS 33.501 Annex C.1 allows up to 3,000 octets of scheme output; no standardized PQ profile exists in Rel-19).',
      'HSM-backed Home Network Private Key custody with automated key-identifier (`Home Network Public Key ID`) rotation.',
      'NAS registration payload budget verification for ~1.1 KB (`ML-KEM-768`) SUCI ciphertexts.',
    ],
  },
  'mls-group-messaging': {
    whatCheckEstablishes:
      'Demonstrates RFC 9420 Messaging Layer Security (MLS) TreeKEM group key establishment and epoch ratcheting, plus draft post-quantum ciphersuites (draft-ietf-mls-pq-ciphersuites).',
    sandboxLimitation:
      'Runs in a single browser session; it does not test distributed Delivery Service message ordering or multi-device offline queue synchronization.',
    productionToolRequirements: [
      'MLS (RFC 9420) implementation that also supports the draft PQ ciphersuites (draft-ietf-mls-pq-ciphersuites) with a hybrid ML-KEM KEM and `ML-DSA` signatures.',
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
      'TCG TPM 2.0 Library Version 185 or later firmware/hardware supporting post-quantum algorithms (`ML-DSA`, `HashML-DSA`, `ML-KEM`) as silicon ships.',
      'Hybrid TPM + host software/HSM key-wrapping patterns where existing soldered TPM 2.0 chips support only classical algorithms (typically RSA-2048 / ECC P-256 at minimum).',
      'PCR-bound sealing policies verified against signed UEFI Secure Boot and OS kernel measurements.',
    ],
  },
  'rng-demo': {
    whatCheckEstablishes:
      'Demonstrates raw noise sampling, conditioning, and pseudorandom bit sequence generation for cryptographic seeding.',
    sandboxLimitation:
      'Browser `crypto.getRandomValues` / simulated noise sources do not expose physical ring-oscillator or avalanche-diode hardware telemetry.',
    productionToolRequirements: [
      'NIST SP 800-90B ESV-validated physical entropy sources feeding SP 800-90A `CTR_DRBG` / `Hash_DRBG` with a security strength at least that of the target parameter set (FIPS 203 §3.3: 128, 192 or 256 bits; use 256 for ML-KEM-1024 and CNSA 2.0 profiles).',
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
      'Entropy combination per SP 800-90C (RBG3(XOR)/RBG3(RS)) and CMVP IG D.O, where each source (including a QRNG) is itself SP 800-90B validated; a local OS/HSM source is a design choice, not a requirement.',
      'Authenticated, integrity-protected transport if entropy is streamed from an external appliance over a network or PCIe bus.',
      'Continuous SP 800-90B health tests (Repetition Count Test, Adaptive Proportion Test) on each raw source prior to conditioning.',
    ],
  },
  'entropy-test': {
    whatCheckEstablishes:
      'Executes statistical and NIST SP 800-90B style min-entropy estimators (Most Common Value, Collision, Markov, Compression) and the RCT/APT health tests on sample byte streams.',
    sandboxLimitation:
      'Browser-scale sample windows are for educational inspection; formal NIST entropy source validation (ESV) needs at least 1,000,000 raw noise samples (SP 800-90B §3.1.1), plus restart tests, assessed by an NVLAP-accredited laboratory.',
    productionToolRequirements: [
      'Formal NIST Entropy Source Validation (ESV) per SP 800-90B using the official NIST C++ `ea_iid` / `ea_non_iid` assessment suite.',
      'Stochastic model justification documenting the physical noise mechanism and quantization process.',
      'Configured RCT and APT cutoff thresholds matching the target false-positive probability (SP 800-90B recommends 2^-20 to 2^-40).',
    ],
  },
  'drbg-demo': {
    whatCheckEstablishes:
      'Demonstrates NIST SP 800-90A Deterministic Random Bit Generator (`HMAC_DRBG` / `CTR_DRBG`) state transitions: `Instantiate`, `Reseed`, `Generate`, and prediction resistance.',
    sandboxLimitation:
      'Educational state visualizer in the browser; production DRBGs should execute inside a validated cryptographic module boundary (FIPS 140-3).',
    productionToolRequirements: [
      'CAVP-validated NIST SP 800-90A Rev. 1 DRBG instantiated at 256-bit security strength (`AES-256 CTR_DRBG` or `SHA-512 Hash/HMAC_DRBG`).',
      'Reseed intervals at or below the SP 800-90A limit of 2^48 requests, and, as good practice, a prediction-resistance reseed before high-value PQC Root CA key generation.',
      'Zeroization of internal DRBG working state (`V`, `Key` / `C`) upon uninstantiation or error.',
    ],
  },
  'source-combining': {
    whatCheckEstablishes:
      'Demonstrates cryptographic conditioning and PRF/HKDF/XOR combining of multiple independent entropy sources so security holds if at least one source remains unpredictable.',
    sandboxLimitation:
      'In-browser demonstration using synthetic streams; it does not isolate hardware failure domains across shared power rails or clocks.',
    productionToolRequirements: [
      'SP 800-90B vetted conditioning components (`HMAC`, `CMAC`, `AES-CBC-MAC`, approved hash, `Hash_df`, `Block_Cipher_df`) and FIPS 140-3 IG D.O / SP 800-90C when combining entropy sources.',
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
      'CA software that supports RFC 9881 (`ML-DSA`) and, where needed, RFC 9909 (`SLH-DSA`) X.509 OIDs; check each product (for example EJBCA and DigiCert Trust Lifecycle Manager list both, Microsoft AD CS and AWS Private CA list ML-DSA).',
      'Root and Issuing CA private keys in a FIPS 140-3 validated HSM (Level 3 or higher where your CA policy requires it), with multi-person activation.',
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
      'Inspects dual/hybrid X.509 certificate structures including IETF Composite ML-DSA (RFC 10073), Related Certificates (RFC 9763), and parallel chains.',
    sandboxLimitation:
      'Browser ASN.1 inspection and mock issuance do not validate whether your specific production TLS clients, browsers, or Java/Go/C# trust stores accept the extension.',
    productionToolRequirements: [
      'End-to-end relying-party compatibility testing confirming whether target clients support RFC 10073 Composite ML-DSA, RFC 9763 Related Certificates, or parallel dual-cert deployment.',
      'CA policy enforcement that the composite key pair is fresh (no reuse of component keys, RFC 10073 §9.4) and that proof of possession covers the composite signature.',
      'Revocation of the composite certificate invalidates the whole composite credential.',
    ],
  },
  'merkle-proof': {
    whatCheckEstablishes:
      'Constructs a SHA-256 Merkle tree over a batch of certificates and generates/verifies compact logarithmic (O(log N)) inclusion proofs alongside a single PQC tree-head signature.',
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
      'COSE (RFC 9052) and JOSE (draft PQ algorithm registrations) support for post-quantum signatures in issuer backends and mobile wallet SDKs.',
      'BLE / NFC APDU fragmentation and session-establishment latency measured on physical reader terminals against your own transaction-time target.',
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
      'Recognition that non-hardened public-key parent-to-child derivation (BIP-32 xpub) does not directly translate to NIST FIPS 203/204/205 key generation.',
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
      'Transaction chunking or pre-staged verification state to accommodate ML-DSA signatures of 2.4 KB and larger (ML-DSA-44 is 2,420 B) across 1,232-byte packet limits.',
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
      'Strict JWS algorithm allowlisting (`ML-DSA-65`, per the JOSE ML-DSA draft) in token verifiers.',
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
      'EST (RFC 7030) and ACME (RFC 8555) support for `ML-DSA` (RFC 9881 identifiers) PKCS#10 CSRs, with mutual TLS for EST and account-key JWS authentication for ACME.',
      'Negative enrollment testing confirming the CA rejects mismatched `certConf` hashes, invalid CSR signatures, and unauthorized renewal signers.',
    ],
  },
  'email-signing': {
    whatCheckEstablishes:
      'Executes real OpenSSL 3.6 WASM CMS (RFC 5652; RFC 9882 and RFC 9814 for SignedData; RFC 9629 / RFC 9936 for `KEMRecipientInfo`) `SignedData` (`ML-DSA`, `SLH-DSA`) and `AuthEnvelopedData` (`ML-KEM-768`) operations.',
    sandboxLimitation:
      'Operates on sample payloads in browser WASM; it does not test enterprise email gateway (SEG) MIME parsing, Outlook/Thunderbird client plugins, or corporate LDAP key directories.',
    productionToolRequirements: [
      'S/MIME 4.0 and CMS implementation supporting RFC 9629 `KEMRecipientInfo` (`id-ori-kem`, 1.2.840.113549.1.9.16.13.3) with `ML-KEM-768/1024` (RFC 9936) and `ML-DSA` (RFC 9882; RFC 9881 for certificates).',
      'Secure Email Gateway (SEG) content-inspection compatibility with post-quantum S/MIME envelopes.',
      'Enterprise KMS/HSM key escrow and recovery for employee `ML-KEM` decapsulation keys so encrypted mail remains recoverable after device loss.',
    ],
  },
}

export const PLAYGROUND_CAPABILITY_CHECKLISTS: Record<string, PlaygroundCapabilitySpec> =
  Object.fromEntries(
    Object.entries(PLAYGROUND_SEEDS).map(([toolId, seed]) => [
      toolId,
      {
        toolId,
        ...seed,
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
      'Automated known-answer tests (KATs) and negative tests (corrupted inputs, downgrade attempts) in your staging CI/CD pipeline.',
      'Centralized CBOM and telemetry verification confirming post-quantum algorithm negotiation across production endpoints.',
    ],
  }
}
