// SPDX-License-Identifier: GPL-3.0-only
import { useState, type FC } from 'react'
import { Network, Factory, Key, AlertTriangle, Map } from 'lucide-react'
import { EnergyUtilitiesIntroduction } from './components/EnergyUtilitiesIntroduction'
import { EnergyUtilitiesExercises } from './components/EnergyUtilitiesExercises'
import { ProtocolSecurityAnalyzer } from './workshop/ProtocolSecurityAnalyzer'
import { SubstationMigrationPlanner } from './workshop/SubstationMigrationPlanner'
import { SmartMeterKeyManager } from './workshop/SmartMeterKeyManager'
import { SafetyRiskScorer } from './workshop/SafetyRiskScorer'
import { GridMigrationRoadmap } from './workshop/GridMigrationRoadmap'
import { RFMeshSimulator } from './workshop/RFMeshSimulator'
import {
  DEFAULT_SUBSTATION,
  DEFAULT_FLEET,
  DEFAULT_UTILITY,
  type SubstationProfile,
  type SmartMeterFleetConfig,
  type UtilityProfile,
  type SafetyRiskResult,
} from './data/energyConstants'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'protocol-security-analyzer',
    title: 'Step 1: Protocol Analyzer',
    description: 'Assess PQC readiness of energy protocols — IEC 61850, DNP3, Modbus, DLMS/COSEM.',
    icon: Network,
  },
  {
    id: 'substation-migration-planner',
    title: 'Step 2: Substation Planner',
    description:
      'Plan PQC migration for IEC 61850 substations across protection, control, and metering zones.',
    icon: Factory,
  },
  {
    id: 'smart-meter-key-manager',
    title: 'Step 3: Meter Key Manager',
    description: 'Plan PQC key rotation for smart meter fleets of 1M–20M devices using DLMS/COSEM.',
    icon: Key,
  },
  {
    id: 'safety-risk-scorer',
    title: 'Step 4: Risk Scorer',
    description:
      'Score safety and environmental consequences of cryptographic failures in energy systems.',
    icon: AlertTriangle,
  },
  {
    id: 'grid-migration-roadmap',
    title: 'Step 5: Grid Roadmap',
    description:
      'Generate a utility-wide PQC migration roadmap with NERC CIP milestones and budget estimates.',
    icon: Map,
  },
  {
    id: 'rf-mesh-simulator',
    title: 'Step 6: RF Mesh Simulator',
    description:
      'Model the Time-on-Air and network saturation of 900MHz smart meter mesh networks under PQC payload loads.',
    icon: Network,
  },
]

/**
 * Holds the cross-step shared state the workshop lifts above its steps
 * (substation / meter-fleet / utility profiles + risk results). Mounted once
 * for the whole workshop; the individual step bodies still remount on
 * `configKey` via their per-step `key`.
 *
 * Reset is handled by the caller via the wrapper's `key`: the shell's Reset
 * bumps `configKey` with no config, so the caller keys this component on
 * `reset-${configKey}` and the default profiles/results are restored by a fresh
 * mount — matching the pre-ModuleShell Reset behavior. An exercise prefill
 * always carries a defined config, so it keeps a stable key and the shared
 * state survives (as before).
 *
 * Each step's in-body "Continue" button (the original `onComplete`) advances the
 * stepper via `goToStep` — which marks the current step complete and moves
 * forward, identical to the old `handleStepComplete`.
 */
const EnergyUtilitiesWorkshop: FC<{
  index: number
  configKey: number
  goToStep: (step: number) => void
}> = ({ index, configKey, goToStep }) => {
  const [substationProfile, setSubstationProfile] = useState<SubstationProfile>({
    ...DEFAULT_SUBSTATION,
  })
  const [meterFleetConfig, setMeterFleetConfig] = useState<SmartMeterFleetConfig>({
    ...DEFAULT_FLEET,
  })
  const [utilityProfile, setUtilityProfile] = useState<UtilityProfile>({ ...DEFAULT_UTILITY })
  const [riskResults, setRiskResults] = useState<SafetyRiskResult[]>([])

  // Original handleStepComplete: mark the current step complete (handled by the
  // shell's goToStep on a forward move) and advance — but only while there is a
  // next step (PARTS.length - 1 is the last index).
  const handleStepComplete = () => {
    if (index < PARTS.length - 1) goToStep(index + 1)
  }

  switch (index) {
    case 0:
      return (
        <ProtocolSecurityAnalyzer key={`protocol-${configKey}`} onComplete={handleStepComplete} />
      )
    case 1:
      return (
        <SubstationMigrationPlanner
          key={`substation-${configKey}`}
          profile={substationProfile}
          onProfileChange={setSubstationProfile}
          onComplete={handleStepComplete}
        />
      )
    case 2:
      return (
        <SmartMeterKeyManager
          key={`meter-${configKey}`}
          config={meterFleetConfig}
          onConfigChange={setMeterFleetConfig}
          onComplete={handleStepComplete}
        />
      )
    case 3:
      return (
        <SafetyRiskScorer
          key={`safety-${configKey}`}
          riskResults={riskResults}
          onRiskResultsChange={setRiskResults}
          onComplete={handleStepComplete}
        />
      )
    case 4:
      return (
        <GridMigrationRoadmap
          key={`roadmap-${configKey}`}
          utilityProfile={utilityProfile}
          onUtilityProfileChange={setUtilityProfile}
          substationProfile={substationProfile}
          meterFleetConfig={meterFleetConfig}
          riskResults={riskResults}
          onComplete={handleStepComplete}
        />
      )
    case 5:
      return <RFMeshSimulator key={`rfmesh-${configKey}`} />
    default:
      return null
  }
}

export const EnergyUtilitiesModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="PQC migration for power grids and utilities: NERC CIP compliance, IEC 61850/62351 substation security, DNP3/Modbus protocol hardening, smart meter key management at scale, and environmental/safety risk scoring."
    learn={(api) => <EnergyUtilitiesIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <EnergyUtilitiesExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config, goToStep) => (
      <EnergyUtilitiesWorkshop
        // Reset (configKey bump with no config) remounts → default profiles
        // restored; an exercise prefill carries a config, so the key stays stable
        // and the shared state survives the step jump.
        key={config === undefined ? `reset-${configKey}` : 'energy-utilities-workshop'}
        index={index}
        configKey={configKey}
        goToStep={goToStep}
      />
    )}
  />
)
