// SPDX-License-Identifier: GPL-3.0-only
/**
 * D4 — write the synthetic SP 800-90B datasets and their manifest.
 *
 *   npx tsx scripts/entropy-90b/gen-synthetic-datasets.ts <outDir> [--manifest <path>]
 *
 * Writes <outDir>/<id>.bin for every entry of D4_DATASETS plus the KAT fixture,
 * and a manifest (default: public/data/entropy/d4-synthetic-manifest.json)
 * recording generator, seed, parameters, size and SHA-256 of each file.
 *
 * The .bin files are NOT committed: the generator is deterministic, the
 * manifest pins each SHA-256, and src/wasm/entropy90b/syntheticDatasets
 * .local.test.ts regenerates and re-checks every hash.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  D4_BASE_SEED,
  D4_DATASETS,
  KAT_FIXTURE,
  KAT_IID_FIXTURE,
} from '../../src/wasm/entropy90b/syntheticDatasets.ts'

const args = process.argv.slice(2)
const outDir = args[0]
if (!outDir) {
  console.error('usage: gen-synthetic-datasets.ts <outDir> [--manifest <path>]')
  process.exit(2)
}
const mIdx = args.indexOf('--manifest')
const manifestPath = mIdx >= 0 ? args[mIdx + 1] : 'public/data/entropy/d4-synthetic-manifest.json'

mkdirSync(outDir, { recursive: true })
const sha = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex')

const entries = D4_DATASETS.map((d) => {
  const bytes = d.build()
  writeFileSync(join(outDir, `${d.id}.bin`), bytes)
  const { build: _build, ...spec } = d
  void _build
  return { ...spec, file: `${d.id}.bin`, bytes: bytes.length, sha256: sha(bytes) }
})

const kat = KAT_FIXTURE.build()
writeFileSync(join(outDir, `${KAT_FIXTURE.id}.bin`), kat)
const katIid = KAT_IID_FIXTURE.build()
writeFileSync(join(outDir, `${KAT_IID_FIXTURE.id}.bin`), katIid)

const manifest = {
  schema: 'pqctoday.entropy.synthetic-datasets/1',
  label: 'SYNTHETIC — generated data, not a measurement of any device or noise source',
  generator: 'src/wasm/entropy90b/syntheticDatasets.ts',
  prng: 'xoshiro128** seeded by splitmix32 (32-bit integer ops; byte-identical in Node and browsers)',
  baseSeed: `0x${(D4_BASE_SEED >>> 0).toString(16)}`,
  sampleFormat:
    'one sample per byte, value in the least-significant bitsPerSymbol bits (NIST SP800-90B_EntropyAssessment input format); restart matrices are 1000 rows (restarts) x 1000 samples, row-major',
  datasets: entries,
  katFixture: {
    id: KAT_FIXTURE.id,
    bitsPerSymbol: KAT_FIXTURE.bitsPerSymbol,
    bytes: kat.length,
    sha256: sha(kat),
    note: 'Small unit-test fixture (20,000 samples) — below the SP 800-90B minimum on purpose; used only for the WASM-vs-native KAT.',
  },
  katIidFixture: {
    id: KAT_IID_FIXTURE.id,
    bitsPerSymbol: KAT_IID_FIXTURE.bitsPerSymbol,
    bytes: katIid.length,
    sha256: sha(katIid),
    note: 'Small IID unit-test fixture (20,000 biased independent bits) for the seeded ea_iid KAT.',
  },
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
for (const e of entries) console.log(`${e.id.padEnd(36)} ${e.bytes} ${e.sha256}`)
console.log(`${KAT_FIXTURE.id.padEnd(36)} ${kat.length} ${manifest.katFixture.sha256}`)
console.log(`${KAT_IID_FIXTURE.id.padEnd(36)} ${katIid.length} ${manifest.katIidFixture.sha256}`)
console.log(`manifest -> ${manifestPath}`)
