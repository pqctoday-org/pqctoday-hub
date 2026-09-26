// SPDX-License-Identifier: GPL-3.0-only
// OWNER: CC/EU author
/**
 * Data for the Common Criteria (`cc`) and EUCC & eIDAS (`eucc-eidas`) paths:
 *  - the CC assurance-component dictionary (CC:2022 Part 3 / Part 5 names);
 *  - three real certificate records for the `cc-claim-decoder` step, embedded
 *    as a dated fixture (NOT read from compliance-data.json at runtime);
 *  - the two `eidas-trace` scenarios;
 *  - Exercises-tab items and the per-step `stepExercises` (build spec §4).
 *
 * Every fact below was read on 24 September 2026 from the document named next
 * to it (plan r2 §0; fetched through pqctoday-priv/scripts/fetch_resilient.py).
 * Items the plan marks UNVERIFIED are carried as `openQuestion` text and must
 * stay labelled as open questions in the UI.
 */
import type { StepExercise } from '@/data/stepExercises'
import type { ExerciseItem } from './types'

/** Date every fact in this file was last checked against its source. */
export const CC_EU_AS_OF = '2026-09-24'

// ── CC assurance components ─────────────────────────────────────────────────

export interface AssuranceComponent {
  /** e.g. 'AVA_VAN.5' */
  code: string
  /** component name as CC:2022 Part 3 prints it */
  name: string
  /** what the component adds, in plain English */
  plain: string
  /** where this family sits in EAL4 (CC:2022 Part 5 Table 5) — for "what did the + add?" */
  vsEal4: string
}

/**
 * Component names: CC:2022 R1 Part 3 table of contents. EAL contents and
 * attack potentials: CC:2022 R1 Part 5 Table 1/Table 5 and Part 3 §14.3.
 */
export const ASSURANCE_COMPONENTS: ReadonlyMap<string, AssuranceComponent> = new Map(
  (
    [
      {
        code: 'AVA_VAN.1',
        name: 'Vulnerability survey',
        plain:
          'The evaluator searches public sources for known vulnerabilities and tests against an attacker with Basic attack potential.',
        vsEal4: 'Lower than EAL4, which already contains AVA_VAN.3.',
      },
      {
        code: 'AVA_VAN.2',
        name: 'Vulnerability analysis',
        plain:
          'A vulnerability analysis using the design evidence, with penetration testing against Basic attack potential.',
        vsEal4: 'Lower than EAL4, which already contains AVA_VAN.3.',
      },
      {
        code: 'AVA_VAN.3',
        name: 'Focused vulnerability analysis',
        plain:
          'A focused vulnerability analysis with penetration testing against Enhanced-Basic attack potential.',
        vsEal4: 'This is the component EAL4 already contains — not an augmentation of EAL4.',
      },
      {
        code: 'AVA_VAN.4',
        name: 'Methodical vulnerability analysis',
        plain:
          'A methodical vulnerability analysis with penetration testing against Moderate attack potential.',
        vsEal4: 'Replaces EAL4’s AVA_VAN.3 with a higher component (substitution).',
      },
      {
        code: 'AVA_VAN.5',
        name: 'Advanced methodical vulnerability analysis',
        plain:
          'An advanced methodical vulnerability analysis with penetration testing against High attack potential — the top of the scale.',
        vsEal4: 'Replaces EAL4’s AVA_VAN.3 with the highest component (substitution).',
      },
      {
        code: 'ALC_DVS.2',
        name: 'Sufficiency of security controls',
        plain:
          'The developer must show that the security controls on its development environment are sufficient, not only listed.',
        vsEal4: 'Replaces EAL4’s ALC_DVS.1 (identification of security controls).',
      },
      {
        code: 'ALC_FLR.1',
        name: 'Basic flaw remediation',
        plain: 'The developer tracks and corrects reported security flaws.',
        vsEal4:
          'ALC_FLR is in no EAL — it only ever appears as an augmentation (CC:2022 Part 5, note to Table 1).',
      },
      {
        code: 'ALC_FLR.2',
        name: 'Flaw reporting procedures',
        plain:
          'As ALC_FLR.1, plus procedures for users to report flaws and for fixes to reach them.',
        vsEal4: 'ALC_FLR is in no EAL — it only ever appears as an augmentation.',
      },
      {
        code: 'ALC_FLR.3',
        name: 'Systematic flaw remediation',
        plain:
          'As ALC_FLR.2, plus a way for users to register with the developer to receive flaw reports and corrections, and named points of contact for security issues.',
        vsEal4: 'ALC_FLR is in no EAL — it only ever appears as an augmentation.',
      },
      {
        code: 'ADV_IMP.2',
        name: 'Complete mapping of the implementation representation of the TSF',
        plain:
          'The developer maps the TOE design to the entire implementation representation of the security functions, not only to a sample of it as ADV_IMP.1 allows.',
        vsEal4: 'Replaces EAL4’s ADV_IMP.1 (implementation representation of the TSF).',
      },
      {
        code: 'ALC_CMC.5',
        name: 'Advanced support',
        plain:
          'Configuration management with the most demanding controls in the family (the level EAL6 and EAL7 use).',
        vsEal4: 'Replaces EAL4’s ALC_CMC.4.',
      },
      {
        code: 'ATE_DPT.2',
        name: 'Testing: security enforcing modules',
        plain: 'Developer testing must reach down to the security-enforcing modules of the design.',
        vsEal4: 'Replaces EAL4’s ATE_DPT.1 (testing: basic design).',
      },
      {
        code: 'ASE_SPD.1',
        name: 'Security problem definition',
        plain:
          'The Security Target states the threats, organisational policies and assumptions explicitly.',
        vsEal4:
          'Already in EAL2 and above (so in EAL4); EAL1 omits it, which is why EAL1 claims add it.',
      },
    ] satisfies AssuranceComponent[]
  ).map((c) => [c.code, c])
)

/** AVA_VAN level → attack potential assumed by the evaluator (CC:2022 Part 3 §14.3). */
export const AVA_VAN_ATTACK_POTENTIAL: ReadonlyMap<number, string> = new Map([
  [1, 'Basic'],
  [2, 'Basic'],
  [3, 'Enhanced-Basic'],
  [4, 'Moderate'],
  [5, 'High'],
])

/** EUCC assurance level for an AVA_VAN level (CIR (EU) 2024/482 Art 4). */
export const euccLevelFor = (avaVan: number): 'substantial' | 'high' =>
  avaVan <= 2 ? 'substantial' : 'high'

// ── Certificate records for the claim decoder (dated fixture) ───────────────

export type ClaimVerdict = 'supported' | 'not-supported' | 'not-shown'

