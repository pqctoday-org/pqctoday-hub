// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DESKTOP_ONLY_WORKSHOP_LABEL,
  relabelWorkshopEntries,
  useDesktopOnlyWorkshopEntries,
  workshopLinkTarget,
  workshopRunsOnPhone,
} from './desktopOnlyWorkshop'

function Harness({ enabled = true, children }: { enabled?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useDesktopOnlyWorkshopEntries(ref, enabled, 'cc-eucc-certification')
  return <div ref={ref}>{children}</div>
}

describe('workshopRunsOnPhone', () => {
  it('is true for a module whose real workshop mounts in the phone shell', () => {
    expect(workshopRunsOnPhone('hsm-pqc')).toBe(true)
  })

  it('is true for a module with a phone-capable twin tool', () => {
    expect(workshopRunsOnPhone('tls-basics')).toBe(true)
  })

  it('is false for the certification modules and for an unknown id', () => {
    expect(workshopRunsOnPhone('cc-eucc-certification')).toBe(false)
    expect(workshopRunsOnPhone('fips-140-3-certification')).toBe(false)
    expect(workshopRunsOnPhone('not-a-real-module')).toBe(false)
  })
})

describe('workshopLinkTarget', () => {
  it('names the module a ?tab=workshop link opens', () => {
    expect(workshopLinkTarget('/learn/hsm-pqc?tab=workshop&step=0', 'x')).toBe('hsm-pqc')
  })

  it('reads a bare ?tab=workshop as the current module', () => {
    expect(workshopLinkTarget('?tab=workshop', 'cc-eucc-certification')).toBe(
      'cc-eucc-certification'
    )
  })

  it('ignores links that do not open a workshop', () => {
    expect(workshopLinkTarget('/learn/hsm-pqc', 'x')).toBeNull()
    expect(workshopLinkTarget('/learn/hsm-pqc?tab=references', 'x')).toBeNull()
    expect(workshopLinkTarget('/playground/hsm', 'x')).toBeNull()
  })
})

describe('relabelWorkshopEntries', () => {
  it('hides a generic Start Workshop button and shows the caption in its place', () => {
    const root = document.createElement('div')
    root.innerHTML = '<button>Start Workshop</button>'
    relabelWorkshopEntries(root, 'cc-eucc-certification')
    const button = root.querySelector('button') as HTMLButtonElement
    expect(button.style.display).toBe('none')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(root.textContent).toContain(DESKTOP_ONLY_WORKSHOP_LABEL)
  })

  it('keeps the words of a named workshop button, dims it and adds the caption after it', () => {
    const root = document.createElement('div')
    root.innerHTML = '<button>Topology Builder (Workshop Step 1)</button>'
    relabelWorkshopEntries(root, 'cc-eucc-certification')
    const button = root.querySelector('button') as HTMLButtonElement
    expect(button.style.display).not.toBe('none')
    expect(button.style.pointerEvents).toBe('none')
    expect(button.tabIndex).toBe(-1)
    expect(button.nextElementSibling?.textContent).toBe(DESKTOP_ONLY_WORKSHOP_LABEL)
  })

  it('leaves buttons that do not mention the workshop alone', () => {
    const root = document.createElement('div')
    root.innerHTML = '<button>Mark as read</button><button>Open the exercise</button>'
    relabelWorkshopEntries(root, 'cc-eucc-certification')
    expect(root.textContent).not.toContain(DESKTOP_ONLY_WORKSHOP_LABEL)
  })

  it('relabels a workshop link into a module that cannot run it, and keeps one into a module that can', () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<a href="/learn/fips-140-3-certification?tab=workshop&step=1">the lab step</a>' +
      '<a href="/learn/hsm-pqc?tab=workshop&step=0">the HSM step</a>'
    relabelWorkshopEntries(root, 'cc-eucc-certification')
    const [certLink, hsmLink] = Array.from(root.querySelectorAll('a'))
    expect(certLink.getAttribute('aria-disabled')).toBe('true')
    expect(certLink.nextElementSibling?.textContent).toBe(DESKTOP_ONLY_WORKSHOP_LABEL)
    expect(hsmLink.getAttribute('aria-disabled')).toBeNull()
    expect(hsmLink.nextElementSibling).toBeNull()
  })

  it('is safe to run twice (one caption per entry point)', () => {
    const root = document.createElement('div')
    root.innerHTML = '<button>Start Workshop</button>'
    relabelWorkshopEntries(root, 'cc-eucc-certification')
    relabelWorkshopEntries(root, 'cc-eucc-certification')
    expect(root.querySelectorAll('[data-desktop-only-workshop-note]')).toHaveLength(1)
  })
})

describe('useDesktopOnlyWorkshopEntries', () => {
  it('relabels the rendered entry point and does nothing when disabled', () => {
    const { unmount } = render(
      <Harness>
        <Button>Start Workshop</Button>
      </Harness>
    )
    expect(screen.getByText(DESKTOP_ONLY_WORKSHOP_LABEL)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start Workshop' })).not.toBeInTheDocument()
    unmount()

    render(
      <Harness enabled={false}>
        <Button>Start Workshop</Button>
      </Harness>
    )
    expect(screen.queryByText(DESKTOP_ONLY_WORKSHOP_LABEL)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Workshop' })).toBeInTheDocument()
  })

  it('relabels an entry point that mounts later, such as a section the reader opens', async () => {
    function Later() {
      const [open, setOpen] = useState(false)
      return (
        <Harness>
          <Button onClick={() => setOpen(true)}>Open section</Button>
          {open ? <Button>Start Workshop</Button> : null}
        </Harness>
      )
    }
    render(<Later />)
    expect(screen.queryByText(DESKTOP_ONLY_WORKSHOP_LABEL)).not.toBeInTheDocument()
    await act(async () => {
      screen.getByRole('button', { name: 'Open section' }).click()
      await Promise.resolve()
    })
    expect(screen.getByText(DESKTOP_ONLY_WORKSHOP_LABEL)).toBeInTheDocument()
  })

  it('puts everything back when it is switched off', () => {
    const { rerender } = render(
      <Harness>
        <Button>Start Workshop</Button>
      </Harness>
    )
    expect(screen.getByText(DESKTOP_ONLY_WORKSHOP_LABEL)).toBeInTheDocument()
    rerender(
      <Harness enabled={false}>
        <Button>Start Workshop</Button>
      </Harness>
    )
    expect(screen.queryByText(DESKTOP_ONLY_WORKSHOP_LABEL)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Workshop' })).toBeVisible()
  })
})
