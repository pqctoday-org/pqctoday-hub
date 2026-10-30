// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { upcomingReferenceMilestones } from './regulatoryMilestones'
import type { ComplianceFramework } from '../../../../data/complianceData'
import type { ApplicabilityResult } from '../../../../utils/applicabilityEngine'

interface RegulatoryClockProps {
  mandatoryFrameworks: ApplicabilityResult<ComplianceFramework>[]
  recognizedFrameworks?: ApplicabilityResult<ComplianceFramework>[]
  onSelectFramework?: (framework: ComplianceFramework) => void
}

export function RegulatoryClock({
  mandatoryFrameworks,
  recognizedFrameworks = [],
  onSelectFramework,
}: RegulatoryClockProps) {
  const [currentYear] = useState(() => new Date().getFullYear())
  const lines = upcomingReferenceMilestones(mandatoryFrameworks, recognizedFrameworks, currentYear)
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2 text-sm">
      <p className="font-medium text-foreground">
        <Clock size={14} className="inline mr-2" aria-hidden="true" />
        Upcoming reference milestones
      </p>
      {lines.length ? (
        lines.map(({ item, year }) => (
          <div key={item.id} className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{year}</span>
            {onSelectFramework ? (
              <Button
                variant="link"
                type="button"
                className="text-primary underline text-left whitespace-normal h-auto py-1"
                onClick={() => onSelectFramework(item)}
                aria-label={`Inspect source for ${item.label}`}
              >
                {item.label}
              </Button>
            ) : (
              <span>{item.label}</span>
            )}
          </div>
        ))
      ) : (
        <p>
          No upcoming source-listed years in this scope. Review the source records for other
          milestones.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Year-level reference data; confirm exact dates, affected systems and applicability.
        Historical entries remain in the timeline.
      </p>
    </div>
  )
}
