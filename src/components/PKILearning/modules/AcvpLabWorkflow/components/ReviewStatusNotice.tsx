// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Info } from 'lucide-react'
import { VALIDATION_DISCLAIMER } from '@/data/validationDisclaimer'
import { DISCLAIMER_IMPORT } from '@/services/acvp/evidence'
import { REVIEW_STATUS } from '../data/reviewStatus'

interface ReviewStatusNoticeProps {
  /** Also show the plan §2.2 prompt-import disclaimer (workshop/exercise surfaces). */
  includeImportDisclaimer?: boolean
}

/**
 * Visible review status + the required validation disclaimers (plan §2.2).
 * Rendered at the top of the Learn, Workshop and Exercises tabs so no reader
 * can take this module for a laboratory training resource.
 */
export const ReviewStatusNotice: React.FC<ReviewStatusNoticeProps> = ({
  includeImportDisclaimer = false,
}) => (
  <div
    role="note"
    aria-label="Module review status and validation disclaimer"
    data-testid="acvp-lab-status-notice"
    className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
  >
    <Info size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
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
