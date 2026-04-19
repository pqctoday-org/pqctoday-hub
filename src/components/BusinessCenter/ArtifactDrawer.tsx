// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useEffect, Suspense } from 'react'
import { X, Download, Pencil, Eye, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import {
  ARTIFACT_TYPE_TO_TOOL_ID,
  BUSINESS_TOOL_COMPONENTS,
  TOOL_LABELS_BY_ARTIFACT_TYPE,
} from './businessToolsRegistry'

// Builders are sourced from the single registry in businessToolsRegistry.tsx,
// which also powers the /business/tools/:id route. One registry, one lazy
// import per builder — zero duplication with that route.

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

export type DrawerMode = 'view' | 'edit' | 'create'

export interface ArtifactDrawerProps {
  /** Existing document for view/edit mode. Required when mode is 'view' | 'edit'. */
  document: ExecutiveDocument | null
  /** Artifact type to create. Required when mode is 'create' (document should be null). */
  createType?: ExecutiveDocumentType | null
  mode: DrawerMode
  onClose: () => void
  onModeChange: (mode: DrawerMode) => void
  /** Fires when the builder persists a new artifact while the drawer is in create mode.
   *  Parent may use this to switch to view mode on the newly created document. */
  onCreated?: (doc: ExecutiveDocument) => void
}

export function ArtifactDrawer({
  document,
  createType,
  mode,
  onClose,
  onModeChange,
  onCreated,
}: ArtifactDrawerProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [openedAt] = useState<number>(() => Date.now())
  const deleteExecutiveDocument = useModuleStore((s) => s.deleteExecutiveDocument)
  const executiveDocuments = useModuleStore((s) => s.artifacts.executiveDocuments)
  const isEmbedded = useIsEmbedded()

  // In create mode, watch the store for a new document of `createType` produced
  // after the drawer opened and bubble it up so the parent can flip to view mode.
  useEffect(() => {
    if (mode !== 'create' || !createType || !onCreated) return
    const match = (executiveDocuments ?? [])
      .filter((d) => d.type === createType && d.createdAt >= openedAt)
      .sort((a, b) => b.createdAt - a.createdAt)[0]
    if (match) onCreated(match)
  }, [mode, createType, executiveDocuments, openedAt, onCreated])

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

  const handlePrintToPdf = useCallback(() => {
    if (!document) return
    // Open a minimal print window with just the artifact content so the user's
    // browser print-to-PDF captures the artifact cleanly, without the drawer
    // chrome or the rest of the page.
    const win = globalThis.window.open('', '_blank', 'width=900,height=1200')
    if (!win) return
    const safeTitle = document.title.replace(/[<>&"']/g, '')
    const safeBody = document.data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; color: #111; line-height: 1.5; }
    h1 { font-size: 1.4rem; margin-bottom: 1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; }
    pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 0.95rem; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <pre>${safeBody}</pre>
</body>
</html>`)
    win.document.close()
    // Give the window a tick to render before opening the print dialog.
    win.addEventListener('load', () => {
      win.focus()
      win.print()
    })
    // Fallback: browsers that don't fire load for document.write close.
    setTimeout(() => {
      try {
        win.focus()
        win.print()
      } catch {
        /* ignore */
      }
    }, 300)
  }, [document])

  const handleDelete = useCallback(() => {
    if (!document) return
    deleteExecutiveDocument(document.id)
    onClose()
  }, [document, deleteExecutiveDocument, onClose])

  // Determine which artifact type the drawer is operating on (for builder lookup
  // and header labels), regardless of whether it's a create or view/edit flow.
  const activeType: ExecutiveDocumentType | null =
    mode === 'create' ? (createType ?? null) : (document?.type ?? null)
  if (!activeType) return null

  // Stable lookup via two static maps (property access, not function call) so
  // React Compiler / react-hooks/static-components sees the same component
  // reference per type across renders.
  const toolId = ARTIFACT_TYPE_TO_TOOL_ID[activeType]
  // eslint-disable-next-line security/detect-object-injection
  const BuilderComponent = toolId ? BUSINESS_TOOL_COMPONENTS[toolId] : undefined
  const toolLabel = TOOL_LABELS_BY_ARTIFACT_TYPE[activeType]
  const headerTitle =
    mode === 'create' ? `New ${toolLabel?.name ?? 'artifact'}` : (document?.title ?? '')
  const headerSubtitle =
    mode === 'create'
      ? (toolLabel?.description ?? 'Fill in the builder and save to add this artifact.')
      : document
        ? `Created ${new Date(document.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}`
        : ''

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
            <h2 className="text-lg font-semibold text-foreground truncate">{headerTitle}</h2>
            <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {mode === 'view' && document && BuilderComponent && (
              <Button variant="outline" size="sm" onClick={() => onModeChange('edit')}>
                <Pencil size={14} />
                <span className="hidden sm:inline ml-1">Edit</span>
              </Button>
            )}
            {mode === 'edit' && document && (
              <Button variant="outline" size="sm" onClick={() => onModeChange('view')}>
                <Eye size={14} />
                <span className="hidden sm:inline ml-1">View</span>
              </Button>
            )}
            {document && (
              <>
                <Button variant="ghost" size="sm" onClick={handleExportMarkdown}>
                  <Download size={14} />
                  <span className="hidden sm:inline ml-1">Markdown</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePrintToPdf}>
                  <Printer size={14} />
                  <span className="hidden sm:inline ml-1">PDF</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'view' && document ? (
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
              {mode === 'edit' && (
                <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground">
                    Editing opens the original builder. Save inside the builder to overwrite the
                    current version — your existing version is shown in View mode.
                  </p>
                </div>
              )}
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
            {document && deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Delete this artifact?</span>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : document ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete
              </Button>
            ) : null}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  )
}
