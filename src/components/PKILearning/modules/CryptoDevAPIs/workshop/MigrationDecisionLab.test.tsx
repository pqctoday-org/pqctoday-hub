// SPDX-License-Identifier: GPL-3.0-only
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
})
