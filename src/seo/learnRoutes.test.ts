// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { ROUTE_META } from './routeMeta'

/** The Learn module routes, with the module each one belongs to. */
const routedModules = MANIFESTS.filter((m) => Object.hasOwn(ROUTE_META, `/learn/${m.id}`)).map(
  (manifest) => ({ manifest, meta: ROUTE_META[`/learn/${manifest.id}`]! })
)

describe('Learn module route metadata matches the module itself', () => {
  it('states the study time the module shows, in the page data search engines read', () => {
    const disagree = routedModules
      .filter(({ manifest }) => manifest.id !== 'quiz')
      .map(({ manifest, meta }) => ({
        id: manifest.id,
        module: `PT${Number.parseInt(manifest.duration, 10)}M`,
        route: String(meta.structuredData?.timeRequired),
      }))
      .filter((m) => m.module !== m.route)
    expect(disagree).toEqual([])
  })

  it('has study time on every routed module except the quiz', () => {
    const missing = routedModules
      .filter(({ manifest }) => manifest.id !== 'quiz')
      .filter(({ meta }) => typeof meta.structuredData?.timeRequired !== 'string')
      .map(({ manifest }) => manifest.id)
    expect(missing).toEqual([])
  })
})

describe('Learn module pages are listed for every module in the catalog', () => {
  it('has a page entry for every module, so none is missing from the sitemap and the saved pages', () => {
    const missing = MANIFESTS.filter((m) => !Object.hasOwn(ROUTE_META, `/learn/${m.id}`)).map(
      (m) => m.id
    )
    expect(missing).toEqual([])
  })

  it('has no page entry for a module that does not exist', () => {
    const ids = new Set(MANIFESTS.map((m) => m.id))
    const orphans = Object.keys(ROUTE_META)
      .filter((path) => path.startsWith('/learn/'))
      .map((path) => path.slice('/learn/'.length))
      .filter((id) => !ids.has(id))
    expect(orphans).toEqual([])
  })

  it('gives each module page its canonical address, a title and a description', () => {
    for (const { manifest, meta } of routedModules) {
      expect(meta.canonical).toBe(`https://www.pqctoday.com/learn/${manifest.id}`)
      expect(meta.title).toMatch(/\| PQC Today$/)
      expect(meta.description.length).toBeGreaterThan(40)
    }
  })
})

describe('the module count quoted in page copy is the real one', () => {
  // The app's own definition (landing page, About, Vision): the catalog without the quiz.
  const count = Object.keys(MODULE_CATALOG).filter((id) => id !== 'quiz').length

  it('is used in the Learn and Explore titles and descriptions', () => {
    expect(ROUTE_META['/learn']!.title).toContain(`${count} Interactive Modules`)
    expect(ROUTE_META['/learn']!.description).toContain(`${count} guided learning modules`)
    expect(ROUTE_META['/explore']!.description).toContain(`${count} learning modules`)
  })

  it('is used in the Learn course data, with the total study time of the modules', () => {
    const course = ROUTE_META['/learn']!.structuredData!
    const totalMinutes = MANIFESTS.filter((m) => m.id !== 'quiz').reduce(
      (sum, m) => sum + Number.parseInt(m.duration, 10),
      0
    )
    expect(course.numberOfCredits).toBe(count)
    expect(String(course.description).startsWith(`${count} interactive modules`)).toBe(true)
    expect(course.hasCourseInstance).toMatchObject({
      courseWorkload: `PT${Math.round(totalMinutes / 60)}H`,
    })
  })

  it('leaves no unfilled placeholder in any title or description', () => {
    const unfilled = Object.entries(ROUTE_META)
      .filter(([, meta]) => `${meta.title} ${meta.description}`.includes('{modules}'))
      .map(([path]) => path)
    expect(unfilled).toEqual([])
  })
})
