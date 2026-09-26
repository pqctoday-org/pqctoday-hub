// SPDX-License-Identifier: GPL-3.0-only
// OWNER: CC/EU author
/**
 * Learn-section bodies for the Common Criteria (`cc`) and EUCC & eIDAS
 * (`eucc-eidas`) paths. One named export per section id (build spec §4);
 * CertIntroduction wraps each in <LearnSection>, so only the BODY renders here.
 *
 * Sources: every fact was read on 24 September 2026 (plan r2 §0 and the
 * documents cited inline). Library-backed citations go through getStandard();
 * the six rows still pending (build spec §6.2) are cited in plain text.
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
import { getStandard } from '@/data/standardsRegistry'
import { PathScopedContent } from '@/components/PKILearning/common/LearnPathPicker'
import { ANCHOR_SCENARIO } from '../../data/anchorScenario'
import { ASSURANCE_COMPONENTS, CC_EU_AS_OF } from '../../data/ccEuData'

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

/** A source with no library row yet (build spec §6.2) — named in plain text. */
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

const DataTable = ({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: ReactNode[][]
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border">
          {head.map((h) => (
            <th key={h} scope="col" className="p-2 text-left font-medium text-muted-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border/50 align-top">
            {row.map((cell, j) => (
              <td key={j} className="p-2 text-foreground/90">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const Sources = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
    <BookOpen size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
    <p>
      <span className="font-medium">Sources (read {AS_OF_LABEL}):</span> {children}
    </p>
  </div>
)

const Section = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4" data-as-of={CC_EU_AS_OF}>
    {children}
  </div>
)

const anchorName = `${ANCHOR_SCENARIO.name} (${ANCHOR_SCENARIO.fictionalLabel})`

// ── Path B — Common Criteria ────────────────────────────────────────────────

/** Learn section `cc-model` */
export const CcModel = () => (
  <Section>
    <P>
      Common Criteria (CC) is a framework for writing down security claims about an IT product and
      having an accredited laboratory check them. The criteria are published by the Common Criteria
      Recognition Arrangement (CCRA) participants as CC:2022, and by ISO/IEC as ISO/IEC 15408:2022.
      The evaluator follows the Common Evaluation Methodology, CEM:2022 (ISO/IEC 18045:2022). A
      certification scheme — a national one such as France’s ANSSI or Singapore’s CSA, or in the EU
      the EUCC scheme — oversees the laboratory and issues the certificate. The CCRA then decides
      which certificates its member countries accept from one another.
    </P>

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
      consult the relevant national body. Schemes add their own rules: ANSSI analysed TrustWay
      Proteccio’s mechanisms against its own cryptographic guide, and EUCC uses the ECCG Agreed
      Cryptographic Mechanisms.
    </P>
    <Callout tone="warn" title="So: is ML-KEM in the certificate?">
      <p>
        Read the ST’s <Code>FCS_COP</Code> iterations and the certification report. An assurance
        level never answers that question. A product can hold a high-assurance certificate for a
        version with no post-quantum algorithm at all — TrustWay Proteccio’s ST lists none <AsOf />.
      </p>
    </Callout>

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
          'CSA (Singapore), ANSSI (France); under EUCC, commercial CBs such as TrustCB',
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
      <SourceCite id="CC-2022-CEM" label="CEM:2022" />;{' '}
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
        ['ALC_FLR', '— (none)', 'Flaw remediation is in no EAL; it can only be added'],
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
      Moderate for .4 and High for .5. EUCC builds its assurance levels on exactly this component
      (the EUCC path covers it).
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
      February 2026 (sogis.eu, read {AS_OF_LABEL}). Singapore’s report for the nShield5s HSM puts it
      plainly: its EAL4 augmented certification “is partially covered by the CCRA”.
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
        <li>who recognises it (CCRA, SOG-IS, EUCC) and at what level.</li>
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
        scheme’s site and the CC portal (and, for EUCC, on ENISA’s certification website).
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
      a fixed end date, and EUCC caps certificates at five years unless the national authority
      approves longer (CIR 2024/482 Art 12). Validity does not freeze the threat landscape — that is
      what re-assessment is for.
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
      certificates in this path’s workshop use CC 3.1 R5: the two HSMs under national schemes, and
      the EUCC certificate under EUCC’s own rule allowing CC 3.1 R5 until 31 December 2027.
    </P>

    <H3>The European picture changed in 2025–2026</H3>
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
        February 2026 (sogis.eu).
      </li>
      <li>
        EUCC certificates can carry the CCRA mark only through extra, per-certificate government
        oversight (
        <PlainSource>CCMC-011 v1.0, “CCRA and EUCC Co-existence”, 19 March 2025</PlainSource>). If
        the CCRA requirements stop being met, the EUCC certificate is not nullified; the CCRA can
        ask for the mark to be removed.
      </li>
    </ul>

    <Callout
      tone="planning"
      title="Planning implication for PQC (scheme clocks, not market deadlines)"
    >
      <p>
        Adding ML-KEM or ML-DSA to a certified product means new <Code>FCS_COP</Code>/
        <Code>FCS_CKM</Code> iterations in the ST — a change to the claimed SFRs, which CCDB-014
        lists as a typical major change. Plan it as a re-evaluation on CC:2022. If your PP is still
        CC 3.1, the 31 December 2027 limit on claiming it applies to that re-evaluation, unless an
        EUCC carve-out covers the PP (see the EUCC path).
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
      <PlainSource>CCMC-011 v1.0 (19 March 2025)</PlainSource>; sogis.eu home page.
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
        label="CCDB-014 “Assurance Continuity: CCRA Requirements” v3.1"
      />{' '}
      (29 February 2024). Schemes may add to them; EUCC restates them in its own law (see the EUCC
      path).
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
    <P>The developer proposes; the certification body decides. CCDB-014 gives typical cases:</P>
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
      A bug fix can be either, CCDB-014 notes, because its extent cannot be predicted. And a PP
      requiring exact conformance makes even an editorial change to the ST’s objectives major.
    </P>

    <H3>A real maintenance: the EN 419221-5 PP itself</H3>
    <P>
      PPs have assurance continuity too. ANSSI certified EN 419221-5 as a draft, v0.15, in December
      2016 (ANSSI-CC-PP-2016/05). When CEN published it as EN 419221-5:2018 v1.0, the changes were
      standardisation edits, editorial fixes and systematic use of “shall” instead of “must”. ANSSI
      judged them minor and issued maintenance report{' '}
      <SourceCite id="ANSSI-CC-PP-2016-05-M01" label="ANSSI-CC-PP-2016/05-M01" /> (18 May 2020) — no
      new certificate.
    </P>

    <Callout tone="warn" title="What this means for adding PQC">
      <p>
        A new ML-DSA signing service adds SFR iterations, changes interfaces and design, and needs
        new vulnerability analysis. That is the “claimed functional requirements” case — expect a
        re-evaluation, not maintenance. A market deadline does not change the classification. Only
        the impact on the assurance does.
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
        are run and how certificates are issued in the EU. The security requirements still come from
        a Security Target and, where claimed, a Protection Profile.
      </p>
    </Callout>

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
      by an Annex II Protection Profile — or, exceptionally, after notifying the national authority.
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
            Cryptography (ACM v2); product series (v1, 9 July 2025); assurance-continuity change
            scenarios (v1, 10 December 2025); vulnerability management and disclosure (v1.1, adopted
            10 January 2025)
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
        ENISA product-series methodology v1 (9 July 2025); ENISA assurance-continuity change
        scenarios v1 (10 December 2025)
      </PlainSource>
      ; ENISA certificate page EUCC-3110-2025-12-2500098-01.
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
        It contains no security functional requirements a device can conform to. Those are in
        Protection Profiles, which are CEN standards evaluated under Common Criteria.
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
            Common Criteria evaluations — under EUCC where that scheme applies.
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

    <H3>Two assessments, not one</H3>
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
    <OpenQuestion>
      Whether a newer eIDAS implementing act lists EN 419221-5 or EN 419241-2 as standards for QSCD
      certification under Article 30 was not verified for this module.
    </OpenQuestion>

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
      ; <PlainSource>EN 419241-2 PP, ANSSI-CC-PP-2018/02-M01 (library row pending)</PlainSource>.
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
      rules require the PP for that use — confirm with the certification body. The CC portal lists
      no CC:2022 revision of EN 419221-5 <AsOf />; whether CEN is preparing one was not verified.
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
        ENISA FPT_PHP interpretation for EN 419221-5, v1 (library row pending)
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
    <PathScopedContent paths={['eucc-eidas']}>
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

/** Learn section `eucc-pqc-today` */
export const EuccPqcToday = () => (
  <Section>
    <P>
      Of the four schemes in this module, EUCC has the most specific post-quantum guidance in force
      today. It sits in a guideline, not in the regulation — but it is the version ENISA marks as
      applicable, and it is addressed to developers and evaluators.
    </P>

    <Callout tone="current" title={`Applicable today (as of ${AS_OF_LABEL})`}>
      <p>
        <SourceCite id="EUCC v2.0 ACM" label="ECCG Agreed Cryptographic Mechanisms v2" /> and the
        EUCC Guidelines on Cryptography v2, both published 6 May 2025:
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
          <strong>Hybridisation of lattice schemes:</strong> “(M)LWE based cryptographic mechanisms
          shouldn’t be used in a standalone way to provide the intended security functionality, but
          should be combined with a classical cryptomechanism.” For signatures, concatenating
          signatures that must all verify is acceptable.
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
      head={['Plan', 'Fits ACM v2?', 'Why']}
      rows={[
        [
          'ML-KEM-768 or -1024 combined with ECDH (hybrid KEM)',
          'Yes',
          'Recommended parameters, hybridised',
        ],
        [
          'ML-KEM-512 standalone',
          'Not as recommended',
          'Not a recommended parameter set, and lattice schemes should not be standalone',
        ],
        ['ML-DSA-65 or -87 alongside ECDSA or RSA', 'Yes', 'Recommended parameters, hybridised'],
        [
          'SLH-DSA at security level 3 or 5, standalone',
          'Yes',
          'Hash-based: hybridisation optional',
        ],
        [
          'LMS for firmware signing',
          'Yes, with state protection',
          'Agreed; state must be protected in integrity and against replay',
        ],
      ]}
    />
    <P>
      Remember the chain: ACM tells the ST author which mechanisms to claim; the EN 419221-5 PP
      requires “approved” algorithms; and adding any of them to a certified product is a change to
      the claimed SFRs — the case CCDB-014 lists as a typical major change, which the CB classifies
      under CIR 2025/2462. The guidance says what to build, not how fast it can be certified.
    </P>

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

/** Small inline marker used by the workshop steps when a record was checked. */
export const CheckedOn = ({ date }: { date: string }) => (
  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
    <Info size={12} aria-hidden="true" /> Checked against the official record on {date}
  </span>
)
