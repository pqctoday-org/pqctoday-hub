// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PAYMENT_NETWORKS } from './paymentNetworkData'
import { CALENDAR_2025, comparePurchaseVolume, formatUsdBillions } from './networkVolumeComparison'
import { RADAR_AXES, type PaymentNetwork } from './emvConstants'
import { RADAR_RUBRIC, RADAR_SCORES_NOTICE } from './networkRadarRubric'

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

  it('states that the scores are authored judgements and that missing evidence is not 0', () => {
    expect(RADAR_SCORES_NOTICE).toMatch(/authored judgements/)
    expect(RADAR_SCORES_NOTICE).toMatch(/not a rating of any company/)
    expect(RADAR_SCORES_NOTICE).toMatch(/missing evidence is never scored as 0/)
  })

  it('keeps every authored score inside 0 to 5', () => {
    for (const network of PAYMENT_NETWORKS) {
      for (const axis of RADAR_AXES) {
        const score = network.radarScores[axis.key]
        expect(
          Number.isInteger(score) && score >= 0 && score <= 5,
          `${network.id}.${axis.key}`
        ).toBe(true)
      }
    }
  })
})
