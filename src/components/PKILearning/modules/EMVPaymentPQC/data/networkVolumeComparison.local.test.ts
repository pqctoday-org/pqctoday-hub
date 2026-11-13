// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PAYMENT_NETWORKS } from './paymentNetworkData'
import {
  CALENDAR_2025,
  CARD_COUNT_AS_OF,
  compareCardCounts,
  comparePurchaseVolume,
  formatCardTotal,
  formatUsdBillions,
} from './networkVolumeComparison'
import { RADAR_AXES, type PaymentNetwork } from './emvConstants'
import {
  RADAR_RUBRIC,
  RADAR_SCORES_NOTICE,
  cardCountShares,
  legacyBurdenScore,
  pqcReadinessScore,
  scaleScoreFromShare,
} from './networkRadarRubric'

function byId(id: string): PaymentNetwork {
  const found = PAYMENT_NETWORKS.find((n) => n.id === id)
  if (!found) throw new Error(`missing network ${id}`)
  return found
}

function withVolume(
  network: PaymentNetwork,
  changes: Partial<NonNullable<PaymentNetwork['figures']['volume']>>
): PaymentNetwork {
  const volume = network.figures.volume
  if (!volume) throw new Error('network has no volume fact')
  return { ...network, figures: { ...network.figures, volume: { ...volume, ...changes } } }
}

