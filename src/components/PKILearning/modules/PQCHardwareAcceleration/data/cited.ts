// SPDX-License-Identifier: GPL-3.0-only
/**
 * THIRD-PARTY, CITED facts — NOT measured by PQC Today. Rendered visually
 * separate from data/measurements.ts ("Published, not measured by us").
 * Every entry was checked against its primary source on 2026-09-27; wording
 * follows the source (e.g. cuPQC's headline numbers are H100/Hopper, not
 * Ampere; Adams Bridge supports ML-DSA-87 / ML-KEM-1024 only).
 */

export interface CitedSource {
  id: string
  label: string
  url: string
}

export const SOURCES: Record<string, CitedSource> = {
  armFeatures: {
    id: 'armFeatures',
    label: 'Arm — Feature names in A-profile architecture (2024)',
    url: 'https://documentation-service.arm.com/static/668bf39069e89f01e39c46dd',
  },
  a55Trm: {
    id: 'a55Trm',
    label: 'Arm Cortex-A55 Cryptographic Extension TRM',
    url: 'https://documentation-service.arm.com/static/5e7e1431b471823cb9de57fa',
  },
  a53Trm: {
    id: 'a53Trm',
    label: 'Arm Cortex-A53 Cryptography Extension TRM',
    url: 'https://documentation-service.arm.com/static/5e9077ee8259fe2368e2acf7',
  },
  armKeccak: {
    id: 'armKeccak',
    label: 'Becker & Kannwischer — Hybrid scalar/vector Keccak & SPHINCS+ on AArch64 (2022)',
    url: 'https://kannwischer.eu/papers/2022_armv8keccak.pdf',
  },
  llvmAarch64: {
    id: 'llvmAarch64',
    label: 'LLVM AArch64Processors.td (apple-m4 feature list)',
    url: 'https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/AArch64/AArch64Processors.td',
  },
  intelSha: {
    id: 'intelSha',
    label: 'Intel — Intel SHA Extensions',
    url: 'https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sha-extensions.html',
  },
  llvmX86: {
    id: 'llvmX86',
    label: 'LLVM X86.td (Arrow Lake-S / Lunar Lake SHA512, SM3, SM4)',
    url: 'https://github.com/llvm/llvm-project/blob/main/llvm/lib/Target/X86/X86.td',
  },
  dilithiumAvx2: {
    id: 'dilithiumAvx2',
    label: 'Ducas et al. — CRYSTALS-Dilithium, TCHES 2018 (AVX2 results)',
    url: 'https://eprint.iacr.org/2017/633.pdf',
  },
  sphincsAvx2: {
    id: 'sphincsAvx2',
    label: 'SPHINCS+ reference repository (sha256x8, fips202x4 AVX2 code)',
    url: 'https://github.com/sphincs/sphincsplus',
  },
  adamsBridge: {
    id: 'adamsBridge',
    label: 'CHIPS Alliance — Adams Bridge ML-DSA accelerator (Caliptra 2.0)',
    url: 'https://github.com/chipsalliance/adams-bridge/blob/main/docs/AdamsBridge_MLDSA.md',
  },
  openTitanRoot: {
    id: 'openTitanRoot',
    label: 'OpenTitan — ROM root keys and signature verification',
    url: 'https://opentitan.org/book/sw/device/silicon_creator/rom/doc/root_keys.html',
  },
  openTitanKmac: {
    id: 'openTitanKmac',
    label: 'OpenTitan — KMAC/SHA-3 hardware IP',
    url: 'https://opentitan.org/book/hw/ip/kmac/',
  },
  cupqcBlog: {
    id: 'cupqcBlog',
    label: 'NVIDIA — Introducing cuPQC for GPU-accelerated PQC',
    url: 'https://developer.nvidia.com/blog/introducing-nvidia-cupqc-for-gpu-accelerated-post-quantum-cryptography',
  },
  cupqc: {
    id: 'cupqc',
    label: 'NVIDIA cuPQC product page',
    url: 'https://developer.nvidia.com/cupqc',
  },
  cupqcReq: {
    id: 'cupqcReq',
    label: 'NVIDIA cuPQC — system requirements',
    url: 'https://docs.nvidia.com/cuda/cupqc/introduction/requirements.html',
  },
  cudaGpus: {
    id: 'cudaGpus',
    label: 'NVIDIA — CUDA GPU compute capability table',
    url: 'https://developer.nvidia.com/cuda-gpus',
  },
  tensorFhe: {
    id: 'tensorFhe',
    label: 'TensorFHE (arXiv 2212.14191)',
    url: 'https://arxiv.org/abs/2212.14191',
  },
  imx95: {
    id: 'imx95',
    label: 'NXP i.MX 95 product page / fact sheet',
    url: 'https://www.nxp.com/products/i.MX95',
  },
  appleM4Pro: {
    id: 'appleM4Pro',
    label: 'Apple Newsroom — Apple introduces M4 Pro and M4 Max (2024)',
    url: 'https://www.apple.com/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/',
  },
  appleM5Max: {
    id: 'appleM5Max',
    label: 'Apple Newsroom — Apple debuts M5 Pro and M5 Max (2026)',
    url: 'https://www.apple.com/newsroom/2026/03/apple-debuts-m5-pro-and-m5-max-to-supercharge-the-most-demanding-pro-workflows/',
  },
  appleQos: {
    id: 'appleQos',
    label: 'Apple Developer — Tuning your code’s performance for Apple silicon',
    url: 'https://developer.apple.com/documentation/apple-silicon/tuning-your-code-s-performance-for-apple-silicon',
  },
  eclecticClocks: {
    id: 'eclecticClocks',
    label:
      'The Eclectic Light Co. — CPU core frequencies for Apple silicon (third-party measurement)',
    url: 'https://eclecticlight.co/2026/04/13/cpu-core-frequencies-updated-for-all-current-apple-silicon-macs/',
  },
  kriaDfx: {
    id: 'kriaDfx',
    label:
      'AMD/Xilinx — kria-dfx-hw: 2-slot Dynamic Function eXchange reference design for Kria (MIT)',
    url: 'https://github.com/Xilinx/kria-dfx-hw',
  },
  kriaAppsFw: {
    id: 'kriaAppsFw',
    label: 'AMD/Xilinx — kria-apps-firmware (k26-dfx/2rp shell + reconfigurable-module packaging)',
    url: 'https://github.com/Xilinx/kria-apps-firmware',
  },
  kernelFpga: {
    id: 'kernelFpga',
    label: 'Linux kernel — FPGA subsystem (Manager, Bridge, Region)',
    url: 'https://docs.kernel.org/driver-api/fpga/intro.html',
  },
  xrtExec: {
    id: 'xrtExec',
    label: 'AMD XRT — execution model (compute units, KDS scheduler)',
    url: 'https://github.com/Xilinx/XRT',
  },
  kriaAppsDocs: {
    id: 'kriaAppsDocs',
    label: 'AMD Kria apps docs — dfx-mgr / xmutil and the DFX example',
    url: 'https://xilinx.github.io/kria-apps-docs/',
  },
  awsFpga: {
    id: 'awsFpga',
    label: 'AWS — aws-fpga (Shell + Custom Logic → AFI)',
    url: 'https://github.com/aws/aws-fpga',
  },
  ofs: {
    id: 'ofs',
    label: 'Altera Open FPGA Stack (FIM shell, AFU, partial reconfiguration)',
    url: 'https://ofs.github.io/',
  },
  coyote: {
    id: 'coyote',
    label: 'ETH Zurich — Coyote FPGA shell (arXiv 2504.21538)',
    url: 'https://github.com/fpgasystems/Coyote',
  },
  fos: {
    id: 'fos',
    label: 'Univ. of Manchester — FOS FPGA operating system',
    url: 'https://github.com/FPGA-Research-Manchester/fos',
  },
  kriaPynq: {
    id: 'kriaPynq',
    label: 'AMD — Kria-PYNQ overlays',
    url: 'https://github.com/Xilinx/Kria-PYNQ',
  },
  zynqSecureBit: {
    id: 'zynqSecureBit',
    label: 'Xilinx wiki — ZynqMP secure bitstream programming from Linux',
    url: 'https://xilinx-wiki.atlassian.net/wiki/spaces/A/pages/18841847/Solution+ZynqMP+PL+Programming',
  },
  zhaoSuh: {
    id: 'zhaoSuh',
    label: 'Zhao & Suh — FPGA-Based Remote Power Side-Channel Attacks (IEEE S&P 2018)',
    url: 'https://ieeexplore.ieee.org/document/8418606/',
  },
  fips202: {
    id: 'fips202',
    label: 'NIST FIPS 202 (SHA-3, SHAKE)',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf',
  },
  fips203: {
    id: 'fips203',
    label: 'NIST FIPS 203 (ML-KEM)',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf',
  },
  fips204: {
    id: 'fips204',
    label: 'NIST FIPS 204 (ML-DSA)',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf',
  },
  fips205: {
    id: 'fips205',
    label: 'NIST FIPS 205 (SLH-DSA)',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf',
  },
  fndsa: {
    id: 'fndsa',
    label:
      'NIST — FIPS 206 (FN-DSA) presentation: “Uses FFT”, “signing needs floating-point arithmetic”',
    url: 'https://csrc.nist.gov/csrc/media/presentations/2025/fips-206-fn-dsa-%28falcon%29/images-media/fips_206-perlner_2.1.pdf',
  },
  montgomery: {
    id: 'montgomery',
    label: 'P. L. Montgomery — Modular multiplication without trial division (Math. Comp., 1985)',
    url: 'https://doi.org/10.1090/S0025-5718-1985-0777282-X',
  },
}

