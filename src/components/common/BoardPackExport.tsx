// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Package, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { downloadBoardPack } from '@/services/boardPackBuilder'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useReportOwnershipStore } from '@/store/useReportOwnershipStore'
import { logEvent, personaLabel } from '@/utils/analytics'
import toast from 'react-hot-toast'
import type { PersonaId } from '@/data/learningPersonas'

declare const __APP_VERSION__: string

interface Props {
  result: AssessmentResult
  variant?: 'default' | 'outline'
  /** Displayed report context; shared/sample views must not inherit the viewer's estate. */
  persona?: PersonaId | null
  shared?: boolean
  sample?: boolean
}

/**
 * "Generate Board Pack" button (P15-P1-03).
 *
 * Builds a ZIP via `boardPackBuilder.downloadBoardPack` containing a curated
 * markdown + CSV + JSON bundle the user can drop into a board pack. Emits
 * `Report · Board Pack Exported` with the active persona dimension.
 */
export const BoardPackExport: React.FC<Props> = ({
  result,
  variant = 'default',
  persona,
  shared = false,
  sample = false,
}) => {
  const industry = useAssessmentStore((s) => s.industry)
  const country = useAssessmentStore((s) => s.country)
  const selectedRegion = usePersonaStore((s) => s.selectedRegion)
  const livePersona = usePersonaStore((s) => s.selectedPersona)
  const selectedPersona = persona === undefined ? livePersona : persona
  const programOwner = useReportOwnershipStore((s) => s.programOwner)
  const budgetOwner = useReportOwnershipStore((s) => s.budgetOwner)
  const accountableExecutive = useReportOwnershipStore((s) => s.accountableExecutive)
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle')
  // GRC gets the same pack plus the applicability register (boardPackBuilder's
  // isCompliancePack), named for what it is.
  const grc = selectedPersona === 'grc'
  const reportIndustry = result.assessmentProfile?.industry ?? (shared ? '' : industry || '')
  const reportCountry = result.assessmentProfile
    ? (result.assessmentProfile.country ?? '')
    : shared
      ? ''
      : country || ''

  const handleClick = async () => {
    if (status === 'busy') return
    setStatus('busy')
    try {
      await downloadBoardPack({
        result,
        profile: {
          industry: reportIndustry,
          country: reportCountry,
          region: shared ? undefined : (selectedRegion ?? undefined),
          persona: selectedPersona,
          sample,
          generatedAt: new Date().toISOString(),
          programOwner: shared ? undefined : programOwner || undefined,
          budgetOwner: shared ? undefined : budgetOwner || undefined,
          accountableExecutive: shared ? undefined : accountableExecutive || undefined,
        },
        appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
      })
      logEvent(
        'Report',
        'Board Pack Exported',
        personaLabel(`industry=${reportIndustry || 'unspec'}|risk=${result.riskLevel}`)
      )
      setStatus('done')
      setTimeout(() => setStatus('idle'), 1800)
    } catch (err) {
      console.error('Board Pack export failed:', err)
      // Surface the failure — resetting silently to idle is indistinguishable
      // from "nothing happened".
      toast.error('Board pack export failed. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <Button
      type="button"
      variant={variant === 'outline' ? 'outline' : 'gradient'}
      size="sm"
      onClick={handleClick}
      disabled={status === 'busy'}
      className="gap-1.5"
      aria-label={grc ? 'Generate Compliance Pack ZIP' : 'Generate Board Pack ZIP'}
      title={
        grc
          ? 'Assessment compliance reference pack'
          : 'Assessment report pack. Programme charters, proposals and roadmaps are separate Command Center documents.'
      }
    >
      {status === 'busy' ? (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      ) : status === 'done' ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Package size={14} aria-hidden="true" />
      )}
      {status === 'busy'
        ? 'Building…'
        : status === 'done'
          ? 'Downloaded'
          : grc
            ? 'Compliance Pack ZIP'
            : 'Board Pack ZIP'}
    </Button>
  )
}
