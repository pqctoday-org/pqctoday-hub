// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const modules = [
  {
    id: 'standards-bodies',
    title: 'Standards, Certification & Compliance Bodies',
    steps: [
      'Step 1: Body Classifier',
      'Step 2: Organization Explorer',
      'Step 3: Standards → Certification → Compliance Chain',
      'Step 4: Regional Coverage Grid',
      'Step 5: Scenario Challenge',
    ],
    ids: [
      'body-classifier',
      'org-explorer',
      'chain-builder',
      'coverage-grid',
      'scenario-challenge',
    ],
  },
  {
    id: 'iam-pqc',
    title: 'Enterprise Identity & Access Management',
    steps: [
      'Step 1: Crypto Inventory',
      'Step 2: Token Migration',
      'Step 3: Directory Services',
      'Step 4: Vendor Readiness',
      'Step 5: Zero Trust',
      'Step 6: Identity Proxy',
    ],
    ids: [
      'iam-crypto-inventory',
      'token-migration-lab',
      'directory-services',
      'vendor-readiness',
      'zero-trust-identity',
      'identity-proxy',
    ],
  },
  {
    id: 'migration-program',
    title: 'Migration Program Management',
    steps: [
      'Step 1: Roadmap Builder',
      'Step 2: Stakeholder Comms',
      'Step 3: KPI Tracker',
      'Step 4: Deployment Playbook',
    ],
    ids: ['roadmap-builder', 'stakeholder-comms', 'kpi-tracker', 'deployment-playbook'],
  },
  {
    id: 'confidential-computing',
    title: 'Confidential Computing',
    steps: [
      'Step 1: TEE Architecture Explorer',
      'Step 2: Attestation Workshop',
      'Step 3: Encryption Mechanisms',
      'Step 4: TEE-HSM Trusted Channel',
      'Step 5: Quantum Threat Migration',
    ],
    ids: [
      'tee-architecture-explorer',
      'attestation-workshop',
      'encryption-mechanisms',
      'tee-hsm-channel',
      'quantum-threat-migration',
    ],
  },
  {
    id: 'network-security-pqc',
    title: 'Network Security PQC',
    steps: [
      'Step 1: NGFW Cipher Policy',
      'Step 2: TLS Inspection Lab',
      'Step 3: IDS Signature Updater',
      'Step 4: Vendor Matrix',
      'Step 5: ZTNA PQC Design',
      'Step 6: Network Telemetry',
    ],
    ids: [
      'ngfw-cipher-analyzer',
      'tls-inspection-lab',
      'ids-signature-updater',
      'vendor-migration-matrix',
      'ztna-pqc-designer',
      'network-telemetry-analyzer',
    ],
  },
  {
    id: 'vpn-ssh-pqc',
    title: 'VPN/IPsec & SSH PQC',
    steps: ['Step 1: IKEv2 Handshake', 'Step 2: SSH Key Exchange', 'Step 3: Protocol Comparison'],
    ids: ['ikev2-handshake', 'ssh-key-exchange', 'protocol-comparison'],
  },
  {
    id: 'pqc-grc',
    title: 'PQC GRC',
    steps: ['Step 1: KRI Cascade', 'Step 2: Exception Register'],
    ids: ['kri-cascade', 'exception-triage'],
  },
  {
    id: 'talking-about-pqc',
    title: 'Talking About PQC Accurately',
    steps: ['Step 1: Claim Checker', 'Step 2: Customer Questions'],
    ids: ['claim-checker', 'question-practice'],
  },
  {
    id: 'slh-dsa',
    title: 'SLH-DSA: Stateless Hash Signatures (FIPS 205)',
    steps: [
      'Step 1: Key Generation & Parameter Explorer',
      'Step 2: Sign & Verify',
      'Step 3: Context Strings & Deterministic Mode',
      'Step 4: LMS vs XMSS vs SLH-DSA',
    ],
    ids: ['keygen', 'sign-verify', 'context-deterministic', 'comparison'],
  },
]

for (const module of modules) {
  for (const width of [1280, 390]) {
    test(`${module.id} completes every workshop step at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
        )
        localStorage.setItem('pqc-tour-completed', 'true')
      })
      await page.goto(`/learn/${module.id}?tab=workshop`)
      await page.addLocatorHandler(
        page.getByRole('button', { name: 'Keep going', exact: true }),
        (button) => button.click()
      )
      const navigation = page.getByRole('navigation', { name: 'Workshop steps' })
      await expect(
        navigation.getByRole('button', { name: new RegExp(`^${module.steps[0]}`) })
      ).toBeVisible()
      const last = navigation.getByRole('button', { name: new RegExp(`^${module.steps.at(-1)}`) })
      await last.click()
      await expect(last).toHaveAttribute('aria-current', 'step')
      const before = await page.evaluate((id) => {
        const stored = localStorage.getItem('pki-module-storage')
        return stored ? (JSON.parse(stored).state.modules[id]?.completedSteps ?? []) : []
      }, module.id)
      expect(before).toEqual([])
      await injectAxe(page)
      const initial = await getViolations(page, 'main', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(initial.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
      await navigation.getByRole('button', { name: module.steps[0], exact: true }).click()
      for (let index = 0; index < module.steps.length; index++) {
        const current = navigation.getByRole('button', {
          name: new RegExp(`^${module.steps[index]}`),
        })
        await expect(current).toHaveAttribute('aria-current', 'step')
        await expect(
          page.getByRole('main').locator('h1, h2, h3, input, button').first()
        ).toBeVisible()
        if (module.id === 'talking-about-pqc') {
          const drills = page.getByRole('main').locator('fieldset')
          for (const drill of await drills.all()) {
            const options = drill.getByRole('button')
            if ((await options.count()) >= 2) await options.nth(1).click()
          }
          await expect(page.getByText(/\d+ of \d+ answered accurately/)).toBeVisible()
        }
        if (index < module.steps.length - 1)
          await page
            .getByRole('button', { name: /Next Step/ })
            .last()
            .click()
      }
      const finish = page.getByRole('button', { name: 'Complete Module', exact: true })
      await expect(finish).toBeEnabled()
      await finish.click()
      const stored = await page.evaluate((id) => {
        const raw = localStorage.getItem('pki-module-storage')
        return raw ? JSON.parse(raw).state.modules[id] : undefined
      }, module.id)
      expect(stored?.status).toBe('completed')
      expect(stored?.completedSteps).toEqual(expect.arrayContaining(module.ids))
      const final = await getViolations(page, 'main', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
      expect(final.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      ).toBeLessThanOrEqual(1)
    })
  }
}
