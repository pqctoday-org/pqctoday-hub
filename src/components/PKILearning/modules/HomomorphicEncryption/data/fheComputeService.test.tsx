// SPDX-License-Identifier: GPL-3.0-only
/**
 * Section 9's two merged results: the HSM's key export in OpenFHE and the encrypted risk-scoring
 * service. The numbers are the merged pull requests' measured values; the citations are full merge
 * commits, and nothing still says the HSM's export has not run in OpenFHE.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import {
  FheCustodySection,
  FheImplementationsSection,
  FheKeysOperationsSection,
} from '../components/FheSections'
import {
  COMPUTE_SERVICE_KMIP_REF,
  COMPUTE_SERVICE_REF,
  COMPUTE_SERVICE_RUNS_REF,
  OPENFHE_EXPORT_REFS,
  TFHE_LOAN_REF,
} from './fheComputeService'
import { FHE_HSM_FLOWS } from './fheHsmFlows'
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
    const refs = [
      COMPUTE_SERVICE_REF,
      ...OPENFHE_EXPORT_REFS,
      COMPUTE_SERVICE_RUNS_REF,
      COMPUTE_SERVICE_KMIP_REF,
      TFHE_LOAN_REF,
    ]
    expect(refs.map((r) => `${r.repo}#${r.pr}`)).toEqual([
      'pqctoday-fhe#27',
      'pqctoday-hsm#360',
      'pqctoday-fhe#28',
      'pqctoday-fhe#29',
      'pqctoday-fhe#31',
      'pqctoday-fhe#32',
      'pqctoday-fhe#36',
      'pqctoday-fhe#38',
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
      'On the Mac, about 200 ms',
      'X25519MLKEM768',
      'about 40 refusal cases',
      'classical test certificates',
      'memory only',
    ])
      expect(text, v).toContain(v)
    // the service is no longer described as run on one Mac only
    expect(text).not.toMatch(/built and measured on one Mac/)
    expect(text).not.toMatch(/run on one Mac, not on a board/)
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

  it('says the scoring service also ran on an x86-64 VM and on an MX95 Pro with the token on a second board', () => {
    const text = sectionText()
    for (const v of [
      'built and measured on a Mac, then run on an x86-64 virtual machine and on an MX95 Pro board',
      'On other machines:',
      'also ran on an x86-64 virtual machine and on an MX95 Pro board, the latter with the token on a second board (the base MX95)',
      'so the three roles sat on three machines',
      'Mac (Apple M5 Max)',
      'median 201 ms, 197–231 ms over 10 jobs',
      'peak 1,714 MiB',
      'x86-64 virtual machine',
      '277 ms per batch (median of three repetitions; 273–305 ms over all 8 jobs), peak 1,311 MiB',
      'key set admitted with 40 ms to verify and 100 ms to assemble',
      'about 13,000 requests an hour by server time alone, whole run 47 s',
      'MX95 Pro board',
      'the token on the base MX95 board (it exported its 4.41 GB key set in 124 s, 35.7 MB/s, 83 MiB peak)',
      '4.29 s per batch (median of three repetitions; 4.16–4.66 s over all 8 jobs), about 21 times the Mac, peak 1,870 MiB',
      'key set admitted with 170 ms to verify and 497 ms to assemble',
      '600 requests an hour one at a time with the 184 MiB upload (840 by server time alone), whole run 202 s',
      'The scores were identical on all three machines: 21.00 bits against the plaintext cubic',
      'AUC 0.717298 against 0.717299',
      'one run per machine',
      'use the published test seed, so their secret key is public and they measure time, memory and correctness, not secrecy',
      'not a dedicated host',
      'listens on loopback and is reached through an ssh tunnel with TLS inside it',
      'pqctoday-fhe #32, merge commit ed7b92ee2bb3fae7bc9cb22e24a80490c786d1fd',
      'pqctoday-hsm main at ebbc3d20ab209bfba125243f2b9a029b71a8cf9d',
    ])
      expect(text, v).toContain(v)
    // the lab's machine labels and addresses are not in the text
    const oldLabel = `x${1}`
    expect(text).not.toMatch(
      new RegExp(`\\b${oldLabel}\\b|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}`, 'i')
    )
  })

  it('the two machine runs link to their evidence records', () => {
    sectionText()
    for (const [id, folder] of [
      ['ckks-scoring-service-x86-vm-m5max-ed7b92e', 'ckks-scoring-service-x86-vm-ed7b92e'],
      ['ckks-scoring-service-mx95pro-m5max-ed7b92e', 'ckks-scoring-service-mx95pro-ed7b92e'],
    ]) {
      // eslint-disable-next-line testing-library/no-node-access -- the cite carries its record id as a title
      const link = document.querySelector(`a[title="Evidence record ${id}"]`)
      expect(link, id).toBeTruthy()
      expect(link?.getAttribute('href')).toContain(`/${folder}/`)
    }
  })

  it('adds the run with the token over KMIP as a third run, with the same accuracy', () => {
    const text = sectionText()
    for (const v of [
      'A third run used the virtual machine again, with the token on the MX95 Pro reached over KMIP',
      'x86-64 virtual machine, token over KMIP',
      'with a random seed generated in the token and decryption under the security officer’s enrolled policy',
      'The token exported the 4.41 GB key set in 1,201 bounded calls over KMIP in 197 s (22.4 MB/s, 0 manifest mismatches)',
      '302 ms per batch (median of three repetitions; 280–325 ms over all 8 jobs), peak 1,178 MiB',
      'key set admitted with 40 ms to verify and 99 ms to assemble',
      'the score released over KMIP in 0.176 s (0.23 s wall), whole run 240 s',
      'The run with the token over KMIP gave the same accuracy.',
      'the first virtual machine run and the board run use the published test seed',
      'pqctoday-fhe #36, merge commit 5f0ff3daf142c5064681cb3ca7d5f0946b139f2d',
    ])
      expect(text, v).toContain(v)
  })

  it('shows the TFHE loan pre-qualification over KMIP, with its limits', () => {
    const text = sectionText()
    /* eslint-disable-next-line testing-library/no-node-access -- the anchor is an element id */
    expect(document.getElementById('fhe-tfhe-loan')).toBeInTheDocument()
    for (const v of [
      'TFHE: an encrypted loan pre-qualification',
      '1,016 applicants (16 hand-made edge cases), 0 mismatches against the plaintext engine, 243 approved',
      'Server compute median 0.905 s per applicant (0.835–1.088 s)',
      '3,237 applicants an hour by wall time (median 1.112 s each)',
      'All 6,096 outputs decrypted on the MX95 Pro over KMIP, each a single-part decryption (init, size query, decrypt): median 24.8 ms, p95 42.8 ms, 0 refused, 0 errors',
      'checked the token-signed manifest',
      'TFHE-rs is used here for non-commercial purposes only',
      'first published run under the corrected HSM engine',
      'pqctoday-fhe #38, merge commit 354533be3fc88003a705cb667d84812568caebcc',
    ])
      expect(text, v).toContain(v)
  })

  it('the KMIP runs link to their evidence records', () => {
    sectionText()
    for (const [id, folder] of [
      [
        'ckks-scoring-service-x86-vm-mx95pro-kmip-5f0ff3d',
        'ckks-scoring-service-x86-vm-kmip-5f0ff3d',
      ],
      ['tfhe-loan-prequal-x86-vm-mx95pro-kmip-354533b', 'tfhe-loan-prequal-x86-vm-kmip-354533b'],
    ]) {
      // eslint-disable-next-line testing-library/no-node-access -- the cite carries its record id as a title
      const link = document.querySelector(`a[title="Evidence record ${id}"]`)
      expect(link, id).toBeTruthy()
      expect(link?.getAttribute('href')).toContain(`/${folder}/`)
    }
  })

  it('section 9 now has two takeaways', () => {
    expect(TAKEAWAYS.implementations).toHaveLength(2)
    expect(TAKEAWAYS.implementations[1]).toContain(
      'in about 200 ms per 32,768 customers on a Mac (277 ms on an x86 virtual machine, 4.29 s on an MX95 Pro board)'
    )
  })
})

