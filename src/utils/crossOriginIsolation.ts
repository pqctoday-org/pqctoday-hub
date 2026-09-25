// SPDX-License-Identifier: GPL-3.0-only
/**
 * Which routes need cross-origin isolation, and the one-time reload that gets
 * it — the single source for BOTH the inline guard in index.html (which runs
 * before the app, and is generated from this module at build time by the
 * `coiGuardHtml` Vite plugin) and the in-app guard for client-side navigation.
 *
 * WHY. GitHub Pages cannot send COOP/COEP headers, so the PWA service worker
 * (src/sw.ts) adds them to every response it serves. A document loaded before
 * the worker took control is therefore not cross-origin isolated, and
 * SharedArrayBuffer is unavailable in it. Until 2026-09-23 index.html fixed
 * that by reloading EVERY first-visit page once the worker took control — so
 * a reader of /threats?id=… saw the page, then "Loading…", then the page
 * again, with the dialog closing and reopening (UX-13). Now only a route that
 * actually uses SharedArrayBuffer reloads; every other page is left alone.
 *
 * WHAT NEEDS IT (checked 2026-09-23 by grepping for SharedArrayBuffer,
 * crossOriginIsolated and Atomics, and the WASM bundles in public/wasm):
 *   - strongSwan VPN simulation (strongswan_worker.js, wasm/strongswan) and the
 *     OpenSSH simulation (openssh_worker.js): /playground (vpn-sim,
 *     pqc-ssh-sim, /playground/hsm), and the VPN/SSH Learn module, which
 *     embeds the VPN panel.
 *   - Workshop tools declaring `requires: ['sab']` in workshopRegistry
 *     (vpn-sim, pqc-ssh-sim, suci-flow, tpm-playground): /playground/<id>, and
 *     the 5G Learn module, which embeds suci-flow.
 *   - The Python runtime's watchdog (services/python/pyRuntime, Atomics on a
 *     SharedArrayBuffer): /playground dev workbenches and /dev-gate.
 *   - /simulation, which embeds workshop tools and Learn modules.
 * OpenSSL, liboqs and softhsm WASM do not use SharedArrayBuffer, so e.g.
 * /openssl and /algorithms work without isolation and do not reload.
 * A drift-guard test (crossOriginIsolation.driftguard.test.ts) fails if a
 * Learn module starts importing one of these without being listed here.
 */

/** Route prefixes (exact path, or path + "/…") that need cross-origin isolation. */
export const COI_ROUTE_PREFIXES: readonly string[] = [
  '/playground',
  '/simulation',
  '/dev-gate',
  '/learn/5g-security',
  '/learn/vpn-ssh-pqc',
]

/** sessionStorage key: set once an isolation reload/navigation has been tried
 *  this session, so a browser that never becomes isolated cannot loop. The
 *  prerender script also sets it to keep captures reload-free. */
export const COI_RELOAD_KEY = 'coi-reload'

export function routeNeedsCrossOriginIsolation(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/'
  return COI_ROUTE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`))
}

export interface IsolationEnv {
  pathname: string
  /** `window.crossOriginIsolated` — undefined where the browser lacks it. */
  crossOriginIsolated: boolean | undefined
  hasServiceWorker: boolean
  /** A service worker already controls this page. */
  hasController: boolean
  /** COI_RELOAD_KEY is already set this session. */
  alreadyTried: boolean
}

/**
 * What the in-app guard should do after a client-side navigation:
 *  - 'none' — the route doesn't need isolation, the page already is isolated
 *    (or the browser has no notion of it / no service worker), or a reload was
 *    already tried this session.
 *  - 'navigate-and-mark' — a worker controls this page, so a full navigation
 *    to the same URL comes back with COOP/COEP: mark the session, then go.
 *  - 'navigate' — no worker controls the page yet: a full navigation lands on
 *    index.html's inline guard, which marks the session and reloads once the
 *    worker takes control. Not marked here, or that guard would stand down.
 */
export function isolationNavigationAction(
  env: IsolationEnv
): 'none' | 'navigate-and-mark' | 'navigate' {
  if (!routeNeedsCrossOriginIsolation(env.pathname)) return 'none'
  if (env.crossOriginIsolated !== false) return 'none'
  if (!env.hasServiceWorker || env.alreadyTried) return 'none'
  return env.hasController ? 'navigate-and-mark' : 'navigate'
}

/**
 * The inline guard index.html runs before the app (injected at build/dev time
 * by the `coiGuardHtml` Vite plugin, which replaces COI_GUARD_PLACEHOLDER).
 * Same rule as `routeNeedsCrossOriginIsolation` + the reload-once guard, as a
 * dependency-free ES5 snippet.
 */
export function coiInlineGuardScript(): string {
  return `(function () {
  var prefixes = ${JSON.stringify(COI_ROUTE_PREFIXES)};
  var p = location.pathname.replace(/\\/+$/, '') || '/';
  var needs = prefixes.some(function (x) { return p === x || p.indexOf(x + '/') === 0; });
  if (!needs || window.crossOriginIsolated !== false) return;
  if (!navigator.serviceWorker || sessionStorage.getItem(${JSON.stringify(COI_RELOAD_KEY)})) return;
  sessionStorage.setItem(${JSON.stringify(COI_RELOAD_KEY)}, '1');
  if (navigator.serviceWorker.controller) {
    location.reload();
  } else {
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      location.reload();
    });
  }
})();`
}

/** Marker in index.html that the build replaces with `coiInlineGuardScript()`. */
export const COI_GUARD_PLACEHOLDER = '/* __COI_GUARD__ */'

/** Replace the placeholder; throws if it is missing, so a build can never ship
 *  without the guard (the one route list would silently stop applying). */
export function injectCoiGuard(html: string): string {
  if (!html.includes(COI_GUARD_PLACEHOLDER))
    throw new Error(`index.html is missing the ${COI_GUARD_PLACEHOLDER} placeholder`)
  return html.replace(COI_GUARD_PLACEHOLDER, () => coiInlineGuardScript())
}
