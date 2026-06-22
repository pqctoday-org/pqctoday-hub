// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, type FC } from 'react'
import { Database, ListChecks, Scale, SlidersHorizontal, Map } from 'lucide-react'
import { DataAssetIntroduction } from './components/DataAssetIntroduction'
import { DataAssetExercises } from './components/DataAssetExercises'
import { AssetInventoryBuilder } from './workshop/AssetInventoryBuilder'
import { ClassificationChallenge } from './workshop/ClassificationChallenge'
import { SensitivityConflictResolver } from './workshop/SensitivityConflictResolver'
import { SensitivityScoringEngine } from './workshop/SensitivityScoringEngine'
import { PQCMigrationPriorityMap } from './workshop/PQCMigrationPriorityMap'
import {
  DEFAULT_ASSETS,
  ESTIMATED_CRQC_YEAR,
  type DataAsset,
  type ScoredAsset,
} from './data/sensitivityConstants'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'asset-inventory',
    title: 'Step 1: Asset Inventory',
    description:
      'Catalog your data assets with type, sensitivity tier, retention period, and encryption details.',
    icon: Database,
  },
  {
    id: 'classification-challenge',
    title: 'Step 2: Classification Challenge',
    description:
      'Classify 10 real-world data scenarios using the four-tier model — get immediate feedback with HNDL implications.',
    icon: ListChecks,
  },
  {
    id: 'conflict-resolver',
    title: 'Step 3: Conflict Resolver',
    description:
      'Resolve multi-framework sensitivity conflicts: when GDPR, HIPAA, CNSA 2.0, and FIPS 140-3 disagree, which tier governs?',
    icon: Scale,
  },
  {
    id: 'sensitivity-scoring',
    title: 'Step 4: Sensitivity Scoring',
    description:
      'Score each asset across 4 weighted dimensions to produce a composite PQC urgency score.',
    icon: SlidersHorizontal,
  },
  {
    id: 'priority-map',
    title: 'Step 5: Priority Map',
    description:
      'Your prioritized PQC migration list with recommended algorithms and compliance deadlines.',
    icon: Map,
  },
]

/**
 * Holds the cross-step shared state the workshop lifts above its steps
 * (assets / scoredAssets / crqcYear, plus the derived compliance mandates).
 * Mounted once for the whole workshop; the individual step bodies still remount
 * on `configKey` via their per-step `key`.
 *
 * Reset is handled by the caller via the wrapper's `key`: the shell's Reset
 * bumps `configKey` with no config, so the caller keys this component on
 * `reset-${configKey}` and the default assets/scores/CRQC year are restored by
 * a fresh mount — matching the pre-ModuleShell Reset behavior. An exercise
 * prefill always carries a defined config, so it keeps a stable key and the
 * data survives (as before).
 */
const DataAssetWorkshop: FC<{
  index: number
  configKey: number
}> = ({ index, configKey }) => {
  const [assets, setAssets] = useState<DataAsset[]>([...DEFAULT_ASSETS])
  const [scoredAssets, setScoredAssets] = useState<ScoredAsset[]>([])
  const [crqcYear, setCrqcYear] = useState(ESTIMATED_CRQC_YEAR)

  // Derive mandates from assets' compliance flags (replaces ComplianceMatrix
  // selection). Memoized — a new array reference every render would cascade into
  // the SensitivityScoringEngine's useMemo chain and cause a setState-during-
  // render loop.
  const derivedMandates = useMemo(
    () => [...new Set(assets.flatMap((a) => a.complianceFlags))],
    [assets]
  )

  switch (index) {
    case 0:
      return (
        <AssetInventoryBuilder
          key={`inventory-${configKey}`}
          assets={assets}
          onAssetsChange={setAssets}
          crqcYear={crqcYear}
          onCrqcYearChange={setCrqcYear}
        />
      )
    case 1:
      return <ClassificationChallenge key={`classification-${configKey}`} assets={assets} />
    case 2:
      return <SensitivityConflictResolver key={`conflict-${configKey}`} assets={assets} />
    case 3:
      return (
        <SensitivityScoringEngine
          key={`scoring-${configKey}`}
          assets={assets}
          selectedMandates={derivedMandates}
          onScoredAssetsChange={setScoredAssets}
          crqcYear={crqcYear}
        />
      )
    case 4:
      return (
        <PQCMigrationPriorityMap
          key={`priority-${configKey}`}
          assets={assets}
          selectedMandates={derivedMandates}
          scoredAssets={scoredAssets}
        />
      )
    default:
      return null
  }
}

export const DataAssetSensitivityModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Data &amp; Asset Sensitivity Assessment"
    description="Classify your data assets, map compliance obligations across GDPR, HIPAA, NIS2, and CNSA 2.0, then generate a prioritized PQC migration list using NIST RMF, ISO 27005, FAIR, and DORA methodologies."
    learn={(api) => <DataAssetIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <DataAssetExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => (
      <DataAssetWorkshop
        // Reset (configKey bump with no config) remounts → defaults restored;
        // an exercise prefill carries a config, so the key stays stable and the
        // shared assets/scores survive the step jump.
        key={config === undefined ? `reset-${configKey}` : 'data-asset-workshop'}
        index={index}
        configKey={configKey}
      />
    )}
  />
)
