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
  Network,
  AlertCircle,
  Users,
  FlaskConical,
  HardDrive,
  Package,
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
      <div data-section-id="why-now" className="flex items-center gap-3 mb-4 scroll-mt-20">
        <div className="p-2 rounded-lg bg-primary/10">
          <AlarmClock size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Why Modernize Crypto Management Now</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Quantum-safe migration gets the headlines, but four compounding forcing functions &mdash;
          one per crypto asset class &mdash; already bite every enterprise, whether a{' '}
          <InlineTooltip term="Cryptographically Relevant Quantum Computer">
            cryptographically relevant quantum computer
          </InlineTooltip>{' '}
          arrives in 2030 or never. Certificates, libraries, application software, and key material
          each have their own deadline; managing one without the others leaves the chain weakest at
          the unmanaged class.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Certificates & PKI — 47-day TLS by 2029"
            value="47 d"
            note="CA/B Forum SC-081v3 (April 2025). Phased: 200d (2026) → 100d (2027) → 47d (March 2029). Manual CLM breaks mathematically at this cadence."
          />
          <StatCard
            label="Crypto Libraries — FIPS 140-3 CMVP queue"
            value="18–24 mo"
            note="NIST CMVP Modules-in-Process queue length. OpenSSL 1.1.1 EoL Sept 2023; Bouncy Castle high-severity CVEs each release cycle. Re-validation outpaces fixes."
          />
          <StatCard
            label="Application Software — OMB M-23-02 inventory"
            value="Annual"
            note="US federal agencies must submit a prioritized cryptographic inventory of high-impact systems and HVAs annually through 2035 (M-23-02 §II.A, Nov 2022)."
          />
          <StatCard
            label="Key Material — CNSA 2.0 deadlines"
            value="2030 / 2033"
            note="National Security Systems must use CNSA 2.0 algorithms in software/firmware signing by 2030 and broadly by 2033 (CSA/NSA CNSA 2.0). HSM/KMS rekey lead times measured in years."
          />
        </div>
        <Quote cite="NIST CSWP.39 §5, Considerations for Achieving Crypto Agility (December 2025)">
          Inventory the use of cryptography for data protection across the organization by adopting
          an assets-centric approach &hellip; to identify the organization&rsquo;s use cases and
          most valuable assets,{' '}
          <strong>such as application codes, libraries, software, hardware, firmware</strong>,
          user-generated content, communication protocols, enterprise services, and systems.
        </Quote>
        <p>
          The four classes compound. A pristine certificate inventory does not save you when the
          underlying library is stuck in the CMVP queue; an upgraded library does not help if the
          application still calls a deprecated API; a clean codebase still fails audit if the keys
          it consumes live in an HSM that cannot rotate fast enough. Each driver below is already in
          force today.
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 text-sm">
          <li>
            <strong>Certificates &amp; PKI</strong> &mdash; the 47-day cadence is mathematically
            incompatible with manual CLM; cert-related outages cost $11&ndash;15M per incident
            (Ponemon/Venafi) and 86% of organizations hit one in the last 12 months. Average
            enterprise manages 114k+ certificates with 53% still on spreadsheets (Ponemon 2026
            Global PKI Trends).
          </li>
          <li>
            <strong>Crypto Libraries</strong> &mdash; the NIST CMVP Modules-in-Process queue runs
            18&ndash;24 months, and the September 2025 FIPS 140-3 Implementation Guidance
            retroactively imposed new{' '}
            <InlineTooltip term="Key Encapsulation Mechanism">KEM</InlineTooltip> self-test
            requirements on modules already validated. You cannot &ldquo;audit once&rdquo; and walk
            away while OpenSSL and Bouncy Castle ship high-severity CVEs each release cycle.
          </li>
          <li>
            <strong>Application Software</strong> &mdash; OMB Memorandum M-23-02 mandates{' '}
            <strong>annual</strong> cryptographic-inventory submissions for US federal agencies
            through 2035, and EU DORA (Art. 9 &mdash; ICT risk management) and NIS2 (Art. 21 &mdash;
            cybersecurity measures) demand demonstrable cryptographic governance across the entire
            application portfolio &mdash; not just the TLS edge.
          </li>
          <li>
            <strong>Key Material</strong> &mdash; CNSA 2.0 forces HSM and KMS roadmaps now (2030 for
            software/firmware signing, 2033 broadly); NIST SP 800-57 Pt 1 Rev 6 key-validity periods
            drive rekey cadence; and orphaned keys, secrets-in-repo, and unrotated service
            credentials remain a top breach vector.
          </li>
        </ul>
      </div>
    </section>

    {/* Section 1b: CSWP.39 Crypto Agility Strategic Plan */}
    <section id="cswp39-plan" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-status-info/10">
          <Repeat size={24} className="text-status-info" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          NIST CSWP.39 — The Crypto Agility Strategic Plan
        </h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          NIST CSWP.39 (December 2025, <em>Considerations for Achieving Crypto Agility</em>) defines
          the <strong>Crypto Agility Strategic Plan</strong> as a continuously repeated five-step
          process. CPM is the organisational discipline that executes this loop.
        </p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>
            <strong>Govern</strong> — embed crypto policy into standards, mandates, technology
            supply chains, threats, processes, business requirements, partner ecosystem,
            stakeholders, crypto policies, and crypto architecture.
          </li>
          <li>
            <strong>Inventory</strong> — build an asset-centric CBOM across Code, Libraries,
            Applications, Files, Protocols, and Systems.
          </li>
          <li>
            <strong>Identify Gaps</strong> — audit Management Tools for discovery, assessment,
            configuration, and enforcement coverage.
          </li>
          <li>
            <strong>Prioritise</strong> — run a Risk Analysis Prioritisation Engine informed by
            crypto policy to produce a ranked asset list and KPIs.
          </li>
          <li>
            <strong>Implement</strong> — execute <em>Mitigation</em> (compensating controls / crypto
            gateway) or <em>Migration</em> (algorithm replacement) based on each asset&apos;s
            agility level.
          </li>
        </ol>
        <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/30">
          <div className="flex items-start gap-2">
            <ArrowRight size={16} className="text-status-info mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              See the <strong>Visual tab</strong> for an interactive diagram of the full CSWP.39
              Fig. 3 framework — click any zone to see what belongs there, which CPM pillar it maps
              to, and the relevant CSWP.39 section.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Source: NIST CSWP.39, December 2025
        </p>
      </div>
    </section>

    {/* Section 1c: Management Tools Layer */}
    <section id="management-tools" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Network size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The Management Tools Layer</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          CSWP.39 places a <strong>Management Tools</strong> layer between the asset inventory and
          the Risk Analysis Engine. Without automation at this layer, the Information Repository is
          populated manually and the risk engine operates on incomplete, stale data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              name: 'Crypto scanners',
              detail: 'Detect algorithms, key lengths, cert details across code and traffic.',
              pillar: 'Inventory + Observability',
            },
            {
              name: 'Vulnerability management',
              detail: 'CVE feeds, crypto library EoL tracking, CMVP historical-cert alerts.',
              pillar: 'Assurance',
            },
            {
              name: 'Asset management (CMDB/SBOM)',
              detail: 'SBOM → CBOM pipelines feed the Information Repository automatically.',
              pillar: 'Inventory',
            },
            {
              name: 'Log management (SIEM)',
              detail: 'Detect crypto-drift events and cipher-suite anomalies in real time.',
              pillar: 'Observability',
            },
            {
              name: 'Zero-Trust enforcement',
              detail: 'Policy engines that block disallowed cipher suites at the network layer.',
              pillar: 'Governance',
            },
            {
              name: 'Data classification scanners',
              detail: 'Classify data assets by sensitivity; drive inventory prioritisation.',
              pillar: 'Inventory',
            },
          ].map(({ name, detail, pillar }) => (
            <div key={name} className="bg-muted/40 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">{name}</div>
              <p className="text-[11px] text-muted-foreground">{detail}</p>
              <div className="mt-1 text-[10px] text-primary font-medium">CPM pillar: {pillar}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Section 1d: CSWP.39 Maturity Tiers */}
    <section id="cswp39-maturity" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <TrendingUp size={24} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-gradient">CSWP.39 Crypto Agility Maturity Tiers</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          CSWP.39 §6.5 defines a 4-tier maturity model derived from the NIST Cybersecurity Framework
          (CSF). The Workshop&apos;s Maturity Self-Assessment maps your CPM score to the
          corresponding CSWP.39 tier automatically.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted/60">
                <th className="text-left p-2 border-b border-border">CSWP.39 Tier</th>
                <th className="text-left p-2 border-b border-border">CPM Tier</th>
                <th className="text-left p-2 border-b border-border">Characteristics</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-border font-bold">Tier 1 — Partial</td>
                <td className="p-2 border-b border-border text-muted-foreground">L1 · Partial</td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  Crypto practices unstructured; teams pick their own algorithms; no formal policy;
                  supply-chain crypto risks unknown.
                </td>
              </tr>
              <tr className="bg-muted/20">
                <td className="p-2 border-b border-border font-bold">Tier 2 — Risk-Informed</td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  L2 · Risk-Informed
                </td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  Management-approved crypto policy exists but not organisation-wide; crypto
                  architecture being developed; risk assessments drive prioritisation.
                </td>
              </tr>
              <tr>
                <td className="p-2 border-b border-border font-bold">Tier 3 — Repeatable</td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  L3 · Repeatable
                </td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  Crypto agility formally integrated into risk management; roles defined; automated
                  discovery and remediation tools deployed; agility practices tested.
                </td>
              </tr>
              <tr className="bg-muted/20">
                <td className="p-2 font-bold">Tier 4 — Adaptive</td>
                <td className="p-2 text-muted-foreground">L4 · Adaptive</td>
                <td className="p-2 text-muted-foreground">
                  Crypto agility measured and reported to executives; linked to financial and
                  mission objectives; policies updated in near-real-time as standards and threats
                  evolve.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    {/* Section 2: CPM vs Crypto-Agility vs CryptoCOE */}
    <section id="cpm-defined" className="glass-panel p-6">
      <div data-section-id="cpm-defined" className="flex items-center gap-3 mb-4 scroll-mt-20">
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
      <div data-section-id="asset-classes" className="flex items-center gap-3 mb-4 scroll-mt-20">
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
      <div data-section-id="five-pillars" className="flex items-center gap-3 mb-4 scroll-mt-20">
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
        <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/30 mt-2">
          <div className="flex items-start gap-2">
            <ShieldCheck size={18} className="text-status-info mt-0.5" />
            <div>
              <div className="font-bold text-foreground text-sm mb-1">
                SP 800-90B ESV — the parallel CMVP track most programs miss
              </div>
              <p className="text-xs text-muted-foreground">
                A FIPS 140-3 algorithm certificate and an SP 800-90B Entropy Source Validation (ESV)
                certificate are two separate CMVP submissions. A library or HSM can hold a valid
                FIPS 140-3 certificate while its entropy source has never been independently
                validated. PQC migration is the natural moment to close this gap: PQC algorithms
                (ML-KEM, ML-DSA) require higher-quality randomness and demand an auditable chain
                from validated entropy source through conditioning to the approved DRBG.
                Infrastructure migrations &mdash; cloud lift-and-shift, containerization, VM
                consolidation &mdash; are also ESV re-evaluation triggers, since they alter the
                entropy pool available to the OS and can silently degrade seed quality. The
                Assurance pillar CBOM should carry an ESV status field alongside the FIPS 140-3
                validation field, and the remediation workflow must distinguish algorithm
                re-validation from entropy source re-validation, as timelines and responsible
                vendors differ.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                The SP 800-90 suite itself is a living document: NIST revises SP 800-90A (DRBG
                constructions), SP 800-90B (entropy source requirements), and SP 800-90C (RBG
                construction) independently and on different schedules. Each revision can retire
                approved mechanisms, tighten minimum-entropy thresholds, or impose new health-test
                requirements. An ESV certificate bound to an earlier revision of SP 800-90B is not
                automatically compliant with a subsequent one. The same CMVP change-notice
                subscription that tracks FIPS 140-3 Implementation Guidance updates must also track
                SP 800-90A/B/C revision publications and their effective dates. When a revision is
                issued, the CBOM workflow should trigger an impact assessment: which validated
                entropy sources are bound to the superseded revision, which require re-testing under
                the new thresholds, and which vendor roadmaps commit to updated ESV submissions.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {' '}
                <Link to="/learn/entropy-randomness" className="underline">
                  Entropy &amp; Randomness (LM-009)
                </Link>{' '}
                covers the technical depth; the CMM process obligation is to track and close the
                status gap.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/30 mt-2">
          <div className="flex items-start gap-2">
            <Network size={18} className="text-status-warning mt-0.5" />
            <div>
              <div className="font-bold text-foreground text-sm mb-1">
                Protocol standards and cipher deprecation — a continuous tracking obligation
              </div>
              <p className="text-xs text-muted-foreground">
                The cryptographic posture of an organization is not defined by libraries and
                certificates alone. Every protocol version and cipher suite negotiated on the wire
                is a posture element: TLS 1.0/1.1 deprecated by{' '}
                <span className="text-xs text-muted-foreground">(IETF)</span> RFC 8996, 3DES sunset
                by <span className="text-xs text-muted-foreground">(NIST)</span> SP 800-131A Rev 2,
                SHA-1 code-signing banned by CA/B Forum, RSA-1024 below NIST minimum-security
                thresholds, RC4 prohibited by{' '}
                <span className="text-xs text-muted-foreground">(IETF)</span> RFC 7465. Each of
                these was a standards-body decision published on a specific date with a specific
                effective date — and organizations that had no process to track standards-body
                publications discovered the gap only when auditors or scanners flagged live
                endpoints still negotiating deprecated suites.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                The CMM Assurance pillar must maintain a{' '}
                <strong>standards-watch subscription</strong> across the relevant bodies: IETF RFC
                Obsoletes/Updates, NIST SP 800-131A revision cycle, NSA CNSA suite announcements,
                CA/B Forum ballot outcomes, ETSI TS 119 312, BSI TR-02102, and ANSSI RGS. When a
                deprecation notice is published, the CBOM classification rules must be updated to
                flag the newly prohibited primitive, and the operational loop must trigger a
                discovery scan for affected endpoints, libraries, and application cipher-suite
                configurations. Remediation is not limited to patching a library version — it
                includes reconfiguring cipher-suite preference lists in TLS termination points, SSH
                server policies, IKEv2 proposals, and code-signing pipeline configurations, each of
                which may have separate ownership and change-management tracks.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                The Observability pillar closes the loop: continuous protocol-version and
                cipher-suite scanning (passive TLS inspection, SSH banner collection, IKE proposal
                enumeration) ensures that deprecated primitives do not re-appear after routine
                infrastructure refreshes. A deprecation remediation that is not covered by ongoing
                detection is not a remediation — it is a point-in-time fix waiting to regress.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/30 mt-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-status-error mt-0.5" />
            <div>
              <div className="font-bold text-foreground text-sm mb-1">
                CVE management for crypto resources — three compounding constraints
              </div>
              <p className="text-xs text-muted-foreground">
                Crypto library CVEs introduce a constraint that generic vulnerability management
                does not encounter: <strong>patch-then-revalidate bind.</strong> Patching OpenSSL
                from 3.4.x to 3.5.x closes a CVE but also bumps the library version off the CMVP
                validated list. The security team receives a green CVE status; the compliance team
                is simultaneously looking at a red FIPS status. Both are correct at the same time.
                The remediation workflow must treat these as two separate work items with separate
                timelines, and the CBOM must carry a &ldquo;patch applied, revalidation in
                progress&rdquo; state that is distinct from both &ldquo;vulnerable&rdquo; and
                &ldquo;validated.&rdquo;
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                For HSM firmware CVEs, the constraint is even harder: the validated firmware
                revision is chosen by the vendor, not the customer. Vendor-controlled CMVP
                re-validation timelines run 6–18 months from CVE disclosure to a validated firmware
                release appearing on the CMVP active list{' '}
                <span className="text-xs text-muted-foreground">
                  (NIST CMVP MIP List; observed range across HSM vendor re-submissions)
                </span>
                . During that window, the organization&apos;s options are limited to residual-risk
                acceptance, compensating controls, or emergency procurement of an alternate
                validated module. This window must be tracked explicitly in the Assurance pillar,
                not assumed away because the vendor has acknowledged the CVE.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                The third constraint is detection prerequisite: you cannot triage a crypto CVE
                against components you have not enumerated. An OpenSSL 3.1.x CVE published on a
                Thursday morning requires knowing, within hours, which services in production are
                running a 3.1.x build. If CBOM completeness is below 80%, a significant fraction of
                the affected surface is invisible until discovered manually. CBOM completeness
                directly gates crypto CVE mean-time-to-detect and is therefore a security metric,
                not just a compliance metric.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Section 5: Dual-Loop Iterative Process */}
    <section id="dual-loop" className="glass-panel p-6">
      <div data-section-id="dual-loop" className="flex items-center gap-3 mb-4 scroll-mt-20">
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
      <div data-section-id="no-regret-roi" className="flex items-center gap-3 mb-4 scroll-mt-20">
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
              ~$11M per cert-expiry event &times; 86% annual incidence (Entrust/Ponemon 2024 PKI
              &amp; PQC Trends Study).
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-status-success">CLM automation</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              312% ROI, $10.1M NPV over 3 years (Forrester TEI of DigiCert ONE, July 2025).
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
        <Quote cite="Forrester Total Economic Impact of DigiCert ONE (July 2025), commissioned by DigiCert">
          A composite organization modeled on interviewed DigiCert ONE customers realized 312% ROI
          and $10.1M NPV over three years &mdash; with $7.9M in labor savings, $2.8M from reduced
          security incidents, and $2.83M in revenue and efficiency gains. Treat as upper-bound
          benchmark for a specific product, not a guaranteed outcome for any CLM platform.
        </Quote>
        <Quote cite="Entrust / Ponemon Institute, 2024 Global PKI &amp; PQC Trends Study">
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

    {/* Section 7: Program Office Model */}
    <section id="program-office" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Users size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Program Office Model — Who Runs CPM</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A CPM program stalls when it is owned by nobody or owned by everyone. The five roles below
          map to pillar ownership; headcount scales with organizational complexity.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted/60">
                <th className="text-left p-2 border-b border-border">Role</th>
                <th className="text-left p-2 border-b border-border">Pillar ownership</th>
                <th className="text-left p-2 border-b border-border">FTE — small / mid / large</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-2 font-bold">Crypto Program Manager</td>
                <td className="p-2">All pillars (program owner)</td>
                <td className="p-2">0.5 / 1 / 2</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-2 font-bold">FIPS / CMVP Engineer</td>
                <td className="p-2">Assurance</td>
                <td className="p-2">0.5 / 1 / 2–3</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2 font-bold">CLM Architect</td>
                <td className="p-2">Lifecycle</td>
                <td className="p-2">0.5 / 1 / 2</td>
              </tr>
              <tr className="border-b border-border bg-muted/20">
                <td className="p-2 font-bold">Crypto Developer Champion</td>
                <td className="p-2">Inventory + Governance</td>
                <td className="p-2">0 / 1 per BU / 1 per BU</td>
              </tr>
              <tr>
                <td className="p-2 font-bold">Supplier Crypto Risk Analyst</td>
                <td className="p-2">Governance + Observability</td>
                <td className="p-2">0.25 / 0.5 / 1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <div className="text-xs font-bold text-foreground mb-2">RACI — Pillars × Roles</div>
          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted/60">
                <th className="text-left p-2 border-b border-border">Pillar</th>
                <th className="p-2 border-b border-border text-center">Crypto PM</th>
                <th className="p-2 border-b border-border text-center">FIPS Eng.</th>
                <th className="p-2 border-b border-border text-center">CLM Arch.</th>
                <th className="p-2 border-b border-border text-center">Dev Champion</th>
                <th className="p-2 border-b border-border text-center">Supplier Analyst</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Inventory', 'A', 'C', 'C', 'R', 'I'],
                ['Governance', 'R/A', 'C', 'C', 'C', 'R'],
                ['Lifecycle (CLM)', 'A', 'C', 'R', 'C', 'I'],
                ['Observability', 'A', 'C', 'R', 'I', 'R'],
                ['Assurance (FIPS)', 'A', 'R', 'C', 'I', 'C'],
              ].map(([pillar, ...cells]) => (
                <tr key={pillar} className="border-b border-border last:border-0">
                  <td className="p-2 font-bold">{pillar}</td>
                  {cells.map((c, i) => (
                    <td key={i} className="p-2 text-center text-muted-foreground">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-1">
            R = Responsible · A = Accountable · C = Consulted · I = Informed
          </p>
        </div>

        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="text-xs font-bold text-foreground mb-2">
            Skills gap — 6 competency domains
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              [
                'FIPS / CMVP process',
                'Understanding CMVP submission, IG updates, MIP queue management',
              ],
              [
                'CLM tooling',
                'ACME/EST/CMP protocols, CA integration, EJBCA / Keyfactor / Venafi API depth',
              ],
              [
                'CBOM tooling',
                'SBOM generation (Syft, cdxgen), CycloneDX enrichment, inventory pipeline',
              ],
              [
                'PQC algorithms',
                'ML-KEM, ML-DSA, SLH-DSA parameter sets, hybrid construction tradeoffs',
              ],
              [
                'Vendor negotiation — HSM firmware',
                'Reading CMVP cert scope, firmware upgrade impact analysis, re-validation timelines',
              ],
              [
                'Regulatory mapping',
                'OMB M-23-02, CNSA 2.0, DORA Art. 9, NIS2 — mapping requirements to CPM pillar actions',
              ],
            ].map(([domain, detail]) => (
              <div key={domain} className="text-xs">
                <div className="font-bold text-foreground">{domain}</div>
                <p className="text-[11px] text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Section 8: Pre-Deployment Lab Blueprint */}
    <section id="lab-blueprint" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <FlaskConical size={24} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Pre-Deployment Lab Blueprint</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Crypto changes — library upgrades, HSM firmware, CA rotation, cipher-suite reconfiguration
          — must be validated in an isolated environment before touching production. The lab below
          is the minimum viable configuration; scale it to your risk profile.
        </p>

        <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/30">
          <div className="flex items-start gap-2">
            <HardDrive size={18} className="text-status-warning mt-0.5" />
            <div>
              <div className="font-bold text-foreground text-sm mb-2">Hardware requirements</div>
              <ul className="text-xs space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>
                  <strong>1× FIPS 140-3 L3 network-attached HSM</strong> — Thales Luna Network HSM 7
                  or Entrust nShield 5c recommended for PQC boundary coverage. Used for key
                  generation, signing, and firmware-upgrade testing under lab conditions.
                </li>
                <li>
                  <strong>1× TLS termination appliance or isolated VM</strong> (nginx / HAProxy) —
                  for cipher-suite configuration testing and protocol-version enforcement
                  validation.
                </li>
                <li>
                  <strong>1× network tap / span port</strong> — passive TLS handshake capture for
                  cipher-suite enumeration (nmap, sslyze, testssl.sh). Verifies what the stack
                  actually negotiates vs. what was configured.
                </li>
                <li>
                  <strong>Optional:</strong> smart card / USB token (FIPS L4 boundary testing),
                  representative IoT/embedded device sample for constrained-env library validation.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-status-info/10 rounded-lg p-4 border border-status-info/30">
          <div className="flex items-start gap-2">
            <Package size={18} className="text-status-info mt-0.5" />
            <div>
              <div className="font-bold text-foreground text-sm mb-2">Software stack</div>
              <ul className="text-xs space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>
                  <strong>FIPS-validated library build</strong> — OpenSSL 3.5 FIPS provider or
                  wolfCrypt FIPS, compiled and installed in a clean isolated test environment
                  (separate from the OS package manager&apos;s OpenSSL).
                </li>
                <li>
                  <strong>ACVP client + NIST demo server</strong> — run NIST&apos;s ACVP demo
                  endpoint for algorithm self-test before and after any library or HSM firmware
                  change. Produces evidence artifacts for the Assurance pillar.
                </li>
                <li>
                  <strong>Certificate scanner</strong> — Keyfactor Discovery, Venafi TLC scanner, or
                  open-source tooling (crt.sh lookups + custom scripts) for shadow-cert discovery in
                  the lab network.
                </li>
                <li>
                  <strong>SBOM generator → CBOM enrichment pipeline</strong> — Syft or cdxgen
                  generates CycloneDX SBOM; enrichment maps crypto components to CMVP status and PQC
                  readiness.
                </li>
                <li>
                  <strong>Separate test CA hierarchy</strong> — never share roots with production.
                  Document expiry of all test CA certs; include them in the lab CBOM.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="font-bold text-foreground text-sm mb-2">Lab isolation requirements</div>
          <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
            <li>
              VLAN-segregated from production; no direct internet routing (proxy only for NIST/CMVP
              lookups).
            </li>
            <li>HSM partition separate from any production HSM tenant; use dedicated lab slots.</li>
            <li>
              Lab credentials must not be usable in production; separate PKI roots enforces this
              structurally.
            </li>
          </ul>
        </div>

        <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
          <div className="font-bold text-foreground text-sm mb-2">
            Lab-to-prod promotion workflow — required evidence per change type
          </div>
          <ol className="text-xs space-y-2 text-muted-foreground list-decimal list-inside">
            <li>
              <strong>Cipher-suite / protocol-version change:</strong> cipher-suite scan clean (all
              endpoints negotiate approved suites), testssl.sh report attached, no deprecated
              protocol negotiated.
            </li>
            <li>
              <strong>Library upgrade:</strong> CMVP cert number verified active on csrc.nist.gov
              for the new version; ACVP run results attached; CVE scan clean on the new version.
            </li>
            <li>
              <strong>HSM firmware upgrade:</strong> new firmware hash verified against vendor
              security advisory; CMVP cert number for the upgraded firmware confirmed active (not
              historical); HSM self-test passed; ACVP evidence re-run if algorithm set changed.
            </li>
            <li>
              <strong>CA rotation (intermediate or root):</strong> test CA hierarchy created, all
              relying-party systems updated and re-tested, CRL/OCSP propagation verified, expiry of
              new certs entered in CLM system.
            </li>
            <li>
              <strong>Protocol deprecation rollout:</strong> all endpoints in scope confirmed
              non-negotiating of deprecated protocol by passive scan; rollback procedure documented
              and tested; SIEM drift-alert rule updated for the new policy baseline.
            </li>
          </ol>
        </div>
      </div>
    </section>

    {/* Section: Maturity Model Cross-Walk */}
    <section id="maturity-comparison" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Columns3 size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">PQC Maturity Models — Cross-Walk</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Four frameworks independently converge on the same progression arc — from unstructured,
          ad-hoc crypto practices to continuous, executive-reported quantum readiness. The table
          aligns them by readiness band so you can map your organization across models used by
          different stakeholders and regulators.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted/60">
                <th className="text-left p-2 border-b border-border">Band</th>
                <th className="text-left p-2 border-b border-border text-primary">
                  CSWP.39 (4 tiers)
                </th>
                <th className="text-left p-2 border-b border-border text-accent">
                  Meta PQC Levels (5)
                </th>
                <th className="text-left p-2 border-b border-border">CMMI (5 levels)</th>
                <th className="text-left p-2 border-b border-border text-secondary">
                  ENISA / NCCoE (5 stages)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-border font-medium text-muted-foreground">
                  No awareness
                </td>
                <td className="p-2 border-b border-border font-bold">Tier 1 · Partial</td>
                <td className="p-2 border-b border-border">PQ-Unaware</td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  Level 1 · Initial
                </td>
                <td className="p-2 border-b border-border text-muted-foreground">1 · Awareness</td>
              </tr>
              <tr className="bg-muted/20">
                <td className="p-2 border-b border-border font-medium text-muted-foreground">
                  Threat recognized
                </td>
                <td className="p-2 border-b border-border font-bold">Tier 1 · Partial</td>
                <td className="p-2 border-b border-border">PQ-Aware</td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  Level 2 · Managed
                </td>
                <td className="p-2 border-b border-border text-muted-foreground">2 · Assessment</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-border font-medium text-muted-foreground">
                  Policy &amp; design
                </td>
                <td className="p-2 border-b border-border font-bold">Tier 2 · Risk-Informed</td>
                <td className="p-2 border-b border-border">PQ-Ready</td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  Level 3 · Defined
                </td>
                <td className="p-2 border-b border-border text-muted-foreground">3 · Planning</td>
              </tr>
              <tr className="bg-muted/20">
                <td className="p-2 border-b border-border font-medium text-muted-foreground">
                  Tools deployed
                </td>
                <td className="p-2 border-b border-border font-bold">Tier 3 · Repeatable</td>
                <td className="p-2 border-b border-border">PQ-Hardened</td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  Level 4 · Quantitatively Managed
                </td>
                <td className="p-2 border-b border-border text-muted-foreground">
                  4 · Implementation
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-muted-foreground">Continuous</td>
                <td className="p-2 font-bold">Tier 4 · Adaptive</td>
                <td className="p-2">PQ-Enabled</td>
                <td className="p-2 text-muted-foreground">Level 5 · Optimizing</td>
                <td className="p-2 text-muted-foreground">5 · Operations</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="font-bold text-foreground mb-1">Scale difference</div>
            <p className="text-muted-foreground">
              CSWP.39 uses 4 tiers — this module&apos;s native scale. Meta, CMMI, and ENISA/NCCoE
              use 5 levels. CSWP.39 Tier 1 spans two Meta levels (PQ-Unaware and PQ-Aware) because
              the spec treats both as &ldquo;Partial&rdquo; practice.
            </p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="font-bold text-foreground mb-1">Focus difference</div>
            <p className="text-muted-foreground">
              Meta&apos;s model is outcome-focused (is PQC actually running?). CSWP.39 is
              process-maturity focused (are practices repeatable?). CMMI is process-capability
              focused. ENISA/NCCoE is project-phase focused.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section: Further Reading */}
    <section id="further-reading" className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <BookOpen size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Further Reading &amp; Case Studies</h2>
      </div>
      <div className="space-y-3">
        <a
          href="https://engineering.fb.com/2026/04/16/security/post-quantum-cryptography-migration-at-meta-framework-lessons-and-takeaways/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 bg-muted/40 rounded-lg p-4 border border-border hover:border-primary/40 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-accent/10 shrink-0">
            <Network size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Rafael Misoczki, Isaac Elbaz, Forrest Mertens &mdash; Meta Engineering &middot; April
              2026
            </div>
            <p className="text-xs text-foreground/70 mt-1">
              Hyperscale deployment case study: five-tier PQC maturity model (PQ-Unaware →
              PQ-Enabled), ML-KEM-768 / ML-DSA-65 algorithm rationale, hybrid deployment strategy,
              and organizational lessons from migrating WhatsApp, Facebook/Messenger, and
              infrastructure teams.
            </p>
          </div>
          <ArrowRight
            size={16}
            className="text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors"
          />
        </a>
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
