// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { BUSINESS_TOOLS } from './businessToolsRegistry'

describe('CBOM tool repeatability reader scope', () => {
  it('preserves the tool identity and teaches coverage/freshness limits instead of an accuracy lifetime', () => {
    const tool = BUSINESS_TOOLS.find((item) => item.id === 'crypto-cbom-builder')
    expect(tool).toBeDefined()
    expect(tool!.goodAnswer).toMatch(/regenerate repeatably/)
    expect(tool!.goodAnswer).toMatch(/source coverage/)
    expect(tool!.goodAnswer).toMatch(/input freshness/)
    expect(tool!.goodAnswer).toMatch(/reconciliation with the scoped inventory/)
    expect(tool!.goodAnswer).toMatch(/generation alone does not establish completeness/)
    expect(tool!.goodAnswer).not.toMatch(/accurate for a week|accurate for as long/i)
  })
})
