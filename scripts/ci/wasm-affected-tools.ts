#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * wasm-affected-tools.ts
 *
 * Takes a WASM package name as first argument (e.g. "@oqs/liboqs-js").
 * Reads workshopRegistry.tsx, finds tools whose algorithms array contains
 * any algorithm provided by that package.
 * Outputs JSON array of { tool_id, pt_id } to stdout.
 *
 * Usage:
 *   npx tsx scripts/ci/wasm-affected-tools.ts "@oqs/liboqs-js"
 *   npx tsx scripts/ci/wasm-affected-tools.ts "@pqctoday/softhsm-wasm"
 */

import fs from 'fs'
import path from 'path'

const PACKAGE_ALGORITHMS: Record<string, string[]> = {
  '@oqs/liboqs-js': [
    'ML-KEM',
    'ML-DSA',
    'SLH-DSA',
    'Falcon',
    'HQC',
    'FrodoKEM',
    'Classic McEliece',
  ],
  '@pqctoday/softhsm-wasm': ['PKCS#11', 'HSM'],
}

interface ToolEntry {
  tool_id: string
  pt_id: string
  algorithms: string[]
}

/** Parse tool entries from workshopRegistry.tsx source */
function parseTools(src: string): ToolEntry[] {
  const tools: ToolEntry[] = []
  const toolBlockRe = /\{[^{}]*?id:\s*['"][^'"]+['"][^{}]*?\}/gs
  let m: RegExpExecArray | null
  while ((m = toolBlockRe.exec(src)) !== null) {
    const block = m[0]
    const idM = /\bid:\s*['"]([^'"]+)['"]/.exec(block)
    const ptM = /pt_id:\s*['"]([^'"]+)['"]/.exec(block)
    const algoM = /algorithms:\s*\[([^\]]*)\]/.exec(block)
    if (idM && ptM) {
      const algos: string[] = []
      if (algoM) {
        const algoStr = algoM[1]
        const algoMatches = algoStr.matchAll(/['"]([^'"]+)['"]/g)
        for (const am of algoMatches) algos.push(am[1])
      }
      tools.push({ tool_id: idM[1], pt_id: ptM[1], algorithms: algos })
    }
  }
  return tools
}

// ── Main ─────────────────────────────────────────────────────────────────────

const packageName = process.argv[2]

if (!packageName) {
  console.error('Usage: wasm-affected-tools.ts <package-name>')
  console.error('  e.g.: wasm-affected-tools.ts "@oqs/liboqs-js"')
  process.exit(1)
}

const packageAlgos = PACKAGE_ALGORITHMS[packageName]

if (!packageAlgos) {
  console.error(`Unknown package: ${packageName}`)
  console.error(`Known packages: ${Object.keys(PACKAGE_ALGORITHMS).join(', ')}`)
  process.exit(1)
}

const registryPath = path.resolve(
  process.cwd(),
  'src/components/Playground/workshopRegistry.tsx'
)

if (!fs.existsSync(registryPath)) {
  console.error(`workshopRegistry.tsx not found at ${registryPath}`)
  process.exit(1)
}

const src = fs.readFileSync(registryPath, 'utf-8')
const allTools = parseTools(src)

const affected = allTools
  .filter((tool) =>
    tool.algorithms.some((algo) =>
      packageAlgos.some(
        (pkgAlgo) =>
          algo.toLowerCase().includes(pkgAlgo.toLowerCase()) ||
          pkgAlgo.toLowerCase().includes(algo.toLowerCase())
      )
    )
  )
  .map(({ tool_id, pt_id }) => ({ tool_id, pt_id }))

console.log(JSON.stringify(affected, null, 2))
