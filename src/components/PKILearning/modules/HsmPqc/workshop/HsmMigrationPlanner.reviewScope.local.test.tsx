// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HsmMigrationPlanner } from './HsmMigrationPlanner'

vi.mock('../data/hsmConstants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/hsmConstants')>()
  return {
    ...actual,
    FIRMWARE_UPGRADE_PATHS: [
      {
        ...actual.FIRMWARE_UPGRADE_PATHS[0],
        pqcAlgorithmsAdded: ['UNSUPPORTED-SAMPLE-ALGORITHM'],
      },
    ],
  }
})

describe('Migration planning review scope', () => {
  it('acknowledging every topic does not validate an unsupported algorithm or module', () => {
    render(<HsmMigrationPlanner />)
    fireEvent.click(screen.getByRole('button', { name: /Validation Planning/ }))
    expect(screen.getByText('UNSUPPORTED-SAMPLE-ALGORITHM')).toBeInTheDocument()
    const topics = screen.getAllByRole('button', { name: /^Review topic:/ })
    for (const topic of topics) fireEvent.click(topic)
    expect(screen.getByText('Planning review complete')).toBeInTheDocument()
    expect(
      screen.getByText(/does not establish that an algorithm or module is validated/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Validation Complete')).not.toBeInTheDocument()
    fireEvent.click(topics[0])
    expect(screen.getByText('Planning review in progress')).toBeInTheDocument()
  })
})
