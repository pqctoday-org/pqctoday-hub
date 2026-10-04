// SPDX-License-Identifier: GPL-3.0-only
/**
 * `/openssl?cmd=` opens the command category it names, and the PQC Assistant
 * names these categories in its links (promptBuilder.ts reads OPENSSL_CATEGORIES).
 * A typed list there had eleven of the fifteen, so `version`, `files`, `configutl`
 * and `pkcs11` could not be linked.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OPENSSL_CATEGORIES } from './categories'

const here = dirname(fileURLToPath(import.meta.url))
// eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo files
const read = (relative: string) => readFileSync(join(here, relative), 'utf-8')

describe('OPENSSL_CATEGORIES', () => {
  it('are the fifteen categories a link can open', () => {
    expect([...OPENSSL_CATEGORIES]).toEqual([
      'genpkey',
      'req',
      'x509',
      'enc',
      'dgst',
      'hash',
      'rand',
      'version',
      'files',
      'kem',
      'pkcs12',
      'lms',
      'configutl',
      'kdf',
      'pkcs11',
    ])
  })

  it('include every category the workbench toolbar has a button for', () => {
    const buttons = [
      ...read('./components/WorkbenchToolbar.tsx').matchAll(/handleCategoryChange\('([a-z0-9]+)'/g),
    ].map((m) => m[1])
    expect(buttons.length).toBeGreaterThan(10)
    expect(buttons.filter((id) => !(OPENSSL_CATEGORIES as readonly string[]).includes(id))).toEqual(
      []
    )
  })

  it('are what the studio checks ?cmd= against, not a second copy of the list', () => {
    expect(read('./OpenSSLStudioView.tsx')).toContain('new Set<string>(OPENSSL_CATEGORIES)')
  })
})
