import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, RefreshCw, FileText, PenTool, Key, ArrowRight, ExternalLink } from 'lucide-react'
import { PKICertificateLifecycleDiagram } from './PKICertificateLifecycleDiagram'

interface PKIIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const PKIIntroduction: React.FC<PKIIntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Section 1: What is PKI? */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> What is PKI?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          Public Key Infrastructure (PKI) is a framework of policies, hardware, software, and
          procedures for creating, managing, distributing, and revoking digital certificates.
          Defined by ITU-T X.509 and profiled for the internet in RFC 5280, PKI enables entities to
          establish trust through a hierarchy of Certificate Authorities (CAs) that vouch for the
          binding between a public key and an identity.
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
              <li>PKCS#10 CSR format (RFC 2986)</li>
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
          6960 (OCSP) and RFC 5280 Section 5 (CRLs) define the revocation checking mechanisms that
          relying parties use to verify certificate validity in real time.
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
          Certificate issuance and verification rely on digital signatures as defined in RFC 5280
          Section 4.1.1.2. The CA signs the TBSCertificate using its private key, and any relying
          party can verify the signature using the CA&apos;s public key from a trusted root store.
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
          Traditional PKI relies on RSA and ECDSA signatures, both vulnerable to Shor&apos;s
          algorithm on a cryptographically relevant quantum computer. NIST has standardized
          post-quantum replacements: ML-DSA (FIPS 204) for lattice-based signatures and SLH-DSA
          (FIPS 205) for stateless hash-based signatures.
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
            <div className="text-sm font-bold text-warning mb-1">Hybrid / Composite</div>
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
          Root CA certificates can have lifetimes of 20+ years, making them prime targets for
          &quot;harvest now, decrypt later&quot; attacks. NIST IR 8547 recommends beginning the
          transition to post-quantum algorithms immediately, with CNSA 2.0 (NSA) setting a 2030
          deadline for PQC-only PKI in national security systems.
        </p>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Key migration challenges include certificate size growth (ML-DSA-87 public keys are ~2,592
          bytes vs 294 bytes for ECDSA P-256), constrained device support, and maintaining
          cross-signed trust chains during the transition period. NIST SP 800-131A Rev 2 provides
          guidance on algorithm deprecation timelines.
        </p>
        <button
          onClick={onNavigateToWorkshop}
          className="btn btn-primary flex items-center gap-2 px-4 py-2"
        >
          Try It in the Workshop <ArrowRight size={16} />
        </button>
      </section>

      {/* Related Modules */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <ExternalLink size={20} /> Related Modules
        </h2>
        <div className="space-y-2">
          <Link
            to="/learn/email-signing"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowRight size={14} />
            Email & Document Signing — S/MIME and CMS with PQC
          </Link>
          <Link
            to="/learn/key-management"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowRight size={14} />
            Key Management & HSM — enterprise key lifecycle and HSM operations
          </Link>
        </div>
      </section>
    </div>
  )
}