export interface IsaRow {
  sources?: (keyof typeof SOURCES)[]
  feature: string
  what: string
  arm: string
  x86: string
  pqcUse: string
}

/** Instruction-set support that matters for PQC — cited, not measured. */
export const ISA_MATRIX: IsaRow[] = [
  {
    sources: ['armFeatures', 'llvmX86'],
    feature: 'Wide SIMD',
    what: 'Same operation on many numbers at once',
    arm: 'NEON 128-bit (all Armv8); SVE/SME on newer cores',
    x86: 'AVX2 256-bit; AVX-512 512-bit',
    pqcUse:
      'ML-DSA / ML-KEM NTT and polynomial arithmetic; several SLH-DSA hash chains side by side',
  },
  {
    sources: ['armFeatures', 'llvmX86'],
    feature: 'AES',
    what: 'One AES round per instruction',
    arm: 'FEAT_AES (optional from Armv8.0)',
    x86: 'AES-NI; VAES (AES on AVX/AVX-512 registers)',
    pqcUse: 'Symmetric encryption after a PQC key exchange; AES-based schemes',
  },
  {
    sources: ['armFeatures', 'a55Trm', 'a53Trm', 'intelSha'],
    feature: 'SHA-256',
    what: 'SHA-256 rounds in hardware',
    arm: 'FEAT_SHA256 (optional from Armv8.0) — on A53, A55, Apple M-series',
    x86: 'SHA-NI (SHA-1 and SHA-256 only)',
    pqcUse: 'SLH-DSA-SHA2 (all of category 1; F and PRF at every category), LMS/HSS',
  },
  {
    sources: ['armFeatures', 'llvmAarch64', 'llvmX86'],
    feature: 'SHA-512',
    what: 'SHA-512 rounds in hardware',
    arm: 'FEAT_SHA512 (Armv8.2 extension) — NOT on A53/A55; on Apple M4',
    x86: 'VSHA512* — only Arrow Lake-S / Lunar Lake and later',
    pqcUse: 'SLH-DSA-SHA2 categories 3 and 5 (H_msg, PRF_msg, H, T)',
  },
  {
    sources: ['armFeatures', 'armKeccak', 'llvmX86'],
    feature: 'SHA-3 / Keccak',
    what: 'EOR3, RAX1, XAR, BCAX fuse Keccak’s θ, ρ and χ steps',
    arm: 'FEAT_SHA3 (Armv8.2 extension) — NOT on A53/A55; on Apple M4',
    x86: 'None — no SHA-3 or Keccak instruction exists; SIMD runs 4–8 Keccak states in parallel',
    pqcUse: 'Every SHAKE call: ML-KEM, ML-DSA sampling, SLH-DSA-SHAKE',
  },
  {
    sources: ['llvmX86'],
    feature: 'Big-integer multiply',
    what: 'Wide multiply-accumulate for bignum math',
    arm: 'Scalar MUL/UMULH; NEON UMULL',
    x86: 'MULX/ADX; AVX-512 IFMA (eight 52-bit multiplies per instruction)',
    pqcUse: 'Classical RSA/ECC during hybrid migration — not needed by lattice or hash PQC',
  },
]

