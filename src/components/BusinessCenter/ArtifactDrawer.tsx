// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, lazy, Suspense } from 'react'
import { X, Download, Pencil, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import { useIsEmbedded } from '@/embed/EmbedProvider'

// ── Lazy builder imports ────────────────────────────────────────────────
// Each builder is lazy-loaded from its learn module directory.
// Self-contained builders render as-is; prop-dependent ones use wrappers.

// Helper: React.lazy requires a default export; all builders use named exports.
/* eslint-disable @typescript-eslint/no-explicit-any */
function lazyNamed<T extends Record<string, React.ComponentType<any>>>(
  loader: () => Promise<T>,
  name: keyof T
) {
  return lazy(() => loader().then((m) => ({ default: m[name] as React.ComponentType<any> }))) // eslint-disable-line security/detect-object-injection
}

const BUILDER_MAP: Partial<
  Record<ExecutiveDocumentType, React.LazyExoticComponent<React.ComponentType<any>>>
> = {
  'raci-matrix': lazyNamed(
    () => import('@/components/PKILearning/modules/PQCGovernance/components/RACIBuilder'),
    'RACIBuilder'
  ),
  'policy-draft': lazyNamed(
    () =>
      import('@/components/PKILearning/modules/PQCGovernance/components/PolicyTemplateGenerator'),
    'PolicyTemplateGenerator'
  ),
  'kpi-dashboard': lazyNamed(
    () => import('@/components/PKILearning/modules/PQCGovernance/components/KPIDashboardBuilder'),
    'KPIDashboardBuilder'
  ),
  'board-deck': lazyNamed(
    () => import('@/components/PKILearning/modules/PQCBusinessCase/components/BoardPitchBuilder'),
    'BoardPitchBuilder'
  ),
  'vendor-scorecard': lazyNamed(
    () => import('@/components/PKILearning/modules/VendorRisk/components/VendorScorecardBuilder'),
    'VendorScorecardBuilder'
  ),
  'contract-clause': lazyNamed(
    () => import('@/components/PKILearning/modules/VendorRisk/components/ContractClauseGenerator'),
    'ContractClauseGenerator'
  ),
  'risk-register': lazyNamed(
    () =>
      import('@/components/PKILearning/modules/PQCRiskManagement/components/RiskRegisterBuilder'),
    'RiskRegisterBuilder'
  ),
  'risk-treatment-plan': lazyNamed(
    () =>
      import('@/components/PKILearning/modules/PQCRiskManagement/components/RiskHeatmapGenerator'),
    'RiskHeatmapGenerator'
  ),
  'compliance-timeline': lazyNamed(
    () =>
      import('@/components/PKILearning/modules/ComplianceStrategy/components/ComplianceTimelineBuilder'),
    'ComplianceTimelineBuilder'
  ),
  'audit-checklist': lazyNamed(
    () =>
      import('@/components/PKILearning/modules/ComplianceStrategy/components/AuditReadinessChecklist'),
    'AuditReadinessChecklist'
  ),
  'migration-roadmap': lazyNamed(
    () => import('@/components/PKILearning/modules/MigrationProgram/components/RoadmapBuilder'),
    'RoadmapBuilder'
  ),
  'kpi-tracker': lazyNamed(
    () => import('@/components/PKILearning/modules/MigrationProgram/components/KPITrackerTemplate'),
    'KPITrackerTemplate'
  ),
  'stakeholder-comms': lazyNamed(
    () =>
      import('@/components/PKILearning/modules/MigrationProgram/components/StakeholderCommsPlanner'),
    'StakeholderCommsPlanner'
  ),
}

// ── Markdown renderer (simple) ──────────────────────────────────────────

function MarkdownPreview({ content }: { content: string }) {
  // Simple line-based renderer for artifact markdown
  const lines = content.split('\n')
  return (
    <div className="prose prose-sm max-w-none text-foreground">
      {lines.map((line, i) => {
        if (line.startsWith('# '))
          return (
            <h1 key={i} className="text-xl font-bold text-foreground mt-4 mb-2">
              {line.slice(2)}
            </h1>
          )
        if (line.startsWith('## '))
          return (
            <h2 key={i} className="text-lg font-semibold text-foreground mt-3 mb-1.5">
              {line.slice(3)}
            </h2>
          )
        if (line.startsWith('### '))
          return (
            <h3 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1">
              {line.slice(4)}
            </h3>
          )
        if (line.startsWith('- '))
          return (
            <li key={i} className="text-sm text-foreground ml-4 list-disc">
              {line.slice(2)}
            </li>
          )
        if (line.startsWith('| '))
          return (
            <pre key={i} className="text-xs text-muted-foreground font-mono">
              {line}
            </pre>
          )
        if (line.startsWith('---')) return <hr key={i} className="border-border my-3" />
        if (line.trim() === '') return <div key={i} className="h-2" />
        return (
          <p key={i} className="text-sm text-foreground leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}

// ── Drawer component ────────────────────────────────────────────────────

export type DrawerMode = 'view' | 'edit'

export interface ArtifactDrawerProps {
  document: ExecutiveDocument | null
  mode: DrawerMode
  onClose: () => void
  onModeChange: (mode: DrawerMode) => void
}

export function ArtifactDrawer({ document, mode, onClose, onModeChange }: ArtifactDrawerProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)
  const isEmbedded = useIsEmbedded()

  const handleExportMarkdown = useCallback(() => {
    if (!document) return
    const blob = new Blob([document.data], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = globalThis.document.createElement('a')
    anchor.href = url
    anchor.download = `${document.title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [document])

  const handleDelete = useCallback(() => {
    if (!document) return
    deleteExecutiveDocument(document.id)
    onClose()
  }, [document, deleteExecutiveDocument, onClose])

  if (!document) return null

  const BuilderComponent = BUILDER_MAP[document.type]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 bg-black/60 z-50`}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close drawer"
      />

      {/* Drawer panel */}
      <div
        className={`${isEmbedded ? 'absolute' : 'fixed'} inset-y-0 right-0 w-full sm:w-[600px] lg:w-[720px] z-50 bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{document.title}</h2>
            <p className="text-xs text-muted-foreground">
              Created{' '}
              {new Date(document.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {mode === 'view' && BuilderComponent && (
              <Button variant="outline" size="sm" onClick={() => onModeChange('edit')}>
                <Pencil size={14} />
                <span className="hidden sm:inline ml-1">Edit</span>
              </Button>
            )}
            {mode === 'edit' && (
              <Button variant="outline" size="sm" onClick={() => onModeChange('view')}>
                <Eye size={14} />
                <span className="hidden sm:inline ml-1">View</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleExportMarkdown}>
              <Download size={14} />
              <span className="hidden sm:inline ml-1">Export</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'view' ? (
            <MarkdownPreview content={document.data} />
          ) : BuilderComponent ? (
            <Suspense
              fallback={
                <div className="space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-32 w-full" />
                </div>
              }
            >
              <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground">
                  Editing opens the original builder with default values. Your previous version is
                  shown above in View mode.
                </p>
              </div>
              <BuilderComponent />
            </Suspense>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No editor available for this artifact type. Use the export button to download and
                edit externally.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
          <div>
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Delete this artifact?</span>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  )
}
