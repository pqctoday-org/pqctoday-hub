// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: PCI author
/* eslint-disable security/detect-object-injection -- keys are typed literal unions (PciRefKey / PlainSourceKey) */
/**
 * Path D — PCI: device approval and the operating stack (plan r2 §5 P1–P7).
 * One named export per Learn-section id (build spec §4); CertIntroduction wraps
 * each body in <LearnSection>.
 *
 * Sources: public PCI SSC pages only (plan r2 D4); documents in the PCI Document Library are
 * named by title and date and their content is not used. Library-backed citations go
 * through getStandard() at module init (unknown id → throws); sources without a
 * library row are cited in plain text with publisher and date (build spec §6.2).
 * Every version-sensitive claim carries an "as of" marker backed by a
 * contentFreshness.ts entry (cert-pci-*).
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { CalendarClock, ExternalLink, HelpCircle, Lightbulb, ShieldAlert } from 'lucide-react'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { getStandard, type StandardRef } from '@/data/standardsRegistry'
import { ANCHOR_SCENARIO } from '@/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario'
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
  type PciClock,
  type PciRefKey,
  type PlainSource,
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

/** Public PCI SSC pages held for this module that pciData.ts has no plain-source key for. */
const EXTRA_PLAIN_SOURCES = {
  keyBlocks101: {
    title: 'Key Blocks 101 (PCI Perspectives blog)',
    publisher: 'PCI SSC',
    date: '9 July 2019',
    url: 'https://blog.pcisecuritystandards.org/key-blocks-101',
  },
  quantumLeapUtimaco: {
    title:
      'The Quantum Leap: Preparing for Post Quantum Cryptography Featuring Utimaco Inc. (PCI Perspectives blog)',
    publisher: 'PCI SSC',
    date: '15 October 2026',
    url: 'https://blog.pcisecuritystandards.org/the-quantum-leap-preparing-for-post-quantum-cryptography-featuring-utimaco-inc',
  },
  ptsListing40266: {
    title: 'Approved PTS Devices listing 4-40266 (payShield 10K)',
    publisher: 'PCI SSC',
    date: 'read 30 October 2026',
    url: 'https://listings.pcisecuritystandards.org/popups/pts_device.php?appnum=4-40266',
  },
  ptsListing70041: {
    title: 'Approved PTS Devices listing 4-70041 (Atalla HSM AT1000)',
    publisher: 'PCI SSC',
    date: 'read 30 October 2026',
    url: 'https://listings.pcisecuritystandards.org/popups/pts_device.php?appnum=4-70041',
  },
  ptsListing40069: {
    title: 'Approved PTS Devices listing 4-40069 (payShield 9000)',
    publisher: 'PCI SSC',
    date: 'read 30 October 2026',
    url: 'https://listings.pcisecuritystandards.org/popups/pts_device.php?appnum=4-40069',
  },
} satisfies Record<string, PlainSource>

type CiteSourceKey = PlainSourceKey | keyof typeof EXTRA_PLAIN_SOURCES

const CITED_SOURCES: Record<CiteSourceKey, PlainSource> = {
  ...PCI_PLAIN_SOURCES,
  ...EXTRA_PLAIN_SOURCES,
}

