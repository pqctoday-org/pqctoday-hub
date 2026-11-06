// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router'
import { Clock, AlertTriangle, ShieldAlert, ShieldCheck, Calendar, TrendingUp } from 'lucide-react'
import { medianCrqcYear } from '@/utils/crqcProbability'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { ExportableArtifact } from '../../../common/executive'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useThreatsData } from '@/hooks/useThreatsData'
import { UnresolvedEstimatesNotice } from '@/components/common/UnresolvedEstimatesNotice'
import { CNSA_2_0_BY_CLASS, EO_14412, NIST_DEPRECATION } from '@/data/regulatoryTimelines'

interface AlgorithmImpact {
  name: string
  type: 'asymmetric' | 'symmetric' | 'hash'
  breakYear: number | null
  replacement: string
  notes: string
}

const ALGORITHMS: AlgorithmImpact[] = [
  {
    name: 'RSA-2048',
    type: 'asymmetric',
    breakYear: 0, // breaks when CRQC arrives
    replacement: 'ML-KEM-768 / ML-DSA-65',
    notes: 'Vulnerable to Shor\u2019s algorithm. Immediate migration priority.',
  },
  {
    name: 'RSA-3072',
    type: 'asymmetric',
    breakYear: 0,
    replacement: 'ML-KEM-1024 / ML-DSA-87',
    notes: 'Larger keys do not protect against quantum attack. Same urgency as RSA-2048.',
  },
  {
    name: 'RSA-4096',
    type: 'asymmetric',
    breakYear: 0,
    replacement: 'ML-KEM-1024 / ML-DSA-87',
    notes: 'Still vulnerable to Shor\u2019s algorithm regardless of key size.',
  },
  {
    name: 'ECDSA P-256',
    type: 'asymmetric',
    breakYear: 0,
    replacement: 'ML-DSA-44 / SLH-DSA',
    notes: 'Elliptic curve cryptography broken by Shor\u2019s algorithm.',
  },
  {
    name: 'ECDSA P-384',
    type: 'asymmetric',
    breakYear: 0,
    replacement: 'ML-DSA-65 / SLH-DSA',
    notes: 'Larger curves do not help against quantum attack.',
  },
  {
    name: 'ECDH / X25519',
    type: 'asymmetric',
    breakYear: 0,
    replacement: 'ML-KEM-768 / X25519MLKEM768',
    notes: 'Key exchange vulnerable to Shor\u2019s algorithm. Hybrid mode available now.',
  },
  {
    name: 'DH-2048',
    type: 'asymmetric',
    breakYear: 0,
    replacement: 'ML-KEM-768',
    notes: 'Classic Diffie-Hellman broken by Shor\u2019s algorithm.',
  },
  {
    name: 'AES-128',
    type: 'symmetric',
    breakYear: null,
    replacement: 'AES-256 (recommended)',
    notes:
      'Broad expert consensus holds that AES-128 stays practically secure and key sizes do not necessarily have to be doubled.',
  },
  {
    name: 'AES-256',
    type: 'symmetric',
    breakYear: null,
    replacement: 'No change needed',
    notes:
      'Grover\u2019s reduces to 128-bit effective security, still considered safe. CNSA 2.0 approved.',
  },
  {
    name: 'SHA-256',
    type: 'hash',
    breakYear: null,
    replacement: 'No change needed',
    notes:
      'Grover lowers preimage resistance to \u223c2\u00b9\u00b2\u2078 (still strong). The theoretical quantum collision bound (\u223c2\u2078\u2075 via BHT) requires impractical quantum memory and is not a real-world threat. NIST IR 8547 lists SHA-256 collision and preimage strengths as 128 and 256 bits, respectively, and considers NIST-approved symmetric primitives with classical security of 128 bits or more likely to satisfy at least Category 1 security.',
  },
]

/** One dated overlay. A date applies to a system only if the system is in its `scope`. */
interface ComplianceDeadline {
  framework: string
  year: number
  /** true for guidance and proposals, which are not a requirement on their own */
  advisory: boolean
  /** who and what the date covers */
  scope: string
  /** document and version the date comes from */
  source: string
}

