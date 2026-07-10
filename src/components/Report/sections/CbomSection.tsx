// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cryptographic Bill of Materials — Report section (the Communicate
 * expression of Framework 2.1 Phase 2, `frameworkPhases.ts` p2.communicate).
 *
 * Unlike QRA/Discovery/VendorRisk, this section's data doesn't come from the
 * assessment wizard at all — it reads the latest Library CBOM Builder save
 * straight from the Command Center store, so it owns its own data fetch
 * (`useSavedArtifactDocuments`) instead of taking assessment-derived props.
 *
 * Three states (plan §2.2): no CBOM ever saved (CTA, DiscoverySection-style),
 * a CBOM saved before the structured-summary field existed ("legacy" —
 * re-save prompt, not an error), and a populated summary (full render). The
 * compliance split is a rewrite of CbomVerify.tsx's quantum-safe/vulnerable
 * idea against real `algorithmFamily` data — not a port of its regex-over-
 * free-text classifier, which doesn't apply to structured input. Unlike
 * CbomVerify, there is no "unknown" bucket: every algorithm this pipeline
 * detects is deterministically classical or PQC at detection time, so a 4th
 * "unknown" verdict would be fabricated, not real signal. The nearest analogue
 * to CbomVerify's "na" is component-level, not algorithm-level — components
 * with zero detected crypto-assets — kept as its own stat rather than blended
 * into the algorithm-level compliance percentage, since the two are different
 * units (components vs. crypto-asset instances).
 *
 * See cbom-cyclonedx17-registry-report-section-plan-07092026.md, Part 2.
 */
import clsx from 'clsx'
import { FileJson, ShieldCheck, ShieldAlert, Layers, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CollapsibleSection } from './reportContentShared'
import { useSavedArtifactDocuments } from '@/hooks/useSavedArtifactInputs'
import type { CbomReportSummary } from '@/services/cbom/reportSummary'

interface SavedCbomInputs {
  mode?: string
  reportSummary?: CbomReportSummary
}

const MODE_LABEL: Record<string, string> = {
  sbom: 'sample SBOM scan',
  libs: 'library posture inventory',
  hsm: 'HSM vendor inventory',
  files: 'file artifact scan',
  assessment: 'your assessment inventory',
}

const TYPE_LABEL: Record<string, string> = {
  library: 'Libraries',
  application: 'Applications',
  device: 'Devices',
  file: 'Files',
  platform: 'Platforms',
}

/** `/learn/crypto-mgmt-modernization` hosts the Library CBOM Builder as its
 *  workshop step — there's no deep-link to that specific step, so this points
 *  at the module itself (same precision as DiscoverySection's `/migrate` link). */
const CBOM_BUILDER_LINK = '/learn/crypto-mgmt-modernization'

