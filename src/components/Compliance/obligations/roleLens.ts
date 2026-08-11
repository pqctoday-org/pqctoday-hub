// SPDX-License-Identifier: GPL-3.0-only
/**
 * Role lens for the register — one list, six readings.
 *
 * This is what replaces the six bespoke persona views the page used to render
 * for the same data. Role is NOT part of the scope: it changes nothing about
 * which instruments apply, only the order they are read in and the one line
 * that says why this row matters to this reader.
 *
 * **Deliberately does not reuse `applicabilityLens`'s caps.** That lens
 * downsamples for browsing panels — the executive lens caps mandatory items at
 * 8. A register may not do that: hiding an instrument the engine says binds you
 * is the one thing this page must never do. Only ordering and framing are
 * role-dependent here, and every row always survives.
 */
import type { PersonaId } from '@/data/learningPersonas'
import type { ObligationRow } from './obligationsModel'

/** What each role reads first, and the sentence that frames the list for them. */
interface RoleReading {
  framing: string
  /** Lower sorts earlier. Ties fall through to the model's own ordering. */
  rank: (row: ObligationRow) => number
  /** One line per row, or null when this role has nothing specific to add. */
  note: (row: ObligationRow) => string | null
}

const hasDate = (row: ObligationRow) => row.milestones.length > 0
const isCertificationScheme = (row: ObligationRow) =>
  row.framework.bodyType === 'certification_body'
const isTechnicalStandard = (row: ObligationRow) => row.framework.bodyType === 'technical_standard'
const expectsPqc = (row: ObligationRow) =>
  row.framework.pqcRequirement === 'yes' ||
  row.framework.pqcRequirement === 'expected' ||
  row.framework.pqcRequirement === 'partial'

const DEFAULT_READING: RoleReading = {
  framing: 'Every instrument that applies to your country and sector, strongest obligation first.',
  rank: () => 0,
  note: () => null,
}

const ROLE_READINGS: Record<PersonaId, RoleReading> = {
  executive: {
    framing: 'Dated obligations first — what binds you, and when it starts to bite.',
    // A dated mandate outranks an open-ended one: it is the thing with a
    // calendar consequence.
    rank: (row) => (hasDate(row) ? 0 : 1),
    note: (row) => {
      const first = row.milestones[0]
      if (first) return `Stated date ${first.year}${first.label ? ` — ${first.label}` : ''}`
      return row.framework.deadlineKind === 'ongoing' ? 'Binds continuously, no stated date' : null
    },
  },

  architect: {
    framing: 'Technical standards first — what you have to build against.',
    rank: (row) => (isTechnicalStandard(row) ? 0 : row.requirementCount > 0 ? 1 : 2),
    note: (row) =>
      row.requirementCount > 0
        ? `${row.requirementCount} extracted requirements from ${row.requirementSources.length} cited document${row.requirementSources.length === 1 ? '' : 's'}`
        : 'No extracted requirements — read the source directly',
  },

  developer: {
    framing: 'Certification schemes first — what your product gets validated against.',
    rank: (row) => (isCertificationScheme(row) ? 0 : expectsPqc(row) ? 1 : 2),
    note: (row) =>
      isCertificationScheme(row)
        ? 'A scheme products are validated under — check Product Records for certificates'
        : null,
  },

  ops: {
    framing: 'Nearest stated date first — what lands next.',
    // Sorts by the year itself, so the next thing due leads regardless of tier.
    rank: (row) => row.milestones[0]?.year ?? Number.MAX_SAFE_INTEGER,
    note: (row) => {
      const last = row.milestones[row.milestones.length - 1]
      if (!last) return null
      return row.milestones.length > 1 ? `Runs to ${last.year}` : null
    },
  },

  researcher: {
    framing: 'Best-evidenced first — where the documentation goes deepest.',
    rank: (row) => -row.requirementCount,
    note: (row) =>
      row.requirementSources.length > 0 ? `Sources: ${row.requirementSources.join(', ')}` : null,
  },

  curious: {
    framing: 'What actually binds an organisation like yours, and who says so.',
    // Lead with the clearest case: a named regulator with a date.
    rank: (row) => (row.tier === 'mandatory' ? 0 : 1),
    note: (row) =>
      row.tier === 'mandatory'
        ? 'A regulator in your country enforces this one'
        : row.tier === 'advisory'
          ? 'A global standard for your sector — widely adopted, not enforced on you'
          : null,
  },
}

export function readingFor(persona: PersonaId | null): RoleReading {
  return persona ? (ROLE_READINGS[persona] ?? DEFAULT_READING) : DEFAULT_READING
}

/**
 * Re-orders rows within a tier band for the reader's role.
 *
 * Stable: rows the role has no opinion about keep the order the model produced
 * (dated first, then alphabetical), so switching persona never scrambles a list
 * arbitrarily — it only lifts what that role leads with.
 */
export function applyRoleOrder(rows: ObligationRow[], persona: PersonaId | null): ObligationRow[] {
  const reading = readingFor(persona)
  return rows
    .map((row, index) => ({ row, index, rank: reading.rank(row) }))
    .sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.index - b.index))
    .map((entry) => entry.row)
}

/** The role's one-line annotation for a row, or null. */
export function roleNoteFor(row: ObligationRow, persona: PersonaId | null): string | null {
  return readingFor(persona).note(row)
}

/** The sentence that frames the whole list for this role. */
export function roleFramingFor(persona: PersonaId | null): string {
  return readingFor(persona).framing
}

/**
 * The tab this role should land on.
 *
 * Only tabs that exist today are offered. An `ops` reader wants the calendar;
 * a `developer` wants the certificates; everyone else starts at the register.
 */
export function defaultTabForPersona(persona: PersonaId | null): 'obligations' | 'progress' {
  return persona === 'ops' ? 'progress' : 'obligations'
}
