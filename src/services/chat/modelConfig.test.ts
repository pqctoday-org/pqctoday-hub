// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { prebuiltAppConfig } from '@mlc-ai/web-llm'
import { DEFAULT_LOCAL_MODEL, SUPPORTED_LOCAL_MODELS } from './modelConfig'

describe('local model catalog', () => {
  it('only advertises models present in the installed WebLLM registry', () => {
    const registered = new Set(prebuiltAppConfig.model_list.map((model) => model.model_id))

    expect(DEFAULT_LOCAL_MODEL).toBe('Qwen3-8B-q4f16_1-MLC')
    expect(SUPPORTED_LOCAL_MODELS.every((model) => registered.has(model))).toBe(true)
  })
})
