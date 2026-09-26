// SPDX-License-Identifier: GPL-3.0-only
/**
 * The education / not-for-production gate (education-notice remediation
 * 2026-09-26). Same contract as `generate-release-evidence.test.ts`: prove the
 * gate can FAIL. Every sabotage runs on a throw-away copy of the inputs in
 * os.tmpdir(), never on the real files.
 *
 * The inverse export check (#4) gets the sabotage that matters most: a brand
 * new download button in a brand new file must fail the gate on its own, with
 * nobody having remembered to add it to any list.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  ARTEFACT_SURFACES,
  EDUCATION_SURFACES,
  ENGINE_PKG,
  EXPORT_GRANDFATHERED,
  auditEducationNotice,
  checkDownstream,
  checkExports,
  checkSurfaces,
} from './audit-education-notice'

const REPO = process.cwd()

describe('education-notice gate — the real tree', () => {
  it('passes', () => {
    expect(auditEducationNotice(REPO)).toEqual([])
  })

  it('every named surface and artefact exists', () => {
    for (const f of EDUCATION_SURFACES) expect(fs.existsSync(path.join(REPO, f)), f).toBe(true)
    for (const s of ARTEFACT_SURFACES)
      expect(fs.existsSync(path.join(REPO, s.file)), s.file).toBe(true)
  })

  it('the grandfather list is a burn-down: every entry still exists and is distinct', () => {
    expect(new Set(EXPORT_GRANDFATHERED).size).toBe(EXPORT_GRANDFATHERED.length)
    for (const f of EXPORT_GRANDFATHERED) expect(fs.existsSync(path.join(REPO, f)), f).toBe(true)
  })
})

describe('education-notice gate — sabotage on a temp copy', () => {
  let tmp: string
  const COPY = [
    `${ENGINE_PKG}/package.json`,
    `${ENGINE_PKG}/NOTICE`,
    `${ENGINE_PKG}/index.js`,
    `${ENGINE_PKG}/index.d.ts`,
    'SECURITY.md',
    'README.md',
    'public/data/pqctoday-cbom.json',
    'src/data/educationNotice.ts',
    ...EDUCATION_SURFACES,
  ]
  const write = (rel: string, body: string) => fs.writeFileSync(path.join(tmp, rel), body)
  const readTmp = (rel: string) => fs.readFileSync(path.join(tmp, rel), 'utf8')

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'education-notice-'))
    for (const rel of COPY) {
      const src = path.join(REPO, rel)
      if (!fs.existsSync(src)) continue
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true })
      fs.cpSync(src, path.join(tmp, rel))
    }
  })
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

  it('the untouched copy passes the checks that do not need the whole tree', () => {
    expect(checkDownstream(tmp)).toEqual([])
    expect(checkSurfaces(tmp)).toEqual([])
  })

  it('SABOTAGE: dropping NOTICE from the package `files` array fails', () => {
    const rel = `${ENGINE_PKG}/package.json`
    const pkg = JSON.parse(readTmp(rel)) as { files: string[] }
    pkg.files = pkg.files.filter((f) => f !== 'NOTICE')
    write(rel, JSON.stringify(pkg, null, 2))
    expect(
      checkDownstream(tmp)
        .map((p) => p.problem)
        .join()
    ).toMatch(/not packed/)
  })

  it('SABOTAGE: restoring the old production-sounding npm description fails', () => {
    const rel = `${ENGINE_PKG}/package.json`
    const pkg = JSON.parse(readTmp(rel)) as { description: string }
    pkg.description =
      'SoftHSMv3 compiled to WebAssembly — PKCS#11 v3.2 token with ML-KEM, ML-DSA, SLH-DSA for browsers and Node.js'
    write(rel, JSON.stringify(pkg, null, 2))
    expect(
      checkDownstream(tmp)
        .map((p) => p.problem)
        .join()
    ).toMatch(/does not LEAD/)
  })

  it('SABOTAGE: removing the engine banner comment fails', () => {
    write(`${ENGINE_PKG}/index.js`, "'use strict'\nmodule.exports = {}\n")
    expect(
      checkDownstream(tmp)
        .map((p) => p.file)
        .join()
    ).toContain(`${ENGINE_PKG}/index.js`)
  })

  it('SABOTAGE: re-scoping SECURITY.md back to the browser fails', () => {
    write(
      'SECURITY.md',
      '# Security Policy\n\nThe WASM implementation in this browser-based environment is educational.\n'
    )
    expect(
      checkDownstream(tmp)
        .map((p) => p.problem)
        .join()
    ).toMatch(/still scoped to the browser/)
  })

  it('SABOTAGE: removing <EducationNotice/> from a surface fails', () => {
    const rel = EDUCATION_SURFACES[0]
    write(rel, readTmp(rel).replace(/<EducationNotice\b[^>]*\/>/g, ''))
    const p = checkSurfaces(tmp)
    expect(p.map((x) => x.problem).join()).toMatch(/does not render/)
    expect(p.map((x) => x.file)).toContain(rel)
  })

  it('SABOTAGE: putting the notice behind a role condition fails — this was the original bug', () => {
    const rel = EDUCATION_SURFACES[1]
    write(
      rel,
      readTmp(rel).replace(
        /<EducationNotice[^>]*\/>/,
        '{role === \'executive\' ? <EducationNotice tone="strong" /> : null}'
      )
    )
    expect(
      checkSurfaces(tmp)
        .map((p) => p.problem)
        .join()
    ).toMatch(/behind a role\/persona/)
  })

  it('SABOTAGE: a NEW export path in a NEW file fails with nobody having listed it', () => {
    // The whole point of inverting the gate: "forgotten" is not the default.
    fs.mkdirSync(path.join(tmp, 'src/components/Brand'), { recursive: true })
    write(
      'src/components/Brand/NewExporter.tsx',
      'export const NewExporter = () => {\n  const url = URL.createObjectURL(new Blob(["secret"]))\n  return url\n}\n'
    )
    // The partial copy has none of the grandfathered files, so ignore that
    // (separately tested) staleness noise and look at the new file only.
    const p = checkExports(tmp).filter((x) => !/no longer exists/.test(x.problem))
    expect(p.map((x) => x.file)).toEqual(['src/components/Brand/NewExporter.tsx'])
    expect(p[0].problem).toMatch(/no status notice/)
  })

  it('a NEW export path that DOES carry the notice passes', () => {
    fs.mkdirSync(path.join(tmp, 'src/components/Brand'), { recursive: true })
    write(
      'src/components/Brand/NewExporter.tsx',
      "import { EDUCATION_NOTICE } from '@/data/educationNotice'\nexport const NewExporter = () => URL.createObjectURL(new Blob([EDUCATION_NOTICE]))\n"
    )
    expect(checkExports(tmp).filter((x) => !/no longer exists/.test(x.problem))).toEqual([])
  })

  it('a grandfathered file that has since been covered must leave the list', () => {
    // The burn-down only shrinks if the gate says so. A grandfathered file that
    // now carries a notice is itself a failure, naming the entry to delete.
    const rel = EXPORT_GRANDFATHERED[0]
    fs.mkdirSync(path.join(tmp, path.dirname(rel)), { recursive: true })
    write(
      rel,
      "import { EDUCATION_NOTICE } from '@/data/educationNotice'\nexport const x = () => URL.createObjectURL(new Blob([EDUCATION_NOTICE]))\n"
    )
    const p = checkExports(tmp).filter((x) => x.file === rel)
    expect(p.map((x) => x.problem).join()).toMatch(/remove it from EXPORT_GRANDFATHERED/)
  })

  it('SABOTAGE: an artefact that drops the notice fails', () => {
    write(
      'public/data/pqctoday-cbom.json',
      '{"metadata":{"component":{"description":"a registry"}}}'
    )
    expect(auditEducationNotice(tmp).map((p) => p.file)).toContain('public/data/pqctoday-cbom.json')
  })
})
