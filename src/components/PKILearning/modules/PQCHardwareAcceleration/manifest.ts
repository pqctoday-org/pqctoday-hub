// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'pqc-hw-acceleration',
  whyThisMatters:
    'ML-DSA and SLH-DSA spend their time in completely different places, so on our KV260 board the FPGA gave +29% on ML-DSA signing and about 28× more SLH-DSA-SHAKE-128s signatures per second (13.0 against 0.46). Choosing hardware, parameter sets and hash variants for a device — or judging a vendor’s acceleration claim — needs an honest picture of where the time goes and what moving it costs.',
  learnSections: [
    { id: 'where-time-goes', label: 'Where the Time Goes' },
    { id: 'building-blocks', label: 'The Five Building Blocks' },
    { id: 'acceleration-models', label: 'Seven Models of Acceleration' },
    { id: 'arm-generations', label: 'Arm Platforms and Core Types' },
    { id: 'amd64-instructions', label: 'AMD64 on AI X1 Pro' },
    { id: 'our-arm-work', label: 'What We Built and Tested' },
    { id: 'hybrid-mechanisms', label: 'Hybrid Mechanisms' },
    { id: 'mldsa-vs-slhdsa', label: 'ML-DSA vs SLH-DSA' },
    { id: 'fpga-limits', label: 'FPGA Limits' },
    { id: 'crypto-agility', label: 'Crypto Agility: Many Algorithms' },
    { id: 'gpu-asic-npu', label: 'GPU, ASIC and NPU' },
    { id: 'lessons', label: 'Lessons' },
  ],
  workshopSteps: [
    { id: 'acceleration-models', label: 'Acceleration Models, Explained' },
    { id: 'building-blocks', label: 'Building Blocks, Explained' },
    { id: 'our-measurements', label: 'Our Measurements' },
    { id: 'fpga-limits', label: 'FPGA Limits Lab' },
    { id: 'offload-lab', label: 'Offload, Sharing and Batching' },
  ],
  startHere: {
    step: 'acceleration-models',
    text: 'Click through the seven acceleration models: each opens with an everyday analogy, then an animated diagram of the real mechanism, then how well it fits ML-DSA, SLH-DSA, single operations and big batches.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCHardwareAccelerationModule })),
}

export default resolveManifest(manifest)
