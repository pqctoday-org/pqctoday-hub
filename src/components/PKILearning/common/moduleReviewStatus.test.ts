// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The five certification modules the owner reviewed on 22 October 2026 say the same thing about
 * their review status everywhere a reader or the site assistant meets it: the owner's sign-off
 * (or that it is awaiting re-sign-off after a correction) and that no accredited laboratory or
 * certification body has reviewed it. The status follows the module's own `lastReviewed`, so a
 * notice cannot claim a sign-off the module no longer carries.
 */
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { CertIntroduction } from '../modules/CryptoProductCertification/components/CertIntroduction'
import fundamentalsManifest from '../modules/CryptoProductCertification/manifest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MODULE_LAST_EDITED, MODULE_LAST_REVIEWED } from '@/data/moduleContentRegistry'
import { NOT_LAB_REVIEWED, longDate, ownerReviewStatusText } from './moduleReviewStatus'
import { REVIEW_STATUS } from '../modules/AcvpLabWorkflow/data/reviewStatus'

const MODULES: ReadonlyArray<{ id: string; dir: string }> = [
  { id: 'crypto-product-certification', dir: 'CryptoProductCertification' },
  { id: 'fips-140-3-certification', dir: 'Fips1403Certification' },
  { id: 'cc-eucc-certification', dir: 'CcEuccCertification' },
  { id: 'pci-certification', dir: 'PciCertification' },
  { id: 'acvp-lab-workflow', dir: 'AcvpLabWorkflow' },
]

const read = (dir: string, file: string) =>
  readFileSync(join(process.cwd(), 'src/components/PKILearning/modules', dir, file), 'utf-8')

describe('ownerReviewStatusText', () => {
  it('says the owner signed the module off on the review date, and that no lab or certification body has', () => {
    expect(ownerReviewStatusText('2026-10-22')).toBe(
      'Reviewed and signed off by the PQC Today owner on 22 October 2026. Not yet reviewed by an accredited laboratory or certification body.'
    )
  })

  it('says awaiting re-sign-off when the module has no review date', () => {
    const text = ownerReviewStatusText(undefined)
    expect(text).toContain("Corrected since the PQC Today owner's last sign-off")
    expect(text).toContain('awaiting re-sign-off')
    expect(text).not.toContain('22 October 2026')
    expect(text).toContain(NOT_LAB_REVIEWED)
  })

  it('preserves the historical review while identifying later unreviewed changes', () => {
    expect(ownerReviewStatusText('2026-11-01', '2026-11-11')).toBe(
      'Owner review recorded on 1 November 2026. Content updated 11 November 2026 since that review; these changes are not covered by that recorded review. Not yet reviewed by an accredited laboratory or certification body.'
    )
  })

  it('keeps existing callers and equal or earlier edit dates unchanged', () => {
    const reviewed = ownerReviewStatusText('2026-11-01')
    expect(ownerReviewStatusText('2026-11-01', '2026-11-01')).toBe(reviewed)
    expect(ownerReviewStatusText('2026-11-01', '2026-10-31')).toBe(reviewed)
    expect(ownerReviewStatusText(undefined, '2026-11-11')).toBe(ownerReviewStatusText(undefined))
  })

  it('does not infer a later update from malformed or impossible dates', () => {
    for (const date of ['2026-99-11', '2026-02-30', 'November 11', '2026-11-11junk', '']) {
      expect(ownerReviewStatusText('2026-11-01', date)).toBe(ownerReviewStatusText('2026-11-01'))
    }
    expect(ownerReviewStatusText('November', '2026-11-11')).toBe(ownerReviewStatusText('November'))
  })

  it('keeps the owner review and the lab review apart', () => {
    for (const text of [ownerReviewStatusText('2026-10-22'), ownerReviewStatusText(undefined)]) {
      const [ownerSentence, labSentence, ...rest] = text.split(/(?<=\.) /)
      expect(rest).toEqual([])
      expect(ownerSentence).toMatch(/PQC Today owner/)
      // the owner's sign-off is never presented as a laboratory or certification-body review
      expect(ownerSentence).not.toMatch(/accredited|laborator|certification body/)
      expect(labSentence).toBe(NOT_LAB_REVIEWED)
    }
  })

  it('formats an ISO date in words and leaves anything else alone', () => {
    expect(longDate('2026-10-22')).toBe('22 October 2026')
    expect(longDate('2026-01-05')).toBe('5 January 2026')
    expect(longDate('October')).toBe('October')
  })
})

describe('the actual certification introduction', () => {
  it('qualifies the historical review using the actual module edit date without changing its record', () => {
    const historicalReview = MODULE_LAST_REVIEWED['crypto-product-certification']
    const edited = MODULE_LAST_EDITED['crypto-product-certification']
    expect(historicalReview).toBe('2026-11-01')
    expect(edited > historicalReview).toBe(true)
    const view = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/learn/crypto-product-certification'] },
        createElement(CertIntroduction, {
          manifest: fundamentalsManifest,
          sections: new Map(),
          onNavigateToWorkshop: () => {},
        })
      )
    )
    expect(view).toContain(`Owner review recorded on ${longDate(historicalReview)}.`)
    expect(view).toContain(`Content updated ${longDate(edited)} since that review`)
    expect(view).toContain('these changes are not covered by that recorded review')
    expect(view).toContain(NOT_LAB_REVIEWED)
    expect(view).not.toContain('Reviewed and signed off by the PQC Today owner')
    expect(MODULE_LAST_REVIEWED['crypto-product-certification']).toBe(historicalReview)
  })
})

describe('the five certification modules show one review status', () => {
  for (const { id, dir } of MODULES) {
    describe(id, () => {
      const signedOff = Boolean(MODULE_LAST_REVIEWED[id])
      const rag = read(dir, 'rag-summary.md')

      it('has no draft or practitioner-review wording left', () => {
        for (const file of ['rag-summary.md', 'curious-summary.md']) {
          const text = read(dir, file)
          expect(text, `${dir}/${file}`).not.toMatch(/awaiting review by a validation-lab/i)
          expect(text, `${dir}/${file}`).not.toMatch(/\bThis draft module\b/)
          expect(text, `${dir}/${file}`).not.toMatch(/Not yet reviewed by an accredited lab or/)
        }
      })

      it("the site assistant's summary says no laboratory or certification body has reviewed it", () => {
        expect(rag).toMatch(
          /(?:has|have) not been reviewed by an accredited laboratory or certification body|Not yet reviewed by an accredited laboratory or certification body/
        )
      })

      it("the summary's sign-off line matches the module's lastReviewed", () => {
        if (signedOff) {
          expect(rag).toContain(
            `signed off by the PQC Today owner on ${longDate(MODULE_LAST_REVIEWED[id] as string)}`
          )
          expect(rag).not.toContain('awaiting re-sign-off')
        } else {
          expect(rag).toContain('awaiting re-sign-off')
        }
      })
    })
  }

  it('ACVP, signed off by the owner on 1 November 2026, shows the signed-off state with the shared words', () => {
    expect(MODULE_LAST_REVIEWED['acvp-lab-workflow']).toBe('2026-11-01')
    expect(REVIEW_STATUS.label).toBe(
      'Reviewed and signed off by the PQC Today owner on 1 November 2026'
    )
    expect(REVIEW_STATUS.detail).toContain(NOT_LAB_REVIEWED)
  })
})
