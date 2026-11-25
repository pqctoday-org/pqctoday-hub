// SPDX-License-Identifier: AGPL-3.0-only
/**
 * gen-algorithm-properties - derive src/data/algorithmProperties.ts (the registry of key sizes,
 * security levels and FIPS labels that Learn modules import) from the newest algorithm
 * reference CSV (src/data/pqc_complete_algorithm_reference_*.csv, newest date then revision).
 *
 *   node scripts/ci/gen-algorithm-properties.mjs           # (re)generate
 *   node scripts/ci/gen-algorithm-properties.mjs --check   # exit 1 if the committed file is stale
 *
 * A row is in the registry when its `registry_order` cell is set. The registry lists rows by
 * that number, with a comment heading wherever `registry_group` changes. Sizes and the security
 * level come from the row's own columns; `registry_family` and `registry_fips` hold the
 * registry's label for the row (a short standard label, or blank for none), because the CSV's
 * `algorithm_family` and `fips_standard` cells are longer, review-oriented text.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import prettier from 'prettier'

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data')
const OUT = join(DATA, 'algorithmProperties.ts')

function latestCsv() {
  const re = /^pqc_complete_algorithm_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  let best = null
  for (const f of readdirSync(DATA)) {
    const m = f.match(re)
    if (!m) continue
    const key = `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(3, '0')}`
    if (!best || key > best.key) best = { key, file: f }
  }
  if (!best) throw new Error('no pqc_complete_algorithm_reference_*.csv found')
  return best.file
}

// Emit an object key the way Prettier would (quoteProps: as-needed + singleQuote).
const propKey = (s) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s) ? s : str(s))
const str = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** Integer cell, or null when blank or "N/A". */
function intCell(raw) {
  const s = (raw ?? '').trim()
  if (s === '' || s.toUpperCase() === 'N/A') return null
  const n = Number(s)
  if (!Number.isFinite(n)) throw new Error(`not a number: ${JSON.stringify(raw)}`)
  return Math.round(n)
}

function derive() {
  const file = latestCsv()
  const { data } = Papa.parse(readFileSync(join(DATA, file), 'utf8'), {
    header: true,
    skipEmptyLines: true,
  })
  const picked = data
    .filter((r) => (r.registry_order ?? '').trim() !== '')
    .map((r) => ({ ...r, order: Number(r.registry_order) }))
  const seen = new Set()
  for (const r of picked) {
    if (!Number.isInteger(r.order))
      throw new Error(`${r.algorithm}: registry_order is not an integer`)
    if (seen.has(r.order)) throw new Error(`registry_order ${r.order} is used twice`)
    seen.add(r.order)
    if (!(r.registry_group ?? '').trim()) throw new Error(`${r.algorithm}: registry_group is blank`)
    if (!(r.registry_family ?? '').trim())
      throw new Error(`${r.algorithm}: registry_family is blank`)
  }
  if (picked.length === 0) throw new Error(`${file} has no row with a registry_order`)
  picked.sort((a, b) => a.order - b.order)
  return { file, picked }
}

function entry(r) {
  const family = r.registry_family.trim()
  const pub = intCell(r.public_key_bytes)
  const priv = intCell(r.private_key_bytes)
  const sig = intCell(r.signature_ciphertext_bytes) ?? 0
  const shared = intCell(r.shared_secret_bytes)
  const level = intCell(r.nist_security_level)
  const fips = (r.registry_fips ?? '').trim()
  if (pub === null || priv === null) throw new Error(`${r.algorithm}: key sizes are blank`)
  const lines = [
    `    name: ${str(r.algorithm)},`,
    `    family: ${str(family)},`,
    `    publicKeyBytes: ${pub},`,
    `    privateKeyBytes: ${priv},`,
  ]
  // A classical key-agreement row lists its shared secret before the (zero) ciphertext size.
  const sigLine = `    signatureOrCiphertextBytes: ${sig},`
  const sharedLine = shared === null ? null : `    sharedSecretBytes: ${shared},`
  lines.push(
    ...(family === 'Classical KEM' ? [sharedLine, sigLine] : [sigLine, sharedLine]).filter(Boolean)
  )
  lines.push(`    securityLevel: ${level === null ? 'null' : level},`)
  lines.push(`    fipsStandard: ${fips ? str(fips) : 'null'},`)
  return `  ${propKey(r.algorithm)}: {\n${lines.join('\n')}\n  },`
}

