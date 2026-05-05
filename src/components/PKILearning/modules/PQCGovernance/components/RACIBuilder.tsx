// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { ExportableArtifact } from '../../../common/executive'
import { Button } from '@/components/ui/button'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

type RACIValue = 'R' | 'A' | 'C' | 'I' | ''

const ACTIVITIES = [
  'Crypto Inventory',
  'Risk Assessment',
  'Vendor Assessment',
  'Algorithm Selection',
  'Testing & Validation',
  'Deployment',
  'Monitoring & Compliance',
  'Training & Awareness',
  'Compliance Auditing',
  'Stakeholder Communications',
] as const

const ROLES = [
  'CISO',
  'CTO',
  'Enterprise Architect',
  'Dev Lead',
  'Compliance Officer',
  'Procurement',
] as const

const RACI_CYCLE: RACIValue[] = ['', 'R', 'A', 'C', 'I']

function cycleRACIValue(current: RACIValue): RACIValue {
  const idx = RACI_CYCLE.indexOf(current)
  return RACI_CYCLE[(idx + 1) % RACI_CYCLE.length]
}

function getRACIColor(value: RACIValue): string {
  switch (value) {
    case 'R':
      return 'bg-primary/20 text-primary border-primary/40'
    case 'A':
      return 'bg-accent/20 text-accent border-accent/40'
    case 'C':
      return 'bg-status-warning/20 text-status-warning border-status-warning/40'
    case 'I':
      return 'bg-muted text-muted-foreground border-border'
    default:
      return 'bg-background text-muted-foreground border-border'
  }
}

type MatrixState = Record<string, Record<string, RACIValue>>

function buildInitialMatrix(): MatrixState {
  const matrix: MatrixState = {}
  for (const activity of ACTIVITIES) {
    matrix[activity] = {}
    for (const role of ROLES) {
      matrix[activity][role] = ''
    }
  }
  return matrix
}

/** Default Accountable + key Responsible assignments per CSWP.39 §5 governance
 *  patterns. The user is expected to refine; this surfaces sensible owners
 *  rather than an empty grid. */
const DEFAULT_ASSIGNMENTS: Record<string, Partial<Record<(typeof ROLES)[number], RACIValue>>> = {
  'Crypto Inventory': { CISO: 'A', 'Enterprise Architect': 'R', 'Dev Lead': 'C' },
  'Risk Assessment': { CISO: 'A', 'Compliance Officer': 'C', 'Enterprise Architect': 'R' },
  'Vendor Assessment': { Procurement: 'A', CISO: 'C', 'Compliance Officer': 'C' },
  'Algorithm Selection': { CTO: 'A', 'Enterprise Architect': 'R', 'Dev Lead': 'C' },
  'Testing & Validation': { 'Dev Lead': 'A', 'Enterprise Architect': 'C', CTO: 'I' },
  Deployment: { CTO: 'A', 'Dev Lead': 'R', CISO: 'I' },
  'Monitoring & Compliance': { 'Compliance Officer': 'A', CISO: 'C', CTO: 'I' },
  'Training & Awareness': { CISO: 'A', 'Compliance Officer': 'R' },
  'Compliance Auditing': { 'Compliance Officer': 'A', CISO: 'C' },
  'Stakeholder Communications': { CISO: 'A', CTO: 'C', 'Compliance Officer': 'I' },
}

function buildSeededMatrix(): MatrixState {
  const matrix = buildInitialMatrix()
  for (const activity of ACTIVITIES) {
    const defaults = DEFAULT_ASSIGNMENTS[activity] ?? {}
    for (const role of ROLES) {
      matrix[activity][role] = defaults[role] ?? ''
    }
  }
  return matrix
}

