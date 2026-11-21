// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured educational data for Module B (Custody PQC Migration, LM-085).
 * All interactive scenarios use fictional sample configurations for learning only.
 */
import type { ClaimMaturity, SourceClaimId } from './sourceClaims'

export interface ThresholdComparisonRow {
  family: string
  example: string
  maturity: ClaimMaturity
  verifierCompatibility: string
  rounds: string
  partyModel: string
  signatureSize: string
  claimId: SourceClaimId
}

export const THRESHOLD_COMPARISON_ROWS: ThresholdComparisonRow[] = [
  {
    family: 'Classical Threshold Schnorr / EdDSA (today)',
    example: 'RFC 9591 FROST (secp256k1 / Ed25519)',
    maturity: 'standard',
    verifierCompatibility: 'Standard Schnorr / EdDSA verifier (quantum-vulnerable)',
    rounds: '2 rounds (1 with preprocessing)',
    partyModel: 'Arbitrary t-of-n threshold',
    signatureSize: '64 B',
    claimId: 'DA-6.2a',
  },
  {
    family: 'Classical Threshold ECDSA (today)',
    example: 'CMP (ePrint 2020/492) / CGGMP21 (ePrint 2021/060)',
    maturity: 'research',
    verifierCompatibility: 'Standard ECDSA verifier (quantum-vulnerable; Paillier internal)',
    rounds: '3–4 rounds (presigning + 1 online)',
    partyModel: 'Dishonest majority (t-of-n)',
    signatureSize: '64–65 B',
    claimId: 'DA-6.3a',
  },
  {
    family: 'FIPS 204-Compatible Threshold ML-DSA',
    example: 'Quorus (ePrint 2025/1163, USENIX Security 2026)',
    maturity: 'research',
    verifierCompatibility: 'Unmodified FIPS 204 ML-DSA verifier',
    rounds: 'Multi-round MPC with rejection-sampling retries',
    partyModel: 'Honest majority (scales to larger groups)',
    signatureSize: '2,420 B (ML-DSA-44) / 3,309 B (ML-DSA-65)',
    claimId: 'DA-9.2',
  },
  {
    family: 'FIPS 204-Compatible Threshold ML-DSA',
    example: 'Mithril / Efficient Threshold ML-DSA (ePrint 2026/013)',
    maturity: 'research',
    verifierCompatibility: 'Unmodified FIPS 204 ML-DSA verifier',
    rounds: '3–4 rounds (small-group optimized)',
    partyModel: 'Small signing quorums (e.g., 2-of-3, 3-of-5)',
    signatureSize: '2,420 B (ML-DSA-44) / 3,309 B (ML-DSA-65)',
    claimId: 'DA-9.3a',
  },
  {
    family: 'Threshold-Friendly Lattice Variant (non-FIPS-204)',
    example: 'Threshold Raccoon / TRaccoon / Hermine / Ringtail',
    maturity: 'research',
    verifierCompatibility: 'Requires new chain / verifier algorithm (not FIPS 204)',
    rounds: '2–3 rounds (no rejection-sampling restarts)',
    partyModel: 'Varies by scheme (some with identifiable aborts)',
    signatureSize: 'Scheme-specific (larger than classical, non-FIPS)',
    claimId: 'DA-9.5',
  },
  {
    family: 'Early Hash-Based Threshold Research',
    example: 'Aker (ePrint 2026/2899) / Discrete-CKKS FHE (ePrint 2026/2360)',
    maturity: 'research',
    verifierCompatibility: 'FIPS 205 SLH-DSA / XMSS (research trade-offs)',
    rounds: '2-party stateful cap (Aker) or 1-round FHE (2026/2360)',
    partyModel: '2-party or threshold FHE committee',
    signatureSize: '7,856 B (SLH-DSA-128s) / 17,088 B (128f)',
    claimId: 'DA-9.8a',
  },
]

export interface TakeawayRow {
  component: string
  quantumLimit: string
  riskType: 'HNDL (Confidentiality)' | 'Future Forgery (Auth)' | 'Both (HNDL + Forgery)'
  migrateNow: string
  maturity: ClaimMaturity
}

