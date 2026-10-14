// SPDX-License-Identifier: GPL-3.0-only
/**
 * Section 9's two merged results: the HSM's key export in OpenFHE and the encrypted risk-scoring
 * service. The numbers are the merged pull requests' measured values; the citations are full merge
 * commits, and nothing still says the HSM's export has not run in OpenFHE.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FheImplementationsSection } from '../components/FheSections'
import { COMPUTE_SERVICE_REF, OPENFHE_EXPORT_REFS } from './fheComputeService'
import { TAKEAWAYS } from './fheContextData'

const sectionText = () => {
  render(
    <MemoryRouter>
      <FheImplementationsSection />
    </MemoryRouter>
  )
  return document.body.textContent ?? ''
}

describe('section 9: the HSM key set in OpenFHE and the encrypted risk-scoring service', () => {
  it('cites full merge commits of the merged pull requests only', () => {
    const refs = [COMPUTE_SERVICE_REF, ...OPENFHE_EXPORT_REFS]
    expect(refs.map((r) => `${r.repo}#${r.pr}`)).toEqual([
      'pqctoday-fhe#27',
      'pqctoday-hsm#360',
      'pqctoday-fhe#28',
    ])
    const text = sectionText()
    for (const r of refs) {
      expect(r.mergeCommit).toMatch(/^[0-9a-f]{40}$/)
      expect(text).toContain(`${r.repo} #${r.pr}, merge commit ${r.mergeCommit}`)
    }
  })

  it('shows both boxes with their measured numbers and limits', () => {
    const text = sectionText()
    /* eslint-disable testing-library/no-node-access -- the anchors are element ids */
    expect(document.getElementById('fhe-openfhe-export')).toBeInTheDocument()
    expect(document.getElementById('fhe-compute-service')).toBeInTheDocument()
    /* eslint-enable testing-library/no-node-access */
    for (const v of [
      '79 keys',
      '6.56 GB streamed in 17.8 s',
      '83.5 MB',
      '0 mismatches over 12,483 evaluation-key limbs',
      '13.28 bits',
      '13.20',
      'owner release only',
      'no board yet',
      'AUC 0.717298 encrypted against 0.717299',
      'all 32,768 slots',
      'About 200 ms',
      'X25519MLKEM768',
      'about 40 refusal cases',
      'classical test certificates',
      'memory only',
    ])
      expect(text, v).toContain(v)
    expect(text).not.toMatch(/has not been run in\s+OpenFHE/)
  })

  it('section 9 now has two takeaways', () => {
    expect(TAKEAWAYS.implementations).toHaveLength(2)
  })
})
