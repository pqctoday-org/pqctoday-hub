// SPDX-License-Identifier: GPL-3.0-only
//
// Regression guard for withTpmLock (tpmBridge.ts) — the reentrancy fix for
// the 2026-07-24 TPM playground concurrency remediation. Pure logic, no WASM
// engine needed, so this runs against the real exported functions directly
// (unlike tpmLessons.local.test.ts, which reimplements its own harness to
// avoid loading pqctpm.wasm in Node). Local gate only, not CI, per the
// 2026-07-01 *.local.test.ts convention.
import { describe, it, expect } from 'vitest'
import { withTpmLock, isTpmBusy, subscribeTpmBusy } from './tpmBridge'

function deferred<T>(): {
  promise: Promise<T>
  resolve: (v: T) => void
  reject: (e: unknown) => void
} {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('withTpmLock', () => {
  it('serializes two overlapping callers — no interleaving of their bodies', async () => {
    const events: string[] = []
    const gate = deferred<void>()

    const opA = withTpmLock(async () => {
      events.push('A-start')
      await gate.promise
      events.push('A-end')
    })
    // Fired in the same tick as opA, before it has any chance to finish —
    // this is the exact "double-click Run all" shape from the live repro.
    const opB = withTpmLock(async () => {
      events.push('B-start')
      events.push('B-end')
    })

    // B must not have started yet — A is still awaiting the gate.
    await Promise.resolve()
    await Promise.resolve()
    expect(events).toEqual(['A-start'])

    gate.resolve()
    await Promise.all([opA, opB])

    expect(events).toEqual(['A-start', 'A-end', 'B-start', 'B-end'])
  })

  it('is reentrant — a locked call made from inside an already-locked call runs inline, no deadlock', async () => {
    const events: string[] = []
    await withTpmLock(async () => {
      events.push('outer-start')
      await withTpmLock(async () => {
        events.push('inner')
      })
      events.push('outer-end')
    })
    expect(events).toEqual(['outer-start', 'inner', 'outer-end'])
  })

  it('isTpmBusy() reflects true only while a lock is actually held', async () => {
    expect(isTpmBusy()).toBe(false)
    const gate = deferred<void>()
    const op = withTpmLock(async () => {
      expect(isTpmBusy()).toBe(true)
      await gate.promise
    })
    await Promise.resolve()
    expect(isTpmBusy()).toBe(true)
    gate.resolve()
    await op
    expect(isTpmBusy()).toBe(false)
  })

  it('subscribeTpmBusy notifies on acquire and release, and unsubscribe stops further calls', async () => {
    const seen: boolean[] = []
    const unsubscribe = subscribeTpmBusy((busy) => seen.push(busy))

    await withTpmLock(async () => {})
    expect(seen).toEqual([true, false])

    unsubscribe()
    await withTpmLock(async () => {})
    expect(seen).toEqual([true, false]) // no new entries after unsubscribe
  })

  it('a rejected caller does not wedge the queue for the next caller', async () => {
    await expect(
      withTpmLock(async () => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')

    // If the queue were left stuck on the rejection, this would hang the test.
    const result = await withTpmLock(async () => 'still works')
    expect(result).toBe('still works')
    expect(isTpmBusy()).toBe(false)
  })
})
