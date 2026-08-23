// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Calculator,
  Presentation,
  ArrowRight,
  ClipboardCheck,
  Scale,
  BarChart3,
  Building2,
  KeyRound,
  FileSignature,
  Layers,
  Umbrella,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'
import { Button } from '@/components/ui/button'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Why + Concepts + Cost Categories ────────────────────────────────

const Step1WhyConceptsCosts: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 1: Why Build a Business Case? */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <DollarSign size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Why Build a PQC Business Case?</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          <InlineTooltip term="Post-Quantum Cryptography">Post-quantum cryptography</InlineTooltip>{' '}
          migration is not just a technical initiative &mdash; it requires significant
          organizational investment. A well-constructed business case translates technical risk into
          financial language that executives and boards understand.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <blockquote className="text-sm italic text-foreground/90">
            &ldquo;Organizations that delay PQC migration face compounding costs: rising compliance
            penalties, increasing breach exposure from harvest-now-decrypt-later attacks, and the
            growing technical debt of maintaining legacy cryptographic systems.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2">
            &mdash; Industry consensus from NIST, CISA, and leading CISOs
          </p>
        </div>
        <p>
          Without executive buy-in and adequate funding, PQC migration stalls. The business case
          bridges the gap between technical teams who understand the urgency and decision-makers who
          control budgets.
        </p>
      </div>
    </section>

    {/* Section 1b: The two time-bound risks — HNDL and TNFL */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-status-error/10">
          <ShieldAlert size={24} className="text-status-error" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The Two Time-Bound Quantum Risks</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A credible business case names <em>two</em> distinct, already-running risks — not one.
          They hit different systems, on different clocks, and they map to the two parallel
          migration tracks a program runs. Framing only the data-confidentiality risk leaves the
          signature-forgery half of the estate — and whole sectors like OT, PKI operators, and
          code-signing shops — out of the argument.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-primary/10 text-primary">
                <KeyRound size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">
                HNDL &mdash; Harvest Now, Decrypt Later
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2 flex-grow">
              Adversaries capture encrypted traffic <strong>today</strong> and store it to decrypt
              once a quantum computer exists. The risk is active now — any data whose
              confidentiality must outlast the quantum threat horizon is already exposed.
            </p>
            <div className="text-[11px] text-muted-foreground/80 border-t border-border pt-2">
              <strong>Drives urgency on:</strong> long-lived secrets (trade secrets, M&amp;A, health
              records, attorney-client) and internet-exposed key exchange.
              <br />
              <strong>Migration Track A:</strong> key exchange &amp; confidentiality (TLS, VPN,
              data-at-rest).
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-status-warning/10 text-status-warning">
                <FileSignature size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">
                TNFL &mdash; Trust Now, Forge Later
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2 flex-grow">
              Long-lived signatures and trust anchors signed today stay trusted for years. Once a
              quantum computer can forge them, an attacker can mint trusted software updates,
              certificates, or firmware. Signature migration has the{' '}
              <strong>longest lead times</strong> (PKI, toolchains, HSMs), so it must start in
              parallel — not after HNDL.
            </p>
            <div className="text-[11px] text-muted-foreground/80 border-t border-border pt-2">
              <strong>Drives urgency on:</strong> PKI roots (20+ yr), code- &amp; firmware-signing
              keys, OT safety certificates, long-validity document signatures.
              <br />
              <strong>Migration Track B:</strong> signatures, PKI &amp; authentication.
            </div>
          </div>
        </div>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <p className="text-xs text-foreground/90">
            <strong>The decision point:</strong> data with a 10+ year confidentiality requirement in
            a regulated industry means <strong>HNDL alone</strong> justifies immediate action; where
            signature integrity is the primary risk (OT/ICS, PKI operators),{' '}
            <strong>TNFL drives the urgency on a different set of systems</strong>. Most enterprises
            carry both and therefore run both tracks at once.
          </p>
        </div>
      </div>
    </section>

    {/* Section 2: Key Concepts */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <BarChart3 size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Key Financial Concepts</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Building a compelling case requires fluency in three financial frameworks that executives
          use to evaluate technology investments:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Total Cost of Ownership (TCO)</div>
            <p className="text-xs text-muted-foreground">
              The complete cost of migration including software, hardware, training, consulting,
              downtime, and ongoing operational changes over the full lifecycle.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Risk-Adjusted ROI</div>
            <p className="text-xs text-muted-foreground">
              Return on investment weighted by the probability and magnitude of quantum-enabled
              breaches, regulatory fines, and competitive disadvantage from inaction.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Board Communication</div>
            <p className="text-xs text-muted-foreground">
              Translating technical quantum risk into business language: revenue impact, market
              position, regulatory exposure, and fiduciary responsibility.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section 3: Cost Categories */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">PQC Migration Cost Categories</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          PQC migration costs span four major categories. Each must be estimated and presented
          alongside the cost of <em>not</em> migrating:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-primary/10 text-primary">
                <Calculator size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Migration Costs</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>&bull; Software upgrades and license fees</li>
              <li>&bull; Hardware replacements (HSMs, accelerators)</li>
              <li>&bull; Staff training and certification</li>
              <li>&bull; External consulting and integration</li>
              <li>&bull; Testing and validation effort</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-status-error/10 text-status-error">
                <ShieldAlert size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Breach Avoidance Savings</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>
                &bull; <InlineTooltip term="Harvest Now, Decrypt Later">HNDL</InlineTooltip> attack
                exposure (data already at risk)
              </li>
              <li>&bull; Per-record breach costs (industry-specific)</li>
              <li>&bull; Historical data retroactive exposure</li>
              <li>&bull; Reputational damage and customer loss</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-status-warning/10 text-status-warning">
                <Scale size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Compliance Penalty Avoidance</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>&bull; Regulatory fines (GDPR, HIPAA, PCI DSS)</li>
              <li>&bull; Government contract eligibility (CMMC, FedRAMP)</li>
              <li>&bull; Industry mandate deadlines (CNSA 2.0, ANSSI)</li>
              <li>&bull; Audit and remediation costs</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-success/10 text-success">
                <TrendingUp size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Operational &amp; Competitive</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>&bull; Reduced operational complexity (crypto agility)</li>
              <li>&bull; Market differentiation and trust signaling</li>
              <li>&bull; Insurance premium reductions</li>
              <li>&bull; Vendor and partner ecosystem alignment</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Section 3b: The eight cost-driver categories + umbrella framing */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Layers size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Sizing the Spend: Eight Cost Drivers</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Don&apos;t wait for precise numbers — estimate each cost driver separately and refine as
          discovery matures. A multi-year PQC budget breaks into eight categories:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              t: 'Discovery & inventory tooling',
              d: 'Crypto-discovery platforms plus deployment, integration, and ongoing licenses.',
            },
            {
              t: 'Cryptographic engineering labor',
              d: 'Usually the largest category — PQC talent is scarce and commands premium rates.',
            },
            {
              t: 'Vendor PQC licensing & upgrades',
              d: 'Often a step change rather than a line item: price HSM firmware upgrades and any PQC feature licences with your own vendor, per module, before assuming a number.',
            },
            {
              t: 'HSM & hardware refresh',
              d: 'Older HSMs may not support PQC key types; 6–12 month procurement lead times.',
            },
            {
              t: 'PKI modernization',
              d: 'CA upgrades, automated certificate lifecycle, root-CA ceremonies — needed regardless of PQC.',
            },
            {
              t: 'Performance & capacity uplift',
              d: 'CPU, memory, bandwidth, and storage increases from larger keys and signatures.',
            },
            {
              t: 'Testing environments',
              d: 'Production-mirror environments to validate before rollout.',
            },
            {
              t: 'Program management overhead',
              d: 'QRPM, PMO tooling, SteerCo facilitation, training, compliance tracking, board reporting.',
            },
          ].map((c, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-0.5">{c.t}</div>
              <p className="text-[11px] text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 flex gap-3">
          <Umbrella size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-foreground mb-1">
              The infrastructure-modernization umbrella
            </div>
            <p className="text-xs text-foreground/90">
              Combine independently justified investments — PKI automation for short certificate
              lifetimes, FIPS 140-3 upgrades for the FIPS 140-2 sunset, HSM refresh for end-of-life
              hardware, library upgrades for CVEs — into a single &ldquo;cryptographic
              infrastructure modernization&rdquo; program. Positioning PQC as the organizing wrapper
              for overdue security modernization avoids a big-bang budget spike and aligns spend to
              already-funded refresh cycles.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">
            The one published anchor — and how to build your own
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            <li>
              &bull; The only large-scale PQC migration cost figure published by an accountable body
              is the U.S. federal civilian estimate: <strong>$7.1B for 2025–2035</strong> (OMB,
              Report to Congress). It was built bottom-up from agency cryptographic inventories —
              which is why it is quotable and most vendor figures are not.
            </li>
            <li>
              &bull; Beware round numbers with no owner. Per-organization PQC program costs
              circulate widely (&ldquo;$2–5M for discovery&rdquo;, &ldquo;$300–500M for a global
              telco&rdquo;) and almost none of them trace to a published methodology. If you cannot
              name whose board approved a number, do not put it in front of yours.
            </li>
            <li>
              &bull; Derive your own instead: count the assets you actually have (certificates,
              HSMs, applications, third-party integrations), price one representative unit of each
              with your own vendors, and multiply. The Cost Model Explorer in Step 1 does this
              across six model families so you can see the spread rather than a single number.
            </li>
          </ul>
          <p className="text-[10px] text-muted-foreground mt-2">
            Present gross program cost and net <em>incremental</em> cost separately — much of the
            spend is modernization you needed anyway. And state which method produced each figure; a
            board can challenge a method, but it cannot challenge a number from nowhere.
          </p>
        </div>
      </div>
    </section>

    {/* Section 3d: Choosing a costing model + triangulation */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Calculator size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Choosing a Costing Model</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          No published methodology yet gives a reliable top-down total for a full PQC migration
          &mdash; the field has too few completed programs to calibrate against. The defensible move
          is to estimate the same program in <em>more than one way</em> and treat agreement between
          methods as confidence, and divergence as a signal to dig deeper. Six model families are in
          use &mdash; the workshop&apos;s Cost Model Explorer (Step 1) lets you watch them diverge
          on one scenario:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              t: 'Parametric / budget-anchored',
              d: 'Top-down: a share of IT or security budget, or a per-asset unit cost (per certificate, per HSM, per application). Fast sanity check on any bottom-up total.',
            },
            {
              t: 'Bottom-up activity-based',
              d: 'Sum costs per phase and per asset class. The U.S. federal estimate — $7.1B for 2025–2035 — was built this way, aggregating agency-level cryptographic inventories (OMB).',
            },
            {
              t: 'Probabilistic (Monte Carlo)',
              d: 'Put distributions on the uncertain drivers and simulate to a confidence band (P10/P50/P90) instead of a single number. Best where the drivers are genuinely uncertain and a single point estimate would be false precision.',
            },
            {
              t: 'Judgemental / scenario',
              d: 'Expert-elicited optimistic / expected / conservative columns. Cheap, honest about uncertainty, and legible to a board.',
            },
            {
              t: 'Analogical / historical',
              d: 'Calibrate against prior cryptographic transitions — SHA-1→SHA-2, TLS 1.3, Y2K — adjusting for PQC’s larger keys and longer-lived assets.',
            },
            {
              t: 'Risk / cost-of-inaction (ALE)',
              d: 'The benefit side: annualized loss expectancy (impact × likelihood) plus harvest-now-decrypt-later exposure scored by data longevity, sensitivity, and current crypto strength.',
            },
          ].map((c, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-0.5">{c.t}</div>
              <p className="text-[11px] text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 flex gap-3">
          <Scale size={20} className="text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-foreground mb-1">
              Triangulate &mdash; don&apos;t trust one number
            </div>
            <p className="text-xs text-foreground/90">
              Under deep uncertainty, cross-checking a bottom-up buildup against an independent
              second estimate is stronger than precision within any single method. The
              workshop&apos;s ROI Calculator does this for you: it reconciles your per-product
              estimate against an independent assessment-derived one and flags when the two disagree
              &mdash; still pair the result with your finance team&apos;s discounted-cash-flow model
              before committing capital.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">
            Timeline &amp; urgency anchors (authoritative)
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            <li>
              &bull; Full migration runs <strong>5–7 years (small)</strong>,{' '}
              <strong>8–12 (medium)</strong>, and <strong>12–15+ (large enterprises)</strong> —
              against a fault-tolerant quantum window of <strong>2028–2033</strong> (Campbell,{' '}
              <em>Computers</em> 2026, 15(1):9, peer-reviewed).
            </li>
            <li>
              &bull; <strong>Mosca&apos;s inequality (X + Y &gt; Z):</strong> if migration time (X)
              plus data secrecy shelf-life (Y) exceeds time-to-quantum (Z), you are already late —
              the arithmetic, not a Q-Day prediction, is what justifies starting now.
            </li>
            <li>
              &bull; The hardest cost driver is legacy systems with cryptography hardwired in
              hardware or firmware — the OMB report attributes a significant share of the federal
              total to replacing exactly those.
            </li>
          </ul>
        </div>
      </div>
    </section>

    {/* Section 3c: Benefit arguments beyond the urgency drivers */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-success/10">
          <TrendingUp size={24} className="text-success" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          Benefit Arguments That Strengthen the Case
        </h2>
      </div>
      <div className="space-y-3 text-sm text-foreground/80">
        <p>
          Beyond avoiding the two quantum risks, four arguments turn a defensive ask into a positive
          investment case:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              t: 'Immediate classical-security value',
              d: 'A quantum-focused inventory surfaces deprecated TLS, weak keys, expired certs, and CVE-laden libraries you can fix now — making the discovery spend self-funding on classical grounds alone.',
            },
            {
              t: 'Regulatory trust & approval acceleration',
              d: 'A documented CBOM, risk assessment, and roadmap signal proactive risk management to regulators and can smooth supervisory review of new products.',
            },
            {
              t: 'Competitive differentiation & market access',
              d: 'Quantum readiness is increasingly a procurement criterion; demonstrable PQC infrastructure wins bids that laggards cannot answer.',
            },
            {
              t: 'Talent attraction & retention',
              d: 'PQC and crypto-agility work is frontier engineering — a serious program is a recruiting and retention asset in a scarce-skills market.',
            },
          ].map((b, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-0.5">{b.t}</div>
              <p className="text-[11px] text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: Workshop + Resources + CTA ──────────────────────────────────────

const Step2WorkshopAndResources: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
    {/* Section 4: Workshop Preview */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Presentation size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Workshop: Build Your Business Case</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The workshop guides you through five steps to create a complete, data-driven PQC
          investment case:
        </p>
        <div className="space-y-2">
          {[
            {
              n: 1,
              t: 'Cost Model Explorer',
              d: 'See how the six costing models diverge on one scenario — build the instinct not to trust any single number.',
            },
            {
              n: 2,
              t: 'ROI Calculator',
              d: 'Score migration cost, breach avoidance, and compliance, then cross-check the total against your assessment.',
            },
            {
              n: 3,
              t: 'Breach Scenario Simulator',
              d: 'Model the financial impact of classical vs. quantum-enabled breaches with industry-specific cost data.',
            },
            {
              n: 4,
              t: 'Cost of Inaction',
              d: 'Quantify the compounding cost of delaying migration — breach risk, complexity premiums, and penalties over five years.',
            },
            {
              n: 5,
              t: 'Board Pitch Builder',
              d: 'Assemble a professional board memo, populated from the previous steps’ outputs.',
            },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-sm font-bold text-primary shrink-0 w-6 text-center">
                {step.n}
              </span>
              <div>
                <div className="text-sm font-medium text-foreground">{step.t}</div>
                <p className="text-xs text-muted-foreground">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Related Resources */}
    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/assess"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ClipboardCheck size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Risk Assessment</div>
            <div className="text-xs text-muted-foreground">
              Run a guided PQC readiness assessment to feed into your business case
            </div>
          </div>
        </Link>
        <Link
          to="/threats"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ShieldAlert size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Threat Landscape</div>
            <div className="text-xs text-muted-foreground">
              Explore industry-specific quantum threats and attack vectors
            </div>
          </div>
        </Link>
        <Link
          to="/compliance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Scale size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
            <div className="text-xs text-muted-foreground">
              Review PQC compliance deadlines and regulatory requirements
            </div>
          </div>
        </Link>
        <Link
          to="/migrate"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Building2 size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Migration Workbench</div>
            <div className="text-xs text-muted-foreground">
              Browse PQC-ready products to estimate migration costs
            </div>
          </div>
        </Link>
      </div>
    </section>

    {/* Related Modules */}
    <div className="glass-panel p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Related Modules</h3>
      <div className="flex flex-wrap gap-2">
        {[
          { path: '/learn/pqc-risk-management', label: 'PQC Risk Management' },
          { path: '/learn/migration-program', label: 'Migration Program' },
          { path: '/learn/vendor-risk', label: 'Vendor Risk' },
          { path: '/learn/compliance-strategy', label: 'Compliance Strategy' },
        ].map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 transition-colors"
          >
            <ArrowRight size={10} />
            {m.label}
          </Link>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div className="text-center">
      <Button
        variant="gradient"
        onClick={onNavigateToWorkshop}
        className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
      >
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Calculate ROI, model breach scenarios, and build a board-ready investment case.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      id: 'roi',
      label: 'Investment & Costs',
      content: <Step1WhyConceptsCosts />,
    },
    {
      id: 'board',
      label: 'Workshop & Resources',
      content: <Step2WorkshopAndResources onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
