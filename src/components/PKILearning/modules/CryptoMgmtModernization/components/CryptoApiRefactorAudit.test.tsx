// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CryptoApiRefactorAudit,
  auditCryptoApi,
  renderCryptoApiMarkdown,
  type CryptoApiInputs,
} from './CryptoApiRefactorAudit'

// Mock the module store so the component renders without persistence setup.
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (state: { addExecutiveDocument: () => void }) => unknown) =>
    selector({ addExecutiveDocument: () => undefined }),
}))

const baseInputs: CryptoApiInputs = {
  applicationType: 'server-side service',
  language: 'Go',
  currentCryptoApi: ['openssl-evp'],
  provider: ['software'],
  targetAlgorithms: ['ML-KEM', 'ML-DSA'],
  callSiteCount: 'medium',
  cryptoAgilityNow: 'partially-hardcoded',
  runtimeFallback: 'must-support',
  refactorPlan: '',
}

describe('CryptoApiRefactorAudit - component', () => {
  it('renders without crashing', () => {
    expect(() => render(<CryptoApiRefactorAudit />)).not.toThrow()
  })

  it('renders the CSWP-39 Section 4.1 banner heading', () => {
    render(<CryptoApiRefactorAudit />)
    expect(screen.getByText(/Crypto API Refactor Audit/i)).toBeTruthy()
    expect(screen.getAllByText(/Section 4\.1/i).length).toBeGreaterThan(0)
  })
})

describe('auditCryptoApi - decision table', () => {
  it('fully-hardcoded + legacy-mass call sites -> Phase 1 (wrap, do not refactor)', () => {
    const rec = auditCryptoApi({
      ...baseInputs,
      cryptoAgilityNow: 'fully-hardcoded',
      callSiteCount: 'legacy-mass',
    })
    expect(rec.refactorPhase).toMatch(/Phase 1/)
    expect(rec.rationale).toMatch(/facade/i)
  })

  it('fully-hardcoded + small call sites -> Phase 1 (still wrap first)', () => {
    const rec = auditCryptoApi({
      ...baseInputs,
      cryptoAgilityNow: 'fully-hardcoded',
      callSiteCount: 'small',
    })
    expect(rec.refactorPhase).toMatch(/Phase 1/)
  })

  it('partially-hardcoded -> Phase 2 (complete the facade)', () => {
    const rec = auditCryptoApi({
      ...baseInputs,
      cryptoAgilityNow: 'partially-hardcoded',
    })
    expect(rec.refactorPhase).toMatch(/Phase 2/)
    expect(rec.rationale).toMatch(/CI guard/i)
  })

  it('config-driven -> Phase 3 (add PQC algorithm IDs to config)', () => {
    const rec = auditCryptoApi({ ...baseInputs, cryptoAgilityNow: 'config-driven' })
    expect(rec.refactorPhase).toMatch(/Phase 3/)
    expect(rec.rationale).toMatch(/config schema/i)
  })

  it('agility-friendly -> Phase 4 (provider-compatibility test)', () => {
    const rec = auditCryptoApi({ ...baseInputs, cryptoAgilityNow: 'agility-friendly' })
    expect(rec.refactorPhase).toMatch(/Phase 4/)
    expect(rec.rationale).toMatch(/Verify each provider/i)
  })
})