export const CITED_FACTS = {
  dilithiumAvx2:
    'Reference C vs AVX2 on Skylake: ML-DSA’s NTT-based polynomial multiplication is about 4.5× faster, and a whole signature about 3.4× faster (1,157,783 vs 344,174 cycles, median).',
  sphincsAvx2:
    'The SPHINCS+ AVX2 code computes 8 SHA-256 or 4 Keccak (SHAKE) hashes in parallel, filling the vector register with independent tree nodes.',
  keccakArm:
    'With the Armv8 SHA-3 instructions one Keccak-f[1600] round is 66 vector instructions: 10 EOR3, 5 RAX1, 24 XAR, 2 EOR and 25 BCAX.',
  adamsBridge:
    'Caliptra 2.0’s Adams Bridge accelerator has a hardware NTT, a Keccak (SHAKE128/256) core, samplers and side-channel masking — and supports ML-DSA-87 and ML-KEM-1024 only.',
  openTitan:
    'OpenTitan (Earl Grey) verifies boot images with ECDSA-P256 plus SLH-DSA-SHA2-128s running on its SHA-256/HMAC block; its separate KMAC block implements SHA-3, SHAKE and cSHAKE with masking.',
  cupqc:
    'cuPQC supports ML-KEM and ML-DSA (all parameter sets) plus SHA-2/SHA-3/SHAKE hashing. NVIDIA lists compute capabilities 8.0, 8.6, 8.7, 8.9 and 9.0 on x86_64 or Arm64 hosts (CUDA 12.8+) — i.e. Ampere data-centre and desktop GPUs (A100, RTX 30-series), the Ampere-based Jetson Orin family (8.7), Ada and Hopper. So it is not only a data-centre library: it runs on an embedded Jetson Orin module too. Its launch figures — 13.5 M ML-KEM-768 key generations/s, 175×/120×/135× over one AMD EPYC 7313P core for keygen/encaps/decaps — were measured on an H100 (Hopper). It ships as closed-source static libraries.',
  imx95Npu:
    'The i.MX 95 integrates an eIQ Neutron N3-1024S NPU rated at 2.0 TOPS for 8-bit neural-network inference.',
  appleCores:
    'Apple M4 Pro: up to 14 CPU cores — 10 performance and 4 efficiency. Apple M5 Max: 18 cores — 6 “super cores” (M5’s next-generation performance core, with more front-end bandwidth, a new cache hierarchy and better branch prediction) and 12 “all-new performance cores” tuned for power-efficient multithreaded work; no efficiency cores. Apple quotes up to 15% higher multithreaded performance for M5 Max over M4 Max and gives no single-thread figure. Third-party measurements put the M4 Pro’s big cores near 4.5 GHz, the M5’s super cores near 4.6 GHz and its new performance cores near 4.4 GHz.',
  appleQos:
    'macOS decides which core a thread runs on from its quality-of-service class and system state: background work is more likely to land on slower cores, and a machine under heavy load or thermal pressure reduces performance.',
  dfx: 'AMD’s Dynamic Function eXchange (DFX, also called partial reconfiguration) splits the fabric into a static “shell” that stays loaded and one or more reconfigurable slots. A new accelerator is loaded into a slot at runtime while the shell — and anything in the other slots — keeps running. AMD publishes a 2-slot DFX reference design for the Kria K26 and the packaging (shell, module firmware, device-tree overlay) that its dfx-mgr loader uses.',
  tensorFhe:
    'TensorFHE recasts the NTT as matrix multiplications and splits each 32-bit value into four 8-bit pieces to use INT8 tensor cores (NVIDIA A100) — relying on the GPU’s general-purpose cores to recombine them.',
}

