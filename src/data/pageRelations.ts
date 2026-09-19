// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.1 (2026-09-19) — related content for the routed pages, the
 * pages half of the related-content engine (modules: moduleRelations.ts,
 * tools: toolRelations.ts). Hand-written because pages are hand-built: each
 * reason describes the target page in one clause a visitor can verify on it.
 * Rendered by Layout/RouteRelated for the routes in PAGE_NEXT_STEP_ROUTES;
 * pageRelations.test.ts pins that every route has 2–4 entries and every
 * target is a routed page, module or tool.
 */
import type { RelatedEntry } from '@/data/toolRelations'

const P = (to: string, title: string, reason: string): RelatedEntry => ({ to, title, reason })

export const PAGE_RELATIONS: Record<string, RelatedEntry[]> = {
  '/': [
    P('/explore', 'Explore', 'Every topic on the site in plain words, with a first stop for each'),
    P('/assess', 'Assess', 'A fast or full track of questions, then a score and priorities'),
    P('/learn', 'Learn', 'Sixty-five modules with guided workshops, by track and by role'),
  ],
  '/assess': [
    P(
      '/report',
      'Readiness Report',
      'What your answers become: score, priorities, recommended actions'
    ),
    P('/threats', 'Threats', 'The threat register the assessment scores your estate against'),
    P('/compliance', 'Compliance', 'The frameworks and deadlines behind the compliance questions'),
    P(
      '/learn/pqc-risk-management',
      'PQC Risk Management',
      'The module on the risk method the assessment applies'
    ),
  ],
  '/report': [
    P('/assess', 'Assess', 'Change an answer and the report re-computes'),
    P('/business', 'Command Center', 'The tools that turn each recommendation into a deliverable'),
    P('/migrate', 'Migrate', 'The product catalogue the migration recommendations draw on'),
  ],
  '/learn': [
    P('/playground', 'Playground', 'The hands-on tools the modules link to'),
    P('/learn/quiz', 'Quiz', 'Questions per module category, with answers'),
    P('/explore', 'Explore', 'The same topics organised by question instead of by track'),
  ],
  '/playground': [
    P('/learn', 'Learn', 'Every tool practises a module; the modules explain the why'),
    P('/openssl', 'OpenSSL Studio', 'The command-line view of the same operations'),
    P('/algorithms', 'Algorithms', 'The parameter sets and sizes the tools use'),
  ],
  '/playground/cacp': [
    P(
      '/playground/cacp-kmip',
      'KMIP Control Plane',
      'The step-by-step tool for the same control plane'
    ),
    P('/learn/kms-pqc', 'KMS & PQC', 'The module on key-management systems and crypto agility'),
    P('/playground/hsm', 'PKCS#11 HSM', 'The key store the control plane governs'),
  ],
  '/playground/hsm': [
    P('/learn/hsm-pqc', 'HSM & PQC Operations', 'The module behind this lab'),
    P(
      '/playground/hsm-capacity',
      'HSM Capacity Calculator',
      'Turn signature volume into HSM count'
    ),
    P('/playground/cacp', 'CACP', 'The KMIP control plane over the same key store'),
  ],
  '/playground/interactive': [
    P('/algorithms', 'Algorithms', 'What each parameter set costs in bytes and time'),
    P('/learn/pqc-candidates', 'PQC Candidates & Lifecycle', 'Where the algorithms here came from'),
    P('/playground', 'Playground', 'The rest of the hands-on tools'),
  ],
  '/openssl': [
    P('/playground/openssl-studio', 'OpenSSL Studio tool', 'The same studio inside the Playground'),
    P(
      '/learn/crypto-dev-apis',
      'Cryptographic APIs & Developer Languages',
      'The module on the APIs behind the commands'
    ),
    P(
      '/playground/pki-enrollment',
      'PKI Enrollment',
      'Certificate enrollment with the same toolchain'
    ),
  ],
  '/algorithms': [
    P('/playground/interactive', 'Interactive Playground', 'Run the algorithms compared here'),
    P('/library', 'Library', 'The FIPS documents the parameter sets are taken from'),
    P('/patents', 'Patents', 'The filings on the schemes compared here'),
    P('/learn/pqc-candidates', 'PQC Candidates & Lifecycle', 'How the candidates were selected'),
  ],
  '/compliance': [
    P('/timeline', 'Timeline', 'The same deadlines in date order'),
    P(
      '/business/tools/compliance-checklist',
      'Compliance Checklist',
      'Track the frameworks that apply to you'
    ),
    P(
      '/learn/compliance-strategy',
      'Compliance & Regulatory Strategy',
      'The module on building a compliance position'
    ),
  ],
  '/migrate': [
    P(
      '/business/tools/roadmap-builder',
      'Roadmap Builder',
      'Sequence the migration the catalogue describes'
    ),
    P('/timeline', 'Timeline', 'The dates vendor support is measured against'),
    P('/learn/migration-program', 'Migration Program Mgmt', 'The module on running the programme'),
  ],
  '/business': [
    P('/report', 'Readiness Report', 'The recommendations the tools produce deliverables for'),
    P('/learn/pqc-business-case', 'PQC Business Case', 'The module behind the funding tools'),
    P('/simulation', 'Simulation', 'A guided walk through a reference programme'),
  ],
  '/timeline': [
    P('/compliance', 'Compliance', 'What each deadline requires'),
    P('/migrate', 'Migrate', 'When products support what the deadlines ask for'),
    P(
      '/business/tools/compliance-timeline',
      'Compliance Timeline',
      'Your own deadlines in one plan'
    ),
  ],
  '/library': [
    P('/revisions', 'Revisions', 'Corrections to the documents and data here'),
    P('/leaders', 'Community', 'The people who wrote the documents'),
    P('/about', 'About', 'How the trust score behind each document is computed'),
  ],
  '/threats': [
    P('/assess', 'Assess', 'Score these threats against your own estate'),
    P('/learn/quantum-threats', 'Quantum Threats', 'The module on what breaks and when'),
    P('/business/tools/risk-register', 'Risk Register', 'Record the threats that apply to you'),
  ],
  '/simulation': [
    P('/assess', 'Assess', 'Start the same programme on your own estate'),
    P('/business', 'Command Center', 'The tools the simulation stages use'),
    P(
      '/learn/migration-program',
      'Migration Program Mgmt',
      'The module on the programme being walked'
    ),
  ],
  '/patents': [
    P('/algorithms', 'Algorithms', 'The schemes the claims are filed on'),
    P('/leaders', 'Community', 'The people behind the standards the patents touch'),
    P('/library', 'Library', 'The standards documents themselves'),
  ],
  '/leaders': [
    P('/library', 'Library', 'The documents these people authored'),
    P(
      '/learn/standards-bodies',
      'Standards, Certification & Compliance Bodies',
      'The organisations they work in'
    ),
    P('/patents', 'Patents', 'Filings by the same organisations'),
  ],
  '/explore': [
    P('/learn', 'Learn', 'The modules each topic card points at'),
    P('/assess', 'Assess', 'A score and a first stop in a few minutes'),
    P('/faq', 'FAQ', 'Short answers with a link to the module that explains each'),
  ],
  '/revisions': [
    P('/changelog', 'Changelog', 'What each release changed'),
    P('/library', 'Library', 'The documents the corrections refer to'),
    P('/about', 'About', 'How corrections are handled'),
  ],
  '/changelog': [
    P('/revisions', 'Revisions', 'Row-level data corrections'),
    P('/about', 'About', 'Who builds the site and how'),
  ],
  '/faq': [
    P('/learn', 'Learn', 'The modules the answers link to'),
    P('/explore', 'Explore', 'Topics by question, with a first stop for each'),
    P('/learn/pqc-101', 'PQC 101', 'The foundations module the first answers point at'),
  ],
  '/about': [
    P(
      '/editorial-independence',
      'Editorial independence',
      'The policy behind assessments and vendor rows'
    ),
    P('/sponsor', 'Sponsor', 'What sponsorship funds and does not buy'),
    P('/terms', 'Terms', 'Licence, reuse and disclaimers'),
  ],
  '/editorial-independence': [
    P('/about', 'About', 'The trust score and transparency sections'),
    P('/sponsor', 'Sponsor', 'Sponsorship tiers and what they fund'),
    P('/migrate', 'Migrate', 'The catalogue the inclusion criteria apply to'),
  ],
  '/sponsor': [
    P(
      '/editorial-independence',
      'Editorial independence',
      'The promise sponsorship does not change'
    ),
    P('/about', 'About', 'How the site is built and funded'),
  ],
  '/terms': [
    P('/about', 'About', 'Data privacy and what is collected'),
    P('/editorial-independence', 'Editorial independence', 'How content decisions are made'),
  ],
  '/embed': [
    P('/learn', 'Learn', 'The modules with an embeddable view'),
    P('/about', 'About', 'The site the embeds come from'),
  ],
  '/navigate': [
    P('/explore', 'Explore', 'The same topics as a list'),
    P('/learn', 'Learn', 'The modules the map links'),
  ],
}

export function pageRelationsFor(route: string): RelatedEntry[] {
  // eslint-disable-next-line security/detect-object-injection -- route is the pathname matched against a literal map
  return PAGE_RELATIONS[route] ?? []
}
