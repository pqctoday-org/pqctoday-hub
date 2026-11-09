// SPDX-License-Identifier: AGPL-3.0-only
/** Undiscounted annual rows with one fixed-stock benefit at the horizon end. */
export function roiCashflows(
  annualCost: number,
  annualBenefits: readonly number[],
  endBenefit: number,
  discountRate: number
) {
  if (
    annualBenefits.length === 0 ||
    [annualCost, endBenefit, discountRate, ...annualBenefits].some(
      (value) => !Number.isFinite(value) || value < 0
    )
  ) {
    throw new Error('Use a nonempty horizon and finite nonnegative sample cashflows.')
  }
  let cumulativeNet = 0
  const rows = annualBenefits.map((annualBenefit, index) => {
    const year = index + 1
    const stockBenefit = year === annualBenefits.length ? endBenefit : 0
    const benefit = annualBenefit + stockBenefit
    const net = benefit - annualCost
    cumulativeNet += net
    return { year, annualBenefit, stockBenefit, benefit, cost: annualCost, net, cumulativeNet }
  })
  const totalCost = rows.reduce((sum, row) => sum + row.cost, 0)
  const totalBenefit = rows.reduce((sum, row) => sum + row.benefit, 0)
  const npv = rows.reduce((sum, row) => sum + row.net / (1 + discountRate) ** row.year, 0)
  const crossover = rows.find((row) => row.cumulativeNet >= 0)
  return {
    rows,
    totalCost,
    totalBenefit,
    roiPercent: totalCost === 0 ? null : ((totalBenefit - totalCost) / totalCost) * 100,
    npv,
    paybackYear: totalCost === 0 ? null : (crossover?.year ?? null),
    // Zero cost has no payback to report; that is not the same as never recovering the cost.
    paybackStatus: (totalCost === 0 ? 'no-cost' : crossover ? 'year' : 'none') as
      'no-cost' | 'year' | 'none',
  }
}