/** How the industry manages several accelerators on one FPGA — cited, not tested by us. */
export interface MultiAccelRow {
  approach: string
  how: string
  onK26: string
  source: keyof typeof SOURCES
}

export const MULTI_ACCEL: MultiAccelRow[] = [
  {
    approach: 'Linux FPGA Manager / Bridge / Region',
    how: 'The kernel loads a full or partial image, fences the fabric’s outputs while it loads, then adds the new devices through a device-tree overlay.',
    onK26: 'Yes — what our profiles use',
    source: 'kernelFpga',
  },
  {
    approach: 'One image, many copies of an engine (AMD XRT compute units)',
    how: 'Several copies of an accelerator sit side by side in one image; the driver queues requests and hands each to a free copy. No reloading, but everything must fit at once.',
    onK26: 'Yes',
    source: 'xrtExec',
  },
  {
    approach: 'Kria “accel apps” (xmutil / dfx-mgr)',
    how: 'A daemon keeps a catalogue of prebuilt images on the board and loads or unloads them on request — a packaged version of our profiles.',
    onK26: 'Yes (native)',
    source: 'kriaAppsDocs',
  },
  {
    approach: 'AMD DFX (partial reconfiguration)',
    how: 'A fixed shell plus swappable slots; AMD’s Kria example has 2 slots, each able to load one of 4 modules (AES, FFT, FIR).',
    onK26: 'Yes',
    source: 'kriaAppsDocs',
  },
  {
    approach: 'Cloud shells (AWS F1)',
    how: 'AWS supplies a fixed shell (PCIe, memory, DMA); the customer’s logic is combined with it into a loadable Amazon FPGA Image.',
    onK26: 'No — data-centre cards',
    source: 'awsFpga',
  },
  {
    approach: 'Altera Open FPGA Stack',
    how: 'A shell plus an accelerator region that can hold partial-reconfiguration slots, driven by host software.',
    onK26: 'No — Altera parts',
    source: 'ofs',
  },
  {
    approach: 'FPGA operating-system shell: Coyote (ETH Zurich)',
    how: 'An OS-like shell that gives several applications their own virtual FPGA, with shared memory and network services.',
    onK26: 'Published targets are Alveo data-centre cards',
    source: 'coyote',
  },
  {
    approach: 'FPGA operating system: FOS (Univ. of Manchester)',
    how: 'A Linux extension that swaps relocatable partial modules and schedules several processes onto the fabric.',
    onK26: 'Published targets are other Zynq UltraScale+ boards (e.g. Ultra96, ZCU102)',
    source: 'fos',
  },
  {
    approach: 'Overlays (PYNQ)',
    how: 'Prebuilt images plus a description, loaded from Python at runtime — convenient; typically the whole programmable logic is reloaded.',
    onK26: 'Yes',
    source: 'kriaPynq',
  },
]

