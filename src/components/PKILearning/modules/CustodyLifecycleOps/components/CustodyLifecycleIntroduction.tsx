// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  KeyRound,
  RefreshCw,
  LifeBuoy,
  ScrollText,
  BellRing,
  ShieldCheck,
  DatabaseBackup,
  Trash2,
  TableProperties,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine, ReadingNote } from './ClaimLine'
import { TAKEAWAYS_MATRIX } from '../data/lifecycleOpsData'

interface IntroductionProps {
  onNavigateToWorkshop: (step?: number) => void
}

export const CustodyLifecycleIntroduction: React.FC<IntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
      {/* Educational Scope Banner */}
      <ReadingNote title="Educational scope & Rule G1 authority assumptions">
        <p>
          This module teaches how custody keys are created, guarded, watched, recovered, and retired
          in daily operation using fictional scenarios and sample workflows. Completing workshops or
          checklists here does not verify or certify a production custody deployment — apply these
          checks inside your own production HSM, MPC, IAM, and monitoring tools.
        </p>
        <p>
          <strong>Rule G1 (authority assumptions):</strong> every lifecycle control below states
          which signer, guardian, recovery, backup, and upgrade authorities an attacker must{' '}
          <em>not</em> hold for the control to hold. Prerequisite:{' '}
          <Link to="/learn/custody-threats-controls" className="text-primary hover:underline">
            Module A1 (Custody Key Threats &amp; Controls)
          </Link>
          .
        </p>
      </ReadingNote>

      {/* §5a. Threshold Key Lifecycle */}
      <section id="key-lifecycle" className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <KeyRound size={22} className="text-primary shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-bold text-foreground">
            5a. Threshold Key Lifecycle (DKG, Refresh, Membership &amp; Availability)
          </h2>
        </div>
        <p className="text-sm text-foreground/90">
          Threshold custody splits signing authority across <em>n</em> parties so any <em>t</em> can
          sign. How shares are born, refreshed, backed up, and reassigned determines whether a
          single point of compromise ever exists:
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>Distributed Key Generation (DKG) vs dealer import:</strong> DKG generates shares
            jointly so the full private key never materializes on one machine; dealer import creates
            or imports a full key in one place and then splits it, leaving a single-point compromise
            window.
          </li>
          <li>
            <strong>Proactive share refresh &amp; membership change:</strong> resharing replaces
            every party’s share without changing the public key, defeating a mobile adversary who
            compromises fewer than <em>t</em> shares per epoch and enabling participant additions or
            removals.
          </li>
          <li>
            <strong>Backup rebuild risk:</strong> backing up shares carelessly — or restoring them
            onto one workstation — recreates the single point of failure that threshold signing was
            meant to remove.
          </li>
          <li>
            <strong>Identifiable abort &amp; availability:</strong> a malicious or offline party can
            stall signing; protocols with identifiable abort attribute the fault so operators can
            exclude the misbehaving node without lowering threshold security.
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-13.4" chip="Threshold Attack Surface" />
          <ClaimLine id="DA-16.3a" chip="Proactive Secret Sharing" />
          <ClaimLine id="DA-16.3b" chip="CGGMP21 & Identifiable Abort" />
        </div>
      </section>

      {/* §5e. Rotation & Revocation */}
      <section id="rotation-and-revocation" className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <RefreshCw size={22} className="text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">
              5e. Rotation &amp; Revocation Across Key Types
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(0)}
            className="flex items-center gap-1.5"
          >
            Open W9 Matrix <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-foreground/90">
          Foundational digital-asset key concepts are in{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            Digital Assets (LM-045)
          </Link>{' '}
          and generic KMIP / SP 800-57 key-lifecycle states are in{' '}
          <Link to="/learn/kms-pqc" className="text-primary hover:underline">
            KMS &amp; PQC (LM-016)
          </Link>
          . In custody operations, revocation and rotation behave very differently depending on the
          layer:
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>Ordinary chain keys (Bitcoin UTXO &amp; Ethereum EOA):</strong> no revocation
            exists. A key remains valid for as long as funds sit at its address. “Rotation” means
            sweeping funds to pre-generated destination keys — which costs fees, takes time, becomes
            a race after compromise, cannot move locked/staked assets until transferable, and cannot
            stop future deposits to the old address. Pre-plan destination keys, sweep templates, and
            quorum-protected emergency-sweep rules.
          </li>
          <li>
            <strong>Revocable on-chain authorizations:</strong> ERC-20 allowances (
            <code>approve</code>, EIP-2612 <code>permit</code>, Permit2) and EIP-7702 delegations
            must be revoked on-chain — pausing off-chain withdrawals does not invalidate existing
            on-chain authorizations.
          </li>
          <li>
            <strong>Multisig &amp; smart accounts:</strong> Safe <code>OwnerManager.sol</code> and
            ERC-4337 smart accounts rotate owners on-chain without moving funds (an account-design
            property, not an ERC-4337 default). <em>Rule G1:</em> modules, guards, and upgrade keys
            can bypass owner quorum unless equally constrained.
          </li>
          <li>
            <strong>MPC share refresh is not key rotation:</strong> proactive refresh keeps the same
            public key and address, so it does nothing against a compromised or quantum-exposed key
            (which still needs a sweep). Refresh security assumes old-epoch shares are erased (§5k);
            a retained threshold of old shares can still sign.
          </li>
          <li>
            <strong>Removing a person or device:</strong> remove the approver from the quorum
            (on-chain owner removal, MPC membership-change reshare, or HSM approver-key removal),
            revoke device/API credentials, and re-verify threshold and separation rules.
          </li>
          <li>
            <strong>Control-plane keys &amp; descriptors:</strong> approver keys, policy-signing
            keys, TLS/mTLS certs, and HSM wrapping keys rotate via KMS/PKI (CRL per RFC 5280; OCSP
            per RFC 6960 reports certificate status, not chain key status; platform attestation
            roots are vendor-controlled). Rotating a wrapping key re-wraps data keys and is the
            moment to upgrade backup envelopes. Clear-signing descriptors rely on wallet registry
            freshness and ERC-8176 EAS revocation/expiry because ERC-7730 defines no expiry.
          </li>
          <li>
            <strong>Incident-response order (Module A1 §3):</strong> stop the signing path → revoke
            credentials and sessions → revoke on-chain allowances/delegations and sweep reachable
            funds with pre-approved tooling → contact issuers/exchanges for freezes → rotate the
            control plane.
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-16.1a" chip="UTXO Keys" />
          <ClaimLine id="DA-16.1b" chip="EOA Keys" />
          <ClaimLine id="DA-16.2" chip="Smart-Account Rotation" />
          <ClaimLine id="DA-16.4" chip="Old-Epoch Erasure" />
          <ClaimLine id="DA-16.8a" chip="EIP-2612 Permits" />
          <ClaimLine id="DA-16.8b" chip="EIP-7702 Delegations" />
          <ClaimLine id="DA-16.8c" chip="Incident Evidence" />
          <ClaimLine id="DA-16.5a" chip="RFC 5280 CRL" />
          <ClaimLine id="DA-16.5b" chip="RFC 6960 OCSP" />
          <ClaimLine id="DA-16.6a" chip="SP 800-57 R5 (Final)" />
          <ClaimLine id="DA-16.6b" chip="SP 800-57 R6 (Draft)" />
          <ClaimLine id="DA-17.9" chip="ERC-7730 Scope" />
          <ClaimLine id="DA-13.7" chip="ERC-8176 Revocation" />
        </div>
        <p className="text-xs text-muted-foreground">
          Quantum view: changing the signature algorithm and moving backup envelopes to post-quantum
          wrapping are covered in Module B (Custody PQC Migration, optional further reading).
        </p>
      </section>

      {/* §5f. Recovery & Inheritance */}
      <section id="recovery-and-inheritance" className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <LifeBuoy size={22} className="text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">5f. Recovery &amp; Inheritance</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(1)}
            className="flex items-center gap-1.5"
          >
            Open W10 Planner <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-foreground/90">
          Cold-wallet Shamir basics appear in{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            Digital Assets (LM-045)
          </Link>{' '}
          and general M-of-N backup splitting in{' '}
          <Link to="/learn/kms-pqc" className="text-primary hover:underline">
            KMS &amp; PQC (LM-016)
          </Link>
          . Operational recovery matches the mechanism to the failure: lost approver device (§5e),
          lost MPC share (§5a reshare), lost quorum (pre-built recovery path), site/HSM loss (§5j),
          or custodian insolvency (client-held recovery material; regulatory asset-return rules are
          in Module C, optional further reading).
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>Mechanisms compared:</strong> (1) SLIP-0039 Shamir shares and vendor HSM M-of-N
            backup cards; (2) vendor client-held MPC recovery kits (check who can run the kit and
            whether recovery rebuilds the full key in one place); (3) Bitcoin timelocks — relative
            (BIP-68/BIP-112, capped at 65,535 blocks or ~388 days) vs absolute (BIP-65 for
            multi-year delays), composed with Miniscript (BIP-379); (4) smart-account guardian
            modules with delay and veto (Safe&#123;RecoveryHub&#125;, ERC-4337); (5) inactivity
            (“dead-man”) paths via UTXO churn, smart-account heartbeat, or off-chain custodial
            process.
          </li>
          <li>
            <strong>Inheritance (technical patterns only — not legal or estate advice):</strong>{' '}
            placing raw secrets in a will that may become public during probate is unsafe. Heirs
            need asset notice, sealed/independent recovery material or a timelocked heir path, and
            clear instructions. Avoid single-heir full backups and unrehearsed plans.
          </li>
          <li>
            <strong>Recovery is an attack surface:</strong> attackers target rarely checked recovery
            paths via social engineering, forged incapacity claims, coercion (Module A1 §2), and the
            rebuild-in-one-place moment. Mitigate with delays + owner veto alerts, independent
            guardian channels, scheduled rehearsals, and logging every recovery attempt.
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-17.8" chip="SLIP-0039" />
          <ClaimLine id="DA-17.6" chip="HSM M-of-N Backup (Vendor Pattern)" />
          <ClaimLine id="DA-17.5" chip="MPC Recovery Kit (Vendor Pattern)" />
          <ClaimLine id="DA-17.1a" chip="BIP-68 Relative Timelock" />
          <ClaimLine id="DA-17.1b" chip="BIP-112 CSV" />
          <ClaimLine id="DA-17.1c" chip="BIP-65 Absolute Timelock" />
          <ClaimLine id="DA-17.2" chip="BIP-379 Miniscript" />
          <ClaimLine id="DA-17.3a" chip="Safe RecoveryHub" />
          <ClaimLine id="DA-17.3b" chip="ERC-4337 Account Abstraction" />
        </div>
        <p className="text-xs text-muted-foreground">
          Quantum view: post-quantum seed and recovery horizons are covered in Module B (Custody PQC
          Migration, optional further reading).
        </p>
      </section>

      {/* §5g. Key Ceremonies */}
      <section id="key-ceremonies" className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ScrollText size={22} className="text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">
              5g. Key Ceremonies (Procedure, Evidence &amp; Failure Modes)
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(2)}
            className="flex items-center gap-1.5"
          >
            Open W12 Script Review <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-foreground/90">
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            Digital Assets (LM-045)
          </Link>{' '}
          introduces what a key ceremony is. Here we focus on operational procedure, verifiable
          evidence, and failure modes — distinguishing physical root-key ceremonies from automated
          per-vault MPC DKG and from zero-knowledge trusted-setup ceremonies.
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>Roles &amp; separation:</strong> ceremony administrator (runs script, holds no
            key material), key custodians/share holders, operators, independent witnesses, and
            auditor. No single person can both generate and carry away a usable key.
          </li>
          <li>
            <strong>Preparation &amp; generation:</strong> versioned script, tamper-evident bags
            with recorded serial numbers, verified HSM firmware and hashed offline workstation
            image, no network, documented entropy (HSM TRNG; physical dice only as a documented
            self-custody practice). Derive and compare first addresses on a second independent
            device and test a small transaction and backup restore before real funds arrive.
          </li>
          <li>
            <strong>Backup, evidence &amp; close-out:</strong> seal shares in the room with recorded
            holder, location, and seal number; retain signed minutes, executed script with
            deviations, hashes of all output files, witness attestations, and video where policy
            requires it (auditor/insurer evidence use is in Module C, optional further reading).
            Sanitize temporary media (§5k), reseal HSMs, and schedule the next rehearsal.
          </li>
          <li>
            <strong>Distributed remote ceremonies:</strong> MPC DKG across sites relies on attested
            enclaves/HSMs (Module A1 §4), authenticated channels, a shared signed transcript hash,
            and out-of-band public-key verification.
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-21.1" chip="ICANN Root KSK Roles" />
          <ClaimLine id="DA-21.2" chip="CA/B Forum BR §6.1.1.1" />
          <ClaimLine id="DA-21.3" chip="SP 800-57 Pt 2" />
          <ClaimLine id="DA-21.4" chip="IANA Public Artifacts" />
          <ClaimLine id="DA-21.5" chip="CCSS v9.0 Level 3" />
          <ClaimLine id="DA-21.3b" chip="SP 800-88 Rev. 2" />
          <ClaimLine id="DA-21.9" chip="Contrast: ZK Trusted Setup" />
        </div>
        <p className="text-xs text-muted-foreground">
          Quantum view: dual-algorithm and post-quantum ceremony transitions are covered in Module B
          (Custody PQC Migration, optional further reading).
        </p>
      </section>

      {/* §5h. Monitoring & Alerting */}
      <section id="monitoring-and-alerting" className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <BellRing size={22} className="text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">
              5h. Custody Monitoring &amp; Alerting
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(3)}
            className="flex items-center gap-1.5"
          >
            Open W14 Alert Triage <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-foreground/90">
          Tamper-evident HMAC-chained logs and front-running mempool checks are introduced in{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            Digital Assets (LM-045)
          </Link>
          , and general SOC operations in{' '}
          <Link to="/learn/soc-implementation-pqc" className="text-primary hover:underline">
            SOC Implementation &amp; PQC (LM-057)
          </Link>
          . Custody monitoring spans four signal classes across three finality stages:
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>Four signal classes:</strong> (1) <em>signing path</em> (rate anomalies, new
            destinations, policy-denial bursts, off-hours requests, sub-second blind approvals); (2)
            <em>key infrastructure</em> (HSM audit events, MPC aborts/unexpected reshares, enclave
            attestation changes, approver enrollments); (3) <em>governance changes</em> (allowlists,
            quorums, timelocks, Safe owners/modules/guards, descriptors — always alerted under Rule
            G1); (4) <em>on-chain signals</em> (outflows, ERC-20 <code>Approval</code> events from
            submitted <code>permit</code>s, EIP-7702 type-4 authorization lists / account code,
            deposits to retired addresses, look-alike dust).
          </li>
          <li>
            <strong>Three stages, three responses:</strong> <em>pre-signing</em> signals can block
            the transaction; <em>mempool</em> signals give seconds to minutes;{' '}
            <em>confirmed-chain</em> signals cannot undo execution and can only protect later
            activity (revoke allowances/delegations, sweep, request issuer/exchange freezes).
          </li>
          <li>
            <strong>Alert design &amp; limits:</strong> route high-severity alerts to at least two
            people on independent channels, alert on monitor heartbeat silence, ship logs off-box to
            immutable storage, and wire automatic circuit breakers because in real incidents (Module
            A1 §3) funds moved within minutes. Monitoring detects — it does not prevent.
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-22.1" chip="HSM Audit Example (Vendor)" />
          <ClaimLine id="DA-22.2" chip="NIST CSF 2.0" />
          <ClaimLine id="DA-22.3a" chip="Safe Module Events" />
          <ClaimLine id="DA-22.3b" chip="Safe Guard Events" />
          <ClaimLine id="DA-22.4a" chip="ERC-20 Approval vs EIP-7702" />
          <ClaimLine id="DA-22.5" chip="SEAL 911 (Industry Resource)" />
          <ClaimLine id="DA-22.6" chip="On-Chain Hooks (Vendor Pattern)" />
        </div>
        <p className="text-xs text-muted-foreground">
          Quantum view: long-term verifiability of signed logs and alert evidence is covered in
          Module B (optional further reading); incident-reporting deadlines are in Module C
          (optional further reading).
        </p>
      </section>

      {/* §5i. Access Control */}
      <section id="access-control" className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">
              5i. Access Control &amp; Path Separation
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(4)}
            className="flex items-center gap-1.5"
          >
            Open W15 Matrix Review <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-foreground/90">
          General IAM is covered in{' '}
          <Link to="/learn/iam-pqc" className="text-primary hover:underline">
            IAM &amp; PQC (LM-028)
          </Link>{' '}
          and secrets handling in{' '}
          <Link to="/learn/secrets-management-pqc" className="text-primary hover:underline">
            Secrets Management (LM-022)
          </Link>
          . The custody controls below are operational design patterns (analysis), each with stated
          residual authority:
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>Separate signing and administration paths:</strong> signing (request → policy →
            approval → sign) and administration (policy, allowlist, quorum, keys, firmware, users)
            use distinct identities, devices, and network routes.
          </li>
          <li>
            <strong>Separation of duties in the boundary:</strong> initiator ≠ approver ≠ policy
            admin ≠ key custodian ≠ auditor, enforced inside the signing boundary or smart contract,
            not only in HR policy.
          </li>
          <li>
            <strong>Human &amp; machine access:</strong> phishing-resistant MFA for key roles is a
            custody design pattern (NIST SP 800-63B-4 makes AAL selection contextual: synced
            passkeys at AAL2, hardware-bound non-exportable keys at AAL3). Each service uses its own
            short-lived workload identity (mTLS/token) scoped to one operation and one tier — no
            long-lived spend API keys.
          </li>
          <li>
            <strong>Privileged access &amp; limits:</strong> just-in-time elevation with
            second-person approval, recorded admin sessions, dual-controlled break-glass accounts
            with mandatory alerting (§5h), and joiner/mover/leaver reviews tied to quorum membership
            (§5e). Access control decides who can ask; it does not stop a deceived or coerced
            authorized signer.
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-23.1a" chip="PKCS#11 v3.2 Per-Use Auth" />
          <ClaimLine id="DA-23.1b" chip="PKCS#11 SO PIN-Reset (Rule G1)" />
          <ClaimLine id="DA-23.2" chip="NIST SP 800-63B-4" />
          <ClaimLine id="DA-23.3a" chip="NIST SP 800-207" />
          <ClaimLine id="DA-23.3b" chip="NIST SP 800-207A" />
          <ClaimLine id="DA-23.4" chip="NIST SP 800-53 AC-5 / AC-6" />
          <ClaimLine id="DA-23.5" chip="HSM M-of-N Admin (Vendor Pattern)" />
        </div>
        <p className="text-xs text-muted-foreground">
          Regulatory access-privilege rules are mapped in Module C (optional further reading);
          FIDO2/WebAuthn post-quantum status is in Module B (optional further reading).
        </p>
      </section>

      {/* §5j. Backup & Disaster Recovery */}
      <section id="backup-and-dr" className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <DatabaseBackup size={22} className="text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">
              5j. Operational Backup &amp; Disaster Recovery
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(5)}
            className="flex items-center gap-1.5"
          >
            Open W16 DR Drill <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-foreground/90">
          Operational DR preserves signing capability without turning backups into an easier theft
          path than the live vault:
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>What to back up:</strong> key material/shares, safe-usage configuration
            (policies, allowlists, quorum membership, approver enrolments, timelocks, descriptors),
            audit/ceremony evidence, and <strong>chain-side operating state</strong> (derivation
            indexes, UTXO/account indexes, nonces, pending transactions, customer-to-account
            mappings — backed up or reconstructable via tested resynchronization).
          </li>
          <li>
            <strong>Backup authority (Rule G1) &amp; placement:</strong> whoever can read, restore,
            or delete a backup holds signing-equivalent authority. Store across at least two sites
            in separate risk areas under live-key quorum, keep KEKs separate from backups, alert on
            every backup access (§5h), and maintain an authoritative inventory against rollback.
          </li>
          <li>
            <strong>Drills &amp; restore-after-compromise rule:</strong> run scheduled restore
            drills with <strong>drill/canary keys</strong> (zeroise afterwards); never restore
            casually onto uncertified hosts. After a compromise, restore from a known-good backup,
            authenticate and validate later changes before replaying, and reconcile chain state
            before signing resumes.
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-24.1" chip="SP 800-57 Backup Protection" />
          <ClaimLine id="DA-24.2" chip="SP 800-34 RTO / RPO / Drills" />
          <ClaimLine id="DA-24.3" chip="ISO 22301:2019 (Catalogue)" />
          <ClaimLine id="DA-24.5" chip="CloudHSM Cross-Region (Vendor)" />
        </div>
        <p className="text-xs text-muted-foreground">
          Regulatory business-continuity duties (e.g. DORA) are in Module C §6b (optional further
          reading); harvest-now-decrypt-later backup re-wrapping is in Module B (optional further
          reading).
        </p>
      </section>

      {/* §5k. Destruction & Decommissioning */}
      <section id="destruction-and-decommissioning" className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Trash2 size={22} className="text-primary shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-foreground">
              5k. Destruction &amp; Decommissioning
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(6)}
            className="flex items-center gap-1.5"
          >
            Open W17 Checklist <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-foreground/90">
          Generic KMIP and SP 800-57 destruction states are in{' '}
          <Link to="/learn/kms-pqc" className="text-primary hover:underline">
            KMS &amp; PQC (LM-016)
          </Link>
          . In custody, this section is the single operational home for retiring chain keys,
          old-epoch MPC shares (§5e), ceremony media (§5g), and retired backups (§5j):
        </p>
        <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1.5">
          <li>
            <strong>Chain keys — destruction can burn funds:</strong> follow the sequence{' '}
            <em>
              sweep → revoke allowances, EIP-7702 delegations, and Safe owner roles (§5e) → announce
              retirement and monitor address (§5h) → cold retention period → destroy with recorded
              decision
            </em>
            . Destruction never replaces sweeping after a compromise.
          </li>
          <li>
            <strong>HSMs, KMIP &amp; HD seeds:</strong> PKCS#11 <code>C_DestroyObject</code> removes
            one object (refused with <code>CKR_ACTION_PROHIBITED</code> if{' '}
            <code>CKA_DESTROYABLE</code> is false) and says nothing about clones or backups; KMIP
            requires Deactivate/Revoke before Destroy; zeroise devices per FIPS 140-3 / ISO/IEC
            19790:2012 before disposal or return. For HD seeds, decide at the seed level —
            destroying a seed destroys every branch derived from it.
          </li>
          <li>
            <strong>Procedural evidence &amp; what NOT to destroy:</strong> secret destruction
            cannot be proved cryptographically; retain witnessed destruction attestations, SP 800-88
            Rev. 2 sanitization records, audit logs, ceremony records, and retired public
            keys/addresses (retention duties are mapped in Module C, optional further reading).
          </li>
        </ul>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-25.1" chip="PKCS#11 C_DestroyObject" />
          <ClaimLine id="DA-25.3b" chip="KMIP v2.1 Destroy State" />
          <ClaimLine id="DA-25.2a" chip="FIPS 140-3 IG Zeroisation" />
          <ClaimLine id="DA-25.2b" chip="ISO/IEC 19790:2012 (Catalogue)" />
          <ClaimLine id="DA-25.5" chip="HSM Disposal (Vendor Pattern)" />
        </div>
        <p className="text-xs text-muted-foreground">
          Quantum view: destroying a classical key does not protect funds behind an already-exposed
          public key, and retired encrypted backups remain harvest-now-decrypt-later targets until
          destroyed (Module B, optional further reading).
        </p>
      </section>

      {/* §9A. Takeaways Matrix */}
      <section id="takeaways" className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <TableProperties size={22} className="text-primary shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-bold text-foreground">
            9A. Lifecycle Control, Evidence &amp; Residual Risk Matrix
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Lifecycle Stage</th>
                <th className="py-2 pr-3 font-semibold">Primary Controls</th>
                <th className="py-2 pr-3 font-semibold">Evidence Produced</th>
                <th className="py-2 font-semibold">Residual Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {TAKEAWAYS_MATRIX.map((row) => (
                <tr key={row.stage} className="align-top">
                  <td className="py-2.5 pr-3 font-semibold text-foreground whitespace-nowrap">
                    {row.stage}
                  </td>
                  <td className="py-2.5 pr-3 text-foreground/90">{row.control}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.evidence}</td>
                  <td className="py-2.5 text-muted-foreground">{row.residualRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
