import { test, expect } from '@playwright/test'

/**
 * Compliance Scraper Validation Tests
 *
 * Uses Browser Context (page) to mimic real users and bypass basic
 * Cloudflare/Incapsula blocks that hit raw API requests.
 */

test.describe('Compliance Source Validation', () => {
  // Generous timeout for government websites
  test.setTimeout(90000)

  test('NIST FIPS 140-3 - Search List (Browser)', async ({ page }) => {
    // Navigate to the search page with filters active
    await page.goto(
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search/all?searchMode=Advanced&Standard=FIPS+140-3&ValidationStatus=Active&SecurityLevel=3',
      { waitUntil: 'domcontentloaded' }
    )

    // Assert: Table should appear. This implicitly waits for JS execution.
    const table = page.locator('#searchResultsTable')
    await expect(table).toBeVisible({ timeout: 30000 })

    // Assert: Rows should be present (scraped data)
    await expect(table.locator('tr').nth(1)).toBeVisible()
  })

  test('NIST FIPS 140-3 - Detail (Browser)', async ({ page }) => {
    // Stable Cert ID
    await page.goto(
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4282',
      { waitUntil: 'domcontentloaded' }
    )

    // Assert: Algo table OR "Approved Algorithms" header
    // NIST pages can be heavy, rely on text visibility of the section we deep-scrape
    await expect(page.locator('#fips-algo-table')).toBeVisible({ timeout: 30000 })
  })

  test('NIST ACVP - Search List (Browser)', async ({ page }) => {
    await page.goto(
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&algorithm=179&algorithm=180&ipp=25',
      { waitUntil: 'domcontentloaded' }
    )

    // ACVP often has an interstitial "Loading..." or Cloudflare check
    // page.goto handles the redirect, toBeVisible waits for the content
    const table = page.locator('.publications-table')
    await expect(table).toBeVisible({ timeout: 30000 })
  })

  // -------------------------------------------------------------------------
  // For Files (CSV/PDF), we still use request but can use the browser context's request
  // to share potential session state or just standard request if public.
  // Common Criteria portal is usually friendly to direct downloads.

  test('Common Criteria - CSV Download', async ({ request }) => {
    const response = await request.get(
      'https://www.commoncriteriaportal.org/products/certified_products.csv'
    )
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('Category')
    expect(body).toContain('Name')
  })

  test('Common Criteria - PDF Report', async ({ request }) => {
    const response = await request.get(
      'https://www.commoncriteriaportal.org/files/epfiles/0675a_pdf.pdf'
    )
    expect(response.status()).toBe(200)
    const contentType = response.headers()['content-type']
    // Accept typical pdf mime types
    expect(contentType?.toLowerCase()).toContain('pdf')
  })

  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------

  // BSI and ANSSI are no longer primary scrape targets.
  // They are derived from the Global Common Criteria CSV.
  // These tests now simply validate that the "External Links" we might point to are up.

  test('BSI Germany - Link Availability (Browser)', async ({ page }) => {
    const response = await page.goto(
      'https://www.bsi.bund.de/EN/Topics/Certification_and_Validation/Certificates/CC_Products/cc_products_node.html',
      { waitUntil: 'domcontentloaded' }
    )
    expect(response?.status()).toBe(200)
  })

  test('ANSSI France - Link Availability (Browser)', async ({ page }) => {
    const response = await page.goto('https://cyber.gouv.fr/en/certified-products', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(200)
  })

  test('ENISA EUCC - Link Availability (Browser)', async ({ page }) => {
    const response = await page.goto('https://certification.enisa.europa.eu/certificates_en', {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(200)
  })
})
