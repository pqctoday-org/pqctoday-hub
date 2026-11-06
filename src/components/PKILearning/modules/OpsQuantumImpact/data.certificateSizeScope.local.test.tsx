// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { RoleWhyItMatters } from '../../common/roleGuide'
import { OPS_GUIDE_DATA } from './data'

it('expands the existing size scenario without inventing a configured CRD ceiling or silent failure', async () => {
  const user = userEvent.setup()
  const view = render(<RoleWhyItMatters data={OPS_GUIDE_DATA} />)
  expect(screen.queryByText(/These sample sizes alone/)).not.toBeInTheDocument()
  await user.click(
    screen.getByRole('button', { name: 'Expand Certificate Rotation at Scale scenario' })
  )
  const scenario = screen.getByText(/These sample sizes alone/)
  for (const originalInput of ['500 TLS certificates', '5.5KB', '1.4KB'])
    expect(scenario).toHaveTextContent(originalInput)
  expect(scenario).toHaveTextContent(
    'do not establish a cert-manager CRD limit or a renewal failure'
  )
  expect(scenario).toHaveTextContent('measure Secret, chain, key, API and ingress constraints')
  expect(screen.queryByText(/renewal starts failing silently/)).not.toBeInTheDocument()
  await user.click(
    screen.getByRole('button', { name: 'Collapse Certificate Rotation at Scale scenario' })
  )
  expect(screen.queryByText(/These sample sizes alone/)).not.toBeInTheDocument()
  view.unmount()
})
