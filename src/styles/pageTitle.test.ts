// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * One page-title style (owner decision 26 Nov 2026): 20px bold on phones, 36px bold from 768px up,
 * Fredoka, on every page except the Home and Sponsor heroes. The size lives in one CSS class and the
 * pages that set their own H1 only name that class.
 */

const ROOT = path.resolve(__dirname, '../..')
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')

describe('page-title style', () => {
  const css = read('src/styles/index.css')

  it('is 20px / 700 Fredoka on phones and 36px from 768px up', () => {
    const base = css.match(/\.page-title\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(base).toMatch(/font-family:\s*var\(--font-display\)/)
    expect(base).toMatch(/font-size:\s*20px/)
    expect(base).toMatch(/font-weight:\s*700/)
    const wide =
      css.match(/@media \(min-width: 768px\)\s*\{\s*\.page-title\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(wide).toMatch(/font-size:\s*36px/)
  })

  // The shared header and every page that sets its own H1 (Hero pages Home and Sponsor are not here).
  const PAGES: Array<[string, RegExp]> = [
    ['src/components/common/PageHeader.tsx', /<h1 className="page-title /],
    ['src/components/Terms/TermsView.tsx', /<h1 className="page-title">Terms/],
    ['src/components/Changelog/ChangelogView.tsx', /<h1 className="page-title">Changelog/],
    ['src/components/FAQ/FAQPage.tsx', /<h1 className="page-title">/],
    ['src/components/Revisions/RevisionsView.tsx', /<h1 className="page-title">Content/],
    [
      'src/components/Editorial/EditorialIndependenceView.tsx',
      /<h1 className="page-title">Editorial/,
    ],
    ['src/components/Playground/PlaygroundWorkshop.tsx', /<h1 className="page-title">/],
    ['src/components/Playground/InteractivePlayground.tsx', /<h1 className="page-title /],
    ['src/components/Simulation/SimulationView.tsx', /<h1 className="page-title /],
    ['src/components/PKILearning/common/ModuleShell.tsx', /<h1 className="page-title">/],
    ['src/components/PKILearning/modules/Quiz/QuizIntro.tsx', /<h1 className="page-title /],
    ['src/components/NotFound/NotFoundView.tsx', /<h1 className="page-title /],
    // The phone screens, the persona boards and the role chooser (owner decision, 26 Nov 2026).
    ['src/components/Mobile/screens/MobileHomeBoard.tsx', /<h1 className="page-title/],
    ['src/components/Mobile/screens/MobileModuleShell.tsx', /<h1 className="page-title"/],
    ['src/components/Mobile/screens/MobileAssessView.tsx', /<h1 className="page-title"/],
    ['src/components/Mobile/screens/MobileTimelineView.tsx', /<h1 className="page-title"/],
    ['src/components/Mobile/screens/MobileProtocolMatrixView.tsx', /<h1 className="page-title"/],
    ['src/components/Mobile/screens/MobileKATValidationView.tsx', /<h1 className="page-title"/],
    ['src/components/Mobile/screens/MobileReportView.tsx', /<h1 className="page-title"/],
    ['src/components/Algorithms/AlgorithmsView.tsx', /<h1 className="page-title"/],
    ['src/components/PersonaJourney/PersonaBoardView.tsx', /<h1 className="page-title /],
    ['src/components/PersonaJourney/CuriousMobileBoard.tsx', /<h1 className="page-title /],
    ['src/components/RoleHome/RoleHomeView.tsx', /className="page-title"/],
  ]

  it.each(PAGES)('%s uses the shared class and sets no title size of its own', (file, heading) => {
    const source = read(file)
    expect(source).toMatch(heading)
    // No H1 in the file carries its own size or weight.
    for (const h1 of source.match(/<h1\s[^>]*className="[^"]*"/g) ?? []) {
      if (/sr-only/.test(h1)) continue
      expect(h1, `${file}: ${h1}`).not.toMatch(/\btext-(\[\d+px\]|xs|sm|base|lg|xl|[2-9]xl)\b/)
      expect(h1, `${file}: ${h1}`).not.toMatch(/\bfont-(bold|extrabold|semibold|medium)\b/)
    }
  })

  it('leaves the Home and Sponsor heroes to their own Hero style', () => {
    expect(read('src/components/Sponsor/SponsorView.tsx')).not.toMatch(/<h1 className="page-title/)
  })
})