/** Plain-text citation for a public source with no library row yet. */
export const PciPlainCite = ({ sourceKey }: { sourceKey: CiteSourceKey }) => {
  const src = CITED_SOURCES[sourceKey]
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

/** The source cell of a scheme-clock row (library-backed or plain-text citation). */
const PciClockSource = ({ source }: { source: PciClock['source'] }) =>
  'ref' in source ? (
    <PciCite refKey={source.ref} label="source" />
  ) : (
    <PciPlainCite sourceKey={source.plain} />
  )

const AsOf = () => (
  <span className="ml-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
    <CalendarClock size={11} aria-hidden="true" />
    as of {PCI_AS_OF_LABEL}
  </span>
)

/** Marker on the first cell of a finding: an open question, or a document this module does not use. */
const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'open') {
    return (
      <span className="ml-1 rounded bg-status-warning/15 px-1 text-[10px] font-semibold text-status-warning">
        open question
      </span>
    )
  }
  if (status === 'not used') {
    return (
      <span className="ml-1 rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
        not used
      </span>
    )
  }
  return null
}

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
      This lesson covers four PCI programmes: PTS HSM, PIN Security, P2PE and key management
      operations. It does not cover PTS POI, card production and provisioning, 3-D Secure, or MPoC
      and CPoC.
    </p>
    <p>
      PCI has two very different kinds of evidence, and most mistakes about payment HSMs come from
      mixing them up. <strong>Device approval</strong> says a product model was designed and
      evaluated to PCI’s device requirements. <strong>Entity assessment</strong> says an
      organisation runs its payment operations — PIN processing, encryption, key management — to
      PCI’s operational requirements. This section is about the first: PCI PIN Transaction Security
      (PTS) Hardware Security Module (HSM) approval.
    </p>
    <p className="text-xs text-muted-foreground">
      Everything PCI-specific in this lesson comes from public PCI SSC pages, which are cited next
      to each statement. Where a sentence is this module’s own reading or advice, it says so.
      Documents in the PCI Document Library are named by title and date only; their content is not
      used here.
    </p>

    <h3 className="text-base font-bold text-foreground">What the approval covers</h3>
    <p>
      PCI SSC describes the PTS HSM standard as providing guidance for designing HSMs to meet the
      security needs of the financial payments industry, “and for protecting those HSMs{' '}
      <strong>up to the point of initial deployment</strong>. Other security requirements apply at
      the point of deployment for the management of HSMs involved with the financial payments
      industry.” <PciPlainCite sourceKey="htsmProgramPage" />
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
        by an independent <strong>PCI-recognized laboratory</strong>: “Independent PCI-Recognized
        Laboratories evaluate HSMs against PTS HSM security requirements. PCI SSC reviews evaluation
        reports, approves PTS HSM devices, and provides a listing of approved devices.”{' '}
        <PciPlainCite sourceKey="htsmProgramPage" />
      </li>
    </ul>
    <p>
      This module reads the page’s “other security requirements” at deployment as entity questions —
      how a bank, processor or cloud operator installs, administers or keys the device — answered by
      PIN, P2PE or KMO assessments (the boundary lesson below). That mapping is the module’s own
      reading. PCI says who must validate, or use a listed product, is not its call: “Compliance
      programs for all PCI SSC standards are managed by the payment brands.”{' '}
      <PciPlainCite sourceKey="htsmProgramPage" />
    </p>

    <h3 className="text-base font-bold text-foreground">Versions are part of the claim</h3>
    <p>
      The listing’s field definitions say: “Version refers to the version of the security
      requirements the device has been evaluated against. Each approval class may follow its own
      version release schedule.” They also say: “Approval numbers are assigned by PCI SSC at the
      time of approval and remain the same for the life of the device’s approval.”{' '}
      <PciCite refKey="listingFields" label="PTS listing field definitions" /> So read a listing as
      a pair: the approval number and the requirements version behind it. This module’s own advice,
      not a PCI requirement: when you rely on a listed device, compare the vendor, model, hardware
      and firmware versions and the approval number you deploy with the listing.
    </p>
    <p>
      PCI’s Device Testing and Approval Program Guide is listed in the Document Library on 18 May
      2026; the feed gives its title and date and no version number.{' '}
      <PciPlainCite sourceKey="documentLibrary" /> Its content is not used in this module.
    </p>

    <h3 className="text-base font-bold text-foreground">Restricted or unrestricted</h3>
    <p>
      An HSM approval can be <strong>restricted</strong>: “Approval is valid only when deployed in
      an environment meeting at least the security requirements of a Controlled Environment as
      defined in the Key Management Operations Security and Test Requirements and in the device’s
      PCI HSM Security Policy.” <strong>Unrestricted</strong> approval “is valid in any operational
      environment.” The listing states which, under Additional Information.{' '}
      <PciCite refKey="listingFields" label="PTS listing field definitions" />
      <AsOf /> Two real listings, read on 30 October 2026, show both: payShield 10K (4-40266) reads
      “Approved usage: Restricted” <PciPlainCite sourceKey="ptsListing40266" /> and Atalla HSM
      AT1000 (4-70041) reads “Approved usage: Unrestricted”{' '}
      <PciPlainCite sourceKey="ptsListing70041" />. This module’s reading: a restricted approval
      moves a question to the deployment, to be answered where the device is installed.
    </p>

    <h3 className="text-base font-bold text-foreground">The clocks</h3>
    <p>
      These are <strong>scheme clocks</strong> — what PCI’s device programme is doing. They are not
      market PQC deadlines, which this module never types into prose. The dates in the listing’s
      expiry table say when device approvals expire; no PCI page used here ties them to quantum.{' '}
      <AsOf />
    </p>
    {/* Below 640 px the dates read as stacked blocks (date, description, source) so nothing is cut
        off or scrolls sideways; from 640 px up it is the table. Only one of the two is displayed
        at a time, so assistive technology never reads the rows twice. */}
    <ul className="space-y-3 text-xs sm:hidden" data-testid="pci-clocks-stacked">
      {PCI_SCHEME_CLOCKS.map((c) => (
        <li key={c.when} className="border-b border-border/50 pb-3">
          <p className="font-bold text-foreground">{c.when}</p>
          <p className="mt-1">{c.event}</p>
          <p className="mt-1">
            <PciClockSource source={c.source} />
          </p>
        </li>
      ))}
    </ul>
    <div className="hidden overflow-x-auto sm:block" data-testid="pci-clocks-table">
      <table className="w-full border-collapse text-left text-xs">
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
                <PciClockSource source={c.source} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p>
      Read the expiry table the way a vendor would. For HSMs it gives v4.x: requirements approval
      June 2027, device models April 2033; and v5.x: May 2030 and April 2036 (the columns are
      “Expiration of Requirements Approval” and “Expiration of Device Models”).{' '}
      <PciCite refKey="listingFields" label="PTS listing field definitions" /> Applied to{' '}
      {anchorName}: a device evaluated under v4.x would carry a device-model expiry of April 2033,
      and one under v5.x April 2036. The v5.0 announcement states no separate effective date, so do
      not invent one — the dates in the table above are the ones the pages used here give.
    </p>

    <Panel
      title="Prohibited shortcut"
      tone="warning"
      icon={<ShieldAlert size={16} className="text-status-warning" aria-hidden="true" />}
    >
      <p>
        “A FIPS 140-3 Level 3 HSM is PCI PTS HSM approved.” It is not: PCI SSC says laboratories
        evaluate HSMs against the PTS HSM requirements, and PCI SSC reviews the reports, approves
        the devices and lists them. <PciPlainCite sourceKey="htsmProgramPage" /> Whether another PCI
        programme accepts a FIPS certificate in place of a PTS approval is set in that programme’s
        own requirement text, which this module does not state.
      </p>
    </Panel>
  </Prose>
)

