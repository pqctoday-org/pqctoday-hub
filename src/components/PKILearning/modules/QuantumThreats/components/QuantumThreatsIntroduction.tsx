// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Atom, Calculator, Search, Clock, Shield, PenLine, ArrowRight } from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'
import { CRQC_ESTIMATES, getCrqcForecast } from '../data/quantumConstants'
import { EstimateClaims } from '@/components/common/EstimateClaims'
import { UnresolvedEstimatesNotice } from '@/components/common/UnresolvedEstimatesNotice'

interface QuantumThreatsIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const QuantumThreatsIntroduction: React.FC<QuantumThreatsIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()
  // The one CRQC expert forecast (ruling R5); `planningYear` (its midpoint,
  // rounded down) is the single Z the Mosca example needs.
  const crqc = getCrqcForecast()

  return (
    <div className="space-y-6 w-full">
      {/* Qubits & Superposition */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Atom size={20} /> Qubits &amp; Superposition
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Classical computers store information as bits — each is definitively 0 or 1. A quantum
          computer uses{' '}
          <strong>
            <InlineTooltip term="Qubit">qubits</InlineTooltip>
          </strong>
          , which exploit two quantum phenomena to process information fundamentally differently.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-2">Classical Bit</div>
            <div className="font-mono text-center text-2xl mb-2 text-muted-foreground">0 or 1</div>
            <p className="text-xs text-muted-foreground">
              Always in a definite state. N bits represent exactly one of 2<sup>N</sup> values at a
              time.
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-2">Quantum Bit (Qubit)</div>
            <div className="font-mono text-center text-2xl mb-2 text-primary">
              &alpha;|0&rang; + &beta;|1&rang;
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>
                <InlineTooltip term="Superposition">Superposition:</InlineTooltip>
              </strong>{' '}
              exists in a combination of 0 and 1 simultaneously.{' '}
              <strong>
                <InlineTooltip term="Entanglement">Entanglement:</InlineTooltip>
              </strong>{' '}
              qubits can be correlated so measuring one instantly determines the other. Together, N
              qubits hold a superposition over all 2<sup>N</sup> basis states at once — though a
              measurement still returns only one of them.
            </p>
          </div>
        </div>
        <div className="mt-4 bg-warning/5 rounded-lg p-3 border border-warning/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-warning">Key insight:</strong> Quantum speedup doesn&apos;t come
            from &quot;trying all answers at once.&quot; It comes from carefully constructing
            interference patterns that amplify correct answers and cancel wrong ones. Only specific
            algorithms (like <InlineTooltip term="Shor's Algorithm">Shor&apos;s</InlineTooltip> and{' '}
            <InlineTooltip term="Grover's Algorithm">Grover&apos;s</InlineTooltip>) can exploit this
            structure.
          </p>
        </div>
      </section>

      {/* Shor's Algorithm */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Calculator size={20} /> Shor&apos;s Algorithm — Threat to{' '}
          <InlineTooltip term="RSA">RSA</InlineTooltip> &amp;{' '}
          <InlineTooltip term="ECC">ECC</InlineTooltip>
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Peter Shor showed in 1994 (Polynomial-Time Algorithms for Prime Factorization and Discrete
          Logarithms on a Quantum Computer) that a sufficiently capable quantum computer can solve
          integer factoring and discrete-log problems in polynomial time on a sufficiently capable
          fault-tolerant quantum computer. No polynomial-time classical algorithm for these problems
          is known:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <div className="text-sm font-bold text-destructive mb-2">
              Integer Factorization (RSA)
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>RSA relies on the difficulty of factoring large numbers (N = p &times; q).</p>
              <div className="bg-background/50 rounded p-2 font-mono text-center">
                <div>
                  Classical: O(e
                  <sup>
                    1.9 &middot; n<sup>1/3</sup>
                  </sup>
                  ) — sub-exponential
                </div>
                <div className="text-destructive font-bold mt-1">
                  Quantum: O(n&sup3;) — polynomial
                </div>
              </div>
              <p>
                RSA-2048 requires ~1,537 logical qubits (Gidney 2025, down from the 2016-era ~4,098
                estimate). A CRQC could factor it in under a week, not billions of years.
              </p>
            </div>
          </div>
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <div className="text-sm font-bold text-destructive mb-2">
              Discrete Logarithm (ECC/DH)
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                ECC (<InlineTooltip term="ECDSA">ECDSA</InlineTooltip>,{' '}
                <InlineTooltip term="ECDH">ECDH</InlineTooltip>,{' '}
                <InlineTooltip term="EdDSA">EdDSA</InlineTooltip>) and Diffie-Hellman rely on the
                hardness of discrete logarithms.
              </p>
              <div className="bg-background/50 rounded p-2 font-mono text-center">
                <div>
                  Classical: O(2<sup>n/2</sup>) — exponential (Pollard rho)
                </div>
                <div className="text-destructive font-bold mt-1">
                  Quantum: O(n&sup3;) — polynomial
                </div>
              </div>
              <p>
                Google Quantum AI (30 March 2026) gives, for the 256-bit elliptic-curve discrete
                logarithm on secp256k1, at most 1,200 logical qubits with at most 90 million Toffoli
                gates, or at most 1,450 logical qubits with at most 70 million Toffoli gates; its
                paper gives no estimate for P-256. All ECC variants (P-256, P-384,{' '}
                <InlineTooltip term="X25519">X25519</InlineTooltip>,{' '}
                <InlineTooltip term="Ed25519">Ed25519</InlineTooltip>) are vulnerable to Shor&apos;s
                algorithm.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-destructive">Impact:</strong> Every public-key algorithm based
            on integer factorization or discrete logarithms — RSA, DSA, ECDSA, ECDH, EdDSA, DH —
            provides <strong>zero security</strong> against a quantum adversary. Key size increases
            do not help because Shor&apos;s algorithm scales polynomially.
          </p>
        </div>
      </section>

      {/* Grover's Algorithm */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Search size={20} /> Grover&apos;s Algorithm — Search and Symmetric-Key Effects
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Lov Grover showed in 1996 (A fast quantum mechanical algorithm for database search) that a
          quantum computer can search an unstructured database quadratically faster. This gives a
          quadratic query speedup for unstructured search. AES key search and hash collision
          resistance have different analyses:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground">Algorithm</th>
                <th className="text-center p-2 text-muted-foreground">Classical Security</th>
                <th className="text-center p-2 text-muted-foreground">
                  Idealised quantum query bound
                </th>
                <th className="text-center p-2 text-muted-foreground">Reading</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">AES-128</td>
                <td className="p-2 text-center">128-bit</td>
                <td className="p-2 text-center text-warning font-bold">64-bit</td>
                <td className="p-2 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                    Policy-dependent
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">AES-192</td>
                <td className="p-2 text-center">192-bit</td>
                <td className="p-2 text-center text-warning font-bold">96-bit</td>
                <td className="p-2 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                    Policy-dependent
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">AES-256</td>
                <td className="p-2 text-center">256-bit</td>
                <td className="p-2 text-center text-success font-bold">128-bit</td>
                <td className="p-2 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                    Largest margin
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">SHA-256 (collision)</td>
                <td className="p-2 text-center">128-bit</td>
                <td className="p-2 text-center text-success font-bold">~85-bit</td>
                <td className="p-2 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                    Secure
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 bg-muted/50 rounded-lg p-3 border border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Three separate questions.</strong> The table gives
            the idealised query count: about 2<sup>64</sup> sequential evaluations of the AES
            circuit for a 128-bit key. That is not a cost estimate, and it does not by itself make
            AES-128 unacceptable.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Gates, depth and hardware.</strong> Each query is a
            whole AES evaluation, and the full quadratic speedup needs those steps to run in series
            (Zalka). NIST&apos;s 2016 call for proposals estimates 2<sup>170</sup>/MAXDEPTH quantum
            gates for AES-128 key recovery when circuit depth is limited to MAXDEPTH, and Grassl et
            al. estimate about 2<sup>81</sup> overall circuit depth and 2,953 qubits. NIST&apos;s
            PQC FAQ concludes that Grover&apos;s algorithm is quite likely to give little or no
            advantage against AES, that AES-128 will remain secure for decades to come, and that
            applications can keep using 128-, 192- or 256-bit AES keys; NIST IR 8547 states that
            NIST-approved symmetric primitives with at least 128 bits of classical security are
            believed to meet at least Category 1.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Policy.</strong> Authorities differ. NIST uses
            AES-128 key search as its Category 1 reference, while NSA&apos;s CNSA 2.0 asks national
            security systems to use 256-bit AES keys. Moving from AES-128 to AES-256 is therefore a
            policy or safety-margin choice for long-lived data, not an automatic rejection of
            AES-128 derived from the 64-bit figure.
          </p>
        </div>
      </section>

      {/* CRQC Timeline */}
      <section data-section-id="crqc" className="glass-panel p-6 scroll-mt-20">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Clock size={20} /> CRQC Timeline Projections
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          A{' '}
          <strong>
            <InlineTooltip term="CRQC">
              Cryptographically Relevant Quantum Computer (CRQC)
            </InlineTooltip>
          </strong>{' '}
          is one powerful enough to run Shor&apos;s algorithm against production-size keys. Experts
          disagree on when this will happen, but major agencies are planning for it now:
        </p>
        <div className="space-y-3">
          {[
            {
              org: 'NIST IR 8547',
              timeline: 'Deprecate after 2030, disallow after 2035',
              color: 'primary',
            },
            {
              org: 'NSA CNSA 2.0',
              timeline:
                'New NSS acquisitions 2027; unsupported equipment phase-out 2030; algorithms mandated 2031 unless otherwise noted (FAQ v2.2)',
              color: 'destructive',
            },
            {
              org: 'Global Risk Institute',
              timeline:
                '~49% within a decade on averaged expert estimates; half of 26 experts put it at 50% or more (2025 Quantum Threat Timeline Report)',
              color: 'warning',
            },
            {
              org: 'BSI Germany',
              timeline: 'Recommend hybrid migration now',
              color: 'success',
            },
            {
              org: 'ANSSI France',
              timeline:
                'Recommends hybrid now; its recommendations are not a regulatory obligation today, but hybridisation is mandatory in the regulated perimeter; obligations for product qualification targeted from 2027',
              color: 'secondary',
            },
          ].map((entry) => (
            <div key={entry.org} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-${entry.color} shrink-0`} />
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{entry.org}</span>
                <span className="text-sm text-muted-foreground"> — {entry.timeline}</span>
              </div>
            </div>
          ))}
        </div>
        <EstimateClaims estimates={CRQC_ESTIMATES} headingLevel={4} includeOtherOpenQuestions />
        <div className="mt-4 bg-destructive/5 rounded-lg p-3 border border-destructive/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-destructive">Bottom line:</strong> Whether a CRQC arrives in
            2030 or 2040, migration takes years. Organizations handling long-lived data (government,
            healthcare, finance) must begin now because of the Harvest Now, Decrypt Later threat.
          </p>
        </div>
      </section>

      {/* HNDL Attack Model */}
      <section data-section-id="hndl" className="glass-panel p-6 scroll-mt-20">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} />{' '}
          <InlineTooltip term="HNDL">Harvest Now, Decrypt Later (HNDL)</InlineTooltip>
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          A time-sensitive quantum risk for long-lived secrets is recorded encrypted traffic that
          used vulnerable public-key key establishment and could later be decrypted if an attacker
          recovers the session secrets. This attack is called{' '}
          <strong>Harvest Now, Decrypt Later (HNDL)</strong>, also known as &quot;Store Now, Decrypt
          Later&quot; or &quot;retrospective decryption.&quot;
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
            <div className="text-2xl mb-1">📡</div>
            <div className="text-sm font-bold text-status-error mb-1">Phase 1: Harvest</div>
            <p className="text-xs text-muted-foreground">
              Adversaries record selected encrypted sessions today (for example, VPN or TLS) when
              their key establishment is quantum-vulnerable.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
            <div className="text-2xl mb-1">💾</div>
            <div className="text-sm font-bold text-warning mb-1">Phase 2: Store</div>
            <p className="text-xs text-muted-foreground">
              Data is archived — storage is cheap. Adversaries wait for quantum capability.
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
            <div className="text-2xl mb-1">🔓</div>
            <div className="text-sm font-bold text-primary mb-1">Phase 3: Decrypt</div>
            <p className="text-xs text-muted-foreground">
              If Shor&apos;s algorithm can recover the recorded session&apos;s classical key
              establishment secret, the attacker can derive its traffic keys and decrypt data
              protected only by that session. This does not cover every encrypted archive or
              sessions with effective post-quantum key establishment.
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Mosca&apos;s Theorem (Migration Deadline):</strong>{' '}
            If your data must remain secure for <em>X</em> years, your migration will take{' '}
            <em>Y</em> years, and a CRQC is expected in <em>Z</em> years, you must start migrating{' '}
            within <strong>Z &minus; X &minus; Y</strong> years. For data with 25-year sensitivity,
            a 5-year migration time, and a CRQC in {crqc.planningYear} (the midpoint of the{' '}
            {crqc.low}&ndash;{crqc.high} planning range this site uses), migration should have
            started by {crqc.planningYear - 25 - 5}.
          </p>
        </div>
        <UnresolvedEstimatesNotice detail="oneFigure" className="mt-3" />
      </section>

      {/* HNFL Attack Model */}
      <section data-section-id="security-levels" className="glass-panel p-6 scroll-mt-20">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <PenLine size={20} />{' '}
          <InlineTooltip term="HNFL">Harvest Now, Forge Later (HNFL)</InlineTooltip>
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          HNDL targets confidentiality. <strong>HNFL targets authenticity and integrity.</strong>{' '}
          Adversaries may collect signed artifacts and public keys today. Once a CRQC can recover a
          vulnerable signer&apos;s private key, the attacker can create new signatures that verify
          under that key and may present new artifacts as if the signer approved them. This does not
          alter files that were signed earlier. Whether an old record can be distinguished from a
          later forgery depends on preserved evidence, such as trusted timestamp and archive
          records.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
            <div className="text-2xl mb-1">📂</div>
            <div className="text-sm font-bold text-status-error mb-1">Phase 1: Capture</div>
            <p className="text-xs text-muted-foreground">
              Collect signed artifacts — firmware images, CA certificates, code-signing blobs.
              Public-key material is often publicly accessible.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
            <div className="text-2xl mb-1">💾</div>
            <div className="text-sm font-bold text-warning mb-1">Phase 2: Store</div>
            <p className="text-xs text-muted-foreground">
              Archive for years to decades. No active attack is needed — the adversary waits for
              quantum capability.
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
            <div className="text-2xl mb-1">✍️</div>
            <div className="text-sm font-bold text-primary mb-1">Phase 3: Forge</div>
            <p className="text-xs text-muted-foreground">
              CRQC runs Shor&apos;s algorithm on the public key, recovers the private key, and can
              create new signatures that verify under it. Previously signed files do not change;
              reliable time and archive evidence can help distinguish old records from later
              forgeries.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">High-risk targets</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                • <InlineTooltip term="PKI">PKI</InlineTooltip> hierarchies &amp; root CA
                certificates
              </li>
              <li>• Firmware signing (medical devices, industrial, automotive)</li>
              <li>• Software update pipelines &amp; code-signing certs</li>
              <li>• Government ePassports &amp; digital ID credentials</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Why it&apos;s urgent now</div>
            <p className="text-xs text-muted-foreground">
              A Root CA issued today with a 20-year validity period is modeled as trusted through
              2046. If a CRQC arrives within the planning range this site uses ({crqc.low}&ndash;
              {crqc.high}), an attacker could recover its RSA or ECDSA key and issue new
              certificates that appear to chain to that root. Existing certificates are not changed,
              but their history may be harder to establish without durable issuance-time and archive
              evidence.{' '}
              <a
                href="https://www.rfc-editor.org/rfc/rfc3161.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                RFC 3161
              </a>{' '}
              describes trusted timestamps as proof that data existed before a time; timestamp
              service security and retained certificate status still matter. Migration to{' '}
              <strong>
                <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> or{' '}
                <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip>
              </strong>{' '}
              must complete before a CRQC makes the classical key recoverable.
            </p>
          </div>
        </div>
        <div className="bg-secondary/5 rounded-lg p-3 border border-secondary/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-secondary">HNFL vs HNDL:</strong> HNDL requires intercepting
            encrypted traffic. HNFL does not — signed artifacts are often public. The re-issuance
            deadline formula is simpler:{' '}
            <strong>Re-issuance Deadline = CRQC Year &minus; Re-issuance Time</strong>. Use the Step
            5 workshop to calculate your credential migration window.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground text-lg">Explore Interactively</h3>
            <p className="text-sm text-muted-foreground">
              Use the Workshop to visualize security degradation, compare algorithms, and calculate
              your HNDL migration deadline.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onNavigateToWorkshop}
            className="btn btn-primary flex items-center gap-2 px-6 py-3 shrink-0"
          >
            Open Workshop <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
