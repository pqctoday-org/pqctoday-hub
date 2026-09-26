/**
 * generate-mechanism-inventory.ts — WS-G G-1/G-2 generator.
 *
 * Loads BOTH shipped PKCS#11 WASM engines in Node, captures what each one
 * advertises (C_GetMechanismList + C_GetMechanismInfo) through
 * src/wasm/softhsm/mechanismInventory.ts, and writes
 * src/data/validation/mechanism-inventory.generated.json: per engine, the
 * artifact hashes, the pqctoday-hsm commit recorded for the build, the
 * inventory hash, and every mechanism with its flags decoded and the
 * operation probes those flags require.
 *
 *   npm run gen:mechanism-inventory          # write
 *   npm run gen:mechanism-inventory:check    # exit 1 if the committed file is stale
 *
 * Engine loading reuses the paths the hub already relies on — no new loader:
 *  - Rust: getSoftHSMRustModule() from src/wasm/softhsm.ts, unchanged. It
 *    imports the wasm-bindgen "bundler" shim, whose `import * as wasm from
 *    "./softhsmrustv3_bg.wasm"` needs Node's --experimental-wasm-modules (the
 *    npm scripts set it; this script refuses to run without it).
 *  - C++: the Emscripten glue from the vendored @pqctoday/softhsm-wasm package
 *    with a filesystem locateFile — the same loader
 *    src/wasm/softhsm/mechanismNames.local.test.ts uses (getSoftHSMCppModule
 *    is browser-only: it injects a <script> tag).
 *
 * Output is deterministic (no timestamps) so --check can compare bytes.
 * Plan: pqctoday-priv/nextfeature/acvp-validation-remediation-plan-09242026.md §5 WS-G.
 */
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  captureMechanismInventory,
  diffInventories,
  MECHANISM_INVENTORY_SCHEMA,
  type EngineId,
  type EngineIdentity,
  type GeneratedEngineInventory,
  type GeneratedMechanismInventoryFile,
} from '../src/wasm/softhsm/mechanismInventory'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const INVENTORY_OUT = join(ROOT, 'src/data/validation/mechanism-inventory.generated.json')
const PROVENANCE = join(ROOT, 'public/wasm/wasm-provenance.json')
const CHECK = process.argv.includes('--check')

/**
 * Every shipped copy of each engine. The FIRST wasm entry is the file the
 * browser build actually serves/bundles; all copies must be byte-identical or
 * the engine's identity is ambiguous and generation fails.
 */
const ENGINE_FILES: Record<EngineId, { provenanceBundle: string; groups: string[][] }> = {
  cpp: {
    provenanceBundle: 'softhsm-cpp-engine',
    groups: [
      [
        'public/wasm/softhsm.wasm',
        'public/wasm/libsofthsmv3.wasm',
        'src/vendor/softhsm-wasm/wasm/softhsm.wasm',
      ],
      ['public/wasm/softhsm.js', 'src/vendor/softhsm-wasm/wasm/softhsm.js'],
    ],
  },
  rust: {
    provenanceBundle: 'softhsmrustv3-engine',
    groups: [
      [
        'src/wasm/softhsmrustv3_bg.wasm',
        'public/wasm/rust/softhsmrustv3_bg.wasm',
        'src/vendor/softhsm-wasm/wasm/softhsmrustv3_bg.wasm',
      ],
      [
        'src/wasm/softhsmrustv3_bg.js',
        'public/wasm/rust/softhsmrustv3_bg.js',
        'src/vendor/softhsm-wasm/wasm/softhsmrustv3_bg.js',
      ],
    ],
  },
}

const sha256File = (rel: string): string =>
  createHash('sha256')
    .update(readFileSync(join(ROOT, rel)))
    .digest('hex')

const engineIdentity = (engine: EngineId): EngineIdentity => {
  const spec = ENGINE_FILES[engine]
  const artifacts = spec.groups.map((group) => {
    const hashes = group.map((rel) => ({ rel, sha: sha256File(rel) }))
    const distinct = new Set(hashes.map((h) => h.sha))
    if (distinct.size !== 1) {
      throw new Error(
        `${engine}: shipped copies differ — engine identity is ambiguous:\n` +
          hashes.map((h) => `  ${h.sha}  ${h.rel}`).join('\n')
      )
    }
    return { path: group[0], sha256: hashes[0].sha }
  })
  const provenance = JSON.parse(readFileSync(PROVENANCE, 'utf8')) as {
    hsmRepo?: string
    bundles: { name: string; hsmCommit: string | null; builtAt: string | null }[]
  }
  const bundle = provenance.bundles.find((b) => b.name === spec.provenanceBundle)
  if (!bundle) throw new Error(`wasm-provenance.json has no bundle "${spec.provenanceBundle}"`)
  return {
    engine,
    artifacts,
    sourceCommit: bundle.hsmCommit,
    sourceRepo: provenance.hsmRepo ?? null,
    builtAt: bundle.builtAt,
    sourceCommitProvenance: 'public/wasm/wasm-provenance.json',
  }
}

const loadRust = async (): Promise<SoftHSMModule> => {
  const { getSoftHSMRustModule } = await import('../src/wasm/softhsm')
  return getSoftHSMRustModule()
}

