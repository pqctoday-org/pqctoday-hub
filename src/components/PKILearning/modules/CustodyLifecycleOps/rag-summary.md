# Custody Key Lifecycle Operations

## Overview

The Custody Key Lifecycle Operations module (38 minutes, intermediate, Industries track, LM-084) explains how digital-asset custody keys are created, guarded, watched, recovered, and retired in daily operation. Building on Module A1 (Custody Key Threats & Controls, LM-083) and linking foundational coverage in Digital Assets (LM-045) and KMS & PQC (LM-016), it covers eight lifecycle domains: threshold key lifecycle (§5a), rotation and revocation (§5e), recovery and inheritance (§5f), key ceremonies (§5g), monitoring and alerting (§5h), access control and path separation (§5i), backup and disaster recovery (§5j), and destruction and decommissioning (§5k), plus a takeaways matrix (§9A). Educational simulations do not verify or certify production custody deployments.

## Key Concepts

### Threshold key lifecycle (§5a)

- Distributed Key Generation (DKG) avoids a single-point dealer, whereas dealer import briefly materializes the full secret.
- Proactive share refresh (Herzberg et al. CRYPTO 1995; CGGMP21 ePrint 2021/060) refreshes shares of the same secret to resist mobile adversaries and supports membership change, while identifiable abort attributes protocol-blocking faults. NISTIR 8214 notes that threshold systems add protocol complexity and can increase the attack surface.

### Rotation and revocation (§5e)

- Ordinary Bitcoin UTXO and Ethereum EOA keys have no revocation mechanism; rotation requires sweeping funds to pre-planned destination keys, which cannot move locked/staked assets or stop future deposits.
- ERC-20 allowances (`approve`, EIP-2612 `permit`, Permit2) and EIP-7702 delegations (`0xef0100 || address`) must be revoked explicitly on-chain — suspending off-chain withdrawals does not invalidate existing on-chain authorizations (illustrated by the 29 October 2026 Binance incident record).
- Smart accounts (Safe `OwnerManager.sol`, ERC-4337 accounts) rotate owners on-chain without moving funds, subject to Rule G1 assumptions on modules, guards, and upgrade keys.
- Proactive MPC refresh does not change the public key or protect a compromised key, and assumes erasure of old-epoch shares.
- Control-plane credentials rotate with KMS tools and X.509 certificates use CRL/OCSP (RFC 5280, RFC 6960 — certificate status, not on-chain key status); ERC-7730 defines versioned descriptor schemas without expiry/revocation, while ERC-8176 adds EAS revocation and `expirationTime`.

### Recovery and inheritance (§5f)

- Compares SLIP-0039 Shamir shares, HSM M-of-N backup cards (vendor pattern, e.g. Thales Luna Backup HSM 7), client-held MPC recovery kits (vendor pattern, e.g. Fireblocks Recovery Utility), Bitcoin timelocks (BIP-68/BIP-112 relative timelocks capped at 65,535 blocks or ~388 days; BIP-65 absolute timelocks for multi-year delays; BIP-379 Miniscript), and smart-account guardian recovery (Safe{RecoveryHub}, ERC-4337).
- Recovery paths are an attack surface: mitigate social engineering, forged incapacity claims, and coercion with delays, veto windows, independent guardian channels, and rehearsals. Inheritance guidance covers technical patterns only (not legal/estate advice).

### Key ceremonies (§5g)

- Separates ceremony administrator, key custodians, operators, independent witnesses, and auditor (citing ICANN Root Zone KSK DPS 8th Edition §4.2.2, IANA Root KSK Ceremonies, NIST SP 800-57 Part 2 Rev. 1, CCSS v9.0 Level 3, and CA/B Forum TLS BR v2.2.9 §6.1.1.1 — which allows either a Qualified Auditor witness OR a video recording of the whole generation).
- Contrasts custody root ceremonies with automated per-vault MPC DKG and with zero-knowledge trusted-setup ceremonies (Ethereum KZG Ceremony) whose goal is secret destruction.

