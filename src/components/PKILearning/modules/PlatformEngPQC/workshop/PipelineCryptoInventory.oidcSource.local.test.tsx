// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PipelineCryptoInventory } from './PipelineCryptoInventory'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'
import { SIEM_QUERIES } from '../data/monitoringToolsData'

it('renders the GitHub provider RSA example and preserves the difference between an observed header and authenticated identity', () => {
  // Provider discovery and JWKS checked 2026-11-12:
  // https://token.actions.githubusercontent.com/.well-known/openid-configuration
  // https://token.actions.githubusercontent.com/.well-known/jwks
  const oidc = PIPELINE_STAGES.flatMap((stage) => stage.cryptoAssets).find(
    (asset) => asset.id === 'build-oidc'
  )!
  expect(oidc.algorithm).toBe('rsa')
  expect(oidc.keySize).toContain('RS256')
  expect(oidc.quantumVulnerable).toBe(true)
  expect(oidc.hndlRisk).toBe('none')
  render(<PipelineCryptoInventory />)
  fireEvent.click(screen.getByRole('button', { name: /CI\/CD Build/ }))
  fireEvent.click(screen.getByRole('button', { name: /CI\/CD OIDC Tokens/ }))
  expect(screen.getByText('RSA RS256 (GitHub Actions OIDC)')).toBeVisible()
  expect(screen.getByText(/GitHub Actions OIDC discovery advertises RS256/)).toHaveTextContent(
    'reading a JWT header alone does not authenticate it'
  )
  expect(screen.queryByText(/GitHub Actions OIDC and similar use ES256/)).not.toBeInTheDocument()
  const check = SIEM_QUERIES.find((query) => query.id === 'datadog-pipeline-oidc')!
  expect(check.query).toContain('An observed ES256 or RS256 token is not by itself a downgrade')
  expect(check.exampleKind).toBe('capability-requirements')
})