export const TAKEAWAY_MATRIX: TakeawayRow[] = [
  {
    component: 'HSM / MPC / Enclave channels (TLS / mTLS / attested TLS)',
    quantumLimit: 'Classical ECDHE key exchange exposes recorded shares & approvals',
    riskType: 'HNDL (Confidentiality)',
    migrateNow: 'Yes — deploy RFC 10024 PQ/T hybrid TLS 1.3 now',
    maturity: 'standard',
  },
  {
    component: 'Key & share backups (RSA / ECDH / ECIES envelopes)',
    quantumLimit: 'Recorded ciphertext envelopes can be decrypted later to rebuild seeds/shares',
    riskType: 'HNDL (Confidentiality)',
    migrateNow: 'Yes — re-wrap under hybrid KEM-DEM (draft-ietf-hpke-pq) with ML-KEM HSMs',
    maturity: 'draft',
  },
  {
    component: 'Control-plane approvals, policy rules & audit logs',
    quantumLimit: 'Classical ECDSA/RSA signatures become forgeable once a CRQC exists',
    riskType: 'Future Forgery (Auth)',
    migrateNow: 'Yes — backend/HSM approvals to ML-DSA; archive evidence in RFC 4998 chains',
    maturity: 'standard',
  },
  {
    component: 'Enclave & hardware attestation chains (SGX/Nitro/SEV-SNP/TDX)',
    quantumLimit: 'Platform endorsement roots use classical ECDSA P-256 / P-384 today',
    riskType: 'Future Forgery (Auth)',
    migrateNow: 'Track vendor migration (TPM 2.0 V185, SPDM 1.4.1, Caliptra 2.1); hybrid TLS now',
    maturity: 'vendor-shipped',
  },
  {
    component: 'Hardware FIDO2 / WebAuthn approvers',
    quantumLimit: 'COSE ML-DSA IDs registered (RFC 9964), hardware authenticator rollout pending',
    riskType: 'Future Forgery (Auth)',
    migrateNow: 'Pair with HSM/backend ML-DSA approvals; track CTAP/authenticator updates',
    maturity: 'draft',
  },
  {
    component: 'MPC threshold transaction signing (ECDSA / FROST)',
    quantumLimit: 'Classical output + Paillier/Strong-RSA internals; no NIST PQ threshold standard',
    riskType: 'Both (HNDL + Forgery)',
    migrateNow: 'Protect channels & backups now; evaluate separate auth or smart-account multisig',
    maturity: 'research',
  },
  {
    component: 'SLIP-39 / Shamir seed backups & BIP-32 HD wallets',
    quantumLimit: 'Non-hardened xpub + Shor child key recovers parent; no standard PQ HD path',
    riskType: 'Both (HNDL + Forgery)',
    migrateNow: 'Enforce hardened derivation, stop address reuse, hybrid KEM-DEM share envelopes',
    maturity: 'standard',
  },
  {
    component: 'PQ smart accounts (ERC-4337 / EIP-7702)',
    quantumLimit:
      'EIP-7702 retains secp256k1 control & permit paths; no Ethereum PQ precompile live',
    riskType: 'Future Forgery (Auth)',
    migrateNow: 'Prototype hybrid validation on testnets; track EIP-7851 / 8051 / 8052 / 8141',
    maturity: 'prototype',
  },
  {
    component: 'Layer-1 chain outputs (Bitcoin / Ethereum / Solana)',
    quantumLimit: 'Exposed on-chain public keys vulnerable to Shor forgery',
    riskType: 'Future Forgery (Auth)',
    migrateNow: 'Address hygiene & sweep tooling prep; track BIP-360/361 & chain roadmaps',
    maturity: 'draft',
  },
]

/* ---------------- W5: Quantum Limits & HNDL Check ---------------- */

export interface QuantumStackScenario {
  id: string
  name: string
  summary: string
  firstBreakOptions: {
    id: string
    label: string
    isFirstBreak: boolean
    explanation: string
  }[]
  remediation: {
    action: string
    maturity: ClaimMaturity
    claimId: SourceClaimId
  }
  g1Note: string
}

