import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shuffle,
  FileText,
  Cog,
  TestTubes,
  ShieldCheck,
  Cpu,
  Atom,
  Shield,
  ArrowRight,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { DRBG_MECHANISMS, RNG_COMPARISON } from '../utils/entropyConstants'

interface EntropyIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const EntropyIntroduction: React.FC<EntropyIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Section 1: Why Entropy Matters */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shuffle size={20} /> Why Entropy Matters
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          All cryptographic security ultimately depends on the quality of randomness used for key
          generation, nonces, and initialization vectors. A perfectly designed algorithm with a
          4096-bit key is worthless if the underlying random number generator is predictable. The
          difference between &quot;secure&quot; and &quot;broken&quot; often comes down to{' '}
          <InlineTooltip term="Entropy">entropy</InlineTooltip> — the measure of true
          unpredictability in the bits that seed your cryptographic operations.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-destructive mb-1">Bad Entropy</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Debian OpenSSL bug (2008): PID-only seeding produced ~32,768 possible keys</li>
              <li>Predictable seeds lead to key recovery attacks</li>
              <li>Hardware failures (stuck-at) can produce constant output</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Good Entropy</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                OS <InlineTooltip term="CSPRNG">CSPRNG</InlineTooltip> (crypto.getRandomValues,
                /dev/urandom)
              </li>
              <li>
                Hardware <InlineTooltip term="TRNG">TRNG</InlineTooltip> (Intel RDRAND, ARM RNDR)
              </li>
              <li>Continuous health monitoring per SP 800-90B</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">Best Practice</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Multiple independent entropy sources</li>
              <li>Defense-in-depth per SP 800-90C</li>
              <li>Formal validation via NIST ESV program</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: NIST SP 800-90 Family */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <FileText size={20} /> NIST SP 800-90 Family
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          NIST&apos;s SP 800-90 series provides a complete framework for random number generation,
          from raw entropy sources to fully constructed Random Bit Generators (RBGs).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">
              <InlineTooltip term="SP 800-90A">SP 800-90A</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              <InlineTooltip term="DRBG">DRBG</InlineTooltip> Mechanisms: Defines CTR_DRBG,
              Hash_DRBG, and HMAC_DRBG for stretching seed entropy into arbitrary-length random
              streams.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">
              <InlineTooltip term="SP 800-90B">SP 800-90B</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              Entropy Sources: Methods for validating that physical noise sources provide sufficient
              entropy. Includes health tests and{' '}
              <InlineTooltip term="Min-Entropy">min-entropy</InlineTooltip> estimation.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">
              <InlineTooltip term="SP 800-90C">SP 800-90C</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              RBG Constructions: How to combine entropy sources with DRBGs into complete Random Bit
              Generators. Defines RBG1, RBG2, RBG3, and RBGC classes.
            </p>
          </div>
        </div>
        {/* Flow diagram */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border text-center">
            <div className="font-bold text-foreground">Entropy Source</div>
            <div className="text-muted-foreground">(90B)</div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border text-center">
            <div className="font-bold text-foreground">Conditioning</div>
            <div className="text-muted-foreground">HMAC / Hash</div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border text-center">
            <div className="font-bold text-foreground">DRBG</div>
            <div className="text-muted-foreground">(90A)</div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/30 text-center">
            <div className="font-bold text-primary">Random Output</div>
            <div className="text-muted-foreground">Full entropy</div>
          </div>
        </div>
      </section>

      {/* Section 3: DRBG Mechanisms (SP 800-90A) */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Cog size={20} /> DRBG Mechanisms (SP 800-90A)
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          SP 800-90A Rev. 1 (2015) defines three approved DRBG mechanisms. All use symmetric
          primitives and are quantum-safe — Grover&apos;s algorithm at most halves the effective key
          length, which is addressed by using 256-bit keys.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {DRBG_MECHANISMS.map((mech) => (
            <div key={mech.name} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-sm font-bold text-primary mb-1">{mech.name}</div>
              <div className="text-xs text-muted-foreground mb-1">
                <span className="font-medium text-foreground/70">Basis:</span> {mech.basis}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{mech.description}</p>
              <p className="text-xs text-success/80">
                <span className="font-medium">Strengths:</span> {mech.strengths}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Note:</span> Rev. 2 is in draft, adding
          XOF_DRBG (SHAKE-based) and removing deprecated TDES and SHA-1.
        </p>
      </section>

      {/* Section 4: Entropy Testing (SP 800-90B) */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <TestTubes size={20} /> Entropy Testing (SP 800-90B)
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          SP 800-90B (2018) provides methods for validating that entropy sources produce sufficient
          randomness. Tests fall into two categories: continuous health tests that run during
          operation, and min-entropy estimators used during formal validation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Health Tests */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-primary mb-2">Health Tests (Continuous)</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-foreground/80 mb-1">
                  Repetition Count Test
                </div>
                <p className="text-xs text-muted-foreground">
                  Detects stuck-at failures by flagging repeated outputs. If the same value appears
                  more than a threshold number of consecutive times, the source is considered
                  failed.
                </p>
              </div>
              <div>
                <div className="text-xs font-medium text-foreground/80 mb-1">
                  Adaptive Proportion Test
                </div>
                <p className="text-xs text-muted-foreground">
                  Detects bias by tracking the frequency of the most common value within a sliding
                  window. Flags the source if any value appears disproportionately often.
                </p>
              </div>
            </div>
          </div>

          {/* Min-Entropy Estimation */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-primary mb-2">
              Min-Entropy Estimation (Validation)
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-foreground/80 mb-1">Key Estimators</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Most Common Value</li>
                  <li>Collision</li>
                  <li>Markov</li>
                  <li>Compression</li>
                  <li>t-Tuple</li>
                  <li>Longest Repeated Substring</li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-medium text-foreground/80 mb-1">Predictor Tests</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>MultiMCW</li>
                  <li>Lag</li>
                  <li>MultiMMC</li>
                  <li>LZ78Y</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Tool:</span> NIST provides an open-source
          C++ implementation (SP800-90B_EntropyAssessment) for running these tests on raw noise
          samples.
        </p>
      </section>

      {/* Section 5: NIST ESV Program */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <ShieldCheck size={20} /> NIST ESV Program
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          The Entropy Source Validation (ESV) program, part of NIST&apos;s CMVP, provides formal
          certification of entropy sources used in FIPS-validated cryptographic modules.
        </p>

        {/* ESV Flow */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs mb-4">
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border text-center">
            <div className="font-bold text-foreground">Submit</div>
            <div className="text-muted-foreground">Entropy Source</div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border text-center">
            <div className="font-bold text-foreground">ESV Server</div>
            <div className="text-muted-foreground">Assessment</div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border text-center">
            <div className="font-bold text-foreground">CMVP Review</div>
            <div className="text-muted-foreground">~6 weeks</div>
          </div>
          <ArrowRight size={14} className="text-muted-foreground shrink-0" />
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/30 text-center">
            <div className="font-bold text-primary">ESV Certificate</div>
            <div className="text-muted-foreground">Validated</div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              Launched April 2022 as part of NIST&apos;s Cryptographic Module Validation Program
            </li>
            <li>
              Separate from FIPS 140-3 module validation — entropy sources are validated
              independently
            </li>
            <li>Allows reuse of validated entropy sources across multiple module validations</li>
            <li>
              Automated process via ESV Server web API for submitting samples and receiving results
            </li>
          </ul>
        </div>
      </section>

      {/* Section 6: TRNG vs QRNG */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Cpu size={20} className="shrink-0" /> <InlineTooltip term="TRNG">TRNG</InlineTooltip> vs{' '}
          <Atom size={20} className="shrink-0" /> <InlineTooltip term="QRNG">QRNG</InlineTooltip>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-xs font-bold text-foreground/80">
                  Property
                </th>
                <th className="text-left py-2 pr-3 text-xs font-bold text-primary">TRNG</th>
                <th className="text-left py-2 text-xs font-bold text-primary">QRNG</th>
              </tr>
            </thead>
            <tbody>
              {RNG_COMPARISON.map((row) => (
                <tr key={row.property} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-xs font-medium text-foreground/70">
                    {row.property}
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{row.trng}</td>
                  <td className="py-2 text-xs text-muted-foreground">{row.qrng}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 7: Combining Sources for PQC */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> Combining Sources for PQC
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          <strong>
            Current TRNG implementations are already quantum-safe because they rely on physical
            noise processes, not computational assumptions that quantum computers could break.
          </strong>
        </p>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Combining TRNG and QRNG sources provides additional assurance for post-quantum
          cryptographic systems:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border mb-4">
          <ul className="text-xs text-muted-foreground space-y-2">
            <li>
              <span className="font-medium text-foreground/70">Defense-in-depth:</span> If one
              source is compromised or experiences a failure, the other still provides entropy
            </li>
            <li>
              <span className="font-medium text-foreground/70">SP 800-90C framework:</span> Provides
              the standard construction for combining multiple entropy sources into a single RBG
            </li>
            <li>
              <span className="font-medium text-foreground/70">XOR combination:</span> XORing two
              independent sources preserves the entropy of the stronger source — an attacker must
              break both
            </li>
            <li>
              <span className="font-medium text-foreground/70">Conditioning:</span> HMAC or hash
              conditioning distributes entropy uniformly across the output, removing any bias from
              individual sources
            </li>
          </ul>
        </div>

        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="flex items-center gap-2"
        >
          Try It in the Workshop <ArrowRight size={16} />
        </Button>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link
            to="/algorithms"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Shield size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Algorithm Explorer</div>
              <div className="text-xs text-muted-foreground">
                Compare PQC key sizes, security levels &amp; performance
              </div>
            </div>
          </Link>
          <Link
            to="/playground"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Cpu size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Playground</div>
              <div className="text-xs text-muted-foreground">
                Hands-on hashing, KEM, and symmetric operations
              </div>
            </div>
          </Link>
          <Link
            to="/learn/key-management"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <ShieldCheck size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Key Management</div>
              <div className="text-xs text-muted-foreground">
                Key lifecycle, HSMs, and certificate management
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
