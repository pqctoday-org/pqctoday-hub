// SPDX-License-Identifier: AGPL-3.0-only
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  Chip,
  Eyebrow,
  EyebrowPill,
  StatusChip,
  StepBar,
  StickerCard,
  StoryButton,
  StoryInput,
  StoryRow,
  StoryTextarea,
  statusWord,
  type StatusKind,
} from './index'

describe('StickerCard and StoryRow', () => {
  it('draws the sticker card: ink outline, large radius, offset edge, card fill', () => {
    render(<StickerCard data-testid="c">hello</StickerCard>)
    const el = screen.getByTestId('c')
    for (const cls of [
      'border-2',
      'border-ink',
      'rounded-3xl',
      'bg-card',
      'shadow-[0_6px_0_hsl(var(--edge))]',
    ])
      expect(el.className).toContain(cls)
  })

  it('takes the highlight tone and a different element', () => {
    render(
      <StickerCard as="section" tone="highlight" aria-label="In focus" data-testid="c">
        x
      </StickerCard>
    )
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('SECTION')
    expect(el.className).toContain('bg-highlight')
    expect(el.className).toContain('border-highlight-border')
  })

  it('lets a caller class override a utility (merged, not duplicated)', () => {
    render(
      <StickerCard className="p-2" data-testid="c">
        x
      </StickerCard>
    )
    const cls = screen.getByTestId('c').className.split(/\s+/)
    expect(cls).toContain('p-2')
    expect(cls).not.toContain('p-5')
  })

  it('draws the row: thin border, 16px corners, no offset edge', () => {
    render(<StoryRow data-testid="r">row</StoryRow>)
    const el = screen.getByTestId('r')
    expect(el.className).toContain('border border-border')
    expect(el.className).toContain('rounded-2xl')
    expect(el.className).not.toContain('shadow')
  })
})

