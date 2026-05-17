// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ArrowRight, ExternalLink, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EnrollmentIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const EnrollmentIntroduction: React.FC<EnrollmentIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-foreground">PKI Enrollment Protocols</h2>
        <p className="mt-3 text-muted-foreground">
          When an end-entity needs an X.509 certificate, it doesn't just hand a self-signed key to
          the CA — the request is wrapped in a structured <strong>enrollment protocol</strong>
          that carries the public key, attribute requests, proof-of-possession, and authentication.
          Two enrollment protocols matter for post-quantum PKI: <strong>EST</strong> (RFC 7030) and{' '}
          <strong>CMP</strong> (RFC 4210, updated by RFC 9810 in 2025 for KEM transport).
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">EST — RFC 7030</h3>
          <p className="text-sm text-muted-foreground">
            <em>Enrollment over Secure Transport</em> — HTTPS-based, designed to be simple. Client
            POSTs a base64-encoded PKCS#10 CSR to{' '}
            <code className="text-xs">/.well-known/est/simpleenroll</code>; server returns a
            base64-encoded PKCS#7 degenerate SignedData containing the issued cert.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
            <li>Transport: HTTPS (TLS 1.2+)</li>
            <li>Request: PKCS#10 (Certification Request)</li>
            <li>Response: PKCS#7 SignedData (single cert)</li>
            <li>POP: signed CSR (works for ML-DSA; not for ML-KEM)</li>
            <li>2013 standard; PQC-aware only via inherited X.509 OIDs (no PQC-specific update)</li>
          </ul>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">CMP — RFC 4210 + RFC 9810</h3>
          <p className="text-sm text-muted-foreground">
            <em>Certificate Management Protocol</em> — richer state machine, supports initial
            request (<code>ir</code>), cert request (<code>cr</code>), key update (<code>kur</code>
            ), revocation (<code>rr</code>), and more. RFC 9810 added KEM-specific
            proof-of-possession (<code>encrCert</code> POP) so ML-KEM keys can be enrolled even
            though they can't sign.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
            <li>Transport: HTTP (application/pkixcmp, RFC 6712)</li>
            <li>Request: CMP PKIMessage (CRMF inside)</li>
            <li>Response: PKIMessage with CertResponse</li>
            <li>POP: signature, encrCert (RFC 9810), or RA-verified</li>
            <li>Active IETF track — EJBCA 9.1+ ships ML-DSA + ML-KEM via CMP</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-foreground">Why this matters for PQC</h3>
        <p className="text-muted-foreground text-sm">
          PQC migration adds two new requirements to enrollment:
        </p>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal ml-5">
          <li>
            <strong>ML-DSA support.</strong> The CSR / CRMF must carry the new ML-DSA OIDs (RFC
            9881) and the request must be signed under the new algorithm. EST handles this
            transparently via PKCS#10; CMP needs no protocol changes for pure-sig flows.
          </li>
          <li>
            <strong>ML-KEM enrollment.</strong> KEM keys can't sign the request, so signature-POP
            doesn't apply. RFC 9810 introduces <em>encrCert POP</em>: the CA encapsulates the new
            cert under the EE's KEM pubkey; the EE proves possession by decapsulating. EST has no
            KEM-aware update yet.
          </li>
          <li>
            <strong>Composite enrollment.</strong> Hybrid PKI (one cert carrying both classical and
            PQC pubkeys) is currently a draft track —{' '}
            <code>draft-ietf-lamps-pq-composite-sigs-19</code> and{' '}
            <code>draft-ietf-lamps-pq-composite-kem-14</code>. Both EST and CMP can carry composite
            requests once the OIDs stabilize.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Workshop tools</h3>
        <p className="text-sm text-muted-foreground">
          The Workshop tab drives real cryptographic operations in your browser using OpenSSL 3.6
          WASM and our softHSM v3 (PKCS#11 v3.2). You'll:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc ml-5">
          <li>
            Generate an ML-DSA-65 keypair (or ML-KEM-768) via OpenSSL <code>genpkey</code>
          </li>
          <li>Send a real CMP Initial Request to an in-WASM mock CA</li>
          <li>
            POST a PKCS#10 CSR through a simulated EST <code>simpleenroll</code> endpoint
          </li>
          <li>Exercise ML-KEM encapsulation/decapsulation for the RFC 9810 KUR POP</li>
          <li>Decode and chain-verify the issued certificate</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Further reading</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://datatracker.ietf.org/doc/html/rfc7030"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1">
              <FileText size={12} /> RFC 7030 EST <ExternalLink size={12} />
            </Button>
          </a>
          <a
            href="https://datatracker.ietf.org/doc/html/rfc4210"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1">
              <FileText size={12} /> RFC 4210 CMP <ExternalLink size={12} />
            </Button>
          </a>
          <a
            href="https://datatracker.ietf.org/doc/html/rfc9810"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1">
              <FileText size={12} /> RFC 9810 CMP for KEM <ExternalLink size={12} />
            </Button>
          </a>
          <a
            href="https://docs.keyfactor.com/ejbca/latest/post-quantum-cryptography-keys-and-signatures"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1">
              EJBCA PQC docs <ExternalLink size={12} />
            </Button>
          </a>
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={onNavigateToWorkshop} className="gap-2">
          Continue to Workshop <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
