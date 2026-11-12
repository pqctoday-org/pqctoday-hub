// SPDX-License-Identifier: AGPL-3.0-only
import type { ComplianceRecord } from './types'

/** Recover only explicitly labelled parameters within this capability row.
 * Keep names verbatim: neither an algorithm family nor a neighbouring operation
 * establishes which parameter sets the captured source lists for this row.
 */
export function resolveCavpParameterSets(capability: {
  parameterSets?: readonly string[]
  details?: readonly string[]
}): string[] {
  const structured = Array.isArray(capability.parameterSets) ? capability.parameterSets : []
  if (structured.length) return [...structured]
  const details = Array.isArray(capability.details) ? capability.details : []
  const values = details.flatMap((line) => {
    if (typeof line !== 'string') return []
    const match = line.trim().match(/^(?:Capabilities:\s*)?Parameter Sets:\s*(.*)$/i)
    return match
      ? match[1]
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : []
  })
  return [...new Set(values)]
}

/** Fill a parsing gap without changing the publication, source details,
 * operation, environment, or existing structured values. Both display shells
 * consume this load path, so they receive the same captured parameters.
 */
export function normalizeCavpParameterSets(record: ComplianceRecord): ComplianceRecord {
  if (
    record?.type !== 'ACVP' ||
    !Array.isArray(record.cavpCapabilities) ||
    !record.cavpCapabilities.length
  )
    return record
  let changed = false
  const capabilities = record.cavpCapabilities.map((capability) => {
    if (!capability || typeof capability !== 'object' || capability.parameterSets?.length)
      return capability
    const parameterSets = resolveCavpParameterSets(capability)
    if (parameterSets.length === 0) return capability
    changed = true
    return { ...capability, parameterSets }
  })
  return changed ? { ...record, cavpCapabilities: capabilities } : record
}
