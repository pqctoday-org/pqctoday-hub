// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CuriousSummaryBanner } from '../../common/CuriousSummaryBanner'
import { AICryptoAttacksModule } from './index'
import rawManifest from './manifest'
import { content } from './content'
import { SAMPLE_REPO_FILES } from './data/secretHuntData'
import { KEY_POLICY_TEMPLATES, POLICY_SETTING_META } from './data/keyPolicyData'
import { generateSyntheticTraceComparison } from './data/traceLearningData'
import { SecretHunt } from './workshop/SecretHunt'
import { KeyPolicyReview } from './workshop/KeyPolicyReview'
import { TraceLearning } from './workshop/TraceLearning'
import { ClaimSorter } from './workshop/ClaimSorter'
import { DefencePlanner } from './workshop/DefencePlanner'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest = resolveManifest(rawManifest)

describe('AICryptoAttacks module parity & workshop safety invariants', () => {
  it('renders module header and standard tabs inside ModuleShell', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AICryptoAttacksModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'AI as an Attacker of Cryptography' })
    ).toBeInTheDocument()
    for (const tab of ['Learn', 'Visual', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument()
    }
  })

  it('conforms to Foundations track metadata, 8 learn sections, and 5 workshop steps', () => {
    expect(manifest.id).toBe('ai-crypto-attacks')
    expect(manifest.lm_id).toBe('LM-087')
    expect(manifest.track).toBe('Foundations')
    expect(manifest.trackOrder).toBe(4)
    expect(manifest.duration).toBe('50 min')
    expect(manifest.learnSections?.map((s) => s.id)).toEqual([
      'two-threats',
      'keys-in-software',
      'finding-flaws',
      'side-channels',
      'kms-hsm-attacks',
      'ai-cryptanalysis',
      'defences',
      'takeaways',
    ])
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual([
      'secret-hunt',
      'key-policy-review',
      'trace-learning',
      'claim-sorter',
      'defence-planner',
    ])
    expect(manifest.startHere?.step).toBe('secret-hunt')
    expect(content.standards.length).toBeGreaterThanOrEqual(50)
  })

  it('loads curious-summary.md in CuriousSummaryBanner for the Visual tab', () => {
    render(<CuriousSummaryBanner moduleId="ai-crypto-attacks" isFullPage />)
    expect(screen.queryByText('No visual summary yet')).not.toBeInTheDocument()
    expect(screen.getAllByText('What This Is About').length).toBeGreaterThan(0)
  })

  it('W1 SecretHunt uses EXAMPLE_FAKE_ placeholders only and toggles pattern scan & remediation', () => {
    for (const file of SAMPLE_REPO_FILES) {
      expect(file.snippet).toContain('EXAMPLE_FAKE_')
      expect(file.snippet).not.toMatch(/AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|BEGIN RSA PRIVATE/)
    }
    render(
      <MemoryRouter>
        <SecretHunt />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run Sample Pattern Rules' }))
    expect(screen.getByText(/Deterministic pattern rule matched/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Apply Control in Sample' }))
    expect(screen.getByRole('button', { name: 'Marked Remediated' })).toBeInTheDocument()
  })

  it('W2 KeyPolicyReview flags risky attributes without generating PKCS#11 call sequences', () => {
    const { container } = render(
      <MemoryRouter>
        <KeyPolicyReview />
      </MemoryRouter>
    )
    expect(container.textContent).not.toMatch(/C_WrapKey|C_UnwrapKey|C_Sign\(/i)
    fireEvent.click(screen.getByRole('button', { name: /CKA_EXTRACTABLE = CK_FALSE/i }))
    fireEvent.click(screen.getByRole('button', { name: /CKA_WRAP_WITH_TRUSTED = CK_TRUE/i }))
    fireEvent.click(
      screen.getByRole('button', { name: /Strict CKA_WRAP_TEMPLATE \/ CKA_UNWRAP_TEMPLATE/i })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Verify Flagged Settings' }))
    expect(screen.getByText(/Accurate review/i)).toBeInTheDocument()
  })

  it('W2 KEY_POLICY_TEMPLATES riskyFlags match POLICY_SETTING_META expectedSafeValue mismatches 1:1 across all templates', () => {
    for (const tpl of KEY_POLICY_TEMPLATES) {
      const expectedRisky = new Set(
        POLICY_SETTING_META.filter((m) => tpl.settings[m.key] !== m.expectedSafeValue).map(
          (m) => m.key
        )
      )
      expect(new Set(tpl.riskyFlags), `Template ${tpl.id} riskyFlags`).toEqual(expectedRisky)
    }
  })

  it('W3 TraceLearning operates on synthetic in-page waves only and updates with masking order', () => {
    const order1 = generateSyntheticTraceComparison({ jitter: 4, maskingOrder: 1, traceCount: 250 })
    const order3 = generateSyntheticTraceComparison({ jitter: 4, maskingOrder: 3, traceCount: 250 })
    expect(order3.learnedScore).toBeLessThan(order1.learnedScore)

    render(
      <MemoryRouter>
        <TraceLearning />
      </MemoryRouter>
    )
    expect(screen.getByText(/Synthetic-only safety boundary/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Order 3' }))
    expect(screen.getByText(/Masking Order \(ω\): 3/i)).toBeInTheDocument()
  })

  it('W4 ClaimSorter classifies statements and reveals primary source rubric', () => {
    render(
      <MemoryRouter>
        <ClaimSorter />
      </MemoryRouter>
    )
    const maturityGroup = screen.getByRole('group', { name: 'Maturity 1' })
    fireEvent.click(within(maturityGroup).getByRole('button', { name: 'demonstrated' }))
    const scopeGroup = screen.getByRole('group', { name: 'Target scope 1' })
    fireEvent.click(within(scopeGroup).getByRole('button', { name: 'full' }))
    const checkButtons = screen.getAllByRole('button', { name: /Check & Reveal Source/i })
    fireEvent.click(checkButtons[0])
    expect(screen.getByText(/Expected: demonstrated/i)).toBeInTheDocument()
  })

  it('W5 DefencePlanner updates priority coverage across system profiles', () => {
    render(
      <MemoryRouter>
        <DefencePlanner />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /3\. Embedded PQC Firmware Signer/i }))
    expect(screen.getByText(/Unaddressed Priority Layers/i)).toBeInTheDocument()
  })
})
