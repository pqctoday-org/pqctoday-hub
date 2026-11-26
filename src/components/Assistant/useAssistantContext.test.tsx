// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAssistantContext } from './useAssistantContext'

describe('the context the drawer sends with a question', () => {
  afterEach(() => window.history.pushState({}, '', '/'))

  it('names the page the learner is on by its address, read when the question is asked', () => {
    const { result } = renderHook(() => useAssistantContext())
    window.history.pushState({}, '', '/learn/tls-basics?section=intro#top')
    expect(result.current().page).toBe('/learn/tls-basics?section=intro')
    window.history.pushState({}, '', '/compliance')
    expect(result.current().page).toBe('/compliance')
  })

  it('does not hold learner text: only the role, region, industry and page', () => {
    const { result } = renderHook(() => useAssistantContext())
    expect(Object.keys(result.current()).sort()).toEqual(['industry', 'page', 'persona', 'region'])
  })
})
