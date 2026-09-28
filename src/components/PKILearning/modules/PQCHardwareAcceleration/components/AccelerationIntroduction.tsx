// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Gauge,
  Blocks,
  Layers,
  Cpu,
  Scale,
  CircuitBoard,
  Server,
  Wrench,
  Shuffle,
  Laptop,
  GraduationCap,
  FlaskConical,
  BookOpen,
} from 'lucide-react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import {
  SIGN_BENCH_0927,
  ISA_EFFECTS,
  FPGA_MLDSA,
  FPGA_HASHSIG,
  FPGA_DEVICE,
  OFFLOAD_ROUND_TRIP,
  GPU_BATCH,
  MLDSA44_BOARD_COMPARE,
  SIGN_BENCH_0926,
  SLH_HEAD_TO_HEAD,
  SLH_FPGA_0927,
} from '../data/measurements'
import {
  ISA_MATRIX,
  CITED_FACTS,
  SOURCES,
  FPGA_LADDER,
  ASIC_ENGINES,
  FPGA_ASIC_GAP,
  ASIC_AGILITY,
  IP_VENDORS,
  IP_VENDOR_NOTE,
  MASKING_COSTS,
  MASKING_TAKEAWAYS,
} from '../data/cited'
import { ARM_WORK, ARM_WORK_NOTE, type WorkStatus } from '../data/armWork'
import { PRIMITIVES, ALGORITHM_USES, AGILITY_STRATEGIES, CAPACITY_LIMIT } from '../data/agility'

interface AccelerationIntroductionProps {
  onNavigateToWorkshop: () => void
}

/** Visible provenance tag: our own measurement vs a published source. */
const Ours: React.FC<{ children: React.ReactNode; label?: string }> = ({
  children,
  label = 'Measured by PQC Today',
}) => (
  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-primary">
      <FlaskConical size={12} /> {label}
    </div>
    <div className="text-xs text-foreground/85 leading-relaxed">{children}</div>
  </div>
)

const Cited: React.FC<{ children: React.ReactNode; sources: (keyof typeof SOURCES)[] }> = ({
  children,
  sources,
}) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
      <BookOpen size={12} /> Published, not measured by us
    </div>
    <div className="text-xs text-foreground/85 leading-relaxed">{children}</div>
    {sources.length > 0 && (
      <div className="text-[10px] text-muted-foreground">
        Source:{' '}
        {sources.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && ' · '}
            <a
              href={SOURCES[s].url} // eslint-disable-line security/detect-object-injection
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {SOURCES[s].label /* eslint-disable-line security/detect-object-injection */}
            </a>
          </React.Fragment>
        ))}
      </div>
    )}
  </div>
)

const TONES = {
  primary: { box: 'bg-primary/10', icon: 'text-primary' },
  secondary: { box: 'bg-secondary/10', icon: 'text-secondary' },
}

const SectionHeader: React.FC<{
  icon: React.ElementType
  title: string
  tone?: keyof typeof TONES
}> = ({ icon: Icon, title, tone = 'primary' }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`p-2 rounded-lg ${TONES[tone].box}`}>
      <Icon size={24} className={TONES[tone].icon} />
    </div>
    <h2 className="text-xl font-bold text-gradient">{title}</h2>
  </div>
)

const MODEL_LABEL: Record<string, string> = {
  software: 'Software',
  simd: 'SIMD',
  isa: 'Crypto instr.',
  fpga: 'FPGA',
  gpu: 'GPU',
  asic: 'ASIC',
  npu: 'NPU',
  scalar: 'Scalar',
}

const STATUS_STYLE: Record<WorkStatus, { label: string; cls: string }> = {
  shipped: { label: 'Shipped', cls: 'bg-success/15 text-status-success' },
  merged: { label: 'Merged, next image', cls: 'bg-warning/15 text-status-warning' },
  review: { label: 'In review', cls: 'bg-info/15 text-status-info' },
  planned: { label: 'Planned', cls: 'bg-muted text-muted-foreground' },
}

const bench = (algo: string) => SIGN_BENCH_0927.find((r) => r.algorithm === algo)!

