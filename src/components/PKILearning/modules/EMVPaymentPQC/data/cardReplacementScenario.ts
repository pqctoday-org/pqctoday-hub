// SPDX-License-Identifier: AGPL-3.0-only
/** Existing module planning inputs, made explicit rather than tied to “today”. */
export const CARD_REPLACEMENT_SCENARIO = {
  startYear: 2026,
  cycleYears: [3, 5],
} as const

export function cardFleetCompletionYear(startYear: number, cycleYears: number): number {
  if (!Number.isFinite(startYear) || !Number.isFinite(cycleYears) || cycleYears < 0) {
    throw new Error('A fleet scenario needs a finite start year and non-negative cycle length')
  }
  return startYear + cycleYears
}

export const CARD_FLEET_COMPLETION_YEARS = CARD_REPLACEMENT_SCENARIO.cycleYears.map((years) =>
  cardFleetCompletionYear(CARD_REPLACEMENT_SCENARIO.startYear, years)
)

export const CARD_REPLACEMENT_WORKED_EXAMPLE =
  `Fictional start: ${CARD_REPLACEMENT_SCENARIO.startYear}. ` +
  `Assumed card cycle: ${CARD_REPLACEMENT_SCENARIO.cycleYears[0]}–${CARD_REPLACEMENT_SCENARIO.cycleYears[1]} years. ` +
  `${CARD_REPLACEMENT_SCENARIO.startYear} + ${CARD_REPLACEMENT_SCENARIO.cycleYears[0]}–${CARD_REPLACEMENT_SCENARIO.cycleYears[1]} = ${CARD_FLEET_COMPLETION_YEARS[0]}–${CARD_FLEET_COMPLETION_YEARS[1]} for fleet replacement. ` +
  'HSM support, key injection, personalization and terminal prerequisites must be coordinated separately; this calculation does not set an end-to-end migration minimum.'