const IFACE = `export interface AlgorithmProps {
  /** Canonical algorithm name (e.g., 'ML-KEM-768') */
  name: string
  /** Algorithm family from CSV (e.g., 'KEM', 'Signature', 'Classical KEM') */
  family: string
  /** Public key size in bytes */
  publicKeyBytes: number
  /** Private key size in bytes */
  privateKeyBytes: number
  /** Signature or ciphertext size in bytes */
  signatureOrCiphertextBytes: number
  /** Shared secret size in bytes (KEM algorithms only) */
  sharedSecretBytes?: number
  /** NIST security level (1, 2, 3, or 5) */
  securityLevel: number | null
  /** FIPS standard reference (e.g., 'FIPS 203') or null */
  fipsStandard: string | null
}

`

const TAIL = `// ── Lookup function ──────────────────────────────────────────────────────

/**
 * Look up algorithm properties by canonical name.
 * Throws if the algorithm is not in the registry — this is intentional:
 * a build-time error is better than a silent wrong value.
 */
export function getAlgorithm(name: string): AlgorithmProps {
  const algo = ALGORITHM_REGISTRY[name]
  if (!algo) {
    throw new Error(
      \`[algorithmProperties] Unknown algorithm: "\${name}". \` +
        'Give its row in the algorithm CSV a registry_order, then run npm run gen:algorithm-properties.'
    )
  }
  return algo
}

/** Get all algorithms matching a family (e.g., 'KEM', 'Signature') */
export function getAlgorithmsByFamily(family: string): AlgorithmProps[] {
  return Object.values(ALGORITHM_REGISTRY).filter((a) => a.family === family)
}

/** Get all algorithms for a FIPS standard (e.g., 'FIPS 203') */
export function getAlgorithmsByFips(fips: string): AlgorithmProps[] {
  return Object.values(ALGORITHM_REGISTRY).filter((a) => a.fipsStandard === fips)
}
`

function generate({ picked }) {
  const blocks = []
  let group = null
  for (const r of picked) {
    const g = r.registry_group.trim()
    if (g !== group) {
      if (group !== null) blocks.push('')
      blocks.push(`  // ── ${g} ${'─'.repeat(Math.max(3, 71 - g.length - 5))}`)
      group = g
    }
    blocks.push(entry(r))
  }
  return `// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Authoritative algorithm properties registry.
 *
 * Single source of truth for key sizes, security levels, and FIPS mappings.
 * All learn modules and workshop components should import from here instead
 * of hardcoding algorithm parameters.
 *
 * AUTO-GENERATED — do not edit by hand.
 *
 * Data sourced from the newest src/data/pqc_complete_algorithm_reference_*.csv:
 * the rows that carry a registry_order, in that order. To update: cut a NEW dated
 * snapshot of the CSV (never edit a dated CSV in place), then regenerate:
 *   npm run gen:algorithm-properties
 * Verify freshness (exits 1 when this file is stale):
 *   npm run gen:algorithm-properties:check
 */

${IFACE}
// ── Registry (generated from the newest algorithm reference CSV) ─────────

export const ALGORITHM_REGISTRY: Record<string, AlgorithmProps> = {
${blocks.join('\n')}
}

${TAIL}`
}

async function main() {
  const check = process.argv.includes('--check')
  const { file, picked } = derive()
  const config = (await prettier.resolveConfig(OUT)) ?? {}
  const next = await prettier.format(generate({ file, picked }), { ...config, filepath: OUT })
  if (check) {
    const current = readFileSync(OUT, 'utf8')
    if (current !== next) {
      console.error(
        `src/data/algorithmProperties.ts is stale against ${file}. Run: npm run gen:algorithm-properties`
      )
      process.exit(1)
    }
    console.log(`algorithmProperties.ts is current (${picked.length} algorithms from ${file})`)
    return
  }
  writeFileSync(OUT, next)
  console.log(`Wrote src/data/algorithmProperties.ts (${picked.length} algorithms from ${file})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
