// SPDX-License-Identifier: AGPL-3.0-only
/**
 * How the resources of one answer are grouped into tabs, and how the stepper moves through them.
 * Pure: no React, no state. The tab of a resource comes from its tag prefix first, then from its
 * kind chip; whatever is left goes to "More". The tab order is the same for every learner.
 */
import {
  AlertTriangle,
  AppWindow,
  ArrowRightLeft,
  BadgeCheck,
  BookOpen,
  BookOpenText,
  FileClock,
  Globe,
  GraduationCap,
  MoreHorizontal,
  ScrollText,
  Shield,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { RAIL_ICON_MAP } from '@/components/Layout/railNav'
import type { AssistantRow } from '@/services/assistant/contract'
import {
  nameCardAsRow,
  prepareAnswer,
  type PreparedAnswer,
  type RenderableAnswer,
} from './answerRules'
import { COPY } from './copy'

export type ResourceTabKey =
  | 'top'
  | 'learn'
  | 'timeline'
  | 'threats'
  | 'algorithms'
  | 'products'
  | 'compliance'
  | 'certifications'
  | 'tools'
  | 'library'
  | 'leaders'
  | 'patents'
  | 'pages'
  | 'releases'
  | 'glossary'
  | 'more'

/** The Hub's left menu order, then what the menu does not hold. "Top 5" always comes first. */
export const TAB_ORDER: readonly ResourceTabKey[] = [
  'top',
  'learn',
  'timeline',
  'threats',
  'algorithms',
  'products',
  'compliance',
  'certifications',
  'tools',
  'library',
  'leaders',
  'patents',
  'pages',
  'releases',
  'glossary',
  'more',
]

/** How many resources "Top 5" holds. */
export const TOP_COUNT = 5

interface TabDefinition {
  label: string
  icon: LucideIcon
  /** Tag prefixes, matched first. */
  prefixes: readonly string[]
  /** Kind chips (lower case), matched when no prefix fits. */
  kinds: readonly string[]
}

const railIcon = (path: string, fallback: LucideIcon): LucideIcon => RAIL_ICON_MAP[path] ?? fallback

export const TAB_DEFINITIONS: Record<ResourceTabKey, TabDefinition> = {
  top: { label: COPY.topFive, icon: Star, prefixes: [], kinds: [] },
  learn: {
    label: 'Learn',
    icon: railIcon('/learn', GraduationCap),
    prefixes: ['LM-', 'LM:', 'QZ:', 'QC:', 'PATH:', 'STG:', 'TRK:'],
    kinds: [
      'module',
      'section',
      'module section',
      'workshop step',
      'quiz question',
      'quiz category',
      'role path',
      'industry path',
    ],
  },
  timeline: {
    label: 'Timeline',
    icon: railIcon('/timeline', Globe),
    prefixes: ['TL:', 'country:'],
    kinds: ['timeline event', 'jurisdiction'],
  },
  threats: {
    label: 'Threats',
    icon: railIcon('/threats', AlertTriangle),
    prefixes: ['THR:'],
    kinds: ['threat'],
  },
  algorithms: {
    label: 'Algorithms',
    icon: railIcon('/algorithms', Shield),
    prefixes: ['ALG:', 'transition:', 'implattack:', 'protocol:'],
    kinds: ['algorithm', 'algorithm transition', 'implementation attack', 'protocol'],
  },
  products: {
    label: 'Products',
    icon: railIcon('/migrate', ArrowRightLeft),
    prefixes: ['PRD:', 'VND-'],
    kinds: ['product', 'vendor'],
  },
  compliance: {
    label: 'Compliance',
    icon: railIcon('/compliance', ShieldCheck),
    prefixes: ['CMP:'],
    kinds: ['compliance framework'],
  },
  certifications: {
    label: 'Certifications',
    icon: BadgeCheck,
    prefixes: ['CERT:'],
    kinds: ['certification'],
  },
  tools: {
    label: 'Tools',
    icon: railIcon('/business/tools', Wrench),
    prefixes: ['TOOL:', 'BT:', 'PT-', 'PL:', 'PG:', 'toolitem:', 'assessment:', 'CHK:'],
    kinds: [
      'playground tool',
      'playground lesson',
      'playground',
      'tool',
      'business tool',
      'business tool guide',
      'assessment',
      'report',
      'checklist item',
      'sandbox scenario',
    ],
  },
  library: {
    label: 'Library',
    icon: railIcon('/library', BookOpen),
    prefixes: ['LIB:', 'industrystandard:'],
    kinds: ['library document', 'industry standard'],
  },
  leaders: {
    label: 'Community',
    icon: railIcon('/leaders', Users),
    prefixes: ['LDR:'],
    kinds: ['leader'],
  },
  patents: {
    label: 'Patents',
    icon: railIcon('/patents', ScrollText),
    prefixes: ['PAT:'],
    kinds: ['patent'],
  },
  pages: {
    label: 'Site pages',
    icon: AppWindow,
    prefixes: ['PAGE:'],
    kinds: ['site page', 'page'],
  },
  releases: {
    label: 'Release notes',
    icon: FileClock,
    prefixes: ['CHG:'],
    kinds: ['release note', 'changelog release'],
  },
  glossary: {
    label: 'Glossary',
    icon: BookOpenText,
    prefixes: ['GL:'],
    kinds: ['glossary term'],
  },
  more: { label: 'More', icon: MoreHorizontal, prefixes: [], kinds: [] },
}

/**
 * Tag prefixes that are meant to stay in "More". A test over the Hub's records fails when a record
 * lands in "More" and its prefix is not listed here, so a new kind of record is noticed.
 */
export const MORE_TAG_PREFIXES: readonly string[] = [
  'SRC:',
  'KAT:',
  'IL:',
  'mission:',
  'roleboard:',
  'industry:',
  'sector:',
  'workrole:',
  'NICE:',
  'persona:',
  'requirement:',
]

/** The tab of a resource: the tag prefix wins over the kind. */
export function tabOf(row: Pick<AssistantRow, 'tag' | 'kind'>): ResourceTabKey {
  const tag = row.tag ?? ''
  for (const key of TAB_ORDER) {
    if (TAB_DEFINITIONS[key].prefixes.some((p) => tag.startsWith(p))) return key
  }
  const kind = (row.kind ?? '').trim().toLowerCase()
  for (const key of TAB_ORDER) {
    if (TAB_DEFINITIONS[key].kinds.includes(kind)) return key
  }
  return 'more'
}

// ── Rows to leave out ─────────────────────────────────────────────────────────

const STRUCTURAL_PREFIX = /\bIndex: \d+ List: \w+\s*/
const STEP_NAME = /\bstep_\d+_\w+/

/** Internal labels that leaked into a record's text are not shown: a row is cleaned or left out. */
function cleanRow(row: AssistantRow): AssistantRow | null {
  const isKat = row.tag.startsWith('KAT:') || row.kind.trim().toLowerCase() === 'known-answer test'
  if (isKat && (STEP_NAME.test(row.title) || STEP_NAME.test(row.extract))) return null
  if (STRUCTURAL_PREFIX.test(row.extract)) {
    const extract = row.extract.replace(STRUCTURAL_PREFIX, '').trim()
    if (!extract) return null
    return { ...row, extract }
  }
  return row
}

// ── Building the tabs ─────────────────────────────────────────────────────────

export interface ResourceTab {
  key: ResourceTabKey
  label: string
  icon: LucideIcon
  rows: AssistantRow[]
}

export interface ResourceTabs {
  /** Tabs in `TAB_ORDER`, "Top 5" first; only tabs that hold a resource. */
  tabs: ResourceTab[]
  /** Resources shown, once left-out rows and repeats are removed. */
  total: number
  /** Position of each resource in the engine's order, from 1, by tag. */
  rankOf: Record<string, number>
}

const EMPTY: ResourceTabs = { tabs: [], total: 0, rankOf: {} }

/**
 * The order of the card: the rows of the first group (the kind of resource the question asks for),
 * then the best row of every other group, in the engine's group order, then those groups' other
 * rows by turns; the groups' `more` rows follow by turns. The answer stays together at the top, and
 * the best resource of each other kind is seen next, whatever group it sits in.
 *
 * A group marked `late` waits: its best row is not a strong match for the question, so its rows come
 * after the rows of the other groups.
 */
function rankedRows(answer: RenderableAnswer, p: PreparedAnswer): AssistantRow[] {
  const groups = answer.groups ?? []
  const byTurns = (lists: AssistantRow[][]): AssistantRow[] => {
    const out: AssistantRow[] = []
    const longest = Math.max(0, ...lists.map((l) => l.length))
    for (let i = 0; i < longest; i++) for (const l of lists) if (i < l.length) out.push(l[i])
    return out
  }
  const shown = groups.filter((g) => (g.rows ?? []).length > 0)
  let onTime = shown.filter((g) => !g.late).map((g) => g.rows)
  let late = shown.filter((g) => g.late).map((g) => g.rows)
  if (onTime.length === 0) [onTime, late] = [late, []]
  const [first = [], ...others] = onTime
  const ranked = [
    ...first,
    ...others.map((l) => l[0]),
    ...byTurns(others.map((l) => l.slice(1))),
    ...byTurns(late),
    ...byTurns(groups.map((g) => g.more ?? [])),
  ]
  return p.nameCard ? [nameCardAsRow(p.nameCard), ...ranked] : ranked
}

export function buildResourceTabs(answer: RenderableAnswer): ResourceTabs {
  const p = prepareAnswer(answer)
  if (p.state === 'not-held' || p.held) return EMPTY

  const seen = new Set<string>()
  const rank: AssistantRow[] = []
  let dropped = 0
  for (const raw of rankedRows(answer, p)) {
    if (seen.has(raw.tag)) continue
    seen.add(raw.tag)
    const row = cleanRow(raw)
    if (!row) {
      dropped += 1
      continue
    }
    rank.push(row)
  }
  if (dropped > 0 && import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    console.warn(`Assistant: left out ${dropped} resource(s) with internal labels`)
  }
  if (rank.length === 0) return EMPTY

  const rankOf: Record<string, number> = {}
  rank.forEach((r, i) => {
    rankOf[r.tag] = i + 1
  })

  const byTab = new Map<ResourceTabKey, AssistantRow[]>()
  for (const row of rank) {
    const key = tabOf(row)
    byTab.set(key, [...(byTab.get(key) ?? []), row])
  }
  const make = (key: ResourceTabKey, rows: AssistantRow[]): ResourceTab => ({
    key,
    label: TAB_DEFINITIONS[key].label,
    icon: TAB_DEFINITIONS[key].icon,
    rows,
  })
  const tabs: ResourceTab[] = []
  // "Top 5" shows when there are two or more resources; with one, that resource's own type shows.
  if (rank.length >= 2) tabs.push(make('top', rank.slice(0, TOP_COUNT)))
  for (const key of TAB_ORDER) {
    if (key === 'top') continue
    const rows = byTab.get(key)
    if (rows?.length) tabs.push(make(key, rows))
  }
  return { tabs, total: rank.length, rankOf }
}

// ── Moving through the tabs ───────────────────────────────────────────────────

export interface CardNav {
  tab: ResourceTabKey
  index: number
}

export const START_NAV: CardNav = { tab: 'top', index: 0 }

/** A position that exists in these tabs: an unknown tab or an index out of range falls back. */
export function settleNav(tabs: readonly ResourceTab[], nav: CardNav | undefined): CardNav {
  const first = tabs[0]
  if (!first) return START_NAV
  const tab = tabs.find((t) => t.key === nav?.tab) ?? first
  const index = Math.min(
    Math.max(nav && tab.key === nav.tab ? nav.index : 0, 0),
    tab.rows.length - 1
  )
  return { tab: tab.key, index }
}

export interface Step {
  nav: CardNav
  /** The tab entered, when the step crosses into another type. */
  crosses: ResourceTab | null
}

/** The next or the previous resource, crossing into the neighbouring tab at either end; null at the very end. */
export function stepFrom(
  tabs: readonly ResourceTab[],
  nav: CardNav,
  direction: 1 | -1
): Step | null {
  const at = tabs.findIndex((t) => t.key === nav.tab)
  if (at < 0) return null
  const here = tabs[at]
  const next = nav.index + direction
  if (next >= 0 && next < here.rows.length)
    return { nav: { tab: here.key, index: next }, crosses: null }
  const other = tabs[at + direction]
  if (!other) return null
  return {
    nav: { tab: other.key, index: direction === 1 ? 0 : other.rows.length - 1 },
    crosses: other,
  }
}
