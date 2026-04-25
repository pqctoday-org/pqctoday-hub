// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { Button } from '@/components/ui/button'
import { TimelinePlanner, ExportableArtifact } from '../../../common/executive'
import type { ExternalDeadline, Milestone } from '../../../common/executive'

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

export const RoadmapBuilder: React.FC = () => {
  const { countryDeadlines } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()

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

  const [currentMilestones, setCurrentMilestones] = React.useState<Milestone[]>(DEFAULT_MILESTONES)
  const [selectedDeadlines, setSelectedDeadlines] = React.useState<ExternalDeadline[]>([])

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
        initialMilestones={DEFAULT_MILESTONES}
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
                <select
                  className="text-sm rounded-md border border-input bg-background p-2"
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
