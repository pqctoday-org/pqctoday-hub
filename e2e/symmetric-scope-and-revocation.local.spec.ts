// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

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
  })
})

for (const width of [1280, 390]) {
  test(`Secure Boot distinguishes a matching image digest and a dated certificate record at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/secure-boot-pqc?tab=workshop')
    await page.getByRole('button', { name: /Analyze PQC Requirements/ }).press('Enter')
    await page.getByRole('button', { name: /Forbidden Signatures Database.*dbx/i }).press('Enter')
    const check = page.getByRole('region', { name: 'Sample dbx record decision' })
    const verdict = check.getByRole('status')
    await expect(verdict).toContainText('A matching image digest blocks the sample.')
    const record = check.getByRole('button', { name: 'dbx record type' })
    const chooseRecord = async (name: RegExp) => {
      await record.click()
      await page.getByRole('option', { name }).click()
    }
    await chooseRecord(/^Certificate digest/)
    await expect(verdict).toContainText('This entry permits further checks')
    await expect(verdict).toContainText(
      'Evaluate other dbx entries and the image’s trust against db.'
    )

    const timestamp = check.getByRole('button', { name: 'Image timestamp' })
    const setTimestamp = async (name: string) => {
      await timestamp.click()
      await page.getByRole('option', { name, exact: true }).click()
    }
    await setTimestamp('Verified and at or after revocation')
    await expect(verdict).toContainText('Blocked by this entry')
    await expect(verdict).toContainText('The verified timestamp is at or after revocation.')
    await setTimestamp('Missing or unverified')
    await expect(verdict).toContainText('The sample has no verified timestamp.')

    await setTimestamp('Verified and before revocation')
    const hasTimestampSupport = check.getByLabel('Firmware supports timestamp verification')
    await hasTimestampSupport.uncheck()
    await expect(timestamp).toBeDisabled()
    await expect(verdict).toContainText('The sample firmware cannot check timestamps.')
    await hasTimestampSupport.check()
    const dated = check.getByLabel('The record contains a nonzero revocation time')
    await dated.uncheck()
    await expect(verdict).toContainText('A zero revocation time makes the entry unconditional.')
    await dated.check()
    await expect(verdict).toContainText('This entry permits further checks')

    await chooseRecord(/^Image digest/)
    await expect(verdict).toContainText('Blocked by this entry')
    await check.getByLabel('Image matches the stored digest').uncheck()
    await expect(verdict).toContainText('The sample does not match the stored digest.')
    await expect(check.getByRole('link', { name: /UEFI 2.11/ })).toHaveAttribute(
      'href',
      /^https:\/\/uefi\.org\/specs\/UEFI\/2\.11/
    )
  })

  test(`the CRQC planner shows the same reference categories in the tool and report at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/business/tools/crqc-scenario')
    await page
      .getByText('Inspect symmetric, hash and post-quantum entries', { exact: true })
      .press('Enter')
    await expect(page.getByText(/AES-128 key search as its Category 1 reference/)).toBeVisible()
    await expect(page.getByText(/Category 2 to 256-bit hash collision search/)).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'NIST IR 8547, Table 1 and §4.1.3' })
    ).toHaveAttribute('href', 'https://csrc.nist.gov/pubs/ir/8547/final')

    const [file] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const receipt = await text(await file.createReadStream())
    expect(receipt).toContain('Algorithms outside the modeled Shor break')
    expect(receipt).toContain('AES-128 key search as its Category 1 reference')
    expect(receipt).toContain('for a specified SHA-256 digest is about 2^128 queries')
  })

  test(`the TEE key-size calculator distinguishes the three ideal query estimates at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/confidential-computing?tab=workshop&step=2')
    const keySize = page.getByRole('slider', { name: 'AES Key Size' })
    const exponent = page
      .getByText('Idealized Grover iterations', { exact: true })
      .locator('..')
      .locator('sup')
    const category = page.getByText('NIST category (definition)', { exact: true }).locator('..')
    for (const [key, bits, ref] of [
      ['Home', '64', /Category 1/],
      ['ArrowRight', '96', /Category 3/],
      ['End', '128', /Category 5/],
    ] as const) {
      await keySize.press(key)
      await expect(exponent).toHaveText(bits)
      await expect(category).toContainText(ref)
    }
  })

  test(`PQC 101 labels the SHA-256 comparison as specified-target search at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/pqc-101?tab=workshop')
    await page.getByRole('button', { name: /^Hash-Based/ }).press('Enter')
    const example = page.getByText('Ideal Grover preimage queries for a specified SHA-256 digest')
    await expect(example).toBeVisible()
    await expect(example.locator('..')).toContainText('2^128')
    await expect(
      page.getByText(/Finding any pair with the same digest is a different problem/)
    ).toBeVisible()
  })
}
