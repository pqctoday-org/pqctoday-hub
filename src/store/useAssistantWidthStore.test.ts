// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ASSISTANT_WIDTH_MAX,
  ASSISTANT_WIDTH_MIN,
  automaticWidth,
  clampWidth,
  maxWidthFor,
  useAssistantWidthStore,
} from './useAssistantWidthStore'

const store = () => useAssistantWidthStore.getState()
const setViewport = (px: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: px })
}

beforeEach(() => {
  setViewport(1440)
  localStorage.clear()
  store().reset()
})
afterEach(() => setViewport(1024))

describe('the Assistant width', () => {
  it('is automatic until a width is chosen: 520 px from 1,280 px, 400 px below', () => {
    expect(store().width).toBeNull()
    expect(automaticWidth(1280)).toBe(520)
    expect(automaticWidth(1440)).toBe(520)
    expect(automaticWidth(1279)).toBe(400)
    expect(automaticWidth(1100)).toBe(400)
  })

  it('clamps a chosen width to 400 to 640 px', () => {
    store().setWidth(300)
    expect(store().width).toBe(ASSISTANT_WIDTH_MIN)
    store().setWidth(900)
    expect(store().width).toBe(ASSISTANT_WIDTH_MAX)
    store().setWidth(512.4)
    expect(store().width).toBe(512)
  })

  it('leaves the page at least 640 px, so a narrow window cannot take 640 px', () => {
    setViewport(1200)
    expect(maxWidthFor(1200)).toBe(560)
    store().setWidth(640)
    expect(store().width).toBe(560)
    expect(clampWidth(500, 1000)).toBe(400)
  })

  it('Wider and Narrower step by 60 px from what shows now, and stop at the limits', () => {
    store().wider()
    expect(store().width).toBe(580)
    store().wider()
    expect(store().width).toBe(640)
    store().wider()
    expect(store().width).toBe(640)
    store().narrower()
    expect(store().width).toBe(580)
    store().setWidth(430)
    store().narrower()
    expect(store().width).toBe(400)
  })

  it('goes back to automatic on reset', () => {
    store().setWidth(600)
    store().reset()
    expect(store().width).toBeNull()
  })

  it('is remembered on this device, as a number and nothing else', () => {
    store().setWidth(600)
    expect(JSON.parse(localStorage.getItem('pqc-assistant-width') ?? '{}').state).toEqual({
      width: 600,
    })
  })

  it('reads a damaged stored value as automatic', async () => {
    localStorage.setItem(
      'pqc-assistant-width',
      JSON.stringify({ state: { width: 'wide' }, version: 1 })
    )
    await useAssistantWidthStore.persist.rehydrate()
    expect(store().width).toBeNull()
  })
})