export const MULTI_ACCEL_FACTS = {
  principle:
    'Every approach above is a mix of three ways to share one FPGA. (1) Swap the whole image — simplest, but everything stops during the swap. (2) Swap slots (partial reconfiguration) — a fixed shell keeps running while one slot changes, at the cost of fixed slot sizes and a harder design. (3) Put several engines in one image and share them in software — no swap time at all, but everything must fit on the chip at once. And they all split the chip the same way: fixed “plumbing” (memory, DMA, host link) that never changes, plus swappable accelerators — the shell-and-role pattern.',
  security:
    'For crypto, sharing matters: Zynq UltraScale+ can authenticate and decrypt full and partial images before loading them, but researchers have shown that a circuit placed next to a victim on the same FPGA can act as a power probe and attack an RSA module on the same chip. Loading one trusted image at a time (time-sharing) is the safer pattern than placing untrusted designs side by side.',
}

// ── FPGA capacity ladder vs ASIC engines (checked against primary sources, 2026-09-27) ──
// Only vendor-published figures; cells the vendor does not publish are null.
export interface FpgaPart {
  part: string
  logic: string
  memory: string
  pkg: string
  power: string
  url: string
}

export const FPGA_LADDER: FpgaPart[] = [
  {
    part: 'Lattice iCE40 UltraPlus UP5K',
    logic: '5,280 LUTs',
    memory: '1,024 kb + 120 kb; 8 DSP',
    pkg: '2.15 × 2.50 mm',
    power: 'static 75 µA; active 1–10 mA',
    url: 'https://www.latticesemi.com/en/Products/FPGAandCPLD/iCE40UltraPlus',
  },
  {
    part: 'Efinix Titanium Ti60',
    logic: '62,016 logic elements',
    memory: '2.6 Mb; 160 DSP',
    pkg: '3.5 × 3.4 mm (64-ball)',
    power: 'not published as one figure',
    url: 'https://www.efinixinc.com/docs/titanium-selector-guide-v3.6.pdf',
  },
  {
    part: 'Lattice Certus-NX',
    logic: 'up to 65k logic cells',
    memory: '3.3 Mb; 128 multipliers',
    pkg: 'from 6 × 6 mm',
    power: '“up to 4× lower power vs. similar FPGAs” (relative only)',
    url: 'https://www.latticesemi.com/en/Products/FPGAandCPLD/Certus-NX',
  },
  {
    part: 'AMD Zynq UltraScale+ K26 (our KV260)',
    logic: '117,120 LUTs (256,200 logic cells)',
    memory: '5.1 Mb BRAM + 64 × 288 Kb URAM; 1,248 DSP',
    pkg: 'module 77 × 60 mm',
    power: 'no typical figure; sized with AMD’s power tool (5 V rail up to 4 A)',
    url: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/1512/SM-K26-XCL2GI.pdf',
  },
  {
    part: 'AMD Virtex UltraScale+ VU19P',
    logic: '8.9M logic cells',
    memory: '224 Mb; 3,840 DSP',
    pkg: '—',
    power: 'not published',
    url: 'https://www.amd.com/en/products/adaptive-socs-and-fpgas/fpga/virtex-ultrascale-plus-vu19p.html',
  },
  {
    part: 'AMD Versal Premium VP1902',
    logic: '8,460k LUTs (18.5M logic cells)',
    memory: '239 Mb BRAM + 619 Mb URAM; 6,864 DSP',
    pkg: '77.5 × 77.5 mm',
    power: 'not published',
    url: 'https://www.xilinx.com/content/dam/xilinx/publications/product-briefs/2118851-versal-premium-vp1902-product-brief.pdf',
  },
]

