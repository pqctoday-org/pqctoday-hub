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
3. Migrate container image signing from ECDSA P-256 to ML-DSA-65 via cosign or Notation
4. Write OPA/Kyverno policies that block quantum-vulnerable algorithm identifiers at admission time
5. Monitor crypto posture using Prometheus exporters, SIEM queries, and capacity planning data
6. Execute a six-phase migration runway with explicit rollback procedures

## Workshop Steps

### Step 1: Pipeline Crypto Inventory

- 6 CI/CD pipeline stages: Source Control, CI/CD Build, Artifact Signing, Container Registry, Kubernetes Deploy, Runtime & Service Mesh
- 16 crypto assets across stages with HNDL exposure ratings and PQC replacements
- HNDL: High assets are the TLS key exchanges of Vault mTLS (→ X25519MLKEM768) and Service Mesh mTLS (→ ML-DSA-44 + ML-KEM-512); certificates such as the kube-apiserver certificate (→ ML-DSA-65 certificate), the registry certificate and the cert-manager certificates are authentication, so their quantum risk is forgery and they are rated no HNDL risk; the signing keys (container image, SBOM attestation, build provenance, image manifest, Helm chart, Git commit and deploy keys) are quantum-vulnerable but rated no HNDL risk, because NIST IR 8547 ties harvest now, decrypt later to encrypted data and says the authentication algorithm may be transitioned at a different time

### Step 2: Quantum Threat Timeline

- CRQC scenario selector: 2030, 2033, 2035, 2040
- Data expiry year calculated from exposure window text
- Encrypted data with a 10+ year exposure window remains HNDL-exposed regardless of CRQC timeline; a signing key with a long verification window is a forgery risk, not an HNDL risk
- Key insight: HNDL exposure window starts at time of data capture, not at CRQC arrival

### Step 3: Container Signing Migration

- 5 signing tools: cosign (post-quantum status unconfirmed), Notation (ML-DSA support unconfirmed), GPG/OpenPGP (post-quantum signatures defined in RFC 9980; GnuPG and Sequoia support not stated), Sigstore Bundle (on roadmap, no date stated), Docker Content Trust (being retired)
- ML-DSA-65 signature size: 3,309B vs ECDSA P-256: 64B (52× larger)
- Notation: the Library holds no vendor documentation that states ML-DSA support, so treat it as unconfirmed; Sigstore (June 2025) says it wants to enable post-quantum signing as soon as possible, has added ML-DSA to its protocol specification for client experiments and gives no production date
- Docker Content Trust: being fully retired with the Notary v1 service (full shutdown 8 December 2026; the upstream Notary v1 codebase is no longer maintained); Docker names Sigstore/Cosign and Notation as the alternatives and says nothing about post-quantum signatures (Docker, 16 June 2026)
- SLH-DSA preferred for SBOMs (stateless, long signature lifetime, 20+ year validity)

### Step 4: Policy-as-Code Enforcer

- 6 policy rules: 4 OPA Gatekeeper ConstraintTemplates, 2 Kyverno ClusterPolicies
- Blocked: RSA, ECDSA, Ed25519; Required: ML-DSA-44/65/87, SLH-DSA-128, X25519MLKEM768
- SLSA build levels: L2 requires signed provenance from a hosted build platform and L3 a hardened build platform; SLSA (v1.2) names no signature algorithm and has no post-quantum text. The ML-DSA and SLH-DSA provenance rules in this module are a projection, not a SLSA requirement
- Deployment strategy: Audit mode first → 2-week baseline → Enforce mode rollout

### Step 5: Crypto Posture Monitor (4 tabs)

**Metrics & Alerts**: 4 Prometheus exporters (cert-manager, Vault audit log, Istio/Envoy, x509-certificate-exporter)
**SIEM Integration**: 4 queries (Splunk, Elastic, Datadog, Microsoft Sentinel)
**Capacity Planner**: ML-DSA-65 sig 3,309B vs ECDSA 64B (52×); TLS cert chain 2.4KB → 17.4KB (7.25×); TLS handshake 4KB → 18KB (4.5×); etcd growth: 3MB → 14MB per 1000 certs
**ACME Lifecycle**: 7 steps; Let's Encrypt is targeting late 2026 for a staging environment that issues MTCs and 2027 for a production-ready environment (its post gives no ML-DSA issuance dates); cert-manager's Certificate privateKey.algorithm accepts RSA, ECDSA or Ed25519 (no ML-DSA value); internal CAs (Vault PKI, EJBCA) required for ML-DSA certs until ACME supports PQC

### Step 6: Platform Migration Planner

- 6 phases with dependency graph, action checklists, rollback strategies
- Phase 0: Inventory (2w) → Phase 1: Root CA ML-DSA-65 (4w, CRITICAL) → Phase 2: X25519MLKEM768 TLS KEX (3w, CRITICAL) → Phase 3: Artifact Signing ML-DSA (6w, HIGH) → Phase 4: Source Control + CI Identity (4w, HIGH) → Phase 5: Policy Enforcement Cut-Over (2w, MEDIUM)
- Rollback decision tree with 11 nodes covering TLS failures, cert validation, policy blocks

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

- cert-manager: RSA-2048 default; Certificate.spec.privateKey.algorithm accepts RSA, ECDSA or Ed25519 only, so ML-DSA certificates come from an issuer that supports them (Vault PKI, EJBCA)
- Vault PKI role: key_type=rsa → key_type=ml-dsa with parameter_set=ml-dsa-44
- nginx-ingress: ECDHE → ssl-ecdh-curve: X25519MLKEM768:X25519:P-256
- Terraform ACM: RSA_2048 → ML-DSA-44 when supported (AWS roadmap 2026)
- kubeconfig certs: ECDSA P-256 → ML-DSA-44 client certificate from an ML-DSA-capable issuer

### ACME + PQC Timeline

- cert-manager: Certificate privateKey.algorithm accepts RSA, ECDSA or Ed25519; ML-DSA certificates come from issuers such as Vault PKI or EJBCA
- Let's Encrypt is targeting late 2026 for a staging environment that issues Merkle Tree Certificates (MTCs) and 2027 for a production-ready environment; its post says it is tracking the standards for ML-DSA signatures in X.509 and gives no ML-DSA issuance dates
- Until ACME supports PQC: use Vault PKI or EJBCA as internal CAs for ML-DSA certificates

## Cross-References

- `code-signing` — binary/package signing (different from OCI container signing)
- `kms-pqc` — key management internals; cert-manager integration details
- `hsm-pqc` — hardware key storage for signing key material
- `migration-program` — org-level migration governance
- `crypto-dev-apis` — language-level cryptographic API patterns
- `tls-basics` — TLS cipher suite fundamentals
- `api-security-jwt` — JWT algorithm migration (JOSE draft ML-DSA)
