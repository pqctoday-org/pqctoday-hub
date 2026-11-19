// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

const sourceCases = new Map([
  [
    'pqc-candidates',
    {
      label: 'NIST selected algorithms and publication status',
      href: 'https://csrc.nist.gov/projects/post-quantum-cryptography/post-quantum-cryptography-standardization/selected-algorithms',
    },
  ],
  [
    'healthcare-pqc',
    {
      label: 'FDA section 524B questions and answers',
      href: 'https://www.fda.gov/medical-devices/medical-device-cybersecurity/cybersecurity-resources-medical-device-manufacturers-guidance-resources-and-faqs',
    },
  ],
  [
    'automotive-pqc',
    {
      label: 'Uptane Standard 2.1.0 §5.4.3–5.4.4',
      href: 'https://uptane.org/docs/2.1.0/standard/uptane-standard#543-installing-images-on-primary-or-secondary-ecus',
    },
  ],
  [
    'government-defense-pqc',
    {
      label: 'OMB M-26-15 §1 and §3',
      href: 'https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf',
    },
  ],
])

const cases = [
  [
    'pqc-candidates',
    /policy requiring a published NIST KEM/,
    'provider-A / FIPS 203 ML-KEM profile',
    'provider-A / HQC candidate profile',
    'registry/published-fips203-mlkem768',
    'registry/selected-hqc-no-final-fips',
  ],
  [
    'healthcare-pqc',
    /premarket submission for a cyber device/,
    'imaging-device-7.2 / filing scope A',
    'imaging-device-7.3 / filing scope A',
    'fda-524b/sbom-matches-image-7.2',
    'fda-524b/sbom-points-to-other-image',
  ],
  [
    'automotive-pqc',
    /verify the metadata for the ECU/,
    'ecu-deck-build-7 / director profile V',
    'ecu-deck-build-8 / director profile V',
    'uptane/authorized-ecu-image',
    'uptane/wrong-hardware-id',
  ],
  [
    'government-defense-pqc',
    /covered civilian federal system/,
    'agency-HVA-gateway / non-NSS scope',
    'agency-NSS-gateway / distinct authorization',
    'omb-m26-15/eligible-hva-owner',
    'omb-m26-15/outside-nss-scope',
  ],
  [
    'hybrid-crypto',
    /Negotiate an RFC 10024/,
    'ingress-r17',
    'ingress-r18',
    'tls/group-ok',
    'tls/legacy-peer-selected',
  ],
  [
    'dnssec-pqc',
    /Test both an authoritative signer/,
    'resolver-r11',
    'resolver-r12',
    'dns/controlled-zone-valid',
    'dns/algorithm-unsupported',
  ],
  [
    'email-signing',
    /support for .*KEMRecipientInfo/,
    'mail-provider-r5',
    'mail-provider-r6',
    'cms/envelope-opened',
    'cms/recipient-parameter-rejected',
  ],
  [
    'pki-workshop',
    /Root, Intermediate, and Issuing CA/,
    'issuing-ca-r2',
    'issuing-ca-r3',
    'pki/pinned-chain-valid',
    'pki/subca-profile-rejected',
  ],
  [
    'kms-pqc',
    /Envelope encryption/,
    'staging-kms-policy-v8',
    'staging-kms-policy-v9',
    'kms/wrapper-restored',
    'kms/unwrap-role-refused',
  ],
  [
    'hsm-pqc',
    /PKCS#11 v3.2 interface/,
    'token-firmware-7.2',
    'token-firmware-7.3',
    'hsm/encap-and-decap',
    'hsm/mechanism-disabled',
  ],
  [
    'crypto-product-certification',
    /Traceable mapping between product versions/,
    'module-firmware-7.2-mode-A',
    'module-firmware-7.3-mode-A',
    'cmvp/exact-version-covered',
    'cmvp/new-version-unlisted',
  ],
  [
    'fips-140-3-certification',
    /cryptographic module boundary/,
    'module-release-3.1-platform-A',
    'module-release-3.1-platform-B',
    'validation/listed-environment',
    'validation/platform-unlisted',
  ],
  [
    'cc-eucc-certification',
    /EUCC Security Target/,
    'appliance-v6-evaluated-profile',
    'appliance-v6-alternate-profile',
    'evaluation/scope-matched',
    'evaluation/profile-unlisted',
  ],
  [
    'stateful-signatures',
    /non-rewindable one-time signature/,
    'token-v8-key-sample-11',
    'token-v9-key-sample-14',
    'lms/restore-refused',
    'lms/restore-state-regressed',
  ],
  [
    'digital-assets',
    /Post-quantum signature verification/,
    'offline-custody-validator-v2',
    'offline-custody-validator-v3',
    'wallet/required-signature-check',
    'wallet/scheme-not-accepted',
  ],
  [
    '5g-security',
    /3GPP TS 33\.501 SUCI/,
    'test-home-network-v2',
    'test-home-network-v3',
    'suci/profile-A-decoded',
    'suci/home-key-mismatch',
  ],
  [
    'entropy-randomness',
    /SP 800-90B validated physical entropy/,
    'entropy-board-2-clock-A',
    'entropy-board-2-clock-B',
    'entropy/health-criteria-met',
    'entropy/repetition-limit-failed',
  ],
  [
    'merkle-tree-certs',
    /Merkle Tree Certificates.*inclusion-proof/,
    'proof-verifier-r2',
    'proof-verifier-r3',
    'mtc/checkpoint-and-path-valid',
    'mtc/path-rejected',
  ],
  [
    'vendor-risk',
    /Contractual requirement for CycloneDX/,
    'firmware-7.2-delivery-A',
    'firmware-7.3-delivery-B',
    'supply/firmware-linked-cbom',
    'supply/dependency-record-missing',
  ],
  [
    'pqc-testing-validation',
    /Automated known-answer tests/,
    'candidate-12-profile-4',
    'candidate-13-profile-4',
    'qa/vectors-and-negatives-pass',
    'qa/altered-signature-was-accepted',
  ],
  [
    'acvp-lab-workflow',
    /Automated NIST ACVP JSON/,
    'acvp-adapter-v4',
    'acvp-adapter-v5',
    'acvp/all-sample-cases-dispatched',
    'acvp/vector-group-omitted',
  ],
  [
    'code-signing',
    /Artifact, container and package signing/,
    'updater-trust-v8',
    'updater-trust-v9',
    'update/sample-signature-valid',
    'update/deployed-verifier-rejects',
  ],
  [
    'api-security-jwt',
    /JOSE \/ COSE support/,
    'payments-api-v12-profile-65',
    'payments-api-v13-profile-44',
    'jwt/mldsa65-verified',
    'jwt/mldsa65-disallowed',
  ],
  [
    'iam-pqc',
    /Identity Provider .*token and assertion signing/,
    'idp-v3-payments-audience',
    'idp-v4-reports-audience',
    'identity/payments-accepted',
    'identity/payments-audience-rejected',
  ],
  [
    'iot-pqc',
    /Constrained-stack/,
    'mcu-fw-v4',
    'mcu-fw-v5',
    'mcu/verification-within-ram',
    'mcu/shorter-workspace',
  ],
  [
    'confidential-computing',
    /Remote attestation quote/,
    'enclave-policy-v4-provisioning',
    'enclave-policy-v5-staging',
    'tee/signer-and-quote-accepted',
    'tee/measurement-refused',
  ],
  [
    'web-gateway-pqc',
    /Ingress TLS 1.3 termination/,
    'edge-r7-hybrid',
    'edge-r8-reduced-groups',
    'proxy/client-hybrid-selected',
    'proxy/client-classical-selected',
  ],
  [
    'platform-eng-pqc',
    /Service mesh mTLS/,
    'mesh-r41-both-peers',
    'mesh-r42-one-peer',
    'mesh/both-peers-hybrid',
    'mesh/no-shared-hybrid-group',
  ],
  [
    'ai-security-pqc',
    /Cryptographic signing of AI model weights/,
    'model-bundle-44-sealed',
    'model-bundle-45-copied',
    'model/manifest-and-digest-match',
    'model/weights-digest-changed',
  ],
  [
    'network-security-pqc',
    /Deep.Packet Inspection|deep-packet inspection/,
    'inspection-pilot-v8',
    'inspection-pilot-v9',
    'network/test-path-observed',
    'network/visibility-missing',
  ],
  [
    'database-encryption-pqc',
    /Transparent Data Encryption/,
    'database-archive-wrapper-v1',
    'database-archive-wrapper-v2',
    'db/retained-copy-restored',
    'db/retained-copy-unreadable',
  ],
  [
    'secure-boot-pqc',
    /Immutable Boot ROM/,
    'boot-rom-sample-v1',
    'boot-rom-sample-v2',
    'boot/manifest-accepted',
    'boot/trust-root-mismatch',
  ],
  [
    'os-pqc',
    /OS-wide cryptographic policy/,
    'host-policy-v2-system-client',
    'host-policy-v3-bundled-client',
    'os/system-hybrid-observed',
    'os/bundled-classical-observed',
  ],
  [
    'slh-dsa',
    /SLH-DSA.*SHA2 and SHAKE/,
    'firmware-verifier-v3',
    'firmware-verifier-v4',
    'slh/profile-and-context-valid',
    'slh/context-mismatch',
  ],
  [
    'pki-enrollment-protocols',
    /CMPv3.*CRMF/,
    'enrollment-ra-v17',
    'enrollment-ra-v18',
    'cmp/possession-check-valid',
    'cmp/possession-path-unavailable',
  ],
  [
    'verification-closure',
    /Five-point technical migration verification/,
    'approved-service-release-41',
    'candidate-service-release-42',
    'closure/peer-matrix-verified',
    'closure/classical-fallback-observed',
  ],
] as const

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