export const CLAIM_VERDICT_LABEL: ReadonlyMap<ClaimVerdict, string> = new Map([
  ['supported', 'Supported by the record'],
  ['not-supported', 'Contradicted by the record'],
  ['not-shown', 'Not shown — needs another document'],
])

export interface DecoderClaim {
  id: string
  /** a claim a vendor, buyer or listing might make */
  text: string
  verdict: ClaimVerdict
  /** why — names the concept */
  why: string
}

export interface CertRecordField {
  label: string
  value: string
}

export interface CertRecordFixture {
  id: 'proteccio' | 'nshield5s' | 'cisco-nexus-9000'
  /** short name for the picker */
  shortName: string
  product: string
  vendor: string
  /** the claim as a listing headline shows it */
  headline: string
  headlineSource: string
  /** base package, e.g. 'EAL4' */
  eal: string
  /** augmentation components, in the order the certificate lists them */
  components: string[]
  avaVan: number
  /** the rest of the record, as the official documents state it */
  fields: CertRecordField[]
  /** where the Hub's own dataset disagrees with the official record */
  datasetNote?: string
  claims: DecoderClaim[]
  sources: { label: string; url: string }[]
  checkedOn: string
}

/**
 * Three real records, each verified on 24 September 2026 against the official
 * certificate / certification report (URLs in `sources`). Chosen to be
 * unrankable by headline: two HSMs that both read "EAL4+", and an EUCC
 * collaborative-PP certificate whose nominal EAL is 1.
 */