const NSS_SCOPE =
  'National Security Systems only; NSA states it mandates nothing outside NSS. Whether a system is an NSS is an input to settle first.'
const CNSA_SOURCE =
  'NSA CNSA 2.0 FAQ, version 2.2 (October 2026), citing CNSSP 15; equipment phase-out allows an exception and the algorithm mandate reads \u201cunless otherwise noted\u201d'
const EO_SOURCE = 'Executive Order 14412 (22 June 2026) Sec. 4; OMB M-26-15 (24 June 2026)'

const COMPLIANCE_DEADLINES: ComplianceDeadline[] = [
  ...CNSA_2_0_BY_CLASS.map((c) => ({
    framework: `CNSA 2.0 \u2014 ${c.class}`,
    year: c.year,
    advisory: false,
    scope: NSS_SCOPE,
    source: CNSA_SOURCE,
  })),
  ...(EO_14412.keyEstablishment === undefined
    ? []
    : [
        {
          framework:
            'EO 14412 \u2014 federal civilian High Value Assets and high-impact systems: PQC key establishment',
          year: EO_14412.keyEstablishment,
          advisory: false,
          scope:
            'Federal agencies, excluding National Security Systems; the order does not apply this date to contractors or other organisations.',
          source: EO_SOURCE,
        },
      ]),
  {
    framework: 'EO 14412 \u2014 same federal civilian systems: PQC digital signatures',
    year: EO_14412.digitalSignatures,
    advisory: false,
    scope: 'Federal agencies, excluding National Security Systems.',
    source: EO_SOURCE,
  },
  {
    // EO 14412 Sec. 6(c): the FAR Council is directed to publish a proposed rule (due 19 December
    // 2026) that would require covered contractors to comply with NIST FIPS by 31 December 2030.
    framework: 'EO 14412 \u2014 proposed FAR rule: covered contractors comply with NIST FIPS',
    year: 2030,
    advisory: true,
    scope:
      'Draft proposed transition for covered federal contractors; the order does not define the term, and nothing binds a contractor until a rule is final and in a contract.',
    source: 'Executive Order 14412 Sec. 6(c)',
  },
  {
    framework: 'NIST \u2014 quantum-vulnerable public-key algorithms deprecated after this year',
    year: NIST_DEPRECATION.deprecateClassical,
    advisory: false,
    scope:
      'Status under NIST standards and guidelines; deprecated algorithms may still be used while migrating, and the earlier EO 14412 dates constrain federal high-value and high-impact systems.',
    source: 'NIST IR 8547 (final, October 2026)',
  },
  {
    framework: 'NIST \u2014 quantum-vulnerable public-key algorithms disallowed after this year',
    year: NIST_DEPRECATION.disallowClassical,
    advisory: false,
    scope: 'Status under NIST standards and guidelines; not a global sunset of RSA and ECC.',
    source: 'NIST IR 8547 (final, October 2026)',
  },
  {
    framework: 'EU \u2014 high-risk use cases transitioned to PQC (coordinated roadmap)',
    year: 2030,
    advisory: true,
    scope:
      'Guidance for Member States\u2019 national programmes; it is a recommended milestone, not a regulation that binds an organisation directly.',
    source:
      'NIS Cooperation Group Coordinated Implementation Roadmap, Part 1, version 1.1 (11 June 2025)',
  },
]

/** Status wording for one overlay at a given scenario. */
function deadlineStatus(d: ComplianceDeadline, crqcYear: number, currentYear: number): string {
  if (d.advisory) return 'Guidance or proposal \u2014 not a requirement on its own'
  if (d.year <= currentYear) return 'Date reached \u2014 applies only to systems in the scope above'
  return d.year <= crqcYear
    ? `Falls ${crqcYear - d.year} yr before the assumed CRQC year, for systems in the scope above`
    : `Falls ${d.year - crqcYear} yr after the assumed CRQC year, for systems in the scope above`
}

interface CRQCScenarioPlannerProps {
  onCrqcYearChange?: (year: number) => void
}

