// SPDX-License-Identifier: AGPL-3.0-only
import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { CbomIntroduction } from './components/CbomIntroduction'

it('distinguishes released CycloneDX CBOM support from SPDX work in progress', () => {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <CbomIntroduction />
      </MemoryRouter>
    </EmbedProvider>
  )
  const text = (document.body.textContent ?? '').replace(/\s+/g, ' ')
  expect(text).toMatch(/CycloneDX.*ECMA-424.*current spec v1\.7/)
  expect(text).toMatch(
    /Released SPDX 3\.0\.1 has no comparable dedicated cryptographic-asset model/
  )
  expect(text).toMatch(/SPDX 3\.1 work is still a release candidate/)
  expect(text).toMatch(/separate community list rather than a released CBOM schema/)
})
