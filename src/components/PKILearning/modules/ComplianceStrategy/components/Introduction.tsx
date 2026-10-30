// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  Scale,
  Globe,
  CheckSquare,
  CalendarRange,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  Building2,
  MapPin,
  Lock,
  Landmark,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Landscape + Key Frameworks ──────────────────────────────────────

const Step1LandscapeAndFrameworks: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 1: The PQC Compliance Landscape */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Scale size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The PQC Compliance Landscape</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Governments and standards bodies worldwide are establishing requirements for the
          transition to{' '}
          <InlineTooltip term="Post-Quantum Cryptography">post-quantum cryptography</InlineTooltip>.
          For organizations operating across borders, navigating these overlapping and sometimes
          conflicting requirements is a critical challenge.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <blockquote className="text-sm italic text-foreground/90">
            &ldquo;A quantum computer of sufficient size and sophistication &mdash; also known as a
            cryptanalytically relevant quantum computer &mdash; will be capable of breaking much of
            the public-key cryptography used on digital systems across the United States and around
            the world.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2">
            &mdash; Executive Order 14306, Sustaining Select Efforts to Strengthen the Nation&apos;s
            Cybersecurity (June 6, 2025)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Regulatory Push</div>
            <p className="text-xs text-muted-foreground">
              NIST, NSA, ETSI, <InlineTooltip term="ANSSI">ANSSI</InlineTooltip>, and{' '}
              <InlineTooltip term="BSI">BSI</InlineTooltip> are all publishing PQC transition
              guidance with concrete deadlines.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Industry Standards</div>
            <p className="text-xs text-muted-foreground">
              Some sector frameworks now mention quantum computing. The 2025 HHS proposal to update
              the HIPAA Security Rule would expect a regulated entity, as part of its risk analysis,
              to consider whether quantum computing poses a reasonably anticipated threat to the
              confidentiality, integrity, or availability of its ePHI, and PCI SSC&apos;s May 2026
              announcement of PTS HSM v5.0 says that update addresses emerging threats such as
              post-quantum risks.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Cross-Border Complexity</div>
            <p className="text-xs text-muted-foreground">
              Organizations operating in multiple jurisdictions must reconcile different algorithm
              preferences, timelines, and certification requirements.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section 2: Key Frameworks */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <ShieldCheck size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Key Frameworks</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Understanding the major compliance frameworks driving PQC adoption is essential for
          building a multi-jurisdiction strategy.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-primary" />
              <div className="text-sm font-bold text-foreground">
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (NSA)
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The Commercial National Security Algorithm Suite 2.0 mandates PQC adoption for
              National Security Systems. Key deadlines: software/firmware signing preferred by 2025,
              exclusive by 2030 (with traditional networking); operating-system support by 2027;
              web/cloud/servers and operating systems by 2033 (NSM-10 targets all NSS
              quantum-resistant by 2035). Requires{' '}
              <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>
              -1024 (FIPS&nbsp;203) and <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip>-87
              (FIPS&nbsp;204) as minimum security levels.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-primary" />
              <div className="text-sm font-bold text-foreground">
                <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              NIST&apos;s transition guidance for post-quantum cryptography standards (final,
              October 2026; it replaced the November 2024 draft). Deprecates RSA, ECC, and other
              quantum-vulnerable public-key algorithms after 2030 and disallows them under NIST
              standards and guidelines after 2035. Emphasizes cryptographic agility and hybrid
              approaches during the transition period.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={16} className="text-secondary" />
              <div className="text-sm font-bold text-foreground">ETSI / ANSSI / BSI</div>
            </div>
            <p className="text-xs text-muted-foreground">
              European bodies have published PQC migration guidance. ANSSI recommends hybrid
              cryptography combining classical and PQC algorithms, and makes it mandatory inside the
              French regulated perimeter (classified and Diffusion Restreinte data, vital
              information systems, ANSSI-certified or qualified products). BSI&apos;s TR-02102-1
              currently recommends PQC in hybrid form, except that hash-based signatures may in
              principle be used alone, provided their implementation security is carefully
              considered, and endorses ML-KEM (FIPS&nbsp;203) and ML-DSA (FIPS&nbsp;204) with
              specific parameter recommendations. ETSI provides interoperability guidance for hybrid
              key exchanges.
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-secondary/30 mt-4">
          <div className="text-sm font-bold text-foreground mb-2">
            Hybrid or Pure PQC: It Depends on the Authority and the System
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Authorities do not agree on hybrid deployment, and the answer depends on which systems
            are in scope. ANSSI makes hybrid mandatory inside the French regulated perimeter and
            recommends it everywhere else, except that it does not recommend systematic
            hybridisation for hash-based signatures (SLH-DSA, XMSS, LMS). BSI&apos;s TR-02102-1
            currently recommends PQC in hybrid form, except that hash-based signatures may in
            principle be used alone, provided their implementation security is carefully considered.
            ETSI TS 119 312 specifies hybrid signatures for trust services. NSA does not require
            hybrids for National Security Systems: CNSA 2.0 sets pure ML-KEM-1024 and ML-DSA-87 as
            the end state, and counts only the hybrids it has specifically identified. Many programs
            therefore deploy <strong>hybrid</strong> now and plan <strong>pure PQC</strong> later,
            but that is a common migration pattern, not a rule every framework imposes.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Planning rule of thumb:</strong> Start hybrid deployments now. Plan your
            transition to pure PQC to meet your earliest jurisdiction deadline &mdash; which you
            will identify in the Jurisdiction Mapper workshop below.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: Compliance-First vs Risk + Major Deadlines ──────────────────────

