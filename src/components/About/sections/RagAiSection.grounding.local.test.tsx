// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RagAiSection } from './RagAiSection'

describe('Assistant disclosure on the About page', () => {
  it('says the Assistant answers only from the Hub records, on the device, with no outside service', () => {
    render(<RagAiSection />)
    fireEvent.click(screen.getByRole('button', { name: /PQC Assistant/ }))
    const text = document.body.textContent ?? ''
    expect(text).toMatch(/answers from the Hub.s own records/)
    expect(text).toMatch(/It answers only from the Hub.s own records/)
    expect(text).toMatch(/nothing leaves your browser and no account or outside service is needed/)
    expect(text).toMatch(/not sent to Google or to any other outside service/)
    expect(text).toMatch(/check it before relying on an answer for a decision/)
  })

  it('no longer promises a cloud mode, a local model, a key or a download', () => {
    render(<RagAiSection />)
    fireEvent.click(screen.getByRole('button', { name: /PQC Assistant/ }))
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/Gemini|Qwen|WebGPU|cloud mode|local mode|AI Studio|WebLLM/i)
    expect(text).not.toMatch(/provide your own/i)
    expect(text).not.toMatch(/language model|API key|download/i)
  })
})
