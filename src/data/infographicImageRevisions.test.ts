// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { INFOGRAPHIC_IMAGE_REVISIONS } from './infographicImageRevisions'

it('invalidates the browser image cache whenever a reviewed asset changes', () => {
  for (const [id, revision] of Object.entries(INFOGRAPHIC_IMAGE_REVISIONS)) {
    const bytes = readFileSync(`public/images/infographics/pqcstd_${id}.png`)
    expect(createHash('sha256').update(bytes).digest('hex').slice(0, 16), id).toBe(revision)
  }
})
