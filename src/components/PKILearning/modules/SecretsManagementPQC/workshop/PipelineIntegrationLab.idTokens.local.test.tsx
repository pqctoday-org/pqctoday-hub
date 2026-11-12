// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PipelineIntegrationLab } from './PipelineIntegrationLab'

it('renders the paired GitLab issuer/claims setup and ID-token job, retaining other pipeline examples', () => {
  render(<PipelineIntegrationLab />)
  expect(screen.queryByText('Disposable Vault Fixture Setup')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'GitLab CI' }))
  expect(screen.getByText('Disposable Vault Fixture Setup')).toBeVisible()
  expect(screen.getByText(/live GitLab issuance and discovery were/)).toHaveTextContent(
    'not tested by that fixture'
  )
  expect(
    screen.getByText(
      (_, e) =>
        e?.tagName === 'DIV' && e?.textContent?.startsWith('# GitLab 17+ ID tokens;') === true
    )
  ).toHaveTextContent('VAULT_ID_TOKEN')
  expect(screen.queryByText(/CI_JOB_JWT_V2/)).not.toBeInTheDocument()
  expect(
    screen.getByText(
      'RS256 (GitLab ID tokens); evaluate provider and Vault support before a PQC transition'
    )
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'GitHub Actions' }))
  expect(screen.queryByText('Disposable Vault Fixture Setup')).not.toBeInTheDocument()
  expect(screen.getByText(/OIDC \+ Vault JWT Auth/)).toBeVisible()
})
