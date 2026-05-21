// SPDX-License-Identifier: GPL-3.0-only
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CopyButton } from '@/components/ui/CopyButton'

interface CopyableOutputProps {
  value: string
  label?: string
  rows?: number
  downloadFilename?: string
  className?: string
}

export const CopyableOutput = ({
  value,
  label,
  rows = 4,
  downloadFilename,
  className = '',
}: CopyableOutputProps) => {
  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFilename!
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <Textarea
        readOnly
        value={value}
        rows={rows}
        className="font-mono text-xs resize-none"
        aria-label={label ?? 'output'}
      />
      <div className="flex gap-2">
        <CopyButton text={value} label="Copy" />
        {downloadFilename && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
            aria-label={`Download as ${downloadFilename}`}
          >
            <Download size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Download</span>
          </Button>
        )}
      </div>
    </div>
  )
}
