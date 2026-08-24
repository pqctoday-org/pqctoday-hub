#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * dom-golden.ts — the Rule 1 proof for the mobile UX layer
 * (IMPLEMENTATION-PLAN.md §5.6: "a desktop DOM-invariance check per touched
 * route at 1280×800, flag off, against pre-branch goldens").
 *
 * Captures a structural fingerprint of a curated route list at a desktop
 * viewport — NOT a raw HTML diff, which breaks on animation classes, random
 * ids and timestamps. The fingerprint is the ordered list of every element
 * with an ARIA role or that is a heading/link/button, as
 * (tag, role, accessible-name-or-text), plus the page's rendered innerText.
 * A change to this fingerprint means a REAL structural or content change,
 * which at ≥1024px with the mobile flag off is exactly what Rule 1 forbids.
 *
 * Usage:
 *   npx tsx scripts/mobile-ux/dom-golden.ts capture --base http://localhost:4599 --out scripts/mobile-ux/__golden__/desktop.json
 *   npx tsx scripts/mobile-ux/dom-golden.ts compare --base http://localhost:4599 --golden scripts/mobile-ux/__golden__/desktop.json
 */
import { chromium } from '@playwright/test'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const ROUTES = [
  '/',
  '/learn',
  '/explore',
  '/compliance',
  '/threats',
  '/algorithms',
  '/library',
  '/patents',
  '/leaders',
  '/assess',
  '/report',
  '/migrate',
  '/business',
  '/playground',
  '/timeline',
  '/about',
  // Added 2026-08-24 alongside the Simulation mobile work (Phase 9) — it was
  // never tracked before, so `compare` has no pre-branch golden for it yet
  // and will report SKIPPED until a `capture` is run against a clean
  // origin/main checkout (deliberately not done from this feature branch,
  // which already carries its own cumulative desktop changes — capturing
  // here would bake those in as a false "golden" instead of the real
  // pre-branch baseline). Like /playground, it may also need networkidle
  // tolerance investigated — both have timed out under this script's wait.
  '/simulation',
]

const SUPPRESS_OVERLAYS = () => {
  window.localStorage.setItem(
    'pqc-disclaimer-storage',
    JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
  )
  window.localStorage.setItem(
    'pqc-version-storage',
    JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
  )
  window.localStorage.setItem('pqc-tour-completed', 'true')
}

interface RouteFingerprint {
  route: string
  elementCount: number
  landmarks: string[]
  textLength: number
  textHash: string
}

async function fingerprintRoute(page: import('@playwright/test').Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle', timeout: 30_000 })
  await page.waitForTimeout(500) // settle lazy-loaded chunks

  const result = await page.evaluate(() => {
    // Every toast component (AchievementToast, PhaseCompletionToast,
    // AirplaneModeToast, …) renders `role="status" aria-live="polite"` —
    // a consistent convention across the codebase. Toasts are session/timing
    // -dependent BY DESIGN (achievement unlocks, daily-streak milestones);
    // excluding them isn't weakening the check, it's not treating transient
    // notifications as stable page structure in the first place. Found by a
    // real false positive: an "Achievement unlocked" toast appeared on
    // /timeline in one capture and not the other, with no code change
    // involved on either side.
    const TOAST_SELECTOR = '[role="status"]'
    const SELECTOR = 'a, button, [role], h1, h2, h3, h4, h5, h6'
    const nodes = Array.from(document.querySelectorAll(SELECTOR)).filter(
      (el) => !el.closest(TOAST_SELECTOR)
    )
    const landmarks = nodes.map((el) => {
      const role = el.getAttribute('role') ?? el.tagName.toLowerCase()
      const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 60) ?? ''
      return `${role}:${name}`
    })
    // Remove toasts from the LIVE tree (not a clone) before reading
    // innerText — a detached/cloned node doesn't get real layout, and
    // innerText depends on it (verified: a cloned body's innerText leaked
    // "Skip to main content", an sr-only element the real rendered body
    // correctly excludes). Safe to mutate here: this page is about to
    // navigate away for the next route regardless.
    document.querySelectorAll(TOAST_SELECTOR).forEach((toast) => toast.remove())
    const text = document.body.innerText ?? ''
    return { landmarks, text }
  })

  // Strip the one deliberately volatile bit of text every route renders via
  // MainLayout: __BUILD_TIMESTAMP__ (vite.config.ts's buildTimestampPlugin),
  // "Aug 23, 2026, 9:02 AM CDT" — different on every build, irrelevant to
  // whether the DOM changed. Without this every route falsely reads CHANGED
  // whenever the two builds being compared were minutes apart.
  //
  // Case-insensitive: MainLayout renders it through a CSS `uppercase` class,
  // and `innerText` (unlike `textContent`) reflects the CSS-transformed
  // visual text — "AUG 23, 2026, 9:33 AM CDT", not "Aug ...". This is exactly
  // what made every route falsely read CHANGED between two real builds a few
  // minutes apart: same length, one differing digit, silently un-stripped.
  const BUILD_TIMESTAMP_RE = /[A-Za-z]{3} \d{1,2}, \d{4}, \d{1,2}:\d{2}\s?[AP]M [A-Za-z]{2,5}/gi
  result.landmarks = result.landmarks.map((l) => l.replace(BUILD_TIMESTAMP_RE, '<build-ts>'))
  result.text = result.text.replace(BUILD_TIMESTAMP_RE, '<build-ts>')

  // djb2 — good enough to detect a change, not cryptographic.
  let hash = 5381
  for (let i = 0; i < result.text.length; i++) {
    hash = (hash * 33) ^ result.text.charCodeAt(i)
  }

  const fp: RouteFingerprint = {
    route,
    elementCount: result.landmarks.length,
    landmarks: result.landmarks,
    textLength: result.text.length,
    textHash: (hash >>> 0).toString(16),
  }
  return fp
}

