import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * WHY THIS EXISTS (2026-09-09).
 *
 * A document id appearing twice in one enrichment sidecar is NORMAL, not a
 * defect: `enrich-docs.py --append` is the documented way to enrich in chunks
 * (`--collection X --limit 15 --skip-existing --append`), so re-enriching a
 * document writes a SECOND record rather than replacing the first. The live
 * catalog sidecar carries 122 such pairs today.
 *
 * It is correct only because of load order. `parseEnrichmentMarkdown` assigns
 * `lookup[refId] = entry` while walking sections in file order, and
 * `mergeEnrichmentFiles` does `Object.assign` across files oldest-to-newest —
 * so the LAST occurrence wins, and the June 2026 re-enrichment (avg 29.4
 * populated fields) correctly supersedes the older record (avg 19.6) in all
 * 122 cases.
 *
 * Nothing states that rule anywhere, and it is easy to get backwards. Writing
 * the cleanup in priv 3d3ae9f0 I did exactly that — carried the FIRST
 * occurrence forward, which would have silently downgraded all 122 catalog
 * documents to the thinner record. Caught only by diffing field-by-field
 * afterwards; a reviewer reading the output would have seen 122 plausible,
 * complete, wrong records.
 *
 * So this does NOT forbid duplicates — that would ban the documented workflow
 * and fail on correct data. It pins the property that actually has to hold:
 * whichever record ends up last is the newest one. A stale append, a
 * regenerated file that reorders, or another first-occurrence bug like mine
 * breaks this and nothing else would notice.
 */

const DIR = join(__dirname, 'doc-enrichments')

/**
 * EVERY generation, not the newest one.
 *
 * `mergeEnrichmentFiles` globs `./doc-enrichments/<collection>_doc_enrichments_*.md`
 * and merges ALL of them oldest-to-newest, so an old generation is still live
 * for every id a newer generation does not re-state. Checking only the newest
 * file per collection reads a scope the loader never uses: the first version of
 * this test did exactly that, and a sabotage that moved a superseded record to
 * the end of catalog_..._06062026.md passed clean, because a cleanup generation
 * dated later had become "the live one" and the 122 duplicate pairs sat in the
 * file that was no longer being looked at.
 */
function sidecars(): string[] {
  return readdirSync(DIR)
    .filter((f) => /_doc_enrichments_\d{8}(_r\d+)?\.md$/.test(f))
    .sort()
}

interface Record_ {
  id: string
  index: number
  timestamp: string
}

function records(file: string): Record_[] {
  const raw = readFileSync(join(DIR, file), 'utf8')
  const sections = raw.split(/\n(?=## )/).filter((s) => s.trimStart().startsWith('## '))
  return sections.map((s, index) => {
    const id = s
      .split('\n')[0]
      .replace(/^##\s*/, '')
      .trim()
    const ts = s.match(/\*\*Extraction Timestamp\*\*:\s*(.+)/)
    // An absent timestamp predates timestamping, so it sorts oldest.
    return { id, index, timestamp: ts ? ts[1].trim() : '' }
  })
}

describe('doc-enrichment sidecars: duplicate ids resolve to the newest record', () => {
  const files = sidecars()

  it('finds the sidecars to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const file of files) {
    it(`${file}: the last occurrence of any repeated id is its newest record`, () => {
      const byId = new Map<string, Record_[]>()
      for (const r of records(file)) {
        const list = byId.get(r.id)
        if (list) list.push(r)
        else byId.set(r.id, [r])
      }

      const inverted: string[] = []
      for (const [id, recs] of byId) {
        if (recs.length < 2) continue
        const last = recs[recs.length - 1]
        const newest = recs.reduce((a, b) => (b.timestamp > a.timestamp ? b : a))
        // Equal timestamps are fine — either record is as current as the other.
        if (last.timestamp < newest.timestamp) {
          inverted.push(
            `${id}: last occurrence (record ${last.index}, ${last.timestamp || 'no timestamp'}) ` +
              `is older than record ${newest.index} (${newest.timestamp})`
          )
        }
      }

      // The loader keeps the LAST one. If it is not the newest, the site is
      // serving superseded content for these ids and nothing else reports it.
      expect(inverted).toEqual([])
    })
  }
})
