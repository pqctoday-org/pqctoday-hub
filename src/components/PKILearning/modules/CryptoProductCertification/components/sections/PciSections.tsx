// SPDX-License-Identifier: GPL-3.0-only
// OWNER: PCI author
/* eslint-disable security/detect-object-injection -- keys are typed literal unions (PciRefKey / PlainSourceKey) */
/**
 * Path D — PCI: device approval and the operating stack (plan r2 §5 P1–P7).
 * One named export per Learn-section id (build spec §4); CertIntroduction wraps
 * each body in <LearnSection>.
 *
 * Sources: public PCI material only (plan r2 D4). Library-backed citations go
 * through getStandard() at module init (unknown id → throws); sources without a
 * library row are cited in plain text with publisher and date (build spec §6.2).
 * Every version-sensitive claim carries an "as of" marker backed by a
 * contentFreshness.ts entry (cert-pci-*).
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { CalendarClock, ExternalLink, HelpCircle, Lightbulb, ShieldAlert } from 'lucide-react'
import { getStandard, type StandardRef } from '@/data/standardsRegistry'
import { ANCHOR_SCENARIO } from '../../data/anchorScenario'
import {
  PCI_AS_OF_LABEL,
  PCI_OPEN_QUESTIONS,
  PCI_PLAIN_SOURCES,
  PCI_PQC_FINDINGS,
  PCI_REF,
  PCI_SCHEME_CLOCKS,
  PCI_STACK,
  PCI_V5_CHANGES,
  type OpenQuestion,
  type PciRefKey,
  type PlainSourceKey,
} from '../../data/pciData'

// Resolved once at module init: an id missing from the library CSV fails fast.
const STANDARDS = new Map<PciRefKey, StandardRef>(
  (Object.keys(PCI_REF) as PciRefKey[]).map((k) => [k, getStandard(PCI_REF[k])])
)

/** Library-backed citation (links to the Library entry). */
export const PciCite = ({ refKey, label }: { refKey: PciRefKey; label?: string }) => {
  const std = STANDARDS.get(refKey)
  if (!std) return null
  return (
    <Link
      to={std.deepLink}
      className="text-xs text-primary underline-offset-2 hover:underline"
      title={std.title}
    >
      [{label ?? std.title}]
    </Link>
  )
}

/** Plain-text citation for a public source with no library row yet. */
export const PciPlainCite = ({ sourceKey }: { sourceKey: PlainSourceKey }) => {
  const src = PCI_PLAIN_SOURCES[sourceKey]
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-xs text-primary underline-offset-2 hover:underline"
    >
      [{src.publisher}, {src.title}, {src.date}]
      <ExternalLink size={10} aria-hidden="true" />
    </a>
  )
}

const AsOf = () => (
  <span className="ml-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
    <CalendarClock size={11} aria-hidden="true" />
    as of {PCI_AS_OF_LABEL}
  </span>
)

const Panel = ({
  title,
  tone = 'default',
  icon,
  children,
}: {
  title: string
  tone?: 'default' | 'warning' | 'info' | 'success'
  icon?: ReactNode
  children: ReactNode
}) => {
  const toneClass =
    tone === 'warning'
      ? 'border-status-warning/30 bg-status-warning/10'
      : tone === 'info'
        ? 'border-status-info/30 bg-status-info/10'
        : tone === 'success'
          ? 'border-status-success/30 bg-status-success/10'
          : 'border-border bg-muted/40'
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        {title}
      </h4>
      <div className="space-y-2 text-sm text-foreground/80">{children}</div>
    </div>
  )
}

const OpenQuestionBox = ({ q }: { q: OpenQuestion }) => (
  <div
    className="rounded-lg border border-dashed border-status-warning/40 bg-status-warning/5 p-3"
    data-testid="pci-open-question"
  >
    <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
      <HelpCircle size={16} className="mt-0.5 shrink-0 text-status-warning" aria-hidden="true" />
      <span>Open question — check the current document: {q.question}</span>
    </p>
    <p className="mt-1 pl-6 text-xs text-muted-foreground">{q.whyOpen}</p>
    <p className="mt-1 pl-6 text-xs text-muted-foreground">
      <strong className="text-foreground">Check:</strong> {q.checkIn}
    </p>
  </div>
)

const OpenQ = ({ id }: { id: string }) => {
  const q = PCI_OPEN_QUESTIONS.find((item) => item.id === id)
  return q ? <OpenQuestionBox q={q} /> : null
}

