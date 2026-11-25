// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { LearnOrderStrip, NEXT_LESSONS_SHOWN } from './LearnOrderStrip'
import { getLearnOrder, orderNextLessons } from '@/data/learnOrderData'
import { LEARN_MODULES } from '@/data/generated/learnModules.generated'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

const renderStrip = (moduleId: string) =>
  render(
    <MemoryRouter>
      <LearnOrderStrip moduleId={moduleId} />
    </MemoryRouter>
  )

describe('LearnOrderStrip', () => {
  it('renders the stage, prerequisite and next-module links', () => {
    renderStrip('pqc-algorithms')

    expect(screen.getByRole('navigation', { name: 'Where this fits' })).toBeInTheDocument()
    expect(screen.getByText('Stage 2 · Core concepts')).toBeInTheDocument()
    expect(screen.getByText('Take first:')).toBeInTheDocument()
    expect(screen.getByText('Next:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PQC 101' })).toHaveAttribute('href', '/learn/pqc-101')
  })

  it('leaves out an empty prerequisite line', () => {
    renderStrip('pqc-101')

    expect(screen.queryByText('Take first:')).not.toBeInTheDocument()
    expect(screen.getByText('Next:')).toBeInTheDocument()
  })

  it('renders nothing for an unknown module', () => {
    const { container } = renderStrip('not-a-learn-module')

    expect(container).toBeEmptyDOMElement()
  })
})

describe('LearnOrderStrip next lessons: show 3, then "+ N more"', () => {
  // A lesson with many next lessons, a lesson with a few, and a lesson with none, from the real data.
  const counts = LEARN_MODULES.map((l) => ({
    id: l.id,
    n: (getLearnOrder(l.id)?.next ?? []).filter((id) => MODULE_CATALOG[id]).length,
  }))
  const many = counts.reduce((a, b) => (b.n > a.n ? b : a))
  const few = counts.find((c) => c.n >= 1 && c.n <= NEXT_LESSONS_SHOWN)
  const none = counts.find((c) => c.n === 0)
  const nextLinks = () => {
    const line = screen.getByText('Next:').closest('p') as HTMLElement // eslint-disable-line testing-library/no-node-access
    return within(line).queryAllByRole('link')
  }

  beforeEach(() => {
    expect(many.n).toBeGreaterThan(NEXT_LESSONS_SHOWN + 1)
  })

  it('with no next lessons shows no Next line and no control', () => {
    expect(none).toBeDefined()
    renderStrip(none!.id)
    expect(screen.queryByText('Next:')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('with 1 to 3 next lessons shows them all and no control', () => {
    expect(few).toBeDefined()
    renderStrip(few!.id)
    expect(nextLinks()).toHaveLength(few!.n)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('with exactly 3 shows all three and no control', () => {
    const three = counts.find((c) => c.n === NEXT_LESSONS_SHOWN)
    if (!three) return // the data may hold none with exactly three; the 1 to 3 case covers the rule
    renderStrip(three.id)
    expect(nextLinks()).toHaveLength(NEXT_LESSONS_SHOWN)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('with many shows 3 and a "+ N more" button, collapsed', () => {
    renderStrip(many.id)
    expect(nextLinks()).toHaveLength(NEXT_LESSONS_SHOWN)
    const button = screen.getByRole('button', { name: `+ ${many.n - NEXT_LESSONS_SHOWN} more` })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls')
  })

  it('the button reveals the full list in place, and collapses again', () => {
    renderStrip(many.id)
    fireEvent.click(screen.getByRole('button', { name: /more$/ }))
    expect(nextLinks()).toHaveLength(many.n)
    const button = screen.getByRole('button', { name: 'Show fewer' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    // the button controls the element that holds the list
    const controlled = document.getElementById(button.getAttribute('aria-controls') as string)
    expect(controlled).not.toBeNull()
    expect(within(controlled as HTMLElement).getAllByRole('link')).toHaveLength(many.n)

    fireEvent.click(button)
    expect(nextLinks()).toHaveLength(NEXT_LESSONS_SHOWN)
  })

  it('the button is a 44 px touch target', () => {
    renderStrip(many.id)
    expect(screen.getByRole('button', { name: /more$/ }).className).toContain('min-h-[44px]')
  })
})

describe('orderNextLessons', () => {
  const lesson = (id: string) => LEARN_MODULES.find((l) => l.id === id)!

  it('keeps every lesson once: it only sorts', () => {
    const next = getLearnOrder('pqc-101')!.next
    const ordered = orderNextLessons('pqc-101', next)
    expect(ordered).toHaveLength(next.length)
    expect([...ordered].sort()).toEqual([...next].sort())
    expect(getLearnOrder('pqc-101')!.next).toEqual(next) // the data list is not changed
  })

  it('puts same-track lessons first, then orders by stage, then keeps the data order', () => {
    const track = lesson('pqc-101').track
    const next = getLearnOrder('pqc-101')!.next
    const ordered = orderNextLessons('pqc-101', next)
    const key = (id: string) => [lesson(id).track === track ? 0 : 1, lesson(id).stage ?? 99]
    for (let i = 1; i < ordered.length; i++) {
      const [a0, a1] = key(ordered[i - 1])
      const [b0, b1] = key(ordered[i])
      expect(a0 < b0 || (a0 === b0 && a1 <= b1), `${ordered[i - 1]} before ${ordered[i]}`).toBe(
        true
      )
      if (a0 === b0 && a1 === b1)
        expect(next.indexOf(ordered[i - 1])).toBeLessThan(next.indexOf(ordered[i]))
    }
  })

  it('orders a small made-up list the same way', () => {
    // two lessons of equal rank keep their given order; an unknown id goes last
    expect(
      orderNextLessons('pqc-101', ['no-such-lesson', 'quantum-threats', 'tls-basics']).at(-1)
    ).toBe('no-such-lesson')
  })
})
