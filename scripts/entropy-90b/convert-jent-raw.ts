// SPDX-License-Identifier: GPL-3.0-only
/**
 * Convert the D2/D3 device datasets (pqctoday-priv/local-evidence-cache/
 * entropy/<date>/) into NIST SP800-90B tool input for the W1 parity run.
 *
 *   npx tsx scripts/entropy-90b/convert-jent-raw.ts <evidenceDir> <outDir>
 *
 * - Raw jitterentropy recordings (*.data: one unsigned 64-bit time delta per
 *   line, ASCII decimal) are reduced exactly like upstream jitterentropy's
 *   default analysis step `extractlsb` with MASK_LIST="FF:8": keep the 8
 *   least-significant bits, one byte per sample (alphabet <= 256, SP 800-90B
 *   §3.1.3 / §6.4). The mask choice belongs to the analyst; FF:8 is only
 *   upstream's default and is recorded in each sidecar.
 * - Contrast datasets (*.bin, conditioned/DRBG output) are already bytes and
 *   are copied as 8-bit samples.
 *
 * Never writes into the evidence directory. Writes <outDir>/<id>.bin plus a
 * <id>.json sidecar {bitsPerSymbol, kind, pairedSequentialId?, source, ...}
 * that scripts/entropy-90b/parity.ts --real reads.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

const [src, out] = process.argv.slice(2)
if (!src || !out) {
  console.error('usage: convert-jent-raw.ts <evidenceDir> <outDir>')
  process.exit(2)
}
mkdirSync(out, { recursive: true })
const sha = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex')

function walk(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/** extractlsb FF:8 — low byte of each 64-bit decimal delta. */
function lsb8(text: string): Uint8Array {
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  const outB = new Uint8Array(lines.length)
  lines.forEach((l, i) => {
    // BigInt keeps full 64-bit precision; only the low 8 bits are kept.
    outB[i] = Number(BigInt(l.trim()) & 0xffn)
  })
  return outB
}

const files = walk(src).filter(
  (p) =>
    /(sequential-jent-raw-noise|restart-matrix)\.data$/.test(p) || /\/contrast\/.*\.bin$/.test(p)
)
for (const p of files.sort()) {
  const name = basename(p).replace(/\.(data|bin)$/, '')
  const raw = readFileSync(p)
  const isContrast = p.endsWith('.bin')
  const bytes = isContrast ? new Uint8Array(raw) : lsb8(raw.toString('utf8'))
  const kind = /restart-matrix$/.test(name) ? 'restart' : 'sequential'
  const meta = {
    bitsPerSymbol: 8,
    kind,
    pairedSequentialId:
      kind === 'restart'
        ? `real-${name.replace('restart-matrix', 'sequential-jent-raw-noise')}`
        : undefined,
    source: relative(src, p),
    sourceSha256: sha(raw),
    reduction: isContrast
      ? 'none (bytes used as 8-bit samples) — conditioned/DRBG output, NOT raw noise'
      : 'extractlsb FF:8 (low 8 bits of each 64-bit delta; upstream jitterentropy default)',
    samples: bytes.length,
    sha256: sha(bytes),
  }
  writeFileSync(join(out, `${name}.bin`), bytes)
  writeFileSync(join(out, `${name}.json`), JSON.stringify(meta, null, 2) + '\n')
  console.log(`${name.padEnd(56)} ${kind.padEnd(10)} ${bytes.length}`)
}
