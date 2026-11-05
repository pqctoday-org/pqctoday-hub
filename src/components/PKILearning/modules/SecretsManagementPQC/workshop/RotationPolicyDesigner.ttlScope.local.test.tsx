// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { RotationPolicyDesigner } from './RotationPolicyDesigner'
import { ROTATION_POLICIES } from '../data/secretsConstants'
vi.mock('../data/secretsConstants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/secretsConstants')>()
  return { ...actual, ROTATION_POLICIES: structuredClone(actual.ROTATION_POLICIES) }
})
const originals = structuredClone(ROTATION_POLICIES)
beforeEach(() => {
  ROTATION_POLICIES.splice(0, ROTATION_POLICIES.length, ...structuredClone(originals))
})
const selectTtl = (type: string, value: string) => {
  fireEvent.click(screen.getByRole('button', { name: `TTL for ${type}` }))
  fireEvent.click(screen.getByRole('option', { name: value }))
}
const rowFor = (type: string) => screen.getByRole('row', { name: (name) => name.startsWith(type) })

describe('illustrative rotation TTL comparisons', () => {
  it.each([
    { type: 'API Keys & Access Tokens', below: '90 days', equal: '180 days', above: '1 year' },
    { type: 'Database Credentials', below: '8 hours', equal: '1 day', above: '7 days' },
    { type: 'TLS Certificates', below: '60 days', equal: '90 days', above: '180 days' },
    { type: 'Data Encryption Keys (DEKs)', below: '60 days', equal: '90 days', above: '180 days' },
  ])(
    'uses the displayed maximum consistently for $type at/below/above its boundary',
    ({ type, below, equal, above }) => {
      render(<RotationPolicyDesigner />)
      selectTtl(type, below)
      expect(within(rowFor(type)).getByText('Within sample limit')).toBeInTheDocument()
      selectTtl(type, equal)
      expect(within(rowFor(type)).getByText('Within sample limit')).toBeInTheDocument()
      selectTtl(type, above)
      expect(within(rowFor(type)).getByText('Exceeds sample limit')).toBeInTheDocument()
      expect(screen.getByText('TTL Exceeds Sample Policy Limit')).toBeInTheDocument()
    }
  )
  it('does not warn that the displayed two-year signing maximum exceeds itself', () => {
    render(<RotationPolicyDesigner />)
    selectTtl('Code Signing Keys', '2 years')
    expect(within(rowFor('Code Signing Keys')).getByText('Within sample limit')).toBeInTheDocument()
  })
  it('compares an above-two-year signing fixture without inventing an additional UI choice', () => {
    ROTATION_POLICIES.find((p) => p.id === 'signing-key-rotation')!.ttl = '3 years'
    render(<RotationPolicyDesigner />)
    expect(
      within(rowFor('Code Signing Keys')).getByText('Exceeds sample limit')
    ).toBeInTheDocument()
    expect(within(rowFor('Code Signing Keys')).getByText('Selected: 3 years')).toBeInTheDocument()
  })
  it('retains the numeric hour multiplier in a labelled four-hour sample-boundary fixture', () => {
    const policy = ROTATION_POLICIES.find((p) => p.id === 'db-credential-rotation')!
    policy.maxTTL = '4 hours' // Fixture boundary; not a new production-policy recommendation.
    policy.ttl = '8 hours'
    render(<RotationPolicyDesigner />)
    expect(
      within(rowFor('Database Credentials')).getByText('Exceeds sample limit')
    ).toBeInTheDocument()
    selectTtl('Database Credentials', '1 hour')
    expect(
      within(rowFor('Database Credentials')).getByText('Within sample limit')
    ).toBeInTheDocument()
  })
  it('keeps the mixed OAuth objects unassessed even after a single current TTL is selected', () => {
    render(<RotationPolicyDesigner />)
    expect(
      within(rowFor('OAuth Signing Keys (JWKs)')).getByText('Comparison not assessed')
    ).toBeInTheDocument()
    selectTtl('OAuth Signing Keys (JWKs)', '1 day')
    expect(
      within(rowFor('OAuth Signing Keys (JWKs)')).getByText('Comparison not assessed')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/This sample mixes token and signing-key lifetimes/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/All assessed TTLs within sample limits/)).not.toBeInTheDocument()
  })
  it('does not manufacture a comparison from a missing or malformed maximum', () => {
    ROTATION_POLICIES.find((p) => p.id === 'api-key-rotation')!.maxTTL = ''
    ROTATION_POLICIES.find((p) => p.id === 'db-credential-rotation')!.maxTTL = 'indefinite'
    render(<RotationPolicyDesigner />)
    expect(
      within(rowFor('API Keys & Access Tokens')).getByText('Comparison not assessed')
    ).toBeInTheDocument()
    expect(
      within(rowFor('Database Credentials')).getByText('Comparison not assessed')
    ).toBeInTheDocument()
  })
  it('keeps an explicit zero duration distinct from a missing input', () => {
    const policy = ROTATION_POLICIES.find((p) => p.id === 'db-credential-rotation')!
    policy.ttl = '0 hours'
    policy.maxTTL = '0 hours'
    render(<RotationPolicyDesigner />)
    expect(
      within(rowFor('Database Credentials')).getByText('Within sample limit')
    ).toBeInTheDocument()
  })
  it('keeps the selected TTL in the YAML preview and labels the draft unvalidated', () => {
    render(<RotationPolicyDesigner />)
    selectTtl('API Keys & Access Tokens', '180 days')
    fireEvent.click(screen.getByRole('button', { name: 'View Unvalidated YAML Draft' }))
    expect(screen.getByText(/ttl: "180 days"/)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Sample TTL comparisons do not validate the requirements or provider configuration below/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('Illustrative Rotation Policy Draft — Not Validated')
    ).toBeInTheDocument()
  })
})