export const CC_DECODER_RECORDS: readonly CertRecordFixture[] = [
  {
    id: 'proteccio',
    shortName: 'TrustWay Proteccio (HSM)',
    product: 'TrustWay Proteccio, V194/X194',
    vendor: 'BULL SAS',
    headline: 'EAL4+',
    headlineSource:
      'ANSSI certificate-list entry as carried in the Hub dataset (record anssi-cc-2025-09)',
    eal: 'EAL4',
    components: ['ADV_IMP.2', 'ALC_CMC.5', 'ALC_DVS.2', 'ALC_FLR.3', 'AVA_VAN.5'],
    avaVan: 5,
    fields: [
      { label: 'Certificate', value: 'ANSSI-CC-2025/09, signed Paris, 31 March 2025' },
      {
        label: 'TOE',
        value:
          'A network HSM: a main electronic board in a 19-inch 2U enclosure with a Gigabit Ethernet interface and physical tamper protection (report §2.1). Product type: hardware devices with security boxes.',
      },
      { label: 'Scheme / issuer', value: 'French CC scheme — ANSSI' },
      { label: 'Evaluation facilities', value: 'SERMA Safety & Security and AMOSSYS' },
      { label: 'Criteria', value: 'Common Criteria 3.1 Revision 5; CEM 3.1 Revision 5' },
      {
        label: 'Protection Profile',
        value:
          'Conformant to EN 419221-5:2018 — Protection Profiles for TSP Cryptographic modules, Part 5',
      },
      {
        label: 'Recognition',
        value:
          'SOG-IS (European recognition for hardware devices with security boxes) and CCRA — but the certificate states that under the CCRA it is recognised only at “EAL2 augmented with ALC_FLR.3”.',
      },
      { label: 'Validity', value: 'Five years from the signature date (to 31 March 2030)' },
      {
        label: 'Cryptography',
        value:
          'ANSSI analysed the mechanisms against its cryptographic guide and found non-conformities, which the evaluator’s vulnerability analysis took into account without finding an exploitable vulnerability (report §3.3). The Security Target’s algorithm list names no post-quantum mechanism.',
      },
    ],
    datasetNote:
      'The Hub dataset carries this certificate twice: the ANSSI entry reads just "EAL4+"; the CC-portal entry reads "EAL4+,ADV_IMP.2,ALC_CMC.5,ALC_DVS.2,ALC_FLR.3,AVA_VAN.5". Same certificate — only one of them tells you what was evaluated.',
    claims: [
      {
        id: 'p-eal4plus-enough',
        text: '“Certified EAL4+” is enough to describe this HSM’s assurance.',
        verdict: 'not-supported',
        why: 'The + stands for five named components. Without them a reader cannot tell AVA_VAN.5 (High attack potential) from, say, ALC_FLR.2 alone — so the bare headline under-describes the certificate.',
      },
      {
        id: 'p-ccra-eal4',
        text: 'Every CCRA member country recognises this certificate at EAL4 augmented.',
        verdict: 'not-supported',
        why: 'CCRA recognition stops at EAL2 plus ALC_FLR (or a collaborative PP). The certificate itself says that under the CCRA it is recognised at EAL2 augmented with ALC_FLR.3. The higher claim is recognised under SOG-IS for this technical domain.',
      },
      {
        id: 'p-pp',
        text: 'The HSM was evaluated as conformant to the EN 419221-5 trust-service HSM Protection Profile.',
        verdict: 'supported',
        why: 'Both the certificate and the certification report state conformance to NF EN 419221-5:2018 — the PP the eIDAS path studies.',
      },
      {
        id: 'p-pqc',
        text: 'The certified configuration includes ML-DSA signing.',
        verdict: 'not-supported',
        why: 'Algorithms live in the Security Target’s cryptographic SFRs, not in the EAL. This ST’s algorithm list has no post-quantum mechanism, so ML-DSA is outside the evaluated TSF.',
      },
      {
        id: 'p-next-firmware',
        text: 'The next firmware release is covered by this certificate.',
        verdict: 'not-shown',
        why: 'A certificate covers the named version (V194/X194) in its evaluated configuration. A later release needs assurance continuity — a maintenance report or a re-evaluation — before it can claim the certificate.',
      },
    ],
    sources: [
      {
        label: 'ANSSI certificate ANSSI-CC-2025/09 (PDF, French)',
        url: 'https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2025-09-certificat.pdf',
      },
      {
        label: 'Certification report on the CC portal (PDF, French)',
        url: 'https://www.commoncriteriaportal.org/files/epfiles/ANSSI-CC-2025_09fr.pdf',
      },
      {
        label: 'Security Target on the CC portal (PDF)',
        url: 'https://www.commoncriteriaportal.org/files/epfiles/Cible-ANSSI-CC-2025_09en.pdf',
      },
    ],
    checkedOn: CC_EU_AS_OF,
  },
  {
    id: 'nshield5s',
    shortName: 'nShield5s (HSM)',
    product: 'nShield5s Hardware Security Module v13.5.1',
    vendor: 'Entrust',
    headline: 'EAL4+',
    headlineSource: 'CC-portal product list (the "+" is how listings abbreviate "augmented")',
    eal: 'EAL4',
    components: ['ALC_FLR.2', 'AVA_VAN.5'],
    avaVan: 5,
    fields: [
      { label: 'Certificate', value: 'CSA_CC_23004 (Cyber Security Agency of Singapore)' },
      {
        label: 'TOE',
        value:
          'PCIe-board HSM in a tamper-resistant enclosure (NC5536E; NC5536N inside an nShield5c chassis), primary firmware v13.5.1, recovery firmware v13.5.0, bootloader v1.4.1, plus the evaluated-configuration guide.',
      },
      { label: 'Scheme / issuer', value: 'Singapore Common Criteria Scheme (SCCS), CSA' },
      {
        label: 'Evaluation facility',
        value: 'SGS Brightsight; evaluation completed 30 April 2024',
      },
      { label: 'Criteria', value: 'Common Criteria 3.1 Revision 5; CEM 3.1 Revision 5' },
      {
        label: 'Protection Profile',
        value:
          'The report cites EN 419221-5:2018 v1.0 (ANSSI-CC-PP-2016/05-M01) and notes that “the restrictions imposed by the PP” exclude physical and proximity side-channel attacks from the vulnerability analysis. The conformance claim itself is stated in the Security Target (not reviewed here).',
      },
      {
        label: 'Recognition',
        value:
          'CCRA — the report says the certification “is partially covered by the CCRA”, because the arrangement recognises EAL1–2 and ALC_FLR (or cPPs).',
      },
      { label: 'Validity', value: 'Valid till 23 September 2029 (five years from issuance)' },
      {
        label: 'Physical security',
        value:
          'The report lists “physical tamper resistance meeting ISO-19790 Level 3” as a TOE feature — a design statement inside a CC report, not a FIPS 140-3 certificate.',
      },
    ],
    datasetNote:
      'The CC portal’s own certified-products list (and the Hub dataset, which mirrors it) gives this certificate as "EAL4+,ALC_FLR.2,AVA_VAN.4"; the certification report says EAL4 augmented by ALC_FLR.2 and AVA_VAN.5 (both read 24 September 2026). When two official sources disagree, decode from the certification report — the evaluated result — and record the disagreement rather than silently picking one. A separate Dutch (NSCIB) certificate exists for “Entrust nShield5s v13.5.1”; this record is the Singapore one, CSA_CC_23004.',
    claims: [
      {
        id: 'n-same-as-proteccio',
        text: 'This HSM and TrustWay Proteccio have the same assurance, because both are “EAL4+” with AVA_VAN.5.',
        verdict: 'not-supported',
        why: 'Same base package and vulnerability level, different augmentations: Proteccio adds ADV_IMP.2, ALC_CMC.5, ALC_DVS.2 and ALC_FLR.3; nShield5s adds ALC_FLR.2. And each result applies to its own TOE, PP restrictions and environment.',
      },
      {
        id: 'n-fips-l3',
        text: 'Because the report mentions ISO-19790 Level 3 tamper resistance, the HSM holds a FIPS 140-3 Level 3 certificate.',
        verdict: 'not-shown',
        why: 'A CC report describing a physical-security design is not a CMVP validation. Whether a FIPS 140-3 certificate exists — and for which firmware — is answered only by the CMVP record.',
      },
      {
        id: 'n-physical-attacks',
        text: 'The AVA_VAN.5 penetration testing included physical and side-channel attacks on the board.',
        verdict: 'not-supported',
        why: 'The report says the PP’s restrictions exclude physical attacks and side-channel attacks needing physical proximity (the HSM is assumed to run in a protected environment), so the vulnerability analysis focused on design and architectural flaws. The developer’s physical hardware tests for FPT_PHP.1 and FPT_PHP.3 are functional tests, not penetration testing. Assurance is always relative to the stated environment.',
      },
      {
        id: 'n-v13-6',
        text: 'Firmware v13.6 inherits the certificate automatically.',
        verdict: 'not-supported',
        why: 'The TOE is identified down to firmware and bootloader versions. The report itself says a changed TOE’s validity must go through assurance continuity with the scheme.',
      },
    ],
    sources: [
      {
        label: 'Certification report CSA_CC_23004 on the CC portal (PDF)',
        url: 'https://www.commoncriteriaportal.org/files/epfiles/%5BCER%5D%20nShield5s%20Hardware%20Security%20Module%20Certificate%20Report.pdf',
      },
    ],
    checkedOn: CC_EU_AS_OF,
  },
  {
    id: 'cisco-nexus-9000',
    shortName: 'Cisco Nexus 9000 (EUCC, cPP)',
    product: 'Cisco Nexus 9000 Series Switches, Cisco NX-OS 10.4(5)(M)',
    vendor: 'Cisco Systems, Inc.',
    headline: 'EAL1 augmented with ALC_FLR.2 and ASE_SPD.1',
    headlineSource: 'ENISA EUCC certificate page, “Package” field',
    eal: 'EAL1',
    components: ['ALC_FLR.2', 'ASE_SPD.1'],
    avaVan: 1,
    fields: [
      {
        label: 'Certificate',
        value:
          'EUCC-3110-2025-12-2500098-01, first issued 3 December 2025. The certificate PDF gives expiry 03-12-2030; the ENISA page gives validity end 02/12/2030 — check both.',
      },
      { label: 'Scheme', value: 'EUCC — CIR (EU) 2024/482 as amended by (EU) 2024/3144' },
      { label: 'EUCC assurance level', value: 'Substantial (AVA_VAN level 1)' },
      {
        label: 'Certification body / NCCA',
        value:
          'TrustCB B.V. (a commercial CB), authorised by the Dutch Authority for Digital Infrastructure (RDI)',
      },
      { label: 'ITSEF', value: 'SGS Brightsight B.V., Delft' },
      {
        label: 'Criteria',
        value: 'CC 3.1 Revision 5 / CEM 3.1 Revision 5 (allowed under EUCC until 31 December 2027)',
      },
      {
        label: 'Protection Profile',
        value:
          'collaborative Protection Profile for Network Devices v3.0e (6 December 2023), validated under NIAP 25 April 2024',
      },
      {
        label: 'Assurance package',
        value:
          'ASE_INT.1, ASE_CCL.1, ASE_SPD.1, ASE_OBJ.1, ASE_ECD.1, ASE_REQ.1, ASE_TSS.1, ADV_FSP.1, AGD_OPE.1, AGD_PRE.1, ALC_CMC.1, ALC_CMS.1, ATE_IND.1, AVA_VAN.1 and ALC_FLR.2 — the cPP’s package, with its own evaluation activities.',
      },
    ],
    claims: [
      {
        id: 'c-weaker',
        text: 'This switch is “less secure” than the two HSMs because EAL1 is lower than EAL4.',
        verdict: 'not-shown',
        why: 'EAL numbers rank assurance packages, not products. This is a different product class evaluated against a collaborative PP whose evaluation activities define the testing. The certificate says nothing about how it compares with an HSM.',
      },
      {
        id: 'c-eucc-level',
        text: 'Under EUCC this certificate is at assurance level “substantial”.',
        verdict: 'supported',
        why: 'EUCC maps AVA_VAN 1–2 to “substantial” and AVA_VAN 3–5 to “high” (CIR 2024/482 Art 4). The certificate states Substantial with AVA_VAN.1.',
      },
      {
        id: 'c-eal-plus',
        text: 'ASE_SPD.1 is an augmentation even though every EAL4 evaluation includes it.',
        verdict: 'supported',
        why: 'Augmentation is relative to the base package. EAL1 does not contain ASE_SPD.1 (EAL2 and above do), so adding it to EAL1 is an augmentation.',
      },
      {
        id: 'c-ccra-mark',
        text: 'Being an EUCC certificate, it is automatically recognised by all CCRA members.',
        verdict: 'not-shown',
        why: 'EUCC certificates can carry the CCRA mark only through the optional per-certificate oversight described in CCMC-011. Nothing on this certificate shows that mark, so recognition outside EUCC is not established by this record.',
      },
    ],
    sources: [
      {
        label: 'ENISA EUCC certificate page',
        url: 'https://certification.enisa.europa.eu/certificates/eucc-3110-2025-12-2500098-01_en',
      },
      {
        label: 'EUCC certificate PDF (ENISA)',
        url: 'https://certification.enisa.europa.eu/document/download/d9316641-85b4-4aa1-bedc-e6c223c6cec6_en?filename=EUCC-3110-2025-12-2500098-01%20Certificate%20v2.pdf',
      },
    ],
    checkedOn: CC_EU_AS_OF,
  },
]