export const AccelerationIntroduction: React.FC<AccelerationIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()
  const mldsa65 = bench('ML-DSA-65')
  const shake128s = bench('SLH-DSA-SHAKE-128s')

  return (
    <div className="space-y-8 w-full">
      {/* 1 — Where the time goes */}
      <section data-section-id="where-time-goes" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader icon={Gauge} title="Where the Time Goes" />
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            “Accelerating PQC” is not one problem. Each algorithm spends its time in a different
            place, and an accelerator only helps if it speeds up <em>that</em> place — and if moving
            the work there costs less than it saves.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <div className="text-sm font-bold text-foreground">
                <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (lattice)
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Polynomial arithmetic mod 8,380,417 via the <strong>NTT</strong>, plus a lot of{' '}
                <strong>SHAKE</strong> to grow the public matrix and sample secrets, inside a{' '}
                <strong>retry loop</strong> that runs about 4–5 times per signature on average.
                Already fast: milliseconds on a small core.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <div className="text-sm font-bold text-foreground">
                <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (hash-based)
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Almost nothing but hashing — about two million Keccak permutations for one
                SHAKE-128s signature — built into large Merkle trees. Slow: seconds on a small core
                for the compact “s” parameter sets.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <div className="text-sm font-bold text-foreground">RSA / ECC (classical)</div>
              <p className="text-xs text-muted-foreground mt-1">
                Big-integer multiplication with <strong>Montgomery</strong> reduction. Still in
                every hybrid deployment during the migration, so still worth accelerating.
              </p>
            </div>
          </div>
          <Ours>
            On the i.MX 95, ML-DSA-65 signs {mldsa65.ops.mx95.toLocaleString()} times per second and
            SLH-DSA-SHAKE-128s {shake128s.ops.mx95} times — a gap of more than 6,000× (same engine,
            2026-09-27). The same accelerator effort therefore buys very different results: see
            “ML-DSA vs SLH-DSA” below.
          </Ours>
        </div>
      </section>

      {/* 2 — Building blocks */}
      <section data-section-id="building-blocks" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader icon={Blocks} title="The Five Building Blocks" tone="secondary" />
        <div className="space-y-3 text-sm text-foreground/80">
          <p>
            Hardware rarely accelerates “an algorithm”. It accelerates the primitives underneath:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Montgomery reduction</strong> — computes “mod N” with multiplications and a
              shift instead of a slow division (Montgomery, 1985; FIPS 204 Appendix A). Inside RSA,
              ECC and every ML-DSA coefficient multiply.
            </li>
            <li>
              <strong>NTT</strong> (Number-Theoretic Transform) — turns polynomial multiplication
              from 65,536 products into about 3,300 for 256 coefficients. ML-DSA runs a full 8-layer
              NTT; ML-KEM’s modulus 3,329 only allows 7 layers.
            </li>
            <li>
              <strong>Keccak-f[1600]</strong> — a 24-round shuffle of a 1,600-bit state using only
              XOR, AND, NOT and rotate (<InlineTooltip term="FIPS 202">FIPS 202</InlineTooltip>).
              Constant-time by nature and cheap in hardware.
            </li>
            <li>
              <strong>SHA-3</strong> — Keccak in a “sponge”: absorb the message into the 1,088-bit
              rate, keep a 512-bit capacity sealed, output a fixed 256 bits (SHA3-256).
            </li>
            <li>
              <strong>SHAKE</strong> — the same sponge with an output tap you can leave open.
              SHAKE128 (capacity 256) grows ML-DSA’s and ML-KEM’s matrices; SHAKE256 is every hash
              in SLH-DSA-SHAKE.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Workshop step 2 explains each one in plain English, with a worked Montgomery example you
            can check by hand and an animated NTT butterfly network.
          </p>
        </div>
      </section>

      {/* 3 — Models */}
      <section data-section-id="acceleration-models" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader icon={Layers} title="Seven Models of Acceleration" />
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            From closest-to-the-CPU to furthest away: <strong>scalar</strong> code;{' '}
            <strong>SIMD</strong> vector units (Arm NEON/SVE, x86 AVX2/AVX-512);{' '}
            <strong>dedicated crypto instructions</strong> (AES, SHA-256, SHA-512, SHA-3);{' '}
            <strong>GPUs</strong>; <strong>FPGAs</strong>; <strong>ASICs</strong> and secure
            elements; and <strong>NPUs</strong>. The further from the CPU, the more raw speed is
            available — and the more you pay to move data there and back.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-2">Feature</th>
                  <th className="py-2 pr-2">Arm</th>
                  <th className="py-2 pr-2">Intel / AMD x86</th>
                  <th className="py-2">Where PQC uses it</th>
                </tr>
              </thead>
              <tbody>
                {ISA_MATRIX.map((r) => (
                  <tr key={r.feature} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-2">
                      <div className="font-bold text-foreground">{r.feature}</div>
                      <div className="text-muted-foreground">{r.what}</div>
                    </td>
                    <td className="py-2 pr-2">{r.arm}</td>
                    <td className="py-2 pr-2">{r.x86}</td>
                    <td className="py-2 text-muted-foreground">
                      {r.pqcUse}
                      {r.sources && (
                        <div className="mt-0.5 text-[10px]">
                          {r.sources.map((k, i) => (
                            <React.Fragment key={k}>
                              {i > 0 && ' · '}
                              <a
                                href={SOURCES[k].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-foreground"
                              >
                                [{i + 1}]
                              </a>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Cited
            sources={['armFeatures', 'a55Trm', 'a53Trm', 'llvmAarch64', 'intelSha', 'llvmX86']}
          >
            Instruction availability per Arm’s feature list and core manuals, Intel’s SHA Extensions
            note and LLVM’s CPU definitions. Note the asymmetry for PQC: x86 has no SHA-3/Keccak
            instruction at all, and hardware SHA-512 reached x86 only with Arrow Lake-S and Lunar
            Lake (2024); Arm has had optional SHA-3 and SHA-512 instructions since the Armv8.2
            extension — but the Cortex-A53 and A55 do not implement them.
          </Cited>
        </div>
      </section>

      {/* 4 — Arm generations */}
      <section data-section-id="arm-generations" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader
          icon={Cpu}
          title="Arm Across Three Generations — Our Boards"
          tone="secondary"
        />
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            We run the same Rust PKCS#11 engine on three Arm platforms: an{' '}
            <strong>Apple M4 Pro</strong> laptop (Armv9.2-A, with SHA-3, SHA-512 and SME2), an{' '}
            <strong>NXP i.MX 95</strong> appliance (6× Cortex-A55, Armv8.2-A) and an{' '}
            <strong>AMD Kria KV260</strong> appliance (4× Cortex-A53, Armv8.0-A, plus FPGA fabric).
            The A55 and A53 both have AES and SHA-256 instructions and{' '}
            <strong>neither has SHA-3 or SHA-512</strong>.
          </p>
          <Ours>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                ML-DSA-65 signing: M4 Pro {mldsa65.ops.m4pro.toLocaleString()}/s · i.MX 95{' '}
                {mldsa65.ops.mx95.toLocaleString()}/s · KV260 {mldsa65.ops.kv260.toLocaleString()}/s
                (same engine, 4 workers, 2026-09-27).
              </li>
              <li>
                <strong>The instruction set decides which variant wins.</strong> On the A55 and A53,
                SLH-DSA-SHA2-128s signs about 11× faster than SLH-DSA-SHAKE-128s on today’s engine
                (hardware SHA-256 plus SHA-2-specific software work vs software Keccak).{' '}
                {ISA_EFFECTS.sha256VsSha512.note} (SHA-256 {ISA_EFFECTS.sha256VsSha512.sha256MBps}{' '}
                MB/s vs SHA-512 {ISA_EFFECTS.sha256VsSha512.sha512MBps} MB/s.)
              </li>
              <li>
                <strong>Same instructions, newer core:</strong> one worker signing ML-DSA-44, the
                A55 does {MLDSA44_BOARD_COMPARE.oneWorker.mx95}/s and the A53{' '}
                {MLDSA44_BOARD_COMPARE.oneWorker.kv260}/s (+37%). A newer microarchitecture and a
                higher clock lift everything; a new instruction lifts only what uses it.
              </li>
            </ul>
          </Ours>
          <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Laptop size={16} /> Two Apple generations: M4 Pro and M5 Max
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Newer is not simply “more of the same”. The M4 Pro has 10 big cores and 4 small
              efficiency cores. The M5 Max drops the efficiency cores: it has 6 top-tier “super
              cores” and 12 new mid-tier performance cores. A single signature runs on one core, so
              its speed depends on which kind of core it lands on; a batch spread over all cores
              depends on how many cores of each kind there are.
            </p>
            <Cited sources={['appleM4Pro', 'appleM5Max', 'eclecticClocks']}>
              {CITED_FACTS.appleCores}
            </Cited>
          </div>
          <p className="text-xs text-muted-foreground">
            Workshop step 3 lets you compare every algorithm across the three platforms.
          </p>
        </div>
      </section>

      {/* 4b — What we built */}
      <section data-section-id="our-arm-work" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader icon={Wrench} title="What We Built on Arm — AES, ML-DSA, SLH-DSA, AWS-LC" />
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Every acceleration below is real work in our engine or appliance images, with the
            measured before → after. The coloured tag says which acceleration model it is — and
            notice how many of the biggest wins are plain software engineering, not new hardware.
          </p>
          {(['AES', 'ML-DSA', 'SLH-DSA', 'AWS-LC (RSA)'] as const).map((area) => (
            <div key={area} className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">{area}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-1.5 pr-2">What we did</th>
                      <th className="py-1.5 pr-2">Model</th>
                      <th className="py-1.5 pr-2">Measured</th>
                      <th className="py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ARM_WORK.filter((w) => w.area === area).map((w) => (
                      <tr key={w.what} className="border-b border-border/50 align-top">
                        <td className="py-1.5 pr-2">
                          <div className="font-medium text-foreground">{w.what}</div>
                          <div className="text-muted-foreground">{w.mechanism}</div>
                        </td>
                        <td className="py-1.5 pr-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded border border-border bg-muted/40 text-[10px] font-bold">
                            {MODEL_LABEL[w.model]}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2">
                          <div className="text-foreground">{w.measured}</div>
                          <div className="text-muted-foreground">{w.where}</div>
                        </td>
                        <td className="py-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLE[w.status].cls}`}
                          >
                            {STATUS_STYLE[w.status].label}
                          </span>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{w.ref}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{ARM_WORK_NOTE}</p>
        </div>
      </section>

      {/* 5 — ML-DSA vs SLH-DSA */}
      <section data-section-id="mldsa-vs-slhdsa" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader icon={Scale} title="ML-DSA vs SLH-DSA: Different Bottlenecks" />
        <div className="space-y-4 text-sm text-foreground/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card/40 p-3 space-y-1">
              <div className="text-sm font-bold text-foreground">ML-DSA — vectorise it</div>
              <p className="text-xs text-muted-foreground">
                256 coefficients all get the same treatment, which is exactly what SIMD does best,
                inside the CPU with no transfer cost. Offload is hard: the retry loop, key decoding
                and SHAKE sampling all bounce between stages.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-3 space-y-1">
              <div className="text-sm font-bold text-foreground">SLH-DSA — accelerate the hash</div>
              <p className="text-xs text-muted-foreground">
                Millions of small, independent hash calls. Hash instructions help directly (if the
                variant matches the core’s hash), SIMD can run several tree paths side by side, and
                a hash engine that takes a <em>whole signature</em> per call can shine.
              </p>
            </div>
          </div>
          <Cited sources={['dilithiumAvx2', 'sphincsAvx2', 'openTitanRoot']}>
            {CITED_FACTS.dilithiumAvx2} {CITED_FACTS.sphincsAvx2} {CITED_FACTS.openTitan}
          </Cited>
          <Ours>
            On the KV260 FPGA the two schemes had opposite outcomes. ML-DSA-65 with two
            whole-signature hardware signers: {FPGA_MLDSA.armOnly} → {FPGA_MLDSA.withFpga}{' '}
            signatures/s, only <strong>+{FPGA_MLDSA.gainPct}%</strong>. SLH-DSA-SHAKE-128s with a
            4-lane Keccak engine:{' '}
            <strong>
              {FPGA_HASHSIG.rows[0].shipped} → {FPGA_HASHSIG.rows[0].fpga}
            </strong>{' '}
            per signature. The i.MX 95’s best software path, SLH-DSA-SHA2-128s on its SHA-256
            instructions, takes {FPGA_HASHSIG.mx95BestCase.sha2_128sMs} ms.
          </Ours>
          <Ours>
            <div className="font-bold text-foreground mb-1">
              SLH-DSA head-to-head, both boards after acceleration
            </div>
            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-1 pr-2">Configuration</th>
                  <th className="py-1 pr-2 text-right">Per signature</th>
                  <th className="py-1 text-right">Signatures/s</th>
                </tr>
              </thead>
              <tbody>
                {SLH_HEAD_TO_HEAD.rows.map((r) => (
                  <tr
                    key={r.config}
                    className={`border-b border-border/50 ${r.config.includes('FPGA') ? 'font-bold text-foreground' : ''}`}
                  >
                    <td className="py-1 pr-2">{r.config}</td>
                    <td className="py-1 pr-2 text-right font-mono">{r.p50}</td>
                    <td className="py-1 text-right font-mono">{r.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {SLH_HEAD_TO_HEAD.verdict} {SLH_HEAD_TO_HEAD.fpgaOnOff} {SLH_HEAD_TO_HEAD.bench0926}
          </Ours>
          <Ours>
            Then software caught up. After our engine moved ML-DSA onto hand-written NEON assembly,
            the KV260’s A53 <em>alone</em> signed ML-DSA-65 at{' '}
            {SIGN_BENCH_0926[1].ops.kv260.toLocaleString()}/s (2026-09-26) — about five times the
            FPGA-assisted figure on the older engine. The FPGA’s place is the hash-heavy workload:
            in the same run the KV260 signed SLH-DSA-SHAKE-128s {SIGN_BENCH_0926[6].ops.kv260} times
            per second on its fabric while the faster i.MX 95 managed {SIGN_BENCH_0926[6].ops.mx95}{' '}
            in software.
          </Ours>
        </div>
      </section>

      {/* 6 — FPGA limits */}
      <section data-section-id="fpga-limits" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader
          icon={CircuitBoard}
          title="FPGA Limits: Area, Clock and the Bus"
          tone="secondary"
        />
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            An FPGA is a grid of small programmable parts: <strong>LUTs</strong> (6-input truth
            tables that make up all logic), <strong>flip-flops</strong> (1-bit registers),{' '}
            <strong>DSP slices</strong> (hard multipliers) and <strong>block RAM</strong>. The KV260
            has {FPGA_DEVICE.luts.toLocaleString()} LUTs, {FPGA_DEVICE.dsp.toLocaleString()} DSPs
            and {FPGA_DEVICE.bramTiles} block-RAM tiles. Four limits decide what it can do:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Area.</strong> Our ML-DSA design used 81% of the LUTs and 95% of the block
              RAM. Each SLH-DSA Keccak lane cost about 14k LUTs after a redesign, so eight lanes
              (~130k) would not fit on the whole chip.
            </li>
            <li>
              <strong>Clock.</strong> The clock can tick only as fast as the longest logic path
              allows, and that path grows as the design grows. Our 4-lane engine missed 250 MHz by
              10 picoseconds and ships at 240 MHz.
            </li>
            <li>
              <strong>The bus.</strong> Data must be copied into the fabric and back, with cache
              flushes on both sides. Our first Keccak engine cost{' '}
              {OFFLOAD_ROUND_TRIP.fixedUs.toLocaleString()} µs per call before doing any work.
            </li>
            <li>
              <strong>Sharing.</strong> One engine serves every core. Four threads got the same{' '}
              {FPGA_HASHSIG.concurrency.fourThreads}/s as one, and threads that fell back to ARM
              pushed p99 latency to {FPGA_HASHSIG.concurrency.p99s} s.
            </li>
          </ol>
          <Ours>
            <div className="font-bold text-foreground mb-1">
              Where the FPGA wins: SLH-DSA-SHAKE signing, today’s engine on every platform
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs mb-2">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-1 pr-2">Signatures/s</th>
                    <th className="py-1 pr-2 text-right">KV260 + FPGA</th>
                    <th className="py-1 pr-2 text-right">i.MX 95 (CPU)</th>
                    <th className="py-1 pr-2 text-right">M4 Pro (CPU)</th>
                    <th className="py-1 pr-2 text-right">KV260 ÷ i.MX 95</th>
                    <th className="py-1 text-right">KV260 FPGA on ÷ off</th>
                  </tr>
                </thead>
                <tbody>
                  {SLH_FPGA_0927.rows.map((r) => (
                    <tr key={r.set} className="border-b border-border/50">
                      <td className="py-1 pr-2 font-medium text-foreground">{r.set}</td>
                      <td className="py-1 pr-2 text-right font-mono font-bold text-foreground">
                        {r.kv260.toFixed(2)}
                      </td>
                      <td className="py-1 pr-2 text-right font-mono">{r.mx95.toFixed(2)}</td>
                      <td className="py-1 pr-2 text-right font-mono">{r.m4pro.toFixed(2)}</td>
                      <td className="py-1 pr-2 text-right font-mono font-bold text-status-success">
                        {(r.kv260 / r.mx95).toFixed(1)}×
                      </td>
                      <td className="py-1 text-right font-mono">{r.onOff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <strong className="text-foreground">
              Narrow, but powerful — that is what an FPGA is for.
            </strong>{' '}
            On the same KV260, switching the FPGA on raises SLH-DSA-SHAKE-128s signing from 0.46 to
            13.0 signatures per second (28×, 4 workers); measured one at a time, a signature takes
            2.12 seconds on the A53 and 69 milliseconds on the fabric — the difference between a
            device that can sign on demand and one that cannot. A 4-core Cortex-A53 board with a
            4-lane Keccak engine in its fabric signs the SHAKE “s” sets 13–15× faster than the
            6-core Cortex-A55 i.MX 95, and reaches 84–97% of a whole Apple M4 Pro CPU (all 14 cores;
            about 80% once the M4’s SHA-3 instructions are used, which our engine does not do yet —
            a measured +19% on this signing). This is one FPGA engine against a laptop processor on
            one workload: for SHA-2 SLH-DSA and ML-DSA the M4 Pro is 20–25× faster. Both halves are
            the lesson: pick the one workload that is actually stuck, build hardware for exactly
            that, and a small, low-power board can stand next to a laptop processor. Switching the
            FPGA off on the same board drops it 26–31× — the whole lead is the fabric. SHA-2 sets
            and the fast “f” sets are not routed to the fabric and run on the CPU.{' '}
            {SLH_FPGA_0927.note}
          </Ours>
          <Ours>
            Why ML-DSA gained only +{FPGA_MLDSA.gainPct}%: the two signers could reach about{' '}
            {FPGA_MLDSA.hlsCeiling.toLocaleString()} signatures/s on their own, but the ARM cores
            still decode the key, expand the matrix, copy data in and out and run PKCS#11 for every
            signature. An earlier NTT-only offload was worse: 0.68 ms per attempt vs 0.44 ms on the
            CPU, of which 0.27 ms was conversion and DMA — making whole signatures slower.
          </Ours>
          <p>
            <strong>Reprogramming.</strong> Unlike an ASIC, the fabric can be rewritten in the
            field. Our KV260 ships one complete image; we also tested swapping whole images at
            runtime (“profiles”: ML-DSA signers ⇄ SLH-DSA hash engine, live on the board, with the
            crypto services restarting). AMD’s modular alternative — partial reconfiguration, which
            swaps one slot while the rest keeps running — we documented but did not use.
          </p>
          <Cited sources={['kriaDfx', 'kriaAppsFw']}>{CITED_FACTS.dfx}</Cited>
          <p className="text-xs text-muted-foreground">
            Workshop steps 4 and 5 turn these into interactive labs.
          </p>
        </div>
      </section>

      {/* 6b — Crypto agility */}
      <section data-section-id="crypto-agility" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader icon={Shuffle} title="Crypto Agility: Accelerating Many Algorithms" />
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A real system never runs one algorithm. It runs ML-KEM and ML-DSA for new sessions,
            SLH-DSA for long-lived signatures, RSA and ECC for everything not yet migrated, and AES
            and SHA-2 for the traffic — and the list will change as standards evolve. Acceleration
            has to follow that list without being rebuilt every time.
          </p>

          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
            <div className="text-sm font-bold text-foreground">
              Capacity forces choices — our example: two FPGA profiles
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">{CAPACITY_LIMIT.plain}</p>
            <div className="space-y-2">
              {CAPACITY_LIMIT.profiles.map((pr) => (
                <div key={pr.name} className="space-y-1">
                  <div className="flex justify-between text-xs gap-2">
                    <span className="font-bold text-foreground">{pr.name}</span>
                    <span className="font-mono shrink-0">
                      {pr.luts.toLocaleString()} LUT (
                      {Math.round((pr.luts / CAPACITY_LIMIT.deviceLuts) * 100)}%)
                      {pr.bram !== null && ` · ${pr.bram}/${CAPACITY_LIMIT.deviceBram} block RAM`}
                    </span>
                  </div>
                  <div className="h-3 bg-muted/40 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-success/60"
                      style={{ width: `${(pr.luts / CAPACITY_LIMIT.deviceLuts) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="space-y-1">
                <div className="flex justify-between text-xs gap-2">
                  <span className="font-bold text-destructive">Both at once</span>
                  <span className="font-mono text-destructive shrink-0">
                    ~
                    {Math.round(
                      (CAPACITY_LIMIT.profiles[0].luts + CAPACITY_LIMIT.profiles[1].luts) / 1000
                    )}
                    k LUT — more than the whole chip
                  </span>
                </div>
                <div className="h-3 bg-destructive/60 rounded-sm" />
              </div>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              So the KV260 carries two profiles and loads one at a time: <strong>mldsa</strong> (two
              whole-signature ML-DSA-65 signers) or <strong>hashsig</strong> (a 4-lane Keccak engine
              for SLH-DSA-SHAKE), both with the same behaviour monitor. One command switches them
              live — the crypto services stop, the image is checked and loaded, the services
              restart. Whatever the loaded profile does not cover runs on the ARM cores.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-2">Algorithm</th>
                  {PRIMITIVES.map((pr) => (
                    <th key={pr.id} className="py-2 px-1 text-center font-medium">
                      {pr.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALGORITHM_USES.map((a) => (
                  <tr key={a.algorithm} className="border-b border-border/50">
                    <td className="py-1.5 pr-2">
                      <div className="font-medium text-foreground">{a.algorithm}</div>
                      <div className="text-[10px] text-muted-foreground">{a.note}</div>
                    </td>
                    {PRIMITIVES.map((pr) => (
                      <td key={pr.id} className="py-1.5 px-1 text-center">
                        {a.hotspot === pr.id ? (
                          <span className="font-bold text-status-warning" title="dominant cost">
                            ●
                          </span>
                        ) : a.uses.includes(pr.id) ? (
                          <span className="text-muted-foreground">○</span>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground mt-1">
              ● dominant cost · ○ also used. Read down a column: an accelerator for that building
              block helps every algorithm with a mark in it. Keccak is the most shared block in
              post-quantum cryptography. Standards:{' '}
              {(['fips202', 'fips203', 'fips204', 'fips205', 'fndsa'] as const).map((k, i) => (
                <React.Fragment key={k}>
                  {i > 0 && ' · '}
                  <a
                    href={SOURCES[k].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {SOURCES[k].label.split(' (')[0].replace('NIST — ', '')}
                  </a>
                </React.Fragment>
              ))}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AGILITY_STRATEGIES.map((st) => (
              <div
                key={st.title}
                className="rounded-md border border-border bg-card/40 p-3 space-y-1"
              >
                <div className="text-sm font-bold text-foreground">{st.title}</div>
                <p className="text-xs text-foreground/85 leading-relaxed">{st.plain}</p>
                <p className="text-[11px] text-primary leading-relaxed">
                  <FlaskConical size={10} className="inline mr-1" />
                  {st.ours}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — GPU, ASIC, NPU */}
      <section data-section-id="gpu-asic-npu" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader icon={Server} title="GPU, ASIC and NPU" />
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>GPUs</strong> win on throughput, not latency. Every launch has a fixed cost,
            lanes run in lock-step groups, and memory delays are hidden only when thousands of
            independent operations are in flight — perfect for signing 50,000 certificates, poor for
            one TLS handshake.
          </p>
          <Ours>
            {GPU_BATCH.note} At a batch of 256 the GPU lost to the CPU; at 65,536 it was 9.3× the
            all-core CPU. Signing was harder: {GPU_BATCH.signAt16k.note}
          </Ours>
          <Cited sources={['cupqcBlog', 'cupqcReq', 'cudaGpus']}>{CITED_FACTS.cupqc}</Cited>
          <p>
            <strong>ASICs</strong> share the FPGA’s limits — bus transfers, one engine shared by
            many cores, a fixed area budget — and add their own: the design is frozen at tape-out,
            takes years and a large up-front investment, and cannot follow a new parameter set or a
            revised standard. Their reward is the highest clock and lowest power of any option.
          </p>
          <Cited sources={['adamsBridge', 'openTitanKmac']}>
            {CITED_FACTS.adamsBridge} Choosing only the highest security level keeps the silicon
            small — and means ML-DSA-44/65 users get no help from it.
          </Cited>
          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">
              Capacity, size and power: from tiny FPGAs to custom silicon
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5 pr-2">FPGA</th>
                    <th className="py-1.5 pr-2">Logic</th>
                    <th className="py-1.5 pr-2">On-chip memory / DSP</th>
                    <th className="py-1.5 pr-2">Package</th>
                    <th className="py-1.5">Power, as published</th>
                  </tr>
                </thead>
                <tbody>
                  {FPGA_LADDER.map((f) => (
                    <tr
                      key={f.part}
                      className={`border-b border-border/50 align-top ${f.part.includes('K26') ? 'bg-primary/5 font-medium' : ''}`}
                    >
                      <td className="py-1.5 pr-2">
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          {f.part}
                        </a>
                      </td>
                      <td className="py-1.5 pr-2">{f.logic}</td>
                      <td className="py-1.5 pr-2">{f.memory}</td>
                      <td className="py-1.5 pr-2">{f.pkg}</td>
                      <td className="py-1.5 text-muted-foreground">{f.power}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5 pr-2">ASIC PQC engine</th>
                    <th className="py-1.5 pr-2">Node</th>
                    <th className="py-1.5 pr-2">Area</th>
                    <th className="py-1.5 pr-2">Power</th>
                    <th className="py-1.5">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {ASIC_ENGINES.map((a) => (
                    <tr key={a.engine} className="border-b border-border/50 align-top">
                      <td className="py-1.5 pr-2">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          {a.engine}
                        </a>
                      </td>
                      <td className="py-1.5 pr-2">{a.node}</td>
                      <td className="py-1.5 pr-2">{a.area}</td>
                      <td className="py-1.5 pr-2">{a.power}</td>
                      <td className="py-1.5 text-muted-foreground">{a.perf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Read the two tables together. A complete, side-channel-protected ML-DSA + ML-KEM
              engine fits in about a tenth of a square millimetre of 5 nm silicon, and lattice ASICs
              run in milliwatts or less. The same engines in an FPGA need a mid-sized part like our
              K26 — far more silicon and power — because programmable logic pays for its
              flexibility:
            </p>
            <Cited sources={[]}>
              {FPGA_ASIC_GAP.text}{' '}
              <a
                href={FPGA_ASIC_GAP.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Kuon &amp; Rose, “Measuring the gap between FPGAs and ASICs” (FPGA 2006)
              </a>
            </Cited>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">
              Buying it instead of building it: commercial PQC hardware IP
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5 pr-2">Vendor / IP</th>
                    <th className="py-1.5 pr-2">Algorithms</th>
                    <th className="py-1.5 pr-2">Size (as published)</th>
                    <th className="py-1.5 pr-2">Performance</th>
                    <th className="py-1.5">Side-channel claim</th>
                  </tr>
                </thead>
                <tbody>
                  {IP_VENDORS.map((v) => (
                    <tr key={v.vendor + v.product} className="border-b border-border/50 align-top">
                      <td className="py-1.5 pr-2">
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary font-medium"
                        >
                          {v.vendor}
                        </a>
                        <div className="text-muted-foreground">{v.product}</div>
                      </td>
                      <td className="py-1.5 pr-2">{v.algorithms}</td>
                      <td className="py-1.5 pr-2">{v.size}</td>
                      <td className="py-1.5 pr-2">{v.perf}</td>
                      <td className="py-1.5">{v.sca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{IP_VENDOR_NOTE}</p>
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-1.5">
              <div className="text-xs font-bold text-warning">
                In plain English: constant-time vs masked
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                <strong>Constant-time</strong> means the circuit takes exactly the same time and
                follows the same steps whatever the secret key is, so a stopwatch learns nothing. It
                is cheap. <strong>Masking</strong> goes further: every secret value is split into
                random pieces (“shares”) that are processed separately and only recombine at the
                end, so the power drawn or radio noise emitted at any moment is unrelated to the
                key. It defeats power and electromagnetic analysis — but every share has to be
                carried, refreshed with fresh randomness and recombined carefully, which costs extra
                area, randomness and time, and the cost grows with the number of shares.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">
              What side-channel protection costs
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5 pr-2">Implementation</th>
                    <th className="py-1.5 pr-2">Protection</th>
                    <th className="py-1.5 pr-2">Cost vs unprotected</th>
                    <th className="py-1.5">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {MASKING_COSTS.map((m) => (
                    <tr key={m.impl} className="border-b border-border/50 align-top">
                      <td className="py-1.5 pr-2">
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          {m.impl}
                        </a>
                      </td>
                      <td className="py-1.5 pr-2">{m.protection}</td>
                      <td className="py-1.5 pr-2 text-foreground">{m.cost}</td>
                      <td className="py-1.5 text-muted-foreground">{m.platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="text-xs text-foreground/85 space-y-1 list-disc pl-4">
              {MASKING_TAKEAWAYS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              Published, not measured by us. Our own KV260 engines were built for speed and have not
              yet been evaluated against power or electromagnetic analysis — a planned later phase.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-bold text-foreground">
              Can an ASIC be reprogrammed? Partly — it depends where the “recipe” lives
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Many crypto engines are <strong>microcoded</strong>: fixed hardware (multipliers,
              Keccak, memories) follows a stored list of steps, like a kitchen following a recipe
              card. If that card is in writable memory, a signed update can change the step order,
              the parameter sets or fix a bug — but never add hardware the chip lacks. If the card
              is burned into ROM, nothing changes after manufacture. Adams Bridge is microcoded, and
              its microcode is in ROM.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5 pr-2">Approach</th>
                    <th className="py-1.5 pr-2">In plain English</th>
                    <th className="py-1.5 pr-2">Can change after manufacture</th>
                    <th className="py-1.5">Cannot change</th>
                  </tr>
                </thead>
                <tbody>
                  {ASIC_AGILITY.map((a) => (
                    <tr key={a.mechanism} className="border-b border-border/50 align-top">
                      <td className="py-1.5 pr-2 font-medium text-foreground">
                        {a.url ? (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary"
                          >
                            {a.mechanism}
                          </a>
                        ) : (
                          a.mechanism
                        )}
                        {a.sourceText && (
                          <div className="text-[10px] font-normal text-muted-foreground">
                            {a.sourceText}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 pr-2">{a.plain}</td>
                      <td className="py-1.5 pr-2 text-status-success">{a.canChange}</td>
                      <td className="py-1.5 text-muted-foreground">{a.cannotChange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              The practical middle path for crypto agility in silicon: put the stable building
              blocks (Keccak, NTT, modular multiply) in hardware and keep each scheme’s steps in
              updatable firmware — most of the ASIC’s efficiency, much of the FPGA’s flexibility.
            </p>
          </div>

          <p>
            <strong>NPUs</strong> are arrays of 8-bit multiply-accumulate units fed a pre-compiled
            neural-network graph, designed to tolerate rounding. PQC needs exact arithmetic on
            23-bit (ML-DSA) and 12-bit (ML-KEM) numbers, and Keccak is bitwise logic with no
            multiplication at all.
          </p>
          <Ours label="Our own evaluation (desk analysis, not measured)">
            We evaluated the i.MX 95’s eIQ Neutron NPU for PQC and ruled it out on paper (not
            prototyped): it is reached only through compiled model graphs, its int8 quantisation is
            lossy, every NTT stage would need a round trip back to the CPU, and the dominant cost in
            our traces is Keccak, which no multiply-accumulate array can express. We use the NPU to
            monitor the appliance’s crypto behaviour instead.
          </Ours>
          <Cited sources={['imx95', 'tensorFhe']}>
            {CITED_FACTS.imx95Npu} {CITED_FACTS.tensorFhe}
          </Cited>
        </div>
      </section>

      {/* 8 — Lessons */}
      <section data-section-id="lessons" className="glass-panel p-6 scroll-mt-20">
        <SectionHeader
          icon={GraduationCap}
          title="Lessons: Owning an Instruction Is Not Using It"
          tone="secondary"
        />
        <div className="space-y-3 text-sm text-foreground/80">
          <Ours>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>
                <strong>AES ran in software on every board</strong> until a compile flag was set.{' '}
                {ISA_EFFECTS.aesBeforeAfter.note} Speed-up at 16 KiB: M4 Pro{' '}
                {ISA_EFFECTS.aesBeforeAfter.speedup.m4pro}, i.MX 95{' '}
                {ISA_EFFECTS.aesBeforeAfter.speedup.mx95}, KV260{' '}
                {ISA_EFFECTS.aesBeforeAfter.speedup.kv260}.
              </li>
              <li>
                <strong>A library chose the wrong kernel for our core.</strong>{' '}
                {ISA_EFFECTS.rsaWrongKernel.note}{' '}
                {ISA_EFFECTS.rsaWrongKernel.rows.map((r) => `${r.key} ${r.gain}`).join(', ')}.
              </li>
              <li>
                <strong>An instruction can be present, unused — and then only a modest win.</strong>{' '}
                {ISA_EFFECTS.keccakAsmOff.note}
              </li>
              <li>
                <strong>An accelerator slower than the CPU is not an accelerator.</strong> Our first
                Keccak FPGA engine needed {OFFLOAD_ROUND_TRIP.perJobUs} µs per hash where the A53
                needed about 12 µs — we removed it, and dropped SHA-2 from the fabric for the same
                reason.
              </li>
            </ul>
          </Ours>
          <p>
            The practical checklist: find where the time actually goes; check which instructions the
            core really has <em>and</em> that the build uses them; prefer acceleration inside the
            CPU for small, latency-sensitive operations; offload only whole operations; and measure
            end to end, under concurrency, against the best CPU path — not the reference code.
          </p>
        </div>
      </section>

      <section className="glass-panel p-6">
        <h3 className="text-sm font-bold text-foreground mb-3">Related modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              to: '/learn/slh-dsa',
              label: 'SLH-DSA',
              note: 'The hash-based signature this module accelerates',
            },
            {
              to: '/learn/hsm-pqc',
              label: 'HSM & PQC',
              note: 'Where accelerated PQC runs in production',
            },
            { to: '/learn/iot-ot-pqc', label: 'IoT & OT', note: 'Small cores, tight budgets' },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg border border-border bg-card/40 p-3 hover:bg-card transition-colors"
            >
              <div className="text-sm font-medium text-foreground">{l.label}</div>
              <div className="text-xs text-muted-foreground">{l.note}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Seven acceleration models and five building blocks in plain English, then our own
          measurements and FPGA labs.
        </p>
      </div>
    </div>
  )
}
