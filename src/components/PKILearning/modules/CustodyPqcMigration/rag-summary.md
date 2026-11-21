# Custody PQC Migration

## Overview

The Custody PQC Migration module (40 minutes, intermediate, Industries track, LM-085) answers what a cryptographically relevant quantum computer (CRQC) changes for digital-asset custody and how custodians plan migration across platform-, account-, and chain-controlled layers. It builds on Digital Assets (LM-045) and Custody Key Threats & Controls (Module A1, LM-083) without repeating them, focusing on HSM/MPC/enclave quantum deltas, post-quantum threshold signing research, SLIP-39 and Shamir seed-backup internals, hardware wallet claim decomposition, post-quantum smart accounts, phased migration planning, and quantum views of custody operations. All workshops are educational simulations using fictional data and do not certify or validate deployed custody systems.

## Key Concepts

### Quantum limits delta (HSM, MPC, Confidential Computing)

- **HSM delta:** Beyond Shor recovery of exposed on-chain EC keys (LM-045), channels into HSM clusters carry confidential shares, policy updates, and backup material under classical key exchange — an immediate harvest-now-decrypt-later (HNDL) target.
- **MPC delta:** Threshold ECDSA/EdDSA produces ordinary classical signatures (RFC 9591 FROST; CMP ePrint 2020/492; CGGMP21 ePrint 2021/060). Paillier and Strong-RSA assumptions inside CMP/CGGMP21 and classical party-to-party channels are quantum-vulnerable. As of November 2026, no NIST-standardised threshold variant of a standardised PQ signature exists; NIST IR 8214C leads to a characterization report rather than a competition selection.
- **Confidential computing delta:** Platform attestation chains remain classical today — Intel SGX DCAP ECDSA, AWS Nitro COSE ES384, AMD SEV-SNP VCEK ECDSA P-384, and Intel TDX DCAP — and attested TLS uses classical key exchange unless configured hybrid.

### Evolution & PQ threshold MPC research

- **Standards & firmware:** CAVP-validated ML-KEM, ML-DSA, and SLH-DSA firmware exists (CAVP validates algorithm conformance, not full CMVP module validation); OASIS PKCS#11 v3.2 defines ML-KEM/ML-DSA/SLH-DSA mechanisms; RFC 10024 standardises PQ/T hybrid key agreement for TLS 1.3; TPM 2.0 Library V185, DMTF SPDM 1.4.1, and Caliptra 2.1 advance PQ attestation while PQ RATS (`draft-elekula-rats-pqc-attestation-00`) is an individual draft and FIDO2/WebAuthn hardware authenticators do not yet show widespread PQ deployment despite RFC 9964 COSE identifiers.
- **Threshold PQ signing (all research, not standardised):** ML-DSA rejection sampling and secret nonces complicate thresholdization. Two research families exist: (i) FIPS 204-compatible threshold ML-DSA (Quorus ePrint 2025/1163, Mithril ePrint 2026/013, TALUS arXiv 2603.22109, Shamir-nonce DKG arXiv 2601.20917) and (ii) threshold-friendly non-FIPS-204 variants (Threshold Raccoon ePrint 2024/184, TRaccoon ePrint 2025/849, Hermine ePrint 2026/419, Ringtail ePrint 2024/1113). SLH-DSA has early research (Aker ePrint 2026/2899; threshold FHE/CKKS ePrint 2026/2360). Custody alternatives include separating ML-DSA/SLH-DSA member authentication from quorum authorization (arXiv 2607.08226), smart-account verification, and hybrid classical-threshold + PQ backup keys.

### Shamir seeds (SLIP-39) & PQ hardware wallet claims

