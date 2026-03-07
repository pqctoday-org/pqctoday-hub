---
module_id: confidential-computing
title: Confidential Computing & TEEs
track: Infrastructure
difficulty: advanced
duration: 90 min
workshop_steps: 5
---

# Confidential Computing & TEEs

## Topics Covered

- TEE fundamentals and threat model (hardware isolation, TCB, data-in-use protection)
- Vendor architectures (Intel SGX/TDX, ARM TrustZone/CCA, AMD SEV/SEV-SNP, RISC-V Keystone, AWS Nitro Enclaves)
- Remote attestation flows (DCAP, CCA Realm, SEV-SNP VCEK, Nitro PCR)
- Memory encryption engines (TME-MK, SME/SEV, TrustZone crypto) and sealing key derivation
- TEE-HSM trusted channel design (mutual attestation, TLS channel binding, PKCS#11 over attested channel)
- Quantum threat analysis (ECDSA attestation chain vulnerability, Grover impact on AES, migration priorities)

## Workshop

1. TEE Architecture Explorer — Compare 7 TEE platforms by isolation, encryption, attestation, and PQC readiness
2. Attestation Workshop — Interactive remote attestation flow simulator with quantum vulnerability highlighting
3. Encryption Mechanisms — Memory encryption engine comparison, sealing key derivation, Grover impact calculator
4. TEE-HSM Trusted Channel — Design mutual attestation and PQC key provisioning between TEE and HSM
5. Quantum Threat Migration — Threat severity matrix, vendor PQC timeline, migration priority planner

## Key Standards

- FIPS 203/204 (ML-KEM, ML-DSA for attestation key migration)
- Intel SGX/TDX SDK, DCAP attestation
- ARM CCA (Confidential Compute Architecture)
- AMD SEV-SNP (Secure Encrypted Virtualization - Secure Nested Paging)
- AWS Nitro Enclaves attestation framework
- PKCS#11 v3.2 (TEE-HSM integration)