/** Learn section `pci-v5-changes` */
export const PciV5Changes = () => (
  <Prose>
    <p>
      PCI SSC published PTS HSM <strong>v5.0 on 18 May 2026</strong>, with the Modular Derived Test
      Requirements v5.0 and the Device Testing and Approval Program Guide.{' '}
      <PciCite refKey="v5Blog" label="PCI SSC blog, 18 May 2026" /> <AsOf /> The requirement text is
      not a public PCI SSC page and is not used here. What follows is what the public announcement
      says, set beside {anchorName}; the column about the anchor product is this module’s own
      illustration.
    </p>

    <ResponsiveTable
      caption="What the PCI announcement says, area by area, and what it means for the anchor product"
      head={['Area', 'What the announcement says', <>What it means for {ANCHOR_SCENARIO.name}</>]}
      rows={PCI_V5_CHANGES.map((c) => [c.area, c.blogSays, c.forTheAnchor])}
      strongFirstColumn
      testId="pci-v5-changes"
    />

    <h3 className="text-base font-bold text-foreground">Three things to take away</h3>
    <ol className="ml-5 list-decimal space-y-2">
      <li>
        <strong>The cloud is now structural.</strong> The HSM standard page says the standard “has
        been expanded to include Multi-tenant HSMs, which are HSMs intended for concurrent usage by
        multiple organizations at a cloud services provider”.{' '}
        <PciPlainCite sourceKey="htsmProgramPage" /> The v5.0 announcement says the multi-tenant
        requirements “have been consolidated and expanded” and adds modules for Key-Transfer
        Functionality, Remote Administration and “HSM Solution Security”. The listing’s function
        types already include “HSM Solution (v5 only)” and “Multi-tenant HSM (v4 only)”.{' '}
        <PciCite refKey="listingFields" label="listing field definitions" />
      </li>
      <li>
        <strong>Device-security cryptography got stricter.</strong> The announcement says
        device-security keys need an effective key strength of at least 128 bits, TDES is no longer
        permitted for device security purposes, and weak methods such as CBC-MAC are prohibited for
        firmware or application authentication. These are about protecting the HSM itself. The same
        announcement says the update includes “support for post-quantum cryptography
        considerations”, and it names no post-quantum algorithm and no deadline.
      </li>
      <li>
        <strong>Some content moved toward KMO.</strong> The announcement says several legacy
        sections (key-loading devices, logical security and specific functionality-based sections)
        “have been removed or restructured”, with responsibilities redistributed across new modular
        evaluation areas or aligned with the PCI Key Management and Operations (KMO) framework. This
        module’s reading: a vendor cannot assume that a control evaluated under v4 is still
        evaluated at the device under v5 — some of it may now be the operator’s to show.
      </li>
    </ol>

    <Panel
      title="Cited by title and date only (Document Library: content not used)"
      tone="info"
      icon={<Lightbulb size={16} className="text-status-info" aria-hidden="true" />}
    >
      <p>
        Hardware Security Module (HSM) Modular Security Requirements · HSM Security Requirements
        Modifications: Summary of Changes · Device Testing and Approval Program Guide (all listed 18
        May 2026) · PTS HSM Technical Frequently Asked Questions (listed 28 October 2026).{' '}
        <PciPlainCite sourceKey="documentLibrary" />
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
      <em>what does PCI require for post-quantum cryptography?</em> The honest answer from PCI SSC’s
      standard announcements and listing definitions used for this module, <AsOf />, is short:{' '}
      <strong>they name no PQC algorithm, no parameter set and no PQC deadline.</strong> What exists
      there is a listing notation and post-quantum wording in the v5.0 announcement. PCI SSC’s
      Quantum Leap interviews are awareness material in which the interviewees, not PCI SSC, name
      algorithms such as ML-KEM and ML-DSA. Each is read below, with what it does <em>not</em> say.
    </p>

    <ResponsiveTable
      caption="What each public PCI source says and does not say about post-quantum cryptography"
      head={['Source', 'What it says', 'What it does not say']}
      rows={PCI_PQC_FINDINGS.map((f) => [
        <>
          {f.source}
          <StatusBadge status={f.status} />
        </>,
        f.says,
        f.doesNotSay,
      ])}
      strongFirstColumn
      testId="pci-pqc-findings"
    />
    <p className="text-xs text-muted-foreground">
      Sources: <PciCite refKey="listingFields" label="listing field definitions" />{' '}
      <PciCite refKey="v5Blog" label="v5.0 blog" />{' '}
      <PciCite refKey="dss401" label="PCI DSS v4.0.1" />{' '}
      <PciCite refKey="cryptoGuidanceBlog" label="Cryptography Guidance blog, 26 Aug 2025" /> A row
      marked “not used” is a document that is not a public PCI SSC page.
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
          <li>the Security Policy states the details, including all cryptography and its CSPs.</li>
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
      The absence of a notation is just as narrow. None of the three real HSM listings read for the
      workshop shows one on 30 October 2026 (4-40266, 4-70041 and 4-40069).{' '}
      <PciPlainCite sourceKey="ptsListing40266" /> <PciPlainCite sourceKey="ptsListing70041" />{' '}
      <PciPlainCite sourceKey="ptsListing40069" /> The 4-40069 listing is v1.x, which the PQC
      field’s “v3 and higher” scope does not cover. That describes the listed firmware, not the
      vendor’s roadmap.
    </p>

    <h3 className="text-base font-bold text-foreground">
      Where the quantum exposure actually sits
    </h3>
    <p>
      This part is the module’s own reasoning, not a PCI statement. Symmetric keys (TDES, AES) are
      not where a quantum computer helps most; the most exposed links are the{' '}
      <strong>public-key</strong> ones, wherever a symmetric key is distributed or a message is
      signed with RSA or elliptic-curve cryptography. Two things in the public PCI pages bear on
      that:
    </p>
    <ul className="ml-5 list-disc space-y-1">
      <li>
        <strong>Key blocks.</strong> PCI’s Key Blocks 101 post calls Key Blocks “a standard way of
        protecting the integrity of cryptographic keys and of associating them with their intended
        use”, for both TDEA and AES keys. <PciPlainCite sourceKey="keyBlocks101" /> A Utimaco
        cryptographer says in the Quantum Leap interview: “We currently lack standards for key
        management, asymmetric key blocks, and other protocols.” That is Utimaco’s view, not a PCI
        requirement. <PciPlainCite sourceKey="quantumLeapUtimaco" />
      </li>
      <li>
        <strong>Firmware and certificate signatures</strong> inside the device and the vendor PKI.
        The v5.0 announcement says device-security keys such as firmware authentication keys need an
        effective strength of at least 128 bits and prohibits weak methods such as CBC-MAC for
        firmware or application authentication; it names EC-SDSA for certain use cases and no
        post-quantum signature algorithm. <PciCite refKey="v5Blog" label="v5.0 blog" />
      </li>
    </ul>
    <p>
      In this module’s scenario, that is where {anchorName}’s ML-KEM and ML-DSA would matter first.
      Adding them is a product decision today; none of the public PCI pages used here makes it a
      requirement.
    </p>

    <Panel
      title="What the public PCI pages say about PQC"
      tone="info"
      icon={<Lightbulb size={16} className="text-status-info" aria-hidden="true" />}
    >
      <p>
        The PCI DSS v4.0.1 announcement does not mention post-quantum cryptography. It describes a
        limited revision with “no additional or deleted requirements”, says PCI DSS v4.0 would
        retire on 31 December 2024 so that v4.0.1 is “the only active version” of the standard, and
        says the 31 March 2025 effective date for the new requirements did not change.{' '}
        <PciCite refKey="dss401" label="PCI DSS v4.0.1" /> The requirement text of the standard
        itself is not reproduced in this module.
      </p>
    </Panel>

    <Panel
      title="Prohibited shortcut"
      tone="warning"
      icon={<ShieldAlert size={16} className="text-status-warning" aria-hidden="true" />}
    >
      <p>
        “A PCI listing’s PQC flag means a specific PQC algorithm or parameter set is approved.” The
        flag means support <em>exists</em>. The “Quantum Leap” interview series on PCI SSC’s blog is
        described as “a resource for payment security industry stakeholders to share information
        about how they are taking steps to ensure their systems are crypto-agile into the future”:
        awareness material, in which the interviewees’ statements are their own, not PCI
        requirements. <PciPlainCite sourceKey="quantumLeapFuturex" />
      </p>
    </Panel>

    <OpenQ id="crypto-guidance-pqc" />
  </Prose>
)

