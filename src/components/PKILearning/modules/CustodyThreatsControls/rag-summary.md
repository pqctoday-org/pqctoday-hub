# Custody Key Threats & Controls

## Overview

The Custody Key Threats & Controls module (35 minutes, intermediate, Industries track, LM-083) examines who can make a digital-asset custody system sign and which control combinations mitigate unauthorized signing today. It complements Digital Assets (LM-045), which covers foundational curves, RFC 6979 nonces, HD wallets, and the five custody layers, without repeating them. It covers keys versus signing authority, nine exfiltration and misuse paths, a nine-row adversary model, AI agent spend authority, chronological case studies (Bybit, Drift, Binance), technical limits of HSMs, MPC, and confidential computing enclaves, control combinations with Rule G1 authority assumptions, and five hybrid MPC + HSM architecture variants. Educational simulations do not verify or certify production custody deployments.

## Key Concepts

### Keys vs signing authority and exfiltration paths

- Possessing a key inside an HSM or MPC cluster does not guarantee funds cannot move if an attacker controls transaction construction, the signing screen, pre-collected off-chain authorizations (EIP-2612 `permit`, Permit2, Solana durable nonces, EIP-7702 persistent `0xef0100` delegations), or an authenticated signing-service session.
- Safe.sol `checkSignatures` enforces a nonzero stored threshold before calling `checkNSignatures`, whereas calling `checkNSignatures` directly relies on caller-supplied threshold and `executor` values.
- Address poisoning (arXiv:2501.16681) requires no victim private key; the attacker generates lookalike vanity addresses with its own keys.
- CertiK recorded 52 verified physical coercion ("wrench attack") incidents globally in H1 2026 (+33.3% YoY, $124.1M recorded exposure, including 20 home invasions and 16 kidnappings).

### AI agent spend authority

- CSA AP2 guidance recommends hardware-backed keys, decentralized allowlists, and bounded Intent Mandate TTLs against mandate spoofing and agent coercion; Coinbase CDP / Wallet MCP illustrates Nitro Enclave isolation and expiring scoped signing grants (early deployment).
- An individual Internet-Draft specifies binding Falcon-1024 and ML-DSA-65 credentials to x402 agentic payments (research, no working-group adoption).
- Prompt-injected agents are treated as compromised requesters: spend caps, allowlists, and human approval thresholds must sit inside the HSM or enclave signing boundary.

### Case studies (victim statements, investigator findings, government attribution separated)

- **Bybit (21 Feb 2025):** Victim statement (26 Feb) and Safe Foundation statement (28 Feb) report compromised Safe{Wallet} developer credentials/machine; Sygnia and NCC Group (10 Mar) detail malicious frontend JavaScript masking a `delegatecall` proxy upgrade; FBI PSA I-022625-PSA (26 Feb) attributes ~$1.5B theft to North Korea ("TraderTraitor").
- **Drift (1 Apr 2026):** Drift's 16 April update states $295M in outstanding user losses and mandates dedicated clear-signing devices; Chainalysis (9 Apr, $285M estimate) explicitly marks the durable-nonce social-engineering account as relayed from Drift's unverified post-mortem while identifying Tornado Cash staging on 10–11 March 2026.
- **Binance (29 Oct 2026):** Imported from the canonical incident record (`canonicalBinanceIncident.ts`) separating Binance's 3 November 2026 initial findings report (Engineer A tampered Homebrew installation, Engineer B fake-recruiter `pyenv` script replacement, 20 October use of an internal AI tool to pivot, 29 October container/signing-service exploitation and 50 EIP-7702 delegations on `Binance14` MPC hot wallet, ~$6.34B impacted / ~$2.85B frozen, 30 October 00:10 UTC zero-address revocation) from the FBI's 31 October 2026 (updated 2 November) "TraderTraitor" attribution (> $6B).

### Limits of HSMs, MPC, and confidential computing