describe('FHE custody over KMIP: vendor mechanisms, the security model and the KMIP export', () => {
  const keysSectionText = () => {
    render(
      <MemoryRouter>
        <FheKeysOperationsSection />
      </MemoryRouter>
    )
    return document.body.textContent ?? ''
  }
  const custodySectionText = () => {
    render(
      <MemoryRouter>
        <FheCustodySection />
      </MemoryRouter>
    )
    return document.body.textContent ?? ''
  }

  it('keeps that no standard defines an FHE mechanism, and names the lab HSM’s vendor mechanisms over KMIP', () => {
    const text = keysSectionText()
    expect(text).toContain('no PKCS#11 or KMIP object type and no X.509 OID')
    for (const v of [
      'No standard defines an FHE mechanism either.',
      "vendor-defined PKCS#11 mechanisms, for key generation, public-key derivation and decryption, listed in its mechanism list and carried over KMIP's PKCS_11 operation",
      'It offers no FHE encryption mechanism',
    ])
      expect(text, v).toContain(v)
    const watchOut = FHE_HSM_FLOWS.find((f) => f.id === 'hsm-compute-limits')?.watchOut ?? ''
    expect(watchOut).toContain('No PKCS#11 v3.2 or KMIP standard defines an FHE mechanism yet')
    expect(watchOut).toContain('carried over KMIP’s PKCS_11 operation')
    expect(watchOut).toContain('it offers no FHE encryption mechanism')
  })

  it('states the security model as implemented', () => {
    const text = custodySectionText()
    for (const v of [
      'FHE keys follow the normal PKCS#11 user and security-officer roles',
      'Key generation, public-key derivation, attribute reads and decryption are user operations; there is no FHE-specific role',
      'CKA_DESTROYABLE = FALSE, so only the security officer can destroy one, through a signed administrative request',
      "each decryption spends one unit of a counter fixed by the officer's enrolled decryption policy",
      'Refused and malformed requests spend a unit too',
      'PKCS#11 single-part, C_DecryptInit, a size query, then C_Decrypt',
    ])
      expect(text, v).toContain(v)
  })

  it('adds the KMIP export as a separate measurement, with no faster-or-slower claim', () => {
    const text = custodySectionText()
    expect(text).toContain(
      'the 4.41 GB key set of the second parameter set went out in 1,201 bounded calls in 197 s (22.4 MB/s), with 0 manifest mismatches'
    )
    expect(text).toContain('not a comparison with the SSH-stream figures above')
    expect(text).toContain('so it does not show KMIP to be slower or faster')
    expect(text).not.toMatch(/KMIP (is|was) (slower|faster)/)
  })
})
