// SPDX-License-Identifier: GPL-3.0-only
/**
 * Evidence-label guards (ACVP remediation plan 2026-09-24, WS-A A-2, WS-I):
 * a button, label, spec or result string may say "NIST"/"ACVP" only when the
 * case behind it is a NIST ACVP-Server reference sample in the reviewed vector
 * manifest — read through the generated per-case records
 * (case-evidence.*.generated.json), never from a producer string.
 *
 * Every check below reads real source or real config; none of them re-derives
 * the rule from the labels it is checking.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { KatKind, KatTestSpec } from './katRunner'
import {
  evidenceForKind,
  evidenceForVectorFile,
  evidenceRecordsForKind,
  isAcvpBacked,
  katActionLabel,
  sourceForKind,
} from './katEvidence'
import { ALL_KAT_TILES } from '@/components/Algorithms/katTileConfig'
import vectorManifest from '@/data/validation/vector-manifest.json'
import katEvidenceFile from '@/data/validation/case-evidence.kat.generated.json'
import acvpEvidenceFile from '@/data/validation/case-evidence.acvp.generated.json'
import {
  effectiveCase,
  type ValidationCaseManifest,
} from '@/data/validation/validationCaseManifest'
import type { CaseEvidenceFile } from '@/data/validation/caseEvidence'

type KatClass = ReturnType<typeof evidenceForKind>
const manifest = vectorManifest as unknown as ValidationCaseManifest
const MANIFEST: Map<string, { evidenceClass: string; status: string }> = new Map(
  manifest.files.map((f) => [f.path.replace(/^src\/data\/acvp\//, ''), f])
)
/** WS-B manifest class → the UI's evidence class (quarantined/unverified → no badge). */
function manifestClass(file: string): KatClass {
  const e = MANIFEST.get(file)
  if (!e || e.status !== 'active' || e.evidenceClass === 'unverified')
    return 'unverified-provenance'
  return e.evidenceClass as KatClass
}
/** Effective manifest class of one case (case-level overrides applied). */
function manifestCaseClass(caseId: string): string | undefined {
  const f = manifest.files.find((x) => x.id === caseId.split('#')[0])
  const c = f?.cases.find((x) => x.caseId === caseId)
  return f && c ? effectiveCase(f, c).evidenceClass : undefined
}

const ROOT = join(__dirname, '..', '..')
const SRC = join(ROOT, 'src')

/** "NIST ACVP", "ACVP KAT", "(NIST ACVP …)", "ACVP vector" … — an ACVP claim. */
const ACVP_CLAIM = /\bACVP\b|\bNIST KAT\b/

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === '__golden__') continue
      walk(p, out)
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

