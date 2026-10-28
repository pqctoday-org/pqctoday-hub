// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Provenance gate for the financial baselines.
 *
 * The 2026-08-10 audit could only report these constants as "cited but
 * unverified" — the evidence on hand was a landing page for each report, and a
 * page ABOUT a report is not the report. On 2026-08-11 both primary documents
 * were retrieved and read, and three of the five constants below turned out to
 * be wrong. Every one of them had been wrong for as long as the landing pages
 * stood in for the reports.
 *
 * This test does not re-fetch anything (CI is offline and these are annual
 * publications). It pins each constant to the specific figure it was read
 * from, so that changing a value without changing the citation fails loudly —
 * the failure mode that let `smb: 2` sit next to the comment "Cyentia IRIS
 * 2025" for months.
 *
 * Sources, both verified as real PDFs before any figure was read:
 *  - Cyentia Institute, Information Risk Insights Study (IRIS) 2025, 36pp.
 *    https://www.cyentia.com/wp-content/uploads/2026/03/IRIS-2025.pdf
 *  - NetDiligence Cyber Claims Study, 2025 Report, 80pp.
 *    https://netdiligence.com/wp-content/uploads/2025/09/NetDiligence-Cyber-Claims-Study-2025-Report-.pdf
 */
import { describe, it, expect } from 'vitest'
import {
  ANNUAL_BREACH_PROBABILITY_PCT,
  ORG_SIZE_BREACH_COST_ANCHORS,
  FINANCIAL_BASELINE_EVIDENCE,
  INDUSTRY_BREACH_BASELINES,
  INDUSTRY_CLAIM_COST_BASELINES,
  INDUSTRY_CLAIM_COST_SAMPLE_SIZE,
  CLAIM_COST_THIN_SAMPLE_THRESHOLD,
  BREACH_COST_BASIS_NOTE,
  BREACH_BASELINE_NOTE,
  BREACH_BASELINE_LABEL,
} from './roiBaselines'