/** Learn section `pci-operating-stack` */
export const PciOperatingStack = () => (
  <Prose>
    <p>
      Device approval, per the HSM standard page, protects HSMs “up to the point of initial
      deployment”; other security requirements apply at deployment.{' '}
      <PciPlainCite sourceKey="htsmProgramPage" /> This module reads everything after — who keys the
      HSM, where it sits, who administers it, how PINs and account data flow through it — as
      assessed at the <strong>entity</strong> that operates it. {anchorName} shows up in every layer
      below, and in each one a different organisation holds the evidence.
    </p>

    <ResponsiveTable
      caption="The layers of the operating stack: what is assessed in each, by whom, and what evidence it leaves"
      head={[
        'Layer',
        'What is assessed',
        'By whom',
        'Evidence',
        'Listing',
        <>{ANCHOR_SCENARIO.name}’s role</>,
      ]}
      rows={PCI_STACK.map((l) => [
        l.name,
        l.whatIsAssessed,
        l.whoAssesses,
        l.artifact,
        l.listing,
        l.anchorRole,
      ])}
      strongFirstColumn
      testId="pci-operating-stack"
    />
    <p className="text-xs text-muted-foreground">
      Sources: <PciPlainCite sourceKey="htsmProgramPage" />{' '}
      <PciCite refKey="p2peProgram" label="P2PE program page" />{' '}
      <PciPlainCite sourceKey="kmoProgramPage" /> <AsOf />
    </p>

    <h3 className="text-base font-bold text-foreground">What this module does not state</h3>
    <p>
      After “FIPS Level 3 is not PTS approval”, many people ask whether FIPS certificates count
      anywhere in PCI. Whether a PCI operational standard accepts a FIPS 140-2 or 140-3 certificate
      in place of a PTS HSM approval — and what it requires the listing or certificate to match — is
      set in that standard’s own requirement text. That text is not a public PCI SSC page, so this
      module does not state it. Read it in the current standard, and check which version applies.
    </p>
    <p>
      One fact that is not PCI’s may matter when you do: NIST’s CMVP schedule moves all FIPS 140-2
      certificates to the Historical List on 21/22 September 2026.{' '}
      <PciCite refKey="fips140Historical" label="NIST CMVP transition" />
    </p>
    <p>
      P2PE has a version rule of its own: v3.2 replaced v3.1 for new submissions and reassessments
      on 1 January 2026, and existing v3.1 validations are unaffected.{' '}
      <PciPlainCite sourceKey="p2pe32Blog" />
    </p>
    <OpenQ id="pin-historical-fips" />

    <h3 className="text-base font-bold text-foreground">KMO: a new layer between them</h3>
    <p>
      PCI KMO v1.0 (14 September 2026) is a standard for key-management operations. Its initial
      focus is PIN and P2PE keys; it “directly addresses the use of cloud-based and remote HSMs”,
      was created in alignment with PCI HSM v5, and is designed for an “assess-once-use-many”
      approach. <PciCite refKey="kmoBlog" label="KMO v1.0 blog" /> The KMO page names “entities
      operating HSM-as-a-Service systems” in its intended audience.{' '}
      <PciPlainCite sourceKey="kmoProgramPage" /> In this module’s scenario, that describes the
      operator of the multi-tenant {ANCHOR_SCENARIO.name} service. Depth is in the optional KMO
      section.
    </p>
    <OpenQ id="kmo-vs-annex-b" />

    <Panel
      title="Say it in one sentence"
      tone="success"
      icon={<Lightbulb size={16} className="text-status-success" aria-hidden="true" />}
    >
      <p>
        In this module’s reading: “{ANCHOR_SCENARIO.name} is PTS HSM approved (device, listed
        versions, up to deployment); a P2PE solution is assessed by P2PE Assessors and listed; an
        HSM-as-a-service operator’s key management is an entity matter that KMO’s audience names,
        and KMO Assessors assess environments where cryptographic keys are managed.” Payment brands
        decide who must validate.
      </p>
    </Panel>
  </Prose>
)

