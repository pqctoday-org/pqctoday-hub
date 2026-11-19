// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import {
  Cpu,
  Timer,
  ShieldAlert,
  Layers,
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'

interface ImplSecurityIntroductionProps {
  onNavigateToWorkshop: (step?: number) => void
}

export const ImplSecurityIntroduction: React.FC<ImplSecurityIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()

  return (
    <div className="space-y-8">
      {/* Educational Scope Banner */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/85">
        <div className="flex items-start gap-3">
          <Cpu size={18} className="mt-0.5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Educational Scope &amp; Production Verification
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This module uses simplified C code patterns, walkthrough traces, and illustrative
              order-of-magnitude cost profiles to teach side-channel and fault-injection defense
              decisions. Completing exercises here does not certify your cryptographic library,
              firmware, or hardware module — apply disassembly checks, timing harnesses, TVLA lab
              testing, and accredited FIPS 140-3 / EUCC evaluations to your real production builds.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Constant-Time PQC Pitfalls */}
      <section
        data-section-id="constant-time-pqc"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Timer size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            1. Constant-Time Pitfalls in ML-KEM &amp; ML-DSA
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Passing <InlineTooltip term="ACVP">ACVP</InlineTooltip> known-answer tests verifies
          mathematical correctness of <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> (FIPS 203)
          and <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (FIPS 204), but says nothing about
          whether execution time or cache behavior depends on secret keys. Lattice schemes introduce
          distinct microarchitectural failure modes compared to RSA and ECC:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              KyberSlash Division Timing (t / q)
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Dividing secret-dependent intermediate values by <code>q = 3329</code> in{' '}
              <code>Compress_d</code> or <code>Decompress_d</code> compiles to variable-latency
              hardware <code>DIV</code>/<code>SDIV</code> instructions on many x86, ARM, and RISC-V
              cores. Replace divisions with constant-time Barrett or Montgomery multiply-shift
              reductions and enforce disassembly gates in CI.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              ML-DSA Rejection-Sampling Branches
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              In FIPS 204 signing, the retry count is public, but early-exit loops checking{' '}
              <code>||z||_∞</code>, <code>||r0||_∞</code>, or <code>||ct0||_∞</code> leak{' '}
              <em>which</em> coefficient failed and bias recovery of masking vector <code>y</code>{' '}
              and secret vectors <code>s1</code>/<code>s2</code>. Scan full vectors branchlessly and
              aggregate a single failure mask.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Secret-Dependent Memory Indexing
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Lookup tables indexed by secret noise or message bits expose cache-line access
              patterns to co-resident Prime+Probe or Flush+Reload attackers. Use bitsliced or
              arithmetic formulas (e.g., Hamming-weight subtraction for CBD sampling) or full-table
              constant-time scans.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            What to Look for in Production Verification Tooling
          </p>
          <p>
            Look for automated binary disassembly checks banning secret-path division/branch
            instructions per target ISA, statistical timing harnesses (such as <code>dudect</code>),
            and dynamic taint checkers (<code>Timecop</code> / <code>ctgrind</code>).{' '}
            <strong>Limitation:</strong> A constant-time pass on one compiler version or CPU
            architecture does not carry over automatically when flags, compilers, or target ISAs
            change.
          </p>
        </div>
      </section>

      {/* Section 2: Fujisaki-Okamoto Transform & Implicit Rejection */}
      <section
        data-section-id="fo-implicit-rejection"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <ShieldAlert size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            2. Fujisaki-Okamoto (FO) Transform &amp; Implicit Rejection
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Core lattice encryption (<code>K-PKE</code>) is only IND-CPA secure: an active attacker
          who can submit crafted ciphertexts and learn whether decryption succeeded can recover the
          long-term secret key. <InlineTooltip term="FIPS 203">FIPS 203</InlineTooltip> wraps{' '}
          <code>K-PKE</code> in the Fujisaki-Okamoto (FO) transform with{' '}
          <strong>implicit rejection</strong> to achieve IND-CCA2 security.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              How FIPS 203 ML-KEM.Decaps Protects Secret Keys
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>
                Decrypts ciphertext <code>c</code> to candidate message <code>m&prime;</code> and
                derives <code>(K&prime;, r&prime;) = G(m&prime; || h)</code>.
              </li>
              <li>
                Always computes the pseudorandom fallback key <code>K̄ = J(z || c)</code> from the
                secret rejection seed <code>z</code> stored inside the decapsulation key.
              </li>
              <li>
                Re-encrypts <code>m&prime;</code> to <code>c&prime;</code> and compares all bytes of{' '}
                <code>c</code> and <code>c&prime;</code> in constant time (never early-exit{' '}
                <code>memcmp</code>).
              </li>
              <li>
                Uses a branchless conditional move (<code>cmov</code>) to return{' '}
                <code>K&prime;</code> on match or <code>K̄</code> on mismatch — with identical
                timing, identical memory pattern, and no error code.
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Why Explicit Errors Create Key-Recovery Oracles
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Returning <code>ERR_INVALID_CIPHERTEXT</code>, skipping <code>J(z || c)</code> on
              valid inputs, or letting a wrapper API log a decapsulation mismatch exposes a
              plaintext-checking oracle. Similarly, failing to zeroize <code>m&prime;</code> and{' '}
              <code>r&prime;</code> leaves sensitive intermediates in stack or heap memory.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground pt-1">
              <strong>Production check:</strong> Verify ACVP ML-KEM implicit-rejection vectors and
              run valid-vs-tampered timing differential tests across both the cryptographic library
              and the calling protocol wrapper (TLS, HPKE, or KMS API).
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Hardware Masking & Fault-Injection Defenses */}
      <section
        data-section-id="masking-and-faults"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Layers size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            3. Hardware Masking &amp; Fault-Injection Countermeasures
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          On HSMs, smart cards, secure elements, and embedded MCUs where adversaries can capture
          power consumption or electromagnetic (EM) traces — or inject voltage/clock glitches and
          laser pulses — constant-time software alone is insufficient. Defense-in-depth combines{' '}
          <strong>masking</strong>, <strong>shuffling</strong>, and <strong>fault detection</strong>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Linear vs. Non-Linear Masking Costs
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The Number Theoretic Transform (<code>NTT</code>) is linear over <code>Z_q</code>, so
              splitting polynomials into <code>d + 1</code> arithmetic shares scales roughly
              linearly. The real cost bottleneck lies in <strong>non-linear operations</strong>:
              Arithmetic-to-Boolean (<code>A2B</code>/<code>B2A</code>) conversions for ML-KEM
              compression and ML-DSA norm checks, plus the non-linear Chi (<code>χ</code>) step in{' '}
              <code>Keccak / SHAKE</code> (FIPS 202), which consumes substantial fresh randomness
              from an approved DRBG.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Fault Injection on FIPS 204 &amp; FIPS 205
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Passive masking does not prevent active faults. Glitching an ML-DSA rejection check or
              corrupting a <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (FIPS 205) WOTS+
              hash chain during signing can leak secret key material from a single faulty signature.
              <strong> Redundant verification</strong> (verifying the signature before releasing it)
              and random operation shuffling mitigate single-fault and horizontal single-trace
              attacks at a modest fraction of signing cost.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: TVLA, FIPS 140-3 & EUCC Certification Evidence */}
      <section
        data-section-id="tvla-and-certification"
        className="glass-panel p-6 space-y-4 scroll-mt-24"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Activity size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            4. Evaluation Evidence: TVLA, FIPS 140-3 &amp; EUCC
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-foreground/85">
          Evaluating a PQC product requires distinguishing between{' '}
          <strong>leakage screening</strong>, <strong>module validation</strong>, and{' '}
          <strong>attack-potential certification</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              TVLA (Welch’s t-Test, |t| &gt; 4.5)
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Test Vector Leakage Assessment compares fixed vs. random input trace sets; exceeding{' '}
              <code>|t| &gt; 4.5</code> signals statistically significant leakage.{' '}
              <strong>Key caveat:</strong> TVLA detects leakage — it does not prove key-recovery
              exploitability by itself, and passing first-order univariate TVLA does not rule out
              higher-order, multivariate, or single-trace template attacks.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              FIPS 140-3 Non-Invasive Mitigation
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Following the September 2026 transition of FIPS 140-2 to Historical status, new
              acquisitions rely on <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip>{' '}
              (ISO/IEC 19790), with non-invasive attack mitigation test methods referenced in
              ISO/IEC 17825, NIST SP 800-140F, and FIPS 140-3 IG PQC. Verify active CMVP certificate
              scope and Security Policy coverage of PQC primitives.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              EUCC AVA_VAN.4 &amp; AVA_VAN.5
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Under the EU Cybersecurity Certification Scheme (EUCC, Commission Implementing
              Regulation (EU) 2024/482), high-assurance hardware modules undergo independent
              penetration and side-channel/fault vulnerability analysis at <code>AVA_VAN.4</code> or{' '}
              <code>AVA_VAN.5</code>, bound strictly to the evaluated Target of Evaluation (TOE)
              firmware and silicon revision.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle size={16} className="text-status-warning shrink-0" />
            <span>Core Evidence Rule: Unknown Never Means Low Exposure</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A vendor claim of “side-channel resistant PQC” without trace counts, TVLA/attack
            reports, active FIPS 140-3 CMVP certificate IDs, or EUCC TOE version bindings must be
            recorded as <strong>Unverified / Evidence Gap</strong> — never as low risk.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 size={14} className="text-status-success shrink-0" />
            <span>
              Ready to inspect timing leaks, audit FO implicit rejection, and budget masking costs?
            </span>
          </div>
          <Button variant="gradient" size="sm" onClick={() => onNavigateToWorkshop(0)}>
            Launch Workshop
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>
      </section>

      <ReadingCompleteButton />
    </div>
  )
}
