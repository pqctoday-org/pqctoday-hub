import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Layers,
  Lock,
  PenTool,
  ArrowRight,
  Cpu,
  Library,
  Terminal,
  FlaskConical,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

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
            are newer and less battle-tested than classical algorithms, yet the &ldquo;
            <InlineTooltip term="Harvest Now, Decrypt Later">
              Harvest Now, Decrypt Later
            </InlineTooltip>
            &rdquo; (HNDL) threat means waiting is dangerous.{' '}
            <strong>
              <InlineTooltip term="Hybrid Cryptography">Hybrid cryptography</InlineTooltip>
            </strong>{' '}
            solves this by combining classical and PQC algorithms together.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                <InlineTooltip term="ANSSI">ANSSI</InlineTooltip> Mandate
              </div>
              <p className="text-xs text-muted-foreground">
                France&apos;s ANSSI requires hybrid mode during transition &mdash; PQC-only is not
                acceptable until algorithms are more mature. Exception: hash-based signatures (
                <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip>/SPHINCS+, LMS, XMSS) may be
                used standalone.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                <InlineTooltip term="NIST">NIST</InlineTooltip> SP 800-227
              </div>
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

      {/* Section 2: Three Certificate Format Approaches */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Layers size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Three Certificate Format Approaches</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            There are three distinct X.509 certificate formats for PQC deployment — each with
            different standardization status and trade-offs:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pure PQC */}
            <div className="bg-muted/50 rounded-lg p-4 border border-success/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-success">Pure PQC</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
                  Published
                </span>
              </div>
              <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                <div className="text-muted-foreground">{`Certificate {`}</div>
                <div className="text-success pl-3">{`algorithm: id-ml-dsa-65`}</div>
                <div className="text-success pl-3">{`  OID: 2.16.840.1.101.3.4.3.18`}</div>
                <div className="text-foreground pl-3">{`publicKey: ML-DSA-65-key`}</div>
                <div className="text-foreground pl-3">{`signature: ML-DSA-65-sig`}</div>
                <div className="text-muted-foreground">{`}`}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Standard single-algorithm X.509 using a PQC signature. ML-DSA OIDs are standardized
                in <strong>RFC 9881</strong>; SLH-DSA/LMS OIDs in <strong>RFC 9802</strong>.
                Quantum-safe but requires all verifiers to support the PQC algorithm.
              </p>
            </div>
            {/* Composite */}
            <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-primary">Composite (Dual-Algorithm)</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
                  Draft
                </span>
              </div>
              <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                <div className="text-muted-foreground">{`Certificate {`}</div>
                <div className="text-primary pl-3">{`algorithm: id-MLDSA65-ECDSA-P256`}</div>
                <div className="text-primary pl-3">{`  OID: 2.16.840.1.114027.80.8.1.6`}</div>
                <div className="text-foreground pl-3">{`publicKey: ML-DSA-65-key || ECDSA-key`}</div>
                <div className="text-foreground pl-3">{`signature: ML-DSA-65-sig || ECDSA-sig`}</div>
                <div className="text-muted-foreground">{`}`}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                A single composite OID identifies the algorithm pair. Both signatures must verify.
                Defined in <strong>draft-ietf-lamps-pq-composite-sigs-14</strong>. Not yet in
                OpenSSL production builds — strongest security model.
              </p>
            </div>
            {/* Parallel/Concatenated */}
            <div className="bg-muted/50 rounded-lg p-4 border border-secondary/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-secondary">Parallel (Alt-Sig)</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-bold">
                  Informational
                </span>
              </div>
              <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                <div className="text-muted-foreground">{`Certificate {`}</div>
                <div className="text-secondary pl-3">{`algorithm: id-ml-dsa-65`}</div>
                <div className="text-foreground pl-3">{`extensions {`}</div>
                <div className="text-foreground pl-6">{`AltSigAlg (2.5.29.73): ECDSA-P256`}</div>
                <div className="text-foreground pl-6">{`AltSigValue (2.5.29.74): ECDSA-sig`}</div>
                <div className="text-foreground pl-3">{`}`}</div>
                <div className="text-muted-foreground">{`}`}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                PQC primary signature with classical key/sig in X.509 extension fields (OIDs
                2.5.29.73/74). Legacy verifiers validate the primary PQC sig and ignore extensions.
                Maximizes backward compatibility at the cost of complexity.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Deployment guidance:</strong> Pure PQC is ready today (RFC 9881 OIDs in OpenSSL
            3.x). Composite requires both parties to support the draft spec — ideal for closed PKI
            environments. Parallel works with legacy verifiers but adds X.509 extension complexity.
            ANSSI explicitly permits pure hash-based (
            <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip>, LMS) as standalone alternatives.
          </p>
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
            <InlineTooltip term="X25519MLKEM768">X25519MLKEM768</InlineTooltip> is the leading
            hybrid <InlineTooltip term="Key Encapsulation Mechanism">KEM</InlineTooltip>, combining
            Curve25519 ECDH with <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>-768. It&apos;s
            already deployed in Chrome, Cloudflare, and AWS.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3">How X25519MLKEM768 Works</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">1.</span>
                <span>
                  <strong>Key Generation:</strong> Generate both{' '}
                  <InlineTooltip term="X25519">X25519</InlineTooltip> key pair and ML-KEM-768 key
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
          <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
            <h4 className="text-xs font-bold text-foreground">Other Hybrid KEM Variants</h4>
            <p className="text-xs text-muted-foreground">
              <strong>SecP256r1MLKEM768</strong> &mdash; P-256 + ML-KEM-768. Important for
              organizations requiring FIPS-approved classical curves (X25519 is not FIPS-approved).
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>SecP384r1MLKEM1024</strong> &mdash; P-384 + ML-KEM-1024. Provides NIST Level 5
              security for high-assurance environments.
            </p>
            <p className="text-[10px] text-muted-foreground/70 italic">
              Note: The KDF step above is simplified. In TLS 1.3, the concatenated shared secrets
              feed into the protocol&apos;s <InlineTooltip term="HKDF">HKDF</InlineTooltip>-based
              key schedule. The X-Wing KEM draft uses a separate labeled extraction.
            </p>
          </div>
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
            Composite signatures combine <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> with{' '}
            <InlineTooltip term="ECDSA">ECDSA</InlineTooltip> or Ed25519 into a single signature
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
                <li>&bull; Composite draft not yet finalized &mdash; OIDs may change before RFC</li>
              </ul>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-success/20 mt-2">
            <p className="text-xs text-muted-foreground">
              <strong className="text-success">Note:</strong> If you only need quantum safety
              without a classical fallback, use a <strong>pure PQC certificate</strong> instead
              &mdash; ML-DSA OIDs are fully standardized in <strong>RFC 9881</strong> and work in
              OpenSSL today. Composite is specifically for environments that require the{' '}
              <em>both-must-verify</em> dual-algorithm property.
            </p>
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
          Generate hybrid keys, run KEM operations, and inspect{' '}
          <InlineTooltip term="Composite Certificate">composite certificates</InlineTooltip>.
        </p>
      </div>
    </div>
  )
}