### Monitoring and alerting (§5h)

- Organizes signals across signing paths, key infrastructure (e.g. Azure Cloud HSM audit-log tutorial as one vendor example), governance changes (Safe `ModuleManager.sol` / `GuardManager.sol` events), and on-chain activity (ERC-20 `Approval` events; EIP-7702 type-4 authorization lists / account code, which emit no dedicated log).
- Distinguishes pre-signing (can block), mempool (seconds to minutes), and confirmed-chain (can only protect later activity) stages; frames with NIST CSF 2.0 Detect/Respond, SEAL 911 (industry resource), and Tenderly Web3 Actions (vendor pattern).

### Access control (§5i)

- Separates signing path from administration path; enforces separation of duties (NIST SP 800-53 AC-5/AC-6) in the boundary.
- Quotes PKCS#11 v3.2 & Usage Guide (`CKU_SO` vs `CKU_USER`, `CKA_ALWAYS_AUTHENTICATE` / `CKU_CONTEXT_SPECIFIC`, noting SO PIN-reset authority under Rule G1), NIST SP 800-63B-4 (synced passkeys at AAL2, hardware-bound non-exportable keys at AAL3), NIST SP 800-207 / 800-207A zero-trust workload identities, and Thales Multifactor Quorum Authentication (vendor pattern).

### Backup and disaster recovery (§5j)

- Covers key material, policy/quorum configuration, audit logs, and chain-side operating state (derivation indexes, nonces, pending transactions).
- Applies NIST SP 800-57 Part 1 Rev. 5, NIST SP 800-34 Rev. 1 (RTO/RPO/testing), ISO 22301:2019 (catalogue reference), and vendor patterns (AWS CloudHSM cross-region backups, Luna Backup HSM, Fireblocks Recovery Utility).
- Enforces canary/drill-key restore testing, authoritative inventories against rollback, and restore-after-compromise rules (known-good backup + authenticated replay + chain reconciliation before signing resumes).

### Destruction and decommissioning (§5k)

- Chain keys: sweep -> revoke allowances/delegations/owners -> announce & monitor -> cold retention window -> destroy, so late deposits are not permanently burned.
- HSMs & KMS: PKCS#11 `C_DestroyObject` (`CKA_DESTROYABLE` / `CKR_ACTION_PROHIBITED`, single object only), KMIP v2.1 state transitions (deactivate/revoke before Destroy), FIPS 140-3 IG / ISO/IEC 19790:2012 SSP zeroisation, NIST SP 800-88 Rev. 2 (Clear, Purge / cryptographic erase, Destroy + verification), and Entrust nShield decommissioning (vendor pattern).
- Preserves audit logs, ceremony/destruction evidence, and retired public keys/addresses.

## Workshop Activities

1. **W9. Revoke or Rotate Matrix** — Classify 12 custody items across revoke, rotate in place, reshare, sweep funds, revoke allowances, and nothing possible.
2. **W10. Recovery & Inheritance Planner** — Configure recovery mechanisms, delays, guardians, and heir paths for a custody desk, family office, and individual across five disruption events.
3. **W12. Ceremony Script Review** — Audit a 10-step ceremony script to flag eight planted defects without misflagging valid BR §6.1.1.1 practices.
4. **W14. Custody Alert Triage** — Assign severity and response (log / page / auto-pause) to 12 replayed custody events and compare stage finality.
5. **W15. Access Matrix Review** — Inspect a 10-role permission matrix for eight effective-permission conflicts across groups, service identities, and break-glass accounts.
6. **W16. Disaster Recovery Drill** — Choose backup source, restore order, quorum presence, and tier resume plan across three outage/compromise scenarios.
7. **W17. Decommission Checklist** — Order retirement steps and keep-vs-destroy decisions for a hot-wallet address, HSM model, and departed approver share.