export const findDecoderRecord = (id: unknown): CertRecordFixture | undefined =>
  CC_DECODER_RECORDS.find((r) => r.id === id)

// ── eIDAS regulation-to-certificate trace ───────────────────────────────────

export type TraceLayerId =
  'legal' | 'service-vs-product' | 'scheme' | 'pp' | 'sota' | 'algorithms' | 'validity' | 'change'

export interface TraceOption {
  id: string
  label: string
  correct: boolean
  /** shown after the learner picks this option — names the concept */
  feedback: string
}

export interface TraceLayer {
  id: TraceLayerId
  /** short name of the layer in the chain */
  title: string
  question: string
  options: TraceOption[]
  /** the link in the chain once solved; appears in the exported trace */
  link: string
  /** library reference_ids (getStandard) backing the link */
  sourceIds: string[]
  /** sources with no library row yet — cited in plain text (build spec §6.2) */
  plainSources?: string[]
  /** UNVERIFIED items the plan says must stay open */
  openQuestion?: string
}

export interface TraceScenario {
  id: 'remote-signing' | 'local-qscd'
  title: string
  customer: string
  setup: string
  layers: TraceLayer[]
}

export const EIDAS_TRACE_SCENARIOS: readonly TraceScenario[] = [
  {
    id: 'remote-signing',
    title: 'Remote qualified signing on the Orrin N7 appliance',
    customer: 'EU qualified trust service provider',
    setup:
      'An EU qualified trust service provider (QTSP) wants to run remote qualified electronic signatures for its customers’ signatories. The signing keys will live in the fictional Orrin N7 network HSM, deployed as an appliance in the QTSP’s data centre. The vendor also plans to add ML-DSA. Trace the requirement from the regulation to the certificate the QTSP must see.',
    layers: [
      {
        id: 'legal',
        title: 'Legal obligation',
        question: 'Where does the obligation to use a certified signing device come from?',
        options: [
          {
            id: 'eidas',
            label:
              'Regulation (EU) No 910/2014 (eIDAS) as amended by Regulation (EU) 2024/1183 — Annex II requirements for QSCDs, Article 30 certification and Article 29a remote management',
            correct: true,
            feedback:
              'Right. eIDAS is the law: it defines the roles (QTSP, QSCD), the device requirements (Annex II) and the certification duty (Article 30). It does not contain security functional requirements a device can “conform” to.',
          },
          {
            id: 'eidas-is-pp',
            label: 'eIDAS 2.0 itself, which is the Protection Profile the HSM must conform to',
            correct: false,
            feedback:
              'eIDAS 2.0 is not a Protection Profile. It is a regulation. The PPs (EN 419221-5, EN 419241-2) are CEN standards certified under Common Criteria and referenced by the certification rules.',
          },
          {
            id: 'eucc-mandates',
            label: 'CIR (EU) 2024/482 (EUCC), which obliges every QTSP to use EUCC-certified HSMs',
            correct: false,
            feedback:
              'EUCC is a certification scheme under the Cybersecurity Act. It says how a certificate is obtained, not who must obtain one. The duty to use a certified QSCD comes from eIDAS.',
          },
        ],
        link: 'eIDAS (910/2014 as amended by 2024/1183): Annex II device requirements, Art 29a remote QSCD management, Art 30 certification',
        sourceIds: ['eIDAS-2-Regulation', 'EIDAS-REG-910-2014'],
      },
      {
        id: 'service-vs-product',
        title: 'Service vs product',
        question:
          'The QTSP’s remote-signing service and the HSM inside it are assessed differently. Which split is right?',
        options: [
          {
            id: 'split',
            label:
              'The service is a qualified trust service assessed for conformity (from 19 August 2027 against ETSI TS 119 431-1, per CIR 2025/1567); the device is certified as a QSCD under Article 30',
            correct: true,
            feedback:
              'Right. Two different assessments: a conformity assessment of the QTSP’s operations, and a product certification of the device. Neither substitutes for the other.',
          },
          {
            id: 'one-cert',
            label: 'One EUCC certificate on the HSM covers the QTSP’s whole service',
            correct: false,
            feedback:
              'A product certificate covers a TOE — the device in its evaluated configuration. The QTSP’s key management, signatory authentication and operations are assessed as a trust service, not by the HSM’s certificate.',
          },
          {
            id: 'fips-covers',
            label:
              'A FIPS 140-3 Level 3 certificate on the HSM satisfies both the service and the device requirement',
            correct: false,
            feedback:
              'FIPS 140-3 answers a different question (a US/Canadian cryptographic-module validation). It is neither a QSCD certification nor a trust-service conformity assessment.',
          },
        ],
        link: 'Service: qualified trust service (CIR 2025/1567 → ETSI TS 119 431-1, applies from 19 August 2027). Device: QSCD certification (eIDAS Art 30)',
        sourceIds: ['CIR-EU-2025-1567-Remote-QSCD-Management'],
      },
      {
        id: 'scheme',
        title: 'Certification scheme and level',
        question:
          'The PPs for remote QSCDs require AVA_VAN.5. Under EUCC, when is a certificate at AVA_VAN.4 or .5 possible at all?',
        options: [
          {
            id: 'annex',
            label:
              'Only where the product is covered by an Annex I technical domain or an Annex II certified PP (or, exceptionally, with NCCA notification) — and it is then assurance level “high”',
            correct: true,
            feedback:
              'Right. Article 7(3) limits AVA_VAN.4/.5 to Annex I technical domains and Annex II PPs; Article 4 maps AVA_VAN 3–5 to “high”. Annex II lists EN 419241-2 and EN 419221-5 for remote QSCDs.',
          },
          {
            id: 'any',
            label:
              'Any ITSEF can evaluate any product at AVA_VAN.5; “high” just means EAL4 or above',
            correct: false,
            feedback:
              'EUCC levels are defined by AVA_VAN, not by EAL: “substantial” is AVA_VAN 1–2 and “high” is AVA_VAN 3–5. And AVA_VAN.4/.5 is gated by Annex I/II.',
          },
          {
            id: 'substantial',
            label: '“Substantial” is enough, because substantial means AVA_VAN.5',
            correct: false,
            feedback:
              '“Substantial” corresponds to AVA_VAN level 1 or 2 only. AVA_VAN.5 is always “high”.',
          },
        ],
        link: 'EUCC (CIR 2024/482): level “high” (AVA_VAN 3–5, Art 4); AVA_VAN.5 via an Annex II PP (Art 7(3))',
        sourceIds: [
          'CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme',
          'CIR-EU-2025-2462-EUCC-Amendment',
        ],
      },
      {
        id: 'pp',
        title: 'Protection Profile',
        question: 'Which Protection Profile fits the Orrin N7 as the QTSP’s signing HSM?',
        options: [
          {
            id: 'en419221',
            label:
              'EN 419221-5 (ANSSI-CC-PP-2016/05-M01), the TSP cryptographic-module PP — with EN 419241-2 covering the server-signing QSCD it sits in',
            correct: true,
            feedback:
              'Right. EN 419221-5 is the PP for a cryptographic module used by trust service providers (EAL4 augmented with AVA_VAN.5). EN 419241-2 covers the server-signing QSCD (signature activation). Both are the Annex II PPs for remote QSCDs.',
          },
          {
            id: 'en419211',
            label: 'EN 419211 (secure signature creation device PPs), listed in Decision 2016/650',
            correct: false,
            feedback:
              'EN 419211 is for devices where the signature creation data is held in a user-managed environment — a signature card, for example. Decision 2016/650 lists it for that case, not for a QTSP-managed HSM.',
          },
          {
            id: 'secic',
            label: 'The Security IC Platform PP (BSI-CC-PP-0084-V2-2026)',
            correct: false,
            feedback:
              'The Security IC PP covers a chip platform on which other products are composed. It is the right PP for the smart-card customer, not for a network HSM.',
          },
        ],
        link: 'PP: EN 419221-5:2018 (ANSSI-CC-PP-2016/05-M01), CC 3.1 R4, EAL4 augmented with AVA_VAN.5, strict conformance; with EN 419241-2 for the server-signing QSCD',
        sourceIds: ['ANSSI-CC-PP-2016-05-EN-419221-5', 'ANSSI-CC-PP-2016-05-M01'],
        plainSources: [
          'EN 419241-2 PP — ANSSI-CC-PP-2018/02-M01 (listed in EUCC Annex II; library row pending)',
        ],
        openQuestion:
          'Whether a newer eIDAS implementing act lists EN 419221-5 or EN 419241-2 for QSCD certification — open question, check the current Official Journal.',
      },
      {
        id: 'sota',
        title: 'State-of-the-art document',
        question:
          'EUCC Annex I lists a state-of-the-art document for this PP. What does it settle for the evaluator?',
        options: [
          {
            id: 'fpt-php',
            label:
              'How the PP’s physical-protection (FPT_PHP) requirements are tested: meet the ISO/IEC 19790 Security Level 3 physical-security requirements; physical attacks by anyone other than authorised administrators are out of scope because the environment objective OE.ENV limits physical access',
            correct: true,
            feedback:
              'Right. “Hardware assessment in EN 419221-5 (HSM PP)”, version 1 (endorsed by the ECCG 11 March 2025, made final in Annex I by CIR 2025/2462) interprets FPT_PHP. The evaluator still tests — a FIPS certificate does not replace that.',
          },
          {
            id: 'algorithms',
            label: 'Which post-quantum algorithms the HSM must implement',
            correct: false,
            feedback:
              'The state-of-the-art document is about physical protection (FPT_PHP). Algorithm guidance comes from the EUCC cryptography guidelines (ACM).',
          },
          {
            id: 'fips-replaces',
            label:
              'That a FIPS 140-3 Level 3 certificate replaces the physical-security evaluation',
            correct: false,
            feedback:
              'It points the evaluator at the ISO/IEC 19790 Level 3 physical-security requirements as the test basis. It does not accept a CMVP certificate in place of the CC evaluation.',
          },
        ],
        link: 'State-of-the-art: “Hardware assessment in EN 419221-5 (HSM PP)” v1 — FPT_PHP interpretation (EUCC Annex I)',
        sourceIds: ['CIR-EU-2025-2462-EUCC-Amendment'],
        plainSources: [
          'ENISA, “Hardware assessment in EN 419221-5 (HSM PP): interpretation of the FPT_PHP requirements”, version 1, February 2025 (library row pending)',
        ],
      },
      {
        id: 'algorithms',
        title: 'Algorithms',
        question:
          'The vendor adds ML-DSA for qualified signatures. What does the applicable EUCC cryptography guidance (ACM v2) say?',
        options: [
          {
            id: 'hybrid',
            label:
              'ML-DSA is an agreed mechanism, preferably ML-DSA-87 or ML-DSA-65, and lattice-based schemes should be combined with a classical mechanism rather than used standalone',
            correct: true,
            feedback:
              'Right. ACM v2 lists ML-DSA and recommends the highest standardised parameter set (ML-DSA-87 or -65). Its Note 51 says these novel primitives “shouldn’t be used in a standalone way” — hybridise, for example by concatenating signatures that must all verify.',
          },
          {
            id: 'v3',
            label: 'ACM v3 applies, so follow its PQC list',
            correct: false,
            feedback:
              'ACM v3 is a draft (public review until end of July 2026). As of 24 September 2026 the applicable version is ACM v2 (6 May 2025).',
          },
          {
            id: 'fips-enough',
            label:
              'Any parameter set NIST approved in FIPS 204 is agreed, standalone — ML-DSA-44 is fine',
            correct: false,
            feedback:
              'ACM is the EU’s own list. It recommends ML-DSA-65/87 and hybridisation; NIST approval does not import NIST’s parameter choices into EUCC.',
          },
        ],
        link: 'Algorithms: EUCC Guidelines on Cryptography v2 / ECCG ACM v2 — ML-DSA-65/87, hybridised with a classical signature',
        sourceIds: ['EUCC v2.0 ACM'],
      },
      {
        id: 'validity',
        title: 'Validity',
        question: 'How long does the QSCD certification hold?',
        options: [
          {
            id: '5-2',
            label:
              'At most five years, provided vulnerability assessments are carried out every two years; unremedied vulnerabilities cancel it',
            correct: true,
            feedback:
              'Right — eIDAS Article 30(3a), inserted by Regulation 2024/1183. Separately, an EUCC certificate may not exceed five years (Art 12) unless the NCCA approves a derogation.',
          },
          {
            id: 'forever',
            label: 'Until the vendor stops selling the product',
            correct: false,
            feedback:
              'Certificates are time-limited. eIDAS caps QSCD certification at five years with a two-yearly vulnerability assessment.',
          },
          {
            id: '2',
            label: 'Two years, then a new evaluation from scratch',
            correct: false,
            feedback:
              'Two years is the vulnerability-assessment interval, not the validity. The certification may last up to five years if those assessments are done.',
          },
        ],
        link: 'Validity: QSCD certification ≤ 5 years with a vulnerability assessment every 2 years (eIDAS Art 30(3a)); EUCC certificate ≤ 5 years (Art 12)',
        sourceIds: [
          'eIDAS-2-Regulation',
          'CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme',
        ],
      },
      {
        id: 'change',
        title: 'Change: adding ML-DSA',
        question:
          'The certified firmware gains an ML-DSA signing service. What happens to the EUCC certificate?',
        options: [
          {
            id: 'iar-major',
            label:
              'The holder submits an impact analysis report; the CB classifies the change. Adding a signature service changes the claimed SFRs, which is typically major → re-evaluation reusing prior results, then a new certificate',
            correct: true,
            feedback:
              'Right. Under Annex IV (as amended by 2025/2462) the CB decides minor vs major. CCDB-014 lists “changes to the set of claimed functional requirements” as a typical major change. Only a minor change keeps the certificate — with a maintenance report and no new certificate.',
          },
          {
            id: 'minor-new-cert',
            label: 'It is a minor change, so the CB issues a new certificate with the new version',
            correct: false,
            feedback:
              'Backwards on both counts. CIR 2025/2462 says a confirmed minor change gets a maintenance report and “no new certificate shall be issued”; and a new cryptographic service is not typically minor.',
          },
          {
            id: 'deadline',
            label: 'A market PQC deadline lets the CB treat it as minor',
            correct: false,
            feedback:
              'Deadlines create urgency, not shortcuts. Minor vs major depends only on the change’s impact on the assurance expressed in the certificate.',
          },
        ],
        link: 'Change: IAR → CB classifies; new crypto service = SFR change → typically major → re-evaluation → new certificate (minor → maintenance report, no new certificate)',
        sourceIds: ['CIR-EU-2025-2462-EUCC-Amendment', 'CCDB-014-Assurance-Continuity-v3-1'],
        plainSources: [
          'ENISA, “Guidelines on assurance continuity — practical change scenarios for certified ICT products”, v1, 10 December 2025 (a guideline, not law; library row pending)',
        ],
      },
    ],
  },
  {
    id: 'local-qscd',
    title: 'A qualified signature card from the secure-element customer',
    customer: 'Smart-card / secure-element manufacturer',
    setup:
      'The anchor scenario’s smart-card customer builds a signature card: the signatory holds the card, and the signature creation data never leaves it. The card runs an applet on a certified security IC. Trace the chain for this user-managed device and compare it with the remote-signing case.',
    layers: [
      {
        id: 'legal',
        title: 'Legal basis for the standards',
        question: 'Which instrument lists the evaluation standards for this kind of QSCD?',
        options: [
          {
            id: 'd650',
            label:
              'Commission Implementing Decision (EU) 2016/650 — ISO/IEC 15408 (2008/2009 editions), ISO/IEC 18045:2008 and the EN 419211 PPs, for devices where the data is held in a user-managed environment',
            correct: true,
            feedback:
              'Right. Decision 2016/650 is still in force for this case. For QTSP-managed (remote) devices it only provides an interim route: a process with comparable security levels notified to the Commission.',
          },
          {
            id: 'annex2',
            label: 'EUCC Annex II, which lists EN 419221-5 for all QSCDs',
            correct: false,
            feedback:
              'Annex II lists EN 419241-2 and EN 419221-5 for remote QSCDs. A card in the signatory’s hand is the user-managed case.',
          },
          {
            id: 'nis',
            label: 'The NIS Cooperation Group PQC roadmap',
            correct: false,
            feedback:
              'The roadmap is policy guidance on PQC migration. It sets no evaluation standard for QSCDs.',
          },
        ],
        link: 'Decision (EU) 2016/650: ISO/IEC 15408/18045 + EN 419211 for QSCDs in a user-managed environment',
        sourceIds: ['CID-EU-2016-650-QSCD-Security-Assessment'],
      },
      {
        id: 'pp',
        title: 'Protection Profiles',
        question: 'Which PPs does the card stack use?',
        options: [
          {
            id: 'stack',
            label:
              'An EN 419211 PP for the signature application, composed on a chip certified to the Security IC Platform PP (BSI-CC-PP-0084-V2-2026)',
            correct: true,
            feedback:
              'Right. The card is a composite product: the chip platform has its own certificate (Security IC PP, EAL4 augmented with ALC_DVS.2, ALC_FLR.2 and AVA_VAN.5) and the signature application is evaluated on top of it.',
          },
          {
            id: 'en419221',
            label: 'EN 419221-5, because every QSCD is an HSM',
            correct: false,
            feedback:
              'EN 419221-5 targets cryptographic modules used by trust service providers. A signatory-held card is covered by EN 419211.',
          },
          {
            id: 'none',
            label: 'None — a smart card only needs a FIPS 140-3 certificate',
            correct: false,
            feedback:
              'The EU route runs through CC evaluation against the listed PPs. A CMVP validation answers a different question.',
          },
        ],
        link: 'PPs: EN 419211 (signature application) composed on the Security IC Platform PP (BSI-CC-PP-0084-V2-2026)',
        sourceIds: ['BSI-CC-PP-0084-V2-2026', 'CID-EU-2016-650-QSCD-Security-Assessment'],
      },
      {
        id: 'scheme',
        title: 'Criteria version under EUCC',
        question:
          'The EN 419211 PPs were written for CC 3.1. Can a CC:2022 evaluation under EUCC still claim them?',
        options: [
          {
            id: 'art3-4',
            label:
              'Yes — Article 3(4) of CIR 2024/482 (as amended by 2024/3144) lets a certificate claim a PP written for CC 3.1 R1–R4 where Regulation 910/2014 or Decision 2016/650 requires that PP',
            correct: true,
            feedback:
              'Right. That carve-out exists precisely for eIDAS-driven PPs. For other CC 3.1 R5 PPs the general limit is 31 December 2027.',
          },
          {
            id: 'banned',
            label: 'No — every CC 3.1 PP stopped being usable on 30 June 2024',
            correct: false,
            feedback:
              '30 June 2024 was the last start date for new CC 3.1 R5 product evaluations under the CCRA transition policy. PP claims from CC:2022 STs run to 31 December 2027, and EUCC adds the eIDAS carve-out.',
          },
          {
            id: 'wait',
            label: 'Only after CEN republishes EN 419211 for CC:2022',
            correct: false,
            feedback:
              'Not required: Article 3(4) keeps the eIDAS-required PPs usable. Whether CEN is revising them is a separate question.',
          },
        ],
        link: 'Criteria: CC:2022 certificate may claim a CC 3.1 R1–R4 PP required by 910/2014 or 2016/650 (EUCC Art 3(4))',
        sourceIds: [
          'CIR-EU-2024-3144-EUCC-Amendment',
          'CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme',
        ],
      },
      {
        id: 'sota',
        title: 'Technical domain',
        question: 'Why can this card be evaluated at AVA_VAN.5 under EUCC without an Annex II PP?',
        options: [
          {
            id: 'domain',
            label:
              'It falls in the Annex I technical domain “smart cards and similar devices”, whose state-of-the-art documents (attack potential, composite evaluation, QSCD evaluation and others) then apply',
            correct: true,
            feedback:
              'Right. Article 7(3)(a) opens AVA_VAN.4/.5 for products in an Annex I technical domain. The domain’s documents include “Security Evaluation and Certification of Qualified Electronic Signature/Seal Creation Devices”, version 1.',
          },
          {
            id: 'any',
            label: 'Because every smart card is automatically “high”',
            correct: false,
            feedback:
              'The level follows the AVA_VAN actually evaluated. The technical domain makes AVA_VAN.5 possible; it does not grant it.',
          },
        ],
        link: 'Technical domain: Annex I “smart cards and similar devices” state-of-the-art documents (incl. QSCD evaluation v1, composite evaluation)',
        sourceIds: ['CIR-EU-2025-2462-EUCC-Amendment'],
      },
      {
        id: 'algorithms',
        title: 'Algorithms',
        question:
          'The card vendor wants a standalone post-quantum signature for long-lived qualified signatures. What does ACM v2 allow?',
        options: [
          {
            id: 'hash-based',
            label:
              'Hash-based signatures (SLH-DSA at security level 3 or 5, LMS, XMSS) may be used standalone; stateful LMS/XMSS need their state protected against rollback',
            correct: true,
            feedback:
              'Right. ACM v2 Note 53 makes hybridisation optional for hash-based schemes, Note 52 agrees the SLH-DSA parameter sets at security levels 3 and 5, and Note 54 treats the LMS/XMSS state as critical data.',
          },
          {
            id: 'mldsa-standalone',
            label: 'ML-DSA-44 standalone, because it is the smallest',
            correct: false,
            feedback:
              'ACM v2 recommends ML-DSA-87 or -65 and says lattice schemes should not be used standalone.',
          },
          {
            id: 'rsa',
            label: 'RSA-4096 standalone, because larger RSA keys resist quantum attack',
            correct: false,
            feedback:
              'ACM v2 says RSA falls to Shor’s algorithm whatever its size. Where quantum resistance is required, RSA must be combined with a quantum-resistant mechanism.',
          },
        ],
        link: 'Algorithms: ACM v2 — hash-based signatures (SLH-DSA L3/L5, LMS, XMSS) may be standalone; lattice schemes hybrid',
        sourceIds: ['EUCC v2.0 ACM'],
      },
      {
        id: 'validity',
        title: 'Validity',
        question: 'Does the five-year / two-year QSCD rule apply to the card too?',
        options: [
          {
            id: 'yes',
            label: 'Yes — Article 30(3a) applies to QSCD certification, local or remote',
            correct: true,
            feedback:
              'Right. The paragraph applies to the certification referred to in Article 30(1), which covers QSCDs generally.',
          },
          {
            id: 'remote-only',
            label: 'No — it applies only to remote QSCDs',
            correct: false,
            feedback:
              'Article 30(3a) is not limited to remote devices; it caps any QSCD certification at five years with two-yearly vulnerability assessments.',
          },
        ],
        link: 'Validity: ≤ 5 years with a vulnerability assessment every 2 years (eIDAS Art 30(3a))',
        sourceIds: ['eIDAS-2-Regulation'],
      },
      {
        id: 'change',
        title: 'Change: a new chip variant with a PQC accelerator',
        question:
          'The vendor certified the card as a product series. A new chip variant adds a lattice accelerator. Can it join the series as a minor change?',
        options: [
          {
            id: 'cb-decides',
            label:
              'Only if the CB confirms the impact is minor. A new cryptographic implementation changes SFRs, design and vulnerability analysis, so expect it to be major; a product series does not make differences minor by definition',
            correct: true,
            feedback:
              'Right. CIR 2025/2462 lets a CB certify a product series, and ENISA’s product-series methodology (v1, 9 July 2025) has one certificate cover a reference TOE and declared variants — but the minor/major test still applies to anything new.',
          },
          {
            id: 'automatic',
            label: 'Yes — any member of a certified series is covered automatically',
            correct: false,
            feedback:
              'Series members must be declared and assessed. A product added later is a change to the certified TOE and goes through the impact analysis.',
          },
        ],
        link: 'Change: product series (CIR 2025/2462) + minor/major test; a new PQC implementation is expected to be major',
        sourceIds: ['CIR-EU-2025-2462-EUCC-Amendment'],
        plainSources: [
          'ENISA, “EUCC guidelines: evaluation methodology for product series”, v1, 9 July 2025 (a guideline; library row pending)',
        ],
      },
    ],
  },
]

