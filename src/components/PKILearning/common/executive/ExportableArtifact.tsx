// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback } from 'react'
import { Download, Copy, Printer, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportableArtifactProps {
  title: string
  children: React.ReactNode
  exportData: string
  filename?: string
  formats?: ('markdown' | 'json' | 'csv')[]
  onExport?: () => void
}

export const ExportableArtifact: React.FC<ExportableArtifactProps> = ({
  title,
  children,
  exportData,
  filename = 'export',
  formats = ['markdown'],
  onExport,
}) => {
  const [copied, setCopied] = React.useState(false)
  const savedRef = React.useRef(false)
  const lastSavedDataRef = React.useRef<string>('')

  // Reset savedRef when exportData changes so re-export saves updated content
  React.useEffect(() => {
    if (exportData !== lastSavedDataRef.current) {
      savedRef.current = false
    }
  }, [exportData])

  const triggerSave = useCallback(() => {
    if (onExport && !savedRef.current) {
      savedRef.current = true
      lastSavedDataRef.current = exportData
      onExport()
    }
  }, [onExport, exportData])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(exportData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    triggerSave()
  }, [exportData, triggerSave])

  const handleDownload = useCallback(
    (format: string) => {
      const ext = format === 'markdown' ? 'md' : format
      const mimeMap: Record<string, string> = {
        markdown: 'text/markdown',
        json: 'application/json',
        csv: 'text/csv',
      }
      const blob = new Blob([exportData], { type: mimeMap[format] || 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.${ext}`
      link.click()
      URL.revokeObjectURL(url)
      triggerSave()
    },
    [exportData, filename, triggerSave]
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
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          {formats.map((format) => (
            <Button key={format} variant="outline" size="sm" onClick={() => handleDownload(format)}>
              <Download size={14} />
              <span className="ml-1.5">.{format === 'markdown' ? 'md' : format}</span>
            </Button>
          ))}
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
