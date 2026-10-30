// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { ShieldAlert, KeyRound, Tv, Play, Stamp, Layers, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import { ECP_DATE, ECP_EDITION, ECP_GROUPS, ECP_PRACTICES, ECP_STATUS_NOTE } from '../data/ecpData'
import {
  AACS_DATE,
  AACS_EDITION,
  CI_PLUS_DATE,
  CI_PLUS_EDITION,
  NIST_TRANSITION,
  RUNGS_BY_SCHEME,
  type LadderRung,
} from '../data/ladderData'
import { CLOUDFLARE_REPORT, RFC_10024, SURVEY, SURVEY_FINDINGS } from '../data/streamingData'
import { C2PA_ALLOWED, C2PA_EDITION, C2PA_FACTS, COSE_PQ_DOCUMENTS } from '../data/provenanceData'
import { LINKS } from '../data/leverData'

interface Props {
  onNavigateToWorkshop: () => void
}

const RungTable: React.FC<{ scheme: LadderRung['scheme'] }> = ({ scheme }) => (
  <div className="space-y-2">
    {RUNGS_BY_SCHEME(scheme).map((r) => (
      <div key={r.id} className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm">
          <strong className="text-foreground">
            {r.order}. {r.name}
          </strong>{' '}
          <span className="text-xs text-muted-foreground">
            ({r.primitive}; {r.kind}
            {r.nistTable ? `; NIST IR 8547 ${r.nistTable}` : ''})
          </span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">{r.what}</p>
        <p className="text-xs text-muted-foreground mt-1">Specification: {r.where}</p>
      </div>
    ))}
  </div>
)

