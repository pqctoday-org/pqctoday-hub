// SPDX-License-Identifier: GPL-3.0-only
import { RiskRegisterBuilder } from '@/components/PKILearning/modules/PQCRiskManagement/components/RiskRegisterBuilder'
import { useRiskRegisterStore } from '@/store/useRiskRegisterStore'

/**
 * Zero-prop wrapper around {@link RiskRegisterBuilder} for the Command Center
 * artifact drawer and the /business/tools/:id route. Entries are persisted in
 * {@link useRiskRegisterStore} so they are shared with the Risk Heatmap
 * standalone (Risk Treatment Plan artifact) and survive page reloads.
 * RiskRegisterBuilder seeds its own defaults when entries are empty.
 */
export function RiskRegisterBuilderStandalone() {
  const riskEntries = useRiskRegisterStore((s) => s.riskEntries)
  const setRiskEntries = useRiskRegisterStore((s) => s.setRiskEntries)

  return <RiskRegisterBuilder riskEntries={riskEntries} onRiskEntriesChange={setRiskEntries} />
}

export default RiskRegisterBuilderStandalone
