// SPDX-License-Identifier: AGPL-3.0-only
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
      <section id="enrollment-overview" data-section-id="enrollment-overview">
        <h2 className="text-2xl font-bold text-foreground">PKI Enrollment Protocols</h2>
        <p className="mt-3 text-muted-foreground">
          When an end-entity needs an X.509 certificate, it doesn't just hand a self-signed key to
          the CA — the request is wrapped in a structured <strong>enrollment protocol</strong>
          that carries the public key, attribute requests, proof-of-possession (POP), and
          authentication. Four enrollment protocols shape enterprise and automated PKI migration:{' '}
          <strong>EST</strong> (RFC 7030), <strong>CMPv3</strong> (RFC 9810, July 2025, which
          obsoleted RFC 4210 and RFC 9480, alongside the RFC 9483 Lightweight CMP Profile),{' '}
          <strong>SCEP</strong> (RFC 8894), and <strong>ACME</strong> (RFC 8555).
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div id="est-protocol" data-section-id="est-protocol" className="glass-panel p-4 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            EST — RFC 7030 (&amp; SCEP / ACME)
          </h3>
          <p className="text-sm text-muted-foreground">
            <em>Enrollment over Secure Transport</em> — HTTPS-based, designed to be simple. Client
            POSTs a base64-encoded PKCS#10 CSR to{' '}
            <code className="text-xs">/.well-known/est/simpleenroll</code>; server returns a
            base64-encoded PKCS#7 degenerate SignedData containing the issued cert.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
            <li>Transport: HTTPS (TLS 1.2+; mutual TLS, or HTTP Basic/Digest over TLS)</li>
            <li>Request: PKCS#10 (RFC 2986 Certification Request)</li>
            <li>Response: PKCS#7 SignedData (single cert)</li>
            <li>
              POP: Self-signed PKCS#10 CSR (works for <strong>ML-DSA</strong> and{' '}
              <strong>SLH-DSA</strong>). A PKCS#10 CSR (<code>/simpleenroll</code>) cannot prove
              possession of an <strong>ML-KEM</strong> key because KEM keys cannot sign; EST&apos;s{' '}
              <code>/fullcmc</code> (CMC) offers non-signature POP, but EST has no KEM-specific
              profile. A PKCS#9 <code>challengePassword</code> (as used in SCEP RFC 8894)
              authenticates the request to the CA/RA but is not cryptographic POP of a KEM private
              key.
            </li>
            <li>
              ACME (RFC 8555) proves domain control with challenges (<code>http-01</code>,{' '}
              <code>dns-01</code>; <code>tls-alpn-01</code> is RFC 8737) in JWS-signed requests, and
              submits a PKCS#10 CSR at finalization (CA policy decides whether ML-DSA leaf keys are
              accepted).
            </li>
          </ul>
        </div>

        <div id="cmp-protocol" data-section-id="cmp-protocol" className="glass-panel p-4 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">CMPv3 — RFC 9810 &amp; RFC 9483</h3>
          <p className="text-sm text-muted-foreground">
            <em>Certificate Management Protocol</em> — richer state machine supporting initial
            request (<code>ir</code>), cert request (<code>cr</code>), key update (<code>kur</code>
            ), revocation (<code>rr</code>), and general messages (<code>genm</code>). RFC 9810
            (obsoleting RFC 4210 and RFC 9480) defines CMPv3, with POP for KEM keys through the
            existing <code>POPOPrivKey</code> mechanisms and KEM-based message protection (
            <code>KemCiphertextInfo</code> plus a KDF over <code>KemOtherInfo</code>).
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
            <li>Transport: HTTP (application/pkixcmp, RFC 9811, obsoletes RFC 6712)</li>
            <li>Request: CMP PKIMessage carrying CRMF (RFC 4211) CertReqMessages</li>
            <li>Response: PKIMessage with CertResponse (and encrypted cert for KEM POP)</li>
            <li>
              POP: <code>POPOSigningKey</code> for signature keys (ML-DSA), <code>POPOPrivKey</code>{' '}
              <code>subsequentMessage</code> (<code>encrCert</code> or <code>challengeResp</code>,
              RFC 4211 / RFC 9883 / RFC 9810 §5.2.8.3) for KEM keys (ML-KEM), or{' '}
              <code>raVerified</code>
            </li>
            <li>
              Keyfactor&apos;s EJBCA 9.4.2 PQC guide says CMP <code>encrCert</code> POP for ML-KEM
              is supported as of EJBCA 9.1. Its EJBCA 9.6.2 algorithm table lists ML-DSA via ACME,
              EST, and CMP. These are version-specific product claims; verify your deployed version,
              edition, CA profile, and HSM support. See the{' '}
              <a
                href="https://docs.keyfactor.com/ejbca/9.4.2/post-quantum-cryptography-keys-and-signatures"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                EJBCA PQC guide
              </a>{' '}
              and{' '}
              <a
                href="https://docs.keyfactor.com/ejbca/9.6.2/supported-algorithms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                supported-algorithms table
              </a>
              .
            </li>
          </ul>
        </div>
      </section>

      <section id="pqc-enrollment" data-section-id="pqc-enrollment" className="space-y-3">
        <h3 className="text-xl font-semibold text-foreground">Why this matters for PQC</h3>
        <p className="text-muted-foreground text-sm">
          PQC migration introduces three distinct enrollment mechanics across signing, KEM, and
          hybrid certificates:
        </p>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal ml-5">
          <li>
            <strong>ML-DSA &amp; SLH-DSA signature POP (EST, SCEP, ACME, CMP).</strong> The PKCS#10
            CSR or CRMF <code>POPOSigningKey</code> carries the ML-DSA OIDs (RFC 9881) or SLH-DSA
            OIDs (RFC 9909) and proves private-key possession by signing the request structure with
            the subject key.
          </li>
          <li>
            <strong>ML-KEM proof-of-possession (CRMF POPOPrivKey encrCert vs CSR).</strong> KEM keys
            (FIPS 203, RFC 9935 OIDs) only support encapsulation and decapsulation — they cannot
            sign a PKCS#10 CSR. In CMPv3 (RFC 9810) and CRMF KEM POP (RFC 9883, updating RFC 4211),
            CRMF replaces the CSR signature with <code>POPOPrivKey</code>{' '}
            <code>subsequentMessage</code> (<code>encrCert</code>): the CA encapsulates the newly
            issued certificate under the requester&apos;s ML-KEM public key, and the requester
            decapsulates the ciphertext, derives the key, decrypts the certificate and returns its
            hash in <code>certConf</code>; alternatively KEM-based MAC protection uses a{' '}
            <code>KemCiphertextInfo</code> carried in <code>genm</code>/<code>genp</code> or{' '}
            <code>generalInfo</code>, with a KDF over <code>KemOtherInfo</code>. Neither EST (RFC
            7030, updated by RFC 8951, 8996, and 9908) nor SCEP (RFC 8894{' '}
            <code>challengePassword</code>) provides native KEM private-key POP.
          </li>
          <li>
            <strong>Composite &amp; parallel enrollment.</strong> RFC 10073 defines Composite ML-DSA
            algorithms for X.509/PKIX, combining a classical signature with ML-DSA under composite
            identifiers. It does not require every CA or validator to support them. The separate
            Composite ML-KEM document is still an Internet-Draft: revision 23, dated October 14,
            2026, submitted to the RFC Editor queue as a Proposed Standard. Its status is not an
            assigned RFC number. Before adopting Composite ML-DSA, review RFC 10073&apos;s security
            caveat: it provides EUF-CMA but not SUF-CMA security against quantum adversaries, and is
            not recommended where the stronger property is required. The workshop demonstrates
            separate parallel certificates; it does not create a composite certificate.
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
          <li>
            Update an ML-KEM certificate with a signed CMP key update request, recover the encrypted
            certificate and confirm its hash
          </li>
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
              <FileText size={12} /> RFC 4210 CMP (obsoleted) <ExternalLink size={12} />
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
