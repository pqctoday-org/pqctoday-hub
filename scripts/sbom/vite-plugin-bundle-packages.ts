// SPDX-License-Identifier: GPL-3.0-only
/**
 * Records which npm packages actually end up inside the emitted chunks of a production build.
 *
 * The lockfile's production closure over-states what ships (492 unique names on 2026-09-29 versus
 * 221 that contribute modules to the browser bundle), so the SBOM's package list is taken from
 * the build itself: for every module rollup puts in a chunk, the package it came from.
 *
 * It never fails a build. It writes what this build bundled to node_modules/.tmp/sbom-bundled.json
 * (compared against the committed snapshot by `npm run check:sbom-bundle`), or, with
 * SBOM_BUNDLE_UPDATE=1, rewrites the snapshot src/data/sbomBundledPackages.json itself.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'

/** "/abs/node_modules/a/node_modules/@s/b/x.js?commonjs" -> "node_modules/a/node_modules/@s/b" */
export function lockKeyOf(moduleId: string): string | null {
  const id = moduleId.replace(/^\0/, '').split('?')[0]
  const at = id.lastIndexOf('/node_modules/')
  if (at < 0) return null
  const tail = id.slice(at + '/node_modules/'.length).split('/')
  const name = tail[0].startsWith('@') ? tail.slice(0, 2).join('/') : tail[0]
  if (!name || (tail[0].startsWith('@') && tail.length < 2)) return null
  const head = id.slice(0, at + '/node_modules/'.length)
  // Everything from the first node_modules segment on, e.g. node_modules/a/node_modules/b/
  const first = head.indexOf('/node_modules/')
  const chain = head.slice(first + 1) // "node_modules/a/node_modules/"
  return `${chain}${name}`
}

export function bundledPackagesPlugin(root: string): Plugin {
  return {
    name: 'sbom-bundled-packages',
    apply: 'build',
    generateBundle(_options, bundle) {
      const keys = new Set<string>()
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        for (const id of Object.keys(chunk.modules)) {
          const key = lockKeyOf(id)
          if (key) keys.add(key)
        }
      }
      const sorted = [...keys].sort()
      const update = process.env.SBOM_BUNDLE_UPDATE === '1'
      const target = update
        ? join(root, 'src', 'data', 'sbomBundledPackages.json')
        : join(root, 'node_modules', '.tmp', 'sbom-bundled.json')
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(
        target,
        JSON.stringify(
          {
            _comment:
              'npm packages (as package-lock.json keys) whose modules a production `vite build` put into the emitted chunks. Written by scripts/sbom/vite-plugin-bundle-packages.ts; refresh with `npm run sbom:snapshot-bundle`. `npm run check:sbom-bundle` compares a fresh build with this file.',
            packages: sorted,
          },
          null,
          2
        ) + '\n'
      )
      if (update) this.warn(`SBOM bundle snapshot rewritten: ${sorted.length} packages`)
    },
  }
}
