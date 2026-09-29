// Deep links to a specific resource must OPEN that resource — on desktop and on
// a phone, for a first-time visitor and a returning one — and must not "fall
// flat" behind the page's default or saved filters.
//
// Local tier only (`*.local.spec.ts` → `--project=local`, run by gate:release),
// never CI. Built from the 2026-09-28 deep-link audit's browser probe
// (deeplink-gap-audit-09282026.md, §6), where every case below failed on
// ff8a76f21. Run against a production build for stable timing:
//   npm run build && npx playwright test --project=local e2e/deeplinks.local.spec.ts
// (E2E_SERVER=dev works too but is slower on first compile of each page.)

import { test, expect, type Page } from '@playwright/test'

type Visitor = 'first-visit' | 'returning'

/** Suppress the blocking overlays a returning reader has already dismissed.
 *  A first-time visitor gets nothing seeded, so the disclaimer and the mobile
 *  role picker are live — which is the point of those cases. */
async function seed(page: Page, visitor: Visitor, extra: Record<string, string> = {}) {
  await page.addInitScript(
    ({ visitor, extra }) => {
      if (sessionStorage.getItem('__deeplink_seeded')) return
      sessionStorage.setItem('__deeplink_seeded', '1')
      if (visitor === 'returning') {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
        )
        localStorage.setItem('pqc-tour-completed', 'true')
        localStorage.setItem(
          'pqc-learning-persona',
          JSON.stringify({
            state: {
              selectedPersona: null,
              hasSkippedPersonalization: true,
              selectedRegion: 'global',
              selectedIndustries: [],
            },
            version: 11,
          })
        )
      }
      for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v)
    },
    { visitor, extra }
  )
}

const persona = (state: Record<string, unknown>) =>
  JSON.stringify({ state: { hasSkippedPersonalization: true, ...state }, version: 11 })

/** The opened resource: a dialog / drawer / sheet that contains `text`. */
const opened = (page: Page, text: string) =>
  page.locator('[role="dialog"]:visible').filter({ hasText: text }).first()

const notice = (page: Page, kind: 'widened' | 'not-found') =>
  page.getByTestId(`deeplink-notice-${kind}`).first()

test.describe.configure({ mode: 'parallel' })
test.setTimeout(90_000)

