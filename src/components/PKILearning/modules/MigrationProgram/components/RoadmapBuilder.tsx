// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useAlgorithmTransitionsForAssessment } from '@/hooks/useAlgorithmTransitionsForAssessment'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { Button } from '@/components/ui/button'
import { TimelinePlanner, ExportableArtifact } from '../../../common/executive'
import type { ExternalDeadline, Milestone } from '../../../common/executive'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useBookmarkStore } from '@/store/useBookmarkStore'

interface MitigationGatewayRow {
  asset: string
  gatewayProductId: string
  reason: string
  sunset: string
}

const MODULE_ID = 'migration-program'

const DEFAULT_CATEGORIES = [
  'Discovery',
  'Planning',
  'Pilot',
  'Migration',
  'Validation',
  'Completion',
]

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'ms-default-1',
    label: 'Complete Crypto Inventory',
    year: 2025,
    category: 'Discovery',
  },
  {
    id: 'ms-default-2',
    label: 'Pilot PQC in TLS',
    year: 2026,
    category: 'Pilot',
  },
  {
    id: 'ms-default-3',
    label: 'Full Migration',
    year: 2030,
    category: 'Migration',
  },
]

/**
 * Parse the Year out of a transition CSV deprecation/standardization date.
 * The CSV uses formats like "2030 (Deprecated) / 2035 (Disallowed)" or
 * "2024 (FIPS 203)" or just "2030". Returns the FIRST 4-digit year.
 */
function extractYear(raw: string): number | null {
  const m = raw.match(/(20\d{2})/)
  return m ? Number(m[1]) : null
}

