// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { content } from './content'

describe('crypto management lesson: ESV is its own record', () => {
  const text = JSON.stringify(content)

  it('separates ESV from both the CAVP validation and the CMVP module certificate', () => {
    expect(text).toContain(
      'ESV is a separate record from both the CAVP algorithm validation and the CMVP module certificate —'
    )
  })

  it('no longer calls ESV a CMVP submission', () => {
    expect(text).not.toContain('ESV is a separate CMVP submission')
  })
})
