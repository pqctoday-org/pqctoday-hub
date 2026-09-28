// SPDX-License-Identifier: GPL-3.0-only
// B-3-style provenance gate for the WS-F fixtures: every pinned public NIST
// ACVP-Server file must still hash to the SHA-256 recorded next to its
// upstream commit + path. A reformat or hand edit of a single byte fails here.
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import provenance from './__fixtures__/nist-acvp-server/PROVENANCE.json'
import { FIXTURE_ROOT } from './node/fixtures'
import { identifyKnownFixture } from './evidence'

const root = path.join(process.cwd(), FIXTURE_ROOT)

describe('pinned NIST ACVP-Server fixtures', () => {
  it('pins one immutable upstream commit', () => {
    expect(provenance.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(provenance.files).toHaveLength(4)
  })

  it.each(provenance.files.map((f) => [f.local, f] as const))(
    '%s is byte-identical to the recorded upstream SHA-256',
    (_local, f) => {
      const bytes = readFileSync(path.join(root, f.local))
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(f.sha256)
      expect(f.sourceUrl).toBe(
        `https://raw.githubusercontent.com/usnistgov/ACVP-Server/${provenance.commit}/${f.upstreamPath}`
      )
    }
  )

  it('recognises a pinned prompt by hash and nothing else', () => {
    const prompt = provenance.files.find((f) =>
      f.local.endsWith('ML-DSA-sigVer-FIPS204/prompt.json')
    )
    expect(identifyKnownFixture(prompt!.sha256)).toEqual({
      repository: 'https://github.com/usnistgov/ACVP-Server',
      commit: provenance.commit,
      upstreamPath: 'gen-val/json-files/ML-DSA-sigVer-FIPS204/prompt.json',
    })
    expect(identifyKnownFixture('0'.repeat(64))).toBeNull()
  })
})
