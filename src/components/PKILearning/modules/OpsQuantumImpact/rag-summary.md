# Ops/DevOps Quantum Impact

## Overview

The Ops/DevOps Quantum Impact module equips infrastructure operators, SREs, and DevOps engineers with the operational runbooks, configuration patterns, and monitoring tooling needed to manage PQC migration at scale. It covers six high-impact operational disruptions — certificate rotation at scale, VPN and SSH algorithm changes, monitoring threshold recalibration, CI/CD signing pipeline migration, config management template updates, and incident response for PQC-specific failures — alongside a nine-criterion ops readiness self-assessment and an Operations Playbook Builder that produces actionable runbooks. Content is calibrated for operators who manage fleets rather than write application code.

## Key Concepts

- **PQC Certificate Rotation at Scale** — PQC certificates are expected to have shorter validity periods (90-day maximum per CA/Browser Forum baseline requirements); at 10,000 certificates on 90-day cycles, rotation events increase 4× compared to 1-year classical certs; ACME v2 (RFC 8555) with ML-DSA support planned for Let's Encrypt staging in 2026 and production in 2027; EST (RFC 7030) is the preferred enrollment protocol for enterprise and device fleet PQC certificate automation; cert-manager v1.17+ supports `algorithm: MLDSA44` in Certificate spec
- **VPN/SSH Algorithm Negotiation Changes** — strongSwan IKEv2: add `ML-KEM-768` and `X25519MLKEM768` to `esp` and `ike` proposal strings; OpenSSH `KexAlgorithms`: add `mlkem768x25519-sha256` (OpenSSH 9.0+); IPsec kernel modules may require updates for new KEM ciphersuites; SSH host key rotation from ECDSA to ML-DSA requires `known_hosts` re-provisioning across all client fleets — coordinate with config management before cutting over
- **Monitoring Threshold Recalibration** — PQC TLS handshakes are 3–4× larger than classical (18 KB vs. 4 KB); network byte rate alerts, load balancer connection timeout alerts, and APM transaction size alerts will fire false positives after PQC rollout; Prometheus metric `pqc_tls_cipher_suite` (from x509-certificate-exporter or custom exporter) enables per-cipher-suite tracking; recalibrate: connection timeout (30s → 60s for initial PQC handshakes on slow links), max HTTP header size (8 KB → 32 KB for ML-DSA JWT tokens), TLS record size limits
- **CI/CD Signing Pipeline Migration** — cosign (Sigstore): ML-DSA-65 support on roadmap for 2026; Notation (CNCF): ML-DSA beta support via AWS Crypto plugin available 2025; Docker Content Trust (Notary v1) has no PQC roadmap — operators should migrate to cosign or Notation immediately; Tekton Chains: tracks cosign roadmap; GitHub Actions artifact signing: depends on Sigstore; migration sequence: deploy Notation ML-DSA plugin → update pipeline YAML → update admission controller policy → retire cosign ECDSA keys
- **Config Management PQC Defaults** — Terraform AWS provider: `key_spec = "ML_DSA_44"` (when AWS KMS adds GA support, roadmap 2026); Ansible crypto modules: `openssl_privatekey` with `type: ML-DSA` requires community.crypto >= 2.20; Puppet/Chef: crypto policy class updates for `crypto-policies` (RHEL) or `/etc/ssl/openssl.cnf` (Debian/Ubuntu); IaC templates must set `ssl_protocols TLSv1.3` and `ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256` with hybrid KEMs explicitly named
- **PQC Incident Response Runbooks** — new failure modes requiring dedicated runbooks: (1) algorithm downgrade attack detection (monitoring for TLS connections falling back to classical-only cipher suites after PQC rollout), (2) oversized PQC handshake causing MTU fragmentation and connection failure (diagnosis: packet capture + `openssl s_client -msg`), (3) HSM unavailable during PQC key generation (fallback: software key with audit trail), (4) certificate chain too large for embedded device TLS stack (mitigation: OCSP must-staple + compressed cert delivery), (5) JWT header size rejected by API gateway (fix: increase `large_client_header_buffers` in nginx or equivalent)
- **ACME/EST for PQC Certs** — ACME v2 challenge types (HTTP-01, DNS-01, TLS-ALPN-01) work unchanged for PQC certificates; the only change is the key algorithm requested in the CSR; cert-manager Certificate spec: `privateKey.algorithm: MLDSA44`; EST (`/.well-known/est/simpleenroll`) supports PQC CSRs when the CA backend (EJBCA, Vault PKI, ADCS) supports ML-DSA
- **OPA/Kyverno Policy Enforcement** — OPA Gatekeeper ConstraintTemplate blocks admission of workloads referencing quantum-vulnerable signing keys; Kyverno ClusterPolicy enforces `algorithm: MLDSA44` in cert-manager Certificate resources; Prometheus alert rule: `alert: QuantumVulnerableCipher` fires when `pqc_tls_cipher_suite{suite=~"ECDHE.*|RSA.*"} > 0` after enforcement date; policy deployment strategy: Audit mode for 2 weeks → enforce mode; never enforce without a 24h rollback window
- **Envelope Re-encryption at Scale** — when migrating KMS KEKs to ML-KEM, all DEKs wrapped under the old RSA/ECDH KEK must be re-encrypted; at 1M DEKs, re-encryption throughput is the operational bottleneck; AWS KMS re-encrypt API supports batch operations; HashiCorp Vault transit engine re-encrypt endpoint; monitor for re-encryption lag: `vault_transit_reencrpyt_duration_seconds` histogram; run during off-peak windows with rate limiting to avoid HSM queue saturation

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **Threat Impact Explorer** — six-panel operational briefing: certificate rotation scale calculator (input: cert count + validity period → output: rotations/day, ACME request rate, cert-manager replica sizing), VPN/SSH migration checklist with config snippet diffs for strongSwan and OpenSSH, monitoring threshold recalibration guide with before/after values for the most common alert rules, CI/CD signing migration decision matrix (cosign vs. Notation vs. GPG with PQC readiness dates), config management template update library (Terraform/Ansible/Puppet/Chef PQC patterns), and PQC incident response runbook catalog (5 failure mode runbooks with diagnosis steps)
2. **Self-Assessment Survey** — nine-criterion ops readiness evaluation covering: manages TLS certificate fleet at scale (>500 certs), owns VPN infrastructure (IPsec/IKEv2 or OpenVPN), manages server OS fleet (RHEL/Ubuntu/Windows Server), uses config management tools (Terraform/Ansible/Puppet/Chef), owns CI/CD pipelines with artifact signing, operates certificate automation (ACME/EST endpoints), runs SIEM/monitoring with crypto-specific alerting, operates HSMs in production (Luna/nShield/CloudHSM), manages cloud key management (AWS KMS/Azure Key Vault/GCP KMS); outputs an operational risk tier with sequenced remediation priorities
3. **Operations Playbook Builder** — generates a structured PQC operations playbook with four sections: (1) Certificate Lifecycle Runbook — ACME/EST enrollment config, cert-manager YAML templates, rotation schedule calculator, alert thresholds; (2) VPN/SSH Migration Runbook — strongSwan IKEv2 config diffs, OpenSSH KexAlgorithms update, `known_hosts` re-provisioning steps, rollback procedure; (3) Monitoring Configuration — Prometheus scrape config, alert rule YAML for `pqc_tls_cipher_suite` and `x509_cert_expiry`, SIEM query templates (Splunk/Elastic/Datadog); (4) CI/CD Signing Migration Steps — Notation ML-DSA plugin deployment, Kyverno policy update, cosign deprecation timeline; exports as Markdown with copy-paste-ready config blocks

