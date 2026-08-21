// SPDX-License-Identifier: GPL-3.0-only
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { OpenSSLStudioView } from './OpenSSLStudioView'

// Mock the sub-components to isolate the view logic
vi.mock('./Workbench', () => ({ Workbench: () => <div>Workbench</div> }))
vi.mock('./components/WorkbenchFileManager', () => ({
  WorkbenchFileManager: () => <div>WorkbenchFileManager</div>,
}))
vi.mock('./TerminalOutput', () => ({ TerminalOutput: () => <div>TerminalOutput Component</div> }))
vi.mock('./LogsTab', () => ({ LogsTab: () => <div>LogsTab Component</div> }))
vi.mock('./FileEditor', () => ({ FileEditor: () => <div>FileEditor</div> }))
vi.mock('./learn/OpenSslLearnView', () => ({ OpenSslLearnView: () => <div>OpenSslLearnView</div> }))

/** Minimal Worker stub — OpenSSLStudioView now mounts useOpenSSL() directly
 * (hoisted from WorkbenchPreview so the Learn tab shares one worker/WASM
 * instance instead of reloading on tab switch — see WorkbenchPreview.tsx). */
class FakeWorker {
  onmessage: ((ev: MessageEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

describe('OpenSSLStudioView Tabs', () => {
  beforeEach(() => {
    // @ts-expect-error — jsdom doesn't implement Worker; stub it for this test.
    global.Worker = FakeWorker
  })

  it('defaults to the Learn tab, and the Workbench pane (with its own Terminal/Logs header) is reachable via the Workbench tab', () => {
    render(
      <MemoryRouter>
        <OpenSSLStudioView />
      </MemoryRouter>
    )

    // Learn is the first-position, default-selected tab (matching the
    // KMIP/PKCS#11/TPM playgrounds' convention) — the Workbench's own
    // Terminal/Logs header isn't mounted until that tab is selected.
    expect(screen.getByText('OpenSslLearnView')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /terminal/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /workbench/i }))

    expect(screen.getByRole('button', { name: /terminal/i })).toBeInTheDocument()
  })
})