test.describe('desktop — resource links open the resource', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  const cases: {
    name: string
    url: string
    open?: string
    visible?: string
    notice?: 'widened' | 'not-found'
    storage?: Record<string, string>
  }[] = [
    {
      name: 'library ?ref',
      url: '/library?ref=KpqC-Competition-Results',
      open: 'Korean Post-Quantum',
    },
    {
      name: 'library retired ref forwards to its successor',
      url: '/library?ref=PKCS11-V32-OASIS',
      open: 'PKCS',
      notice: 'not-found',
    },
    {
      name: 'library ref hidden by executive role narrowing',
      url: '/library?ref=FIPS%20203',
      open: 'Module-Lattice-Based Key-Encapsulation',
      notice: 'widened',
      storage: {
        'pqc-learning-persona': persona({ selectedPersona: 'executive', selectedRegion: 'global' }),
      },
    },
    { name: 'threats ?id', url: '/threats?id=FIN-001', open: 'Project Leap' },
    { name: 'threats draft id', url: '/threats?id=HLTH-001', notice: 'not-found' },
    {
      name: 'patents bare number (search/Assistant form)',
      url: '/patents?patent=12676741',
      open: 'Key exchange system',
    },
    {
      name: 'patents non-PQC patent widens PQC-only scope',
      url: '/patents?patent=US12580751',
      open: 'Fast post-quantum cryptographic sortition',
      notice: 'widened',
    },
    {
      name: 'algorithms highlight hidden by NIST picks',
      url: '/algorithms?tab=detailed&highlight=FrodoKEM-640',
      visible: 'FrodoKEM-640',
      notice: 'widened',
    },
    {
      name: 'algorithms protocol without tab',
      url: '/algorithms?protocol=tls-1-3',
      open: 'TLS 1.3',
    },
    {
      name: 'timeline event not first in its row',
      url: '/timeline?event=CCCS%20PQC%20Migration%20Roadmap%20Published',
      open: 'CCCS PQC Migration Roadmap Published',
    },
    { name: 'migrate product by id', url: '/migrate?productIds=softhsm2', visible: 'SoftHSM2' },
    {
      name: 'migrate product by name',
      url: '/migrate?product=BTQ%20Bitcoin%20Quantum',
      visible: 'BTQ Bitcoin Quantum',
    },
    {
      name: 'migrate retired product id',
      url: '/migrate?productIds=google-cloud-kms-cloud-gateway',
      notice: 'not-found',
    },
    {
      name: 'community contributor behind the curated-only default (%20)',
      url: '/leaders?leader=Aaron%20Voisine',
      visible: 'Aaron Voisine',
      notice: 'widened',
    },
    { name: 'compliance framework', url: '/compliance?framework=CNSA-2', open: 'CNSA 2.0' },
    {
      name: 'compliance cert beyond the first rows',
      url: '/compliance?cert=5332',
      open: 'AWS Scalable Network',
    },
    {
      name: 'compliance historical cert widens record scope',
      url: '/compliance?cert=4967',
      open: 'Dell BSAFE',
      notice: 'widened',
    },
    {
      name: 'compliance retired framework',
      url: '/compliance?framework=MICA-EU-MARKETS-IN-CRYPTO-ASSE',
      notice: 'not-found',
    },
  ]

  // PR 2 — resources that had no URL before.
  cases.push(
    {
      name: 'algorithms ?algo by id opens the detail drawer',
      url: '/algorithms?algo=ml-kem-768',
      open: 'ML-KEM-768',
    },
    {
      name: 'algorithms ?algo by old exact name',
      url: '/algorithms?algo=FN-DSA-512',
      open: 'FN-DSA-512',
    },
    {
      name: 'library table view opens the drawer',
      url: '/library?view=table&ref=KpqC-Competition-Results',
      open: 'Korean Post-Quantum',
    },
    {
      name: 'community ?leader by leader_id',
      url: '/leaders?leader=stavros-kousidis',
      visible: 'Stavros Kousidis',
    },
    {
      name: 'migrate ?vendor opens its roadmap',
      url: '/migrate?vendor=VND-001',
      visible: 'AWS post-quantum cryptography migration plan',
    },
    { name: 'migrate ?domain selects the domain', url: '/migrate?domain=hsm', visible: 'SoftHSM2' },
    {
      name: 'migrate legacy ?q= from search resolves the product',
      url: '/migrate?q=SoftHSM2',
      visible: 'SoftHSM2',
    },
    {
      name: 'compliance ?reqfw preselects the requirements framework',
      url: '/compliance?reqfw=CNSA-2',
      visible: 'CNSA 2.0',
    }
  )

  for (const c of cases) {
    test(c.name, async ({ page }) => {
      await seed(page, 'returning', c.storage)
      await page.goto(c.url)
      if (c.open) await expect(opened(page, c.open)).toBeVisible({ timeout: 30_000 })
      if (c.visible)
        await expect(page.getByText(c.visible).first()).toBeVisible({ timeout: 30_000 })
      if (c.notice) await expect(notice(page, c.notice)).toBeVisible({ timeout: 30_000 })
    })
  }

  test('patents ?sq opens the Search tab with the query', async ({ page }) => {
    await seed(page, 'returning')
    await page.goto('/patents?sq=lattice')
    await expect(page.getByRole('tab', { name: 'Search' })).toHaveAttribute(
      'aria-selected',
      'true',
      {
        timeout: 30_000,
      }
    )
    await expect(page.locator('input[value="lattice"]').first()).toBeVisible()
  })

  test('compliance evref without a tab lands on CSWP.39', async ({ page }) => {
    await seed(page, 'returning')
    await page.goto('/compliance?evref=CMMC-2.0-MODEL')
    await expect(page.getByRole('tab', { name: /CSWP\.39/ })).toHaveAttribute(
      'aria-selected',
      'true',
      {
        timeout: 30_000,
      }
    )
  })

  test('compliance landscape is not empty for a reader with a saved region', async ({ page }) => {
    await seed(page, 'returning', {
      'pqc-learning-persona': persona({
        selectedPersona: 'grc',
        selectedRegion: 'eu',
        selectedIndustries: [],
      }),
    })
    await page.goto('/compliance?tab=compliance')
    await expect(page.getByText(/Your region:/).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('No entries match your current selection')).toHaveCount(0)
  })

  test('timeline shows every country to a first-time desktop visitor', async ({ page }) => {
    await seed(page, 'returning')
    await page.goto('/timeline')
    await expect
      .poll(async () => page.locator('tr[data-deeplink-id]').count(), { timeout: 30_000 })
      .toBeGreaterThan(20)
  })
})

