// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared test utilities for the PQC Timeline App.
 *
 * Usage:
 *   import { renderWithRouter, createMockAssessmentInput } from '@/test/utils'
 */
import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── Router wrapper ────────────────────────────────────────────────────────────

interface RenderWithRouterOptions extends RenderOptions {
  /** Initial URL paths, e.g. ['/assess?step=3']. Defaults to ['/']. */
  initialEntries?: string[]
}

/**
 * Renders a component inside a MemoryRouter.
 * Eliminates the inline `<MemoryRouter>` boilerplate from component tests.
 *
 * @example
 *   const { getByText } = renderWithRouter(<AssessWizard />)
 *   const { getByText } = renderWithRouter(<AssessWizard />, { initialEntries: ['/assess?step=2'] })
 */
export function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/'], ...options }: RenderWithRouterOptions = {}
) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>, options)
}

// ── Assessment store mock factory ─────────────────────────────────────────────

import type { AssessmentInput } from '@/hooks/assessmentTypes'

/**
 * Returns a minimal valid AssessmentInput for unit tests.
 * Override specific fields by spreading partial values on top.
 *
 * @example
 *   const input = createMockAssessmentInput({ industry: 'Healthcare', migrationStatus: 'started' })
 */
export function createMockAssessmentInput(
  overrides: Partial<AssessmentInput> = {}
): AssessmentInput {
  return {
    industry: 'Technology',
    currentCrypto: ['RSA-2048'],
    dataSensitivity: ['medium'],
    complianceRequirements: [],
    migrationStatus: 'planning',
    ...overrides,
  }
}

/**
 * Returns a comprehensive AssessmentInput representing a high-risk scenario.
 * Useful for testing extended scoring paths (category scores, HNDL, HNFL, actions).
 */
export function createHighRiskAssessmentInput(
  overrides: Partial<AssessmentInput> = {}
): AssessmentInput {
  return {
    industry: 'Government & Defense',
    currentCrypto: ['RSA-2048', 'ECDSA P-256', 'SHA-256'],
    dataSensitivity: ['critical', 'high'],
    complianceRequirements: ['CNSA 2.0'],
    migrationStatus: 'not-started',
    dataRetention: ['10-25y', 'indefinite'],
    credentialLifetime: ['10-25y'],
    cryptoAgility: 'hardcoded',
    infrastructure: ['Cloud Storage', 'HSM / Hardware security modules'],
    systemCount: '200-plus',
    teamSize: '1-10',
    vendorDependency: 'heavy-vendor',
    timelinePressure: 'within-1y',
    cryptoUseCases: ['TLS/HTTPS', 'Digital signatures / code signing', 'PKI / HSPD-12'],
    ...overrides,
  }
}
