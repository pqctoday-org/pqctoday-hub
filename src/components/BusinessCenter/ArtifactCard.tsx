// SPDX-License-Identifier: GPL-3.0-only
import { FileText, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

const TYPE_LABELS: Record<ExecutiveDocumentType, string> = {
  'roi-model': 'ROI Model',
  'risk-register': 'Risk Register',
  'raci-matrix': 'RACI Matrix',
  'vendor-scorecard': 'Vendor Scorecard',
  'policy-draft': 'Policy Draft',
  roadmap: 'Roadmap',
  'compliance-checklist': 'Compliance Checklist',
  'audit-checklist': 'Audit Checklist',
  'compliance-timeline': 'Compliance Timeline',
  'board-deck': 'Board Deck',
  'contract-clause': 'Contract Clause',
  'kpi-dashboard': 'KPI Dashboard',
  'migration-roadmap': 'Migration Roadmap',
  'stakeholder-comms': 'Stakeholder Comms',
  'kpi-tracker': 'KPI Tracker',
  'risk-treatment-plan': 'Risk Treatment Plan',
}

const PILLAR_COLORS: Record<string, string> = {
  risk: 'bg-destructive/10 text-destructive',
  compliance: 'bg-status-warning/10 text-status-warning',
  governance: 'bg-primary/10 text-primary',
  vendor: 'bg-accent/10 text-accent',
}

export interface ArtifactCardProps {
  document: ExecutiveDocument
  pillar?: 'risk' | 'compliance' | 'governance' | 'vendor'
  onView: (doc: ExecutiveDocument) => void
  onEdit: (doc: ExecutiveDocument) => void
  onDelete: (doc: ExecutiveDocument) => void
}

export function ArtifactCard({ document, pillar, onView, onEdit, onDelete }: ArtifactCardProps) {
  const typeLabel = TYPE_LABELS[document.type] ?? document.type
  const badgeColor = pillar
    ? (PILLAR_COLORS[pillar] ?? 'bg-muted text-muted-foreground')
    : 'bg-muted text-muted-foreground'
  const createdDate = new Date(document.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors">
      <FileText size={16} className="text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground truncate">{document.title}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${badgeColor}`}>
            {typeLabel}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{createdDate}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView(document)}>
          <Eye size={14} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(document)}>
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(document)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  )
}

/** Placeholder card shown when no artifacts exist for a document type */
export function ArtifactPlaceholder({
  type,
  moduleId,
  pillar,
  onNavigate,
}: {
  type: ExecutiveDocumentType
  moduleId: string
  pillar?: 'risk' | 'compliance' | 'governance' | 'vendor'
  onNavigate: (path: string) => void
}) {
  const typeLabel = TYPE_LABELS[type] ?? type
  const badgeColor = pillar
    ? (PILLAR_COLORS[pillar] ?? 'bg-muted text-muted-foreground')
    : 'bg-muted text-muted-foreground'

  return (
    <button
      onClick={() => onNavigate(`/learn/${moduleId}`)}
      className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/30 hover:bg-muted/30 transition-colors w-full text-left"
    >
      <FileText size={16} className="text-muted-foreground/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{typeLabel}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${badgeColor}`}>
            Not created
          </span>
        </div>
        <span className="text-xs text-muted-foreground/60">
          Build in the {moduleId.replace(/-/g, ' ')} module
        </span>
      </div>
    </button>
  )
}
