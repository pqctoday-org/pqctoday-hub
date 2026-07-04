// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback } from 'react'
import { Download, Copy, Printer, Check, Presentation, FileText, FileType2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompleteStepAction } from '../CompleteStepAction'
import { markdownToPptx } from '@/services/export/pptxExport'
import { markdownToDocx } from '@/services/export/docxExport'
import { markdownToPdf } from '@/services/export/pdfExport'
import { copyToClipboard } from '@/utils/clipboard'

type ExportFormat = 'markdown' | 'json' | 'csv' | 'pptx' | 'docx' | 'pdf'

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

  const handleSaveClick = triggerSave

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
