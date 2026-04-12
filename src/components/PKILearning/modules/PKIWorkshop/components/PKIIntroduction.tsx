// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  RefreshCw,
  FileText,
  PenTool,
  Key,
  ArrowRight,
  Mail,
  FileCheck,
  BookOpen,
  GitBranch,
  TreePine,
  Fingerprint,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { PKICertificateLifecycleDiagram } from './PKICertificateLifecycleDiagram'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'

interface PKIIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const PKIIntroduction: React.FC<PKIIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-6 w-full">
      {/* Section 1: What is PKI? */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> What is PKI?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          <InlineTooltip term="Public Key Infrastructure">Public Key Infrastructure</InlineTooltip>{' '}
          (PKI) is a framework of policies, hardware, software, and procedures for creating,
          managing, distributing, and revoking digital certificates. Defined by ITU-T{' '}
          <InlineTooltip term="X.509">X.509</InlineTooltip> and profiled for the internet in RFC
          5280, PKI enables entities to establish trust through a hierarchy of{' '}
          <InlineTooltip term="Certificate Authority">Certificate Authorities</InlineTooltip> (CAs)
          that vouch for the binding between a public key and an identity.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Components</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Certificate Authorities (CAs)</li>
              <li>Registration Authorities (RAs)</li>
              <li>End Entities (subscribers)</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">Trust Models</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Hierarchical (Root → Intermediate → EE)</li>
              <li>Bridge CA (cross-certification)</li>
              <li>Web of Trust (PGP model)</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-warning mb-1">Standards</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>X.509v3 certificates (RFC 5280)</li>
              <li>
                PKCS#10 <InlineTooltip term="Certificate Signing Request">CSR</InlineTooltip> format
                (RFC 2986)
              </li>
              <li>CMP enrollment (RFC 4210)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Certificate Lifecycle */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <RefreshCw size={20} /> The Certificate Lifecycle
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Every X.509 certificate follows a defined lifecycle from key generation through
          revocation. RFC 5280 Section 3 describes the certificate path processing model, while RFC
          6960 (<InlineTooltip term="OCSP">OCSP</InlineTooltip>) and RFC 5280 Section 5 (
          <InlineTooltip term="Certificate Revocation List">CRL</InlineTooltip>s) define the
          revocation checking mechanisms that relying parties use to verify certificate validity in
          real time.
        </p>
        <PKICertificateLifecycleDiagram />
      </section>

      {/* Section 3: X.509 Certificate Structure */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <FileText size={20} /> X.509 Certificate Structure
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          An X.509v3 certificate (RFC 5280 Section 4.1) contains three main parts: the
          TBSCertificate (to-be-signed data), the signature algorithm identifier, and the digital
          signature value. The TBSCertificate holds all the fields that get signed by the CA:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-border font-mono text-sm space-y-2">
          <div>
            <span className="text-primary font-bold">Version</span>
            <span className="text-muted-foreground ml-3 text-xs">
              v3 (0x2) — required for extensions
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">Serial Number</span>
            <span className="text-muted-foreground ml-3 text-xs">
              Unique per CA — MUST be positive integer (RFC 5280 Section 4.1.2.2)
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">Signature Algorithm</span>
            <span className="text-muted-foreground ml-3 text-xs">
              sha256WithRSAEncryption, ml-dsa-65, slh-dsa-sha2-128s, etc.
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">Issuer</span>
            <span className="text-muted-foreground ml-3 text-xs">CA distinguished name (DN)</span>
          </div>
          <div>
            <span className="text-primary font-bold">Validity</span>
            <span className="text-muted-foreground ml-3 text-xs">
              Not Before / Not After — defines certificate lifetime
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">Subject</span>
            <span className="text-muted-foreground ml-3 text-xs">
              End entity DN (CN, O, C, etc.)
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">Subject Public Key Info</span>
            <span className="text-muted-foreground ml-3 text-xs">
              Algorithm OID + public key bits
            </span>
          </div>
          <div>
            <span className="text-primary font-bold">Extensions</span>
            <span className="text-muted-foreground ml-3 text-xs">
              Key Usage, Basic Constraints, SAN, CRL Distribution Points (RFC 5280 Section 4.2)
            </span>
          </div>
        </div>
      </section>

      {/* Section 4: Digital Signatures in PKI */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <PenTool size={20} /> Digital Signatures in PKI
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Certificate issuance and verification rely on{' '}
          <InlineTooltip term="Digital Signature">digital signatures</InlineTooltip> as defined in
          RFC 5280 Section 4.1.1.2. The CA signs the TBSCertificate using its private key, and any
          relying party can verify the signature using the CA&apos;s public key from a trusted root
          store.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-2">Signing (CA)</div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Construct TBSCertificate (subject, key, extensions)</li>
              <li>Hash the TBSCertificate (SHA-256, SHA-384, etc.)</li>
              <li>Sign hash with CA private key</li>
              <li>Append signature algorithm OID + signature value</li>
            </ol>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-2">Verification (Relying Party)</div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Extract signature from certificate</li>
              <li>Hash the TBSCertificate independently</li>
              <li>Verify signature against CA public key</li>
              <li>Check validity period, extensions, revocation</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Section 5: Classical vs PQC Algorithms */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Key size={20} /> Classical vs PQC Algorithms in PKI
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Traditional PKI relies on <InlineTooltip term="RSA">RSA</InlineTooltip> and{' '}
          <InlineTooltip term="ECDSA">ECDSA</InlineTooltip> signatures, both vulnerable to{' '}
          <InlineTooltip term="Shor's Algorithm">Shor&apos;s algorithm</InlineTooltip> on a
          cryptographically relevant quantum computer. NIST has standardized post-quantum
          replacements: <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> (FIPS 204) for{' '}
          <InlineTooltip term="Lattice-Based Cryptography">lattice-based</InlineTooltip> signatures
          and <InlineTooltip term="SLH-DSA">SLH-DSA</InlineTooltip> (FIPS 205) for stateless
          hash-based signatures.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="text-sm font-bold text-primary mb-1">Classical (RSA / ECDSA)</div>
            <p className="text-xs text-muted-foreground">
              Proven, widely deployed. Small signatures (256-512 bytes). Vulnerable to quantum
              computers running Shor&apos;s algorithm.
            </p>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">PQC (ML-DSA / SLH-DSA)</div>
            <p className="text-xs text-muted-foreground">
              Quantum-resistant. ML-DSA-65 signatures ~3,309 bytes, SLH-DSA-SHA2-128s ~7,856 bytes
              (FIPS 204, FIPS 205). Larger but quantum-safe.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-3 border border-warning/20">
            <div className="text-sm font-bold text-warning mb-1">
              Hybrid / <InlineTooltip term="Composite Certificate">Composite</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              Combine classical + PQC in one certificate for backward compatibility. Protects
              against both classical and quantum attacks during transition.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: PQC Migration for PKI */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> PQC Migration for PKI
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Root CA certificates can have lifetimes of 20+ years. While data encryption is vulnerable
          to &quot;
          <InlineTooltip term="Harvest Now, Decrypt Later">
            harvest now, decrypt later
          </InlineTooltip>
          &quot; attacks, long-lived CAs are vulnerable to &quot;forge later&quot; attacks, where a
          cryptographically relevant quantum computer could forge signatures and issue rogue
          certificates. <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip> recommends
          beginning the transition to post-quantum algorithms immediately, with{' '}
          <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (NSA) setting a 2030 deadline for
          PQC-only PKI in national security systems.
        </p>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Key migration challenges include certificate size growth (ML-DSA-87 public keys are ~2,592
          bytes vs 294 bytes for ECDSA P-256), constrained device support, and maintaining
          cross-signed trust chains during the transition period. NIST SP 800-131A Rev 2 provides
          guidance on algorithm deprecation timelines.
        </p>
        <Button
          variant="ghost"
          onClick={onNavigateToWorkshop}
          className="btn btn-primary flex items-center gap-2 px-4 py-2"
        >
          Try It in the Workshop <ArrowRight size={16} />
        </Button>
      </section>

      {/* Section 7: Merkle Tree Certificates */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <TreePine size={20} /> Merkle Tree Certificates: Solving PQC Certificate Bloat
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Post-quantum signatures are dramatically larger than their classical counterparts:{' '}
          <InlineTooltip term="ML-DSA">ML-DSA-44</InlineTooltip> signatures are{' '}
          <strong>2,420 bytes</strong> compared to just <strong>64 bytes</strong> for ECDSA P-256
          &mdash; a <strong>37&times;</strong> increase. A typical TLS certificate chain with three
          PQ signatures, public keys, and Certificate Transparency SCTs can add{' '}
          <strong>18&ndash;36 KB</strong> to every handshake, breaking constrained clients and
          degrading performance.
        </p>
        <p className="text-foreground/80 leading-relaxed mb-4">
          <strong>Merkle Tree Certificates (MTCs)</strong>, proposed in IETF{' '}
          <em>draft-davidben-tls-merkle-tree-certs</em> by Google and Cloudflare, offer an elegant
          solution: instead of signing each certificate individually, a Merkle Tree CA (MTCA)
          batches thousands of certificates as leaves in a{' '}
          <InlineTooltip term="Merkle Tree">Merkle tree</InlineTooltip>, signs only the root hash,
          and distributes compact <strong>inclusion proofs</strong> (~736 bytes) that let any
          relying party verify a certificate belongs to the signed batch. This replaces three
          separate PQ signatures with a single root signature plus a hash-based proof.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
            <div className="text-sm font-bold text-destructive mb-1">Traditional PQC Chain</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                3 ML-DSA-44 signatures: <strong>7,260 B</strong>
              </li>
              <li>
                3 public keys: <strong>3,936 B</strong>
              </li>
              <li>
                4 CT SCTs: <strong>476 B</strong>
              </li>
              <li className="font-bold text-foreground">Total: ~12.3 KB per handshake</li>
            </ul>
          </div>
          <div className="bg-success/5 rounded-lg p-3 border border-success/20">
            <div className="text-sm font-bold text-success mb-1">MTC Approach</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                1 root signature: <strong>2,420 B</strong>
              </li>
              <li>
                1 root public key: <strong>1,312 B</strong>
              </li>
              <li>
                Inclusion proof: <strong>736 B</strong>
              </li>
              <li className="font-bold text-foreground">Total: ~4.5 KB per handshake</li>
            </ul>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 border border-border mb-4">
          <div className="flex items-start gap-2">
            <GitBranch size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Tradeoff:</strong> MTC clients must periodically
              fetch transparency service updates (similar to CRLite). This trades per-handshake size
              for background data synchronization &mdash; a favorable tradeoff for high-traffic
              servers and constrained IoT devices.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={onNavigateToWorkshop}
            className="btn btn-primary flex items-center gap-2 px-4 py-2"
          >
            Try MTC Comparison in Workshop <ArrowRight size={16} />
          </Button>
          <Link
            to="/learn/merkle-tree-certs"
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            <TreePine size={14} /> Full MTC Workshop Module
          </Link>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/merkle-tree-certs"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <TreePine size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Merkle Tree Certificates</div>
              <div className="text-xs text-muted-foreground">
                Interactive MTC builder, inclusion proofs, and PQC size comparison
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Key size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS & PQC Key Management</div>
              <div className="text-xs text-muted-foreground">
                Enterprise key lifecycle and PQC rotation planning
              </div>
            </div>
          </Link>
          <Link
            to="/learn/email-signing"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Mail size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Email Signing</div>
              <div className="text-xs text-muted-foreground">
                S/MIME and CMS document signing with PQC
              </div>
            </div>
          </Link>
          <Link
            to="/compliance"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <FileCheck size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance</div>
              <div className="text-xs text-muted-foreground">
                NIST, BSI, ANSSI &amp; Common Criteria requirements
              </div>
            </div>
          </Link>
          <Link
            to="/library"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <BookOpen size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Standards Library</div>
              <div className="text-xs text-muted-foreground">
                FIPS, RFC, and ISO PQC standards reference
              </div>
            </div>
          </Link>
          <Link
            to="/learn/digital-id"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
          >
            <Fingerprint size={16} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Digital Identity</div>
              <div className="text-xs text-muted-foreground">
                EUDI Wallet, eIDAS 2.0 &amp; PQC credential issuance
              </div>
            </div>
          </Link>
        </div>
      </section>
      <ReadingCompleteButton />
    </div>
  )
}
