# RAG Summary: Platform Engineering & PQC

## Module Metadata

- **Slug**: `platform-eng-pqc`
- **Title**: Platform Engineering & PQC
- **Track**: Applications
- **Difficulty**: Advanced
- **Duration**: 120 min
- **Workshop Steps**: 6
- **Personas**: Ops, Developer, Architect, Researcher

## Core Learning Objectives

1. Identify every cryptographic primitive embedded in a CI/CD pipeline from source control to runtime
2. Understand why HNDL (Harvest-Now-Decrypt-Later) makes TLS key exchange the most critical migration priority
3. Plan container image signature migration after signing, trust and verification support is confirmed; Sigstore has proposed a separate opt-in PQC public instance for mid-2027
4. Write OPA/Kyverno policies that block quantum-vulnerable algorithm identifiers at admission time
5. Monitor crypto posture by checking which sources can supply certificate algorithms (an exporter's expiry metrics do not carry the key algorithm), using SIEM checklists and capacity planning data
6. Execute a six-phase migration runway with explicit rollback procedures

## Workshop Steps

### Step 1: Pipeline Crypto Inventory

- 6 CI/CD pipeline stages: Source Control, CI/CD Build, Artifact Signing, Container Registry, Kubernetes Deploy, Runtime & Service Mesh
- 16 crypto assets across stages with HNDL exposure ratings and PQC replacements
- HNDL: High assets are the TLS key exchanges of Vault mTLS (→ X25519MLKEM768) and Service Mesh mTLS (→ ML-DSA-44 + ML-KEM-512); certificates such as the kube-apiserver certificate (→ ML-DSA-65 certificate), the registry certificate and the cert-manager certificates are authentication, so their quantum risk is forgery and they are rated no HNDL risk; the signing keys (container image, SBOM attestation, build provenance, image manifest, Helm chart, Git commit and deploy keys) are quantum-vulnerable but rated no HNDL risk, because NIST IR 8547 ties harvest now, decrypt later to encrypted data and says the authentication algorithm may be transitioned at a different time

### Step 2: Quantum Threat Timeline

- Compare a fictional cohort starting January 1, 2026 UTC with illustrative January 1 UTC horizons: 2030, 2033, 2035 and 2040. These scenario choices are not forecasts or compliance deadlines.
- Use explicit structured minimum and optional maximum bounds from the sample inventory, separately for payload confidentiality and signature/credential authenticity. Years are calendar years, days are 24 hours and hours are 60 minutes. An absent maximum stays open; exposure-window prose is not parsed and no default lifetime is substituted.
- The shared helper drives workshop and exercise scenario findings from the same current inventory. Workshop counts follow the selected stage; the exercise's stated findings use All Stages. Counts distinguish vulnerable assets from purpose windows: a record can have both purposes, and signing lifetimes never inflate the confidentiality/HNDL count.
- If the minimum ends after the selected horizon, protection is required beyond that horizon. If a finite maximum ends by the horizon, the cohort's window ends by it. A horizon within a range or unresolved open bound is indeterminate; missing or invalid bounds remain unassessed, not evidence of protection. An omitted other purpose means it is not modeled in that record, not that it is safe or unnecessary.
- TLS payload confidentiality concerns key exchange, not certificate signing. The runtime sample retains both its short SVID authenticity window and its separate long payload-confidentiality window; the short certificate lifetime does not replace payload retention. Signature/credential authenticity concerns forgery, not HNDL.
- Ending a window for this cohort does not protect newly issued classical credentials or an ongoing pipeline. With production tools, reassess actual retention and trust/use windows, their evidence and uncertainty, migration compatibility, and applicable guidance for the real system scope.

### Step 3: Container Signing Migration

- 5 signing tools: cosign (current ML-DSA support unconfirmed; separate Sigstore PQC service targeted for mid-2027), Notation (JWS/COSE envelope formats; current ML-DSA support unconfirmed), GPG/OpenPGP (RFC 9980 specifies PQ/T algorithms; GnuPG 2.5.24 documents opt-in RFC 9980 processing and ML-KEM hybrid encryption, but not RFC 9980 signature operations), Sigstore Bundle (on roadmap for separate PQC service, mid-2027 target), Docker Content Trust (retirement scheduled for Dec. 8, 2026)
- ML-DSA-65 signature size: 3,309B vs ECDSA P-256: 64B (52× larger)
- Notation uses Notary Project signature envelopes. The project specifies JWS and COSE; its listed algorithms are RSA-PSS and ECDSA. No Notation or AWS Signer plugin documentation checked here confirms ML-DSA. RFC 10073 now standardizes Composite ML-DSA for X.509/PKIX, but standardization does not prove tool, provider, CA or verifier adoption. Sources: https://github.com/notaryproject/specifications/blob/main/specs/signature-specification.md; https://github.com/notaryproject/specifications/blob/main/specs/signature-envelope-jws.md; https://github.com/aws/aws-signer-notation-plugin; https://www.rfc-editor.org/rfc/rfc10073.html
- RFC 9980 specifies composite ML-DSA+EdDSA signatures and ML-KEM+ECDH encryption for OpenPGP. GnuPG 2.5.24 documents the opt-in `--allow-9980` mode and ML-KEM hybrid encryption, but its release notes do not document RFC 9980 signature operations; GnuPG's default mode remains oriented toward its distinct LibrePGP format. Do not infer signature support from parsing or encryption support. Sources: https://www.rfc-editor.org/rfc/rfc9980.html; https://lists.gnupg.org/pipermail/gnupg-announce/2026q3/000516.html; https://gnupg.org/documentation/manuals/gnupg/GPG-Esoteric-Options.html
- Docker Content Trust: Docker states that DCT and notary.docker.io are being retired, with service shutdown scheduled for 8 December 2026, and names Sigstore/Cosign and Notation as alternatives. Verify current service status and migration instructions before acting. Source: https://docs.docker.com/retired/
- SLH-DSA preferred for SBOMs (stateless, long signature lifetime, 20+ year validity)

### Step 4: Policy-as-Code Enforcer

- 6 policy rules: 3 OPA examples, 2 Kyverno policies and 1 native OpenBao ACL, each with its own input contract
- The certificate companion policy targets unreleased cert-manager source fcecd8377a59b44d1daf4b9ac1401eaa2a6f76b0 with MLDSAPrivateKeys enabled on both controller and webhook. Released v1.21.3 cannot issue the sample. The working fictional SelfSigned request uses algorithm MLDSA, size 65, PKCS8 and Always rotation; native tests cover issuance, actual key replacement on renewal, valid/default parameter sets and rejected requests. OPA/Rego v1 checks the declared profile separately; a match is not issuance or deployment validation.
- SLSA build levels: L2 requires signed provenance from a hosted build platform and L3 a hardened build platform; SLSA (v1.2) names no signature algorithm and has no post-quantum text. The working provenance sample uses a pinned fictional ECDSA P-256 key with cosign 3.0.6 and OPA 1.19.1: the verifier checks the signed statement bytes before policy checks the actual artifact digest and named sample builder. Six downloadable files include the verifier, policy, artifact, statement, public key and signature bundle. Trusted, altered-artifact and altered-statement cases are reproducible; annotations are never evidence. The offline example omits transparency-log checks and does not establish Build L3 isolation or PQC signing
- Evaluate engine/version, issuer and consumer support, trust and renewal with production tools. The SelfSigned sample does not establish ACME support, universal TLS compatibility or SLSA Build L3.

### Step 5: Crypto Posture Monitor (4 tabs)

**Metrics & Alerts**: A worked TLS observation lab parses two captured OpenSSL 3.6.3 connections with identical cipher/authentication and different negotiated groups. A schema-1 fictional metric feeds five copyable Prometheus rules tested with promtool 3.15.0 against seven positive/negative/collection cases. The sample policy allows both X25519MLKEM768 and X25519; missing groups are not inferred from cipher suites. The browser parses supplied output, while copied promtool commands execute the alert tests. This sits alongside 4 monitoring-source capability requirements (cert-manager, Vault audit log, Istio/Envoy, x509-certificate-exporter) with non-executable examples; certificate algorithms must come from a documented source, since an exporter's expiry metrics do not carry the key algorithm, and missing algorithm data is Unknown
**SIEM Integration**: 4 capability checklists, not runnable queries (Splunk, Elastic, Datadog, Microsoft Sentinel)
**Capacity Planner**: ML-DSA-65 sig 3,309B vs ECDSA 64B (52×); TLS cert chain 2.4KB → 17.4KB (7.25×); TLS handshake 4KB → 18KB (4.5×); etcd growth: 3MB → 14MB per 1000 certs
**ACME Lifecycle**: 7 steps; Let's Encrypt is targeting late 2026 for a staging environment that issues MTCs and 2027 for a production-ready environment (its post gives no ML-DSA issuance dates); released cert-manager v1.21.3 does not accept the sample MLDSA setting; the separate pinned-alpha SelfSigned example enables MLDSAPrivateKeys on controller and webhook and demonstrates issuance and renewal. SelfSigned success does not establish ACME issuer support

### Step 6: Platform Migration Planner

- 6 phases with dependency graph, action checklists, rollback strategies
- Phase 0: Inventory (2w) → Phase 1: Root CA ML-DSA-65 (4w, CRITICAL) → Phase 2: X25519MLKEM768 TLS KEX (3w, CRITICAL) → Phase 3: Artifact Signing ML-DSA (6w, HIGH) → Phase 4: Source Control + CI Identity (4w, HIGH) → Phase 5: Policy Enforcement Cut-Over (2w, MEDIUM)
- Rollback decision tree with 11 nodes covering TLS failures, cert validation, policy blocks

## SSH deploy-key status (checked 18 November 2026)

OpenSSH 10.4 added experimental ML-DSA-44+Ed25519 hybrid signatures, initially off by default. OpenSSH 10.6 includes the `ssh-mldsa44-ed25519` algorithm, and 10.6p2 permits it as a CA signature algorithm. This hybrid signature does not establish support for a pure ML-DSA SSH key. The current SSHM composite-signature document is draft-ietf-sshm-composite-sigs-01, an Internet-Draft published 17 November 2026. Verify the installed release, algorithm configuration, and the needed user, host, or CA role. [OpenSSH release notes](https://www.openssh.org/releasenotes.html) · [Current SSHM draft](https://datatracker.ietf.org/doc/html/draft-ietf-sshm-composite-sigs-01)

## Key Data Points

### Algorithm Sizes (container signing and TLS)

- ECDSA P-256 signature: 64 bytes
- ML-DSA-44 signature: 2,420 bytes (38×)
- ML-DSA-65 signature: 3,309 bytes (52×)
- SLH-DSA-128f signature: 17,088 bytes (267×)
- ECDSA P-256 X.509 cert: 800 bytes
- ML-DSA-65 X.509 cert: 5,800 bytes (7.25×)
- TLS 1.3 handshake (classical): 4,096 bytes
- TLS 1.3 handshake (PQC): 18,432 bytes (4.5×)
- TLS handshake latency P99: 12ms (classical) → 28ms (PQC, +133%)

### IaC Quantum-Vulnerable Defaults

- cert-manager: the tested ML-DSA example uses the pinned unreleased source and both MLDSAPrivateKeys gates, with algorithm MLDSA, size 65, PKCS8 and Always rotation; released v1.21.3 is not compatible with that manifest
- OpenBao 2.7.2 PKI role: key_type="mldsa", key_bits=44 for the worked certificate request, with an existing sample PKI mount/CA. Inspect the actual subject key and issuer chain separately
- nginx-ingress: ECDHE → ssl-ecdh-curve: X25519MLKEM768:X25519:P-256
- Terraform ACM: RSA_2048 → ML-DSA-44 when supported (AWS roadmap 2026)
- kubeconfig certs: ECDSA P-256 → ML-DSA-44 client certificate from an ML-DSA-capable issuer

### ACME + PQC Timeline

- The cert-manager sample is pinned to unreleased source fcecd8377a59b44d1daf4b9ac1401eaa2a6f76b0 and its feature gates. Its SelfSigned result does not imply support in a released chart or an ACME issuer
- Let's Encrypt is targeting late 2026 for a staging environment that issues Merkle Tree Certificates (MTCs) and 2027 for a production-ready environment; its post says it is tracking the standards for ML-DSA signatures in X.509 and gives no ML-DSA issuance dates
- Evaluate the chosen issuer and consumers for documented ML-DSA support. The worked OpenBao PKI role and cert-manager SelfSigned examples establish their declared sample behavior, not universal ACME or deployment compatibility

## Cross-References

- `code-signing` — binary/package signing (different from OCI container signing)
- `kms-pqc` — key management internals; cert-manager integration details
- `hsm-pqc` — hardware key storage for signing key material
- `migration-program` — org-level migration governance
- `crypto-dev-apis` — language-level cryptographic API patterns
- `tls-basics` — TLS cipher suite fundamentals
- `api-security-jwt` — JWT algorithm migration (JOSE draft ML-DSA)
