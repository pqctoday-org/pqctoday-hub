// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  Database,
  Layers,
  Clock,
  Globe,
  BarChart3,
  FlaskConical,
  ChevronRight,
  ArrowRight,
  HeartPulse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import {
  SENSITIVITY_TIERS,
  RETENTION_CONFIGS,
  ESTIMATED_CRQC_YEAR,
  CURRENT_YEAR,
} from '../data/sensitivityConstants'

interface DataAssetIntroductionProps {
  onNavigateToWorkshop: () => void
}

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <section className="glass-panel p-6">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="text-xl font-bold text-gradient flex-1">{title}</h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </Button>
      {isOpen && <div className="mt-4 space-y-4 text-sm text-foreground/80">{children}</div>}
    </section>
  )
}

export const DataAssetIntroduction: React.FC<DataAssetIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
      {/* Section 1: Why Data Classification Matters for PQC */}
      <CollapsibleSection
        icon={<Database size={24} className="text-primary" />}
        title="Why Data Classification Matters for PQC"
        defaultOpen
      >
        <p>
          The{' '}
          <strong>
            <InlineTooltip term="HNDL">Harvest Now, Decrypt Later (HNDL)</InlineTooltip>
          </strong>{' '}
          threat means adversaries are collecting encrypted data <em>today</em> — storing it until a{' '}
          <InlineTooltip term="CRQC">
            Cryptographically Relevant Quantum Computer (CRQC)
          </InlineTooltip>{' '}
          arrives to break it. The critical question is:{' '}
          <strong>which of your data is worth harvesting?</strong>
        </p>
        <p>
          The answer depends on how sensitive the data is and how long it needs to remain
          confidential. You cannot prioritize your{' '}
          <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip> migration without
          first knowing what data assets you hold, how sensitive they are, and what compliance
          frameworks govern their protection.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <blockquote className="text-sm italic text-foreground/90">
            &ldquo;NIST SP 800-37 RMF Step 1 is &lsquo;Prepare&rsquo; — and Step 2 is
            &lsquo;Categorize&rsquo; your information systems. Data classification is not optional;
            it is the foundation of any risk-based approach to cryptographic migration.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2">
            — NIST SP 800-37, Risk Management Framework
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: 'Know What You Have',
              desc: 'Catalog every data asset, key, credential, and communication channel that uses public-key cryptography.',
            },
            {
              title: 'Know How Long It Stays',
              desc: 'Data retained for 10+ years is already at HNDL risk if a CRQC arrives in the early 2030s.',
            },
            {
              title: 'Know Who Wants It',
              desc: 'Nation-state adversaries prioritize long-retained, high-sensitivity data: defense, financial, healthcare.',
            },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-1">{title}</h4>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 2: The Four-Tier Classification Model */}
      <CollapsibleSection
        icon={<Layers size={24} className="text-primary" />}
        title="The Four-Tier Data Classification Model"
      >
        <p>
          The app uses a four-tier sensitivity model aligned with{' '}
          <InlineTooltip term="NIST">NIST</InlineTooltip> FIPS 199 impact levels and common
          enterprise data governance frameworks. Each tier carries a distinct{' '}
          <strong>HNDL risk level</strong> and <strong>PQC migration urgency</strong>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Tier</th>
                <th className="text-left py-2 pr-4 font-medium">Examples</th>
                <th className="text-left py-2 pr-4 font-medium">HNDL Risk</th>
                <th className="text-left py-2 pr-4 font-medium">PQC Urgency</th>
                <th className="text-left py-2 font-medium">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {SENSITIVITY_TIERS.map((tier) => (
                <tr key={tier.id} className="border-b border-border/50">
                  <td className="py-2 pr-4">
                    <span className={`font-bold ${tier.colorClass}`}>{tier.label}</span>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {tier.examples.slice(0, 2).join(', ')}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${tier.colorClass} ${tier.bgClass} ${tier.borderClass}`}
                    >
                      {tier.hndlRisk}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`font-medium ${tier.colorClass}`}>{tier.pqcUrgency}</span>
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {tier.id === 'critical'
                      ? 'CNSA 2.0, FIPS 140-3'
                      : tier.id === 'high'
                        ? 'HIPAA, GDPR Art. 32'
                        : tier.id === 'medium'
                          ? 'NIST IR 8547'
                          : 'Best practice'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Asset type also matters:</strong> Key material (root
            CA keys, HSM-protected secrets) should always be classified{' '}
            <span className="text-status-error font-bold">Critical</span> regardless of sensitivity
            tier — even if the data it protects is Medium. Keys are the root of trust for everything
            above them.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 3: HNDL Implications for Data Governance */}
      <CollapsibleSection
        icon={<Clock size={24} className="text-primary" />}
        title="HNDL Implications for Data Governance"
      >
        <p>
          The{' '}
          <strong>
            <InlineTooltip term="HNDL">HNDL exposure year</InlineTooltip>
          </strong>{' '}
          formula is simple but profound:
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20 font-mono text-sm text-center">
          HNDL_risk_year = CRQC_arrival ({ESTIMATED_CRQC_YEAR}) − data_retention_years
        </div>

        <p>
          If an adversary harvests your encrypted data today and a{' '}
          <InlineTooltip term="CRQC">CRQC</InlineTooltip> arrives in {ESTIMATED_CRQC_YEAR}, any data
          that must remain confidential beyond {ESTIMATED_CRQC_YEAR} is{' '}
          <strong>already at risk</strong>. Use the table below as a quick reference.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Retention</th>
                <th className="text-left py-2 pr-4 font-medium">Typical Years</th>
                <th className="text-left py-2 pr-4 font-medium">HNDL Risk Year</th>
                <th className="text-left py-2 font-medium">
                  Status (if CRQC arrives {ESTIMATED_CRQC_YEAR})
                </th>
              </tr>
            </thead>
            <tbody>
              {RETENTION_CONFIGS.map((r) => {
                const hndlYear = Math.round(ESTIMATED_CRQC_YEAR - r.years)
                const atRisk = hndlYear <= CURRENT_YEAR
                return (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground">{r.label}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {r.years < 1 ? '< 1 yr' : `~${r.years} yr`}
                    </td>
                    <td className="py-2 pr-4 font-mono">
                      <span className={atRisk ? 'text-status-error font-bold' : 'text-foreground'}>
                        {hndlYear}
                      </span>
                    </td>
                    <td className="py-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          atRisk
                            ? 'text-status-error bg-status-error/10 border-status-error/30'
                            : 'text-status-success bg-status-success/10 border-status-success/30'
                        }`}
                      >
                        {atRisk ? 'At risk now' : 'Window open'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 border border-border text-xs text-muted-foreground">
          <strong className="text-foreground">Cross-reference:</strong> The{' '}
          <Link to="/learn/pqc-risk-management" className="text-primary hover:underline">
            PQC Risk Management
          </Link>{' '}
          module has a CRQC Scenario Planner where you can adjust the CRQC arrival year and model
          your organizational risk profile in detail.
        </div>
      </CollapsibleSection>

      {/* Section 4: Global Data Protection Laws */}
      <CollapsibleSection
        icon={<Globe size={24} className="text-primary" />}
        title="Global Data Protection Laws"
      >
        <p>
          Ten major data protection laws govern how organizations must protect data — and all of
          them require cryptographic measures that will be affected by the transition to{' '}
          <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip>. The table below
          summarizes each law&apos;s PQC relevance and current mandate status.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-3 font-medium">Law</th>
                <th className="text-left py-2 pr-3 font-medium">Region</th>
                <th className="text-left py-2 pr-3 font-medium">Data Scope</th>
                <th className="text-left py-2 pr-3 font-medium">PQC Requirement</th>
                <th className="text-left py-2 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'GDPR',
                  region: 'EU',
                  scope: 'EU resident PII',
                  req: 'Art. 32 — appropriate technical measures; PQC implied as best practice evolves',
                  deadline: null,
                },
                {
                  name: 'HIPAA',
                  region: 'US',
                  scope: 'Protected Health Information (ePHI)',
                  req: '45 CFR §164.312 — encryption where feasible; HHS guidance will update',
                  deadline: null,
                },
                {
                  name: 'PCI DSS v4.0',
                  region: 'Global',
                  scope: 'Cardholder data',
                  req: 'Req 12.3.3 — cryptographic inventory required; Req 4.2.1 — strong crypto',
                  deadline: '2025',
                },
                {
                  name: 'CCPA/CPRA',
                  region: 'California',
                  scope: 'CA resident personal info',
                  req: 'Reasonable security — crypto practices must evolve with FTC guidance',
                  deadline: null,
                },
                {
                  name: 'PIPL',
                  region: 'China',
                  scope: 'Chinese resident personal info',
                  req: 'GM algorithm compliance (SM2, SM3, SM4) — cross-border tension with NIST',
                  deadline: null,
                },
                {
                  name: 'LGPD',
                  region: 'Brazil',
                  scope: 'Brazilian resident personal data',
                  req: 'Technical and organizational measures — PQC implied as practice matures',
                  deadline: null,
                },
                {
                  name: 'PDPA',
                  region: 'Singapore/ASEAN',
                  scope: 'Personal data',
                  req: 'MAS TRM guidelines align; financial entities expected to plan PQC',
                  deadline: null,
                },
                {
                  name: 'NIS2',
                  region: 'EU',
                  scope: 'Essential and important entities',
                  req: 'Art. 21(2)(h) — explicit cryptography policies; ENISA covers PQC planning',
                  deadline: '2024',
                },
                {
                  name: 'DORA',
                  region: 'EU',
                  scope: 'EU financial entities',
                  req: 'Art. 9 — ICT security incl. cryptographic controls; enforced Jan 2025',
                  deadline: '2025',
                },
                {
                  name: 'CNSA 2.0',
                  region: 'US NSS',
                  scope: 'National Security Systems',
                  req: 'ML-KEM-1024 + ML-DSA-87 mandatory; hard deadlines 2027–2033',
                  deadline: '2030',
                },
              ].map(({ name, region, scope, req, deadline }) => (
                <tr key={name} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-bold text-foreground">{name}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{region}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{scope}</td>
                  <td className="py-2 pr-3 text-muted-foreground text-[10px]">{req}</td>
                  <td className="py-2">
                    {deadline ? (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          Number(deadline) <= 2025
                            ? 'text-status-error bg-status-error/10 border-status-error/30'
                            : 'text-status-warning bg-status-warning/10 border-status-warning/30'
                        }`}
                      >
                        {deadline}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Ongoing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Conflicting requirements:</strong>{' '}
          <InlineTooltip term="PIPL">PIPL</InlineTooltip>&apos;s GM algorithm mandate (SM2, SM3,
          SM4) conflicts with NIST-aligned PQC standards for cross-border data controllers.
          Organizations operating in both China and the EU or US should seek legal guidance on the
          applicable encryption standard per data flow direction.
        </p>
      </CollapsibleSection>

      {/* Section 5: Risk Management Methodology Overview */}
      <CollapsibleSection
        icon={<BarChart3 size={24} className="text-primary" />}
        title="Risk Management Methodology Overview"
      >
        <p>
          Four methodologies are available to assess the risk of your data assets from a PQC
          perspective. This section gives you the conceptual foundation; the{' '}
          <strong>PQC Risk Management</strong> module applies all four hands-on.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Methodology</th>
                <th className="text-left py-2 pr-4 font-medium">Origin</th>
                <th className="text-left py-2 pr-4 font-medium">Output Type</th>
                <th className="text-left py-2 pr-4 font-medium">Primary Audience</th>
                <th className="text-left py-2 font-medium">PQC Applicability</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'NIST RMF',
                  detail: 'SP 800-37',
                  origin: 'NIST / US Federal',
                  output: 'FIPS 199 impact level + SP 800-53 control gaps + risk score (1–25)',
                  audience: 'US federal agencies, government contractors, DoD',
                  pqc: 'Directly mandated via NIST IR 8547 and CNSA 2.0',
                },
                {
                  name: 'ISO 27005',
                  detail: 'ISO/IEC 27005',
                  origin: 'ISO/IEC',
                  output:
                    'Risk level (Low–Critical) + risk treatment (Accept/Mitigate/Transfer/Avoid)',
                  audience: 'ISO 27001 certified orgs, international enterprises',
                  pqc: 'Feeds cryptographic risk treatment into ISO 27001 Annex A.8.24',
                },
                {
                  name: 'FAIR',
                  detail: 'Factor Analysis of Information Risk',
                  origin: 'Open FAIR / PRMIA',
                  output: 'Annualized Loss Expectancy ($) — quantitative financial model',
                  audience: 'Finance, insurance, board-level reporting',
                  pqc: 'Quantifies breach cost of delayed PQC migration for ROI analysis',
                },
                {
                  name: 'DORA/NIS2',
                  detail: 'EU Operational Resilience',
                  origin: 'European Commission',
                  output: 'ICT resilience gap score (0–10) + compliance articles affected',
                  audience: 'EU financial entities, essential service operators',
                  pqc: 'Article 9 (DORA) and Article 21 (NIS2) require crypto agility planning',
                },
              ].map(({ name, detail, origin, output, audience, pqc }) => (
                <tr key={name} className="border-b border-border/50">
                  <td className="py-2 pr-4">
                    <p className="font-bold text-foreground">{name}</p>
                    <p className="text-muted-foreground">{detail}</p>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{origin}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{output}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{audience}</td>
                  <td className="py-2 text-muted-foreground">{pqc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Which to use?</strong> Most organizations use NIST RMF
          if they are US federal contractors, ISO 27005 if they hold ISO 27001 certification, FAIR
          if they need board-level financial justification, and DORA/NIS2 if they are in scope for
          EU regulation. For a hands-on deep dive applying all four frameworks to your assets, see
          the <strong>PQC Risk Management</strong> module.
        </p>
      </CollapsibleSection>

      {/* Section 6: Workshop Overview */}
      <CollapsibleSection
        icon={<FlaskConical size={24} className="text-primary" />}
        title="Workshop Overview — What You Will Build"
      >
        <p>
          The 5-step workshop takes you through a complete data governance workflow — from
          cataloging your assets to generating a prioritized PQC migration list. By the end,
          you&apos;ll have a structured output you can take to your security team.
        </p>

        <div className="space-y-2">
          {[
            {
              step: 1,
              title: 'Asset Inventory',
              desc: 'Catalog data assets with type, sensitivity tier, retention period, and current encryption. Four pre-populated examples show you the pattern.',
            },
            {
              step: 2,
              title: 'Classification Challenge',
              desc: 'Classify 10 real-world data scenarios (EHR records, signing keys, biometrics, JWTs…) using the four-tier model. Get immediate feedback with HNDL windows and applicable frameworks.',
            },
            {
              step: 3,
              title: 'Conflict Resolver',
              desc: 'Resolve multi-framework sensitivity conflicts. When GDPR, HIPAA, CNSA 2.0, and FIPS 140-3 disagree on a tier, apply the four resolution rules to determine the governing classification.',
            },
            {
              step: 4,
              title: 'Sensitivity Scoring Engine',
              desc: 'Compute a composite PQC urgency score (0–100) per asset using four weighted dimensions. Adjust weights to reflect your priorities.',
            },
            {
              step: 5,
              title: 'PQC Migration Priority Map',
              desc: 'Ranked output by urgency with recommended PQC algorithms, compliance deadlines, migration effort, and exportable Markdown.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={onNavigateToWorkshop}
            className="flex items-center gap-2"
          >
            Start Workshop <ArrowRight size={16} />
          </Button>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
            <span>Or explore related:</span>
            <Link to="/learn/pqc-risk-management" className="text-primary hover:underline">
              PQC Risk Management
            </Link>
            <span>·</span>
            <Link to="/learn/compliance-strategy" className="text-primary hover:underline">
              Compliance Strategy
            </Link>
            <span>·</span>
            <Link to="/assess" className="text-primary hover:underline">
              Assessment Wizard
            </Link>
          </div>
        </div>
      </CollapsibleSection>
      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/pqc-risk-management"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BarChart3 size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Risk Management</div>
              <div className="text-xs text-muted-foreground">
                NIST RMF, ISO 27005, FAIR, and DORA/NIS2 applied to PQC migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/compliance-strategy"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Globe size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Strategy</div>
              <div className="text-xs text-muted-foreground">
                Framework-driven PQC compliance planning and gap analysis
              </div>
            </div>
          </Link>
          <Link
            to="/learn/healthcare-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <HeartPulse size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Healthcare PQC</div>
              <div className="text-xs text-muted-foreground">
                HIPAA, ePHI protection, and healthcare data PQC migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/database-encryption-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Database size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Database Encryption</div>
              <div className="text-xs text-muted-foreground">
                TDE, column-level encryption, and BYOK key management
              </div>
            </div>
          </Link>
        </div>
      </section>
      <ReadingCompleteButton />
    </div>
  )
}