const Prose = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4 text-sm leading-relaxed text-foreground/80">{children}</div>
)

const anchorName = `${ANCHOR_SCENARIO.name} (${ANCHOR_SCENARIO.fictionalLabel})`

/** Learn section `pci-pts-approval` */
export const PciPtsApproval = () => (
  <Prose>
    <p>
      PCI has two very different kinds of evidence, and most mistakes about payment HSMs come from
      mixing them up. <strong>Device approval</strong> says a product model was designed and
      evaluated to PCI’s device requirements. <strong>Entity assessment</strong> says an
      organisation runs its payment operations — PIN processing, encryption, key management — to
      PCI’s operational requirements. This section is about the first: PCI PIN Transaction Security
      (PTS) Hardware Security Module (HSM) approval.
    </p>

    <h3 className="text-base font-bold text-foreground">What the approval covers</h3>
    <p>
      PCI SSC describes the PTS HSM standard as guidance for designing HSMs for the payments
      industry, “and for protecting those HSMs{' '}
      <strong>up to the point of initial deployment</strong>
      . Other security requirements apply at the point of deployment for the management of HSMs
      involved with the financial payments industry.” <PciPlainCite sourceKey="htsmProgramPage" />
    </p>
    <p>That sentence sets the boundary. An approval tells you about:</p>
    <ul className="ml-5 list-disc space-y-1">
      <li>
        <strong>a device model</strong>, at the hardware and firmware versions named on its listing;
      </li>
      <li>
        evaluated against <strong>one major version</strong> of the PTS HSM requirements (v3.x,
        v4.x, v5.x);
      </li>
      <li>
        by an independent <strong>PCI-recognized laboratory</strong>, whose report PCI SSC reviews
        before it approves and lists the device.
      </li>
    </ul>
    <p>
      It does not tell you how a bank, processor or cloud operator installs, administers or keys
      that device. Those are entity questions, answered by PIN, P2PE or KMO assessments (the
      boundary lesson below). PCI also says who must use listed products is not its call: compliance
      programmes “are managed by the payment brands”. <PciPlainCite sourceKey="htsmProgramPage" />
    </p>

    <h3 className="text-base font-bold text-foreground">Versions are part of the claim</h3>
    <p>
      The public Program Guide v1.9 (June 2020) sets two rules that still explain how listings read.
      First, “all initial evaluations under a major version … shall constitute a new evaluation and
      shall receive a new approval number.” Second, “any firmware changes to an approved device must
      result in a new firmware version.”{' '}
      <PciCite refKey="programGuide19" label="PTS Program Guide v1.9" /> So an approval number
      belongs to one requirements version, and the listing names the exact firmware versions it
      covers. Operational standards rely on that: PIN Security v3.1 Req 1-4 requires the approval
      listing to match the deployed devices’ vendor, model, hardware version, firmware version and
      approval number. <PciCite refKey="pinRoc" label="PIN v3.1 requirement text (ROC template)" />
    </p>
    <p>
      v1.9 is a <em>superseded</em> guide. It is used here because it is public; the current Device
      Testing and Approval Program Guide (listed in the Document Library on 18 May 2026) is
      licence-gated and not read for this module.
    </p>

    <h3 className="text-base font-bold text-foreground">Restricted or unrestricted</h3>
    <p>
      An HSM approval can be <strong>restricted</strong>: valid only when the HSM is deployed in at
      least a Controlled Environment as defined for PCI and in the device’s PCI HSM Security Policy.
      <strong> Unrestricted</strong> approval “is valid in any operational environment.” The listing
      states which, under Additional Information.{' '}
      <PciCite refKey="listingFields" label="PTS listing field definitions" />
      <AsOf /> Two real listings in the workshop show both: payShield 10K (4-40266) reads “Approved
      usage: Restricted” and Atalla AT1000 (4-70041) reads “Approved usage: Unrestricted”. A
      restricted approval moves a question to the deployment: the assessor of the entity running it
      checks where it is installed.
    </p>

    <h3 className="text-base font-bold text-foreground">The clocks</h3>
    <p>
      These are <strong>scheme clocks</strong> — what PCI’s device programme is doing. They are not
      market PQC deadlines, which this module never types into prose. <AsOf />
    </p>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">When</th>
            <th className="py-2 pr-3 font-semibold">What</th>
            <th className="py-2 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody>
          {PCI_SCHEME_CLOCKS.map((c) => (
            <tr key={c.when} className="border-b border-border/50 align-top">
              <td className="whitespace-nowrap py-2 pr-3 font-medium text-foreground">{c.when}</td>
              <td className="py-2 pr-3">{c.event}</td>
              <td className="py-2">
                {'ref' in c.source ? (
                  <PciCite refKey={c.source.ref} label="source" />
                ) : (
                  <PciPlainCite sourceKey={c.source.plain} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p>
      Read the table the way a vendor would. {anchorName} could still be submitted for a new v4
      approval until 30 June 2027; a v4 approval would then run to April 2033. A v5.0 approval would
      sit on the v5.x row. Nothing public states a separate v5.0 “effective date”, so do not invent
      one — the documents above are the dates that exist.
    </p>

    <Panel
      title="Prohibited shortcut"
      tone="warning"
      icon={<ShieldAlert size={16} className="text-status-warning" aria-hidden="true" />}
    >
      <p>
        “A FIPS 140-3 Level 3 HSM is PCI PTS HSM approved.” It is not: PTS approval comes only from
        a PCI-recognized lab evaluation against the PTS HSM requirements and a PCI SSC listing. The
        boundary lesson shows why this is <em>not</em> the whole story — two PCI operational
        standards accept FIPS Level 3 HSMs for their own purposes.
      </p>
    </Panel>
  </Prose>
)

/** Learn section `pci-v5-changes` */
export const PciV5Changes = () => (
  <Prose>
    <p>
      PCI SSC published PTS HSM <strong>v5.0 on 18 May 2026</strong>, with the Modular Derived Test
      Requirements v5.0 and an updated Device Testing and Approval Program Guide.{' '}
      <PciCite refKey="v5Blog" label="PCI SSC blog, 18 May 2026" /> <AsOf /> The requirement text
      sits behind PCI’s licence click-through and is not used here. What follows is what PCI said in
      public — the announcement — mapped onto {anchorName}.
    </p>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">Area</th>
            <th className="py-2 pr-3 font-semibold">What the announcement says</th>
            <th className="py-2 font-semibold">What it means for {ANCHOR_SCENARIO.name}</th>
          </tr>
        </thead>
        <tbody>
          {PCI_V5_CHANGES.map((c) => (
            <tr key={c.area} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium text-foreground">{c.area}</td>
              <td className="py-2 pr-3">{c.blogSays}</td>
              <td className="py-2">{c.forTheAnchor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <h3 className="text-base font-bold text-foreground">Three things to take away</h3>
    <ol className="ml-5 list-decimal space-y-2">
      <li>
        <strong>The cloud is now structural.</strong> v4.0 (December 2021) had already added an
        evaluation module and approval class for cloud-based HSMs in HSM-as-a-service offerings.{' '}
        <PciPlainCite sourceKey="v4PressRelease" /> v5.0 consolidates and expands the multi-tenant
        requirements and adds modules for key transfer, remote administration and “HSM Solution
        Security”. The listing definitions already carry a v5-only “HSM Solution” type.{' '}
        <PciCite refKey="listingFields" label="listing field definitions" />
      </li>
      <li>
        <strong>Device-security cryptography got stricter.</strong> ≥128-bit effective strength for
        device-security keys, no TDES for device security, no CBC-MAC for firmware or application
        authentication. These are about protecting the HSM itself, and they arrive before any PQC
        requirement does.
      </li>
      <li>
        <strong>Some content moved toward KMO.</strong> Key-loading-device and logical-security
        sections were “removed or restructured”, some aligned with PCI KMO. A vendor cannot assume
        that a control evaluated under v4 is still evaluated at the device under v5 — it may now be
        the operator’s to show.
      </li>
    </ol>

    <Panel
      title="Cited by title only (licence-gated, not read)"
      tone="info"
      icon={<Lightbulb size={16} className="text-status-info" aria-hidden="true" />}
    >
      <p>
        PCI PTS HSM Modular Security Requirements v5.0 · PCI PTS HSM Modular Derived Test
        Requirements v5.0 · HSM Security Requirements Modifications: Summary of Changes (Document
        Library, 18 May 2026) · PTS HSM Technical FAQs (Document Library, 23 September 2026) ·
        Device Testing and Approval Program Guide (Document Library, 18 May 2026).{' '}
        <PciPlainCite sourceKey="documentLibrary" />
      </p>
      <p>
        The draft went to eligible stakeholders for comment from 30 October to 15 December 2025,
        under a non-disclosure agreement. <PciPlainCite sourceKey="v5Rfc" /> Draft statements in
        that RFC blog are not the published standard; this module does not teach them as v5.0
        content.
      </p>
    </Panel>

    <OpenQ id="v5-delta-routing" />
  </Prose>
)

/** Learn section `pci-pqc-truth` */
export const PciPqcTruth = () => (
  <Prose>
    <p>
      Vendors, buyers and assessors all ask the same question:{' '}
      <em>what does PCI require for post-quantum cryptography?</em> The honest answer from the
      public material, <AsOf />, is short:{' '}
      <strong>PCI names no PQC algorithm, no parameter set and no PQC deadline.</strong> What exists
      is a listing notation, a v5.0 definition and “considerations”, and an agility requirement in
      PCI DSS. Each is read below, with what it does <em>not</em> say.
    </p>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">Source</th>
            <th className="py-2 pr-3 font-semibold">What it says</th>
            <th className="py-2 font-semibold">What it does not say</th>
          </tr>
        </thead>
        <tbody>
          {PCI_PQC_FINDINGS.map((f) => (
            <tr key={f.source} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium text-foreground">
                {f.source}
                {f.status === 'open' ? (
                  <span className="ml-1 rounded bg-status-warning/15 px-1 text-[10px] font-semibold text-status-warning">
                    open question
                  </span>
                ) : null}
              </td>
              <td className="py-2 pr-3">{f.says}</td>
              <td className="py-2">{f.doesNotSay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-muted-foreground">
      Sources: <PciCite refKey="listingFields" label="listing field definitions" />{' '}
      <PciCite refKey="v5Blog" label="v5.0 blog" /> <PciCite refKey="hsmV4" label="PTS HSM v4.0" />{' '}
      <PciCite refKey="pinRoc" label="PIN v3.1" /> <PciCite refKey="p2pe31" label="P2PE v3.1" />{' '}
      <PciCite refKey="dss401" label="PCI DSS v4.0.1" />{' '}
      <PciCite refKey="cryptoGuidanceBlog" label="Cryptography Guidance blog, 26 Aug 2025" />
    </p>

    <h3 className="text-base font-bold text-foreground">Reading the PQC notation correctly</h3>
    <p>
      The listing’s field definitions explain the notation in full. For v3-and-higher HSMs, “the HSM
      has been evaluated to determine if it supports PQC. Specifically, the support in the API
      and/or processing of the device of cryptographic algorithms that are considered secure against
      a cryptanalytic attack by a quantum computer. The details of the PQC implementation are stated
      in the security policy … This notation is for the existence of PQC support. Details of the
      degree of post-quantum readiness can be obtained from the device vendor.”{' '}
      <PciCite refKey="listingFields" label="listing field definitions" />
    </p>
    <p>So a notation gives you three facts and leaves three open:</p>
    <div className="grid gap-3 md:grid-cols-2">
      <Panel title="It tells you" tone="success">
        <ul className="ml-4 list-disc space-y-1">
          <li>the lab looked at whether the device supports PQC;</li>
          <li>PQC algorithms are available through the API or processing;</li>
          <li>the Security Policy names them, with their keys and parameters.</li>
        </ul>
      </Panel>
      <Panel title="It does not tell you" tone="warning">
        <ul className="ml-4 list-disc space-y-1">
          <li>that PCI approves any PQC algorithm for a payment function;</li>
          <li>which parameter sets, or whether hybrid modes exist;</li>
          <li>how far the product is “post-quantum ready” — ask the vendor.</li>
        </ul>
      </Panel>
    </div>
    <p>
      The absence of a notation is just as narrow. None of the three real HSM listings in the
      workshop carries one <AsOf />. That describes the listed firmware, not the vendor’s roadmap.
    </p>

    <h3 className="text-base font-bold text-foreground">
      Where the quantum exposure actually sits
    </h3>
    <p>
      PIN encryption and DUKPT are symmetric (TDES/AES); a quantum computer weakens those only
      generically, and AES with adequate key sizes is not the problem. The exposed links are the{' '}
      <strong>public-key</strong> ones:
    </p>
    <ul className="ml-5 list-disc space-y-1">
      <li>
        <strong>Remote key distribution.</strong> PIN v3.1 Annex A covers symmetric key distribution
        using asymmetric techniques. P2PE v3.1 Annex C even lets RSA-2048 keys transport AES-128
        keys in remote key distribution. <PciCite refKey="p2pe31" label="P2PE v3.1, Annex C" />
      </li>
      <li>
        <strong>Key blocks bound by signatures.</strong> PIN v3.1 Req 18-3 accepts “a digital
        signature … e.g., TR-34” as one way to bind key usage.{' '}
        <PciCite refKey="pinRoc" label="PIN v3.1" />
      </li>
      <li>
        <strong>Firmware and certificate signatures</strong> inside the device and the vendor PKI.
      </li>
    </ul>
    <p>
      That is where {anchorName}’s ML-KEM and ML-DSA would matter first. Adding them is a product
      decision today; no public PCI requirement makes it one.
    </p>

    <Panel
      title="PCI DSS 12.3.3 is agility, not a PQC mandate"
      tone="info"
      icon={<Lightbulb size={16} className="text-status-info" aria-hidden="true" />}
    >
      <p>
        Requirement 12.3.3 asks for an up-to-date inventory of cipher suites and protocols, “active
        monitoring of industry trends regarding continued viability”, and “a plan, to respond to
        anticipated changes in cryptographic vulnerabilities”, reviewed at least every 12 months.
        Its guidance calls this cryptographic agility.{' '}
        <PciCite refKey="dss401" label="PCI DSS v4.0.1" /> A PQC migration plan is a good way to
        satisfy it; the requirement does not demand PQC.
      </p>
    </Panel>

    <Panel
      title="Prohibited shortcut"
      tone="warning"
      icon={<ShieldAlert size={16} className="text-status-warning" aria-hidden="true" />}
    >
      <p>
        “A PCI listing’s PQC flag means a specific PQC algorithm or parameter set is approved.” The
        flag means support <em>exists</em>. PCI’s own PQC communication so far is awareness — for
        example the “Quantum Leap” interview series <PciPlainCite sourceKey="quantumLeapFuturex" />{' '}
        — not requirements.
      </p>
    </Panel>

    <OpenQ id="crypto-guidance-pqc" />
  </Prose>
)

/** Learn section `pci-operating-stack` */
export const PciOperatingStack = () => (
  <Prose>
    <p>
      Device approval stops at initial deployment. Everything after — who keys the HSM, where it
      sits, who administers it, how PINs and account data flow through it — is assessed at the{' '}
      <strong>entity</strong> that operates it. {anchorName} shows up in every layer below, and in
      each one a different organisation holds the evidence.
    </p>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">Layer</th>
            <th className="py-2 pr-3 font-semibold">What is assessed</th>
            <th className="py-2 pr-3 font-semibold">By whom</th>
            <th className="py-2 pr-3 font-semibold">Evidence</th>
            <th className="py-2 pr-3 font-semibold">Listing</th>
            <th className="py-2 font-semibold">{ANCHOR_SCENARIO.name}’s role</th>
          </tr>
        </thead>
        <tbody>
          {PCI_STACK.map((l) => (
            <tr key={l.id} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium text-foreground">{l.name}</td>
              <td className="py-2 pr-3">{l.whatIsAssessed}</td>
              <td className="py-2 pr-3">{l.whoAssesses}</td>
              <td className="py-2 pr-3">{l.artifact}</td>
              <td className="py-2 pr-3">{l.listing}</td>
              <td className="py-2">{l.anchorRole}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-muted-foreground">
      Sources: <PciPlainCite sourceKey="pinProgramPage" />{' '}
      <PciCite refKey="p2peProgram" label="P2PE program page" />{' '}
      <PciPlainCite sourceKey="kmoProgramPage" /> <AsOf />
    </p>

    <h3 className="text-base font-bold text-foreground">The nuance learners over-correct</h3>
    <p>
      After “FIPS Level 3 is not PTS approval”, many people conclude that FIPS certificates do not
      count in PCI at all. They do — in the operational standards, for their own purposes:
    </p>
    <ul className="ml-5 list-disc space-y-1">
      <li>
        <strong>PIN Security v3.1, Req 1-3:</strong> “All hardware security modules (HSMs) shall be
        either: FIPS140-2 or FIPS 140-3 Level 3 or higher certified, or PCI approved.”{' '}
        <PciCite refKey="pinRoc" label="PIN v3.1" />
      </li>
      <li>
        <strong>P2PE v3.1, 4A-1.1</strong> (decryption environment): HSMs “must be either: FIPS
        140-2 or 140-3 Level 3 (overall) or higher certified, or PCI PTS HSM approved.”{' '}
        <PciCite refKey="p2pe31" label="P2PE v3.1" />
      </li>
    </ul>
    <p>Two conditions come with that acceptance:</p>
    <ol className="ml-5 list-decimal space-y-1">
      <li>
        <strong>The listing must match the device.</strong> PIN Req 1-4 and P2PE 4A-1.1.1 require
        the vendor, model, hardware version and firmware version in the field to match the PTS
        listing or the FIPS certificate you rely on. A certificate for firmware 3.1.0 does not cover
        3.2.1.
      </li>
      <li>
        <strong>The certificate must be current.</strong> P2PE v3.1 adds a note: FIPS certificates
        “must not be listed as historical or revoked”. All FIPS 140-2 certificates moved to the CMVP
        Historical list on 21/22 September 2026.{' '}
        <PciCite refKey="fips140Historical" label="NIST CMVP transition" /> Under the P2PE v3.1
        text, a FIPS 140-2-only HSM therefore no longer qualifies. P2PE v3.2 is current — check
        whether it keeps the note.
      </li>
    </ol>
    <OpenQ id="pin-historical-fips" />

    <h3 className="text-base font-bold text-foreground">KMO: a new layer between them</h3>
    <p>
      PCI KMO v1.0 (14 September 2026) is an entity standard for key-management operations. Its
      initial focus is PIN and P2PE keys; it “directly addresses the use of cloud-based and remote
      HSMs”, was written in alignment with PTS HSM v5, and aims at “assess-once-use-many”.{' '}
      <PciCite refKey="kmoBlog" label="KMO v1.0 blog" /> For the multi-tenant {ANCHOR_SCENARIO.name}{' '}
      service, the operator is exactly the kind of entity KMO names. Depth is in the optional KMO
      section.
    </p>
    <OpenQ id="kmo-vs-annex-b" />

    <Panel
      title="Say it in one sentence"
      tone="success"
      icon={<Lightbulb size={16} className="text-status-success" aria-hidden="true" />}
    >
      <p>
        “{ANCHOR_SCENARIO.name} is PTS HSM approved (device, listed versions, up to deployment); our
        customer’s PIN environment is assessed by a QPA; the decryption HSMs in a P2PE solution must
        be PTS-approved or current FIPS Level 3+; and an HSM-as-a-service operator’s key management
        is an entity assessment — KMO now names it.” Payment brands decide who must validate.
      </p>
    </Panel>
  </Prose>
)

/** Learn section `pci-pin-security` (optional reference) */
export const PciPinSecurity = () => (
  <Prose>
    <p>
      The PIN Security Standard covers “the secure management, processing, and transmission of
      personal identification numbers (PINs) and associated cryptographic keys” for “acquiring
      institutions and agents responsible for PIN transaction processing”. Qualified PIN Assessors
      (QPAs) assess it, and “there are no product listings for PIN Security Standard.”{' '}
      <PciPlainCite sourceKey="pinProgramPage" /> Version 3.1 was released in March 2021 as a minor
      revision. <PciPlainCite sourceKey="pin31Blog" /> It is the current version <AsOf />.
    </p>
    <p className="text-xs text-muted-foreground">
      The requirement text below is read from the public PIN v3.1 ROC Reporting Template (Revision
      1.0c, March 2021), which reproduces the requirements.{' '}
      <PciCite refKey="pinRoc" label="PIN v3.1 ROC template" />
    </p>

    <h3 className="text-base font-bold text-foreground">What matters for an HSM vendor</h3>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">Requirement</th>
            <th className="py-2 font-semibold">What it asks</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/50 align-top">
            <td className="py-2 pr-3 font-medium text-foreground">1-3</td>
            <td className="py-2">
              HSMs are FIPS 140-2/140-3 Level 3-or-higher certified, or PCI approved. Restricted PCI
              approvals are valid only in controlled (or more robust) environments, as noted in the
              listing’s Additional Information column.
            </td>
          </tr>
          <tr className="border-b border-border/50 align-top">
            <td className="py-2 pr-3 font-medium text-foreground">1-4</td>
            <td className="py-2">
              The approval listing matches the deployed devices: vendor, model, hardware version,
              firmware version, PTS HSM or FIPS 140 approval number, and (for PCI-approved HSMs) any
              resident applications included in the PTS assessment.
            </td>
          </tr>
          <tr className="border-b border-border/50 align-top">
            <td className="py-2 pr-3 font-medium text-foreground">18-3</td>
            <td className="py-2">
              Encrypted symmetric keys are managed as <strong>key blocks</strong> with usage
              cryptographically bound. Phases: 1 — internal connections and key storage, effective 1
              June 2019; 2 — external connections to associations and networks, 1 January 2023; 3 —
              merchant hosts, POS devices and ATMs, 1 January 2025. Accepted methods include a MAC
              (e.g. TR-31), a digital signature (e.g. TR-34), or AES key wrap (ANSI X9.102).
            </td>
          </tr>
          <tr className="border-b border-border/50 align-top">
            <td className="py-2 pr-3 font-medium text-foreground">Annex A</td>
            <td className="py-2">
              Symmetric key distribution using asymmetric techniques: A1 remote key distribution
              operations, A2 certification and registration authority operations. This is the
              quantum-exposed part of PIN.
            </td>
          </tr>
          <tr className="border-b border-border/50 align-top">
            <td className="py-2 pr-3 font-medium text-foreground">Annex B</td>
            <td className="py-2">
              Key-injection facilities (KIFs). An entity can validate only the Annex B requirements
              if a KIF is all it offers.
            </td>
          </tr>
          <tr className="align-top">
            <td className="py-2 pr-3 font-medium text-foreground">Annex C</td>
            <td className="py-2">
              Minimum and equivalent key sizes and strengths for approved algorithms — rewritten in
              v3.1 to align with NIST nomenclature. <PciPlainCite sourceKey="pin31Blog" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The key-block dates are worth one warning. A June 2019 PCI blog gave estimated dates of 1 June
      2021 and 1 June 2023 for phases 2 and 3. Those were revised (announced July 2020, incorporated
      in v3.1), so the v3.1 text above — 1 January 2023 and 1 January 2025 — is the one to quote.
    </p>
    <p>
      The PTS listing connects here too: “HSM v4 and higher devices supporting PIN processing are
      required to support ISO PIN Block Format 4” (AES), and listings say so.{' '}
      <PciCite refKey="listingFields" label="listing field definitions" />
    </p>
    <p>
      <strong>PQC:</strong> the v3.1 text has no post-quantum content. A PQC-capable HSM does not
      change what a QPA tests today; it changes what the entity can do about Annex A’s asymmetric
      links when a requirement arrives.
    </p>
    <OpenQ id="pin-historical-fips" />
  </Prose>
)

/** Learn section `pci-p2pe-kif` (optional reference) */
export const PciP2peKif = () => (
  <Prose>
    <p>
      Point-to-point encryption protects account data “from the point it is captured in the
      merchant’s payment device to the point it is decrypted in a solution or component provider’s
      environment”. Merchants using PCI-listed P2PE solutions have fewer applicable PCI DSS
      requirements. <PciCite refKey="p2peProgram" label="P2PE program page" /> P2PE is assessed at
      solution providers, component providers and application vendors by P2PE Assessors, and
      solutions, components and applications are listed.
    </p>

    <Panel
      title="Version caveat — read first"
      tone="warning"
      icon={<CalendarClock size={16} className="text-status-warning" aria-hidden="true" />}
    >
      <p>
        This section shows the <strong>v3.1</strong> structure (September 2021), the last version
        read. <strong>P2PE v3.2 is current</strong> (P2PE Standard and Summary of Changes listed in
        the Document Library on 30 June 2025) <AsOf />. v3.2 is licence-gated and was not read, so
        the v3.1 requirement numbers below are <em>not</em> presented as current. Check v3.2 for
        changes. <PciCite refKey="p2pe31" label="P2PE v3.1" />
      </p>
    </Panel>

    <h3 className="text-base font-bold text-foreground">v3.1 structure: five domains</h3>
    <ol className="ml-5 list-decimal space-y-1">
      <li>Encryption device and application management (PCI-approved POI devices).</li>
      <li>Application security (software on the POI with access to clear-text account data).</li>
      <li>P2PE solution management — cannot be outsourced by the solution provider.</li>
      <li>
        Decryption environment — “4A Use approved decryption devices”: this is where the HSM rule
        (4A-1.1, FIPS Level 3+ or PTS HSM, current, and matching the deployed versions) lives.
      </li>
      <li>
        P2PE cryptographic key operations and device management — secure key management “including
        all HSMs, key-loading devices, etc.”, and the requirements for{' '}
        <strong>key-injection facilities</strong> (entities that inject keys into POI devices used
        for account-data encryption).
      </li>
    </ol>

    <h3 className="text-base font-bold text-foreground">Where the HSM appears</h3>
    <p>
      {anchorName} would show up twice in a P2PE solution: as the <strong>decryption HSM</strong> at
      the solution provider (Domain 4) and as the HSM a <strong>KIF</strong> uses to generate and
      inject terminal keys (Domain 5 in P2PE; Annex B in PIN). In both, it is the operator — not the
      vendor — who is assessed.
    </p>

    <h3 className="text-base font-bold text-foreground">Algorithms in v3.1</h3>
    <p>
      Domain 5 Normative Annex C sets minimum key sizes for approved algorithms — TDEA, RSA, ECC,
      DSA/DH and AES — with an equivalence table up to 256-bit security. It names no post-quantum
      algorithm. One footnote matters for PQC planning: “2048 RSA keys may be used to transport 128
      AES keys when performing remote key distribution using asymmetric techniques.” That RSA
      transport is the quantum-exposed link of a v3.1 solution.
    </p>
  </Prose>
)

/** Learn section `pci-kmo` (optional reference) */
export const PciKmo = () => (
  <Prose>
    <p>
      The PCI Key Management and Operations (KMO) Standard v1.0 was published on{' '}
      <strong>14 September 2026</strong>, together with the KMO Program Guide.{' '}
      <PciCite refKey="kmoBlog" label="KMO v1.0 blog" /> <AsOf /> It “defines security requirements,
      test requirements, and guidance for entities involved in the operation and management of
      systems that use cryptographic keys for the security of account data”, across the whole key
      lifecycle “from generation through to destruction”.
    </p>

    <h3 className="text-base font-bold text-foreground">What the public material says</h3>
    <ul className="ml-5 list-disc space-y-1">
      <li>
        <strong>Scope:</strong> initially PIN and P2PE keys — “consolidating, aligning, and updating
        those requirements”. Future revisions may cover other data types, such as card production.
      </li>
      <li>
        <strong>One assessment, two key types:</strong> “a single PCI KMO assessment to validate the
        security for both key types, with the resultant KMO Listing able to be referenced by a PCI
        P2PE implementation (where appropriate).”
      </li>
      <li>
        <strong>Cloud and remote HSMs:</strong> KMO “directly addresses the use of cloud-based and
        remote HSMs and has been created in alignment with the recently published PCI HSM v5
        requirements.”
      </li>
      <li>
        <strong>Design:</strong> modular, a “single source” for key-management requirements, and
        “assess-once-use-many”.
      </li>
      <li>
        <strong>Who:</strong> “entities involved in the management of cryptographic keys that are
        intended for use with PIN or P2PE data. This includes entities operating HSM-as-a-Service
        systems.” <PciPlainCite sourceKey="kmoProgramPage" />
      </li>
      <li>
        <strong>Status:</strong> KMO Assessors exist and training is offered; the KMO Assessor
        Qualification Requirements were listed in the Document Library on 21 September 2026; KMO
        listings are “Coming Soon”. <PciPlainCite sourceKey="documentLibrary" />
      </li>
    </ul>

    <h3 className="text-base font-bold text-foreground">Already visible in the device programme</h3>
    <p>
      The PTS listing definitions now define a restricted HSM approval as valid only in “a
      Controlled Environment as defined in the Key Management Operations Security and Test
      Requirements and in the device’s PCI HSM Security Policy.” Program Guide v1.9 had pointed to
      ISO 13491-2 for the same term.{' '}
      <PciCite refKey="listingFields" label="listing field definitions" />{' '}
      <PciCite refKey="programGuide19" label="Program Guide v1.9, A.2" /> The v5.0 announcement also
      says some HSM sections were aligned with KMO. For a vendor, that means the environment and
      some operational controls around {anchorName} are now explicitly the operator’s to evidence.
    </p>

    <h3 className="text-base font-bold text-foreground">What stays open</h3>
    <p>
      The KMO standard itself is behind PCI’s licence click-through and was not read. The
      consolidation language does not by itself say whether PIN Annex B and P2PE Domain 5 are
      retired, and the programme pages leave the question of who must validate to “organizations
      that manage compliance programs, such as a payment brand, acquirer, or other entity”.{' '}
      <PciPlainCite sourceKey="kmoProgramPage" /> The draft went out for comment from 16 June to 18
      July 2025 <PciPlainCite sourceKey="kmoRfc" />.
    </p>
    <OpenQ id="kmo-vs-annex-b" />
  </Prose>
)