/** Learn section `pci-pin-security` (optional reference) */
export const PciPinSecurity = () => (
  <Prose>
    <p>
      The PCI PIN Security Standard “provides requirements and testing procedures for the secure
      management, processing, and transmission of PIN data at ATMs and attended and unattended
      point-of-sale (POS) terminals”. Version 3.1 was released on 12 March 2021 as a minor revision.{' '}
      <PciPlainCite sourceKey="pin31Blog" /> The Document Library lists the PIN Security
      Requirements and Testing Procedures with the date 11 March 2021.{' '}
      <PciPlainCite sourceKey="documentLibrary" /> <AsOf />
    </p>
    <p className="text-xs text-muted-foreground">
      This section uses only what public PCI SSC pages say about PIN Security: the v3.1
      announcement, the Key Blocks 101 post and the PTS listing definitions. The requirement text
      itself is not a public PCI SSC page and is not used here.
    </p>

    <h3 className="text-base font-bold text-foreground">What matters for an HSM vendor</h3>
    <ResponsiveTable
      caption="What the public PCI pages say about PIN Security, topic by topic, for an HSM vendor"
      head={['Topic', 'What the public pages say']}
      rows={[
        [
          'Scope',
          <>
            Requirements and testing procedures for the secure management, processing and
            transmission of PIN data at ATMs and attended and unattended POS terminals.{' '}
            <PciPlainCite sourceKey="pin31Blog" />
          </>,
        ],
        [
          'HSM approvals',
          <>
            The v3.1 announcement clarifies that a PCI-approved HSM’s approval “may be contingent on
            being deployed in controlled environments or more robust (e.g., secure) environments as
            defined in ISO 13491-2 and in the device’s PCI HSM Security Policy”, and that this is
            noted in the Additional Information column of approved PTS devices.{' '}
            <PciPlainCite sourceKey="pin31Blog" />
          </>,
        ],
        [
          'Key blocks (Requirement 18-3)',
          <>
            The Standard requires implementation of Key Blocks, “a standard way of protecting the
            integrity of cryptographic keys and of associating them with their intended use”, usable
            for both TDEA and AES keys. <PciPlainCite sourceKey="keyBlocks101" /> v3.1 incorporated
            revised effective dates for key block implementations, announced in July 2020 in
            response to stakeholder feedback about the impact of COVID-19; take dates from the
            current Standard and PCI’s bulletin “Revisions to the Implementation Date for PCI PIN
            Security Requirement 18-3”, not from this table. <PciPlainCite sourceKey="pin31Blog" />
          </>,
        ],
        [
          'Encrypted key injection (Requirement 32-9)',
          <>
            v3.1 incorporated the earlier-announced revisions to the dates and scope for
            implementing encrypted key injection: the dates were deferred three years and the
            applicability changed from POI v3 and higher devices to POI v5 and higher devices (the
            change was announced in November 2020). <PciPlainCite sourceKey="pin31Blog" />
          </>,
        ],
        [
          'ISO Format 4 PIN blocks',
          <>
            v3.1 suspended the effective dates for entities to support ISO Format 4 PIN blocks
            (announced March 2021), to be reevaluated for the migration from TDEA to AES.{' '}
            <PciPlainCite sourceKey="pin31Blog" /> The PTS listing definitions say HSM v4 and higher
            devices supporting PIN processing “are required to support ISO PIN Block Format 4”
            (AES). <PciCite refKey="listingFields" label="listing field definitions" />
          </>,
        ],
        [
          'Annex C',
          <>
            Normative Annex C is titled “Minimum and Equivalent Key Sizes and Strengths for Approved
            Algorithms”; v3.1 rewrote it for clarity and to align with the nomenclature used in NIST
            publications. This module states nothing about the annex’s content.{' '}
            <PciPlainCite sourceKey="pin31Blog" />
          </>,
        ],
      ]}
      strongFirstColumn
      testId="pci-pin-requirements"
    />
    <p>
      <strong>PQC:</strong> none of the public PIN Security pages used here (the v3.1 announcement
      and Key Blocks 101) mentions post-quantum cryptography. The listing’s PQC notation (see the
      PQC lesson) records only that PQC support exists.
    </p>
    <OpenQ id="pin-historical-fips" />
  </Prose>
)

