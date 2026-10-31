// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: CC/EU author
/**
 * Learn-section bodies for the Common Criteria (`cc`) and EUCC & eIDAS
 * (`eucc-eidas`) paths. One named export per section id (build spec §4);
 * CertIntroduction wraps each in <LearnSection>, so only the BODY renders here.
 *
 * Sources: every fact was read on 24 September 2026 (plan r2 §0 and the
 * documents cited inline). Library-backed citations go through getStandard().
 * No ISO/IEC 19790/24759 text and no CEN-edition EN 419221-5 text is quoted;
 * PP excerpts come from the public certified PP on the CC portal.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Compass,
  Info,
} from 'lucide-react'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { getStandard } from '@/data/standardsRegistry'
import { PathScopedContent } from '@/components/PKILearning/common/LearnPathPicker'
import { ModuleAnalysisNote } from '@/components/PKILearning/common/ModuleAnalysisNote'
import { ANCHOR_SCENARIO } from '@/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario'
import { ASSURANCE_COMPONENTS, CC_EU_AS_OF } from '../../data/ccEuData'
import {
  ADDITION_KIND_LABEL,
  CCRA_MEMBERS_SOURCE,
  CCRA_SOURCE,
  COVERAGE_MAP,
  OUTSIDE_CCRA,
  REGIONAL_AS_OF,
  REGIONAL_AS_OF_LABEL,
  REGIONAL_SCHEMES,
  REGIONS,
  type AdditionKind,
  type MapEntry,
  type SourceRef,
} from '../../data/regionalSchemesData'

// ── Shared presentational helpers (also used by the CC/EU workshop steps) ───

const AS_OF_LABEL = '24 September 2026'

/** Inline citation of a library row. getStandard() throws on an unknown id. */
export const SourceCite = ({ id, label }: { id: string; label?: string }) => {
  const ref = getStandard(id)
  return (
    <Link
      to={ref.deepLink}
      title={ref.title}
      className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {label ?? ref.id}
    </Link>
  )
}

/** A named source that is intentionally not resolved through the Library. */
export const PlainSource = ({ children }: { children: ReactNode }) => (
  <span className="italic text-foreground/80">{children}</span>
)

/** Version-sensitive marker (build spec §6.5). */
export const AsOf = () => (
  <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
    (as of {AS_OF_LABEL})
  </span>
)

/** UNVERIFIED items stay labelled (plan r2 §0, build spec §6.1). */
export const OpenQuestion = ({ children }: { children: ReactNode }) => (
  <div
    className="flex items-start gap-2 rounded-lg border border-status-info/30 bg-status-info/10 p-3 text-sm"
    data-testid="cceu-open-question"
  >
    <CircleHelp size={16} className="mt-0.5 shrink-0 text-status-info" aria-hidden="true" />
    <p className="text-foreground">
      <strong>Open question — check the current document.</strong> {children}
    </p>
  </div>
)

type CalloutTone = 'key' | 'warn' | 'current' | 'planning'

const TONE_CLASS: ReadonlyMap<CalloutTone, string> = new Map([
  ['key', 'border-primary/30 bg-primary/5'],
  ['warn', 'border-status-warning/30 bg-status-warning/10'],
  ['current', 'border-status-success/30 bg-status-success/10'],
  ['planning', 'border-status-info/30 bg-status-info/10'],
])

const TONE_ICON: ReadonlyMap<CalloutTone, ReactNode> = new Map([
  [
    'key',
    <Compass key="k" size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />,
  ],
  [
    'warn',
    <AlertTriangle
      key="w"
      size={16}
      className="mt-0.5 shrink-0 text-status-warning"
      aria-hidden="true"
    />,
  ],
  [
    'current',
    <CheckCircle2
      key="c"
      size={16}
      className="mt-0.5 shrink-0 text-status-success"
      aria-hidden="true"
    />,
  ],
  [
    'planning',
    <CalendarClock
      key="p"
      size={16}
      className="mt-0.5 shrink-0 text-status-info"
      aria-hidden="true"
    />,
  ],
])

const Callout = ({
  tone,
  title,
  children,
}: {
  tone: CalloutTone
  title?: string
  children: ReactNode
}) => (
  <div className={`flex items-start gap-3 rounded-lg border p-4 ${TONE_CLASS.get(tone) ?? ''}`}>
    {TONE_ICON.get(tone)}
    <div className="min-w-0 space-y-1 text-sm text-foreground">
      {title ? <p className="font-semibold">{title}</p> : null}
      {children}
    </div>
  </div>
)

const P = ({ children }: { children: ReactNode }) => (
  <p className="text-sm leading-relaxed text-foreground/90">{children}</p>
)

const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="pt-2 text-base font-semibold text-foreground">{children}</h3>
)

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">{children}</code>
)

const Quote = ({ children, cite }: { children: ReactNode; cite: ReactNode }) => (
  <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-foreground/90">
    <p className="italic">“{children}”</p>
    <p className="mt-1 text-xs text-muted-foreground">— {cite}</p>
  </blockquote>
)

/** Every table in this lesson: a table from 640 px up, stacked rows below it (see ResponsiveTable). */
const DataTable = ({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: ReactNode[][]
}) => (
  <ResponsiveTable
    caption={caption}
    head={head}
    rows={rows}
    size="sm"
    className="text-foreground/90"
    testId="cc-table"
  />
)

const Sources = ({ children, readOn = AS_OF_LABEL }: { children: ReactNode; readOn?: string }) => (
  <div className="flex items-start gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
    <BookOpen size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
    <p>
      <span className="font-medium">Sources (read {readOn}):</span> {children}
    </p>
  </div>
)

const Section = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4" data-as-of={CC_EU_AS_OF}>
    {children}
  </div>
)

const anchorName = `${ANCHOR_SCENARIO.name} (${ANCHOR_SCENARIO.fictionalLabel})`

const LEARN = '/learn/cc-eucc-certification?tab=learn'

