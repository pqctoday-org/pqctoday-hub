import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { TimelinePlanner } from '../../../common/executive'
import type { ExternalDeadline, Milestone } from '../../../common/executive'

function getDeadlineYear(deadline: string): number | null {
  const match = deadline.match(/(\d{4})/)
  return match ? parseInt(match[1]) : null
}

interface GapItem {
  framework: string
  deadlineYear: number
  status: 'completed' | 'on-track' | 'at-risk'
  gap: string
}

function computeGapAnalysis(
  frameworkDeadlines: ExternalDeadline[],
  milestones: Milestone[]
): GapItem[] {
  const now = new Date().getFullYear()
  const latestMilestoneYear =
    milestones.length > 0 ? Math.max(...milestones.map((m) => m.year)) : now

  return frameworkDeadlines.map((d) => {
    const yearsRemaining = d.year - now
    const milestonesBeforeDeadline = milestones.filter((m) => m.year <= d.year)
    const hasCertificationMilestone = milestonesBeforeDeadline.some(
      (m) => m.category === 'Certification' || m.category === 'Renewal'
    )

    let status: 'completed' | 'on-track' | 'at-risk'
    let gap: string

    if (d.year <= now && hasCertificationMilestone) {
      status = 'completed'
      gap = 'Deadline met'
    } else if (d.year <= now) {
      status = 'at-risk'
      gap = `Deadline passed ${now - d.year} year${now - d.year !== 1 ? 's' : ''} ago`
    } else if (latestMilestoneYear >= d.year || hasCertificationMilestone) {
      status = 'on-track'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining, plan extends to deadline`
    } else if (yearsRemaining <= 2 && milestones.length === 0) {
      status = 'at-risk'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining, no milestones planned`
    } else if (yearsRemaining <= 3 && latestMilestoneYear < d.year - 1) {
      status = 'at-risk'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining, plan gap of ${d.year - latestMilestoneYear} year${d.year - latestMilestoneYear !== 1 ? 's' : ''}`
    } else {
      status = 'on-track'
      gap = `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining`
    }

    return {
      framework: d.label,
      deadlineYear: d.year,
      status,
      gap,
    }
  })
}

export const ComplianceTimelineBuilder: React.FC = () => {
  const { frameworks, countryDeadlines } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const [milestones, setMilestones] = useState<Milestone[]>([])

  // Build external deadlines from country data and frameworks
  const externalDeadlines = useMemo(() => {
    const deadlines: ExternalDeadline[] = []
    const seen = new Set<string>()

    // Country-level deadlines from timeline data
    for (const country of countryDeadlines) {
      for (const body of country.bodies) {
        for (const event of body.events) {
          if (event.phase === 'Regulation' || event.phase === 'Deadline') {
            const key = `${body.name}-${event.endYear}`
            if (!seen.has(key)) {
              seen.add(key)
              deadlines.push({
                label: `${country.countryName} - ${body.name}`,
                year: event.endYear,
                source: body.fullName,
                color: 'var(--status-error)',
              })
            }
          }
        }
      }
    }

    // Framework deadlines
    for (const fw of frameworks) {
      const year = getDeadlineYear(fw.deadline)
      if (year) {
        const key = `fw-${fw.id}-${year}`
        if (!seen.has(key)) {
          seen.add(key)
          deadlines.push({
            label: fw.label,
            year,
            source: fw.enforcementBody || 'Compliance Framework',
          })
        }
      }
    }

    return deadlines.sort((a, b) => a.year - b.year).slice(0, 15) // Limit to 15 to avoid visual overload
  }, [frameworks, countryDeadlines])

  const gapAnalysis = useMemo(
    () => computeGapAnalysis(externalDeadlines, milestones),
    [externalDeadlines, milestones]
  )

  const handleMilestonesChange = (updated: Milestone[]) => {
    setMilestones(updated)
  }

  const handleExportTimeline = () => {
    let md = '# Compliance Timeline\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    md += '## External Deadlines\n\n'
    md += '| Year | Deadline | Source |\n'
    md += '|------|----------|--------|\n'
    for (const d of externalDeadlines) {
      md += `| ${d.year} | ${d.label} | ${d.source} |\n`
    }

    md += '\n## Migration Milestones\n\n'
    md += '| Year | Milestone | Phase |\n'
    md += '|------|-----------|-------|\n'
    for (const m of milestones) {
      md += `| ${m.year} | ${m.label} | ${m.category || ''} |\n`
    }

    md += '\n## Gap Analysis\n\n'
    md += '| Framework | Deadline | Status | Notes |\n'
    md += '|-----------|----------|--------|-------|\n'
    for (const g of gapAnalysis) {
      md += `| ${g.framework} | ${g.deadlineYear} | ${g.status.toUpperCase()} | ${g.gap} |\n`
    }

    addExecutiveDocument({
      id: `compliance-timeline-${Date.now()}`,
      type: 'compliance-timeline',
      title: 'Compliance Timeline',
      data: md,
      createdAt: Date.now(),
      moduleId: 'compliance-strategy',
    })
  }

  const atRiskCount = gapAnalysis.filter((g) => g.status === 'at-risk').length
  const onTrackCount = gapAnalysis.filter((g) => g.status === 'on-track').length
  const completedCount = gapAnalysis.filter((g) => g.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Timeline Planner */}
      <TimelinePlanner
        title="Compliance Timeline"
        initialMilestones={[]}
        deadlines={externalDeadlines}
        yearRange={[2025, Math.max(2036, new Date().getFullYear() + 10)] as [number, number]}
        categories={['Assessment', 'Remediation', 'Certification', 'Reporting', 'Renewal']}
        onMilestonesChange={handleMilestonesChange}
      />

      {/* Gap Analysis */}
      {externalDeadlines.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Gap Analysis</h3>
            <div className="flex items-center gap-4 text-xs">
              {completedCount > 0 && (
                <span className="flex items-center gap-1 text-status-success">
                  <CheckCircle2 size={12} /> {completedCount} completed
                </span>
              )}
              {onTrackCount > 0 && (
                <span className="flex items-center gap-1 text-status-success">
                  <TrendingUp size={12} /> {onTrackCount} on track
                </span>
              )}
              {atRiskCount > 0 && (
                <span className="flex items-center gap-1 text-status-error">
                  <AlertTriangle size={12} /> {atRiskCount} at risk
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {gapAnalysis.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.status === 'at-risk'
                    ? 'border-status-error/30 bg-status-error/5'
                    : item.status === 'completed'
                      ? 'border-status-success/30 bg-status-success/5'
                      : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.status === 'completed' && (
                    <CheckCircle2 size={16} className="text-status-success shrink-0" />
                  )}
                  {item.status === 'on-track' && (
                    <TrendingUp size={16} className="text-status-success shrink-0" />
                  )}
                  {item.status === 'at-risk' && (
                    <AlertTriangle size={16} className="text-status-error shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.framework}</div>
                    <div className="text-xs text-muted-foreground">{item.gap}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary">{item.deadlineYear}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.status === 'at-risk'
                        ? 'bg-status-error/20 text-status-error'
                        : item.status === 'completed'
                          ? 'bg-status-success/20 text-status-success'
                          : 'bg-status-success/10 text-status-success'
                    }`}
                  >
                    {item.status === 'at-risk'
                      ? 'At Risk'
                      : item.status === 'completed'
                        ? 'Done'
                        : 'On Track'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {milestones.length === 0 && (
            <div className="glass-panel p-4 text-center">
              <Clock size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Add migration milestones above to see how they align with compliance deadlines.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Export Button */}
      {(milestones.length > 0 || externalDeadlines.length > 0) && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Save Timeline</h4>
              <p className="text-xs text-muted-foreground">
                Export your compliance timeline and gap analysis as a document.
              </p>
            </div>
            <button
              onClick={handleExportTimeline}
              className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Save to Documents
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
