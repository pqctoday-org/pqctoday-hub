// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Canned answers that cover every block and state of the drawer's renderer. Used by the component
 * tests and, in development only, by the stand-in engine, until the real engine is connected.
 * The records here are test data, not Hub records.
 */
import {
  ASSISTANT_NOT_HELD_NOTE,
  ASSISTANT_NOT_HELD_TEXT,
  assistantGoLink,
  type AssistantAnswer,
  type AssistantDirectAnswer,
  type AssistantGroupName,
  type AssistantRow,
} from '@/services/assistant/contract'

export const grouped = (label: string) => `Grouped for ${label}: best first.`
const NO_DIRECT = 'No direct answer: resources only.'

export function makeRow(
  r: Partial<AssistantRow> & Pick<AssistantRow, 'kind' | 'tag' | 'title' | 'action' | 'group'>
): AssistantRow {
  return {
    source: null,
    status: null,
    dims: null,
    extract: '',
    paidReferenceOnly: false,
    link: `/${r.tag}`,
    goLink: assistantGoLink(r.tag),
    ...r,
  }
}

export const cnsaRow = makeRow({
  kind: 'Compliance framework',
  tag: 'CMP:CNSA-2',
  title: 'CNSA 2.0',
  source: 'NSA requirement',
  status: 'Active',
  dims: 'Industries: Government · Place: US',
  extract:
    'National security systems move to quantum-resistant algorithms on a published schedule.',
  action: 'Go to page',
  link: '/compliance',
  group: 'Data pages',
})

export const glossaryMlKem = makeRow({
  kind: 'Glossary term',
  tag: 'GL:ml-kem',
  title: 'ML-KEM',
  source: 'Hub glossary',
  extract: 'A lattice-based key-encapsulation mechanism standardised in FIPS 203.',
  action: 'Read here',
  link: '/library',
  group: 'References',
})

export const fips203Row = makeRow({
  kind: 'Library document',
  tag: 'LIB:FIPS 203',
  title: 'FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)',
  source: 'NIST standard',
  status: 'Final Standard',
  extract: 'Specifies ML-KEM, a key-encapsulation mechanism designed to resist quantum attack.',
  action: 'Read here',
  link: '/library',
  group: 'References',
})

export const paidStandardRow = makeRow({
  kind: 'Library document',
  tag: 'LIB:ISO/IEC 18033-2',
  title: 'ISO/IEC 18033-2: Encryption algorithms, asymmetric ciphers',
  source: 'ISO standard',
  paidReferenceOnly: true,
  action: 'Open reference',
  link: 'https://www.iso.org/standard/37971.html',
  group: 'References',
})

export const tlsSimulatorRow = makeRow({
  kind: 'Playground tool',
  tag: 'PT-033',
  title: 'TLS simulator',
  source: 'Hub curriculum',
  extract: 'Runs a handshake and shows the trace, so you can see which key exchange group is used.',
  action: 'Try it here',
  link: '/playground',
  group: 'Tools',
})

export const tlsModuleRow = makeRow({
  kind: 'Module',
  tag: 'LM-008',
  title: 'TLS Basics',
  dims: 'Stage: Practitioner',
  extract: 'How a TLS handshake works and where post-quantum key exchange fits in.',
  action: 'Go to module',
  link: '/learn/tls-basics',
  group: 'Learn',
})

export const tlsSectionRow = makeRow({
  kind: 'Section',
  tag: 'LM-008/s:hybrid',
  title: 'PQC in TLS & Hybrid Modes',
  dims: 'Stage: Practitioner',
  extract: 'Section 4 of 4 in TLS Basics.',
  action: 'Go to section',
  link: '/learn/tls-basics',
  group: 'Learn',
})

export const doraRow = makeRow({
  kind: 'Compliance framework',
  tag: 'CMP:DORA',
  title: 'DORA',
  source: 'EU regulation',
  status: 'Active',
  dims: 'Industries: Finance & Insurance · Place: EU',
  extract: 'Digital operational resilience rules for financial entities in the EU.',
  action: 'Go to page',
  link: '/compliance',
  group: 'Data pages',
})

export const assessRow = makeRow({
  kind: 'Assessment',
  tag: 'TOOL:assess',
  title: 'Assessment',
  extract: 'A guided assessment of where an organisation stands.',
  action: 'Go to page',
  link: '/assess',
  group: 'Tools',
})

