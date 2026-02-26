/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'

type RACIValue = 'R' | 'A' | 'C' | 'I' | ''

const ACTIVITIES = [
  'Crypto Inventory',
  'Risk Assessment',
  'Vendor Assessment',
  'Algorithm Selection',
  'Testing & Validation',
  'Deployment',
  'Monitoring & Compliance',
] as const

const ROLES = [
  'CISO',
  'CTO',
  'Enterprise Architect',
  'Dev Lead',
  'Compliance Officer',
  'Procurement',
] as const

const RACI_OPTIONS: { value: RACIValue; label: string }[] = [
  { value: '', label: '\u2014' },
  { value: 'R', label: 'R' },
  { value: 'A', label: 'A' },
  { value: 'C', label: 'C' },
  { value: 'I', label: 'I' },
]

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

export const RACIBuilder: React.FC = () => {
  const [matrix, setMatrix] = useState<MatrixState>(buildInitialMatrix)
  const [copied, setCopied] = useState(false)
  const { addExecutiveDocument } = useModuleStore()

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

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(exportMarkdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [exportMarkdown])

  const handleDownload = useCallback(() => {
    const blob = new Blob([exportMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pqc-raci-matrix.md'
    link.click()
    URL.revokeObjectURL(url)
  }, [exportMarkdown])

  const handleExportAndSave = useCallback(() => {
    addExecutiveDocument({
      id: `raci-${Date.now()}`,
      moduleId: 'pqc-governance',
      type: 'raci-matrix',
      title: 'PQC Migration RACI Matrix',
      data: exportMarkdown,
      createdAt: Date.now(),
    })
    handleDownload()
  }, [addExecutiveDocument, exportMarkdown, handleDownload])

  return (
    <div className="space-y-6">
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
                      <select
                        value={value}
                        onChange={(e) =>
                          handleCellChange(activity, role, e.target.value as RACIValue)
                        }
                        className={`w-full text-center text-xs font-bold rounded border px-1 py-1.5 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${getRACIColor(value)}`}
                      >
                        {RACI_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Export Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span className="ml-1.5">{copied ? 'Copied' : 'Copy Markdown'}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportAndSave}>
          <Download size={14} />
          <span className="ml-1.5">Export &amp; Save</span>
        </Button>
        <span className="text-xs text-muted-foreground">
          Exports as Markdown and saves to your learning artifacts.
        </span>
      </div>
    </div>
  )
}
