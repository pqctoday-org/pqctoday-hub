// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The verb dictionary (UX grammar v2.1, section 2.3): one word for each thing a reader can do,
 * site-wide. Sentence case always; never ALL CAPS; never an engine name in a label.
 * Every button, menu item and link label that stands for one of these uses `verbLabel`.
 */
import {
  Bookmark,
  Bot,
  ChevronRight,
  ExternalLink,
  Link as LinkIcon,
  Share2,
  X,
  type LucideIcon,
} from 'lucide-react'

export type VerbIconName =
  'chevron-right' | 'bot' | 'x' | 'link' | 'share-2' | 'bookmark' | 'external-link'

/** The icon of each verb that has one. */
export const VERB_ICONS: Record<VerbIconName, LucideIcon> = {
  'chevron-right': ChevronRight,
  bot: Bot,
  x: X,
  link: LinkIcon,
  'share-2': Share2,
  bookmark: Bookmark,
  'external-link': ExternalLink,
}

interface VerbSpec {
  /** The label. A function takes the thing: "Add risk", "Run handshake". */
  label: string | ((thing: string) => string)
  icon?: VerbIconName
}

export const VERBS = {
  open: { label: 'Open', icon: 'chevron-right' },
  /** Open a page outside the Hub: the same word with the external-link icon. */
  openExternal: { label: 'Open', icon: 'external-link' },
  ask: { label: 'Ask Assistant', icon: 'bot' },
  close: { label: 'Close', icon: 'x' },
  copyLink: { label: 'Copy link', icon: 'link' },
  share: { label: 'Share', icon: 'share-2' },
  save: { label: 'Save', icon: 'bookmark' },
  showMore: { label: 'Show 25 more' },
  endorse: { label: 'Endorse' },
  flag: { label: 'Flag' },
  source: { label: 'Source ›', icon: 'external-link' },
  tryIt: { label: 'Try it' },
  start: { label: 'Start' },
  continue: { label: 'Continue' },
  generateKeyPair: { label: 'Generate key pair' },
  sign: { label: 'Sign' },
  verify: { label: 'Verify' },
  run: { label: (thing: string) => `Run ${thing}` },
  runStep: { label: 'Run step' },
  next: { label: 'Next' },
  finish: { label: 'Finish' },
  back: { label: 'Back' },
  skipStep: { label: 'Skip step' },
  runKnownAnswerChecks: { label: 'Run known-answer checks' },
  runTamperTest: { label: 'Run tamper test' },
  startOver: { label: 'Start over' },
  resetInputs: { label: 'Reset inputs' },
  showPkcs11Calls: { label: 'Show PKCS#11 calls' },
  add: { label: (thing: string) => `Add ${thing}` },
  loadSample: { label: 'Load sample' },
  clearAll: { label: 'Clear all' },
  copy: { label: 'Copy' },
  copySummary: { label: 'Copy summary' },
  download: { label: 'Download ▾' },
  tryAgain: { label: 'Try again' },
  reportProblem: { label: 'Report a problem' },
  clearFilters: { label: 'Clear filters' },
  suggestRecord: { label: 'Suggest a record' },
  startBlank: { label: 'Start blank' },
  showAll: { label: 'Show all' },
  expand: { label: 'Expand' },
} as const satisfies Record<string, VerbSpec>

export type VerbKey = keyof typeof VERBS

/** Verbs that take a thing: `verbLabel('add', 'risk')` is "Add risk". */
type VerbWithThing = {
  [K in VerbKey]: (typeof VERBS)[K]['label'] extends (thing: string) => string ? K : never
}[VerbKey]

/** The label of a verb. A verb that takes a thing needs it; the others take none. */
export function verbLabel<K extends Exclude<VerbKey, VerbWithThing>>(key: K): string
export function verbLabel<K extends VerbWithThing>(key: K, thing: string): string
export function verbLabel(key: VerbKey, thing?: string): string {
  const label = VERBS[key].label as string | ((t: string) => string)
  return typeof label === 'function' ? label(thing ?? '') : label
}

/** The icon of a verb, or undefined when it has none. */
export function verbIcon(key: VerbKey): LucideIcon | undefined {
  const spec: VerbSpec = VERBS[key]
  return spec.icon ? VERB_ICONS[spec.icon] : undefined
}
