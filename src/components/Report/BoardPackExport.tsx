// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Package, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { downloadBoardPack } from '@/services/boardPackBuilder'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logEvent, personaLabel } from '@/utils/analytics'

declare const __APP_VERSION__: string

interface Props {
  result: AssessmentResult
  variant?: 'default' | 'outline'
}

/**
 * "Generate Board Pack" button (P15-P1-03).
 *
 * Builds a ZIP via `boardPackBuilder.downloadBoardPack` containing a curated
 * markdown + CSV + JSON bundle the user can drop into a board pack. Emits
 * `Report · Board Pack Exported` with the active persona dimension.
 */
export const BoardPackExport: React.FC<Props> = ({ result, variant = 'default' }) => {
  const industry = useAssessmentStore((s) => s.industry)
  const country = useAssessmentStore((s) => s.country)
  const selectedRegion = usePersonaStore((s) => s.selectedRegion)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle')

  const handleClick = async () => {
    if (status === 'busy') return
    setStatus('busy')
    try {
      await downloadBoardPack({
        result,
        profile: {
          industry: industry || '',
          country: country || '',
          region: selectedRegion ?? undefined,
          persona: selectedPersona,
          generatedAt: new Date().toISOString(),
        },
        appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
      })
      logEvent(
        'Report',
        'Board Pack Exported',
        personaLabel(`industry=${industry || 'unspec'}|risk=${result.riskLevel}`)
      )
      setStatus('done')
      setTimeout(() => setStatus('idle'), 1800)
    } catch (err) {
      console.error('Board Pack export failed:', err)
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
      aria-label="Generate Board Pack ZIP"
    >
      {status === 'busy' ? (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      ) : status === 'done' ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Package size={14} aria-hidden="true" />
      )}
      {status === 'busy' ? 'Building…' : status === 'done' ? 'Downloaded' : 'Board Pack ZIP'}
    </Button>
  )
}
