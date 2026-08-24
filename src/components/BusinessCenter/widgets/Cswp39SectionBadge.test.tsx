// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Cswp39SectionBadge } from './Cswp39SectionBadge'
import { CSWP39_SECTIONS } from '@/components/Compliance/cswp39Data'

// Real §3 section — no invented copy.
const section = CSWP39_SECTIONS.find((s) => s.id === 'section-3')!

describe('Cswp39SectionBadge', () => {
  // 2026-08-24 audit R4.8: the popover used to be hover/focus-only, making it
  // unreachable on a real touch device — a tap has neither. Shared by
  // desktop and mobile, so this covers both.
  it('opens the real section summary on tap, and closes on a second tap', () => {
    render(<Cswp39SectionBadge sectionRef="§3.1" subSection="Algorithm Identification" />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    const badge = screen.getByRole('button', { name: /NIST CSWP\.39 §3\.1/i })
    fireEvent.click(badge)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent(section.title)
    expect(tooltip).toHaveTextContent(section.summary)

    fireEvent.click(badge)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('opens on Enter and Space too, for keyboard users', () => {
    render(<Cswp39SectionBadge sectionRef="§3" />)
    const badge = screen.getByRole('button', { name: /NIST CSWP\.39 §3/i })
    fireEvent.keyDown(badge, { key: 'Enter' })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.keyDown(badge, { key: ' ' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it("a tap on the badge doesn't fall through to a surrounding click handler", () => {
    let outerClicks = 0
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- test-only stand-in for a real surrounding create-on-click handler (e.g. ArtifactPlaceholder), not production UI
      <div onClick={() => outerClicks++}>
        <Cswp39SectionBadge sectionRef="§3.1" />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: /NIST CSWP\.39 §3\.1/i }))
    expect(outerClicks).toBe(0)
  })
})
