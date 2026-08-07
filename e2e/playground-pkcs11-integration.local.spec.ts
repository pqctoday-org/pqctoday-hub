// SPDX-License-Identifier: GPL-3.0-only
//
// In-browser PKCS#11 integration validation for the hub playground.
//
// Every tool below imports real `hsm_*` helpers from src/wasm/softhsm and/or
// renders a Pkcs11LogPanel — i.e. each one CLAIMS its crypto runs on the
// WASM softhsm engine. This spec checks the claim the only way that counts:
// drive the tool in a real browser and look for genuine C_* call names and
// CK_RV return codes in the rendered log.
//
// Why a generic multi-step driver rather than a per-tool script: most of
// these are staged flows (generate key -> sign -> verify) where later steps
// stay disabled until earlier ones finish. An earlier ad-hoc probe that
// clicked one button and waited reported false negatives on four tools that
// were in fact wired correctly — the probe was wrong, not the tools. The
// driver clicks whatever action buttons are ENABLED, in order, re-reading
// after each click so newly-enabled steps get run too.
//
// Evidence rule: a C_* token alone is not proof, because some tools print
// operation names as static labels. A tool passes only when a C_* name AND a
// CKR_* return code both appear — return codes are emitted by the logging
// proxy over the real engine and cannot come from static copy.
//
// Venue: *.local.test — heavy WASM, local gate only, not CI.
import { test, expect, type Page } from '@playwright/test'

interface Tool {
  id: string
  label: string
  /** Playground route. */
  route: string
  /** Some tools need a specific first click to reach their live panel. */
  warmup?: RegExp
  /**
   * Explicit click sequence for tools the generic driver cannot walk.
   * Needed because several tools are numbered wizards whose buttons don't
   * match an "action verb" shape ("2Step 2: Create Root CA"), or gate their
   * real action behind a data-loading click ("Load 8 sample certs"). Entries
   * are matched as substrings and skipped when absent or disabled, so a tool
   * that changes its labels degrades to "not driven" rather than a false pass.
   */
  steps?: string[]
}

