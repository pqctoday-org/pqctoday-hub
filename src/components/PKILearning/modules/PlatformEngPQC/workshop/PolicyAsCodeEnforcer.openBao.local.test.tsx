// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PolicyAsCodeEnforcer } from './PolicyAsCodeEnforcer'
import { OPENBAO_KEY_CREATION_POLICY } from '../data/openBaoPolicyExamples'

it('filters the native OpenBao policy and presents its actual API target and copied ACL', () => {
  render(<PolicyAsCodeEnforcer />)
  fireEvent.click(screen.getByRole('button', { name: 'Policy Engine:' }))
  fireEvent.click(screen.getByRole('option', { name: 'OpenBao ACL' }))
  fireEvent.click(screen.getByRole('button', { name: /Restrict OpenBao Sample Key Creation/ }))
  expect(screen.getByText('OpenBao Transit key-creation API')).toBeVisible()
  expect(screen.queryByRole('button', { name: /Block Non-PQC Certificate Algorithms/ })).toBeNull()
  expect(
    screen.getByText(
      (_, e) => e?.tagName === 'PRE' && e.textContent === OPENBAO_KEY_CREATION_POLICY
    )
  ).toBeVisible()
  expect(screen.getByText(/Other attached token policies may add grants/)).toBeVisible()
})
