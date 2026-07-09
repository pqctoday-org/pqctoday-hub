// SPDX-License-Identifier: GPL-3.0-only
/**
 * Derives a compact, structured summary from the same `CbomComponentInput[]`
 * data `buildCbomDocument()` consumes — so a saved CBOM can be rendered as
 * real numbers on /report without re-parsing the exported CycloneDX JSON or
 * re-running a builder's own extraction/matching logic. Pure aggregation, no
 * new detection rules, so these numbers can never drift from what the
 * exported CycloneDX document actually contains. See
 * cbom-cyclonedx17-registry-report-section-plan-07092026.md, Part 2.1.
 */
import { standardsFor, type CbomComponentInput } from './cycloneDx'

export interface CbomSummaryAlgorithm {
  /** Parameter set when known (e.g. "ML-KEM-768"), else the family name — the
   *  same label buildCbomDocument() uses as the crypto-asset's own name. */
  name: string
  family: string
  classical: boolean
  /** First registry citation for the family, if standardized — never fabricated. */
  standard?: string
  standardUrl?: string
}

export interface CbomReportSummary {
  mode: string
  generatedAt: number
  componentCount: number
  /** Components that expose at least one crypto-asset (PQC or classical). */
  componentsWithCrypto: number
  cryptoAssetCount: number
  quantumSafeCount: number
  quantumVulnerableCount: number
  /** Distinct algorithms (by parameter-set-or-family + classical/PQC), for
   *  rendering a citation list without walking the full CycloneDX JSON. */
  algorithms: CbomSummaryAlgorithm[]
  byType: Record<string, number>
}

/** Builds the persisted report summary for one CBOM save. */
export function summarizeCbom(inputs: CbomComponentInput[], mode: string): CbomReportSummary {
  let cryptoAssetCount = 0
  let quantumSafeCount = 0
  let quantumVulnerableCount = 0
  let componentsWithCrypto = 0
  const byType: Record<string, number> = {}
  const seen = new Set<string>()
  const algorithms: CbomSummaryAlgorithm[] = []

  for (const input of inputs) {
    byType[input.type] = (byType[input.type] ?? 0) + 1
    const algos = input.algorithms ?? []
    if (algos.length > 0) componentsWithCrypto++

    for (const algo of algos) {
      cryptoAssetCount++
      if (algo.classical) quantumVulnerableCount++
      else quantumSafeCount++

      const name = algo.parameterSet ?? algo.canonical
      const key = `${name}::${algo.classical ? 'classical' : 'pqc'}`
      if (seen.has(key)) continue
      seen.add(key)
      const [standard] = standardsFor(algo.canonical)
      algorithms.push({
        name,
        family: algo.canonical,
        classical: Boolean(algo.classical),
        standard: standard?.name,
        standardUrl: standard?.url,
      })
    }
  }

  return {
    mode,
    generatedAt: Date.now(),
    componentCount: inputs.length,
    componentsWithCrypto,
    cryptoAssetCount,
    quantumSafeCount,
    quantumVulnerableCount,
    algorithms,
    byType,
  }
}
