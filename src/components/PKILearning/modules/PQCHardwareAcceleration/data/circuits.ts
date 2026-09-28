// SPDX-License-Identifier: GPL-3.0-only
/**
 * How big our own AMD KV260 (Zynq UltraScale+ K26, 117,120 LUTs, 144 block-RAM
 * tiles, 1,248 DSPs) accelerator circuits are, from our Vivado/Vitis HLS
 * reports in pqctoday-cacp/fpga (2026-09-13 → 09-25). `kind` says whether the
 * figure is an HLS synthesis estimate or a routed (placed-and-wired) result —
 * routed numbers are the real cost on the chip.
 */

export interface CircuitSize {
  circuit: string
  what: string
  luts: number
  memory: string
  dsp: number
  kind: 'HLS estimate' | 'routed'
  group: 'building block' | 'whole operation' | 'plumbing' | 'full image'
}

export const CIRCUIT_SIZES: CircuitSize[] = [
  {
    circuit: 'NTT (one ML-DSA transform)',
    what: '256-point NTT over q = 8,380,417',
    luts: 4988,
    memory: '15 × 18 Kb',
    dsp: 6,
    kind: 'HLS estimate',
    group: 'building block',
  },
  {
    circuit: 'ML-DSA-65 matrix × vector (NTT + multiply)',
    what: 'The A·y step: 5 forward NTTs, 6×5 pointwise products, 6 inverse NTTs',
    luts: 6306,
    memory: '24 × 18 Kb',
    dsp: 7,
    kind: 'HLS estimate',
    group: 'building block',
  },
  {
    circuit: 'Keccak permutation core',
    what: 'One Keccak-f[1600], 53 cycles per permutation',
    luts: 8886,
    memory: '2 × 18 Kb',
    dsp: 0,
    kind: 'HLS estimate',
    group: 'building block',
  },
  {
    circuit: 'Keccak batch engine',
    what: 'Permutation core + batching and host interface (the engine that lost to the CPU)',
    luts: 17568,
    memory: '4 tiles',
    dsp: 0,
    kind: 'routed',
    group: 'building block',
  },
  {
    circuit: 'ML-DSA SHAKE front end',
    what: 'Keccak-based ExpandMask, SampleInBall and commitment hashing',
    luts: 20466,
    memory: '12 × 18 Kb',
    dsp: 12,
    kind: 'HLS estimate',
    group: 'building block',
  },
  {
    circuit: 'One whole ML-DSA-65 signer',
    what: 'Complete signing including the retry loop, in hardware',
    luts: 24448,
    memory: '27 × 36 Kb + 24 × 18 Kb',
    dsp: 27,
    kind: 'routed',
    group: 'whole operation',
  },
  {
    circuit: 'SLH-DSA engine, 4 Keccak lanes',
    what: 'Whole SLH-DSA-SHAKE “s” signing and key generation',
    luts: 54724,
    memory: '13 × 36 Kb + 2 × 18 Kb',
    dsp: 11,
    kind: 'routed',
    group: 'whole operation',
  },
  {
    circuit: 'Behaviour monitor (neural network)',
    what: 'Watches the appliance’s crypto activity; present in both profiles',
    luts: 5167,
    memory: '7 × 36 Kb + 20 × 18 Kb',
    dsp: 50,
    kind: 'routed',
    group: 'plumbing',
  },
  {
    circuit: 'Control + DMA + interconnect (ML-DSA image)',
    what: 'Register control, two DMA engines, crossbars — the “plumbing”',
    luts: 9346 + 5777 + 5780 + 3712 + 3320 + 3307 + 1936,
    memory: '2 tiles',
    dsp: 0,
    kind: 'routed',
    group: 'plumbing',
  },
  {
    circuit: 'ML-DSA profile, whole image',
    what: '2 signers + monitor + plumbing',
    luts: 94630,
    memory: '137 of 144 tiles',
    dsp: 104,
    kind: 'routed',
    group: 'full image',
  },
  {
    circuit: 'SLH-DSA profile, whole image',
    what: '4-lane engine + monitor + plumbing',
    luts: 64582,
    memory: '20 × 36 Kb + 22 × 18 Kb (31 tiles)',
    dsp: 61,
    kind: 'routed',
    group: 'full image',
  },
]

export const CIRCUIT_LESSONS = [
  'Building blocks are small (5–20k LUTs); whole-operation engines are large (24–55k LUTs) because they carry control, buffers and the algorithm’s own logic.',
  'Plumbing is not free: control, DMA and interconnect took about 33k LUTs in the ML-DSA image — more than one whole signer.',
  'Memory often runs out before logic: the ML-DSA image used 95% of block RAM but 81% of LUTs.',
  'A SHA-2 core cost about as much as a Keccak lane (~33k LUTs) and was slower than the CPU’s SHA-256 instructions — so we left SHA-2 on the CPU.',
]

/** Serving several CPU cores from the FPGA — our two designs. */
export const MULTICORE = {
  options: [
    {
      title: 'Duplicate the circuit',
      plain:
        'Put N copies of the engine on the chip so N cores can use one each at the same time. Throughput grows with N — until the chip is full or something else becomes the bottleneck.',
      ours: 'Our ML-DSA profile has two whole signers (24.4k LUTs each). Result: 404 → 523 signatures/s at 4 workers — but an earlier single-signer build had already reached 535/s (a different build and clock, so not a clean comparison) — the ARM-side work, not the signers, was the limit. Duplicating a circuit only helps if the circuit is the bottleneck.',
    },
    {
      title: 'Parallelise inside one engine',
      plain:
        'Make one engine faster by giving it internal lanes that work on the same operation at once. Every request gets the speed-up, but requests still go one at a time.',
      ours: 'Our SLH-DSA engine has 4 Keccak lanes working on one signature: co-simulation went from 218 ms (1 lane) to 114 ms (2) to 60 ms (4). Eight lanes would not fit on the chip.',
    },
    {
      title: 'Share one engine with a queue — and fall back',
      plain:
        'All cores send requests to one engine; a scheduler queues them (or sends overflow back to the CPU). Cheap in area, but the engine becomes a shared resource.',
      ours: 'Our engine routes a request to the FPGA when it is free and to the ARM cores when it is busy. Four signing threads got the same 14.3/s as one, and the overflow on ARM (~30× slower) pushed p99 latency to 2.7 s — a queue in front of the engine is the planned fix.',
    },
  ],
  rule: 'Match the design to the bottleneck: duplicate when the engine is saturated and area allows; add lanes when single-request latency matters; queue when requests are bursty and area is tight — and always keep the CPU as the overflow path.',
}
