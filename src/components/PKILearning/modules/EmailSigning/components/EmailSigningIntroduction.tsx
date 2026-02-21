import React from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  ShieldCheck,
  KeyRound,
  FileKey,
  AlertTriangle,
  ArrowRight,
  Terminal,
  Library,
  Layers,
} from 'lucide-react'
import { KEY_RFCS } from '../data/emailSigningConstants'

interface EmailSigningIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const EmailSigningIntroduction: React.FC<EmailSigningIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: S/MIME & CMS Overview */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">S/MIME &amp; CMS Overview</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>Cryptographic Message Syntax (CMS)</strong>, defined in RFC 5652, is the
            foundational format for digitally signing and encrypting arbitrary data. It powers{' '}
            <strong>S/MIME</strong> (Secure/Multipurpose Internet Mail Extensions), the standard for
            end-to-end email security used by enterprises, governments, and military organizations
            worldwide.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;CMS is used to digitally sign, digest, authenticate, or encrypt arbitrary
              message content.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">&mdash; RFC 5652, Section 1</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">S/MIME Signing</div>
              <p className="text-xs text-muted-foreground">
                Creates a CMS <code className="text-foreground/70">SignedData</code> structure: the
                sender&apos;s private key signs a hash of the message, and recipients verify using
                the sender&apos;s certificate.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">S/MIME Encryption</div>
              <p className="text-xs text-muted-foreground">
                Creates a CMS <code className="text-foreground/70">EnvelopedData</code> structure:
                the message is encrypted with a random content-encryption key (CEK), which is then
                wrapped for each recipient.
              </p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Where CMS is used</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <span>&bull; Email (S/MIME)</span>
              <span>&bull; Document signing</span>
              <span>&bull; Code signing</span>
              <span>&bull; Timestamping</span>
              <span>&bull; PDF signatures</span>
              <span>&bull; SCEP / EST</span>
              <span>&bull; Firmware updates</span>
              <span>&bull; eIDAS signatures</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: PQC in CMS */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <ShieldCheck size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">PQC in CMS</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The IETF LAMPS working group has published a series of RFCs that bring post-quantum
            cryptography into CMS. These standards define how PQC algorithms integrate with existing
            S/MIME infrastructure.
          </p>
          <div className="space-y-2">
            {KEY_RFCS.filter((rfc) =>
              ['RFC 9629', 'RFC 9882', 'RFC 9708', 'RFC 9690'].includes(rfc.number)
            ).map((rfc) => (
              <div key={rfc.number} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <span className="text-sm font-bold text-primary shrink-0 w-20">{rfc.number}</span>
                <div>
                  <div className="text-sm font-medium text-foreground">{rfc.title}</div>
                  <p className="text-xs text-muted-foreground">{rfc.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Together, these RFCs provide a complete PQC story for CMS: ML-DSA for signing (RFC
            9882), ML-KEM for encryption via KEMRecipientInfo (RFC 9629 + RFC 9690), and HSS/LMS for
            hash-based firmware and long-lived signatures (RFC 9708).
          </p>
        </div>
      </section>

      {/* Section 3: KEM vs Key Transport */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <KeyRound size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">KEM vs Key Transport</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Classical S/MIME encryption uses <strong>RSA key transport</strong>: the sender encrypts
            the CEK directly with the recipient&apos;s RSA public key. PQC replaces this with a{' '}
            <strong>Key Encapsulation Mechanism (KEM)</strong> &mdash; a fundamentally different
            approach.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-destructive mb-2">
                Classical: Key Transport
              </div>
              <div className="space-y-2 text-center">
                <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                  Generate random CEK
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs font-bold">
                  RSA-OAEP encrypt CEK with recipient&apos;s public key
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                  Store encryptedKey in KeyTransRecipientInfo
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                The CEK is directly encrypted &mdash; vulnerable to Shor&apos;s algorithm.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-success mb-2">PQC: KEM + Key Wrap</div>
              <div className="space-y-2 text-center">
                <div className="p-2 rounded bg-success/10 text-success text-xs font-bold">
                  KEM Encapsulate &rarr; shared secret + ciphertext
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-success/10 text-success text-xs font-bold">
                  KDF (HKDF-SHA256) &rarr; key-wrap key from shared secret
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                  AES-WRAP the CEK with derived key
                </div>
                <div className="text-muted-foreground">&darr;</div>
                <div className="p-2 rounded bg-success/10 text-success text-xs font-bold">
                  Store kemct + wrappedCEK in KEMRecipientInfo
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                No direct encryption of CEK &mdash; quantum-resistant shared secret derivation.
              </p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">
              Why KEMs replace key transport
            </div>
            <p className="text-xs text-muted-foreground">
              Post-quantum public-key encryption (like lattice-based encryption) is less efficient
              and harder to standardize than KEM + symmetric key wrap. NIST standardized ML-KEM
              (FIPS 203) as a KEM primitive, not a public-key encryption scheme. RFC 9629 bridges
              this gap by defining <code className="text-foreground/70">KEMRecipientInfo</code>, a
              new CMS structure that replaces{' '}
              <code className="text-foreground/70">KeyTransRecipientInfo</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Certificate Requirements */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <FileKey size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Certificate Requirements</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            S/MIME certificates carry specific extensions that bind an email address to a key pair
            and declare the permitted operations (signing vs encryption). PQC introduces new
            considerations for key usage and algorithm negotiation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Signing Certificate</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; <strong>keyUsage:</strong> digitalSignature, nonRepudiation
                </li>
                <li>
                  &bull; <strong>extKeyUsage:</strong> id-kp-emailProtection
                </li>
                <li>
                  &bull; <strong>subjectAltName:</strong> rfc822Name (email)
                </li>
                <li>
                  &bull; <strong>Algorithm:</strong> ML-DSA-65 or ECDSA P-256
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Encryption Certificate</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; <strong>keyUsage:</strong> keyEncipherment (RSA) or keyAgreement (KEM)
                </li>
                <li>
                  &bull; <strong>extKeyUsage:</strong> id-kp-emailProtection
                </li>
                <li>
                  &bull; <strong>subjectAltName:</strong> rfc822Name (email)
                </li>
                <li>
                  &bull; <strong>Algorithm:</strong> ML-KEM-768 or RSA-2048
                </li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            In practice, users often have <strong>separate key pairs</strong> for signing and
            encryption. This is especially true for PQC migration, where signing keys (ML-DSA) and
            encryption keys (ML-KEM) use fundamentally different algorithms. The{' '}
            <code className="text-foreground/70">smimeCapabilities</code> attribute in signed
            messages advertises supported algorithms, enabling gradual PQC rollout.
          </p>
        </div>
      </section>

      {/* Section 5: Migration Challenges */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <AlertTriangle size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Migration Challenges</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Migrating email security to PQC is uniquely challenging because S/MIME requires
            <strong> bidirectional compatibility</strong> &mdash; both sender and recipient must
            support the same algorithms. This creates a chicken-and-egg problem that doesn&apos;t
            exist in TLS (where servers can unilaterally upgrade).
          </p>
          <div className="space-y-2">
            {[
              {
                t: 'Dual-Algorithm Certificates',
                d: 'During transition, organizations must issue both classical and PQC certificates for each user. Certificate management complexity doubles.',
              },
              {
                t: 'Recipient Capability Discovery',
                d: 'Senders must discover which algorithms each recipient supports before encrypting. The smimeCapabilities attribute and LDAP directory lookups become critical.',
              },
              {
                t: 'Message Size Impact',
                d: 'ML-DSA-65 signatures are ~3.3 KB (vs 64 bytes for ECDSA). Signed emails with certificate chains can grow by 10-15 KB, impacting mobile clients and constrained networks.',
              },
              {
                t: 'Archival & Long-Term Validation',
                d: 'Signed emails must remain verifiable for years or decades. Organizations need both classical and PQC signatures during the transition to ensure long-term validation.',
              },
              {
                t: 'Gateway & Relay Compatibility',
                d: 'Email gateways, DLP systems, and archival solutions must understand PQC-signed CMS structures to avoid stripping or corrupting S/MIME attachments.',
              },
            ].map((challenge) => (
              <div key={challenge.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{challenge.t}</div>
                  <p className="text-xs text-muted-foreground">{challenge.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/openssl"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Terminal size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">OpenSSL Studio</div>
              <div className="text-xs text-muted-foreground">
                Run CMS signing and encryption commands interactively
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FileKey size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">PKI Workshop</div>
              <div className="text-xs text-muted-foreground">
                Certificate chains, X.509 structure, and trust models
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
                Browse RFC 9629, RFC 9882, and other CMS PQC standards
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Layers size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Composite signatures and dual-algorithm approaches
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
          Explore S/MIME certificates, CMS signing structures, and KEM-based encryption.
        </p>
      </div>
    </div>
  )
}
