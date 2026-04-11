// SPDX-License-Identifier: GPL-3.0-only
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
  KeyRound,
  PackageCheck,
  Globe,
  Radio,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'

interface HybridCryptoIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const HybridCryptoIntroduction: React.FC<HybridCryptoIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="text-xs font-bold text-primary mb-1">
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (NSA)
              </div>
              <p className="text-xs text-muted-foreground">
                NSA&apos;s Commercial National Security Algorithm Suite 2.0 mandates PQC adoption
                for national security systems by 2030 &mdash; with hybrid key exchange required
                during the transition window.
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
          <p className="text-[10px] text-muted-foreground/70 italic">
            <strong>RFC 9794</strong> standardizes terminology for hybrid schemes &mdash;
            distinguishing &ldquo;composite&rdquo; (single OID, both-must-verify) from
            &ldquo;non-composite&rdquo; (parallel independent algorithms) and establishing naming
            conventions such as &ldquo;PQ/T&rdquo; (Post-Quantum / Traditional).
          </p>
        </div>
      </section>

      {/* Section 2: Certificate Format Approaches */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Layers size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Certificate Format Approaches</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            There are six distinct X.509 certificate formats for PQC deployment, split into two
            groups by backward compatibility:
          </p>

          {/* Row 1: No backward compatibility */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              PQC-only &mdash; no legacy fallback
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pure PQC (ML-DSA) */}
              <div className="bg-muted/50 rounded-lg p-4 border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-success">Pure PQC (ML-DSA)</h3>
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
                  Standard single-algorithm X.509 using a lattice-based PQC signature. ML-DSA OIDs
                  are standardized in <strong>RFC 9881</strong>. Quantum-safe but requires all
                  verifiers to support ML-DSA.
                </p>
              </div>
              {/* Pure PQC (SLH-DSA) */}
              <div className="bg-muted/50 rounded-lg p-4 border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-success">Pure PQC (SLH-DSA)</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
                    Published
                  </span>
                </div>
                <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                  <div className="text-muted-foreground">{`Certificate {`}</div>
                  <div className="text-success pl-3">{`algorithm: id-slh-dsa-sha2-128s`}</div>
                  <div className="text-success pl-3">{`  OID: 2.16.840.1.101.3.4.3.20`}</div>
                  <div className="text-foreground pl-3">{`publicKey: SLH-DSA-128s-key`}</div>
                  <div className="text-foreground pl-3">{`signature: SLH-DSA-128s-sig (7856 B)`}</div>
                  <div className="text-muted-foreground">{`}`}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hash-based signature (SPHINCS+) with no lattice assumptions. OIDs in{' '}
                  <strong>RFC 9909</strong>. <InlineTooltip term="ANSSI">ANSSI</InlineTooltip>{' '}
                  allows standalone SLH-DSA without hybrid &mdash; security relies only on hash
                  function properties. Larger signatures (~7.9 KB) are the trade-off.
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
                  <div className="text-primary pl-3">{`  OID: 1.3.6.1.5.5.7.6.45`}</div>
                  <div className="text-foreground pl-3">{`publicKey: ML-DSA-65-key || ECDSA-key`}</div>
                  <div className="text-foreground pl-3">{`signature: ML-DSA-65-sig || ECDSA-sig`}</div>
                  <div className="text-muted-foreground">{`}`}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A single composite OID identifies the algorithm pair. Both signatures must verify.
                  Defined in <strong>draft-ietf-lamps-pq-composite-sigs</strong>. Strongest security
                  model &mdash; prevents downgrade attacks. Not backward-compatible with legacy
                  validators.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Backward compatible */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Hybrid with legacy fallback
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Alt-Sig / Catalyst */}
              <div className="bg-muted/50 rounded-lg p-4 border border-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-secondary">Alt-Sig / Catalyst</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
                    Draft
                  </span>
                </div>
                <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                  <div className="text-muted-foreground">{`Certificate {`}</div>
                  <div className="text-secondary pl-3">{`algorithm: ecdsa-with-SHA256`}</div>
                  <div className="text-foreground pl-3">{`extensions {`}</div>
                  <div className="text-foreground pl-6">{`AltPubKey (2.5.29.72): ML-DSA-65`}</div>
                  <div className="text-foreground pl-6">{`AltSigAlg (2.5.29.73): ML-DSA-65`}</div>
                  <div className="text-foreground pl-6">{`AltSigValue (2.5.29.74): ML-DSA-sig`}</div>
                  <div className="text-foreground pl-3">{`}`}</div>
                  <div className="text-muted-foreground">{`}`}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A single classical cert with PQC key and signature in X.509 extensions. Legacy
                  verifiers ignore the extensions; PQC-aware verifiers check both. Defined in{' '}
                  <strong>draft-ietf-lamps-cert-binding-for-multi-auth</strong>.
                </p>
              </div>
              {/* Related Certificates (RFC 9763) */}
              <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary">Related Certs (RFC 9763)</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
                    Published
                  </span>
                </div>
                <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                  <div className="text-warning">{`Cert A (Classical) {`}</div>
                  <div className="text-foreground pl-3">{`algorithm: ecdsa-with-SHA256`}</div>
                  <div className="text-primary pl-3">{`ext: sha256(CertB) → binding`}</div>
                  <div className="text-warning">{`}`}</div>
                  <div className="text-success">{`Cert B (PQC) {`}</div>
                  <div className="text-foreground pl-3">{`algorithm: ML-DSA-65`}</div>
                  <div className="text-primary pl-3">{`ext: sha256(CertA) → binding`}</div>
                  <div className="text-success">{`}`}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Two separate independent certificates bound by a hash in a{' '}
                  <code className="text-[10px]">RelatedCertificate</code> extension. Each
                  certificate is independently valid. Legacy systems validate the classical cert;
                  PQC-aware systems verify both and check the binding hash.
                </p>
              </div>
              {/* Chameleon Certificates */}
              <div className="bg-muted/50 rounded-lg p-4 border border-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-secondary">Chameleon</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
                    Draft
                  </span>
                </div>
                <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                  <div className="text-muted-foreground">{`Certificate (PQC primary) {`}</div>
                  <div className="text-success pl-3">{`algorithm: ML-DSA-65`}</div>
                  <div className="text-foreground pl-3">{`ext: DeltaCertDescriptor {`}</div>
                  <div className="text-warning pl-6">{`sig: ecdsa-with-SHA256`}</div>
                  <div className="text-warning pl-6">{`pubKey: EC P-256`}</div>
                  <div className="text-warning pl-6">{`sigValue: ECDSA sig`}</div>
                  <div className="text-foreground pl-3">{`}`}</div>
                  <div className="text-muted-foreground">{`}`}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  One certificate with a{' '}
                  <code className="text-[10px]">DeltaCertificateDescriptor</code> extension encoding
                  the differences needed to reconstruct a partner cert. More space-efficient than
                  Related Certs. Backed by DigiCert and Entrust ({' '}
                  <strong>draft-bonnell-lamps-chameleon-certs</strong>).
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Deployment guidance:</strong> Pure PQC (ML-DSA) is ready today (RFC 9881 OIDs in
            OpenSSL 3.x). Pure SLH-DSA is also ready (RFC 9909) and ANSSI-approved as standalone.
            Composite requires both parties to support the draft spec &mdash; ideal for closed PKI.
            Alt-Sig and Chameleon work with legacy verifiers via extensions. Related Certs (RFC
            9763) provides full backward compatibility with two independent certificates. Upcoming:
            FN-DSA (FIPS 206) will add compact lattice-based signatures; composite KEM (ML-KEM+ECDH)
            will enable hybrid key encapsulation in S/MIME.
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

      {/* Section 4: Hybrid KEMs in TLS 1.3 */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Hybrid KEMs in TLS 1.3</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            In TLS 1.3 (<InlineTooltip term="TLS">RFC 8446</InlineTooltip>), hybrid KEMs integrate
            into the handshake via the <code className="text-xs">key_share</code> extension. The
            client and server exchange hybrid key material just as they would for classical ECDH
            &mdash; but with larger payloads:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="font-mono text-[10px] space-y-1.5">
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold shrink-0 w-20">Client</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span>
                  <strong>ClientHello</strong>{' '}
                  <span className="text-muted-foreground">
                    supported_groups: [X25519MLKEM768, X25519]
                  </span>
                </span>
              </div>
              <div className="pl-24 text-muted-foreground">
                key_share: X25519MLKEM768 public key (1,216 bytes)
              </div>
              <div className="flex items-start gap-3 mt-1.5">
                <span className="text-success font-bold shrink-0 w-20">Server</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span>
                  <strong>ServerHello</strong>{' '}
                  <span className="text-muted-foreground">selected_group: X25519MLKEM768</span>
                </span>
              </div>
              <div className="pl-24 text-muted-foreground">
                key_share: ciphertext (1,120 bytes) = X25519 ct || ML-KEM ct
              </div>
              <div className="flex items-start gap-3 mt-1.5">
                <span className="text-foreground font-bold shrink-0 w-20">Both</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span>
                  <strong>HKDF</strong>(X25519_ss || ML-KEM_ss) &rarr; handshake keys
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Size Impact</div>
              <p className="text-xs text-muted-foreground">
                Classical X25519 ClientHello key_share is 32 bytes. X25519MLKEM768 is 1,216 bytes
                &mdash; a 38&times; increase. This can push the ClientHello beyond a single TCP
                packet (~1,460 bytes), requiring an extra round trip on some networks.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Performance</div>
              <p className="text-xs text-muted-foreground">
                ML-KEM-768 encap/decap adds ~0.1&ndash;0.3 ms per handshake. The dominant cost is
                the larger key_share payload, not computation. Real-world measurements (Chrome,
                Cloudflare) show &lt;1% latency increase at the P50.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/70 italic">
            For a full interactive TLS 1.3 handshake simulation with hybrid KEM negotiation, see the{' '}
            <Link to="/learn/tls-basics" className="text-primary hover:underline">
              TLS Basics
            </Link>{' '}
            module.
          </p>
        </div>
      </section>

      {/* Section 5: Composite Signatures */}
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
          <Link
            to="/learn/tls-basics"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Globe size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">TLS Basics</div>
              <div className="text-xs text-muted-foreground">
                Interactive TLS 1.3 handshake simulator with hybrid KEM negotiation
              </div>
            </div>
          </Link>
          <Link
            to="/learn/api-security-jwt"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <KeyRound size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">API Security &amp; JWT</div>
              <div className="text-xs text-muted-foreground">
                Hybrid JOSE tokens with ML-DSA signing &amp; ML-KEM encryption
              </div>
            </div>
          </Link>
          <Link
            to="/learn/code-signing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <PackageCheck size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Code Signing</div>
              <div className="text-xs text-muted-foreground">
                Hybrid &amp; composite signatures for software supply chain
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <KeyRound size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                Key lifecycle management for hybrid &amp; PQC key pairs
              </div>
            </div>
          </Link>
          <Link
            to="/learn/qkd"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Radio size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Quantum Key Distribution</div>
              <div className="text-xs text-muted-foreground">
                Physical-layer key exchange complementing hybrid PQC schemes
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Generate hybrid keys, run KEM operations, and inspect{' '}
          <InlineTooltip term="Composite Certificate">composite certificates</InlineTooltip>.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
