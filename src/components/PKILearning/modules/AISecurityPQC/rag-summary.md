---
module_id: ai-security-pqc
title: AI Security & PQC
track: Applications
difficulty: advanced
duration: 120 min
workshop_steps: 7
---

# AI Security & PQC

## Topics Covered

- Quantum threats to AI data pipelines (HNDL on training data, data poisoning via forged signatures)
- Model collapse from AI-generated training data contamination
- Cryptographic data provenance (C2PA content credentials, hash chains, watermark detection)
- Model weight protection (encryption at rest/transit/use, ML-DSA model signing)
- AI agent authentication (machine identity, delegation tokens, credential lifecycles)
- Agentic commerce (agent-to-agent transactions, signed purchase orders, delegation chain verification)
- Agent-to-agent communication protocols (mTLS with PQC, message signing, session KEM)
- Encryption at petabyte scale (hierarchical KMS, key counts, HNDL risk windows)
- Privacy-preserving ML (FHE, MPC, federated learning, differential privacy)
- GPU VRAM consumption modeling for high-concurrency PQC batch decryption (cuPQC) during LLM inference

## Workshop

1. Data Protection Analyzer — Audit AI pipeline crypto operations for quantum vulnerabilities
2. Data Authenticity Verifier — Configure verification layers, visualize model collapse, compare signing overheads
3. Model Weight Vault — Configure model encryption/signing, compare classical vs PQC overhead
4. Agent Auth Designer — Design delegation chains with PQC credentials
5. Agentic Commerce Simulator — Step through agent transaction flows with quantum overlay
6. Agent-to-Agent Protocol — Design PQC communication protocols, compare bandwidth/latency
7. Scale Encryption Planner — Calculate enterprise-scale PQC migration requirements
8. VRAM Sizing Guide — Model the GPU VRAM overhead of terminating massive PQC payloads during LLM inference

## Key Standards

- FIPS 203 (ML-KEM) — key encapsulation for data and model encryption
- FIPS 204 (ML-DSA) — digital signatures for data provenance, model signing, agent credentials
- C2PA (Coalition for Content Provenance and Authenticity) — content credentials standard
- RFC 8446 (TLS 1.3) — transport security for AI API endpoints
- NIST AI RMF — AI risk management framework