export interface AsicEngine {
  engine: string
  node: string
  area: string
  power: string
  perf: string
  url: string
}

export const ASIC_ENGINES: AsicEngine[] = [
  {
    engine: 'Caliptra Adams Bridge (ML-DSA-87 + ML-KEM-1024, side-channel protected)',
    node: '5 nm',
    area: '0.1096 mm² (pre-dates a masking refactor — to be re-synthesised)',
    power: 'not published',
    perf: '600 MHz; ML-DSA phases 26 / 61 / 31 µs',
    url: 'https://github.com/chipsalliance/adams-bridge',
  },
  {
    engine: 'Sapphire (MIT) — configurable lattice crypto processor',
    node: '40 nm',
    area: '0.28 mm²',
    power: '~8 mW at 72 MHz; Kyber-512 encapsulation 5.12 mW, 9.37 µJ',
    perf: 'Kyber, Dilithium, NewHope, Frodo, qTESLA on one chip',
    url: 'https://arxiv.org/abs/1910.07557',
  },
  {
    engine: 'Saber ASIC (Purdue / KU Leuven / Intel)',
    node: '65 nm',
    area: '0.158 mm²',
    power: '334 µW at 10 MHz, 0.7 V',
    perf: 'up to 160 MHz at 1.1 V',
    url: 'https://arxiv.org/abs/2201.07375',
  },
]

export const FPGA_ASIC_GAP = {
  text: 'The classic measurement of the gap (Kuon & Rose, FPGA 2006): the same circuit in an FPGA needs on average about 40× more silicon area (about 21× when the FPGA’s hard multipliers and memories are used), runs 3–4× slower, and uses about 12× more dynamic power than in a custom ASIC. FPGA vendors do not publish one power figure per chip — power depends on the design, its clock and how often its signals switch — so compare designs, not part numbers.',
  url: 'https://www.eecg.toronto.edu/~jayar/pubs/kuon/kuonfpga06.pdf',
}

export interface AsicAgilityStep {
  mechanism: string
  plain: string
  canChange: string
  cannotChange: string
  url?: string
  sourceText?: string
}

export const ASIC_AGILITY: AsicAgilityStep[] = [
  {
    mechanism: 'Hard-wired or ROM microcode',
    plain: 'The step-by-step recipe exists, but it is burned into read-only memory.',
    canChange: 'nothing in the algorithm',
    cannotChange: 'the recipe, the parameter sets',
    url: 'https://github.com/chipsalliance/adams-bridge',
  },
  {
    mechanism: 'Programmable crypto co-processor (e.g. OpenTitan OTBN)',
    plain: 'A small processor with its own instruction set; the host loads a new program.',
    canChange: 'the software — RSA, ECC, even a PQC NTT',
    cannotChange:
      'its instructions and memory size — fast PQC needed new instructions and 8× more memory (a new chip)',
    url: 'https://opentitan.org/book/hw/ip/otbn/',
  },
  {
    mechanism: 'Fixed building blocks, algorithm in firmware (e.g. Sapphire)',
    plain:
      'Keccak, NTT and modular arithmetic in hardware; each scheme’s steps in updatable firmware.',
    canChange: 'which lattice scheme runs, its parameters',
    cannotChange: 'the building blocks themselves',
    url: 'https://arxiv.org/abs/1910.07557',
  },
  {
    mechanism: 'Embedded FPGA (eFPGA) inside an ASIC',
    plain: 'A patch of FPGA fabric built into the chip, reprogrammed with a new bitstream.',
    canChange: 'whole algorithm circuits',
    cannotChange: 'the size of the patch and the rest of the chip',
    sourceText:
      'Flex Logix press release, 7 Nov 2022: “all forthcoming updates and algorithm modifications can be supported by simply reprogramming eFPGA”',
  },
]