export const QUANTUM_STACK_SCENARIOS: QuantumStackScenario[] = [
  {
    id: 'mpc-cmp-cloud',
    name: 'Cloud MPC Cluster (CMP / CGGMP21) over Classical mTLS',
    summary:
      '3-of-5 threshold ECDSA cluster signing Ethereum treasury transfers with pairwise classical TLS 1.3 channels and RSA-OAEP disaster-recovery share backups.',
    firstBreakOptions: [
      {
        id: 'hndl-channel-backup',
        label: 'Share transport & RSA-OAEP backup envelopes (HNDL exposure starting today)',
        isFirstBreak: true,
        explanation:
          'Correct. Even before a CRQC exists, an adversary recording pairwise classical TLS sessions or exfiltrated RSA-OAEP share backups can decrypt them later — plus CMP/CGGMP21 internal Paillier messages are factoring-based.',
      },
      {
        id: 'onchain-sig-today',
        label: 'On-chain ECDSA signatures forged retroactively today',
        isFirstBreak: false,
        explanation:
          'Signature forgery requires a live CRQC at the time of attack (not HNDL), whereas recorded share transport and RSA-wrapped backups are harvestable today.',
      },
      {
        id: 'sha256-hash',
        label: 'SHA-256 transaction hashing broken by Shor',
        isFirstBreak: false,
        explanation:
          'Shor does not apply to SHA-256; Grover yields at most a quadratic search speedup, leaving 256-bit hashes with strong security margin.',
      },
    ],
    remediation: {
      action:
        'Deploy RFC 10024 PQ/T hybrid TLS on all party-to-party channels and re-wrap share backups under a hybrid KEM-DEM envelope (draft-ietf-hpke-pq) immediately.',
      maturity: 'standard',
      claimId: 'DA-7.4',
    },
    g1Note:
      'Rule G1: Hybrid channel encryption protects confidentiality against passive recording, but holds only if no single orchestrator or compromised quorum of t parties can command unauthorized signing.',
  },
  {
    id: 'nitro-enclave-custody',
    name: 'Confidential-Computing Co-Signer (AWS Nitro / SEV-SNP) + Attested TLS',
    summary:
      'Enclave co-signer verifies off-chain policy and releases signing approvals after KMS validates the enclave’s COSE ES384 / VCEK P-384 attestation document over classical attested TLS.',
    firstBreakOptions: [
      {
        id: 'attested-tls-hndl',
        label: 'Classical attested-TLS channel & classical ECDSA attestation chain',
        isFirstBreak: true,
        explanation:
          'Correct. Classical key exchange in attested TLS exposes recorded key-release traffic to HNDL today; once a CRQC arrives, forging ECDSA P-384 attestation lets a rogue host impersonate a genuine enclave to receive keys or approvals.',
      },
      {
        id: 'aes-gcm-memory',
        label: 'AES-256-GCM memory encryption broken by Shor',
        isFirstBreak: false,
        explanation:
          'Symmetric AES-256 is not broken by Shor’s algorithm; the exposed asymmetric primitives are the classical TLS handshake and the ECDSA attestation chain.',
      },
      {
        id: 'pcr-sha384',
        label: 'SHA-384 PCR measurements inverted by Shor',
        isFirstBreak: false,
        explanation:
          'SHA-384 PCR hashes resist Shor; the attestation vulnerability lies in the ECDSA signature over the PCR document.',
      },
    ],
    remediation: {
      action:
        'Enable hybrid PQ/T key exchange on attested TLS channels now; track platform PQ attestation upgrades (TPM 2.0 V185, SPDM 1.4.1, Caliptra 2.1, PQ RATS draft).',
      maturity: 'standard',
      claimId: 'DA-3.17',
    },
    g1Note:
      'Rule G1: Enclave attestation verifies measured code only under the vendor endorsement PKI; forging that classical root breaks the enclave trust boundary.',
  },
  {
    id: 'hsm-reused-taproot',
    name: 'FIPS 140-3 HSM Holding Bitcoin Taproot & Reused ECDSA Treasury Keys',
    summary:
      'Non-extractable secp256k1 keys inside a bank-grade HSM controlling long-lived Taproot addresses and reused legacy addresses, with classical TLS client connections.',
    firstBreakOptions: [
      {
        id: 'exposed-pubkey-and-hsm-channel',
        label:
          'Classical HSM client channel (HNDL now) + exposed on-chain public keys (Shor forgery at CRQC)',
        isFirstBreak: true,
        explanation:
          'Correct. HSM physical isolation does not protect public keys already exposed on-chain (Taproot tweaked keys or reused addresses), and classical TLS channels into the HSM expose confidential backup/policy payloads to HNDL.',
      },
      {
        id: 'hsm-tamper-mesh',
        label: 'HSM physical tamper mesh bypassed by quantum computing',
        isFirstBreak: false,
        explanation:
          'A CRQC attacks the public mathematical problem (ECDLP on secp256k1) remotely from public chain data — it never needs to touch the HSM hardware.',
      },
      {
        id: 'pbkdf2-pin',
        label: 'HSM officer PIN hashing broken exponentially by Shor',
        isFirstBreak: false,
        explanation:
          'Hash-based PIN stretching is not broken exponentially by Shor; the quantum exposure is on classical asymmetric channels and exposed elliptic-curve public keys.',
      },
    ],
    remediation: {
      action:
        'Move HSM client channels to RFC 10024 hybrid TLS, upgrade to CAVP/CMVP-scoped ML-KEM/ML-DSA firmware for backups & approvals, and enforce strict address hygiene while tracking BIP-360/361.',
      maturity: 'vendor-shipped',
      claimId: 'DA-7.1a',
    },
    g1Note:
      'Rule G1: CAVP validates algorithm math only — verify exact firmware version, CMVP module boundary, and approved operating mode before relying on HSM PQC claims.',
  },
]