function diffFingerprint(before: RouteFingerprint, after: RouteFingerprint): string[] {
  const diffs: string[] = []
  if (before.elementCount !== after.elementCount) {
    diffs.push(`element count ${before.elementCount} -> ${after.elementCount}`)
  }
  if (before.textHash !== after.textHash) {
    diffs.push(
      `rendered text changed (hash ${before.textHash} -> ${after.textHash}, length ${before.textLength} -> ${after.textLength})`
    )
  }
  const maxLen = Math.max(before.landmarks.length, after.landmarks.length)
  for (let i = 0; i < maxLen; i++) {
    if (before.landmarks[i] !== after.landmarks[i]) {
      diffs.push(
        `landmark[${i}]: "${before.landmarks[i] ?? '(none)'}" -> "${after.landmarks[i] ?? '(none)'}"`
      )
      break // one pointer is enough to locate the divergence
    }
  }
  return diffs
}

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0]
  const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:4599'
  const goldenPath = args.includes('--golden')
    ? args[args.indexOf('--golden') + 1]
    : args.includes('--out')
      ? args[args.indexOf('--out') + 1]
      : 'scripts/mobile-ux/__golden__/desktop.json'

  if (mode !== 'capture' && mode !== 'compare') {
    console.error('Usage: dom-golden.ts <capture|compare> --base <url> --golden|--out <path>')
    process.exit(2)
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    baseURL: base,
  })
  const page = await context.newPage()
  await page.addInitScript(SUPPRESS_OVERLAYS)

  const fingerprints: Record<string, RouteFingerprint> = {}
  for (const route of ROUTES) {
    process.stdout.write(`  ${route} ... `)
    try {
      fingerprints[route] = await fingerprintRoute(page, route)
      console.log('ok')
    } catch (err) {
      console.log(`FAILED: ${(err as Error).message}`)
    }
  }
  await browser.close()

  if (mode === 'capture') {
    mkdirSync(dirname(goldenPath), { recursive: true })
    writeFileSync(goldenPath, JSON.stringify(fingerprints, null, 2))
    console.log(
      `\nCaptured ${Object.keys(fingerprints).length} route fingerprints -> ${goldenPath}`
    )
    return
  }

  // compare
  const golden: Record<string, RouteFingerprint> = JSON.parse(readFileSync(goldenPath, 'utf-8'))
  let failed = false
  console.log('\n--- Rule 1 desktop DOM invariance ---')
  for (const route of ROUTES) {
    const before = golden[route]
    const after = fingerprints[route]
    if (!before || !after) {
      console.log(`  ${route}: SKIPPED (missing capture on one side)`)
      continue
    }
    const diffs = diffFingerprint(before, after)
    if (diffs.length === 0) {
      console.log(`  ${route}: unchanged`)
    } else {
      failed = true
      console.log(`  ${route}: CHANGED`)
      for (const d of diffs) console.log(`      - ${d}`)
    }
  }
  if (failed) {
    console.error('\nRule 1 VIOLATION: desktop DOM changed at ≥1024px with the mobile flag off.')
    process.exit(1)
  }
  console.log('\nRule 1 holds: desktop DOM unchanged.')
}

main()