- **HSMs:** OASIS PKCS#11 v3.2 `C_Sign` signs caller-supplied data and defines no transaction parser, transaction-level policy, or MPC/threshold signing mechanism (whereas KMIP 2.1 and KMIP 3.0 CSD02 model Split Key objects). NIST FIPS 140-3 IG distinguishes physical boundaries (IG 1.A/1.B), Excluded Components (IG 2.3.D), Approved Security Service Indicators (IG 2.4.A/C), and Software/Firmware Loading (IG 10.3.F).
- **MPC:** RFC 9591 specifies two-round threshold Schnorr (FROST). Missing zero-knowledge proofs in GG18/GG20 enabled key extraction in BitForge (2023-08-09, 16 to 1B signatures) and `GHSA-h24c-6p6p-m3vx` (`tss-lib <= 1.3.5` small-factor Paillier modulus `N`, fixed with CGGMP21 proofs); ePrint 2023/1234 summarizes four key-extraction attacks (`10^6`, `256`, `16`, and `1` signature).
- **Enclaves / TEEs:** NIST IR 8320E (ipd) notes attestation proves measured state under vendor endorsement PKI; CCC v1.3 marks DoS and invasive physical attacks out of scope. Demonstrated attacks include Foreshadow (SGX), ÆPIC Leak (Intel CPU MMIO affecting SGX), BadRAM (bypassed AMD SEV-SNP; TDX/scalable SGX alias checks resisted), Battering RAM (DDR4 interposer breaking Intel Scalable SGX and AMD SEV-SNP, not TDX), and TEE.fail (DDR5 interposer breaking Intel TDX and AMD SEV-SNP).

### Hybrid MPC + HSM variants (a)-(e)

- **(a)** Share wrapped by HSM at rest, unwrapped into host RAM during signing (weakest; vulnerable to host root; Dfns documents wrapped-key HSM signing as an alternative to MPC).
- **(b)** Share and policy execute inside HSM boundary via vendor firmware extensions (Entrust CodeSafe / Thales Luna FM; check FIPS 140-3 IG Excluded Components & loading validation).
- **(c)** Mixed trust domains across custodian HSM, enclave co-signer, and hardware approver device (no single vendor/cloud signs; e.g., Google Cloud Confidential Space + Cloud KMS/HSM reference architecture).
- **(d)** HSM as ceremony and recovery anchor (operational details in Module A2, optional further reading).
- **(e)** Layered on-chain multisig / smart account (`Safe.sol`) combining HSM and MPC owner keys.

## Workshop Activities

1. **Blind vs Clear Signing (HSM)** — Compare raw `CKM_ECDSA` blind signing, parse-only warnings, and parse-plus-policy blocking on a hidden `delegatecall` payload in browser SoftHSMv3.
2. **Quorum Approvals (ML-DSA-65 + secp256k1)** — Require 2-of-3 HSM `ML-DSA-65` approvals over decoded payload, nonce, and expiry before `CKM_ECDSA` signing, with tamper, expiry, and replay fault injection.
3. **Threshold Signing (RFC 9591 FROST)** — Run 3-round DKG and 2-of-3 `secp256k1_FROST` signing in page JS with HSM `ML-DSA-65` party authentication, independent per-party policy refusals, and the §5b host-RAM vs in-HSM conceptual diagram toggle.
4. **Control Combination Builder** — Combine HSM, MPC, enclave, trusted display, and timelock controls across three account types to inspect mitigated incidents, Rule G1 assumptions, and residual risks.
5. **Agent Wallet Scoping** — Configure spend caps, signer allowlists, human approval thresholds, grant TTLs, and key isolation against three agent mistake scenarios.

## Related Standards

- IETF RFC 6979, RFC 9591 (FROST), IETF RATS `draft-ietf-rats-pkix-key-attestation-08`
- OASIS PKCS#11 v3.2, OASIS KMIP 2.1 & KMIP 3.0 CSD02
- NIST FIPS 140-3 IG (2026-08-19), NIST IR 8320E (ipd), Confidential Computing Consortium v1.3
- Ethereum EIP-2612, EIP-7702, ERC-7730, ERC-8176, Safe.sol
