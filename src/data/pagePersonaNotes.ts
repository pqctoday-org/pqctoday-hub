// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8, Wave C (2026-09-19) — "What this means for you" on eleven routed
 * reference pages. /navigate is a full-screen canvas with no header to sit under,
 * so it carries no strip.
 *
 * One line per persona per page. Every line was written against the page's
 * real controls and sections (its headings, filter labels, data columns) —
 * the review packet's first drafts named a CPC filter /patents does not have,
 * a "Data Foundation" section /about does not have, and a public sponsor list
 * /sponsor does not show. A line here must describe something the page shows;
 * pagePersonaNotes.test.ts pins shape, and PersonaPageNote renders the active
 * persona's line (all seven when no persona is set).
 */
import type { PersonaId } from '@/data/personaIds'

export type PagePersonaNotes = Record<PersonaId, string>

export const PAGE_PERSONA_NOTES: Record<string, PagePersonaNotes> = {
  '/': {
    executive:
      'Pick Executive and choose the question — mandate, risk, roadmap, deadlines, evidence or the whole programme — each board is three cards that answer it, with the proof behind each.',
    grc: 'Pick GRC and choose the question — what applies, what is already proven, the controls, the risk register, vendor assurance or what "done" means — before any tool asks you for an inventory.',
    developer:
      'Pick Developer and choose the question: the pilot board reaches a real ML-KEM handshake in this tab in minutes; the others cover parameter sets, inventory, sizes, deadlines and closure.',
    architect:
      'Pick Architect and choose the question: the control-plane board changes one KMIP policy line and rekeys the estate live; the others cover inventory, key stores, protocols, sequencing and defending the design.',
    researcher:
      "Pick Researcher and choose the question: provenance, reproducing the tests, the standards' dates and states, the threat model, the field, or the command line — every figure carries its source.",
    ops: 'Pick IT Ops and choose the question: capacity, cutover rehearsal, cipher-suite config, supplier timelines, closeout or your standing — sized before renewal day.',
    curious:
      'You do not need a role: skip the question and the site opens by topic, or pick Curious for what breaks and when, where it touches you, and a thirty-second version.',
  },
  '/patents': {
    executive:
      'Licensing exposure is part of vendor risk: the "Top assignee" view shows who has filed the most claims over the implementations your suppliers ship.',
    grc: 'A patent filing is dated evidence of prior work; "Filing activity over time" shows when each family of claims was first written down.',
    developer:
      'Filter to "Core invention" and "PQC only" to see the constructions that carry real claims before you standardise your own envelope or hybrid format.',
    architect:
      'Use "Map to FIPS 203/4/5" to see which patents touch the standards you are designing against; hybrid schemes have their own filter.',
    researcher:
      'The "Corpus scope" control switches between all filings and the core-invention set; each patent opens with its claims, not just its abstract.',
    ops: 'Patents change nothing you operate today; the licensing angle you need rides on the vendors in the migration catalogue.',
    curious:
      'A patent is a public description of an invention with a date on it — this is where the post-quantum ideas were first written down, searchable by title, assignee or number.',
  },
  '/leaders': {
    executive:
      'The people here wrote the standards your regulator will cite; when a vendor names a co-author, filter by name and check the claim.',
    grc: 'Filter by country, region and sector to see which national bodies and organisations are actually represented in the standards work.',
    developer:
      'The Standards category names the authors behind FIPS 203–205 and the PKCS#11 specification, with the documents each one wrote.',
    architect:
      'Interoperability questions have owners: the Standards category tells you who edits the PKCS#11 and KMIP specifications you design against.',
    researcher:
      'Entries carry their key resources and a verified date; a name that is missing means no public proof was found, not that the person is unknown.',
    ops: 'Skip the biographies: sort "By relevance to you" or filter to the Standards category to see who maintains the documents your configuration references.',
    curious:
      'Post-quantum cryptography is being built by a few hundred people you can name — this is who they are, in cards or a table, and what each one did.',
  },
  '/explore': {
    executive:
      'Start with "Understand the Threat" and "Assess Your Risk"; the page is organised by question, not by department.',
    grc: 'The "Compliance Landscape" and "Global Migration Timeline" cards put every framework and deadline in one place.',
    developer:
      'Jump to "Try the Playground": the hands-on tools, grouped by what each one exercises.',
    architect:
      '"Compare PQC Algorithms" and "Migration Workbench" are the two cards a design decision rests on; read them in that order.',
    researcher:
      '"Reference Library" is the read-only record behind the claims on the site; the Revisions page beside it holds the corrections.',
    ops: '"Migration Workbench" and "Command Center" are the shortest route to a cutover plan you can hand to a change board.',
    curious:
      'This page exists for you: every topic on the site, in plain words, with a first stop for each.',
  },
  '/revisions': {
    executive:
      'A correction log for the data your reports are built on: if a number changed, the reason and the date are here.',
    grc: 'Every change to a compliance obligation, deadline or certification record is dated and attributed — audit evidence for the data itself.',
    developer:
      'Vendor and migration records change as roadmaps ship; the domain chips narrow the feed to what moved since you last checked.',
    architect:
      'Algorithm and protocol records carry their revision history; a design decision made on an old value can be re-checked here.',
    researcher:
      "This is the site's own errata: what was wrong, what it was corrected to, and when.",
    ops: 'Use the Migrate chip to see which product support claims were corrected — those are the ones to re-verify before a cutover.',
    curious: 'Facts on this site get corrected in public; this page is the list of corrections.',
  },
  '/changelog': {
    executive: 'Filter by your persona to see only the releases that changed something you use.',
    grc: 'Data Updates entries mark corrections to obligations and records; the Compliance and Timeline tags say which area moved.',
    developer:
      'Entries tagged Software and Algorithms name the tool or view that gained or fixed something.',
    architect:
      'Architecture-relevant changes carry the Algorithms and Library tags; the Architect persona filter narrows to them.',
    researcher:
      'Data Updates entries say which dataset changed; the Revisions page has the row-level detail.',
    ops: 'The Ops persona filter covers deployment, certificate lifecycle and TLS configuration changes.',
    curious:
      'Each entry starts with what changed for you, in plain words; the version number is the least important part.',
  },
  '/faq': {
    executive:
      '"What should executives know about quantum risk?" and "How do I build a PQC business case for the board?" are answered here, under Role-Specific Guidance.',
    grc: 'The "Compliance & Regulation" category answers what DORA, NIS2, eIDAS 2.0, PCI DSS 4.0 and CNSA 2.0 require, one question each.',
    developer:
      '"Can I test PQC algorithms in my browser?" and the "Interactive Tools" category point at the playground tool that demonstrates each answer.',
    architect:
      '"What is a hybrid cryptographic approach?" and "How do PQC certificates affect TLS chain size?" link to the comparisons the answers were taken from.',
    researcher:
      'Questions are grouped by category and searchable; answers name the standard or report they come from, which the Library holds.',
    ops: '"How do you configure PQC TLS on Linux?", "What OpenSSH version supports PQC?" and "How do I safely retire legacy cryptography?" are the ones to read before scheduling a cutover.',
    curious:
      'Start with "What is post-quantum cryptography?" and "Where should I start if I\'m new to PQC?"; each answer links to the module that explains it fully.',
  },
  '/about': {
    executive:
      "The Trust Engine and Trust Score Methodology sections explain how much of the site's content is backed by a cached primary source — the figures to quote when you cite the site.",
    grc: 'The Transparency & Disclaimer and Independence sections state who runs the site, who funds it and how corrections are handled.',
    developer:
      'The SBOM section lists every dependency by category; the Data Privacy section states that the site is static, with no backend and nothing leaving your browser.',
    architect:
      'The Platform Data section names each data file with its date — the provenance of every table you design from.',
    researcher:
      'The Trust Score Methodology and Trust Tiers are published in full; use them to judge any figure on the site.',
    ops: "Your progress and settings live in your browser's localStorage; the Data Privacy section says exactly what is and is not collected.",
    curious:
      'The Transparency & Disclaimer section says who builds this site, why, and what is and is not tracked.',
  },
  '/editorial-independence': {
    executive:
      'No vendor pays for placement: "What sponsorship buys, and what it does not" states the rule in writing.',
    grc: '"Conflict-of-interest disclosure" and "Requests to modify content" state how conflicts and change requests are handled.',
    developer:
      '"Inclusion and assessment criteria" is the rule behind every product row: it is in the catalogue because published evidence supports it.',
    architect:
      'The policy is why a "PQC-ready" claim on this site links to its proof; the assessment criteria are stated here.',
    researcher:
      '"Funding sources" and "How to flag a violation" are the sections to cite when you rely on the site\'s data.',
    ops: 'Product rows you plan a cutover on are assessed by these criteria; the row shows the proof and its date.',
    curious: 'Nobody can buy a better rating here; this page explains how that is kept true.',
  },
  '/sponsor': {
    executive:
      'Sponsorship funds hosting and data work and buys no placement; "The editorial-independence promise" on this page states the rule.',
    grc: 'Sponsorship is disclosed, and "Where your sponsorship goes" lists what it funds; the compliance data is not influenced by it.',
    developer:
      'The site is open source; sponsorship is one way to support it, contributing code is another.',
    architect: 'Sponsorship does not change catalogue positions or algorithm assessments.',
    researcher:
      'The tiers and what each funds are listed here, so a reader can judge any perceived conflict.',
    ops: 'Nothing operational changes with sponsorship; the tools stay free.',
    curious: 'If the site helped you, this is how to help it keep running.',
  },
  '/terms': {
    executive:
      "The site gives information, not legal or compliance advice; decisions remain yours and your counsel's.",
    grc: 'The License and Third-Party Content sections say what you may reuse and how to attribute it; check them before putting tables in an audit file.',
    developer:
      'The source code licence is GPL-3.0-only, and nothing in these terms restricts the rights it grants.',
    architect:
      'Simulations and tools are educational; the Cryptographic Disclaimer says production designs need your own validation.',
    researcher:
      'Reuse of text and data is governed by the License and Third-Party Content sections; cite the site when you reuse it.',
    ops: 'The playground runs real cryptography in your browser; the Cryptographic Disclaimer says keys made here must never protect production systems.',
    curious:
      'Plain summary: free to use, no account, and the Privacy and Analytics section says what is collected.',
  },
}