export interface HndlChannelMessage {
  id: string
  message: string
  carriedOver: string
  hndlExposed: boolean
  reason: string
}

export const HNDL_CHANNEL_MESSAGES: HndlChannelMessage[] = [
  {
    id: 'dkg-shares',
    message: 'Pairwise DKG secret share fragments & proactive refresh deltas',
    carriedOver: 'Classical ECDHE mTLS between MPC nodes',
    hndlExposed: true,
    reason:
      'High-value HNDL target: decrypting t recorded share messages years later reconstructs the long-lived private key.',
  },
  {
    id: 'paillier-proofs',
    message: 'CMP / CGGMP21 Paillier ciphertexts of partial secret shares',
    carriedOver: 'MPC signing protocol broadcast / unicast',
    hndlExposed: true,
    reason:
      'Paillier encryption is factoring-based; a CRQC factors N and decrypts recorded partial-share ciphertexts directly.',
  },
  {
    id: 'backup-envelope',
    message: 'Encrypted SLIP-39 / key-share disaster-recovery archive',
    carriedOver: 'RSA-OAEP / ECIES storage envelope',
    hndlExposed: true,
    reason:
      'Stored backups outlive session keys by years; harvesting t RSA/ECDH-wrapped shares lets a future CRQC recover the master seed.',
  },
  {
    id: 'public-tx-broadcast',
    message: 'Already-signed public blockchain transaction broadcast to mempool',
    carriedOver: 'Public P2P gossip network',
    hndlExposed: false,
    reason:
      'Not an HNDL confidentiality secret — the transaction is public by design. Its quantum risk is future forgery if its public key is exposed.',
  },
  {
    id: 'policy-approval-sig',
    message: 'Signed policy approval digest (public transaction metadata)',
    carriedOver: 'Internal approval queue',
    hndlExposed: false,
    reason:
      'Approval signatures are an authentication/forgery risk, not an HNDL confidentiality risk (unless the payload contains private client PII or shares).',
  },
]

/* ---------------- W7: Custody Migration Planner ---------------- */

export type ControlPlane = 'platform' | 'account' | 'chain'
export type MigrationPhase = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'

export interface PlannerComponent {
  id: string
  name: string
  correctPlane: ControlPlane
  correctPhase: MigrationPhase
  isHndl: boolean
  why: string
}

