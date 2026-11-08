// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ProviderSetup } from './ProviderSetup'
import { DEFAULT_LOCAL_MODEL, WEBLLM_MODELS } from '@/services/chat/WebLLMService'

const { connect, validate } = vi.hoisted(() => ({ connect: vi.fn(), validate: vi.fn() }))
vi.mock('@/store/useChatStore', () => ({
  useChatStore: (select: (s: object) => unknown) =>
    select({
      setApiKey: connect,
      setProvider: connect,
      setLocalModel: connect,
      setLocalContextWindow: connect,
    }),
}))
vi.mock('@/services/chat/GeminiService', () => ({ validateApiKey: validate }))
vi.mock('@/services/chat/WebLLMService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/chat/WebLLMService')>()),
  checkWebGPUSupport: vi.fn().mockResolvedValue(true),
  checkWebGPUBufferCapability: vi.fn().mockResolvedValue({ ok: true }),
  isMobileBrowser: () => false,
}))

describe('Assistant setup explains configured options without performance guarantees', () => {
  it('derives the initial selection and default explanation from the same current metadata', async () => {
    const user = userEvent.setup()
    render(<ProviderSetup />)
    const chooser = await screen.findByRole('button', { name: 'Local AI model' })
    const actualDefault = WEBLLM_MODELS.find((model) => model.id === DEFAULT_LOCAL_MODEL)!
    expect(chooser).toHaveTextContent(actualDefault.label)
    await user.click(screen.getByRole('button', { name: 'How does local AI work?' }))
    const explanation = screen.getByText(/The other listed options/)
    expect(explanation).toHaveTextContent(actualDefault.label)
    expect(explanation).not.toHaveTextContent('accuracy-first')
    for (const model of WEBLLM_MODELS) {
      await user.click(chooser)
      expect(screen.getAllByRole('option')).toHaveLength(WEBLLM_MODELS.length)
      await user.click(screen.getByRole('option', { name: model.label }))
      expect(chooser).toHaveTextContent(model.label)
      const budgets = screen.getAllByRole('button', { name: /tokens.*Configured token budget/i })
      expect(budgets).not.toHaveLength(0)
      for (const budget of budgets) {
        const tokens = Number(budget.textContent!.match(/(\d+)K tokens/)![1]) * 1024
        expect(tokens).toBeLessThanOrEqual(model.maxContextLength)
      }
    }
    expect(connect).not.toHaveBeenCalled()
    expect(validate).not.toHaveBeenCalled()
  })
  it('does not present fixed coverage, stars, instant responses or context as guaranteed quality', async () => {
    const user = userEvent.setup()
    const { container } = render(<ProviderSetup />)
    await screen.findByRole('button', { name: 'Local AI model' })
    await user.click(screen.getByRole('button', { name: 'How does local AI work?' }))
    await waitFor(() =>
      expect(container).toHaveTextContent('A larger budget does not guarantee coverage or accuracy')
    )
    expect(container).not.toHaveTextContent(
      /60%|100%|●|○|Instant first token|instant startup|More context =|accuracy-first default|4K default works on any GPU/
    )
    expect(container).toHaveTextContent('not a measured speed or accuracy rating')
    expect(container).toHaveTextContent('immediate responses are not guaranteed')
    expect(container).toHaveTextContent('not whole-corpus coverage')
  })
})