/** Learn section `pci-p2pe-kif` (optional reference) */
export const PciP2peKif = () => (
  <Prose>
    <p>
      P2PE requirements are intended “to protect payment account data via encryption from the point
      it is captured in the merchant’s payment device to the point it is decrypted in a solution or
      component provider’s environment”. Merchants using PCI-listed P2PE solutions have fewer
      applicable PCI DSS requirements. <PciCite refKey="p2peProgram" label="P2PE program page" />{' '}
      P2PE Assessors “are qualified and trained by PCI SSC to perform independent assessments of
      P2PE solutions, components, and applications”.
    </p>

    <Panel
      title="Version caveat — read first"
      tone="warning"
      icon={<CalendarClock size={16} className="text-status-warning" aria-hidden="true" />}
    >
      <p>
        <strong>P2PE v3.2 is current</strong>: PCI SSC announced it on 30 June 2025 as a minor
        revision, and the Council is developing P2PE v4.0. The Document Library lists the P2PE
        Standard and its Summary of Changes on 30 June 2025. <AsOf /> v3.1 submissions were accepted
        through 31 December 2025 and had to complete quality review by 31 March 2026; from 1 January
        2026 all new submissions and reassessments must comply with v3.2, and existing v3.1
        validations are unaffected. <PciPlainCite sourceKey="p2pe32Blog" />{' '}
        <PciPlainCite sourceKey="documentLibrary" /> The P2PE standard documents are not public PCI
        SSC pages, so this module does not describe their structure or requirement numbers: check
        the current version.
      </p>
    </Panel>

    <h3 className="text-base font-bold text-foreground">Where the HSM appears</h3>
    <p>
      This is the module’s own scenario. {anchorName} would be the HSM at a solution provider that
      decrypts account data in a P2PE solution, and the HSM a key-injection facility uses to
      generate and inject terminal keys (the PIN Security v3.1 announcement names “encrypted key
      injection”). <PciPlainCite sourceKey="pin31Blog" /> In both, this module’s reading is that the
      operator — not the vendor — is the entity that is assessed.
    </p>

    <h3 className="text-base font-bold text-foreground">PQC in the public P2PE pages</h3>
    <p>
      The public P2PE pages used here (the program page and the v3.2 announcement) do not mention
      post-quantum cryptography. This module therefore states no P2PE algorithm requirement and no
      deadline.
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
        those requirements”. Future revisions “may address additional specific needs of other data
        types such as those covered by the PCI Card Production Standards”.
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
        <strong>Design:</strong> modular, “a single source for requirements covering key management
        operations”, and “assess-once-use-many”.
      </li>
      <li>
        <strong>Who:</strong> “Entities involved in the management of cryptographic keys that are
        intended for use with PIN or P2PE data. This includes entities operating HSM-as-a-Service
        systems which may operate on those keys.” <PciPlainCite sourceKey="kmoProgramPage" />
      </li>
      <li>
        <strong>Status:</strong> KMO Assessors are qualified and trained by PCI SSC, and a KMO
        Assessor course exists. The KMO Assessor Qualification Requirements were listed in the
        Document Library on 21 September 2026. The KMO page shows its listings as “Coming Soon”.{' '}
        <PciPlainCite sourceKey="kmoProgramPage" /> <PciPlainCite sourceKey="documentLibrary" />
      </li>
    </ul>

    <h3 className="text-base font-bold text-foreground">Already visible in the device programme</h3>
    <p>
      The PTS listing definitions now define a restricted HSM approval as valid only in “a
      Controlled Environment as defined in the Key Management Operations Security and Test
      Requirements and in the device’s PCI HSM Security Policy.”{' '}
      <PciCite refKey="listingFields" label="listing field definitions" /> The PIN Security v3.1
      announcement (March 2021) had pointed to ISO 13491-2 for controlled environments.{' '}
      <PciPlainCite sourceKey="pin31Blog" /> The v5.0 announcement also says some HSM sections were
      aligned with KMO. <PciCite refKey="v5Blog" label="v5.0 blog" /> This module’s reading: for a
      vendor, the environment and some operational controls around {anchorName} are now explicitly
      the operator’s to evidence.
    </p>

    <h3 className="text-base font-bold text-foreground">What stays open</h3>
    <p>
      The KMO standard document is not a public PCI SSC page and is not used here. The
      announcement’s consolidation language does not by itself say what becomes of the existing PIN
      and P2PE key-management requirements, and the KMO page leaves the question of who must
      validate to “organizations that manage compliance programs, such as a payment brand, acquirer,
      or other entity”. <PciPlainCite sourceKey="kmoProgramPage" />
    </p>
    <OpenQ id="kmo-vs-annex-b" />
  </Prose>
)
