// SPDX-License-Identifier: AGPL-3.0-only
// /report's HNDL/HNFL risk section (REPORT_SECTION_ORDER: 'hndlHnfl') plus the
// two quick-track "not quantified" warning banners that render alongside it.
// Extracted from ReportContent.tsx — see reportSectionToCswp39.ts.
import { AlertTriangle } from 'lucide-react'
import type { HNDLRiskWindow, TNFLRiskWindow } from '../../../hooks/assessmentTypes'
import { AskAssistantButton } from '../../ui/AskAssistantButton'
import { ReportHNDLHNFLSection } from './reportContentShared'

export const HndlHnflWindowsSection = ({
  hndl,
  hnfl,
  defaultOpen,
}: {
  hndl?: HNDLRiskWindow
  hnfl?: TNFLRiskWindow
  defaultOpen: boolean
}) => (
  <div id="report-section-hndlHnfl">
    <ReportHNDLHNFLSection
      hndl={hndl}
      hnfl={hnfl}
      defaultOpen={defaultOpen}
      headerExtra={
        <AskAssistantButton
          question="Explain Harvest Now Decrypt Later risk for my organization"
          className="print:hidden"
        />
      }
    />
  </div>
)

export const HndlNotQuantifiedWarning = () => (
  <div className="glass-panel p-4 border-l-4 border-l-warning flex items-start gap-3">
    <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-foreground">HNDL Window Not Modelled</p>
      <p className="text-xs text-muted-foreground mt-1">
        This quick assessment did not include data retention information. Harvest-Now-Decrypt-Later
        window cannot be modelled. For sensitive long-lived data, run a full assessment and replace
        assumptions with documented retention evidence.
      </p>
    </div>
  </div>
)

export const HnflNotQuantifiedWarning = () => (
  <div className="glass-panel p-4 border-l-4 border-l-destructive flex items-start gap-3">
    <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-foreground">Signature Window Not Modelled</p>
      <p className="text-xs text-muted-foreground mt-1">
        Your assessment includes signature algorithms vulnerable to Shor&apos;s algorithm. A
        signature-transition window cannot be modelled without credential lifetime data. Run a full
        assessment, then verify certificate and signing-key lifecycles.
      </p>
    </div>
  </div>
)
