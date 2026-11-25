// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { askAssistant, setAssistantEngineLoader } from './assistantClient'

beforeEach(() => setAssistantEngineLoader(() => import('@/test/fixtures/assistantFixtureEngine')))
afterEach(() => {
  vi.unstubAllEnvs()
  setAssistantEngineLoader()
})

describe('assistant client', () => {
  it('answers through the engine entry point', async () => {
    const a = await askAssistant('When is the CNSA 2.0 deadline?', { persona: null })
    expect(a.state).toBe('direct')
  })

  it('reports data that did not load as a state, never as a rejection', async () => {
    const a = await askAssistant('fail', { persona: null })
    expect(a).toMatchObject({ state: 'data-not-loaded', question: 'fail' })
  })

  it('reports a failing engine load as data not loaded', async () => {
    setAssistantEngineLoader(() => Promise.reject(new Error('chunk failed')))
    const a = await askAssistant('What is ML-KEM?', { persona: null })
    expect(a).toMatchObject({ state: 'data-not-loaded', question: 'What is ML-KEM?' })
  })

  it('shows no canned answers outside development and tests', async () => {
    setAssistantEngineLoader()
    vi.stubEnv('DEV', false)
    vi.stubEnv('MODE', 'production')
    const a = await askAssistant('When is the CNSA 2.0 deadline?', { persona: null })
    expect(a.state).toBe('data-not-loaded')
  })
})
