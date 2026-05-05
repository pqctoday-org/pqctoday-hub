// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RiskHeatmapGenerator } from '@/components/PKILearning/modules/PQCRiskManagement/components/RiskHeatmapGenerator'
import { useRiskRegisterStore, DEFAULT_RISK_ENTRIES } from '@/store/useRiskRegisterStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

/**
 * Zero-prop wrapper around {@link RiskHeatmapGenerator} for the Command Center
 * artifact drawer and /business/tools/:id route. Pulls risk entries from
 * {@link useRiskRegisterStore} (populated by the Risk Register Builder). If no
 * entries exist yet, the user is prompted to build the register first, or can
 * one-click load sample entries to explore the treatment workflow standalone.
 */
export function RiskHeatmapGeneratorStandalone() {
  const riskEntries = useRiskRegisterStore((s) => s.riskEntries)
  const setRiskEntries = useRiskRegisterStore((s) => s.setRiskEntries)
  const navigate = useNavigate()
  const { myFrameworks, myProducts, myThreats } = useExecutiveModuleData()
  const seededFromAssessment =
    riskEntries.length > 0 && riskEntries[0]?.id?.startsWith('assess-risk-')

  const sources: string[] = []
  if (seededFromAssessment) {
    if (myProducts.length > 0)
      sources.push(
        `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`
      )
    if (myThreats.length > 0)
      sources.push(`${myThreats.length} threat${myThreats.length !== 1 ? 's' : ''} from /threats`)
    if (myFrameworks.length > 0)
      sources.push(
        `${myFrameworks.length} framework${myFrameworks.length !== 1 ? 's' : ''} from /compliance`
      )
  }

  if (riskEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="text-muted-foreground">
          <Grid3X3 size={32} />
        </div>
        <p className="text-sm font-medium text-foreground">No risk entries yet</p>
        <p className="text-sm text-muted-foreground max-w-md">
          The heatmap visualises entries from your Risk Register. Build your register first, or load
          sample entries to explore the treatment workflow.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/business/tools/risk-register')}
          >
            Build Risk Register
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRiskEntries(DEFAULT_RISK_ENTRIES)}>
            Load sample entries
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {seededFromAssessment && (
        <PreFilledBanner
          summary={`Heatmap reflects ${riskEntries.length} risk entr${riskEntries.length !== 1 ? 'ies' : 'y'} from your Risk Register${sources.length ? ` (seeded from ${sources.join(' + ')})` : ''}.`}
          onClear={() => setRiskEntries(DEFAULT_RISK_ENTRIES)}
        />
      )}
      <RiskHeatmapGenerator riskEntries={riskEntries} />
    </div>
  )
}

export default RiskHeatmapGeneratorStandalone