export const PLANNER_COMPONENTS: PlannerComponent[] = [
  {
    id: 'cbom-inventory',
    name: 'Custody CBOM & exposed-address ledger',
    correctPlane: 'platform',
    correctPhase: 'P0',
    isHndl: false,
    why: 'Phase 0 discovery (NIST SP 1800-38B / CycloneDX) classifies every platform-, account-, and chain-controlled dependency first.',
  },
  {
    id: 'hsm-mtls',
    name: 'TLS / mTLS into HSM clusters',
    correctPlane: 'platform',
    correctPhase: 'P1',
    isHndl: true,
    why: 'Platform-controlled HNDL priority: migrate to RFC 10024 PQ/T hybrid TLS immediately.',
  },
  {
    id: 'mpc-peer-channels',
    name: 'MPC party-to-party share transport channels',
    correctPlane: 'platform',
    correctPhase: 'P1',
    isHndl: true,
    why: 'Platform-controlled HNDL priority: pairwise share channels need authenticated, transcript-bound hybrid TLS (RFC 10024).',
  },
  {
    id: 'share-backup-envelopes',
    name: 'Disaster-recovery key & SLIP-39 share backup envelopes',
    correctPlane: 'platform',
    correctPhase: 'P1',
    isHndl: true,
    why: 'Platform-controlled HNDL priority: re-wrap stored RSA/ECDH envelopes under hybrid KEM-DEM (draft-ietf-hpke-pq).',
  },
  {
    id: 'enclave-attested-tls',
    name: 'Confidential-computing attested TLS sessions',
    correctPlane: 'platform',
    correctPhase: 'P1',
    isHndl: true,
    why: 'Platform-controlled HNDL priority: configure hybrid key exchange on attested TLS without waiting for PQ hardware roots.',
  },
  {
    id: 'approver-policy-sigs',
    name: 'Backend approver & policy-rule signatures',
    correctPlane: 'platform',
    correctPhase: 'P1',
    isHndl: false,
    why: 'Platform-controlled forgery mitigation: move backend/HSM approvals to ML-DSA before a CRQC arrives.',
  },
  {
    id: 'audit-log-ers',
    name: 'Audit logs, ceremony minutes & Proof-of-Reserves archive',
    correctPlane: 'platform',
    correctPhase: 'P1',
    isHndl: false,
    why: 'Long-lived evidence must enter an RFC 4998 / Wathiqa PQ timestamp renewal chain before classical signatures fail.',
  },
  {
    id: 'address-hygiene',
    name: 'Address reuse elimination & exposed-key sweeping',
    correctPlane: 'platform',
    correctPhase: 'P1',
    isHndl: false,
    why: 'Operational hygiene the custodian controls today: stop reusing addresses and enforce hardened BIP-32 paths.',
  },
  {
    id: 'smart-account-hybrid',
    name: 'ERC-4337 hybrid (ECDSA + ML-DSA) smart-account validation',
    correctPlane: 'account',
    correctPhase: 'P2',
    isHndl: false,
    why: 'Account-controlled: programmable smart accounts can pilot hybrid PQ verification without a consensus fork, watching gas and Rule G1.',
  },
  {
    id: 'btc-bip360-sweep',
    name: 'Bitcoin BIP-360 P2MR / BIP-361 sweep tooling',
    correctPlane: 'chain',
    correctPhase: 'P2',
    isHndl: false,
    why: 'Chain-controlled draft: track status, budget downtime/fees (Pont/Fukuda), and prepare sweep tooling — cannot activate unilaterally.',
  },
  {
    id: 'eth-precompile-track',
    name: 'Ethereum PQ precompile tracking (EIP-8051/8052/8355/8141)',
    correctPlane: 'chain',
    correctPhase: 'P2',
    isHndl: false,
    why: 'Chain-controlled: no PQ precompile is live on Ethereum mainnet as of 20 Nov 2026.',
  },
  {
    id: 'mpc-threshold-pq',
    name: 'Threshold ML-DSA / PQ MPC signing replacement',
    correctPlane: 'platform',
    correctPhase: 'P3',
    isHndl: false,
    why: 'Phase 3: no NIST-standardised PQ threshold scheme exists yet; keep classical threshold + Phase 1 PQ wrapper + interim separation.',
  },
  {
    id: 'fido2-hw-approvers',
    name: 'Hardware FIDO2 / WebAuthn PQ approver credentials',
    correctPlane: 'platform',
    correctPhase: 'P3',
    isHndl: false,
    why: 'Phase 3: RFC 9964 registers ML-DSA COSE IDs, but commercial hardware CTAP authenticator rollout is pending.',
  },
  {
    id: 'crypto-agility-config',
    name: 'Config-driven algorithm agility & ACVP test harness',
    correctPlane: 'platform',
    correctPhase: 'P4',
    isHndl: false,
    why: 'Phase 4 (NIST CSWP 39): keep algorithm selection in configuration and verify per-component ACVP test vectors.',
  },
  {
    id: 'vendor-cert-evidence',
    name: 'Vendor firmware/CMVP boundary & regulator evidence pack',
    correctPlane: 'platform',
    correctPhase: 'P4',
    isHndl: false,
    why: 'Phase 4: separate CAVP from CMVP module validation and map evidence to NIST IR 8547, MAS, HKMA, BIS Paper 158, and ASC X9.',
  },
]

