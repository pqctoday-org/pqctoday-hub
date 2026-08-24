// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure-move extraction (IMPLEMENTATION-PLAN.md §5.4, E-5) — every one of
 * these was module-private (or, for ROUTE_VIEW_TYPE, exported but still
 * living inside the view file) to MainLayout.tsx. Moved verbatim so the
 * mobile shell's ⋯ page-actions selector and ShareButton usage read the
 * same route→metadata tables the desktop top bar reads, rather than a
 * copy. MainLayout.tsx re-imports all of them under the same names.
 */
import type { ViewType } from './authoritativeSourcesData'
import type { PageId } from './userManualData'

// '/compliance' is deliberately ABSENT here — ux-standard.md P10 has a MUST
// NOT rule ("Do not render SourcesButton on this page — provenance is
// surfaced inline via TrustPathPopover on framework tiles and a
// ContentUpdatesFeed in PageHeader").
export const ROUTE_VIEW_TYPE: Partial<Record<string, ViewType>> = {
  '/timeline': 'Timeline',
  '/library': 'Library',
  '/threats': 'Threats',
  '/leaders': 'Leaders',
  '/algorithms': 'Algorithms',
  '/migrate': 'Migrate',
  '/patents': 'Patents',
  // OpenSSL Studio's own (now-removed) PageHeader call passed viewType="Library"
  // (it reuses the Library authoritative-sources list — there is no distinct
  // "OpenSSL" ViewType) — preserved here so /openssl keeps its Sources button.
  '/openssl': 'Library',
}

export const ROUTE_PAGE_ID: Partial<Record<string, PageId>> = {
  '/timeline': 'timeline',
  '/algorithms': 'algorithms',
  '/library': 'library',
  '/playground': 'playground',
  '/openssl': 'openssl-studio',
  '/threats': 'threats',
  '/leaders': 'leaders',
  '/compliance': 'compliance',
  '/migrate': 'migrate',
  '/assess': 'assess',
  '/report': 'report',
  '/business': 'business-center',
  // BusinessToolsGrid ('/business/tools') is a separate nested route from
  // BusinessCenterView ('/business' index) but shares the same pageId — its
  // own (now-removed) PageHeader call passed pageId="business-center" too.
  '/business/tools': 'business-center',
  '/learn': 'learn',
}

/**
 * Prefix fallback for `ROUTE_PAGE_ID`, which is an exact-path table. Nested
 * routes inherit their section's user-manual page — `/learn/pqc-101` and
 * `/learn/quiz` both document under `learn`. Deliberately a small explicit
 * list, not a generic "first path segment" rule: only sections whose nested
 * routes genuinely share one manual entry belong here.
 */
export const NESTED_ROUTE_PAGE_ID: ReadonlyArray<readonly [string, PageId]> = [['/learn/', 'learn']]

export const pageIdForNestedRoute = (pathname: string): PageId | undefined =>
  NESTED_ROUTE_PAGE_ID.find(([prefix]) => pathname.startsWith(prefix))?.[1]

// Bespoke Share title/text per route — preserved from each page's own
// (now-removed) `<PageHeader shareTitle=... shareText=...>` call so the
// global top bar's ShareButton keeps the same copy instead of falling back to
// the generic `"{route label} — PQC Today"` title for every route. Routes
// absent here (e.g. /learn, /migrate) never had a bespoke shareTitle on their
// PageHeader either — they keep the generic fallback, same as before.
//
// Two of these intentionally approximate rather than reproduce a dynamic
// shareText (see IMPLEMENTATION-PLAN follow-up, 2026-08-01 PageHeader
// consolidation):
//  - /algorithms used `${algorithmData.length || 'dozens of'}` — reusing the
//    same page's own "no data yet" fallback copy ("dozens of") rather than
//    duplicating its data-loading hook here.
//  - /business/tools used `${BUSINESS_TOOLS.length}` — reusing the page's own
//    static `description` copy instead of importing the tools registry (a
//    sizeable data+icon module) into the always-loaded MainLayout shell.
export const ROUTE_SHARE: Partial<Record<string, { title: string; text?: string }>> = {
  '/algorithms': {
    title: 'PQC Algorithm Comparison — ML-KEM, ML-DSA, SLH-DSA & More',
    text: 'Compare dozens of cryptographic algorithms side-by-side — security levels, key sizes, and performance.',
  },
  '/assess': {
    title: 'PQC Risk Assessment — Post-Quantum Cryptography Migration Tool',
    text: 'Get a personalized quantum risk score, migration priorities, and actionable recommendations for your organization.',
  },
  '/business': {
    title: 'PQC Command Center — Quantum Readiness Workspace',
    text: 'Your PQC readiness command center — risk, compliance, governance, and actionable next steps.',
  },
  '/business/tools': {
    title: 'PQC Business Tools — Planning & Governance Toolkit',
    text: 'Interactive planning and governance tools for PQC migration — ROI calculators, RACI builders, vendor scorecards, and more.',
  },
  '/compliance': {
    title: 'PQC Compliance Tracker — Standards, Certifications, Frameworks',
    text: 'Explore PQC compliance: standardization bodies, certification programs (FIPS 140-3, ACVP, Common Criteria), and regulatory frameworks.',
  },
  '/leaders': {
    title: 'PQC Community — People Contributing to the Advances of Post-Quantum Cryptography',
    text: 'Meet the people contributing to the advances of post-quantum cryptography.',
  },
  '/library': {
    title: 'PQC Library — NIST, IETF, ETSI & More',
    text: 'Explore post-quantum cryptography standards, drafts, and key documents.',
  },
  '/openssl': {
    title: 'OpenSSL Studio — Interactive OpenSSL v3.6.3 in Your Browser',
    text: 'Run real OpenSSL 3.6.3 commands — key generation, certificates, KEM, PQC — entirely in your browser via WebAssembly.',
  },
  '/patents': {
    title: 'PQC Patents — Post-Quantum Migration Patent Corpus',
    text: 'Cryptographic patents relevant to post-quantum migration, enriched across 25 technical dimensions.',
  },
  '/report': {
    title: 'PQC Assessment Report — Post-Quantum Cryptography Risk Analysis',
    text: 'View your personalized PQC risk score, migration priorities, and actionable recommendations.',
  },
  '/threats': {
    title: 'Quantum Threats Dashboard — Industry Risk Analysis',
    text: 'Detailed analysis of quantum threats across industries — criticality ratings, at-risk cryptography, and PQC replacements.',
  },
  '/timeline': {
    title: 'PQC Migration Timeline — Global Post-Quantum Cryptography Roadmap',
    text: 'Compare PQC migration timelines across nations — track phases from discovery to full migration.',
  },
}