test.describe('phone — resource links open the resource, even on a first visit', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })

  const cases: { name: string; url: string; open: string }[] = [
    {
      name: 'library ?ref',
      url: '/library?ref=KpqC-Competition-Results',
      open: 'Korean Post-Quantum',
    },
    { name: 'patents ?patent', url: '/patents?patent=US12676741', open: 'Key exchange system' },
    {
      name: 'community ?leader',
      url: '/leaders?leader=Stavros%20Kousidis',
      open: 'Stavros Kousidis',
    },
    { name: 'compliance ?framework', url: '/compliance?framework=NIST', open: 'NIST' },
    { name: 'compliance ?cert', url: '/compliance?cert=5528', open: '5528' },
    {
      name: 'timeline ?event',
      url: '/timeline?event=PQC%20Best%20Practices%20Published',
      open: 'PQC Best Practices Published',
    },
    {
      name: 'migrate ?product',
      url: '/migrate?product=BTQ%20Bitcoin%20Quantum',
      open: 'BTQ Bitcoin Quantum',
    },
    { name: 'protocol matrix ?protocol', url: '/algorithms?tab=support&protocol=ssh', open: 'SSH' },
    { name: 'threats ?id', url: '/threats?id=FIN-001', open: 'Project Leap' },
  ]

  for (const visitor of ['first-visit', 'returning'] as const) {
    for (const c of cases) {
      test(`${c.name} (${visitor})`, async ({ page }) => {
        await seed(page, visitor)
        await page.goto(c.url)
        await expect(page.getByText(/who.s asking/i)).toHaveCount(0)
        await expect(opened(page, c.open)).toBeVisible({ timeout: 30_000 })
      })
    }
  }
})

// PR 4 — while an item drawer / modal / sheet is open, the overlay covers the
// top-bar Share, so each item overlay carries its own. It must copy the CLEAN
// item link (page + item param, no filters) and leave the overlay open.
test.describe('share from inside an open item overlay', () => {
  const cases: { name: string; url: string; open: string; expected: string }[] = [
    {
      name: 'library drawer',
      url: '/library?ref=KpqC-Competition-Results&sort=newest',
      open: 'Korean Post-Quantum',
      expected: '/library?ref=KpqC-Competition-Results',
    },
    {
      name: 'threat dialog',
      url: '/threats?id=FIN-001&mode=cards',
      open: 'Project Leap',
      expected: '/threats?id=FIN-001',
    },
    {
      name: 'patent drawer',
      url: '/patents?patent=US12676741',
      open: 'Key exchange system',
      expected: '/patents?patent=US12676741',
    },
    {
      name: 'algorithm drawer',
      url: '/algorithms?algo=ml-kem-768',
      open: 'ML-KEM-768',
      expected: '/algorithms?algo=ml-kem-768',
    },
    {
      name: 'protocol modal',
      url: '/algorithms?tab=support&protocol=ssh&matrixView=detailed',
      open: 'SSH',
      expected: '/algorithms?tab=support&protocol=ssh',
    },
    {
      name: 'compliance framework drawer',
      url: '/compliance?framework=CNSA-2',
      open: 'CNSA 2.0',
      expected: '/compliance?framework=CNSA-2',
    },
    {
      name: 'compliance record',
      url: '/compliance?cert=5528',
      open: '5528',
      expected: '/compliance?cert=5528',
    },
  ]

  for (const viewport of ['desktop', 'phone'] as const) {
    test.describe(viewport, () => {
      test.use(
        viewport === 'phone'
          ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
          : { viewport: { width: 1440, height: 900 } }
      )
      for (const c of cases) {
        test(c.name, async ({ page, context }) => {
          await context.grantPermissions(['clipboard-read', 'clipboard-write'])
          // Force the Copy-link menu path (no OS share sheet in the test browser).
          await page.addInitScript(() => {
            // ShareButton tests `'share' in navigator`, so the method must be gone,
            // not just undefined.
            delete (Navigator.prototype as { share?: unknown }).share
            delete (navigator as { share?: unknown }).share
          })
          await seed(page, 'returning')
          await page.goto(c.url)
          const overlay = opened(page, c.open)
          await expect(overlay).toBeVisible({ timeout: 30_000 })
          await overlay
            .getByRole('button', { name: /^Share / })
            .first()
            .click()
          await page
            .getByRole('menu')
            .getByRole('button', { name: /Copy link/ })
            .click()
          await expect(overlay).toBeVisible()
          const copied = await page.evaluate(() => navigator.clipboard.readText())
          expect(new URL(copied).pathname + new URL(copied).search).toBe(c.expected)
        })
      }
    })
  }
})