export type AccountTypeId = 'eoa' | 'erc4337-hybrid' | 'eip7702-eoa' | 'pq-only-smart-account'

export interface AccountTypeProfile {
  id: AccountTypeId
  label: string
  controlClock: string
  authorizationResidual: string[]
  livenessResidual: string[]
  rotationBenefit: string
  claimIds: SourceClaimId[]
}

export const ACCOUNT_TYPE_PROFILES: AccountTypeProfile[] = [
  {
    id: 'eoa',
    label: 'Classical EOA (secp256k1)',
    controlClock: 'Chain-controlled (cannot add PQ verification without a protocol change)',
    authorizationResidual: [
      'Direct secp256k1 key controls all funds as soon as public key is exposed on-chain.',
      'No in-place signer rotation — migrating requires sweeping every asset to a new address.',
    ],
    livenessResidual: ['Standard mempool / block-inclusion race during emergency sweeps.'],
    rotationBenefit: 'None — EOAs lack algorithm agility.',
    claimIds: ['DA-6.1a', 'DA-11.10a'],
  },
  {
    id: 'erc4337-hybrid',
    label: 'ERC-4337 Hybrid Smart Account (ECDSA + ML-DSA)',
    controlClock: 'Account-controlled (deployable on EVM today at high prototype gas cost)',
    authorizationResidual: [
      'Classical recovery guardians, social-recovery keys, or proxy upgrade admins can bypass hybrid validation unless also PQ (Rule G1).',
      'L2 bridge multisigs that custody bridged assets remain classical authorization dependencies.',
    ],
    livenessResidual: [
      'ERC-4337 bundler / relayer ECDSA transaction (liveness/censorship/fees only — validateUserOp still rejects invalid user operations).',
      'L2 sequencer censorship or fee spikes.',
    ],
    rotationBenefit:
      'High — a suitably designed smart account can rotate out the classical half or swap PQ verifiers without moving funds.',
    claimIds: ['DA-15.1', 'DA-15.6a'],
  },
  {
    id: 'eip7702-eoa',
    label: 'EIP-7702 Delegated EOA',
    controlClock: 'Account-controlled delegation, but anchored to a classical EOA key',
    authorizationResidual: [
      'The EOA’s secp256k1 key retains permanent re-delegation authority (0xef0100 delegation persists until replaced or cleared) unless a draft mechanism like EIP-7851 revokes it.',
      'ERC-20 contracts supporting EIP-2612 permit / ecrecover still accept the legacy secp256k1 key directly, bypassing smart-account validation.',
    ],
    livenessResidual: ['Relayer / bundler ECDSA gas sponsorship (liveness/fees only).'],
    rotationBenefit:
      'Partial — delegation is upgradeable, but classical EOA authority remains until protocol-level key deactivation exists.',
    claimIds: ['DA-15.2', 'DA-15.10', 'DA-15.11'],
  },
  {
    id: 'pq-only-smart-account',
    label: 'PQ-Only Smart Account (ML-DSA / Falcon)',
    controlClock:
      'Account-controlled (prototype Solidity today; awaits precompiles EIP-8051/8052/8355)',
    authorizationResidual: [
      'Any classical guardian, recovery timelock key, or upgrade proxy admin breaks Rule G1 isolation.',
      'Unaudited prototype Solidity verifiers carry smart-contract bug risk and multi-million-gas costs until precompiles ship.',
    ],
    livenessResidual: [
      'Bundler/relayer ECDSA transport (cannot forge validateUserOp).',
      'L2 sequencer ordering and gas-price spikes.',
    ],
    rotationBenefit:
      'Full crypto-agility once precompiles or audited verifiers mature and all recovery/upgrade authorities are also post-quantum.',
    claimIds: ['DA-15.12a', 'DA-15.6a'],
  },
]

