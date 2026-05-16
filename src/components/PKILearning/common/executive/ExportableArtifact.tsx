// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback } from 'react'
import {
  Download,
  Copy,
  Printer,
  Check,
  Presentation,
  FileText,
  FileType2,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markdownToPptx } from '@/services/export/pptxExport'
import { markdownToDocx } from '@/services/export/docxExport'
import { markdownToPdf } from '@/services/export/pdfExport'

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
}

export const ExportableArtifact: React.FC<ExportableArtifactProps> = ({
  title,
  children,
  exportData,
  filename = 'export',
  formats = ['markdown'],
  onExport,
  wideTable = false,
}) => {
  const [copied, setCopied] = React.useState(false)
  const [savedFlash, setSavedFlash] = React.useState(false)
  const savedRef = React.useRef(false)
  const lastSavedDataRef = React.useRef<string>('')

  // Reset savedRef when exportData changes so re-export saves updated content.
  // Also clear the visual "Saved" pip so the user sees Save is available again.
  React.useEffect(() => {
    if (exportData !== lastSavedDataRef.current) {
      savedRef.current = false
      setSavedFlash(false)
    }
  }, [exportData])

  const triggerSave = useCallback(() => {
    if (onExport && !savedRef.current) {
      savedRef.current = true
      lastSavedDataRef.current = exportData
      onExport()
    }
  }, [onExport, exportData])

  const handleSaveClick = useCallback(() => {
    triggerSave()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }, [triggerSave])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(exportData)
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
      // eslint-disable-next-line security/detect-object-injection
      const blob = new Blob([exportData], { type: mimeMap[format] || 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.${ext}`
      link.click()
      URL.revokeObjectURL(url)
      triggerSave()
    },
    [exportData, filename, title, triggerSave, wideTable]
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
            <Button
              variant="gradient"
              size="sm"
              onClick={handleSaveClick}
              data-workshop-target="executive-artifact-save"
            >
              {savedFlash ? <Check size={14} /> : <Save size={14} />}
              <span className="ml-1.5">{savedFlash ? 'Saved' : 'Save'}</span>
            </Button>
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
