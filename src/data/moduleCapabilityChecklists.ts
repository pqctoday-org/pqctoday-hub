// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Standardized Production-Tool Capability Checklists for every Learning Module.
 *
 * Each checklist:
 * - Teaches each role what capabilities to require in their own production tools:
 *   what the capability does, why it is needed, how to evaluate/test it, what
 *   evidence demonstrates it, and its limitations.
 * - Maps Hub sample demonstrations to production tool capability requirements
 *   while maintaining the strict boundary that completing a Hub sample exercise
 *   teaches decision criteria and does not verify or certify a deployed system.
 */

export interface ModuleCapabilitySpec {
  moduleId: string
  roleFocus: string
  productionCapabilities: [string, string, string]
  evaluationMethod: string
  evidenceRequired: string
  sources?: { label: string; href: string }[]
  educationalBoundary: string
}

export type ModuleCapabilityChecklist = ModuleCapabilitySpec

const DEFAULT_EDUCATIONAL_BOUNDARY =
  'Completing this Hub module and its browser-based sample exercises teaches the technical and governance decision criteria for your role; it does not test, validate, or certify your deployed production systems.'

interface RawModuleCapabilitySeed {
  roleFocus: string
  productionCapabilities: [string, string, string]
  evaluationMethod: string
  evidenceRequired: string
  sources?: { label: string; href: string }[]
}

