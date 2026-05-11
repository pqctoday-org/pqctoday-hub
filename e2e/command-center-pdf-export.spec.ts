// SPDX-License-Identifier: GPL-3.0-only
/**
 * Smoke test for the unified Command Center PDF export pipeline.
 *
 * Asserts that the drawer's "Download PDF" produces a real, vector PDF whose
 * text is selectable, contains the artifact title and table headers, and has
 * no leaked markdown markers. This is the post-fix counterpart of the audit
 * report at tasks/pdf-audit-report.md — flips Path A's gaps from red to green.
 */
import { test, expect, type Page } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const SEEDED_DOC = {
  id: 'pdf-test-raci-1',
  moduleId: 'pqc-governance',
  type: 'raci-matrix',
  title: 'PQC Migration RACI Matrix',
  data: `# PQC Migration RACI Matrix

Generated: 2026-05-08

## Summary

This artifact assigns **Responsible**, *Accountable*, Consulted, and Informed
roles for each PQC migration activity. Reference: \`CSWP.39 §5\`.

| Activity | CISO | CTO | Compliance Officer |
|----------|------|-----|--------------------|
| Inventory cryptographic assets | A | R | I |
| Define migration policy | A | C | C |
| Vendor PQC scorecards | C | I | A |
| Compliance reporting | I | I | A |

**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed
`,
  createdAt: Date.now(),
  approvalStatus: 'draft',
}

async function seedArtifact(page: Page): Promise<void> {
  await page.addInitScript((doc) => {
    // Suppress disclaimer + what's-new + persona picker so the page is
    // immediately interactive.
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'executive',
          hasSeenPersonaPicker: true,
          selectedRegion: 'americas',
          selectedIndustry: 'Finance & Banking',
          selectedIndustries: ['Finance & Banking'],
          suppressSuggestion: true,
          experienceLevel: 'expert',
          advancedViewsUnlocked: true,
        },
        version: 3,
      })
    )
    // Seed the module store (key + version match useModuleStore.ts).
    localStorage.setItem(
      'pki-module-storage',
      JSON.stringify({
        state: {
          version: '1.0.0',
          timestamp: Date.now(),
          // BusinessCenterView gates the zone panels behind a "fully empty"
          // check. Marking pqc-governance as in-progress flips
          // `governanceStarted` to true, which is enough to exit the welcome
          // state and render the zones (and our seeded artifact card).
          modules: {
            'pqc-governance': {
              status: 'in-progress',
              lastVisited: Date.now(),
              timeSpent: 1,
              completedSteps: [],
            },
          },
          artifacts: {
            keys: [],
            certificates: [],
            csrs: [],
            executiveDocuments: [doc],
          },
        },
        version: 14,
      })
    )
  }, SEEDED_DOC)
}

test.describe('Command Center — unified PDF export', () => {
  test('drawer "Download PDF" produces a vector PDF with real text', async ({ page }) => {
    test.skip(
      !canRunPdftotext(),
      'pdftotext (poppler) is required to verify PDF text. Install via: brew install poppler'
    )

    await seedArtifact(page)
    // ?zone=governance deep-link forces the governance panel open (where the
    // raci-matrix artifact lives). Without this the zone may be collapsed
    // depending on persona / density default.
    await page.goto('/business?zone=governance', {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })

    // Open the seeded artifact card in the drawer.
    const card = page.locator('[data-workshop-target="business-artifact-raci-matrix-view"]')
    await expect(card.first()).toBeVisible({ timeout: 15_000 })
    await card.first().click()

    // Drawer should be in view mode and the PDF button enabled.
    const pdfButton = page.locator('[data-workshop-target="business-artifact-export-pdf"]')
    await expect(pdfButton).toBeVisible()
    await expect(pdfButton).toBeEnabled()

    // Capture the download.
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 })
    await pdfButton.click()
    const download = await downloadPromise

    const outDir = join(tmpdir(), 'pdf-audit')
    mkdirSync(outDir, { recursive: true })
    const outPath = join(outDir, `raci-matrix-drawer-${Date.now()}.pdf`)
    await download.saveAs(outPath)

    // 1. File is a real PDF (magic header).
    const head = readFileSync(outPath).slice(0, 4).toString('ascii')
    expect(head).toBe('%PDF')

    // 2. Has selectable text — pdftotext extracts it.
    const text = execSync(`pdftotext -layout '${outPath}' -`, {
      encoding: 'utf8',
    })
    expect(text).toContain('PQC Migration RACI Matrix')
    expect(text).toContain('CISO')
    expect(text).toContain('Inventory cryptographic assets')
    expect(text).toContain('Compliance Officer')
    // Page footer.
    expect(text).toMatch(/Page 1 of \d+/)

    // 3. No raw markdown leaked into the visible text.
    expect(text).not.toMatch(/\*\*/)
    expect(text).not.toMatch(/`[A-Za-z]/) // backtick before a letter = unrendered code marker
    expect(text).not.toMatch(/\]\(http/)

    // 4. Vector — no embedded raster images. (`pdfimages -list` returns one
    //    header line + one row per image. Header alone = 0 images.)
    if (canRunPdfimages()) {
      const imgList = execSync(`pdfimages -list '${outPath}'`, { encoding: 'utf8' })
      const imageRows = imgList.split('\n').filter((l) => /^\s*\d+\s+\d+/.test(l))
      expect(imageRows.length).toBe(0)
    }
  })
})

function canRunPdftotext(): boolean {
  try {
    execSync('pdftotext -v', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function canRunPdfimages(): boolean {
  try {
    execSync('pdfimages -v', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
