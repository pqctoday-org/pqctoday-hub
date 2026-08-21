// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useRef } from 'react'
import { Download, Copy, Printer, Check, Presentation, FileText, FileType2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompleteStepAction } from '../CompleteStepAction'
import { markdownToPptx } from '@/services/export/pptxExport'
import { markdownToDocx } from '@/services/export/docxExport'
import { markdownToPdf } from '@/services/export/pdfExport'
import { copyToClipboard } from '@/utils/clipboard'

type ExportFormat = 'markdown' | 'json' | 'csv' | 'pptx' | 'docx' | 'pdf'

/** Debounce before an in-progress edit is auto-saved. Mirrors the KPI
 *  Dashboard's proven 500 ms `scheduleSave`, lengthened slightly because this
 *  path fires on free-text keystrokes as well as slider drags. */
export const ARTIFACT_AUTOSAVE_DELAY_MS = 800

// --- Unsaved-changes guard --------------------------------------------------
// Autosave shrinks the true data-loss window to "closed the tab within one
// debounce interval of the last keystroke". A `beforeunload` prompt covers
// exactly that case. In-app navigation needs no guard once autosave lands
// (the pending timer is flushed on unmount), so there is deliberately no
// react-router blocker here. (WS6 task 4.)
const dirtyArtifacts = new Set<object>()
let unloadListenerBound = false

function handleBeforeUnload(e: BeforeUnloadEvent): void {
  if (dirtyArtifacts.size === 0) return
  e.preventDefault()
  e.returnValue = ''
}

/**
 * Has the user physically interacted with the page since THIS artifact
 * mounted? Autosave must follow a real edit, never the artifact's own data
 * settling — several tools recompute `exportData` shortly after mount as
 * `useExecutiveModuleData` / catalog loaders resolve, and saving on that would
 * record artifacts the user never touched (and, where two workshop steps share
 * one `moduleId`+`type` store slot, let merely walking past step 1 overwrite
 * step 2's saved draft). A ref rather than state: this must not re-render.
 */
export function useHasUserInteracted(): React.RefObject<boolean> {
  const interacted = useRef(false)
  useEffect(() => {
    interacted.current = false
    const mark = () => {
      interacted.current = true
    }
    // `input`/`change` matter as well as pointer/key: a slider drag and a
    // paste both reach a field without a keystroke. None of these fire when
    // React writes a value from props, which is exactly the distinction.
    const EVENTS = ['pointerdown', 'keydown', 'input', 'change'] as const
    for (const evt of EVENTS) window.addEventListener(evt, mark, true)
    return () => {
      for (const evt of EVENTS) window.removeEventListener(evt, mark, true)
    }
  }, [])
  return interacted
}

/** Register (or clear) "this artifact has edits not yet written to the store".
 *  Shared with ArtifactBuilder, whose Edit mode keeps ExportableArtifact
 *  unmounted and so runs its own copy of the same debounce. */
export function setArtifactDirty(token: object, dirty: boolean): void {
  if (typeof window === 'undefined') return
  if (dirty) {
    dirtyArtifacts.add(token)
    if (!unloadListenerBound) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      unloadListenerBound = true
    }
    return
  }
  dirtyArtifacts.delete(token)
  if (dirtyArtifacts.size === 0 && unloadListenerBound) {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    unloadListenerBound = false
  }
}

interface ExportableArtifactProps {
  title: string
  children: React.ReactNode
  exportData: string
  filename?: string
  formats?: ExportFormat[]
  onExport?: () => void
  /** Render the PDF in A4 landscape for wide tables (RACI matrix, CBOM,
   *  supply-chain grid, framework checklist, contract clauses). Audit M4. */
  wideTable?: boolean
  /** Structured CSV for the `.csv` export, built by the tool from its own data
   *  model (RFC-4180). When the `csv` format is offered, the tool MUST pass this
   *  — otherwise the button would save the markdown body with a `.csv`
   *  extension, which opens as one column of pipe text. Audit C5. */
  csvData?: string
}