/** A named source that has no Library page: its name, then a plain link to the document. */
const ExternalSource = ({ name, href }: { name: string; href?: string }) => (
  <>
    <PlainSource>{name}</PlainSource>
    {href ? (
      <>
        {' '}
        (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Source: ${name}`}
          className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        >
          Source
        </a>
        )
      </>
    ) : null}
  </>
)

const InLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link
    to={to}
    className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
  >
    {children}
  </Link>
)

/** An official page with no library row yet, opened in a new tab. */
const ExtLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
  >
    {children}
  </a>
)

/** The module's own reading of its sources: marks the sentence it follows. */
const MA = () => <ModuleAnalysisNote>(Module analysis.)</ModuleAnalysisNote>

const CC_PORTAL_URL = 'https://www.commoncriteriaportal.org/cc/index.cfm'

const H4 = ({ children }: { children: ReactNode }) => (
  <h4 className="pt-1 text-sm font-semibold text-foreground">{children}</h4>
)

/**
 * A panel that stays closed until the reader opens it. The visible summary sits outside it, in the
 * caller. A native <details>: it opens with Enter or Space, announces its state to screen readers
 * and needs no script. The same form as the optional history note in `cc-continuity`.
 */
const Disclosure = ({
  label,
  testId,
  children,
}: {
  label: string
  testId: string
  children: ReactNode
}) => (
  <details className="rounded-lg border border-border p-3 sm:p-4" data-testid={testId}>
    <summary className="cursor-pointer font-semibold">{label}</summary>
    <div className="mt-3 space-y-3">{children}</div>
  </details>
)

/** Invented requirement text in the worked example. Completed assignments are set in bold. */
const Excerpt = ({ children }: { children: ReactNode }) => (
  <blockquote className="break-words border-l-2 border-primary/40 pl-3 text-sm text-foreground/90">
    <p>{children}</p>
  </blockquote>
)

// ── Path B — Common Criteria ────────────────────────────────────────────────

/** Learn section `cc-model` */
export const CcModel = () => (
  <Section>
    <P>
      Common Criteria (CC) is a framework for writing down security claims about an IT product and
      having an accredited laboratory check them. The criteria are published by the Common Criteria
      Recognition Arrangement (CCRA) participants as CC:2022, and by ISO/IEC as ISO/IEC 15408:2022.
      The evaluator follows the Common Evaluation Methodology, CEM:2022 (ISO/IEC 18045:2022). A
      certification scheme — for example France’s ANSSI or Singapore’s CSA — oversees the laboratory
      and issues the certificate. The CCRA then decides which certificates its member countries
      accept from one another.
    </P>
    <P>
      <strong>Under EUCC:</strong> in the EU, certificates are issued under the EUCC scheme, which
      adds its own rules on top of Common Criteria (see the EUCC path).
    </P>

    <Callout tone="current" title="Use CC:2022 R1 with its mandatory errata">
      <p>
        A current evaluation baseline is not the five CC:2022 R1 documents alone. The Common
        Criteria portal marks the applicable CC:2022 and CEM errata and interpretations as
        mandatory; this module was checked against the portal&apos;s v1.2 package on 16 October
        2026. Record that errata version in the evaluation baseline and re-check it before starting
        or changing an evaluation.
      </p>
      <p>
        <a
          href="https://www.commoncriteriaportal.org/cc/index.cfm"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline decoration-primary/40 underline-offset-2"
        >
          Common Criteria publications and mandatory errata
        </a>
      </p>
    </Callout>

    <Callout tone="key" title="The question a CC certificate answers">
      <p>
        Does this defined Target of Evaluation (TOE) meet the security functional and assurance
        claims in its Security Target — possibly while conforming to a Protection Profile?
      </p>
      <p>
        Common Criteria does not say what a product must do. The Security Target does. CC supplies
        the vocabulary for writing those claims and the method for checking them.
      </p>
    </Callout>

    <H3>The vocabulary you need</H3>
    <DataTable
      caption="Common Criteria vocabulary"
      head={['Term', 'What it means', 'Where it comes from']}
      rows={[
        [
          'Assets, threats, organisational security policies (OSPs), assumptions',
          'The security problem the product addresses, and what it assumes about its environment',
          'Security problem definition in the ST or PP',
        ],
        [
          'Target of Evaluation (TOE)',
          'The exact product or product portion evaluated, with its version, configuration and guidance',
          'Defined in the ST',
        ],
        [
          'TOE Security Functionality (TSF)',
          'The parts of the TOE that the security requirements depend on',
          'Defined in the ST',
        ],
        [
          'Security Target (ST)',
          'The product-specific claims: threats, objectives, requirements, and how the TOE meets them',
          'Written by the developer; a sanitised version is published',
        ],
        [
          'Protection Profile (PP)',
          'Implementation-independent requirements for a class of products. PP-Modules and PP-Configurations combine PPs',
          'Written by a user group, standards body or government; certified on its own',
        ],
        [
          'Security Functional Requirements (SFRs)',
          <>
            What the TOE does — for example <Code>FCS_COP.1</Code> (cryptographic operation)
          </>,
          <SourceCite key="p2" id="CC-2022-PART2" label="CC:2022 Part 2" />,
        ],
        [
          'Security Assurance Requirements (SARs)',
          'How much evidence and evaluator work backs the claims — classes ADV, AGD, ALC, ASE, ATE, AVA',
          <SourceCite key="p3" id="CC-2022-PART3" label="CC:2022 Part 3" />,
        ],
        [
          'Packages, including the EALs',
          'Predefined sets of requirements; EAL1–EAL7 are assurance packages',
          <SourceCite key="p5" id="CC-2022-PART5" label="CC:2022 Part 5" />,
        ],
        [
          'Evaluation methods and activities',
          'Product-class-specific tests; collaborative PPs (cPPs) define their own',
          <SourceCite key="p4" id="CC-2022-PART4" label="CC:2022 Part 4" />,
        ],
        [
          'ITSEF, certification body (CB), ETR',
          'The lab evaluates and writes the Evaluation Technical Report (not public); the CB reviews it and issues the certificate and a public certification report',
          'The scheme’s rules',
        ],
      ]}
    />

    <H3>Claims live in the Security Target</H3>
    <P>
      The ST states the threats and objectives, the SFRs the TOE meets, the SARs it was evaluated
      against, and a TOE summary specification saying how each SFR is implemented. The evaluator
      works through the CEM work units for each SAR, using the developer’s evidence and their own
      testing. The certificate then says one narrow thing:{' '}
      <em>this TOE, in this configuration, meets this ST at this assurance</em>.
    </P>
    <Quote cite="ANSSI certificate ANSSI-CC-2025/09 (TrustWay Proteccio HSM), translated from French">
      This certificate applies only to this specific version of the product in its evaluated
      configuration.
    </Quote>
    <P>
      Take the anchor product, {anchorName}, a network HSM sold as an appliance and as a
      multi-tenant cloud service. Its ST might define the TOE as the appliance hardware, firmware
      and crypto library, and leave the client SDK and the cloud tenant-management plane outside.
      Everything outside the TOE is a claim the certificate cannot support. The cloud service would
      need its own TOE definition — or would simply not be covered.
    </P>

    <H3>Where cryptography sits</H3>
    <P>
      CC has no list of approved algorithms. Cryptography appears as SFRs from class FCS — mainly{' '}
      <Code>FCS_CKM</Code> (key management) and <Code>FCS_COP</Code> (cryptographic operation) —
      iterated once per algorithm or operation. A PP can constrain them. The EN 419221-5 HSM PP, for
      example, requires algorithms “approved for the identified purpose” and tells the ST author to
      consult the relevant national body. Schemes add their own rules: ANSSI, for example, analysed
      TrustWay Proteccio’s mechanisms against its own cryptographic guide.{' '}
      <strong>Under EUCC:</strong> the ECCG Agreed Cryptographic Mechanisms play this role (see the
      EUCC path).
    </P>
    <Callout tone="warn" title="So: is ML-KEM in the certificate?">
      <p>
        Read the ST’s <Code>FCS_COP</Code> iterations and the certification report. An assurance
        level never answers that question. A product can hold a high-assurance certificate for a
        version with no post-quantum algorithm at all — TrustWay Proteccio’s ST lists none <AsOf />.
      </p>
    </Callout>
    <P>
      For a worked example of how three post-quantum requirements could be written in a Security
      Target, see the section{' '}
      <InLink to={`${LEARN}&section=eucc-pqc-today`}>“PQC under EUCC today (ACM v2)”</InLink> on the
      EUCC path.
    </P>

    <H3>Conformance to a Protection Profile</H3>
    <P>
      An ST that claims a PP must meet it in the way the PP demands. Both PPs studied in this module
      require <em>strict</em> conformance: the ST may add to the PP’s requirements but may not
      weaken or omit any of them. Some PPs require <em>exact</em> conformance, where the ST must
      reproduce the PP’s requirements. CC:2022 Part 5 notes that an ST claiming exact conformance
      cannot augment its EAL at all.
    </P>

    <H3>Who does what</H3>
    <DataTable
      caption="Common Criteria roles"
      head={['Role', 'Does', 'Example from a real record']}
      rows={[
        [
          'Developer / sponsor',
          'Writes the ST and evidence; pays for the evaluation',
          'Entrust, for the nShield5s HSM',
        ],
        [
          'ITSEF (evaluation laboratory)',
          'Evaluates against the CEM; writes the ETR',
          'SGS Brightsight; SERMA and AMOSSYS',
        ],
        [
          'Certification body',
          'Oversees the lab, reviews the ETR, issues certificate and report',
          'CSA (Singapore), ANSSI (France)',
        ],
        [
          'CCRA participants',
          'Authorising members issue certificates; consuming members only recognise them',
          'Recognition covers EAL1–2 plus ALC_FLR, or collaborative PPs (next section)',
        ],
      ]}
    />

    <Sources>
      <SourceCite id="COMMON-CRITERIA" label="CC:2022 Part 1" />,{' '}
      <SourceCite id="CC-2022-PART2" label="Part 2" />,{' '}
      <SourceCite id="CC-2022-PART3" label="Part 3" />,{' '}
      <SourceCite id="CC-2022-PART4" label="Part 4" />,{' '}
      <SourceCite id="CC-2022-PART5" label="Part 5" />,{' '}
      <SourceCite id="CC-2022-CEM" label="CEM:2022" />; Common Criteria portal mandatory CC:2022/CEM
      errata and interpretations v1.2;{' '}
      <SourceCite id="ANSSI-CC-PP-2016-05-EN-419221-5" label="EN 419221-5 PP (v0.15)" />; ANSSI
      certificate and report ANSSI-CC-2025/09 and CSA report CSA_CC_23004 (links in the Decode the
      certificate claim workshop step).
    </Sources>
  </Section>
)

/** Learn section `cc-eal-decoding` */
export const CcEalDecoding = () => (
  <Section>
    <P>
      An Evaluation Assurance Level (EAL) is a predefined <em>assurance package</em>: a fixed set of
      assurance components from CC Part 3. The seven EALs are ordered — each contains more, or more
      rigorous, components than the one below. That is all an EAL measures: how much design evidence
      the developer provided and how hard the evaluator looked. It is not a rating of cryptographic
      strength, of resistance to quantum attack, or of whether a product is “more secure” than a
      product of another type.
    </P>

    <Callout tone="warn" title="Not a FIPS level">
      <p>
        An EAL is not a FIPS 140-3 security level, and there is no mapping between the two. FIPS
        140-3 levels come from one fixed set of cryptographic-module requirements. EALs grade the
        assurance behind whatever SFRs an ST chooses to claim.
      </p>
    </Callout>

    <H3>The seven packages</H3>
    <DataTable
      caption="EAL1 to EAL7"
      head={['EAL', 'Name (CC:2022 Part 5)', 'AVA_VAN in the package']}
      rows={[
        ['EAL1', 'Functionally tested', 'AVA_VAN.1'],
        ['EAL2', 'Structurally tested', 'AVA_VAN.2'],
        ['EAL3', 'Methodically tested and checked', 'AVA_VAN.2'],
        ['EAL4', 'Methodically designed, tested and reviewed', 'AVA_VAN.3'],
        ['EAL5', 'Semi-formally designed and tested', 'AVA_VAN.4'],
        ['EAL6', 'Semi-formally verified design and tested', 'AVA_VAN.5'],
        ['EAL7', 'Formally verified design and tested', 'AVA_VAN.5'],
      ]}
    />
    <P>
      Notice that an EAL4 evaluation “augmented with AVA_VAN.5” reaches the same vulnerability
      component as EAL6 while keeping EAL4’s design and development evidence. HSM and chip PPs use
      exactly that pattern — which is why a component list, not the EAL number, tells you what was
      tested.
    </P>

    <H3>What EAL4 contains</H3>
    <P>
      CC:2022 Part 5 describes EAL4 as “methodically designed, tested and reviewed”, and as the
      highest level at which it is likely to be economically feasible to retrofit an existing
      product line. Its components include:
    </P>
    <DataTable
      caption="Selected EAL4 components"
      head={['Family', 'EAL4 component', 'What it demands']}
      rows={[
        [
          'ADV_IMP',
          'ADV_IMP.1',
          'Implementation representation of the TSF, mapped to the design for a sample',
        ],
        ['ALC_CMC', 'ALC_CMC.4', 'Production support, acceptance procedures and automation'],
        ['ALC_DVS', 'ALC_DVS.1', 'Identification of development-environment security controls'],
        ['ATE_DPT', 'ATE_DPT.1', 'Testing: basic design'],
        [
          'AVA_VAN',
          'AVA_VAN.3',
          'Focused vulnerability analysis — attackers with Enhanced-Basic attack potential',
        ],
        [
          'ALC_FLR',
          '— (none)',
          'Flaw remediation is in no EAL; CC:2022 Part 5 notes it is often used as an augmentation',
        ],
      ]}
    />

    <H3>What the “+” means</H3>
    <Quote cite={<SourceCite id="CC-2022-PART5" label="CC:2022 Part 5, §4.3" />}>
      The notion of “augmentation” allows the addition of assurance components (from assurance
      families not already included in the EAL) or the substitution of assurance components (with
      another hierarchically higher assurance component in the same assurance family) to an EAL.
    </Quote>
    <P>
      Listings shorten “EAL4 augmented” to “EAL4+”. The plus sign tells you something was added; it
      does not tell you what. The same headline can stand for one extra component or for five. A
      bare “EAL4+” is therefore incomplete — the claim only means something with its component list,
      as in “EAL4 augmented with ALC_DVS.2, ALC_FLR.2 and AVA_VAN.5”.
    </P>

    <H3>The augmentations you will meet on HSMs and chips</H3>
    <DataTable
      caption="Common augmentation components"
      head={['Component', 'Name (CC:2022 Part 3)', 'Relative to EAL4']}
      rows={[
        'AVA_VAN.4',
        'AVA_VAN.5',
        'ALC_DVS.2',
        'ALC_FLR.2',
        'ALC_FLR.3',
        'ADV_IMP.2',
        'ALC_CMC.5',
      ].map((code) => {
        const c = ASSURANCE_COMPONENTS.get(code)
        return [<Code key={code}>{code}</Code>, c?.name ?? '', c?.vsEal4 ?? '']
      })}
    />
    <P>
      The AVA_VAN component matters most for devices that hold keys: it sets the attack potential
      the evaluator’s penetration testing assumes — Basic for AVA_VAN.1–2, Enhanced-Basic for .3,
      Moderate for .4 and High for .5. <strong>Under EUCC:</strong> the ‘substantial’ and ‘high’
      assurance levels are defined by this component (see the EUCC path).
    </P>

    <H3>A real example: one certificate, two headlines</H3>
    <P>
      The TrustWay Proteccio network HSM holds ANSSI certificate ANSSI-CC-2025/09 (31 March 2025).
      One list shows it as “EAL4+”. The certificate says:
    </P>
    <Quote cite="ANSSI certificate ANSSI-CC-2025/09, translated from French">
      EAL4 augmented (ADV_IMP.2, ALC_CMC.5, ALC_DVS.2, ALC_FLR.3, AVA_VAN.5), conformant to the
      protection profile NF EN 419221-5:2018 … Within the CCRA, this certificate is recognised at
      the level EAL2 augmented with FLR.3.
    </Quote>
    <P>
      That last sentence is the second lesson. The CCRA’s mutual recognition stops at EAL2 plus the
      ALC_FLR family (or at collaborative PPs). Above that, recognition depends on other agreements.
      For this certificate that was SOG-IS, whose European agreement recognised higher levels for
      “hardware devices with security boxes” — and SOG-IS stopped issuing certificates on 27
      February 2026 (
      <SourceCite id="SOGIS-Certificate-Issuance-Ceased-2026" label="SOG-IS notice" />, read{' '}
      {AS_OF_LABEL}). Singapore’s report for the nShield5s HSM puts it plainly: its EAL4 augmented
      certification “is partially covered by the CCRA”.
    </P>

    <H3>Why you cannot rank certificates by EAL</H3>
    <P>
      Collaborative PPs (cPPs) replace the EAL ladder with evaluation activities written for one
      product class. A cPP evaluation can carry a nominal “EAL1 augmented with ALC_FLR.2 and
      ASE_SPD.1” and still involve demanding, class-specific testing. ASE_SPD.1 is an augmentation
      there only because EAL1 lacks the security problem definition that EAL2 and above include.
      Comparing that certificate with an HSM’s EAL4 augmented certificate tells you nothing about
      which product is “more secure”: they are different TOEs with different SFRs, PPs and
      environments.
    </P>

    <Callout tone="key" title="How to write an assurance claim properly">
      <ul className="list-disc space-y-1 pl-5">
        <li>
          the EAL and every augmentation component, e.g. EAL4 augmented with ALC_FLR.2 and
          AVA_VAN.5;
        </li>
        <li>the PP or cPP the ST claims, with its version;</li>
        <li>the TOE name, version and evaluated configuration;</li>
        <li>the scheme, certificate identifier, date and validity;</li>
        <li>
          who recognises it (the CCRA or another arrangement) and at what level; for an EUCC
          certificate, also its EUCC assurance level.
        </li>
      </ul>
    </Callout>

    <Sources>
      <SourceCite id="CC-2022-PART5" label="CC:2022 Part 5 (EAL tables, augmentation)" />,{' '}
      <SourceCite id="CC-2022-PART3" label="CC:2022 Part 3 (component names, attack potential)" />;
      ANSSI certificate ANSSI-CC-2025/09; CSA certification report CSA_CC_23004; EUCC certificate
      EUCC-3110-2025-12-2500098-01; SOG-IS website statement on ceasing to issue certificates.
    </Sources>
  </Section>
)

/** Learn section `cc-lifecycle` */
export const CcLifecycle = () => (
  <Section>
    <H3>From TOE definition to published certificate</H3>
    <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground/90">
      <li>
        <strong>Define the TOE and its environment</strong> — what is in the evaluated boundary,
        which versions, and what the environment must provide (for an HSM, typically a physically
        protected room and trusted administrators).
      </li>
      <li>
        <strong>Choose a PP or write a product-specific ST.</strong> A PP brings fixed threats,
        objectives and requirements; strict conformance lets you add but not weaken.
      </li>
      <li>
        <strong>Write the security problem, objectives, SFRs and SARs.</strong> Cryptographic
        services become <Code>FCS_COP</Code> / <Code>FCS_CKM</Code> iterations.
      </li>
      <li>
        <strong>Produce the evidence</strong> the SARs call for: architecture, functional
        specification, design, implementation representation, life-cycle and development-security
        documentation, tests and guidance.
      </li>
      <li>
        <strong>The ITSEF evaluates:</strong> documentary checks, independent functional testing,
        vulnerability analysis and penetration testing at the AVA_VAN level claimed.
      </li>
      <li>
        <strong>The certification body reviews</strong> the Evaluation Technical Report and issues
        the certificate and a public certification report.
      </li>
      <li>
        <strong>Publication:</strong> the sanitised ST, certificate and report appear on the
        scheme’s site and the CC portal.
      </li>
      <li>
        <strong>Life after certification:</strong> flaw remediation, vulnerability handling, and
        assurance continuity for every change — maintenance, re-evaluation or re-assessment.
      </li>
    </ol>

    <H3>What gets published — and what does not</H3>
    <DataTable
      caption="Evaluation outputs"
      head={['Document', 'Public?', 'What you learn from it']}
      rows={[
        [
          'Certificate',
          'Yes',
          'TOE, version, EAL and components, PP, scheme, date, validity, recognition',
        ],
        [
          'Certification report',
          'Yes',
          'Evaluated configuration, usage restrictions, crypto analysis notes, recognition scope',
        ],
        [
          'Security Target (sanitised)',
          'Yes',
          'The claims: threats, SFRs including the algorithm iterations, TOE boundary',
        ],
        [
          'Evaluation Technical Report',
          'No',
          'The lab’s detailed findings; seen by the CB, reused in later re-evaluations',
        ],
      ]}
    />

    <H3>Evidence, class by class</H3>
    <DataTable
      caption="Assurance classes and the evidence behind them"
      head={['Class', 'Covers', 'For a PQC addition, expect to revisit']}
      rows={[
        [
          'ASE',
          'The Security Target itself',
          'New cryptographic SFR iterations and the TOE summary specification',
        ],
        [
          'ADV',
          'Architecture, functional specification, design, implementation',
          'New interfaces and modules; the implementation of the new algorithm',
        ],
        [
          'AGD',
          'Operational guidance and preparative procedures',
          'Key generation, import and use for the new mechanisms',
        ],
        [
          'ALC',
          'Configuration management, delivery, development security, flaw remediation',
          'Usually unchanged, unless the build or development site changes',
        ],
        ['ATE', 'Developer and independent testing', 'Functional tests of the new services'],
        [
          'AVA',
          'Vulnerability analysis and penetration testing',
          'The new code at the claimed attack potential',
        ],
      ]}
    />

    <H3>Validity</H3>
    <P>
      Each scheme sets a validity period. The three real certificates in this path’s workshop all
      run five years: ANSSI’s report gives five years from the signature date, Singapore’s CSA gives
      a fixed end date, and the EUCC certificate follows EUCC’s own limit (see the EUCC path).
      Validity does not freeze the threat landscape — that is what re-assessment is for.
    </P>

    <H3>The CC:2022 transition</H3>
    <P>
      CC:2022 Release 1 (November 2022) replaced CC 3.1 Revision 5. The CCRA transition policy,{' '}
      <SourceCite id="CCMC-2023-04-001-CC2022-Transition-Policy" label="CCMC-2023-04-001" /> (20
      April 2023), sets the dates:
    </P>
    <DataTable
      caption="CC:2022 transition dates"
      head={['Rule', 'Date']}
      rows={[
        ['Last start of a new certification on CC 3.1 R5', '30 June 2024'],
        [
          'Last start of a CC 3.1 R5 product certification against a PP requiring exact conformance',
          '31 December 2025',
        ],
        [
          'A CC:2022 Security Target may claim a CC 3.1 Protection Profile',
          'until 31 December 2027',
        ],
        [
          'After 30 June 2024, a re-evaluation or re-assessment based on a CC 3.1 evaluation can start',
          'up to 2 years after the initial certification date',
        ],
      ]}
    />
    <P>
      The same policy lets a CC:2022 certification reuse CC 3.1 R5 life-cycle (ALC) results and CC
      3.1 R5 platform certificates in a composite evaluation. PP maintainers must move their PPs to
      CC:2022; new or updated PPs published after 30 June 2024 must use CC:2022. All three
      certificates in this path’s workshop use CC 3.1 R5. <strong>Under EUCC:</strong> a separate
      EUCC rule allows CC 3.1 R5 certificates until 31 December 2027 (see the EUCC path).
    </P>

    <P>
      <strong>Under EUCC:</strong> in the EU, EUCC replaced the national schemes from 27 February
      2025, and EUCC certificates carry the CCRA mark only through a separate process (see the EUCC
      path).
    </P>

    <Callout
      tone="planning"
      title="Planning implication for PQC (scheme clocks, not market deadlines)"
    >
      <p>
        <strong>Under Common Criteria:</strong> Adding ML-KEM or ML-DSA to a certified product means
        new <Code>FCS_COP</Code>/<Code>FCS_CKM</Code> iterations in the ST — a change to the claimed
        SFRs, which CCDB-015 lists as a typical major change. Expect the certification body to
        classify it as major and require a re-evaluation, and plan that re-evaluation on CC:2022. If
        your PP is still CC 3.1, the CCRA transition policy allows claiming it only until 31
        December 2027.
      </p>
      <p>
        <strong>Under EUCC:</strong> The EUCC cryptography guidelines say evaluators should verify
        that protection profiles and products preferably rely on the agreed cryptographic mechanisms
        in the ECCG ACM (ACM v2), which lists post-quantum mechanisms; the ACM is a guideline rather
        than a legal list. CIR 2025/2462 defines minor and major changes, and the certification body
        decides which applies. An EUCC carve-out keeps older protection profiles (CC 3.1 revisions
        1–4) usable where eIDAS, Decision 2016/650 or the tachograph rules require them, with no end
        date (see the EUCC path).
      </p>
    </Callout>

    <Sources>
      <SourceCite id="CCMC-2023-04-001-CC2022-Transition-Policy" />,{' '}
      <SourceCite
        id="CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme"
        label="CIR (EU) 2024/482 (consolidated to 2025-12-29)"
      />
      , <SourceCite id="CCDB-014-Assurance-Continuity-v3-1" />,{' '}
      <SourceCite id="CC-2022-CEM" label="CEM:2022" />;{' '}
      <SourceCite id="CCMC-011-CCRA-EUCC-Coexistence" label="CCMC-011 v1.0 (19 March 2025)" />;{' '}
      <SourceCite id="SOGIS-Certificate-Issuance-Ceased-2026" label="SOG-IS notice" />.
    </Sources>
  </Section>
)

/** Learn section `cc-continuity` (optional reference) */
export const CcContinuity = () => (
  <Section>
    <P>
      Assurance continuity is how a certified product changes without losing its certificate — or
      learns that it must be evaluated again. The CCRA minimum rules are in{' '}
      <SourceCite
        id="CCDB-014-Assurance-Continuity-v3-1"
        label="CCDB-015 “Assurance Continuity: CCRA Requirements” v3.1"
      />{' '}
      (29 February 2024). Schemes may add to them. <strong>Under EUCC:</strong> EUCC sets its own
      change rules in law (see the EUCC path).
    </P>

    <DataTable
      caption="The three assurance-continuity routes"
      head={['Route', 'Trigger', 'Output', 'Certificate']}
      rows={[
        [
          'Maintenance',
          'Changes the CB classifies as minor, shown in the developer’s Impact Analysis Report (IAR)',
          'Maintenance Report; the maintained version is added to a maintenance addendum. A subset evaluation with a partial ETR may be needed for development-environment changes or an added ALC_FLR',
          '“There is no implied issuance of an updated certificate.”',
        ],
        [
          'Re-evaluation',
          'A major change',
          'Evaluator work redone where affected, reusing what still applies; new ETR and certification report',
          'New certificate',
        ],
        [
          'Re-assessment',
          'The TOE is unchanged but the attack landscape has moved',
          'Refreshed vulnerability analysis (and development-environment evidence); re-assessment report',
          'Validity of the original certificate updated',
        ],
      ]}
    />

    <H3>Minor or major?</H3>
    <P>The developer proposes; the certification body decides. CCDB-015 gives typical cases:</P>
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
      <li>
        <strong>Typically minor:</strong> editorial changes; changes that do not affect the
        assurance evidence; a new product name in the ST front matter; development-environment
        changes shown to have no follow-on effect.
      </li>
      <li>
        <strong>Typically major:</strong> changes to the claimed assurance requirements (except
        adding ALC_FLR); changes to confidentiality or integrity controls of the development
        environment; “changes to the set of claimed functional requirements”; and “a set of minor
        changes that together have a major impact upon the security”.
      </li>
    </ul>
    <P>
      A bug fix can be either, CCDB-015 notes, because its extent cannot be predicted. And a PP
      requiring exact conformance makes even an editorial change to the ST’s objectives major.
    </P>

    <details className="rounded-lg border border-border p-4">
      <summary className="cursor-pointer font-semibold">
        Optional history: why EN 419221-5 appears as both v0.15 and v1.0
      </summary>
      <div className="mt-3 space-y-3">
        <P>
          In this example, ANSSI assessed a Protection Profile—the document describing requirements
          for a class of cryptographic modules—not a particular HSM product.
        </P>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>16 December 2016:</strong> ANSSI certified the draft Protection Profile, prEN
            419221-5 v0.15, under reference ANSSI-CC-PP-2016/05.
          </li>
          <li>
            <strong>18 May 2020:</strong> its maintenance report identified the published EN
            419221-5:2018 E v1.0 as the maintained profile. The report describes standardisation
            edits, editorial fixes and replacing “must” with “shall”. ANSSI judged their impact
            minor.
          </li>
        </ul>
        <P>
          The lesson: different version labels need an explanation, not an assumption that the
          documents are unrelated or interchangeable. Check the exact profile claimed and the
          maintenance report connecting the versions. The Hub quotes the public v0.15 text; it does
          not claim to have independently compared every line of the published CEN edition.
        </P>
        <P>
          The limit: this report does not establish that adding PQC to an HSM is a minor change. It
          assesses changes to the requirements document, not new cryptographic code, services or
          security claims in a product. It also does not establish a product certificate’s current
          validity.
        </P>
        <SourceCite
          id="ANSSI-CC-PP-2016-05-M01"
          label="ANSSI maintenance report, 18 May 2020, §§1–4"
        />
      </div>
    </details>

    <Callout tone="warn" title="What this means for adding PQC">
      <p>
        Adding an ML-DSA signing service can change the product’s security requirements, interfaces,
        implementation and vulnerability evidence. Assess those actual changes under the issuing
        scheme’s rules; the certification body determines the route. The editorial PP update above
        is not evidence that this product change qualifies for maintenance.
      </p>
    </Callout>

    <Sources>
      <SourceCite id="CCDB-014-Assurance-Continuity-v3-1" />,{' '}
      <SourceCite id="ANSSI-CC-PP-2016-05-M01" />.
    </Sources>
  </Section>
)

// ── Path C — EUCC, eIDAS and Protection Profiles ────────────────────────────

/** Learn section `eucc-scheme` */
export const EuccScheme = () => (
  <Section>
    <Callout tone="key" title="EUCC is a certification scheme — not a PP, not a standard">
      <p>
        The European Common Criteria-based cybersecurity certification scheme (EUCC) is EU law
        adopted under the Cybersecurity Act (Regulation (EU) 2019/881). It says how CC evaluations
        are run and how certificates are issued under EUCC. It is not another name for Common
        Criteria, and its rules must not be applied indiscriminately to other CC certification
        schemes. The security requirements still come from a Security Target and, where claimed, a
        Protection Profile.
      </p>
    </Callout>

    <H3>What EUCC takes from Common Criteria, and what it adds</H3>
    <P>An EUCC evaluation is a Common Criteria evaluation run under EU law.</P>
    <P>
      <strong>Taken from Common Criteria:</strong> the CC:2022 criteria and the CEM evaluation
      method, the Security Target, Protection Profiles, and assurance components such as{' '}
      <Code>AVA_VAN</Code>. If these are new to you, read “The Common Criteria model” on the Common
      Criteria path first.
    </P>
    <P>
      <strong>Added by EUCC:</strong>
    </P>
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
      <li>
        two assurance levels, ‘substantial’ and ‘high’, defined by the <Code>AVA_VAN</Code>{' '}
        component;
      </li>
      <li>technical domains and listed Protection Profiles (Annexes I and II);</li>
      <li>the ECCG Agreed Cryptographic Mechanisms, including the post-quantum rules;</li>
      <li>
        certification bodies authorised under EU law, no self-assessment, and at most five years’
        validity;
      </li>
      <li>its own change rules;</li>
      <li>a separate, per-certificate route to the CCRA mark.</li>
    </ul>

    <H3>What changed in Europe in 2025–2026</H3>
    <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/90">
      <li>
        EUCC (
        <SourceCite
          id="CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme"
          label="CIR (EU) 2024/482"
        />
        ) applies from 27 February 2025. Under its Article 49, national EU certification schemes
        covered by EUCC ceased to produce effects, with a limited window to finish processes already
        started.
      </li>
      <li>
        SOG-IS, the older European recognition agreement, stopped issuing certificates on 27
        February 2026 (
        <SourceCite id="SOGIS-Certificate-Issuance-Ceased-2026" label="SOG-IS notice" />
        ).
      </li>
      <li>
        EUCC certificates can carry the CCRA mark only through extra, per-certificate government
        oversight (
        <SourceCite
          id="CCMC-011-CCRA-EUCC-Coexistence"
          label="CCMC-011 v1.0, “CCRA and EUCC Co-existence”, 19 March 2025"
        />
        ). If the CCRA requirements stop being met, the EUCC certificate is not nullified; the CCRA
        can ask for the mark to be removed.
      </li>
    </ul>

    <H3>The legal text, and its two amendments</H3>
    <DataTable
      caption="EUCC legal acts"
      head={['Act', 'What it did']}
      rows={[
        [
          <SourceCite
            key="482"
            id="CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme"
            label="CIR (EU) 2024/482"
          />,
          'Established EUCC. Applies from 27 February 2025.',
        ],
        [
          <SourceCite key="3144" id="CIR-EU-2024-3144-EUCC-Amendment" label="CIR (EU) 2024/3144" />,
          'Made CC and CEM (CC:2022) the evaluation standards; allowed CC 3.1 R5 certificates until 31 December 2027; kept CC 3.1 R1–R4 PPs usable where eIDAS (910/2014), Decision 2016/650 or the tachograph regulation require them.',
        ],
        [
          <SourceCite key="2462" id="CIR-EU-2025-2462-EUCC-Amendment" label="CIR (EU) 2025/2462" />,
          'Of 8 December 2025: definitions of product series, minor change and major change; product-series certification; reworked assurance continuity; new and updated state-of-the-art documents.',
        ],
      ]}
    />

    <H3>Two assurance levels, defined by AVA_VAN</H3>
    <Quote
      cite={
        <SourceCite
          id="CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme"
          label="CIR 2024/482, Article 4"
        />
      }
    >
      EUCC certificates at assurance level ‘substantial’ shall correspond to certificates that cover
      AVA_VAN level 1 or 2. EUCC certificates at assurance level ‘high’ shall correspond to
      certificates that cover AVA_VAN level 3, 4 or 5.
    </Quote>
    <P>
      The certificate must also show whether components were used as in the Common Criteria or
      augmented. And AVA_VAN.4 or .5 is not open to everyone: under Article 7(3) it is possible only
      if the product falls in a technical domain listed in Annex I, or in a product category covered
      by an Annex II Protection Profile — or, in exceptional and duly justified cases (Article
      7(3)(c)), after the conformity assessment body notifies the national cybersecurity
      certification authority with a justification and a proposed methodology; the authority
      approves or amends the methodology, and no certificate is issued before it decides.
    </P>
    <DataTable
      caption="What Annex I and Annex II contain"
      head={['Annex', 'Contains', 'Example relevant to HSMs and chips']}
      rows={[
        [
          'Annex I',
          'State-of-the-art documents for technical domains (AVA_VAN 4–5) and for accrediting labs and CBs',
          '“Smart cards and similar devices” and “hardware devices with security boxes”; the latter includes “Hardware assessment in EN 419221-5 (HSM PP)”, version 1',
        ],
        [
          'Annex II',
          'Protection Profiles certified at AVA_VAN 4 or 5',
          'For remote qualified signature and seal creation devices: EN 419241-2 (ANSSI-CC-PP-2018/02-M01) and EN 419221-5 (ANSSI-CC-PP-2016/05-M01)',
        ],
      ]}
    />

    <H3>Who does what under EUCC</H3>
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
      <li>
        <strong>ITSEF</strong> — an accredited lab; it needs national authorisation to evaluate at
        level “high”.
      </li>
      <li>
        <strong>Certification body</strong> — accredited (and, for “high”, authorised). It can be a
        government body or a commercial one.
      </li>
      <li>
        <strong>National cybersecurity certification authority (NCCA)</strong> — authorises and
        supervises.
      </li>
      <li>
        <strong>ECCG</strong> — the European Cybersecurity Certification Group endorses
        state-of-the-art documents; <strong>ENISA</strong> publishes certificates, maintenance
        reports and documents.
      </li>
    </ul>
    <P>
      Self-assessment is not allowed (Art 6). A certificate is valid for at most five years unless
      the NCCA approves more (Art 12). National EU schemes covered by EUCC have ceased (Art 49).
    </P>

    <H3>Law, state of the art, guideline: three different weights</H3>
    <DataTable
      caption="EUCC document status"
      head={['Status', 'Examples', 'Binding?']}
      rows={[
        ['Law', 'CIR 2024/482 and its amendments, including Annexes I and II', 'Yes'],
        [
          'State-of-the-art document (final)',
          'Listed in Annex I or II, e.g. the FPT_PHP interpretation for EN 419221-5',
          'Yes, for processes started after the amending act applies (Art 48(4))',
        ],
        [
          'ECCG-endorsed draft state of the art',
          'Endorsed, waiting for the next amendment',
          'Not yet',
        ],
        [
          'Guideline',
          <>
            Cryptography (ACM v2); product series (version 1, July 2025); assurance-continuity
            change scenarios (v1, October 2025); vulnerability management and disclosure (v1.1,
            adopted 10 January 2025)
          </>,
          'No — recommendations to developers and evaluators',
        ],
      ]}
    />

    <H3>Changes under EUCC: the 2025 rules</H3>
    <P>
      CIR 2025/2462 defines a <em>minor change</em> as one “that does not adversely impact the
      assurance expressed in the EUCC certificate”, and a <em>major change</em> as one that “may
      adversely impact” it. The holder sends an impact analysis report; the CB decides.
    </P>
    <Quote
      cite={
        <SourceCite
          id="CIR-EU-2025-2462-EUCC-Amendment"
          label="CIR 2024/482 Annex IV.3 point 5, as amended by 2025/2462"
        />
      }
    >
      Where the changes have been confirmed by the certification body to be minor, no new
      certificate shall be issued for the modified ICT product … and a maintenance report to the
      initial certification report shall be established.
    </Quote>
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
      <li>
        <strong>Minor</strong> → maintenance report, published by ENISA; the certificate stands. The
        CB may ask for a subset evaluation and partial ETR first.
      </li>
      <li>
        <strong>Major</strong> → re-evaluation, reusing results that still apply → new ETR and,
        where applicable, a new certificate and certification report.
      </li>
      <li>
        <strong>Re-assessment</strong> (unchanged product, changed threats) → if successful, the CB
        confirms the certificate or issues a new one with an extended validity.
      </li>
      <li>
        <strong>Product series</strong> → a CB may certify a set of products built on the same
        functional basis (Art 5(3)). ENISA’s guideline has one certificate cover a reference TOE and
        the declared variants.
      </li>
    </ul>

    <H3>Reading a real EUCC certificate</H3>
    <P>
      Certificate EUCC-3110-2025-12-2500098-01 (Cisco Nexus 9000 switches, NX-OS 10.4(5)(M), first
      issued 3 December 2025) shows the fields to look for: “EUCC Level: Substantial”; AVA_VAN level
      1; package “EAL1 augmented with ALC_FLR.2 and ASE_SPD.1”; the collaborative PP for network
      devices v3.0e; CC 3.1 Revision 5 (allowed until 31 December 2027); ITSEF SGS Brightsight; CB
      TrustCB B.V., a commercial body authorised by the Dutch RDI; five-year validity. The Decode
      the certificate claim step on the Common Criteria path decodes it in full.
    </P>

    <Sources>
      <SourceCite
        id="CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme"
        label="CIR 2024/482 (EUR-Lex consolidated text of 29 December 2025)"
      />
      , <SourceCite id="CIR-EU-2024-3144-EUCC-Amendment" label="CIR 2024/3144" />,{' '}
      <SourceCite id="CIR-EU-2025-2462-EUCC-Amendment" label="CIR 2025/2462" />; ENISA EUCC
      certification library page;{' '}
      <PlainSource>
        ENISA product-series methodology version 1 (July 2025); ENISA assurance-continuity change
        scenarios v1 (October 2025)
      </PlainSource>
      ; ENISA certificate page EUCC-3110-2025-12-2500098-01;{' '}
      <SourceCite
        id="CCMC-011-CCRA-EUCC-Coexistence"
        label="CCMC-011 v1.0, “CCRA and EUCC Co-existence”, 19 March 2025"
      />
      ; <SourceCite id="SOGIS-Certificate-Issuance-Ceased-2026" label="SOG-IS notice" />.
    </Sources>
  </Section>
)

/** Learn section `eidas-chain` */
export const EidasChain = () => (
  <Section>
    <Callout tone="warn" title="eIDAS 2.0 is not a Protection Profile">
      <p>
        eIDAS is a regulation. It defines roles — qualified trust service providers (QTSPs),
        qualified signature and seal creation devices (QSCDs) — and obliges QSCDs to be certified.
        Annex II sets device-security requirements, including protection of signing secrets and the
        data being signed. These legal requirements are not the same as formal CC security
        functional components. Where CC is used, the applicable Protection Profile and Security
        Target describe the technical claims to be evaluated.
      </p>
    </Callout>

    <H3>The chain, top to bottom</H3>
    <ol className="space-y-2 text-sm text-foreground/90">
      {[
        [
          'Law',
          <>
            <SourceCite key="e" id="EIDAS-REG-910-2014" label="Regulation (EU) No 910/2014" /> as
            amended by{' '}
            <SourceCite key="e2" id="eIDAS-2-Regulation" label="Regulation (EU) 2024/1183" />: Annex
            II device requirements; Article 29a remote QSCD management; Article 30 certification.
          </>,
        ],
        [
          'Implementing acts and standards',
          <>
            <SourceCite
              key="d"
              id="CID-EU-2016-650-QSCD-Security-Assessment"
              label="Decision (EU) 2016/650"
            />{' '}
            (evaluation standards for user-managed devices);{' '}
            <SourceCite
              key="r"
              id="CIR-EU-2025-1567-Remote-QSCD-Management"
              label="CIR 2025/1567"
            />{' '}
            (remote QSCD management as a qualified service);{' '}
            <SourceCite
              key="n"
              id="CIR-EU-2025-1570-QSCD-Certification-Notification"
              label="CIR 2025/1570"
            />{' '}
            (notifying certified QSCDs).
          </>,
        ],
        [
          'Certification scheme',
          <>
            Certification by public or private bodies designated by Member States (Art 30), using
            the applicable Article 30 assessment basis. CC evaluations may support that basis; EUCC
            applies where that scheme is used. Article 30(3)(b) also provides for notified
            alternative processes under its stated conditions.
          </>,
        ],
        [
          'Protection Profile and Security Target',
          'EN 419211 for signatory-held devices; EN 419241-2 and EN 419221-5 for remote devices. The product’s ST claims the PP.',
        ],
        [
          'Certified device',
          'The QSCD or the trust-service cryptographic module, in its evaluated configuration.',
        ],
      ].map(([step, text], i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <span>
            <strong>{step}.</strong> {text}
          </span>
        </li>
      ))}
    </ol>

    <H3>What eIDAS 2.0 added for devices</H3>
    <Quote
      cite={
        <SourceCite
          id="eIDAS-2-Regulation"
          label="Regulation (EU) 2024/1183, inserting Article 30(3a) into eIDAS"
        />
      }
    >
      The validity of a certification referred to in paragraph 1 shall not exceed five years,
      provided that vulnerabilities assessments are carried out every two years. Where
      vulnerabilities are identified and not remedied, the certification shall be cancelled.
    </Quote>
    <P>
      Regulation 2024/1183 also made managing a remote QSCD on a signatory’s behalf a qualified
      trust service (Art 29a). CIR 2025/1567 names the reference standard for that service — ETSI TS
      119 431-1 V1.3.1, with adaptations — and applies from 19 August 2027. CIR 2025/1570, applying
      from 19 December 2025, fixes what Member States notify about certified QSCDs, including a
      reference to the certification report issued under Article 30.
    </P>

    <DataTable
      caption="What each eIDAS and EUCC document does"
      head={['Document', 'Its job', 'It does not do']}
      rows={[
        [
          'Decision 2016/650',
          'Identifies security-assessment standards and the interim route for relevant QSCDs',
          'Assess a QTSP’s remote-signing service',
        ],
        [
          'CIR 2025/1567',
          'Sets requirements and a reference standard for management of remote QSCDs as a qualified trust service',
          'Certify the device TOE',
        ],
        [
          'CIR 2025/1570',
          'Sets the notification information and procedure for certified QSCDs',
          'Create an algorithm list or Protection Profile',
        ],
        [
          'EUCC and its Annexes',
          'Provide the CC-based certification scheme and identify applicable PPs and state-of-the-art documents',
          'Grant qualified trust-service status',
        ],
      ]}
    />

    <H3>Two assessments, not one</H3>
    <P>
      An HSM component certificate is not automatically certification of the complete QSCD. Check
      the device configuration and certification report, then assess the trust service separately.
      The Commission publishes{' '}
      <a
        className="text-primary underline"
        href="https://eidas.ec.europa.eu/efda/browse/notification/alternative-process"
      >
        notified alternative assessment processes
      </a>
      ; do not assume that every eIDAS device certificate must be an EUCC certificate.
    </P>
    <DataTable
      caption="Service assessment versus product certification"
      head={['', 'Trust service (the QTSP)', 'Device (the QSCD or HSM)']}
      rows={[
        [
          'What is assessed',
          'The provider’s operations and management of the remote QSCD',
          'The TOE in its evaluated configuration',
        ],
        [
          'Against',
          'eIDAS trust-service requirements; ETSI TS 119 431-1 (from 19 August 2027)',
          'The ST and its PP, under a CC-based scheme',
        ],
        ['Result', 'Qualified status for the service', 'A certificate and certification report'],
      ]}
    />
    <P>
      For the anchor product, {anchorName}, sold to an EU QTSP: the vendor certifies the device; the
      QTSP gets its service assessed. Neither substitutes for the other, and a FIPS 140-3
      certificate substitutes for neither.
    </P>

    <H3>Local versus remote devices</H3>
    <P>
      Decision 2016/650 is still in force. It lists ISO/IEC 15408 (2008/2009 editions), ISO/IEC
      18045:2008 and the EN 419211 PPs for devices where the signature creation data is held in an
      entirely — but not necessarily exclusively — user-managed environment. For devices a QTSP
      manages remotely, it only provided an interim route: a process with comparable security
      levels, notified to the Commission, until a list of standards exists. EUCC’s Annex II now
      lists EN 419241-2 and EN 419221-5 for remote QSCDs.
    </P>
    <DataTable
      caption="QSCD-related Protection Profiles"
      head={['PP', 'TOE', 'Where it is referenced']}
      rows={[
        [
          'EN 419211 (parts 1–6)',
          'Secure signature creation device held by the signatory, e.g. a signature card',
          'Decision 2016/650',
        ],
        [
          'EN 419241-2 (ANSSI-CC-PP-2018/02-M01)',
          'The QSCD for server signing — signature activation in a QTSP',
          'EUCC Annex II (remote QSCDs)',
        ],
        [
          'EN 419221-5 (ANSSI-CC-PP-2016/05-M01)',
          'The cryptographic module a trust service provider uses',
          'EUCC Annex II (remote QSCDs)',
        ],
      ]}
    />
    <Callout tone="key" title="Do not use the notification act as a technical standard">
      <p>
        CIR 2025/1570 governs notification of certified QSCDs. It does not itself establish an
        algorithm profile or Protection Profile. The applicable technical chain must still be
        established from the device type, Article 30 assessment basis, EUCC Annexes, the selected PP
        and the scheme&apos;s current cryptographic guidance.
      </p>
    </Callout>

    <Sources>
      <SourceCite id="EIDAS-REG-910-2014" label="Regulation 910/2014" />,{' '}
      <SourceCite id="eIDAS-2-Regulation" label="Regulation 2024/1183" />,{' '}
      <SourceCite id="CID-EU-2016-650-QSCD-Security-Assessment" label="Decision 2016/650" />,{' '}
      <SourceCite id="CIR-EU-2025-1567-Remote-QSCD-Management" label="CIR 2025/1567" />,{' '}
      <SourceCite id="CIR-EU-2025-1570-QSCD-Certification-Notification" label="CIR 2025/1570" />,{' '}
      <SourceCite
        id="CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme"
        label="CIR 2024/482 Annex II"
      />
      ;{' '}
      <SourceCite
        id="ANSSI-CC-PP-2018-02-EN-419241-2"
        label="EN 419241-2 PP, ANSSI-CC-PP-2018/02-M01"
      />
      .
    </Sources>
  </Section>
)

/** Learn section `pp-en419221-5` */
export const PpEn4192215 = () => (
  <Section>
    <DataTable
      caption="EN 419221-5 at a glance"
      head={['Item', 'Value']}
      rows={[
        [
          'Title',
          'Protection Profiles for TSP Cryptographic modules — Part 5: Cryptographic Module for Trust Services',
        ],
        [
          'Certified as',
          'ANSSI-CC-PP-2016/05 (draft v0.15, certified 16 December 2016); maintained to EN 419221-5:2018 v1.0 by ANSSI-CC-PP-2016/05-M01 (18 May 2020)',
        ],
        ['Criteria', 'Common Criteria 3.1 Revision 4; CC Part 2 extended, Part 3 conformant'],
        ['Assurance', 'EAL4 augmented with AVA_VAN.5'],
        ['Conformance', 'Strict — any ST or PP claiming it must conform strictly'],
        [
          'EUCC status',
          'Listed in Annex II for remote QSCDs; Annex I has a state-of-the-art interpretation of its FPT_PHP requirements',
        ],
      ]}
    />
    <P>
      The CEN edition of the standard is sold by CEN members and is not used here. The certified
      draft v0.15 is public on the CC portal, and ANSSI’s maintenance report records that the move
      to v1.0 changed only standardisation text, editorial details and “shall” for “must”. Short
      excerpts below are from that public v0.15.
    </P>

    <H3>What the TOE is</H3>
    <Quote
      cite={<SourceCite id="ANSSI-CC-PP-2016-05-EN-419221-5" label="EN 419221-5 PP v0.15, §1.2" />}
    >
      The Cryptographic Module, which is the Target of Evaluation (TOE), generates and/or protects
      secret keys and other sensitive data, and allows controlled use of these data for one or more
      cryptographic services in support of TSP trust services.
    </Quote>
    <P>
      The PP is deliberately generic: the TOE is “a set of configured software and hardware” — for
      example a PCIe card inside a server, or a dedicated module that client applications reach over
      a network — and client applications are always outside it. The TOE supports signing and
      sealing, certificate issuance and revocation, time stamping and authentication, and may
      support key backup. It is not, in general, aware of the context in which a function is used —
      enforcing sole control of a signing key is the client application’s job, with the TOE’s
      authorisation mechanisms.
    </P>

    <H3>Threats and policies, in outline</H3>
    <P>
      Threats include key disclosure (<Code>T.KeyDisclose</Code>), key derivation, key modification,
      key misuse and overuse, disclosure or modification of client data, and TOE malfunction. One
      organisational policy matters most for PQC:
    </P>
    <Quote
      cite={
        <SourceCite id="ANSSI-CC-PP-2016-05-EN-419221-5" label="EN 419221-5 PP v0.15, §1.3.1.3" />
      }
    >
      Only algorithms and algorithm parameters (e.g. key length) approved for the identified purpose
      shall be used by the TOE to carry out cryptographic operations for trust services.
    </Quote>
    <P>
      The PP names no algorithms. The ST author consults the relevant national body; the PP points
      to ETSI TS 119 312 and the SOG-IS crypto catalogue as examples. Under EUCC today that role
      falls to the ECCG Agreed Cryptographic Mechanisms (next section).
    </P>

    <H3>How EUCC interprets its physical protection</H3>
    <P>
      The EUCC state-of-the-art document{' '}
      <PlainSource>
        “Hardware assessment in EN 419221-5 (HSM PP): interpretation of the FPT_PHP requirements”,
        version 1 (February 2025; endorsed by the ECCG on 11 March 2025)
      </PlainSource>{' '}
      became part of Annex I with CIR 2025/2462. Its reasoning:
    </P>
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
      <li>
        The PP’s environment objective <Code>OE.ENV</Code> places the TOE in a protected environment
        where only authorised administrators have physical access.
      </li>
      <li>
        So <Code>FPT_PHP</Code> is met if the ISO/IEC 19790 physical-security requirements for
        security level 3 are met; physical attacks by anyone else are out of scope.
      </li>
      <li>
        Administrators must still not reach plaintext user keys — the evaluator tests every
        administrator interface, logical ones included, under the CEM.
      </li>
    </ul>
    <Callout tone="warn" title="A bridge, not a substitute">
      <p>
        The interpretation borrows the ISO/IEC 19790 Level 3 physical requirements as the test
        basis. It does not accept a FIPS 140-3 Level 3 certificate in place of the CC evaluation;
        the ITSEF still performs the design assessment and testing.
      </p>
    </Callout>

    <H3>Two real HSMs against this PP</H3>
    <DataTable
      caption="Real certificates referencing EN 419221-5"
      head={['HSM', 'Claim', 'Scheme']}
      rows={[
        [
          'TrustWay Proteccio V194/X194',
          'Conformant to EN 419221-5:2018; EAL4 augmented with ADV_IMP.2, ALC_CMC.5, ALC_DVS.2, ALC_FLR.3, AVA_VAN.5',
          'ANSSI-CC-2025/09 (France), CC 3.1 R5',
        ],
        [
          'nShield5s v13.5.1',
          'Report cites EN 419221-5 v1.0 and its restrictions; EAL4 augmented with ALC_FLR.2 and AVA_VAN.5',
          'CSA_CC_23004 (Singapore), CC 3.1 R5',
        ],
      ]}
    />
    <P>
      The same PP fixes the base: EAL4 plus AVA_VAN.5. The vendors then chose different additional
      components. The PP tells you the minimum; only the certificate tells you what each product
      actually claimed.
    </P>

    <H3>A CC 3.1 R4 PP in a CC:2022 world</H3>
    <P>
      EUCC Article 3(4) lets a CC:2022 certificate claim a PP written for CC 3.1 Revision 1–4 where
      Regulation 910/2014 or Decision 2016/650 requires that PP. That carve-out is why eIDAS PPs
      remain usable while the rest of the ecosystem moves to CC:2022.
    </P>
    <OpenQuestion>
      Whether the carve-out covers a particular EN 419221-5 evaluation depends on whether eIDAS
      rules require the PP for that use — confirm with the certification body. The historical
      maintenance report does not establish whether a newer CC:2022 edition exists or is being
      prepared; check the current publication and certification records before selecting an edition.
    </OpenQuestion>

    <H3>What PQC changes for an EN 419221-5 product</H3>
    <P>
      Adding ML-DSA to the {anchorName} appliance means new <Code>FCS_CKM.1</Code> and{' '}
      <Code>FCS_COP.1</Code> iterations in the ST, new interfaces and new AVA_VAN.5 work on the
      implementation, within the attack scope the PP’s environment allows. The PP itself does not
      need to change for that, because it delegates algorithm choice. The product’s certificate
      does: the new service is outside the evaluated TSF until a re-evaluation covers it.
    </P>

    <Sources>
      <SourceCite id="ANSSI-CC-PP-2016-05-EN-419221-5" label="EN 419221-5 PP v0.15" />,{' '}
      <SourceCite id="ANSSI-CC-PP-2016-05-M01" label="ANSSI-CC-PP-2016/05-M01" />,{' '}
      <SourceCite id="CIR-EU-2025-2462-EUCC-Amendment" label="CIR 2025/2462 (Annex I, II)" />;{' '}
      <PlainSource>
        <SourceCite
          id="ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation"
          label="ENISA FPT_PHP interpretation for EN 419221-5, v1"
        />
      </PlainSource>
      ; CC portal PP list; ANSSI-CC-2025/09; CSA_CC_23004.
    </Sources>
  </Section>
)

/** Learn section `pp-security-ic` (optional reference; cc + eucc-eidas) */
export const PpSecurityIc = () => (
  <Section>
    <DataTable
      caption="Security IC Platform PP at a glance"
      head={['Item', 'Value']}
      rows={[
        [
          'Identifier',
          'BSI-CC-PP-0084-V2-2026 — Security IC Platform Protection Profile including Functional Packages, version 2.0 (16 December 2025)',
        ],
        ['Developed by', 'Infineon, NXP, STMicroelectronics and Thales; sponsored by Eurosmart'],
        ['Criteria', 'CC:2022 Revision 1 (evaluated with CEM:2022)'],
        ['Assurance', 'EAL4 augmented with ALC_DVS.2, ALC_FLR.2 and AVA_VAN.5 (the minimum)'],
        ['Certified', 'by BSI, 25 February 2026; valid until 24 February 2036'],
        ['Conformance', 'Strict'],
      ]}
    />

    <H3>A platform, not a finished product</H3>
    <P>
      This PP covers the security IC — the chip and its dedicated support software — on which a
      smart card, secure element or embedded root of trust is built. The final product is a{' '}
      <em>composite</em>: the application is evaluated on top of the certified chip, reusing the
      chip’s certificate. That is the opposite of EN 419221-5, which covers a complete cryptographic
      module used by a trust service.
    </P>
    <P>
      Beyond the core PP, five optional functional packages can be claimed in any combination:
      Authentication of the Security IC, Loader 1 (secured environment only), Loader 2 (authorised
      users only), Cryptographic Services, and Address-based Access Control.
    </P>

    <H3>Where PQC hardware lands</H3>
    <P>
      The Cryptographic Services package defines generic SFRs for services the chip offers to the
      embedded software, and the ST author “shall iterate the SFRs as necessary to cover all the
      cryptographic services in the scope of the evaluation”. A lattice or hash accelerator added to
      a chip is therefore a new iteration — and new AVA_VAN.5 work against the PP’s physical and
      leakage threats (<Code>T.Phys-Probing</Code>, <Code>T.Phys-Manipulation</Code>,{' '}
      <Code>T.Leak-Inherent</Code>, <Code>T.Leak-Forced</Code>).
    </P>

    <DataTable
      caption="Two PPs compared"
      head={['', 'EN 419221-5', 'Security IC Platform PP v2.0']}
      rows={[
        [
          'TOE',
          'Complete cryptographic module for a trust service',
          'Chip platform for composite products',
        ],
        ['Criteria', 'CC 3.1 R4', 'CC:2022 R1'],
        ['Assurance', 'EAL4 + AVA_VAN.5', 'EAL4 + ALC_DVS.2, ALC_FLR.2, AVA_VAN.5'],
        [
          'Physical attacks',
          'Limited by OE.ENV (protected room)',
          'Named threats: probing, manipulation, leakage',
        ],
        [
          'Anchor customer',
          'EU qualified trust service provider',
          'Smart-card / secure-element manufacturer',
        ],
      ]}
    />

    <PathScopedContent paths={['cc']}>
      <Callout tone="key" title="On the Common Criteria path">
        <p>
          Notice that both PPs start at EAL4 with AVA_VAN.5 and differ in everything else. The
          certificate headline would read “EAL4+” for both.
        </p>
      </Callout>
    </PathScopedContent>
    <PathScopedContent paths={['eucc', 'eucc-eidas']}>
      <Callout tone="key" title="On the EUCC & eIDAS path">
        <p>
          A chip certified to this PP falls in the Annex I technical domain “smart cards and similar
          devices”, which is how it can reach AVA_VAN.5 under EUCC without being an Annex II PP. CIR
          2025/2462 also keeps the ADV_SPM.1 interpretation available for processes on the previous
          version of this PP (BSI-CC-PP-0084-2014) initiated before 1 October 2026.
        </p>
      </Callout>
    </PathScopedContent>

    <Sources>
      <SourceCite id="BSI-CC-PP-0084-V2-2026" /> (PP and BSI certification report),{' '}
      <SourceCite id="CIR-EU-2025-2462-EUCC-Amendment" label="CIR 2025/2462 (Annex I)" />.
    </Sources>
  </Section>
)

// ── Worked example and AVA_VAN.5 panels (section `eucc-pqc-today`) ──────────

const NIAP_DSC = (
  <SourceCite
    id="NIAP-cPP-Dedicated-Security-Component-Version-2-1"
    label="cPP for Dedicated Security Component v2.1"
  />
)

/** Collapsed panel: three invented Security Target requirements for the anchor HSM. */
const SecurityTargetExample = () => (
  <div className="space-y-3" data-testid="cceu-st-example">
    <H3>A worked example: PQC in a Security Target</H3>
    <P>
      This invented excerpt shows how a Security Target for the fictional Orrin N7 could word three
      post-quantum requirements: ML-KEM-768 key generation, ML-DSA-65 signing and a hybrid key
      derivation. It follows CC:2022 Part 2 with the mandatory errata applied and ends with the
      dependencies each requirement pulls in. No scheme or laboratory has reviewed it.
    </P>
    <Disclosure label="Show the full worked example" testId="cceu-st-example-panel">
      <P>
        Earlier sections say that adding ML-KEM or ML-DSA means new FCS_CKM and FCS_COP iterations
        in the Security Target. This example shows what three of them look like. The product is the
        fictional Orrin N7 at firmware 5.0.0. The excerpt is invented. It is not taken from a real
        Security Target, and no scheme or laboratory has reviewed it.
      </P>
      <P>
        The wording follows CC:2022 Part 2 with the mandatory errata applied (version 1.2, 15
        October 2025). Completed assignments are in bold. Each iteration has its own label in
        brackets, because CC:2022 Part 1 says different iterations must be uniquely identified. Some
        profiles write the label after a slash instead, for example FMT_MSA.1/GenKeys in EN 419
        221-5.
      </P>

      <H4>1. Key generation: FCS_CKM.1(ML-KEM-768)</H4>
      <Excerpt>
        <strong>FCS_CKM.1.1(ML-KEM-768)</strong> The TSF shall generate cryptographic keys in
        accordance with a specified cryptographic key generation algorithm{' '}
        <strong>ML-KEM.KeyGen with the parameter set ML-KEM-768</strong> and specified cryptographic
        key sizes <strong>encapsulation key 1184 bytes and decapsulation key 2400 bytes</strong>{' '}
        that meet the following:{' '}
        <strong>FIPS 203, Section 7.1 (Algorithm 19, ML-KEM.KeyGen)</strong>.
      </Excerpt>
      <P>How to read it:</P>
      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
        <li>
          Name the parameter set. FIPS 203 defines three, and their key sizes differ: for ML-KEM-768
          the encapsulation key is 1184 bytes and the decapsulation key is 2400 bytes. A claim that
          says only “ML-KEM” does not tell the laboratory which parameter set to test. <MA />
        </li>
        <li>
          FCS_CKM.1 has three assignments and no selection. An ST author must complete every
          assignment.
        </li>
        <li>
          One iteration is enough for one method, even with several key sizes. A later ML-KEM-1024
          could be handled in two ways: the author can list both parameter sets and their key sizes
          in the assignments of this iteration, or write a second iteration. CC:2022 Part 1 leaves
          the choice to the author, who weighs whether one rationale covers the whole list or each
          value needs its own rationale and trace.
        </li>
        <li>
          Key generation uses random bytes. FIPS 203 requires an approved random bit generator with
          at least 192 bits of security strength for ML-KEM-768. In CC terms that is the dependency
          of FCS_CKM.1 on FCS_RBG.1 or FCS_RNG.1, which the errata keep.
        </li>
      </ul>

      <H4>2. Signing: FCS_COP.1(ML-DSA-65 sign)</H4>
      <Excerpt>
        <strong>FCS_COP.1.1(ML-DSA-65 sign)</strong> The TSF shall perform{' '}
        <strong>digital signature generation</strong> in accordance with a specified cryptographic
        algorithm <strong>ML-DSA.Sign, hedged variant, parameter set ML-DSA-65</strong> and
        cryptographic key sizes <strong>private key 4032 bytes</strong> that meet the following:{' '}
        <strong>FIPS 204, Section 5.2 (Algorithm 2, ML-DSA.Sign)</strong>.
      </Excerpt>
      <P>How to read it:</P>
      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
        <li>For ML-DSA-65 the private key is 4032 bytes.</li>
        <li>
          Put “hedged” in the algorithm assignment. FIPS 204 signs with fresh randomness by default
          and also allows a deterministic variant. The two variants differ in one step. A product
          that offers both can name both variants in the assignments of one iteration or write one
          iteration per variant. CC:2022 Part 1 requires every iteration to differ from the others
          in its completed assignments, selections or refinements, and leaves the choice between a
          list of values and separate iterations to the author. <MA />
        </li>
        <li>
          FIPS 204 says the deterministic variant should not be used where side-channel attacks are
          a concern and cannot be otherwise mitigated. So offering the deterministic variant adds a
          question for the vulnerability analysis. <MA />
        </li>
        <li>
          The hedged variant uses a fresh 32-byte random value, which FIPS 204 says should ideally
          be generated by an approved random bit generator. The errata say that random bits
          generated inside an operation should be covered by FCS_RBG.1 or FCS_RNG.1, through a
          dependency added to the operation or, where it applies, through the operation’s dependency
          on key generation, which itself depends on one of them. Here the second route applies,
          through the ML-DSA-65 key generation iteration that this excerpt leaves out. <MA />
        </li>
        <li>
          This iteration covers signature generation only. Checking a signature, for example on a
          firmware update, is a different operation. CC:2022 Part 2 would let one iteration list
          both operations; this example gives checking its own iteration because it uses a different
          key (the public key) and a different algorithm entry (ML-DSA.Verify). <MA /> EN 419 221-5
          requires that, if the TOE supports updates, the iterations cover the operations that check
          update signatures.
        </li>
        <li>
          The classical half keeps its existing ECDSA or RSA iteration. ACM v2 says lattice
          mechanisms should be combined with a classical one, and that a hybrid signature can be a
          concatenation of signatures that must all verify. The excerpt does not show how the hybrid
          signature itself is claimed; see the note after the two panels.
        </li>
      </ul>

      <H4>3. Hybrid key derivation: FCS_CKM.5(Hybrid)</H4>
      <Excerpt>
        <strong>FCS_CKM.5.1(Hybrid)</strong> The TSF shall derive cryptographic keys{' '}
        <strong>256-bit AES session keys</strong> from{' '}
        <strong>
          the concatenation of the ML-KEM-768 shared secret and the ECDH P-256 shared secret in the
          fixed order of the combination; a salt; and a FixedInfo string that holds the name of the
          combination, the ML-KEM-768 encapsulation key and ciphertext, and both ECDH public values
        </strong>{' '}
        in accordance with a specified key derivation algorithm{' '}
        <strong>
          two-step key derivation, with HMAC-SHA-256 for randomness extraction and HMAC-SHA-256 for
          key expansion (the HKDF construction of RFC 5869)
        </strong>{' '}
        and specified cryptographic key sizes <strong>256 bits</strong> that meet the following:{' '}
        <strong>
          NIST SP 800-56C Rev. 2, Sections 2 and 5; NIST SP 800-227, Section 4.6.2; RFC 5869
        </strong>
        .
      </Excerpt>
      <P>How to read it:</P>
      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
        <li>
          CC:2022 has a component for this step. FCS_CKM.5 is the key derivation component. It
          requires that the methods, standards and parameters for key derivation are specified. A CC
          3.1 profile such as EN 419 221-5 has no such component. Its cryptographic support section
          lists FCS_CKM.1, FCS_CKM.4, FCS_COP.1 and FCS_RNG.1.
        </li>
        <li>
          FCS_CKM.5 has five assignments: key type, input parameters, key derivation algorithm, key
          sizes and standards. The errata add the missing application notes for all five. The input
          parameters are where the design shows: which secrets go in, in what order, and what
          context is bound to the result. <MA />
        </li>
        <li>
          NIST SP 800-56C Rev. 2 allows a hybrid shared secret, which is the concatenation of a
          standard shared secret and a second secret. SP 800-227 approves applying SP 800-56C
          key-derivation methods to the shared secret of an approved KEM, and approves a key
          combiner built on them when at least one of the shared secrets comes from SP 800-56A, SP
          800-56B or an approved KEM. With the two-step method, extraction is done on all the shared
          secrets together. HKDF, defined in RFC 5869, is a version of that two-step method that
          uses HMAC for both steps.
        </li>
        <li>
          FIPS 203 itself says that further key derivation from the ML-KEM shared secret shall be
          done in an approved manner, as specified in SP 800-108 and SP 800-56C. Inside SP 800-56C,
          the functions of SP 800-108 are used in the key-expansion step of the two-step method.
          That is why the example lists SP 800-56C and not SP 800-108. <MA />
        </li>
        <li>
          SP 800-227 says that a combiner that uses only the two shared secrets does not preserve
          IND-CCA security when only one of the two schemes is IND-CCA. It encourages combiners that
          preserve IND-CCA security, and its example also takes the ciphertexts, the encapsulation
          keys and a domain separator. SP 800-227 says that the FixedInfo input of SP 800-56C can
          carry such inputs, which is why the excerpt lists them.
        </li>
        <li>
          The FIPS 140-3 route asks for two related design choices: a fixed set of combinations and
          module control of the order in which the secrets are joined. There the step is called the
          key combiner.
        </li>
        <li>
          FCS_CKM.5 depends on FCS_CKM.6, key destruction. CC:2022 reads that dependency in two
          directions, destruction of the key-derivation key and destruction of the derived keys, and
          asks the author to consider intermediate values from key establishment. In this example
          the destruction list could name the two shared secrets, the extracted key-derivation key,
          the session keys, and the ML-KEM key-generation seed if the product stores it; the sources
          do not prescribe the exact list. <MA /> SP 800-56C Rev. 2 says the extracted
          key-derivation key shall be destroyed after use. FIPS 203 says the key-generation seed is
          as sensitive as the decapsulation key. NIAP’s {NIAP_DSC} says that key material includes
          seeds and other secret values used to derive keys, and that all such keys and keying
          material are subject to destruction in the first assignment of its key destruction
          requirement.
        </li>
      </ul>

      <P>
        <strong>Dependencies.</strong> The table gives the dependency lists of CC:2022 Part 2 as
        corrected by the errata, and how the example meets them.
      </P>
      <DataTable
        caption="Dependencies of the three iterations after errata version 1.2, and how the example meets them"
        head={['Iteration', 'Dependencies after errata v1.2', 'How the example meets them']}
        rows={[
          [
            'FCS_CKM.1(ML-KEM-768)',
            'One of FCS_CKM.2, FCS_CKM.5 or FCS_COP.1. One of FCS_RBG.1 or FCS_RNG.1. FCS_CKM.6.',
            'FCS_CKM.2(ML-KEM-768), not shown. FCS_RBG.1 with at least 192 bits of strength, not shown. FCS_CKM.6, not shown.',
          ],
          [
            'FCS_COP.1(ML-DSA-65 sign)',
            'One of FDP_ITC.1, FDP_ITC.2, FCS_CKM.1 or FCS_CKM.5. FCS_CKM.6.',
            'FCS_CKM.1(ML-DSA-65), not shown, which also carries the FCS_RBG.1 dependency. FCS_CKM.6, not shown.',
          ],
          [
            'FCS_CKM.5(Hybrid)',
            'One of FCS_CKM.2 or FCS_COP.1. FCS_CKM.6.',
            'FCS_CKM.2(ML-KEM-768) and FCS_CKM.2(ECDH P-256), not shown. FCS_CKM.6, not shown.',
          ],
        ]}
      />

      <P>
        <strong>Where encapsulation is written.</strong> NIAP’s published profiles do not all write
        ML-KEM the same way. In the {NIAP_DSC}, the{' '}
        <SourceCite
          id="NIAP-PP-General-Purpose-Computing-Platforms-Version-2-0"
          label="PP for General Purpose Computing Platforms v2.0"
        />{' '}
        and the{' '}
        <SourceCite id="NIAP-PP-Virtualization-Version-2-0" label="PP for Virtualization v2.0" />,
        ML-KEM encapsulation and decapsulation are listed in an FCS_COP.1 iteration,
        FCS_COP.1/KeyEncap, which FCS_CKM.2 selects as its method (“key encapsulation as specified
        in FCS_COP.1/KeyEncap”). In the{' '}
        <SourceCite
          id="NIAP-PP-Module-VPN-Client-Version-3-0"
          label="PP-Module for VPN Client v3.0"
        />
        , ML-KEM-1024 is named directly in FCS_CKM.2 among the key establishment methods. The table
        above shows FCS_CKM.2(ML-KEM-768) and does not decide how another scheme would split the
        algorithm between FCS_CKM.2 and FCS_COP.1. <MA />
      </P>

      <P>
        <strong>What this excerpt leaves out:</strong> FCS_CKM.1 for ML-DSA-65 and for ECDH P-256,
        FCS_CKM.2 for ML-KEM-768 and for ECDH P-256, FCS_RBG.1 and FCS_CKM.6, and everything else a
        Security Target holds: the threats, the objectives, the other requirements and the TOE
        summary specification. <MA /> FCS_CKM.2 is the component for key distribution methods.
        FCS_CKM.6 is the component for key destruction. FCS_RBG.1 is the component for random bit
        generation. FCS_RNG.1 is the alternative that the corrected dependency list allows.
      </P>

      <P>
        How NIAP profiles bring in new algorithms is covered in the lesson “
        <InLink to={`${LEARN}&section=niap-pqc-route`}>
          NIAP and post-quantum cryptography: what its profiles require
        </InLink>
        ”.
      </P>

      <Sources readOn="24 October 2026">
        <SourceCite id="COMMON-CRITERIA" label="CC:2022 Part 1" /> and{' '}
        <SourceCite id="CC-2022-PART2" label="Part 2" /> and the{' '}
        <ExternalSource name="CC:2022/CEM:2022 errata v1.2" href={CC_PORTAL_URL} />;{' '}
        <SourceCite id="FIPS 203" />; <SourceCite id="FIPS 204" />;{' '}
        <SourceCite id="NIST-SP-800-56C-R2" label="NIST SP 800-56C Rev. 2" />;{' '}
        <SourceCite id="NIST SP 800-227" />; <SourceCite id="RFC 5869" />;{' '}
        <SourceCite
          id="ANSSI-CC-PP-2016-05-EN-419221-5"
          label="EN 419 221-5 protection profile v0.15"
        />
        ; <SourceCite id="EUCC v2.0 ACM" label="ECCG Agreed Cryptographic Mechanisms v2" />;{' '}
        <SourceCite id="NIST-FIPS140-3-IG-PQC" label="FIPS 140-3 Implementation Guidance D.S" />;
        NIAP {NIAP_DSC},{' '}
        <SourceCite
          id="NIAP-PP-General-Purpose-Computing-Platforms-Version-2-0"
          label="PP for General Purpose Computing Platforms v2.0"
        />
        , <SourceCite id="NIAP-PP-Virtualization-Version-2-0" label="PP for Virtualization v2.0" />{' '}
        and{' '}
        <SourceCite
          id="NIAP-PP-Module-VPN-Client-Version-3-0"
          label="PP-Module for VPN Client v3.0"
        />
        .
      </Sources>
    </Disclosure>
  </div>
)

const DOC_SECURITY_BOXES_URL =
  'https://certification.enisa.europa.eu/publications/application-attack-potential-hardware-devices-security-boxes_en'
const DOC_SMARTCARDS_URL =
  'https://certification.enisa.europa.eu/publications/application-attack-potential-smartcards_en'

/** Collapsed panel inside a key callout: what AVA_VAN.5 asks of lattice-based code. */
const Avavan5Panel = () => (
  <Callout tone="key" title="AVA_VAN.5 for a lattice-based implementation">
    <div className="space-y-3" data-testid="cceu-avavan5">
      <P>
        This box names three kinds of attack on lattice-based code that a laboratory could look at
        under AVA_VAN.5, each with the published papers behind it. It also shows which
        attack-potential table applies under EUCC and why the scope depends on the profile a product
        claims. It is orientation only: a laboratory chooses its own test plan, tools and ratings.
      </P>
      <Disclosure label="Show the full AVA_VAN.5 text" testId="cceu-avavan5-panel">
        <P>
          <em>
            Orientation only. A laboratory chooses its own test plan, tools and ratings. This box is
            not a test method.
          </em>
        </P>

        <P>
          <strong>What AVA_VAN.5 asks.</strong> The evaluator tests as an attacker with High attack
          potential. The evaluator also searches public sources for known weaknesses in the TOE and
          in its third-party components. The CEM names research papers and conference proceedings
          among the publicly available sources an evaluator examines, and says the search should
          focus on sources that refer to the technologies used in the product. For a lattice-based
          implementation, the published side-channel and fault papers on lattice-based key
          encapsulation and signatures can therefore belong to that public record. <MA /> Lattice
          code from a third party goes on the third-party list. <MA />
        </P>

        <P>
          <strong>How High is counted.</strong> The CEM scores an attack on five factors: elapsed
          time, expertise, knowledge of the TOE, window of opportunity and equipment. The CEM
          example table is read by the attack potential an attack needed: 20 to 24 points is High
          and 25 or more is beyond High, and the CEM’s own worked case says an attack scenario of 21
          points that breaks the TOE fails AVA_VAN.5. The CEM says its values may need to be
          adjusted for the technology type, and that the evaluator should seek guidance from the
          evaluation authority. For AVA_VAN.5 it also points to guidance for special technical areas
          that is relevant for the national scheme.
        </P>

        <P>
          <strong>Which document rates it, by domain.</strong> Under EUCC, Annex I lists one
          attack-potential document for each of two technical domains at AVA_VAN level 4 or 5. Both
          replace the CEM table for their domain.
        </P>
        <DataTable
          caption="The three attack-potential tables: the CEM example table and the two EUCC domain documents"
          head={['Where', 'Document and version', 'Top row, as the table words it', 'Origin']}
          rows={[
            [
              'CEM:2022, Annex B (example table)',
              'Table B.3',
              'Column “attack potential required to exploit scenario”: 20 to 24 points is High; 25 or more is Beyond High',
              'The CEM itself',
            ],
            [
              'Hardware devices with security boxes',
              <>
                <ExtLink href={DOC_SECURITY_BOXES_URL}>
                  Application of Attack Potential to hardware devices with security boxes
                </ExtLink>
                , version 2, February 2025, endorsed by the ECCG on 11 March 2025
              </>,
              'Column “TOE resistant to attackers with attack potential of”: 35 and above is High',
              'JIL Embedded Devices Subgroup of SOG-IS',
            ],
            [
              'Smart cards and similar devices',
              <>
                <ExtLink href={DOC_SMARTCARDS_URL}>
                  Application of Attack Potential to Smartcards and Similar Devices
                </ExtLink>
                , version 2, February 2025, endorsed by the ECCG on 11 March 2025
              </>,
              'Column “TOE resistant to attackers with attack potential of”: 31 and above is High',
              'ISCI and the JIL Hardware Attacks Subgroup of SOG-IS',
            ],
          ]}
        />

        <P>
          The CEM table says what attack potential an attack needed. The two domain tables say which
          attacker the TOE resists. In the CEM, AVA_VAN.5 stands for a TOE resistant to attackers
          with High attack potential, whose residual vulnerabilities can only be exploited by
          attackers with beyond-High potential. The three top rows therefore describe different
          things and are not three starting points of one scale. <MA />
        </P>

        <P>
          Annex I lists the EN 419 221-5 HSM interpretation under the security-box domain, and the
          security-box document has an annex with rating advice for hardware security modules. An
          HSM that claims EN 419 221-5, such as the Orrin N7, would therefore normally be assessed
          in that domain; the certification body confirms the domain for a given product. <MA /> The
          same attack path can get different points under the CEM, the security-box document and the
          smart-card document, because the factor values differ: for a difficult window of
          opportunity the CEM table gives 10 points, and the security-box document gives 4 for
          identification and 5 for exploitation. A total is read on the table of the domain that
          applies and is not carried to another table. <MA /> The security-box document scores the
          effort to find an attack (identification) and the effort to repeat it (exploitation)
          separately, then adds them.
        </P>

        <P>
          Neither document names a post-quantum algorithm. The security-box document says rating
          advice for software attacks and random number generator attacks will be added in further
          revisions. The smart-card document already has a section on attacks on random number
          generators, and it lists changing the characteristics of the random numbers generated
          among the effects of perturbation. The documents give no separate table for post-quantum
          attacks, so the general factor tables of the domain are what is available. <MA /> The
          smart-card document adds that where cryptography is involved the certification body should
          be consulted. The attack types the documents already name are the ones behind the targets
          below: perturbation, power consumption, emanation and timing (security boxes);
          perturbation, key retrieval by fault analysis and side-channel attacks (smart cards).
        </P>

        <P>
          <strong>Scope check before planning tests.</strong> Before rating an attack path, the
          evaluator determines whether it is applicable and reachable under the TOE boundary, the
          interfaces, the assumptions and the operational environment. <MA /> EN 419 221-5 assumes a
          protected environment that limits physical access to authorised administrators. Its OE.Env
          also lists inspections that detect attempts to reach side-channels, and protection against
          emanation attacks. The profile’s refinement of AVA_VAN.5 says that the protection which
          FPT_PHP.1 and FPT_PHP.3 must give against physical attacks is equivalent to the assessment
          in ISO/IEC 19790 at Security Level 3. Its rationale for AVA_VAN.5 (section 7.2.4) adds
          that, while the environment is meant to protect against physical attacks, a high level of
          protection against logical attacks, especially remote ones, is also necessary, and that
          this is why the vulnerability analysis is augmented to High attack potential. ENISA’s
          interpretation adds that physical attacks by other persons are not applicable, that no
          additional vulnerability analysis for physical attacks is needed, and that all kinds of
          administrator access must be taken into account, including logical access through
          interfaces that only administrators can reach. The security-box document describes
          power-consumption analysis as done through an external interface of the TOE, emanation
          analysis as done with an antenna outside the security-box boundary, and timing analysis as
          usually possible through the external interfaces. For an HSM under that profile, logical
          attacks reachable through interfaces, including timing and error behaviour seen from
          outside, therefore remain relevant. <MA /> A profile that names power, emanation or fault
          attacks as threats puts them in scope: the Security IC Platform profile, for example,
          names inherent and forced information leakage as threats. The texts do not say how these
          rules combine for new cryptographic code in an HSM; see the note after the two panels.
        </P>

        <P>
          <strong>Three typical test targets.</strong> Most of the published attacks below were
          shown on Kyber or Dilithium implementations. ML-KEM and ML-DSA are derived from those
          designs, and the standards list the differences in an appendix. NIST notes that exposure
          to side-channel attacks varies by application, so universal guidelines are unlikely to
          help.
        </P>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-foreground/90">
          <li>
            <strong>The NTT and decapsulation in ML-KEM, masked or not.</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                Primas, Pessl and Mangard showed a single-trace attack on a lattice-based encryption
                scheme that uses leakage from the number-theoretic transform and can also attack
                masked implementations; they note that the attack can be adapted to other
                lattice-based constructions (CHES 2017).
              </li>
              <li>
                Hamburg and co-authors attacked CCA2-secure Kyber with chosen ciphertexts, also
                against masked implementations, in a noisy leakage setting (TCHES 2021, issue 4).
              </li>
              <li>
                Bos and co-authors built the first completely masked Kyber, with first-order masked
                decapsulation costing 3.1 million cycles on an Arm Cortex-M4F (TCHES 2021, issue 4).
              </li>
              <li>
                Hermelink, Pessl and Pöppelmann combined a modified ciphertext with a fault that
                restores it during decapsulation, and say shuffling and Boolean masking do not stop
                the attack (INDOCRYPT 2021).
              </li>
              <li>
                Bernstein and co-authors found that a division on secret data takes input-dependent
                time (KyberSlash), and recovered Kyber secret keys within minutes to a few hours on
                a Raspberry Pi 2 and an Arm Cortex-M4 (TCHES 2025, issue 2).
              </li>
              <li>
                NIST SP 800-227 says KEM modules should have countermeasures against side-channel
                attacks, including constant-time code and protection of memory from leakage.
              </li>
            </ul>
          </li>
          <li>
            <strong>The rejection loop in ML-DSA signing.</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                ML-DSA signing repeats a loop until the checks pass, and FIPS 204 says each pass
                either produces a valid signature or an invalid one whose release would leak
                information about the private key.
              </li>
              <li>
                Zhou and co-authors showed that leakage from rejected signing attempts gives the
                challenge and response of those attempts, from which an integer-programming step
                recovered Dilithium-2, -3 and -5 private keys in seconds or minutes; they measured
                the leakage as power consumption on an Arm Cortex-M4 (TCHES 2025, issue 4).
              </li>
              <li>
                Zhao and co-authors used power traces from both rejected and final attempts, and
                report that the attack also works in the hedged mode (DATE 2026). Both attacks use
                power measurements. <MA />
              </li>
              <li>
                FIPS 204 notes that deterministic signing leaks information about the message, not
                the private key, through timing, and advises hedged signing if the message must stay
                hidden.
              </li>
              <li>
                Azouaoui and co-authors classify the steps of Dilithium signing by the protection
                they need, and report that the randomized variant can be much cheaper to protect
                than the deterministic one (TCHES 2023, issue 4).
              </li>
            </ul>
          </li>
          <li>
            <strong>Fault injection on ML-DSA signing, and on verification.</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                Signature verification takes only a public key, a message and a signature. Fault
                analysis that retrieves a key works from the difference between correct and faulty
                cryptographic outputs. So the fault target for key recovery is signing, not
                verification. <MA />
              </li>
              <li>
                Bruinderink and Pessl showed that single random faults in deterministic Dilithium
                can cause nonce reuse and key recovery; with clock glitching on an Arm Cortex-M4, up
                to 65.2% of the execution time of Dilithium was vulnerable to an unprofiled attack
                that injects a random fault anywhere during signing (TCHES 2018, issue 3). FIPS 204
                cites this paper among the reasons for the hedged default.
              </li>
              <li>
                Ravi and co-authors injected electromagnetic faults into the deterministic Dilithium
                code of the pqm4 library and recovered an important portion of the secret key
                (AsiaCCS 2019).
              </li>
              <li>
                Krahmer and co-authors showed key-recovery faults against hedged (randomized)
                Dilithium too: as few as 1024 and 512 faulty signatures for Dilithium2 in their two
                attacks, one of which faults the public matrix A (TCHES 2024, issue 3).
              </li>
              <li>
                Azevedo-Oliveira and co-authors build a key-recovery attack on Dilithium for the
                case where the rejection step is weakened, and note that physically preventing one
                of the rejection tests gives two fault attacks (PKC 2025).
              </li>
              <li>
                FIPS 204 says the missing randomness makes fault attacks on the deterministic
                variant harder to mitigate. So hedging makes fault attacks easier to mitigate, but
                published work shows it does not stop them. <MA />
              </li>
              <li>
                A fault in verification does not recover a key, but it can change an accept or
                reject result: the smart-card document lists changing “the results of validation
                such as authentication” among the goals of faults. Calle Viera, Berzati and
                Heydemann examined the verification of the Dilithium reference implementation under
                randomizing, zeroizing and skipping faults, and describe how to forge signatures
                without the secret key by using faults in verification together with properties of
                the public parameters (CARDIS 2023). EN 419 221-5 has the evaluator test that only
                validly signed updates can be installed, so for a product with signed updates the
                check itself is a target. <MA />
              </li>
            </ul>
          </li>
        </ol>

        <P>This list is not complete. A laboratory may test other targets.</P>

        <Sources readOn="24 October 2026">
          <SourceCite id="CC-2022-PART3" label="CC:2022 Part 3" /> and{' '}
          <SourceCite id="CC-2022-CEM" label="CEM:2022" /> with the{' '}
          <ExternalSource name="errata v1.2" href={CC_PORTAL_URL} />;{' '}
          <SourceCite id="CIR-EU-2025-2462-EUCC-Amendment" label="CIR 2025/2462 Annex I" />; the two
          EUCC state-of-the-art documents on attack potential (
          <ExtLink href={DOC_SECURITY_BOXES_URL}>security boxes</ExtLink>,{' '}
          <ExtLink href={DOC_SMARTCARDS_URL}>smart cards</ExtLink>); the{' '}
          <SourceCite
            id="ANSSI-CC-PP-2016-05-EN-419221-5"
            label="EN 419 221-5 protection profile v0.15"
          />{' '}
          and{' '}
          <SourceCite
            id="ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation"
            label="ENISA’s FPT_PHP interpretation"
          />
          ;{' '}
          <SourceCite id="BSI-CC-PP-0084-V2-2026" label="Security IC Platform protection profile" />
          ; <SourceCite id="FIPS 203" />; <SourceCite id="FIPS 204" />;{' '}
          <SourceCite id="NIST SP 800-227" />; and the papers named in the bullets.
        </Sources>
      </Disclosure>
    </div>
  </Callout>
)

/** Visible after both panels: the lessons that carry the testing and signing detail. */
const ExampleLessonPointer = () => (
  <P>
    To see how leakage is measured and why a plain fixed-versus-random test is not enough for
    lattice-based code, read{' '}
    <InLink to="/learn/pqc-testing-validation">PQC Network Testing &amp; Validation</InLink>. For
    hedged and deterministic signing, read{' '}
    <InLink to="/learn/hsm-pqc">HSM &amp; PQC Operations</InLink>.
  </P>
)

/** Visible, not collapsed: what the two panels leave open. */
const ExampleLimitsNote = () => (
  <div data-testid="cceu-example-limits">
    <Callout tone="warn" title="What this example does not settle">
      <p>
        These points depend on the practice of a certification scheme or a laboratory, and the
        public texts read for this lesson do not decide them.
      </p>
      <ol className="list-decimal space-y-2 pl-5 pt-1">
        <li>
          <strong>Where ML-KEM encapsulation is written.</strong> Three NIAP profiles list ML-KEM
          encapsulation and decapsulation in an FCS_COP.1 iteration that FCS_CKM.2 selects, while
          the NIAP VPN Client module names ML-KEM-1024 directly in FCS_CKM.2. CC:2022 Part 2 lists
          key agreement among the typical FCS_COP.1 operations. The choice changes what else the
          Security Target must hold, because the corrected dependency lists differ: FCS_COP.1
          depends on FCS_CKM.6, and FCS_CKM.2 does not. No text read says which of the two a given
          scheme expects for ML-KEM, so the example shows FCS_CKM.2 and does not decide. <MA />
        </li>
        <li>
          <strong>How a hybrid signature is claimed.</strong> ACM v2 describes a hybrid signature as
          signatures from different schemes that must all verify. CC:2022 Part 2, the errata, the
          CEM and the NIAP profiles read contain no rule for writing that as requirements (for
          example two FCS_COP.1 iterations, or one iteration with a refinement), or for what
          certification bodies accept.
        </li>
        <li>
          <strong>
            Whether HMAC and SHA-256 inside the key derivation need their own iterations.
          </strong>{' '}
          CC:2022 Part 2 does not say. NIAP’s cPP for Dedicated Security Component v2.1 refers to
          its hash and keyed-hash iterations for its one-step derivation methods, and names the MAC
          and PRF inside FCS_CKM.5 for its two-step method.
        </li>
        <li>
          <strong>Claiming EN 419 221-5 from a CC:2022 Security Target.</strong> CC:2022 Part 1 says
          a Security Target that claims strict conformance may add SFRs to those of the profile. The
          transition policy lets a CC:2022 Security Target claim a CC 3.1 profile until 31 December
          2027 and says changed components should be replaced by their CC:2022 counterparts. No text
          read says how a certification body handles FCS_CKM.5 and FCS_CKM.6 beside the profile’s
          own FCS_CKM.1, FCS_CKM.4 and FCS_COP.1, or whether they must trace to the profile’s
          objectives and its policy P.Algorithms. The profile text used here is version 0.15, the
          version that EUCC Annex II lists; the paid CEN edition was not checked.
        </li>
        <li>
          <strong>Whether physical attacks on the new code are in scope under that profile.</strong>{' '}
          ENISA’s interpretation says physical attacks by other persons are not applicable, that no
          additional vulnerability analysis for physical attacks is needed, and that logical access
          through interfaces, including administrator-only interfaces, must be taken into account.
          The security-box document describes power and emanation analysis as done from outside the
          security box. The texts do not say whether power, electromagnetic and fault attacks on the
          new cryptographic code are tested under AVA_VAN.5, under the Level 3 physical testing, or
          not at all.
        </li>
        <li>
          <strong>
            How a fault on the random input of hedged signing is rated, and how published attacks
            carry over.
          </strong>{' '}
          The security-box document says rating advice for random number generator attacks will be
          added. The smart-card document has a section on such attacks and says the certification
          body should be consulted where cryptography is involved. The CEM lists research papers and
          conference proceedings as sources. No text read says how an attack published on the
          earlier Kyber or Dilithium design is treated for ML-KEM or ML-DSA, or how a fault on the
          randomness input is rated today.
        </li>
      </ol>
    </Callout>
  </div>
)

/** Learn section `eucc-pqc-today` */
export const EuccPqcToday = () => (
  <Section>
    <P>
      EUCC cryptographic guidance helps developers and evaluators select mechanisms for an EUCC
      evaluation. It does not establish a universal rule for all CC evaluations or eIDAS
      assessments. The ENISA guidance recommends preferred mechanisms; distinguish those
      recommendations from requirements in the applicable scheme rules, Protection Profile and
      Security Target.
    </P>

    <Callout tone="current" title="Applicable guidance checked 21 October 2026">
      <p>
        <SourceCite id="EUCC v2.0 ACM" label="ECCG Agreed Cryptographic Mechanisms v2" /> (the
        document is dated April 2025) and the EUCC Guidelines on Cryptography v2; ENISA’s page lists
        both with the date 6 May 2025:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Key establishment:</strong> ML-KEM (FIPS 203) and FrodoKEM are agreed. Recommended
          parameters: “the highest possible standardised parameter size, either ML-KEM-1024 or
          ML-KEM-768” (FrodoKEM-1344 or -976).
        </li>
        <li>
          <strong>Signatures:</strong> ML-DSA (FIPS 204), SLH-DSA (FIPS 205), XMSS and LMS (SP
          800-208) are agreed. ML-DSA: “either ML-DSA-87 or ML-DSA-65”. SLH-DSA: the parameter sets
          at security levels 3 and 5.
        </li>
        <li>
          <strong>Hybridisation of lattice schemes:</strong> “LWE or MLWE based cryptographic
          mechanisms shouldn’t be used in a standalone way to provide the intended security
          functionality, but should be combined with a well established classical cryptomechanism.”
          (ACM v2.0, Note 40) For signatures, concatenating signatures that must all verify is
          acceptable.
        </li>
        <li>
          <strong>Hash-based signatures:</strong> hybridisation optional — they “may however also be
          used in a standalone way”. The state of LMS/XMSS is critical data to protect against
          replay.
        </li>
        <li>
          <strong>Classical asymmetric:</strong> where quantum resistance is required, RSA and
          discrete-log mechanisms “shall not be used without being combined with a quantum resistant
          mechanism”.
        </li>
      </ul>
    </Callout>

    <H3>What that means for the anchor HSM</H3>
    <DataTable
      caption="ACM v2 applied to the Orrin N7 change"
      head={['Plan', 'Alignment with cited ACM v2 guidance', 'Why']}
      rows={[
        [
          'ML-KEM-768 or -1024 combined with ECDH (hybrid KEM)',
          'Aligned at mechanism/parameter level',
          'Recommended parameters, hybridised',
        ],
        [
          'ML-KEM-512 standalone',
          'Not as recommended',
          'Not a recommended parameter set, and lattice schemes should not be standalone',
        ],
        [
          'ML-DSA-65 or -87 alongside ECDSA or RSA',
          'Aligned at mechanism/parameter level',
          'Recommended parameters, hybridised',
        ],
        [
          'SLH-DSA at security level 3 or 5, standalone',
          'Aligned at mechanism/parameter level',
          'Hash-based: hybridisation optional',
        ],
        [
          'LMS for firmware signing',
          'Conditional on state protection and other applicable constraints',
          'Agreed; state must be protected in integrity and against replay',
        ],
      ]}
    />
    <P>
      These rows compare selected mechanisms with cited guidance; they are not certification
      verdicts. The evaluator must also examine the construction, implementation, applicable PP and
      Security Target. The certification body classifies a product change under the applicable EUCC
      continuity rules. Following an ACM recommendation alone does not establish conformity.
    </P>

    <SecurityTargetExample />

    <H3>What changes in the evaluation when PQC enters</H3>
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
      <li>
        <strong>The Security Target:</strong> new <Code>FCS_CKM</Code>/<Code>FCS_COP</Code>{' '}
        iterations naming the mechanism and parameter set, and updated TOE summary specification.
      </li>
      <li>
        <strong>The hybrid construction itself:</strong> ACM v2 says hybrid modes “shall ensure that
        all combined pre or post-quantum cryptographic mechanisms need to be broken simultaneously
        for the hybrid mode to be broken” — so the combiner is part of what is examined, not just
        the two algorithms.
      </li>
      <li>
        <strong>Vulnerability analysis:</strong> the new implementation is new attack surface at the
        claimed AVA_VAN level, within the attack scope the PP’s environment allows.
      </li>
      <li>
        <strong>Guidance and life cycle:</strong> administrator guidance for the new keys, and — for
        LMS/XMSS — the state handling ACM v2 treats as critical data.
      </li>
    </ul>

    <Avavan5Panel />
    <ExampleLessonPointer />
    <ExampleLimitsNote />

    <Callout tone="planning" title="Planning implication — not yet applicable">
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>ACM v3</strong> is a draft. ENISA posted the “draft for public review” on 2 June
          2026 (a working draft dated April 2026) with review until the end of July 2026. v2 remains
          the applicable version <AsOf />.
        </li>
        <li>
          <strong>ENISA hybridisation report</strong> (
          <SourceCite id="ENISA-Hybridization-Standardisation-Status" label="30 April 2026" />) maps
          hybrid standards to ACM v2 but says it “does not establish a recommendation”.
        </li>
        <li>
          <strong>NIS Cooperation Group PQC roadmap</strong> (
          <SourceCite id="EU-NIS-CG-Roadmap-v1.1" label="v1.1, 11 June 2025" />) is policy guidance
          for Member States, not an EUCC requirement. Its milestone dates are market deadlines: they
          create urgency, not a shorter certification route.
        </li>
      </ul>
    </Callout>

    <Callout tone="warn" title="Two shortcuts to avoid">
      <p>
        “NIST approved it, so EUCC accepts it as-is” — no: ACM is the EU’s own list and prefers
        larger parameters and hybrids. “ACM v3 is out, so follow it” — no: it is a draft until ENISA
        publishes it as applicable.
      </p>
    </Callout>

    <Sources>
      <SourceCite id="EUCC v2.0 ACM" label="ECCG ACM v2" />,{' '}
      <SourceCite id="ENISA-Hybridization-Standardisation-Status" />,{' '}
      <SourceCite id="EU-NIS-CG-Roadmap-v1.1" />; ENISA “EUCC Guidelines on Cryptography” page
      (lists ACM v2 as applicable and the v3 draft for public review).
    </Sources>
  </Section>
)

// ── Regional schemes built on Common Criteria ──────────────────────────────

const Ref = ({ source }: { source: SourceRef }) =>
  source.libraryId ? (
    <SourceCite id={source.libraryId} label={source.label} />
  ) : source.url ? (
    <ExtLink href={source.url}>{source.label}</ExtLink>
  ) : (
    <PlainSource>{source.label}</PlainSource>
  )

const RefList = ({ sources }: { sources: readonly SourceRef[] }) => (
  <>
    {sources.map((s, i) => (
      <span key={s.label}>
        {i > 0 ? ', ' : ''}
        <Ref source={s} />
      </span>
    ))}
  </>
)

const ROLE_STYLE: Record<MapEntry['role'], string> = {
  authorizing: 'border-primary/40 bg-primary/10 text-foreground',
  consuming: 'border-border bg-muted text-foreground/90',
  outside: 'border-status-warning/40 bg-status-warning/10 text-foreground',
}

const ROLE_LABEL: Record<MapEntry['role'], string> = {
  authorizing: 'CCRA authorizing — issues certificates',
  consuming: 'CCRA consuming — recognises, does not issue',
  outside: 'Uses the CC text outside the CCRA — no mutual recognition',
}

/** The coverage map: every CCRA participant and CC-based outsider, by region. */
const CoverageMap = () => (
  <div className="space-y-3" data-testid="cc-regional-map">
    <div className="grid gap-3 sm:grid-cols-2">
      {REGIONS.map((region) => {
        const entries = COVERAGE_MAP.filter((e) => e.region === region)
        return (
          <div key={region} className="rounded-lg border border-border p-3">
            <p className="mb-2 text-sm font-semibold text-foreground">
              {region} <span className="font-normal text-muted-foreground">({entries.length})</span>
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {entries.map((e) => (
                <li
                  key={e.country}
                  title={[ROLE_LABEL[e.role], e.eu ? 'EU — EUCC applies' : '', e.note ?? '']
                    .filter(Boolean)
                    .join(' · ')}
                  className={`rounded-md border px-2 py-0.5 text-xs ${ROLE_STYLE[e.role]}`}
                >
                  {e.country}
                  {e.eu ? <span className="ml-1 font-semibold text-primary">EU</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
    <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Map legend">
      {(Object.keys(ROLE_LABEL) as MapEntry['role'][]).map((r) => (
        <li key={r} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm border ${ROLE_STYLE[r]}`} />
          {ROLE_LABEL[r]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="font-semibold text-primary">EU</span> EU member state — EUCC applies by law
      </li>
    </ul>
  </div>
)

const kindsOf = (kinds: readonly { kind: AdditionKind }[]) =>
  [...new Set(kinds.map((a) => ADDITION_KIND_LABEL[a.kind]))].join('; ') || '—'

/** Learn section `cc-regional-schemes` */
export const CcRegionalSchemes = () => (
  <div className="space-y-4" data-as-of={REGIONAL_AS_OF}>
    <P>
      Common Criteria is one standard (ISO/IEC 15408, with ISO/IEC 18045 for the evaluation method),
      but nobody is certified by “Common Criteria”. A certificate is issued under a certification
      scheme: a national scheme or, in the EU, the EUCC set out in Regulation (EU) 2024/482. What it
      is worth elsewhere depends on a recognition arrangement. Every scheme starts from the same
      criteria and then adds its own requirements on top.
    </P>

    <H3>Three layers</H3>
    <DataTable
      caption="The three layers of a Common Criteria certificate"
      head={['Layer', 'What it is', 'Who sets it']}
      rows={[
        [
          '1. The criteria',
          'Security functional and assurance requirements, the evaluation method, Protection Profiles',
          <SourceCite key="cc" id="COMMON-CRITERIA" label="CC:2022 (ISO/IEC 15408)" />,
        ],
        [
          '2. Recognition',
          <>
            <strong>CCRA</strong> (worldwide): mutual recognition only for a collaborative PP, or up
            to EAL2 + ALC_FLR. <strong>EUCC</strong> (EU law): ‘substantial’ and ‘high’; AVA_VAN 4
            or 5 where the product is covered by an Annex I technical domain or by a certified
            protection profile listed in Annex II (Art 7(3)).
          </>,
          <span key="r">
            <Ref source={CCRA_SOURCE} />,{' '}
            <SourceCite
              id="CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme"
              label="Regulation (EU) 2024/482"
            />
          </span>,
        ],
        [
          '3. National additions',
          'Own Protection Profiles or PP policy, cryptography rules and validation, lighter national methods, procurement mandates',
          'Each national scheme',
        ],
      ]}
    />

    <Callout
      tone="key"
      title="The CCRA recognises the evaluation; collaborative PPs leave room for national cryptographic refinements"
    >
      <p>
        The 2014 arrangement says collaborative PPs “shall not contain requirements that have a
        dependency on national conformity assessment schemes” and should allow “other national
        approved primitives/protocols so nations can provide their own refinements”. Schemes in this
        module add their own cryptographic requirements on top: the US asks for a CAVP certificate,
        Canada for Cyber Centre-approved cryptography, Korea for KCMVP on the product types it
        lists, Malaysia for MyCV, and in the EU the cryptography guidelines point evaluators to the
        ECCG Agreed Cryptographic Mechanisms (a guideline, not a validation). Post-quantum
        requirements enter through these scheme-level rules.
      </p>
      <p className="text-xs text-muted-foreground">
        <Ref source={CCRA_SOURCE} />, Annex K.1
      </p>
    </Callout>

    <H3>Who takes part — the coverage map</H3>
    <P>
      36 countries take part in the CCRA: 18 issue certificates and 18 only recognise them. EU
      member states are bound by EUCC whatever their CCRA role. China, Russia and Kazakhstan use the
      Common Criteria text in their own national standards, outside the arrangement.
    </P>
    <CoverageMap />
    <p className="text-xs text-muted-foreground">
      Roles as listed by the <Ref source={CCRA_MEMBERS_SOURCE} /> on {REGIONAL_AS_OF_LABEL}. The
      portal still lists Italy as authorizing although OCSI now works only under EUCC, and Sweden’s
      CSEC no longer issues new CCRA certificates.
    </p>

    <H3>What each scheme adds on top</H3>
    <DataTable
      caption="Regional additions on top of Common Criteria"
      head={['Scheme', 'Recognition', 'Adds']}
      rows={REGIONAL_SCHEMES.filter((s) => s.additions.length > 0).map((s) => [
        <span key="s">
          <strong>{s.country}</strong> — {s.scheme}
        </span>,
        s.recognition,
        kindsOf(s.additions),
      ])}
    />
    <P>
      Four patterns repeat: a <strong>PP policy</strong> (NIAP evaluates only against its own
      approved PPs; Singapore and Korea add national PPs), <strong>cryptography rules</strong>{' '}
      (validation or an approved-mechanism list), a <strong>lighter national method</strong>{' '}
      (France’s CSPN, Germany’s BSZ, Spain’s LINCE, Japan’s ST confirmation), and a{' '}
      <strong>procurement or legal mandate</strong> that turns a certificate into a condition of
      sale (NIAP’s Product Compliant List, Australia’s ISM, Spain’s CPSTIC catalogue; the EUCC
      scheme itself is voluntary-based, per ENISA).
    </P>

    <H3>Post-quantum positions — where a scheme or its government has published one</H3>
    <DataTable
      caption="Published post-quantum positions by scheme"
      head={['Country', 'Position', 'Source']}
      rows={REGIONAL_SCHEMES.map((s) => [
        <strong key="c">{s.country}</strong>,
        s.pqc ?? (
          <span key="n" className="text-muted-foreground">
            No published position found
          </span>
        ),
        <RefList key="r" sources={s.sources} />,
      ])}
    />
    <Callout tone="warn" title="The NIAP date that reaches every CCRA certificate">
      <p>
        NIAP Policy #33 applies to products “certified by either NIAP or a CCRA partner”. From 1
        January 2028 a product that does not meet CNSA 2.0 for every cryptographic function is not
        accepted into NIAP evaluation, and from 1 January 2029 it is not posted to the Product
        Compliant List — so a certificate from any CCRA scheme stops opening the US
        national-security market unless its cryptography is CNSA 2.0. The policy states one
        exception: AES-128 for Bluetooth is exempt until the Bluetooth standard is updated. The same
        policy sets earlier cut-offs for products that do not meet CNSA 1.0 minimum requirements:
        they can no longer extend a certificate through Assurance Maintenance or hold one for more
        than two years, are not accepted into NIAP evaluation from 1 January 2027, and are not
        posted to the Product Compliant List from 1 July 2027.
      </p>
    </Callout>

    <H3>Outside the CCRA</H3>
    <DataTable
      caption="Countries that use the Common Criteria text outside the CCRA"
      head={['Country', 'Standard and body', 'Adds', 'Post-quantum']}
      rows={OUTSIDE_CCRA.map((o) => [
        <strong key="c">{o.country}</strong>,
        <span key="b">
          {o.standard}. {o.body}.
        </span>,
        o.additions,
        o.pqc ?? (
          <span key="n" className="text-muted-foreground">
            No published position found
          </span>
        ),
      ])}
    />
    <P>
      The same criteria, no mutual recognition: a certificate from these schemes is not recognised
      by CCRA members, and a CCRA certificate does not replace their national certification.
    </P>

    <OpenQuestion>
      Some countries have adopted the Common Criteria text as a national standard (for example
      Belarus, Vietnam and Taiwan) without an official source confirming a certification scheme;
      they are left off the map. Korea’s national PQC migration year is reported in the press but
      not yet in an official document.
    </OpenQuestion>

    <Sources>
      <Ref source={CCRA_SOURCE} />, <Ref source={CCRA_MEMBERS_SOURCE} />, and the national sources
      listed per scheme (read {REGIONAL_AS_OF_LABEL}).
    </Sources>
  </div>
)

/** Learn section `cc-regional-reference` (optional) */
export const CcRegionalReference = () => (
  <div className="space-y-4" data-as-of={REGIONAL_AS_OF}>
    <P>
      Per-scheme detail behind the regional-schemes section: what each scheme recognises, what it
      adds on top of Common Criteria, and its post-quantum position, each with its source.
    </P>
    {REGIONS.map((region) => {
      const schemes = REGIONAL_SCHEMES.filter((s) => s.region === region)
      if (schemes.length === 0) return null
      return (
        <div key={region} className="space-y-3">
          <H3>{region}</H3>
          {schemes.map((s) => (
            <div key={s.id} className="space-y-1 rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold text-foreground">
                {s.country} — {s.scheme}{' '}
                <span className="font-normal text-muted-foreground">({s.role})</span>
              </p>
              <p className="text-foreground/90">
                <span className="font-medium">Recognition:</span> {s.recognition}
              </p>
              {s.additions.length > 0 ? (
                <ul className="list-disc space-y-0.5 pl-5 text-foreground/90">
                  {s.additions.map((a) => (
                    <li key={a.text}>
                      <span className="font-medium">{ADDITION_KIND_LABEL[a.kind]}:</span> {a.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No national addition found beyond the CCRA.</p>
              )}
              <p className="text-foreground/90">
                <span className="font-medium">Post-quantum:</span>{' '}
                {s.pqc ?? (
                  <span className="text-muted-foreground">no published position found</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Sources: <RefList sources={s.sources} />
              </p>
            </div>
          ))}
        </div>
      )
    })}
  </div>
)

const NIAP_POLICY_5_URL =
  'https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/policy-ltr-5-update3.pdf'
const NIAP_PP_LIST_URL = 'https://www.niap-ccevs.org/protectionprofiles'
const NIAP_TD1009_URL = 'https://www.niap-ccevs.org/technical-decisions/TD1009'
const NIAP_TD1012_URL = 'https://www.niap-ccevs.org/technical-decisions/TD1012'
const NIAP_TD1013_URL = 'https://www.niap-ccevs.org/technical-decisions/TD1013'
const NIAP_TD1025_URL = 'https://www.niap-ccevs.org/technical-decisions/TD1025'
const NIAP_TD0966_URL = 'https://www.niap-ccevs.org/technical-decisions/TD0966'

type ProfileRow = {
  profile: string
  /** Library reference id of the document. */
  libraryId: string
  version: string
  date: string
  /** The approval date as listed on NIAP's table of approved profiles (read 23 October 2026). */
  approved: string
  pq: string
  classical: string
  /** Verbatim snippets from the document itself, in the order they are listed under the table. */
  quotes: readonly string[]
  quoteSource?: string
}

const APP_NOTE =
  'Note that ML-DSA and ML-KEM are not usable in any functions at the time of initial publication, they are added to this requirement in support of future protocol updates.'
const REMOVAL_NOTE =
  'As support is expanded for CNSA 2.0, CNSA 1.0 will be removed as an selection in a future update.'
const FE_NOTE =
  'This PP-Module allows the use of ML-KEM key establishment schemes with the hybrid key-transport methods described in SP800-56B to provide a CNSA2-compliant key-transport method.'
const FE_KT =
  'CNSA 2.0 Compliant Algorithms: [ Hybrid Key-Transport Method ] that meets the following: [Section 9.3 of NIST SP 800-56B, Revision 2] using a key establishment algorithm [ML-KEM] as specified in FCS_CKM.2 (from the Base-PP ) and a key wrapping algorithm as specified in FCS_COP.1/KW'

/** One row per NIAP document whose own text was read; quotes are verbatim from that document. */
const NIAP_PROFILE_ROWS: readonly ProfileRow[] = [
  {
    profile: 'Application Software PP',
    libraryId: 'NIAP-Protection-Profile-for-Application-Software-Version-2-0',
    version: '2.0',
    date: '2025-06-16',
    approved: '16 Jun 2025',
    pq: 'LMS, XMSS, ML-KEM-1024, ML-DSA-87',
    classical: 'CNSA 1.0 branch: RSA 3072-bit or greater, P-384 (P-521), safe-prime groups',
    quotes: [`${APP_NOTE} ${REMOVAL_NOTE}`],
  },
  {
    profile: 'cPP Dedicated Security Component',
    libraryId: 'NIAP-cPP-Dedicated-Security-Component-Version-2-1',
    version: '2.1',
    date: '17 Nov 2025',
    approved: '26 Mar 2026',
    pq: 'LMS, HSS, XMSS, XMSS MT, ML-KEM (512, 768, 1024), ML-DSA (44, 65, 87), HashML-DSA',
    classical:
      'RSA 2048 or 3072, EC curves from P-256, finite-field groups, EdDSA; NIAP TD1011 lists CNSA 1.0 or 2.0',
    quotes: [
      'Final publication for v2.1 (post-quantum cryptography, respond to NIAP comments)',
      'RSA Modulus of size [selection: 2048 bit, 3072 bit]',
      'Elliptic Curve [selection: P-256, brainpoolP256r1, P-384, brainpoolP384r1, P-521, brainpoolP512r1]',
      'Static domain parameters approved for [selection: IKE groups [selection: MODP-2048, MODP-3072, MODP-4096, MODP-6144, MODP-8192], TLS groups [selection: ffdhe2048, ffdhe3072, ffdhe4096, ffdhe6144, ffdhe8192]]',
      'EdDSA Domain parameters approved for elliptic curves [selection: Edwards25519, Edwards448]',
    ],
  },
  {
    profile: 'cPP Network Devices',
    libraryId: 'NIAP-cPP-Network-Devices-Version-4-0',
    version: '4.0',
    date: '25 Nov 2025',
    approved: '22 Dec 2025',
    pq: 'LMS, XMSS, ML-KEM-1024, ML-DSA-87',
    classical:
      'RSA 2048 to 8192, ECDSA from P-256, finite-field groups; NIAP TD1010 lists CNSA 1.0 or 2.0',
    quotes: [
      'Each applicable Cryptographic SFR (FCS_) must include at least one selection conforming to Commercial National Security Algorithm (CNSA) Suite V1.0 or V2.0;',
    ],
    quoteSource: 'NIAP TD1010',
  },
  {
    profile: 'PP General-Purpose Computing Platforms',
    libraryId: 'NIAP-PP-General-Purpose-Computing-Platforms-Version-2-0',
    version: '2.0',
    date: '2026-04-16',
    approved: '22 Apr 2026',
    pq: 'LMS, XMSS, ML-KEM-1024, ML-DSA-87',
    classical: 'RSA 3072 to 8192, P-384 or P-521, finite-field groups (3072 bits and up)',
    quotes: ['ML-KEM-1024 is CNSA compliant.'],
  },
  {
    profile: 'PP Virtualization',
    libraryId: 'NIAP-PP-Virtualization-Version-2-0',
    version: '2.0',
    date: '2026-05-21',
    approved: '21 May 2026',
    pq: 'ML-KEM-1024, ML-DSA-87; LMS and XMSS for verification',
    classical: 'RSA 3072 to 8192, P-384 or P-521, finite-field groups (3072 bits and up)',
    quotes: [
      'the only anticipated use of key encapsulation is the use of ML-KEM as part of key establishment for trusted communications',
    ],
  },
  {
    profile: 'cPP Full Drive Encryption, Authorization Acquisition',
    libraryId: 'NIAP-cPP-Full-Drive-Encryption-Authorization-Acquisition-Version-3-0',
    version: '3.0',
    date: '2026-03-12',
    approved: '25 Mar 2026',
    pq: 'ML-KEM-1024, ML-DSA-87; LMS and XMSS for verification',
    classical: 'CNSA 1.0 branch: RSA 3072 to 8192, P-384 (P-521)',
    quotes: [REMOVAL_NOTE],
  },
  {
    profile: 'cPP Full Drive Encryption, Encryption Engine',
    libraryId: 'NIAP-cPP-Full-Drive-Encryption-Encryption-Engine-Version-3-0',
    version: '3.0',
    date: '2026-03-12',
    approved: '25 Mar 2026',
    pq: 'ML-KEM-1024, ML-DSA-87; LMS and XMSS for verification',
    classical: 'CNSA 1.0 branch: RSA 3072 to 8192, P-384 (P-521)',
    quotes: [`${APP_NOTE} ${REMOVAL_NOTE}`],
  },
  {
    profile: 'cPP Hardcopy Devices',
    libraryId: 'NIAP-cPP-Hardcopy-Devices-Version-2-0',
    version: '2.0',
    date: '31 Jul 2026',
    approved: '23 Sep 2026',
    pq: 'ML-KEM-1024, ML-DSA-87, LMS, XMSS',
    classical: 'RSA 2048 or more, ECDSA 256 bits or more, finite-field 2048 bits or more, KCDSA',
    quotes: [
      'Module-Lattice-based Digital Signature Algorithm using parameter set ML-DSA-87',
      'RSA Digital Signature Algorithm and cryptographic key sizes (modulus) [assignment: 2048 bits or',
      'FFC schemes using cryptographic key sizes of 2048-bit or greater',
      'EC-KCDSA-based key establishment schemes',
    ],
  },
  {
    profile: 'PP-Module VPN Client',
    libraryId: 'NIAP-PP-Module-VPN-Client-Version-3-0',
    version: '3.0',
    date: '2025-09-30',
    approved: '29 Sep 2025',
    pq: 'LMS, XMSS, ML-KEM-1024, ML-DSA-87',
    classical:
      'ECC P-384 (the module text makes it mandatory), RSA 3072-bit or greater, safe-prime groups; in the Mobile Device Fundamentals configuration Curve25519 (RFC 7748) stays selectable, listed as a “Non-CNSA Algorithm”',
    quotes: [
      'CC :2022 conversion, limitation of cryptographic algorithms to CNSA 1.0, incorporation of TDs',
      'ECC key generation with support for P-384 has been made mandatory in support of IPsec',
      'FFC schemes using "safe-prime" groups [ selection: MODP-3072, MODP-4096, MODP-6144, MODP-8192, ffdhe-3072, ffdhe-4096, ffdhe-6144, ffdhe-8192]',
    ],
  },
  {
    profile: 'PP-Module File Encryption',
    libraryId: 'NIAP-PP-Module-File-Encryption-Version-2-0',
    version: '2.0',
    date: '2025-09-29',
    approved: '29 Sep 2025',
    pq: 'ML-KEM only, in a hybrid key-transport method',
    classical: 'RSA KTS-OAEP, 3072 or 4096 bits',
    quotes: [FE_KT, FE_NOTE],
  },
  {
    profile: 'PP-Module File Encryption Enterprise Management',
    libraryId: 'NIAP-PP-Module-File-Encryption-Enterprise-Management-Version-2-0',
    version: '2.0',
    date: '2025-09-29',
    approved: '29 Sep 2025',
    pq: 'ML-KEM only, in a hybrid key-transport method',
    classical: 'RSA KTS-OAEP, 3072 or 4096 bits',
    quotes: [FE_KT, FE_NOTE],
  },
]

/** Profiles reported on NIAP's list whose text we did not read: names and dates only. */
const NIAP_REPORTED_ONLY: readonly string[] = [
  'PP-Module for Email Client, version 1.0: 16 Jun 2025',
  'PP-Module for Web Browser, version 1.0: 16 Jun 2025',
  'Functional Package for TLS, version 2.1: 3 Sep 2025',
  'PP-Module for Endpoint Detection and Response, version 2.0: 13 Jan 2026',
  'PP-Module for Host Agent, version 2.0: 13 Jan 2026',
  'PP-Module for VPN Gateways, version 2.0: 21 Jan 2026',
  'PP-Module for Authentication Servers, version 2.0: 10 Mar 2026',
  'PP-Module for Enterprise Session Controller, version 2.0: 10 Mar 2026',
  'PP-Module for Session Border Controller, version 2.0: 17 Mar 2026',
  'PP-Module for Stateful Traffic Filter Firewalls, version 2.0: 2 Apr 2026',
  'PP-Module for MACsec Ethernet Encryption, version 2.0: 17 Apr 2026',
  'PP-Module for SDN Controller, version 1.0: 21 Apr 2026',
  'PP-Module for Intrusion Prevention (IPS): date not captured',
  'PP for General Purpose Operating Systems, version 4.3: listed with 27 Sep 2022',
  'PP for Mobile Device Fundamentals, version 3.3: listed with 12 Sep 2022',
]

/** Learn section `niap-pqc-route` */
export const NiapPqcRoute = () => (
  <div className="space-y-4" data-as-of="2026-10-23">
    <P>
      <strong>How it works.</strong> NIAP is the US scheme for Common Criteria and is part of the
      NSA (<SourceCite id="NIAP-CCEVS-MANUAL" label="Scheme Publication #2" />
      ). A lab evaluates the product. It reaches the Product Compliant List only if it was evaluated
      against a NIAP-approved protection profile, and conformance is exact, so the profile fixes the
      tests, with fixed Evaluation Activities in the profile or its Supporting Document. <MA />{' '}
      Which profile fits an HSM-type product is for the vendor, the lab and NIAP to decide. <MA />{' '}
      We did not find a NIAP profile written for HSMs: “not found”, not “does not exist”. <MA /> Our
      Library’s HSM profiles (
      <InLink to={`${LEARN}&path=eucc-eidas&section=pp-en419221-5`}>EN 419 221-5</InLink>,{' '}
      <SourceCite id="BSI-CC-PP-0114-V2X-HSM" label="BSI V2X HSM" />,{' '}
      <SourceCite
        id="CAR-2-CAR-Communication-Consortium-HSM-Protection-Profile"
        label="CAR 2 CAR HSM"
      />
      ) are European, not NIAP. <MA />
    </P>

    <Callout tone="key" title="Two agencies, three certificates.">
      <p>
        NIAP, run by the NSA, issues the Common Criteria certificate. NIST is a different agency
        with two programs: CAVP tests an algorithm and gives an algorithm certificate; CMVP
        validates a whole module and gives a module certificate. NIAP Policy #5 ties them together:
        “At a minimum an appropriate NIST CAVP certificate is required before a NIAP CC Certificate
        will be awarded.” (
        <ExternalSource name="NIAP Policy Letter #5" href={NIAP_POLICY_5_URL} />)
      </p>
    </Callout>

    <P>
      <strong>
        First example: the Dedicated Security Component cPP, version 2.1 (17 November 2025).
      </strong>{' '}
      Its revision history says “post-quantum cryptography”. It describes a component that serves
      “the encompassing platform”. Its authors “designed the DSC cPP as a standalone PP” (a base
      profile, evaluated once and reused across devices){' '}
      <ModuleAnalysisNote>(Module analysis.)</ModuleAnalysisNote>, while the component “is not
      intended to be a discrete, separate stand-alone component, but one which is directly embedded
      into a larger system”. Whether an HSM design fits that embedded boundary is for the vendor,
      the lab and NIAP to decide. <MA /> The profile lists post-quantum algorithms as allowed
      choices beside the classical ones, including ML-KEM (512, 768, 1024) and ML-DSA (44, 65, 87).
      The profile text offers them as selections and has no CNSA wording.{' '}
      <ModuleAnalysisNote>(Module analysis, from reading the text.)</ModuleAnalysisNote> (
      <SourceCite id="NIAP-cPP-Dedicated-Security-Component-Version-2-1" label="DSC cPP v2.1" />)
    </P>
    <P>
      NIAP adds the CNSA rule by Technical Decision TD1011, published 26 March 2026. NIAP endorsed
      CPP_DSC_V2.1 on that date, and the older CPP_DSC_V1.0E “will sunset effective 26 September
      2026” (<ExternalSource name="NIAP news item" />
      ). TD1011 says: “In order to be listed on the NIAP PCL, evaluations against CPP_DSC_V2.1 must
      meet the following requirements:” and “Each applicable Cryptographic SFR (FCS_) must include
      at least one selection conforming to Commercial National Security Algorithm (CNSA) Suite V1.0
      or V2.0;”. Its list includes “ML-KEM-1024”, “ML-DSA-87” and “LMS or XMSS (LMS 256-192
      preferred) for soft/firmware signature”, next to “ECDH 384”, “ECDSA 384” and “RSA with minimum
      3072-bit modulus”; and “Evaluations certified by NIAP must only make CNSA-compliant
      selections.” (
      <SourceCite id="NIAP-TD1011-DSC-v2-1-Endorsement" label="TD1011" />) So post-quantum is one
      allowed route, not the only one: CNSA 1.0 selections such as ECDSA 384 and RSA 3072 also
      count.
    </P>

    <P>
      <strong>Contrast: Application Software, version 2.0 (16 June 2025).</strong> It is here
      because it shows explicit CNSA 1.0 and CNSA 2.0 branches in one US profile. Its CNSA 2.0
      branch sits next to a CNSA 1.0 branch (RSA of 3072 bits or more, P-384 and P-521, safe-prime
      groups). The profile says: “ML-DSA and ML-KEM are not usable in any functions at the time of
      initial publication, they are added to this requirement in support of future protocol updates.
      As support is expanded for CNSA 2.0, CNSA 1.0 will be removed as an selection in a future
      update.” It prepares for the move and does not force it. <MA /> (
      <SourceCite
        id="NIAP-Protection-Profile-for-Application-Software-Version-2-0"
        label="NIAP Protection Profile for Application Software v2.0"
      />
      )
    </P>

    <DataTable
      caption="Post-quantum choices in two NIAP profiles, by function: the Dedicated Security Component cPP v2.1 and the CNSA 2.0 branch of the Application Software profile v2.0"
      head={[
        'Function',
        'DSC cPP v2.1: post-quantum choices',
        'Application Software v2.0: CNSA 2.0 branch',
      ]}
      rows={[
        [
          'Key generation',
          'LMS, HSS, XMSS, XMSS-MT, ML-KEM (512, 768, 1024), ML-DSA (44, 65, 87)',
          'LMS, XMSS, ML-KEM-1024, ML-DSA-87',
        ],
        ['Key establishment', 'ML-KEM (512, 768, 1024), as key encapsulation', 'ML-KEM-1024 only'],
        ['Signature generation', 'LMS, HSS, XMSS, XMSS-MT, ML-DSA, HashML-DSA', 'ML-DSA-87 only'],
        [
          'Signature verification',
          'LMS, HSS, XMSS, XMSS-MT, ML-DSA, HashML-DSA',
          'LMS, XMSS, ML-DSA-87',
        ],
      ]}
    />
    <p className="text-xs text-muted-foreground">
      “Only” reads the CNSA 2.0 branch of those requirements. <MA />
    </p>
    <H3>NIAP profiles that already list post-quantum choices</H3>
    <P>
      As of 23 October 2026, 11 NIAP documents we checked (8 profiles and 3 profile modules) list
      post-quantum choices such as ML-KEM, ML-DSA, LMS and XMSS. All 11 refer to CC:2022 in their
      own text. In all 11, classical algorithms remain in the cryptographic requirements alongside
      the post-quantum entries, though some key-encapsulation tables list only ML-KEM-1024. <MA />{' '}
      None of the 11 requires post-quantum cryptography, and none has removed the classical (CNSA
      1.0) choices; three of them (Application Software 2.0 and Full Drive Encryption Authorization
      Acquisition 3.0 and Encryption Engine 3.0) say that will happen “in a future update”. <MA />{' '}
      The checks cover only these 11 documents. NIAP’s table of approved protection profiles lists
      58 on 23 October 2026: the 15 documents below are listed as reported and not yet read, and the
      other 32 (26 of them still on Common Criteria 3.1) are neither read nor listed here.
    </P>
    <DataTable
      caption="NIAP profiles with post-quantum selections, as of 23 October 2026"
      head={[
        'Profile',
        'Version',
        'Date in document',
        'Post-quantum algorithms listed',
        'Classical choices in the document text',
      ]}
      rows={NIAP_PROFILE_ROWS.map((r) => [
        <span key="p">
          <strong>
            <SourceCite id={r.libraryId} label={r.profile} />
          </strong>
          <span className="block text-xs text-muted-foreground">NIAP approved {r.approved}</span>
        </span>,
        r.version,
        r.date,
        r.pq,
        r.classical,
      ])}
    />
    <p className="text-xs text-muted-foreground">
      “Date in document” is the one the document itself shows; “NIAP approved” is the approval date
      as listed on{' '}
      <ExternalSource name="NIAP’s table of approved profiles" href={NIAP_PP_LIST_URL} />
      (read 23 October 2026), which lists all 11 as CC:2022. Algorithm lists are written as the
      profile lists them. Source pages: the{' '}
      <SourceCite
        id="NIAP-Protection-Profile-for-Application-Software-Version-2-0"
        label="Application Software profile"
      />{' '}
      and the{' '}
      <SourceCite
        id="NIAP-cPP-Dedicated-Security-Component-Version-2-1"
        label="Dedicated Security Component cPP"
      />
      .
    </p>
    <P>
      Three of the profiles (Dedicated Security Component, Network Devices and Hardcopy Devices) are
      international collaborative profiles whose text lists classical algorithms below CNSA 1.0,
      such as RSA 2048 and P-256 (and KCDSA in Hardcopy Devices). NIAP restricts what can be posted
      to the Product Compliant List by endorsement Technical Decisions that all say the same: each
      applicable cryptographic requirement must include at least one selection conforming to CNSA
      1.0 or 2.0, and an evaluation in another scheme may select other algorithms if the product can
      be configured not to use them. These are{' '}
      <SourceCite id="NIAP-TD1011-DSC-v2-1-Endorsement" label="TD1011" /> for Dedicated Security
      Component, <SourceCite id="NIAP-TD1010-Network-Devices-v4-0-Endorsement" label="TD1010" /> for
      Network Devices, <ExternalSource name="TD1012" href={NIAP_TD1012_URL} /> and{' '}
      <ExternalSource name="TD1013" href={NIAP_TD1013_URL} /> for Full Drive Encryption 3.0
      (Authorization Acquisition and Encryption Engine), and{' '}
      <ExternalSource name="TD1009" href={NIAP_TD1009_URL} /> for Hardcopy Devices version 1.1 only.
      NIAP’s page for Hardcopy Devices 2.0 lists no Technical Decision (read 23 October 2026), and
      we found no such decision for version 2.0. <MA /> For the Functional Package for TLS 2.1 (a
      package, not a profile), <ExternalSource name="TD1025" href={NIAP_TD1025_URL} /> (1 April
      2026) says the same for (D)TLS servers.
    </P>
    <p className="text-sm font-medium text-foreground">Quotes from each document</p>
    <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground/90">
      {NIAP_PROFILE_ROWS.map((r) => (
        <li key={r.profile}>
          <span className="font-medium">
            {r.profile} {r.version}:
          </span>{' '}
          {r.quotes.map((q, i) => (
            <span key={q}>
              {i > 0 ? ' ' : ''}“{q}”
            </span>
          ))}
          {r.quoteSource ? ` (${r.quoteSource})` : ''}
        </li>
      ))}
    </ul>
    <p className="text-sm font-medium text-foreground">
      Notes on the table <MA />
    </p>
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
      <li>
        “Listed” means a selectable entry in an allowed-choices table or a selection list. In the
        tables we read, post-quantum entries are options; we did not find a function where only a
        post-quantum entry is available. Some key-encapsulation tables list only ML-KEM-1024 (the
        Network Devices cPP, Table 14, and Virtualization, Table 18); in others (Dedicated Security
        Component, General-Purpose Computing Platforms, Full Drive Encryption) RSA entries sit in
        the same table. Where a table has a single entry, the requirement itself applies only if the
        Security Target selects ML-KEM.
      </li>
      <li>
        In two profiles, Application Software 2.0 and Full Drive Encryption Encryption Engine 3.0,
        ML-KEM and ML-DSA are present as selections that the profile says cannot yet be used in any
        function (see the quotes above).
      </li>
      <li>
        “LMS and XMSS for verification” and “only” in the table state what we did not find in the
        other tables of the same profile, from a search of the text; for example, Virtualization has
        no LMS or XMSS entry in its signature-generation table.
      </li>
      <li>
        The two File Encryption modules define a hybrid key-transport requirement (FCS_COP.1/KT)
        that uses ML-KEM as specified in the base profile’s FCS_CKM.2, with a key wrapping
        algorithm; their text has no match for ML-DSA, LMS or XMSS.
      </li>
      <li>
        NIAP’s approval dates differ from the dates inside the documents. The 25 March 2026
        announcement names Hardcopy Devices version 1.1, not 2.0; the Hardcopy Devices 2.0 document
        is dated 31 July 2026 and NIAP’s table lists it approved 23 September 2026.
      </li>
      <li>
        Virtualization and General-Purpose Computing Platforms: NIAP’s announcement says each
        “supports CNSA 2.0 updates”, yet the revision history in the document does not mention
        post-quantum cryptography, although the requirement tables carry post-quantum selections.
        The tables are what we used.
      </li>
      <li>The Hardcopy Devices text has no match for “CNSA”.</li>
      <li>
        The VPN Client module’s revision history, dated 2025-09-30 in the document, says “limitation
        of cryptographic algorithms to CNSA 1.0”, while the same module text carries the CNSA 2.0
        selections and, in the Mobile Device Fundamentals configuration, still lists Curve25519 as a
        “Non-CNSA Algorithm”. We quote both and make no reading of the difference.
      </li>
      <li>
        <ExternalSource name="TD0966" href={NIAP_TD0966_URL} /> (8 January 2026) corrects the
        brackets of the VPN Client module’s FCS_CKM.1. Its text states ECC “NIST curves” P-384
        outside the later selection, puts ML-KEM-1024 and ML-DSA-87 in the CNSA 2.0 branch, and puts
        the safe-prime groups in the CNSA 1.0 branch.
      </li>
    </ul>

    <H3>Reported, not yet verified</H3>
    <P>
      These names and dates are as reported from NIAP’s list of approved protection profiles. We did
      not read the profiles’ text, so nothing here is a claim about their algorithms, and a report
      that these modules only inherit their base profile’s choices is not verified for any of them.
    </P>
    <ul className="list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-foreground/90">
      {NIAP_REPORTED_ONLY.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>

    <H3>What forces the move: a chain</H3>
    <P>Each link below is quoted, except where marked as module analysis.</P>
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
      <li>
        <SourceCite id="CNSSP-11-IA-Product-Acquisition-Policy" label="CNSSP 11" /> (2013): products
        for national security systems “shall comply with the requirements of the NIAP program” and,
        “where applicable”, FIPS validation.
      </li>
      <li>
        <SourceCite id="CNSSP 15" label="CNSSP 15" /> and CNSA 2.0. Read through{' '}
        <SourceCite id="NSA CNSA 2.0 FAQ" label="NSA’s FAQ" />: “CNSSP 15 states that by January 1,
        2027, CNSA 2.0 algorithms will be required in all new acquisitions for NSS and NIAP
        Protection Profiles are being updated to enable QR certification before this date.”
      </li>
      <li>
        <SourceCite id="NIAP-CCEVS-POLICY-33" label="NIAP Policy #33" /> (31 August 2026, effective
        1 January 2027). It sets dated cut-offs for acceptance into evaluation and for listing on
        the Product Compliant List: first for products that do not meet CNSA 1.0 requirements for
        every cryptographic function, then for products that do not meet CNSA 2.0 requirements for
        every cryptographic function. The dates are in the callout{' '}
        <InLink to={`${LEARN}&section=cc-regional-schemes`}>
          “The NIAP date that reaches every CCRA certificate”
        </InLink>
        . Two points that callout leaves out: under both lists, products “will be archived at a date
        to be determined, regardless of time remaining on their certification”, and “Use of AES-128
        for Bluetooth will be the exception to this policy until the Bluetooth standard is updated.”
        NIAP’s announcements page, not the Policy letter, adds a statement of intent: “NIAP will
        issue new or update applicable technical decisions for some Protection Profiles to allow for
        temporary use of select algorithms which are not CNSA 1.0 compliant for certain functions
        such as secure boot and trusted update. NIAP strongly recommends vendors adopt CNSA 2.0
        compliant algorithms as soon as possible.” (
        <SourceCite
          id="NIAP-Announcements-Policy-33-Technical-Decisions-Notice"
          label="NIAP announcements"
        />
        ) We found no such decision yet.
      </li>
      <li>
        The profiles and Technical Decisions. The two examples and their test methods (the DSC test
        methods are in its{' '}
        <SourceCite id="NIAP-cPP-DSC-Supporting-Document-Version-2-1" label="Supporting Document" />
        ); NIAP’s TD1011 for the DSC cPP, quoted above (
        <SourceCite id="NIAP-TD1011-DSC-v2-1-Endorsement" label="TD1011" />
        ), and TD1010 for the Network Devices cPP version 4.0 (24 March 2026); both require at least
        one selection conforming to CNSA 1.0 or 2.0 for the Product Compliant List (
        <SourceCite id="NIAP-TD1010-Network-Devices-v4-0-Endorsement" label="TD1010" />
        ); and the DSC group’s own “Post-Quantum Algorithm Support” decision of 17 June 2025 (
        <ExternalSource name="DSC-iTC Technical Decisions page" />
        ).
      </li>
      <li>
        The product’s Security Target, which picks a branch. <MA />
      </li>
      <li>
        CSfC (Commercial Solutions for Classified).{' '}
        <SourceCite id="NSA CSfC PQC Guidance Addendum" label="NSA’s draft addendum" /> (Draft .5, 4
        April 2025) says: “January 1 2027 - CNSA 2.0 required in all new products and services
        unless stipulated by CSfC CP, NIAP PP or a Waiver is in place.” CP is a Capability Package.
      </li>
    </ol>

    <P>
      <strong>The module point.</strong> The NSA CNSA 2.0 FAQ (version 2.2) says: “If your product
      is only verifying signatures, CAVP testing is all that is required. Code sources and signature
      generation processes (signers) that are NSS are required to produce signatures according to
      NIST SP 800-208, which requires hardware validated by NIST’s Cryptographic Module Validation
      Program (CMVP), or via other NSA guidance. Waivers for this will not be granted.” A CMVP
      module certificate is a separate ask from the NIAP certificate; CAVP tests an algorithm, CMVP
      validates a module. <MA /> The{' '}
      <InLink to="/learn/fips-140-3-certification">FIPS 140-3 lesson</InLink> covers that route.
    </P>

    <H3>Ask your lab</H3>
    <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
      <li>Which profile and version will you expect us to claim?</li>
      <li>
        Which branch will our Security Target claim per function, and what happens when the CNSA 1.0
        branch goes?
      </li>
      <li>
        Do our post-quantum algorithms have CAVP certificates for the evaluated configuration?
      </li>
      <li>Does the customer also need a CMVP-validated module?</li>
      <li>
        Is signing inside the Target of Evaluation (TOE) boundary, or done in the operational
        environment?
      </li>
      <li>How do the 2027, 2028 and 2029 dates fall against our dates?</li>
    </ol>
    <p className="text-xs text-muted-foreground">
      <ModuleAnalysisNote>(Questions: Module analysis.)</ModuleAnalysisNote>
    </p>

    <P>
      One line on the EU: <SourceCite id="ANSSI-CC-PP-2016-05-EN-419221-5" label="EN 419 221-5" />{' '}
      is a profile for cryptographic modules of trust service providers, at EAL4 augmented with
      AVA_VAN.5, in a different scheme. <MA />
    </P>

    <P>
      Related lessons:{' '}
      <InLink to="/learn/stateful-signatures">Stateful Hash-Based Signatures</InLink> (LMS and XMSS
      in both profiles), <InLink to="/learn/hsm-pqc">HSM and PQC</InLink>, and the{' '}
      <InLink to="/compliance?tab=records">Compliance product records</InLink> (real certificates
      and their claimed profiles).
    </P>

    <Sources readOn="23 October 2026">
      <SourceCite id="NIAP-CCEVS-MANUAL" />, <SourceCite id="NIAP-CCEVS-POLICY-33" />,{' '}
      <SourceCite id="NSA CNSA 2.0 FAQ" />, <SourceCite id="NSA CSfC PQC Guidance Addendum" />,{' '}
      <SourceCite id="CNSSP-11-IA-Product-Acquisition-Policy" />, <SourceCite id="CNSSP 15" /> (the
      Library’s copy is the older edition; the sentence quoted above is read through the FAQ),{' '}
      <SourceCite id="ANSSI-CC-PP-2016-05-EN-419221-5" />,{' '}
      <SourceCite id="BSI-CC-PP-0114-V2X-HSM" />
      , <SourceCite id="CAR-2-CAR-Communication-Consortium-HSM-Protection-Profile" />,{' '}
      <SourceCite id="NIAP-Protection-Profile-for-Application-Software-Version-2-0" />
      , <SourceCite id="NIAP-cPP-Dedicated-Security-Component-Version-2-1" />,{' '}
      <SourceCite id="NIAP-cPP-DSC-Supporting-Document-Version-2-1" />,{' '}
      <SourceCite id="NIAP-TD1011-DSC-v2-1-Endorsement" />,{' '}
      <SourceCite id="NIAP-TD1010-Network-Devices-v4-0-Endorsement" />,{' '}
      <ExternalSource name="NIAP Policy Letter #5" href={NIAP_POLICY_5_URL} />.
    </Sources>
  </div>
)

/** Small inline marker used by the workshop steps when a record was checked. */
export const CheckedOn = ({ date }: { date: string }) => (
  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
    <Info size={12} aria-hidden="true" /> Checked against the official record on {date}
  </span>
)
