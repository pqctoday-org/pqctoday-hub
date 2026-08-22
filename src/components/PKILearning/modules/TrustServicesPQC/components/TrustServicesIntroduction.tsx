// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  FileSignature,
  Clock,
  Archive,
  GitCompareArrows,
  BadgeCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import {
  SUPERSESSION_PAIRS,
  HYBRID_RULE,
  HYBRID_SUITES,
  TIMESTAMP_FACTS,
  LTV_STAGES,
  ARCHIVAL_WARNING,
} from '../data/trustServicesData'

interface Props {
  onNavigateToWorkshop: () => void
}

export const TrustServicesIntroduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  useActiveLearnPath()

  return (
    <div className="w-full space-y-6">
      <LearnSection
        sectionId="qualified-signatures"
        title="1. Qualified vs Advanced Signatures"
        icon={<FileSignature size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          Under eIDAS, an <strong className="text-foreground">advanced</strong> electronic signature
          is uniquely linked to its signatory and detects later changes to the data. A{' '}
          <strong className="text-foreground">qualified</strong> signature adds two things: it is
          created with a qualified signature creation device, and it rests on a certificate issued
          by a qualified trust service provider. Only the qualified form carries automatic legal
          equivalence to a handwritten signature across the Union.
        </p>
        <p className="text-muted-foreground">
          That legal equivalence is why this module exists. Once a signature has legal weight, the
          question stops being &ldquo;is this cryptographically valid today&rdquo; and becomes
          &ldquo;can a court establish that it was valid when it was made&rdquo; — potentially
          decades later.
        </p>
        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Scope note.</strong> Wallet activation, PID issuance
            and the eIDAS 2.0 wallet flows are covered in{' '}
            <Link to="/learn/digital-id" className="text-primary hover:underline">
              Digital ID
            </Link>
            ; CMS and S/MIME signing mechanics in{' '}
            <Link to="/learn/email-signing" className="text-primary hover:underline">
              Email &amp; Document Signing
            </Link>
            ; certificate chain fundamentals in{' '}
            <Link to="/learn/pki-workshop" className="text-primary hover:underline">
              PKI
            </Link>
            . This module deliberately does not repeat them — it covers what happens to a signature
            over time, which none of them cover.
          </p>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="timestamping"
        title="2. Timestamping & Proof of Existence"
        icon={<Clock size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">{TIMESTAMP_FACTS.whyItMatters}</p>
        <dl className="space-y-2 text-sm">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Protocol</dt>
            <dd className="mt-0.5 text-foreground">{TIMESTAMP_FACTS.protocol}</dd>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              European profile
            </dt>
            <dd className="mt-0.5 text-foreground">{TIMESTAMP_FACTS.profile}</dd>
          </div>
        </dl>
        <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              The agility that was designed in by accident.
            </strong>{' '}
            {TIMESTAMP_FACTS.agilityPoint}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{TIMESTAMP_FACTS.updateDue}</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            to="/library?ref=RFC-3161-Internet-X-509-Public-Key-Infrastructure-Time-Stamp"
            className="text-primary hover:underline"
          >
            RFC 3161
          </Link>
          <Link
            to="/library?ref=ETSI-EN-319-422-V1-1-1-Time-stamping-protocol-and-time-stamp"
            className="text-primary hover:underline"
          >
            ETSI EN 319 422
          </Link>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="long-term-validation"
        title="3. Long-Term Validation & Archival"
        icon={<Archive size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          A signature does not fail all at once. It degrades in stages, and each stage has a
          different remedy that must be in place <em>before</em> the stage arrives.
        </p>
        <ol className="space-y-3">
          {LTV_STAGES.map((s, i) => (
            <li key={s.id} className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold inline-flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-semibold text-foreground">{s.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground">
                  {s.horizon}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong className="text-foreground">Risk:</strong> {s.risk}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong className="text-foreground">Remedy:</strong> {s.action}
              </p>
            </li>
          ))}
        </ol>
        <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
          <p className="text-sm">
            <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5 text-status-warning" />
            {ARCHIVAL_WARNING}
          </p>
        </div>
        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Model a signature&rsquo;s lifetime in the Workshop{' '}
          <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <LearnSection
        sectionId="suites-evolving"
        title="4. Cryptographic Suites, Evolving"
        icon={<GitCompareArrows size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Crypto agility is usually argued from principle. In this area it can be argued from
          documents: the same standard, by the same committee, before and after post-quantum
          algorithms existed.
        </p>
        {SUPERSESSION_PAIRS.map((p) => (
          <div key={p.family} className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
            <h4 className="font-semibold text-foreground">{p.family}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {p.older.label} · {p.older.date}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.older.algorithms}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {p.newer.label} · {p.newer.date}
                </p>
                <p className="mt-1 text-sm text-foreground">{p.newer.algorithms}</p>
                {p.newer.libraryRef && (
                  <Link
                    to={`/library?ref=${encodeURIComponent(p.newer.libraryRef)}`}
                    className="mt-1 inline-block text-xs text-primary hover:underline"
                  >
                    Open the current edition
                  </Link>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{p.lesson}</p>
          </div>
        ))}

        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
          <h4 className="font-semibold text-foreground">Hybrid signatures, the European rule</h4>
          <p className="text-sm text-muted-foreground">{HYBRID_RULE.requirement}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Classical component
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    PQC component
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Use case</th>
                </tr>
              </thead>
              <tbody>
                {HYBRID_SUITES.map((h) => (
                  <tr key={`${h.classical}-${h.pqc}`} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted-foreground">{h.classical}</td>
                    <td className="py-2 pr-4 font-mono text-foreground">{h.pqc}</td>
                    <td className="py-2 text-muted-foreground">{h.useCase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            ETSI TS 119 312 V2.1.1, Table 3.3 (algorithm-level hybrid combinations).
          </p>
          <div className="p-3 rounded-lg bg-status-info/10 border border-status-info/30">
            <p className="text-sm text-muted-foreground">
              {HYBRID_RULE.contrast} See{' '}
              <Link to="/learn/government-defense-pqc" className="text-primary hover:underline">
                Government &amp; Defense PQC
              </Link>{' '}
              for the other position, and{' '}
              <Link to="/learn/hybrid-crypto" className="text-primary hover:underline">
                Hybrid Cryptography
              </Link>{' '}
              for the constructions themselves.
            </p>
          </div>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="trust-providers"
        title="5. Trust Service Providers & Conformity"
        icon={<BadgeCheck size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          A qualified trust service provider is not simply a CA with good intentions — it is an
          audited entity on a national trusted list, assessed against the ETSI EN 319 4xx series.
          That audit relationship is what makes a migration in this sector slow: changing signing
          algorithms means re-establishing conformity, not just deploying software.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link to="/library?ref=ETSI-EN-319-411" className="text-primary hover:underline">
            ETSI EN 319 411-1 (policy requirements for TSPs)
          </Link>
          <Link to="/library?ref=eIDAS-2-Regulation" className="text-primary hover:underline">
            eIDAS 2.0 (EU 2024/1183)
          </Link>
          {/* ADDED 2026-08-22, then CORRECTED the same day. The first wording said
              "superseded by eIDAS 2.0", which is wrong: Regulation (EU) 2024/1183 is titled
              "amending Regulation (EU) No 910/2014" and amends it article by article. Every
              "repealing" in its text names a DIFFERENT instrument. 910/2014 is still the
              operative regulation, in its amended form — which is exactly why a reader needs
              the relationship spelled out rather than a one-word verdict either way. */}
          <Link to="/library?ref=EIDAS-REG-910-2014" className="text-primary hover:underline">
            eIDAS 1.0 (EU 910/2014) &mdash; as amended by eIDAS 2.0
          </Link>
          <Link to="/library?ref=CSC-API-v2-Spec" className="text-primary hover:underline">
            Cloud Signature Consortium API v2.2
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          The practical sequence for a TSP is therefore: the suites document gains PQC modes (done —
          TS 119 312 V2.1.1), the timestamp and policy standards are updated to match (EN 319 422
          replacement targeted for 2027), conformity assessment schemes absorb the change, and only
          then can a qualified service issue post-quantum signatures under audit. Each step gates
          the next.
        </p>
      </LearnSection>

      <ReadingCompleteButton />
    </div>
  )
}