const group = (name: AssistantGroupName, rows: AssistantRow[], more: AssistantRow[] = []) => ({
  name,
  rows,
  more,
})

const base = (question: string) => ({
  question,
  persona: null,
  answerText: 'Here is what the Hub holds on this.',
})

export const directAnswerCnsa: AssistantDirectAnswer = {
  ...base('When is the CNSA 2.0 deadline?'),
  state: 'direct',
  intent: 'fact',
  intentLabel: 'a fact, a date or a rule',
  answerText:
    'CNSA 2.0 sets 2030 for software and firmware signing and 2033 for most other systems.',
  note: grouped('a fact, a date or a rule'),
  direct: {
    value: '2030 for software and firmware signing; 2033 for most other systems',
    field: 'deadline',
    tag: 'CMP:CNSA-2',
    goLink: assistantGoLink('CMP:CNSA-2'),
    evidence: {
      kind: 'Compliance framework',
      title: 'CNSA 2.0',
      tag: 'CMP:CNSA-2',
      revision: 'Data file compliance_11182026_r3',
      line: 'Evidence: Compliance framework: CNSA 2.0 (CMP:CNSA-2). Data file compliance_11182026_r3. Checked against the record.',
    },
  },
  source: {
    label: 'Answer drawn from',
    kind: 'Compliance framework',
    title: 'CNSA 2.0',
    tag: 'CMP:CNSA-2',
    goLink: assistantGoLink('CMP:CNSA-2'),
  },
  groups: [
    group('Data pages', [cnsaRow]),
    group('References', [fips203Row]),
    group('Learn', [tlsModuleRow]),
  ],
}

export const conceptMlKem: AssistantAnswer = {
  ...base('What is ML-KEM?'),
  state: 'resources',
  intent: 'concept',
  intentLabel: 'a concept',
  note: `${grouped('a concept')} ${NO_DIRECT}`,
  notHeld: false,
  source: {
    label: 'Closest source',
    kind: 'Glossary term',
    title: 'ML-KEM',
    tag: 'GL:ml-kem',
    goLink: assistantGoLink('GL:ml-kem'),
  },
  groups: [
    group(
      'References',
      [glossaryMlKem, fips203Row, paidStandardRow],
      [
        makeRow({
          kind: 'Library document',
          tag: 'LIB:RFC 9629',
          title: 'RFC 9629: Using Key Encapsulation Mechanism (KEM) Algorithms in CMS',
          source: 'IETF',
          status: 'RFC',
          extract: 'Defines how KEM algorithms are used in the Cryptographic Message Syntax.',
          action: 'Read here',
          link: '/library',
          group: 'References',
        }),
      ]
    ),
    group('Learn', [tlsModuleRow, tlsSectionRow]),
    group('Tools', [tlsSimulatorRow]),
  ],
}

export const nameCardMlKem: AssistantAnswer = {
  ...base('ML-KEM'),
  state: 'name',
  intent: 'name',
  intentLabel: 'a name',
  answerText: 'One Hub record matches that name.',
  note: 'Matched by name: one Hub record, shown above. Related resources follow, best first.',
  nameCard: {
    kind: 'Algorithm',
    title: 'ML-KEM (FIPS 203)',
    tag: 'ALG:ML-KEM',
    link: '/algorithms',
    goLink: assistantGoLink('ALG:ML-KEM'),
    extract: 'A lattice-based key-encapsulation mechanism.',
    taughtIn: [
      {
        title: 'TLS Basics › PQC in TLS & Hybrid Modes',
        tag: 'LM-008/s:hybrid',
        goLink: assistantGoLink('LM-008/s:hybrid'),
      },
    ],
    tryIn: [{ title: 'TLS simulator', tag: 'PT-033', goLink: assistantGoLink('PT-033') }],
  },
  groups: [group('References', [glossaryMlKem, fips203Row]), group('Tools', [tlsSimulatorRow])],
}