describe('financial baseline provenance', () => {
  describe('Cyentia IRIS 2025 — annual incident probability', () => {
    it('uses Figure 6 (2024, "typical" firm) for the average tier', () => {
      expect(ANNUAL_BREACH_PROBABILITY_PCT.average).toBe(9.3)
    })

    it('uses Figure 7 (2024, under $10M revenue) for the SMB tier', () => {
      // Regression guard: 2 was the 2008 START of this series, not its value.
      expect(ANNUAL_BREACH_PROBABILITY_PCT.smb).toBe(8.7)
      expect(ANNUAL_BREACH_PROBABILITY_PCT.smb).not.toBe(2)
    })

    it('uses Figure 7 (2024, $10B-$100B revenue) for the Fortune-1000 tier', () => {
      // Regression guard: 25 was IRIS 2022's "about 1 in 4", and IRIS 2025
      // exists to show that the largest firms' probability has FALLEN since.
      expect(ANNUAL_BREACH_PROBABILITY_PCT.fortune1000).toBe(12.8)
      expect(ANNUAL_BREACH_PROBABILITY_PCT.fortune1000).not.toBe(25)
    })

    it('keeps the tiers ordered and inside the range Figure 7 actually spans', () => {
      const { smb, average, fortune1000 } = ANNUAL_BREACH_PROBABILITY_PCT
      expect(smb).toBeLessThan(average)
      expect(average).toBeLessThan(fortune1000)
      // Figure 7's 2024 endpoints run from 8.7% (under $10M) to 19.4% (over
      // $100B). A tier outside that band did not come from this figure.
      for (const v of [smb, average, fortune1000]) {
        expect(v).toBeGreaterThanOrEqual(8.7)
        expect(v).toBeLessThanOrEqual(19.4)
      }
    })

    it('does not let the tiers drift back into a wide spread', () => {
      // IRIS 2025's headline finding is CONVERGENCE: small-firm probability has
      // more than doubled since 2008 while the largest firms' has fallen. The
      // old constants encoded a 12.5x spread (2% -> 25%); the report supports
      // about 1.5x. A tool that shows a big SMB discount is showing IRIS 2022.
      const spread = ANNUAL_BREACH_PROBABILITY_PCT.fortune1000 / ANNUAL_BREACH_PROBABILITY_PCT.smb
      expect(spread).toBeLessThan(2)
    })
  })

  describe('NetDiligence 2025 — organization-size cost anchors', () => {
    it('uses Figure 9 (SME five-year average incident cost)', () => {
      // Regression guard: 246_000 is in the report, but it is the 2020 value of
      // Figure 11 — the SME subset WHERE crisis-services costs exceed zero.
      // Conditioning on "a crisis-services bill exists" is a different
      // population from the all-claims anchor this constant stands for.
      expect(ORG_SIZE_BREACH_COST_ANCHORS.sme).toBe(264_000)
      expect(ORG_SIZE_BREACH_COST_ANCHORS.sme).not.toBe(246_000)
    })

    it('uses Figure 10 (large-company five-year average incident cost)', () => {
      expect(ORG_SIZE_BREACH_COST_ANCHORS.large).toBe(10_300_000)
    })
  })

  describe('evidence status', () => {
    it('records which sources are proven against the primary document', () => {
      expect(FINANCIAL_BASELINE_EVIDENCE.cyentiaBreachProbability).toBe('primary-verified')
      expect(FINANCIAL_BASELINE_EVIDENCE.netDiligenceOrgSize).toBe('primary-verified')
    })

    it('no longer lists the registration-walled IBM table as a source', () => {
      // Owner decision 2026-10-27: the IBM per-sector table cannot be cited, so
      // the tools use NetDiligence's primary-verified table instead.
      expect(Object.keys(FINANCIAL_BASELINE_EVIDENCE)).not.toContain('ibmBreachCosts')
      expect(FINANCIAL_BASELINE_EVIDENCE.netDiligenceIndustryClaimCosts).toBe('primary-verified')
    })
  })

  describe('NetDiligence 2025 — per-sector claim costs (2026-08-14)', () => {
    it('is the table every tool reads', () => {
      expect(INDUSTRY_BREACH_BASELINES).toBe(INDUSTRY_CLAIM_COST_BASELINES)
    })

    it('matches NetDiligence Table 5 (Incident Cost by Sector—SMEs) figure for figure', () => {
      // Read from the cached report (sha256 4014f4e7…), page 54, on 2026-10-27.
      expect(INDUSTRY_CLAIM_COST_BASELINES).toEqual({
        'Finance & Banking': 329_000,
        Healthcare: 566_000,
        'Government & Defense': 180_000,
        Technology: 876_000,
        Telecommunications: 1_600_000,
        'Energy & Utilities': 431_000,
        'Retail & E-Commerce': 219_000,
        Aerospace: 395_000,
        Automotive: 395_000,
        Education: 172_000,
        Other: 62_000,
      })
    })

    it('carries a claim count for every figure', () => {
      for (const sector of Object.keys(INDUSTRY_CLAIM_COST_BASELINES)) {
        expect(INDUSTRY_CLAIM_COST_SAMPLE_SIZE[sector]).toBeGreaterThan(0)
      }
    })

    it('flags the thin-sample sectors instead of presenting them as solid', () => {
      const thin = Object.entries(INDUSTRY_CLAIM_COST_SAMPLE_SIZE)
        .filter(([, n]) => n < CLAIM_COST_THIN_SAMPLE_THRESHOLD)
        .map(([s]) => s)
      // Telecommunications rests on 21 claims. If this list ever empties, the
      // threshold or the data moved and the UI caveat needs re-checking.
      expect(thin).toContain('Telecommunications')
    })

    it('says what each column measures, so neither reads as the other', () => {
      // Table 5 is incident cost (paid amount plus retention and excluded costs),
      // which the report says to read as a lower bound — never "payouts".
      expect(BREACH_COST_BASIS_NOTE.netDiligence).toMatch(/incident cost/)
      expect(BREACH_COST_BASIS_NOTE.netDiligence).toMatch(/lower bounds/)
      expect(BREACH_COST_BASIS_NOTE.netDiligence).not.toMatch(/PAID OUT/)
      expect(BREACH_BASELINE_NOTE).toMatch(/^Insurance-claim incident cost \(lower bound\)/)
      expect(BREACH_BASELINE_LABEL).toBe('Insurance-claim incident cost (lower bound)')
    })
  })
})
