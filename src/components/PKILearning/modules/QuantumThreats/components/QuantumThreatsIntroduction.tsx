import React from 'react'
import { Link } from 'react-router-dom'
import {
  Atom,
  Calculator,
  Search,
  Clock,
  Shield,
  PenLine,
  ArrowRight,
  BarChart3,
  Target,
  Calendar,
  ClipboardCheck,
} from 'lucide-react'

interface QuantumThreatsIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const QuantumThreatsIntroduction: React.FC<QuantumThreatsIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Qubits & Superposition */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Atom size={20} /> Qubits &amp; Superposition
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Classical computers store information as bits — each is definitively 0 or 1. A quantum
          computer uses <strong>qubits</strong>, which exploit two quantum phenomena to process
          information fundamentally differently.
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
              <strong>Superposition:</strong> exists in a combination of 0 and 1 simultaneously.{' '}
              <strong>Entanglement:</strong> qubits can be correlated so measuring one instantly
              determines the other. Together, N qubits can process 2<sup>N</sup> states in parallel.
            </p>
          </div>
        </div>
        <div className="mt-4 bg-warning/5 rounded-lg p-3 border border-warning/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-warning">Key insight:</strong> Quantum speedup doesn&apos;t come
            from &quot;trying all answers at once.&quot; It comes from carefully constructing
            interference patterns that amplify correct answers and cancel wrong ones. Only specific
            algorithms (like Shor&apos;s and Grover&apos;s) can exploit this structure.
          </p>
        </div>
      </section>

      {/* Shor's Algorithm */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Calculator size={20} /> Shor&apos;s Algorithm — Breaking RSA &amp; ECC
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Peter Shor discovered in 1994 that a quantum computer can solve two hard mathematical
          problems <strong>exponentially faster</strong> than any classical computer:
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
                RSA-2048 requires ~4,098 logical qubits. A CRQC could factor it in hours, not
                billions of years.
              </p>
            </div>
          </div>
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <div className="text-sm font-bold text-destructive mb-2">
              Discrete Logarithm (ECC/DH)
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                ECC (ECDSA, ECDH, EdDSA) and Diffie-Hellman rely on the hardness of discrete
                logarithms.
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
                P-256 requires ~2,330 logical qubits. All ECC variants (P-256, P-384, X25519,
                Ed25519) are equally broken.
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
          <Search size={20} /> Grover&apos;s Algorithm — Weakening AES &amp; SHA
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Lov Grover discovered in 1996 that a quantum computer can search an unstructured database
          quadratically faster. This affects symmetric encryption and hash functions:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground">Algorithm</th>
                <th className="text-center p-2 text-muted-foreground">Classical Security</th>
                <th className="text-center p-2 text-muted-foreground">Quantum Security</th>
                <th className="text-center p-2 text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">AES-128</td>
                <td className="p-2 text-center">128-bit</td>
                <td className="p-2 text-center text-destructive font-bold">64-bit</td>
                <td className="p-2 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                    Insufficient
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">AES-192</td>
                <td className="p-2 text-center">192-bit</td>
                <td className="p-2 text-center text-warning font-bold">96-bit</td>
                <td className="p-2 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                    Adequate
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 font-medium">AES-256</td>
                <td className="p-2 text-center">256-bit</td>
                <td className="p-2 text-center text-success font-bold">128-bit</td>
                <td className="p-2 text-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                    Secure
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
        <div className="mt-4 bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Practical note:</strong> Grover&apos;s algorithm is
            less threatening than Shor&apos;s. It provides only a quadratic speedup (halving
            security bits), and the algorithm requires sequential oracle queries — it cannot be
            parallelized effectively. The fix is simple: double the key size (AES-128 → AES-256).
          </p>
        </div>
      </section>

      {/* CRQC Timeline */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Clock size={20} /> CRQC Timeline Projections
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          A <strong>Cryptographically Relevant Quantum Computer (CRQC)</strong> is one powerful
          enough to run Shor&apos;s algorithm against production-size keys. Experts disagree on when
          this will happen, but major agencies are planning for it now:
        </p>
        <div className="space-y-3">
          {[
            {
              org: 'NIST IR 8547',
              timeline: 'Deprecate by 2030, disallow by 2035',
              color: 'primary',
            },
            {
              org: 'NSA CNSA 2.0',
              timeline: 'Software PQC by 2025, all NSS by 2033',
              color: 'destructive',
            },
            {
              org: 'Global Risk Institute',
              timeline: '~33% chance by 2033, ~50% by 2038',
              color: 'warning',
            },
            {
              org: 'BSI Germany',
              timeline: 'Recommend hybrid migration now',
              color: 'success',
            },
            {
              org: 'ANSSI France',
              timeline: 'Mandate hybrid for government by 2025',
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
        <div className="mt-4 bg-destructive/5 rounded-lg p-3 border border-destructive/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-destructive">Bottom line:</strong> Whether a CRQC arrives in
            2030 or 2040, migration takes years. Organizations handling long-lived data (government,
            healthcare, finance) must begin now because of the Harvest Now, Decrypt Later threat.
          </p>
        </div>
      </section>

      {/* HNDL Attack Model */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> Harvest Now, Decrypt Later (HNDL)
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          The most urgent quantum threat is not future code-breaking — it&apos;s data being
          intercepted <strong>today</strong> for future decryption. This attack is called{' '}
          <strong>Harvest Now, Decrypt Later (HNDL)</strong>, also known as &quot;Store Now, Decrypt
          Later&quot; or &quot;retrospective decryption.&quot;
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
            <div className="text-2xl mb-1">📡</div>
            <div className="text-sm font-bold text-destructive mb-1">Phase 1: Harvest</div>
            <p className="text-xs text-muted-foreground">
              Adversaries intercept encrypted traffic today (VPN, TLS, email) and store it.
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
              Once CRQC is available, Shor&apos;s breaks the key exchange. Symmetric keys are
              recovered, all data is decrypted.
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Mosca&apos;s Theorem (Migration Deadline):</strong>{' '}
            If your data must remain secure for <em>X</em> years, your migration will take{' '}
            <em>Y</em> years, and a CRQC is expected in <em>Z</em> years, you must start migrating{' '}
            within <strong>Z &minus; X &minus; Y</strong> years. For data with 25-year sensitivity,
            a 5-year migration time, and a CRQC in 2035, migration should have started by 2005.
          </p>
        </div>
      </section>

      {/* HNFL Attack Model */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <PenLine size={20} /> Harvest Now, Forge Later (HNFL)
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          HNDL targets confidentiality. <strong>HNFL targets authenticity and integrity.</strong>{' '}
          Adversaries collect signed artifacts today — firmware images, certificate chains,
          code-signing blobs — and store them. Once a CRQC arrives, Shor&apos;s algorithm recovers
          the signer&apos;s private key, enabling forged signatures on any document or binary.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
            <div className="text-2xl mb-1">📂</div>
            <div className="text-sm font-bold text-destructive mb-1">Phase 1: Capture</div>
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
              CRQC runs Shor&apos;s algorithm on the signer&apos;s public key, recovers the private
              key, and forges arbitrary signatures retroactively.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">High-risk targets</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• PKI hierarchies &amp; root CA certificates</li>
              <li>• Firmware signing (medical devices, industrial, automotive)</li>
              <li>• Software update pipelines &amp; code-signing certs</li>
              <li>• Government ePassports &amp; digital ID credentials</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Why it&apos;s urgent now</div>
            <p className="text-xs text-muted-foreground">
              A Root CA issued today with a 20-year validity period will still be trusted in 2046.
              If a CRQC arrives in 2035, that CA&apos;s RSA or ECDSA key is breakable — and every
              certificate it ever signed becomes forgeable. Migration to{' '}
              <strong>ML-DSA or SLH-DSA</strong> must complete before CRQC arrival.
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

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/threats"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Target size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Threat Dashboard</div>
              <div className="text-xs text-muted-foreground">
                Industry-specific quantum risks &amp; PQC replacements
              </div>
            </div>
          </Link>
          <Link
            to="/algorithms"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <BarChart3 size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Algorithm Explorer</div>
              <div className="text-xs text-muted-foreground">
                Compare key sizes, security levels &amp; performance
              </div>
            </div>
          </Link>
          <Link
            to="/timeline"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Calendar size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Timeline</div>
              <div className="text-xs text-muted-foreground">
                NIST milestones, country deadlines &amp; standardization
              </div>
            </div>
          </Link>
          <Link
            to="/assess"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <ClipboardCheck size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Risk Assessment</div>
              <div className="text-xs text-muted-foreground">
                Assess your organization&apos;s quantum readiness
              </div>
            </div>
          </Link>
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
          <button
            onClick={onNavigateToWorkshop}
            className="btn btn-primary flex items-center gap-2 px-6 py-3 shrink-0"
          >
            Open Workshop <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
