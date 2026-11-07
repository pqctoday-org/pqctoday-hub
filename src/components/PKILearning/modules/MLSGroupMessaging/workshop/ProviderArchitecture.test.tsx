// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProviderArchitecture } from './ProviderArchitecture'

describe('ProviderArchitecture software-token custody', () => {
  it('separates what the interface returns from where the key bytes live', () => {
    render(<ProviderArchitecture />)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/never\s+exist in process memory/i)
    expect(text).not.toMatch(/genuinely HSM-backed/i)
    expect(text).toMatch(/never\s+receives the raw private-key bytes/i)
    expect(text).toMatch(
      /software module \(softhsmv3\) loaded as a library\s+into the same process/i
    )
    expect(text).toMatch(/key bytes still exist in that process/i)
  })

  it('names what a production HSM must demonstrate separately', () => {
    render(<ProviderArchitecture />)
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/tamper resistance/i)
    expect(text).toMatch(/isolation of key material from the host/i)
    expect(text).toMatch(/assurance evidence/i)
  })
})
