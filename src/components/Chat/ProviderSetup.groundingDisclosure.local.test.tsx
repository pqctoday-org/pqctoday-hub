// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ProviderSetup } from './ProviderSetup'
const m = vi.hoisted(() => ({ connect: vi.fn(), validate: vi.fn() }))
vi.mock('@/store/useChatStore', () => ({
  useChatStore: (selector: (s: object) => unknown) =>
    selector({
      setApiKey: m.connect,
      setProvider: m.connect,
      setLocalModel: m.connect,
      setLocalContextWindow: m.connect,
    }),
}))
vi.mock('@/store/useAirplaneModeStore', () => ({
  useAirplaneModeStore: (selector: (s: object) => unknown) => selector({ isEnabled: false }),
}))
vi.mock('@/services/chat/GeminiService', () => ({ validateApiKey: m.validate }))
vi.mock('@/services/chat/WebLLMService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/chat/WebLLMService')>()),
  checkWebGPUSupport: vi.fn().mockResolvedValue(true),
  checkWebGPUBufferCapability: vi.fn().mockResolvedValue({ ok: true }),
  isMobileBrowser: () => false,
}))

describe('Assistant setup describes the actual draft and source-check boundary', () => {
  it('explains local draft processing without promising sentence-level factual verification', async () => {
    render(<ProviderSetup />)
    await screen.findByText('Retrieved-source assistance')
    expect(screen.getByText(/The selected model runs in your browser/)).toHaveTextContent(
      'Live text is an unverified draft'
    )
    expect(screen.getByText(/The selected model runs in your browser/)).toHaveTextContent(
      'retain text with source links'
    )
    expect(screen.getByText(/The selected model runs in your browser/)).toHaveTextContent(
      'do not establish factual correctness'
    )
    expect(screen.queryByText(/Every substantive sentence/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Unsupported drafts are withheld/)).not.toBeInTheDocument()
    expect(screen.queryByText(/cannot fall back to outside knowledge/)).not.toBeInTheDocument()
    expect(screen.getByText(/When retrieval returns no sources/)).toHaveTextContent(
      'without a model call'
    )
    fireEvent.click(screen.getByRole('button', { name: 'How does local AI work?' }))
    expect(screen.getByText(/Live drafts are unverified/)).toHaveTextContent(
      'Automated source checks may revise the final answer or replace it with retrieved excerpts'
    )
    expect(screen.queryByText(/Failed drafts are withheld/)).not.toBeInTheDocument()
    expect(m.connect).not.toHaveBeenCalled()
    expect(m.validate).not.toHaveBeenCalled()
  })
  it('explains the cloud inputs and finalizer alternatives without enabling or calling a provider', async () => {
    render(<ProviderSetup />)
    const cloud = await screen.findByText(/The cloud model receives your question/)
    expect(cloud).toHaveTextContent('conversation context and retrieved Hub material')
    expect(cloud).toHaveTextContent('Live text is an unverified draft')
    expect(cloud).toHaveTextContent(
      'may revise it, retain text with source links, or show retrieved excerpts'
    )
    expect(cloud).toHaveTextContent('Web search and external tools are not enabled in this request')
    expect(cloud).not.toHaveTextContent('before the answer is displayed')
    expect(m.connect).not.toHaveBeenCalled()
    expect(m.validate).not.toHaveBeenCalled()
  })
})
