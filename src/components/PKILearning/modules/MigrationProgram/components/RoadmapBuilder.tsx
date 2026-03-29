// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { TimelinePlanner, ExportableArtifact } from '../../../common/executive'
import type { ExternalDeadline, Milestone } from '../../../common/executive'

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

    return md
  }, [selectedDeadlines, currentMilestones])

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

      <ExportableArtifact
        title="Roadmap Export"
        exportData={exportMarkdown}
        filename="pqc-migration-roadmap"
        formats={['markdown']}
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">
          Export your migration roadmap with milestones and regulatory deadlines.
        </p>
      </ExportableArtifact>
    </div>
  )
}