export const findTraceScenario = (id: unknown): TraceScenario | undefined =>
  EIDAS_TRACE_SCENARIOS.find((s) => s.id === id)

// ── Exercises tab (build spec §4; 4–6 per path) ─────────────────────────────

export const exercises: ExerciseItem[] = [
  {
    id: 'cc-bare-eal4plus',
    paths: ['cc'],
    title: 'One certificate, two headlines',
    description:
      'Open the TrustWay Proteccio HSM record. A listing shows “EAL4+”. Match each of the five augmentation components to what it adds, then mark which claims the certificate supports.',
    observe:
      'Augmentation: the + stands for named components, and only the full list tells you the vulnerability-analysis depth (AVA_VAN.5, High attack potential) and the development-security and flaw-remediation extras.',
    stepId: 'cc-claim-decoder',
    config: { recordId: 'proteccio', focus: 'components' },
  },
  {
    id: 'cc-ccra-ceiling',
    paths: ['cc'],
    title: 'Where does the recognition stop?',
    description:
      'In the Proteccio record, find the recognition field and decide whether every CCRA country recognises the certificate at EAL4 augmented.',
    observe:
      'Recognition scope: the CCRA mutually recognises only up to EAL2 plus ALC_FLR (or a collaborative PP). Higher claims rely on SOG-IS or the issuing scheme.',
    stepId: 'cc-claim-decoder',
    config: { recordId: 'proteccio', focus: 'claims' },
  },
  {
    id: 'cc-dataset-vs-report',
    paths: ['cc'],
    title: 'The portal list says AVA_VAN.4',
    description:
      'Open the nShield5s record. The CC portal’s certified-products list (mirrored by the Hub dataset) gives AVA_VAN.4; decode it from the certification report instead and compare it with Proteccio.',
    observe:
      'Primary evidence: an assurance claim is read from the certification report, not from a list that re-typed it — even an official list. Two “EAL4+ AVA_VAN.5” HSMs still differ in their other components.',
    stepId: 'cc-claim-decoder',
    config: { recordId: 'nshield5s', focus: 'components' },
  },
  {
    id: 'cc-cpp-low-eal',
    paths: ['cc'],
    title: 'Why an EAL1 certificate is not “weaker”',
    description:
      'Open the Cisco Nexus 9000 EUCC record — EAL1 augmented, against the collaborative PP for network devices — and try to rank it against the two HSMs.',
    observe:
      'EALs rank assurance packages, not products: a cPP defines its own evaluation activities, and the EUCC level (substantial) is set by AVA_VAN, not by the EAL number.',
    stepId: 'cc-claim-decoder',
    config: { recordId: 'cisco-nexus-9000', focus: 'claims' },
  },
  {
    id: 'cc-pqc-not-in-headline',
    paths: ['cc'],
    title: 'Is ML-DSA in the certified configuration?',
    description:
      'In the Proteccio record, decide whether the certificate covers ML-DSA signing and what document would tell you.',
    observe:
      'Scope: algorithms are in the Security Target’s cryptographic SFRs. An assurance level says nothing about which algorithms were evaluated.',
    stepId: 'cc-claim-decoder',
    config: { recordId: 'proteccio', focus: 'claims' },
  },
  {
    id: 'eucc-remote-signing-trace',
    paths: ['eucc-eidas'],
    title: 'Trace remote qualified signing to a certificate',
    description:
      'Trace the QTSP remote-signing scenario from eIDAS to the certificate, one layer at a time, and export the chain.',
    observe:
      'Layering: law (eIDAS) → service assessment vs product certification → EUCC level → Protection Profile → state-of-the-art document → algorithms → validity → change. eIDAS is not a PP.',
    stepId: 'eidas-trace',
    config: { scenario: 'remote-signing' },
  },
  {
    id: 'eucc-local-qscd-trace',
    paths: ['eucc-eidas'],
    title: 'Same regulation, different device',
    description:
      'Trace the signature-card scenario and compare it with remote signing: which standards list and which PPs apply?',
    observe:
      'User-managed vs QTSP-managed: Decision 2016/650 (EN 419211) for the card; EUCC Annex II (EN 419221-5, EN 419241-2) for remote devices.',
    stepId: 'eidas-trace',
    config: { scenario: 'local-qscd' },
  },
  {
    id: 'eucc-minor-change-pqc',
    paths: ['eucc-eidas'],
    title: 'Does adding ML-DSA keep the certificate?',
    description:
      'Jump to the change layer of the remote-signing trace and decide what happens to the EUCC certificate when ML-DSA is added.',
    observe:
      'Assurance continuity: the CB classifies the change; a minor change gets a maintenance report and no new certificate (CIR 2025/2462); a new crypto service usually changes SFRs and is major.',
    stepId: 'eidas-trace',
    config: { scenario: 'remote-signing', layer: 'change' },
  },
  {
    id: 'eucc-acm-hybrid',
    paths: ['eucc-eidas'],
    title: 'What does ACM v2 expect of ML-DSA?',
    description:
      'Jump to the algorithms layer of the remote-signing trace and pick what the applicable EUCC cryptography guidance says.',
    observe:
      'Current vs draft: ACM v2 (6 May 2025) already lists ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS and FrodoKEM, and expects lattice schemes hybridised; ACM v3 is still a draft.',
    stepId: 'eidas-trace',
    config: { scenario: 'remote-signing', layer: 'algorithms' },
  },
  {
    id: 'eucc-not-a-pp',
    paths: ['eucc-eidas'],
    title: 'Is eIDAS 2.0 a Protection Profile?',
    description:
      'Start at the legal layer of the remote-signing trace and identify where the obligation comes from.',
    observe:
      'Category error: eIDAS is a regulation that creates the certification duty; the PPs are CEN standards certified under Common Criteria.',
    stepId: 'eidas-trace',
    config: { scenario: 'remote-signing', layer: 'legal' },
  },
]

