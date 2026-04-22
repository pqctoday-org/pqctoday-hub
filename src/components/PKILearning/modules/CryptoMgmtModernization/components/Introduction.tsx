// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  AlarmClock,
  Layers,
  Boxes,
  Columns3,
  Repeat,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  FileBadge,
  BookOpen,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

const Quote: React.FC<{ cite: string; children: React.ReactNode }> = ({ cite, children }) => (
  <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
    <p className="text-sm text-foreground/90">{children}</p>
    <p className="text-xs text-muted-foreground mt-2">&mdash; {cite}</p>
  </div>
)

const StatCard: React.FC<{ label: string; value: string; note: string }> = ({
  label,
  value,
  note,
}) => (
  <div className="bg-muted/50 rounded-lg p-3 border border-border">
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-xs font-bold text-foreground mt-1">{label}</div>
    <p className="text-[11px] text-muted-foreground mt-1">{note}</p>
  </div>
)

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-8 w-full">
    {/* Section 1: Why Modernize Crypto Management Now */}
    <section id="why-now" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <AlarmClock size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Why Modernize Crypto Management Now</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Quantum-safe migration gets the headlines, but three forcing functions already bite every
          enterprise &mdash; whether a{' '}
          <InlineTooltip term="Cryptographically Relevant Quantum Computer">
            cryptographically relevant quantum computer
          </InlineTooltip>{' '}
          arrives in 2030 or never.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label="47-day TLS certs by 2029"
            value="47 d"
            note="CA/B Forum SC-081v3 (April 2025). Phased: 200d (2026) → 100d (2027) → 47d (March 2029). Manual CLM breaks mathematically at this cadence."
          />
          <StatCard
            label="$11–15M per cert outage"
            value="$15M"
            note="Ponemon/Venafi. 86% of organizations experienced a cert-related outage in the last 12 months."
          />
          <StatCard
            label="53% manual PKI"
            value="114k"
            note="Average enterprise manages 114k+ certificates; 53% still use manual or spreadsheet-based tracking (Ponemon 2026 Global PKI Trends)."
          />
        </div>
        <Quote cite="CA/B Forum Ballot SC-081v3, adopted April 2025">
          Publicly-trusted TLS certificate maximum validity reduces from 398 days to 200 days (from
          15 March 2026), 100 days (from 15 March 2027), and 47 days from 15 March 2029 &mdash; with
          domain control validation reuse capped at 10 days at the final stage.
        </Quote>
        <p>
          In parallel, <strong>FIPS 140-3 Level 3 validation drift</strong> creates a second
          continuous problem. The NIST CMVP Modules-in-Process queue runs 18–24 months; each library
          or HSM firmware patch can revoke a certificate; the September 2025 FIPS 140-3
          Implementation Guidance update retroactively imposed new{' '}
          <InlineTooltip term="Key Encapsulation Mechanism">KEM</InlineTooltip> self-test
          requirements on modules already validated. You cannot &ldquo;audit once&rdquo; and walk
          away.
        </p>
        <p className="text-sm">
          Layered on top: library EoL and CVE cadence (OpenSSL 1.1.1 EoL September 2023; Bouncy
          Castle high-severity CVEs every release cycle), OMB Memorandum M-23-02 mandating{' '}
          <strong>annual</strong> cryptographic-inventory submissions for US federal agencies
          through 2035, CNSA 2.0 deadlines for National Security Systems (2030/2033), and EU
          DORA/NIS2 mandating demonstrable cryptographic governance.
        </p>
      </div>
    </section>

    {/* Section 2: CPM vs Crypto-Agility vs CryptoCOE */}
    <section id="cpm-defined" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Layers size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">CPM vs Crypto-Agility vs CryptoCOE</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Vendors and analysts routinely conflate three distinct layers. The module carves them out
          up front so your next conversation with a product, a consultant, or your board is
          unambiguous.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted/60">
                <th className="text-left p-2 border-b border-border">Layer</th>
                <th className="text-left p-2 border-b border-border">Scope</th>
                <th className="text-left p-2 border-b border-border">Question it answers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-border">
                  <strong>Crypto-Agility</strong>
                  <div className="text-[10px] text-muted-foreground">
                    (
                    <Link to="/learn/crypto-agility" className="underline">
                      LM-007
                    </Link>
                    )
                  </div>
                </td>
                <td className="p-2 border-b border-border">
                  Technical capability: abstraction layers, protocol/provider swapping
                </td>
                <td className="p-2 border-b border-border">&ldquo;Can we change?&rdquo;</td>
              </tr>
              <tr className="bg-primary/5">
                <td className="p-2 border-b border-border">
                  <strong>Cryptographic Posture Management (CPM)</strong>
                  <div className="text-[10px] text-muted-foreground">(this module)</div>
                </td>
                <td className="p-2 border-b border-border">
                  Program: inventory · governance · lifecycle · observability · assurance
                </td>
                <td className="p-2 border-b border-border">
                  &ldquo;Do we know what we have, is it healthy, can we prove it?&rdquo;
                </td>
              </tr>
              <tr>
                <td className="p-2">
                  <strong>Cryptographic Center of Excellence (CryptoCOE)</strong>
                  <div className="text-[10px] text-muted-foreground">
                    (touched in{' '}
                    <Link to="/learn/pqc-governance" className="underline">
                      LM-037
                    </Link>
                    )
                  </div>
                </td>
                <td className="p-2">Operating model &mdash; RACI, ownership, skills</td>
                <td className="p-2">&ldquo;Who owns it?&rdquo;</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Quote cite="David Mahdi & Brian Lowans, Gartner (2023–2025)">
          By 2028, organizations that stand up a Cryptographic Center of Excellence and a formal
          posture management program will achieve approximately 50% lower total PQC transition cost
          than organizations that treat migration as a one-off project.
        </Quote>
      </div>
    </section>

    {/* Section 3: Four Asset Classes */}
    <section id="asset-classes" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <Boxes size={24} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Four Asset Classes, One Inventory</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A CPM program treats cryptography as four tightly-linked asset classes, each with its own
          discovery technique but rolled up under a single{' '}
          <InlineTooltip term="Cryptographic Bill of Materials">CBOM</InlineTooltip>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="font-bold text-primary mb-1">Certificates &amp; PKI</div>
            <p className="text-xs text-muted-foreground">
              Discovery via CT-log ingest, ACME/EST/CMP inventories, internal CA enumeration,
              passive TLS scanning. Lives mostly in the Lifecycle pillar (CLM).
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="font-bold text-secondary mb-1">Cryptographic Libraries</div>
            <p className="text-xs text-muted-foreground">
              OpenSSL, BoringSSL, liboqs, WolfSSL, Bouncy Castle, Mbed TLS. Discovery via SBOM
              ingestion (SPDX/CycloneDX), package-manager scanning, runtime attestation. Tracked
              against CMVP validation status, PQC support, and CVE feeds.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="font-bold text-accent mb-1">Application Software</div>
            <p className="text-xs text-muted-foreground">
              Source-code crypto usage patterns (regex/AST signatures for RSA, ECDSA, MD5, SHA-1,
              weak RNGs) and runtime protocol inventory. Complements library tracking by catching
              rolled-your-own crypto.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="font-bold text-status-warning mb-1">Key Material</div>
            <p className="text-xs text-muted-foreground">
              Keys, secrets, and HSM/KMS entries. CPM tracks inventory and policy enforcement;
              technical depth (hierarchies, KMIP, envelope encryption) stays in{' '}
              <Link to="/learn/kms-pqc" className="underline">
                LM-024 KMS &amp; PQC
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section 4: Five Pillars */}
    <section id="five-pillars" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-tertiary/10">
          <Columns3 size={24} className="text-tertiary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The Five Pillars of CPM</h2>
      </div>
      <div className="space-y-3 text-sm text-foreground/80">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">1. Inventory</div>
            <p className="text-[11px] text-muted-foreground">
              Unified CBOM across the four asset classes. Continuously refreshed, not point-in-time.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-secondary mb-1">2. Governance</div>
            <p className="text-[11px] text-muted-foreground">
              Policy, standards, exception handling, ownership. Detailed in{' '}
              <Link to="/learn/pqc-governance" className="underline">
                LM-037
              </Link>
              .
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-accent mb-1">3. Lifecycle (CLM)</div>
            <p className="text-[11px] text-muted-foreground">
              Provisioning → rotation → retirement. 47-day cert automation (ACME/EST/CMP),
              shadow-cert discovery, root rotation, revocation propagation.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-status-info mb-1">4. Observability</div>
            <p className="text-[11px] text-muted-foreground">
              Posture metrics, SIEM drift alerts, coverage trends. Feeds both loops of the iterative
              process.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-status-warning mb-1">5. Assurance (FIPS)</div>
            <p className="text-[11px] text-muted-foreground">
              Audit, attestation, CMVP validation tracking for libraries &amp; HSMs, ACVP
              re-certification, IG-delta compliance.
            </p>
          </div>
        </div>
        <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/30 mt-2">
          <div className="flex items-start gap-2">
            <FileBadge size={18} className="text-status-warning mt-0.5" />
            <div>
              <div className="font-bold text-foreground text-sm mb-1">
                FIPS 140-3 Level 3 tracking is a continuous program, not an audit
              </div>
              <p className="text-xs text-muted-foreground">
                Every library (OpenSSL FIPS provider, WolfCrypt FIPS, BC FIPS, BoringCrypto) and
                every HSM (Thales Luna, Entrust nShield, Utimaco, Fortanix, YubiHSM, AWS CloudHSM)
                carries a CMVP certificate that is bound to a specific version, firmware, and
                platform. The September 2025 FIPS 140-3 Implementation Guidance update added new
                self-test requirements for FIPS 203/204/205. A validation bound to a pre-update
                revision is no longer implicitly compliant. The Assurance pillar subscribes to CMVP
                change notices and flags drift within the same loop as CVE triage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Section 5: Dual-Loop Iterative Process */}
    <section id="dual-loop" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-status-info/15">
          <Repeat size={24} className="text-status-info" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The Dual-Loop Iterative Process</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>CPM is never &ldquo;done.&rdquo; It runs two nested loops at different cadences.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/30">
            <div className="font-bold text-primary mb-2">Strategic annual loop — PDCA</div>
            <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
              <li>
                <strong>Plan:</strong> set maturity target, refresh policy, approve budget
              </li>
              <li>
                <strong>Do:</strong> execute initiatives (library upgrades, CA rotation, HSM
                firmware)
              </li>
              <li>
                <strong>Check:</strong> re-run the maturity self-assessment, review KPI trends
              </li>
              <li>
                <strong>Act:</strong> board attestation, adjust policy and budget for next cycle
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-accent/30">
            <div className="font-bold text-accent mb-2">Operational continuous loop — 6 stages</div>
            <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
              <li>
                <strong>Discover</strong> &mdash; scanners, CT logs, SBOMs, runtime agents
              </li>
              <li>
                <strong>Classify</strong> &mdash; HNDL sensitivity, FIPS/CNSA scope, compliance tags
              </li>
              <li>
                <strong>Score</strong> &mdash; risk weighting, policy-drift flags
              </li>
              <li>
                <strong>Remediate</strong> &mdash; tickets, automated rotation, migration PRs
              </li>
              <li>
                <strong>Attest</strong> &mdash; CMVP cert check, ACME renewal proof, audit evidence
              </li>
              <li>
                <strong>Reassess</strong> &mdash; re-discover, measure MTTR reduction, feed next
                iteration
              </li>
            </ul>
          </div>
        </div>
        <Quote cite="CISA, Strategy for Migrating to Automated PQC Discovery and Inventory Tools (Sep 2024)">
          Cryptographic inventory is a foundational, continuous activity &mdash; not a one-time
          project. Agencies should prioritize automated discovery capabilities that can run
          alongside existing vulnerability-management workflows.
        </Quote>
        <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
          <div className="text-xs font-bold text-accent mb-1">Canonical worked examples</div>
          <p className="text-xs text-muted-foreground">
            <strong>CLM quarterly review:</strong> shadow-cert count trend, % certs auto-renewed,
            root-CA rotation readiness, 47-day-cadence simulation. <br />
            <strong>FIPS monthly monitor:</strong> CMVP validation status diff, ACVP re-cert
            backlog, IG-update applicability check, MIP-queue tracking.
          </p>
        </div>
      </div>
    </section>

    {/* Section 6: No-Regret ROI */}
    <section id="no-regret-roi" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-status-success/15">
          <TrendingUp size={24} className="text-status-success" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The No-Regret ROI</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Five benefit streams pay off independently of whether CRQC arrives in 2030, 2040, or
          never.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-success">Outage avoidance</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              $11–15M per cert-expiry event &times; 86% annual incidence (Ponemon/Venafi).
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-success">CLM automation</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              312% ROI, $10.1M NPV (Forrester TEI, DigiCert-commissioned).
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-success">FIPS assurance</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Avoided re-validation cost, preserved eligibility for federal/regulated contracts.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-success">Library CVE response</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Faster detect → patch → attest cycles reduce exposure windows.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-success">Time-to-market / M&amp;A</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Unified crypto policy accelerates product launches and acquisition integration.
            </p>
          </div>
        </div>
        <Quote cite="Forrester Total Economic Impact of TLS/SSL Certificate Lifecycle Automation (2024)">
          A composite organization modeled on interviewed customers realized 312% ROI and $10.1M NPV
          over three years from automating certificate lifecycle management &mdash; with the
          dominant value drivers being avoided outages, reduced mean-time-to-recovery, and reclaimed
          engineering time.
        </Quote>
        <Quote cite="Ponemon Institute / Entrust, 2026 Global PKI &amp; IoT Trends Study">
          The average enterprise manages 114,000 publicly-trusted and internal certificates. 86%
          experienced at least one cert-related outage in the last 12 months. 53% still rely on
          manual spreadsheets or home-grown tools for PKI management &mdash; an operating model
          incompatible with a 47-day maximum validity window.
        </Quote>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="gradient"
            onClick={onNavigateToWorkshop}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
          >
            Start the Workshop <ArrowRight size={16} className="inline ml-1" />
          </Button>
          <Link
            to="/learn/pqc-business-case"
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center gap-2 text-foreground"
          >
            <BookOpen size={16} />
            Pair with the Business Case module (LM-036)
          </Link>
        </div>
      </div>
    </section>

    {/* Footer cross-links */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldCheck size={20} className="text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground">Where this module sits</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Pair CMM with{' '}
        <Link to="/learn/crypto-agility" className="underline">
          Crypto Agility (LM-007)
        </Link>{' '}
        for the technical swap-ability side,{' '}
        <Link to="/learn/pqc-governance" className="underline">
          PQC Governance (LM-037)
        </Link>{' '}
        for the operating model,{' '}
        <Link to="/learn/kms-pqc" className="underline">
          KMS &amp; PQC (LM-024)
        </Link>{' '}
        for key technical depth, and{' '}
        <Link to="/learn/pqc-business-case" className="underline">
          Business Case (LM-036)
        </Link>{' '}
        for quantum-dependent ROI modeling.
      </p>
    </section>
  </div>
)
