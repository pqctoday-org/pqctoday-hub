// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface KpiSampleBaselineControlProps {
  loaded: boolean
  onLoad: () => void
  onClear: () => void
}

/**
 * Lets a learner on a fresh worksheet see the combined score and the persona
 * weights at work, using clearly labelled fictional values that never count as
 * their own entries.
 */
export const KpiSampleBaselineControl: React.FC<KpiSampleBaselineControlProps> = ({
  loaded,
  onLoad,
  onClear,
}) => (
  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
    <div className="flex flex-wrap items-center gap-2">
      {loaded ? (
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear sample baseline
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={onLoad}>
          Load sample baseline
        </Button>
      )}
      <span role="status">
        {loaded
          ? 'Sample baseline loaded: the KPIs you type in show fictional Hub sample values, labelled "Hub sample baseline value". Values you entered yourself are kept. Move a slider to replace a sample value with your own, then switch the persona lens to see the same values re-weighted.'
          : 'New worksheet? Load a fictional sample baseline for the KPIs you normally type in, so the Overall Score and the persona weights can be explored before you enter your own values. Values you entered yourself are kept.'}
      </span>
    </div>
  </div>
)
