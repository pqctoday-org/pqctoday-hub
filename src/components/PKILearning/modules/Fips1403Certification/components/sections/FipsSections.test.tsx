// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: FIPS author
/**
 * Render sanity for Path A: every FIPS section renders its teaching anchors,
 * the landscape reads Level/status only from the Hub's CMVP certificate-page
 * fields (with a link-out fallback), and the level planner scores fit, not
 * height.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'
import {
  FipsAcvpBridge,
  FipsAttackEvidence,
  FipsAutomation,
  FipsLandscape,
  FipsLevels,
  FipsLifecycle,
  FipsRequirementAreas,
  FipsRouteTable,
  FipsWhatItIs,
} from './FipsSections'
import { FipsLevelPlanner } from '../../workshop/FipsLevelPlanner'
import { content } from '../../content'
import manifest from '../../manifest'
import { getStandard } from '@/data/standardsRegistry'
import { unresolvedInAppLinks } from '@/test/inAppLinks'
import { resetComplianceMetaCache } from '@/components/Compliance/complianceDataLoader'
import { FIPS_FRESHNESS_CLAIMS } from '../../data/fipsData'
import {
  CMVP_ROUTES,
  ROUTE_OPTIONS,
  SP_LEVEL_ROWS,
  VERIFIED_PQC_LEVEL3_CERTS,
} from '../../data/fipsData'

const wrap = (node: ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>)

afterEach(() => {
  vi.unstubAllGlobals()
  resetComplianceMetaCache()
})

describe('FIPS sections render', () => {
  it('distinguishes the lab proposal from CMVP review of the PQC update route', () => {
    const explanation = ROUTE_OPTIONS.find((option) => option.id === 'updt-fs')?.why
    expect(explanation).toContain('The lab assesses those changes and proposes')
    expect(explanation).toContain('CMVP reviews that proposal and may require a full submission.')
    expect(explanation).not.toContain('Your lab decides the route')
  })

  it('what-it-is: pins the ISO editions and reads a real certificate', () => {
    wrap(<FipsWhatItIs />)
    expect(screen.getByText(/ISO published 2025 editions of both documents/)).toBeInTheDocument()
    expect(screen.getByText('Five documents, five jobs')).toBeInTheDocument()
    expect(screen.getByText('Security Level Exceptions')).toBeInTheDocument()
  })

  it('requirement areas: renders the twelve Security Policy rows for four certificates', () => {
    wrap(<FipsRequirementAreas />)
    const rowHeaders = screen.getAllByRole('rowheader').map((h) => h.textContent ?? '')
    for (const [i, row] of SP_LEVEL_ROWS.entries()) expect(rowHeaders).toContain(`${i + 1}. ${row}`)
    expect(screen.getAllByRole('columnheader')).toHaveLength(5)
    expect(
      screen.getByText(/It does not mean every validated module forbids every plaintext export/)
    ).toBeInTheDocument()
    expect(screen.getByText(/it does not establish FIPS validation/)).toBeInTheDocument()
    expect(
      screen.getByText(
        /that part is our reasoning: expect it to be treated as a significant change/
      )
    ).toHaveTextContent('the CMVP free to decide that the changes exceed 30% and require a full')
    expect(screen.getByText(/It touches the approved security functions/)).toBeInTheDocument()
    expect(screen.queryByText(/It touches the module specification/)).not.toBeInTheDocument()
    expect(screen.queryByText(/is a security-relevant revalidation/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the PKCS#11 Learn exercises' })).toHaveAttribute(
      'href',
      '/playground/hsm?tab=learn'
    )
  })

  it('levels: corrects "Level 1 = software-only" and teaches the FIPS-L3 / PCI PIN nuance', () => {
    wrap(<FipsLevels />)
    expect(screen.getByText(/Level 1 is not “software-only”/)).toBeInTheDocument()
    expect(screen.getByText(/FIPS Level 3 and PCI/)).toBeInTheDocument()
  })

  it('lifecycle: MIP is pipeline, not proof', () => {
    wrap(<FipsLifecycle />)
    expect(screen.getByText('Pipeline, not proof')).toBeInTheDocument()
    expect(screen.getByText(/does not imply or guarantee FIPS 140/)).toBeInTheDocument()
  })

  it('lifecycle: the MIP table uses NIST’s state names and names each actor NIST names', () => {
    wrap(<FipsLifecycle />)
    const table = screen.getByRole('table', { name: 'Modules-in-Process states' })
    const row = (state: string) =>
      within(table)
        .getAllByRole('row')
        .find((r) => within(r).queryByRole('rowheader', { name: state })) as HTMLElement
    expect(within(table).queryByRole('rowheader', { name: /Resubmission – Lab/ })).toBeNull()
    expect(row('Pending Resubmission')).toHaveTextContent('Lab')
    expect(row('Cost Recovery')).toHaveTextContent('NIST Billing and the lab')
    expect(row('Finalization')).toHaveTextContent('CMVP and the lab')
  })

  it('lifecycle: the interim route is described as closed, with NIST’s two dates', () => {
    wrap(<FipsLifecycle />)
    const para = screen.getByText(/Two kinds of validation exist today/)
    expect(para).toHaveTextContent('before 1 January 2024')
    expect(para).toHaveTextContent('before 1 October 2024')
    expect(para).toHaveTextContent(
      'Both dates have passed, so new cases can no longer use this route (our reading of those dates).'
    )
  })

  it('lifecycle: Historical modules are “not in new systems” by NIST’s words, not a ban on buying', () => {
    wrap(<FipsLifecycle />)
    const para = screen.getByText(/After the sunset date, or when a transition retires it/)
    expect(para).toHaveTextContent('Historical FIPS 140-2 modules “for existing systems”')
    expect(para).toHaveTextContent('Federal Agencies “should not include these in new systems”')
    expect(para).not.toHaveTextContent('not for new ones')
  })

  it('automation: CSWP 37B is final, as NIST CSRC records it', () => {
    wrap(<FipsAutomation />)
    const para = screen.getByText(/The project documentation sets out the sequence/)
    expect(para).toHaveTextContent('CSWP 37A (final, 16 March 2026)')
    expect(para).toHaveTextContent('CSWP 37B (final, 30 September 2026)')
    expect(para).not.toHaveTextContent('Initial Public Draft')
  })

  it('acvp bridge and route table render', () => {
    wrap(
      <>
        <FipsAcvpBridge />
        <FipsRouteTable />
      </>
    )
    expect(screen.getByLabelText('From algorithm to certificate')).toBeInTheDocument()
    expect(screen.getByText(/Do not stop at the name “ML-DSA”/)).toHaveTextContent(
      'SigVer means checking signatures'
    )
    expect(screen.getByText(/A signing entry alone does not establish coverage/)).toHaveTextContent(
      'do not assume every parameter set is covered'
    )
    expect(screen.getByRole('link', { name: /^Algorithm validation A5631/ })).toHaveAttribute(
      'href',
      'https://csrc.nist.gov/projects/Cryptographic-Algorithm-Validation-Program/details?validation=38241'
    )
    const checks = screen.getByRole('list', { name: 'Three different ML-DSA checks' })
    expect(within(checks).getAllByRole('listitem')).toHaveLength(3)
    expect(checks).toHaveTextContent('External algorithm testing:')
    expect(checks).toHaveTextContent('before its first approved use')
    expect(checks).toHaveTextContent('it does not test every customer key')
    expect(checks).toHaveTextContent('Pair-wise consistency test:')
    expect(screen.getByText(/Passing one does not replace the others/)).toHaveTextContent(
      'how failures are reported'
    )
    for (const r of CMVP_ROUTES) expect(screen.getAllByText(r.code).length).toBeGreaterThan(0)
  })
})

describe('FIPS acvp-bridge: the vendor-affirmed sentence', () => {
  const SENTENCE =
    "Vendor-affirmed means the vendor states that an algorithm meets the standard without an algorithm test certificate; NIST's FIPS 140-3 Implementation Guidance allows it only where a specific IG section permits it, for example IG C.O for HSS signatures."

  it('defines vendor-affirmed in one sentence, with the exact wording', () => {
    wrap(<FipsAcvpBridge />)
    const para = screen.getByText(/^Vendor-affirmed means/, { selector: 'p' })
    expect(para.textContent).toBe(SENTENCE)
  })

  it('sits where the section first sets algorithm validation apart from the certificate, after the A5631 example and before the operation check', () => {
    wrap(<FipsAcvpBridge />)
    const para = screen.getByText(/^Vendor-affirmed means/, { selector: 'p' })
    const example = screen.getByText(/each approved function carries its CAVP reference/)
    const nextHeading = screen.getByText('Check the operation and parameter set')
    expect(example.compareDocumentPosition(para) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      para.compareDocumentPosition(nextHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('cites the IG through the library row NIST-FIPS140-3-IG-PQC', () => {
    wrap(<FipsAcvpBridge />)
    const para = screen.getByText(/^Vendor-affirmed means/, { selector: 'p' })
    const link = within(para).getByRole('link', { name: 'FIPS 140-3 Implementation Guidance' })
    expect(link).toHaveAttribute('href', getStandard('NIST-FIPS140-3-IG-PQC').deepLink)
    expect(content.standards.map((s) => s.id)).toContain('NIST-FIPS140-3-IG-PQC')
  })
})

describe('FIPS attack-evidence section', () => {
  const CITED_LIBRARY_IDS = [
    'FIPS-140-3-STANDARD',
    'NIST-SP-800-140F',
    'CMVP-MGMT-MANUAL',
    'NIST-FIPS140-3-IG-PQC',
    'NIST-PQC-Seminar-FaultInjection-Lattice',
    'PROACT-2025-SCA-Lattice-PQC',
    'CC-2022-PART3',
    'ENISA-EUCC-HSM-PP-FPT-PHP-Interpretation',
    'ENISA-EUCC-Assurance-Continuity-Change-Scenarios',
  ]

  it('sits after Security Levels and before the validation lifecycle', () => {
    const ids = (manifest.learnSections ?? []).map((s) => s.id)
    const pos = ids.indexOf('fips-attack-evidence')
    expect(ids.at(pos - 1)).toBe('fips-levels')
    expect(ids.at(pos + 1)).toBe('fips-lifecycle')
    expect(manifest.learnSections?.at(pos)?.optional).toBeUndefined()
    expect(manifest.learnSections?.at(pos)?.label).toBe(
      'Side-channel and fault attacks: what a certificate does and does not show'
    )
  })

  it('states the gap: no test metrics for non-invasive security', () => {
    wrap(<FipsAttackEvidence />)
    expect(
      screen.getByText(/The standard has an area for it; the program has no test metrics for it\./)
    ).toBeInTheDocument()
    expect(screen.getByText(/No additional requirements at this time/)).toBeInTheDocument()
    expect(
      screen.getByText(/Non-invasive security is N\/A by default as there are currently no/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Variety of FIA are possible on unprotected Kyber and Dilithium/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Always major at AVA_VAN\.4 and 5/)).toBeInTheDocument()
  })

  it('compares what a FIPS 140-3 and a CC / EUCC certificate show, risk by risk', () => {
    wrap(<FipsAttackEvidence />)
    const table = screen.getByRole('table', { name: /side-channel, fault, random-number/ })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(5)
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['Risk', 'FIPS 140-3 certificate', 'CC / EUCC certificate'])
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((h) => h.textContent)
    ).toEqual([
      'Side-channel (timing, power, EM)',
      'Fault injection',
      'Random numbers',
      'Implementation correctness',
    ])
  })

  it('marks every passage that is the module’s own analysis, in one muted italic form', () => {
    wrap(<FipsAttackEvidence />)
    const marks = screen.getAllByTestId('module-analysis')
    // four prose passages, four table cells and the vendor questions
    expect(marks).toHaveLength(9)
    for (const mark of marks) {
      expect(mark.tagName).toBe('EM')
      expect(mark).toHaveTextContent(/module analysis/i)
    }
    expect(marks[0]).toHaveTextContent('(Module analysis, following from SP 800-140F.)')
  })

  it('cites each Library document it relies on, and the module declares it', () => {
    wrap(<FipsAttackEvidence />)
    const declared = new Set(content.standards.map((s) => s.id))
    for (const id of CITED_LIBRARY_IDS) {
      const std = getStandard(id) // throws on an unknown id
      expect(declared.has(id), `${id} is in content.standards`).toBe(true)
      expect(
        screen.getAllByRole('link').some((a) => a.getAttribute('href') === std.deepLink),
        `${id} is cited in the section`
      ).toBe(true)
    }
  })

  it('links only to modules, sections, steps and pages that exist', () => {
    wrap(<FipsAttackEvidence />)
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => !h.startsWith('/library'))
    expect(hrefs).toContain('/learn/entropy-randomness?tab=learn&section=esv')
    expect(hrefs).toContain('/learn/pqc-testing-validation?tab=learn&section=side-channel-tvla')
    expect(hrefs).toContain('/playground/entropy-test')
    expect(hrefs).toContain('/compliance?tab=records')
    expect(hrefs).toContain('/learn/crypto-product-certification?tab=learn&section=new-platform')
    expect(unresolvedInAppLinks(hrefs)).toEqual([])
  })
})

describe('FIPS landscape — Hub data contract', () => {
  it('shows Level/status from certificate-page fields and falls back per missing field', async () => {
    const [withFields] = VERIFIED_PQC_LEVEL3_CERTS
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        // resolve late on purpose: the rows render with the link-out fallback first, so a
        // test that asserts right after finding the row races the data (flaked on main)
        json: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return [
            {
              id: withFields.cert,
              type: 'FIPS 140-3',
              // legacy fields must be ignored
              certificationLevel: 'FIPS 140-3 L1',
              pqcCoverage: 'nonsense',
              overallLevel: 3,
              cmvpStatus: 'Active',
              sunsetDate: '2031-05-19',
              embodiment: 'MultiChipStand',
              cmvpDetailsFetchedAt: '2026-09-24T12:00:00Z',
            },
          ]
        },
      }))
    )
    wrap(<FipsLandscape />)
    const findRow = () =>
      screen.getByRole('row', { name: (n) => n.includes(`#${withFields.cert}`) })
    // wait for the fetched fields, not just for the row (it first renders the fallback)
    await waitFor(() => expect(within(findRow()).getByText('Level 3')).toBeInTheDocument())
    const row = findRow()
    expect(within(row).getByText('Active')).toBeInTheDocument()
    expect(within(row).getByText('2031-05-19')).toBeInTheDocument()
    // the other three have no fields → link-out fallback
    expect(screen.getAllByText('not in Hub data — see certificate').length).toBeGreaterThanOrEqual(
      3
    )
    expect(screen.queryByText('FIPS 140-3 L1')).not.toBeInTheDocument()
  })

  describe('count of Active certificates', () => {
    const record = (id: string, type: string, status: string) => ({ id, type, status })
    const stubData = (meta: unknown) =>
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => ({
          ok: true,
          json: async () =>
            String(url).includes('meta')
              ? meta
              : [
                  record('1', 'FIPS 140-3', 'Active'),
                  record('2', 'FIPS 140-3', 'Active'),
                  record('3', 'FIPS 140-3', 'Historical'),
                  record('4', 'Common Criteria', 'Active'),
                ],
        }))
      )

    it('reads the count from the Hub data and the date from the retrieval time', async () => {
      stubData({
        schemaVersion: 1,
        partitions: { fips: { label: 'NIST CMVP', retrievedAt: '2026-10-23T02:05:53+00:00' } },
      })
      wrap(<FipsLandscape />)
      expect(
        await screen.findByText(
          /NIST’s Active FIPS 140-3 list held 2 certificates on 23 October 2026\./
        )
      ).toBeInTheDocument()
      expect(screen.queryByText(/712/)).not.toBeInTheDocument()
    })

    it('says the as-of date covers everything except the certificate count', async () => {
      stubData({
        schemaVersion: 1,
        partitions: { fips: { label: 'NIST CMVP', retrievedAt: '2026-10-23T02:05:53+00:00' } },
      })
      wrap(<FipsLandscape />)
      await screen.findByText(/list held 2 certificates on 23 October 2026/)
      const intro = screen.getByText(/Four questions, kept apart/)
      expect(intro.textContent).toContain(
        'except the certificate count, which is read from the site’s own CMVP data'
      )
      expect(intro.textContent).toContain('re-check before you quote it')
    })

    it('scopes the as-of date to its own section and sends later-read items to their own dates', async () => {
      stubData(null)
      wrap(<FipsLandscape />)
      await waitFor(() =>
        expect(screen.getAllByText('not in Hub data — see certificate').length).toBeGreaterThan(0)
      )
      const intro = screen.getByText(/Four questions, kept apart/)
      expect(intro.textContent).toContain('Everything in this section is')
      expect(intro.textContent).toContain(
        'Items elsewhere in the lesson that were read later give their own dates.'
      )
      expect(intro.textContent).not.toContain('Everything here is')
    })

    it('quotes NIST on Historical modules without a procurement rule NIST does not state', async () => {
      stubData(null)
      wrap(<FipsLandscape />)
      await waitFor(() =>
        expect(screen.getAllByText('not in Hub data — see certificate').length).toBeGreaterThan(0)
      )
      const bullet = screen
        .getAllByRole('listitem')
        .find((li) => li.textContent?.includes('Superseded:')) as HTMLElement
      expect(bullet).toHaveTextContent(
        'Federal Agencies “should not include these in new systems but can be procured for legacy systems”'
      )
      expect(bullet).not.toHaveTextContent('needs a FIPS 140-3 validation')
    })

    it('leaves the sentence out when the retrieval date is not stated', async () => {
      stubData(null)
      wrap(<FipsLandscape />)
      await waitFor(() =>
        expect(screen.getAllByText('not in Hub data — see certificate').length).toBeGreaterThan(0)
      )
      expect(screen.queryByText(/list held/)).not.toBeInTheDocument()
    })

    it('no longer pins the old figure of about 712 in the freshness claim', () => {
      const claim = FIPS_FRESHNESS_CLAIMS.find(
        (c) => c.id === 'cert-module-pqc-level3-certificates'
      )
      expect(claim?.claim).toContain('#5282, #5450, #5497, #5503')
      expect(claim?.claim).not.toMatch(/712|in total/)
    })
  })

  it('degrades to a link-out note when the data cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      })
    )
    wrap(<FipsLandscape />)
    expect(await screen.findByText(/Hub certificate data could not be loaded/)).toBeInTheDocument()
  })
})

describe('FIPS level planner', () => {
  const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

  it('does not reward the highest level, and accepts a fitting plan', () => {
    wrap(<FipsLevelPlanner config={{ scenario: 'appliance' }} />)
    click('Appliance hardware')
    click('Firmware')
    click('Crypto library')
    click('Overall Level 4')
    click(/Entropy source is inside the module boundary/)
    click(/CAVP algorithm validations/)
    click(/Self-tests for each PQC algorithm/)
    click(/module’s ESV evidence/)
    click(/UPDT if each of the five change ratios/)
    click(/validated under FIPS 140-3 certificate #N at overall Level 3/)
    click('Check my plan')
    expect(screen.getByText(/4 of 5 decisions defensible for/)).toBeInTheDocument()
    expect(screen.getByText(/Over-specified/)).toBeInTheDocument()

    click('Overall Level 3')
    click('Check my plan')
    expect(screen.getByText(/5 of 5 decisions defensible for/)).toBeInTheDocument()
  })

  it('rejects TRNS for a market deadline and a MIP-based claim', () => {
    wrap(<FipsLevelPlanner config={{ scenario: 'cloud-partition', focus: 'claim' }} />)
    click(/No separate level/)
    click(/Changed service performs no random key or signature generation/)
    click(/TRNS/)
    click(/validation pending at Level 3/)
    click('Check my plan')
    expect(screen.getByText(/published CMVP algorithm transition/)).toBeInTheDocument()
    expect(screen.getByText(/queue position, not evidence/)).toBeInTheDocument()
  })

  it('accepts Level 2 for a host library only with stated assumptions', () => {
    wrap(<FipsLevelPlanner config={{ scenario: 'host-library' }} />)
    click('Crypto library')
    click('Overall Level 2')
    click(/Module relies on a validated external entropy source/)
    click(/CAVP algorithm validations/)
    click(/Self-tests for each PQC algorithm/)
    click(/validated external entropy dependency/)
    click(/UPDT if each of the five change ratios/)
    click(/validated under FIPS 140-3 certificate #M/)
    click('Check my plan')
    expect(screen.getAllByText('Defensible with stated assumptions').length).toBeGreaterThan(0)
    expect(screen.getByText(/not established by “software module” alone/)).toBeInTheDocument()
  })

  it('requires ESV only for an entropy source inside the boundary', () => {
    wrap(<FipsLevelPlanner config={{ scenario: 'appliance' }} />)
    click('Appliance hardware')
    click('Firmware')
    click('Crypto library')
    click('Overall Level 3')
    click(/Module relies on a validated external entropy source/)
    click(/CAVP algorithm validations/)
    click(/Self-tests for each PQC algorithm/)
    click(/validated external entropy dependency/)
    click(/UPDT if each of the five change ratios/)
    click(/validated under FIPS 140-3 certificate #N at overall Level 3/)
    click('Check my plan')
    expect(screen.getByText(/Complete for the declared entropy architecture/)).toBeInTheDocument()
    expect(screen.getAllByText(/5 of 5 decisions defensible/).length).toBeGreaterThan(0)
  })
})
