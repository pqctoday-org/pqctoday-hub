// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileMigrateView } from './MobileMigrateView'

describe('phone catalogue supplier identity', () => {
  it.each([
    ['ankatech-ankasecure', 'ANKATech Solutions Inc.', 'https://www.ankatech.co'],
    ['patero-pqc-gateway', 'Patero Inc.', 'https://www.patero.io'],
    ['american-binary-ambit-client', 'American Binary', 'https://www.ambit.inc'],
  ])(
    'shows the documented supplier for %s independently of roadmap availability',
    (id, name, url) => {
      render(
        <MemoryRouter initialEntries={[`/migrate?tab=plan&open=${id}`]}>
          <MobileMigrateView />
        </MemoryRouter>
      )
      const sheet = screen.getByTestId('migrate-product-detail-sheet')
      const section = within(sheet).getByRole('region', { name: 'Supplier' })
      const link = within(section).getByRole('link', { name })
      expect(link).toHaveAttribute('href', url)
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveClass('min-h-11')
      expect(section).not.toHaveTextContent(/Bank for International Settlements|Prestige Systems/)
    }
  )
})
