import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Layers,
  Lock,
  PenTool,
  BookOpen,
  ArrowRight,
  Cpu,
  Library,
  Terminal,
  FlaskConical,
} from 'lucide-react'

interface HybridCryptoIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const HybridCryptoIntroduction: React.FC<HybridCryptoIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Why Hybrid? */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Why Hybrid Cryptography?</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The transition to post-quantum cryptography faces a fundamental dilemma: PQC algorithms
            are newer and less battle-tested than classical algorithms, yet the &ldquo;Harvest Now,
            Decrypt Later&rdquo; (HNDL) threat means waiting is dangerous.{' '}
            <strong>Hybrid cryptography</strong> solves this by combining classical and PQC
            algorithms together.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">ANSSI Mandate</div>
              <p className="text-xs text-muted-foreground">
                France&apos;s ANSSI requires hybrid mode during transition &mdash; PQC-only is not
                acceptable until algorithms are more mature.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">NIST SP 800-227</div>
              <p className="text-xs text-muted-foreground">
                NIST recommends hybrid key exchange for TLS and other protocols during the PQC
                transition period.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Defense in Depth</div>
              <p className="text-xs text-muted-foreground">
                If either the classical or PQC component is broken, the other still provides
                security. Belt and suspenders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Composite vs Concatenated */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Layers size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Composite vs. Concatenated</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>There are two main approaches to combining classical and PQC algorithms:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
              <h3 className="text-sm font-bold text-primary mb-2">Composite (Single OID)</h3>
              <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                <div className="text-muted-foreground">{`Certificate {`}</div>
                <div className="text-primary pl-3">{`algorithm: composite-ML-DSA-65-ECDSA-P256`}</div>
                <div className="text-foreground pl-3">{`publicKey: ML-DSA-65-key || ECDSA-key`}</div>
                <div className="text-foreground pl-3">{`signature: ML-DSA-65-sig || ECDSA-sig`}</div>
                <div className="text-muted-foreground">{`}`}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                A single algorithm OID identifies the combined pair. Both signatures are required
                for validation. Standardized in draft-ietf-lamps-pq-composite-sigs.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-secondary/20">
              <h3 className="text-sm font-bold text-secondary mb-2">Concatenated (Nested)</h3>
              <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                <div className="text-muted-foreground">{`Certificate {`}</div>
                <div className="text-secondary pl-3">{`algorithm: ML-DSA-65`}</div>
                <div className="text-foreground pl-3">{`extensions {`}</div>
                <div className="text-foreground pl-6">{`altSignature: ECDSA-P256-sig`}</div>
                <div className="text-foreground pl-6">{`altPublicKey: ECDSA-P256-key`}</div>
                <div className="text-foreground pl-3">{`}`}</div>
                <div className="text-muted-foreground">{`}`}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Separate algorithm OIDs. The classical algorithm rides in X.509 extensions. More
                backward-compatible but more complex.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Hybrid KEMs */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Hybrid KEMs</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            X25519MLKEM768 is the leading hybrid KEM, combining Curve25519 ECDH with ML-KEM-768.
            It&apos;s already deployed in Chrome, Cloudflare, and AWS.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3">How X25519MLKEM768 Works</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">1.</span>
                <span>
                  <strong>Key Generation:</strong> Generate both X25519 key pair and ML-KEM-768 key
                  pair
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">2.</span>
                <span>
                  <strong>Encapsulation:</strong> Sender performs X25519 ECDH + ML-KEM-768 encap
                  &rarr; produces combined ciphertext
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">3.</span>
                <span>
                  <strong>Decapsulation:</strong> Recipient performs X25519 ECDH + ML-KEM-768 decap
                  &rarr; recovers combined shared secret
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">4.</span>
                <span>
                  <strong>Key Derivation:</strong> Combined shared secret = KDF(X25519_ss ||
                  ML-KEM_ss) &rarr; session key
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Even if ML-KEM-768 is broken in the future, X25519 still provides classical security.
            Even if X25519 is broken by a quantum computer, ML-KEM-768 provides quantum resistance.
          </p>
        </div>
      </section>

      {/* Section 4: Composite Signatures */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <PenTool size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Composite Signatures</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Composite signatures combine ML-DSA with ECDSA or Ed25519 into a single signature
            operation. Both signatures must verify for the composite to be valid.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3">
              Composite Signature Structure
            </h3>
            <div className="font-mono text-xs space-y-1">
              <div className="text-muted-foreground">CompositeSignature ::= SEQUENCE {'{'}</div>
              <div className="pl-4 text-primary">classicalSig &nbsp; ECDSA-P256-Signature,</div>
              <div className="pl-4 text-success">
                pqcSig &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ML-DSA-65-Signature,
              </div>
              <div className="text-muted-foreground">{'}'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Advantages</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Single OID simplifies certificate handling</li>
                <li>&bull; Both-must-verify prevents downgrade attacks</li>
                <li>&bull; Atomic operation &mdash; no partial verification</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Trade-offs</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Larger signatures (~3.4 KB vs ~72 B for ECDSA alone)</li>
                <li>&bull; Both algorithms must be supported by verifier</li>
                <li>&bull; Draft standard &mdash; not yet finalized</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Standards Landscape */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Standards Landscape</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Standard</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Scope</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-mono text-xs">draft-ietf-lamps-pq-composite-sigs</td>
                  <td className="p-2 text-xs">Composite ML-DSA + traditional signatures</td>
                  <td className="p-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                      Draft
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-mono text-xs">draft-ietf-lamps-pq-composite-kem</td>
                  <td className="p-2 text-xs">Composite ML-KEM + traditional KEMs</td>
                  <td className="p-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                      Draft
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-mono text-xs">draft-ietf-tls-hybrid-design</td>
                  <td className="p-2 text-xs">Hybrid key exchange in TLS 1.3</td>
                  <td className="p-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                      Draft
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-mono text-xs">NIST SP 800-227</td>
                  <td className="p-2 text-xs">Recommendations for PQC key establishment</td>
                  <td className="p-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                      Final
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 font-mono text-xs">X25519MLKEM768 (IETF)</td>
                  <td className="p-2 text-xs">X25519 + ML-KEM-768 hybrid KEM</td>
                  <td className="p-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                      Deployed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/algorithms"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Algorithm Explorer</div>
              <div className="text-xs text-muted-foreground">
                Compare hybrid algorithm key sizes &amp; performance
              </div>
            </div>
          </Link>
          <Link
            to="/openssl"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Terminal size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">OpenSSL Studio</div>
              <div className="text-xs text-muted-foreground">
                Try hybrid key gen &amp; cert commands directly
              </div>
            </div>
          </Link>
          <Link
            to="/library"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Library size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Standards Library</div>
              <div className="text-xs text-muted-foreground">
                Read composite signature &amp; KEM RFC drafts
              </div>
            </div>
          </Link>
          <Link
            to="/learn/quantum-threats"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FlaskConical size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Quantum Threats</div>
              <div className="text-xs text-muted-foreground">
                Why hybrid? Understand the quantum threat first
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Generate hybrid keys, run KEM operations, and inspect composite certificates.
        </p>
      </div>
    </div>
  )
}
