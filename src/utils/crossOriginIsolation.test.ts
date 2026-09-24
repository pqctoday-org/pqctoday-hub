// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  COI_GUARD_PLACEHOLDER,
  COI_RELOAD_KEY,
  COI_ROUTE_PREFIXES,
  coiInlineGuardScript,
  injectCoiGuard,
  isolationNavigationAction,
  routeNeedsCrossOriginIsolation,
  type IsolationEnv,
} from './crossOriginIsolation'

describe('routeNeedsCrossOriginIsolation', () => {
  it('is true only for the SharedArrayBuffer routes', () => {
    for (const p of [
      '/playground',
      '/playground/',
      '/playground/vpn-sim',
      '/playground/hsm',
      '/simulation',
      '/dev-gate/p11-shim',
      '/learn/5g-security',
      '/learn/vpn-ssh-pqc/',
    ])
      expect({ p, needs: routeNeedsCrossOriginIsolation(p) }).toEqual({ p, needs: true })
    for (const p of [
      '/',
      '/threats',
      '/openssl',
      '/algorithms',
      '/learn',
      '/learn/pqc-101',
      '/playgroundx',
      '/embed/learn/5g-security',
    ])
      expect({ p, needs: routeNeedsCrossOriginIsolation(p) }).toEqual({ p, needs: false })
  })
})

describe('isolationNavigationAction — the in-app guard and its loop guard', () => {
  const base: IsolationEnv = {
    pathname: '/playground',
    crossOriginIsolated: false,
    hasServiceWorker: true,
    hasController: true,
    alreadyTried: false,
  }

  it('full-navigates (and marks the session) into an isolation route from a non-isolated page', () => {
    expect(isolationNavigationAction(base)).toBe('navigate-and-mark')
  })

  it('without a controlling worker, navigates but leaves the mark to index.html’s guard', () => {
    expect(isolationNavigationAction({ ...base, hasController: false })).toBe('navigate')
  })

  it('does nothing once tried this session — the loop guard', () => {
    expect(isolationNavigationAction({ ...base, alreadyTried: true })).toBe('none')
  })

  it('does nothing on routes that do not need it, when already isolated, or without service workers', () => {
    expect(isolationNavigationAction({ ...base, pathname: '/threats' })).toBe('none')
    expect(isolationNavigationAction({ ...base, crossOriginIsolated: true })).toBe('none')
    expect(isolationNavigationAction({ ...base, crossOriginIsolated: undefined })).toBe('none')
    expect(isolationNavigationAction({ ...base, hasServiceWorker: false })).toBe('none')
  })
})

/** Runs the generated inline guard against fake browser globals. */
function runInlineGuard(opts: {
  pathname: string
  isolated?: boolean
  controller?: boolean
  serviceWorker?: boolean
  storage?: Map<string, string>
}) {
  const storage = opts.storage ?? new Map<string, string>()
  const reload = vi.fn()
  const listeners: Record<string, () => void> = {}
  const serviceWorker =
    opts.serviceWorker === false
      ? undefined
      : {
          controller: opts.controller ? {} : null,
          addEventListener: (ev: string, fn: () => void) => {
            listeners[ev] = fn
          },
        }
  const run = new Function(
    'window',
    'location',
    'navigator',
    'sessionStorage',
    coiInlineGuardScript()
  )
  run(
    { crossOriginIsolated: opts.isolated ?? false },
    { pathname: opts.pathname, reload },
    { serviceWorker },
    {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    }
  )
  return { reload, listeners, storage }
}

describe('index.html inline guard (generated from this module)', () => {
  it('does not reload a page that does not need isolation (/threats)', () => {
    const { reload, listeners, storage } = runInlineGuard({
      pathname: '/threats',
      controller: true,
    })
    expect(reload).not.toHaveBeenCalled()
    expect(listeners.controllerchange).toBeUndefined()
    // Not marked either, so a later in-app visit to /playground can still isolate.
    expect(storage.has(COI_RELOAD_KEY)).toBe(false)
  })

  it('reloads an isolation route once when a worker already controls it', () => {
    const { reload, storage } = runInlineGuard({
      pathname: '/playground/vpn-sim',
      controller: true,
    })
    expect(reload).toHaveBeenCalledTimes(1)
    expect(storage.get(COI_RELOAD_KEY)).toBe('1')
  })

  it('waits for the worker to take control, then reloads', () => {
    const { reload, listeners } = runInlineGuard({ pathname: '/simulation' })
    expect(reload).not.toHaveBeenCalled()
    listeners.controllerchange()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('never reloads twice in a session (loop guard), nor when already isolated', () => {
    const storage = new Map([[COI_RELOAD_KEY, '1']])
    expect(
      runInlineGuard({ pathname: '/playground', controller: true, storage }).reload
    ).not.toHaveBeenCalled()
    expect(
      runInlineGuard({ pathname: '/playground', controller: true, isolated: true }).reload
    ).not.toHaveBeenCalled()
    expect(
      runInlineGuard({ pathname: '/playground', serviceWorker: false }).reload
    ).not.toHaveBeenCalled()
  })

  it('carries exactly the module’s route list', () => {
    expect(coiInlineGuardScript()).toContain(JSON.stringify(COI_ROUTE_PREFIXES))
  })

  it('index.html carries the placeholder, and injection fails loudly without it', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8')
    expect(html).toContain(COI_GUARD_PLACEHOLDER)
    expect(injectCoiGuard(html)).toContain(JSON.stringify(COI_ROUTE_PREFIXES))
    expect(injectCoiGuard(html)).not.toContain(COI_GUARD_PLACEHOLDER)
    expect(() => injectCoiGuard('<html></html>')).toThrow(/placeholder/)
  })
})