/** Every `kind: { type: '…', … }` literal in non-test src, parsed to a KatKind. */
function specKindLiterals(): { file: string; kind: KatKind; claimText: string }[] {
  const kindRe = /kind:\s*\{\s*type:\s*'([a-z0-9-]+)'([^}]*)\}/g
  const out: { file: string; kind: KatKind; claimText: string }[] = []
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8')
    if (!text.includes('kind: {')) continue
    for (const m of text.matchAll(kindRe)) {
      const objStart = text.lastIndexOf('{', text.lastIndexOf('id:', m.index))
      const obj = text.slice(objStart, m.index)
      const claimText = [...obj.matchAll(/(useCase|standard):\s*(['`"])(.*?)\2/g)]
        .map((x) => x[3])
        .join(' | ')
      if (!claimText) continue
      // A computed field (`variant`, `step: step as any`) is not a literal — skip.
      const rest = m[2].replace(/'[^']*'/g, "''").replace(/\d+/g, '0')
      if (/(^|,)\s*[a-zA-Z_]\w*\s*(,|$)|:\s*[a-zA-Z_]\w*(\s+as\s+\w+)?\s*(,|$)/.test(rest)) continue
      const kind = { type: m[1] } as Record<string, unknown>
      for (const p of m[2].matchAll(/(\w+):\s*'([^']+)'/g)) kind[p[1]] = p[2]
      for (const p of m[2].matchAll(/(\w+):\s*(\d+)/g)) kind[p[1]] = Number(p[2])
      out.push({ file: relative(ROOT, file), kind: kind as unknown as KatKind, claimText })
    }
  }
  return out
}

/** Spec literals whose useCase/standard claims ACVP but whose case is not a NIST sample. */
function specClaimOffenders(lits: { file: string; kind: KatKind; claimText: string }[]): string[] {
  return lits
    .filter((x) => ACVP_CLAIM.test(x.claimText) && !isAcvpBacked(x.kind))
    .map((x) => `${x.file}: ${x.kind.type} — "${x.claimText}"`)
}

/**
 * Resolve each ACVP-claiming pushResult block's `id:` to its row template and
 * read the class from the generated per-case records. An `-err-` row (the
 * same case, failed with an exception) must mirror a registered NIST row with
 * the same test-case text.
 */
function workbenchClaimOffenders(src: string): { blocks: number; offenders: string[] } {
  const file = acvpEvidenceFile as unknown as CaseEvidenceFile
  const templateOf = (idExpr: string): string | undefined => {
    const e = idExpr.trim()
    const tpl = /^`(.*)`$/.exec(e)?.[1] ?? new RegExp(`const ${e} = \`([^\`]*)\``).exec(src)?.[1]
    return tpl?.replace(/\$\{eName\}/g, '{engine}')
  }
  const classesOf = (tpl: string) =>
    [...new Set((file.index[tpl] ?? []).map((id) => file.records[id].evidenceClass))].sort()
  const blocks = [...src.matchAll(/pushResult\(\{([\s\S]*?)\n\s*\}\)/g)].map((m) => {
    const b = m[1]
    const testCase = /testCase:\s*([\s\S]*?),\n/.exec(b)?.[1] ?? ''
    const text = [...b.matchAll(/(testCase|details):\s*([\s\S]*?),\n/g)].map((x) => x[2]).join(' ')
    const tpl = templateOf(/\bid:\s*([^,\n]+)/.exec(b)?.[1] ?? '')
    return { testCase, text, tpl }
  })
  const nistTestCases = new Set(
    blocks
      .filter((x) => x.tpl && !x.tpl.includes('-err-'))
      .filter((x) => classesOf(x.tpl!).join() === 'nist-acvp-reference-sample')
      .map((x) => x.testCase)
  )
  const offenders = blocks
    .filter((x) => ACVP_CLAIM.test(x.text))
    .filter((x) =>
      x.tpl?.includes('-err-')
        ? !nistTestCases.has(x.testCase)
        : !x.tpl || classesOf(x.tpl).join() !== 'nist-acvp-reference-sample'
    )
    .map((x) => `${x.tpl ?? '(unresolved id)'}: ${x.text.slice(0, 100)}`)
  return { blocks: blocks.length, offenders }
}

describe('katEvidence classification (generated from the manifest + registry)', () => {
  it('every katRunner record carries its manifest case class', () => {
    const f = katEvidenceFile as unknown as CaseEvidenceFile
    const mismatches = Object.values(f.records)
      .filter((r) => !r.caseId.startsWith('local:'))
      .filter((r) => manifestCaseClass(r.caseId) !== r.evidenceClass)
      .map((r) => `${r.id}: ${r.evidenceClass} vs manifest ${manifestCaseClass(r.caseId)}`)
    expect(mismatches).toEqual([])
    expect(Object.keys(f.records).length).toBeGreaterThan(60)
  })

  it('every workbench record carries its manifest case class', () => {
    const f = acvpEvidenceFile as unknown as CaseEvidenceFile
    const mismatches = Object.values(f.records)
      .filter((r) => !r.caseId.startsWith('local:'))
      .filter((r) => manifestCaseClass(r.caseId) !== r.evidenceClass)
      .map((r) => r.id)
    expect(mismatches).toEqual([])
  })

  it('agrees with the WS-B vector manifest for every src/data/acvp file', () => {
    const files = readdirSync(join(SRC, 'data', 'acvp')).filter((f) => f.endsWith('.json'))
    expect(files.length).toBe(MANIFEST.size)
    const disagreements = files
      .map((f) => ({ f, ours: evidenceForVectorFile({ file: `acvp/${f}` }), m: manifestClass(f) }))
      .filter((x) => x.ours !== x.m)
    expect(disagreements).toEqual([])
  })

  it('every KatTestSpec literal in src resolves to a registered evidence record', () => {
    const missing = specKindLiterals()
      .filter((x) => evidenceRecordsForKind(x.kind).length === 0)
      .map((x) => `${x.file}: ${JSON.stringify(x.kind)}`)
    expect([...new Set(missing)]).toEqual([])
  })

  it('classifies known cases correctly (regression pins for the 2026-09-24 audit)', () => {
    expect(evidenceForKind({ type: 'mlkem-decap', variant: 512 })).toBe(
      'nist-acvp-reference-sample'
    )
    // aesgcm_test's own producer string says "published KAT"; the WS-B manifest
    // (tag ≠ GCM Test Case 16's published tag) says OpenSSL oracle — manifest wins.
    expect(evidenceForKind({ type: 'aesgcm-decrypt' })).toBe('independent-oracle')
    expect(evidenceForKind({ type: 'aeskw-wrap' })).toBe('published-standard-kat')
    expect(evidenceForKind({ type: 'rsapss-sigver' })).toBe('independent-oracle')
    expect(evidenceForKind({ type: 'hkdf-derive' })).toBe('published-standard-kat')
    expect(evidenceForKind({ type: 'slhdsa-functional', variant: 'SHA2-128s' })).toBe(
      'functional-round-trip'
    )
    expect(evidenceForKind({ type: 'ecdsa-sigver', curve: 'P-521' })).toBe(
      'nist-acvp-reference-sample'
    )
    expect(evidenceForKind({ type: 'ecdsa-sigver', curve: 'P-256' })).toBe('published-standard-kat')
    expect(evidenceForKind({ type: 'mldsa-sigver-nist', variant: 44, expect: 'invalid' })).toBe(
      'nist-acvp-reference-sample'
    )
    expect(evidenceForKind({ type: 'suci-profile-b', step: '7-e2e' })).toBe(
      'published-standard-kat'
    )
    expect(evidenceForKind({ type: 'aes-kwp-wrap' })).toBe('functional-round-trip')
    // testIndex equal to the runner default is the same case
    expect(evidenceRecordsForKind({ type: 'pbkdf2-derive', prf: 'SHA-256', testIndex: 1 })).toEqual(
      evidenceRecordsForKind({ type: 'pbkdf2-derive', prf: 'SHA-256' })
    )
  })

  it('the source of a NIST sample is its pinned upstream URL', () => {
    expect(sourceForKind({ type: 'hmac-verify', hashAlg: 'SHA-256' })?.url).toMatch(
      /^https:\/\/raw\.githubusercontent\.com\/usnistgov\/ACVP-Server\/[0-9a-f]{40}\//
    )
    expect(sourceForKind({ type: 'suci-profile-b', step: '4-kdf' })?.citation).toMatch(/C\.4\.4\.1/)
    expect(sourceForKind({ type: 'aes-kwp-wrap' })).toBeUndefined()
  })

  it('names a single-class button by that class and a mixed one neutrally', () => {
    const decap: Pick<KatTestSpec, 'kind'> = { kind: { type: 'mlkem-decap', variant: 768 } }
    const rt: Pick<KatTestSpec, 'kind'> = { kind: { type: 'mlkem-encap-roundtrip', variant: 768 } }
    expect(katActionLabel([decap])).toBe('Run reference sample')
    expect(katActionLabel([decap, decap])).toBe('Run reference samples')
    expect(katActionLabel([rt])).toBe('Run functional test')
    expect(katActionLabel([decap, rt])).toBe('Run validation tests')
    expect(katActionLabel([{ kind: { type: 'aeskw-wrap' } }])).toBe('Run standard KAT')
  })
})

describe('evidence-label static guard', () => {
  it('no button anywhere in src still reads "Run NIST KAT"', () => {
    const offenders = walk(SRC)
      .filter((f) => /Run NIST KAT/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f))
    expect(offenders).toEqual([])
  })

  it('Algorithms KAT tiles: operation labels align with specs and never claim NIST/ACVP', () => {
    for (const tile of ALL_KAT_TILES) {
      expect(tile.operations.length, tile.id).toBe(tile.specs.length)
      for (const op of tile.operations) expect(op, tile.id).not.toMatch(ACVP_CLAIM)
      expect(tile.name, tile.id).not.toMatch(ACVP_CLAIM)
      const label = katActionLabel(tile.specs)
      if (/reference sample/i.test(label)) {
        expect(
          tile.specs.every((s) => isAcvpBacked(s.kind)),
          tile.id
        ).toBe(true)
      }
    }
  })

  it('every KatTestSpec literal in src that says ACVP runs a NIST ACVP-Server sample', () => {
    const lits = specKindLiterals()
    expect(lits.length).toBeGreaterThan(50)
    expect(specClaimOffenders(lits)).toEqual([])
  })

  it('sabotage: the spec guard fails a non-ACVP spec labelled NIST/ACVP', () => {
    const planted = [
      {
        file: 'synthetic',
        kind: { type: 'aes-kwp-wrap' } as KatKind,
        claimText: 'RFC 5649 NIST ACVP',
      },
      {
        file: 'synthetic',
        kind: { type: 'ecdsa-sigver', curve: 'P-256' } as KatKind,
        claimText: 'FIPS 186-5 ACVP',
      },
      { file: 'synthetic', kind: { type: 'hkdf-derive' } as KatKind, claimText: 'Run NIST KAT' },
    ]
    expect(specClaimOffenders(planted)).toHaveLength(3)
    // …and the same kinds pass when they do not claim ACVP, and a real sample passes when it does.
    expect(
      specClaimOffenders([
        { file: 'synthetic', kind: { type: 'aes-kwp-wrap' } as KatKind, claimText: 'RFC 5649' },
        {
          file: 'synthetic',
          kind: { type: 'ecdsa-sigver', curve: 'P-521' } as KatKind,
          claimText: 'FIPS 186-5 ACVP',
        },
      ])
    ).toEqual([])
  })

  it('KatValidationPanel label/authorityNote props never claim ACVP (the panel derives that)', () => {
    const offenders: string[] = []
    for (const file of walk(SRC)) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/<KatValidationPanel([\s\S]*?)\/>/g)) {
        for (const p of m[1].matchAll(/(label|authorityNote)=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
          const value = p[2] ?? p[3] ?? ''
          if (/\bACVP\b/.test(value)) offenders.push(`${relative(ROOT, file)}: ${p[1]}="${value}"`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('katRunner result strings mention ACVP/NIST vectors only in functions that read ACVP-backed files', () => {
    const src = readFileSync(join(SRC, 'utils', 'katRunner.ts'), 'utf8')
    const importMap = new Map<string, string>()
    for (const m of src.matchAll(/^import (\w+) from '\.\.\/data\/acvp\/([\w-]+\.json)'/gm)) {
      importMap.set(m[1], m[2])
    }
    // Helpers that read a vector file on a run function's behalf.
    const helperMap: Record<string, string> = {
      getMlkemGroup: 'mlkemTestVectors',
      getMldsaGroup: 'mldsaTestVectors',
    }
    const fnRe = /\nasync function (run\w+)\([\s\S]*?\n\}\n/g
    const offenders: string[] = []
    for (const m of src.matchAll(fnRe)) {
      let body = m[0]
      for (const [helper, id] of Object.entries(helperMap)) {
        if (body.includes(`${helper}(`)) body += ` ${id}`
      }
      const literals = [
        ...[...body.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map((x) => x[1]),
        ...[...body.matchAll(/`((?:[^`\\]|\\.)*)`/g)].map((x) => x[1]),
      ]
      const claims = literals.filter((l) =>
        /\bACVP\b|NIST (?:key|public key|private key|vector)/.test(l)
      )
      if (claims.length === 0) continue
      const used = [...importMap.keys()].filter((id) => new RegExp(`\\b${id}\\b`).test(body))
      const allBacked =
        used.length > 0 &&
        used.every((id) => manifestClass(importMap.get(id)!) === 'nist-acvp-reference-sample')
      if (!allBacked) offenders.push(`${m[1]}: ${claims.join(' / ')}`)
    }
    expect(offenders).toEqual([])
  })

  it('the workbench and its sections derive no evidence class from a producer string', () => {
    const dir = join(SRC, 'components', 'Playground', 'hsm', 'acvp')
    const files = [
      join(dir, 'useAcvpSuite.ts'),
      ...readdirSync(join(dir, 'sections')).map((f) => join(dir, 'sections', f)),
    ]
    const offenders = files
      .filter((f) =>
        /evidenceTier|deriveEvidenceTier|producer\?*\.startsWith/.test(readFileSync(f, 'utf8'))
      )
      .map((f) => relative(ROOT, f))
    expect(offenders).toEqual([])
  })

  it('validation-workbench result rows say ACVP only when their registered case is a NIST sample', () => {
    const path = join(SRC, 'components', 'Playground', 'hsm', 'acvp', 'useAcvpSuite.ts')
    const { blocks, offenders } = workbenchClaimOffenders(readFileSync(path, 'utf8'))
    expect(blocks).toBeGreaterThan(40)
    expect(offenders).toEqual([])
  })

  it('sabotage: the workbench guard fails an ACVP claim on a non-NIST row', () => {
    const planted = [
      // registered functional round-trip (§20 AES-KWP) relabelled as a NIST sample
      '      const id20 = `aeskwp-func-${eName}`',
      '      await pushResult({',
      '        id: id20,',
      "        testCase: 'Wrap+Unwrap KAT (NIST ACVP)',",
      "        details: 'ok',",
      '      })',
      // an unregistered row claiming ACVP
      '      await pushResult({',
      '        id: `made-up-${eName}`,',
      "        testCase: 'SigVer (NIST ACVP)',",
      "        details: 'ok',",
      '      })',
      // a registered NIST row: allowed
      '      const id33 = `ecdsa521-acvp-${eName}`',
      '      await pushResult({',
      '        id: id33,',
      "        testCase: 'SigVer KAT (NIST ACVP)',",
      "        details: 'ok',",
      '      })',
    ].join('\n')
    const { offenders } = workbenchClaimOffenders(planted)
    expect(offenders).toHaveLength(2)
    expect(offenders.join('\n')).toMatch(/aeskwp-func-\{engine\}/)
    expect(offenders.join('\n')).toMatch(/made-up-\{engine\}/)
  })
})
