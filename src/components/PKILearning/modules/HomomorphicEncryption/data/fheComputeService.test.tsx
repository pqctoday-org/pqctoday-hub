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
      'pqctoday-fhe#29',
      'pqctoday-fhe#31',
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
      'OpenFHE itself ran on one platform only',
      'also generated on both MX95 boards',
      'about 2.4 minutes each',
      'with all 1,565 pieces matching the reference',
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
    expect(text).not.toMatch(/no board yet/)
  })

  it('says what OpenFHE’s two-round refresh gives with the token’s keys, and its cost and limits', () => {
    const text = sectionText()
    for (const v of [
      'Refreshing twice:',
      'iterative bootstrapping',
      "One bootstrap, OpenFHE's default refresh, keeps 13.28 bits",
      '13.2 bits, worst slot, mean of four runs (13.22 with the token’s keys, 13.20 with OpenFHE’s own)',
      '21.1 bits with the token’s keys (21.18 with OpenFHE’s own, 21.07 through the token’s owner release)',
      'the measured bits minus 5, here precision 8',
      '31.7 to 31.8 bits at precision 19 to 20 with the token’s keys',
      'close to the 32.1 bits of a freshly encrypted ciphertext',
      '30.5 bits when the ciphertext’s true scale is applied',
      '27.0 bits when the release is read at face value',
      'differs from 2^52 by 6 to 7 parts in a billion',
      'Below precision 19 the result is about 13.2 plus the precision',
      '28.0 at 22, 24.2 at 24',
      'found by sweeping, not from a documented rule',
      'Within 0.4 bit at every two-round setting',
      'About twice the time (about 6 s against 3.2 s',
      'one level fewer: 7 left after the refresh instead of 8',
      'multiplicative depth 26',
      'it asks for N = 2^17',
      'Peak memory is unchanged, 16.6 GiB',
      'the two-round results come from one seeded input vector',
    ])
      expect(text, v).toContain(v)
    // the single-refresh figure is no longer presented as OpenFHE's precision at these settings
    expect(text).not.toContain('OpenFHE’s own precision at these settings')
    expect(text).not.toMatch(/iterative[^.]{0,60}not (been )?run/)
    // earlier cross-check bullet points to the two-round result
    expect(text).toContain('a two-round refresh that reaches about 32 bits')
  })

  it('the two-round box links to its evidence record and cites the merged run', () => {
    const text = sectionText()
    // eslint-disable-next-line testing-library/no-node-access -- the cite carries its record id as a title
    const link = document.querySelector(
      'a[title="Evidence record ckks-openfhe-iterative-m5max-cc9d7bc"]'
    )
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toContain('/ckks-openfhe-iterative-cc9d7bc/')
    expect(text).toContain(
      'pqctoday-fhe #31, merge commit cc9d7bc46e71459fd4363b1197a0b2fcc507ab97'
    )
  })

  it('the board sentence links to the two device records of the OpenFHE set', () => {
    sectionText()
    for (const id of [
      'ckks-openfhe-set-token-mx95-461f44ae',
      'ckks-openfhe-set-token-mx95pro-461f44ae',
    ]) {
      // eslint-disable-next-line testing-library/no-node-access -- the cite carries its record id as a title
      const link = document.querySelector(`a[title="Evidence record ${id}"]`)
      expect(link, id).toBeTruthy()
      expect(link?.getAttribute('href')).toContain(`/${id.replace('-token', '')}/`)
    }
  })

  it('section 9 now has two takeaways', () => {
    expect(TAKEAWAYS.implementations).toHaveLength(2)
  })
})
