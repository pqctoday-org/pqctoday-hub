# Architect Quantum Impact

## Overview

Architect Quantum Impact connects six descriptive architecture scenarios to skill self-ratings, a phased action checklist and a nine-item exposure checklist. Separate linked tools support certificate-payload estimates, TLS configuration experiments and hybrid-certificate comparisons. The module also contains the Strangler Fig migration model and the source-attributed Trust Hardware Selector.

## Key Concepts

- **KMS Migration Complexity** — key wrapping hierarchies must be redesigned to accommodate ML-KEM-768/1024 ciphertexts (1,088/1,568 bytes vs. RSA-OAEP 256 bytes); HSM firmware upgrades are required for hardware-backed PQC key generation — not all current HSM models have PQC firmware available; key wrapping with ML-KEM requires re-encryption of all existing DEKs under new PQC KEKs (envelope re-encryption at scale)
- **Certificate Chain Size Explosion** — classical leaf + intermediate + root chain: ~3 KB; hybrid chain (dual-algorithm X.509 v3 with composite or alt-sig cert): ~6–8 KB; pure ML-DSA-65 chain: ~12–14 KB; IoT/DTLS constrained environments where classical chain fits in 1.5 KB MTU will require fragmentation or alternative cert delivery for PQC chains; OCSP stapling must be sized for ML-DSA responses
- **Hybrid Architecture Design** — dual-algorithm code paths must handle independent failure modes (classical succeeds, PQC fails; PQC succeeds, classical fails); fallback logic must be deliberate, not silent; hybrid KEM combiners (X-Wing, SP 800-227 pattern) must concatenate shared secrets through a domain-separated KDF to prevent downgrade attacks; hybrid certificate formats: Composite X.509 (draft-ietf-lamps-pq-composite-sigs-19), Related Certificates (RFC 9763) dual-cert pairs, and the historical Chameleon Certificates design (draft-bonnell-lamps-chameleon-certs-07, an expired individual draft) each have different operational tradeoffs
- **Algorithm Selection Decision Tree** — constrained devices (IoT, smart cards, embedded): FN-DSA-512 (Falcon-512) preferred — compact signature (666 bytes), but requires Gaussian sampling (careful implementation); ML-DSA-44 for signing when implementation simplicity matters more than size; ML-KEM-512 for key exchange on constrained devices; general servers/cloud: ML-DSA-65 for signing, ML-KEM-768 for KEM; high-assurance/long-lived: ML-DSA-87, ML-KEM-1024, SLH-DSA-SHAKE-256s
- **TLS Handshake Latency Budgets** — architects must audit SLA contracts; CDN and load balancer session ticket sizes also grow
- **Strangler Fig Migration Pattern** — legacy monolithic crypto services can be gradually migrated without downtime by deploying a PQC API Gateway to intercept traffic and routing specific endpoints to new PQC-enabled microservices over time.
- **Crypto-Agility Debt** — hardcoded algorithm identifiers (OID strings, JCA algorithm names, cipher suite constants) embedded in configuration files, database schema, or wire protocols create migration blockers; crypto-agile systems abstract algorithm selection behind a policy interface; CBOM (Cryptographic Bill of Materials) — machine-readable inventory of all cryptographic dependencies (analogous to SBOM); CycloneDX CBOM schema is the current draft standard
- **HSM PQC Maturity Tiers** — Tier 1 (PQC firmware shipping): Thales Luna Network HSM 7 (firmware 7.9.0 or newer for ML-KEM and ML-DSA, 7.8.9 or newer for LMS/HSS; Thales's pages do not list SLH-DSA), Entrust nShield 5 (firmware v13.8+, ML-KEM v13.8.3+: ML-KEM, ML-DSA, SLH-DSA; its FIPS 140-3 certificate #5329 lists no PQC), Utimaco u.trust GP HSM Se-Series with Quantum Protect (ML-KEM, ML-DSA, LMS, XMSS; SLH-DSA on roadmap; no FIPS certificate is established for this product name here, and FIPS 140-2 certificate #3925, now Historical, is listed under CryptoServer Se-Series Gen2), Crypto4A QxHSM (FIPS 140-3 certificate #5497 lists ML-KEM, ML-DSA, SLH-DSA and LMS); Tier 2 (limited): AWS CloudHSM (ML-DSA only, through vendor-defined PKCS#11 mechanisms, in FIPS mode on hsm2m.medium from 1 Sep 2026, not yet on its CMVP certificate; no ML-KEM), Azure Dedicated HSM (Thales Luna 7 backend, PQC by customer-requested firmware upgrade; retiring, no new customers); Tier 3 (not in the HSM yet): Google Cloud HSM (PQC keys at the Cloud KMS software protection level only), IBM 4769 (PQC key types not yet GA); architects must map their HSM tier against their migration timeline before committing to hardware-backed PQC key storage
- **DTLS 1.3 with ML-KEM** — IoT and UDP-based protocols (CoAP, QUIC, DTLS) face additional constraints: DTLS record size limits, handshake fragmentation, retransmit buffers for large PQC Certificate messages; DTLS 1.3 + ML-KEM-512 is the current recommended path for constrained IoT; QUIC with X25519MLKEM768 is available in Cloudflare, Chrome, and BoringSSL
- **Crypto-Agility CBOM** — architects should mandate CBOM generation in build pipelines; CycloneDX cbom component type identifies algorithm, key length, and usage context; CBOM enables automated policy enforcement (OPA/Kyverno) and accelerates future algorithm transitions by providing a machine-readable migration target list
- **Trust Hardware Selection** — eight kinds of hardware root trust or protect keys and differ in where they sit, who controls them, where long-term keys live, what they can attest, and their post-quantum status: TPM 2.0 (host root of trust; V1.85 adds ML-KEM and ML-DSA), Caliptra (open root-of-trust block inside a chip; ML-DSA firmware-signature checks from release 2.0, ML-KEM-1024 accelerator in 2.1), Tessera (specified open design for a workload-attached HSM; specification and code, no product or certificate yet; in its cache model keys arrive masked from an HSM service with a validity counter, and each partition is bound to its TEE through a TDISP device interface; its speed and FIPS 140-3 Level 3 certification are requirements, not measurements; Microsoft describes it as an evolution of the Azure Integrated HSM), hardware HSM (appliance you run), cloud HSM (provider-run HSM service; support varies by service), confidential computing (CPU mode that protects data in use; keys are fetched after attestation), DPU you buy (network card that encrypts inline; in NVIDIA's DOCA PSP sample the application can run on the DPU or the host and the receiver derives keys inside the device, and the sources read describe no standard way to load wrapped HSM keys into it), and cloud operator DPU (the provider's own cards, such as AWS Nitro, Azure Boost and Google Titanium). Where a source does not state a fact the grid says "Not published in the sources read"

## Workshop / Interactive Activities

The workshop has six steps:

1. **Why It Matters** — six expandable descriptive architecture impact/scenario cards, with links to separate tools. The cards do not compute certificate/OCSP sizes, scan vendors or calculate P99 feasibility.
2. **What to Learn** — self-rate design skills and follow linked learning modules.
3. **How to Act** — select phased action items and quick wins and export the checklist as Markdown. The selections do not establish that an architecture has been implemented or tested.
4. **Architecture Readiness** — a nine-item exposure checklist to identify design topics to revisit, not a measured readiness scan.
5. **Strangler Fig Architect** — model gradual migration of a legacy monolithic crypto service behind a PQC API gateway. The model illustrates routing choices; it does not demonstrate a no-downtime production migration.
6. **Trust Hardware Selector** — compare eight kinds of trust hardware using cards and the 10-row grid, then try **Pick the right one** and **How they combine**. Source attribution and the distinction between specification, shipping product and certificate remain explicit, including Tessera's specification/code status.

### Separate sample tools for the next decision

- [Cert Capacity Calculator](/playground/cert-capacity): adjust a three-level-chain model and leaf renewal cadence; compare estimated intermediate-plus-leaf TLS payload and annual leaf issuance storage. The root is excluded from TLS payload. Use these assumptions to plan PKI measurements; the model does not predict CPU capacity, P99 latency, OCSP response size or MTU fragmentation.
- [TLS 1.3 Simulator](/playground/tls-simulator): configure sample groups, cipher suites and identities and inspect the handshake interaction. Choose interoperability cases, then measure budgets and fallback behaviour with your own endpoints and workload.
- [Hybrid Certificates](/playground/hybrid-certs): generate sample certificates and compare parsed formats and verification results. Use the comparison to decide which formats need relying-party tests; sample verification does not establish client, vendor HSM or certification support.

## Related Standards

- FIPS 203 (ML-KEM — parameter sets: ML-KEM-512, ML-KEM-768, ML-KEM-1024)
- FIPS 204 (ML-DSA — parameter sets: ML-DSA-44, ML-DSA-65, ML-DSA-87)
- FIPS 205 (SLH-DSA — 12 parameter sets including SLH-DSA-SHAKE-128f, SLH-DSA-SHAKE-256s)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners)
- NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes — LMS/XMSS)
- IETF draft-ounsworth-pq-composite-sigs (Composite X.509 signatures)
- IETF draft-connolly-cfrg-xwing (X-Wing hybrid KEM combiner)
- IETF draft-ietf-tls-mlkem (ML-KEM in TLS 1.3 — X25519MLKEM768 group)
- CycloneDX CBOM (Cryptographic Bill of Materials schema)
- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0)
- DTLS 1.3 (RFC 9147 — transport layer security for constrained environments)

## Cross-References

- `kms-pqc` — KMS provider PQC landscape, KMIP v2.1, envelope encryption patterns
- `hsm-pqc` — HSM PQC capability matrix, PKCS#11 v3.2 CKM_ML_DSA/CKM_ML_KEM, key hierarchy design
- `hybrid-crypto` — hybrid certificate formats (Composite, Alt-Sig, Related Certificates; Chameleon as a historical design), hybrid KEM combiners
- `tls-basics` — TLS handshake fundamentals, hybrid group negotiation, certificate chain delivery
- `iot-ot-pqc` — DTLS 1.3 PQC for IoT, constrained device algorithm selection, CoAP + ML-KEM
- `secure-boot-pqc` — TPM and Caliptra roots of trust, firmware signing
- `pqc-hw-acceleration` — Caliptra Adams Bridge and other accelerators
- `confidential-computing` — TEEs, attestation and key release
- `network-security-pqc` — network protocols that DPUs can offload
- `crypto-agility` — crypto-agility frameworks, CBOM generation, algorithm abstraction layer patterns
- `pki-workshop` — PKI hierarchy design, sample certificate lifecycle and certificate-payload/renewal-storage estimates
- `migration-program` — phased migration planning, dependency mapping, rollback procedures
