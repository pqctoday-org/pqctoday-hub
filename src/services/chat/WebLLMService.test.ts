// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import {
  buildLocalCompletionRequest,
  selectLocalPromptChunks,
  stripLocalThinking,
} from './WebLLMService'

describe('buildLocalCompletionRequest', () => {
  it('disables Qwen thinking through WebLLM extra_body', () => {
    const request = buildLocalCompletionRequest(
      [{ role: 'user', content: 'Which learning modules cover FIPS certification?' }],
      768
    )

    expect(request.extra_body).toEqual({ enable_thinking: false })
    expect(request).not.toHaveProperty('enable_thinking')
    expect(request.max_tokens).toBe(768)
    expect(request.temperature).toBe(0)
    expect(request.stream).toBe(true)
  })

  it('never exposes complete, unclosed, or partial Qwen thinking blocks', () => {
    expect(stripLocalThinking('<thi')).toBe('')
    expect(stripLocalThinking('<think>private reasoning')).toBe('')
    expect(stripLocalThinking('<think>private reasoning</think>Final answer.')).toBe(
      'Final answer.'
    )
  })

  it('limits broad catalog prompts while preserving context for other questions', () => {
    const chunks = Array.from({ length: 8 }, (_, index) => ({
      id: `chunk-${index}`,
      source: 'migrate',
      title: `Product ${index}`,
      content: `Product ${index}`,
      category: 'software',
      metadata: {},
    })) as RAGChunk[]

    expect(selectLocalPromptChunks(chunks, 'Which libraries support ML-KEM?')).toHaveLength(3)
    expect(selectLocalPromptChunks(chunks, 'Explain ML-KEM')).toHaveLength(8)
    expect(selectLocalPromptChunks(chunks, 'What is the UAE PQC Index?')).toHaveLength(8)
  })
})
