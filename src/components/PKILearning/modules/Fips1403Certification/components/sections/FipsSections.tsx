// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: FIPS author
/* eslint-disable security/detect-object-injection -- keys are typed unions (Tone, LevelChoice, AnchorComponentId, decision keys) from fipsData */
/**
 * Path A — FIPS 140-3 and the CMVP (plan r2 §5 A1–A5, A7, §5.7.1). One named
 * export per Learn-section id; CertIntroduction wraps each in <LearnSection>,
 * so these render the section BODY only.
 *
 * Sources: every library citation goes through getStandard() (throws on an
 * unknown id at import). Documents with no library row — the individual CMVP
 * certificate pages and the four public Security Policies — are linked
 * directly and named in plain text. No ISO/IEC 19790 / 24759 text is quoted
 * (licence-gated, build spec §6.3): per-area levels are taught from the
 * Security Policies' own tables.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowDown,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Info,
  XCircle,
} from 'lucide-react'
import { getStandard, type StandardRef } from '@/data/standardsRegistry'
import { readCmvpDetails, type CmvpDetails } from '@/components/Compliance/cmvpDetails'
import { fetchComplianceMeta } from '@/components/Compliance/complianceDataLoader'
import type { ComplianceRecord } from '@/components/Compliance/types'
import { ModuleAnalysisNote } from '@/components/PKILearning/common/ModuleAnalysisNote'
import {
  CMVP_MIP_LIST_URL,
  CMVP_ROUTES,
  CMVP_SEARCH_URL,
  FIPS_AS_OF_LABEL,
  IG_TOPICS,
  MIP_STATES,
  MISTAGGED_LEVEL3_CERTS,
  SECURITY_POLICY_PROFILES,
  SP_LEVEL_ROWS,
  VERIFIED_PQC_LEVEL3_CERTS,
  cmvpCertificateUrl,
  cmvpSecurityPolicyUrl,
  type AreaLevel,
} from '../../data/fipsData'

// ── Library citations (resolved at import; an unknown id fails the build) ──
const FIPS_140_3 = getStandard('FIPS-140-3-STANDARD')
const MGMT_MANUAL = getStandard('CMVP-MGMT-MANUAL')
const IG = getStandard('NIST-FIPS140-3-IG-PQC')
const MIP_LIST = getStandard('NIST-CMVP-MIP-List')
const VALIDATED_MODULES = getStandard('NIST-CMVP-Validated-Modules')
const TRANSITION = getStandard('NIST-CMVP-140-2-to-140-3-Transition-Timeline')
const PROGRAMMATIC_TRANSITIONS = getStandard('NIST-CMVP-Programmatic-Transitions')
const EO_14412 = getStandard('EO-2026-06-22-Securing-the-Nation')
const SP_800_140 = getStandard('NIST-SP-800-140')
const SP_800_140A = getStandard('NIST-SP-800-140A')
const SP_800_140B = getStandard('NIST-SP-800-140B')
const SP_800_140C = getStandard('NIST-SP-800-140C')
const SP_800_140D = getStandard('NIST-SP-800-140D')
const SP_800_140E = getStandard('NIST-SP-800-140E')
const SP_800_140F = getStandard('NIST-SP-800-140F')
const ACVP = getStandard('NIST-ACVP')
const ESV = getStandard('NIST-CMVP-ESV')
const SP_1800_40B = getStandard('NIST-SP-1800-40B-IPD')
const SP_1800_40A = getStandard('NIST-SP-1800-40A-PD')
const CSWP_37A = getStandard('NIST-CSWP-37A')
const CSWP_37B = getStandard('NIST-CSWP-37B-Automation-of-the-NIST-Cryptographic-Module-Va')
const CAVP = getStandard('NIST-Cryptographic-Algorithm-Validation-Program-CAVP')
const ESV_PROGRAM = getStandard('NIST-CMVP-ESV-Program')
const ESV_ANNOUNCEMENTS = getStandard('NIST-CMVP-ESV-Announcements')
const MIS = getStandard('NIST-CMVP-MIS-SP800-140B')
const AMVP = getStandard('NIST-ACMVP-Protocol-Workstream')
const NCCOE_CMVP = getStandard('NCCoE-Automation-of-the-CMVP')
const PCI_LISTING = getStandard('PCI-PTS-Listing-Field-Definitions')
const CMVP_STANDARDS_PAGE = getStandard('NIST-CMVP-FIPS-140-3-Standards-page')
const ISO_19790_2025 = getStandard('ISO-IEC-19790-2025')
const ISO_24759_2025 = getStandard('ISO-IEC-24759-2025-Test-requirements-for-cryptographic-modul')
const PQC_SEMINAR_FAULT = getStandard('NIST-PQC-Seminar-FaultInjection-Lattice')
const PROACT_SCA = getStandard('PROACT-2025-SCA-Lattice-PQC')
const CC_PART3 = getStandard('CC-2022-PART3')
const HSM_PP_INTERPRETATION = getStandard('ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation')
const CC_CONTINUITY_SCENARIOS = getStandard('ENISA-EUCC-Assurance-Continuity-Change-Scenarios')

// ── Small presentational helpers ────────────────────────────────────────────

const Cite = ({ std, children }: { std: StandardRef; children?: ReactNode }) => (
  <Link
    to={std.deepLink}
    className="text-primary underline"
    title={`Open ${std.title} in the library`}
  >
    {children ?? std.id}
  </Link>
)

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-0.5 text-primary underline"
  >
    {children}
    <ExternalLink size={11} aria-hidden="true" className="shrink-0" />
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
)

/** A certificate number: opens the hub's record, with NIST's own page as a secondary link. */
const CertLink = ({ cert }: { cert: string }) => (
  <span className="inline-flex items-center gap-1">
    <Link
      to={`/compliance?cert=${encodeURIComponent(cert)}`}
      className="text-primary underline"
      title={`Open certificate #${cert} in the hub's compliance records`}
    >
      #{cert}
    </Link>
    <Ext href={cmvpCertificateUrl(cert)}>
      <span className="sr-only">NIST certificate page for #{cert}</span>
    </Ext>
  </span>
)

const AsOf = () => (
  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
    <CalendarClock size={11} aria-hidden="true" /> as of {FIPS_AS_OF_LABEL}
  </span>
)

type Tone = 'info' | 'warning' | 'success' | 'error'

const TONE_CLASS: Readonly<Record<Tone, string>> = {
  info: 'border-primary/20 bg-primary/5',
  warning: 'border-status-warning/30 bg-status-warning/10',
  success: 'border-status-success/30 bg-status-success/10',
  error: 'border-status-error/30 bg-status-error/10',
}

const Callout = ({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone
  title: string
  children: ReactNode
}) => (
  <div className={`rounded-lg border p-4 ${TONE_CLASS[tone]}`}>
    <p className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
      {tone === 'warning' || tone === 'error' ? (
        <AlertTriangle size={15} className="shrink-0 text-status-warning" aria-hidden="true" />
      ) : (
        <Info size={15} className="shrink-0 text-primary" aria-hidden="true" />
      )}
      {title}
    </p>
    <div className="space-y-2 text-xs text-muted-foreground">{children}</div>
  </div>
)

const SubHeading = ({ children }: { children: ReactNode }) => (
  <h3 className="pt-2 text-base font-bold text-foreground">{children}</h3>
)

const ClaimRow = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
  <li className="flex items-start gap-2">
    {ok ? (
      <CheckCircle2
        size={14}
        className="mt-0.5 shrink-0 text-status-success"
        aria-label="Allowed"
      />
    ) : (
      <XCircle size={14} className="mt-0.5 shrink-0 text-status-error" aria-label="Not allowed" />
    )}
    <span>{children}</span>
  </li>
)

const Body = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4 text-sm text-foreground/80">{children}</div>
)

// ── fips-what-it-is ─────────────────────────────────────────────────────────

const DOCUMENT_STACK: readonly { doc: ReactNode; job: string; current: string }[] = [
  {
    doc: <Cite std={FIPS_140_3}>FIPS 140-3</Cite>,
    job: 'The standard. Names the eleven areas and the four levels, and points to the ISO documents.',
    current: 'Approved 22 March 2019; unchanged',
  },
  {
    doc: <>ISO/IEC 19790:2012 (Cor.1:2015) and ISO/IEC 24759:2017</>,
    job: 'The security requirements (19790) and the test requirements (24759). Paid documents.',
    current: 'The editions FIPS 140-3 names; the CMVP’s standards page lists no 2025 edition',
  },
  {
    doc: (
      <>
        <Cite std={SP_800_140}>SP 800-140</Cite>, <Cite std={SP_800_140A}>A</Cite>–
        <Cite std={SP_800_140F}>F</Cite>
      </>
    ),
    job: 'NIST’s modifications: test requirements, documentation (A), Security Policy format (B), approved security functions (C), key generation and establishment (D), authentication (E), non-invasive attack testing (F).',
    current: 'Per document',
  },
  {
    doc: <Cite std={IG}>Implementation Guidance (IG)</Cite>,
    job: 'How the CMVP interprets the requirements, section by section.',
    current: 'Last update 19 August 2026',
  },
  {
    doc: <Cite std={MGMT_MANUAL}>Management Manual</Cite>,
    job: 'How the programme runs: labs, submissions, queue states, revalidation routes.',
    current: 'v2.7, 9 April 2026',
  },
]

