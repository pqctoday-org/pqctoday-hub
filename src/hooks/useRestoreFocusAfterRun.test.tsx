// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRestoreFocusAfterRun } from './useRestoreFocusAfterRun'

function Harness({ running, onMark }: { running: boolean; onMark: (mark: () => void) => void }) {
  const { ref, markRunStart } = useRestoreFocusAfterRun(running)
  useEffect(() => onMark(markRunStart), [onMark, markRunStart])
  return (
    <>
      <Button ref={ref} disabled={running}>
        run
      </Button>
      <Button>other</Button>
    </>
  )
}

function setup() {
  let mark: () => void = () => {}
  const onMark = (m: () => void) => {
    mark = m
  }
  const view = render(<Harness running={false} onMark={onMark} />)
  return {
    markRunStart: () => act(() => mark()),
    setRunning: (running: boolean) => view.rerender(<Harness running={running} onMark={onMark} />),
  }
}

describe('useRestoreFocusAfterRun', () => {
  it('returns focus to the run button when a keyboard-started run ends', () => {
    const { markRunStart, setRunning } = setup()
    const run = screen.getByText('run')
    run.focus()
    markRunStart()
    // A disabled button drops focus to <body> in real browsers.
    run.blur()
    setRunning(true)
    expect(document.activeElement).toBe(document.body)
    setRunning(false)
    expect(document.activeElement).toBe(run)
  })

  it('does not steal focus when the run was not started from the button', () => {
    const { markRunStart, setRunning } = setup()
    const other = screen.getByText('other')
    other.focus()
    markRunStart()
    setRunning(true)
    setRunning(false)
    expect(document.activeElement).toBe(other)
  })
})
