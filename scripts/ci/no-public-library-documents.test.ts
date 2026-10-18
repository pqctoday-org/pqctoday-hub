// SPDX-License-Identifier: AGPL-3.0-only
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const PUBLIC_LIBRARY = path.resolve(process.cwd(), 'public/library')

describe('third-party library publication policy', () => {
  it('publishes official URLs and extractions, never copied source documents', () => {
    expect(readdirSync(PUBLIC_LIBRARY, { recursive: true }).sort()).toEqual(['manifest.json'])
  })
})
