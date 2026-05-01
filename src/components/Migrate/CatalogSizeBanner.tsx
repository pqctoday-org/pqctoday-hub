// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Layers, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MigrateViewMode } from '@/store/useMigrateSelectionStore'

interface CatalogSizeBannerProps {
  visible: number
  total: number
  viewMode: MigrateViewMode
  onSwitchView: (mode: MigrateViewMode) => void
}

export const CatalogSizeBanner: React.FC<CatalogSizeBannerProps> = ({
  visible,
  total,
  viewMode,
  onSwitchView,
}) => {
  const isFiltered = visible < total
  const isStackMode = viewMode === 'stack' || viewMode === 'cisaStack'

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 mb-3 rounded-lg bg-muted/40 border border-border text-sm">
      <span className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{visible.toLocaleString()}</span>
        {isFiltered && (
          <>
            {' '}
            of <span className="font-medium text-foreground">{total.toLocaleString()}</span>
          </>
        )}{' '}
        product{visible !== 1 ? 's' : ''}
      </span>

      {isStackMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSwitchView('table')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
        >
          <Table2 size={13} />
          Browse all in Table
        </Button>
      )}
      {viewMode === 'table' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSwitchView('stack')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
        >
          <Layers size={13} />
          View by Layer
        </Button>
      )}
    </div>
  )
}
