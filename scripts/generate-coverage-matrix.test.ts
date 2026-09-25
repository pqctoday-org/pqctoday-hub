// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  MATRIX_REL,
  PUBLIC_DIR_REL,
  baselineWaivers,
  loadInputs,
  renderOutputs,
} from './generate-coverage-matrix'
import { buildCoverageMatrix, caseKeyOf, ENGINES } from '../src/data/validation/coverageModel'
import { TEST_REGISTRY } from '../src/data/validation/testRegistry'
import { VALIDATION_DISCLAIMER } from '../src/data/validationDisclaimer'

const REPO = process.cwd()
const inputs = loadInputs()
const { matrix, gate, files } = renderOutputs(inputs)

describe('generate-coverage-matrix (committed inputs)', () => {
  it('the committed outputs are exactly what the inputs generate (the --check contract)', () => {
    for (const [rel, text] of Object.entries(files)) {
      expect(fs.readFileSync(path.join(REPO, rel), 'utf8'), rel).toBe(text)
    }
    expect(Object.keys(files).sort()).toEqual(
      [
        MATRIX_REL,
        `${PUBLIC_DIR_REL}/coverage-matrix.html`,
        `${PUBLIC_DIR_REL}/coverage-matrix.json`,
        `${PUBLIC_DIR_REL}/coverage-matrix.md`,
      ].sort()
    )
  })

  it('passes the coverage-diff gate', () => {
    expect(gate.errors).toEqual([])
  })

  it('has one capability row set per engine inventory and a denominator that partitions', () => {
    for (const e of ENGINES) {
      const t = matrix.totals.byEngine[e] // eslint-disable-line security/detect-object-injection
      expect(t.advertisedCells + t.unsupportedCells).toBe(matrix.rows.length)
      expect(t.overall.covered + t.overall.sampled + t.overall.untested).toBe(t.advertisedCells)
      expect(matrix.engines[e].mechanismCount).toBe(
        inputs.inventory.engines[e].inventory.mechanismCount // eslint-disable-line security/detect-object-injection
      )
    }
  })

  it('every export carries the §2.2 disclaimer and the numerator/denominator definitions', () => {
    for (const ext of ['md', 'html']) {
      const text = files[`${PUBLIC_DIR_REL}/coverage-matrix.${ext}`]
      expect(text).toContain(VALIDATION_DISCLAIMER)
      expect(text).toMatch(/Denominator \(per engine\) = advertised capability cells/)
      expect(text).toMatch(/Numerators \(per engine, per polarity\)/)
    }
    expect(files[`${PUBLIC_DIR_REL}/coverage-matrix.html`]).not.toMatch(/<script/i)
  })

  it('the ECDSA P-521 NIST sample passes on both engines since the hub DER fix (was a recorded C++ fail)', () => {
    const r = matrix.rows.find((x) => x.key === 'CKM_ECDSA_SHA512|verify|P-521|*')!
    // C++: the §33 workbench case + the 7 WS-E NIST SigVer cases (§4b, P-521 / SHA2-512).
    expect(r.engines.cpp.run).toEqual({ pass: 8, fail: 0 })
    // Rust: the same 8 plus the Algorithms (katRunner) case, all passing.
    expect(r.engines.rust.run).toEqual({ pass: 9, fail: 0 })
    expect(r.parity.positive).toBe('parity')
    expect(matrix.openGaps.some((g) => g.id.startsWith('recorded-fail:acvp.33#'))).toBe(false)
  })

  it('every recorded fail is a documented engine defect and becomes an open gap', () => {
    const fails = (inputs.runResults ?? []).filter((r) => r.status === 'fail')
    expect(fails.length).toBeGreaterThan(0)
    for (const f of fails) {
      // Each prefix is an engine defect with a curated open gap: 07b.keycheck
      // rust-mlkem-no-key-input-checks; 09c cpp-hashslhdsa-double-wrap; WS-E —
      // 01b rust-gcm-iv-96-only, 04b rust-ecdsa-p224-unsupported, 04d
      // rust-rsa-public-exponent-limit, 12b.probes rust-cbc-iv-length-arguments-bad,
      // 18b rust-pbkdf2-prf-limited, 35b kmac-verify-ignores-output-length;
      // gap-closure P5 — 07c rust-mlkem-no-key-input-checks, 04e.keyver
      // cpp-ec-public-key-not-validated, 04e.ecdsa-siggen
      // g8-rust-advertised-cells-do-not-execute (SHA-224), 04e.eddsa-siggen
      // rust-eddsa-ph-context-ignored, 18c.kbkdf cpp-kbkdf-counter-position-ignored
      // / rust-kbkdf-iteration-variable-rejected.
      expect(f.registryCase, f.registryCase).toMatch(
        /^acvp\.(07b\.keycheck|07c\.ekcheck-depth|09c\.(sigver|siggen-det)|01b|04b|04d|04e\.(keyver|ecdsa-siggen|eddsa-siggen)|12b\.probes|18b|18c\.kbkdf|35b)#/
      )
      expect(
        matrix.openGaps.some((g) => g.id === `recorded-fail:${f.registryCase}:${f.engine}`)
      ).toBe(true)
    }
  })

  it('native and hardware are never counted as pass', () => {
    for (const e of ENGINES) {
      const a = matrix.totals.byEngine[e].byArtifact // eslint-disable-line security/detect-object-injection
      expect(a.native).toMatchObject({ status: 'not-run', passedCells: 0 })
      expect(a.hardware).toMatchObject({ status: 'not-run', passedCells: 0 })
    }
  })

  it('registers the katRunner kinds fixed 2026-09-24, each with a recorded pass (katRunner.engines.local.test.ts)', () => {
    const ids = TEST_REGISTRY.map((t) => t.id)
    const recorded = new Map(
      (inputs.runResults ?? [])
        .filter((r) => r.registryCase.startsWith('kat.'))
        .map((r) => [`${r.registryCase}|${r.engine}`, r.status])
    )
    for (const k of [
      'aescbc-decrypt',
      'hmac-verify',
      'hmac-generate',
      'pbkdf2-derive',
      'aes-kwp-wrap',
    ]) {
      expect(ids).toContain(`kat.${k}`)
      const t = TEST_REGISTRY.find((x) => x.id === `kat.${k}`)!
      for (const c of t.cases) {
        expect(recorded.get(`kat.${k}#${caseKeyOf(c)}|rust`), `kat.${k}`).toBe('pass')
      }
    }
  })

  it('every waiver has reason, owner and date, and none is an unreviewed approval', () => {
    for (const w of inputs.waivers.waivers) {
      expect(w.reason.length).toBeGreaterThan(10)
      expect(w.owner).toBeTruthy()
      expect(w.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(['approved', 'baseline-pending-review']).toContain(w.status)
    }
  })

  it('the baseline-waiver printer reproduces the committed waivers (no silent widening)', () => {
    const printed = baselineWaivers(inputs, '2026-09-24')
    const cells = (f: typeof printed) =>
      f.waivers
        .flatMap((w) => w.engines.flatMap((e) => w.cells.map((c) => `${e}|${w.mechanism}|${c}`)))
        .sort()
    expect(cells(printed)).toEqual(cells(inputs.waivers))
  })
})

describe('generate-coverage-matrix — sabotage on a copy of the real inventory', () => {
  it('adding one advertised mechanism without a test or waiver fails the gate', () => {
    const copy = structuredClone(inputs)
    copy.inventory.engines.rust.inventory.mechanisms.push({
      typeHex: '0x80009999',
      name: 'CKM_SABOTAGE_FAKE',
      family: 'symmetric',
      ulMinKeySize: 16,
      ulMaxKeySize: 32,
      flagNames: ['CKF_SIGN'],
      requiredOperations: ['sign'],
    })
    copy.registry = inputs.registry
    copy.manifestCases = inputs.manifestCases
    const { gate: g } = buildCoverageMatrix(copy)
    expect(g.errors).toContain(
      'rust: advertised mechanism CKM_SABOTAGE_FAKE is not in capability-map.json'
    )
    expect(g.errors).toContain(
      'rust: advertised capability CKM_SABOTAGE_FAKE|sign|*|* has no registered test and no approved waiver'
    )
  })

  it('adding one declared parameter set inside an advertised range fails the gate', () => {
    const copy = structuredClone(inputs)
    copy.registry = inputs.registry
    copy.manifestCases = inputs.manifestCases
    copy.capabilityMap.parameterSetGroups['ML-DSA'].sets.push({
      id: 'ML-DSA-SABOTAGE',
      keySize: 2000,
    })
    const { gate: g } = buildCoverageMatrix(copy)
    expect(g.errors).toContain(
      'cpp: advertised capability CKM_ML_DSA|verify|ML-DSA-SABOTAGE|* has no registered test and no approved waiver'
    )
  })
})