// Playground-reachable tools whose components claim PKCS#11.
const TOOLS: Tool[] = [
  {
    id: 'envelope-encrypt',
    label: 'Envelope Encryption (KMS)',
    route: '/playground/envelope-encrypt',
  },
  { id: 'tee-channel', label: 'TEE-HSM Secure Channel', route: '/playground/tee-channel' },
  { id: 'token-migration', label: 'Multi-Algorithm Signing', route: '/playground/token-migration' },
  { id: 'hybrid-encrypt', label: 'Hybrid KEM + ECDH', route: '/playground/hybrid-encrypt' },
  { id: 'lms-hss', label: 'Stateful Hash Signatures', route: '/playground/lms-hss' },
  { id: 'slh-dsa', label: 'SLH-DSA Sign & Verify', route: '/playground/slh-dsa' },
  { id: 'hybrid-certs', label: 'Hybrid Certificates', route: '/playground/hybrid-certs' },
  {
    id: 'firmware-signing',
    label: 'Firmware Signing',
    route: '/playground/firmware-signing',
    steps: ['Next Step', 'Next Step', 'Next Step', 'Next Step', 'Run NIST KAT'],
  },
  {
    id: 'kdf-derivation',
    label: 'SP 800-108 KDF',
    route: '/playground/kdf-derivation',
    steps: ['Fetch QKD Key', 'Run NIST KAT'],
  },
  {
    id: 'hybrid-sigs',
    label: 'Hybrid Signature Spectrums',
    route: '/playground/hybrid-sigs',
    // "Retry" is present because this tool's HSM init fails on load, leaving
    // "Generate Key Pairs" disabled — retry first, then walk the flow.
    steps: ['Retry', 'Generate Key Pairs', 'Sign', 'Verify'],
  },
  {
    id: 'pki-workshop',
    label: 'PKI Workshop',
    route: '/playground/pki-workshop',
    steps: ['Generate New RSA', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
  },
  {
    id: 'merkle-proof',
    label: 'Merkle Tree Workshop',
    route: '/playground/merkle-proof',
    steps: ['Load 8 sample certs', 'Build Tree', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
  },
  {
    id: 'suci-flow',
    label: '5G SUCI Construction',
    route: '/playground/suci-flow',
    steps: ['Execute Step', 'Execute Step', 'Execute Step', 'Execute Step', 'Run NIST KAT'],
  },
]

const ACTION =
  /^(generate|run|execute|sign|verify|derive|encaps|decaps|start|create|wrap|unwrap|build|issue|mint|step\s*\d|\d\s*\.)/i
// Buttons that look like actions but navigate away, reset, or open docs.
// "Run NIST KAT" is deliberately NOT excluded — a KAT run drives the real
// engine, and excluding it left two tools with zero drivable actions.
const NOT_ACTION = /(reset|start over|clear|back|docs|learn more|copy|download|export|what runs)/i

async function suppressModals(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
}

/** Click enabled action buttons in order, re-reading after each so that steps
 *  unlocked by a previous step also run. Returns how many clicks landed. */
async function driveFlow(page: Page, maxSteps = 8): Promise<number> {
  let clicks = 0
  const clicked = new Set<string>()
  for (let step = 0; step < maxSteps; step++) {
    const candidates = await page
      .locator('button:not([disabled])')
      .evaluateAll((els) => els.map((e, i) => ({ i, text: (e.textContent || '').trim() })))
    const next = candidates.find(
      (c) =>
        c.text &&
        c.text.length < 48 &&
        ACTION.test(c.text) &&
        !NOT_ACTION.test(c.text) &&
        !clicked.has(c.text)
    )
    if (!next) break
    clicked.add(next.text)
    const btn = page.getByRole('button', { name: next.text, exact: true }).first()
    if (!(await btn.count())) continue
    await btn.click({ timeout: 20_000 }).catch(() => {})
    clicks++
    // WASM keygen (SLH-DSA especially) is slow; give each step real time.
    await page.waitForTimeout(9_000)
  }
  return clicks
}

/** Walk an explicit step list. Each entry is matched as a substring against
 *  ENABLED buttons only; a missing or still-disabled step is skipped rather
 *  than failing, so the verdict reflects how far the tool actually got. */
async function driveSteps(page: Page, steps: string[]): Promise<number> {
  let clicks = 0
  for (const step of steps) {
    const btn = page.locator('button:not([disabled])', { hasText: step }).first()
    if (!(await btn.count())) continue
    await btn.click({ timeout: 20_000 }).catch(() => {})
    clicks++
    await page.waitForTimeout(9_000)
  }
  return clicks
}

test.describe('hub playground — in-browser PKCS#11 integration', () => {
  for (const tool of TOOLS) {
    test(`${tool.label} executes real PKCS#11 calls`, async ({ page }) => {
      test.setTimeout(240_000)
      await suppressModals(page)
      await page.goto(tool.route)
      await page.waitForTimeout(7_000)

      if (tool.warmup) {
        const w = page.getByRole('button', { name: tool.warmup }).first()
        if (await w.count()) await w.click().catch(() => {})
        await page.waitForTimeout(3_000)
      }

      const clicks = tool.steps ? await driveSteps(page, tool.steps) : await driveFlow(page)

      // Pkcs11LogPanel's header TOGGLES, and tools differ on whether it
      // starts open (SSH sim passes defaultOpen) or collapsed (the default).
      // Blindly clicking it therefore *hid* the rows on tools that shipped it
      // open — an earlier run of this spec lost evidence that way. So read the
      // page in both states and union the findings: whichever state exposes
      // the log, the evidence is captured.
      const bodyBefore = await page.evaluate(() => document.body.innerText)
      for (const rx of [/PKCS#11 Call Log/i, /PKCS#11 trace/i, /PKCS#11 Calls/i]) {
        const header = page.getByText(rx).first()
        if (await header.count()) {
          await header.click({ timeout: 5_000 }).catch(() => {})
          await page.waitForTimeout(900)
        }
      }
      await page.waitForTimeout(1_200)
      const bodyAfter = await page.evaluate(() => document.body.innerText)
      const body = `${bodyBefore}\n${bodyAfter}`

      const cCalls = [...new Set(body.match(/\bC_[A-Z][A-Za-z]+/g) ?? [])]
      const rvs = [...new Set(body.match(/\bCKR_[A-Z_]+/g) ?? [])]

      // ── Dimension 2: is a call LOG actually exposed to the user? ───────
      // Note the C_* + CKR_* pair asserted below already proves a LIVE
      // trace — static UI labels never carry return codes. So this dimension
      // is specifically about whether the user can SEE it: a tool can drive
      // the engine correctly and still surface nothing.
      // Not asserted via a "(N calls)" count: panels render their size
      // differently (the SSH panel uses "(N calls)", others don't), and an
      // absent count was misread as a failure on the first run.
      const logPanelPresent = /PKCS#11\s*(Call Log|trace|Calls)/i.test(body)
      const zeroCallCount = /\(0\s+calls?\)/.test(body)

      // ── Dimension 3: does the KEY INVENTORY reflect what was created? ──
      // Detected by HsmKeyInspector's own states, NOT by a loose "\d+ keys"
      // match — that grabbed the "256" out of "AES-256" on the first run.
      // Empty state is the literal "No keys yet"; presence is the registry
      // heading. Anything else means this tool has no inventory surface.
      const hasInventory = /Key Registry|Key Inspector/i.test(body)
      const inventoryEmpty = /No keys yet/i.test(body)

      const diag =
        `clicks=${clicks} C_*=[${cCalls.join(',')}] CKR=[${rvs.join(',')}] ` +
        `logPanel=${logPanelPresent ? (zeroCallCount ? 'PRESENT-BUT-0' : 'present') : 'absent'} ` +
        `inventory=${hasInventory ? (inventoryEmpty ? 'EMPTY' : 'populated') : 'absent'}`

      // Dimension 1 — real crypto reached the engine.
      expect(clicks, `${tool.id}: no action button was driven — ${diag}`).toBeGreaterThan(0)
      expect(
        cCalls.length,
        `${tool.id}: no C_* calls after driving the flow — ${diag}`
      ).toBeGreaterThan(0)
      expect(
        rvs.length,
        `${tool.id}: C_* names present but no CK_RV return code, so the names may be static labels rather than a live trace — ${diag}`
      ).toBeGreaterThan(0)

      // Dimension 2 — the user can see the trace, and it isn't stuck at zero.
      expect(
        logPanelPresent,
        `${tool.id}: made real PKCS#11 calls but exposes no call-log panel, so the activity is invisible to a learner — ${diag}`
      ).toBe(true)
      expect(
        zeroCallCount,
        `${tool.id}: log panel is mounted but still reports (0 calls) after a driven flow — mounted, not fed — ${diag}`
      ).toBe(false)

      // Dimension 3 — inventory agrees that keys exist. Only asserted where
      // the tool surfaces an inventory at all; pure derive/KDF flows
      // legitimately create no long-lived key objects.
      if (hasInventory) {
        expect(
          inventoryEmpty,
          `${tool.id}: key inventory still reads "No keys yet" after a flow that made real PKCS#11 calls — ${diag}`
        ).toBe(false)
      }
    })
  }
})