const Step2ApproachAndDeadlines: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 3: Compliance vs Risk Approach */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <AlertTriangle size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Compliance-First vs Risk-First</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Organizations typically approach PQC migration from one of two angles. The optimal
          strategy often combines both, using compliance deadlines as hard constraints and risk
          scoring to prioritize within those constraints.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-2">Compliance-First Approach</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Driven by regulatory deadlines and audit requirements</li>
              <li>&bull; Prioritizes systems under regulatory scope first</li>
              <li>&bull; Clear, external-driven milestones</li>
              <li>&bull; Risk: may miss high-risk systems outside compliance scope</li>
              <li>&bull; Best for: regulated industries (finance, government, healthcare)</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-2">Risk-First Approach</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>&bull; Driven by data sensitivity and exposure windows</li>
              <li>&bull; Prioritizes highest-risk assets regardless of regulatory scope</li>
              <li>
                &bull; Addresses <InlineTooltip term="HNDL">HNDL</InlineTooltip> threats early
              </li>
              <li>&bull; Risk: may not satisfy auditors without compliance mapping</li>
              <li>&bull; Best for: technology companies, defense, intelligence</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Section 4: Compliance Deadline Timeline */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <CalendarRange size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Major Compliance Deadlines</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Key deadlines are converging across jurisdictions, creating a narrow window for
          organizations to complete their PQC migration.
        </p>
        <div className="space-y-2">
          {[
            {
              year: '2024',
              event:
                'NIST IR 8547 initial public draft published — PQC transition guidance (final version published October 2026)',
              source: 'NIST',
            },
            {
              year: '2025',
              event: 'CNSA 2.0 software/firmware signing preferred for NSS',
              source: 'NSA',
            },
            {
              year: '2026',
              event: 'CNSA 2.0 new networking equipment must support PQC',
              source: 'NSA',
            },
            {
              year: '2030',
              event:
                'CNSA 2.0 software/firmware signing exclusive; legacy networking replaced; NIST RSA/ECC deprecated',
              source: 'NSA/NIST',
            },
            {
              year: '2030',
              event:
                'ANSSI Phase 3 begins — standalone PQC optional; may become mandatory for long-term security products',
              source: 'ANSSI',
            },
            {
              year: '2031',
              event:
                'CNSA 2.0 algorithms mandated for NSS unless otherwise noted (FAQ version 2.2); NSM-10 separately targets broader quantum-risk reduction by 2035',
              source: 'NSA',
            },
            {
              year: '2030',
              event:
                'EO 14412 — federal civilian HVAs and high-impact systems on PQC for key establishment (ML-KEM); a directed FAR rule would require covered contractors to comply with NIST’s FIPS by 31 Dec 2030',
              source: 'EO 14412',
            },
            {
              year: '2031',
              event: 'EO 14412 — the same systems on PQC for digital signatures',
              source: 'EO 14412',
            },
            {
              year: '2035',
              event: 'NIST RSA/ECC disallowed entirely (NIST IR 8547)',
              source: 'NIST',
            },
          ].map((item) => (
            <div
              key={`${item.year}-${item.event}`}
              className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
            >
              <span className="text-sm font-bold text-primary shrink-0 w-12 text-center">
                {item.year}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{item.event}</div>
                <p className="text-xs text-muted-foreground">{item.source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 3: Country Deadlines + Dependencies + Workshop + Resources + CTA ────

const Step3CountriesAndWorkshop: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
    {/* Section 5: Country-Specific Deadlines */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <MapPin size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Country-Specific Deadlines</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Individual countries are setting their own PQC transition deadlines, and they do not line
          up. Organizations operating internationally must track every jurisdiction they touch — the
          binding date is the earliest one, not the average.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">Country</th>
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">Agency</th>
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">
                  Key Deadline
                </th>
                <th className="text-left py-2 px-2 font-bold text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">United States</td>
                <td className="py-2 px-2">EOP / OMB / NSA</td>
                <td className="py-2 px-2 font-mono text-primary">2030</td>
                <td className="py-2 px-2">
                  Two parallel clocks.{' '}
                  <strong>Federal agencies, excluding National Security Systems</strong>: EO 14412
                  (22 June 2026) requires High Value Assets and high-impact systems to use PQC for
                  key establishment by 31 December 2030 and for digital signatures by 31 December
                  2031, implemented by OMB M-26-15; it also directs a proposed FAR rule that would
                  require covered contractors to comply with NIST&rsquo;s FIPS by 31 December 2030.{' '}
                  <strong>National security systems</strong>: CNSA 2.0 — software/firmware signing
                  and traditional networking exclusive by 2030; web browsers/servers, cloud and
                  operating systems by 2033; NSS transition complete by 2035 per NSM-10.
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Australia</td>
                <td className="py-2 px-2">ASD</td>
                <td className="py-2 px-2 font-mono text-primary">2030</td>
                <td className="py-2 px-2">
                  ASD recommends ceasing the use of traditional asymmetric cryptography (RSA, DH,
                  ECDH, ECDSA) by the end of 2030; the ISM states these algorithms &ldquo;will not
                  be approved beyond 2030&rdquo;. ASD&apos;s milestones: by end of 2026
                  organisations should have a refined transition plan; by end of 2028 they should
                  have commenced the transition, starting with critical systems and data; by end of
                  2030 they should have completed it.
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Canada</td>
                <td className="py-2 px-2">CCCS</td>
                <td className="py-2 px-2 font-mono text-primary">2026</td>
                <td className="py-2 px-2">
                  Federal departments submit PQC migration plans by April 2026; high-priority
                  systems by 2031; full transition by 2035
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">United Kingdom</td>
                <td className="py-2 px-2">NCSC</td>
                <td className="py-2 px-2 font-mono text-primary">2028</td>
                <td className="py-2 px-2">
                  Three-phase roadmap: discovery (2025&ndash;2028), priority migration
                  (2028&ndash;2031), full migration (2031&ndash;2035)
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Czech Republic</td>
                <td className="py-2 px-2">NUKIB</td>
                <td className="py-2 px-2 font-mono text-primary">2027</td>
                <td className="py-2 px-2">
                  First EU member state to set a specific encryption migration deadline &mdash;
                  ahead of the broader EU coordinated roadmap
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">European Union</td>
                <td className="py-2 px-2">EC</td>
                <td className="py-2 px-2 font-mono text-primary">2030</td>
                <td className="py-2 px-2">
                  Coordinated Implementation Roadmap (v1.1, June 2025): high-risk systems by 2030,
                  full transition by 2035 &mdash; aligned with NIST timelines
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Israel</td>
                <td className="py-2 px-2">INCD</td>
                <td className="py-2 px-2 font-mono text-primary">&mdash;</td>
                <td className="py-2 px-2">
                  No PQC deadline found: the INCD cybersecurity strategy document we hold does not
                  mention quantum
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Taiwan</td>
                <td className="py-2 px-2">NICS</td>
                <td className="py-2 px-2 font-mono text-primary">2027</td>
                <td className="py-2 px-2">
                  PQC migration target for critical semiconductor and technology sectors
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Singapore</td>
                <td className="py-2 px-2">MAS</td>
                <td className="py-2 px-2 font-mono text-primary">Guidance</td>
                <td className="py-2 px-2">
                  Monetary Authority of Singapore issued PQC readiness guidance (February 2024)
                  directing financial institutions to begin cryptographic inventory and migration
                  planning. No hard mandate yet; best-practice alignment with NIST standards
                  expected. Particularly relevant for financial sector organizations.
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-medium text-foreground">Germany</td>
                <td className="py-2 px-2">BSI/DLR</td>
                <td className="py-2 px-2 font-mono text-primary">2030</td>
                <td className="py-2 px-2">
                  QUANTITY initiative (March 2025) for quantum cryptanalysis; critical applications
                  PQC-protected by end of 2030
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-medium text-foreground">G7</td>
                <td className="py-2 px-2">CEG</td>
                <td className="py-2 px-2 font-mono text-primary">2035</td>
                <td className="py-2 px-2">
                  Cyber Expert Group (January 2026): a roadmap for the financial sector that does
                  not prescribe fixed timelines; guidance from several jurisdictions often points to
                  2035 as an overall target date, and the period 2030&ndash;32 reflects the
                  approaches G7 jurisdictions envisage for migrating critical systems
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Key takeaway:</strong> Organizations must meet the{' '}
            <em>earliest</em> deadline across all jurisdictions where they operate. A
            multi-jurisdiction organisation can plan to the earliest date that applies to it. ASD
            recommends ceasing the use of traditional asymmetric cryptography by the end of 2030;
            the EU roadmap recommends that high-risk use cases be transitioned as soon as possible
            and no later than the end of 2030, and that the transition be completed for as many
            systems as practically feasible by 2035.
          </p>
        </div>
      </div>
    </section>

    {/* Section 6: Compliance Dependencies */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Lock size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Compliance Dependencies</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Several cross-cutting compliance requirements affect PQC migration timelines regardless of
          jurisdiction.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> &amp;{' '}
              <InlineTooltip term="CMVP">CMVP</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              The Cryptographic Module Validation Program certifies cryptographic implementations
              for government use. PQC algorithm implementations (FIPS 203/204/205) must undergo CMVP
              validation before deployment in federal systems. These are separate assurance
              programs, not points on one scale. CAVP validates an algorithm implementation. CMVP
              validates a cryptographic module (FIPS 140-3), and a module &ldquo;in process&rdquo;
              is not yet validated. &ldquo;FIPS mode&rdquo; is a vendor configuration claim unless a
              CMVP certificate covers that exact module and version. FedRAMP authorizes a cloud
              service, and WebTrust audits a certificate authority; neither validates cryptography.
              This certification backlog is a key dependency in migration timelines.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="eIDAS">eIDAS 2.0</InlineTooltip> (EU Digital Identity)
            </div>
            <p className="text-xs text-muted-foreground">
              The updated EU regulation for electronic identification requires each Member State to
              provide at least one European Digital Identity (EUDI) wallet within 24 months of the
              entry into force of the wallet implementing acts (Implementing Regulation (EU)
              2024/2981 was published on 4 December 2024). The regulation text and the EUDI Wallet
              architecture and reference framework (ARF) we checked do not mention quantum
              computing; the SD-JWT standard (RFC 9901) leaves the choice of signature algorithm to
              the application, including post-quantum algorithms &ldquo;when they are ready&rdquo;.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              Executive Order 14306 &amp; CISA PQC Product Guidance
            </div>
            <p className="text-xs text-muted-foreground">
              EO 14306 (June 6, 2025) &mdash; &ldquo;Sustaining Select Efforts to Strengthen the
              Nation&apos;s Cybersecurity&rdquo; &mdash; directs CISA, in consultation with NSA, to
              publish and maintain a list of product categories in which PQC-capable products are
              widely available (initial list due December 1, 2025). CISA subsequently issued
              advisory procurement guidance recommending that agencies acquire PQC capabilities in
              new federal product and service acquisitions (EO 14306 removed EO 14144&apos;s binding
              solicitation requirement), encouraging market demand for PQC-capable solutions.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              Executive Order 14412 &amp; OMB M-26-15 &mdash; the binding federal civilian mandate
            </div>
            <p className="text-xs text-muted-foreground">
              EO 14412 (signed June 22, 2026) &mdash; &ldquo;Securing the Nation Against Advanced
              Cryptographic Attacks&rdquo; &mdash; is the order that actually sets dates. Federal
              agencies&rsquo; High Value Assets and high-impact systems (National Security Systems
              excluded) must use PQC for <strong>key establishment by December 31, 2030</strong> and
              for <strong>digital signatures by December 31, 2031</strong>. The function split is
              deliberate: key establishment carries harvest-now-decrypt-later exposure, so it moves
              first. It further directs the FAR Council to publish a proposed rule (due 19 December
              2026, 180 days after EO 14412) that would require covered contractors to comply by 31
              December 2030 with NIST&rsquo;s FIPS, including all applicable FIPS incorporating
              PQC-compliant algorithms; the order directs that proposed rule, it is not itself the
              rule. It also directs CISA guidance on minimum{' '}
              <InlineTooltip term="CBOM">CBOM</InlineTooltip> elements (due 19 March 2027, 270 days
              after EO 14412). OMB Memorandum M-26-15 (June 24, 2026) is the implementing guidance:
              a five-phase agency schedule and PQC migration plans filed with OMB. National security
              systems are out of scope &mdash; they remain under CNSA 2.0.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="DORA">DORA</InlineTooltip> (EU Digital Operational Resilience)
            </div>
            <p className="text-xs text-muted-foreground">
              The EU&apos;s Digital Operational Resilience Act (enforcement January 2025) requires
              financial institutions to implement robust ICT risk management including cryptographic
              controls. While not PQC-specific yet, organizations subject to DORA must demonstrate
              encryption resilience planning that will inevitably encompass quantum threats.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              <InlineTooltip term="CBOM">CBOM</InlineTooltip> (Cryptographic Bill of Materials)
            </div>
            <p className="text-xs text-muted-foreground">
              A CBOM is your foundational compliance artifact &mdash; you cannot migrate what you
              haven&apos;t inventoried, and in most organizations the inventory does not yet exist
              in any auditable form. EO 14412 puts a date on it: CISA guidance on the minimum
              elements of a CBOM is due 19 March 2027, 270 days after the order, to enable automated
              assessment of cryptographic assets. For the full CBOM framework, including CycloneDX
              format requirements and vendor contract language, see{' '}
              <Link to="/learn/vendor-risk" className="text-primary hover:underline">
                Vendor &amp; Supply Chain Risk
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-status-warning/20">
          <p className="text-xs text-muted-foreground">
            <AlertTriangle size={12} className="inline text-status-warning mr-1" />
            <strong className="text-foreground">Industry finding:</strong> most financial-sector
            organisations report being unprepared for post-quantum cybersecurity (Europol&apos;s
            Quantum Safe Financial Forum, Call to Action, 2025).
          </p>
        </div>
      </div>
    </section>

    {/* Section 7: Workshop Preview */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <CheckSquare size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Workshop Overview</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          This workshop guides you through building a comprehensive compliance strategy in three
          steps:
        </p>
        <div className="space-y-2">
          {[
            {
              n: 1,
              t: 'Jurisdiction Mapper',
              d: 'Select your operating jurisdictions and see which frameworks, deadlines, and requirements apply. Identify conflicts between jurisdictions.',
              icon: Globe,
            },
            {
              n: 2,
              t: 'Audit Readiness Checklist',
              d: 'Build a comprehensive audit readiness checklist covering cryptographic inventory, policy, technical controls, vendor management, and documentation.',
              icon: CheckSquare,
            },
            {
              n: 3,
              t: 'Compliance Timeline Builder',
              d: 'Overlay regulatory deadlines with your migration milestones. Identify gaps and build a timeline to close them.',
              icon: CalendarRange,
            },
          ].map((step) => {
            const Icon = step.icon
            return (
              <div key={step.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <div className="p-1.5 rounded bg-primary/10 shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Step {step.n}: {step.t}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.d}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>

    {/* Related Resources */}
    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/compliance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <BookOpen size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
            <div className="text-xs text-muted-foreground">
              NIST, ANSSI, BSI, and Common Criteria compliance data
            </div>
          </div>
        </Link>
        <Link
          to="/assess"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ClipboardCheck size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Risk Assessment</div>
            <div className="text-xs text-muted-foreground">
              Run a guided PQC readiness assessment
            </div>
          </div>
        </Link>
        <Link
          to="/timeline"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <CalendarRange size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Timeline</div>
            <div className="text-xs text-muted-foreground">
              Country-by-country regulatory timeline explorer
            </div>
          </div>
        </Link>
        <Link
          to="/learn/pqc-governance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Building2 size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Governance &amp; Policy</div>
            <div className="text-xs text-muted-foreground">
              RACI matrices, policies, and board reporting
            </div>
          </div>
        </Link>
        <Link
          to="/learn/standards-bodies"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Landmark size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Standards Bodies</div>
            <div className="text-xs text-muted-foreground">
              Who creates PQC standards, certifies products &amp; mandates compliance
            </div>
          </div>
        </Link>
      </div>
    </section>

    {/* CTA */}
    <div className="text-center">
      <Button variant="gradient" size="lg" onClick={onNavigateToWorkshop}>
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Map jurisdictions, build audit checklists, and construct compliance timelines.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      id: 'frameworks',
      label: 'Compliance Landscape',
      content: <Step1LandscapeAndFrameworks />,
    },
    {
      id: 'jurisdiction',
      label: 'Compliance vs Risk',
      content: <Step2ApproachAndDeadlines />,
    },
    {
      id: 'audit',
      label: 'Deadlines & Workshop',
      content: <Step3CountriesAndWorkshop onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
