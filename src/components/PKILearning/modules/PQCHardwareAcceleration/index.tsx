// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Layers, Blocks, BarChart3, CircuitBoard, ArrowLeftRight } from 'lucide-react'
import { AccelerationIntroduction } from './components/AccelerationIntroduction'
import { AccelerationExercises, type SimulationConfig } from './components/AccelerationExercises'
import { AccelerationModelExplainer } from './workshop/AccelerationModelExplainer'
import { BuildingBlocksExplainer } from './workshop/BuildingBlocksExplainer'
import { PlatformExplorer } from './workshop/PlatformExplorer'
import { FpgaLimitsLab } from './workshop/FpgaLimitsLab'
import { OffloadLab } from './workshop/OffloadLab'
import type { ModelId } from './data/models'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'acceleration-models',
    title: 'Step 1: Acceleration Models, Explained',
    description:
      'Scalar, SIMD, crypto instructions, GPU, FPGA, ASIC and NPU — each as an everyday analogy plus an animated diagram of the mechanism.',
    icon: Layers,
  },
  {
    id: 'building-blocks',
    title: 'Step 2: Building Blocks, Explained',
    description:
      'Montgomery reduction, the NTT, the Keccak permutation, SHA-3 and SHAKE — what accelerators actually speed up.',
    icon: Blocks,
  },
  {
    id: 'our-measurements',
    title: 'Step 3: Our Measurements',
    description:
      'Apple M4 Pro vs Cortex-A55 vs Cortex-A53 on every signature algorithm, and what a software update did to the same boards.',
    icon: BarChart3,
  },
  {
    id: 'fpga-limits',
    title: 'Step 4: FPGA Limits Lab',
    description:
      'LUTs and block RAM, why the clock depends on your design, and why ML-DSA gained only +29% on our KV260.',
    icon: CircuitBoard,
  },
  {
    id: 'offload-lab',
    title: 'Step 5: Offload, Sharing and Batching',
    description:
      'The CPU↔accelerator round trip, one engine shared by many cores, and why GPUs need big batches.',
    icon: ArrowLeftRight,
  },
]

export const PQCHardwareAccelerationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="PQC Hardware Acceleration"
    description="How post-quantum signatures are accelerated on CPUs, GPUs, FPGAs, ASICs and NPUs — backed by our own measurements on three generations of Arm cores and an FPGA."
    learn={(api) => <AccelerationIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
    exercises={(api) => (
      <AccelerationExercises
        onNavigateToSimulate={() => api.goToWorkshop()}
        onSetSimulationConfig={(config: SimulationConfig) =>
          api.openWorkshopStep(config.step, { model: config.model })
        }
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      switch (index) {
        case 0:
          return (
            <AccelerationModelExplainer
              key={`models-${configKey}`}
              initialModel={config?.model as ModelId | undefined}
            />
          )
        case 1:
          return <BuildingBlocksExplainer key={`blocks-${configKey}`} />
        case 2:
          return <PlatformExplorer key={`platforms-${configKey}`} />
        case 3:
          return <FpgaLimitsLab key={`fpga-${configKey}`} />
        case 4:
          return <OffloadLab key={`offload-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
