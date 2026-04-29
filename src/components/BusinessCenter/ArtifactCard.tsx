// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import { FileText, Eye, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import { TOOL_LABELS_BY_ARTIFACT_TYPE, getCswp39RefForArtifactType } from './businessToolsRegistry'

export const TYPE_LABELS: Record<ExecutiveDocumentType, string> = {
  'roi-model': 'ROI Model',
  'risk-register': 'Risk Register',
  'raci-matrix': 'RACI Matrix',
  'vendor-scorecard': 'Vendor Scorecard',
  'policy-draft': 'Policy Draft',
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
  'deployment-playbook': 'Deployment Playbook',
  'crypto-architecture': 'Crypto Architecture',
  'management-tools-audit': 'Management Tools Audit',
  'crypto-cbom': 'Crypto BOM (CBOM)',
  'crypto-vulnerability-watch': 'Crypto Vulnerability Watch',
}

const PILLAR_COLORS: Record<string, string> = {
  risk: 'bg-destructive/10 text-destructive',
  compliance: 'bg-status-warning/10 text-status-warning',
  governance: 'bg-primary/10 text-primary',
  vendor: 'bg-accent/10 text-accent',
  inventory: 'bg-pillar-inventory/10 text-pillar-inventory',
  architecture: 'bg-pillar-architecture/10 text-pillar-architecture',
}

export interface ArtifactCardProps {
  document: ExecutiveDocument
  pillar?: 'risk' | 'compliance' | 'governance' | 'vendor' | 'inventory' | 'architecture'
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
  const cswp39Ref = getCswp39RefForArtifactType(document.type)
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
          {cswp39Ref && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-muted text-muted-foreground border border-border"
              title={
                cswp39Ref.subSection
                  ? `NIST CSWP.39 ${cswp39Ref.sectionRef} — ${cswp39Ref.subSection}`
                  : `NIST CSWP.39 ${cswp39Ref.sectionRef}`
              }
            >
              {cswp39Ref.sectionRef}
            </span>
          )}
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

/** Placeholder card shown when no artifacts exist for a document type.
 *  Clicking the card opens the shared ArtifactDrawer in `create` mode with the
 *  matching builder — no navigation away from the Command Center. */
export function ArtifactPlaceholder({
  type,
  pillar,
  onCreate,
}: {
  type: ExecutiveDocumentType
  pillar?: 'risk' | 'compliance' | 'governance' | 'vendor' | 'inventory' | 'architecture'
  onCreate: (type: ExecutiveDocumentType) => void
}) {
  const typeLabel = TYPE_LABELS[type] ?? type
  const badgeColor = pillar
    ? (PILLAR_COLORS[pillar] ?? 'bg-muted text-muted-foreground')
    : 'bg-muted text-muted-foreground'
  const description =
    TOOL_LABELS_BY_ARTIFACT_TYPE[type]?.description ?? 'Click to open the builder.'
  const cswp39Ref = getCswp39RefForArtifactType(type)

  return (
    <Button
      variant="ghost"
      onClick={() => onCreate(type)}
      className="group flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/30 hover:bg-muted/30 transition-colors w-full text-left"
    >
      <FileText size={16} className="text-muted-foreground/40 shrink-0 group-hover:hidden" />
      <Plus size={16} className="text-primary shrink-0 hidden group-hover:block" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{typeLabel}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${badgeColor}`}>
            Not created
          </span>
          {cswp39Ref && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-muted text-muted-foreground border border-border"
              title={
                cswp39Ref.subSection
                  ? `NIST CSWP.39 ${cswp39Ref.sectionRef} — ${cswp39Ref.subSection}`
                  : `NIST CSWP.39 ${cswp39Ref.sectionRef}`
              }
            >
              {cswp39Ref.sectionRef}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground/60 line-clamp-1">{description}</span>
      </div>
    </Button>
  )
}
