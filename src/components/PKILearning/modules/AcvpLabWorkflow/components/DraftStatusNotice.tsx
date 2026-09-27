// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'
import { DISCLAIMER_IMPORT } from '@/services/acvp/evidence'
import { REVIEW_STATUS } from '../data/reviewStatus'

interface DraftStatusNoticeProps {
  /** Also show the plan §2.2 prompt-import disclaimer (workshop/exercise surfaces). */
  includeImportDisclaimer?: boolean
}

/**
 * Visible review status + the required validation disclaimers (plan §2.2).
 * Rendered at the top of the Learn, Workshop and Exercises tabs so no reader
 * can take this module for a reviewed lab training resource.
 */
export const DraftStatusNotice: React.FC<DraftStatusNoticeProps> = ({
  includeImportDisclaimer = false,
}) => (
  <div
    role="note"
    aria-label="Draft module status and validation disclaimer"
    data-testid="acvp-lab-draft-notice"
    className="flex gap-3 rounded-lg border border-status-warning/40 bg-status-warning/10 p-4 text-sm"
  >
    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-warning" aria-hidden="true" />
    <div className="space-y-2">
      <p className="font-semibold text-foreground">{REVIEW_STATUS.label}</p>
      <p className="text-foreground/80">{REVIEW_STATUS.detail}</p>
      <p className="text-xs text-muted-foreground">{VALIDATION_DISCLAIMER}</p>
      {includeImportDisclaimer ? (
        <p className="text-xs text-muted-foreground">{DISCLAIMER_IMPORT}</p>
      ) : null}
    </div>
  </div>
)
