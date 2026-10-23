// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Checks that in-app links written in Learn sections land somewhere that exists: a real module,
 * a real section or workshop step of it, a Playground page the router serves, or a Compliance
 * tab the page parses. Used by the section tests; returns one line per link that does not resolve.
 */
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { TOOL_ROUTE_META } from '@/seo/toolRouteMeta.generated'

/** Playground pages App.tsx routes by name (everything else is a tool id in TOOL_ROUTE_META). */
const PLAYGROUND_PAGES: ReadonlySet<string> = new Set(['hsm', 'interactive', 'cacp', 'docker'])

/** Compliance tabs the page reads from `?tab=` (useComplianceUrlState). */
const COMPLIANCE_TABS: ReadonlySet<string> = new Set(['records'])

const TOOL_PATHS: ReadonlySet<string> = new Set(TOOL_ROUTE_META.map((t) => t.path))

export function unresolvedInAppLinks(hrefs: readonly string[]): string[] {
  const problems: string[] = []
  for (const href of hrefs) {
    const url = new URL(href, 'https://hub.invalid')
    const params = url.searchParams
    const learn = /^\/learn\/([^/]+)$/.exec(url.pathname)
    if (learn) {
      const manifest = MANIFEST_BY_ID[learn[1] ?? '']
      if (!manifest) {
        problems.push(`${href}: no module ${learn[1]}`)
        continue
      }
      const section = params.get('section')
      if (section && !(manifest.learnSections ?? []).some((s) => s.id === section)) {
        problems.push(`${href}: ${manifest.id} has no section ${section}`)
      }
      const step = params.get('step')
      if (step && !((manifest.workshopSteps ?? []).length > Number(step))) {
        problems.push(`${href}: ${manifest.id} has no workshop step ${step}`)
      }
    } else if (url.pathname === '/compliance') {
      const tab = params.get('tab')
      if (tab && !COMPLIANCE_TABS.has(tab)) problems.push(`${href}: unknown compliance tab ${tab}`)
    } else if (url.pathname.startsWith('/playground/')) {
      const page = url.pathname.slice('/playground/'.length)
      if (!PLAYGROUND_PAGES.has(page) && !TOOL_PATHS.has(url.pathname)) {
        problems.push(`${href}: no playground page ${page}`)
      }
    } else {
      problems.push(`${href}: not a route this check knows`)
    }
  }
  return problems
}