export const ExportableArtifact: React.FC<ExportableArtifactProps> = ({
  title,
  children,
  exportData,
  filename = 'export',
  formats = ['markdown'],
  onExport,
  wideTable = false,
  csvData,
}) => {
  const [copied, setCopied] = React.useState(false)
  // Persistent done-state: `wasSaved` stays set across edits; once the content
  // changes after a save the badge reads "Saved · edited since" rather than
  // flickering back to "Save" on every recompute (sliders/calculators).
  const [wasSaved, setWasSaved] = React.useState(false)
  const [lastSavedData, setLastSavedData] = React.useState<string | null>(null)
  const editedSince = wasSaved && lastSavedData !== null && exportData !== lastSavedData

  const triggerSave = useCallback(() => {
    // Save only when there's something new — preserves the no-double-save guard
    // while still allowing a re-save after the artifact is edited.
    if (onExport && (lastSavedData === null || exportData !== lastSavedData)) {
      setLastSavedData(exportData)
      setWasSaved(true)
      onExport()
    }
  }, [onExport, exportData, lastSavedData])

  // --- Debounced autosave ---------------------------------------------------
  // Root cause #1 of the 2026-07-03 remediation ("no persistence across
  // navigation") was never fixed: `onExport` only ever fired from an
  // export-adjacent click, so in-progress edits died on navigation. This
  // effect writes them through the SAME guarded `triggerSave()` the Save
  // button calls, so it inherits both of its guards for free — it no-ops when
  // `onExport` is undefined (e.g. DataDrivenScorecard's internal render) and
  // never re-saves unchanged content. (WS6 task 1.)
  const triggerSaveRef = useRef(triggerSave)
  useEffect(() => {
    triggerSaveRef.current = triggerSave
  }, [triggerSave])

  const dirtyTokenRef = useRef({})
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSavePendingRef = useRef(false)
  const mountedOnceRef = useRef(false)
  const userInteracted = useHasUserInteracted()

  const cancelPendingAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    autoSavePendingRef.current = false
    setArtifactDirty(dirtyTokenRef.current, false)
  }, [])

  useEffect(() => {
    // The first render is a mount, not an edit — saving here would record a
    // pristine artifact the user never touched.
    if (!mountedOnceRef.current) {
      mountedOnceRef.current = true
      return
    }
    if (!onExport) return
    // Only a real edit — not the artifact's own data settling after mount.
    if (!userInteracted.current) return
    autoSavePendingRef.current = true
    setArtifactDirty(dirtyTokenRef.current, true)
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null
      autoSavePendingRef.current = false
      setArtifactDirty(dirtyTokenRef.current, false)
      triggerSaveRef.current()
    }, ARTIFACT_AUTOSAVE_DELAY_MS)
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [exportData, csvData, onExport, userInteracted])

  // Navigating away inside the debounce window must not drop the last edit —
  // that is the exact failure this work stream exists to fix. The cleanup
  // above only clears the timer; this one flushes the pending write.
  useEffect(() => {
    const token = dirtyTokenRef.current
    return () => {
      if (autoSavePendingRef.current) {
        autoSavePendingRef.current = false
        triggerSaveRef.current()
      }
      setArtifactDirty(token, false)
    }
  }, [])

  // An explicit Save must cancel the pending timer's now-redundant fire.
  const handleSaveClick = useCallback(() => {
    cancelPendingAutoSave()
    triggerSave()
  }, [cancelPendingAutoSave, triggerSave])

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(exportData)
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    triggerSave()
  }, [exportData, triggerSave])

  const handleDownload = useCallback(
    async (format: ExportFormat) => {
      if (format === 'pptx') {
        await markdownToPptx(exportData, filename)
        triggerSave()
        return
      }
      if (format === 'docx') {
        await markdownToDocx(exportData, filename, title)
        triggerSave()
        return
      }
      if (format === 'pdf') {
        await markdownToPdf(exportData, filename, title, { wideTable })
        triggerSave()
        return
      }
      const ext = format === 'markdown' ? 'md' : format
      const mimeMap: Record<string, string> = {
        markdown: 'text/markdown',
        json: 'application/json',
        csv: 'text/csv',
      }
      // For `.csv`, prefer the tool's structured CSV; fall back to the markdown
      // body only if the tool didn't provide one (avoids pipe-text-in-Excel).
      const payload = format === 'csv' && csvData != null ? csvData : exportData
      // eslint-disable-next-line security/detect-object-injection
      const blob = new Blob([payload], { type: mimeMap[format] || 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.${ext}`
      link.click()
      URL.revokeObjectURL(url)
      triggerSave()
    },
    [exportData, filename, title, triggerSave, wideTable, csvData]
  )

  const handlePrint = useCallback(() => {
    window.print()
    triggerSave()
  }, [triggerSave])

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {onExport && (
            <CompleteStepAction
              recordsArtifact
              saved={wasSaved}
              editedSinceSave={editedSince}
              onClick={handleSaveClick}
              dataWorkshopTarget="executive-artifact-save"
            />
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          {formats.map((format) => {
            const icon =
              format === 'pptx' ? (
                <Presentation size={14} />
              ) : format === 'docx' ? (
                <FileText size={14} />
              ) : format === 'pdf' ? (
                <FileType2 size={14} />
              ) : (
                <Download size={14} />
              )
            return (
              <Button
                key={format}
                variant="outline"
                size="sm"
                onClick={() => handleDownload(format)}
              >
                {icon}
                <span className="ml-1.5">.{format === 'markdown' ? 'md' : format}</span>
              </Button>
            )
          })}
          <Button variant="ghost" size="sm" onClick={handlePrint} className="print:hidden">
            <Printer size={14} />
            <span className="ml-1.5">Print</span>
          </Button>
        </div>
      </div>
      <div className="border-t border-border pt-4">{children}</div>
    </div>
  )
}