/* ---------------- W8: Shamir GF(256) Math & Envelope Comparison ---------------- */

const GF_POLY = 0x11b // AES / SLIP-39 Rijndael irreducible polynomial x^8 + x^4 + x^3 + x + 1

export function gfMul(a: number, b: number): number {
  let x = a & 0xff
  let y = b & 0xff
  let res = 0
  for (let i = 0; i < 8; i++) {
    if ((y & 1) !== 0) res ^= x
    const hi = x & 0x80
    x = (x << 1) & 0xff
    if (hi !== 0) x ^= GF_POLY & 0xff
    y >>= 1
  }
  return res
}

export function gfPow(base: number, exp: number): number {
  let res = 1
  let b = base & 0xff
  let e = exp
  while (e > 0) {
    if ((e & 1) !== 0) res = gfMul(res, b)
    b = gfMul(b, b)
    e >>= 1
  }
  return res
}

export function gfInv(a: number): number {
  if ((a & 0xff) === 0) return 0
  return gfPow(a, 254)
}

/** Deterministic educational 2-of-3 GF(256) Shamir split for a byte array. */
export function splitBytes2of3(
  secret: Uint8Array,
  slopeSeed: Uint8Array
): [Uint8Array, Uint8Array, Uint8Array] {
  const s1 = new Uint8Array(secret.length)
  const s2 = new Uint8Array(secret.length)
  const s3 = new Uint8Array(secret.length)
  for (let i = 0; i < secret.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const a0 = secret[i]
    // eslint-disable-next-line security/detect-object-injection
    const a1 = slopeSeed[i % slopeSeed.length] || 0x5a
    // eslint-disable-next-line security/detect-object-injection
    s1[i] = a0 ^ gfMul(a1, 1)
    // eslint-disable-next-line security/detect-object-injection
    s2[i] = a0 ^ gfMul(a1, 2)
    // eslint-disable-next-line security/detect-object-injection
    s3[i] = a0 ^ gfMul(a1, 3)
  }
  return [s1, s2, s3]
}

/** Lagrange interpolation at x=0 for any two shares (x1, y1) and (x2, y2) in GF(256). */
export function reconstruct2of3(
  x1: number,
  y1: Uint8Array,
  x2: number,
  y2: Uint8Array
): Uint8Array {
  const out = new Uint8Array(y1.length)
  const invDiff = gfInv(x1 ^ x2)
  const l1 = gfMul(x2, invDiff)
  const l2 = gfMul(x1, invDiff)
  for (let i = 0; i < y1.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    out[i] = gfMul(y1[i], l1) ^ gfMul(y2[i], l2)
  }
  return out
}

/** Educational 4-byte checksum simulating SLIP-39's interpolated 4-byte digest check. */
export function toyDigest4(bytes: Uint8Array): string {
  let h1 = 0x9e3779b9
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 0x85ebca6b) >>> 0
    h1 = ((h1 << 13) | (h1 >>> 19)) >>> 0
  }
  return h1.toString(16).padStart(8, '0')
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/* ---------------- W13: Hardware Wallet Claim Reader ---------------- */

export type HwPartId =
  'device-integrity' | 'transaction-signing' | 'seed-derivation' | 'channel-display'

export interface HwClaimCard {
  id: string
  productLabel: string
  statement: string
  correctPart: HwPartId
  correctMaturity: ClaimMaturity
  explanation: string
  claimId: SourceClaimId
}