export const RACIBuilder: React.FC = () => {
  const [matrix, setMatrix] = useState<MatrixState>(buildSeededMatrix)
  const [seedCleared, setSeedCleared] = useState(false)
  const { addExecutiveDocument } = useModuleStore()
  const { industry } = useExecutiveModuleData()

  const activitiesMissingAccountable = useMemo(() => {
    return ACTIVITIES.filter((activity) => {
      const row = matrix[activity]
      return !ROLES.some((role) => row?.[role] === 'A')
    })
  }, [matrix])

  const activitiesMultipleAccountable = useMemo(() => {
    return ACTIVITIES.filter((activity) => {
      const row = matrix[activity]
      const accountableCount = ROLES.filter((role) => row?.[role] === 'A').length
      return accountableCount > 1
    })
  }, [matrix])

  const handleCellChange = useCallback((activity: string, role: string, value: RACIValue) => {
    setMatrix((prev) => ({
      ...prev,
      [activity]: {
        ...prev[activity],
        [role]: value,
      },
    }))
  }, [])

  const exportMarkdown = useMemo(() => {
    let md = '# PQC Migration RACI Matrix\n\n'
    md += `Generated: ${new Date().toLocaleDateString()}\n\n`

    // Header row
    md += '| Activity |'
    for (const role of ROLES) {
      md += ` ${role} |`
    }
    md += '\n'

    // Separator
    md += '|----------|'
    md += '------|'.repeat(ROLES.length)
    md += '\n'

    // Data rows
    for (const activity of ACTIVITIES) {
      md += `| ${activity} |`
      for (const role of ROLES) {
        const val = matrix[activity]?.[role] || '-'
        md += ` ${val} |`
      }
      md += '\n'
    }

    md += '\n**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed\n'
    return md
  }, [matrix])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `raci-${Date.now()}`,
      moduleId: 'pqc-governance',
      type: 'raci-matrix',
      title: 'PQC Migration RACI Matrix',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, exportMarkdown])

  return (
    <div className="space-y-6">
      {!seedCleared && (
        <PreFilledBanner
          summary={`Default Accountable / Responsible assignments seeded from CSWP.39 governance patterns${industry ? ` (${industry} context)` : ''}. Refine per your org chart.`}
          onClear={() => {
            setMatrix(buildInitialMatrix())
            setSeedCleared(true)
          }}
        />
      )}
      <p className="text-sm text-muted-foreground">
        Assign RACI designations for each PQC migration activity. Click a cell to cycle through
        Responsible, Accountable, Consulted, Informed, or empty.
      </p>

      {/* RACI Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-border text-foreground font-semibold min-w-[160px]">
                Activity
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center p-2 border-b border-border text-foreground font-semibold min-w-[90px]"
                >
                  <span className="text-xs">{role}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIVITIES.map((activity) => (
              <tr key={activity} className="hover:bg-muted/30 transition-colors">
                <td className="p-2 border-b border-border text-foreground font-medium text-xs">
                  {activity}
                </td>
                {ROLES.map((role) => {
                  const value = matrix[activity]?.[role] || ''
                  return (
                    <td key={role} className="p-1 border-b border-border text-center">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleCellChange(activity, role, cycleRACIValue(value))}
                        aria-label={`${activity} \u2014 ${role}: ${value || 'empty'}. Click to cycle.`}
                        className={`w-full text-center text-xs font-bold rounded border px-1 py-1.5 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[32px] ${getRACIColor(value)}`}
                      >
                        {value || '\u2014'}
                      </Button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation Warnings */}
      {activitiesMissingAccountable.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-sm">
          <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Missing Accountable assignment</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each activity should have exactly one &quot;A&quot; (Accountable). Missing:{' '}
              {activitiesMissingAccountable.join(', ')}.
            </p>
          </div>
        </div>
      )}
      {activitiesMultipleAccountable.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-sm">
          <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Multiple Accountable assignments</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              RACI methodology requires exactly one &quot;A&quot; per activity. Multiple found:{' '}
              {activitiesMultipleAccountable.join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-6 rounded text-center leading-6 font-bold bg-primary/20 text-primary border border-primary/40">
            R
          </span>
          <span className="text-muted-foreground">Responsible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-6 rounded text-center leading-6 font-bold bg-accent/20 text-accent border border-accent/40">
            A
          </span>
          <span className="text-muted-foreground">Accountable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-6 rounded text-center leading-6 font-bold bg-status-warning/20 text-status-warning border border-status-warning/40">
            C
          </span>
          <span className="text-muted-foreground">Consulted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-6 rounded text-center leading-6 font-bold bg-muted text-muted-foreground border border-border">
            I
          </span>
          <span className="text-muted-foreground">Informed</span>
        </div>
      </div>

      {/* Export */}
      <ExportableArtifact
        title="RACI Matrix Export"
        exportData={exportMarkdown}
        filename="pqc-raci-matrix"
        formats={['markdown']}
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">Export your RACI matrix as Markdown.</p>
      </ExportableArtifact>
    </div>
  )
}