/** Extracted (07192026, Batch 3) so the simulation's real-tool doc generator
 *  renders THIS logic — the component's export memo delegates here. */
export interface CrqcScenarioInput {
  crqcYear: number
  currentYear: number
  urgencyLevel: string
  industry?: string
  country?: string
  migrationDeadlineYear?: number | null
}

export function buildCrqcScenarioMarkdown({
  crqcYear,
  currentYear,
  urgencyLevel,
  industry,
  country,
  migrationDeadlineYear,
}: CrqcScenarioInput): string {
  const yearsRemaining = crqcYear - currentYear
  const affectedAlgorithms = ALGORITHMS.filter((algo) => algo.breakYear !== null)
  const safeAlgorithms = ALGORITHMS.filter((algo) => algo.breakYear === null)

  let md = '# CRQC Scenario Analysis\n\n'
  md += `**CRQC Arrival Year:** ${crqcYear}\n`
  md += `**Years Remaining:** ${yearsRemaining}\n`
  md += `**Urgency Level:** ${urgencyLevel.toUpperCase()}\n`
  md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`

  md += '## Algorithms Broken\n\n'
  md += '| Algorithm | Replacement | Notes |\n'
  md += '|-----------|-------------|-------|\n'
  for (const algo of affectedAlgorithms) {
    md += `| ${algo.name} | ${algo.replacement} | ${algo.notes} |\n`
  }
  md += '\n'

  md += '## Quantum-Safe Algorithms\n\n'
  for (const algo of safeAlgorithms) {
    md += `- **${algo.name}**: ${algo.notes}\n`
  }
  md += '\n'

  md += '## Compliance Deadlines\n\n'
  md +=
    'Each date applies only to systems in its scope. The CRQC year is a scenario assumption, not a forecast.\n\n'
  md += '| Framework | Year | Scope | Source | Status |\n'
  md += '|-----------|------|-------|--------|--------|\n'
  for (const d of COMPLIANCE_DEADLINES) {
    md += `| ${d.framework} | ${d.year} | ${d.scope} | ${d.source} | ${deadlineStatus(d, crqcYear, currentYear)} |\n`
  }
  md += '\n'

  md += '## HNDL Exposure Window\n\n'
  md += '| Retention | Valid Until | At Risk? |\n'
  md += '|-----------|------------|----------|\n'
  for (const years of [1, 3, 5, 7, 10, 15, 25]) {
    const validUntil = currentYear + years
    md += `| ${years} years | ${validUntil} | ${validUntil >= crqcYear ? 'AT RISK' : 'Safe'} |\n`
  }
  md += '\n'

  if (industry || country) {
    md += '## Assessment Context\n\n'
    if (industry) md += `- **Industry:** ${industry}\n`
    if (country) md += `- **Country:** ${country}\n`
    if (migrationDeadlineYear) md += `- **Migration Deadline:** ${migrationDeadlineYear}\n`
  }

  md += '\n---\n\n'
  md +=
    '*Aligned to NIST CSWP 39 §2.3 (Constant Needs of Transition) and §6.1 (Resource Considerations). https://doi.org/10.6028/NIST.CSWP.39-upd1*\n'

  // N5: sanitise non-ASCII punctuation in the exported markdown string only
  // (em-dash, en-dash, smart single/double quotes).
  md = md.replace(/—/g, '-').replace(/–/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

  return md
}

export const CRQCScenarioPlanner: React.FC<CRQCScenarioPlannerProps> = ({ onCrqcYearChange }) => {
  const { migrationDeadlineYear, industry, country, hndlRiskWindow } = useExecutiveModuleData()
  // Default to the GRI 2025 survey's median CRQC arrival — the same curve the
  // Breach Scenario Simulator and Cost of Inaction Analyzer use.
  //
  // It used to be `migrationDeadlineYear + 3` (falling back to 2035), which
  // derived a claim about quantum-computing capability from a regulatory
  // compliance date. Those are independent quantities: a mandate says when you
  // must be done, not when the machine arrives. It also left this tool
  // answering "when does a CRQC arrive" differently from the two tools beside
  // it in the same Command Center. The deadline is still shown — as its own
  // overlay below, not as the capability estimate. (Audit 2026-08-10, W2-3.)
  const defaultCrqcYear = Math.round(medianCrqcYear('consensus'))
  // Restore the user's last-saved slider position (if any) ahead of the
  // computed default — the read-back half of persisting `inputs` on export.
  const savedInputs = useSavedArtifactInputs<{ crqcYear?: number }>('crqc-scenario')
  const [crqcYear, setCrqcYear] = useState(savedInputs?.crqcYear ?? defaultCrqcYear)
  const [seedCleared, setSeedCleared] = useState(false)

  useEffect(() => {
    onCrqcYearChange?.(crqcYear)
  }, [crqcYear, onCrqcYearChange])
  const { addExecutiveDocument } = useModuleStore()
  const myThreatIds = useBookmarkStore((s) => s.myThreats)
  const { data: threatsData } = useThreatsData()
  const myTrackedThreats = useMemo(
    () => threatsData.filter((t) => myThreatIds.includes(t.threatId)),
    [myThreatIds, threatsData]
  )

  const seedSources: string[] = []
  if (!seedCleared) {
    seedSources.push(`GRI 2025 consensus median (${Math.round(medianCrqcYear('consensus'))})`)
    if (migrationDeadlineYear)
      seedSources.push(`deadline ${migrationDeadlineYear} (shown separately)`)
    if (industry) seedSources.push(`industry (${industry})`)
    if (country) seedSources.push(`country (${country})`)
    if (hndlRiskWindow?.isAtRisk) seedSources.push('open HNDL window from assessment')
    if (myTrackedThreats.length > 0)
      seedSources.push(
        `${myTrackedThreats.length} threat${myTrackedThreats.length !== 1 ? 's' : ''} from /threats`
      )
  }

  const currentYear = new Date().getFullYear()

  const affectedAlgorithms = useMemo(() => {
    return ALGORITHMS.filter((algo) => algo.breakYear !== null)
  }, [])

  const safeAlgorithms = useMemo(() => {
    return ALGORITHMS.filter((algo) => algo.breakYear === null)
  }, [])

  const missedDeadlines = useMemo(() => {
    return COMPLIANCE_DEADLINES.filter((d) => d.year <= crqcYear)
  }, [crqcYear])

  const yearsRemaining = crqcYear - currentYear
  const urgencyLevel =
    yearsRemaining <= 3
      ? 'critical'
      : yearsRemaining <= 6
        ? 'high'
        : yearsRemaining <= 10
          ? 'medium'
          : 'low'

  const urgencyColor =
    urgencyLevel === 'critical'
      ? 'text-status-error'
      : urgencyLevel === 'high'
        ? 'text-status-warning'
        : urgencyLevel === 'medium'
          ? 'text-primary'
          : 'text-status-success'

  const exportMarkdown = useMemo(
    () =>
      buildCrqcScenarioMarkdown({
        crqcYear,
        currentYear,
        urgencyLevel,
        industry,
        country,
        migrationDeadlineYear,
      }),
    [crqcYear, currentYear, urgencyLevel, industry, country, migrationDeadlineYear]
  )

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `crqc-scenario-${Date.now()}`,
      moduleId: 'pqc-risk-management',
      type: 'crqc-scenario',
      title: `CRQC Scenario Analysis (${crqcYear})`,
      data: exportMarkdown,
      inputs: { crqcYear },
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, crqcYear, exportMarkdown])

  const urgencyBgColor =
    urgencyLevel === 'critical'
      ? 'bg-status-error/10 border-status-error/30'
      : urgencyLevel === 'high'
        ? 'bg-status-warning/10 border-status-warning/30'
        : urgencyLevel === 'medium'
          ? 'bg-primary/10 border-primary/30'
          : 'bg-status-success/10 border-status-success/30'

  return (
    <div className="space-y-6">
      <UnresolvedEstimatesNotice detail="workshopExample" />
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`Scenario seeded from ${seedSources.join(' + ')}.`}
          onClear={() => {
            setCrqcYear(Math.round(medianCrqcYear('consensus')))
            setSeedCleared(true)
          }}
        />
      )}
      {myTrackedThreats.length > 0 && (
        <div className="glass-panel p-3 border-l-4 border-status-warning">
          <div className="text-xs font-semibold text-foreground mb-1.5">
            Tracked threats from /threats ({myTrackedThreats.length})
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            These threats are part of your scenario. Adjust the slider below to model when CRQC
            arrives and re-evaluate exposure.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {myTrackedThreats.slice(0, 6).map((t) => (
              <Link
                key={t.threatId}
                to={`/threats?id=${encodeURIComponent(t.threatId)}`}
                className="text-[10px] px-2 py-0.5 rounded bg-muted text-foreground border border-border hover:border-primary/40 transition-colors"
                title={t.description}
              >
                {t.threatId}
              </Link>
            ))}
            {myTrackedThreats.length > 6 && (
              <span className="text-[10px] text-muted-foreground">
                +{myTrackedThreats.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* CRQC Year Slider */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            <InlineTooltip term="CRQC">CRQC</InlineTooltip> Arrival Year
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Adjust the slider to model when a cryptographically relevant quantum computer might
          arrive. See the cascading impacts on algorithms, compliance, and data exposure.
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Default year is the median CRQC arrival from the Global Risk Institute&apos;s 2025 Quantum
          Threat Timeline survey ({Math.round(medianCrqcYear('consensus'))}, consensus of its 26
          experts&apos; low and high bounds) &mdash; the same curve the Breach Scenario Simulator
          and Cost of Inaction Analyzer use. Move the slider to model an earlier or later arrival;
          the slow and fast bounds are {Math.round(medianCrqcYear('slow'))} and{' '}
          {Math.round(medianCrqcYear('fast'))}.
          {migrationDeadlineYear
            ? ` Your migration deadline (${migrationDeadlineYear}) is a separate quantity — when you must be finished, not when the machine arrives.`
            : ''}{' '}
          Aligned to{' '}
          <a
            href="https://doi.org/10.6028/NIST.CSWP.39-upd1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:no-underline"
          >
            NIST CSWP 39
          </a>{' '}
          &sect;2.3 (Constant Need of Transition) and &sect;6.1 (Resource Considerations).
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">2028</span>
            <span className={`text-3xl font-bold ${urgencyColor}`}>{crqcYear}</span>
            <span className="text-sm text-muted-foreground">2045</span>
          </div>
          <input
            id="crqc-year"
            type="range"
            min={2028}
            max={2045}
            value={crqcYear}
            onChange={(e) => setCrqcYear(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="CRQC arrival year"
          />
          <div className="flex items-center justify-center gap-2">
            <span className={`text-sm font-medium ${urgencyColor}`}>
              {yearsRemaining} years remaining
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${urgencyBgColor} ${urgencyColor}`}
            >
              {urgencyLevel.toUpperCase()} URGENCY
            </span>
          </div>
        </div>

        {/* Context from assessment */}
        {(industry || country || migrationDeadlineYear) && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-1">From your assessment:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {industry && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">{industry}</span>
              )}
              {country && (
                <span className="px-2 py-0.5 bg-secondary/10 text-secondary rounded">
                  {country}
                </span>
              )}
              {migrationDeadlineYear && (
                <span className="px-2 py-0.5 bg-status-warning/10 text-status-warning rounded">
                  Deadline: {migrationDeadlineYear}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Impact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`glass-panel p-4 border ${urgencyBgColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-status-error" />
            <span className="text-xs font-medium text-muted-foreground">Algorithms Broken</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{affectedAlgorithms.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            asymmetric algorithms vulnerable to Shor&apos;s
          </p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-status-success" />
            <span className="text-xs font-medium text-muted-foreground">Quantum-Safe</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{safeAlgorithms.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            algorithms unaffected by quantum attack
          </p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-status-warning" />
            <span className="text-xs font-medium text-muted-foreground">Pre-CRQC Deadlines</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{missedDeadlines.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            dated milestones before the assumed CRQC year, each with its own scope
          </p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">HNDL Window</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{yearsRemaining} yr</div>
          <p className="text-xs text-muted-foreground mt-1">
            data captured today decryptable in {crqcYear}
          </p>
        </div>
      </div>

      {/* Algorithms Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerable Algorithms */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={18} className="text-status-error" />
            <h2 className="text-base font-semibold text-foreground">
              Algorithms Broken at {crqcYear}
            </h2>
          </div>
          <div
            className="space-y-2 max-h-[300px] overflow-y-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx / BB84Simulator.tsx).
            tabIndex={0}
            role="region"
            aria-label={`Algorithms broken at ${crqcYear}`}
          >
            {affectedAlgorithms.map((algo) => (
              <div
                key={algo.name}
                className="p-3 bg-status-error/5 rounded-lg border border-status-error/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{algo.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-status-error/10 text-status-error">
                    Broken
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{algo.notes}</p>
                <p className="text-xs text-primary mt-1">
                  Replace with: <strong>{algo.replacement}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Deadlines */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-status-warning" />
            <h2 className="text-base font-semibold text-foreground">Compliance Deadlines</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Each date applies only to systems in its own scope, and each is shown with its source
            version. National Security System requirements, federal civilian directives, NIST
            standards status, proposals and guidance are different things; the CRQC year is your
            scenario assumption, not a forecast.
          </p>
          <div
            className="space-y-2 max-h-[300px] overflow-y-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; making a scrollable region focusable is axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx / BB84Simulator.tsx).
            tabIndex={0}
            role="region"
            aria-label="Compliance deadlines"
          >
            {COMPLIANCE_DEADLINES.map((deadline) => {
              const isMissed = deadline.year <= crqcYear
              const isPast = deadline.year <= currentYear
              return (
                <div
                  key={deadline.framework}
                  className={`p-3 rounded-lg border ${
                    deadline.advisory
                      ? 'bg-muted/30 border-dashed border-border/60'
                      : isPast
                        ? 'bg-status-error/5 border-status-error/20'
                        : isMissed
                          ? 'bg-status-warning/5 border-status-warning/20'
                          : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {deadline.framework}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                        deadline.advisory
                          ? 'bg-muted text-muted-foreground'
                          : isPast
                            ? 'bg-status-error/10 text-status-error'
                            : isMissed
                              ? 'bg-status-warning/10 text-status-warning'
                              : 'bg-status-success/10 text-status-success'
                      }`}
                    >
                      {deadline.year}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {deadlineStatus(deadline, crqcYear, currentYear)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Scope:</span> {deadline.scope}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Source:</span> {deadline.source}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* HNDL Exposure Analysis */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">HNDL Exposure Window</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Data encrypted today with quantum-vulnerable algorithms can be stored by adversaries and
          decrypted when a CRQC arrives. The table below shows exposure for different data retention
          periods.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                  Data Retention
                </th>
                <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                  Data Captured Today
                </th>
                <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                  Still Valid At
                </th>
                <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                  CRQC Arrives
                </th>
                <th className="p-2 text-left text-xs font-medium text-muted-foreground">
                  At Risk?
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 3, 5, 7, 10, 15, 25].map((years) => {
                const validUntil = currentYear + years
                const atRisk = validUntil >= crqcYear
                return (
                  <tr key={years} className="border-b border-border/50">
                    <td className="p-2 text-foreground">{years} years</td>
                    <td className="p-2 text-foreground">{currentYear}</td>
                    <td className="p-2 text-foreground">{validUntil}</td>
                    <td className="p-2 text-foreground">{crqcYear}</td>
                    <td className="p-2">
                      {atRisk ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-status-error/10 text-status-error font-medium">
                          AT RISK
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-status-success/10 text-status-success font-medium">
                          Safe
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}
      <ExportableArtifact
        title="CRQC Scenario — Export"
        exportData={exportMarkdown}
        filename="crqc-scenario-analysis"
        formats={['markdown', 'pdf']}
        wideTable
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">
          Export this scenario analysis as a shareable document.
        </p>
      </ExportableArtifact>
    </div>
  )
}
