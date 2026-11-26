// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { LearnStepper, type LearnStep } from './LearnStepper'
import { LEARN_SECTIONS } from './moduleData'
import { useModuleStore } from '@/store/useModuleStore'

const MODULE_ID = 'pqc-business-case'
const sections = LEARN_SECTIONS[MODULE_ID]

const steps: LearnStep[] = sections.map((s) => ({
  id: s.id,
  label: s.label,
  content: <p>{`body of ${s.id}`}</p>,
}))

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <LearnStepper steps={steps} />
    </MemoryRouter>
  )

describe('LearnStepper sections', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders every section as a scroll target and no floating step bar', () => {
    renderAt(`/learn/${MODULE_ID}`)
    expect(sections.length).toBeGreaterThan(1)
    for (const s of sections) {
      expect(document.querySelector(`[data-section-id="${s.id}"]`)).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: /^Jump to section/ })).not.toBeInTheDocument()
    expect(document.querySelector('.sticky')).toBeNull()
  })

  it('still scrolls to a deep-linked section', async () => {
    const target = sections[sections.length - 1].id
    const spy = vi.fn()
    Element.prototype.scrollIntoView = spy
    renderAt(`/learn/${MODULE_ID}?section=${target}`)
    await vi.waitFor(() => expect(spy).toHaveBeenCalled())
  })

  it('keeps the whole-lesson completion control working', async () => {
    renderAt(`/learn/${MODULE_ID}`)
    await userEvent.click(screen.getByRole('button', { name: /Mark as Read/ }))
    const checks = useModuleStore.getState().modules[MODULE_ID]?.learnSectionChecks ?? {}
    for (const s of sections) expect(checks[s.id]).toBe(true)
  })
})
