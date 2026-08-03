import { test, expect } from '@playwright/test'

/**
 * PR-4 — the Simulation console respects a legibility floor (no rendered text
 * below 10px; body/labels at 11px via text-sim-micro, chips at 10px via
 * text-sim-chip) and ships a novice "Guided" mode that captions the dials in
 * plain language and persists across reloads.
 */
test.describe('Simulation — type floor & Guided mode (PR-4)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      // tourSeen so the first-run tour doesn't auto-open. Guard so a RELOAD
      // doesn't re-seed — addInitScript runs on every navigation, including reload.
      if (!localStorage.getItem('pqc-simulation')) {
        localStorage.setItem(
          'pqc-simulation',
          JSON.stringify({ state: { tourSeen: true }, version: 13 })
        )
      }
      localStorage.setItem(
        'pqc-assessment-form',
        JSON.stringify({
          state: {
            currentStep: 13,
            assessmentMode: 'comprehensive',
            industry: 'finance',
            country: 'US',
            currentCrypto: ['RSA-2048'],
            currentCryptoCategories: [],
            cryptoUnknown: false,
            dataSensitivity: ['high'],
            sensitivityUnknown: false,
            complianceRequirements: ['pci-dss'],
            complianceUnknown: false,
            migrationStatus: 'planning',
            migrationUnknown: false,
            cryptoUseCases: [],
            useCasesUnknown: false,
            dataRetention: [],
            retentionUnknown: false,
            credentialLifetime: [],
            credentialLifetimeUnknown: false,
            systemCount: '51-200',
            teamSize: '11-50',
            scaleUnknown: false,
            cryptoAgility: 'hardcoded',
            agilityUnknown: false,
            infrastructure: [],
            infrastructureUnknown: false,
            infrastructureSubCategories: {},
            vendorDependency: 'heavy-vendor',
            vendorUnknown: false,
            timelinePressure: 'within-2-3y',
            timelineUnknown: false,
            importComplianceSelection: true,
            importProductSelection: true,
            assessmentStatus: 'complete',
            lastWizardUpdate: '2026-01-01T00:00:00.000Z',
          },
          version: 0,
        })
      )
    })
    await page.goto('/report', { waitUntil: 'networkidle', timeout: 45_000 })
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('pqc-assessment-result')), {
        timeout: 30_000,
      })
      .toBeTruthy()
    await page.goto('/simulation', { waitUntil: 'networkidle', timeout: 45_000 })
    await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({
      timeout: 45_000,
    })
  })

  test('no rendered text in the console drops below the 10px floor', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      const out: { fs: number; text: string }[] = []
      document.querySelectorAll('main *').forEach((el) => {
        // only elements that render their OWN visible text node
        const ownText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ')
        if (!ownText) return
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const fs = parseFloat(getComputedStyle(el).fontSize)
        if (fs >= 1 && fs < 10) out.push({ fs, text: ownText.slice(0, 40) })
      })
      return out
    })
    expect(offenders, JSON.stringify(offenders)).toEqual([])
  })
})
