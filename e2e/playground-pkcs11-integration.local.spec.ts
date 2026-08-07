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
  /**
   * Set for tools whose entire flow is gated behind a file upload — every
   * later step stays disabled until a file lands, so without this the tool
   * looks inert and reports zero PKCS#11 activity.
   */
  uploadsFile?: boolean
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
    // The wizard does nothing until a firmware image is supplied — the first
    // step IS the upload, and "Next Step" stays disabled without it.
    uploadsFile: true,
    // StepWizard shows step.actionLabel while a step is INCOMPLETE and only
    // swaps to "Next Step" once it has run, so a list of "Next Step" entries
    // drives exactly one step and then finds nothing. These are the real
    // action labels; keygen/sign/verify are steps 2-4.
    steps: [
      'Confirm Configuration',
      'Next Step',
      'Generate Both Keys',
      'Next Step',
      'Sign Both',
      'Next Step',
      'Verify Both Signatures',
    ],
  },
  {
    id: 'kdf-derivation',
    label: 'SP 800-108 KDF',
    route: '/playground/kdf-derivation',
    // The two middle steps are where the PKCS#11 work happens
    // (C_CreateObject then C_DeriveKey); an earlier list skipped straight from
    // the fetch to the KAT and so never touched the engine.
    steps: ['Fetch QKD Key', 'Import into HSM', 'Run KDF', 'Run NIST KAT'],
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
    // The PKCS#11 work lives in Step 2 (RootCAGenerator), not Step 1. The
    // compact "Step N" nav jumps parts directly and is never disabled; the
    // numbered "2Step 2: Create Root CA" tabs ARE gated on completing the
    // previous part, and an earlier step list matched those and silently
    // skipped every one of them.
    //
    // "Generate Root CA" alone still isn't enough: selectedKeyId already
    // defaults to a 'new-…' id, so clicking it regenerates a key CLASSICALLY
    // (OpenSSL) without ever calling handleKeySourceSelect — the only place
    // the HSM demo (hsm_generateRSAKeyPair et al.) runs. That handler fires
    // only when the Key Type dropdown is actually used, so the flow has to
    // open it (its trigger shows the current selection, "RSA (4096 bits)")
    // and pick an option ("ML-DSA-87 (FIPS 204)") before generating.
    steps: ['Step 2', 'RSA (4096 bits)', 'ML-DSA-87', 'Generate Root CA'],
  },
  {
    id: 'merkle-proof',
    label: 'Merkle Tree Workshop',
    route: '/playground/merkle-proof',
    // Same shape as pki-workshop: the HSM surface is the CT Log simulator in
    // Step 5, reachable directly via the compact nav. Steps 1-4 are pure
    // hashing and never touch the engine.
    // "CA Key" rather than "Generate CA Key": the button interpolates the
    // selected algorithm ("Generate ML-DSA-65 CA Key"), and step entries are
    // matched as CONTIGUOUS substrings. Loading samples then signs the tree
    // head with that key.
    steps: ['Step 5', 'CA Key', 'Load 5 samples'],
  },
  {
    id: 'suci-flow',
    label: '5G SUCI Construction',
    route: '/playground/suci-flow',
    steps: [
      'Execute Step',
      'Execute Step',
      'Execute Step',
      'Execute Step',
      'Execute Step',
      'Run NIST KAT',
    ],
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

/**
 * Per-panel counts of CRYPTOGRAPHIC calls — the log minus session/slot/token
 * management. Raw log length is the wrong measure: useHSM's initialize()
 * emits ~18 setup calls on mount, and a panel that only appears partway
 * through a flow brings all of them with it, so its arrival alone would read
 * as "the tool did 18 calls' worth of work".
 */
async function readLogEntries(page: Page): Promise<number[]> {
  return page
    .locator('[data-testid="pkcs11-log-panel"]')
    .evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-pkcs11-crypto-entries') ?? 0)))
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

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

      if (tool.uploadsFile) {
        const input = page.locator('input[type=file]').first()
        if (await input.count()) {
          await input.setInputFiles({
            name: 'firmware.bin',
            mimeType: 'application/octet-stream',
            buffer: Buffer.from(new Uint8Array(2048).fill(0x5a)),
          })
          await page.waitForTimeout(5_000)
        }
      }

      // Baseline BEFORE driving. useHSM's initialize() already logs ~18 calls
      // of session setup (C_Initialize / C_GetSlotList / C_InitToken /
      // C_OpenSession / C_Login ...) on mount, so a non-zero log is NOT
      // evidence that the tool's own flow did any crypto. Only the delta is.
      const entriesBefore = await readLogEntries(page)

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

      // ── Dimensions 2 & 3 are read from the shared components' own DOM
      // hooks, never from rendered prose. ───────────────────────────────
      //
      // The first version of this spec pattern-matched panel titles
      // (/PKCS#11 (Call Log|trace|Calls)/) and inventory copy. That produced
      // FALSE failures: tools title their panels freely — "PKCS#11 Call Log —
      // Envelope Encryption", but also "Rust Engine · PKCS#11 Log" (lms-hss)
      // and "PKCS#11 Hybrid Cert Gen Log" (hybrid-certs), neither of which
      // matched. Loosening the regex is not the fix, because unrelated prose
      // mentions PKCS#11 too (a VPN tooltip describes "all PKCS#11 calls ...
      // logged"), so a looser pattern trades false negatives for false
      // positives. Pkcs11LogPanel and HsmKeyInspector therefore expose
      // data-testid + a count attribute, and this reads those.
      //
      // Counts come from the FULL log, not the visible rows, so a collapsed or
      // filtered panel is judged on what the engine recorded rather than on
      // what happens to be painted.
      const logCounts = await readLogEntries(page)
      const logPanelPresent = logCounts.length > 0
      // A tool may mount several panels (lms-hss shows one per engine), and
      // some legitimately stay empty — only ALL-zero means "mounted, not fed".
      const zeroCallCount = logPanelPresent && logCounts.every((n) => n === 0)
      const logDelta = sum(logCounts) - sum(entriesBefore)

      const inventories = await page.locator('[data-testid="hsm-key-inspector"]').all()
      const keyCounts = await Promise.all(
        inventories.map(async (p) => Number((await p.getAttribute('data-hsm-key-count')) ?? 0))
      )
      const hasInventory = inventories.length > 0
      const inventoryEmpty = hasInventory && keyCounts.every((n) => n === 0)

      // A tool with no log panel at all can only be judged from rendered text,
      // where a C_* name alone proves nothing (several tools print operation
      // names as static labels via LiveHSMToggle's `operations` prop) — so
      // there it takes a C_* AND a CKR_* return code, which static copy never
      // carries.
      const textEvidence = cCalls.length > 0 && rvs.length > 0
      const droveTheEngine = logPanelPresent ? logDelta > 0 : textEvidence

      const diag =
        `clicks=${clicks} logDelta=${logDelta} (before=[${entriesBefore.join(',')}] after=[${logCounts.join(',')}]) ` +
        `C_*=[${cCalls.join(',')}] CKR=[${rvs.join(',')}] ` +
        `logPanel=${logPanelPresent ? (zeroCallCount ? 'PRESENT-BUT-0' : 'present') : 'absent'} ` +
        `inventory=${hasInventory ? (inventoryEmpty ? 'EMPTY' : `populated keys=[${keyCounts.join(',')}]`) : 'absent'}`

      // ── Dimension 1: did the tool's own flow reach the engine? ─────────
      // Measured as the GROWTH in logged calls across the driven flow, not as
      // text scraped from the panel. Two earlier instruments were wrong:
      // scraping rows misses a collapsed panel entirely (hybrid-certs was
      // reported as making zero calls while its log held 1000 entries), and an
      // absolute count credits useHSM's ~18 mount-time setup calls to the tool.
      // The delta comes from the logging proxy wrapping the real module, so it
      // cannot be faked by static UI copy.
      expect(clicks, `${tool.id}: no action button was driven — ${diag}`).toBeGreaterThan(0)
      expect(
        droveTheEngine,
        `${tool.id}: driving the flow produced no new PKCS#11 calls, so its crypto is not running on the engine — ${diag}`
      ).toBe(true)

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