function formatDate(ts: number | undefined): string {
  if (!ts) return 'an earlier date'
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string
  count: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">
          {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${count} of ${total}`}
        />
      </div>
    </div>
  )
}

function CompliancePanel({ summary }: { summary: CbomReportSummary }) {
  const { quantumSafeCount, quantumVulnerableCount, cryptoAssetCount } = summary
  if (cryptoAssetCount === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No cryptographic algorithms were detected in this CBOM&apos;s components.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      <StatBar
        label="Quantum-safe (PQC)"
        count={quantumSafeCount}
        total={cryptoAssetCount}
        colorClass="bg-status-success"
      />
      <StatBar
        label="Quantum-vulnerable (classical)"
        count={quantumVulnerableCount}
        total={cryptoAssetCount}
        colorClass="bg-status-error"
      />
    </div>
  )
}

function CoveragePanel({ summary }: { summary: CbomReportSummary }) {
  const withoutCrypto = summary.componentCount - summary.componentsWithCrypto
  const types = Object.entries(summary.byType)
  return (
    <div className="space-y-3">
      <StatBar
        label="Components with detected crypto-assets"
        count={summary.componentsWithCrypto}
        total={summary.componentCount}
        colorClass="bg-primary"
      />
      {withoutCrypto > 0 && (
        <p className="text-[11px] text-muted-foreground/70 italic">
          {withoutCrypto} of {summary.componentCount} component
          {summary.componentCount === 1 ? '' : 's'} had no cryptography detected — not a compliance
          gap by itself, just outside what text-based detection could find.
        </p>
      )}
      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {types.map(([type, count]) => (
            <span
              key={type}
              className="text-xs px-2 py-1 rounded-full bg-muted/30 text-foreground border border-border"
            >
              {TYPE_LABEL[type] ?? type}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AlgorithmList({ summary }: { summary: CbomReportSummary }) {
  if (summary.algorithms.length === 0) return null
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">Algorithms in this CBOM</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
                Algorithm
              </th>
              <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
                Type
              </th>
              <th scope="col" className="py-2 text-muted-foreground font-medium">
                Standard
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.algorithms.map((algo) => (
              <tr key={`${algo.name}-${algo.classical}`} className="border-b border-border/50">
                <td className="py-2.5 pr-3 font-medium text-foreground font-mono text-xs">
                  {algo.name}
                </td>
                <td className="py-2.5 pr-3 text-xs">
                  <span className={algo.classical ? 'text-status-error' : 'text-status-success'}>
                    {algo.classical ? 'Classical' : 'Post-quantum'}
                  </span>
                </td>
                <td className="py-2.5 text-xs text-muted-foreground">
                  {algo.standard ? (
                    algo.standardUrl ? (
                      <a
                        href={algo.standardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {algo.standard}
                      </a>
                    ) : (
                      algo.standard
                    )
                  ) : (
                    <span className="italic">no published standard yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CbomSection({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const docs = useSavedArtifactDocuments('crypto-cbom')
  const latest = docs[0]
  const inputs = latest?.inputs as SavedCbomInputs | undefined
  const summary = inputs?.reportSummary

  return (
    <CollapsibleSection
      id="report-section-cbom"
      title="Cryptographic Bill of Materials (CBOM)"
      icon={<FileJson className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
      infoTip="cbom"
    >
      {!latest ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            A CBOM is a machine-readable inventory of every cryptographic algorithm in your estate —
            the CycloneDX 1.7 standard&apos;s answer to &quot;what crypto do I actually have.&quot;
            You haven&apos;t saved one to your Command Center yet.
          </p>
          <Link
            to={CBOM_BUILDER_LINK}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline print:hidden"
          >
            <ArrowRight size={12} />
            Build your CBOM in the CBOM Builder
          </Link>
        </div>
      ) : !summary ? (
        <div className="space-y-4">
          <div className="glass-panel p-3 border-l-4 border-l-warning">
            <p className="text-sm text-foreground font-medium">
              You have a saved CBOM (&quot;{latest.title}&quot;, saved{' '}
              {formatDate(latest.createdAt)}) — but it predates structured reporting on this page.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Re-open the CBOM Builder and save again to populate this section with real numbers.
            </p>
          </div>
          <Link
            to={CBOM_BUILDER_LINK}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline print:hidden"
          >
            <ArrowRight size={12} />
            Re-open the CBOM Builder
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            From your {MODE_LABEL[summary.mode] ?? summary.mode} — {summary.componentCount}{' '}
            {summary.componentCount === 1 ? 'component' : 'components'}, {summary.cryptoAssetCount}{' '}
            {summary.cryptoAssetCount === 1 ? 'crypto-asset' : 'crypto-assets'} detected, saved{' '}
            {formatDate(latest.createdAt)}.
          </p>

          <section aria-labelledby="cbom-compliance">
            <h4
              id="cbom-compliance"
              className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"
            >
              {summary.quantumVulnerableCount > 0 ? (
                <ShieldAlert size={14} className="text-status-error" />
              ) : (
                <ShieldCheck size={14} className="text-status-success" />
              )}
              Quantum-safety split
            </h4>
            <CompliancePanel summary={summary} />
          </section>

          <section aria-labelledby="cbom-coverage">
            <h4
              id="cbom-coverage"
              className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"
            >
              <Layers size={14} className="text-primary" />
              Component coverage
            </h4>
            <CoveragePanel summary={summary} />
          </section>

          <AlgorithmList summary={summary} />

          <div className="pt-2 border-t border-border">
            <Link
              to={CBOM_BUILDER_LINK}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline print:hidden"
            >
              <ArrowRight size={12} />
              Open the CBOM Builder to refresh or export the full CycloneDX 1.7 document
            </Link>
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}