describe('network purchase-volume comparison', () => {
  it('keeps all five networks with a dated source or an explicit older-figure label', () => {
    expect(PAYMENT_NETWORKS.map((n) => n.id)).toEqual([
      'visa',
      'mastercard',
      'amex',
      'unionpay',
      'discover',
    ])
    for (const network of PAYMENT_NETWORKS) {
      const { cards, source } = network.figures
      expect(source?.url, network.id).toMatch(/^https:\/\//)
      if (cards.asOf === null) expect(network.cardsInCirculation).toMatch(/older figure/)
      else expect(network.cardsInCirculation).toContain('2025')
    }
  })

  it('adds only Visa and Mastercard calendar-2025 purchases: 14,567 + 8,799 = 23,366 (2 of 5)', () => {
    const r = comparePurchaseVolume(PAYMENT_NETWORKS)
    expect(14_567 + 8_799).toBe(23_366)
    expect(r.totalUsdBn).toBe(23_366)
    expect(r.includedIds).toEqual(['visa', 'mastercard'])
    expect(r.coverageLabel).toBe('2 of 5 networks')
    expect(r.periodLabel).toBe('calendar 2025')
    expect(formatUsdBillions(r.totalUsdBn ?? 0)).toBe('$23,366B')
  })

  it('names why each of the other three networks is left out', () => {
    const r = comparePurchaseVolume(PAYMENT_NETWORKS)
    expect(r.excluded.map((e) => e.id)).toEqual(['amex', 'unionpay', 'discover'])
    expect(r.excluded[0].reason).toMatch(/cash advances/)
    expect(r.excluded[1].reason).toMatch(/No dated, same-scope/)
    expect(r.excluded[2].reason).toMatch(/No dated, same-scope/)
  })

  it('recomputes the total and the coverage when the selection changes', () => {
    const visa = comparePurchaseVolume([byId('visa')])
    expect(visa.totalUsdBn).toBe(14_567)
    expect(visa.coverageLabel).toBe('1 of 1 networks')
    const mc = comparePurchaseVolume([byId('mastercard'), byId('amex')])
    expect(mc.totalUsdBn).toBe(8_799)
    expect(mc.coverageLabel).toBe('1 of 2 networks')
  })

  it('returns no compatible total, never zero, when nothing selected is comparable', () => {
    for (const selection of [[byId('amex'), byId('unionpay')], [byId('discover')], []]) {
      const r = comparePurchaseVolume(selection)
      expect(r.totalUsdBn).toBeNull()
      expect(r.includedIds).toEqual([])
    }
    expect(comparePurchaseVolume([]).coverageLabel).toBe('0 of 0 networks')
  })

  it('keeps a true zero distinct from no data', () => {
    const zero = comparePurchaseVolume([withVolume(byId('visa'), { usdBn: 0 })])
    expect(zero.totalUsdBn).toBe(0)
    expect(zero.includedIds).toEqual(['visa'])
  })

  it('leaves out a different period, a different currency and a lower bound', () => {
    expect(
      comparePurchaseVolume([withVolume(byId('visa'), { periodEnd: '2025-09-30' })]).totalUsdBn
    ).toBeNull()
    expect(
      comparePurchaseVolume([withVolume(byId('visa'), { currency: 'CNY' as 'USD' })]).totalUsdBn
    ).toBeNull()
    expect(
      comparePurchaseVolume([withVolume(byId('visa'), { lowerBound: true })]).totalUsdBn
    ).toBeNull()
    expect(CALENDAR_2025.start).toBe('2025-01-01')
  })

  it('refuses a negative volume and a duplicate network', () => {
    expect(() => comparePurchaseVolume([withVolume(byId('visa'), { usdBn: -1 })])).toThrow()
    expect(() => comparePurchaseVolume([byId('visa'), byId('visa')])).toThrow()
  })

  it('does not let gross dollar volume stand in for purchases (Mastercard cash counterexample)', () => {
    const mc = byId('mastercard')
    expect(mc.figures.volume?.usdBn).toBe(8_799)
    expect(mc.figures.volume?.cashIncluded).toBe(false)
    expect(10_632 - 8_799).toBe(1_833)
    expect(mc.figures.otherFacts.join(' ')).toContain('$10,632 billion')
    expect(mc.figures.otherFacts.join(' ')).toContain('$1,833 billion of cash')
    // Using gross dollar volume would inflate this row by about 20.8 percent.
    expect(Math.round((10_632 / 8_799 - 1) * 10_000) / 100).toBe(20.83)
    // A network-volume figure that includes cash is refused even with the right period.
    expect(
      comparePurchaseVolume([
        withVolume(byId('visa'), { metric: 'network-volume-incl-cash-and-alternative-payments' }),
      ]).totalUsdBn
    ).toBeNull()
  })

  it('adds decimal figures without floating-point drift', () => {
    const r = comparePurchaseVolume([
      withVolume(byId('visa'), { usdBn: 0.1 }),
      withVolume(byId('mastercard'), { usdBn: 0.2 }),
    ])
    expect(r.totalUsdBn).toBe(0.3)
  })

  it('does not depend on the order of the selected networks', () => {
    const a = comparePurchaseVolume([byId('visa'), byId('mastercard')])
    const b = comparePurchaseVolume([byId('mastercard'), byId('visa')])
    expect(a.totalUsdBn).toBe(b.totalUsdBn)
  })
})

describe('radar score rubric', () => {
  it('covers exactly the six radar axes, each with a question, a direction and anchors', () => {
    expect(RADAR_RUBRIC.map((r) => r.key)).toEqual(RADAR_AXES.map((a) => a.key))
    for (const entry of RADAR_RUBRIC) {
      expect(entry.question.length, entry.key).toBeGreaterThan(20)
      expect(entry.direction.length, entry.key).toBeGreaterThan(20)
      expect(
        Object.values(entry.anchors).every((a) => a.length > 10),
        entry.key
      ).toBe(true)
    }
  })

  it('states that scores are teaching aids, need a sourced basis, and that not scored is not 0', () => {
    expect(RADAR_SCORES_NOTICE).toMatch(/teaching aids/)
    expect(RADAR_SCORES_NOTICE).toMatch(/not a rating of any company/)
    expect(RADAR_SCORES_NOTICE).toMatch(/"not scored" is not 0/i)
  })

  it('gives every axis of every network either a 1 to 5 score with a basis or a not-scored basis', () => {
    for (const network of PAYMENT_NETWORKS) {
      for (const axis of RADAR_AXES) {
        const score = network.radarScores[axis.key]
        const basis = network.radarBasis[axis.key]
        const where = `${network.id}.${axis.key}`
        expect(basis.length, where).toBeGreaterThan(20)
        if (score === null) {
          expect(basis, where).toMatch(/^Not scored:/)
        } else {
          expect(Number.isInteger(score) && score >= 1 && score <= 5, where).toBe(true)
          expect(basis, where).toMatch(new RegExp(`^Score ${score}:`))
        }
      }
    }
  })

  it('never records a 0: missing evidence is not scored rather than zero', () => {
    for (const network of PAYMENT_NETWORKS) {
      expect(Object.values(network.radarScores)).not.toContain(0)
    }
  })

  it('leaves offline exposure, tokenization and regulatory not scored for every network', () => {
    for (const network of PAYMENT_NETWORKS) {
      for (const key of ['offlineExposure', 'tokenization', 'regulatoryPressure'] as const) {
        expect(network.radarScores[key], `${network.id}.${key}`).toBeNull()
      }
    }
  })

  it('derives scale from the share of the largest comparable card count', () => {
    expect(scaleScoreFromShare(1)).toBe(5)
    expect(scaleScoreFromShare(0.75)).toBe(5)
    expect(scaleScoreFromShare(0.7499)).toBe(4)
    expect(scaleScoreFromShare(0.5)).toBe(4)
    expect(scaleScoreFromShare(0.25)).toBe(3)
    expect(scaleScoreFromShare(0.1)).toBe(2)
    expect(scaleScoreFromShare(0.0999)).toBe(1)
    expect(() => scaleScoreFromShare(0)).toThrow()
    const shares = cardCountShares(PAYMENT_NETWORKS, CARD_COUNT_AS_OF)
    expect(Object.keys(shares)).toEqual(['visa', 'mastercard', 'amex'])
    expect(shares.visa).toBe(1)
    expect(Math.round(shares.mastercard * 100)).toBe(66)
    expect(Math.round(shares.amex * 100)).toBe(3)
    for (const network of PAYMENT_NETWORKS) {
      const share = shares[network.id]
      expect(network.radarScores.scale, network.id).toBe(
        share === undefined ? null : scaleScoreFromShare(share)
      )
    }
  })

  it('derives PQC readiness from the posture label and agrees with the stored scores', () => {
    expect(pqcReadinessScore('shared-standards')).toBe(1)
    expect(pqcReadinessScore('readiness-program')).toBe(1)
    expect(pqcReadinessScore('published-guidance')).toBe(2)
    expect(pqcReadinessScore('prototype-testing')).toBe(4)
    for (const network of PAYMENT_NETWORKS) {
      expect(network.radarScores.pqcReadiness, network.id).toBe(
        pqcReadinessScore(network.pqcPosture)
      )
    }
    // UnionPay and Discover both have shared-standards posture, so they now score the same.
    expect(byId('unionpay').radarScores.pqcReadiness).toBe(
      byId('discover').radarScores.pqcReadiness
    )
  })

  it('derives legacy burden from the listed methods and agrees with the stored scores', () => {
    expect(
      legacyBurdenScore({
        offlineAuth: ['RSA-2048'],
        onlineAuth: ['AES DUKPT'],
        keyManagement: [],
        ecommerce: [],
      })
    ).toBe(1)
    expect(
      legacyBurdenScore({
        offlineAuth: ['RSA-1024 (legacy DDA)'],
        onlineAuth: ['3DES DUKPT'],
        keyManagement: [],
        ecommerce: [],
      })
    ).toBeNull()
    expect(
      legacyBurdenScore({
        offlineAuth: ['RSA-2048'],
        onlineAuth: ['3DES DUKPT'],
        keyManagement: [],
        ecommerce: [],
      })
    ).toBe(3)
    for (const network of PAYMENT_NETWORKS) {
      expect(network.radarScores.legacyBurden, network.id).toBe(
        legacyBurdenScore(network.currentCrypto)
      )
    }
  })
})

describe('network card-count comparison', () => {
  it('adds only exact counts dated 31 Dec 2025: 5,142M + 3,391M + 152.8M (3 of 5)', () => {
    const r = compareCardCounts(PAYMENT_NETWORKS)
    expect(r.total).toBe(5_142_000_000 + 3_391_000_000 + 152_800_000)
    expect(r.includedIds).toEqual(['visa', 'mastercard', 'amex'])
    expect(r.coverageLabel).toBe('3 of 5 networks')
    expect(formatCardTotal(r.total ?? 0)).toBe('8.7B')
  })

  it('names why UnionPay and Discover counts are left out', () => {
    const r = compareCardCounts(PAYMENT_NETWORKS)
    expect(r.excluded.map((e) => e.id)).toEqual(['unionpay', 'discover'])
    for (const e of r.excluded) expect(e.reason).toMatch(/no date or scope established/)
  })

  it('returns no compatible total, never zero, when nothing selected is comparable', () => {
    for (const selection of [[byId('unionpay')], [byId('discover'), byId('unionpay')], []]) {
      expect(compareCardCounts(selection).total).toBeNull()
    }
  })

  it('leaves out a different date and a lower bound, and refuses negatives and duplicates', () => {
    const visa = byId('visa')
    const shifted = {
      ...visa,
      figures: { ...visa.figures, cards: { ...visa.figures.cards, asOf: '2024-12-31' } },
    }
    expect(compareCardCounts([shifted]).total).toBeNull()
    const bound = {
      ...visa,
      figures: { ...visa.figures, cards: { ...visa.figures.cards, lowerBound: true } },
    }
    expect(compareCardCounts([bound]).total).toBeNull()
    expect(() => compareCardCounts([{ ...visa, cardsInCirculationNum: -1 }])).toThrow()
    expect(() => compareCardCounts([visa, visa])).toThrow()
  })
})