export const HW_CLAIM_CARDS: HwClaimCard[] = [
  {
    id: 'trezor-boot-attest',
    productLabel: 'Trezor Safe 7 — Bootloader & Attestation',
    statement:
      'Verifies firmware updates in the boardloader with SLH-DSA-128 (hybrid with Ed25519) and uses an ML-DSA-44 device certificate for hardware attestation.',
    correctPart: 'device-integrity',
    correctMaturity: 'vendor-shipped',
    explanation:
      'Covers Part 1 (device integrity & attestation) only. PQ device attestation does not establish PQ transaction signing or PQ quorum approval signing.',
    claimId: 'DA-14.1',
  },
  {
    id: 'pq1-evm-signing',
    productLabel: 'Freedom Factory PQ1 — EVM Smart-Account Signing',
    statement:
      'Describes signing EVM smart-account transactions with a vendor-defined compressed SPHINCS+ variant ("SPHINCS+ C10", not a FIPS 205 parameter set).',
    correctPart: 'transaction-signing',
    correctMaturity: 'vendor-announced',
    explanation:
      'Covers Part 2 (transaction signing) via EVM smart accounts, using a non-FIPS parameter set; shipping status is not established by the whitepaper alone.',
    claimId: 'DA-14.2',
  },
  {
    id: 'pq-seed-derivation',
    productLabel: 'Wallet Seed -> ML-DSA ξ / ML-KEM (d, z) Construction',
    statement:
      'Deriving 32-byte FIPS 204/203 key-generation seeds from a single wallet master seed using hardened HMAC derivation; no xpub watch-only equivalent.',
    correctPart: 'seed-derivation',
    correctMaturity: 'research',
    explanation:
      'Covers Part 3 (seed & derivation). FIPS 203/204 define seed-to-key expansion, but deriving those seeds from a wallet seed is a proposed construction — no standard PQ HD path exists as of 20 Nov 2026.',
    claimId: 'DA-12.6a',
  },
  {
    id: 'sig-size-airgap',
    productLabel: 'FIPS 204 / 205 Signature Payloads Over QR / USB / BLE',
    statement:
      'Transmitting 2,420-byte ML-DSA-44, 7,856-byte SLH-DSA-128s, or 17,088-byte SLH-DSA-128f signatures across air-gapped QR frames and on-device clear-signing parsers.',
    correctPart: 'channel-display',
    correctMaturity: 'standard',
    explanation:
      'Covers Part 4 (device-to-host channel & display). Larger PQ keys and signatures directly impact QR frame count, packet fragmentation, and clear-signing memory.',
    claimId: 'DA-14.3',
  },
  {
    id: 'samsung-s3sse2a-cert',
    productLabel: 'Samsung S3SSE2A Embedded Secure Element (Thales / ANSSI)',
    statement:
      'Press release announces PQ-capable secure element without naming algorithms; ANSSI report ANSSI-CC-2024/26-R01 lists an ML-DSA library outside certified services.',
    correctPart: 'device-integrity',
    correctMaturity: 'vendor-announced',
    explanation:
      'Illustrates Part 1 / certification boundary scrutiny: check whether the PQC algorithm is actually inside the evaluated CC/CMVP scope rather than only listed in accompanying documentation.',
    claimId: 'DA-14.5b',
  },
  {
    id: 'blockstream-donjon-se',
    productLabel: 'Wallet MCU Hash-Based Timings & SE Side-Channel Risk',
    statement:
      'Blockstream benchmarks hash-based schemes on Jade/Trezor/Ledger/BitBox02 while Ledger Donjon analyzes SE RAM/flash limits and EM/power side-channel leaks during PQ signing.',
    correctPart: 'transaction-signing',
    correctMaturity: 'research',
    explanation:
      'Two distinct Part 2 engineering questions: hash-based signing latency on wallet MCUs vs secure-element memory and physical side-channel resistance (see LM-081).',
    claimId: 'DA-14.4b',
  },
]

export const FIVE_HW_QUESTIONS: string[] = [
  '1. Which of the four parts does the claim actually cover (device integrity, transaction signing, seed/derivation, or host channel/display)?',
  '2. Which exact algorithms and parameter sets are used (e.g., FIPS 204 ML-DSA-44 / FIPS 205 SLH-DSA-128s vs a vendor-defined variant)?',
  '3. Is the post-quantum path enforced unconditionally, or is it optional / hybrid with a classical fallback?',
  '4. Which target blockchains or smart accounts actually accept the PQ signatures the device produces?',
  '5. Is the implementation validated (CAVP algorithm conformance vs full CMVP / CC module certification) or only vendor-stated?',
]