// ── Workshop-step questions (append the SAME entries to src/data/stepExercises.ts) ──

export const stepExercises: Record<string, StepExercise> = {
  'crypto-product-certification/cc-claim-decoder': {
    prompt:
      'Two HSM listings both read “EAL4+”: TrustWay Proteccio (ADV_IMP.2, ALC_CMC.5, ALC_DVS.2, ALC_FLR.3, AVA_VAN.5) and nShield5s (ALC_FLR.2, AVA_VAN.5). What can you conclude from the shared headline?',
    options: [
      'They have identical assurance, because both are EAL4+',
      'Nothing about which components were added — the “+” only means the EAL4 package was augmented, so each list must be read',
      'Proteccio is exactly one level higher, EAL5, because it has more components',
    ],
    answer: 1,
    why: 'Augmentation adds or substitutes named components; “EAL4+” without the list does not say which. Here both reach AVA_VAN.5 but differ in development, configuration-management and flaw-remediation components, and an augmented EAL4 is not a higher EAL.',
  },
  'crypto-product-certification/eidas-trace': {
    prompt:
      'In the remote-signing trace, where does the duty to use a certified signing device come from, and where do its security requirements come from?',
    options: [
      'Both from eIDAS 2.0, which is the Protection Profile the HSM conforms to',
      'Both from EUCC, which obliges every QTSP to use certified HSMs',
      'The duty from eIDAS (910/2014 as amended by 2024/1183); the requirements from Protection Profiles such as EN 419221-5, evaluated under a CC-based scheme',
    ],
    answer: 2,
    why: 'eIDAS is law: it defines QSCDs and requires their certification. It is not a Protection Profile. The evaluable requirements are in the PPs (EN 419221-5, EN 419241-2), and EUCC is the scheme that runs the evaluation.',
  },
}
