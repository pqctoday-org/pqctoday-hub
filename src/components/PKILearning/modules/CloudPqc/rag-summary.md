---
module_id: cloud-pqc
title: Cloud-Native & SaaS PQC Migration
track: Software Infrastructure
difficulty: intermediate
duration: 50 min
workshop_steps: 4
---

# Cloud-Native & SaaS PQC Migration

## Topics Covered

- Cloud PQC shared responsibility: separating provider-managed hardware/endpoints from customer-controlled TLS policies, origin legs, KMS key specs, BYOK ceremonies, and SaaS vendor governance
- Distinguishing business/cloud services (e.g., object storage or records archiving service) from protected assets (long-lived encrypted records subject to HNDL)
- Edge, CDN, API Gateway, and origin TLS 1.3 hybrid key exchange (RFC 9846 and RFC 10024, X25519MLKEM768 codepoint 0x11EC), including middlebox ClientHello truncation (~1,216-byte key_share) and edge-vs-origin TLS mismatch
- Late-2026 AWS PQC posture: CloudFront/ALB/API Gateway hybrid X25519MLKEM768; AWS KMS ML-DSA (June 2025) and ML-KEM (launched 26 October 2026; unavailable in China, Middle East UAE, and Middle East Bahrain Regions); RSA-only BYOK import wrapping (or SM2 in China) and no import into ML-DSA/ML-KEM keys; no KMIP endpoint; Decapsulate returns the 32-byte shared secret in plaintext to the caller; no KMS key policy condition can require post-quantum TLS (client setting verified in CloudTrail tlsDetails.keyExchange); Infrastructure security in AWS KMS notes China and GovCloud (US) FIPS endpoint exclusions; AWS CloudHSM documents ML-DSA on hsm2m.medium (Sept 2026) but no ML-KEM command
- Late-2026 GCP PQC posture: Cloud Load Balancing / Cloud Armor hybrid TLS (X25519MLKEM768); Cloud KMS ML-DSA and SLH-DSA signing GA (July 2026); quantum-safe HPKE (RFC 9180) key import in Preview for software-protected keys; verify ML-KEM/X-Wing GA vs. Preview status per region
- Late-2026 Azure PQC posture: Key Vault / Managed HSM BYOK uses CKM_RSA_AES_KEY_WRAP under an RSA-HSM wrapping key with no documented KMIP endpoint; verify Azure Front Door and Application Gateway TLS 1.3 hybrid policies per SKU and region
- FIPS 140-2 Historical transition (September 2026): verify active FIPS 140-3 CMVP certificates across cloud HSMs, KMS endpoints, and SaaS tenants
- SaaS and OIDC/SAML federation governance: independent TLS probes, BYOK coverage boundaries (primary DB vs. backups/logs), ML-DSA token-size limits, subprocessor inheritance, and the rule that Unknown never means low exposure

## Workshop

1. Cloud Estate Mapper — Interactive multi-cloud surface mapper separating customer-controlled vs. provider-managed crypto and cloud services vs. protected assets
2. Provider Capability Matrix — Filterable AWS, Azure, and GCP PQC capability table with regional caveats and exact CLI verification commands
3. Edge TLS & KMS Cutover Lab — Interactive failure-mode lab covering middlebox ClientHello truncation, edge-vs-origin TLS mismatch, RSA-only BYOK import, and FIPS 140-2 Historical cutover, plus a 4-phase cutover sequencer
4. SaaS Boundary Checklist — Interactive Yes/No/Unknown evidence-scoping checklist where unanswered items always report an unverified evidence gap rather than low exposure

## Key Standards

- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, final Oct 2026)
- RFC 9846 (TLS 1.3) and RFC 10024 (PQ/T Hybrid Key Agreement for TLS 1.3, X25519MLKEM768 0x11EC)
- RFC 9180 (HPKE)
- FIPS 140-3 (CMVP; FIPS 140-2 moved to Historical status September 2026)
- NIST SP 800-210 (Cloud Access Control)
- EO 14412 and OMB M-26-15 (US federal civilian PQC migration)
