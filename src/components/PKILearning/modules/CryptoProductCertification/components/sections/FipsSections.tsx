// SPDX-License-Identifier: GPL-3.0-only
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
import type { ComplianceRecord } from '@/components/Compliance/types'
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
const PCI_PIN = getStandard('PCI-PIN-v3-1-ROC-Reporting-Template')
const PCI_P2PE = getStandard('PCI-P2PE-Security-Requirements-v3-1')

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

const CertLink = ({ cert }: { cert: string }) => <Ext href={cmvpCertificateUrl(cert)}>#{cert}</Ext>

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
    current: 'These editions are pinned; the 2025 editions are not adopted',
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
      supersedes or modifies. ISO published 2025 editions of both documents. The CMVP has{' '}
      <strong>not</strong> adopted them, and the August 2026 IG still cites 19790:2012 <AsOf />.
      Both ISO documents are paid, so this module does not reproduce them. It teaches from public
      NIST documents and real Security Policies instead.
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
        Adding ML-KEM or ML-DSA is not “one more algorithm”. It touches the module specification
        (new approved functions), SSP management (new key types and seeds), services (new approved
        services and their indicator) and self-tests (the IG 10.3.A tests for each PQC algorithm).
        Those are four of the five categories the Manual uses to size a change — which is why a PQC
        addition is a security-relevant revalidation (see the optional route table).
      </p>
    </Callout>
  </Body>
)

// ── fips-levels ─────────────────────────────────────────────────────────────

const PLANNING_CASES: readonly { level: string; case: string; why: string }[] = [
  {
    level: 'Level 1',
    case: 'A software crypto library on a controlled server fleet',
    why: 'Physical security is N/A for software; the questions are the operational environment, the approved mode and the tested platforms.',
  },
  {
    level: 'Level 3',
    case: 'A network HSM where an attacker could get physical access',
    why: 'Physical security is part of the threat model. All four HSMs whose certificates approve ML-KEM and ML-DSA are overall Level 3.',
  },
  {
    level: 'Level 4',
    case: 'An offline root-key HSM at an unattended site, with physical attack in the threat model',
    why: 'Argued from a stated physical threat, not prestige. What Level 4 requires area by area: open question — check the current standard.',
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
        level can go through an Update.
      </li>
    </ul>
    <p>
      So the level is a design decision you make once, early, from the threat model and what your
      buyers must show — not a label you upgrade later.
    </p>

    <SubHeading>The three planning cases</SubHeading>
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
      Level 2 is a real level too. The planner focuses on Levels 1 and 3, plus one Level 4 case.
    </p>

    <Callout tone="warning" title="FIPS Level 3 and PCI: don’t over-correct">
      <p>
        A FIPS 140-3 Level 3 HSM does <strong>not</strong> thereby have PCI PTS HSM approval — that
        is a separate device approval by a PCI-recognised lab. But PCI PIN Security v3.1 (Req 1-3)
        accepts HSMs that are “FIPS140-2 or FIPS 140-3 Level 3 or higher certified, or PCI
        approved”, and P2PE v3.1 (4A-1.1) sets a similar bar (<Cite std={PCI_PIN}>PIN v3.1</Cite>,{' '}
        <Cite std={PCI_P2PE}>P2PE v3.1</Cite> — P2PE v3.2 is current; check it for changes).
      </p>
      <p>
        And a FIPS level is not an EAL: “FIPS Level 4 = EAL4+” compares two different schemes’
        answers to different questions.
      </p>
    </Callout>
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
        Each approved algorithm needs CAVP validation (tested through <Cite std={ACVP}>ACVP</Cite>);
        entropy sources go through ESV. The Manual expects these done before submission.
      </>
    ),
  },
  {
    title: 'Lab testing',
    body: 'The vendor contracts an accredited CST lab. The lab may list the module on the Implementation Under Test list — voluntary, and entries drop off after 18 months.',
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
      The Manual sets two clocks: a validation must complete within 24 months of entering Review,
      and the lab has 90 days to answer comments. It gives no typical end-to-end duration, and
      neither do we. Treat any duration figure without a source with caution.
    </p>
    <p>
      Two kinds of validation exist today. A full validation lasts five years. An{' '}
      <strong>interim</strong> validation is “a temporary measure to shorten the queue”, is “valid
      for two years only”, and relies “more on the CSTL submission with less CMVP oversight”. It can
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
      says it still supports buying and using Historical modules “for existing systems” — not for
      new ones.
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
      that a key pair regenerated from a stored FIPS 203 or FIPS 204 seed needs its pair-wise
      consistency test only before the first export or first use. Entropy is a separate track again:
      entropy source validation (<Cite std={ESV}>ESV</Cite>).
    </p>
    <p>
      Going deeper: the algorithm-testing workflow is taught in{' '}
      <Link to="/learn/pqc-testing-validation" className="text-primary underline">
        PQC Testing &amp; Validation
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
  | { kind: 'ready'; details: ReadonlyMap<string, CmvpDetails | null> }

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
        const res = await fetch('/data/compliance-data.json')
        if (!res.ok) throw new Error(String(res.status))
        const data: unknown = await res.json()
        if (!Array.isArray(data)) throw new Error('not an array')
        const wanted = new Set(certs)
        const details = new Map<string, CmvpDetails | null>()
        for (const raw of data as Partial<ComplianceRecord>[]) {
          if (raw.type !== 'FIPS 140-3' || typeof raw.id !== 'string' || !wanted.has(raw.id))
            continue
          details.set(raw.id, readCmvpDetails(raw))
        }
        if (!cancelled) setState({ kind: 'ready', details })
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

const VerifiedCertTable = () => {
  const hub = useHubCmvpDetails(VERIFIED_IDS)
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
export const FipsLandscape = () => (
  <Body>
    <p>
      Four questions, kept apart: what applies today, what is validated today, what is only in
      process or in transition, and what is still a draft. Everything here is <AsOf /> — re-check
      before you quote it.
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
    <p>
      NIST’s Active FIPS 140-3 list held about 712 certificates on {FIPS_AS_OF_LABEL}. Four Level 3
      HSM certificates approve both ML-KEM and ML-DSA:
    </p>
    <VerifiedCertTable />
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
        transition: the certificates did not fail; the scheme moved on.
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
        level can be an UPDT (§7.1.15).
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
