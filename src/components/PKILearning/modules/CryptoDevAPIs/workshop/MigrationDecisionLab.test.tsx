// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MigrationDecisionLab } from './MigrationDecisionLab'
import { DECISION_QUESTIONS, MIGRATION_PATHS, WIZARD_RECOMMENDATIONS } from '../data/migrationData'

describe('MigrationDecisionLab wizard', () => {
  it('every wizard outcome resolves to a full path or an inline recommendation', () => {
    const ids = new Set([
      ...MIGRATION_PATHS.map((p) => p.id),
      ...WIZARD_RECOMMENDATIONS.map((r) => r.id),
    ])
    const unresolved = DECISION_QUESTIONS.flatMap((q) =>
      q.options
        .filter((o) => o.recommendation && !ids.has(o.recommendation))
        .map((o) => `${q.id}: ${o.label} -> ${o.recommendation}`)
    )
    expect(unresolved).toEqual([])
    // and every nextQuestion exists
    const qids = new Set(DECISION_QUESTIONS.map((q) => q.id))
    const dangling = DECISION_QUESTIONS.flatMap((q) =>
      q.options.filter((o) => o.nextQuestion && !qids.has(o.nextQuestion)).map((o) => o.label)
    )
    expect(dangling).toEqual([])
  })

  it('an outcome without a full path renders its recommendation and steps', () => {
    render(<MigrationDecisionLab />)
    fireEvent.click(screen.getByRole('button', { name: 'C / C++' }))
    fireEvent.click(screen.getByRole('button', { name: 'Botan' }))
    expect(screen.getByText('Recommended Migration Path')).toBeInTheDocument()
    expect(screen.getByText('Botan: Upgrade to 3.x for native PQC')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Recommended steps' })).toBeInTheDocument()
    expect(screen.queryByText('View full migration path')).not.toBeInTheDocument()
  })

  it('an outcome with a full path offers the full-path view', () => {
    render(<MigrationDecisionLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Java / Kotlin' }))
    fireEvent.click(screen.getByRole('button', { name: 'Bouncy Castle' }))
    expect(screen.getByText('Bouncy Castle: Add PQC algorithms')).toBeInTheDocument()
    expect(screen.getByText('View full migration path')).toBeInTheDocument()
  })

  it('routes Node.js 24+ through the wizard to its side-by-side Before/After diff and decision guidance', () => {
    render(<MigrationDecisionLab />)
    fireEvent.click(screen.getByRole('button', { name: 'Node.js / TypeScript' }))
    fireEvent.click(screen.getByRole('button', { name: 'Node.js 24+ (node:crypto / node:tls)' }))
    expect(
      screen.getByText('Node.js 24+: Native node:crypto ML-KEM, ML-DSA & Hybrid TLS')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /View full migration path/ }))
    expect(screen.getByText('Before (Classical)')).toBeInTheDocument()
    expect(screen.getByText('After (PQC / Hybrid)')).toBeInTheDocument()
    expect(screen.getByText(/generateKeyPairSync\('ml-kem-768'\)/)).toBeInTheDocument()
    expect(screen.getByText(/X25519MLKEM768:X25519:P-256/)).toBeInTheDocument()
    expect(screen.getByText('API Capability Shift')).toBeInTheDocument()
    expect(screen.getByText('What This Diff Proves vs. Production Checks')).toBeInTheDocument()
  })

  it.each([
    ['go-stdlib-pqc', 'crypto/mlkem', 'tls.X25519MLKEM768'],
    ['openssl-provider', 'EVP_PKEY_encapsulate', 'ML-DSA-65'],
    ['nodejs24-native', 'decapsulate(', 'ml-dsa-65'],
    ['jca-native-pqc', 'KEM.getInstance("ML-KEM")', 'Signature.getInstance("ML-DSA-65")'],
  ])(
    'core stack %s includes verified Before/After PQC API identifiers and decision guidance',
    (pathId, apiTokenA, apiTokenB) => {
      const path = MIGRATION_PATHS.find((p) => p.id === pathId)
      expect(path).toBeDefined()
      expect(path?.afterCode.code).toContain(apiTokenA)
      expect(path?.afterCode.code).toContain(apiTokenB)
      expect(path?.decisionGuidance?.apiShift).toBeTruthy()
      expect(path?.decisionGuidance?.interopAndFallback).toBeTruthy()
      expect(path?.decisionGuidance?.verificationScope).toBeTruthy()
    }
  )
})
