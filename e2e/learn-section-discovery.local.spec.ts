// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

const workshops = [
  ['architect', 'dnssec-pqc', 'validation chain walkthrough', /validation chain/i, 1],
  ['developer', 'crypto-registry', 'algorithm name normalizer', /algorithm name/i, 0],
  ['developer', 'api-security-jwt', 'jwt inspector', /JWT inspector/i, 0],
  ['developer', 'code-signing', 'binary signing', /binary signing/i, 0],
  ['developer', 'crypto-agility', 'cbom scanner', /CBOM scanner/i, 1],
  ['developer', 'pki-enrollment-protocols', 'cmp initial request', /CMP initial request/i, 1],
  ['ops', 'hsm-pqc', 'pkcs#11 simulator', /PKCS#11 simulator/i, 0],
  ['ops', 'database-encryption-pqc', 'encryption layer mapper', /encryption layer mapper/i, 0],
  ['ops', 'network-security-pqc', 'ngfw cipher policy analyzer', /NGFW cipher policy/i, 0],
  ['ops', 'web-gateway-pqc', 'handshake budget calculator', /handshake budget/i, 2],
  ['ops', 'secure-boot-pqc', 'tpm key hierarchy explorer', /TPM hierarchy/i, 2],
  ['ops', 'secrets-management-pqc', 'vault transit simulator', /Vault transit simulator/i, 1],
  ['ops', 'platform-eng-pqc', 'pipeline crypto inventory', /pipeline crypto inventory/i, 0],
  ['ops', 'verification-closure', 'verification coverage planner', /verification coverage/i, 1],
  ['grc', 'pqc-risk-management', 'risk heatmap', /risk heatmap/i, 2],
  ['grc', 'pqc-governance', 'raci matrix', /RACI (?:matrix|builder)/i, 0],
  ['grc', 'vendor-risk', 'contract clauses', /contract clauses/i, 2],
  ['executive', 'pqc-business-case', 'breach scenario simulator', /breach scenario/i, 2],
  ['executive', 'migration-program', 'stakeholder comms', /stakeholder comms/i, 1],
  ['cert-engineer', 'pki-workshop', 'cert capacity', /cert(?:ificate)? capacity/i, 7],
] as const

for (const [persona, moduleId, query, stepLabel, step] of workshops) {
  for (const width of [1280, 390]) {
    test(`${moduleId} opens its named workshop from the ${persona} catalogue at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(30_000)
      await page.setViewportSize({ width, height: 900 })
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
      await page.goto(`/learn?mode=browse&persona=${persona}`)
      const input = page.getByLabel('Search modules', { exact: true })
      await input.fill(query)
      const links = page.getByRole('region', { name: 'Matching workshop steps' }).getByRole('link')
      await links
        .and(page.locator(`a[href^="/learn/${moduleId}?"]`))
        .first()
        .click({ timeout: 10_000 })
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === `/learn/${moduleId}` &&
          url.searchParams.get('tab') === 'workshop' &&
          Number(url.searchParams.get('step') ?? 0) === step
      )
      const stepper = page.getByRole('navigation', {
        name: moduleId === 'pki-workshop' ? 'PKI workshop steps' : 'Workshop steps',
        exact: true,
      })
      await expect(stepper.locator('[aria-current="step"]')).toHaveAccessibleName(stepLabel, {
        timeout: 10_000,
      })
      if (moduleId === 'pki-workshop') {
        await page.reload()
        await expect(stepper.locator('[aria-current="step"]')).toHaveAccessibleName(stepLabel)
      }
      const evidenceButton = page.getByRole('button', { name: 'Record production evidence' })
      const evidence = page.locator('#production-evidence-worksheet')
      const evidenceHeading = evidence.locator('summary')
      const scopeInput = evidence.getByRole('textbox', { name: 'Environment and build' })
      const sampleScope = `Training check for ${persona} / ${moduleId} sample build`
      await evidenceButton.press('Enter')
      await expect(evidenceHeading).toBeFocused()
      await scopeInput.fill(sampleScope)
      await expect(evidence.getByRole('status')).toHaveText(/^Evidence missing/)
      await evidence.getByRole('button', { name: 'Return to workshop' }).press('Enter')
      await expect(evidenceButton).toBeFocused()
      await expect(stepper.locator('[aria-current="step"]')).toHaveAccessibleName(stepLabel)
      await evidenceButton.press('Space')
      await expect(evidenceHeading).toBeFocused()
      await expect(scopeInput).toHaveValue(sampleScope)
      await evidence.getByRole('button', { name: 'Return to workshop' }).press('Enter')
      await page.getByRole('link', { name: 'Back to workshop search' }).click()
      await expect(input).toHaveValue(query)
      await expect(page).toHaveURL(
        (url) => url.pathname === '/learn' && url.searchParams.get('mode') === 'browse'
      )
    })
  }
}
