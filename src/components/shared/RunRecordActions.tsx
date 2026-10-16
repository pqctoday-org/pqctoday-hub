// SPDX-License-Identifier: GPL-3.0-only
/**
 * The "Download run record (JSON)" button plus the one-line provenance (site
 * version and short commit) shown under a researcher tool's result panel.
 */
import type { FC } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { siteProvenanceLine } from '@/services/runRecordExport'

interface RunRecordActionsProps {
  onDownload: () => void
  /** Hide the button (e.g. before a run) but keep the provenance line. */
  canDownload?: boolean
  testId?: string
}

export const RunProvenanceLine: FC<{ testId?: string }> = ({ testId }) => (
  <p className="text-[11px] text-muted-foreground font-mono" data-testid={testId}>
    {siteProvenanceLine()}
  </p>
)

export const RunRecordActions: FC<RunRecordActionsProps> = ({
  onDownload,
  canDownload = true,
  testId = 'run-record',
}) => (
  <div className="flex flex-wrap items-center gap-3 pt-1">
    {canDownload && (
      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        data-testid={`${testId}-download`}
        title="Downloads a JSON file with this run's inputs, results, the site build it ran on and what it does not show"
      >
        <Download size={14} className="mr-1" aria-hidden="true" />
        Download run record (JSON)
      </Button>
    )}
    <RunProvenanceLine testId={`${testId}-provenance`} />
  </div>
)
