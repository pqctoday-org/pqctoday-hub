// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import { FileText, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

export const TYPE_LABELS: Record<ExecutiveDocumentType, string> = {
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
  'crqc-scenario': 'CRQC Scenario',
  'supply-chain-matrix': 'Supply Chain Matrix',
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
  onRename?: (id: string, newTitle: string) => void
}

export function ArtifactCard({
  document,
  pillar,
  onView,
  onEdit,
  onDelete,
  onRename,
}: ArtifactCardProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(document.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) inputRef.current?.select()
  }, [isRenaming])

  const commitRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== document.title && onRename) {
      onRename(document.id, trimmed)
    }
    setIsRenaming(false)
  }

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
          {isRenaming ? (
            <input
              ref={inputRef}
              className="text-sm font-medium text-foreground bg-muted border border-input rounded px-1.5 py-0.5 w-full outline-none focus:ring-2 focus:ring-primary"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') {
                  setRenameValue(document.title)
                  setIsRenaming(false)
                }
              }}
            />
          ) : (
            <Button
              variant="ghost"
              type="button"
              className="text-sm font-medium text-foreground truncate cursor-text hover:underline decoration-dashed underline-offset-2 bg-transparent border-none p-0 text-left"
              onClick={() => {
                setRenameValue(document.title)
                setIsRenaming(true)
              }}
              title="Click to rename"
            >
              {document.title}
            </Button>
          )}
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
    <Button
      variant="ghost"
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
    </Button>
  )
}
