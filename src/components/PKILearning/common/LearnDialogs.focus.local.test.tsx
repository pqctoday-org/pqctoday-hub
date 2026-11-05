// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CuriousSummaryBanner } from './CuriousSummaryBanner'
import { ModuleCompletionCard } from '../ModuleCompletionCard'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'

function CompletionExample() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Complete sample module</Button>
      <Button>Outside control</Button>
      {open && (
        <ModuleCompletionCard
          title="Sample module"
          belt={{ name: 'White Belt', color: 'white', textColor: 'black' }}
          score={0}
          pointsToNextBelt={1}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

describe('Learn modal keyboard boundaries', () => {
  it.each(['pqc-101', 'crypto-agility', 'tls-basics'])(
    'contains infographic focus and restores its %s trigger on Escape',
    async (moduleId) => {
      usePersonaStore.setState({ experienceLevel: 'curious', selectedPersona: 'curious' })
      render(
        <>
          <Button>Outside control</Button>
          <CuriousSummaryBanner moduleId={moduleId} />
        </>
      )
      const user = userEvent.setup()
      const trigger = screen.getAllByRole('button', { name: 'View infographic full size' })[0]
      await user.click(trigger)
      const dialog = screen.getByRole('dialog', { name: 'Infographic full view' })
      await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))
      for (let i = 0; i < 3; i++) {
        await user.tab()
        expect(dialog).toContainElement(document.activeElement as HTMLElement)
      }
      await user.tab({ shift: true })
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      await waitFor(() => expect(trigger).toHaveFocus())
      await user.click(trigger)
      const reopened = screen.getByRole('dialog', { name: 'Infographic full view' })
      await user.click(
        within(reopened).getAllByRole('button', { name: 'Close infographic' }).at(-1)!
      )
      await waitFor(() => expect(trigger).toHaveFocus())
    }
  )

  it('keeps completion focus inside, then returns it to the completing control', async () => {
    render(<CompletionExample />)
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Complete sample module' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Module complete' })
    expect(within(dialog).getByRole('button', { name: 'Keep going' })).toHaveFocus()
    await user.tab()
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.tab({ shift: true })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Keep going' }))
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
