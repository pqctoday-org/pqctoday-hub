// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The drawer's wording. Plain words: nothing here names a language model, a provider, a download
 * or a key. A notice says what happened, what is kept, and offers one action.
 */
export const COPY = {
  title: 'Assistant',
  placeholder: 'Ask a question about the Hub',
  dockAsk: 'Ask about this page',
  dockAskLabel: 'Ask the Assistant about this page',
  placeholderPhone: 'Ask your own question about this page',
  first: 'Ask anything. No sign-up or objective needed.',
  answerDefault: 'Here is what the Hub holds on this.',
  answerName: 'One Hub record matches that name.',
  noDirect: 'No direct answer: resources only.',
  fromTheHub: 'From the Hub',
  directAnswer: 'Direct answer',
  loading: 'Looking in the Hub records.',
  failData: 'The Hub could not load the data for this answer.',
  failDataKept:
    'Your question is kept in the box below. Nothing was lost. Try again, or keep browsing the Hub.',
  tryAgain: 'Try again',
  notHeld: 'The Hub does not hold an answer to this question.',
  notHeldHint:
    'Try a standard, an algorithm, a date, a product or a lesson by name, or browse a page from the rail.',
  emptySend: 'Type a question first.',
  saveAnswer: 'Save answer',
  saved: 'Saved to My work',
  saveFailed: 'Your answer was not saved. Nothing was lost. Try again.',
  saveReferenceFailed: 'This record was not saved. Nothing was lost. Try again.',
  saveReference: 'Save to My work',
  backToAnswer: 'Back to your answer',
  close: 'Close',
  moreQuestions: (n: number) => `More questions (${n})`,
  showMore: (n: number) => `Show ${n} more ${n === 1 ? 'record' : 'records'}`,
  hideMore: 'Show fewer records',
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  paidReference: 'The Hub links to this standard and does not quote it.',
  noObjective: 'No objective yet',
  startObjective: 'Start an objective',
  newObjective: 'New objective',
  toolFailed: 'This tool could not open here.',
  toolFailedKept: 'The link still works.',
  suggested: 'Suggested for you',
  why: 'Why this question?',
  edit: 'Edit before asking',
  send: 'Send',
  ask: 'Ask',
  earlierAnswer: 'Earlier answer',
  resourcesIntro: 'Hub resources in this answer',
  answerReady: (n: number) => `Answer ready, ${n} ${n === 1 ? 'resource' : 'resources'}`,
  bookmarksTitle: 'Bookmarks',
  workshopTitle: 'Workshop',
  faqTitle: 'FAQ',
} as const

/** The starting questions for the empty drawer. The engine's own suggestions replace them when it has any. */
export const STARTING_SUGGESTIONS = [
  { question: 'What is post-quantum cryptography, in two minutes?', label: 'Understand' },
  { question: 'Which deadlines apply to banks in the EU?', label: 'Your context' },
  { question: 'Where do I start learning about PQC?', label: 'Learn' },
] as const
