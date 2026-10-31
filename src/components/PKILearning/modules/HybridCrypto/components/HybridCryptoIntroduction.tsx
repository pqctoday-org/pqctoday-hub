// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import {
  Shield,
  Layers,
  Lock,
  ArrowRight,
  Cpu,
  Library,
  Terminal,
  FlaskConical,
  KeyRound,
  PackageCheck,
  Globe,
  Radio,
  Fingerprint,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  LockKeyhole,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { RecordDecisionLink } from '@/components/PKILearning/RecordDecisionLink'
import { Button } from '@/components/ui/button'

interface HybridCryptoIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const HybridCryptoIntroduction: React.FC<HybridCryptoIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: Why Hybrid? */}
      <section data-section-id="why-hybrid" className="glass-panel p-6 scroll-mt-20">
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
                <InlineTooltip term="ANSSI">ANSSI</InlineTooltip> Position
              </div>
              <p className="text-xs text-muted-foreground">
                France&apos;s ANSSI recommends hybrid mode during transition, and makes it mandatory
                inside the French regulated perimeter (classified and Diffusion Restreinte data,
                vital information systems, ANSSI-certified or qualified products). Exception:
                hash-based signatures (<InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip>
                /SPHINCS+, LMS, XMSS) may be used standalone.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                <InlineTooltip term="NIST">NIST</InlineTooltip> SP 800-227
              </div>
              <p className="text-xs text-muted-foreground">
                NIST SP 800-227 §4.6 notes that combining key-establishment schemes (a PQ/T hybrid)
                &ldquo;can be advantageous&rdquo; for some applications, for example{' '}
                <strong>during the migration</strong>, and approves key combiners for it. It does
                not set migration timing: &ldquo;This recommendation does not discuss how or when to
                migrate&rdquo; (§1.2).
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (NSA)
              </div>
              <p className="text-xs text-muted-foreground">
                NSA&apos;s Commercial National Security Algorithm Suite 2.0 mandates PQC adoption
                (ML-KEM-1024 + ML-DSA-87) for national security systems. FAQ version 2.2 requires
                compliant new acquisitions from 2027, phase-out of unsupported equipment and
                services by 2030, and CNSA 2.0 algorithms by 2031 unless otherwise noted. CNSA 2.0
                does not generally require hybrid constructions; ANSSI and BSI publish their own
                transition guidance.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Defense in Depth</div>
              <p className="text-xs text-muted-foreground">
                Key exchange: the shared secret stays secret as long as either component KEM is
                unbroken, provided the combiner is a sound one (for example the TLS hybrid design or
                X-Wing). Signatures: a forgery requires breaking both algorithms, provided the
                verifier requires both signatures to be valid.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            <strong>RFC 9794</strong> standardizes terminology for hybrid schemes &mdash;
            distinguishing &ldquo;composite&rdquo; (single OID, both-must-verify) from
            &ldquo;non-composite&rdquo; (parallel independent algorithms) and establishing naming
            conventions such as &ldquo;PQ/T&rdquo; (Post-Quantum / Traditional).
          </p>
        </div>
      </section>

      {/* Section 2: Certificate Format Approaches */}
      <section data-section-id="cert-formats" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Layers size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Certificate Format Approaches</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Seven X.509 certificate formats make up the workshop&apos;s main comparison: five carry
            signature keys and two carry KEM (encryption) keys. One rule underlies all of them: the{' '}
            <strong>subject public key</strong> and the <strong>certificate signature</strong> are
            independent. The subject key is what the certificate is about; the signature comes from
            the issuer&apos;s key.
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
                  <strong>RFC 9909</strong>. <InlineTooltip term="ANSSI">ANSSI</InlineTooltip> does
                  not recommend systematic hybridisation for hash-based signatures such as SLH-DSA,
                  XMSS and LMS, because it considers their underlying problem well studied (its 2022
                  position paper also notes their limited range of application). Larger signatures
                  (7,856 B, about 7.9 KB, for SLH-DSA-SHA2-128s per FIPS 205) are the trade-off.
                </p>
              </div>
              {/* Composite */}
              <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary">Composite (Dual-Algorithm)</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
                    RFC Editor queue
                  </span>
                </div>
                <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
                  <div className="text-muted-foreground">{`Certificate {`}</div>
                  <div className="text-primary pl-3">{`algorithm: id-MLDSA65-ECDSA-P256-SHA512`}</div>
                  <div className="text-primary pl-3">{`  OID: 1.3.6.1.5.5.7.6.45`}</div>
                  <div className="text-foreground pl-3">{`publicKey: ML-DSA-65-key || ECDSA-key`}</div>
                  <div className="text-foreground pl-3">{`signature: ML-DSA-65-sig || ECDSA-sig`}</div>
                  <div className="text-muted-foreground">{`}`}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A single composite OID identifies the algorithm pair. Both signatures must verify.
                  Defined in <strong>draft-ietf-lamps-pq-composite-sigs-19</strong>, approved and in
                  the RFC Editor queue (no RFC number yet). Strongest binding &mdash; the signatures
                  are tied to the composite algorithm: a split-off ML-DSA signature fails on its
                  own, but the traditional signature still verifies (draft §9.2.3). Not
                  backward-compatible with legacy validators.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Backward compatible */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Hybrid with legacy fallback
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alt-Sig / Catalyst */}
              <div className="bg-muted/50 rounded-lg p-4 border border-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-secondary">Alt-Sig / Catalyst</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
                    ITU-T X.509
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
                  verifiers ignore the extensions; PQC-aware verifiers can check the alternative
                  signature too, and their policy decides whether one or both must verify. Defined
                  in <strong>ITU-T X.509 (2019)</strong> &sect;7.2.2 and &sect;9.8.
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
                  <div className="text-warning">{`Existing Cert A (Classical) {`}</div>
                  <div className="text-foreground pl-3">{`algorithm: ecdsa-with-SHA256`}</div>
                  <div className="text-muted-foreground pl-3">{`(unchanged)`}</div>
                  <div className="text-warning">{`}`}</div>
                  <div className="text-success">{`New Cert B (PQC) {`}</div>
                  <div className="text-foreground pl-3">{`algorithm: ML-DSA-65`}</div>
                  <div className="text-primary pl-3">{`ext: RelatedCertificate =`}</div>
                  <div className="text-primary pl-6">{`hash(final DER of Cert A)`}</div>
                  <div className="text-success">{`}`}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A <em>new</em> certificate carries a{' '}
                  <code className="text-[10px]">RelatedCertificate</code> extension holding the hash
                  of an <em>existing</em> one. The link is one-way: Cert A is never modified. The CA
                  issues Cert B only after the requester proves it holds Cert A&apos;s key. Legacy
                  systems use the classical cert; a protocol may ask for either certificate or both
                  &mdash; RFC 9763 does not require both.
                </p>
              </div>
            </div>
          </div>

          {/* Row 3: KEM certificates */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              KEM certificates &mdash; the subject key encrypts, the issuer signs
            </h3>
            <div className="font-mono text-[10px] bg-background p-3 rounded mb-3 border border-border">
              <div className="text-success">{`ML-KEM subject key  ── performs encapsulation / decapsulation`}</div>
              <div className="text-primary">{`ML-DSA issuer key   ── signs the X.509 certificate`}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pure ML-KEM */}
              <div className="bg-muted/50 rounded-lg p-4 border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-success">Pure PQC KEM (ML-KEM)</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
                    Published
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>RFC 9935</strong> defines ML-KEM public keys in X.509. An ML-KEM key
                  cannot sign, so its certificate is always issued by a separate signing-capable CA
                  (ML-DSA, ECDSA, RSA, &hellip;). If keyUsage is present, keyEncipherment must be
                  the only bit. Because the CA cannot check a self-signature from a KEM key, proof
                  of possession uses a KEM-based exchange instead. The key is then used, for
                  example, in CMS KEMRecipientInfo (<strong>RFC 9629</strong>, ML-KEM in{' '}
                  <strong>RFC 9936</strong>).
                </p>
              </div>
              {/* Composite ML-KEM */}
              <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-primary">Composite KEM</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
                    RFC Editor queue
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>draft-ietf-lamps-pq-composite-kem-23</strong> puts an ML-KEM key and a
                  classical KEM key (X25519, ECDH, RSA) under one OID, ML-KEM component first.
                  Encapsulation runs both and combines the shared secrets. Approved by the IESG and
                  awaiting publication as an RFC; not backward compatible.
                </p>
              </div>
            </div>
          </div>

          {/* Advanced examples */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Advanced examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground">Certificate Discovery</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
                    Active draft
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>draft-ietf-lamps-certdiscovery-03</strong> lets a certificate tell
                  PQC-capable relying parties where to fetch a related certificate, through a{' '}
                  <code className="text-[10px]">subjectInfoAccess</code> entry. A fetched
                  certificate must still pass full path validation. The OIDs are not assigned yet,
                  so the workshop&apos;s encoding is illustrative.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-foreground">Unsigned certificate</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
                    Published
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>RFC 9925</strong> defines{' '}
                  <code className="text-[10px]">id-alg-unsigned</code> for a certificate with no
                  signature at all — a container for a key that is trusted by other means, such as a
                  trust anchor. It is never valid in a certification path.
                </p>
              </div>
            </div>
          </div>

          {/* Historical designs */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Historical design
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-muted-foreground">Chameleon</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/10 text-muted-foreground border border-border font-bold">
                  Expired draft
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                One certificate with a{' '}
                <code className="text-[10px]">DeltaCertificateDescriptor</code> extension encoding
                the differences needed to rebuild a paired certificate. The proposal,{' '}
                <strong>draft-bonnell-lamps-chameleon-certs-07</strong>, is an expired individual
                draft that the LAMPS working group never adopted. It is shown for study only and is
                not recommended for new deployments.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Deployment guidance:</strong> Pure PQC (ML-DSA) is ready today (RFC 9881; the
            workshop is tested with OpenSSL 3.6.3). Pure SLH-DSA is also ready (RFC 9909) and
            ANSSI-approved as standalone. Composite requires both parties to support the draft spec
            &mdash; best suited to closed PKI. Alt-Sig works with legacy verifiers via extensions.
            Related Certs (RFC 9763) keeps the classical certificate fully usable on its own.
            Watchlist: FN-DSA (planned FIPS 206, not yet final) has an IETF certificate draft whose
            OIDs are still TBD; composite KEM will enable hybrid key encapsulation in S/MIME once
            published.
          </p>
        </div>
      </section>

      {/* Section 3: Hybrid KEMs */}
      <section data-section-id="kem" className="glass-panel p-6 scroll-mt-20">
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
            Curve25519 ECDH with <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>-768. Chrome
            enabled it by default in version 131 (November 2024,{' '}
            <a
              href="https://security.googleblog.com/2024/09/a-new-path-for-kyber-on-web.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google
            </a>
            ); by October 2025 it protected most human traffic to Cloudflare (
            <a
              href="https://blog.cloudflare.com/pq-2025/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Cloudflare
            </a>
            ); and AWS KMS, ACM and Secrets Manager endpoints support it (non-FIPS endpoints, April
            2025,{' '}
            <a
              href="https://aws.amazon.com/blogs/security/ml-kem-post-quantum-tls-now-supported-in-aws-kms-acm-and-secrets-manager/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              AWS
            </a>
            ).
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
                  <strong>Key Derivation:</strong> Combined shared secret = KDF(both shared secrets,
                  concatenated in the order the group defines) &rarr; session key
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Even if ML-KEM-768 is broken in the future, X25519 still provides classical security.
            Even if X25519 is broken by a quantum computer, ML-KEM-768 provides quantum resistance.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
            <h4 className="text-xs font-bold text-foreground">
              Choosing a KEM Parameter Set (NIST SP 800-227)
            </h4>
            <p className="text-xs text-muted-foreground">
              FIPS 203 (§8) approves three ML-KEM parameter sets, each mapped to a NIST security
              category matching the strength of a given AES key size. Pick the set by threat model,
              not by default.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-bold text-foreground py-1.5 pr-3">ML-KEM</th>
                    <th className="text-left font-bold text-foreground py-1.5 pr-3">NIST Cat</th>
                    <th className="text-left font-bold text-foreground py-1.5 pr-3">
                      Classical equiv.
                    </th>
                    <th className="text-left font-bold text-foreground py-1.5">
                      Typical deployment
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-mono">ML-KEM-512</td>
                    <td className="py-1.5 pr-3">Category 1</td>
                    <td className="py-1.5 pr-3">AES-128</td>
                    <td className="py-1.5">Constrained/IoT, short-lived sessions</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-mono">ML-KEM-768</td>
                    <td className="py-1.5 pr-3">Category 3</td>
                    <td className="py-1.5 pr-3">AES-192</td>
                    <td className="py-1.5">
                      <strong>Default for TLS 1.3 &amp; most internet traffic</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-3 font-mono">ML-KEM-1024</td>
                    <td className="py-1.5 pr-3">Category 5</td>
                    <td className="py-1.5 pr-3">AES-256</td>
                    <td className="py-1.5">CNSA 2.0, high-assurance/federal systems</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              This module&apos;s rule of thumb, not from a standard: HNDL risk + data-retention
              window should drive the choice. If harvested ciphertext must remain secret past ~2035,
              prefer Cat 3 or Cat 5 over Cat 1.
            </p>
          </div>

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
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
            <h4 className="text-xs font-bold text-foreground">
              Combiner Construction (SP 800-227 + SP 800-56C)
            </h4>
            <p className="text-xs text-muted-foreground">
              The high-level &ldquo;KDF(both shared secrets)&rdquo; above hides three real
              requirements that SP 800-227 defers to <strong>SP 800-56C-Rev2</strong>:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
              <li>
                <strong>Concatenation order is fixed per group.</strong> In TLS 1.3 (RFC 10024
                §4.3), X25519MLKEM768 concatenates <code>ML-KEM_ss || X25519_ss</code>, while
                SecP256r1MLKEM768 and SecP384r1MLKEM1024 concatenate{' '}
                <code>ECDHE_ss || ML-KEM_ss</code>; the result enters the TLS key schedule as its
                shared-secret input. SP 800-56C-Rev2 approves this when the first secret comes from
                a FIPS-approved scheme, so X25519MLKEM768 puts ML-KEM first (X25519 is not
                approved), while the NIST-curve groups put ECDHE first because certified P-256 and
                P-384 implementations are more widely available (RFC 10024 §5). SP 800-227 §4.6.2
                (September 2025) relaxes the ordering rule: its key combiner is approved when at
                least one shared secret, in any position, comes from an approved scheme. Swapping
                order silently breaks interop. Order does not add security, but binding to a known
                order prevents cross-protocol confusion.
              </li>
              <li>
                <strong>HKDF vs KMAC.</strong> SP 800-56C permits either an HMAC-based extractor
                (HKDF-SHA-256/384/512) or KMAC128/256. TLS 1.3 uses HKDF through its key schedule;
                KMAC is available for KEM-only protocols that want a single primitive.
              </li>
              <li>
                <strong>Dual-PRF assumption.</strong> The combined secret stays safe as long as{' '}
                <em>either</em> input looks uniform to the attacker &mdash; so a future break of
                ML-KEM or of X25519 alone does not break the session key. This is why the classical
                half is kept during the transition.
              </li>
              <li>
                <strong>Domain separation is strongly recommended.</strong> SP 800-227 §4.6.3 says a
                domain separator should be used to uniquely identify the composite scheme in use
                (for example the component schemes, order of composition, choice of parameter set,
                key combiner, KDF).
              </li>
            </ul>
            <p className="text-[10px] text-muted-foreground italic">
              The X-Wing KEM draft bakes this combiner in directly (single labeled extraction); TLS
              1.3 relies on its own <InlineTooltip term="HKDF">HKDF</InlineTooltip> key schedule for
              the same effect.
            </p>
          </div>

          <div
            data-testid="ig-ds-callout"
            className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-3"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <h4 className="text-sm font-bold text-foreground">
                Hybrid in a validated module (IG D.S)
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Everything above is about how a hybrid KEM works. Whether a FIPS 140-3 validated
              module may offer it as an <em>approved service</em> is a separate question, answered
              by CMVP Implementation Guidance (IG) D.S, Key Encapsulation Mechanisms (last modified
              9 April 2026). The IG calls an approved ML-KEM combined with one or more non-ML-KEM
              schemes &ldquo;Scenario 2&rdquo;. The non-ML-KEM part may be approved or non-approved
              (the IG&apos;s examples are X25519 and X448).
            </p>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">
                The five conditions: a module must implement, at a minimum, all of them
              </p>
              <ol className="text-xs text-muted-foreground list-decimal pl-5 space-y-1">
                <li>An approved ML-KEM.</li>
                <li>One or more non-ML-KEM schemes, approved or non-approved.</li>
                <li>
                  An approved key combiner: the shared secrets concatenated and fed into an SP
                  800-56C key-derivation function (HKDF counts), or combined by an SP 800-133 §6.3
                  method (concatenation, XOR, or key extraction using HMAC). The IG describes the SP
                  800-133 §6.3 route only for combining ML-KEM shared secrets with those of approved
                  key-agreement schemes (IG D.F Scenario 1 or 2).
                </li>
                <li>
                  The module does not offer arbitrary hybrid combinations. It enforces a pre-defined
                  set of hybrid schemes, for example SecP256r1MLKEM768, X25519MLKEM768 and
                  SecP384r1MLKEM1024.
                </li>
                <li>
                  For each of those sets, the module controls at least how the shared secrets are
                  sequenced, for example the concatenation order.
                </li>
              </ol>
              <p className="text-xs text-muted-foreground">
                If any one is missing, Scenario 2 cannot be claimed, and any non-approved scheme the
                module offers must be restricted to the non-approved mode only. The IG&apos;s own
                examples: a software library with an approved ML-KEM and X25519 but no approved key
                combiner, or a library with the first three items that does not enforce a specific
                set of combinations or control the sequencing.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">The non-approved half.</strong> A non-approved
              component such as X25519 is classified as a &ldquo;non-approved but allowed algorithm
              with no security claimed&rdquo; (IG 2.4.A): it is listed in the Security Policy, not
              on the certificate. It may be used only inside the approved hybrid, and the module
              itself must enforce that. It cannot be used for other purposes in the approved mode or
              offered as an independent approved service, such as a separate API call in a software
              library, and operator guidance in the Security Policy cannot stand in for that
              enforcement. The hybrid&apos;s claimed security strength comes from the ML-KEM, and
              the hybrid service is then treated as an approved security service.
            </p>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Which real hybrids qualify.</strong> The IG says
              the TLS 1.3 hybrid key exchange (the IG cites an early version of the IETF draft that
              was later published as RFC 10024) may meet Scenario 2 with the SP 800-56C HKDF as the
              approved combiner, if one of SecP256r1MLKEM768, X25519MLKEM768 or SecP384r1MLKEM1024
              is used, and notes that these specifications may still be in draft form. It also says
              the X-Wing hybrid KEM &ldquo;cannot yet meet the requirements of Scenario 2&rdquo;
              even though it uses an SP 800-56C one-step KDF as its combiner: at a minimum, SP
              800-133 needs an update to approve X-Wing&apos;s seed generation, because seed
              expansion using SHAKE to generate the key pairs is not currently in SP 800-133.
              Separately, the CAVP prerequisites page (updated 22 September 2026) lists X-Wing
              keyGen and encapDecap tests. Both statements are published; CAVP itself says that
              acquiring a validation for each implemented algorithm does not by itself meet the FIPS
              140 module requirements.
            </p>
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-foreground hover:text-primary">
                What the Security Policy shows, and what the lab tests
              </summary>
              <div className="mt-2 space-y-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">What the Security Policy shows.</strong> The
                  module records the claim in the Security Function Implementation table as
                  &ldquo;KEM-Hybrid&rdquo; or &ldquo;KEM-Hybrid-Full&rdquo;, with entry names such
                  as &ldquo;KEM-Hybrid X25519MLKEM768&rdquo;. The non-approved half is listed
                  separately with the caveat &ldquo;no security claimed&rdquo;, citing IG D.S
                  Scenario 2 and IG 2.4.A. Per the CMVP&apos;s supplemental guidance (last updated 8
                  April 2026), &ldquo;KEM-Hybrid&rdquo; applies to a module that meets items 1 to 5
                  but not the extra conditions for &ldquo;KEM-Hybrid-Full&rdquo;, and it can still
                  be an approved service, even for a software library offering the hybrid KEM to a
                  calling application.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Self-tests.</strong> Every approved scheme in
                  the hybrid must be self-tested individually under IG 10.3.A. For the ML-KEM part
                  that means known-answer self-tests for each ML-KEM function the module implements
                  (encapsulation, decapsulation and key generation), with the decapsulation tests
                  covering both the implicit-rejection and the non-rejection path, on at least one
                  of ML-KEM-512, ML-KEM-768 or ML-KEM-1024 as implemented in approved mode. The IG
                  currently has no separate self-test for the approved key combiner or for the
                  non-approved half, beyond self-testing any approved algorithms used within, such
                  as KDFs.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Algorithm testing (CAVP).</strong> The IG lets
                  the approved pieces be tested separately (the ML-KEM and, with a non-approved
                  other half, the approved algorithms beneath it, such as KDFs). Its other option is
                  end-to-end tests of the full hybrid scheme, &ldquo;if available within
                  CAVP&rdquo;; it says it will be updated with the specific tests after they become
                  available. No hybrid-KEM specification appears in the ACVP specification index
                  (pages.nist.gov/ACVP) as of 23 October 2026.
                </p>
              </div>
            </details>
            <p className="text-[10px] text-muted-foreground italic">
              Not to be confused with IG 1.B, &ldquo;Hybrid Modules&rdquo; (new 19 August 2026):
              that is about a module whose boundary combines a software or firmware component with a
              disjoint hardware component. It has nothing to do with hybrid key exchange.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <Link to="/learn/fips-140-3-certification" className="text-primary hover:underline">
                FIPS 140-3 Certification module
              </Link>
              <Link
                to="/library?ref=NIST-FIPS140-3-IG-PQC"
                className="text-primary hover:underline"
              >
                FIPS 140-3 Implementation Guidance (Library)
              </Link>
            </div>
          </div>

          <p data-testid="ig-signatures-note" className="text-xs text-muted-foreground">
            IG D.S covers key encapsulation only. The IG (last updated 19 August 2026) has no
            section on composite or hybrid signatures. It does name one hybrid key-establishment
            scheme that uses ML-KEM (IG D.S, &ldquo;Hybrid scheme that uses an approved
            ML-KEM&rdquo;); a hybrid module (IG 1.B) is a different thing, about how a module is
            built, not about combining algorithms. What the IG does say applies to each algorithm on
            its own: a module that implements ML-DSA signing or verification needs the self-tests of
            IG 10.3.A. Whether a composite signature can be offered as an approved service is not
            answered in the published guidance; ask the lab.
          </p>
        </div>
      </section>

      {/* Section: HPKE */}
      <section data-section-id="hpke" className="glass-panel p-6 scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <LockKeyhole size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            HPKE —{' '}
            <InlineTooltip term="Hybrid Public Key Encryption">
              Hybrid Public Key Encryption
            </InlineTooltip>{' '}
            (
            <Link to="/library?ref=RFC%209180" className="text-primary underline">
              RFC 9180
            </Link>
            )
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2">Definition</h3>
            <p>
              HPKE is a public-key encryption scheme built from three swappable components — a{' '}
              <InlineTooltip term="Key Encapsulation Mechanism">KEM</InlineTooltip>, a KDF, and an
              AEAD — combined through a standard KeySchedule so any KEM/KDF/AEAD triple, plus one of
              four modes (Base, PSK, Auth, AuthPSK), yields an interoperable construction.
              &quot;Hybrid&quot; in HPKE&apos;s own name refers to this KEM+KDF+AEAD composition,
              not to a PQC+classical pairing — that is a separate, additional meaning layered on top
              by draft-ietf-hpke-pq (below), and easy to conflate with the certificate-level hybrid
              formats covered earlier on this page.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2">Use cases</h3>
            <p className="mb-2">
              A KEM&rsquo;s Encaps takes the recipient&rsquo;s public key (plus a parameter set) and
              returns both a shared secret and the ciphertext; the sender does not hand it a key of
              its own choosing, whereas in key transport (for example RSA-OAEP) one party selects
              the key and transmits it. HPKE&rsquo;s Encap is a randomized algorithm that generates
              an ephemeral shared secret and its encapsulation. Needing only the recipient&rsquo;s
              public key is why it shows up wherever a protocol needs one-shot public-key encryption
              rather than an interactive handshake:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
              <li>
                <strong>MLS</strong> uses HPKE for TreeKEM path updates (see the{' '}
                <Link to="/learn/mls-group-messaging" className="text-primary underline">
                  MLS Group Messaging
                </Link>{' '}
                module).
              </li>
              <li>
                <strong>TLS 1.3 Encrypted Client Hello (ECH)</strong> uses it to encrypt the
                ClientHello.
              </li>
              <li>
                <strong>
                  <Link
                    to="/library?ref=draft-ietf-jose-hpke-encrypt"
                    className="text-primary underline"
                  >
                    JOSE
                  </Link>
                </strong>{' '}
                and{' '}
                <strong>
                  <Link to="/library?ref=draft-ietf-cose-hpke" className="text-primary underline">
                    COSE
                  </Link>
                </strong>{' '}
                extend it to wrap a JWT or CWT payload the same way.
              </li>
            </ul>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground mb-1">Variants</h3>
            <p className="text-xs text-muted-foreground">
              RFC 9180 itself registers only classical KEMs. The PQC angle comes from{' '}
              <Link to="/library?ref=draft-ietf-hpke-pq" className="text-primary underline">
                draft-ietf-hpke-pq
              </Link>{' '}
              — still an Internet-Draft, not yet an RFC — which registers pure ML-KEM and PQ/T
              hybrid KEM IDs that plug into the same KeySchedule and Seal/Open.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-bold text-foreground py-1.5 pr-3">Dimension</th>
                    <th className="text-left font-bold text-foreground py-1.5 pr-3">
                      RFC 9180 (ratified)
                    </th>
                    <th className="text-left font-bold text-foreground py-1.5">
                      draft-ietf-hpke-pq (draft)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-semibold text-foreground">KEM</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px]">
                      DHKEM(P-256/P-384/P-521/X25519/X448)
                    </td>
                    <td className="py-1.5 font-mono text-[11px]">
                      ML-KEM-512/768/1024; MLKEM768-X25519, MLKEM768-P256, MLKEM1024-P384
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-semibold text-foreground">KDF</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px]">HKDF-SHA256/384/512</td>
                    <td className="py-1.5 font-mono text-[11px]">
                      + SHAKE128/256, TurboSHAKE128/256
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-3 font-semibold text-foreground">AEAD</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px]">
                      AES-128/256-GCM, ChaCha20-Poly1305, Export-only
                    </td>
                    <td className="py-1.5 font-mono text-[11px]">unchanged</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Independently of the KEM/KDF/AEAD choice, RFC 9180 defines four <strong>modes</strong>
              : Base (unauthenticated), PSK (pre-shared key), Auth (sender authenticated via its own
              KEM keypair), and AuthPSK (both).{' '}
              <strong>Auth and AuthPSK stay classical-only</strong>: draft-ietf-hpke-pq&apos;s
              ML-KEM and PQ/T hybrid KEM entries mark the Auth column &quot;no&quot;, since ML-KEM
              has no AuthEncap/AuthDecap interface.
            </p>
            <p className="text-[10px] text-muted-foreground italic">
              The MLKEM768-X25519/P256 and MLKEM1024-P384 hybrid KEMs are not defined by
              draft-ietf-hpke-pq itself — it delegates to the CFRG&apos;s generic hybrid-KEM
              combiner (
              <a
                href="https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hybrid-kems-12"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                draft-irtf-cfrg-hybrid-kems
              </a>
              ), instantiated concretely in{' '}
              <a
                href="https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-concrete-hybrid-kems-03"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                draft-irtf-cfrg-concrete-hybrid-kems
              </a>
              : PQ-component-first concatenation, SHA3-256 as the combiner over concat(ss_PQ, ss_T,
              ct_T, ek_T, Label).
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">PKCS#11 v3.2 has no CKM_HPKE mechanism</strong> —
              checked against the canonical v3.2 header, no HPKE entry exists at all. A real HSM
              deployment composes it from mechanisms the spec does define:{' '}
              <InlineTooltip term="CKM_ECDH1_DERIVE">CKM_ECDH1_DERIVE</InlineTooltip> /{' '}
              <InlineTooltip term="CKM_ML_KEM">CKM_ML_KEM</InlineTooltip> for the KEM leg,{' '}
              <InlineTooltip term="HKDF">CKM_HKDF_DERIVE</InlineTooltip> plus HMAC signing for
              LabeledExtract/LabeledExpand, and AES-GCM / ChaCha20-Poly1305 for Seal/Open.{' '}
              <Button
                variant="link"
                onClick={onNavigateToWorkshop}
                className="h-auto p-0 text-primary underline font-medium text-xs align-baseline"
              >
                Try it in the Step 7 workshop
              </Button>{' '}
              — every KEM/KDF/AEAD/mode combination above is selectable, and the classical DHKEM
              path is cross-checked byte-for-byte against RFC 9180 Appendix A.
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
            In TLS 1.3 (<InlineTooltip term="TLS">RFC 9846</InlineTooltip>), hybrid KEMs integrate
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
                key_share: ML-KEM-768 encapsulation key || X25519 public key (1,184 + 32 = 1,216
                bytes)
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
                key_share: ML-KEM-768 ciphertext || X25519 public key (1,088 + 32 = 1,120 bytes)
              </div>
              <div className="flex items-start gap-3 mt-1.5">
                <span className="text-foreground font-bold shrink-0 w-20">Both</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span>
                  <strong>HKDF</strong>(ML-KEM_ss || X25519_ss) &rarr; handshake keys (RFC 10024
                  §4.3)
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Size Impact</div>
              <p className="text-xs text-muted-foreground">
                Classical X25519 ClientHello key_share is 32 bytes. X25519MLKEM768 is 1,216 bytes
                (1,184 for ML-KEM plus 32 for X25519) &mdash; a 38&times; increase in the key share.
                Cloudflare notes that the ClientHello used to almost always fit within a single
                network packet; with a 1,216-byte key share it may now span more than one. RFC 6928
                (Experimental) proposes an upper bound of 10 segments for TCP&rsquo;s initial window
                (min (10*MSS, max (2*MSS, 14600))) in the first round-trip time, and a sender MAY
                start smaller.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Performance</div>
              <p className="text-xs text-muted-foreground">
                The dominant cost is the larger key_share payload, not computation. Chrome reported
                about a 4% slowdown in TLS handshake time, larger on slow connections (as cited by
                Cloudflare, October 2025). AWS measured a 0.05% throughput drop for KMS calls that
                reuse connections, and 2.3% when every request opens a new handshake (April 2025).
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            For a full interactive TLS 1.3 handshake simulation with hybrid KEM negotiation, see the{' '}
            <Link to="/learn/tls-basics" className="text-primary hover:underline">
              TLS Basics
            </Link>{' '}
            module.
          </p>
        </div>
      </section>

      {/* Section 5: Implementation Requirements (SP 800-227) */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            Implementation Requirements (SP 800-227)
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A compliant ML-KEM deployment is more than &ldquo;call the library.&rdquo; SP 800-227
            §3.2 covers the required input checks, and FIPS 203 specifies implicit rejection: if the
            re-encrypted ciphertext does not match the one received, decapsulation returns a key
            derived from the ciphertext and a secret value stored in the decapsulation key
            (Algorithm 18) instead of reporting an error. SP 800-227 §3.3 says KEM modules should be
            designed with appropriate countermeasures against side-channel attacks, including
            constant-time implementations and protecting memory from leakage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border md:col-span-2">
              <div className="text-xs font-bold text-foreground mb-1">
                ML-KEM Decapsulation and Implicit Rejection
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  ML-KEM is the key-encapsulation algorithm defined in FIPS 203. Alice uses
                  Bob&apos;s public encapsulation key to produce a shared secret and a ciphertext.
                  Bob uses his private decapsulation key and that ciphertext to recover the same
                  secret. A protocol can then derive encryption and authentication keys from it.
                </p>
                <p>
                  <strong className="text-foreground">Input checks can fail.</strong> For example,
                  an ML-KEM-768 ciphertext must be 1,088 bytes long. A 1,087-byte ciphertext fails
                  the length check, and decapsulation must not run. FIPS 203 also requires checks on
                  the decapsulation key. Normal library argument and operational errors still apply.
                </p>
                <p>
                  <strong className="text-foreground">An internal mismatch is different.</strong>{' '}
                  For inputs that pass those checks, ML-KEM decrypts and re-encrypts internally,
                  then compares the reconstructed ciphertext with the received one. If they differ,
                  it selects a fallback shared secret derived from the secret rejection value{' '}
                  <code>z</code> and the received ciphertext. The implementation returns that secret
                  without exposing the mismatch as an error or through timing. This is implicit
                  rejection.
                </p>
                <p>
                  <strong className="text-foreground">What happens to the encrypted data?</strong>{' '}
                  Suppose an attacker changes Alice&apos;s ciphertext without changing its length
                  and triggers implicit rejection. Bob obtains a different secret. If the protocol
                  derives an AES-GCM key from it, authentication of Alice&apos;s encrypted message
                  fails, and the receiver rejects the message without releasing unauthenticated
                  plaintext. Successful decapsulation alone does not confirm that both parties share
                  a key; the protocol needs authentication or key confirmation.
                </p>
                <p>
                  <strong className="text-foreground">
                    Why hide the mismatch if authentication fails later?
                  </strong>{' '}
                  A specific decapsulation error would answer an attacker&apos;s repeated queries
                  about the internal ciphertext check, creating a validity oracle. Implicit
                  rejection conceals that answer. A later authentication failure only says that the
                  message did not authenticate with the resulting key; a wrong tag can cause the
                  same failure even after valid decapsulation. The protocol must preserve this
                  distinction in its error handling and timing.
                </p>
                <p>
                  <a
                    href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    FIPS 203 §§6.3 and 7.3: internal decapsulation and input checks
                  </a>
                  {' · '}
                  <a
                    href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-227.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    SP 800-227: secure KEM use and key confirmation
                  </a>
                </p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">
                Constant-Time Decapsulation
              </div>
              <p className="text-xs text-muted-foreground">
                Correct results alone do not show that an implementation protects its secrets.
                Attackers may learn information by measuring execution time or observing memory
                access. Constant-time techniques help prevent these behaviours from revealing secret
                values; they do not mean every call takes exactly the same number of milliseconds.
                NIST recommends appropriate protections against these attacks. Their effectiveness
                depends on the implementation and the device running it.
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Sources: SP 800-227 §3.3; RFC 7748 §5.1 for the X25519 component.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Randomness Requirements</div>
              <p className="text-xs text-muted-foreground">
                ML-KEM encapsulation requires fresh, unpredictable random input (the 32-byte{' '}
                <code className="text-[11px]">m</code>). If an attacker knows that input, they can
                reproduce the encapsulation using the recipient&rsquo;s public key and recover the
                same shared secret. FIPS 203 specifies the randomness requirements (§3.3), including
                use of an approved <InlineTooltip term="DRBG">DRBG</InlineTooltip>.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">
                Side-Channel &amp; Fault Resistance
              </div>
              <p className="text-xs text-muted-foreground">
                Consider X25519 and ML-KEM combined to derive a session key. If a leak exposes only
                the X25519 shared secret, a suitable combiner can still protect the session key
                through the uncompromised ML-KEM secret. If the leak exposes both secrets or the
                final session key, that protection is lost. Assess what information the
                implementation leaks, including during combination and key handling.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                For an HSM, TPM or other hardware device, check the manufacturer&rsquo;s
                documentation to understand which protections are provided, which settings affect
                them, and which attacks they address. Do not assume every device has a switch to
                enable PQC protections.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            In short: hybrid gets you algorithmic safety (dual-PRF), but SP 800-227 §§3–4 are what
            get you <em>deployment</em> safety. Both are required.
          </p>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/algorithms?tab=detailed&q=hybrid"
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
            to="/library?q=composite"
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

      {/* ── Hybrid Signature Spectrum ──────────────────────────────────────────── */}
      <section data-section-id="composite" className="space-y-6 scroll-mt-20">
        <div className="flex items-center gap-3">
          <Fingerprint className="text-primary shrink-0" size={22} />
          <div>
            <h2 className="text-xl font-bold text-foreground">Hybrid Signature Spectrum</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Signing with both a classical and a PQC algorithm at the same time. The key design
              question: can either component be stripped and verified alone?
            </p>
          </div>
        </div>

        {/* IETF draft reference */}
        <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
          <ExternalLink size={15} className="text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">
              RFC 9955: Hybrid Signature Spectrums
            </span>{' '}
            <span className="text-muted-foreground">(Informational, July 2026)</span>
            <p className="text-muted-foreground mt-1">
              Defines the taxonomy of hybrid signature constructions and a non-separability
              spectrum. Basis for evaluating all hybrid signature proposals including Silithium.
            </p>
            <a
              href="https://www.rfc-editor.org/rfc/rfc9955"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs mt-1 inline-block"
            >
              datatracker.ietf.org ↗
            </a>
          </div>
        </div>

        {/* Construction taxonomy table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Construction
                </th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  How it works
                </th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Non-separability
                </th>
                <th className="text-left py-2 text-muted-foreground font-medium">
                  Backwards compat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 pr-4 font-semibold text-foreground">Concatenation</td>
                <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">sig₁ ‖ sig₂</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1 text-xs text-status-warning">
                    <ShieldAlert size={13} /> None / WNS
                  </span>
                </td>
                <td className="py-3 text-xs text-status-success">Yes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-foreground">Nesting</td>
                <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                  sign_ML(msg ‖ sig_EC)
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1 text-xs text-status-warning">
                    <ShieldAlert size={13} /> WNS
                  </span>
                </td>
                <td className="py-3 text-xs text-status-success">Yes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-foreground">Fused (Silithium)</td>
                <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                  shared μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg)
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1 text-xs text-status-success">
                    <ShieldCheck size={13} /> SNS (targeted)
                  </span>
                </td>
                <td className="py-3 text-xs text-status-error">No</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Non-separability spectrum */}
        <div className="glass-panel p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Non-Separability Spectrum</h3>
          <div className="flex items-center gap-0 text-xs">
            <div className="flex-1 text-center py-2 bg-status-error/10 border border-status-error/20 rounded-l-lg">
              <div className="font-semibold text-status-error">None</div>
              <div className="text-muted-foreground">Either sig strips cleanly</div>
            </div>
            <div className="flex-1 text-center py-2 bg-status-warning/10 border-y border-status-warning/20">
              <div className="font-semibold text-status-warning">WNS</div>
              <div className="text-muted-foreground">Swapping invalidates outer</div>
            </div>
            <div className="flex-1 text-center py-2 bg-status-success/10 border border-status-success/20">
              <div className="font-semibold text-status-success">SNS</div>
              <div className="text-muted-foreground">Neither verifies alone</div>
            </div>
            <div className="flex-1 text-center py-2 bg-primary/10 border border-primary/20 rounded-r-lg">
              <div className="font-semibold text-primary">SNS + Sim</div>
              <div className="text-muted-foreground">Both must verify simultaneously</div>
            </div>
          </div>
        </div>

        {/* Silithium */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Fingerprint className="text-primary shrink-0 mt-0.5" size={18} />
            <div>
              <h3 className="font-semibold text-foreground">
                Silithium — Compact Fused Hybrid Signature
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Devevey, Guerreau, Roméas · ePrint 2025/2059 · November 2025
              </p>
            </div>
            <a
              href="https://eprint.iacr.org/2025/2059"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
            >
              <ExternalLink size={12} /> ePrint
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            Silithium adapts the Fiat-Shamir transform to produce a fused hybrid signature from
            EC-Schnorr (classical, secp256k1) and ML-DSA-65 (FIPS 204). Both components share a
            single challenge μ derived from both public keys, the EC commitment R, and the message.
            Neither component verifies on its own with the standard challenge. The paper targets
            Strong Non-Separability (SNS) and reports no separability issues for its construction;
            this page demonstrates the idea and does not prove the property.
          </p>

          {/* Protocol steps */}
          <div className="space-y-2 text-sm">
            <div className="font-medium text-foreground text-xs uppercase tracking-wide text-muted-foreground">
              Protocol (Sign)
            </div>
            {[
              ['1', 'EC commitment', 'k ← DRBG(sk_ec, msg),  R = k·G  (secp256k1 base point)'],
              [
                '2',
                'Shared challenge',
                'μ = H(R ‖ pk_ec ‖ pk_ml ‖ msg)  expanded to 64 bytes  (approx.: full paper also binds ML-DSA commitment w1)',
              ],
              ['3', 'EC response', 's = (k + e·sk_ec) mod n   where e = μ[:32] as bigint'],
              [
                '4',
                'ML-DSA response',
                'z = ML-DSA.Sign_internal(sk_ml, μ)   (FIPS 204 §6.2, Algorithm 7, external μ)',
              ],
              [
                '5',
                'Output',
                'σ = R ‖ s ‖ z    (same total size as concatenation — savings require full w1 binding)',
              ],
            ].map(([step, label, code]) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                  {step}
                </span>
                <div>
                  <span className="text-foreground font-medium text-sm">{label}: </span>
                  <code className="text-xs font-mono text-muted-foreground">{code}</code>
                </div>
              </div>
            ))}
          </div>

          {/* Security properties */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              {
                icon: ShieldCheck,
                color: 'text-status-success',
                label: 'Hybrid EU-CMA',
                desc: "Paper's claim for the full scheme: a forgery requires breaking both EC-Schnorr and ML-DSA (this simplified demo is not covered by that proof)",
              },
              {
                icon: ShieldCheck,
                color: 'text-status-success',
                label: 'SNS achieved',
                desc: 'Neither component verifies without the shared μ',
              },
              {
                icon: ShieldAlert,
                color: 'text-status-warning',
                label: 'No backwards compat',
                desc: 'Requires a verifier that understands the fused scheme',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex gap-2 p-2 bg-muted/50 rounded">
                <Icon size={14} className={`${color} shrink-0 mt-0.5`} />
                <div>
                  <div className="font-medium text-foreground">{label}</div>
                  <div className="text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attack model */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            Attack Model — Why Fused Wins
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              {
                name: 'Separability Attack',
                description:
                  'Adversary strips the PQC component and presents only the classical signature. Verifiers that accept classical-only sigs are fooled. Prevented by SNS.',
              },
              {
                name: 'Recombination Attack',
                description:
                  'Adversary combines a legitimate EC sig with a different ML-DSA sig (or vice versa) to forge a hybrid signature. Prevented because μ ties both to the same R.',
              },
              {
                name: 'Cross-Protocol Attack',
                description:
                  'A valid signature in one hybrid scheme is replayed in another. Prevented by including both pk_ec and pk_ml in the challenge, tying the sig to both key pairs.',
              },
            ].map(({ name, description }) => (
              <div key={name} className="glass-panel p-3 space-y-1">
                <div className="font-semibold text-foreground">{name}</div>
                <div className="text-muted-foreground">{description}</div>
              </div>
            ))}
          </div>
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
      <RecordDecisionLink topic="transition-mode" />
      <ReadingCompleteButton />
    </div>
  )
}
