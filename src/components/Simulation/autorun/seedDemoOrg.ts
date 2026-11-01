// SPDX-License-Identifier: AGPL-3.0-only
/**
 * seedDemoOrg — populate the shared inputs the simulation's embedded resources read,
 * so the auto-run never shows a "missing inputs" / empty state (No Report Yet, Select
 * Products, etc.) AND so pages that filter by the assessed org (industry, country)
 * have a scenario to scope to.
 *
 * Gap-filling: only sets what's absent, so it never clobbers a real user's own
 * assessment / product selection. Defines the scenario context — a mid-size Finance
 * & Banking org in the United States — that every embed should scope to.
 */
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { computeAssessment } from '@/hooks/useAssessmentEngine'
import { loadSampleOrganisation } from '../sampleOrganisation'

/** The scenario the auto-run demonstrates — used both to seed and (Part 2) to scope
 *  each embedded page. */
export const DEMO_SCENARIO = {
  industry: 'Finance & Banking',
  country: 'United States',
  persona: 'executive' as const,
}

const DEMO_PRODUCTS = [
  'openssl',
  'google-tink',
  'botan',
  'bouncy-castle-java',
  'qusecure-quprotect-r3',
  'sandboxaq-aqtive-guard',
  'sealsq-quantum-shield',
  'sap-cryptographic-library',
]

export function seedDemoOrg(): void {
  // Preserve both completed assessments and unfinished questionnaire answers.
  const form = useAssessmentFormStore.getState()
  if (!useAssessmentResultStore.getState().lastResult) {
    const input = form.assessmentStatus === 'complete' ? form.getInput() : null
    if (input) {
      const result = computeAssessment(input)
      useAssessmentResultStore.setState({
        lastResult: result,
        completedAt: new Date().toISOString(),
        sourceInputKey: JSON.stringify(input),
      })
    } else {
      loadSampleOrganisation()
    }
  }

  // 2) Product selection — unblocks vendor scorecard, CBOM, supply-chain, vuln-watch,
  //    initial-scoping, etc. (they read useSelectedProductIds / myProducts).
  const m = useMigrateSelectionStore.getState()
  if (m.myProducts.length === 0) for (const id of DEMO_PRODUCTS) m.toggleMyProduct(id)

  // 3) Persona + industry focus — gates persona sections AND scopes the embeds that
  //    filter by the persona store's selectedIndustries (Threats + Library) to the
  //    scenario industry, via their existing INDUSTRY_TO_THREATS_MAP / relevance maps.
  const p = usePersonaStore.getState()
  if (!p.selectedPersona) p.setPersona(DEMO_SCENARIO.persona)
  if (p.selectedIndustries.length === 0) p.setIndustries([DEMO_SCENARIO.industry])
}
