# Secrets Management & PQC — Module Summary

## Overview

Covers PQC migration for secrets management platforms (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, Delinea Secret Server). Addresses secret classification by HNDL risk, automated rotation with PQC keys, cloud provider roadmaps, and Kubernetes/CI-CD pipeline integration.

## Key Topics

- Secret types vs encryption keys: what PQC protects
- Harvest-now-decrypt-later (HNDL) risk for long-lived credentials
- HashiCorp Vault transit engine PQC upgrade path (ML-KEM-768, ML-DSA-65)
- Dynamic secrets and TTL-based rotation with PQC
- AWS Secrets Manager / Azure Key Vault / GCP Secret Manager PQC timelines
- Kubernetes secrets encryption-at-rest with ML-KEM (via KMS plugin)
- External Secrets Operator and SPIFFE/SPIRE integration
- CI/CD OIDC + ML-DSA short-lived certificate patterns
- Secret Zero problem and ML-KEM vault seal key migration
- Envelope encryption: DEK (AES-256-GCM) + KEK (ML-KEM-768/1024) pattern

## Standards Referenced

- NIST SP 800-57 Part 1 Rev. 5 (Key Management Recommendations)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — ML-KEM)
- FIPS 204 (ML-DSA, Module-Lattice-Based Digital Signature Standard)
- FIPS 203 (ML-KEM, Module-Lattice-Based Key-Encapsulation Mechanism)
- HashiCorp Vault Transit Secrets Engine documentation
- HashiCorp Vault Database Secrets Engine documentation
- CIS Kubernetes Benchmark v1.9 (etcd encryption-at-rest, section 1.2.33)
- RFC 9700 (OAuth 2.0 Security Best Current Practice)
- SPIFFE/SPIRE specifications (X.509-SVID workload identity)
- PCI DSS v4.0.1 Requirement 8.6.3 (credential lifecycle management)
- CNSA 2.0 (NSA Commercial National Security Algorithm Suite 2.0)

## Secret Categories Covered

1. API Keys & Access Tokens — critical, delayed HNDL, ML-KEM vault KEK
2. Database Credentials — critical, immediate HNDL, dynamic secrets (TTL 8h)
3. TLS Certificates & Private Keys — critical, immediate HNDL, ML-DSA certs
4. Code/Document Signing Keys — critical, immediate HNDL, ML-DSA-87
5. Data Encryption Keys (DEKs) — critical, immediate HNDL, ML-KEM-1024 KEK
6. OAuth Tokens & JWTs — high, delayed HNDL, short TTL + ML-DSA signing
7. Service Account Credentials — high, delayed, Workload Identity + ML-DSA
8. Crypto Seed Phrases — critical, immediate HNDL, ML-KEM + HSM

## Cloud Provider PQC Status (March 2026)

- HashiCorp Vault Enterprise: PQC planned 2026 (transit engine ML-KEM/ML-DSA)
- AWS Secrets Manager: PQC via KMS (GA ML-KEM key spec)
- Azure Key Vault (Managed HSM): PQC planned 2026 (SymCrypt backend ready)
- GCP Secret Manager: PQC via Cloud KMS CMEK (ML-KEM/ML-DSA/X-Wing preview)
- Delinea Secret Server: PQC planned 2027