const CERT_ANATOMY: readonly { field: string; value: string; means: string }[] = [
  {
    field: 'Module Name / Standard',
    value: 'QASM Cryptographic Module · FIPS 140-3',
    means: 'The validated thing is a named module, not a company or a product line.',
  },
  {
    field: 'Status / Sunset Date',
    value: 'Active · 8/18/2031',
    means:
      'Validations expire. Full validations get five years, interim ones two (Manual §7.1.15).',
  },
  {
    field: 'Overall Level',
    value: '3',
    means: 'A summary of the per-area levels in the Security Policy (next section).',
  },
  {
    field: 'Caveat',
    value:
      'When installed, initialized and configured as specified in Section 11.1 of the Security Policy; No assurance of minimum security of SSPs … that are externally loaded …',
    means: 'The conditions of use. Outside them, you are not running the validated configuration.',
  },
  {
    field: 'Security Level Exceptions',
    value:
      'Operational environment: N/A · Non-invasive security: N/A · Mitigation of other attacks: N/A',
    means: 'Where an area is rated differently from the overall level.',
  },
  {
    field: 'Module Type / Embodiment',
    value: 'Hardware · MultiChipStand',
    means: 'What kind of module it is. Changing the embodiment later means a new validation.',
  },
  {
    field: 'Approved Algorithms',
    value: 'ML-KEM KeyGen A5631 · ML-DSA SigGen A5631 · SLH-DSA SigGen A5631 · …',
    means: 'Each approved function with its algorithm-validation (CAVP) reference.',
  },
  {
    field: 'Related Files / Validation History',
    value:
      'Security Policy · Consolidated Certificate · 8/19/2026 Initial, 8/21/2026 Update (atsec)',
    means: 'The Security Policy holds the rules; the history shows every revalidation and the lab.',
  },
]

