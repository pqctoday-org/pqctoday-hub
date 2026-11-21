// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { ArrowRight, ShieldAlert, Layers, Cpu, KeyRound, Route, Eye, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine, ReadingNote } from './ClaimLine'
import {
  THRESHOLD_COMPARISON_ROWS,
  TAKEAWAY_MATRIX,
  FIVE_HW_QUESTIONS,
} from '../data/custodyPqcData'

interface IntroProps {
  onNavigateToWorkshop: (step?: number) => void
}

export const CustodyPqcIntroduction: React.FC<IntroProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 w-full">
      {/* Intro framing */}
      <div className="glass-panel p-6 space-y-3">
        <h2 className="text-xl font-bold text-gradient">
          What a Quantum Attacker Changes for Custody — and How to Migrate
        </h2>
        <p className="text-sm text-foreground/90">
          Prerequisites:{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            Digital Assets (LM-045)
          </Link>{' '}
          and Module A1 (Custody Key Threats &amp; Controls). This module links LM-045 for chain
          primitives, BIP-360/ERC-4337/Solana mechanics, and HD wallet fundamentals rather than
          repeating them, focusing strictly on what a cryptographically relevant quantum computer
          (CRQC) changes across HSMs, MPC, enclaves, seed backups, hardware wallets, and smart
          accounts.
        </p>
        <ReadingNote title="Rule G1 (authority assumptions) & educational scope">
          <p>
            Every claim that a custody control holds states which signer, guardian, recovery, and
            upgrade authorities an attacker must <em>not</em> control for it to hold. All
            demonstrations use fictional configurations for education and do not certify or verify
            deployed custody platforms.
          </p>
        </ReadingNote>
      </div>

      {/* Section 7: quantum-limits */}
      <section id="quantum-limits" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldAlert size={18} className="text-primary" aria-hidden="true" />
            7. Quantum Limits of HSM, MPC &amp; Enclaves (Delta)
          </h2>
          <Button
            variant="ghost"
            onClick={() => onNavigateToWorkshop(0)}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            Open W5 Limits Check <ArrowRight size={12} aria-hidden="true" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            LM-045 PQC Defense Part 1
          </Link>{' '}
          already establishes that Shor’s algorithm breaks exposed elliptic-curve public keys
          regardless of whether keys sit in an HSM, MPC cluster, or enclave, and that classical
          enclave ECDSA attestation is forgeable. Below are the custody-specific deltas beyond
          LM-045:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-6.1a" chip="LM-045 Link" />
          <ClaimLine id="DA-6.1b" chip="LM-045 Link" />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            HSM Delta — Classical Channels (HNDL)
          </h3>
          <p className="text-sm text-muted-foreground">
            Even when signing keys never leave the HSM, TLS/mTLS channels into HSM clusters carry
            key-share fragments, encrypted backups, and confidential policy payloads under classical
            key exchange — an immediate harvest-now-decrypt-later (HNDL) confidentiality risk.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ClaimLine id="DA-6.6a" chip="HNDL" />
            <ClaimLine id="DA-6.6b" chip="HNDL vs Forgery" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            MPC Delta — Classical Output, Factoring Internals &amp; No NIST PQ Threshold Standard
          </h3>
          <p className="text-sm text-muted-foreground">
            Threshold Schnorr/EdDSA (RFC 9591 FROST) and threshold ECDSA (CMP, CGGMP21) emit
            ordinary classical signatures. Inside CMP and CGGMP21, Paillier encryption and
            Strong-RSA-style assumptions are factoring-based, and pairwise share transport over
            classical key exchange is an HNDL target.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ClaimLine id="DA-6.2a" chip="MPC Output" />
            <ClaimLine id="DA-6.3a" chip="CMP Paillier" />
            <ClaimLine id="DA-6.3b" chip="CGGMP21" />
            <ClaimLine id="DA-6.4" chip="Negative · NIST Process" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            Confidential Computing Delta — Classical Attestation Chains &amp; Attested TLS
          </h3>
          <p className="text-sm text-muted-foreground">
            Today’s TEE attestation chains verify under classical elliptic-curve roots (SGX DCAP,
            Nitro COSE ES384, AMD SEV-SNP VCEK P-384, Intel TDX DCAP). Forging attestation lets a
            rogue enclave receive keys or signing approvals. Meanwhile, attested TLS requires hybrid
            key exchange to stop passive recording.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ClaimLine id="DA-6.5a" chip="Intel SGX" />
            <ClaimLine id="DA-6.5b" chip="AWS Nitro" />
            <ClaimLine id="DA-6.5c" chip="AMD SEV-SNP" />
            <ClaimLine id="DA-6.5d" chip="Intel TDX" />
            <ClaimLine id="DA-3.16a" chip="RATS" />
            <ClaimLine id="DA-3.16b" chip="EAT" />
            <ClaimLine id="DA-3.17" chip="Attested TLS" />
          </div>
        </div>
      </section>

      {/* Section 8: evolution */}
      <section id="evolution" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Layers size={18} className="text-primary" aria-hidden="true" />
          8. How Each Custody Model Is Evolving (Standard / Draft / Vendor)
        </h2>
        <p className="text-sm text-muted-foreground">
          Control-plane signatures (backend approvals, policy rules, audit logs) and transport
          channels can move to post-quantum standards before Layer-1 blockchains do — while hardware
          FIDO2/WebAuthn authenticators and PQ threshold MPC remain on slower tracks.
        </p>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            HSM Firmware, PKCS#11 v3.2 &amp; Hybrid TLS (RFC 10024)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ClaimLine id="DA-7.1a" chip="CAVP ML-KEM" />
            <ClaimLine id="DA-7.1b" chip="CAVP ML-DSA" />
            <ClaimLine id="DA-7.1c" chip="CAVP SLH-DSA" />
            <ClaimLine id="DA-7.1d" chip="HSM Firmware" />
            <ClaimLine id="DA-7.2" chip="PKCS#11 v3.2" />
            <ClaimLine id="DA-7.4" chip="Hybrid TLS" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            PQ Hardware Attestation &amp; FIDO2 / WebAuthn Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ClaimLine id="DA-7.5a" chip="TPM 2.0 V185" />
            <ClaimLine id="DA-7.5b" chip="TPM Part 2" />
            <ClaimLine id="DA-7.5c" chip="TPM Part 3" />
            <ClaimLine id="DA-7.5d" chip="SPDM 1.4.1" />
            <ClaimLine id="DA-7.5e" chip="Caliptra 2.1" />
            <ClaimLine id="DA-7.5f" chip="TCG EK v2.7" />
            <ClaimLine id="DA-7.5g" chip="PQ RATS Draft" />
            <ClaimLine id="DA-7.6a" chip="COSE ML-DSA" />
            <ClaimLine id="DA-7.6b" chip="Negative · WebAuthn HW" />
            <ClaimLine id="DA-7.6c" chip="FIDO Server Draft" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            Chain-Side Proposals (Linked to LM-045)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ClaimLine id="DA-7.3a" chip="Bitcoin Draft" />
            <ClaimLine id="DA-7.3b" chip="Bitcoin Draft" />
            <ClaimLine id="DA-7.3c" chip="Ethereum" />
          </div>
        </div>
      </section>

      {/* Section 8b: pq-mpc-research */}
      <section id="pq-mpc-research" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Cpu size={18} className="text-primary" aria-hidden="true" />
          8b. Post-Quantum Threshold Signing &amp; MPC (Research — Not Standardised)
        </h2>
        <p className="text-sm text-muted-foreground">
          All schemes below are <strong>research</strong> as of 20 November 2026. Splitting ML-DSA’s
          rejection sampling and secret nonce vectors across parties without leaking information or
          inflating signatures is much harder than FROST; Falcon’s trapdoor Gaussian sampling is
          harder still. Meanwhile, upgrading MPC pairwise channels to RFC 10024 hybrid TLS is the
          near-term quantum fix that does not wait for PQ threshold signatures.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Family</th>
                <th className="py-2 pr-3">Scheme / Paper</th>
                <th className="py-2 pr-3">Verifier Compatibility</th>
                <th className="py-2 pr-3">Rounds &amp; Parties</th>
                <th className="py-2">Signature Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {THRESHOLD_COMPARISON_ROWS.map((r) => (
                <tr key={r.example} className="align-top">
                  <td className="py-2 pr-3 font-medium text-foreground">{r.family}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.example}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.verifierCompatibility}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {r.rounds} · {r.partyModel}
                  </td>
                  <td className="py-2 font-mono text-foreground">{r.signatureSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-9.1" chip="Why It Is Hard" />
          <ClaimLine id="DA-9.2" chip="FIPS 204-Compatible" />
          <ClaimLine id="DA-9.3a" chip="FIPS 204-Compatible" />
          <ClaimLine id="DA-9.3b" chip="FIPS 204-Compatible" />
          <ClaimLine id="DA-9.6a" chip="Preprint · FIPS 204" />
          <ClaimLine id="DA-9.6b" chip="Preprint · FIPS 204" />
          <ClaimLine id="DA-9.4a" chip="Non-FIPS Variant" />
          <ClaimLine id="DA-9.4b" chip="Non-FIPS Variant" />
          <ClaimLine id="DA-9.4c" chip="Non-FIPS Variant" />
          <ClaimLine id="DA-9.5" chip="Non-FIPS Variant" />
          <ClaimLine id="DA-9.8a" chip="SLH-DSA Research" />
          <ClaimLine id="DA-9.8b" chip="Threshold FHE/CKKS" />
          <ClaimLine id="DA-9.7" chip="NIST MPTS 2026" />
          <ClaimLine id="DA-9.9" chip="Custody Alternative" />
        </div>
      </section>

      {/* Section 5c: shamir-seeds */}
      <section id="shamir-seeds" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <KeyRound size={18} className="text-primary" aria-hidden="true" />
            5c. Shamir Secret Sharing for Seeds (SLIP-39) &amp; VSS Deltas
          </h2>
          <Button
            variant="ghost"
            onClick={() => onNavigateToWorkshop(2)}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            Open W8 Shamir &amp; Envelope Demo <ArrowRight size={12} aria-hidden="true" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            LM-045 (Cold Wallet &amp; HD Wallet steps)
          </Link>{' '}
          covers Grover on seeds, Shamir-vs-MPC, and PQ-capable wrapping; Module A2 owns recovery
          operations. Here we examine the format internals, quantum reach into BIP-32/VSS, and
          envelope deltas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-12.1" chip="SLIP-39 Internals" />
          <ClaimLine id="DA-12.2" chip="Ideal Shamir" />
          <ClaimLine id="DA-12.3" chip="BIP-32 xpub + Shor" />
          <ClaimLine id="DA-12.8" chip="Hybrid KEM-DEM" />
          <ClaimLine id="DA-12.4a" chip="Feldman VSS" />
          <ClaimLine id="DA-12.4b" chip="Pedersen VSS" />
          <ClaimLine id="DA-12.5a" chip="Lattice PVSS" />
          <ClaimLine id="DA-12.5b" chip="Lattice PVSS" />
          <ClaimLine id="DA-12.5c" chip="PVSS Binding Delta" />
          <ClaimLine id="DA-12.6a" chip="Analysis · Seed -> ML-DSA" />
          <ClaimLine id="DA-12.6b" chip="FIPS 203 Seeds" />
        </div>

        <ReadingNote title="Negative status & proposed construction (as of 20 November 2026)">
          <p>
            No standard PQ HD-wallet derivation path or xpub-style public derivation equivalent
            exists as of 20 November 2026. Deriving ML-DSA (<code>ξ</code>) or ML-KEM (
            <code>d, z</code>) seeds from a wallet master seed via hardened HMAC requires domain
            separation and explicit backup compatibility — it is a proposed construction, not FIPS
            203/204 behaviour.
          </p>
        </ReadingNote>
      </section>

      {/* Section 5d: pq-hardware-wallets */}
      <section id="pq-hardware-wallets" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Cpu size={18} className="text-primary" aria-hidden="true" />
            5d. What &ldquo;Quantum-Ready&rdquo; Means on a Hardware Wallet
          </h2>
          <Button
            variant="ghost"
            onClick={() => onNavigateToWorkshop(3)}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            Open W13 HW Claim Reader <ArrowRight size={12} aria-hidden="true" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Always split any hardware-wallet post-quantum claim into four parts: (1) device integrity
          &amp; attestation, (2) chain-accepted transaction signing, (3) seed &amp; derivation, and
          (4) device-to-host channel &amp; clear-signing display. In institutional custody (Module
          A1 §5), hardware wallets also act as approver devices with trusted displays: PQ device
          attestation does not establish PQ approval signing without separate vendor evidence. For
          physical side channels during PQ signing, see{' '}
          <Link to="/learn/pqc-implementation-security" className="text-primary hover:underline">
            PQC Implementation Security (LM-081)
          </Link>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-14.1" chip="Part 1 · Device Integrity" />
          <ClaimLine id="DA-14.2" chip="Part 2 · Announced" />
          <ClaimLine id="DA-14.3" chip="Part 4 · Sig Sizes" />
          <ClaimLine id="DA-14.4a" chip="MCU Timings" />
          <ClaimLine id="DA-14.4b" chip="SE Side Channels" />
          <ClaimLine id="DA-14.5a" chip="SE Announcement" />
          <ClaimLine id="DA-14.5b" chip="ANSSI Scope Check" />
        </div>

        <ReadingNote title="Five questions to test any hardware wallet PQC claim">
          <ul className="list-disc pl-4 space-y-1 text-xs text-foreground">
            {FIVE_HW_QUESTIONS.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </ReadingNote>
      </section>

      {/* Section 8d: pq-smart-accounts */}
      <section id="pq-smart-accounts" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers size={18} className="text-primary" aria-hidden="true" />
            8d. Post-Quantum Smart Accounts from the Custody Point of View
          </h2>
          <Button
            variant="ghost"
            onClick={() => onNavigateToWorkshop(1)}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            Test Account Types in W7 <ArrowRight size={12} aria-hidden="true" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Mechanics of ERC-4337, EIP-7702, EIP-8141, and Solana are covered in{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            LM-045 PQC Defense Parts 3–4
          </Link>
          . From a custody perspective, a smart account enforces on-chain quorum, timelock,
          allowlist, and recovery rules that hold against a compromised custodian stack{' '}
          <strong>only if</strong> (Rule G1) that stack does not hold enough signer, guardian,
          recovery, or upgrade authority to alter them — combining with Module A1 §5 off-chain
          policy boundaries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-15.1" chip="ERC-4337 Premise" />
          <ClaimLine id="DA-15.2" chip="EIP-7702 Residual Key" />
          <ClaimLine id="DA-15.10" chip="Permit / ecrecover" />
          <ClaimLine id="DA-15.11" chip="Draft · Key Revocation" />
          <ClaimLine id="DA-15.12a" chip="Negative · No Mainnet Precompile" />
          <ClaimLine id="DA-15.12b" chip="Draft · Falcon Precompile" />
          <ClaimLine id="DA-15.12c" chip="Draft · ML-DSA Precompiles" />
          <ClaimLine id="DA-15.3a" chip="Draft · EIP-8141" />
          <ClaimLine id="DA-15.3b" chip="Draft · EIP-7932" />
          <ClaimLine id="DA-15.6a" chip="Prototype · ML-DSA" />
          <ClaimLine id="DA-15.6b" chip="Prototype · Falcon" />
          <ClaimLine id="DA-15.8a" chip="Contrast · Algorand" />
          <ClaimLine id="DA-15.8b" chip="Contrast · Algorand" />
        </div>

        <ReadingNote title="Hybrid accounts & key-storage recursion (Rule G1)">
          <p>
            A hybrid smart account requiring both ECDSA and ML-DSA protects against a break of
            either signature <em>only if</em> no classical recovery guardian, upgrade admin, or
            EIP-7702 legacy key can bypass the check. Remember also that the smart account’s PQ
            signing key must itself live inside a protected boundary (hardware wallet §5d, ML-DSA
            HSM, or enclave) — Module A1’s signing-authority rules still apply.
          </p>
        </ReadingNote>
      </section>

      {/* Section 8c: custody-migration-path */}
      <section id="custody-migration-path" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Route size={18} className="text-primary" aria-hidden="true" />
            8c. Phased PQC Migration Path for a Custody Platform
          </h2>
          <Button
            variant="ghost"
            onClick={() => onNavigateToWorkshop(1)}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            Open W7 Migration Planner <ArrowRight size={12} aria-hidden="true" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Builds on LM-045 component readiness notes and links{' '}
          <Link to="/learn/migration-program" className="text-primary hover:underline">
            Migration Program
          </Link>
          ,{' '}
          <Link to="/learn/crypto-agility" className="text-primary hover:underline">
            Crypto Agility
          </Link>
          , and{' '}
          <Link to="/learn/cbom" className="text-primary hover:underline">
            CBOM
          </Link>
          . Separate every custody dependency into three clocks:{' '}
          <strong>platform-controlled</strong>, <strong>account-controlled</strong>, and{' '}
          <strong>chain-controlled</strong>.
        </p>

        <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
          <li>
            <strong>Phase 0 — Inventory (CBOM):</strong> Catalog all HSM/MPC/enclave channels,
            backups, approval keys, and exposed on-chain addresses; separate confidentiality (HNDL)
            from authentication (future forgery).
          </li>
          <li>
            <strong>Phase 1 — No-Regret Now (Platform-Controlled, HNDL First):</strong> Enable RFC
            10024 hybrid TLS on HSM/MPC/enclave channels; re-wrap stored backups under hybrid
            KEM-DEM; upgrade to CAVP/CMVP-scoped ML-KEM/ML-DSA HSM firmware; move backend approvals
            and audit archives to ML-DSA + RFC 4998 renewal; enforce address hygiene.
          </li>
          <li>
            <strong>Phase 2 — Chain-Dependent (Track &amp; Prepare):</strong> Maintain per-chain
            watch lists (BIP-360/361, Ethereum, Solana via LM-045 Parts 2–4), prepare sweep tooling,
            and budget for downtime/fee congestion.
          </li>
          <li>
            <strong>Phase 3 — MPC &amp; Threshold:</strong> Keep classical threshold for L1 output
            wrapped in Phase 1 PQ channels/backups; evaluate separated ML-DSA member auth or
            smart-account multisig until NIST IR 8214C / threshold standards mature.
          </li>
          <li>
            <strong>Phase 4 — Crypto Agility &amp; Evidence:</strong> Keep algorithm choice in
            configuration (NIST CSWP 39), verify ACVP test vectors, and map vendor evidence to
            regulatory frameworks.
          </li>
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-11.3a" chip="Phase 0 · Discovery" />
          <ClaimLine id="DA-11.3b" chip="Phase 0 · CBOM" />
          <ClaimLine id="DA-11.2" chip="Phase 4 · Agility" />
          <ClaimLine id="DA-11.10a" chip="Phase 2 · Downtime" />
          <ClaimLine id="DA-11.10b" chip="Phase 2 · Fees" />
          <ClaimLine id="DA-11.4" chip="Regulator · MAS" />
          <ClaimLine id="DA-11.5" chip="Regulator · HKMA" />
          <ClaimLine id="DA-11.6" chip="Regulator · BIS" />
          <ClaimLine id="DA-11.7" chip="Financial · ASC X9" />
          <ClaimLine id="DA-11.8" chip="CISA / NSA / NIST" />
          <ClaimLine id="DA-11.12a" chip="Negative · MiCA" />
          <ClaimLine id="DA-11.12b" chip="Negative · DORA" />
          <ClaimLine id="DA-11.9" chip="Worked Example · Vendor Roadmap" />
        </div>
      </section>

      {/* Section 7b: quantum-views-of-module-A */}
      <section id="quantum-views-of-module-A" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Eye size={18} className="text-primary" aria-hidden="true" />
          7b. Quantum Views of Custody Operations (Cross-Module Deltas)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
            <h3 className="font-bold text-foreground text-sm">MPC + HSM Hybrids (Module A1 §5b)</h3>
            <p>
              Output remains classical ECDSA/EdDSA; replace RSA/ECDH share wrapping with a KEM-DEM
              envelope (ML-KEM encapsulation + KDF + AEAD, not ML-KEM wrapping alone; PKCS#11 v3.2
              defines encapsulate/decapsulate), secure peer channels with RFC 10024, and use ML-DSA
              HSM firmware for protocol auth. Future threshold ML-DSA would still need in-HSM party
              computation to preserve Variant (b) (§8b).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
            <h3 className="font-bold text-foreground text-sm">
              Rotation &amp; Revocation (Module A2 §5e)
            </h3>
            <p>
              After a CRQC arrives, an exposed on-chain key cannot be revoked — only outrun. MPC
              refresh and classical HSM rotation do not remove on-chain Shor exposure; planned
              migration (§8c) and control-plane ML-DSA rotation must precede CRQC availability.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
            <h3 className="font-bold text-foreground text-sm">
              Recovery &amp; Inheritance (Module A2 §5f)
            </h3>
            <p>
              Recovery envelopes are long-lived HNDL targets — re-wrap them under hybrid KEM-DEM now
              (§5c). A classical heir key behind a multi-year timelock may outlive CRQC arrival; a
              hidden Taproot script leaf does not help if the tweaked key-path public key is broken
              by Shor, whereas P2WSH/P2SH or draft BIP-360 P2MR hide keys only until first spend
              (mempool race). PQ smart accounts can rotate guardians without moving funds (§8d).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
            <h3 className="font-bold text-foreground text-sm">
              Key Ceremonies &amp; Backup DR (Module A2 §5g, §5j)
            </h3>
            <p>
              Dual-algorithm ceremonies generate ML-DSA (<code>ξ</code>) and ML-KEM (
              <code>d, z</code>) inputs per FIPS 204/203. Stateful hash-based firmware keys
              (LMS/XMSS; see{' '}
              <Link to="/learn/stateful-signatures" className="text-primary hover:underline">
                Stateful Signatures
              </Link>
              ) must never be restored twice (RFC 10033).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
            <h3 className="font-bold text-foreground text-sm">
              Audit Evidence, Monitoring &amp; Insurance (Module A2 §5h; Module C §6c, optional
              further reading)
            </h3>
            <p>
              Ceremony minutes, signed logs, and Proof-of-Reserves records that must remain
              verifiable for years must enter an RFC 4998 / Wathiqa PQ timestamp renewal chain
              before classical signatures fail (see{' '}
              <Link to="/learn/trust-services-pqc" className="text-primary hover:underline">
                Trust Services PQC
              </Link>
              ). As of 20 November 2026, no standard insurer/auditor PQC questionnaire mandate is
              established across the custody market.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
            <h3 className="font-bold text-foreground text-sm">
              Access Control &amp; Destruction (Module A2 §5i, §5k)
            </h3>
            <p>
              FIDO2/WebAuthn hardware PQ deployment is not yet established despite RFC 9964 COSE IDs
              (§8). Destroying a classical private key does not protect funds behind an already
              exposed on-chain public key, and retired classical encrypted backups stay HNDL targets
              until destroyed.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-19.10a" chip="Evidence Renewal" />
          <ClaimLine id="DA-19.10b" chip="Wathiqa Profile" />
          <ClaimLine id="DA-21.8a" chip="Stateful Backup Limit" />
          <ClaimLine id="DA-21.8b" chip="LMS Statefulness" />
        </div>
      </section>

      {/* Section 9B: takeaways */}
      <section id="takeaways" className="glass-panel p-6 space-y-4 scroll-mt-24">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Table2 size={18} className="text-primary" aria-hidden="true" />
          9B. Takeaways Matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Component</th>
                <th className="py-2 pr-3">Quantum Limit</th>
                <th className="py-2 pr-3">HNDL or Forgery</th>
                <th className="py-2 pr-3">What Can Migrate Now</th>
                <th className="py-2">Maturity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {TAKEAWAY_MATRIX.map((row) => (
                <tr key={row.component} className="align-top">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.component}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{row.quantumLimit}</td>
                  <td className="py-2 pr-3 text-foreground">{row.riskType}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{row.migrateNow}</td>
                  <td className="py-2 font-semibold text-primary">{row.maturity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
