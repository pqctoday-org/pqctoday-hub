// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Repeatable runtime asset preparation (`npm run prepare:runtime-assets`).
 *
 * Shared by `predev` and `build` so dev and production builds prepare
 * identical `public/dist` (liboqs-js) and `public/wasm` (SoftHSM pair) layouts:
 *
 * 1. Validates and reads both SoftHSM inputs (`softhsm.js`, `softhsm.wasm`)
 *    before modifying either destination file — an unreadable input fails with
 *    the asset path intact and leaves any existing working pair untouched.
 * 2. Repairs missing or digest-mismatched members of the SoftHSM pair while
 *    preserving all unrelated files under `public/wasm`.
 * 3. Stages and swaps `public/dist` cleanly from `@oqs/liboqs-js/dist` so
 *    repeated invocations never nest `public/dist/dist` or leave stale files.
 */
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..', '..')

export interface PrepareOptions {
  liboqsSourceDir: string
  liboqsDestDir: string
  softhsmSourceDir: string
  wasmDestDir: string
}

export interface PrepareResult {
  softhsmUpdated: boolean
  softhsmDigests: Record<'softhsm.js' | 'softhsm.wasm', string>
  liboqsFileCount: number
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

function readRequiredAsset(filePath: string): Buffer {
  try {
    return readFileSync(filePath)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`Unable to read required runtime asset "${filePath}": ${reason}`)
  }
}

function countFilesRecursive(dir: string): number {
  let count = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) count += countFilesRecursive(full)
    else if (entry.isFile()) count += 1
  }
  return count
}

export function prepareRuntimeAssets(options: PrepareOptions): PrepareResult {
  const { liboqsSourceDir, liboqsDestDir, softhsmSourceDir, wasmDestDir } = options

  // 1. Validate & read ALL required inputs before touching any output.
  if (!existsSync(liboqsSourceDir) || !statSync(liboqsSourceDir).isDirectory()) {
    throw new Error(
      `Unable to read required runtime asset directory "${liboqsSourceDir}": directory missing`
    )
  }
  const jsSrcPath = path.join(softhsmSourceDir, 'softhsm.js')
  const wasmSrcPath = path.join(softhsmSourceDir, 'softhsm.wasm')
  const jsBytes = readRequiredAsset(jsSrcPath)
  const wasmBytes = readRequiredAsset(wasmSrcPath)
  const expectedJsHash = sha256(jsBytes)
  const expectedWasmHash = sha256(wasmBytes)

  // 2. Stage & atomically swap the liboqs tree to a deterministic layout.
  const liboqsParent = path.dirname(liboqsDestDir)
  mkdirSync(liboqsParent, { recursive: true })
  const stagedLiboqs = mkdtempSync(path.join(liboqsParent, '.liboqs-stage-'))
  try {
    cpSync(liboqsSourceDir, stagedLiboqs, { recursive: true })
    if (existsSync(liboqsDestDir)) {
      rmSync(liboqsDestDir, { recursive: true, force: true })
    }
    renameSync(stagedLiboqs, liboqsDestDir)
  } catch (err) {
    rmSync(stagedLiboqs, { recursive: true, force: true })
    throw err
  }

  // 3. Verify or repair the SoftHSM pair while preserving unrelated files in wasmDestDir.
  mkdirSync(wasmDestDir, { recursive: true })
  const jsDestPath = path.join(wasmDestDir, 'softhsm.js')
  const wasmDestPath = path.join(wasmDestDir, 'softhsm.wasm')

  const jsMatches = existsSync(jsDestPath) && sha256(readFileSync(jsDestPath)) === expectedJsHash
  const wasmMatches =
    existsSync(wasmDestPath) && sha256(readFileSync(wasmDestPath)) === expectedWasmHash

  let softhsmUpdated = false
  if (!jsMatches || !wasmMatches) {
    const jsStage = `${jsDestPath}.tmp-${process.pid}`
    const wasmStage = `${wasmDestPath}.tmp-${process.pid}`
    try {
      writeFileSync(jsStage, jsBytes)
      writeFileSync(wasmStage, wasmBytes)
      renameSync(jsStage, jsDestPath)
      renameSync(wasmStage, wasmDestPath)
      softhsmUpdated = true
    } catch (err) {
      rmSync(jsStage, { force: true })
      rmSync(wasmStage, { force: true })
      throw err
    }
  }

  return {
    softhsmUpdated,
    softhsmDigests: {
      'softhsm.js': expectedJsHash,
      'softhsm.wasm': expectedWasmHash,
    },
    liboqsFileCount: countFilesRecursive(liboqsDestDir),
  }
}

export function defaultPrepareOptions(rootDir: string = ROOT): PrepareOptions {
  return {
    liboqsSourceDir: path.join(rootDir, 'node_modules/@oqs/liboqs-js/dist'),
    liboqsDestDir: path.join(rootDir, 'public/dist'),
    softhsmSourceDir: path.join(rootDir, 'node_modules/@pqctoday/softhsm-wasm/wasm'),
    wasmDestDir: path.join(rootDir, 'public/wasm'),
  }
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.dirname, 'prepare-runtime-assets.ts')

if (invokedDirectly) {
  const result = prepareRuntimeAssets(defaultPrepareOptions())
  process.stdout.write(
    `[prepare:runtime-assets] liboqs=${result.liboqsFileCount} files, softhsm=${result.softhsmUpdated ? 'updated' : 'up-to-date'}\n`
  )
}
