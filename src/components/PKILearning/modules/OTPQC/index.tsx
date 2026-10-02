// SPDX-License-Identifier: GPL-3.0-only
import { useState, type FC } from 'react'
import { Network, Layers, Factory, AlertTriangle, Map, FileSignature } from 'lucide-react'
import { OTPQCIntroduction } from './components/OTPQCIntroduction'
import { OTPQCExercises, type WorkshopConfig } from './components/OTPQCExercises'
import { ProtocolSecurityAnalyzer } from './workshop/ProtocolSecurityAnalyzer'
import { ZoneConduitPlanner } from './workshop/ZoneConduitPlanner'
import { SubstationMigrationPlanner } from './workshop/SubstationMigrationPlanner'
import { SafetyConsequenceScorer } from './workshop/SafetyConsequenceScorer'
import { SectorMigrationRoadmap } from './workshop/SectorMigrationRoadmap'
import { FirmwareSigningLab } from './workshop/FirmwareSigningLab'
import { DEFAULT_SUBSTATION, type SubstationProfile } from './data/substationData'
import { DEFAULT_ROADMAP, type RoadmapInputs } from './data/roadmapData'
import type { ZoneAssessment } from './data/zoneConduitData'
import type { ConsequenceResult } from './data/consequenceData'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'protocol-security-analyzer',
    title: 'Step 1: Protocol Analyzer',
    description:
      'Break OT protocols (IEC 61850, DNP3, IEC 104, OPC UA, CIP Security, PROFINET, Modbus, BACnet/SC, DLMS/COSEM, PTP) into crypto layers and tag each as forgery, HNDL or symmetric.',
    icon: Network,
  },
  {
    id: 'zone-conduit-planner',
    title: 'Step 2: Zone & Conduit Planner',
    description:
      'Map Purdue levels onto IEC 62443 zones and conduits and rank them by forgery and HNDL exposure.',
    icon: Layers,
  },
  {
    id: 'substation-migration-planner',
    title: 'Step 3: Substation Planner',
    description:
      'Energy worked example: prioritise an IEC 61850 substation’s zones by real quantum exposure and estimate the effort.',
    icon: Factory,
  },
  {
    id: 'safety-consequence-scorer',
    title: 'Step 4: Safety & Consequence Scorer',
    description:
      'Score forged-command and forged-firmware scenarios across energy, water, rail, manufacturing and buildings, with IEC 61511 safety-layer framing.',
    icon: AlertTriangle,
  },
  {
    id: 'sector-migration-roadmap',
    title: 'Step 5: Sector Roadmap',
    description:
      'Build a multi-year plan for one sector and jurisdiction and see which phases end after your CRQC planning year.',
    icon: Map,
  },
  {
    id: 'firmware-project-signing-lab',
    title: 'Step 6: Firmware & Project Signing Lab',
    description:
      'Compare LMS/HSS and ML-DSA for PLC firmware and project signing: bytes, key lifetime and stateful-key management.',
    icon: FileSignature,
  },
]

/**
 * Holds the state the workshop shares across steps (substation profile,
 * roadmap inputs, the zone planner's top zone and the consequence results).
 * Reset arrives as a `reset-${configKey}` key on this component (fresh mount);
 * an exercise prefill carries a config and keeps the state.
 */
const OTPQCWorkshop: FC<{
  index: number
  configKey: number
  config?: WorkshopConfig
  goToStep: (step: number) => void
}> = ({ index, configKey, config, goToStep }) => {
  const [substation, setSubstation] = useState<SubstationProfile>(() => ({
    ...DEFAULT_SUBSTATION,
    ...config?.substation,
  }))
  const [roadmap, setRoadmap] = useState<RoadmapInputs>(() => ({
    ...DEFAULT_ROADMAP,
    ...config?.roadmap,
  }))
  const [topZone, setTopZone] = useState<ZoneAssessment | null>(null)
  const [consequenceResults, setConsequenceResults] = useState<ConsequenceResult[]>([])

  const next = () => {
    if (index < PARTS.length - 1) goToStep(index + 1)
  }

  switch (index) {
    case 0:
      return (
        <ProtocolSecurityAnalyzer
          key={`protocol-${configKey}`}
          onComplete={next}
          initialSelected={config?.protocols}
        />
      )
    case 1:
      return (
        <ZoneConduitPlanner
          key={`zones-${configKey}`}
          onComplete={next}
          onTopZoneChange={setTopZone}
        />
      )
    case 2:
      return (
        <SubstationMigrationPlanner
          key={`substation-${configKey}`}
          profile={substation}
          onProfileChange={setSubstation}
          onComplete={next}
        />
      )
    case 3:
      return (
        <SafetyConsequenceScorer
          key={`consequence-${configKey}`}
          results={consequenceResults}
          onResultsChange={setConsequenceResults}
          onComplete={next}
          initialScenarioId={config?.scenario}
        />
      )
    case 4:
      return (
        <SectorMigrationRoadmap
          key={`roadmap-${configKey}`}
          inputs={roadmap}
          onInputsChange={setRoadmap}
          topZone={topZone}
          consequenceResults={consequenceResults}
          onComplete={next}
        />
      )
    case 5:
      return (
        <FirmwareSigningLab
          key={`signing-${configKey}`}
          onComplete={next}
          initial={config?.signing}
        />
      )
    default:
      return null
  }
}

export const OTPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="PQC for operational technology across energy, water, rail, manufacturing and building automation: why forged commands and firmware matter more than harvested data, IEC 62443 zones and conduits, the native security of OT protocols, safety-critical timing, PLC firmware and project signing, and the regulations that apply."
    learn={(api) => <OTPQCIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <OTPQCExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config, goToStep) => (
      <OTPQCWorkshop
        // Reset (configKey bump with no config) remounts → defaults restored; an
        // exercise prefill carries a config, so it gets its own stable key.
        key={config === undefined ? `reset-${configKey}` : `prefill-${configKey}`}
        index={index}
        configKey={configKey}
        config={config as unknown as WorkshopConfig | undefined}
        goToStep={goToStep}
      />
    )}
  />
)
