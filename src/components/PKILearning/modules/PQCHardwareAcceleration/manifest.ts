// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-hw-acceleration',
  contentVersion: 2,
  lm_id: 'LM-072',
  title: 'PQC Hardware Acceleration',
  description:
    'How post-quantum signatures are accelerated — scalar, SIMD, crypto instructions, GPU, FPGA, ASIC and NPU — explained in plain English and backed by PQC Today’s own measurements on an Apple M4 Pro, an NXP i.MX 95 (Cortex-A55) and an AMD Kria KV260 (Cortex-A53 + FPGA).',
  whyThisMatters:
    'ML-DSA and SLH-DSA spend their time in completely different places, so the same accelerator can give +29% on one and more than 40× on the other. Choosing hardware, parameter sets and hash variants for a device — or judging a vendor’s acceleration claim — needs an honest picture of where the time goes and what moving it costs.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 9,
  learnSections: [
    { id: 'where-time-goes', label: 'Where the Time Goes' },
    { id: 'building-blocks', label: 'The Five Building Blocks' },
    { id: 'acceleration-models', label: 'Seven Models of Acceleration' },
    { id: 'arm-generations', label: 'Arm Across Three Generations' },
    { id: 'our-arm-work', label: 'What We Built on Arm' },
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
  taxonomy: {
    algorithms: ['ML-DSA', 'SLH-DSA', 'ML-KEM', 'RSA'],
    standards: ['FIPS 202', 'FIPS 203', 'FIPS 204', 'FIPS 205'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCHardwareAccelerationModule })),
}

export default manifest
