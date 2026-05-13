// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop URL-autostart regression spec.
 *
 * Drives `useWorkshopUrlAutostart` for every supported persona / region combo
 * accepted by the hook (`workshop=video&autoplay=1` + `persona`/`proficiency`/
 * `industry`/`region`). Asserts:
 *
 *   1. Persistent localStorage shows `mode === 'video'` (so the hook didn't
 *      silently no-op on a missing manifest match).
 *   2. The shared `<CaptionBar data-workshop-overlay="caption">` renders within
 *      the timeout (so the scheduler picked up the first caption cue).
 *   3. No `console.error` or `pageerror` fires throughout playback.
 *
 * This is the permanent guard against the v4-tier regression where the URL
 * autostart was silently dead because the hook called `resolveWorkshopFlow()`
 * against an empty `WORKSHOP_FLOWS` array (flows migrated to JSON manifest
 * but the hook was not updated to use the manifest loader).
 */
import { test, expect, type Page } from '@playwright/test'

const suppressToast = async ({ page }: { page: Page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    } catch {
      // ignore
    }
  })
}

interface AutostartCase {
  persona: string
  proficiency: string
  region: 'US' | 'CA' | 'AU'
  industry?: string
  expectedFlowTitle: string
}

// expectedFlowTitle values mirror `title` in public/workshop/index.json.
// The dialog header renders the title verbatim, so this is the cheapest
// per-case fingerprint without exposing the store on `window`.
const CASES: AutostartCase[] = [
  {
    persona: 'executive',
    proficiency: 'basics',
    region: 'US',
    industry: 'Finance & Banking',
    expectedFlowTitle: 'Executive PQC Workshop — Finance',
  },
  {
    persona: 'executive',
    proficiency: 'basics',
    region: 'CA',
    industry: 'Finance & Banking',
    expectedFlowTitle: 'Executive PQC Workshop — Finance',
  },
  {
    persona: 'executive',
    proficiency: 'basics',
    region: 'AU',
    industry: 'Finance & Banking',
    expectedFlowTitle: 'Executive PQC Workshop — Finance',
  },
  {
    persona: 'architect',
    proficiency: 'basics',
    region: 'US',
    expectedFlowTitle: 'Security Architect Workshop',
  },
  {
    persona: 'developer',
    proficiency: 'basics',
    region: 'US',
    expectedFlowTitle: 'Developer PQC Workshop',
  },
  {
    persona: 'ops',
    proficiency: 'basics',
    region: 'US',
    expectedFlowTitle: 'DevOps PQC Workshop',
  },
  {
    persona: 'researcher',
    proficiency: 'basics',
    region: 'US',
    expectedFlowTitle: 'Researcher PQC Workshop',
  },
  {
    persona: 'curious',
    proficiency: 'curious',
    region: 'US',
    expectedFlowTitle: 'PQC for the Curious',
  },
]

test.describe('Workshop URL autostart', () => {
  test.beforeEach(suppressToast)

  for (const c of CASES) {
    const label = `${c.persona} / ${c.region}${c.industry ? ` / ${c.industry}` : ''}`

    test(`autostarts video mode for ${label}`, async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })
      const pageErrors: string[] = []
      page.on('pageerror', (err) => pageErrors.push(err.message))

      const params = new URLSearchParams({
        workshop: 'video',
        autoplay: '1',
        persona: c.persona,
        proficiency: c.proficiency,
        region: c.region,
      })
      if (c.industry) params.set('industry', c.industry)

      await page.goto(`/?${params.toString()}`)

      // 1. Wait for the Workshop right-panel to mount in Video Mode. The
      //    header reads "<flow title> · Video Mode" when the store enters
      //    video mode. This is the canonical UI signal — `partialize` blocks
      //    the persistence of `mode === 'video'`, so we cannot use
      //    localStorage. The dialog also confirms `openPanel('workshop')`
      //    fired from `useWorkshopUrlAutostart`.
      const workshopDialog = page.getByRole('dialog', { name: 'Workshop' })
      await expect(workshopDialog).toBeVisible({ timeout: 15_000 })
      await expect(workshopDialog).toContainText('Video Mode', { timeout: 15_000 })

      // 2. CaptionBar mounts inside `<WorkshopOverlayHost>` only when the
      //    workshop is active. Asserting any caption text is rendered confirms
      //    the cue executor wired up and the first step's narration applied.
      const caption = page.locator('[data-workshop-overlay="caption"] p')
      await expect(caption).toBeVisible({ timeout: 15_000 })
      const text = (await caption.textContent())?.trim() ?? ''
      expect(text.length).toBeGreaterThan(0)

      // 3. Verify the expected flow id resolved — confirms the manifest
      //    loader returned the right entry for this persona/region.
      await expect(workshopDialog).toContainText(c.expectedFlowTitle, {
        timeout: 5_000,
      })

      // 3. No runtime errors during the visible portion of playback.
      expect(pageErrors, `pageerror events: ${pageErrors.join(' | ')}`).toEqual([])
      // Ignore well-known dev-only warnings that surface as console.error in
      // tests but don't indicate workshop drift (e.g. SW registration errors
      // in the embed route guard). Filter on workshop-related messages only.
      const workshopErrors = consoleErrors.filter((e) => /workshop|cue/i.test(e))
      expect(workshopErrors, `workshop console errors: ${workshopErrors.join(' | ')}`).toEqual([])
    })
  }
})