const MODULE_CAPABILITY_SEEDS: Record<string, RawModuleCapabilitySeed> = {
  'cert-quantum-impact': {
    roleFocus: 'Certification & Validation Engineers',
    productionCapabilities: [
      'Separate CAVP/ACVP algorithm-validation certificates from CMVP FIPS 140-3 module certificates and verify that FIPS 203/204/205 algorithms sit inside the validated cryptographic boundary.',
      'Track SP 800-90B Entropy Source Validation (ESV) certificates and SP 800-90C RBG constructions required for PQC key generation under FIPS 140-3 IG.',
      'Map scheme-specific evidence across CMVP (FIPS 140-3), EUCC v2.0 ACM / NIAP Policy #33 (Common Criteria), and PCI PTS HSM v5.0 scope boundaries without conflating scheme claims.',
    ],
    evaluationMethod:
      'Cross-check vendor-supplied certificate numbers against the official NIST CMVP/CAVP/ESV portals, EUCC/NIAP certified product lists, and PCI PTS HSM approval tables, confirming exact firmware versions and approved modes.',
    evidenceRequired:
      'CMVP module certificate and Security Policy PDF, linked CAVP ACVP algorithm certificate numbers, ESV entropy certificate number, and scheme-specific evaluation reports (EUCC/NIAP/PCI) matching the deployed build.',
  },
  'cloud-pqc': {
    roleFocus: 'Security Architects, IT Ops / DevOps, Developers & GRC Leads',
    productionCapabilities: [
      'Enforce hybrid PQ/T TLS 1.3 (RFC 10024, e.g., X25519MLKEM768) independently on both CDN/edge ingress and origin/east-west service legs, with downgrade monitoring.',
      'Verify cloud KMS post-quantum key specs, ML-KEM/ML-DSA APIs, and BYOK wrapping boundaries across AWS KMS, Google Cloud KMS, and Azure Key Vault / Managed HSM.',
      'Scope SaaS and identity-federation cryptographic boundaries (SAML/OIDC signing, webhook verification, tenant-managed encryption keys) and collect verifiable provider evidence.',
    ],
    evaluationMethod:
      'Capture TLS 1.3 ClientHello/ServerHello transcripts on both edge and origin legs, inspect cloud KMS key metadata and IAM policy logs in staging, and audit SaaS provider cryptographic documentation.',
    evidenceRequired:
      'Edge and origin TLS negotiation telemetry showing RFC 10024 hybrid groups, cloud KMS key-spec and BYOK import audit logs, and dated SaaS provider cryptographic boundary attestations.',
  },
  'pqc-implementation-security': {
    roleFocus: 'Developers, Certification & Validation Engineers, and Cryptography Researchers',
    productionCapabilities: [
      'Audit ML-KEM, ML-DSA, and SLH-DSA implementations for constant-time execution across modular arithmetic (Barrett/Montgomery reduction), NTT, rejection sampling, and Fujisaki-Okamoto implicit rejection.',
      'Evaluate masking order, fresh-randomness budgets, and fault-injection countermeasures (re-execution, redundancy checks, glitch-resistant comparisons) for embedded and hardware-backed PQC modules.',
      'Scope non-specific TVLA (t-test threshold |t| > 4.5), FIPS 140-3 IG physical/non-invasive security requirements, and EUCC/Common Criteria AVA_VAN side-channel evaluation evidence.',
    ],
    evaluationMethod:
      'Run dudect or ctgrind/Valgrind constant-time checks on compiled target binaries (inspecting compiler-generated assembly for secret-dependent branches or division), and review accredited lab TVLA trace reports and FIPS 140-3/EUCC evaluation summaries.',
    evidenceRequired:
      'Target-architecture disassembly and constant-time verification reports, FO implicit-rejection negative test results, accredited lab TVLA/side-channel test reports, and linked FIPS 140-3 or EUCC Security Policy/Certification Report.',
  },
  'energy-utilities-pqc': {
    roleFocus: 'Security Architects, IT/OT Ops Engineers, GRC Leads & Researchers',
    productionCapabilities: [
      'Separate sub-4 ms real-time protection-relay planes (IEC 61850 GOOSE/SV using symmetric IEC 62351-6 HMAC/AES-GMAC) from PQC-protected key-distribution, SCADA WAN (IEC 60870-5-104/DNP3-SA), and gateway boundaries.',
      'Validate MTU, fragmentation, and handshake-latency budgets across substation serial/Ethernet links, AMI smart-meter meshes (DLMS/COSEM, IEEE 2030.5), and DER edge gateways before field cutover.',
      'Plan 15–25 year field-asset cryptographic lifecycles (firmware signing with LMS/XMSS or SLH-DSA, hardware root-of-trust constraints) and map evidence to NERC CIP-005/007/010/011/012/013 and EU NIS2.',
    ],
    evaluationMethod:
      'Benchmark hybrid TLS 1.3 (RFC 10024) and IKEv2 (RFC 9370) gateway handshakes in a utility staging lab with representative MTU/bandwidth profiles, verify relay tripping latency isolation, and audit vendor firmware-signing key management.',
    evidenceRequired:
      'Staging packet captures and latency measurements proving GOOSE/SV timing budgets remain unaffected, SCADA/AMI gateway hybrid handshake telemetry, field-device firmware signing verification logs, and NERC CIP / NIS2 scoped evidence records.',
  },
  'pqc-101': {
    roleFocus: 'All Roles (Architects, Developers, Operations, Executives)',
    productionCapabilities: [
      'Support for NIST FIPS 203 (ML-KEM-512/768/1024) key encapsulation and FIPS 204 (ML-DSA-44/65/87) / FIPS 205 (SLH-DSA) digital signatures in enterprise cryptographic providers.',
      'Policy-driven algorithm configuration allowing classical RSA/ECDSA/ECDH deprecation without application source-code rewrites.',
      'Telemetry and inventory export identifying asymmetric primitives vs symmetric/hash primitives across deployed workloads.',
    ],
    evaluationMethod:
      'Query provider algorithm registries (e.g., OpenSSL 3.5+ `openssl list -kem-algorithms -signature-algorithms`) and run NIST ACVP test vectors in staging.',
    evidenceRequired:
      'Provider algorithm inventory output, CAVP algorithm-validation certificate numbers and CMVP module certificate numbers, and staging handshake/signature logs.',
  },
  'quantum-threats': {
    roleFocus: 'Risk Officers, Security Architects & Researchers',
    productionCapabilities: [
      'Data-retention and confidentiality-lifetime tracking (Mosca X + Y > Z calculation) integrated into asset and data-classification catalogs.',
      'Differentiation between Harvest-Now-Decrypt-Later (HNDL) exposure on key-establishment traffic and Harvest-Now-Forge-Later / active quantum forgery exposure on signatures.',
      'Symmetric key-size enforcement (AES-256 and SHA-384/SHA-512 or SHAKE256) across long-lived archives.',
    ],
    evaluationMethod:
      'Cross-check data-retention schedules against active TLS/VPN cipher suites and archival encryption envelopes in non-production audit reviews.',
    evidenceRequired:
      'Asset retention schedule mapped to negotiated KEM/cipher suites and key-rotation logs for long-lived archives.',
  },
  'ai-crypto-attacks': {
    roleFocus: 'Security Architects, Developers, Operations, GRC Leads & Researchers',
    productionCapabilities: [
      'Enforce pre-commit secret push protection, immediate credential revocation, and short-lived OIDC workload identities across repositories and CI/CD pipelines.',
      'Maintain rapid CVE patching workflows and human-in-the-loop cryptographic code review (especially for newly enabled PQC builds and direct FIPS API callers).',
      'Protect signing and wrapping keys inside non-exportable HSM/KMS policies (CKA_EXTRACTABLE=false, IAM policy separation, dual control, signed audit logs) and scope embedded SCA resistance via attack-based evaluation.',
    ],
    evaluationMethod:
      'Run pre-commit secret scanners in CI, audit KMS/HSM key templates and IAM policy separation in staging, verify library versions against CBOM inventories, and review lab TVLA/attack-based SCA reports where physical capture applies.',
    evidenceRequired:
      'CI push-protection and OIDC federation configs, dated CBOM and crypto-library patch records (e.g., wolfSSL/OpenSSL advisory remediation), immutable HSM key-policy exports, and scoped SCA evaluation summaries.',
  },
  'hybrid-crypto': {
    roleFocus: 'Security Architects & Protocol Engineers',
    productionCapabilities: [
      'Negotiate an RFC 10024 hybrid key agreement group in TLS 1.3 and record the group selected by the server.',
      'Verify the peer name, certificate path, and actual CertificateVerify signature against the authentication policy. RFC 10073 defines composite ML-DSA in X.509. Composite ML-DSA in TLS 1.3 has a separate Internet-Draft.',
      'Enforce the expected group, signature and trust policy. Exercise rejection of a classical-only peer when hybrid key agreement is required, a peer with a disallowed signature, and a certificate with an unexpected name or trust anchor.',
    ],
    evaluationMethod:
      'Use the exact client, server, provider and trust configuration planned for rollout. Record a classical baseline and test each intended certificate choice on both peers. Capture the selected key agreement separately from peer verification and CertificateVerify.',
    evidenceRequired:
      'Build and configuration identifiers, negotiated group, peer certificate and trust anchor identifiers, the verified CertificateVerify scheme, and results of expected rejections.',
    sources: [
      { label: 'RFC 10024', href: 'https://www.rfc-editor.org/rfc/rfc10024.html' },
      { label: 'RFC 10073', href: 'https://www.rfc-editor.org/rfc/rfc10073.html' },
      {
        label: 'TLS composite ML-DSA draft',
        href: 'https://datatracker.ietf.org/doc/draft-ietf-tls-composite-mldsa/',
      },
    ],
  },
  'crypto-agility': {
    roleFocus: 'Software Architects & Platform Engineers',
    productionCapabilities: [
      'Provider-based cryptographic abstraction layers (e.g., OpenSSL 3 Provider API, JCA/JCE, PKCS#11 v3.2) decoupled from business logic.',
      'Variable-length buffer and schema support accommodating PQC public keys (up to 2,592 B for ML-DSA-87) and signatures (up to 49,856 B for SLH-DSA-256f).',
      'Automated certificate and key rotation pipelines capable of swapping OIDs and parameter sets via configuration.',
    ],
    evaluationMethod:
      'Execute a staging algorithm-swap drill (e.g., ECDSA P-256 to ML-DSA-65) using configuration-only changes and measure service continuity.',
    evidenceRequired:
      'Configuration diff, zero-code-change deployment log, and post-swap verification transcript.',
  },
  'talking-about-pqc': {
    roleFocus: 'Executives, Program Managers & GRC Leads',
    productionCapabilities: [
      'Executive reporting dashboards translating technical cryptographic inventory (CBOM) into business-service risk and regulatory milestone tracking.',
      'Distinction between business services (e.g., records archiving service) and protected assets (long-lived customer records) in governance registers.',
      'Vendor-readiness tracking tied to contract renewal and hardware refresh cycles.',
    ],
    evaluationMethod:
      'Review board-pack artifacts against underlying CBOM discovery scans and regulatory deadline matrices (CNSA 2.0, NIST IR 8547, DORA, NCSC).',
    evidenceRequired:
      'Traceable governance briefing linking each stated readiness metric to a dated discovery scan or vendor attestation.',
  },
  'tls-basics': {
    roleFocus: 'Network Engineers, SREs & Application Developers',
    productionCapabilities: [
      'TLS 1.3 hybrid post-quantum group negotiation (`X25519MLKEM768`, `SecP256r1MLKEM768`, `SecP384r1MLKEM1024`) on ingress gateways and service meshes.',
      'Support for RFC 8879 TLS Certificate Compression (zlib/Brotli/Zstd); measure its actual effect on PQC chains, since PQC keys and signatures compress poorly.',
      'Strict TLS 1.3 enforcement disabling legacy TLS 1.0/1.1 and static RSA key transport.',
    ],
    evaluationMethod:
      'Run `openssl s_client -groups X25519MLKEM768` against staging endpoints and inspect TCP segment counts and handshake latency.',
    evidenceRequired:
      'Staging TLS handshake transcript showing negotiated `Negotiated TLS1.3 group: X25519MLKEM768` and MTU fragmentation telemetry.',
  },
  'vpn-ssh-pqc': {
    roleFocus: 'Network Security & Infrastructure Operations',
    productionCapabilities: [
      'IKEv2 Multiple Key Exchanges (RFC 9370 `ADDKE1..ADDKE7`) with `ML-KEM-768` / `ML-KEM-1024` (draft-ietf-ipsecme-ikev2-mlkem). Check RFC 7383 IKE fragmentation for message-size limits and RFC 9329 TCP encapsulation for paths that block UDP.',
      'OpenSSH 9.9+ hybrid key exchange (`mlkem768x25519-sha256` or `sntrup761x25519-sha512`) enforced via `KexAlgorithms` in `sshd_config`.',
      'PQC X.509 or raw public key authentication for site-to-site and remote-access VPN tunnels.',
    ],
    evaluationMethod:
      'Inspect `swanctl --list-sas` for `IKEv2 ADDKE` transform negotiation and run `ssh -vvv` to verify `mlkem768x25519-sha256` selection.',
    evidenceRequired:
      'VPN security-association (`SA`) status dump, `sshd -T` effective configuration output, and negative KEX rejection logs.',
  },
  'dnssec-pqc': {
    roleFocus: 'DNS Administrators & Network Architects',
    productionCapabilities: [
      'Test both an authoritative signer and a validating recursive resolver for the same DNSSEC algorithm and identifier. ML-DSA-44 is registered as algorithm 18, with its DNSSEC profile described in an Internet-Draft.',
      'Automated ZSK/KSK algorithm rollover orchestration supporting increased `DNSKEY` and `RRSIG` wire sizes.',
      'Verify EDNS UDP sizing and TCP fallback for the actual name, algorithm and response size used by the zone.',
    ],
    evaluationMethod:
      'Sign a staging DNS zone in a lab environment, query via `dig +dnssec +bufsize=1232`, and measure TC-bit truncation and TCP fallback rates.',
    evidenceRequired:
      'For a trusted lab resolver, record the signed baseline response, validated data, tampered signature rejection, response size, TC bit and TCP retry result. Record the signer and resolver builds.',
    sources: [
      {
        label: 'IANA DNSSEC algorithm registry',
        href: 'https://www.iana.org/assignments/dns-sec-alg-numbers',
      },
      {
        label: 'ML-DSA DNSSEC profile draft',
        href: 'https://datatracker.ietf.org/doc/draft-westerbaan-dnssec-mldsa/',
      },
    ],
  },
  'email-signing': {
    roleFocus: 'Messaging Architects & Enterprise PKI Engineers',
    productionCapabilities: [
      'S/MIME 4.0 and CMS (RFC 5652 / RFC 9629 / RFC 9936) support for `KEMRecipientInfo` with `ML-KEM-768/1024` and `SignedData` with `ML-DSA` (RFC 9882) or `SLH-DSA` (RFC 9814).',
      'Automated recipient-capability discovery (S/MIME capabilities attribute or directory lookup) to select PQC vs classical encryption.',
      'Key-archival and escrow support for decapsulation private keys in enterprise KMS/HSM.',
    ],
    evaluationMethod:
      'Generate and verify CMS `SignedData` and `AuthEnvelopedData` (`KEMRecipientInfo`) using `openssl cms` (confirm KEMRecipientInfo support in your OpenSSL release) or another CMS toolkit, and test cross-client decryption in staging.',
    evidenceRequired:
      'ASN.1 dump (`openssl asn1parse`) showing `KEMRecipientInfo` (`id-ori-kem`, `1.2.840.113549.1.9.16.13.3`) with the `ML-KEM-768` key algorithm OID `2.16.840.1.101.3.4.4.2`, and verified signature receipt.',
  },
  'pki-workshop': {
    roleFocus: 'PKI Architects & Certificate Lifecycle Engineers',
    productionCapabilities: [
      'Root, Intermediate, and Issuing CA support for `ML-DSA-44/65/87` (RFC 9881) and `SLH-DSA` (RFC 9909) key generation and X.509 v3 certificate issuance.',
      'CRL and OCSP responder scalability for multi-kilobyte PQC signatures and high-density revocation lists.',
      'Automated Certificate Lifecycle Management (CLM) discovery and renewal across short-lived and long-lived PQC trust chains.',
    ],
    evaluationMethod:
      'Issue a 3-tier PQC certificate chain (`ML-DSA-87` Root -> `ML-DSA-65` Intermediate -> `ML-DSA-44` Leaf) in a non-production CA and run `openssl verify` and OCSP checks.',
    evidenceRequired:
      'Decoded X.509 certificate chain (`openssl x509 -text`), OCSP response verification log, and HSM key-generation audit trail.',
  },
  'kms-pqc': {
    roleFocus: 'Cloud Security Architects & Platform Operations',
    productionCapabilities: [
      'Envelope encryption combining FIPS 203 `ML-KEM` key encapsulation (or hybrid KEM) with `AES-256-GCM` data encryption keys (DEKs).',
      'KMIP support for PQC key objects, parameter-set attributes and automated key rotation (KMIP 3.0 is a Committee Specification Draft, CSD02, not yet an OASIS Standard), or documented vendor equivalents.',
      'Immutable CloudTrail / KMS audit logging recording key-usage mechanisms (`Encapsulate`, `Decapsulate`, `Sign`, `Verify`).',
    ],
    evaluationMethod:
      'Exercise a valid staging envelope, then change the KEM ciphertext and check end-to-end authenticated opening. For a valid-length ciphertext, ML-KEM decapsulation may return a different shared key without an error. Require the authenticated envelope to reject.',
    evidenceRequired:
      'KMS key metadata JSON showing `ML-KEM` / `ML-DSA` customer master key spec, rotation timestamp, and CloudTrail audit event.',
  },
  'hsm-pqc': {
    roleFocus: 'HSM Administrators & Cryptographic Custodians',
    productionCapabilities: [
      'OASIS PKCS#11 v3.2 interface supporting `C_EncapsulateKey`, `C_DecapsulateKey`, `CKM_ML_KEM`, `CKM_ML_DSA`, `CKM_SLH_DSA`, and `CKA_PARAMETER_SET`.',
      'FIPS 140-3 Level 3 physical security, with documented non-invasive (side-channel) attack mitigations, for firmware executing PQC primitives inside the cryptographic boundary.',
      'Partition-level mechanism policy enforcement blocking deprecated classical algorithms (`CKM_RSA_PKCS`, `<2048-bit RSA`).',
    ],
    evaluationMethod:
      'Query HSM partition capabilities (`pkcs11-tool --list-mechanisms`) and execute `C_EncapsulateKey` / `C_Sign` KAT vectors on a staging HSM slot.',
    evidenceRequired:
      'HSM firmware version and CMVP certificate reference, `pkcs11-tool` mechanism list, and signed HSM audit log.',
  },
  'pqc-hw-acceleration': {
    roleFocus: 'Hardware Architects, SoC Designers & Embedded Engineers',
    productionCapabilities: [
      'Hardware-accelerated Number Theoretic Transform (NTT) and Keccak/SHAKE sponge engines for `ML-KEM` and `ML-DSA` polynomial arithmetic.',
      'Constant-time execution and masking/shuffling countermeasures against Differential Power Analysis (DPA) and electromagnetic fault injection.',
      'Bounded SRAM and DMA footprint profiling for constrained Cortex-M / RISC-V / FPGA targets.',
    ],
    evaluationMethod:
      'Measure cycle counts, stack high-water marks, and TVLA (Test Vector Leakage Assessment) t-statistics on target silicon or FPGA bitstreams.',
    evidenceRequired:
      'Hardware benchmark report (cycles/op for KeyGen, Encaps, Decaps, Sign, Verify), memory map, and side-channel TVLA test summary.',
  },
  'crypto-product-certification': {
    roleFocus: 'Compliance Engineers, Product Security & Procurement Leads',
    productionCapabilities: [
      'Traceable mapping between product versions, NIST CAVP algorithm validation certificates, and CMVP (FIPS 140-3) / Common Criteria / EUCC module certificates.',
      'Explicit boundary documentation distinguishing which PQC algorithms execute inside the validated module vs unvalidated host software.',
      'Automated monitoring of CMVP certificate status (Active, Historical, Revoked) and CC/EUCC certificate status (certified vs archived/withdrawn).',
    ],
    evaluationMethod:
      'Verify vendor-claimed CAVP/CMVP certificate numbers directly against the NIST CSRC validation database and Common Criteria Security Target PDF.',
    evidenceRequired:
      'Verified CAVP/CMVP certificate record, Security Target algorithm table extract, and tested software/firmware version hash.',
  },
  'fips-140-3-certification': {
    roleFocus: 'Cryptographic Module Engineers & Federal Compliance Leads',
    productionCapabilities: [
      'FIPS 140-3 (ISO/IEC 19790) cryptographic module boundary with CAVP-validated FIPS 203 (`ML-KEM`), FIPS 204 (`ML-DSA`), and FIPS 205 (`SLH-DSA`) implementations.',
      'Pre-operational and conditional self-tests (CAST / pairwise consistency tests) for PQC key generation, encapsulation, and signing.',
      'SP 800-90B compliant entropy source (ESV validated) feeding SP 800-90A DRBGs for PQC seed generation.',
    ],
    evaluationMethod:
      'Run module power-on self-tests (POST), trigger simulated KAT failure / pairwise consistency fault injection, and verify module enters error state.',
    evidenceRequired:
      'ACVP vector validation receipt, FIPS 140-3 Security Policy document, and self-test fault-injection verification log.',
  },
  'cc-eucc-certification': {
    roleFocus: 'Product Certification Managers & EU Compliance Leads',
    productionCapabilities: [
      'Common Criteria (ISO/IEC 15408) / EUCC Security Target (ST) FCS_COP and FCS_CKM SFRs explicitly specifying `ML-KEM`, `ML-DSA`, `SLH-DSA`, or `LMS/XMSS` parameter sets.',
      'Vulnerability assessment (AVA_VAN) covering implementation attacks and side-channel resistance for post-quantum primitives.',
      'ALC_FLR / patch-management processes preserving certification posture across cryptographic firmware updates.',
    ],
    evaluationMethod:
      'Audit the product Security Target (ST) and Certification Report against actual configured algorithms in the evaluated configuration.',
    evidenceRequired:
      'Published CC/EUCC Certificate, Security Target SFR table (`FCS_COP.1` / `FCS_CKM.1`), and evaluated-configuration deployment checklist.',
  },
  'pci-certification': {
    roleFocus: 'Payment Security Architects & PCI QSAs',
    productionCapabilities: [
      'PCI DSS v4.0.1 Req. 12.3.3 cryptographic cipher-suite and protocol inventory, reviewed annually; a PQC transition plan is good practice that PCI DSS itself does not name.',
      'PCI DSS Req. 4.2.1 strong cryptography for cardholder data in transit; TLS 1.3 with hybrid PQC key exchange is one way to plan ahead, not a PCI DSS requirement.',
      'PCI PTS HSM / TR-31 / ASC X9.143 key-block support, with a documented path for post-quantum key types and key-usage separation.',
    ],
    evaluationMethod:
      'Inspect the annual PCI DSS Req. 12.3.3 cryptographic inventory artifact and verify payment gateway TLS 1.3 cipher configurations in staging.',
    evidenceRequired:
      'Signed Req. 12.3.3 cryptographic inventory, AOC/ROC evidence package, and payment-channel TLS scan report.',
  },
  'data-asset-sensitivity': {
    roleFocus: 'Data Governance Leads, CISOs & Enterprise Architects',
    productionCapabilities: [
      'Record the confidentiality period separately from retention and key lifetime. A signing-only object may have an integrity or trust lifetime instead of a confidentiality period.',
      'For data exposed to harvest-now, decrypt-later risk, identify the copy or network path, actual key-establishment or wrapping mechanism and the remaining confidentiality horizon.',
      'For archives with vulnerable key-transport envelopes, test rewrapping or re-encryption and restore a representative archived record under the new policy.',
    ],
    evaluationMethod:
      'Trace one stored copy and one transfer. Compare their confidentiality periods, observed protection and whether each has a quantum-vulnerable dependency. Record source-system and archive scopes separately.',
    evidenceRequired:
      'Retention and confidentiality records, data flow and envelope identifiers, captured negotiated protection on the named path, and an authorized restore result if the archive is in scope.',
    sources: [
      {
        label: 'NIST security life of data',
        href: 'https://csrc.nist.gov/glossary/term/security_life_of_data',
      },
    ],
  },
  'stateful-signatures': {
    roleFocus: 'Firmware Security Engineers & HSM Architects',
    productionCapabilities: [
      'NIST SP 800-208 compliant `LMS/HSS` and `XMSS/XMSS^MT` signing inside a hardware security module that guarantees monotonic, non-rewindable one-time signature (OTS) index state.',
      'Zero-state-reuse enforcement: hardware refusal to sign if NVRAM state persistence fails or if key-tree exhaustion is reached.',
      'Strict prohibition of private-key export or VM snapshot cloning for stateful hash-based signing keys.',
    ],
    evaluationMethod:
      'Test OTS leaf-index increment persistence across power cycles and verify hard failure when tree capacity (2^h signatures) is exhausted in a lab HSM.',
    evidenceRequired:
      'HSM state-counter audit log, SP 800-208 parameter set configuration (`H`, `W`), and backup/clone prevention verification record.',
  },
  'digital-assets': {
    roleFocus: 'Blockchain Architects, Custody Engineers & Institutional Risk Leads',
    productionCapabilities: [
      'Post-quantum signature verification (`ML-DSA`, `SLH-DSA`, `FN-DSA`, or hash-based schemes) in custody HSMs and account-abstraction / smart-contract wallets.',
      'Quantum-safe key derivation and seed backup replacing or augmenting classical BIP-32/BIP-39 secp256k1/Ed25519 key trees.',
      'Migration playbooks for exposed public-key outputs (P2PK / reused addresses) vulnerable to Shor-based private-key recovery.',
    ],
    evaluationMethod:
      'Simulate transaction signing, witness size overhead, and verification gas/compute cost using PQC signature schemes on a staging testnet.',
    evidenceRequired:
      'Testnet transaction receipt, serialized witness/signature byte-size profile, and custody HSM signing audit log.',
  },
  'custody-lifecycle-ops': {
    roleFocus: 'Custody Operations Leads, Security Architects & Key Custodians',
    productionCapabilities: [
      'Pre-planned emergency sweep templates, on-chain ERC-20 allowance and EIP-7702 delegation revocation workflows, and smart-account owner-rotation governance.',
      'Separated signing and administration paths enforcing AC-5 separation of duties, PKCS#11 CKA_ALWAYS_AUTHENTICATE per-use auth, and short-lived workload mTLS.',
      'Cross-site quorum-protected backups with authoritative epoch inventories, canary-key DR drills, and FIPS 140-3 / SP 800-88 Rev. 2 verified decommissioning.',
    ],
    evaluationMethod:
      'Execute scheduled canary-key restore drills, ceremony script audits, effective-permission access reviews, and pre-signing vs confirmed-chain alert tabletop exercises in staging.',
    evidenceRequired:
      'Signed ceremony minutes and artifact hashes, canary restore drill sign-off, effective-permission review log, immutable off-box alert history, and witnessed sanitization attestations.',
  },
  '5g-security': {
    roleFocus: 'Telecom Security Architects & Mobile Core Engineers',
    productionCapabilities: [
      '3GPP TS 33.501 SUCI concealment (ECIES Profiles A and B) with a documented crypto-agility path to a post-quantum or hybrid KEM once 3GPP specifies a profile, between USIM/UE and UDM/SIDF.',
      'IPsec IKEv2 (RFC 9370) on N2/N3 (TS 33.501) and TLS 1.3 (`X25519MLKEM768`) on SBA interfaces including N32-c between SEPPs.',
      'Subscriber authentication key-length planning for Grover margin: MILENAGE uses a 128-bit K and OPc, while TUAK also supports a 256-bit K.',
    ],
    evaluationMethod:
      'Run staging UE-to-UDM SUCI concealment/deconcealment test vectors and inspect N32/N2 IPsec/TLS control-plane handshakes.',
    evidenceRequired:
      'SIDF deconcealment test log, 5G core SBA TLS 1.3 handshake capture, and USIM profile capability specification.',
  },
  'digital-id': {
    roleFocus: 'Identity Architects, eIDAS Wallet Engineers & Trust Service Providers',
    productionCapabilities: [
      'ISO/IEC 18013-5 (mDL) and W3C Verifiable Credentials / SD-JWT issuer and holder signing with `ML-DSA` or hybrid signatures.',
      'Proximity presentation (BLE / NFC) APDU chunking and latency management for multi-kilobyte PQC issuer signatures (`MSO`) and device authentication.',
      'eIDAS 2.0 / ARF PID and QEAA trust-list distribution supporting post-quantum X.509 issuer certificates.',
    ],
    evaluationMethod:
      'Execute an end-to-end mDL or SD-JWT issuance and proximity/remote verification flow in staging, measuring NFC/BLE frame transfer time.',
    evidenceRequired:
      'CBOR/COSE `COSE_Sign1` diagnostic dump, proximity transfer timing log, and verifier trust-anchor validation output.',
  },
  'entropy-randomness': {
    roleFocus: 'Cryptographic Engineers & Platform Security Leads',
    productionCapabilities: [
      'NIST SP 800-90B validated physical entropy sources (NRBG / PTRNG / QRNG) with continuous Repetition Count (RCT) and Adaptive Proportion (APT) health tests.',
      'NIST SP 800-90A `CTR_DRBG` (AES-256) or `HMAC_DRBG` / `Hash_DRBG` (SHA-512) providing 256-bit security strength for PQC seed generation (`d`, `z` in ML-KEM; `xi` in ML-DSA).',
      'SP 800-90C / FIPS 140-3 compliant entropy conditioning and hybridization when mixing external QRNG/HSM entropy with OS CSPRNGs.',
    ],
    evaluationMethod:
      'Run the NIST SP 800-90B `ea_iid` / `ea_non_iid` min-entropy assessment suite on 1,000,000 raw noise samples and verify RCT/APT fault alarms.',
    evidenceRequired:
      'SP 800-90B min-entropy report, ESV certificate number, and DRBG health-test fault-injection log.',
  },
  'merkle-tree-certs': {
    roleFocus: 'Web PKI Architects, CDN Engineers & CA Operators',
    productionCapabilities: [
      'IETF Merkle Tree Certificates (`draft-ietf-plants-merkle-tree-certs`, an Internet-Draft) inclusion-proof verification replacing per-CA multi-kilobyte PQC signatures on the TLS wire.',
      'Cosigner and CA signatures over issuance-log checkpoints (tree heads) with `ML-DSA` / `SLH-DSA`, and landmark-relative certificate refresh on edge TLS terminators.',
      'Fallback to standard X.509 PQC or hybrid certificate chains when clients do not advertise MTC support.',
    ],
    evaluationMethod:
      'Benchmark TLS 1.3 handshake byte size and verification latency comparing a 3-cert `ML-DSA-65` chain (~15 KB) against a measured MTC certificate (landmark-relative or cosigned) in staging.',
    evidenceRequired:
      'TLS handshake byte-budget comparison report, inclusion-proof verification test log, and edge fallback test results.',
  },
  qkd: {
    roleFocus: 'Optical Network Architects & Defense Communications Engineers',
    productionCapabilities: [
      'ETSI GS QKD 014 REST key-delivery API integration with IPsec IKEv2 (RFC 8784 PPK) or MACsec / optical layer-1 encryptors.',
      'Defense-in-depth hybridization combining QKD-derived keys with NIST FIPS 203 `ML-KEM` and classical ECDH (consistent with the BSI/ANSSI/NLNCSA/SNCSA position: PQC primary, QKD complementary where justified; NCSC and NSA do not recommend QKD).',
      'Authenticated classical control channel secured with post-quantum signatures (`ML-DSA`) to prevent man-in-the-middle attacks.',
    ],
    evaluationMethod:
      'Test ETSI 014 `get_key` retrieval paired with RFC 8784 IKEv2 PPK rekeying and verify session survival when the QKD optical link is interrupted.',
    evidenceRequired:
      'ETSI 014 key-exchange log, hybrid KDF combiner configuration, and optical link-loss failover test receipt.',
  },
  'vendor-risk': {
    roleFocus: 'Third-Party Risk Managers, Procurement & Supply Chain Security',
    productionCapabilities: [
      'Contractual requirement for CycloneDX 1.6+ Cryptographic Bill of Materials (CBOM) delivery upon software release or SaaS onboarding.',
      'Verification of vendor NIST CAVP/CMVP validation numbers rather than accepting unsubstantiated "quantum-ready" marketing claims.',
      'SLA clauses mandating remediation timelines for deprecated classical primitives (RSA-2048, ECDSA P-256) ahead of 2030/2035 regulatory milestones.',
    ],
    evaluationMethod:
      'Validate vendor-supplied CBOM JSON files against actual network TLS/SSH scans and binary dependency inspection of the vendor product.',
    evidenceRequired:
      'Validated CycloneDX CBOM artifact, verified CMVP certificate lookup, and executed PQC contract addendum.',
  },
  'compliance-strategy': {
    roleFocus: 'GRC Officers, Legal Counsel & Security Leadership',
    productionCapabilities: [
      'Multi-jurisdiction regulatory mapping engine tracking NSA CNSA 2.0 (advisory 2025–2033; FAQ v2.2: new acquisitions from 1 Jan 2027, phase-out by 31 Dec 2030, mandated by 31 Dec 2031), NIST IR 8547 (2030/2035), EU DORA / NIS2, UK NCSC (2028/2031/2035), and PCI DSS v4.0.1.',
      'Exception and compensating-control workflow for legacy systems unable to meet initial PQC transition milestones.',
      'Audit-ready evidence repository linking each regulatory obligation to dated technical verification artifacts.',
    ],
    evaluationMethod:
      'Conduct a mock regulatory table-top audit tracing one critical business service from its jurisdictional mandate down to its CBOM and TLS/PKI test logs.',
    evidenceRequired:
      'Cross-walked compliance obligation matrix, signed exception register, and linked technical verification dossier.',
  },
  'migration-program': {
    roleFocus: 'PQC Program Directors, Transformation Leads & PMO',
    productionCapabilities: [
      'Phase-based migration tracking (the Hub’s own seven-phase framing, informed by NIST CSWP 39 and NCCoE SP 1800-38: Discovery, Inventory, Prioritization, Execution, Testing, Deployment, Monitoring).',
      'Dependency-graph modeling linking root/issuing CAs, HSM firmware, crypto libraries, and consuming applications.',
      'Rollback and canary deployment automation for production PQC rollouts.',
    ],
    evaluationMethod:
      'Run a pilot migration wave on a non-production service tier, exercising both forward deployment and emergency rollback to classical/hybrid baseline.',
    evidenceRequired:
      'Program charter, wave dependency graph, pilot completion receipt, and verified rollback drill log.',
  },
  'pqc-risk-management': {
    roleFocus: 'Enterprise Risk Managers, CISOs & Audit Committees',
    productionCapabilities: [
      'Quantitative and qualitative risk scoring integrating Mosca timeline parameters (X + Y > Z), threat-vector differentiation (HNDL vs forgery), and asset criticality.',
      'Automated risk-register synchronization with live cryptographic discovery findings (unapproved RSA/ECDSA endpoints, expiring certificates).',
      'Risk-treatment tracking (Mitigate via Hybrid/PQC, Transfer, Accept with time-bound waiver, Avoid).',
    ],
    evaluationMethod:
      'Reconcile risk-register entries against the latest automated network/CBOM discovery scan to ensure zero untracked high-criticality cryptographic exposures.',
    evidenceRequired:
      'Dated risk register export, Mosca parameter assumption log, and risk-treatment verification links.',
  },
  'pqc-testing-validation': {
    roleFocus: 'QA Architects, Performance Engineers & Security Testers',
    productionCapabilities: [
      'Automated known-answer tests against published vectors (such as NIST ACVP) and negative tamper-rejection tests in CI/CD.',
      'Network protocol fuzzing and MTU fragmentation simulation for large PQC handshakes (`ML-KEM-1024`, `ML-DSA-87`, `SLH-DSA`).',
      'Cross-vendor interoperability test matrices (e.g., OpenSSL 3.6 ↔ BoringSSL ↔ wolfSSL ↔ Bouncy Castle).',
    ],
    evaluationMethod:
      'Run known-answer cases first. Check that a modified signature fails verification. For ML-KEM, check implicit rejection against the expected alternative secret or authenticated-open failure on a modified ciphertext. Record the packet and completion results under a 1,500-byte MTU.',
    evidenceRequired:
      'CI test report showing 100% ACVP KAT pass, negative tamper rejection logs, and cross-vendor interop matrix.',
  },
  'acvp-lab-workflow': {
    roleFocus: 'Cryptographic Library Developers & CSTL Validation Engineers',
    productionCapabilities: [
      'Automated NIST ACVP JSON test-session processing (`keyGen`, `encapDecap`, `sigGen`, `sigVer`) for `ML-KEM`, `ML-DSA`, and `SLH-DSA`.',
      'Deterministic seed injection (`d`, `z` for ML-KEM; `xi`, `rnd` for ML-DSA) required by ACVP test harnesses while preserving CSPRNG generation in production builds.',
      'Strict rejection of malformed encapsulation keys (modulus check per FIPS 203 §7.2) and out-of-range signature values (FIPS 204 §6.3, ML-DSA.Verify_internal).',
    ],
    evaluationMethod:
      'Run the official NIST `acvp-server` test vector sets against the target cryptographic binary and verify zero mismatches between your responses and the server’s `expectedResults.json`.',
    evidenceRequired:
      'ACVP request/response JSON transcripts, CAVP algorithm validation certificate, and malformed-input rejection test log.',
  },
  'pqc-business-case': {
    roleFocus: 'CFOs, CISOs & Enterprise Transformation Sponsors',
    productionCapabilities: [
      'Total Cost of Ownership (TCO) modeling incorporating HSM hardware refresh, compute/bandwidth overhead, PKI re-issuance, and engineering labor.',
      'Alignment of PQC capital expenditure with scheduled infrastructure refresh cycles to avoid stranded hardware investments.',
      'Cost-of-inaction quantification tied to regulatory non-compliance penalties, breach remediation, and emergency retrofit premiums.',
    ],
    evaluationMethod:
      'Validate financial model assumptions against actual vendor quotes (HSM upgrades, CDN bandwidth tiers) and historical PKI/TLS migration labor metrics.',
    evidenceRequired:
      'Sensitivity-tested ROI/TCO model, hardware refresh schedule alignment table, and procurement budget sign-off.',
  },
  'pqc-governance': {
    roleFocus: 'Governance Boards, Policy Authors & Enterprise Architects',
    productionCapabilities: [
      'Enterprise Cryptographic Policy defining approved PQC parameter sets (`ML-KEM-768/1024`, `ML-DSA-65/87`, `SLH-DSA`, `LMS/XMSS`) and deprecation dates for classical algorithms.',
      'RACI accountability matrix assigning clear ownership across PKI, Network, Application Security, Procurement, and GRC teams.',
      'Automated policy-as-code gates (OPA / Kyverno / CI linters) blocking deployment of non-compliant cryptographic primitives.',
    ],
    evaluationMethod:
      'Test policy-as-code gates by submitting a sample manifest or certificate request using a deprecated algorithm (e.g., RSA-1024 / SHA-1) and confirming automated block.',
    evidenceRequired:
      'Published Enterprise PQC Policy, RACI matrix, and CI/CD policy-gate enforcement log.',
  },
  'code-signing': {
    roleFocus: 'DevSecOps Leads, Release Engineers & Firmware Architects',
    productionCapabilities: [
      'Artifact, container and package signing (e.g., Cosign with experimental ML-DSA, Java jarsigner in JDK 26, Notation, RPM/DEB) with PQC signature support; Authenticode/SignTool has no PQC support yet.',
      'RFC 3161 Time-Stamp Authority (TSA) tokens signed with post-quantum algorithms to preserve signature validity beyond algorithm deprecation.',
      'HSM-backed signing key custody with quorum approval and air-gapped root key ceremonies.',
    ],
    evaluationMethod:
      'Sign a release artifact with an HSM-backed `ML-DSA-65` key, attach a PQC RFC 3161 timestamp, and verify that tampered binaries fail admission control.',
    evidenceRequired:
      'Signed artifact bundle, RFC 3161 timestamp verification output, and Kubernetes/OS admission-control rejection log for unsigned/tampered builds.',
  },
  'software-supply-chain-pqc': {
    roleFocus: 'Supply Chain Security Architects & DevSecOps Engineers',
    productionCapabilities: [
      'The Update Framework (TUF) / Uptane multi-role metadata signing (`root`, `targets`, `snapshot`, `timestamp`) with threshold PQC/hybrid signatures.',
      'SLSA Build Level 3+ provenance attestations (in-toto / DSSE envelopes) signed with `ML-DSA` or `SLH-DSA`.',
      'Bootstrapped root-of-trust rotation enabling in-field verifiers to transition from classical to PQC root keys safely.',
    ],
    evaluationMethod:
      'Simulate a TUF root key rotation from Ed25519 to `ML-DSA-65` + Ed25519 threshold signing in staging and verify client update acceptance and rollback protection.',
    evidenceRequired:
      'TUF metadata chain JSON, verified DSSE SLSA provenance attestation, and root-rotation test log.',
  },
  'api-security-jwt': {
    roleFocus: 'API Platform Architects, IAM Engineers & Backend Developers',
    productionCapabilities: [
      'JOSE / COSE support for post-quantum JWS signature algorithms (`ML-DSA-44`, `ML-DSA-65`, `ML-DSA-87`) and JWK representation.',
      'HTTP header and cookie size budget management for at least ~4.4 KB (`ML-DSA-65`: 3,309 B signature = ~4,412 base64url characters, plus header and payload) JWT bearer tokens, or sender-constrained token reference patterns (DPoP / mTLS / opaque Phantom tokens).',
      'JWKS endpoint rotation publishing post-quantum public keys with explicit `alg` and `kid` pinning (preventing algorithm confusion).',
    ],
    evaluationMethod:
      'Issue an `ML-DSA-65` signed JWT in staging, pass it through reverse proxies / API gateways to check HTTP `max_header_size` limits, and test `alg: none` / key-confusion rejection.',
    evidenceRequired:
      'Decoded JWS header/payload, JWKS document, API gateway header-size load test report, and negative signature-verification logs.',
  },
  'iot-pqc': {
    roleFocus: 'Embedded Systems Engineers, IoT Architects & Firmware Leads',
    productionCapabilities: [
      'Constrained-stack `ML-KEM-512/768` and `ML-DSA-44` or stateful `LMS` verification fitting within MCU Flash/SRAM budgets (`pqm4` / `wolfCrypt`; Mbed TLS ML-KEM/ML-DSA are roadmap items).',
      'DTLS 1.3 (RFC 9147) and EDHOC / CoAP / OSCORE fragmentation handling over 802.15.4 / LoRaWAN / NB-IoT links.',
      'Hardware TRNG entropy conditioning and secure element (TPM / SE) offload for PQC operations.',
    ],
    evaluationMethod:
      'Measure RAM stack peak, Flash footprint, energy consumption (mJ/handshake), and DTLS 1.3 fragment reassembly under 10% packet loss on target MCU hardware.',
    evidenceRequired:
      'ELF binary section size report (`arm-none-eabi-size`), power/oscilloscope trace summary, and DTLS 1.3 lossy-network test log.',
  },
  'confidential-computing': {
    roleFocus: 'Cloud Security Architects & Confidential Workload Engineers',
    productionCapabilities: [
      'Remote attestation quote signing and endorsement key hierarchies (AMD SEV-SNP, Intel TDX, Arm CCA, Nitro Enclaves) roadmap/support for PQC signatures (`ML-DSA` / `SLH-DSA`).',
      'Attested TLS (RA-TLS) channel binding using hybrid `X25519MLKEM768` key exchange terminated inside the Trusted Execution Environment (TEE).',
      'Sealed storage and KMS key-release policies bound to verified TEE measurement registers (`MRTD` / `RTMR`) over PQC channels.',
    ],
    evaluationMethod:
      'Verify a TEE attestation quote in staging, establish an RA-TLS session with `X25519MLKEM768`, and test that altered enclave measurements are rejected by KMS.',
    evidenceRequired:
      'Attestation verification report, RA-TLS cipher transcript, and KMS attestation-policy denial log for mismatched measurements.',
  },
  'homomorphic-encryption': {
    roleFocus: 'Privacy Engineers, Applied Cryptographers & Data Scientists',
    productionCapabilities: [
      'Ring-LWE / RLWE parameter selection (BGV, BFV, CKKS, TFHE) compliant with the HomomorphicEncryption.org security standard parameter tables (ISO/IEC 28033 is still a Draft International Standard) and ≥128-bit security estimates.',
      'Strict noise-budget monitoring and circuit-depth bounds preventing decryption failures or key-recovery attacks from IND-CPA^D oracle leakage.',
      'Authenticated PQC transport (`ML-KEM` + `ML-DSA`) wrapping FHE evaluation keys and ciphertexts between client and compute nodes.',
    ],
    evaluationMethod:
      'Validate lattice dimension (N) and modulus (q) against the Lattice Estimator for at least 128-bit quantum security and test IND-CPA^D decryption error boundaries.',
    evidenceRequired:
      'FHE parameter security-level estimation report, noise-budget test log, and ciphertext serialization benchmark.',
  },
  'web-gateway-pqc': {
    roleFocus: 'Edge Network Engineers, CDN Administrators & WAF Architects',
    productionCapabilities: [
      'Ingress TLS 1.3 termination with `X25519MLKEM768` enabled (default or by configuration, depending on product and crypto library, e.g., NGINX with OpenSSL 3.5+, Envoy 1.40+, HAProxy vendor builds) on NGINX, Envoy, HAProxy, Cloudflare, AWS ALB/CloudFront or Akamai.',
      'Re-encryption (upstream origin TLS) supporting hybrid PQC key exchange so internal load-balancer-to-service legs are also HNDL-protected.',
      'Observability metrics tracking % of connections negotiating PQC vs classical groups by client User-Agent/JA4 fingerprint.',
    ],
    evaluationMethod:
      'Verify both client-to-gateway and gateway-to-origin TLS 1.3 legs negotiate `X25519MLKEM768` under synthetic load and inspect Prometheus/access-log group counters.',
    evidenceRequired:
      'Gateway configuration snippet (`ssl_ecdh_curve X25519MLKEM768:X25519`), access-log `$ssl_curve` telemetry, and load-test latency p99 report.',
  },
  'emv-payment-pqc': {
    roleFocus: 'Payment Systems Architects, Card Issuers & Terminal Engineers',
    productionCapabilities: [
      'For the exact contact or contactless terminal kernel and scheme profile, capture local card authentication separately from the issuer’s online authorization response.',
      'For the terminal, acquirer and issuer connections you operate, identify each leg’s protection and record the negotiated group and authentication. TLS deployment decisions are separate from approval of the card and terminal flow.',
      'Measure complete terminal exchanges and transaction times against the applicable scheme limits. Record the version and supported features of the HSM and terminal used for testing.',
    ],
    evaluationMethod:
      'Compare a fictional locally verified card followed by issuer decline with a locally failed check. Identify the decision made by the terminal and the different evidence supplied by the issuer. Then reproduce the acceptance checks on the named kernel and scheme profile.',
    evidenceRequired:
      'Exact card and terminal profiles, kernel version, the terminal data-authentication result, the issuer result, trace timing for all in-scope steps, and the separate TLS evidence.',
    sources: [
      {
        label: 'EMVCo Contact Chip security and testing',
        href: 'https://www.emvco.com/emv-technologies/emv-contact-chip/',
      },
      {
        label: 'RFC 10024 TLS key agreement',
        href: 'https://www.rfc-editor.org/rfc/rfc10024.html#section-4',
      },
    ],
  },
  'crypto-dev-apis': {
    roleFocus: 'Software Engineers, Library Maintainers & AppSec Leads',
    productionCapabilities: [
      'High-level KEM API usage (`EVP_PKEY_encapsulate` / `EVP_PKEY_decapsulate` in OpenSSL 3.5+, `KEM` API in Java 21+, `crypto/mlkem` in Go 1.24+) replacing raw RSA `encrypt`/`decrypt` or manual DH.',
      '`EVP_DigestSign` / `EVP_DigestVerify` (one-shot; confirm streaming support per OpenSSL release) with `NULL` digest for pure `ML-DSA` and `SLH-DSA` (which hash internally via SHAKE or SHA-2 per parameter set).',
      'Safe memory zeroization (`OPENSSL_cleanse` / `Zeroize`) of decapsulation keys and shared secrets.',
    ],
    evaluationMethod:
      'Run unit and integration tests exercising keygen, encapsulate/decapsulate, sign/verify, and negative tampered-ciphertext/signature cases under AddressSanitizer / Valgrind.',
    evidenceRequired:
      'Unit test suite pass log, SAST/Semgrep scan showing zero hardcoded classical primitives, and memory-sanitizer report.',
  },
  'platform-eng-pqc': {
    roleFocus: 'Platform Engineers, Kubernetes Administrators & SREs',
    productionCapabilities: [
      'Service mesh mTLS (Istio, Envoy, Linkerd; Cilium PQC is a community demo) configured with hybrid post-quantum key exchange (`X25519MLKEM768`) and automated workload identity rotation (SPIFFE/SPIRE).',
      'For TLS workload authentication, confirm each issuer and peer supports the selected signing certificate, such as ML-DSA. An ML-KEM subject key under RFC 9935 performs key encapsulation and cannot sign CertificateVerify.',
      'Base container images packaging FIPS-validated or PQC-enabled OpenSSL 3.5+ / BoringSSL / Go 1.24+ runtimes across all Kubernetes namespaces.',
    ],
    evaluationMethod:
      'Inspect Envoy `clusters` / `listeners` TLS stats in staging for PQC group negotiation and verify cert-manager automated renewal of an `ML-DSA-65` Ingress certificate.',
    evidenceRequired:
      'Service-mesh mTLS metrics dump, `kubectl describe certificate` output for PQC cert, and base-image CBOM/SBOM scan.',
  },
  'ot-pqc': {
    roleFocus: 'OT/ICS Security Architects, SCADA Engineers & Grid Operators',
    productionCapabilities: [
      'IEC 62351, OPC UA, and DNP3-SA secure channel configurations supporting hybrid/PQC key transport or post-quantum TLS 1.3 gateways/bump-in-the-wire proxies for legacy PLCs/RTUs.',
      'Deterministic real-time latency bounds ensuring PQC signature verification does not violate protection-relay or control-loop timing windows (e.g., IEC 61850 Type 1A GOOSE trip messages, transfer-time class TT6, `< 3 ms`).',
      'Long-lifecycle firmware signing (`LMS/HSS` or `ML-DSA-87`) for field devices with 15–25 year operational lifespans.',
    ],
    evaluationMethod:
      'Test OPC UA / IEC 62351 session establishment and bump-in-the-wire gateway latency on a hardware-in-the-loop (HIL) OT testbed.',
    evidenceRequired:
      'HIL testbed latency oscilloscope/packet trace, OT asset crypto inventory, and firmware verification log.',
  },
  'healthcare-pqc': {
    roleFocus: 'Healthcare CISOs, Biomedical Device Engineers & HIPAA Compliance Leads',
    productionCapabilities: [
      'Record the negotiated TLS group on the exact FHIR or DICOMweb connection and trace the separate encryption and key-wrapping controls on the retained clinical or genomic record.',
      'For an FDA premarket submission for a cyber device, preserve the section 524B(b)(3) software bill of materials, including commercial, open-source and off-the-shelf components. A cryptographic inventory can supplement the SBOM for the migration.',
      'Test the deployed clinical-device update verification boundary and preserve service availability when a legacy imaging device has to connect through a gateway.',
    ],
    evaluationMethod:
      'Use an isolated device and synthetic clinical data. Test a supported gateway connection, a peer that cannot negotiate the required group and an update signed by an unapproved test key. Verify the submission SBOM covers the exact device software version.',
    evidenceRequired:
      'Gateway and peer build IDs, the negotiated-group trace and archive key evidence, the version-matched SBOM, and positive and negative update verification records.',
    sources: [
      {
        label: 'FDA section 524B questions and answers',
        href: 'https://www.fda.gov/medical-devices/medical-device-cybersecurity/cybersecurity-resources-medical-device-manufacturers-guidance-resources-and-faqs',
      },
      {
        label: 'FDA February 2026 final guidance',
        href: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-management-system-considerations-and-content-premarket',
      },
      {
        label: 'RFC 10024 hybrid TLS key agreement',
        href: 'https://www.rfc-editor.org/rfc/rfc10024.html',
      },
    ],
  },
  'aerospace-pqc': {
    roleFocus: 'Avionics Architects, Satellite Communications Engineers & Defense Leads',
    productionCapabilities: [
      'For a mission using CCSDS SDLS, match the sending and receiving Security Association and measure the complete frame against the channel budget. Determine the mission’s key-establishment policy separately.',
      'For an onboard firmware update, verify the complete signed package on the exact boot verifier and compare the measured transfer and verification time with the authorized maintenance window.',
      'For an in-flight update path, confirm which verifier trusts the new signing profile, within the mission’s allowed rollback and recovery policy.',
    ],
    evaluationMethod:
      'Use the specified mission and test build. Separate a ground-only verifier from a flight link and check any proposed scope exclusion against the approved mission plan. Measure actual bytes and time for both the baseline and candidate package.',
    evidenceRequired:
      'Mission scope and link profile, sender and receiver versions, Security Association parameters where used, complete package size, verification and transfer times, and recovery evidence.',
    sources: [
      { label: 'CCSDS 355.0-B-2 §4.2.2 and §6', href: 'https://ccsds.org/Pubs/355x0b2.pdf' },
    ],
  },
  'automotive-pqc': {
    roleFocus: 'Automotive Cybersecurity Architects (ISO/SAE 21434) & V2X Engineers',
    productionCapabilities: [
      'In an Uptane rollout, verify the metadata for the ECU’s full or partial verification role and check the image against the Director Targets record for its hardware ID, release counter, hash and length.',
      'Test the exact legacy and updated verifiers in the planned signing transition. The older vehicle still needs a supported, trusted signature and metadata profile.',
      'Measure the complete transfer and verification window on the target ECU, including safe installation conditions and a tested recovery path.',
    ],
    evaluationMethod:
      'Run the same fictional update with old and new ECU verifier builds on an isolated test bench. Compare a correct image, an image with changed bytes and a correctly signed package for a different hardware or release counter.',
    evidenceRequired:
      'Vehicle and ECU build identifiers, Director and Image metadata used where applicable, verified image length and digest, acceptance or rejection decision and a measured installation-window trace.',
    sources: [
      {
        label: 'Uptane Standard 2.1.0 §5.4.3–5.4.4',
        href: 'https://uptane.org/docs/2.1.0/standard/uptane-standard#543-installing-images-on-primary-or-secondary-ecus',
      },
    ],
  },
  'exec-quantum-impact': {
    roleFocus: 'Chief Executive Officers, Boards of Directors & CISOs',
    productionCapabilities: [
      'Enterprise-wide cryptographic visibility (CBOM & external surface discovery) covering customer portals, long-lived record archives, and software/update signing.',
      'Multi-year capital and operational budget allocation tied to external regulatory milestones (2028/2030/2035) and vendor contract renewals.',
      'Clear separation between business services (e.g., archiving and retrieval service) and protected assets (long-lived records) in executive risk reporting.',
    ],
    evaluationMethod:
      'Challenge management readiness reports by requesting the underlying dated discovery scan, vendor CAVP/CMVP validation reference, and negative-test receipt for top critical services.',
    evidenceRequired:
      'Board-approved PQC Charter, quarterly KPI scorecard backed by automated discovery scans, and third-party vendor readiness register.',
  },
  'dev-quantum-impact': {
    roleFocus: 'Application Developers, SDK Authors & DevSecOps Engineers',
    productionCapabilities: [
      'Migration from direct RSA/ECDSA/ECDH primitive calls to agile KEM (`Encapsulate`/`Decapsulate`) and PQC Signature APIs in application code.',
      'Database column, JWT header, and network buffer resizing to handle 1–50 KB post-quantum keys, ciphertexts, and signatures without truncation.',
      'Automated CI/CD SAST/CBOM scanning flagging deprecated cryptographic APIs (`RSA_generate_key`, `EC_KEY_new`, `SHA1`).',
    ],
    evaluationMethod:
      'Run integration tests with `ML-KEM-768` and `ML-DSA-65` payloads across full application stacks (API -> ORM -> DB) and verify CI linter gates.',
    evidenceRequired:
      'CI/CD CBOM build artifact, schema migration test pass log, and negative tamper-rejection unit test results.',
  },
  'arch-quantum-impact': {
    roleFocus: 'Enterprise & Security Architects',
    productionCapabilities: [
      'Target reference architectures specifying hybrid vs pure-PQC patterns across Edge/CDN, Service Mesh, PKI/CA, KMS/HSM, and Data-at-Rest tiers.',
      'Protocol byte-budget and latency engineering accounting for MTU fragmentation (TCP TLS 1.3, UDP IKEv2/QUIC/DTLS) and certificate chain bloat.',
      'Cross-domain trust-anchor and interoperability design bridging legacy classical systems and PQC-native zones.',
    ],
    evaluationMethod:
      'Validate reference architecture patterns via staging proof-of-concept deployments measuring handshake size, p99 latency, and failure modes.',
    evidenceRequired:
      'Approved Target Cryptographic Architecture blueprint, protocol sizing worksheet, and PoC performance benchmark report.',
  },
  'ops-quantum-impact': {
    roleFocus: 'IT Operations, SRE, Network & PKI Operations Teams',
    productionCapabilities: [
      'Automated certificate and key discovery, renewal, and emergency rollover across load balancers, Kubernetes clusters, VPN concentrators, and HSMs.',
      'Observability pipelines (Prometheus, OpenTelemetry, SIEM) alerting on classical cipher fallbacks, handshake timeouts, or MTU blackholes.',
      'Tested operational runbooks for HSM firmware upgrades, CA cross-signing, and hybrid group rollback.',
    ],
    evaluationMethod:
      'Execute a game-day operational drill rotating an issuing CA or rolling back a broken hybrid TLS configuration within target MTTR.',
    evidenceRequired:
      'Game-day drill execution log, SIEM cipher-monitoring dashboard screenshot/export, and validated operational runbook.',
  },
  'research-quantum-impact': {
    roleFocus: 'Applied Cryptographers, Security Researchers & Standards Contributors',
    productionCapabilities: [
      'Reproducible benchmarking and security-margin evaluation across lattice (`ML-KEM`, `ML-DSA`, `FN-DSA`, `FrodoKEM`), code-based (`HQC`, `Classic McEliece`), and hash-based (`SLH-DSA`, `LMS/XMSS`) families.',
      'Side-channel (power, EM, cache-timing) and fault-injection vulnerability analysis of concrete PQC implementations.',
      'Cryptographic diversity and fallback architecture planning in case of algebraic cryptanalysis advances against a single mathematical family.',
    ],
    evaluationMethod:
      'Run reproducible benchmark harnesses (`liboqs` / `pqm4` / `PQClean`) and constant-time analysis (`dudect` / `ctgrind` / TVLA) on candidate implementations.',
    evidenceRequired:
      'Reproducible benchmark dataset, constant-time/TVLA analysis report, and standards-track parameter comparison matrix.',
  },
  'standards-bodies': {
    roleFocus: 'Standards Leads, Compliance Architects & Policy Strategists',
    productionCapabilities: [
      'Authoritative tracking of normative standards (NIST FIPS 203/204/205 published; FIPS 206 FN-DSA planned with no public draft, FIPS 207 HQC planned with no public draft; ISO/IEC JTC 1/SC 27, IETF TLS/LAMPS/IPSECME/PQUIP, ETSI TC CYBER QSC) vs certification schemes (CMVP, Common Criteria/EUCC) and regulatory mandates.',
      'Strict verification of IETF RFC / draft status, avoiding deployment of retired pre-standard draft codepoints or superseded specifications.',
      'Mapping of regional cryptographic policies (CNSA 2.0, BSI TR-02102, ANSSI, NCSC, ASD ISM, CRYPTREC, KISA) for global deployments.',
    ],
    evaluationMethod:
      'Cross-verify internal cryptographic standards policies against the latest NIST CSRC, IETF Datatracker RFC index, and regional agency publications.',
    evidenceRequired:
      'Clause-pinned standards traceability matrix with current publication status and OID registry verification.',
  },
  'ai-security-pqc': {
    roleFocus: 'AI/ML Security Architects & MLOps Engineers',
    productionCapabilities: [
      'Cryptographic signing of AI model weights, datasets, and training provenance (C2PA, SLSA/in-toto, Sigstore, OpenSSF Model Signing) using `ML-DSA-65/87` or `SLH-DSA` where the tooling supports it (Cosign ML-DSA is experimental; C2PA 2.4 specifies no PQC algorithms) to prevent model poisoning and supply-chain tampering.',
      'Protection of proprietary training corpora and inference prompts/RAG vectors in transit via hybrid TLS 1.3 (`X25519MLKEM768`) and at rest via `AES-256-GCM` with `ML-KEM` envelope encryption.',
      'Confidential GPU/TEE enclave attestation for high-sensitivity model weights.',
    ],
    evaluationMethod:
      'Sign a serialized model checkpoint (`.safetensors` / ONNX) with `ML-DSA-65`, verify signature before inference loading, and test rejection of tampered weight bytes.',
    evidenceRequired:
      'Signed model manifest, inference loader verification log, and vector-database TLS 1.3 cipher audit.',
  },
  'secrets-management-pqc': {
    roleFocus: 'DevSecOps, Platform Security & Vault Administrators',
    productionCapabilities: [
      'Secrets manager (HashiCorp Vault Enterprise / OpenBao / cloud secrets manager) transit-engine PQC signing (ML-DSA; SLH-DSA experimental) and PKCS#11 HSM seal/unseal, verifying PQC mechanism support per product.',
      'Dynamic secret leasing and automated rotation of post-quantum TLS certificates, SSH keys, and database credentials.',
      'Quantum-safe replication and cluster mTLS (`X25519MLKEM768`) between vault nodes.',
    ],
    evaluationMethod:
      'Configure a staging Vault/OpenBao cluster with PKCS#11 auto-unseal and hybrid TLS 1.3, issue a dynamic PQC certificate, and verify lease revocation.',
    evidenceRequired:
      'Vault seal/transit status output, dynamic certificate lease audit log, and node-to-node TLS 1.3 handshake capture.',
  },
  'network-security-pqc': {
    roleFocus: 'Network Security Architects, Firewall Admins & Zero-Trust Engineers',
    productionCapabilities: [
      'Next-Generation Firewall (NGFW) and IDS/IPS deep-packet inspection compatibility with TLS 1.3 hybrid key shares (`X25519MLKEM768`) and RFC 8879 compressed PQC certificates.',
      'MACsec (IEEE 802.1AE / MKA) 256-bit GCM cipher suites (`GCM-AES-XPN-256`) paired with post-quantum EAP-TLS (MKA key hierarchy).',
      'Zero-Trust Network Access (ZTNA) and SASE tunnel termination supporting post-quantum mutual authentication.',
    ],
    evaluationMethod:
      'Pass hybrid TLS 1.3 and RFC 9370 IKEv2 traffic through staging NGFW/IDS appliances and verify zero false-positive drops or inspection crashes.',
    evidenceRequired:
      'NGFW TLS inspection compatibility log, packet capture (`pcap`) across firewall interfaces, and MACsec 256-bit session status.',
  },
  'database-encryption-pqc': {
    roleFocus: 'Database Administrators (DBAs), Data Architects & Storage Engineers',
    productionCapabilities: [
      'Transparent Data Encryption (TDE) using `AES-256-GCM` / `AES-256-XTS` with Master Encryption Keys (MEKs) wrapped via `ML-KEM-768/1024` in external KMS/HSM (KMIP 3.0 draft / PKCS#11 v3.2).',
      'Client-Side Field-Level Encryption (CSFLE) and searchable encryption key hierarchies using post-quantum key encapsulation.',
      'Database wire-protocol TLS 1.3 hybrid key exchange (`X25519MLKEM768`) where the database or driver and its OpenSSL 3.5+ build support it (MySQL Community: yes; verify PostgreSQL, Oracle, SQL Server and MongoDB per release).',
    ],
    evaluationMethod:
      'Perform an online TDE master-key rotation backed by an `ML-KEM` KMS key in staging and verify client-to-DB TLS 1.3 hybrid cipher negotiation.',
    evidenceRequired:
      'TDE key-rotation audit log, KMIP/KMS key-wrapping receipt, and `pg_stat_ssl` (TLS version/cipher) plus a packet capture or server log showing the negotiated key-exchange group.',
  },
  'iam-pqc': {
    roleFocus: 'Identity & Access Management (IAM) Architects & Workforce Security Leads',
    productionCapabilities: [
      'OIDC / OAuth 2.0 / SAML 2.0 Identity Provider (IdP) token and assertion signing with `ML-DSA-65` and hybrid TLS 1.3 transport.',
      'FIDO2 / WebAuthn and PIV / smartcard hardware authenticator roadmap and enrollment support for post-quantum public-key credentials.',
      'Kerberos PKINIT and Active Directory Certificate Services (ADCS) migration paths from RSA/ECDSA to PQC/hybrid certificates.',
    ],
    evaluationMethod:
      'Test SAML/OIDC federation login flows with PQC-signed tokens and oversized XML/JSON payloads across browser and reverse-proxy stacks.',
    evidenceRequired:
      'IdP metadata/JWKS export, federation login trace, and smartcard/authenticator capability assessment.',
  },
  'secure-boot-pqc': {
    roleFocus: 'Firmware Architects, Silicon Security Leads & Platform Security Engineers',
    productionCapabilities: [
      'Immutable Boot ROM / OTP fuse root-of-trust verifying `LMS/HSS` (NIST SP 800-208), `XMSS`, or `ML-DSA-87` (CNSA 2.0) signatures before executing first-stage bootloaders.',
      'UEFI Secure Boot (`db`, `KEK`, `PK`) and Linux `IMA`/`kmod` signature verification supporting post-quantum X.509/PKCS#7 structures.',
      'Anti-rollback monotonic fuse/TPM counter enforcement preventing downgrade to classical-signed bootloader versions.',
    ],
    evaluationMethod:
      'Test boot verification of a validly signed PQC bootloader image and verify hard boot halt when 1 byte of the image or signature is modified or an older SVN is loaded.',
    evidenceRequired:
      'OTP root-key hash provisioning record, UART boot verification log, and negative tamper/rollback halt test receipt.',
  },
  'os-pqc': {
    roleFocus: 'Linux/Windows Systems Administrators, OS Maintainers & Infrastructure Leads',
    productionCapabilities: [
      'OS-wide cryptographic policy (`update-crypto-policies --set DEFAULT:TEST-PQ` on RHEL/Fedora, OpenSSL 3.5+ `openssl.cnf` default providers) enabling `ML-KEM` and `ML-DSA` across system daemons.',
      'Package-manager repository metadata and RPM/DEB/MSI package verification using post-quantum or dual classical+PQC signatures.',
      'Kernel TLS (kTLS), IPsec (XFRM), and WireGuard/Rosenpass post-quantum key exchange integration.',
    ],
    evaluationMethod:
      'Apply OS PQC crypto-policy in a staging VM, verify `sshd`, `nginx`, and `curl` negotiate hybrid PQC by default, and test package signature verification.',
    evidenceRequired:
      '`update-crypto-policies --show` / `openssl version -a` output, system daemon handshake logs, and package verification output.',
  },
  'slh-dsa': {
    roleFocus: 'Cryptographic Architects, CA Operators & Firmware Signers',
    productionCapabilities: [
      'NIST FIPS 205 `SLH-DSA` support across SHA2 and SHAKE parameter sets (`128s`, `128f`, `192s`, `192f`, `256s`, `256f`) with RFC 9909 X.509 OIDs.',
      'Profile selection matching workload constraints: `-s` (small signature: 7,856–29,792 B, slower signing) vs `-f` (fast signing: 17,088–49,856 B signature) for root CAs and code signing.',
      'Pure vs pre-hash (`HashSLH-DSA`) mode selection and context-string binding per FIPS 205 §10.2–§10.3.',
    ],
    evaluationMethod:
      'Generate `SLH-DSA-SHA2-128s` and `SLH-DSA-SHA2-128f` signatures in OpenSSL 3.5+ / HSM, compare signing latency and wire size, and verify deterministic KAT vectors.',
    evidenceRequired:
      'OpenSSL/HSM `SLH-DSA` benchmark comparison table, RFC 9909 OID certificate dump, and ACVP KAT verification log.',
  },
  'crypto-mgmt-modernization': {
    roleFocus: 'Enterprise Architects, PKI/KMS Leads & Platform Directors',
    productionCapabilities: [
      'Unified Cryptographic Management Plane integrating network TLS discovery, code/binary CBOM scanning, CLM certificate automation, and KMS/HSM key inventory.',
      'Automated coverage-gap detection identifying shadow certificates, unmanaged SSH keys, and EoL cryptographic libraries (e.g., OpenSSL 1.1.1).',
      'Shared-responsibility governance across multi-cloud KMS/HSM providers (AWS KMS/CloudHSM, Azure Key Vault/Managed HSM, GCP Cloud KMS, IBM HPCS, OCI Vault).',
    ],
    evaluationMethod:
      'Reconcile active network discovery scans against CLM/KMS inventories to measure real estate coverage percentage and remediate unmanaged endpoints.',
    evidenceRequired:
      'Estate coverage reconciliation report, multi-cloud KMS PQC capability matrix, and EoL library remediation tracker.',
  },
  'pki-enrollment-protocols': {
    roleFocus: 'PKI Engineers, IAM Architects & Network Automation Leads',
    productionCapabilities: [
      'CMPv3 (RFC 9810 / RFC 9483) and CRMF (RFC 4211) support for `ML-KEM` certificate enrollment using `POPOPrivKey` `encrCert` encrypted-certificate proof-of-possession and explicit `certConf` hash verification (plus `KemOtherInfo` MAC protection).',
      'EST (RFC 7030), SCEP (RFC 8894), and ACME (RFC 8555) support for `ML-DSA` (RFC 9881) and `SLH-DSA` (RFC 9909) PKCS#10 CSR signature proof-of-possession, recognizing that PKCS#9 `challengePassword` only authenticates the request and cannot prove possession of an `ML-KEM` private key.',
      'Composite ML-DSA (RFC 10073) and parallel certificate issuance workflows for transitional hybrid PKI deployments.',
    ],
    evaluationMethod:
      'Execute CMPv3 `ir`/`kur` with `encrCert` POP for `ML-KEM-768` (including negative test with wrong `certConf` hash or unauthorized prior cert) and EST/ACME enrollment for `ML-DSA-65` against a staging CA (e.g., EJBCA 9.1+).',
    evidenceRequired:
      'CMPv3 PKIMessage transcript (`ir`/`ip`/`kur`/`kup`/`certConf`/`pkiconf`), negative confirmation-rejection log, and issued X.509 certificate chain verification.',
  },
  'mls-group-messaging': {
    roleFocus: 'Messaging Security Architects & Collaboration Platform Engineers',
    productionCapabilities: [
      'For an RFC 9420 group reinitialization, confirm the explicit target cipher suite, each member’s matching KeyPackage and the new epoch 1 Welcome bound to the old group.',
      'Test key deletion for forward secrecy and recovery after a fresh leaf key for the affected member is committed. Use a controlled, one-time compromise scenario.',
      'Verify each KeyPackage’s suite, signature and credential binding. A draft suite using Ed25519 offers post-quantum confidentiality against passive attacks. Select a suite with ML-DSA and verify the credential assumptions when the policy calls for post-quantum authentication.',
    ],
    evaluationMethod:
      'Stage a group reinitialization with a mismatched KeyPackage followed by a matching one. Capture the ReInit Commit and Welcome and verify their binding. In a separate run, test member join/remove and committed leaf-key recovery while measuring update bandwidth.',
    evidenceRequired:
      'Target suite and KeyPackage validation receipts, ReInit Commit and matching Welcome metadata, credential verification, and positive and negative epoch recovery cases for the tested build.',
  },
  'pqc-candidates': {
    roleFocus: 'Cryptographic Researchers, Security Architects & Standards Analysts',
    productionCapabilities: [
      'For a policy requiring a published NIST KEM standard, record the actual FIPS 203 ML-KEM parameter set. HQC is selected for standardization. Provider support for the submission is separate from publication of its FIPS.',
      'For signature pilots, record the precise Falcon candidate encoding and library version. NIST’s selected-algorithms registry lists Falcon’s FIPS as forthcoming.',
      'Keep research profiles scoped to the test environment and test that production policy rejects an available candidate when its applicable publication or approval is missing.',
    ],
    evaluationMethod:
      'Compare the selected-algorithm entry with the final publication and the exact provider output. Record separate outcomes for a supported profile and one kept in a research configuration.',
    evidenceRequired:
      'Dated standards review log, versioned provider and encoding, scope of the policy, and the acceptance or refusal result for the tested configuration.',
    sources: [
      {
        label: 'NIST selected algorithms and publication status',
        href: 'https://csrc.nist.gov/projects/post-quantum-cryptography/post-quantum-cryptography-standardization/selected-algorithms',
      },
      { label: 'NIST IR 8547 final', href: 'https://csrc.nist.gov/pubs/ir/8547/final' },
    ],
  },
  'verification-closure': {
    roleFocus: 'Internal Auditors, QA Leads, CISOs & Release Approvers',
    productionCapabilities: [
      'Five-point technical migration verification per system: (1) observed PQC negotiation on the wire, (2) negative tamper/downgrade rejection test, (3) end-to-end PQC certificate-chain validation, (4) documented fallback policy, and (5) archived verification dossier.',
      'Distinction between recorded reference notes and independently executed technical verification tests.',
      'Continuous post-cutover regression monitoring preventing silent configuration drift back to classical-only cryptography.',
    ],
    evaluationMethod:
      'Audit migration closure dossiers by re-running the linked packet-capture check, negative tamper test, and `openssl verify` command against the live staging/production endpoint.',
    evidenceRequired:
      'Complete 5-point verification dossier containing pcap hashes, negative-test failure logs, cert-chain validation output, and reviewer sign-off.',
  },
  'media-drm-pqc': {
    roleFocus: 'Media Security Architects, Broadcast Engineers & Content Protection Leads',
    productionCapabilities: [
      'Verify a C2PA claim signature and content binding with the allowed algorithms and trust configuration for the exact Content Credentials profile. Use Section 8.2 for the C2PA 2.4 claim-signature algorithm list.',
      'For the DRM license service, measure the actually negotiated TLS group and authentication on each relevant leg. Confirm that a hybrid requirement survives gateway termination.',
      'Verify provisioning and revocation on the exact device profiles that consume licenses. A gateway-only build has a different scope from a player or device provisioning service.',
    ],
    evaluationMethod:
      'Verify an original and modified asset in the chosen C2PA validator. Record claim signature and content-binding results separately. Test the license connection in its own scope, including a peer that lacks the required group.',
    evidenceRequired:
      'C2PA profile version, signer trust and content-binding results, TLS group and authentication evidence for each in-scope leg, and the applicable device provisioning scope.',
    sources: [
      {
        label: 'C2PA 2.4 Content Credentials §8.2',
        href: 'https://spec.c2pa.org/specifications/specifications/2.4/specs/ContentCredentials.html',
      },
      {
        label: 'RFC 10024 §4 hybrid key agreement',
        href: 'https://www.rfc-editor.org/rfc/rfc10024.html#section-4',
      },
    ],
  },
  cbom: {
    roleFocus: 'AppSec Engineers, Supply Chain Leads & Enterprise Architects',
    productionCapabilities: [
      'Automated CycloneDX v1.6+ Cryptographic Bill of Materials (CBOM) generation (`cryptoProperties.assetType`: `algorithm`, `certificate`, `related-crypto-material`, `protocol`) integrated into CI/CD and network discovery.',
      'Correlation of static source/binary CBOM findings with runtime TLS/SSH/PKI telemetry to eliminate blind spots.',
      'OID and parameter-set tagging (`ML-KEM-768`, `ML-DSA-65`, `RSA-2048`) driving automated remediation tickets.',
    ],
    evaluationMethod:
      'Generate a CycloneDX 1.6 CBOM JSON from a target repository/container and validate it against the official CycloneDX JSON schema and live runtime cipher usage.',
    evidenceRequired:
      'Schema-validated CycloneDX 1.6 CBOM JSON artifact, CI pipeline scan log, and runtime-vs-static reconciliation report.',
  },
  sbom: {
    roleFocus: 'DevSecOps, Vulnerability Management & Procurement Teams',
    productionCapabilities: [
      'SPDX 3.0 / CycloneDX 1.6 Software Bill of Materials (SBOM) tracking transitive cryptographic library dependencies (`openssl`, `libcrypto`, `bouncycastle`, `wolfssl`, `rustls`, `go/crypto`).',
      'Automated End-of-Life (EoL) and CVE correlation (e.g., flagging `OpenSSL 1.1.1` EoL or libraries lacking PQC support) via Package URL (`purl`) and CPE matching.',
      'Cryptographic signing and verification of SBOM artifacts using `ML-DSA` / Sigstore Cosign.',
    ],
    evaluationMethod:
      'Scan container images and application lockfiles to produce an SBOM, resolve `purl` entries against the PQC product catalog, and verify EoL/CVE flags.',
    evidenceRequired:
      'Signed SBOM artifact, transitive crypto-library dependency tree, and EoL/CVE remediation ticket log.',
  },
  'crypto-registry': {
    roleFocus: 'Enterprise Architects, CMDB Owners & GRC Analysts',
    productionCapabilities: [
      'Centralized Enterprise Cryptographic Registry indexing algorithms, OIDs, key lengths, certificate authorities, HSM partitions, and owning business services.',
      'Automated bidirectional sync with CBOM scanners, CLM platforms, and cloud KMS inventories.',
      'Lifecycle state tracking (`Approved`, `Transitional Hybrid`, `Deprecated — Migrate by 2030`, `Prohibited`) enforced via deployment gates.',
    ],
    evaluationMethod:
      'Query the cryptographic registry for all business services still bound to `RSA-2048` or `ECDSA P-256` and verify owner attribution and scheduled migration wave.',
    evidenceRequired:
      'Cryptographic registry export, OID-to-service mapping table, and quarterly completeness audit report.',
  },
  'government-defense-pqc': {
    roleFocus: 'Defense System Architects, Federal CISOs & NSS Authorizing Officials',
    productionCapabilities: [
      'For an NSS profile under CNSA 2.0, document ML-KEM-1024 for key establishment, ML-DSA-87 for signing, AES-256 and SHA-384 or SHA-512. For software and firmware, the FAQ prefers validated single-tree LMS or XMSS where possible and also approves ML-DSA-87.',
      'For a covered civilian federal system, record its High Value Asset or high-impact status, the priority in the OMB M-26-15 migration plan and the separate dates for key establishment and signatures. NSS is excluded from the memorandum.',
      'For coalition interoperability, collect the selected group, signature, certificate trust and retry behavior from the exact paired configuration. Resolve the applicable policies before approving a mixed deployment.',
    ],
    evaluationMethod:
      'Classify the test asset as NSS or covered civilian, then test both an allowed configuration and an incompatible parameter or peer. Review the CMVP record for the exact module and operating environment where required.',
    evidenceRequired:
      'Written system scope, authoritative policy and milestone references, exact configuration and peer negotiation records, and the appropriate validation and authorization artifacts.',
    sources: [
      {
        label: 'NSA CNSA 2.0 FAQ v2.2',
        href: 'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/1/CSI_CNSA_2.0_FAQ_.PDF',
      },
      {
        label: 'OMB M-26-15 §1 and §3',
        href: 'https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf',
      },
      {
        label: 'Executive Order 14412 §4',
        href: 'https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/',
      },
    ],
  },
  'trust-services-pqc': {
    roleFocus: 'Qualified Trust Service Providers (QTSPs), Public CAs & Auditors',
    productionCapabilities: [
      'Identify the specific trust service, status and applicable standards or profiles before changing cryptography. Where EU 2025/2530 applies, record the significant-change notification for the cryptographic material or techniques used by the service.',
      'For an archival validation service, verify a retained signature, timestamp chain and validation material independently against the agreed profile and trust anchors.',
      'For a CA or TSA ceremony, verify the approved module, configuration and key use for that service. Treat a TLS certificate for the portal as separate evidence from the qualified service’s signing key.',
    ],
    evaluationMethod:
      'Select the exact service and its applicable profile. Replay a representative archival validation or ceremony, then change one trust assumption. For a non-qualified service, document its status and the scope of any proposed exclusion.',
    evidenceRequired:
      'Service and qualification scope, applicable profile and algorithm references, exact CA or TSA key use, observed validation-path outcome, and any required notification or conformity evidence.',
    sources: [
      {
        label: 'Commission Implementing Regulation (EU) 2025/2530 Article 1',
        href: 'https://eur-lex.europa.eu/eli/reg_impl/2025/2530/oj/eng',
      },
    ],
  },
  'pqc-grc': {
    roleFocus: 'GRC Analysts, Internal Audit & Risk Compliance Teams',
    productionCapabilities: [
      'Control-framework harmonization mapping PQC requirements across ISO/IEC 27001:2022 (A.8.24 Use of Cryptography), NIST CSF 2.0, NIST SP 800-53 Rev. 5 (`SC-12`, `SC-13`), DORA, NIS2, and SOC 2.',
      'Evidence-quality grading distinguishing policy declarations from automated configuration exports and negative-control test receipts.',
      'Continuous control monitoring (CCM) alerting when certificate or cipher-suite drift violates control baselines.',
    ],
    evaluationMethod:
      'Perform an internal control effectiveness test on `SC-13` (Cryptographic Protection) and ISO 27001 `A.8.24` by sampling 10 production endpoints and verifying live PQC/hybrid enforcement.',
    evidenceRequired:
      'Harmonized control matrix, control-testing workpaper with live endpoint receipts, and audit-finding remediation tracker.',
  },
  'soc-implementation-pqc': {
    roleFocus: 'SOC Analysts, Detection Engineers & Network Forensics Teams',
    productionCapabilities: [
      'Zeek / Suricata / SIEM parsing of TLS 1.3 post-quantum `supported_groups` (`0x11EC` `X25519MLKEM768`), JA4/JA4S fingerprints, and IKEv2 `ADDKE` transforms.',
      'Detection rules alerting on cryptographic downgrade anomalies, unexpected classical-only connections on PQC-mandated segments, and malformed PQC handshake floods.',
      'Encrypted traffic analysis (ETA) and authorized TLS inspection strategies adapted for perfect-forward-secret hybrid PQC sessions.',
    ],
    evaluationMethod:
      'Replay synthetic hybrid TLS 1.3 and downgrade-attack pcaps through staging Zeek/Suricata sensors and verify SIEM alert generation and field extraction.',
    evidenceRequired:
      'Zeek `ssl.log` JSON showing the extracted `curve` value (or a custom script extracting the PQC group), SIEM detection rule YAML, and alert firing test receipt.',
  },
  'skills-team-structure': {
    roleFocus: 'Security Leaders, Engineering Directors & Workforce Planners',
    productionCapabilities: [
      'Role-based competency frameworks aligned with NICE Workforce Framework (`SP 800-181r1`) covering Architects, Developers, PKI/Network Ops, GRC, and Procurement.',
      'Cross-functional PQC Center of Excellence (CoE) governance model coordinating central cryptographic standards with federated product-team execution.',
      'Hands-on lab and staging simulation validation requiring engineers to demonstrate PQC configuration, debugging, and negative-testing skills.',
    ],
    evaluationMethod:
      'Assess team readiness through practical staging exercises (e.g., diagnosing a TLS 1.3 PQC MTU fragmentation issue or rotating an HSM key) rather than slide-only completion.',
    evidenceRequired:
      'PQC CoE charter, role-to-skill matrix mapped to NICE work roles, and completed practical lab verification records.',
  },
  'custody-threats-controls': {
    roleFocus: 'Custody Security Architects, Operations Leads & Risk Governance Teams',
    productionCapabilities: [
      'In-boundary transaction parsing, allowlist checks, and m-of-n quorum enforcement executed inside the HSM, enclave co-signer, or attested approver boundary rather than a host application.',
      'Independent trusted-display clear signing (e.g., ERC-7730 descriptors paired with bounded ERC-8176 attestations) and bounded approval expiry/nonce binding preventing replay or silent delegatecall upgrades.',
      'Explicit Rule G1 authority separation across signing shares, orchestrators, recovery quorums, and contract-upgrade admins (avoiding single-operator or host-RAM key unwrap exposure).',
    ],
    evaluationMethod:
      'Exercise staging custody policies against negative test cases: tampered amounts, expired approvals, replayed nonces, unallowlisted delegatecalls, and single-party threshold refusal.',
    evidenceRequired:
      'Signed custody policy ruleset, FIPS 140-3 CMVP module certificate & Excluded Components boundary review, and staging negative-test rejection logs.',
  },
  'custody-pqc-migration': {
    roleFocus: 'Custody Architects, Security Researchers, Operations Leads, Executives & GRC Teams',
    productionCapabilities: [
      'Authenticated, transcript-bound PQ/T hybrid TLS (RFC 10024) for HSM clusters, MPC peer channels, and enclave attested TLS, paired with hybrid KEM-DEM (draft-ietf-hpke-pq) share and recovery backup envelopes.',
      'CAVP/CMVP-scoped HSM firmware (PKCS#11 v3.2 ML-KEM, ML-DSA, SLH-DSA) moving control-plane approvals, policy rules, and RFC 4998 evidence renewal chains to post-quantum signatures before CRQC arrival.',
      'Explicit separation of platform-, account-, and chain-controlled migration clocks, including Rule G1 verification of residual classical authorization dependencies on EIP-7702 and ERC-4337 smart accounts.',
    ],
    evaluationMethod:
      'Audit custody CBOM classifications in staging: verify RFC 10024 hybrid handshakes on HSM/MPC links, confirm hybrid KEM-DEM backup re-wrapping with ceremony metadata binding, and test negative smart-account legacy-key bypass cases.',
    evidenceRequired:
      'Custody CBOM with exposed-address register, HSM firmware CAVP vs CMVP module-boundary records, hybrid TLS/KEM-DEM test transcripts, and account-type residual-dependency sign-off.',
  },
  'custody-governance': {
    roleFocus: 'GRC Leads, Executives & Certification / Assurance Engineers',
    productionCapabilities: [
      'Structured custody-design evaluation across all six signing-boundary questions (Q1–Q6) with explicit Rule G1 authority assumptions for policy edits, approver enrolment, replay counters, and recovery.',
      'Jurisdiction-scoped regulatory mapping that applies entity/licence applicability gates first, distinguishes binding statutory verbs ("shall") from guidance ("should"), and separates accounting/permissibility texts into a context band.',
      'Independent scoping review of custody insurance policies (cold specie vs hot crime sub-limits and exclusions), SOC 1/ISAE 3402, SOC 2, ISAE 3000 (Revised), and proof-of-reserves boundaries.',
    ],
    evaluationMethod:
      'Review primary regulatory texts and assurance system descriptions against your actual signing boundary, confirming whether frontend transaction builders, policy updates, and recovery quorums were inside the tested scope.',
    evidenceRequired:
      'Jurisdiction applicability memo, SOC/ISAE system-description boundary review, policy-change quorum evidence, and insurance exclusion schedule review.',
  },
  quiz: {
    roleFocus: 'All Learners & Role Practitioners',
    productionCapabilities: [
      'Verification of domain comprehension across NIST FIPS 203/204/205 parameter sets, hybrid protocol mechanics, PKI/HSM operations, and regulatory timelines.',
      'Translation of conceptual quiz knowledge into concrete staging/production evaluation checks using enterprise cryptographic tools.',
      'Identification of domain knowledge gaps to guide targeted deep-dive module review before production architecture sign-off.',
    ],
    evaluationMethod:
      'Pair knowledge-check results with hands-on staging verification in your own OpenSSL, PKI, KMS/HSM, and network environments.',
    evidenceRequired:
      'Completed domain knowledge checks paired with production-tool evaluation checklists for your active role.',
  },
}

export const MODULE_CAPABILITY_CHECKLISTS: Record<string, ModuleCapabilitySpec> =
  Object.fromEntries(
    Object.entries(MODULE_CAPABILITY_SEEDS).map(([moduleId, seed]) => [
      moduleId,
      {
        moduleId,
        ...seed,
        educationalBoundary: DEFAULT_EDUCATIONAL_BOUNDARY,
      },
    ])
  )

export const ALL_MODULE_IDS: string[] = Object.keys(MODULE_CAPABILITY_CHECKLISTS)

export function getModuleCapabilityChecklist(moduleId: string): ModuleCapabilitySpec | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return MODULE_CAPABILITY_CHECKLISTS[moduleId]
}
