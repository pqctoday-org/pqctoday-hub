// SPDX-License-Identifier: GPL-3.0-only
// /report's "Industry Threat Landscape" section (REPORT_SECTION_ORDER:
// 'threatLandscape'). Extracted from ReportContent.tsx — see
// reportSectionToCswp39.ts.
import { ShieldAlert } from 'lucide-react'
import { ReportThreatsAppendix } from '../ReportThreatsAppendix'
import { FilteredChip } from '../FilteredChip'
import { CollapsibleSection } from './reportContentShared'

export const ThreatLandscapeSection = ({
  industry,
  currentCrypto,
  hiddenThreats,
  hideThreat,
  restoreAllThreats,
  hiddenForIndustryCount,
  defaultOpen,
}: {
  industry: string
  currentCrypto: string[]
  hiddenThreats: string[]
  hideThreat: (threatId: string) => void
  restoreAllThreats: () => void
  hiddenForIndustryCount: number
  defaultOpen: boolean
}) => (
  <div
    id="report-section-threatLandscape"
    className="print:break-before-page print:break-inside-auto"
  >
    <CollapsibleSection
      title={industry ? `${industry} Threat Landscape` : 'Industry Threat Landscape'}
      icon={<ShieldAlert className="text-destructive" size={20} />}
      defaultOpen={defaultOpen}
      infoTip="threatLandscape"
      headerExtra={
        hiddenForIndustryCount > 0 ? (
          <FilteredChip
            context={industry ?? 'industry'}
            hiddenCount={hiddenForIndustryCount}
            onRestore={(e) => {
              e.stopPropagation()
              restoreAllThreats()
            }}
          />
        ) : undefined
      }
    >
      <ReportThreatsAppendix
        industry={industry}
        userAlgorithms={currentCrypto}
        hiddenThreatIds={hiddenThreats}
        onHideThreat={hideThreat}
      />
    </CollapsibleSection>
  </div>
)