export const nameChoices: AssistantAnswer = {
  ...base('ML-DSA'),
  state: 'choices',
  intent: 'name',
  intentLabel: 'a name',
  answerText: 'More than one Hub record matches that name. Which do you mean?',
  note: 'Matched by name: several Hub records. Pick one.',
  choices: [
    {
      kind: 'Algorithm',
      title: 'ML-DSA (FIPS 204)',
      tag: 'ALG:ML-DSA',
      goLink: assistantGoLink('ALG:ML-DSA'),
    },
    {
      kind: 'Glossary term',
      title: 'ML-DSA',
      tag: 'GL:ml-dsa',
      goLink: assistantGoLink('GL:ml-dsa'),
    },
  ],
  groups: [],
}

export const banksEu: AssistantAnswer = {
  ...base('Which deadlines apply to banks in the EU?'),
  state: 'resources',
  intent: 'dates',
  intentLabel: 'a fact, a date or a rule',
  note: `${grouped('a fact, a date or a rule')} ${NO_DIRECT}`,
  notHeld: false,
  source: {
    label: 'Closest source',
    kind: 'Compliance framework',
    title: 'DORA',
    tag: 'CMP:DORA',
    goLink: assistantGoLink('CMP:DORA'),
  },
  groups: [group('Data pages', [doraRow, cnsaRow])],
}

export const notAFact: AssistantAnswer = {
  ...base('Will ML-KEM be broken by 2030?'),
  state: 'not-a-fact',
  intent: 'not_fact',
  intentLabel: 'a prediction',
  note: 'The Hub does not state this as a fact and gives no personal advice or prediction. These are the closest resources.',
  groups: [group('Learn', [tlsModuleRow]), group('References', [glossaryMlKem])],
}

export const broadMatch: AssistantAnswer = {
  ...base('Tell me something'),
  state: 'broad',
  intent: 'broad',
  intentLabel: 'a broad question',
  note: 'Broad match: the Hub has no direct answer to this. These are the closest resources.',
  groups: [group('Learn', [tlsModuleRow])],
}

export const planBank: AssistantAnswer = {
  ...base('How should a bank start its PQC migration?'),
  state: 'resources',
  intent: 'planning',
  intentLabel: 'planning',
  note: `${grouped('planning')} ${NO_DIRECT}`,
  notHeld: true,
  source: {
    label: 'Closest source',
    kind: 'Assessment',
    title: 'Assessment',
    tag: 'TOOL:assess',
    goLink: assistantGoLink('TOOL:assess'),
  },
  groups: [group('Tools', [assessRow]), group('Learn', [tlsModuleRow])],
}

/** An answer that tries to carry fields a reader must never see. */
export const withPrivateFields = {
  ...directAnswerCnsa,
  writer: 'PRIVATE-WRITER',
  reviewer: 'PRIVATE-REVIEWER',
  groups: [
    {
      name: 'Data pages' as const,
      rows: [{ ...cnsaRow, writer: 'PRIVATE-WRITER', niceCode: 'NICE-SECRET' }],
      more: [],
    },
  ],
} as unknown as AssistantAnswer

/** A direct answer whose evidence is missing: it must not render as a direct answer. */
export const directWithoutEvidence: AssistantAnswer = {
  ...directAnswerCnsa,
  direct: {
    ...directAnswerCnsa.direct,
    evidence: { ...directAnswerCnsa.direct.evidence, revision: '', line: '' },
  },
}

export const notHeld: AssistantAnswer = {
  state: 'not-held',
  question: 'What is the airspeed of a swallow?',
  intent: 'broad',
  persona: null,
  answerText: ASSISTANT_NOT_HELD_TEXT,
  note: ASSISTANT_NOT_HELD_NOTE,
  groups: [],
}

export const dataNotLoaded = (question: string): AssistantAnswer => ({
  state: 'data-not-loaded',
  question,
  message: 'The Hub could not load the data for this answer.',
  kept: 'Your question is kept in the box below. Nothing was lost. Try again, or keep browsing the Hub.',
})

/** Every answer by the question that fetches it, in the stand-in engine. */
export const CANNED: Record<string, AssistantAnswer> = {
  'when is the cnsa 2.0 deadline?': directAnswerCnsa,
  'what is ml-kem?': conceptMlKem,
  'ml-kem': nameCardMlKem,
  'ml-dsa': nameChoices,
  'which deadlines apply to banks in the eu?': banksEu,
  'will ml-kem be broken by 2030?': notAFact,
  'tell me something': broadMatch,
  'how should a bank start its pqc migration?': planBank,
}