const loadCpp = async (): Promise<SoftHSMModule> => {
  const require_ = createRequire(import.meta.url)
  // ROOT-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'): that
  // `file:` package resolves through node_modules, and in a worktree whose
  // node_modules is itself symlinked to a SIBLING worktree (a real, supported
  // setup), a relative symlink one level inside that shared node_modules
  // resolves relative to where IT lives, silently landing on the sibling
  // worktree's src/vendor/softhsm-wasm instead of this one's — probing the
  // wrong C++ binary with no error (found 2026-09-25, P3 combined rebuild).
  const gluePath = join(ROOT, 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = join(dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

/** Loaded-file paths recorded next to the capture (repo-relative). */
const LOADED_FROM: Record<EngineId, string> = {
  cpp: 'src/vendor/softhsm-wasm/wasm/softhsm.js + softhsm.wasm (Emscripten glue, Node)',
  rust: 'src/wasm/softhsmrustv3.js via getSoftHSMRustModule() (Node --experimental-wasm-modules)',
}

const captureEngine = async (engine: EngineId): Promise<GeneratedEngineInventory> => {
  const { hsm_initialize, hsm_getFirstSlot } = await import('../src/wasm/softhsm')
  const M = engine === 'cpp' ? await loadCpp() : await loadRust()
  hsm_initialize(M)
  try {
    // Mechanism discovery needs only a slot ID — no token init or login (the
    // same precondition HsmMechanismPanel and mechanismNames.local.test.ts use).
    const slotId = hsm_getFirstSlot(M)
    const inventory = await captureMechanismInventory(M, slotId)
    return {
      identity: engineIdentity(engine),
      capture: {
        method: `C_Initialize → C_GetSlotList → C_GetMechanismList + C_GetMechanismInfo; loaded from ${LOADED_FROM[engine]}`,
        slotId,
      },
      inventory,
    }
  } finally {
    M._C_Finalize(0)
  }
}

export const buildInventoryFile = async (): Promise<GeneratedMechanismInventoryFile> => {
  const cpp = await captureEngine('cpp')
  const rust = await captureEngine('rust')
  return {
    _comment:
      'GENERATED by scripts/generate-mechanism-inventory.ts — do not edit. What each shipped PKCS#11 WASM engine ADVERTISES (rung 1 of the claim ladder), not what it passes. inventorySha256 = SHA-256 of the canonical JSON of the engine-reported fields only (type, infoRv, ulMinKeySize, ulMaxKeySize, flags). requiredOperations = the operation probes the advertised flags make required (WS-G G-2); no probe is implied to exist or pass. sourceCommit is copied from public/wasm/wasm-provenance.json, not verified against the binary. crossEngine lists advertisement-level disagreements between the two engines (findings, not verdicts).',
    schema: MECHANISM_INVENTORY_SCHEMA,
    generator: 'scripts/generate-mechanism-inventory.ts',
    engines: { cpp, rust },
    crossEngine: diffInventories(cpp.inventory, rust.inventory),
  }
}

export const formatJson = async (value: unknown, filepath: string): Promise<string> => {
  const config = await resolveConfig(filepath)
  return format(JSON.stringify(value, null, 2), { ...config, filepath, parser: 'json' })
}

const main = async (): Promise<void> => {
  const wasmModulesOn =
    process.execArgv.some((a) => a.includes('experimental-wasm-modules')) ||
    (process.env.NODE_OPTIONS ?? '').includes('experimental-wasm-modules')
  if (!wasmModulesOn) {
    console.error(
      'generate-mechanism-inventory: the Rust engine is a wasm-bindgen bundler build and needs\n' +
        '  NODE_OPTIONS=--experimental-wasm-modules. Run via `npm run gen:mechanism-inventory`.'
    )
    process.exit(2)
  }
  const file = await buildInventoryFile()
  const formatted = await formatJson(file, INVENTORY_OUT)
  const rel = relative(ROOT, INVENTORY_OUT)
  if (CHECK) {
    const onDisk = existsSync(INVENTORY_OUT) ? readFileSync(INVENTORY_OUT, 'utf8') : null
    if (onDisk === formatted) {
      for (const e of ['cpp', 'rust'] as const) {
        const inv = file.engines[e].inventory
        console.log(`✓ ${e}: ${inv.mechanismCount} mechanisms, inventory ${inv.inventorySha256}`)
      }
      console.log(`✓ ${rel} matches the shipped engines`)
      return
    }
    console.error(
      `✗ ${rel} is ${onDisk === null ? 'missing' : 'STALE'} — the shipped engines advertise a ` +
        `different inventory (or artifact hashes changed).\n  Run: npm run gen:mechanism-inventory`
    )
    process.exit(1)
  }
  mkdirSync(dirname(INVENTORY_OUT), { recursive: true })
  writeFileSync(INVENTORY_OUT, formatted)
  for (const e of ['cpp', 'rust'] as const) {
    const inv = file.engines[e].inventory
    console.log(`${e}: ${inv.mechanismCount} mechanisms, inventory ${inv.inventorySha256}`)
  }
  console.log(`Wrote ${rel}`)
}

// Only run when executed directly (the dispatch analyzer imports helpers).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : e)
    process.exit(1)
  })
}