## Related Standards

- FIPS 203 (ML-KEM — key encapsulation for TLS and VPN key exchange)
- FIPS 204 (ML-DSA — digital signatures for certificates, code signing, SSH host keys)
- RFC 8555 (ACME v2 — Automatic Certificate Management Environment)
- RFC 7030 (EST — Enrollment over Secure Transport for certificate automation)
- RFC 4253 (SSH Transport Layer Protocol — host key algorithm negotiation)
- RFC 7296 (IKEv2 — Internet Key Exchange for IPsec VPN)
- NIST SP 800-57 Part 1 Rev. 5 (Key Management Recommendations)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms)
- NSA CNSA 2.0 (networking equipment deadline: 2026, all NSS: 2033)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- CIS Kubernetes Benchmark v1.9 (crypto policy controls, etcd encryption-at-rest)

## Cross-References

- `tls-basics` — TLS cipher suite fundamentals, certificate chain delivery, OCSP stapling
- `vpn-ssh-pqc` — strongSwan IKEv2 PQC config, OpenSSH KEX algorithm migration, IPsec kernel changes
- `platform-eng-pqc` — CI/CD pipeline crypto inventory, OPA/Kyverno policy enforcement, container signing migration
- `kms-pqc` — KMS provider PQC timelines, envelope re-encryption, KMIP operations
- `hsm-pqc` — HSM PQC capability matrix, PKCS#11 v3.2, key generation and operation throughput
- `os-pqc` — OS crypto policy files, OpenSSL Provider architecture, FIPS 140-3 mode configuration
- `code-signing` — binary and package signing migration (cosign, Notation, GPG)
- `secrets-management-pqc` — Vault transit engine PQC upgrade, dynamic secrets, Kubernetes secrets encryption