/** Learn section `fips-what-it-is` */
export const FipsWhatItIs = () => (
  <Body>
    <p>
      <Cite std={FIPS_140_3}>FIPS 140-3</Cite>,{' '}
      <em>Security Requirements for Cryptographic Modules</em>, was approved on 22 March 2019, took
      effect on 22 September 2019 and replaced FIPS 140-2. It is “applicable to all Federal agencies
      that use cryptography-based security systems to protect sensitive information in computer and
      telecommunication systems”, and it “provides four increasing, qualitative levels of security”.
      Canada accepts the same validations for its federal agencies.
    </p>
    <p>
      The standard itself is short. Its §2 says FIPS 140-3 “is based on ISO/IEC
      19790:2012/Cor.1:2015(E) and ISO/IEC 24759:2017(E)”, and the SP 800-140 series lists what NIST
      supersedes or modifies. ISO published 2025 editions of both documents (
      <Cite std={ISO_19790_2025}>ISO/IEC 19790:2025</Cite> and{' '}
      <Cite std={ISO_24759_2025}>ISO/IEC 24759:2025</Cite>). Three statements have to be read
      together. FIPS 140-3 §3.1 says: “When referring to ISO/IEC 19790:2012(E) and ISO/IEC
      24759:2017(E), the latest edition of the referenced document (including any amendments)
      applies.” The CMVP’s <Cite std={CMVP_STANDARDS_PAGE}>FIPS 140-3 Standards page</Cite> still
      lists only the 19790:2012 and 24759:2017 editions, and the August 2026{' '}
      <Cite std={IG}>IG</Cite> still cites 19790:2012 throughout. Yet one IG note (IG 4.4.B) says
      the IG “is consistent with ISO/IEC 19790:2025”. The sources cited here contain no CMVP
      statement that adopts the 2025 editions or sets a transition date (checked 23 October 2026),
      so ask the laboratory which edition applies to a submission. Both ISO documents are paid, so
      this module does not reproduce them. It teaches from public NIST documents and real Security
      Policies instead.
    </p>

    <SubHeading>Five documents, five jobs</SubHeading>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs">
        <caption className="sr-only">The documents that make up FIPS 140-3 validation</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Document
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Job
            </th>
            <th scope="col" className="py-2 font-semibold">
              Current version
            </th>
          </tr>
        </thead>
        <tbody>
          {DOCUMENT_STACK.map((row) => (
            <tr key={row.current + row.job} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium text-foreground">{row.doc}</td>
              <td className="py-2 pr-3">{row.job}</td>
              <td className="py-2">{row.current}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-muted-foreground">
      Versions <AsOf />. The Manual and IG change several times a year; open the live documents
      before relying on a section number.
    </p>

    <SubHeading>Who does what</SubHeading>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        The <strong>CMVP</strong> is “a joint effort between the National Institute of Standards and
        Technology and the Canadian Centre for Cyber Security” (FIPS 140-3).
      </li>
      <li>
        <strong>Accredited CST laboratories</strong> test. Vendors “use independent, accredited
        Cryptographic and Security Testing (CST) laboratories to have their modules tested”.
      </li>
      <li>
        The <strong>vendor</strong> contracts the lab, supplies the module and documents, and fixes
        what the lab finds.
      </li>
      <li>
        The <strong>CMVP reviews</strong> the lab’s submission. If it passes, the validation
        authorities issue a certificate number (<Cite std={MGMT_MANUAL}>Manual</Cite> §4.1.1.6).
      </li>
    </ul>

    <SubHeading>What gets validated: a module, not a product</SubHeading>
    <p>
      A certificate covers a <strong>cryptographic module</strong>: a defined boundary, at named
      versions, in tested operational environments, used in its approved mode. Two real Security
      Policies show how narrow that can be:
    </p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        AWS-LC 3 (<CertLink cert="5314" />, software): “The cryptographic boundary is defined as … a
        cryptographic library consisting of the bcm.o file”. The application that links it is
        outside, and the computer is only the “Tested Operational Environment’s Physical Perimeter”.
      </li>
      <li>
        QASM (<CertLink cert="5497" />, HSM): the certificate covers the QASM module. The appliances
        it goes into add an x86 single-board computer running hardened Linux, which the Security
        Policy describes as a separate part of the product.
      </li>
    </ul>

    <SubHeading>Read a certificate, field by field</SubHeading>
    <p>
      The <Ext href={cmvpCertificateUrl('5497')}>certificate page for #5497</Ext> — one of the four
      Level 3 HSMs whose certificates approve ML-KEM and ML-DSA — reads like this <AsOf />:
    </p>
    <dl className="grid gap-2 sm:grid-cols-2">
      {CERT_ANATOMY.map((f) => (
        <div key={f.field} className="rounded-lg border border-border bg-muted/30 p-3">
          <dt className="text-xs font-semibold text-foreground">{f.field}</dt>
          <dd className="mt-1 font-mono text-[11px] text-foreground/90">{f.value}</dd>
          <dd className="mt-1 text-xs text-muted-foreground">{f.means}</dd>
        </div>
      ))}
    </dl>
    <p className="text-xs text-muted-foreground">
      A certificate snapshot for reading practice. Open the live page before quoting it: dates,
      versions and algorithms change with every revalidation.
    </p>
  </Body>
)

// ── fips-requirement-areas ──────────────────────────────────────────────────

const levelCell = (value: AreaLevel, overall: number): string =>
  value === 'N/A'
    ? 'text-muted-foreground'
    : value !== overall
      ? 'font-bold text-status-warning'
      : 'text-foreground'

/** Learn section `fips-requirement-areas` */
export const FipsRequirementAreas = () => (
  <Body>
    <p>
      FIPS 140-3 names eleven areas: cryptographic module specification; interfaces; roles,
      services, and authentication; software/firmware security; operating environment; physical
      security; non-invasive security; sensitive security parameter (SSP) management; self-tests;
      life-cycle assurance; and mitigation of other attacks. Security Policies call the fifth area
      “operational environment”.
    </p>
    <p>
      FIPS validation includes requirements for protecting keys and controlling their entry and
      output. It does not mean every validated module forbids every plaintext export: the applicable
      requirements depend on the security level, module type and transfer method. See{' '}
      <Cite std={IG}>Implementation Guidance §9.5.A</Cite>.
    </p>
    <p>
      In a PKCS#11 interface, a key can be configured to refuse plaintext reads while permitting
      encrypted backup. Check the module’s Security Policy to understand which services and
      protections its validation covers. The linked Hub exercise demonstrates this selected key
      policy; it does not establish FIPS validation.
    </p>
    <p>
      <Link to="/playground/hsm?tab=learn" className="text-primary underline">
        Open the PKCS#11 Learn exercises
      </Link>{' '}
      — choose Foundations → “Key wrap &amp; the extraction question” for the AES demonstration.
    </p>
    <p>
      A module is not rated once. Each published Security Policy opens with a{' '}
      <strong>Security Levels</strong> table, in the format{' '}
      <Cite std={SP_800_140B}>SP 800-140B</Cite> requires. It gives every area a level from 1 to 4,
      or N/A, and then the overall level. The requirements behind each cell are in ISO/IEC 19790,
      which is paid. The tables themselves are public, so we read four of them.
    </p>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-xs">
        <caption className="mb-2 text-left text-xs text-muted-foreground">
          Security Levels tables (Table 1) of four published Security Policies, read{' '}
          {FIPS_AS_OF_LABEL}. Highlighted cells differ from the module’s overall level.
        </caption>
        <thead>
          <tr className="border-b border-border align-bottom text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Security Policy section
            </th>
            {SECURITY_POLICY_PROFILES.map((p) => (
              <th key={p.cert} scope="col" className="py-2 pr-3 font-semibold">
                <Ext href={cmvpSecurityPolicyUrl(p.cert)}>#{p.cert}</Ext>
                <span className="block font-normal">
                  {p.module.length > 28 ? `${p.module.slice(0, 26)}…` : p.module}
                </span>
                <span className="block font-normal">{p.moduleType}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SP_LEVEL_ROWS.map((row, i) => (
            <tr key={row} className="border-b border-border/50">
              <th scope="row" className="py-1.5 pr-3 font-normal text-foreground">
                {i + 1}. {row}
              </th>
              {SECURITY_POLICY_PROFILES.map((p) => {
                const v = p.levels.at(i) ?? 'N/A'
                return (
                  <td key={p.cert} className={`py-1.5 pr-3 ${levelCell(v, p.overall)}`}>
                    {v}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="font-bold text-foreground">
            <th scope="row" className="py-2 pr-3">
              Overall Level
            </th>
            {SECURITY_POLICY_PROFILES.map((p) => (
              <td key={p.cert} className="py-2 pr-3">
                {p.overall}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
    <p className="text-xs text-muted-foreground">
      Sources: the non-proprietary Security Policies of CMVP certificates <CertLink cert="5497" />{' '}
      (Crypto4A QASM), <CertLink cert="5450" /> (Thales Luna T7), <CertLink cert="5281" /> (Juniper
      EX2300/EX3400 switches) and <CertLink cert="5314" /> (AWS-LC 3), each linked from its
      certificate page.
    </p>

    <SubHeading>Five things the tables teach</SubHeading>
    <ol className="list-decimal space-y-2 pl-5">
      <li>
        <strong>N/A is a real answer.</strong> AWS-LC’s Security Policy says of physical security:
        “The module is comprised of software only and therefore this section is not applicable.”
        None of the four rates non-invasive security.
      </li>
      <li>
        <strong>Same overall level, different profile.</strong> QASM and Luna T7 are both Level 3,
        but only Luna T7 rates “mitigation of other attacks” (at 3). “Level 3” alone does not tell
        you which areas were claimed.
      </li>
      <li>
        <strong>One area can exceed the overall level.</strong> The Juniper switches rate roles,
        services, and authentication at 3 and are overall Level 1. The certificate page lists that
        area under “Security Level Exceptions”.
      </li>
      <li>
        <strong>The overall level matches the lowest rated area</strong> in all four tables. That is
        an observation from these documents, not a rule quoted here; the rule is in the standard.
      </li>
      <li>
        <strong>Don’t infer a rating from a label.</strong> QASM and the Juniper switches both
        describe their operational environment as “Limited”. QASM rates that area N/A; Juniper rates
        it 1. Read the table.
      </li>
    </ol>

    <SubHeading>Where each area lives in a Security Policy</SubHeading>
    <p>
      The Security Policy follows the same numbering, so the table doubles as a map. In the AWS-LC
      document, for example, §2 holds the boundary, the approved algorithms and key establishment;
      §4 the roles and the approved and non-approved services; §9 where keys are stored and how they
      are zeroised; §10 the self-tests; and §11 the installation and initialisation steps that the
      certificate’s caveat points to.
    </p>
    <Callout title="Why this matters for PQC">
      <p>
        Adding ML-KEM or ML-DSA is not “one more algorithm”. It touches the approved security
        functions (new approved algorithms), SSP management (new key types and seeds), services (new
        approved services and their indicator) and self-tests (the IG 10.3.A tests for each PQC
        algorithm). Those are four of the five categories the Manual lists for an Update (UPDT),{' '}
        <Cite std={MGMT_MANUAL}>§7.1.10</Cite>: “approved / allowed security functions/algorithms,
        SSPs, approved security services, self-tests, and security states within the FSM”, each of
        which may not exceed 30% of changes. The Manual does not say how a PQC addition is treated;
        that part is our reasoning: expect it to be treated as a significant change, with the lab
        assessing it and proposing the submission route, and the CMVP free to decide that the
        changes exceed 30% and require a full submission (see the optional route table).
      </p>
    </Callout>
  </Body>
)

// ── fips-levels ─────────────────────────────────────────────────────────────

const PLANNING_CASES: readonly { level: string; case: string; why: string }[] = [
  {
    level: 'Level 1',
    case: 'A software crypto library on a controlled server fleet',
    why: 'Illustrative starting point, not a software-only rule. Establish the operational environment, applicable requirement areas, approved mode and tested platforms.',
  },
  {
    level: 'Level 3',
    case: 'A network HSM where an attacker could get physical access',
    why: 'Planning recommendation: physical security is part of the threat model. Current PQC HSM certificates at Level 3 are market examples, not the normative basis.',
  },
  {
    level: 'Level 4',
    case: 'An offline root-key HSM at an unattended site, with physical attack in the threat model',
    why: 'Planning target from a stated physical threat, not prestige. Confirm every applicable area against ISO/IEC 19790 as modified by the SP 800-140 series with the laboratory.',
  },
]

/** Learn section `fips-levels` */
export const FipsLevels = () => (
  <Body>
    <p>
      FIPS 140-3 “provides four increasing, qualitative levels of security: Level 1, Level 2, Level
      3, and Level 4. These levels are intended to cover the wide range of potential applications
      and environments in which cryptographic modules may be employed.” Read that carefully:
      increasing <em>assurance</em> for different environments, not a score where higher is always
      better.
    </p>

    <SubHeading>Three corrections</SubHeading>
    <ol className="list-decimal space-y-2 pl-5">
      <li>
        <strong>Level 1 is not “software-only”.</strong> The Juniper EX2300/EX3400 switches (
        <CertLink cert="5281" />) are a <em>hardware</em> module at overall Level 1. Their Security
        Policy rates physical security at 1 and describes “a multi-chip standalone meeting Level 1
        Physical Security requirements … completely enclosed in a … steel … enclosure”.
      </li>
      <li>
        <strong>Level 1 is a real validation.</strong> AWS-LC 3 (<CertLink cert="5314" />) is a
        Level 1 software module with a full certificate, tested platforms, self-tests and a Security
        Policy. Its certificate even approves ML-KEM.
      </li>
      <li>
        <strong>The overall level is a summary.</strong> If your worry is physical attack, read the
        physical-security row. If it is operator authentication, read that row: the Juniper switches
        reach Level 3 there.
      </li>
    </ol>

    <SubHeading>What rising levels look like in real documents</SubHeading>
    <p>
      We don’t paraphrase the level-by-level requirements; they are in ISO/IEC 19790 as modified by
      the SP 800-140 series. The Security Policies do show what the evidence looks like:
    </p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>Juniper, Level 1 physical:</strong> “No actions are required by the operator to
        ensure that physical security is maintained.”
      </li>
      <li>
        <strong>QASM, Level 3 physical:</strong> tamper labels the Crypto Officer inspects, and
        environmental failure protection — outside −10 °C to 70 °C, or outside the listed voltages,
        the module shuts down.
      </li>
    </ul>

    <SubHeading>The programme also constrains levels</SubHeading>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <Cite std={IG}>IG</Cite> 1.B: “At this time, the CMVP will only accept Overall Level 1 and
        Level 2 for sub-chip hybrid validations.”
      </li>
      <li>
        <Cite std={MGMT_MANUAL}>Manual</Cite> §7.1.15: raising any section’s level, or changing the
        embodiment, makes it a <strong>new module</strong> that needs a Full Submission. Lowering a
        level is security-relevant: it may go through an Update (UPDT) with full testing of the
        sections lowered or affected.
      </li>
    </ul>
    <p>
      So the level is a design decision you make once, early, from the threat model and what your
      buyers must show — not a label you upgrade later.
    </p>

    <SubHeading>The three planning cases</SubHeading>
    <Callout tone="info" title="Requirement first; examples second">
      <p>
        A normative requirement comes from FIPS 140-3, ISO/IEC 19790 as modified by the SP 800-140
        series, the current IG and programme rules. A published certificate is evidence that one
        named module met its stated profile. A planning recommendation applies those requirements to
        declared threats and assumptions. Do not turn today&apos;s market pattern into a rule.
      </p>
    </Callout>
    <div className="grid gap-3 md:grid-cols-3">
      {PLANNING_CASES.map((c) => (
        <div key={c.level} className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm font-bold text-foreground">{c.level}</p>
          <p className="mt-1 text-xs text-foreground/90">{c.case}</p>
          <p className="mt-2 text-xs text-muted-foreground">{c.why}</p>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground">
      Level 2 is a real level too. The planner accepts it when the learner states the operational
      environment and confirms the applicable requirement-area evidence; embodiment alone never
      rules it out.
    </p>

    <Callout tone="warning" title="FIPS Level 3 and PCI: don’t over-correct">
      <p>
        A FIPS 140-3 Level 3 HSM does <strong>not</strong> thereby have PCI PTS HSM approval — that
        is a separate device approval by a PCI-recognised lab, assigned and listed by PCI SSC (
        <Cite std={PCI_LISTING}>PTS listing definitions</Cite>). Whether a PCI operational standard
        accepts a FIPS certificate in place of a PTS approval is set in that standard’s own
        requirement text, which this module does not state — read the current standard.
      </p>
      <p>
        And a FIPS level is not an EAL: “FIPS Level 4 = EAL4+” compares two different schemes’
        answers to different questions.
      </p>
    </Callout>
  </Body>
)

// ── fips-attack-evidence ────────────────────────────────────────────────────

const ATTACK_EVIDENCE_ROWS: readonly { risk: string; fips: ReactNode; cc: ReactNode }[] = [
  {
    risk: 'Side-channel (timing, power, EM)',
    fips: (
      <>
        Area N/A by default; a publicly documented countermeasure must be addressed under
        “Mitigation of other attacks”
      </>
    ),
    cc: (
      <>
        <Cite std={CC_PART3}>AVA_VAN</Cite> analysis and penetration testing at the level’s attack
        potential, if such attacks are within the Security Target’s scope{' '}
        <ModuleAnalysisNote>(module analysis)</ModuleAnalysisNote>
      </>
    ),
  },
  {
    risk: 'Fault injection',
    fips: (
      <>
        A publicly documented countermeasure is addressed under “Mitigation of other attacks”, which
        covers “both invasive (physical) or non-invasive mechanisms”
      </>
    ),
    cc: <>Same</>,
  },
  {
    risk: 'Random numbers',
    fips: (
      <>
        Entropy source assessed separately (ESV, IG 9.3.A;{' '}
        <Cite std={MGMT_MANUAL}>
          Management Manual, section 4.8, and section 7.1.7 when the environment changes
        </Cite>
        ); see the{' '}
        <Link
          to="/learn/entropy-randomness?tab=learn&section=esv"
          className="text-primary underline"
        >
          Entropy module
        </Link>
      </>
    ),
    cc: (
      <>
        Read the Security Target’s claims for the random number generator{' '}
        <ModuleAnalysisNote>(module analysis)</ModuleAnalysisNote>
      </>
    ),
  },
  {
    risk: 'Implementation correctness',
    fips: (
      <>
        CAVP vectors and the self-tests check correct outputs, not leakage{' '}
        <ModuleAnalysisNote>(module analysis)</ModuleAnalysisNote>
      </>
    ),
    cc: (
      <>
        Functional testing in the evaluation{' '}
        <ModuleAnalysisNote>(module analysis)</ModuleAnalysisNote>
      </>
    ),
  },
]

/** Learn section `fips-attack-evidence` */
export const FipsAttackEvidence = () => (
  <Body>
    <p>
      A FIPS 140-3 certificate tells you the module met the requirements the CMVP can test.
      Resistance to side-channel and fault attacks is, today, mostly not among them. The nearest
      tested feature is physical security: at Level 3 and above the lab tests environmental failure
      protection or testing, with “EFP temperature or voltage response parameters” (IG 7.A and
      9.7.B).
    </p>

    <p>
      <strong className="text-foreground">
        The standard has an area for it; the program has no test metrics for it.
      </strong>{' '}
      <Cite std={FIPS_140_3}>FIPS 140-3</Cite> names non-invasive security as the major change from
      FIPS 140-2: “Major changes in FIPS 140-3 are limited to the introduction of non-invasive
      physical requirements.” But the publication that would say how a lab measures it,{' '}
      <Cite std={SP_800_140F}>SP 800-140F</Cite>, has an empty requirements list: “No additional
      requirements at this time” (March 2020). A draft revision of August 2021 would name ISO/IEC
      17825 and ISO/IEC 20085-1 and -2 as approved metrics; it has not been finalised. So the{' '}
      <Cite std={MGMT_MANUAL}>Management Manual, section 7.5</Cite> treats the area as not
      applicable by default: “Section 6.8, Non-invasive security is N/A by default as there are
      currently no requirements in SP 800-140F.”
    </p>
    <p>
      That leaves a gap you can read straight off the Security Policy. With no approved metric,
      there is no CMVP-set leakage limit that a PQC implementation has to meet.{' '}
      <ModuleAnalysisNote>(Module analysis, following from SP 800-140F.)</ModuleAnalysisNote>
    </p>

    <p>
      <strong className="text-foreground">What a lab does check.</strong> Until SP 800-140F defines
      requirements, non-invasive mechanisms fall under “Mitigation of other attacks” (
      <Cite std={IG}>Implementation Guidance 12.A</Cite>). If a module “has been purposely designed,
      built and publicly documented” (public documents count, not only the Security Policy) “to
      mitigate one or more specific attacks”, the lab must address that area “regardless if the
      vendor of the module wishes to address the claim or not”, and “shall verify the implemented
      mitigation mechanisms and/or mitigations claimed by the vendor”. A module that has not been
      purposely designed, built and publicly documented to mitigate a specific attack can mark the
      area N/A (<Cite std={MGMT_MANUAL}>Management Manual, section 7.5</Cite>). So a module with no
      publicly documented countermeasure gets no leakage evidence at all, and for one that has a
      publicly documented countermeasure, how far the lab’s verification goes is not set by any
      published CMVP test metric. <ModuleAnalysisNote>(Module analysis.)</ModuleAnalysisNote>
    </p>

    <p>
      <strong className="text-foreground">Why it matters for ML-KEM and ML-DSA.</strong> Published
      research shows attacks on lattice implementations that have no countermeasures, and on some
      that do. A <Cite std={PQC_SEMINAR_FAULT}>NIST PQC seminar on fault injection</Cite> concludes
      that “Variety of FIA are possible on unprotected Kyber and Dilithium”. A{' '}
      <Cite std={PROACT_SCA}>2025 lecture</Cite> covers side-channel and fault attacks on software
      implementations of ML-KEM and ML-DSA and reports that “Implementations protected by both
      masking and shuffling, or higher-order masking, may also be vulnerable”. These are research
      findings, not certification requirements. They explain why the question is worth asking a
      vendor. <ModuleAnalysisNote>(Module analysis.)</ModuleAnalysisNote>
    </p>

    <p>
      <strong className="text-foreground">Where attack testing does exist: Common Criteria.</strong>{' '}
      In a CC or EUCC evaluation, the <Cite std={CC_PART3}>AVA_VAN</Cite> family has the evaluator
      look for vulnerabilities and test them by penetration testing. The levels rise with “an
      increasing rigour of vulnerability analysis by the evaluator and increased levels of attack
      potential”: Basic (AVA_VAN.1 and .2), Enhanced-Basic (.3), Moderate (.4), High (.5). At
      AVA_VAN.5 “penetration testing is performed by the evaluator assuming an attack potential of
      High”. The limit is scope: the analysis asks whether vulnerabilities “can allow attackers to
      violate the SFRs”, so it covers what the Security Target claims, under the Security Target’s
      assumptions. The{' '}
      <Cite std={HSM_PP_INTERPRETATION}>ENISA note on the HSM protection profile</Cite> shows the
      effect: the profile assumes the HSM sits in “a protected environment that limits physical
      access to the TOE to authorised administrators”. Whether power, electromagnetic or fault
      testing takes place therefore depends on whether such attacks are within the Security Target’s
      scope. <ModuleAnalysisNote>(Module analysis.)</ModuleAnalysisNote>
    </p>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs">
        <caption className="sr-only">
          What a FIPS 140-3 certificate and a CC or EUCC certificate show about side-channel, fault,
          random-number and implementation risks
        </caption>
        <thead>
          <tr className="border-b border-border align-bottom text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Risk
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              FIPS 140-3 certificate
            </th>
            <th scope="col" className="py-2 font-semibold">
              CC / EUCC certificate
            </th>
          </tr>
        </thead>
        <tbody>
          {ATTACK_EVIDENCE_ROWS.map((row) => (
            <tr key={row.risk} className="border-b border-border/50 align-top">
              <th scope="row" className="py-2 pr-3 font-medium text-foreground">
                {row.risk}
              </th>
              <td className="py-2 pr-3">{row.fips}</td>
              <td className="py-2">{row.cc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p>
      <strong className="text-foreground">Questions to put to the vendor</strong>{' '}
      <ModuleAnalysisNote>(module analysis)</ModuleAnalysisNote>. Which attack classes does the
      module claim to resist, and is that written in the Security Policy under “Mitigation of other
      attacks”? Is there a CC or EUCC certificate for the same product, at which AVA_VAN level, with
      which assumptions? Which build and platform was tested? And what changed since?
    </p>

    <p>
      <strong className="text-foreground">One more reason to ask again.</strong> After a platform
      change, ENISA’s assurance-continuity guidance (
      <Cite std={CC_CONTINUITY_SCENARIOS}>change scenarios</Cite>) rates a migration that causes
      “measurable changes to timing or resource behaviour” as “Always major at AVA_VAN.4 and 5, due
      to side-channel attacks”; at lower assurance levels it “may be minor if no impact is shown”.
    </p>

    <SubHeading>Related in the Hub</SubHeading>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        Side-channel testing in practice:{' '}
        <Link
          to="/learn/pqc-testing-validation?tab=learn&section=side-channel-tvla"
          className="text-primary underline"
        >
          PQC Network Testing &amp; Validation, TVLA Side-Channel Testing
        </Link>
      </li>
      <li>
        Randomness:{' '}
        <Link
          to="/learn/entropy-randomness?tab=learn&section=esv"
          className="text-primary underline"
        >
          Entropy &amp; Randomness, CMVP ESV Process
        </Link>{' '}
        and the{' '}
        <Link to="/playground/entropy-test" className="text-primary underline">
          Entropy Testing tool
        </Link>
      </li>
      <li>
        Common Criteria view:{' '}
        <Link
          to="/learn/cc-eucc-certification?tab=learn&section=cc-eal-decoding"
          className="text-primary underline"
        >
          Common Criteria, EUCC &amp; eIDAS Certification, the AVA_VAN content
        </Link>{' '}
        and its{' '}
        <Link
          to="/learn/cc-eucc-certification?tab=workshop&step=0"
          className="text-primary underline"
        >
          “Decode the certificate claim” workshop
        </Link>
      </li>
      <li>
        Reading a real certificate’s Security Policy:{' '}
        <Link to="/compliance?tab=records" className="text-primary underline">
          Compliance, Product Records
        </Link>
      </li>
      <li>
        Platform change and side-channel assurance:{' '}
        <Link
          to="/learn/crypto-product-certification?tab=learn&section=new-platform"
          className="text-primary underline"
        >
          A new platform, chip or accelerator: what carries over?
        </Link>
      </li>
    </ul>
  </Body>
)

// ── fips-lifecycle ──────────────────────────────────────────────────────────

const LIFECYCLE_STEPS: readonly { title: string; body: ReactNode }[] = [
  {
    title: 'Define the module',
    body: 'Boundary, module type, embodiment, versions and target level. Everything later depends on this.',
  },
  {
    title: 'Get algorithm and entropy validations',
    body: (
      <>
        Each approved algorithm needs CAVP validation (tested through <Cite std={ACVP}>ACVP</Cite>),
        or vendor affirmation where the IG permits it; entropy sources go through ESV. The Manual
        expects these done before submission.
      </>
    ),
  },
  {
    title: 'Lab testing',
    body: 'The vendor contracts an accredited CST lab. If the vendor chooses, the module can appear on the Implementation Under Test list (voluntary; entries are removed after 18 months).',
  },
  {
    title: 'Submission',
    body: 'The lab submits its test report and the Security Policy to the CMVP through Web Cryptik.',
  },
  {
    title: 'The queue (Modules in Process)',
    body: 'The submission moves through the MIP states below.',
  },
  {
    title: 'Certificate',
    body: 'On success, the CMVP posts a certificate number. A consolidated certificate listing the month’s validations follows each month.',
  },
  {
    title: 'Life after validation',
    body: 'Changes go through revalidation routes; the sunset date ends the validation and moves it to the Historical list.',
  },
]

/** Learn section `fips-lifecycle` */
export const FipsLifecycle = () => (
  <Body>
    <p>
      The <Cite std={MGMT_MANUAL}>Management Manual</Cite> (v2.7, 9 April 2026) describes the
      process. Seven steps, from the vendor’s first decision to the day the certificate expires:
    </p>
    <ol className="space-y-2">
      {LIFECYCLE_STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <span>
            <strong className="text-foreground">{s.title}.</strong> {s.body}
          </span>
        </li>
      ))}
    </ol>

    <SubHeading>The MIP states (Manual v2.7 names)</SubHeading>
    <p>
      v2.7 renamed the states. The <Cite std={MIP_LIST}>MIP list</Cite> shows each module’s current
      state and the date it entered it <AsOf />:
    </p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <caption className="sr-only">Modules-in-Process states</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">
              State
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Who acts
            </th>
            <th scope="col" className="py-2 font-semibold">
              What it means
            </th>
          </tr>
        </thead>
        <tbody>
          {MIP_STATES.map((s) => (
            <tr key={s.state} className="border-b border-border/50 align-top">
              <th scope="row" className="py-2 pr-3 font-medium text-foreground">
                {s.state}
              </th>
              <td className="py-2 pr-3">{s.whoActs}</td>
              <td className="py-2">{s.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p>
      The Manual sets two clocks: the CMVP may drop a module that has not completed validation
      within two years of entering Review (the lab can ask for reconsideration), and the lab has 90
      days to answer comments. It gives no typical end-to-end duration, and neither do we. Treat any
      duration figure without a source with caution.
    </p>
    <p>
      Two kinds of validation exist today. A full validation lasts five years. An{' '}
      <strong>interim</strong> validation is “a temporary measure to shorten the queue”, is “valid
      for two years only”, and relies “more on the CSTL submission with less CMVP oversight”.{' '}
      <Cite std={PROGRAMMATIC_TRANSITIONS}>NIST’s CMVP Programmatic Transitions page</Cite> requires
      the original submission to have reached the CMVP before 1 January 2024 and the lab to notify
      the CMVP of the vendor’s intent before 1 October 2024. Both dates have passed, so new cases
      can no longer use this route (our reading of those dates). An existing interim validation can
      be converted to a five-year validation (the INTU route) before it expires. Check the sunset
      date on any certificate you rely on.
    </p>

    <Callout tone="warning" title="Pipeline, not proof">
      <p>
        The Manual is explicit: “Posting on either list does not imply or guarantee FIPS 140
        validation.” The MIP list only carries submissions that will produce a new certificate (FS,
        UPDT, RBND, PTSC, TRNS), and it shows the module name, vendor, standard, state and date — it
        has no level field. A level written into a module’s name is the vendor’s label, not a CMVP
        result.
      </p>
      <ul className="space-y-1">
        <ClaimRow ok>
          “Module X is on the CMVP Modules-in-Process list, state Review since &lt;date&gt;.”
        </ClaimRow>
        <ClaimRow ok={false}>“FIPS 140-3 validation pending at Level 3.”</ClaimRow>
        <ClaimRow ok={false}>“FIPS 140-3 Submitted — commitment demonstrated.”</ClaimRow>
      </ul>
      <p>
        Check any MIP claim on the <Ext href={CMVP_MIP_LIST_URL}>live MIP list</Ext>.
      </p>
    </Callout>

    <p>
      After the sunset date, or when a transition retires it, a validation moves to the{' '}
      <strong>Historical</strong> list. The CMVP’s <Cite std={TRANSITION}>transition page</Cite>{' '}
      says it still supports buying and using Historical FIPS 140-2 modules “for existing systems”,
      and the <Cite std={VALIDATED_MODULES}>Validated Modules page</Cite> says Federal Agencies
      “should not include these in new systems”.
    </p>
  </Body>
)

// ── fips-acvp-bridge ────────────────────────────────────────────────────────

const CHAIN: readonly { step: string; proves: string }[] = [
  { step: 'Algorithm implementation', proves: 'Code or circuitry that computes, say, ML-KEM.' },
  {
    step: 'CAVP algorithm validation (tested via ACVP)',
    proves: 'That implementation gives correct answers for the tested functions and parameters.',
  },
  {
    step: 'Module testing by an accredited lab',
    proves:
      'The eleven areas, self-tests, key handling, roles and the Security Policy — for a defined boundary.',
  },
  { step: 'CMVP review', proves: 'The lab’s evidence holds up.' },
  {
    step: 'FIPS 140-3 certificate',
    proves: 'This module, at these versions and environments, in its approved mode.',
  },
]

/** Learn section `fips-acvp-bridge` */
export const FipsAcvpBridge = () => (
  <Body>
    <p>
      Algorithm validation is necessary evidence for a module certificate. It is not the
      certificate. The chain:
    </p>
    <ol className="space-y-1" aria-label="From algorithm to certificate">
      {CHAIN.map((c, i) => (
        <li key={c.step}>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold text-foreground">{c.step}</p>
            <p className="text-xs text-muted-foreground">{c.proves}</p>
          </div>
          {i < CHAIN.length - 1 ? (
            <ArrowDown
              size={16}
              className="mx-auto my-1 text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </li>
      ))}
    </ol>
    <p>
      You can see the link on every certificate: each approved function carries its CAVP reference.
      On <CertLink cert="5497" /> it reads “ML-KEM KeyGen A5631”, “ML-DSA SigGen A5631” and so on.
      The approved functions themselves are listed in <Cite std={SP_800_140C}>SP 800-140C</Cite>,
      key generation and establishment methods in <Cite std={SP_800_140D}>SP 800-140D</Cite>, and
      authentication mechanisms in <Cite std={SP_800_140E}>SP 800-140E</Cite>.
    </p>
    <p>
      Vendor-affirmed means the vendor states that an algorithm meets the standard without an
      algorithm test certificate; NIST's <Cite std={IG}>FIPS 140-3 Implementation Guidance</Cite>{' '}
      allows it only where a specific IG section permits it, for example IG C.O for HSS signatures.
    </p>

    <SubHeading>Check the operation and parameter set</SubHeading>
    <p>
      Do not stop at the name “ML-DSA”. Identify the operation you need: KeyGen means generating
      keys, SigGen means signing, and SigVer means checking signatures. Follow its
      algorithm-validation link and inspect the listed capabilities, including parameter sets. Then
      check the module’s Security Policy for the approved service and configuration.
    </p>
    <p>
      A signing entry alone does not establish coverage for key generation or verification.
      Likewise, do not assume every parameter set is covered.
    </p>
    <p>
      For the example above, inspect{' '}
      <Ext href="https://csrc.nist.gov/projects/Cryptographic-Algorithm-Validation-Program/details?validation=38241">
        Algorithm validation A5631
      </Ext>
      .
    </p>

    <SubHeading>Four shortcuts that fail</SubHeading>
    <ul className="space-y-1">
      <ClaimRow ok={false}>
        “It passed ACVP testing, so it is FIPS validated.” ACVP results feed step 2 of five.
      </ClaimRow>
      <ClaimRow ok={false}>
        “It implements FIPS 203 and FIPS 204, so it is FIPS validated.” An algorithm standard is not
        a module validation.
      </ClaimRow>
      <ClaimRow ok={false}>
        “Our product contains a validated library, so our product is validated.” Only the module
        inside its boundary is — for AWS-LC, the bcm.o file, not your application.
      </ClaimRow>
      <ClaimRow ok={false}>
        “A validated module is validated however we run it.” #5314’s caveat begins “When operated in
        approved mode. When installed, initialized and configured as specified in Section 11.1 of
        the Security Policy.”
      </ClaimRow>
    </ul>

    <SubHeading>What algorithm testing does not cover</SubHeading>
    <p>
      Algorithm testing checks outputs against test vectors. The module must also test{' '}
      <em>itself</em>. <Cite std={IG}>IG</Cite> 10.3.A names self-tests for ML-KEM key generation,
      encapsulation and decapsulation, and for ML-DSA and SLH-DSA. Its 19 August 2026 update adds
      that the pair-wise consistency test is required only before the first export of the seed or
      key pair, or before the first operational use of the key pair after the seed is generated in
      the module; regenerating the key pair later from the stored seed is a reconstitution and needs
      no new test. Entropy is a separate track again: entropy source validation (
      <Cite std={ESV}>ESV</Cite>).
    </p>
    <p>For ML-DSA, three checks answer different questions:</p>
    <ul className="list-disc space-y-2 pl-5" aria-label="Three different ML-DSA checks">
      <li>
        <strong>External algorithm testing:</strong> does the implementation produce the expected
        results for the supplied test cases?
      </li>
      <li>
        <strong>Algorithm self-test:</strong> does the module’s own implementation pass an internal
        check before its first approved use? A known-answer self-test uses fixed test inputs and an
        expected result; it does not test every customer key.
      </li>
      <li>
        <strong>Pair-wise consistency test:</strong> do a newly generated private key and its public
        key work together?
      </li>
    </ul>
    <p>
      These checks complement each other. Passing one does not replace the others. When reviewing
      self-tests, check when they run, how failures are reported, and how the module prevents use or
      output that its error state must block. See <Cite std={IG}>IG §10.3.A</Cite> for the algorithm
      self-test and pair-wise consistency requirements.
    </p>
    <p>
      Going deeper: the algorithm-testing workflow is taught in{' '}
      <Link to="/learn/pqc-testing-validation" className="text-primary underline">
        PQC Testing &amp; Validation
      </Link>
      , the lab's side of it (vector sets, prompts and responses, and the evidence they produce) in{' '}
      <Link to="/learn/acvp-lab-workflow" className="text-primary underline">
        ACVP Lab Workflow
      </Link>
      , and ESV in{' '}
      <Link to="/learn/entropy-randomness" className="text-primary underline">
        Entropy &amp; Randomness
      </Link>
      .
    </p>
  </Body>
)

// ── fips-landscape ──────────────────────────────────────────────────────────

type HubState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | {
      kind: 'ready'
      details: ReadonlyMap<string, CmvpDetails | null>
      /** Active FIPS 140-3 records in the Hub's copy of the CMVP list. */
      activeCount: number
      /** UTC retrieval time of that copy (compliance-data.meta.json, fips partition), if stated. */
      retrievedAt: string | null
    }

/** "23 October 2026": the UTC calendar day of a retrieval time (null when it is not a date). */
function utcDayLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Level, status, sunset and embodiment for the verified certificates come
 * ONLY from the Hub's CMVP certificate-page fields (cmvpDetails.ts contract,
 * WS-4b). Legacy fields such as `pqcCoverage` or `certificationLevel` are
 * never read here: they are being repaired. Anything missing → link out.
 */
function useHubCmvpDetails(certs: readonly string[]): HubState {
  const [state, setState] = useState<HubState>({ kind: 'loading' })
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [res, meta] = await Promise.all([
          fetch('/data/compliance-data.json'),
          fetchComplianceMeta(),
        ])
        if (!res.ok) throw new Error(String(res.status))
        const data: unknown = await res.json()
        if (!Array.isArray(data)) throw new Error('not an array')
        const wanted = new Set(certs)
        const details = new Map<string, CmvpDetails | null>()
        let activeCount = 0
        for (const raw of data as Partial<ComplianceRecord>[]) {
          if (raw.type !== 'FIPS 140-3' || typeof raw.id !== 'string') continue
          const read = readCmvpDetails(raw)
          if ((read?.cmvpStatus ?? raw.status) === 'Active') activeCount += 1
          if (wanted.has(raw.id)) details.set(raw.id, read)
        }
        const retrievedAt = meta?.partitions?.fips?.retrievedAt ?? null
        if (!cancelled) setState({ kind: 'ready', details, activeCount, retrievedAt })
      } catch {
        if (!cancelled) setState({ kind: 'unavailable' })
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [certs])
  return state
}

const VERIFIED_IDS = VERIFIED_PQC_LEVEL3_CERTS.map((c) => c.cert)

const HubField = ({ value }: { value: string | null | undefined }) =>
  value ? (
    <span className="text-foreground">{value}</span>
  ) : (
    <span className="text-muted-foreground">not in Hub data — see certificate</span>
  )

const VerifiedCertTable = ({ hub }: { hub: HubState }) => {
  const detailsFor = (cert: string): CmvpDetails | null =>
    hub.kind === 'ready' ? (hub.details.get(cert) ?? null) : null
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <caption className="mb-2 text-left text-xs text-muted-foreground">
            PQC approvals verified on each certificate page, {FIPS_AS_OF_LABEL}. Level, status,
            sunset and embodiment come from the Hub’s certificate-page data when it carries them.
          </caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Certificate
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Module
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                PQC in Approved Algorithms
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Level · status (Hub data)
              </th>
              <th scope="col" className="py-2 font-semibold">
                Sunset · embodiment (Hub data)
              </th>
            </tr>
          </thead>
          <tbody>
            {VERIFIED_PQC_LEVEL3_CERTS.map((c) => {
              const d = detailsFor(c.cert)
              const level = d?.overallLevel != null ? `Level ${d.overallLevel}` : null
              return (
                <tr key={c.cert} className="border-b border-border/50 align-top">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    <CertLink cert={c.cert} />
                  </th>
                  <td className="py-2 pr-3">
                    <span className="text-foreground">{c.module}</span>
                    <span className="block text-muted-foreground">{c.vendor}</span>
                  </td>
                  <td className="py-2 pr-3 text-foreground">{c.pqcApproved.join(', ')}</td>
                  <td className="py-2 pr-3">
                    {hub.kind === 'loading' ? (
                      <span className="text-muted-foreground">checking Hub data…</span>
                    ) : (
                      <>
                        <HubField value={level} />
                        {level ? (
                          <span className="block">
                            <HubField value={d?.cmvpStatus} />
                          </span>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td className="py-2">
                    {hub.kind === 'loading' ? (
                      <span className="text-muted-foreground">checking Hub data…</span>
                    ) : (
                      <>
                        <HubField value={d?.sunsetDate} />
                        {d?.sunsetDate ? (
                          <span className="block">
                            <HubField value={d.embodiment} />
                          </span>
                        ) : null}
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {hub.kind === 'unavailable' ? (
        <p className="text-xs text-muted-foreground">
          Hub certificate data could not be loaded. Every row links to its live certificate page.
        </p>
      ) : null}
    </div>
  )
}

/** Learn section `fips-landscape` */
// ── fips-automation ─────────────────────────────────────────────────────────
// Every claim is from the verified register (priv nextfeature
// fips-automation-facts-09272026.md; antigravity-88 + Codex gpt-5.6-terra,
// each row re-checked against its source). Deliberately NOT stated, because
// no official source states them: a CAVS retirement date, and any date for
// accepting automated (AMVP) module submissions in production.

const AUTOMATION_LAYERS: readonly {
  layer: string
  exchange: ReactNode
  status: ReactNode
}[] = [
  {
    layer: 'Algorithms (CAVP)',
    exchange: (
      <>
        ACVP: the lab declares the implementation’s capabilities, ACVTS generates matching test
        cases, the implementation returns its outputs and ACVTS returns a verdict. The testing is
        black-box (<Cite std={CAVP}>CAVP</Cite>, <Cite std={ACVP}>ACVP</Cite>).
      </>
    ),
    status: (
      <>
        <strong>In production.</strong> Production ACVTS is “the only way to create algorithm
        validation certificates”, and only NVLAP-accredited labs can use it. The older CAVS tool is
        “deprecated by ACVTS” (<Cite std={CAVP}>CAVP</Cite>).
      </>
    ),
  },
  {
    layer: 'Entropy (ESV)',
    exchange: (
      <>
        The Entropy Validation Server’s web API. Its protocol “is based on ACVP” (
        <Cite std={ESV_PROGRAM}>ESV</Cite>, <Cite std={ESV}>ESV server</Cite>).
      </>
    ),
    status: (
      <>
        <strong>In production since 13 April 2022</strong> (
        <Cite std={ESV_ANNOUNCEMENTS}>announcement</Cite>), for labs accredited to the 17ESV scope.
        Production ESVTS is now “the only mechanism” for a new submission that needs an entropy
        source or RBG construction validated: the module cites an existing certificate, which the
        same vendor can reuse in another module if the entropy source is portable (
        <Cite std={MGMT_MANUAL}>Management Manual</Cite>).{' '}
        <Link
          to="/learn/entropy-randomness?tab=learn&section=esv"
          className="text-primary underline"
        >
          See how certificate reuse works, including permission for another vendor.
        </Link>
      </>
    ),
  },
  {
    layer: 'The module (CMVP)',
    exchange: (
      <>
        Today: the Module Information Structure, a JSON file the CMVP uses “to facilitate automated
        verification and processing” (<Cite std={MIS}>MIS</Cite>). Next: AMVP, a protocol “to submit
        registration, test evidence and validation requests” (<Cite std={AMVP}>AMVP</Cite>).
      </>
    ),
    status: (
      <>
        <strong>Demonstration, in progress.</strong> AMVP runs on a demonstration server and is
        still pre-1.0: its messages carry protocol version 0.1, and its submission schemas are at
        0.4. <Cite std={SP_1800_40B}>SP 1800-40B</Cite>, still an Initial Public Draft, demonstrated
        a server and client that accept module submissions in a laboratory environment, and says the
        capabilities are “actively being integrated into the production CMVP environment in 2026”.
        It gives no date.
      </>
    ),
  },
]

/** Learn section `fips-automation` */
export const FipsAutomation = () => (
  <Body>
    <p>
      Crypto agility is the ability to change algorithms quickly. But a change to a validated
      module, such as a patch or a new algorithm, can invalidate the previously validated
      configuration (<Cite std={NCCOE_CMVP}>NCCoE</Cite>), so how fast validation runs limits how
      agile a certified product can be. That framing is ours; NIST’s own statement of the problem is
      that “the period required for third-party testing and government validation of cryptographic
      modules is often incompatible with industry requirements” (<Cite std={NCCOE_CMVP}>NCCoE</Cite>
      ). <Cite std={EO_14412}>Executive Order 14412</Cite> §6(b) directs the Secretary of Commerce,
      through the Director of NIST, within 180 days of 22 June 2026 and “to the extent appropriate
      and consistent with applicable law”, to “revise the processes used by the Cryptographic Module
      Validation Program to accelerate validations of cryptographic modules”.
    </p>
    <p>
      NIST has been moving the process to electronic exchange one layer at a time. The three layers
      are at different stages:
    </p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs">
        <caption className="sr-only">Electronic exchange by validation layer</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Layer
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              What is exchanged electronically
            </th>
            <th scope="col" className="py-2 font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {AUTOMATION_LAYERS.map((l) => (
            <tr key={l.layer} className="border-b border-border/50 align-top">
              <th scope="row" className="py-2 pr-3 font-medium text-foreground">
                {l.layer}
              </th>
              <td className="py-2 pr-3">{l.exchange}</td>
              <td className="py-2">{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <SubHeading>How the pieces fit</SubHeading>
    <p>
      The project documentation sets out the sequence (<Cite std={AMVP}>AMVP</Cite>): AMVP registers
      the lab, vendor, module and operating environment; ACVP tests the algorithms on that
      environment; ESV tests the entropy source on it; AMVP then submits the module-level test
      evidence and the request for FIPS 140-3 validation. The project’s status reports are{' '}
      <Cite std={CSWP_37A}>CSWP 37A</Cite> (final, 16 March 2026) and{' '}
      <Cite std={CSWP_37B}>CSWP 37B</Cite> (final, 30 September 2026).
    </p>
    <Callout tone="warning" title="What automation does not change">
      <p>
        The accredited lab still tests and submits. The SP 1800-40B demonstration is lab
        submissions, not vendor self-certification.
      </p>
      <p>
        SP 1800-40B covers first (full) submissions. Submissions that only address CVEs, or that add
        operating environments to an existing validation, are left to “future phases”, and physical
        security tests are out of the project’s scope.
      </p>
      <p>
        SP 1800-40B says “updates to WebCryptik are necessary to help build the evidence payloads
        required for ACMVP”; no source says Web Cryptik is being replaced.
      </p>
      <p>
        NIST’s documents on this project (SP 1800-40B, CSWP 37A and CSWP 37B) give no date when
        automated module submissions will be accepted in production; SP 1800-40B says the
        capabilities are “actively being integrated into the production CMVP environment in 2026”.
        Treat any dated claim about an “automated CMVP” as unsupported by them.
      </p>
    </Callout>
  </Body>
)

/**
 * The Active count and its date are read from the Hub's copy of NIST's CMVP list
 * (record count and the sidecar's retrieval time), so the sentence cannot go stale
 * in the text; without either, the sentence is left out and the table stands alone.
 */
const ValidatedToday = () => {
  const hub = useHubCmvpDetails(VERIFIED_IDS)
  const day = hub.kind === 'ready' ? utcDayLabel(hub.retrievedAt) : null
  return (
    <>
      <p>
        {hub.kind === 'ready' && day
          ? `NIST’s Active FIPS 140-3 list held ${hub.activeCount} certificates on ${day}. `
          : ''}
        Four Level 3 HSM certificates approve both ML-KEM and ML-DSA:
      </p>
      <VerifiedCertTable hub={hub} />
    </>
  )
}

export const FipsLandscape = () => (
  <Body>
    <p>
      Four questions, kept apart: what applies today, what is validated today, what is only in
      process or in transition, and what is still a draft. Everything in this section is <AsOf />,
      except the certificate count, which is read from the site’s own CMVP data — re-check before
      you quote it. Items elsewhere in the lesson that were read later give their own dates.
    </p>

    <SubHeading>1 · Applicable today</SubHeading>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <Cite std={FIPS_140_3}>FIPS 140-3</Cite> (2019) is unchanged, Level 3 included. No 2025–2026
        NIST draft revises it.
      </li>
      <li>
        <Cite std={MGMT_MANUAL}>Management Manual</Cite> v2.7 (9 April 2026) and{' '}
        <Cite std={IG}>Implementation Guidance</Cite> last updated 19 August 2026 — programme
        guidance and interpretation, not a new standard.
      </li>
    </ul>
    <p>IG sections that matter to crypto-agile and PQC designs:</p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs">
        <caption className="sr-only">Implementation Guidance sections relevant to PQC</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">
              IG
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Topic
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Last modified
            </th>
            <th scope="col" className="py-2 font-semibold">
              Why it matters
            </th>
          </tr>
        </thead>
        <tbody>
          {IG_TOPICS.map((t) => (
            <tr key={t.section} className="border-b border-border/50 align-top">
              <th scope="row" className="py-2 pr-3 font-medium text-foreground">
                {t.section}
              </th>
              <td className="py-2 pr-3">{t.title}</td>
              <td className="py-2 pr-3">{t.lastModified}</td>
              <td className="py-2">{t.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Callout title="Two different “hybrids”">
      <p>
        IG 1.B’s <em>hybrid module</em> is a module type: software or firmware plus a disjoint
        hardware component. IG D.S’s Scenario 2 is a <em>hybrid KEM</em>: ML-KEM combined with
        another KEM, where the module must enforce pre-defined combinations. Don’t cite one for the
        other.
      </p>
    </Callout>

    <SubHeading>2 · Validated today</SubHeading>
    <ValidatedToday />
    <ul className="list-disc space-y-1 pl-5">
      <li>
        Read <strong>Approved Algorithms</strong> on the certificate, not a database tag. Aggregated
        data has marked other Level 3 HSMs as PQC-capable:{' '}
        {MISTAGGED_LEVEL3_CERTS.map((m, i) => (
          <span key={m.cert}>
            <CertLink cert={m.cert} /> ({m.module}) {m.reality}
            {i < MISTAGGED_LEVEL3_CERTS.length - 1 ? '; ' : '.'}
          </span>
        ))}
      </li>
      <li>
        PQC on a certificate is not only an HSM story: the Level 1 AWS-LC 3 software module (
        <CertLink cert="5314" />) approves ML-KEM.
      </li>
      <li>
        Search for new ones yourself in the{' '}
        <Cite std={VALIDATED_MODULES}>CMVP Validated Modules search</Cite> (
        <Ext href={CMVP_SEARCH_URL}>live</Ext>).
      </li>
    </ul>

    <SubHeading>3 · In process, or in transition</SubHeading>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>Superseded:</strong> every FIPS 140-2 validation moved to the Historical list on
        21/22 September 2026 (NIST’s pages give both dates). Certificate #4282, for example, now
        reads “Moved to historical list due to sunsetting”. This is a live example of a scheme
        transition: the certificates did not fail; the scheme moved on. NIST: Federal Agencies
        &ldquo;should not include these in new systems but can be procured for legacy
        systems&rdquo;.
      </li>
      <li>
        <strong>In process:</strong> a MIP entry is a queue state and date — pipeline, not proof
        (see the lifecycle section).
      </li>
    </ul>

    <SubHeading>4 · Horizon — planning implication, not a requirement</SubHeading>
    <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
      <p>
        <strong>
          <Cite std={EO_14412}>Executive Order 14412</Cite> §6(b)
        </strong>{' '}
        (signed 22 June 2026): “Within 180 days of the date of this order, the Secretary of
        Commerce, through the Director of NIST, shall, to the extent appropriate and consistent with
        applicable law, revise the processes used by the Cryptographic Module Validation Program to
        accelerate validations of cryptographic modules.” That points to about 19 December 2026.
        What the revision will contain is not public; don’t speculate about it.
      </p>
      <p>
        <strong>
          <Cite std={SP_1800_40B}>NIST SP 1800-40B</Cite>
        </strong>{' '}
        (Initial Public Draft, April 2026; comments closed 1 June 2026) demonstrates automation that
        enables “an accredited lab to make a full module submission to the CMVP”. It covers{' '}
        <em>first</em> submissions; CVE-only submissions and added operating environments are named
        only as future phases. The lab still submits. “First-party testing” appears in the 2023{' '}
        <Cite std={SP_1800_40A}>SP 1800-40A preliminary draft</Cite>, not in 1800-40B — an open
        policy question. Project background: <Cite std={CSWP_37A}>CSWP 37A</Cite>.
      </p>
      <ul className="space-y-1">
        <ClaimRow ok={false}>“EO 14412 has already changed the CMVP.”</ClaimRow>
        <ClaimRow ok={false}>“SP 1800-40 lets vendors submit directly or self-certify.”</ClaimRow>
        <ClaimRow ok>
          “The standard and Level 3 are unchanged; the validation process is under a presidential
          order to speed up, and the revision is due around 19 December 2026.”
        </ClaimRow>
      </ul>
    </div>
  </Body>
)

// ── fips-route-table (optional reference) ───────────────────────────────────

/** Learn section `fips-route-table` (optional reference, outside the timed path) */
export const FipsRouteTable = () => (
  <Body>
    <p>
      Every change to a validated module goes through one of the submission scenarios in{' '}
      <Cite std={MGMT_MANUAL}>Management Manual</Cite> v2.7 §7.1. This table summarises them{' '}
      <AsOf />. It is a reading aid: open the live Manual before you plan a submission, because the
      routes are revised often.
    </p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <caption className="sr-only">
          CMVP submission scenarios, Management Manual v2.7 §7.1
        </caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Route
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              When it applies
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Certificate
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Code changes
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold">
              Sunset date
            </th>
            <th scope="col" className="py-2 font-semibold">
              On MIP list
            </th>
          </tr>
        </thead>
        <tbody>
          {CMVP_ROUTES.map((r) => (
            <tr key={r.code} className="border-b border-border/50 align-top">
              <th scope="row" className="py-2 pr-3 font-medium text-foreground">
                {r.code}
                <span className="block font-normal text-muted-foreground">
                  {r.name} (§{r.section})
                </span>
              </th>
              <td className="py-2 pr-3">{r.when}</td>
              <td className="py-2 pr-3">{r.certificate}</td>
              <td className="py-2 pr-3">{r.codeChanges}</td>
              <td className="py-2 pr-3">{r.sunset}</td>
              <td className="py-2">{r.onMip ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-muted-foreground">
      “Code changes: Limited” means only changes needed for the scenario itself (the Manual’s
      “Limited NSRL”). INTU sits under Full Submission in the Manual.
    </p>

    <SubHeading>Adding PQC: which route?</SubHeading>
    <ul className="space-y-1">
      <ClaimRow ok>
        <strong>UPDT or FS.</strong> New approved algorithms, services and self-tests are
        security-relevant. UPDT allows under 30 % change in <em>each</em> of five categories —
        functions/algorithms, SSPs, services, self-tests, FSM states — and the CMVP may decide the
        change is larger and require an FS.
      </ClaimRow>
      <ClaimRow ok={false}>
        <strong>ALG</strong> only adds CAVP evidence for an algorithm that was already in the
        approved mode with its self-tests and service indicator. No code change.
      </ClaimRow>
      <ClaimRow ok={false}>
        <strong>TRNS</strong> exists only for a published CMVP algorithm transition that would move
        modules to Historical. A market or policy PQC deadline does not qualify.
      </ClaimRow>
      <ClaimRow ok={false}>
        <strong>CVE</strong> fixes “shall not introduce new features or cryptography”.
      </ClaimRow>
    </ul>

    <SubHeading>Rules that shape a plan</SubHeading>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        Raising a section’s level or changing the embodiment makes it a new module (FS); lowering a
        level is security-relevant and may be an UPDT with full testing of the sections lowered or
        affected (§7.1.15).
      </li>
      <li>
        Routes combine only as the Manual allows. A rebrand of a ported sub-chip, for example, is
        two separate submissions.
      </li>
      <li>
        A CVE revalidation normally removes the vulnerable version from the certificate: it is “in
        essence, Revoked”.
      </li>
      <li>
        A rebrand needs the OEM’s written approval, including whether further rebrands are allowed.
      </li>
    </ul>
  </Body>
)