describe('auditCryptoApi - language-specific output', () => {
  it('Go language emits crypto.Signer + golangci-lint guidance', () => {
    const rec = auditCryptoApi({ ...baseInputs, language: 'Go' })
    expect(rec.callSiteChecklist.join(' ')).toMatch(/crypto\.Signer/)
    expect(rec.callSiteChecklist.join(' ')).toMatch(/forbidigo/)
  })

  it('Java language emits BouncyCastle PQC + Signature.getInstance guidance', () => {
    const rec = auditCryptoApi({ ...baseInputs, language: 'Java' })
    expect(rec.callSiteChecklist.join(' ')).toMatch(/Signature\.getInstance/)
    expect(rec.callSiteChecklist.join(' ')).toMatch(/BouncyCastle|bouncycastle/i)
  })

  it('C/C++ language emits EVP_DigestSign + oqs-provider guidance', () => {
    const rec = auditCryptoApi({ ...baseInputs, language: 'C++' })
    expect(rec.callSiteChecklist.join(' ')).toMatch(/EVP_DigestSign/)
    expect(rec.callSiteChecklist.join(' ')).toMatch(/oqs-provider/)
  })

  it('JavaScript (browser) language warns no native PQC + recommends WASM bridge', () => {
    const rec = auditCryptoApi({ ...baseInputs, language: 'JavaScript (browser)' })
    expect(rec.callSiteChecklist.join(' ')).toMatch(/WASM|liboqs/i)
    expect(rec.callSiteChecklist.join(' ')).toMatch(/Web Crypto/i)
  })

  it('every call-site checklist starts with the universal patterns', () => {
    const rec = auditCryptoApi(baseInputs)
    expect(rec.callSiteChecklist[0]).toMatch(/Replace hardcoded algorithm names/)
  })

  it('facade pattern is language-specific (Rust gets trait-objects)', () => {
    const rec = auditCryptoApi({ ...baseInputs, language: 'Rust' })
    expect(rec.recommendedFacadePattern).toMatch(/trait/)
  })
})

describe('auditCryptoApi - provider compatibility notes', () => {
  it('HSM provider emits Luna / nCipher / CloudHSM note', () => {
    const rec = auditCryptoApi({ ...baseInputs, provider: ['hsm'] })
    expect(rec.providerCompatNotes.join(' ')).toMatch(/Luna|nCipher|CloudHSM/)
  })

  it('TPM provider emits PC Client Spec v1.85 note', () => {
    const rec = auditCryptoApi({ ...baseInputs, provider: ['tpm'] })
    expect(rec.providerCompatNotes.join(' ')).toMatch(/v1\.85|PC Client/)
  })

  it('software provider emits oqs-provider + OpenSSL 3.x note', () => {
    const rec = auditCryptoApi({ ...baseInputs, provider: ['software'] })
    expect(rec.providerCompatNotes.join(' ')).toMatch(/oqs-provider/)
    expect(rec.providerCompatNotes.join(' ')).toMatch(/OpenSSL 3/)
  })

  it('accelerator provider warns PQC ops are still 2026 roadmap', () => {
    const rec = auditCryptoApi({ ...baseInputs, provider: ['accelerator'] })
    expect(rec.providerCompatNotes.join(' ')).toMatch(/2026/)
  })

  it('multiple providers emit one note each (order preserved)', () => {
    const rec = auditCryptoApi({ ...baseInputs, provider: ['software', 'hsm', 'tpm'] })
    expect(rec.providerCompatNotes).toHaveLength(3)
  })
})

