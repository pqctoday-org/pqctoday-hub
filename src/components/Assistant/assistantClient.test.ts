// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { askAssistant } from './assistantClient'

afterEach(() => vi.unstubAllEnvs())

describe('assistant client', () => {
  it('answers through the engine entry point', async () => {
    const a = await askAssistant('When is the CNSA 2.0 deadline?', { persona: null })
    expect(a.state).toBe('direct')
  })

  it('reports data that did not load as a state, never as a rejection', async () => {
    const a = await askAssistant('fail', { persona: null })
    expect(a).toMatchObject({ state: 'data-not-loaded', question: 'fail' })
  })

  it('shows no canned answers outside development and tests', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('MODE', 'production')
    const a = await askAssistant('When is the CNSA 2.0 deadline?', { persona: null })
    expect(a.state).toBe('data-not-loaded')
  })
})
