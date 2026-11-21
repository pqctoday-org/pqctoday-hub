# Claim Ledger — Custody Key Lifecycle Operations (LM-084)

As-of date: `2026-11-21`

| Claim ID   | Library `sourceId`                                             | Overlap with LM-045 | Maturity         | Rule G1 Authorities / Notes                                                              |
| ---------- | -------------------------------------------------------------- | ------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `DA-13.4`  | `NIST-IR-8214`                                                 | NEW                 | standard         | Threshold protocol peers, transport channels, implementation integrity                   |
| `DA-16.1a` | `Bitcoin-Whitepaper`                                           | LINK                | standard         | Any holder of UTXO spending key(s) can sign until swept                                  |
| `DA-16.1b` | `Ethereum-Yellow-Paper`                                        | LINK                | standard         | Any holder of EOA private key can sign until funds move                                  |
| `DA-16.2`  | `Safe-Smart-Account-OwnerManager-sol-Contract-Source`          | NEW                 | vendor-shipped   | Current Safe owner threshold, enabled modules, guards, proxy upgrade keys                |
| `DA-16.3a` | `Proactive-Secret-Sharing-Or-How-to-Cope-With-Perpetual-Leaka` | NEW                 | research         | Mobile adversary bounded below t shares per epoch; honest erasure                        |
| `DA-16.3b` | `IACR-ePrint-2021-060-CGGMP21`                                 | NEW                 | research         | Honest majority/threshold; identifiable abort attributes liveness faults                 |
| `DA-16.4`  | `IACR-ePrint-2021-060-CGGMP21`                                 | NEW                 | research         | Erasure of old-epoch shares assumed; retained threshold of old shares can sign           |
| `DA-16.5a` | `RFC 5280`                                                     | LINK                | standard         | Issuing CA and CRL distribution point integrity                                          |
| `DA-16.5b` | `RFC-6960`                                                     | LINK                | standard         | OCSP responder signing key; reports certificate status, not chain key status             |
| `DA-16.6a` | `NIST-SP-800-57-Pt1-R5`                                        | LINK                | standard         | KMS wrapping-key operators and cryptoperiod governance                                   |
| `DA-16.6b` | `NIST-SP-800-57-Pt1-R6`                                        | NEW                 | draft            | Initial Public Draft (2025-12-05); labeled draft                                         |
| `DA-16.8a` | `EIP-2612-Permit-Extension-for-EIP-20-Signed-Approvals`        | NEW                 | standard         | Any spender holding a valid off-chain permit or on-chain allowance                       |
| `DA-16.8b` | `Ethereum-EIP7702`                                             | NEW                 | standard         | EOA signer + delegated contract code (`0xef0100 \|\| address`)                           |
| `DA-16.8c` | `Binance-Security-Incident-Update-and-Initial-Findings-Report` | NEW                 | vendor-announced | Imported from `canonicalBinanceIncident.ts`                                              |
| `DA-17.9`  | `ERC-7730-Structured-Data-Clear-Signing-Format`                | NEW                 | draft            | Wallet descriptor registry curators; ERC-7730 defines no expiry/revocation               |
| `DA-13.7`  | `ERC-8176-Descriptor-Attestations-for-ERC-7730`                | NEW                 | draft            | EAS attester keys and verifier `expirationTime` / revocation checks                      |
| `DA-17.1a` | `BIP-68`                                                       | NEW                 | standard         | Relative timelock capped at 65,535 blocks or ~388 days                                   |
| `DA-17.1b` | `BIP-112`                                                      | NEW                 | standard         | Consensus-enforced `OP_CHECKSEQUENCEVERIFY`                                              |
| `DA-17.1c` | `BIP-65`                                                       | NEW                 | standard         | Absolute timelock `OP_CHECKLOCKTIMEVERIFY` for multi-year delays                         |
| `DA-17.2`  | `BIP-379`                                                      | NEW                 | standard         | Miniscript expresses policy only; monitoring and fee-bumping sit outside                 |
| `DA-17.3a` | `Account-recovery-with-Safe-RecoveryHub-Safe-Knowledge-Base`   | NEW                 | vendor-shipped   | Recoverers, delay window, owner veto authority, module upgrade authority                 |
| `DA-17.3b` | `Ethereum-EIP4337-AA`                                          | NEW                 | standard         | Account contract validation logic, guardian/recovery modules, upgrade keys               |
| `DA-17.5`  | `Fireblocks-Recovery-Utility-Key-Recovery-Kit-Disaster-Recove` | NEW                 | vendor-shipped   | Vendor pattern: recovery-kit holder & key-encryption key custody                         |
| `DA-17.6`  | `Luna-Backup-HSM-7-Connected-to-Luna-HSM-Client-Using-Direct`  | LINK                | vendor-shipped   | Vendor pattern: backup quorum holders & cloning-domain boundary                          |
| `DA-17.8`  | `SLIP-0039`                                                    | LINK                | standard         | Classical Shamir share holders; rebuild-in-one-place risk at recovery                    |
| `DA-21.1`  | `ICANN-Root-Zone-KSK-DPS-8th-Edition`                          | DELTA               | standard         | Six separated trusted roles; HSM smart cards and safes                                   |
| `DA-21.2`  | `CABF-TLS-BR-v2-2-9`                                           | DELTA               | standard         | Qualified Auditor witness OR full video recording + auditor report                       |
| `DA-21.3`  | `NIST-SP-800-57-Pt2-R1`                                        | DELTA               | standard         | Split knowledge and dual control across ceremony participants                            |
| `DA-21.3b` | `NIST SP 800-88`                                               | NEW                 | standard         | Clear, Purge (cryptographic erase), Destroy + verification records                       |
| `DA-21.4`  | `Root-KSK-Ceremonies`                                          | DELTA               | standard         | Public reference for scripts, signed minutes, hashes, witness records                    |
| `DA-21.5`  | `CCSS-v9-0`                                                    | DELTA               | standard         | Witnessed ceremonies at CCSS Level 3 (1.01, 1.02)                                        |
| `DA-21.9`  | `Ethereum-KZG-Ceremony-Specifications-and-Documentation`       | NEW                 | standard         | Contrast only: ZK trusted setup aims to destroy every secret                             |
| `DA-22.1`  | `Tutorial-Configure-and-Query-HSM-Operation-Audit-Logs-for-Az` | LINK                | vendor-shipped   | Single vendor product example; check product scope and delivery delay                    |
| `DA-22.2`  | `NIST-CSF-2.0`                                                 | LINK                | standard         | Detect (DE) and Respond (RS) vocabulary                                                  |
| `DA-22.3a` | `Safe-Smart-Account-ModuleManager-sol-Contract-Source`         | NEW                 | vendor-shipped   | On-chain module enable/disable/guard events                                              |
| `DA-22.3b` | `Safe-Smart-Account-GuardManager-sol-Contract-Source`          | NEW                 | vendor-shipped   | On-chain `ChangedGuard` governance signal                                                |
| `DA-22.4a` | `ERC-20-Token-Standard`                                        | NEW                 | standard         | `Approval` event on-chain; EIP-7702 emits no log (read type-4 auth list/code)            |
| `DA-22.5`  | `SEAL-911-Security-Alliance`                                   | NEW                 | vendor-shipped   | Industry emergency-response resource                                                     |
| `DA-22.6`  | `Intro-to-Web3-Actions-Tenderly`                               | NEW                 | vendor-shipped   | Active vendor pattern for event-triggered alerts / circuit breakers                      |
| `DA-23.1a` | `PKCS11-V32-OS-OASIS`                                          | LINK                | standard         | `CKU_SO` vs `CKU_USER`, `CKA_ALWAYS_AUTHENTICATE` / `CKU_CONTEXT_SPECIFIC`               |
| `DA-23.1b` | `PKCS-11-Cryptographic-Token-Interface-Usage-Guide-Version-3`  | LINK                | standard         | SO cannot use private objects but may reset user PIN on many tokens (Rule G1)            |
| `DA-23.2`  | `NIST-SP-800-63B-4`                                            | LINK                | standard         | Contextual AAL selection: synced passkeys AAL2, hardware-bound AAL3                      |
| `DA-23.3a` | `NIST SP 800-207`                                              | LINK                | standard         | Per-request authentication and authorization vocabulary                                  |
| `DA-23.3b` | `NIST-SP-800-207A-A-Zero-Trust-Architecture-Model-for-Access`  | LINK                | standard         | Workload identity (mTLS/short-lived tokens) and app-level policy                         |
| `DA-23.4`  | `NIST SP 800-53`                                               | LINK                | standard         | AC-5 Separation of Duties, AC-6 Least Privilege vocabulary                               |
| `DA-23.5`  | `Multifactor-Quorum-Authentication`                            | NEW                 | vendor-shipped   | Vendor pattern: M-of-N HSM administrative quorum                                         |
| `DA-24.1`  | `NIST-SP-800-57-Pt1-R5`                                        | LINK                | standard         | Backup key protection parity and separation of KEK from backup                           |
| `DA-24.2`  | `NIST-SP-800-34-R1`                                            | LINK                | standard         | RTO, RPO, alternate sites, scheduled recovery testing                                    |
| `DA-24.3`  | `ISO-22301-2019`                                               | NEW                 | standard         | Catalogue reference for BCMS vocabulary                                                  |
| `DA-24.5`  | `Copying-AWS-CloudHSM-cluster-backups-across-AWS-Regions-AWS`  | NEW                 | vendor-shipped   | Vendor pattern: cross-region encrypted cluster backups                                   |
| `DA-25.1`  | `PKCS11-V32-OS-OASIS`                                          | LINK                | standard         | `C_DestroyObject` single object only; `CKA_DESTROYABLE=false` -> `CKR_ACTION_PROHIBITED` |
| `DA-25.2a` | `NIST-FIPS140-3-IG-PQC`                                        | LINK                | standard         | SSP zeroisation requirements under FIPS 140-3                                            |
| `DA-25.2b` | `ISO-IEC-19790-2012`                                           | NEW                 | standard         | Catalogue reference; incorporated by reference into FIPS 140-3                           |
| `DA-25.3b` | `KMIP-V2-1-OASIS`                                              | LINK                | standard         | Active keys must be Deactivated or Revoked before Destroy                                |
| `DA-25.5`  | `Decommission-and-Disposal-nShield-Docs`                       | NEW                 | vendor-shipped   | Vendor pattern: HSM zeroisation, tamper discharge, physical disposal                     |