describe('auditCryptoApi - watch-outs', () => {
  it('fully-hardcoded + legacy-mass emits 6-12 month warning', () => {
    const rec = auditCryptoApi({
      ...baseInputs,
      cryptoAgilityNow: 'fully-hardcoded',
      callSiteCount: 'legacy-mass',
    })
    expect(rec.watchOuts.join(' ')).toMatch(/6-12 month/i)
  })

  it('embedded firmware emits flash-budget warning', () => {
    const rec = auditCryptoApi({ ...baseInputs, applicationType: 'embedded firmware' })
    expect(rec.watchOuts.join(' ')).toMatch(/flash budget/i)
  })

  it('browser app warns no native PQC in Web Crypto API', () => {
    const rec = auditCryptoApi({ ...baseInputs, applicationType: 'browser app' })
    expect(rec.watchOuts.join(' ')).toMatch(/Web Crypto/i)
    expect(rec.watchOuts.join(' ')).toMatch(/WASM/i)
  })

  it('must-support fallback + TPM provider emits explicit fallback-path TODO', () => {
    const rec = auditCryptoApi({
      ...baseInputs,
      runtimeFallback: 'must-support',
      provider: ['tpm'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/software-fallback/i)
  })

  it('SLH-DSA on embedded warns about signature size + OTA budget', () => {
    const rec = auditCryptoApi({
      ...baseInputs,
      applicationType: 'embedded firmware',
      targetAlgorithms: ['SLH-DSA'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/SLH-DSA/)
    expect(rec.watchOuts.join(' ')).toMatch(/signature size|over-the-air|OTA/i)
  })

  it('Falcon target warns about FPU / constant-time integer arithmetic', () => {
    const rec = auditCryptoApi({
      ...baseInputs,
      targetAlgorithms: ['Falcon/FN-DSA'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/Falcon|FN-DSA/)
    expect(rec.watchOuts.join(' ')).toMatch(/floating-point|FPU|integer/i)
  })

  it('always emits the CSWP-39 Section 4.1 API-boundary reminder', () => {
    const rec = auditCryptoApi(baseInputs)
    expect(rec.watchOuts.join(' ')).toMatch(/API boundary/i)
    expect(rec.watchOuts.join(' ')).toMatch(/Section 4\.1/)
  })
})

/* renderCryptoApiMarkdown is a pure markdown-string helper, not a React testing-library
 * render. Disable the plugin's render-result-naming convention for this block.
 */
/* eslint-disable testing-library/render-result-naming-convention */
describe('renderCryptoApiMarkdown - export', () => {
  const data = {
    stackInventory: {
      applicationType: 'server-side service',
      language: 'Go',
      currentCryptoApi: ['openssl-evp'],
      provider: ['software', 'hsm'],
    },
    refactorScope: {
      targetAlgorithms: ['ML-KEM', 'ML-DSA'],
      callSiteCount: 'medium',
      cryptoAgilityNow: 'partially-hardcoded',
      runtimeFallback: 'must-support',
    },
    plan: {
      refactorPlan: 'Migrate top-20 RSA call sites first; gate the rest with forbidigo.',
    },
  }

  it('contains the CSWP-39 Section 4.1 citation', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/Section 4\.1/)
    expect(markdown).toMatch(/Using an API in a Crypto Library Application/)
  })

  it('contains the DOI link to CSWP.39', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/doi\.org\/10\.6028\/NIST\.CSWP\.39/)
  })

  it('contains a verbatim CSWP-39 Section 4.1 quote', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/separates the implementation of applications/)
    expect(markdown).toMatch(/simplify the replacement of cryptographic algorithms/)
  })

  it('references Fig.2 (Application -> Protocol -> Crypto-API -> Provider stack)', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/Fig\.2/)
    expect(markdown).toMatch(/Application -> Protocol -> Crypto-API -> Provider/)
  })

  it('emits ASCII-only output (no em-dashes, smart quotes, arrows, or section symbol)', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).not.toMatch(/[—–‘’“”→§]/)
  })

  it('emits a refactor-phase section with bolded phase name', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/## 3\. Recommended Refactor Phase/)
    expect(markdown).toMatch(/\*\*Phase \d/)
  })

  it('emits a Universal patterns block followed by Language-specific (Go)', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/### Universal patterns/)
    expect(markdown).toMatch(/### Language-specific \(Go\)/)
  })

  it('emits a Provider Compatibility section with one bullet per provider', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/## 5\. Provider Compatibility/)
    // software + hsm => two notes
    const section = markdown.split('## 5. Provider Compatibility')[1].split('## 6.')[0]
    const bulletCount = (section.match(/^- /gm) || []).length
    expect(bulletCount).toBeGreaterThanOrEqual(2)
  })

  it('emits a Watch-Outs section that always includes the API-boundary reminder', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/## 6\. Watch-Outs/)
    expect(markdown).toMatch(/API boundary/)
  })

  it('carries the editable narrative into the export', () => {
    const markdown = renderCryptoApiMarkdown(data)
    expect(markdown).toMatch(/Migrate top-20 RSA call sites first/)
  })

  it('falls back to safe defaults when given empty data', () => {
    const markdown = renderCryptoApiMarkdown({})
    expect(markdown).toMatch(/# Crypto API Refactor Audit/)
    expect(markdown).toMatch(/Section 4\.1/)
  })
})
/* eslint-enable testing-library/render-result-naming-convention */