describe('StoryButton', () => {
  it('defaults to a primary pill with the ink outline, offset edge and a 44px minimum height', () => {
    render(<StoryButton>Continue</StoryButton>)
    const b = screen.getByRole('button', { name: 'Continue' })
    expect(b.getAttribute('type')).toBe('button')
    for (const cls of [
      'rounded-full',
      'border-2',
      'border-ink',
      'bg-primary',
      'min-h-[44px]',
      'shadow-[0_4px_0_hsl(var(--edge))]',
    ])
      expect(b.className).toContain(cls)
  })

  it('secondary has the outline and no edge; quiet has neither border nor edge and is underlined', () => {
    render(
      <>
        <StoryButton variant="secondary">Next</StoryButton>
        <StoryButton variant="quiet">Why this?</StoryButton>
      </>
    )
    const s = screen.getByRole('button', { name: 'Next' })
    expect(s.className).toContain('border-ink')
    expect(s.className).not.toContain('shadow')
    const q = screen.getByRole('button', { name: 'Why this?' })
    expect(q.className).toContain('underline')
    expect(q.className).not.toContain('border-2')
    expect(q.className).not.toContain('shadow')
  })

  it('shows the focus ring (3px, offset 2px, ring colour) and fires onClick', () => {
    const onClick = vi.fn()
    render(<StoryButton onClick={onClick}>Go</StoryButton>)
    const b = screen.getByRole('button', { name: 'Go' })
    expect(b.className).toContain('focus-visible:outline-3')
    expect(b.className).toContain('focus-visible:outline-offset-2')
    expect(b.className).toContain('focus-visible:outline-ring')
    fireEvent.click(b)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire when disabled', () => {
    const onClick = vi.fn()
    render(
      <StoryButton disabled onClick={onClick}>
        Go
      </StoryButton>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Chip and StatusChip', () => {
  it('a static chip is a plain label with no outline', () => {
    render(<Chip data-testid="c">Lesson</Chip>)
    const el = screen.getByTestId('c')
    expect(el.tagName).toBe('SPAN')
    expect(el.className).toContain('bg-chip')
    expect(el.className).toContain('rounded-full')
    expect(el.className).not.toContain('border-ink')
  })

  it('an interactive chip is a button with the 2px ink outline and a pressed state', () => {
    const onClick = vi.fn()
    render(
      <Chip onClick={onClick} pressed>
        Tools
      </Chip>
    )
    const b = screen.getByRole('button', { name: 'Tools' })
    expect(b.className).toContain('border-2')
    expect(b.className).toContain('border-ink')
    expect(b.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(b)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  const kinds = Object.keys(statusWord) as StatusKind[]
  it.each(kinds)('the %s status chip always shows its word', (status) => {
    render(<StatusChip status={status} />)
    expect(screen.getByText(statusWord[status])).toBeTruthy()
  })

  it('shows a tick with the word for Completed and accepts a custom label', () => {
    render(
      <>
        <StatusChip status="completed" data-testid="done" />
        <StatusChip status="changed" label="Changed since 12 Nov" />
      </>
    )
    expect(screen.getByTestId('done').querySelector('svg')).not.toBeNull() // the tick
    expect(screen.getByText('Completed')).toBeTruthy()
    expect(screen.getByText('Changed since 12 Nov')).toBeTruthy()
  })

  it('uses the caution pair for Not started and the highlight for In focus', () => {
    render(
      <>
        <StatusChip status="not-started" />
        <StatusChip status="in-focus" />
      </>
    )
    expect(screen.getByText('Not started').className).toContain('bg-caution')
    expect(screen.getByText('In focus').className).toContain('bg-highlight')
  })
})

describe('Eyebrow', () => {
  it('sets the label style and the pill variant', () => {
    render(
      <>
        <Eyebrow data-testid="e">Section 4 of 4</Eyebrow>
        <EyebrowPill data-testid="p">Release</EyebrowPill>
      </>
    )
    const e = screen.getByTestId('e')
    for (const cls of ['uppercase', 'font-extrabold', 'tracking-[0.14em]', 'text-heading'])
      expect(e.className).toContain(cls)
    const p = screen.getByTestId('p')
    for (const cls of ['bg-ribbon', 'border-2', 'border-ink', 'rounded-full'])
      expect(p.className).toContain(cls)
  })
})

describe('StoryInput and StoryTextarea', () => {
  it('draw an outlined card-fill field: pill when single-line, 16px corners for the text area', () => {
    render(
      <>
        <StoryInput aria-label="Ask" />
        <StoryTextarea aria-label="Comment" />
      </>
    )
    const i = screen.getByLabelText('Ask')
    const t = screen.getByLabelText('Comment')
    for (const el of [i, t]) {
      expect(el.className).toContain('border-2')
      expect(el.className).toContain('border-ink')
      expect(el.className).toContain('bg-card')
      expect(el.className).toContain('focus-visible:outline-3')
    }
    expect(i.className).toContain('rounded-full')
    expect(t.className).toContain('rounded-2xl')
  })

  it('marks an error through aria-invalid', () => {
    render(<StoryInput aria-label="Ask" aria-invalid="true" />)
    const i = screen.getByLabelText('Ask')
    expect(i.getAttribute('aria-invalid')).toBe('true')
    expect(i.className).toContain('aria-[invalid=true]:border-destructive')
  })
})

describe('StepBar', () => {
  const steps = [
    { id: 'a', label: 'Read', completed: true },
    { id: 'b', label: 'Try' },
    { id: 'c', label: 'Check' },
  ]

  it('marks the current step, ticks completed steps with the word, and numbers the rest', () => {
    render(<StepBar steps={steps} currentId="b" label="Module steps" />)
    expect(screen.getByRole('navigation', { name: 'Module steps' })).toBeTruthy()
    const current = screen.getByRole('button', { name: /Try/ })
    expect(current.getAttribute('aria-current')).toBe('step')
    expect(current.className).toContain('bg-highlight')
    expect(current.className).toContain('border-[3px]')
    const read = screen.getByRole('button', { name: /Read/ })
    expect(read.hasAttribute('aria-current')).toBe(false)
    expect(screen.getAllByText('Completed')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /Check/ }).textContent).toContain('3')
  })

  it('reports the chosen step and gives every step a 44px target', () => {
    const onSelect = vi.fn()
    render(<StepBar steps={steps} currentId="a" onSelect={onSelect} />)
    const check = screen.getByRole('button', { name: /Check/ })
    expect(check.className).toContain('min-h-[44px]')
    fireEvent.click(check)
    expect(onSelect).toHaveBeenCalledWith('c')
  })
})

describe('no hard-coded colours (addendum V1)', () => {
  it('the component sources use tokens only', () => {
    const dir = resolve(__dirname)
    const files = readdirSync(dir).filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.tsx'))
    expect(files.length).toBeGreaterThanOrEqual(7)
    for (const f of files) {
      const src = readFileSync(resolve(dir, f), 'utf8')
      expect(src, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(src, f).not.toMatch(/\brgba?\(/)
      expect(src, f).not.toMatch(/\bhsla?\(\s*\d/)
      expect(src, f).not.toMatch(/\b(?:bg|text|border)-(?:white|black)\b/)
      expect(src, f).not.toMatch(/gradient/)
    }
  })
})