- **SLIP-39:** Replaces BIP-39 mnemonics with byte-wise GF(256) Shamir sharing, a four-round PBKDF2-HMAC-SHA256 Feistel passphrase layer, and an RS1024 checksum. Ideal Shamir reveals zero information below threshold `t`, while SLIP-39 interpolates a 4-byte digest with the secret for reconstruction validation. Quantum reaches seed custody via exposed derived EC keys, BIP-32 non-hardened xpub + child-key parent recovery (hardened derivation avoids this), RSA/ECDH share envelopes (fix with hybrid KEM-DEM / `draft-ietf-hpke-pq`), and Feldman/Pedersen VSS limits. Deriving ML-DSA (`ξ`) or ML-KEM (`d, z`) seeds from a wallet seed via hardened HMAC is a proposed construction, not FIPS behaviour; no standard PQ HD derivation path or xpub equivalent exists as of November 2026.
- **Hardware wallets:** Split any "quantum-ready" claim into four parts — (1) device integrity & attestation (e.g. Trezor Safe 7 SLH-DSA-128 firmware + ML-DSA-44 attestation), (2) transaction signing accepted by a chain (e.g. announced Freedom Factory PQ1 vendor-defined SPHINCS+ C10 for EVM smart accounts), (3) seed & derivation, and (4) host channel & clear-signing display for larger PQ signatures (ML-DSA-44: 2,420 B; SLH-DSA-128s: 7,856 B; SLH-DSA-128f: 17,088 B). Separate Blockstream hash-based timing benchmarks from Ledger Donjon secure-element RAM/flash and side-channel analyses.

### PQ smart accounts & phased custody migration path

- **PQ smart accounts:** On-chain policy boundaries hold against a compromised custodian stack only under explicit Rule G1 authority assumptions (no single stack holds signer, guardian, recovery, or upgrade authority). No PQ precompile is live on Ethereum mainnet as of November 2026 (drafts: EIP-8051, EIP-8052, EIP-8355, EIP-7932, EIP-8141; prototypes: ZKNOX ETHDILITHIUM / ETHFALCON; contrast Algorand Falcon). Separate residual classical **authorization** dependencies (EIP-7702 persistent delegation and legacy `ecrecover`/`permit` paths unless revoked via draft EIP-7851, classical guardians, upgrade keys, L2 bridge keys) from **liveness/fee** dependencies (ERC-4337 bundlers, L2 sequencers).
- **Migration phases (0–4):** Phase 0 CBOM splits platform-controlled, account-controlled, and chain-controlled dependencies and separates confidentiality (HNDL) from future forgery (authentication). Phase 1 executes no-regret platform controls now (RFC 10024 hybrid TLS, hybrid KEM-DEM backup re-wrapping, CAVP/CMVP-scoped HSM firmware, ML-DSA control-plane approvals, address hygiene). Phase 2 tracks chain proposals (BIP-360 P2MR, BIP-361, Ethereum, Solana) and downtime/fee budgets. Phase 3 manages interim MPC/threshold designs. Phase 4 enforces crypto-agility (NIST CSWP 39), ACVP evidence, and regulatory alignment (NIST IR 8547 2030/2035, MAS, HKMA, BIS Paper 158, ASC X9, CISA/NSA/NIST; MiCA and DORA carry no explicit PQC mandate as of November 2026).

## Workshop Activities

1. **Quantum Limits & HNDL Check (W5)** — Identify what a CRQC breaks first in each custody combination and which party-to-party channel messages are exposed to HNDL under classical key exchange.
2. **Custody Migration Planner (W7)** — Classify 15 custody components by control plane, migration phase, and HNDL exposure; evaluate account-type residual classical dependencies (EOA, ERC-4337 hybrid, EIP-7702 EOA, PQ-only smart account) and recovery-material CRQC horizon assumptions; export CSV or Markdown.
3. **Shamir Seed & Envelope Demo (W8)** — Compare ideal GF(256) Shamir t-1 uniformity against SLIP-39's 4-byte digest encoding, inspect RSA/ECDH vs hybrid KEM-DEM share envelopes, and test ceremony metadata binding.
4. **HW Wallet Claim Reader (W13)** — Sort hardware wallet statements across the four decomposition layers, assign maturity labels, and apply the five evaluation questions.

## Related Standards

- NIST FIPS 203, FIPS 204, FIPS 205, NIST IR 8547, NIST IR 8214C, NIST CSWP 39, NIST NCCoE SP 1800-38B
- OASIS PKCS#11 v3.2, IETF RFC 10024, RFC 9591 (FROST), RFC 9334 (RATS), RFC 9711 (EAT), RFC 9964, RFC 4998 (ERS), RFC 10033, `draft-ietf-hpke-pq`
- TCG TPM 2.0 Library V185, DMTF SPDM 1.4.1, Caliptra 2.1, W3C WebAuthn
- BIP-32, SLIP-0039, Bitcoin BIP-360 / BIP-361 (drafts), Ethereum ERC-4337, EIP-7702, EIP-2612, EIP-7851 / 7932 / 8051 / 8052 / 8141 / 8355 (drafts)
