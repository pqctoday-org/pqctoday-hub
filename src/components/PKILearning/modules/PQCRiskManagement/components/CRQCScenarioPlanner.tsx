// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { Clock, AlertTriangle, ShieldAlert, ShieldCheck, Calendar, TrendingUp } from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { ExportableArtifact } from '../../../common/executive'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useThreatsData } from '@/hooks/useThreatsData'

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
      'Grover\u2019s algorithm reduces effective security to 64-bit. Upgrade to AES-256 recommended.',
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
      'Grover\u2019s reduces preimage resistance from 2\u00b2\u2075\u2076 to \u223c2\u00b9\u00b2\u2078 and collision resistance to \u223c2\u2078\u2075. NIST considers this sufficient; SHA-256 is quantum-safe per NIST IR 8547.',
  },
]

const COMPLIANCE_DEADLINES = [
  { framework: 'CNSA 2.0 \u2014 Software/Firmware Signing', year: 2025, advisory: false },
  { framework: 'CNSA 2.0 \u2014 Web/Cloud/Networking (TLS/IPsec)', year: 2030, advisory: false },
  { framework: 'CNSA 2.0 \u2014 Legacy Infrastructure', year: 2033, advisory: false },
  { framework: 'NIST \u2014 RSA/ECC Deprecation (NIST IR 8547)', year: 2030, advisory: false },
  { framework: 'NIST \u2014 RSA/ECC Disallowed (NIST IR 8547)', year: 2035, advisory: false },
  { framework: 'EU/ANSSI \u2014 PQC Guidance (advisory)', year: 2030, advisory: true },
]

export const CRQCScenarioPlanner: React.FC = () => {
  const [crqcYear, setCrqcYear] = useState(2035)
  const { migrationDeadlineYear, industry, country } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const myThreatIds = useBookmarkStore((s) => s.myThreats)
  const { data: threatsData } = useThreatsData()
  const myTrackedThreats = useMemo(
    () => threatsData.filter((t) => myThreatIds.includes(t.threatId)),
    [myThreatIds, threatsData]
  )

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

  const exportMarkdown = useMemo(() => {
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
    md += '| Framework | Year | Status |\n'
    md += '|-----------|------|--------|\n'
    for (const d of COMPLIANCE_DEADLINES) {
      const isPast = d.year <= currentYear
      const isBefore = d.year <= crqcYear
      const status = d.advisory
        ? 'Advisory'
        : isPast
          ? 'Already in effect'
          : isBefore
            ? `Before CRQC (${crqcYear - d.year}yr before)`
            : `After CRQC (${d.year - crqcYear}yr after)`
      md += `| ${d.framework} | ${d.year} | ${status} |\n`
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

    return md
  }, [
    crqcYear,
    yearsRemaining,
    urgencyLevel,
    affectedAlgorithms,
    safeAlgorithms,
    currentYear,
    industry,
    country,
    migrationDeadlineYear,
  ])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `crqc-scenario-${Date.now()}`,
      moduleId: 'pqc-risk-management',
      type: 'crqc-scenario',
      title: `CRQC Scenario Analysis (${crqcYear})`,
      data: exportMarkdown,
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
              <span
                key={t.threatId}
                className="text-[10px] px-2 py-0.5 rounded bg-muted text-foreground border border-border"
                title={t.description}
              >
                {t.threatId}
              </span>
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
          <h3 className="text-lg font-semibold text-foreground">
            <InlineTooltip term="CRQC">CRQC</InlineTooltip> Arrival Year
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Adjust the slider to model when a cryptographically relevant quantum computer might
          arrive. See the cascading impacts on algorithms, compliance, and data exposure.
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
            compliance deadlines before CRQC arrives
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
            <h3 className="text-base font-semibold text-foreground">
              Algorithms Broken at {crqcYear}
            </h3>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
            <h3 className="text-base font-semibold text-foreground">Compliance Deadlines</h3>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
                    {deadline.advisory
                      ? 'Non-binding guidance \u2014 no legislative mandate'
                      : isPast
                        ? 'Already in effect \u2014 non-compliance risk is active'
                        : isMissed
                          ? `Due before CRQC arrival (${crqcYear - deadline.year} years before)`
                          : `Due after estimated CRQC (${deadline.year - crqcYear} years after)`}
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
          <h3 className="text-base font-semibold text-foreground">HNDL Exposure Window</h3>
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
        formats={['markdown']}
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">
          Export this scenario analysis as a shareable document.
        </p>
      </ExportableArtifact>
    </div>
  )
}
