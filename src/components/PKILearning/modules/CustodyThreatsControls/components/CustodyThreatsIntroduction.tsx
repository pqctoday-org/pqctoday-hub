// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  KeyRound,
  AlertTriangle,
  Users,
  Bot,
  FileWarning,
  ShieldOff,
  Combine,
  Cpu,
  Table2,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import {
  BINANCE_INCIDENT_ATTRIBUTION,
  BINANCE_INCIDENT_CONTAINMENT,
  BINANCE_INCIDENT_IMPACT,
  BINANCE_INCIDENT_METADATA,
  BINANCE_INCIDENT_STAGES,
} from '@/data/canonicalBinanceIncident'
import { ClaimLine, ReadingNote } from './ClaimLine'
import { ControlBoundaryDiagram, MpcHsmVariantDiagram } from './ArchitectureDiagrams'
import {
  ADVERSARY_MODEL,
  CONTROL_COMBINATIONS,
  EXFILTRATION_PATHS,
  MPC_HSM_VARIANTS,
  TAKEAWAYS_MATRIX,
} from '../data/custodyThreatsData'

interface CustodyThreatsIntroductionProps {
  onNavigateToWorkshop: (step?: number) => void
}

export const CustodyThreatsIntroduction: React.FC<CustodyThreatsIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useActiveLearnPath()

  return (
    <div className="w-full space-y-6">
      {/* Educational Scope & Business-Service Framing */}
      <ReadingNote title="Educational scope & service-vs-asset boundary">
        <p>
          This module uses fictional wallet scenarios and browser-simulated cryptographic runs to
          teach custody decision-making; completing these lessons or workshops does not verify or
          certify any deployed custody platform. In institutional custody, distinguish{' '}
          <strong className="text-foreground">business services</strong> (such as a custody signing
          service or a long-lived records archiving and retrieval service) from{' '}
          <strong className="text-foreground">protected assets</strong> (private keys, threshold
          shares, digital assets, and retained audit records themselves).
        </p>
      </ReadingNote>

      {/* §1 signing-authority */}
      <LearnSection
        sectionId="signing-authority"
        title="1. Keys vs Signing Authority"
        icon={<KeyRound size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          A custody design fails when teams treat <em>where the private key sits</em> as the entire
          security model. Holding a key inside an HSM or MPC cluster prevents direct raw-key export,
          but an attacker who controls <strong>signing authority</strong> — the ability to construct
          a payload, deceive the approval screen, reuse a pre-signed message, or trigger an API
          credential — can move funds without ever extracting the private key.
        </p>

        <p className="text-sm text-muted-foreground">
          Foundational curve mechanics (secp256k1 vs Ed25519), deterministic ECDSA nonce derivation
          under RFC 6979, HD wallets, and the five-layer custody stack are taught in{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            Digital Assets (LM-045)
          </Link>{' '}
          and are linked rather than repeated here. This module begins where key placement ends: who
          can make a custody system sign, and what stops unauthorized authority.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <ClaimLine id="DA-1.1" chip="Nonce Integrity" />
          <ClaimLine id="DA-1.3a" chip="Smart-Contract Quorum" />
          <ClaimLine id="DA-1.3b" chip="Smart-Contract Quorum" />
          <ClaimLine id="DA-1.4" chip="Delegated EOA Authority" />
        </div>

        <ReadingNote title="Rule G1 (Authority Assumptions)">
          <p>
            Every claim in this module that a control &ldquo;holds&rdquo; explicitly states which
            signer, guardian, recovery, and contract-upgrade authorities an attacker must{' '}
            <em>not</em> hold for that guarantee to remain intact. Note how{' '}
            <code className="text-foreground">checkNSignatures</code> depends on caller-supplied
            threshold and executor arguments unless gated by{' '}
            <code className="text-foreground">checkSignatures</code> reading storage, and how
            EIP-7702 lets an EOA delegate execution persistently without exposing its private key.
          </p>
        </ReadingNote>
      </LearnSection>

      {/* §2 exfiltration-paths */}
      <LearnSection
        sectionId="exfiltration-paths"
        title="2. Exfiltration & Misuse Paths"
        icon={<AlertTriangle size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Rather than treating every custody breach as &ldquo;stolen private key,&rdquo; map each
          threat path to the exact step in the{' '}
          <Link
            to="/learn/digital-assets?tab=workshop&flow=custody-architecture"
            className="text-primary hover:underline"
          >
            LM-045 Custody Architecture withdrawal flow
          </Link>{' '}
          that it attacks — including paths that leave the key untouched inside hardware or require
          no victim key at all.
        </p>

        <div
          className="overflow-x-auto rounded-lg border border-border"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: scrollable table region must be keyboard-reachable
          tabIndex={0}
          role="region"
          aria-label="Custody key exfiltration and signing misuse paths mapped to withdrawal flow steps"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-foreground">
              <tr>
                <th className="p-3 font-semibold">Group &amp; Path</th>
                <th className="p-3 font-semibold">Attacked LM-045 Step</th>
                <th className="p-3 font-semibold">Mechanism</th>
                <th className="p-3 font-semibold">G1 Authorities Attacker Must Not Hold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {EXFILTRATION_PATHS.map((row) => (
                <tr key={row.id} className="bg-card">
                  <td className="p-3 align-top">
                    <span className="font-semibold text-foreground block">{row.group}</span>
                    <span className="text-muted-foreground">{row.path}</span>
                  </td>
                  <td className="p-3 align-top text-muted-foreground">{row.lm045FlowStep}</td>
                  <td className="p-3 align-top text-muted-foreground">{row.mechanism}</td>
                  <td className="p-3 align-top text-muted-foreground">
                    {row.g1AuthoritiesNotHeld}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <ClaimLine id="DA-2.6" chip="Threat Landscape" />
          <ClaimLine id="DA-2.7" chip="Physical Coercion" />
          <ClaimLine id="DA-2.8" chip="No-Key Attack" />
          <ClaimLine id="DA-2.9a" chip="Off-Chain Spend Authority" />
          <ClaimLine id="DA-2.9b" chip="Off-Chain Spend Authority" />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop(0)}
          className="text-xs"
        >
          Test Blind vs Clear Signing in Step 1 <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      {/* §2b adversary-model */}
      <LearnSection
        sectionId="adversary-model"
        title="2b. Adversary Model"
        icon={<Users size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Every later section evaluates controls against the nine adversary classes below. Naming
          the adversary prevents assuming away host root, mobile share compromise, or recovery
          authority abuse.
        </p>

        <div
          className="overflow-x-auto rounded-lg border border-border"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: scrollable table region must be keyboard-reachable
          tabIndex={0}
          role="region"
          aria-label="Nine-row custody adversary model table"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-foreground">
              <tr>
                <th className="p-3 font-semibold">Adversary Class</th>
                <th className="p-3 font-semibold">Assumed Capability</th>
                <th className="p-3 font-semibold">What Fails If Assumed Absent</th>
                <th className="p-3 font-semibold">Primary Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ADVERSARY_MODEL.map((row) => (
                <tr key={row.id} className="bg-card">
                  <td className="p-3 align-top font-semibold text-foreground">{row.adversary}</td>
                  <td className="p-3 align-top text-muted-foreground">{row.capability}</td>
                  <td className="p-3 align-top text-muted-foreground">
                    {row.breaksIfAssumedAbsent}
                  </td>
                  <td className="p-3 align-top text-muted-foreground">{row.primaryMitigations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LearnSection>

      {/* §2c agent-authority */}
      <LearnSection
        sectionId="agent-authority"
        title="2c. AI Agent Spend Authority"
        icon={<Bot size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          AI agents holding payment credentials (such as AP2 mandates or x402 payment channels)
          introduce a fast-moving variant of the <strong>compromised requester</strong>: prompt
          injection, coerced tool output, or runaway retry loops can trigger valid signatures unless
          spend policy sits inside the signing boundary rather than inside the agent&rsquo;s prompt.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <ClaimLine id="DA-8.1" chip="AP2 Guidance" />
          <ClaimLine id="DA-8.6a" chip="Enclave Agent Keys" />
          <ClaimLine id="DA-8.6b" chip="Scoped Grant (Early Deployment)" />
          <ClaimLine id="DA-8.2" chip="Research / Individual I-D" />
        </div>

        <ReadingNote title="Agent wallet controls & cross-module links">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Four baseline controls:</strong> (1) scoped keys
              held in an HSM or TEE rather than agent process memory, (2) per-agent spend limits and
              recipient allowlists enforced inside the signer, (3) human quorum approval above a
              value threshold, and (4) short-lived expiring credentials.
            </li>
            <li>
              <strong className="text-foreground">Maturity &amp; foundational reading:</strong>{' '}
              Agent wallet MCP integrations (such as Coinbase Wallet MCP&rsquo;s scoped agent-wallet
              mode) remain early-deployment capabilities. See{' '}
              <Link to="/learn/ai-security-pqc" className="text-primary hover:underline">
                AI Security &amp; PQC (LM-033)
              </Link>{' '}
              for agentic-commerce framing. Post-quantum credential binding for x402 remains an
              individual Internet-Draft (research, no working-group adoption).
            </li>
            <li>
              <strong className="text-foreground">
                Module AI (LM-087, optional further reading):
              </strong>{' '}
              How these control models limit AI-scaled attacks is taught in depth in Module AI
              (LM-087); Section 2c and Workshop Step 5 here are complete on their own.
            </li>
          </ul>
        </ReadingNote>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop(4)}
          className="text-xs"
        >
          Configure Agent Wallet Scope in Step 5 <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      {/* §3 case-studies */}
      <LearnSection
        sectionId="case-studies"
        title="3. Case Studies: Bybit, Drift & Binance"
        icon={<FileWarning size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Each incident below keeps the <strong>victim statement</strong>,{' '}
          <strong>investigator findings</strong>, and{' '}
          <strong>official government attribution</strong> strictly separated and dated, followed by
          the control combination and G1 assumptions required to interrupt it.
        </p>

        {/* Case 1: Bybit */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground">
              Case 1 — Bybit (21 February 2025)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
              UI Tampering + Blind Signing + delegatecall
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <ClaimLine id="DA-2.1a-bybit" chip="Victim Statement (2025-02-26)" />
            <ClaimLine id="DA-2.3" chip="Safe Foundation Statement (2025-02-28)" />
            <ClaimLine id="DA-2.2a" chip="Investigator — Sygnia" />
            <ClaimLine id="DA-2.2b" chip="Investigator — NCC Group (2025-03-10)" />
            <ClaimLine id="DA-2.2c" chip="Remediation — Safe{Wallet} (2025-02-28)" />
            <ClaimLine id="DA-2.1a-fbi" chip="Government Attribution — FBI (2025-02-26)" />
            <ClaimLine id="DA-2.1b" chip="FBI Campaign Name" />
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Mitigation &amp; G1 assumptions:</strong>{' '}
            Independent clear-signing hardware devices (trusted display decoding calldata outside
            the browser DOM) plus an HSM/on-chain policy blocking unapproved{' '}
            <code className="text-foreground">delegatecall</code> proxy upgrades. Assumes the
            attacker does not control the clear-signing descriptor registry/attester or device
            firmware.
          </p>
        </div>

        {/* Case 2: Drift */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground">Case 2 — Drift (1 April 2026)</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
              Social Engineering + Durable Nonce Pre-Approvals
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <ClaimLine id="DA-2.4a" chip="Victim Loss & Recovery Pool (2026-04-16)" />
            <ClaimLine id="DA-2.4b" chip="Relayed Post-Mortem Caveat (2026-04-09)" />
            <ClaimLine id="DA-2.4c" chip="On-Chain Staging vs Relayed Social Engineering" />
            <ClaimLine id="DA-2.4d" chip="Relaunch Controls (2026-04-16)" />
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Epistemic note &amp; G1 assumptions:</strong>{' '}
            Chainalysis explicitly noted its durable-nonce account relayed Drift&rsquo;s own
            post-mortem and was not yet independently verified, and reported a $285M estimate while
            Drift&rsquo;s 16 April update stated $295M in outstanding user losses. Mitigation
            requires dedicated out-of-band clear-signing devices, strict approval expiry (preventing
            indefinite pre-signed durable nonces), and timelocks that cannot be unilaterally removed
            by the deceived quorum.
          </p>
        </div>

        {/* Case 3: Binance — strictly populated dynamically from canonicalBinanceIncident */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground">
              Case 3 — {BINANCE_INCIDENT_METADATA.title}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
              Signing-Service Abuse + EIP-7702 Persistence
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Epistemic status &amp; published figures:</strong>{' '}
            {BINANCE_INCIDENT_METADATA.epistemicStatus}{' '}
            {BINANCE_INCIDENT_IMPACT.totalImpactedUsdDisplay} impacted (
            {BINANCE_INCIDENT_IMPACT.frozenOrInterceptedUsdDisplay} frozen or intercepted; FBI
            minimum theft wording: &ldquo;{BINANCE_INCIDENT_IMPACT.fbiMinimumTheftUsdDisplay}
            &rdquo;). {BINANCE_INCIDENT_ATTRIBUTION.separationNote}
          </p>

          <div className="space-y-2">
            {BINANCE_INCIDENT_STAGES.map((stage) => (
              <div
                key={stage.id}
                className="p-3 rounded-lg bg-muted/40 border border-border text-xs"
              >
                <p className="font-semibold text-foreground">
                  Stage {stage.sequenceOrder} ({stage.dateDisplay}): {stage.title}
                </p>
                <p className="text-muted-foreground mt-1">{stage.summary}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
            <p className="font-semibold text-foreground">
              Containment &amp; On-Chain Persistence (
              {BINANCE_INCIDENT_CONTAINMENT.eip7702Exploitation.targetHotWalletLabel})
            </p>
            <p className="text-muted-foreground">{BINANCE_INCIDENT_CONTAINMENT.keyFinding}</p>
            <p className="text-muted-foreground">
              {BINANCE_INCIDENT_CONTAINMENT.eip7702Exploitation.privateKeyExposureClaim}{' '}
              {BINANCE_INCIDENT_CONTAINMENT.onChainRevocation.procedureSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <ClaimLine
              id="DA-2.5a"
              chip={`Victim Report (${BINANCE_INCIDENT_METADATA.binanceReportPublishedDate})`}
            />
            <ClaimLine id="DA-2.5c" chip="Preparation Stages" />
            <ClaimLine id="DA-2.5b" chip="Signing Service & EIP-7702" />
            <ClaimLine
              id="DA-2.5d"
              chip={`Government Attribution (${BINANCE_INCIDENT_ATTRIBUTION.officialGovernmentAttribution.publishedDate})`}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Mitigation &amp; G1 assumptions:</strong> Enforce
            transaction-type and delegation policy inside the MPC/HSM signing boundary (blocking
            unapproved EIP-7702 authorizations), require quorum approval for container deployments
            and signing-service configuration, and maintain pre-tested on-chain revocation runbooks.{' '}
            <em>
              (How the internal AI tool pivot relates to AI-scaled attacks is taught in Module AI
              (LM-087), optional further reading.)
            </em>
          </p>
        </div>
      </LearnSection>

      {/* §4 limits-of-the-three */}
      <LearnSection
        sectionId="limits-of-the-three"
        title="4. Limits of HSM, MPC & Enclaves"
        icon={<ShieldOff size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Base definitions of HSMs, MPC, and Confidential Computing are taught in{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            LM-045
          </Link>{' '}
          and{' '}
          <Link to="/learn/confidential-computing" className="text-primary hover:underline">
            Confidential Computing (LM-019)
          </Link>
          . Here we focus strictly on what each technology does <em>not</em> guarantee on its own.
        </p>

        <h3 className="text-sm font-semibold text-foreground">
          HSMs: Key Protection Without Transaction Judgment
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <ClaimLine id="DA-3.1" chip="PKCS#11 v3.2" />
          <ClaimLine id="DA-3.1n" chip="Negative Check" />
          <ClaimLine id="DA-3.2a" chip="IETF RATS Draft" />
          <ClaimLine id="DA-3.2b" chip="Key Residency != Tx Policy" />
          <ClaimLine id="DA-13.1" chip="FIPS 140-3 IG Boundary" />
        </div>
        <p className="text-xs text-muted-foreground">
          Note the FIPS 140-3 Implementation Guidance distinction: CAVP validates an algorithm
          implementation, not the whole cryptographic module; custom code loaded inside the module
          enclosure may sit in <strong>Excluded Components</strong> (IG 2.3.D) outside the validated
          boundary and requires checking the <strong>Approved Security Service Indicator</strong>{' '}
          (IG 2.4.A/C) and <strong>Software/Firmware Loading</strong> rules (IG 10.3.F).
        </p>

        <h3 className="text-sm font-semibold text-foreground pt-2">
          MPC: Protocol Proofs, Lifecycle &amp; Host Exposure
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <ClaimLine id="DA-3.10" chip="RFC 9591 FROST" />
          <ClaimLine id="DA-13.2a" chip="BitForge Disclosure" />
          <ClaimLine id="DA-13.2b" chip="GHSA-h24c-6p6p-m3vx" />
          <ClaimLine id="DA-13.2c" chip="ePrint 2023/1234 Abstract" />
        </div>
        <p className="text-xs text-muted-foreground">
          &ldquo;No single place holds the key&rdquo; holds only under distributed key generation
          (never dealer import), patched zero-knowledge proof checks (such as CGGMP21 Paillier-Blum
          and No Small Factor proofs), and independent policy enforcement per party.
        </p>

        <h3 className="text-sm font-semibold text-foreground pt-2">
          Confidential Computing: Attestation Limits &amp; Physical / CPU Attacks
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <ClaimLine id="DA-13.3g" chip="NIST IR 8320E (ipd)" />
          <ClaimLine id="DA-13.3f" chip="CCC v1.3 Threat Model" />
          <ClaimLine id="DA-13.3a" chip="Intel SGX — Foreshadow" />
          <ClaimLine id="DA-13.3b" chip="Intel SGX — ÆPIC Leak" />
          <ClaimLine id="DA-13.3c" chip="AMD SEV-SNP — BadRAM" />
          <ClaimLine id="DA-13.3d" chip="Intel SGX & AMD SEV-SNP — Battering RAM" />
          <ClaimLine id="DA-13.3e" chip="Intel TDX & AMD SEV-SNP — TEE.fail" />
        </div>
        <p className="text-xs text-muted-foreground">
          Attestation proves a measured image state under vendor endorsement PKI — not code
          correctness, transaction authorization, or freshness without a nonce. Physical DDR4/DDR5
          interposers (Battering RAM on Scalable SGX &amp; SEV-SNP, not TDX; TEE.fail on TDX &amp;
          SEV-SNP) show why high-value custody does not rely on a single TEE alone.
        </p>
      </LearnSection>

      {/* §5 combinations */}
      <LearnSection
        sectionId="combinations"
        title="5. Control Combinations & Assumptions"
        icon={<Combine size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Effective custody stacks combine components so transaction parsing, policy checks, and
          quorum verification all execute inside protected boundaries. Each combination below states
          what it mitigates, its Rule G1 assumptions, and its residual risk.
        </p>

        <ControlBoundaryDiagram />

        <div className="grid grid-cols-1 gap-2">
          <ClaimLine id="DA-3.3" chip="In-HSM Policy (SKA)" />
          <ClaimLine id="DA-3.5" chip="HSM + Trusted Display" />
          <ClaimLine id="DA-3.15" chip="ERC-7730 Clear Signing" />
          <ClaimLine id="DA-13.6" chip="ERC-7730 Registry Scope" />
          <ClaimLine id="DA-13.7" chip="ERC-8176 Expiry & Revocation" />
          <ClaimLine id="DA-3.6" chip="Enclave Policy Engine" />
          <ClaimLine id="DA-3.7a" chip="Pattern (i) KMS + Attestation" />
          <ClaimLine id="DA-3.7b" chip="Nitro Hardware Root" />
          <ClaimLine id="DA-3.8a" chip="AWS KMS Policy Release" />
          <ClaimLine id="DA-3.8b" chip="Pattern (ii) Azure SKR" />
          <ClaimLine id="DA-3.9" chip="MPC + Enclave Co-Signer" />
          <ClaimLine id="DA-3.11" chip="Air-Gapped OSO + Timelock" />
          <ClaimLine id="DA-13.5" chip="Google Cloud Reference Architecture" />
        </div>

        <div
          className="overflow-x-auto rounded-lg border border-border"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: scrollable table region must be keyboard-reachable
          tabIndex={0}
          role="region"
          aria-label="Control combinations, G1 authority assumptions, and residual risk"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-foreground">
              <tr>
                <th className="p-3 font-semibold">Combination</th>
                <th className="p-3 font-semibold">Mitigates</th>
                <th className="p-3 font-semibold">Authority Assumptions (Rule G1)</th>
                <th className="p-3 font-semibold">Residual Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CONTROL_COMBINATIONS.map((c) => (
                <tr key={c.id} className="bg-card">
                  <td className="p-3 align-top">
                    <span className="font-semibold text-foreground block">{c.name}</span>
                    <span className="text-muted-foreground">{c.patternSummary}</span>
                  </td>
                  <td className="p-3 align-top text-muted-foreground">{c.mitigates.join('; ')}</td>
                  <td className="p-3 align-top text-muted-foreground">{c.g1Assumptions}</td>
                  <td className="p-3 align-top text-muted-foreground">{c.residualRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(1)}
            className="text-xs"
          >
            Try ML-DSA-65 Quorum Gate (Step 2) <ArrowRight size={14} className="ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop(3)}
            className="text-xs"
          >
            Open Combination Builder (Step 4) <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </LearnSection>

      {/* §5b mpc-plus-hsm */}
      <LearnSection
        sectionId="mpc-plus-hsm"
        title="5b. Hybrid MPC + HSM Variants"
        icon={<Cpu size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          &ldquo;MPC backed by HSMs&rdquo; describes five materially different architectures with
          different exposure when a host OS, HSM credential, or vendor operator is compromised. Note
          also how Dfns documents HSM wrapping as an <em>alternative to MPC</em> (wallet keys
          unwrapped in HSM memory), whereas true hybrid variants combine threshold shares with
          hardware boundaries.
        </p>

        <MpcHsmVariantDiagram />

        <div
          className="overflow-x-auto rounded-lg border border-border"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: scrollable table region must be keyboard-reachable
          tabIndex={0}
          role="region"
          aria-label="Comparison of hybrid MPC plus HSM variants (a) through (e)"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-foreground">
              <tr>
                <th className="p-3 font-semibold">Variant</th>
                <th className="p-3 font-semibold">Where Share Used &amp; Policy Checked</th>
                <th className="p-3 font-semibold">Compromised MPC Node / Operator Gets</th>
                <th className="p-3 font-semibold">G1 Assumptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MPC_HSM_VARIANTS.map((v) => (
                <tr key={v.id} className="bg-card">
                  <td className="p-3 align-top">
                    <span className="font-semibold text-foreground block">
                      {v.label}: {v.title}
                    </span>
                    <span className="text-muted-foreground">{v.whoHoldsWhat}</span>
                  </td>
                  <td className="p-3 align-top text-muted-foreground">
                    <strong className="text-foreground">Share:</strong> {v.whereShareUsed}{' '}
                    <strong className="text-foreground">Policy:</strong> {v.wherePolicyChecked}
                  </td>
                  <td className="p-3 align-top text-muted-foreground">
                    <strong className="text-foreground">Node:</strong> {v.compromisedNodeGets}{' '}
                    <strong className="text-foreground">HSM cred:</strong> {v.stolenHsmCredGets}
                  </td>
                  <td className="p-3 align-top text-muted-foreground">{v.g1Assumptions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <ClaimLine id="DA-10.1a" chip="Wrapped-Key Alternative to MPC" />
          <ClaimLine id="DA-10.1b" chip="Customer-Owned HSM Anchor" />
          <ClaimLine id="DA-10.1c" chip="KeyLink HSM Key Custody" />
          <ClaimLine id="DA-10.2" chip="Multisig vs MPC vs HSM Policy" />
          <ClaimLine id="DA-10.3a" chip="In-HSM CodeSafe Boundary" />
          <ClaimLine id="DA-10.3b" chip="In-HSM Luna Functionality Modules" />
          <ClaimLine id="DA-10.4n" chip="PKCS#11 v3.2 Negative Check" />
          <ClaimLine id="DA-10.5" chip="MPC Readiness Assessment" />
          <ClaimLine id="DA-10.8a" chip="KMIP 3.0 CSD02 Split Key" />
          <ClaimLine id="DA-10.8b" chip="KMIP 2.1 Split Key Standard" />
        </div>

        <ReadingNote title="Further reading across the custody series (optional further reading)">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Module A2 (optional further reading):</strong>{' '}
              Variant (d) key generation &amp; refresh (Module A2 §5a), recovery (Module A2 §5f),
              ceremonies (Module A2 §5g), and backup/DR (Module A2 §5j) are taught operationally in
              Module A2.
            </li>
            <li>
              <strong className="text-foreground">Module B (optional further reading):</strong>{' '}
              Post-quantum custody migration and PQC envelope considerations are covered in Module B
              (&ldquo;Custody PQC Migration&rdquo;).
            </li>
            <li>
              <strong className="text-foreground">Module C (optional further reading):</strong>{' '}
              Regulatory custody expectations (SFC, VARA, MAS, FINMA, DORA) are covered in Module C.
            </li>
          </ul>
        </ReadingNote>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop(2)}
          className="text-xs"
        >
          Run 2-of-3 RFC 9591 FROST &amp; §5b Toggle (Step 3){' '}
          <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      {/* §9A takeaways */}
      <LearnSection
        sectionId="takeaways"
        title="9A. Takeaways Matrix"
        icon={<Table2 size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Use this decision matrix to map each custody attack path to the control combination that
          mitigates it, the Rule G1 authorities that must stay uncompromised, and the residual risk
          your operations team still must manage.
        </p>

        <div
          className="overflow-x-auto rounded-lg border border-border"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- WCAG scrollable-region-focusable: scrollable table region must be keyboard-reachable
          tabIndex={0}
          role="region"
          aria-label="Takeaways matrix: attack path by control combination, G1 assumptions, and residual risk"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-foreground">
              <tr>
                <th className="p-3 font-semibold">Attack Path</th>
                <th className="p-3 font-semibold">Control Combination</th>
                <th className="p-3 font-semibold">G1 Authority Assumptions</th>
                <th className="p-3 font-semibold">Residual Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TAKEAWAYS_MATRIX.map((row) => (
                <tr key={row.id} className="bg-card">
                  <td className="p-3 align-top font-semibold text-foreground">{row.attackPath}</td>
                  <td className="p-3 align-top text-muted-foreground">{row.controlCombination}</td>
                  <td className="p-3 align-top text-muted-foreground">{row.g1Authorities}</td>
                  <td className="p-3 align-top text-muted-foreground">{row.residualRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button onClick={() => onNavigateToWorkshop(0)} className="text-sm">
          Start Workshop: Step 1 (Blind vs Clear Signing) <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <ReadingCompleteButton />
    </div>
  )
}