export const RoadmapBuilder: React.FC = () => {
  const { countryDeadlines, algorithmMigrations } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const transitions = useAlgorithmTransitionsForAssessment()
  const myTimelineCountries = useBookmarkStore((s) => s.myTimelineCountries)
  const myProductIdsBookmarked = useMigrateSelectionStore((s) => s.myProducts)
  const toggleMyProduct = useMigrateSelectionStore((s) => s.toggleMyProduct)

  // Map country deadlines to ExternalDeadline[] format
  const externalDeadlines: ExternalDeadline[] = useMemo(() => {
    const deadlines: ExternalDeadline[] = []
    for (const country of countryDeadlines) {
      for (const body of country.bodies) {
        for (const event of body.events) {
          // Include milestones and deadlines as external reference points
          if (
            event.phase === 'Deadline' ||
            event.phase === 'Regulation' ||
            event.phase === 'Policy'
          ) {
            deadlines.push({
              label: event.title,
              year: event.endYear,
              source: country.countryName,
            })
          }
        }
      }
    }
    // Deduplicate by label+year and sort by year
    const seen = new Set<string>()
    return deadlines
      .filter((d) => {
        const key = `${d.label}-${d.year}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.year - b.year)
  }, [countryDeadlines])

  // Assessment-derived milestones: one per reported algorithm transition,
  // anchored on the deprecation year from the NIST transitions CSV. Falls back
  // to algorithmMigrations[] urgency when the transition date is missing.
  const assessmentMilestones = useMemo<Milestone[]>(() => {
    if (transitions.length === 0) return []
    return transitions.map((t, i) => {
      const year =
        extractYear(t.deprecationDate) ??
        extractYear(t.standardizationDate) ??
        (algorithmMigrations.find((m) => m.classical === t.classical)?.urgency === 'immediate'
          ? new Date().getFullYear() + 1
          : new Date().getFullYear() + 3)
      return {
        id: `assess-ms-${i + 1}`,
        label: `Migrate ${t.classical}${t.keySize ? ` (${t.keySize})` : ''} → ${t.pqc}`,
        year,
        category: 'Migration',
      }
    })
  }, [transitions, algorithmMigrations])

  const seedMilestones = assessmentMilestones.length > 0 ? assessmentMilestones : DEFAULT_MILESTONES
  const [currentMilestones, setCurrentMilestones] = React.useState<Milestone[]>(seedMilestones)
  const [seededFromAssessment, setSeededFromAssessment] = React.useState(
    assessmentMilestones.length > 0
  )
  // Pre-select deadlines from countries the user bookmarked on /timeline.
  // Match by `country.countryName` since that's the field stored in
  // `myTimelineCountries`.
  const initialSelectedDeadlines = useMemo<ExternalDeadline[]>(() => {
    if (myTimelineCountries.length === 0) return []
    const set = new Set(myTimelineCountries.map((c) => c.toLowerCase()))
    return externalDeadlines.filter((d) => set.has(d.source.toLowerCase()))
  }, [myTimelineCountries, externalDeadlines])
  const [selectedDeadlines, setSelectedDeadlines] =
    React.useState<ExternalDeadline[]>(initialSelectedDeadlines)

  // CSWP.39 §4.6 — Mitigation gateway rows for assets where direct migration is blocked.
  const myProductIds = useMigrateSelectionStore((s) => s.myProducts)
  const candidateGateways = useMemo(() => {
    const myProductSet = new Set(myProductIds)
    const isGatewayCategory = (cat: string) => /gateway|sase|zero[\s-]?trust|tls/i.test(cat || '')
    return softwareData
      .filter((p) => isGatewayCategory(p.categoryName))
      .map((p) => ({
        productId: p.productId,
        label: `${p.softwareName} (${p.categoryName})`,
        selected: myProductSet.has(p.productId),
      }))
      .sort((a, b) => Number(b.selected) - Number(a.selected) || a.label.localeCompare(b.label))
  }, [myProductIds])

  const [mitigations, setMitigations] = React.useState<MitigationGatewayRow[]>([])

  const addMitigation = () =>
    setMitigations((prev) => [...prev, { asset: '', gatewayProductId: '', reason: '', sunset: '' }])
  const updateMitigation = (idx: number, patch: Partial<MitigationGatewayRow>) =>
    setMitigations((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  const removeMitigation = (idx: number) =>
    setMitigations((prev) => prev.filter((_, i) => i !== idx))

  const exportMarkdown = useMemo(() => {
    let md = '# PQC Migration Roadmap\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    if (selectedDeadlines.length > 0) {
      md += '## External Regulatory Deadlines\n\n'
      md += '| Year | Deadline | Source |\n'
      md += '|------|----------|--------|\n'
      for (const d of selectedDeadlines) {
        md += `| ${d.year} | ${d.label} | ${d.source} |\n`
      }
      md += '\n'
    }

    md += '## Migration Milestones\n\n'
    md += '| Year | Milestone | Phase |\n'
    md += '|------|-----------|-------|\n'
    for (const m of currentMilestones) {
      md += `| ${m.year} | ${m.label} | ${m.category || ''} |\n`
    }
    md += '\n'

    md += '## Migration Phases\n\n'
    for (const cat of DEFAULT_CATEGORIES) {
      const catMilestones = currentMilestones.filter((m) => m.category === cat)
      if (catMilestones.length > 0) {
        md += `### ${cat}\n\n`
        for (const m of catMilestones) {
          md += `- ${m.year}: ${m.label}\n`
        }
        md += '\n'
      }
    }

    // CSWP.39 §4.6 — Mitigation Gateway specs (with mandatory sunset date).
    md += '## Mitigation Gateway (CSWP.39 §4.6)\n\n'
    if (mitigations.length === 0) {
      md +=
        '_No mitigation gateways specified. Per §4.6: "Mitigation is not a permanent solution" — every mitigation requires a sunset date._\n\n'
    } else {
      md += '| Asset | Gateway product | Reason | Sunset |\n|---|---|---|---|\n'
      for (const m of mitigations) {
        const gateway =
          softwareData.find((p) => p.productId === m.gatewayProductId)?.softwareName ||
          m.gatewayProductId ||
          '—'
        md += `| ${m.asset || '—'} | ${gateway} | ${m.reason || '—'} | ${m.sunset || '⚠ MISSING'} |\n`
      }
      md += '\n'
    }

    return md
  }, [selectedDeadlines, currentMilestones, mitigations])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `migration-roadmap-${Date.now()}`,
      moduleId: MODULE_ID,
      type: 'migration-roadmap',
      title: 'PQC Migration Roadmap',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown])

  return (
    <div className="space-y-6">
      {seededFromAssessment && (
        <PreFilledBanner
          summary={`${assessmentMilestones.length} milestone${assessmentMilestones.length !== 1 ? 's' : ''} from your reported algorithms, anchored on NIST deprecation dates.`}
          onClear={() => {
            setCurrentMilestones(DEFAULT_MILESTONES)
            setSeededFromAssessment(false)
          }}
        />
      )}

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <p className="text-sm font-medium text-foreground">
            {externalDeadlines.length} regulatory deadlines available from Timeline data
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Select the deadlines relevant to your organization, then add your milestones to see how
          your plan aligns with compliance requirements.
        </p>
      </div>

      <TimelinePlanner
        title="PQC Migration Roadmap"
        initialMilestones={seedMilestones}
        deadlines={externalDeadlines}
        yearRange={[2025, Math.max(2036, new Date().getFullYear() + 10)] as [number, number]}
        categories={DEFAULT_CATEGORIES}
        onMilestonesChange={setCurrentMilestones}
        onSelectedDeadlinesChange={setSelectedDeadlines}
      />

      {/* CSWP.39 §4.6 — Mitigation Gateway specs */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Mitigation Gateways (CSWP.39 §4.6)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              For assets where direct migration is blocked, document the gateway / bump-in-the-wire
              that mitigates the risk — every entry must carry a mandatory sunset date.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMitigation}>
            + Add mitigation
          </Button>
        </div>
        {mitigations.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No mitigations specified.</p>
        ) : (
          <div className="space-y-2">
            {mitigations.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start">
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Asset (e.g., legacy MQ)"
                  value={row.asset}
                  onChange={(e) => updateMitigation(idx, { asset: e.target.value })}
                  aria-label="Asset"
                />
                <div className="flex items-center gap-1">
                  <select
                    className="text-sm rounded-md border border-input bg-background p-2 flex-1"
                    value={row.gatewayProductId}
                    onChange={(e) => updateMitigation(idx, { gatewayProductId: e.target.value })}
                    aria-label="Gateway product"
                  >
                    <option value="">— Select gateway —</option>
                    {candidateGateways.map((g) => (
                      <option key={g.productId} value={g.productId}>
                        {g.selected ? '★ ' : ''}
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {row.gatewayProductId && (
                    <Button
                      type="button"
                      variant={
                        myProductIdsBookmarked.includes(row.gatewayProductId)
                          ? 'secondary'
                          : 'outline'
                      }
                      size="sm"
                      className="h-7 px-2 text-[10px] shrink-0"
                      onClick={() => toggleMyProduct(row.gatewayProductId)}
                      title={
                        myProductIdsBookmarked.includes(row.gatewayProductId)
                          ? 'Remove from My Products'
                          : 'Add to My Products (saves on /migrate)'
                      }
                    >
                      {myProductIdsBookmarked.includes(row.gatewayProductId) ? '★ Mine' : '+ Mine'}
                    </Button>
                  )}
                </div>
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Reason (why migration is blocked)"
                  value={row.reason}
                  onChange={(e) => updateMitigation(idx, { reason: e.target.value })}
                  aria-label="Reason"
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    required
                    className="text-sm rounded-md border border-input bg-background p-2 flex-1"
                    placeholder="Sunset (YYYY-MM-DD)"
                    value={row.sunset}
                    onChange={(e) => updateMitigation(idx, { sunset: e.target.value })}
                    aria-label="Sunset date"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMitigation(idx)}
                    aria-label="Remove mitigation"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExportableArtifact
        title="Roadmap Export"
        exportData={exportMarkdown}
        filename="pqc-migration-roadmap"
        formats={['markdown']}
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">
          Export your migration roadmap with milestones, regulatory deadlines, and mitigation
          gateways.
        </p>
      </ExportableArtifact>
    </div>
  )
}
