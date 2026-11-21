# AI as an Attacker of Cryptography

Intermediate-level module (50 min, 5 workshop steps) in the Foundations track (`ai-crypto-attacks`, `LM-087`).

## Overview

AI as an Attacker of Cryptography evaluates how AI changes threat models across five cryptographic layers as of 2026-11-21: (1) keys and secrets in software, (2) implementation and protocol flaw discovery, (3) deep-learning side-channel analysis, (4) KMS/HSM key policies, and (5) mathematical cryptanalysis. Every claim is classified under a capability rubric (`demonstrated`, `reported`, or `hypothesised`) separating discovery, reproduction, patch, successful exploitation, and independent replication.

## Key Concepts

- **Two Threats (Quantum vs AI):** Quantum computers target algebraic hardness (RSA/ECC via Shor's algorithm, taught in `quantum-threats` LM-002); reviewed AI results primarily impact implementations, software secrets, and lab side-channel evaluation.
- **Keys & Secrets in Software:** Google Cloud Threat Horizons H1 2026 distinguishes the executive headline from incident detail (`QUIETVAULT` prompted an endpoint LLM to attempt filesystem enumeration while malware stole the GitHub PAT and `UNC6426` pivoted via OIDC). The 29 October 2026 Binance incident (`canonicalBinanceIncident.ts`) assigns local AI causal roles across three preparation branches (`none shown`, `not stated`, `tool-mediated`). Pearce et al. (S&P 2022) and Perry et al. (CCS '23) demonstrate insecure classical crypto code written with early Codex assistants (pre-FIPS 203–205).
- **Finding Flaws in Crypto Code:** wolfSSL `CVE-2026-5194` (`>= 3.12.0, < 5.9.1`, affecting ECDSA/ECC verification when EdDSA or ML-DSA is also enabled—a PQC-enabled build defect, not ML-DSA math) and OpenSSL `CVE-2026-45445` (`AES-OCB IV Ignored on EVP_Cipher() Path`) show AI-assisted vulnerability discovery with zero reported in-the-wild exploitation, alongside Big Sleep, DARPA AIxCC, and OSS-Fuzz benchmarks.
- **Side Channels:** Profiled CNN/MLP deep-learning SCA defeated hardware AES clock jitter (Cagli et al. 2017) and 1st/2nd/3rd-order bitsliced masked Kyber-768 on ARM Cortex-M4 (`STM32F415RGT6`, B2A leakage, `3 × k` chosen ciphertexts, 5 profiling devices; Wang et al. 2023), while non-profiled DL-SCA (Timon 2018/196) still requires physical target traces. NIST SP 800-140F defines no approved non-invasive mitigation test metrics.
- **KMS & HSM Policies:** Classical formal model checking (`Tookan`, Bortolozzo et al. CCS 2010—not AI) and padding oracles (Bardou et al. 2012) show API/attribute exposure; AI automating KMS/HSM API search remains `hypothesised` as of 2026-11-21.
- **AI Cryptanalysis & Bounded Negative Finding:** Claude Mythos Preview reduced unstandardised HAWK (withdrawn 29 Jul 2026) and sped up a 7-of-10-round AES-128 meet-in-the-middle attack (`2^105` chosen plaintexts, `200–800×` faster); Gohr (Speck32/64) and SALSA/PICANTE/VERDE/FRESCA target reduced-round or small/sparse-secret plain LWE. No reviewed AI attack breaks FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), or full-round AES as of 2026-11-21; NIST IR 8547 and NSA CNSA 2.0 migration deadlines remain unchanged.

## Workshop Activities

1. **Secret Hunt (CI & Repo Hygiene)** — inspect dummy `EXAMPLE_FAKE_` leaks across config, Git history, logs, crash dumps, and CI workflows and compare deterministic regex hits against missed leaks.
2. **KMS & HSM Key-Policy Review** — review PKCS #11 v3.2 attributes (`CKA_SENSITIVE`, `CKA_EXTRACTABLE`, `CKA_WRAP_WITH_TRUSTED`, wrap templates) and IAM separation without generating call sequences or exporting keys.
3. **Synthetic Trace Learning Lab** — vary synthetic jitter, masking order, and trace count on in-page waveforms to compare template vs shift-tolerant indicators.
4. **Claim & Rubric Sorter** — classify 12 AI-and-crypto statements into demonstrated/reported/hypothesised and full vs reduced scope.
5. **Layered Defence Planner** — select layered defences across three sample systems and inspect residual risk boundaries.

## Related Standards

- NIST FIPS 203, FIPS 204, FIPS 205, NIST IR 8547, NSA CNSA 2.0 & FAQ Ver. 2.2
- OASIS PKCS #11 v3.2, NIST SP 800-140F, FIPS 140-3 IG §12.A
- CVE-2026-5194 (wolfSSL), CVE-2026-45445 (OpenSSL), OWASP Secrets Management Cheat Sheet
