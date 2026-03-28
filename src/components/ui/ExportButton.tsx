// SPDX-License-Identifier: GPL-3.0-only
import { Download } from 'lucide-react'
import { Button } from './button'

interface ExportButtonProps {
  onExport: () => void
  label?: string
  className?: string
}

export const ExportButton = ({
  onExport,
  label = 'Export CSV',
  className = '',
}: ExportButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onExport}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20 ${className}`}
      aria-label={label}
    >
      <Download size={14} aria-hidden="true" />
      <span className="hidden lg:inline">{label}</span>
    </Button>
  )
}