// ── PQC hardware-IP vendors from the PQC Today Migrate catalog, each checked
// against the vendor's own page (2026-09-27). "sca" states exactly what the
// vendor claims — timing-only, SPA, DPA/masking — never more.
export interface IpVendor {
  vendor: string
  product: string
  algorithms: string
  size: string
  perf: string
  sca: string
  url: string
}

export const IP_VENDORS: IpVendor[] = [
  {
    vendor: 'Rambus',
    product: 'QSE-IP-86',
    algorithms: 'ML-KEM, ML-DSA, SLH-DSA (+ SHA-3/SHAKE)',
    size: 'not published',
    perf: 'ML-KEM-1024: 7,100 decaps / 13,500 encaps per s; ML-DSA-87: up to 1,400 signs per s (1 GHz)',
    sca: 'DPA protection sold as a separate variant (QSE-IP-86-DPA); CAVP',
    url: 'https://www.rambus.com/security/quantum-safe-cryptography/qse-ip-86/',
  },
  {
    vendor: 'Synopsys',
    product: 'Agile PQC Public Key Accelerator',
    algorithms: 'ML-KEM, ML-DSA, SLH-DSA, XMSS, LMS',
    size: 'not published',
    perf: 'not published',
    sca: 'configurable DPA / timing / fault countermeasures; primitives in hardware, algorithms in firmware',
    url: 'https://www.synopsys.com/designware-ip/security-ip/security-ip-accelerators/agile-pqc-pka.html',
  },
  {
    vendor: 'PQSecure',
    product: 'PQC hardware IP',
    algorithms: 'ML-KEM, ML-DSA, SLH-DSA',
    size: 'tiny → high-performance profiles',
    perf: 'not published',
    sca: 'first-order masking + shuffling, constant-time datapaths; CAVP',
    url: 'https://pqsecurity.com/pqsecure-hardware/',
  },
  {
    vendor: 'Secure-IC',
    product: 'Securyzr PQC (lattice)',
    algorithms: 'ML-KEM, ML-DSA',
    size: 'not published',
    perf: 'not published',
    sca: 'claims SPA / DPA / DEMA / CPA / CEMA protection; hybrid hardware–software',
    url: 'https://www.secure-ic.com/scz_ip_pqc_lattice_productsheet/',
  },
  {
    vendor: 'CAST (engineered by KiviCore)',
    product: 'KiviPQC-KEM',
    algorithms: 'ML-KEM',
    size: 'Fast: 83k gate-equivalents (7 nm, 600 MHz); Tiny: 33k (100 MHz)',
    perf: 'not published',
    sca: 'timing only',
    url: 'https://www.cast-inc.com/security/encryption-primitives/kivipqc-kem',
  },
  {
    vendor: 'Xiphera',
    product: 'XIP6110B (ML-KEM) / XIP6220B (ML-DSA)',
    algorithms: 'ML-KEM, ML-DSA',
    size: 'ML-KEM under 10k LUTs',
    perf: '“thousands of operations per second”',
    sca: 'constant-time (timing) only',
    url: 'https://xiphera.com/post-quantum-cryptography/ml-kem-key-encapsulation-mechanism/',
  },
  {
    vendor: 'BERTEN',
    product: 'MLKE-B135',
    algorithms: 'ML-KEM',
    size: '9.0k LUT (7-series), 8.6k LUT (Versal)',
    perf: 'datasheet table at 300 MHz',
    sca: 'timing and simple power analysis (SPA); no DPA claim',
    url: 'https://www.bertendsp.com/pdf/datasheet/BDS020_MLKE-B135_Datasheet_v1.0.pdf',
  },
  {
    vendor: 'IP Cores Inc.',
    product: 'PQC1',
    algorithms: 'ML-KEM, ML-DSA',
    size: '~110k gates',
    perf: 'ML-DSA-44 sign 15,000/s; ML-KEM-512 keygen 95,000/s',
    sca: 'none stated',
    url: 'https://www.ipcores.com/',
  },
  {
    vendor: 'PQShield',
    product: 'PQPerform-Lattice',
    algorithms: 'ML-KEM, ML-DSA',
    size: 'not published',
    perf: '“high-throughput hardware accelerator” (NIST CAVP entry)',
    sca: 'not stated on the CAVP entry',
    url: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=19632',
  },
]

