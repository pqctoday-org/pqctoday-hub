// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The single record-type table (UX grammar v2.1, section 2.10, I1). For each of the 46
 * `record.type` values in knowledge-core.json it holds the grammar group, the Assistant tab
 * (`tab`, a TAB_ORDER key), where the record really opens (`route`, from `record.link`: owner
 * decision D9 keeps today's landings), the icon (the rail icon where a rail path exists), the
 * default row component and the label dictionary (D6).
 *
 * Pure: no React state. `recordTypes.test.ts` fails when a type in the knowledge file is not in
 * this table, or when a type is in `more` without being on the owner allow-list.
 *
 * `tab` follows the 4.228.0 decisions and the intended I2 moves (guidance and framework to
 * Compliance, algorithm to Algorithms); it is not yet read by the Assistant (that is WP3).
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
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { RAIL_ICON_MAP } from '@/components/Layout/railNav'
import { TAB_ORDER, type ResourceTabKey } from '@/components/Assistant/resourceTabs'

export { TAB_ORDER }
export type { ResourceTabKey }

export type RecordGroup =
  | 'learning'
  | 'timeline'
  | 'threats'
  | 'cryptography'
  | 'migration'
  | 'governance'
  | 'tools'
  | 'reference'
  | 'community'
  | 'navigation'
  | 'taxonomy'

/** The owner's allow-list of types that stay in "More" (26 Nov, answer 9). */
export const MORE_ALLOWED_TYPES = [
  'source',
  'kat',
  'usecase',
  'mission',
  'roleboard',
  'industry',
  'sector',
  'workrole',
  'nicearea',
  'persona',
  'requirement',
] as const

const ICONS = {
  GraduationCap,
  Globe,
  AlertTriangle,
  Shield,
  ArrowRightLeft,
  ShieldCheck,
  BadgeCheck,
  Wrench,
  BookOpen,
  Users,
  ScrollText,
  AppWindow,
  FileClock,
  BookOpenText,
  MoreHorizontal,
} satisfies Record<string, LucideIcon>

type IconName = keyof typeof ICONS

/** The rail path whose icon a tab borrows (the left menu's own icon map). */
const TAB_RAIL_PATH: Partial<Record<ResourceTabKey, string>> = {
  learn: '/learn',
  timeline: '/timeline',
  threats: '/threats',
  algorithms: '/algorithms',
  products: '/migrate',
  compliance: '/compliance',
  tools: '/business/tools',
  library: '/library',
  leaders: '/leaders',
  patents: '/patents',
}

export interface RecordTypeInfo {
  type: string
  group: RecordGroup
  /** The Assistant tab (TAB_ORDER key) a record of this type belongs to. */
  tab: ResourceTabKey
  /** Where a record of this type opens today (D9). `<module>` and `<tool>` stand for a slug. */
  route: string
  /** Every route records of this type open on; the first is `route`. */
  routes: readonly string[]
  icon: LucideIcon
  /** The default row component's name (Storybook Blue shared component). */
  component: string
  /** True when the type is on the owner's `more` allow-list. */
  onMoreAllowList: boolean
}

function rt(
  type: string,
  group: RecordGroup,
  tab: ResourceTabKey,
  routes: readonly string[],
  component: string,
  icon: IconName
): RecordTypeInfo {
  const railPath = TAB_RAIL_PATH[tab]
  return {
    type,
    group,
    tab,
    route: routes[0],
    routes,
    icon: (railPath && RAIL_ICON_MAP[railPath]) || ICONS[icon],
    component,
    onMoreAllowList: (MORE_ALLOWED_TYPES as readonly string[]).includes(type),
  }
}

/** All 46 `record.type` values. */
export const recordTypes = {
  patent: rt('patent', 'reference', 'patents', ['/patents'], 'PatentRow', 'ScrollText'),
  question: rt(
    'question',
    'learning',
    'learn',
    ['/learn/quiz'],
    'QuizQuestionRow',
    'GraduationCap'
  ),
  document: rt('document', 'reference', 'library', ['/library'], 'DocumentRow', 'BookOpen'),
  source: rt('source', 'reference', 'more', ['/library'], 'SourceRow', 'MoreHorizontal'),
  product: rt('product', 'migration', 'products', ['/migrate'], 'ProductCard', 'ArrowRightLeft'),
  standard: rt('standard', 'reference', 'library', ['/library'], 'StandardCard', 'BookOpen'),
  term: rt('term', 'reference', 'glossary', ['/learn'], 'GlossaryBlock', 'BookOpenText'),
  certification: rt(
    'certification',
    'governance',
    'certifications',
    ['/compliance'],
    'CertificationRow',
    'BadgeCheck'
  ),
  vendor: rt('vendor', 'migration', 'products', ['/migrate'], 'VendorCard', 'ArrowRightLeft'),
  section: rt('section', 'learning', 'learn', ['/learn/<module>'], 'SectionRow', 'GraduationCap'),
  release: rt('release', 'navigation', 'releases', ['/changelog'], 'ReleaseNoteRow', 'FileClock'),
  person: rt('person', 'community', 'leaders', ['/leaders'], 'PersonCard', 'Users'),
  step: rt('step', 'learning', 'learn', ['/learn/<module>'], 'StepRow', 'GraduationCap'),
  event: rt('event', 'timeline', 'timeline', ['/timeline'], 'TimelineEventRow', 'Globe'),
  guidance: rt(
    'guidance',
    'governance',
    'compliance',
    ['/compliance', '/library'],
    'GuidanceRow',
    'ShieldCheck'
  ),
  threat: rt('threat', 'threats', 'threats', ['/threats'], 'ThreatRow', 'AlertTriangle'),
  kat: rt('kat', 'tools', 'more', ['/learn/<module>', '/playground'], 'KatRow', 'MoreHorizontal'),
  industrystandard: rt(
    'industrystandard',
    'reference',
    'library',
    ['/algorithms'],
    'StandardRow',
    'BookOpen'
  ),
  algorithm: rt(
    'algorithm',
    'cryptography',
    'algorithms',
    ['/algorithms', '/library'],
    'AlgorithmCard',
    'Shield'
  ),
  usecase: rt('usecase', 'migration', 'more', ['/algorithms'], 'UseCaseRow', 'MoreHorizontal'),
  implattack: rt(
    'implattack',
    'cryptography',
    'algorithms',
    ['/algorithms'],
    'AttackProfileRow',
    'Shield'
  ),
  assessment: rt('assessment', 'tools', 'tools', ['/assess'], 'AssessmentRow', 'Wrench'),
  tool: rt(
    'tool',
    'tools',
    'tools',
    ['/playground/<tool>', '/business/tools/<tool>', '/assess', '/business'],
    'ToolCard',
    'Wrench'
  ),
  transition: rt(
    'transition',
    'cryptography',
    'algorithms',
    ['/algorithms'],
    'TransitionRow',
    'Shield'
  ),
  module: rt(
    'module',
    'learning',
    'learn',
    ['/learn/<module>', '/learn/quiz'],
    'ModuleCard',
    'GraduationCap'
  ),
  quizcategory: rt(
    'quizcategory',
    'learning',
    'learn',
    ['/learn/quiz'],
    'QuizCategoryRow',
    'GraduationCap'
  ),
  country: rt('country', 'timeline', 'timeline', ['/compliance'], 'CountryCard', 'Globe'),
  lesson: rt('lesson', 'learning', 'tools', ['/playground'], 'LessonCard', 'GraduationCap'),
  framework: rt(
    'framework',
    'governance',
    'compliance',
    ['/compliance', '/library'],
    'ComplianceCard',
    'ShieldCheck'
  ),
  mission: rt('mission', 'learning', 'more', ['/simulation'], 'MissionRow', 'MoreHorizontal'),
  roleboard: rt('roleboard', 'navigation', 'more', ['/'], 'RoleBoardRow', 'MoreHorizontal'),
  toolitem: rt('toolitem', 'tools', 'tools', ['/business'], 'ToolItemRow', 'Wrench'),
  path: rt('path', 'learning', 'learn', ['/learn', '/learn/<module>'], 'PathCard', 'GraduationCap'),
  protocol: rt('protocol', 'cryptography', 'algorithms', ['/algorithms'], 'ProtocolRow', 'Shield'),
  industry: rt('industry', 'taxonomy', 'more', ['/algorithms'], 'TaxonomyChip', 'MoreHorizontal'),
  algorithmfamily: rt(
    'algorithmfamily',
    'cryptography',
    'algorithms',
    ['/algorithms'],
    'AlgorithmFamilyCard',
    'Shield'
  ),
  sector: rt('sector', 'taxonomy', 'more', ['/library'], 'TaxonomyChip', 'MoreHorizontal'),
  workrole: rt('workrole', 'taxonomy', 'more', ['/learn'], 'TaxonomyChip', 'MoreHorizontal'),
  checklistitem: rt('checklistitem', 'tools', 'tools', ['/migrate'], 'ChecklistRow', 'Wrench'),
  page: rt(
    'page',
    'navigation',
    'pages',
    [
      '/algorithms',
      '/compliance',
      '/faq',
      '/leaders',
      '/learn',
      '/library',
      '/migrate',
      '/navigate',
      '/patents',
      '/playground',
      '/threats',
      '/timeline',
    ],
    'PageLinkRow',
    'AppWindow'
  ),
  track: rt('track', 'learning', 'learn', ['/learn'], 'TrackRow', 'GraduationCap'),
  nicearea: rt('nicearea', 'taxonomy', 'more', ['/learn'], 'TaxonomyChip', 'MoreHorizontal'),
  persona: rt('persona', 'taxonomy', 'more', ['/learn'], 'TaxonomyChip', 'MoreHorizontal'),
  playground: rt('playground', 'tools', 'tools', ['/playground'], 'PlaygroundCard', 'Wrench'),
  stage: rt('stage', 'learning', 'learn', ['/learn'], 'StageRow', 'GraduationCap'),
  requirement: rt(
    'requirement',
    'governance',
    'more',
    ['/compliance'],
    'RequirementRow',
    'MoreHorizontal'
  ),
} as const satisfies Record<string, RecordTypeInfo>

export type RecordType = keyof typeof recordTypes

export function isRecordType(type: string): type is RecordType {
  return Object.prototype.hasOwnProperty.call(recordTypes, type)
}

/** The info of a type, or undefined for a type the table does not hold (CI fails on that). */
export function recordTypeInfo(type: string): RecordTypeInfo | undefined {
  return isRecordType(type) ? recordTypes[type] : undefined
}

/** The tab of a type: its table entry, or "more" for a type the table does not hold. */
export function tabOfType(type: string): ResourceTabKey {
  return recordTypeInfo(type)?.tab ?? 'more'
}

/** Types of one tab, in table order. */
export function typesOfTab(tab: ResourceTabKey): RecordType[] {
  return (Object.keys(recordTypes) as RecordType[]).filter((t) => recordTypes[t].tab === tab)
}

// --- Label dictionary (D6) -------------------------------------------------------------------

/**
 * One reader-facing label per concept. Keys reach the screen in three casings today
 * (`OrgName`, `authors_or_organization`, `hybridKem`); every field name below shows as the label.
 */
export const LABEL_DICTIONARY = {
  'Issued by': ['OrgName', 'authors_or_organization', 'enforcement_body', 'assignee', 'vendor'],
  Country: ['Country', 'countries', 'hq_country'],
  Published: ['initial_publication_date', 'StartYear', 'issue_date'],
  Updated: ['last_update_date'],
  Status: ['document_status', 'pqc_support', 'cert_type'],
  Deadline: ['deadline', 'EndYear'],
} as const

export type DictionaryLabel = keyof typeof LABEL_DICTIONARY

const FIELD_TO_LABEL = new Map<string, DictionaryLabel>(
  (Object.keys(LABEL_DICTIONARY) as DictionaryLabel[]).flatMap((label) =>
    (LABEL_DICTIONARY[label] as readonly string[]).map((f) => [f, label] as const)
  )
)

/** "snake_case", "camelCase" and "PascalCase" to "Sentence case words". */
function wordsOf(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** The label to show for a field key: the dictionary's word, else the key in sentence case. */
export function labelFor(fieldKey: string): string {
  return FIELD_TO_LABEL.get(fieldKey) ?? wordsOf(fieldKey)
}

/** Country codes that are not ISO 3166 (and ones the platform names differently). */
const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  'PQC-REGION-EU': 'European Union',
  EU: 'European Union',
  US: 'United States',
  USA: 'United States',
  UK: 'United Kingdom',
  GB: 'United Kingdom',
}

/** `IL` to Israel, `PQC-REGION-EU` to European Union; a value that is already a name is kept (D13: one value per country). */
export function countryName(value: string): string {
  const v = value.trim()
  const upper = v.toUpperCase()
  if (Object.prototype.hasOwnProperty.call(COUNTRY_NAME_OVERRIDES, upper))
    return COUNTRY_NAME_OVERRIDES[upper]
  if (/^[A-Za-z]{2}$/.test(v)) {
    try {
      const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(upper)
      if (name && name !== upper) return name
    } catch {
      /* fall through to the value as written */
    }
  }
  return v
}
