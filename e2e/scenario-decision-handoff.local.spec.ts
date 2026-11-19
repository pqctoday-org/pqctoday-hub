// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures/blockAnalytics'

interface Case {
  tool: string
  preview?: boolean
  changedRow?: string
  setUp(page: Page): Promise<void>
  revise(page: Page): Promise<void>
  before: string
  after: string
  decision: string
}

const cases: Case[] = [
  {
    tool: 'program-charter',
    async setUp(page) {
      await page.getByLabel('Sponsor name').fill('Fictional approval owner')
      await page.getByLabel('In scope', { exact: true }).fill('Sample gateway migration')
      await page.getByLabel('Success criteria').fill('Record ten expected hybrid negotiations.')
      await page.getByLabel('Reported approval date').fill('2026-07-01')
      await page.getByLabel('Approval reference').fill('Training decision 12')
    },
    revise: (page) => page.getByLabel('Success criteria').fill(''),
    before: 'Approval reference recorded',
    after: 'Draft. Record success criteria.',
    decision: 'Ask the sponsor to approve the measurable success criterion after it is restored.',
  },
  {
    tool: 'migration-verification',
    setUp: (page) =>
      page
        .getByRole('group', { name: 'Public web TLS (edge)', exact: true })
        .getByLabel('Evidence in dossier', { exact: true })
        .fill('Training trace for Gateway A'),
    revise: (page) =>
      page
        .getByRole('group', { name: 'Public web TLS (edge)', exact: true })
        .getByLabel('Evidence in dossier', { exact: true })
        .fill('Training trace for Gateway B'),
    before: 'Training trace for Gateway A',
    after: 'Training trace for Gateway B',
    decision:
      'Retain the scope distinction. Confirm the peer and configuration before closing Gateway B.',
  },
  {
    tool: 'stakeholder-comms',
    preview: true,
    setUp: (page) =>
      page.getByLabel('Initiative for the decision request').fill('the fictional gateway pilot'),
    async revise(page) {
      await page.getByRole('button', { name: 'Recipient for the decision request' }).click()
      await page.getByRole('option', { name: 'External partners', exact: true }).click()
    },
    before: 'Approve the funding and name the accountable sponsor',
    after: 'Confirm supported profiles, the test endpoint and a joint interoperability test date',
    decision:
      'Ask the partner engineering contact to agree the supported profile before the joint test.',
  },
  {
    tool: 'audit-checklist',
    preview: true,
    async setUp(page) {
      await page.getByRole('button', { name: '+ Add evidence row' }).click()
      await page
        .getByPlaceholder('Product / asset', { exact: true })
        .first()
        .fill('Sample signing appliance v1')
    },
    revise: (page) =>
      page
        .getByPlaceholder('Product / asset', { exact: true })
        .first()
        .fill('Sample signing appliance v2'),
    before: 'Sample signing appliance v1',
    after: 'Sample signing appliance v2',
    decision:
      'Check that the validation record covers the new appliance firmware, configuration and mode.',
  },
  {
    tool: 'compliance-checklist',
    preview: true,
    async setUp(page) {
      await page.getByRole('button', { name: 'Load sample frameworks' }).click()
      await page
        .getByLabel('Compliance owner', { exact: true })
        .first()
        .fill('Training owner for archive services')
    },
    revise: (page) =>
      page
        .getByLabel('Compliance owner', { exact: true })
        .first()
        .fill('Training owner for gateway services'),
    before: 'Training owner for archive services',
    after: 'Training owner for gateway services',
    decision: 'The new owner should document applicability to the gateway service before sign-off.',
  },
  {
    tool: 'infra-modernization-planner',
    async setUp(page) {
      await page.getByLabel('Planned HSM readiness date').fill('2027-11-01')
      await page.getByLabel('Planned PKI cutover date').fill('2027-11-05')
    },
    revise: (page) => page.getByLabel('Planned HSM readiness date').fill('2027-11-06'),
    before: 'readiness date precedes the PKI cutover',
    after: 'Schedule conflict. The PKI cutover precedes its HSM readiness date.',
    decision: 'Pause the PKI cutover until the HSM owner confirms readiness for a new date.',
  },
  {
    tool: 'management-tools-audit',
    async setUp(page) {
      const scanner = page.getByRole('group', { name: 'Crypto Scanners', exact: true })
      await scanner.getByRole('button', { name: 'Automated' }).click()
      await scanner.getByRole('button', { name: 'Enter inventory counts' }).click()
      await scanner.getByLabel('Systems in scope', { exact: true }).fill('64')
      await scanner.getByLabel('Observed covered systems', { exact: true }).fill('32')
    },
    revise: (page) => page.getByLabel('Observed covered systems', { exact: true }).fill('31'),
    before: '50% | 32 of 64 systems',
    after: '48.44% | 31 of 64 systems',
    decision:
      'Leave the gap open and ask the scanner owner to reconcile the missing inventory observation.',
  },
  {
    tool: 'kpi-tracker',
    async setUp(page) {
      const row = page.getByTestId('kpi-dim-systems-inventoried')
      await row.getByText('Sample measure notes', { exact: true }).click()
      await row.getByLabel('Systems Inventoried Numerator').fill('12')
      await row.getByLabel('Systems Inventoried Denominator').fill('20')
    },
    revise: (page) => page.getByLabel('Systems Inventoried Denominator').fill('24'),
    before: '12 of 20 systems inventoried (60%)',
    after: '12 of 24 systems inventoried (50%)',
    decision:
      'Report a scope expansion. Review the evidence for the four new systems before changing the numerator.',
  },
  {
    tool: 'crypto-vulnerability-watch',
    async setUp(page) {
      await page.getByRole('button', { name: 'Load sample watchlist' }).click()
      await expect(
        page.getByRole('heading', { name: 'Vulnerability snapshot results' })
      ).toBeVisible()
    },
    revise: (page) => page.getByRole('button', { name: 'HIGH', exact: true }).click(),
    before: 'Selected severities: CRITICAL, HIGH, MEDIUM, LOW',
    after: 'Selected severities: CRITICAL, MEDIUM, LOW',
    decision:
      'Verify the deployed version with its vendor advisory before assigning a remediation action.',
  },
  {
    tool: 'cloud-responsibility-matrix',
    preview: true,
    async setUp(page) {
      await page
        .getByRole('group', { name: 'Service-model mix', exact: true })
        .getByRole('checkbox', { name: /FaaS/ })
        .check()
      await page
        .getByRole('group', { name: 'Asset classes in scope' })
        .getByRole('checkbox', { name: /FaaS function payloads/ })
        .check()
    },
    revise: (page) =>
      page
        .getByRole('group', { name: 'Service-model mix', exact: true })
        .getByRole('checkbox', { name: /FaaS/ })
        .uncheck(),
    before: '| FaaS function payloads | FaaS |',
    after: 'Unverified',
    decision:
      'The exercise now excludes FaaS. Record who owns FaaS review if those workloads return to scope.',
  },
  {
    tool: 'raci-builder',
    changedRow: '| Crypto Inventory |',
    setUp: async () => {},
    revise: (page) =>
      page.getByRole('button', { name: /Crypto Inventory — CTO:/ }).click({ clickCount: 2 }),
    before: 'One accountable role (CISO)',
    after: 'Conflicting accountable roles (CISO, CTO)',
    decision:
      'The governance lead should confirm who is accountable for the inventory before assigning the second role.',
  },
  {
    tool: 'mti-negotiator',
    preview: true,
    async setUp(page) {
      await page
        .getByRole('checkbox', { name: 'Client supports X25519MLKEM768', exact: true })
        .check()
      await page
        .getByRole('checkbox', { name: 'Server supports X25519MLKEM768', exact: true })
        .check()
    },
    async revise(page) {
      await page
        .getByRole('checkbox', { name: 'Server supports X25519MLKEM768', exact: true })
        .uncheck()
      await page
        .getByRole('checkbox', { name: 'Server supports SecP256r1MLKEM768', exact: true })
        .check()
    },
    before: 'Common groups allowed by policy: X25519MLKEM768',
    after: 'No mutually supported group meets the worksheet policy.',
    decision:
      'Have the protocol engineer confirm the exact server group in a staging handshake before approving rollout.',
  },
  {
    tool: 'hybrid-transition-planner',
    preview: true,
    async setUp(page) {
      await page.getByRole('button', { name: 'Sample TLS peer capability', exact: true }).click()
      await page
        .getByRole('option', { name: 'Supports selected hybrid group', exact: true })
        .click()
    },
    async revise(page) {
      await page.getByRole('button', { name: 'Sample TLS peer capability', exact: true }).click()
      await page.getByRole('option', { name: 'Classical group only', exact: true }).click()
    },
    before: 'Shared hybrid group is eligible for the modeled exchange.',
    after: 'Connection blocked by the sample policy.',
    decision:
      'Keep the high-sensitivity path closed until both tested peers offer the selected hybrid group.',
  },
  {
    tool: 'accelerated-execution-profile',
    async setUp(page) {
      await page.getByRole('spinbutton', { name: 'Target from activation (days)' }).fill('90')
      await page.getByRole('spinbutton', { name: 'Prerequisite and checks (days)' }).fill('40')
      await page.getByRole('spinbutton', { name: 'Rollout after prerequisite (days)' }).fill('30')
    },
    revise: (page) =>
      page.getByRole('spinbutton', { name: 'Target from activation (days)' }).fill('60'),
    before: 'day 70, with 20 days of margin',
    after: 'day 70, 10 days after the target',
    decision:
      'The programme sponsor should accept a later date or fund a shorter prerequisite after validating workload capacity.',
  },
]

