// SPDX-License-Identifier: GPL-3.0-only
import type { ImplementationAttack, AttackPresence } from '../types/ImplementationAttacks'

interface RawAttackRow {
  Algorithm: string
  SideChannelAttacks: string
  FaultInjectionAttacks: string
  RNGFailures: string
  SecretHandlingFailures: string
  APIMisuse: string
  date_stamp: string
  iacr_reference: string
  mitigation_notes: string
}

function parsePresence(v: string): AttackPresence {
  const s = v?.trim()
  if (s === 'Yes') return 'Yes'
  if (s === 'No') return 'No'
  if (s === 'Partial') return 'Partial'
  return 'Unknown'
}

function parseCSV(raw: string): RawAttackRow[] {
  const lines = raw.trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0])
  const rows: RawAttackRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const fields = parseCSVLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      // eslint-disable-next-line security/detect-object-injection
      obj[h] = fields[idx] ?? ''
    })
    rows.push(obj as unknown as RawAttackRow)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function transformRow(row: RawAttackRow): ImplementationAttack {
  return {
    algorithm: row.Algorithm?.trim() ?? '',
    sideChannelAttacks: parsePresence(row.SideChannelAttacks),
    faultInjectionAttacks: parsePresence(row.FaultInjectionAttacks),
    rngFailures: parsePresence(row.RNGFailures),
    secretHandlingFailures: parsePresence(row.SecretHandlingFailures),
    apiMisuse: parsePresence(row.APIMisuse),
    dateStamp: row.date_stamp?.trim() ?? '',
    iacrReference: row.iacr_reference?.trim() ?? '',
    mitigationNotes: row.mitigation_notes?.trim() ?? '',
  }
}

// PQC algorithms attack table (dated)
const pqcModules = import.meta.glob('./pqc_implementation_attacks_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// All-algorithms attack table (undated overwrite — includes classical)
const allModules = import.meta.glob('./algorithms_implementation_attacks_table*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function loadLatest(modules: Record<string, unknown>): ImplementationAttack[] {
  const entries = Object.entries(modules)
  if (entries.length === 0) return []
  // Pick the entry with the lexicographically largest filename (latest date)
  entries.sort(([a], [b]) => b.localeCompare(a))
  const raw = entries[0][1] as string
  return parseCSV(raw)
    .map(transformRow)
    .filter((r) => r.algorithm)
}

const pqcAttacks = loadLatest(pqcModules)
const allAttacks = loadLatest(allModules)

// Merge: keyed by algorithm name; allAttacks entries fill in gaps not in pqcAttacks
const merged = new Map<string, ImplementationAttack>()
for (const item of allAttacks) merged.set(item.algorithm, item)
for (const item of pqcAttacks) merged.set(item.algorithm, item)

/** All implementation attack entries, deduped by algorithm name. */
export const implementationAttacksData: ImplementationAttack[] = Array.from(merged.values())

/** Look up a single algorithm by exact name. */
export function getAttackProfile(algorithm: string): ImplementationAttack | undefined {
  return merged.get(algorithm)
}
