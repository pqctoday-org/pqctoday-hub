// SPDX-License-Identifier: GPL-3.0-only
/**
 * The seven acceleration models this module compares, each with a plain-English
 * mini-explainer in the same three-paragraph shape PQCCandidates uses for the
 * algorithm families (analogy / what's different / the catch).
 *
 * `ourEvidence` points at PQC Today measurements (data/measurements.ts);
 * `citedOnly` marks models we have NOT measured ourselves.
 */

export type ModelId = 'scalar' | 'simd' | 'isa' | 'gpu' | 'fpga' | 'asic' | 'npu'

export type Fit = 'strong' | 'partial' | 'weak' | 'none'

export interface AccelModel {
  id: ModelId
  label: string
  tagline: string
  /** Real-world examples of the model */
  examples: string
  layman: { analogy: string; whatsDifferent: string; catch: string }
  /** How well it fits each workload shape */
  fit: { mldsa: Fit; slhdsa: Fit; singleOp: Fit; batch: Fit }
  /** One-line summary of our own measured evidence, or null if cited only */
  ourEvidence: string | null
  colorClass: string
  borderClass: string
  bgClass: string
  fillClass: string
  strokeClass: string
}

export const MODELS: AccelModel[] = [
  {
    id: 'scalar',
    label: 'Scalar CPU',
    tagline: 'The baseline: one instruction works on one 64-bit number at a time.',
    examples: 'Portable C / Rust reference code on any core',
    layman: {
      analogy:
        'One cook, one pan. Every onion is chopped one at a time, by hand, in order. It always works and it runs on any kitchen, but the speed is set by how fast one pair of hands can go.',
      whatsDifferent:
        'This is what every other model is measured against. Every PQC algorithm runs this way first — the reference implementations in the NIST standards are scalar code.',
      catch:
        'A post-quantum signature is thousands to millions of small, repetitive steps. Doing them one at a time wastes most of what a modern chip can do in parallel.',
    },
    fit: { mldsa: 'partial', slhdsa: 'weak', singleOp: 'strong', batch: 'weak' },
    ourEvidence:
      'Our boards before tuning: SLH-DSA-SHAKE-128s took 12.3 s per signature on the KV260 Cortex-A53.',
    colorClass: 'text-muted-foreground',
    borderClass: 'border-border',
    bgClass: 'bg-muted/40',
    fillClass: 'fill-muted-foreground',
    strokeClass: 'stroke-muted-foreground',
  },
  {
    id: 'simd',
    label: 'SIMD vector units',
    tagline: 'One instruction, many numbers: Arm NEON/SVE, Intel/AMD AVX2 and AVX-512.',
    examples: 'Arm NEON (128-bit), SVE/SME; x86 AVX2 (256-bit), AVX-512 (512-bit)',
    layman: {
      analogy:
        'The same cook now uses a wide blade that chops four or eight onions in one stroke. Nothing about the recipe changes — the cook simply does the same motion on a whole row at once.',
      whatsDifferent:
        'Lattice schemes are a perfect match: an ML-DSA polynomial is 256 small numbers that all get the same treatment, so a 128-bit NEON register handles 4 at once and a 512-bit AVX-512 register handles 16. It lives inside the CPU, so there is no transfer cost at all.',
      catch:
        'It only helps when the work really is "the same step on many values". Hash-heavy SLH-DSA is one long chain of dependent hashes per tree path, so it needs a different trick (hashing several independent paths side by side).',
    },
    fit: { mldsa: 'strong', slhdsa: 'partial', singleOp: 'strong', batch: 'partial' },
    ourEvidence:
      'Our engine routes native ML-DSA/ML-KEM through AWS-LC’s hand-written AArch64 NEON code; the browser (WASM) build keeps portable code.',
    colorClass: 'text-primary',
    borderClass: 'border-primary/40',
    bgClass: 'bg-primary/10',
    fillClass: 'fill-primary',
    strokeClass: 'stroke-primary',
  },
  {
    id: 'isa',
    label: 'Crypto instructions',
    tagline: 'Dedicated instructions that do a whole hash or cipher round in one step.',
    examples:
      'Arm: AES, PMULL, SHA-256, SHA-512, SHA-3 (EOR3/RAX1/XAR/BCAX). x86: AES-NI, PCLMULQDQ, SHA-NI',
    layman: {
      analogy:
        'A kitchen gadget built for one job — an apple corer. For that one job it beats any knife by a mile. For anything else it is useless, and if your kitchen doesn’t own one you are back to the knife.',
      whatsDifferent:
        'This is why the SAME algorithm runs at very different speeds on cores of different generations. Which hash an SLH-DSA variant uses (SHA-2 or SHAKE) decides whether the core’s gadget helps at all.',
      catch:
        'Owning the gadget is not the same as using it: our AES ran in software on every board until a build flag was set. And a gadget is not always a big win — switching on the M4 Pro’s SHA-3 instructions sped SHAKE up by only about 20%.',
    },
    fit: { mldsa: 'partial', slhdsa: 'strong', singleOp: 'strong', batch: 'partial' },
    ourEvidence:
      'On the Cortex-A5x boards SHA-256 (hardware) runs ~3× faster than SHA-512 (software); switching AES to hardware gave 7–13×.',
    colorClass: 'text-secondary',
    borderClass: 'border-secondary/40',
    bgClass: 'bg-secondary/10',
    fillClass: 'fill-secondary',
    strokeClass: 'stroke-secondary',
  },
  {
    id: 'gpu',
    label: 'GPU',
    tagline: 'Thousands of simple lanes — unbeatable throughput, only when the batch is big.',
    examples: 'NVIDIA cuPQC (CUDA), Apple Metal compute kernels',
    layman: {
      analogy:
        'A school bus. It moves sixty people for barely more fuel than a car moves one — but it only leaves when it is full, and it is slow to get going. If you are one person in a hurry, take the car.',
      whatsDifferent:
        'A GPU runs the same small program on thousands of independent operations at once and hides memory delays by always having other work ready. Signing 50,000 certificates is its perfect job.',
      catch:
        'Every launch costs a fixed start-up time and one signature cannot fill thousands of lanes, so a single operation is slower than on the CPU. ML-DSA’s retry loop makes the whole batch wait for its slowest signature.',
    },
    fit: { mldsa: 'strong', slhdsa: 'partial', singleOp: 'none', batch: 'strong' },
    ourEvidence:
      'Our Metal ML-DSA-65 key generation lost to the CPU at a batch of 256 and won 9.3× at 65,536.',
    colorClass: 'text-status-info',
    borderClass: 'border-info/40',
    bgClass: 'bg-info/10',
    fillClass: 'fill-info',
    strokeClass: 'stroke-info',
  },
  {
    id: 'fpga',
    label: 'FPGA',
    tagline: 'A custom circuit you can rewire — fast at one thing, limited by area, clock and bus.',
    examples: 'AMD/Xilinx Zynq UltraScale+ (our KV260), Intel/Altera Agilex',
    layman: {
      analogy:
        'A custom assembly line built in a rented warehouse. You design the conveyor belts yourself, so it can be perfect for your product — but the warehouse has a fixed floor size, the belts can only run as fast as the slowest station, and every part has to be trucked in from the main factory and trucked back.',
      whatsDifferent:
        'You build hardware for exactly the operation you care about — for example four Keccak engines side by side for SLH-DSA — and you can rebuild it next month if the standard changes. Narrow, but powerful: on SLH-DSA-SHAKE signing our small KV260 board reaches 84–97% of a whole Apple M4 Pro CPU.',
      catch:
        'The truck ride (moving data between CPU and fabric) is often longer than the work itself. If the CPU still has to do half of each operation, the gain is capped — which is what happened with our ML-DSA.',
    },
    fit: { mldsa: 'weak', slhdsa: 'strong', singleOp: 'partial', batch: 'strong' },
    ourEvidence: 'KV260: ML-DSA-65 +29% only; SLH-DSA-SHAKE-128s sign 12.3 s → 69 ms.',
    colorClass: 'text-status-success',
    borderClass: 'border-success/40',
    bgClass: 'bg-success/10',
    fillClass: 'fill-success',
    strokeClass: 'stroke-success',
  },
  {
    id: 'asic',
    label: 'ASIC / secure element',
    tagline: 'A circuit cast in silicon — the fastest and most efficient, and frozen forever.',
    examples:
      'Crypto engines in secure elements, TPMs, HSM chips and root-of-trust blocks (e.g. Caliptra’s Adams Bridge)',
    layman: {
      analogy:
        'A factory cast in concrete. Once it is poured it runs flat-out on very little power for twenty years — but you cannot move a wall. If the recipe changes, you build a new factory.',
      whatsDifferent:
        'Dedicated silicon has no wasted wiring, so it runs at much higher clocks and lower power than an FPGA doing the same job. It is the right answer for a chip that ships in millions of units.',
      catch:
        'Years of design and a large up-front cost, and the parameter sets are fixed at tape-out. It still sits on a bus shared by every core, so the same transfer and sharing limits as an FPGA apply.',
    },
    fit: { mldsa: 'strong', slhdsa: 'strong', singleOp: 'strong', batch: 'partial' },
    ourEvidence: null,
    colorClass: 'text-status-warning',
    borderClass: 'border-warning/40',
    bgClass: 'bg-warning/10',
    fillClass: 'fill-warning',
    strokeClass: 'stroke-warning',
  },
  {
    id: 'npu',
    label: 'NPU (AI accelerator)',
    tagline: 'Built for approximate 8-bit neural-network math — the wrong shape for cryptography.',
    examples: 'NXP eIQ Neutron (i.MX 95), phone and laptop “AI engines”',
    layman: {
      analogy:
        'A calculator that only multiplies small numbers and is allowed to round the answer. Great for recognising a cat in a photo, where “close enough” is fine; useless for a bank balance, where every digit must be exact.',
      whatsDifferent:
        'An NPU is a huge array of 8-bit multiply-add units, fed a pre-compiled neural-network graph. It is superb at what it was built for.',
      catch:
        'PQC needs exact modular arithmetic on numbers far bigger than 8 bits, and SHAKE/SHA-3 is bit-shuffling, not multiplication at all. We evaluated the i.MX 95 NPU for PQC and ruled it out — we use it to watch the appliance’s behaviour instead.',
    },
    fit: { mldsa: 'none', slhdsa: 'none', singleOp: 'none', batch: 'weak' },
    ourEvidence: 'Evaluated for the i.MX 95 appliance and ruled out on paper (not prototyped).',
    colorClass: 'text-destructive',
    borderClass: 'border-destructive/40',
    bgClass: 'bg-destructive/10',
    fillClass: 'fill-destructive',
    strokeClass: 'stroke-destructive',
  },
]
