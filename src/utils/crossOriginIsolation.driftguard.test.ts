// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Only routes in COI_ROUTE_PREFIXES get the cross-origin-isolation reload. A
 * Learn module that starts embedding a SharedArrayBuffer component without
 * being listed would silently lose SharedArrayBuffer on a first visit — this
 * fails instead. It also fails if a SAB component is imported from anywhere
 * outside the known routes' code (decide where it belongs, then list it).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { routeNeedsCrossOriginIsolation } from './crossOriginIsolation'

const SRC = path.join(process.cwd(), 'src')

/** Import specifiers of code that needs SharedArrayBuffer. */
const SAB_IMPORT =
  /from\s+['"][^'"]*(hsm\/VpnSimulationPanel|hsm\/SshSimulationPanel|FiveG\/SuciFlow|\.\/SuciFlow|TpmPlayground|services\/python\/pyRuntime|wasm\/strongswan|wasm\/openssh-real)['"]|import\(\s*['"][^'"]*(hsm\/VpnSimulationPanel|hsm\/SshSimulationPanel|TpmPlayground|services\/python\/pyRuntime|wasm\/strongswan|wasm\/openssh-real)['"]/

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(full)
  }
  return out
}

describe('cross-origin isolation route list covers every SharedArrayBuffer consumer', () => {
  const importers = walk(SRC).filter((f) => SAB_IMPORT.test(fs.readFileSync(f, 'utf-8')))

  it('finds the known consumers (sanity: the scan is not vacuous)', () => {
    expect(importers.length).toBeGreaterThan(0)
  })

  it('every Learn module that imports one is on an isolation route', () => {
    const modulesDir = path.join(SRC, 'components/PKILearning/modules')
    for (const f of importers.filter((x) => x.startsWith(modulesDir))) {
      const dir = path.relative(modulesDir, f).split(path.sep)[0]
      const manifest = fs.readFileSync(path.join(modulesDir, dir, 'manifest.ts'), 'utf-8')
      const id = /\bid:\s*'([^']+)'/.exec(manifest)?.[1]
      expect({ file: path.relative(SRC, f), route: `/learn/${id}` }).toEqual({
        file: path.relative(SRC, f),
        route: `/learn/${id}`,
      })
      expect({
        route: `/learn/${id}`,
        needs: routeNeedsCrossOriginIsolation(`/learn/${id}`),
      }).toEqual({ route: `/learn/${id}`, needs: true })
    }
  })

  it('no other code imports one outside the known isolation areas', () => {
    const allowed = [
      'components/Playground/',
      'components/PKILearning/modules/',
      'components/Simulation/',
      'dev-gate/',
      'services/python/',
      'wasm/',
      'App.tsx',
    ]
    const stray = importers
      .map((f) => path.relative(SRC, f).split(path.sep).join('/'))
      .filter((f) => !allowed.some((a) => f.startsWith(a)))
    expect(stray).toEqual([])
  })
})
