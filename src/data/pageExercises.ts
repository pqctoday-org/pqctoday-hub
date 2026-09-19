// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — one "Try it" question per routed reference
 * page, answerable from what the page shows (its controls, columns, counts
 * or verdicts), with a reason that names the concept. Rendered under the page
 * by RoutePageExercise (desktop: the shared ToolExercise with family 'page';
 * phone: MobilePageExercise). Keyed by route. pageExercises.test.ts pins shape.
 */
import type { StepExercise } from '@/data/stepExercises'

export const PAGE_EXERCISES: Record<string, StepExercise[]> = {
  '/report': [
    {
      prompt:
        "You open someone else's report through a share link. According to the banner at the top, what happens to your own assessment?",
      options: [
        "It is overwritten by the sender's answers",
        'Nothing — the shared report is a read-only snapshot and your own assessment is unaffected',
        "It is merged with the sender's result into one combined score",
      ],
      answer: 1,
      why: 'A shared report is an ephemeral, read-only snapshot rendered from the link itself; decoding it never writes into your own persisted assessment or persona state.',
    },
  ],
  '/assess': [
    {
      prompt:
        'You have no estate of your own to describe, so you pick a documented reference estate. What does the page say about the report that results?',
      options: [
        'It is indistinguishable from a report on your own organisation',
        'It cannot be generated until you edit at least one answer',
        'It says on its face that it came from a reference estate, with every question pre-answered',
      ],
      answer: 2,
      why: 'Reference estates are deliberately fixed example organisations: every answer is pre-filled and the report is labelled as coming from a reference estate so it is never mistaken for your own.',
    },
  ],
  '/': [
    {
      prompt:
        "In the home page's 'Backup & Restore progress' section, what does Export Backup download?",
      options: [
        'All progress — modules, assessment, persona, quiz mastery, chat history, artifacts and settings',
        'Only your assessment answers',
        'Only your learning-module completion',
        'A PDF copy of your report',
      ],
      answer: 0,
      why: 'Export Backup is a full snapshot of everything the site stores locally in your browser, so a later Import Backup can restore all progress and settings on another machine.',
    },
  ],
  '/playground/hsm': [
    {
      prompt:
        'The HSM Playground has four modes. Which one holds the single shared call log, the key inventory and the mechanism list?',
      options: ['Learn', 'Operate', 'Build', 'Inspect'],
      answer: 3,
      why: 'Inspect is the observation mode: one log and one key inventory are fed by every Operate and Build surface, so there are no separate copies inside each panel.',
    },
  ],
  '/algorithms': [
    {
      prompt:
        'On the Algorithms page, the family / function / security-level / region / status filter deck disappears on one of these tabs. Which?',
      options: ['Transition Guide', 'Detailed Comparison', 'Protocol Support'],
      answer: 2,
      why: 'The filter deck only drives the algorithm tables; Protocol Support filters and sorts its own protocol table, so the deck is hidden there because it would have no effect.',
    },
  ],
  '/compliance': [
    {
      prompt:
        'The Products tab tells you which of the things you run hold a certificate. Where does it say that inventory comes from?',
      options: [
        'The NIST CMVP certification records',
        'The product list you keep on Migrate',
        'Your assessment answers',
        "The Library's standards catalogue",
      ],
      answer: 1,
      why: 'Products reuses the inventory you build on the Migrate page and matches it against certification records, so certificate coverage is shown for your own estate rather than the whole catalogue.',
    },
  ],
  '/migrate': [
    {
      prompt:
        "On the Migration Workbench, the 'Plan & sequence' tab sometimes shows a small number badge. What does that number count?",
      options: [
        'Assets you have added to your migration plan',
        'Products in the whole catalogue',
        'Vendor roadmaps that have loaded',
        'Days until the nearest deadline',
      ],
      answer: 0,
      why: 'The badge is the planned-asset count from your posture: it only appears once at least one asset is in the plan, so it tells you how much sequencing work is waiting on that tab.',
    },
  ],
  '/business': [
    {
      prompt:
        "The Command Center's welcome state lists four board-level questions. Which one does the 'RACI builder' answer?",
      options: ["What's at risk?", "What's the deadline?", 'What will it cost?', 'Who owns it?'],
      answer: 3,
      why: 'A RACI chart assigns accountability (Responsible, Accountable, Consulted, Informed), which is the governance question of who owns the programme, not its risk, deadline or cost.',
    },
  ],
  '/timeline': [
    {
      prompt:
        'You set a region and country filter on the Global Migration Timeline, then press the CSV export button. What does the file contain?',
      options: [
        'Every country in the dataset, ignoring your filters',
        'Only the timeline rows that match your current filters',
        'Only the countries you have bookmarked',
      ],
      answer: 1,
      why: 'The export follows the filtered view: it is built from the same region/country/search-narrowed set the chart shows, so the CSV matches what is in front of you rather than the whole world.',
    },
  ],
  '/library': [
    {
      prompt:
        "The Library shows a 'Narrowed to your role' chip above the document list. What happens when you clear it?",
      options: [
        'The sort order resets to default',
        'Your bookmarks are removed',
        'Persona narrowing is switched off and every document is shown',
      ],
      answer: 2,
      why: "The chip is the on/off lever for persona narrowing (prefs=off): clearing it stops filtering the corpus to your role's focus areas, independently of the other filter chips.",
    },
  ],
  '/playground': [
    {
      prompt: 'In Crypto Lab, how do you pin a tool so it appears under "My tools"?',
      options: [
        'Drag its card into the sidebar',
        "Tap the ☆ on the tool's card",
        'Switch the run-context filter to Sandbox',
      ],
      answer: 1,
      why: '"My tools" is a bookmark list: the star on each card toggles "Add to My tools", and the empty state tells you to tap the ☆ on any tool to pin it there.',
    },
  ],
  '/playground/interactive': [
    {
      prompt:
        'According to the Quick Start banner, which tab do you start in to generate a key pair?',
      options: ['Sign & Verify', 'Logs', 'Key Store'],
      answer: 2,
      why: 'The Quick Start flow is key first, then signature: generate a pair in Key Store, then switch to Sign & Verify to sign and verify with it while the log panel records every operation.',
    },
  ],
  '/openssl': [
    {
      prompt:
        'In the Workbench tab\'s "OpenSSL Studio — ready" panel, which starter command generates an ML-DSA-65 key?',
      options: [
        'openssl genpkey -algorithm ml-dsa-65 -out ml_dsa.key',
        'openssl genpkey -algorithm ed25519 -out ed25519.key',
        'openssl version',
      ],
      answer: 0,
      why: 'genpkey with -algorithm ml-dsa-65 is the real OpenSSL invocation for a post-quantum signature key; the ed25519 variant is the classical comparison and openssl version only reports the build.',
    },
  ],
  '/threats': [
    {
      prompt: 'Besides "All", which two chips does the Threat Catalog\'s Class filter offer?',
      options: [
        'Critical and Low',
        'Public and Private',
        'In-browser and Sandbox',
        'HNDL and HNFL',
      ],
      answer: 3,
      why: "The Class filter splits threats by the attacker's clock: HNDL (Harvest Now, Decrypt Later) targets confidentiality, HNFL/TNFL (forge later) targets authenticity. Critical/Low are Severity chips, not Class.",
    },
  ],
  '/patents': [
    {
      prompt:
        'Which Corpus scope setting includes classical-only patents in every number on the page?',
      options: ['PQC & hybrid', 'All crypto'],
      answer: 1,
      why: 'The Corpus scope control filters everything below it: "PQC & hybrid" keeps only patents using post-quantum or hybrid cryptography, while "All crypto" shows the full corpus including classical-only patents.',
    },
  ],
  '/leaders': [
    {
      prompt:
        'Before you press "Show all contributors", which people does the Community page list?',
      options: [
        'Every document contributor',
        'Only people in your selected sector',
        'Hand-curated profiles only',
      ],
      answer: 2,
      why: 'The directory defaults to its hand-curated profiles; the remaining people are document contributors, hidden until the "Show all contributors" toggle is pressed, so the default view is the vetted set.',
    },
  ],
  '/explore': [
    {
      prompt:
        'Once a role is chosen, which tile\'s time figure is labelled "for your essentials track" instead of "for a first look"?',
      options: ['Learn PQC Basics', 'Try the Playground', 'Reference Library'],
      answer: 0,
      why: "The /learn tile is the one whose minutes are a real figure — your persona's essentials track length — rather than a first-look estimate, so its label names the essentials track to keep the number honest.",
    },
  ],
  '/revisions': [
    {
      prompt: 'In the Content Revisions feed, what does the robot icon in front of an entry mean?',
      options: [
        'The change was rejected',
        'The entry is an initial import',
        'The entry was human-reviewed',
        'The entry was LLM-authored',
      ],
      answer: 3,
      why: 'Each feed row leads with an authorship marker: a Bot icon labelled "LLM-authored" versus a merge icon labelled "Human-reviewed". "Initial import" is a separate text label for baseline entries with no PR to link.',
    },
  ],
  '/faq': [
    {
      prompt: 'In the FAQ answer on the three FIPS badge tiers, which tier is shown in amber?',
      options: ['Validated', 'Partial', 'No'],
      answer: 1,
      why: "The Migrate catalog's badge colours encode certainty: Validated (green) is FIPS 140-3 certified with PQC algorithms, Partial (amber) is a vendor claim with full PQC validation still pending, No (gray) has no validation.",
    },
  ],
}

export const PAGE_EXERCISE_ROUTES: ReadonlySet<string> = new Set(Object.keys(PAGE_EXERCISES))

export function pageExercisesFor(route: string): StepExercise[] | undefined {
  // eslint-disable-next-line security/detect-object-injection -- route is the router's pathname, matched against our own keys
  return PAGE_EXERCISES[route]
}
