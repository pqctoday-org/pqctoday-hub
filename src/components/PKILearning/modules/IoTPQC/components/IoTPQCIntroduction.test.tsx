// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { IoTPQCIntroduction } from './IoTPQCIntroduction'
import { CNSA_2_0_BY_CLASS } from '@/data/regulatoryTimelines'

const text = () => {
  const { container } = render(
    <MemoryRouter>
      <IoTPQCIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return (container.textContent ?? '').replace(/\s+/g, ' ')
}

describe('IoTPQCIntroduction: CNSA 2.0 dates follow the shared current schedule and stay scoped to NSS', () => {
  it('gives the three current dates from the shared source, not the 2025/2030 firmware ladder', () => {
    const t = text()
    expect(t).toContain(`1 January ${CNSA_2_0_BY_CLASS[0].year}`)
    expect(t).toContain(`31 December ${CNSA_2_0_BY_CLASS[1].year}`)
    expect(t).toContain(`31 December ${CNSA_2_0_BY_CLASS[2].year}`)
    expect(t).not.toMatch(/prefer CNSA 2\.0 algorithms from 2025/)
    expect(t).not.toMatch(/exclusively by 2030/)
  })

  it('keeps national-security-system applicability, with an in-scope and an out-of-scope case', () => {
    const t = text()
    expect(t).toMatch(/national security systems only/)
    expect(t).toMatch(/not an NSA requirement there/)
    expect(t).toMatch(/in scope; the same sensor sold to a utility is not covered/)
  })

  it('does not treat raw public keys or Merkle Tree Certificates as having fixed protocol limits', () => {
    const t = text()
    expect(t).toMatch(/bound to its owner out of band/)
    expect(t).toMatch(/landmark subtrees/)
    expect(t).toMatch(/standalone form/)
    expect(t).not.toMatch(/distributed out of band — a device that is offline for months/)
  })
})
