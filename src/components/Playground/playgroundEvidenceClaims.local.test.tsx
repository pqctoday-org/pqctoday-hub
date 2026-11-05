// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useSandboxStore } from '@/store/useSandboxStore'
import { SimplifiedViewNotice } from '@/components/common/SimplifiedViewNotice'
import { MobilePlaygroundView as MobileInfo } from './MobilePlaygroundView'
import { InteractiveExecutionNotice } from './InteractiveExecutionNotice'
import { PlaygroundWorkshop } from './PlaygroundWorkshop'
import { WORKSHOP_TOOLS } from './workshopRegistry'
import { EVIDENCE_CLASS_LABEL, evidenceForTool } from './toolEvidence'
import { CATEGORY_META } from './cryptoLabMeta'

beforeEach(() => {
  usePersonaStore.setState({ selectedPersona: null, viewAccess: 'preview' })
  useSandboxStore.setState({
    status: 'offline',
    lastChecked: 1,
    error: 'sample offline',
    baseUrl: '',
  })
})

describe('Playground execution claims', () => {
  it('labels the phone information fallback as capabilities rather than an executed result', () => {
    render(<MobileInfo />)
    expect(
      screen.getByText(/information view of the workbench’s capabilities, not an operation result/)
    ).toBeInTheDocument()
    expect(screen.getByText('Desktop workbench capabilities')).toBeInTheDocument()
    expect(screen.queryByText(/The Playground runs real post-quantum/)).not.toBeInTheDocument()
  })
  it('describes preview access without denying demonstrations or claiming all operations are real', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    render(
      <SimplifiedViewNotice
        what="Linked workbenches may hide advanced controls."
        stillReal="A tool may be a model or a calculator."
      />
    )
    expect(screen.getByText('Preview access is selected.')).toBeInTheDocument()
    expect(screen.getByText(/A tool may be a model or a calculator/)).toBeInTheDocument()
    expect(screen.queryByText(/Nothing here is a demo|genuine ML-KEM/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show every control' }))
    expect(usePersonaStore.getState().viewAccess).toBe('unlocked')
  })
  it.each([false, true])(
    'shows selected Mock mode even with loaded-library flag %s',
    (wasmLoaded) => {
      render(<InteractiveExecutionNotice executionMode="mock" wasmLoaded={wasmLoaded} />)
      expect(screen.getByText('Software mode: Mock')).toBeInTheDocument()
      expect(screen.getByText(/not executed cryptographic checks/)).toBeInTheDocument()
      expect(screen.queryByText(/Software mode: WebAssembly/)).not.toBeInTheDocument()
    }
  )
  it.each([false, true])(
    'distinguishes selected WebAssembly state from an operation result (loaded=%s)',
    (wasmLoaded) => {
      render(<InteractiveExecutionNotice executionMode="wasm" wasmLoaded={wasmLoaded} />)
      expect(
        screen.getByText(
          `Software mode: WebAssembly — signing library ${wasmLoaded ? 'loaded' : 'loading'}`
        )
      ).toBeInTheDocument()
      expect(screen.getByText(/not a successful operation result/)).toBeInTheDocument()
    }
  )
  it('does not describe the protocol category as live network handshakes', () => {
    expect(CATEGORY_META['Protocol Simulations'].description).toContain('models')
    expect(CATEGORY_META['Protocol Simulations'].description).not.toMatch(/live.*handshakes/i)
  })
  it.each(['tls-simulator', 'hsm-capacity', 'qrng-demo'])(
    'desktop %s preview uses its existing evidence scope',
    (id) => {
      const tool = WORKSHOP_TOOLS.find((tool) => tool.id === id)!
      const profile = evidenceForTool(id)!
      render(
        <MemoryRouter initialEntries={['/playground?cat=' + encodeURIComponent(tool.category)]}>
          <PlaygroundWorkshop />
        </MemoryRouter>
      )
      const card = screen.getByText(tool.name).closest('[data-tool-card]') as HTMLElement
      fireEvent.click(within(card).getByRole('button', { name: 'Preview' }))
      const dialog = screen.getByRole('dialog', { name: tool.name })
      expect(within(dialog).getByText(profile.summary)).toBeInTheDocument()
      expect(within(dialog).getByText(EVIDENCE_CLASS_LABEL[profile.primary])).toBeInTheDocument()
      expect(within(dialog).queryByText(/Runs instantly.*WebAssembly/)).not.toBeInTheDocument()
    }
  )
})