export const IP_VENDOR_NOTE =
  'Taken from the hardware entries of our Migrate product catalog and checked against each vendor’s own page. Note how differently “side-channel protected” is used: some cores only promise constant time (no timing leak), some add simple-power-analysis resistance, and only a few claim masking against differential power analysis — often sold as a separate, larger variant.'

// ── Cost of side-channel protection (masking), each figure checked against
// the primary paper / docs on 2026-09-27. Factors are the authors' own, or
// raw counts from the same table where the authors give no factor.
export interface MaskingCost {
  impl: string
  protection: string
  cost: string
  platform: string
  url: string
}

export const MASKING_COSTS: MaskingCost[] = [
  {
    impl: 'Caliptra Adams Bridge, ML-KEM-1024 / ML-DSA-87',
    protection: '2-share masking + shuffling (two parallel NTT engines)',
    cost: 'Zero extra cycles (ML-KEM decapsulation 11,054 vs 11,056 cycles) — “the only cost of enabling masking is area”',
    platform: 'ASIC',
    url: 'https://github.com/chipsalliance/adams-bridge',
  },
  {
    impl: 'OpenTitan KMAC (Keccak)',
    protection: 'First-order domain-oriented masking',
    cost: 'Keccak round logic “more than twice” the area; SHA3-224 throughput 3.43 → 1.26 bytes/cycle',
    platform: 'ASIC',
    url: 'https://opentitan.org/book/hw/ip/kmac/doc/theory_of_operation.html',
  },
  {
    impl: 'Kyber-512 (Kamucheka et al.)',
    protection: 'Hiding, then hiding + masking',
    cost: 'Hiding: 1.83× cycles, 1.6× resources vs baseline; adding masking: a further 1.08× cycles, 1.06× resources',
    platform: 'FPGA (Virtex-7)',
    url: 'https://eprint.iacr.org/2022/1547',
  },
  {
    impl: 'ML-DSA (Raj et al.)',
    protection: 'First-order masking',
    cost: '1.127× LUTs, 1.2× flip-flops — but 378× execution time',
    platform: 'FPGA (Kintex-7 / Zynq)',
    url: 'https://eprint.iacr.org/2024/1817',
  },
  {
    impl: 'Kyber768 (Bos et al.)',
    protection: 'First, second, third order',
    cost: 'First order 3.5× the cycles of the optimised unprotected code (3.1M vs 0.88M); second order 44.3M cycles; third order 115.5M',
    platform: 'Arm Cortex-M4F',
    url: 'https://eprint.iacr.org/2021/483',
  },
  {
    impl: 'Dilithium3 signing (Azouaoui et al.)',
    protection: '2 shares (first order)',
    cost: '4.3× slower (randomised signing), 7.32× slower (deterministic)',
    platform: 'Arm Cortex-M4',
    url: 'https://eprint.iacr.org/2022/1406',
  },
  {
    impl: 'Dilithium variant (Migliore et al.)',
    protection: 'Order 1 / 2 / 3',
    cost: 'About 5.6× / 11.6× / 28× slower than unmasked',
    platform: 'general-purpose processor',
    url: 'https://eprint.iacr.org/2019/394',
  },
]

export const MASKING_TAKEAWAYS = [
  'In software, first-order masking costs roughly 3–7× the time for Kyber and Dilithium, and the cost climbs steeply with each extra order (Kyber768: 3.5× at first order, over 100× at third).',
  'In hardware the bill can be paid in area instead of time: Adams Bridge runs two NTT engines in parallel so masked decapsulation takes no extra cycles — while masked Keccak in OpenTitan more than doubles the round logic.',
  'Masking a design that was not built for it can be disastrous: one first-order ML-DSA FPGA design added only 13–20% area but ran 378× slower.',
  'Always ask which attacks a “protected” product covers: constant-time (timing), SPA, or DPA/masking — and at what order.',
]