for (const [
  moduleId,
  requirement,
  baselineBuild,
  candidateBuild,
  baselineRef,
  candidateRef,
] of cases) {
  for (const width of [1280, 390]) {
    test(`${moduleId} preserves conflicting build evidence at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/learn/${moduleId}`)
      const checklist = page.getByTestId('production-capability-checklist')
      const worksheet = checklist.locator('#production-evidence-worksheet')
      const open = async () => {
        await checklist.locator('summary').first().click()
        await worksheet.getByText('Record evidence for your environment', { exact: true }).click()
      }
      await open()
      const source = sourceCases.get(moduleId)
      if (source) {
        await expect(
          checklist.getByRole('link', { name: source.label, exact: true })
        ).toHaveAttribute('href', source.href)
      }

      const scope = worksheet.getByRole('textbox', { name: 'Environment and build' })
      const row = worksheet.getByRole('group', { name: requirement }).first()
      const outcome = row.getByRole('combobox', { name: 'Observation' })
      const reference = row.getByRole('textbox', { name: 'Evidence reference' })
      const status = worksheet.getByRole('status')
      const comparison = worksheet.getByRole('region', { name: 'Compare builds' })
      const baseline = comparison.getByRole('combobox', { name: 'Baseline environment and build' })

      await scope.fill(baselineBuild)
      await outcome.selectOption('pass')
      await reference.fill(baselineRef)
      const observations = worksheet.getByRole('combobox', { name: 'Observation', exact: true })
      const references = worksheet.getByRole('textbox', { name: 'Evidence reference' })
      await expect(observations).toHaveCount(3)
      const mainRequirement = await row.locator('legend').textContent()
      for (const index of [0, 1, 2]) {
        const option = observations.nth(index)
        const requirement = await option.evaluate(
          (input) => input.closest('fieldset')?.querySelector('legend')?.textContent
        )
        if (requirement === mainRequirement) continue
        await option.selectOption('pass')
        await references.nth(index).fill(`${baselineBuild}/check-${index + 1}`)
      }
      await expect(status).toContainText('Ready for review')
      await scope.fill(candidateBuild)
      await expect(reference).toHaveValue('')
      await baseline.selectOption(baselineBuild)
      await expect(comparison.getByText(`Baseline — Observed pass: ${baselineRef}`)).toBeVisible()
      await expect(comparison.getByText('Current — Evidence missing').first()).toBeVisible()
      await outcome.selectOption('fail')
      await reference.fill(candidateRef)
      await expect(status).toContainText('A requirement failed')
      await expect(comparison.getByText('Baseline review status: Ready for review')).toBeVisible()
      await expect(
        comparison.getByText('Current review status: A requirement failed')
      ).toBeVisible()

      await page.reload()
      await open()
      await expect(baseline).toHaveValue(baselineBuild)
      await expect(scope).toHaveValue(candidateBuild)
      await expect(
        comparison.getByText(`Current — Observed failure: ${candidateRef}`)
      ).toBeVisible()
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        worksheet.getByRole('button', { name: 'Download evidence worksheet' }).click(),
      ])
      const report = await text(await download.createReadStream())
      expect(report).toContain(`Baseline: ${baselineBuild}`)
      expect(report).toContain(`Current: ${candidateBuild}`)
      expect(report).toContain('Baseline review status: Ready for review')
      expect(report).toContain('Current review status: A requirement failed')
      expect(report).toContain(`Baseline — Observed pass: ${baselineRef}`)
      expect(report).toContain(`Current — Observed failure: ${candidateRef}`)
      if (source) {
        expect(report).toContain('## References for requirement scope')
        expect(report).toContain(source.href)
      }

      await comparison
        .getByRole('button', { name: 'Open baseline as current build' })
        .press('Space')
      await expect(scope).toBeFocused()
      await expect(scope).toHaveValue(baselineBuild)
      await expect(reference).toHaveValue(baselineRef)
      await expect(outcome).toHaveValue('pass')
      await expect(baseline).toHaveValue(candidateBuild)
      await expect(
        comparison.getByText(`Baseline — Observed failure: ${candidateRef}`)
      ).toBeVisible()
      await outcome.selectOption('')
      await expect(
        comparison.getByText(`Baseline — Observed failure: ${candidateRef}`)
      ).toBeVisible()
    })
  }
}
