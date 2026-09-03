// SPDX-License-Identifier: GPL-3.0-only
//
// Unit test for BatchView's per-item "chained"/"direct" UID toggle (K5,
// gaps-closeout WP-4.1) — the item-rewrite logic the toggle button applies,
// tested directly against OpSpec[] so it doesn't need a mounted component or
// a real KmipEngine.
import { describe, expect, it } from 'vitest'
import { toggleItemChaining } from './BatchView'
import { ID_PLACEHOLDER, type OpSpec } from '@/wasm/kmip/kmipEngine'

describe('toggleItemChaining', () => {
  it('flips a chained ($IDPlaceholder) item to the first keystore UID', () => {
    const items: OpSpec[] = [
      { op: 'CreateKeyPair', intent: 'sign', algorithm: 'ML-DSA-65' },
      { op: 'Activate', uid: ID_PLACEHOLDER },
    ]
    const next = toggleItemChaining(items, 1, ['urn:pqctoday:aaa', 'urn:pqctoday:bbb'])
    expect(next[1].uid).toBe('urn:pqctoday:aaa')
    // Every other item is untouched, not just unequal-by-value.
    expect(next[0]).toBe(items[0])
  })

  it('flips a chained item to an empty string when the keystore is empty', () => {
    const items: OpSpec[] = [{ op: 'Activate', uid: ID_PLACEHOLDER }]
    const next = toggleItemChaining(items, 0, [])
    expect(next[0].uid).toBe('')
  })

  it('flips a direct (literal UID) item back to $IDPlaceholder, regardless of keystore contents', () => {
    const items: OpSpec[] = [{ op: 'Destroy', uid: 'urn:pqctoday:ghost' }]
    const next = toggleItemChaining(items, 0, ['urn:pqctoday:aaa'])
    expect(next[0].uid).toBe(ID_PLACEHOLDER)
  })

  it('leaves an item with no uid field at all untouched (nothing to chain)', () => {
    const items: OpSpec[] = [{ op: 'Query' }]
    const next = toggleItemChaining(items, 0, ['urn:pqctoday:aaa'])
    expect(next[0]).toBe(items[0])
    expect(next[0].uid).toBeUndefined()
  })

  it('only rewrites the targeted index — a Locate-chained item elsewhere in the sequence is untouched', () => {
    const items: OpSpec[] = [
      { op: 'Locate' },
      { op: 'Activate', uid: ID_PLACEHOLDER },
      { op: 'Sign', uid: ID_PLACEHOLDER, text: 'batch-signed payload' },
    ]
    const next = toggleItemChaining(items, 1, ['urn:pqctoday:aaa'])
    expect(next[1].uid).toBe('urn:pqctoday:aaa')
    expect(next[2]).toBe(items[2])
    expect(next[2].uid).toBe(ID_PLACEHOLDER)
  })

  it('is a pure rewrite — the input array and its untouched items are never mutated', () => {
    const items: OpSpec[] = [{ op: 'Activate', uid: ID_PLACEHOLDER }]
    const snapshot = items.map((s) => ({ ...s }))
    toggleItemChaining(items, 0, ['urn:pqctoday:aaa'])
    expect(items).toEqual(snapshot)
  })
})
