// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { VIEW_CITED_SOURCE_IDS, type CitedView } from './generated/viewSourceCitations.generated'
import { authoritativeSources, getSourcesForView } from './authoritativeSourcesData'
import { getSourcesForView as getTrustedForView, trustedSources } from './trustedSourcesData'
import { libraryData } from './libraryData'
import { threatsData } from './threatsData'
import { complianceFrameworks } from './complianceData'
import { timelineData } from './timelineData'
import { softwareData } from './migrateData'
import { loadPQCAlgorithmsData } from './pqcAlgorithmsData'
import { DATA_FILENAMES } from './generated/dataFilenames.generated'

const ids = (list: (string | undefined)[]) =>
  [...new Set(list.map((s) => (s ?? '').trim()).filter(Boolean))].sort()

describe('each page lists the sources its active records cite', () => {
  it("Library, Threats, Compliance, Migrate and Algorithms equal the loaders' own cited ids", async () => {
    const algorithms = await loadPQCAlgorithmsData()
    const fromLoaders: Partial<Record<CitedView, string[]>> = {
      Library: ids(libraryData.map((i) => i.trustedSourceId)),
      Threats: ids(threatsData.map((t) => t.trustedSourceId)),
      Compliance: ids(complianceFrameworks.map((f) => f.trustedSourceId)),
      Algorithms: ids(algorithms.map((a) => a.trustedSourceId)),
    }
    for (const [view, expected] of Object.entries(fromLoaders)) {
      expect(VIEW_CITED_SOURCE_IDS[view as CitedView], view).toEqual(expected)
    }
  })

  it('Timeline equals the ids of the timeline events the page shows', () => {
    const shown = timelineData.flatMap((c) =>
      c.bodies.flatMap((b) => b.events.map((e) => e.trustedSourceId))
    )
    expect(VIEW_CITED_SOURCE_IDS.Timeline).toEqual(ids(shown))
  })

  // The Migrate and Leaders loaders do not carry trusted_source_id onto their records, so these two
  // pages are compared with the file's own active rows (the loaders' filter is status active or blank).
  const activeRows = (file: string | null | undefined) => {
    expect(file).toBeTruthy()
    const { data } = Papa.parse<Record<string, string>>(
      readFileSync(join(process.cwd(), 'src/data', file as string), 'utf8'),
      { header: true, skipEmptyLines: true }
    )
    return data.filter((r) => !r.status || r.status === 'active')
  }

  it('Leaders equals the ids of the active rows of the leaders file', () => {
    const active = activeRows(DATA_FILENAMES.leaders)
    expect(VIEW_CITED_SOURCE_IDS.Leaders).toEqual(ids(active.map((r) => r.trusted_source_id)))
  })

  it('Migrate equals the ids of the active rows of the product catalogue, one row per listed product', () => {
    const active = activeRows(DATA_FILENAMES.migrate)
    expect(active).toHaveLength(softwareData.length)
    expect(VIEW_CITED_SOURCE_IDS.Migrate).toEqual(ids(active.map((r) => r.trusted_source_id)))
  })

  it('the listed registry sources are exactly the ones whose id a page cites', () => {
    for (const view of Object.keys(VIEW_CITED_SOURCE_IDS) as CitedView[]) {
      const cited = new Set(VIEW_CITED_SOURCE_IDS[view])
      const trusted = getTrustedForView(view).map((s) => s.sourceId)
      expect(trusted.sort(), view).toEqual(
        trustedSources
          .filter((s) => cited.has(s.sourceId))
          .map((s) => s.sourceId)
          .sort()
      )
      const listed = getSourcesForView(view)
      for (const s of listed) {
        expect(
          cited.has(s.id ?? '') || cited.has(s.trustedSourceId ?? ''),
          `${view}: ${s.id}`
        ).toBe(true)
      }
      for (const s of authoritativeSources) {
        const isCited = cited.has(s.id ?? '') || cited.has(s.trustedSourceId ?? '')
        expect(listed.includes(s), `${view}: ${s.id}`).toBe(isCited)
      }
    }
  })

  it('Patents keeps its registry flag, because patent records carry no trusted_source_id', () => {
    expect(getSourcesForView('Patents').map((s) => s.id)).toContain('uspto-patent-public-search')
  })
})