export const MediaDrmIntroduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  useActiveLearnPath()

  return (
    <div className="w-full space-y-6">
      <LearnSection
        sectionId="threat-model"
        title="1. Why content protection is a different problem"
        icon={<ShieldAlert size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          In consumer content protection a compromised device is part of the threat model, so
          &ldquo;is it quantum-safe?&rdquo; has to be asked link by link: which secret does the
          system rely on, and which signature does it rely on.
        </p>
        <p className="text-muted-foreground">
          This section draws on the {ECP_EDITION} ({ECP_DATE}), ECP for short. {ECP_STATUS_NOTE} ECP
          describes the problem this way: breaking protection on one device can break it on a wide
          class of devices, and the availability of release-day copies is the most challenging
          threat to prevent because it only takes a single skilled adversary with a single
          compromised platform to post a single copy to a file-sharing network.
        </p>

        {ECP_GROUPS.map((g) => (
          <div key={g} className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">{g}</h3>
            {ECP_PRACTICES.filter((p) => p.group === g).map((p) => (
              <div key={p.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium text-foreground">{p.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{p.text}</p>
                <p className="text-xs text-muted-foreground mt-1">ECP: {p.where}</p>
              </div>
            ))}
          </div>
        ))}

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Info size={16} /> What ECP does not say
          </h3>
          <p className="text-sm text-muted-foreground">
            This edition of ECP (v1.4) does not mention quantum computing. That is a statement about
            one document. It does not say that anyone has or has not planned a migration, and it
            does not describe other editions.
          </p>
        </div>

        <p className="text-muted-foreground">
          One analysis looks at three widely deployed DRM systems. The paper ({SURVEY.authors};{' '}
          {SURVEY.when}): {SURVEY.abstract} Section 4 returns to what the paper says about licenses.
        </p>
      </LearnSection>

      <LearnSection
        sectionId="disc-keys"
        title="2. The AACS key ladder"
        icon={<KeyRound size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          This section reads one edition: the {AACS_EDITION} ({AACS_DATE}). It covers the common
          cryptographic elements; other editions and generations of AACS are not covered.
          Implementing the specification requires a license from AACS LA LLC.
        </p>
        <p className="text-muted-foreground">
          The ladder below runs from the secret keys a device is given at manufacture to the key
          exchange between a drive and a host. For each rung the lesson shows the primitive the
          specification names, and, for the public-key rungs, which NIST IR 8547 table lists that
          kind of primitive. The pairing with NIST is this lesson&rsquo;s, not the
          specification&rsquo;s.
        </p>
        <RungTable scheme="AACS" />

        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
          <h3 className="font-semibold text-foreground">The signatures and the curve</h3>
          <p className="text-sm text-muted-foreground">
            All digital signatures in AACS use the ECDSA digital signature scheme defined in ANSI
            X9.62 and FIPS 186-2. The Media Key Block signature and the drive and host signatures in
            the Bus Key exchange all rest on that one scheme.
          </p>
          <p className="text-sm text-muted-foreground">
            Table 2-1 of the book gives the curve. By this lesson&rsquo;s own count the prime is 160
            bits and the order of the base point is also 160 bits. NIST SP 800-57 Part 1 Revision 5,
            Table 2, places elliptic-curve keys with f = 160 to 223 at a security strength of at
            most 80 bits, while NIST IR 8547 Table 2 lists ECDSA at 112 bits of classical security
            strength or more. The two facts are set side by side here; the lesson draws no further
            conclusion from them.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
          <h3 className="font-semibold text-foreground">Reading the ladder</h3>
          <p className="text-sm text-muted-foreground">
            The Device Key tree, the Processing Keys and the Media Key are built from AES-128. The
            public-key operations in this edition are the ECDSA signatures and the Bus Key exchange.
            Forging a Media Key Block signature would need the AACS LA signing key, so an attacker
            who could derive an ECDSA key from a public key could do that. The lesson draws no
            conclusion about the effect of a quantum computer on AES.
          </p>
          <p className="text-sm text-muted-foreground">
            The text of this edition does not mention quantum computing.
          </p>
        </div>

        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Walk the ladder in the Workshop <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <LearnSection
        sectionId="broadcast-ci-plus"
        title="3. Broadcast: CI Plus"
        icon={<Tv size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          This lesson teaches the {CI_PLUS_EDITION} ({CI_PLUS_DATE}), the edition held in the
          Library; other editions are not covered. The specification addresses content protection
          after conditional access protection has been removed, at the point where the content
          leaves the CA module and re-enters the host.
        </p>
        <RungTable scheme="CI Plus" />

        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
          <h3 className="font-semibold text-foreground">Revocation in CI Plus</h3>
          <p className="text-sm text-muted-foreground">
            The specification distinguishes three mechanisms of revocation for host devices whose
            security has been compromised: Host Service Shunning, revocation by the CA system, and
            Host Revocation. Revocation by the CA system is defined by a particular CA system and is
            out of scope for the specification.
          </p>
          <p className="text-sm text-muted-foreground">
            Host Revocation is revocation by denial of service: the CICAM stops CI Plus operation,
            withholding Content Control services from the host. Revoked hosts are listed in a
            Service Operator Certificate Revocation List (SOCRL), and a Service Operator Certificate
            White List (SOCWL) undoes a revocation. A SOCRL is created by the Root-of-Trust on
            request of a Service Operator for its own operation, so a host can be revoked for one
            operator and still work for others. The exact rules are set by the CI Plus license.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
          <p className="text-sm text-muted-foreground">
            The text of this edition does not mention quantum computing. The authentication
            signatures and the Diffie-Hellman exchange are the rungs a NIST IR 8547 table lists; the
            scramblers and the hash functions are not signature or key-establishment schemes. The
            lesson says nothing about how strong DES-56 or AES-128 is against a quantum computer,
            and it does not grade DES-56 at all.
          </p>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="streaming-transport"
        title="4. Streaming: the transport, and what the held sources say about licenses"
        icon={<Play size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          TLS 1.3 and hybrid key agreement are taught in{' '}
          <Link to="/learn/tls-basics" className="text-primary hover:underline">
            TLS Basics
          </Link>{' '}
          and{' '}
          <Link to="/learn/hybrid-crypto" className="text-primary hover:underline">
            Hybrid Cryptography
          </Link>
          ; this section does not repeat them. It adds only what the sources held for this lesson
          say about streaming.
        </p>
        <p className="text-muted-foreground">
          {RFC_10024.summary} The three mechanisms are {RFC_10024.mechanisms.join(', ')}; the RFC is
          an {RFC_10024.status} document. {CLOUDFLARE_REPORT.text}
        </p>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm">
            What a 2023 paper says about three DRM systems
          </h3>
          <p className="text-sm text-muted-foreground">{SURVEY.mitigation}</p>
          {SURVEY_FINDINGS.map((f) => (
            <div key={f.system} className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">{f.system}</p>
              <p className="text-sm text-muted-foreground mt-1">{f.license}</p>
              <p className="text-sm text-muted-foreground mt-1">{f.quantum}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            The paper is held here as the arXiv preprint. Its statements are the authors&rsquo;
            assessments.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
          <p className="text-sm text-muted-foreground">
            RFC 10024 protects the key agreement of the transport. The license and certificate
            layers inside a DRM system are a separate question, and the sources held for this lesson
            do not say how each system would change them. The lesson therefore makes no claim about
            how a license request, a device credential or a key delivery works inside any one DRM
            system beyond what the paper states above.
          </p>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="provenance"
        title="5. Provenance: C2PA Content Credentials"
        icon={<Stamp size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          This section reads the {C2PA_EDITION}. For why provenance matters to AI-generated media,
          see{' '}
          <Link to="/learn/ai-security-pqc" className="text-primary hover:underline">
            AI Security &amp; PQC
          </Link>
          ; for time-stamps, revocation evidence and long-term signatures, see{' '}
          <Link to="/learn/trust-services-pqc" className="text-primary hover:underline">
            Trust Services &amp; Long-Term Signatures
          </Link>
          . Only the media-specific algorithm policy is covered here.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Allowed for new claim signatures
                </th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Family</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {C2PA_ALLOWED.map((a) => (
                <tr key={a.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-4 font-medium text-foreground">{a.label}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{a.family}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">{C2PA_FACTS.deprecatedList}</p>

        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>{C2PA_FACTS.curves}</li>
          <li>{C2PA_FACTS.hash}</li>
          <li>{C2PA_FACTS.cose}</li>
          <li>{COSE_PQ_DOCUMENTS.mlDsa}</li>
          <li>{COSE_PQ_DOCUMENTS.slhDsa}</li>
          <li>{C2PA_FACTS.timestamp}</li>
          <li>{C2PA_FACTS.trust}</li>
          <li>{C2PA_FACTS.revocation}</li>
        </ul>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
          <p className="text-sm text-muted-foreground">
            The text of this edition does not mention quantum computing, and its allowed list names
            none of the post-quantum algorithms for which COSE serializations are specified (one as
            a standard, one as a draft). In this lesson&rsquo;s reading, a post-quantum path for
            C2PA would run through COSE and a change to the C2PA specification, and it would touch
            more than the signature algorithm: the trust lists, the time-stamp authorities and the
            revocation data are part of the same chain. The lesson names the pieces and gives no
            timeline.
          </p>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="migration-surface"
        title="6. What a migration would have to touch"
        icon={<Layers size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          {NIST_TRANSITION.document} ({NIST_TRANSITION.date}) is NIST&rsquo;s transition plan.{' '}
          {NIST_TRANSITION.summary} {NIST_TRANSITION.table2} {NIST_TRANSITION.table4}{' '}
          {NIST_TRANSITION.table3} FIPS 203 (ML-KEM), FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) were
          published on 13 August 2024. AES, DES, SHA-1 and SHA-256 are neither signature nor
          key-establishment schemes and are not in Tables 2 and 4; Table 1 of the report uses
          AES-128 and SHA-256 only as examples of its post-quantum security categories. The lesson
          says nothing about their strength against a quantum computer.
        </p>
        <p className="text-muted-foreground">{NIST_TRANSITION.scope}</p>

        <div className="space-y-3">
          {LINKS.map((l) => (
            <div key={l.id} className="p-3 rounded-lg bg-muted/50 border border-border space-y-1">
              <p className="text-sm font-medium text-foreground">{l.link}</p>
              <p className="text-sm text-muted-foreground">Primitives: {l.primitive}</p>
              <p className="text-sm text-muted-foreground">NIST IR 8547: {l.nist}</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {l.levers.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground">
          The ECP, AACS, CI Plus and C2PA editions this lesson reads do not mention quantum
          computing, so none of them states a post-quantum migration timeline, and this lesson gives
          none for them. What it gives is the map: for each link, which primitive is in play, which
          NIST table lists that kind of primitive, and who the documents say can change or revoke
          something.
        </p>
        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Compare the editions in the Workshop <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <ReadingCompleteButton />
    </div>
  )
}
