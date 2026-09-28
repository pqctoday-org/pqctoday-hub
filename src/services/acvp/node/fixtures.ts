// SPDX-License-Identifier: GPL-3.0-only
// Node-only (tests + CLI): locate the pinned public NIST fixtures on disk.
// Never import from browser code.
import { readFileSync } from 'node:fs'
import path from 'node:path'

export const FIXTURE_ROOT = 'src/services/acvp/__fixtures__/nist-acvp-server'

export const FIXTURE_NAMES = ['ML-KEM-encapDecap-FIPS203', 'ML-DSA-sigVer-FIPS204'] as const
export type FixtureName = (typeof FIXTURE_NAMES)[number]

export const fixturePath = (
  repoRoot: string,
  name: FixtureName,
  file: 'prompt.json' | 'expectedResults.json'
): string => path.join(repoRoot, FIXTURE_ROOT, name, file)

export const readFixture = (
  repoRoot: string,
  name: FixtureName,
  file: 'prompt.json' | 'expectedResults.json'
): string => readFileSync(fixturePath(repoRoot, name, file), 'utf8')
