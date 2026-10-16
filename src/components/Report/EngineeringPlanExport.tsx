// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Wrench, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { downloadEngineeringPlan } from '@/services/engineeringPlanBuilder'
import { softwareData } from '@/data/migrateData'
import { getCertsForProduct } from '@/data/certificationXrefData'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { useModuleStore } from '@/store/useModuleStore'
import { logEvent, personaLabel } from '@/utils/analytics'

declare const __APP_VERSION__: string

interface Props {
  result: AssessmentResult
}

/**
 * "Engineering migration plan" download for developer and IT-ops reports:
 * the algorithm backlog, bookmarked products with their FIPS state and
 * evidence, the latest saved Crypto API Refactor Audit and the release test
 * checklist, as one ZIP (see `engineeringPlanBuilder`).
 */
export const EngineeringPlanExport: React.FC<Props> = ({ result }) => {
  const selectedIds = useSelectedProductIds()
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments)
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle')

  const handleClick = async () => {
    if (status === 'busy') return
    setStatus('busy')
    try {
      const wanted = new Set(selectedIds)
      const products = softwareData.filter((p) => wanted.has(p.productId))
      const latestAudit = (documents ?? [])
        .filter((d) => d.type === 'crypto-api-refactor')
        .sort((a, b) => b.createdAt - a.createdAt)[0]
      await downloadEngineeringPlan({
        result,
        products,
        // pqcBoundary() reads each certificate's classicalOnly flag: a
        // classical-only certificate never counts as PQC inside the boundary.
        certsFor: (p) => getCertsForProduct(p.productId, p.softwareName),
        refactorAuditMarkdown: typeof latestAudit?.data === 'string' ? latestAudit.data : undefined,
        appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined,
        generatedAt: new Date().toISOString(),
      })
      logEvent(
        'Report',
        'Engineering Plan Exported',
        personaLabel(`products=${products.length}|audit=${latestAudit ? 'yes' : 'no'}`)
      )
      setStatus('done')
      setTimeout(() => setStatus('idle'), 1800)
    } catch (err) {
      console.error('Engineering plan export failed:', err)
      toast.error('Engineering plan export failed. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={status === 'busy'}
      className="gap-1.5"
      aria-label="Download engineering migration plan ZIP"
    >
      {status === 'busy' ? (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      ) : status === 'done' ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Wrench size={14} aria-hidden="true" />
      )}
      {status === 'busy'
        ? 'Building…'
        : status === 'done'
          ? 'Downloaded'
          : 'Engineering migration plan (ZIP)'}
    </Button>
  )
}
