// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { LibraryEnrichment } from './enrichmentParse'
import { dropSupersededAliases, timelineCurrentLabels } from './timelineEnrichmentAliases'

const e = (mainTopic: string) => ({ mainTopic }) as unknown as LibraryEnrichment

const CSV = `Country,OrgName,Title,event_id
Singapore,MAS,MAS advisory,sg-mas
Germany,BSI,Archive-only row,de-bsi
`

describe('timelineCurrentLabels', () => {
  it('builds the pipeline key from the raw columns', () => {
    expect([...timelineCurrentLabels(CSV)]).toEqual([
      'Singapore:MAS — MAS advisory',
      'Germany:BSI — Archive-only row',
    ])
  })
})

describe('dropSupersededAliases', () => {
  const aliases = {
    'sg-mas': ['Singapore:MAS — Old title', 'Singapore:MAS — MAS advisory'],
    'de-bsi': ['Germany:BSI — Archive-only row', 'Germany:BSI — Older name'],
  }
  const current = timelineCurrentLabels(CSV)

  it('drops an old-label entry when the row has a current-label entry', () => {
    const out = dropSupersededAliases(
      {
        'Singapore:MAS — Old title': e('invented 2028 deadline'),
        'Singapore:MAS — MAS advisory': e('guidance'),
      },
      aliases,
      current
    )
    expect(Object.keys(out)).toEqual(['Singapore:MAS — MAS advisory'])
  })

  it('keeps an old-label entry that is the only one the row has (the fallback)', () => {
    const merged = { 'Germany:BSI — Older name': e('only copy') }
    expect(dropSupersededAliases(merged, aliases, current)).toEqual(merged)
  })

  it('leaves entries of rows without aliases alone', () => {
    const merged = { 'France:ANSSI — Something': e('x') }
    expect(dropSupersededAliases(merged, aliases, current)).toEqual(merged)
  })
})
