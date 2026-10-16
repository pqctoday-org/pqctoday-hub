// SPDX-License-Identifier: AGPL-3.0-only
// scripts/ci/check-licences.ts: own files say AGPL-3.0-only, third-party files are left alone.
import { describe, expect, it } from 'vitest'
import { scan } from './check-licences'

const reader = (files: Record<string, string>) => (p: string) => files[p]
const none = new Set<string>()

describe('check-licences scan', () => {
  it('passes own AGPL files and flags other labels', () => {
    const files = {
      'src/a.ts': '// SPDX-License-Identifier: AGPL-3.0-only\n',
      'src/b.tsx': '// SPDX-License-Identifier: AGPL-3.0-only AND CC-BY-4.0\n',
      'src/c.ts': '// SPDX-License-Identifier: GPL-3.0-only\n',
      'scripts/d.py': '# SPDX-License-Identifier: MIT\n',
    }
    const { problems, headerless } = scan(Object.keys(files), reader(files), none)
    expect(problems.map((p) => p.file).sort()).toEqual(['scripts/d.py', 'src/c.ts'])
    expect(headerless).toEqual([])
  })

  it('leaves the retiring embed SDK on its own labels', () => {
    const files = {
      'src/embed/x.ts': '// SPDX-License-Identifier: GPL-3.0-only\n',
      'src/embed/sdk.ts': '// SPDX-License-Identifier: MIT\n',
    }
    expect(scan(Object.keys(files), reader(files), none).problems).toEqual([])
  })

  it('skips third-party paths and locked engine files', () => {
    const files = {
      'public/wasm/openssl.js': '',
      'src/data/acvp/vec.json': '',
      'src/wasm/kmip/pqctoday_kmip_wasm.js': '// SPDX-License-Identifier: GPL-3.0-only\n',
    }
    const locked = new Set(['src/wasm/kmip/pqctoday_kmip_wasm.js'])
    expect(scan(Object.keys(files), reader(files), locked)).toEqual({
      problems: [],
      headerless: [],
    })
  })

  it('reports own code files without a header, and ignores data and docs', () => {
    const files = {
      'src/new.ts': 'export const x = 1\n',
      'src/data/rows.json': '[]',
      'docs/a.md': '#',
    }
    expect(scan(Object.keys(files), reader(files), none).headerless).toEqual(['src/new.ts'])
  })
})