for (const c of cases) {
  for (const width of [1280, 390]) {
    test(`${c.tool} exports the exact scenario pair and decision at ${width}px`, async ({
      page,
    }) => {
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
      await page.goto(`/business/tools/${c.tool}`)
      await c.setUp(page)
      const preview = page.getByRole('button', { name: 'Preview', exact: true })
      if (c.preview) await preview.click()
      const panel = page
        .locator('details')
        .filter({ has: page.locator('summary', { hasText: 'Compare scenario outputs' }) })
        .last()
      const summary = panel.locator('summary').first()
      const ensureOpen = async () => {
        if (!(await panel.evaluate((el) => (el as HTMLDetailsElement).open))) await summary.click()
      }
      const note = panel.getByRole('textbox', { name: 'Decision and next evidence' })
      const exportComparison = panel.getByRole('button', { name: 'Download scenario comparison' })
      await ensureOpen()
      await expect(exportComparison).toHaveCount(0)
      await panel.getByRole('button', { name: 'Keep this baseline' }).click()
      await expect(panel.getByRole('status')).toHaveText(
        'The current report matches your baseline.'
      )

      if (c.preview) await page.getByRole('button', { name: 'Edit', exact: true }).click()
      await c.revise(page)
      if (c.preview) await preview.click()
      await ensureOpen()
      await expect(panel.getByRole('status')).toContainText('The report changed')
      await note.fill(c.decision)
      if (c.preview) {
        await page.getByRole('button', { name: 'Edit', exact: true }).click()
        await preview.click()
        await ensureOpen()
        await expect(note).toHaveValue(c.decision)
      }
      const pending = page.waitForEvent('download')
      await exportComparison.click()
      const file = await pending
      expect(file.suggestedFilename()).toBe(`${c.tool}-comparison.md`)
      const markdown = await text(await file.createReadStream())
      expect(markdown).toContain(c.decision)
      const [before, after] = markdown.split('## Baseline report\n')[1].split('## Current report\n')
      const changedRow = c.changedRow
      const beforeScope = changedRow
        ? before.split('\n').find((line) => line.includes(changedRow))
        : before
      const afterScope = changedRow
        ? after.split('\n').find((line) => line.includes(changedRow))
        : after
      expect(beforeScope).toContain(c.before)
      expect(afterScope).toContain(c.after)
      expect(afterScope).not.toContain(c.before)

      await page.reload()
      const saved = page
        .locator('details')
        .filter({ has: page.locator('summary', { hasText: 'Saved scenario comparisons' }) })
      await saved.locator('summary').click()
      await expect(saved.getByText(c.decision, { exact: true })).toBeVisible()
      const [savedFile] = await Promise.all([
        page.waitForEvent('download'),
        saved.getByRole('button', { name: 'Download saved comparison', exact: true }).click(),
      ])
      expect(await text(await savedFile.createReadStream())).toBe(markdown)
      await saved.getByRole('button', { name: 'Clear saved comparison', exact: true }).click()
      await page.reload()
      await expect(saved).toHaveCount(0)
    })
  }
}
