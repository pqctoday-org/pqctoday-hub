# Code Signing & Supply Chain Security Module

This module teaches post-quantum code signing and software supply chain security. Code signing is the cryptographic mechanism that guarantees software integrity and publisher authenticity. Every operating system, package manager, and app store relies on digital signatures to verify that binaries have not been tampered with after publication. The module covers supply chain attack case studies (SolarWinds, 3CX, Codecov), the quantum threat amplifier for supply chains, PQC signing algorithms (ML-DSA, SLH-DSA, LMS), certificate chain architecture, package manager signing status, Sigstore keyless signing, and secure boot/firmware signing with CNSA 2.0 timelines.

## Key Concepts

- **Supply chain attacks**: SolarWinds (2020, Orion software build system compromised; the vulnerability shipped in updates released March to June 2020 and was not in the source code repository; CISA reports the malicious Orion library was then signed by the legitimate SolarWinds code signing certificate; fewer than 18,000 customers may have had an installation), 3CX (2023, Mandiant: the compromise began with a tampered X_TRADER installer signed by Trading Technologies International, Inc, which led to a trojanized 3CX DesktopApp; the first software supply chain attack Mandiant had seen lead to another), Codecov (2021, Bash Uploader script modified without authorization to export CI-related information)
- **Quantum amplifier for supply chains**: Quantum computers transform supply chain risk from key theft to key forgery via Shor's algorithm; an adversary able to derive a publisher's private key from its public key could forge that publisher's signatures. Signed files are not encrypted, so harvest-now-decrypt-later does not apply to the signature; the risk is future forgery while the public key is still trusted (the update channel that delivers a file is assessed separately); a quantum-compromised Root CA key affects the entire ecosystem simultaneously
- **Classical vs PQC code signing algorithms**: ECDSA P-256 raw signature (64 B), RSA-4096 signature (512 B), ML-DSA-44 signature (2,420 B), ML-DSA-87 signature (4,627 B), SLH-DSA-SHA2-128s signature (7,856 B). The 38–123× comparison is for these specific raw signature sizes versus raw ECDSA P-256 and excludes certificates, artifact framing, and transparency proofs. Verification frequency and performance depend on the consumer workflow; measure them rather than assuming one check per install.
- **Code signing certificate chains**: Root CA (ML-DSA-87, strongest), Intermediate CA (ML-DSA-65), end-entity Code Signing Certificate (ML-DSA-44, EKU OID 1.3.6.1.5.5.7.3.3, 1-year validity); PQC timestamping (RFC 3161) requires PQC-capable TSAs
- **Package manager signing**: RPM supports hybrid ML-DSA-87+Ed448 in RHEL 10.1. npm registry signatures use ECDSA P-256, while npm provenance and PyPI attestations use Sigstore. Sigstore ML-DSA identifiers remain experimental; its separate opt-in PQC public instance is targeted for mid-2027, not currently available.
- **Sigstore keyless signing**: Identity-based trust with short-lived Fulcio certificates and Rekor transparency entries. A PQC transition also requires compatible signing clients, certificate and artifact handling, transparency-log operations, trust-root distribution, and verifiers; central-service upgrades alone do not migrate clients or existing signatures.
- **Secure boot and firmware signing**: Trust chain from immutable root of trust (ROM/TPM) through UEFI Secure Boot, OS kernel, to runtime firmware; firmware keys have 10-20 year lifetimes making them priority PQC migration targets
- **CNSA 2.0 mandate**: NSA permits ML-DSA-87 or the stateful LMS/XMSS schemes specified by SP 800-208 for firmware/software signing in National Security Systems; NSA's 2022 category guidance says prefer CNSA 2.0 signing from 2025 and use it exclusively by 2030 (superseded for planning by the dates in NSA's CNSA 2.0 FAQ, version 2.2). FAQ version 2.2 mandates CNSA 2.0 algorithms for NSS by 2031 unless otherwise noted; 2035 is the separate NSM-10 objective.
- **LMS vs ML-DSA for firmware**: LMS offers compact signatures (2.5 KB) and tiny public keys (56 B), fast verification (~0.1 ms), CNSA 2.0 compliant, but requires stateful monotonic counter; ML-DSA is stateless but has larger signatures (3.3 KB) and public keys (1.9 KB)

## Workshop Activities

1. **Binary Signing**: Sign a file hash with ML-DSA and verify the signature interactively
2. **Certificate Chain Builder**: Build a complete PQC code signing certificate chain (Root CA, Intermediate CA, end-entity)
3. **Package Signing**: Simulate RPM-style ML-DSA-87+Ed448 hybrid package signing
4. **Sigstore Flow**: Walk through keyless signing workflow including OIDC authentication, Fulcio certificate issuance, and Rekor transparency log recording
5. **Secure Boot Chain**: Explore firmware signing trust chain with LMS, XMSS, and ML-DSA across boot stages

## Related Standards

- FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- NIST SP 800-208 (LMS/HSS and XMSS)
- NSA CNSA 2.0 guidance for firmware/software signing
- RFC 3161 (Internet X.509 PKI Time-Stamp Protocol)
- IETF composite signatures draft (hybrid classical + PQC)
- Sigstore (Fulcio, Rekor, Cosign)
- SLSA and in-toto supply chain verification frameworks
