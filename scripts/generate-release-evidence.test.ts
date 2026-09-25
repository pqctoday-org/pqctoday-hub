// SPDX-License-Identifier: GPL-3.0-only
/**
 * Release evidence report (plan WS-J J-6, J-5, §10.1). Proves the --check can
 * FAIL: every sabotage runs on a throw-away copy of the inputs in os.tmpdir(),
 * never on the real files. Reviewer names are test fixtures, not records.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  DISCLAIMER_SURFACES,
  IN,
  REPORT_JSON_REL,
  REPORT_MD_REL,
  buildReleaseEvidence,
  checkReleaseEvidence,
  claimsSha256,
  evaluateDod,
  figureRules,
  renderOutputs as formatReportFiles,
  scanFigures,
  sha256,
  staleInputs,
  type ReleaseEvidence,
} from './generate-release-evidence'
import { TEST_REGISTRY } from '../src/data/validation/testRegistry'
import { VALIDATION_DISCLAIMER } from '../src/data/validationDisclaimer'

const REPO = process.cwd()
const committed = (): ReleaseEvidence =>
  JSON.parse(fs.readFileSync(path.join(REPO, REPORT_JSON_REL), 'utf8')) as ReleaseEvidence
const readRepo = <T>(rel: string): T =>
  JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8')) as T

describe('release evidence — committed report', () => {
  it('is exactly what the committed generated sources produce (the --check contract)', async () => {
    const { errors } = await checkReleaseEvidence(REPO)
    expect(errors.filter((e) => !e.startsWith('stale input:'))).toEqual([])
  }, 60000)

  it('reads only fresh generated sources (coverage matrix, validation counts)', () => {
    // Fails — with the generator to run — when an input of this report is
    // itself stale. The check never regenerates it.
    expect(staleInputs(REPO)).toEqual([])
  })

  it('pulls every headline figure from its generated source', () => {
    const r = committed()
    const counts = readRepo<{
      nistReferenceSampleFileCount: number
      filesByClass: Record<string, number>
    }>(IN.counts)
    const matrix = readRepo<{
      totals: { byEngine: Record<string, { advertisedCells: number }> }
      openGaps: unknown[]
    }>(IN.publicMatrix)
    const waivers = readRepo<{ waivers: Array<{ status: string }> }>(IN.waivers)
    const v = r.vectors as {
      nistReferenceSampleFiles: number
      filesByClass: Record<string, number>
    }
    expect(v.nistReferenceSampleFiles).toBe(counts.nistReferenceSampleFileCount)
    expect(v.filesByClass).toEqual(counts.filesByClass)
    const cov = r.coverage as { byEngine: Record<string, { advertisedCells: number }> }
    for (const [e, t] of Object.entries(matrix.totals.byEngine))
      expect(cov.byEngine[e].advertisedCells).toBe(t.advertisedCells)
    expect((r.openGaps as { total: number }).total).toBe(matrix.openGaps.length)
    expect((r.waivers as { entries: number }).entries).toBe(waivers.waivers.length)
  })

  it('says plainly when every waiver is baseline-pending-review, and counts none as approved', () => {
    const r = committed()
    const w = r.waivers as { statement: string; approvedEntries: number; entries: number }
    const pending = readRepo<{ waivers: Array<{ status: string }> }>(IN.waivers).waivers.filter(
      (x) => x.status === 'baseline-pending-review'
    ).length
    if (pending === w.entries) {
      expect(w.statement).toMatch(
        /^All \d+ waivers are baseline-pending-review\. None is an approval/
      )
      expect(w.approvedEntries).toBe(0)
    }
  })

  it('carries the §2.2 disclaimer verbatim in both outputs', () => {
    expect(committed().disclaimer).toBe(VALIDATION_DISCLAIMER)
    expect(fs.readFileSync(path.join(REPO, REPORT_MD_REL), 'utf8')).toContain(VALIDATION_DISCLAIMER)
  })

  it('lists the draft Learn module and every pending waiver as awaiting review', () => {
    const r = committed()
    const lm = r.reviews.items.find((i) => i.id === 'learn-module-practitioner:acvp-lab-workflow')
    expect(lm?.status).not.toBe('approved')
    expect(r.reviews.rule).toMatch(/LM-065/)
    const waiverItems = r.reviews.items.filter((i) => i.kind === 'coverage-waiver')
    expect(waiverItems).toHaveLength((r.waivers as { entries: number }).entries)
  })

  it('has the ten §10.1 items; human items are never PASS', () => {
    const d = committed().definitionOfDone
    expect(d.map((x) => x.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const n of [3, 8, 9, 10]) expect(d[n - 1].status).toBe('HUMAN-REQUIRED')
    for (const x of d) expect(['PASS', 'FAIL', 'HUMAN-REQUIRED']).toContain(x.status)
  })

  it('#9 stays HUMAN-REQUIRED even when the claims review is recorded as approved', () => {
    const { report } = buildReleaseEvidence(REPO)
    const base = {
      root: REPO,
      counts: readRepo(IN.counts),
      manifest: readRepo(IN.manifest),
      matrix: readRepo(IN.publicMatrix),
      runs: [],
      xplat: [],
      reviewItems: [],
    } as unknown as Parameters<typeof evaluateDod>[0]
    const approved = evaluateDod({
      ...base,
      reviewStatus: { 'public-claim:release-claims': 'approved' },
    })
    expect(approved[8].status).toBe('HUMAN-REQUIRED')
    expect(approved[8].basis).toMatch(/approved/)
    // …and #5 cannot PASS without recorded runs, #7 cannot PASS without frozen runs.
    expect(approved[4].status).toBe('FAIL')
    expect(approved[6].status).toBe('FAIL')
    expect(report.definitionOfDone[8].status).toBe('HUMAN-REQUIRED')
  })

  it('every disclaimer surface named by #4 exists', () => {
    for (const f of DISCLAIMER_SURFACES) expect(fs.existsSync(path.join(REPO, f)), f).toBe(true)
  })
})

describe('figure drift (docs + presentation)', () => {
  const rules = figureRules(committed())
  const v = committed().vectors as {
    filesByClass: Record<string, number>
    vectorFiles: { total: number }
  }
  const std = v.filesByClass['published-standard-kat']
  const oracle = v.filesByClass['independent-oracle']

  it('accepts the generated values, in digits, words and deck HTML', () => {
    const ok = [
      `<span class="c">${std}</span><span><b>Published standard&#39;s own KAT</b>`,
      `${oracle} OpenSSL-oracle comparison`,
      `of the ${v.vectorFiles.total} vector files`,
    ].join('\n')
    expect(scanFigures(ok, 'deck.html', rules)).toEqual([])
  })

  it('SABOTAGE: a stale class count, total or native-check figure is drift', () => {
    const bad = [
      `<span class="c">${std + 1}</span><span><b>Published standard&#39;s own KAT</b>`,
      'thirty vector files',
      'Eighteen of the thirty vector files come from NIST ACVP-Server',
      '| 5 | 18 NIST ACVP-Server / 9 standard KAT (of 30) |',
      'the 976/815 native checks',
    ].join('\n')
    const ids = scanFigures(bad, 'deck.html', rules).map((f) => f.rule)
    expect(ids).toContain('figure-drift:standard-kat-files')
    expect(ids).toContain('figure-drift:vector-files-total')
    expect(ids).toContain('figure-drift:vector-files-of-total')
    expect(ids.filter((x) => x === 'figure-drift:native-checks')).toHaveLength(2)
  })

  it('reads hyphenated number words ("thirty-three") without matching their tail', () => {
    const f = scanFigures(`Eighteen of the thirty-three vector files`, 'script.md', rules)
    expect(f.map((x) => x.sentence)).toEqual(
      v.vectorFiles.total === 33 ? [] : [expect.stringContaining('says 33')]
    )
  })

  it('an inline release-evidence-allow comment clears a line', () => {
    const f = scanFigures(
      'the 976 native checks <!-- release-evidence-allow: history -->',
      'x.md',
      rules
    )
    expect(f).toEqual([])
  })
})

describe('release evidence — sabotage on a temp copy', () => {
  let tmp: string
  const COPY = [
    IN.counts,
    IN.manifest,
    IN.matrix,
    IN.publicMatrix,
    IN.waivers,
    IN.openGaps,
    IN.native,
    IN.runResults,
    IN.xplat,
    IN.reviews,
    IN.lm065Manifest,
    IN.lm065Status,
    IN.lm065Content,
    IN.workbenchSuite,
    'src/data/validation/mechanism-inventory.generated.json',
    'src/data/validation/capability-map.json',
    REPORT_JSON_REL,
    REPORT_MD_REL,
    'public/data/validation/coverage-matrix.md',
    'public/data/validation/coverage-matrix.html',
    '.prettierrc',
    ...DISCLAIMER_SURFACES,
  ]
  beforeEach(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'release-evidence-'))
    for (const rel of COPY) {
      const src = path.join(REPO, rel)
      if (!fs.existsSync(src)) continue
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true })
      fs.cpSync(src, path.join(tmp, rel), { recursive: true })
    }
    // Make the copy self-consistent whatever the state of the real tree (the
    // real tree's freshness is the test above): re-point the recorded input
    // hashes at the copied inputs, then write the report the copy generates.
    const t = (rel: string) => fs.readFileSync(path.join(tmp, rel), 'utf8')
    const matrix = JSON.parse(t(IN.publicMatrix)) as { inputs: Record<string, string> }
    for (const rel of Object.keys(matrix.inputs))
      matrix.inputs[rel] =
        rel === 'src/data/validation/testRegistry.ts'
          ? sha256(JSON.stringify(TEST_REGISTRY.map((x) => [x.id, x.engines, x.cases])))
          : sha256(t(rel))
    for (const rel of [IN.publicMatrix, IN.matrix])
      fs.writeFileSync(path.join(tmp, rel), JSON.stringify(matrix))
    const counts = JSON.parse(t(IN.counts)) as { manifestCanonicalSha256: string }
    counts.manifestCanonicalSha256 = sha256(JSON.stringify(JSON.parse(t(IN.manifest))))
    fs.writeFileSync(path.join(tmp, IN.counts), JSON.stringify(counts, null, 2) + '\n')
    const { json, md } = await formatReportFiles(tmp, buildReleaseEvidence(tmp).report)
    fs.writeFileSync(path.join(tmp, REPORT_JSON_REL), json)
    fs.writeFileSync(path.join(tmp, REPORT_MD_REL), md)
  }, 60000)
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

  it('the untouched copy passes', async () => {
    expect((await checkReleaseEvidence(tmp)).errors).toEqual([])
  }, 60000)

  it('SABOTAGE: a hand-edited number in the committed report fails', async () => {
    const p = path.join(tmp, REPORT_JSON_REL)
    const j = JSON.parse(fs.readFileSync(p, 'utf8'))
    j.vectors.nistReferenceSampleFiles += 1
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
    const { errors } = await checkReleaseEvidence(tmp)
    expect(errors.join('\n')).toMatch(/release-evidence\.json differs from a fresh generation/)
  }, 60000)

  it('SABOTAGE: a changed generated source makes the committed report stale', async () => {
    const p = path.join(tmp, IN.counts)
    const c = JSON.parse(fs.readFileSync(p, 'utf8'))
    c.nistReferenceSampleFileCount += 1
    fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n')
    const { errors } = await checkReleaseEvidence(tmp)
    expect(errors.join('\n')).toMatch(/release-evidence\.(json|md) differs/)
  }, 60000)

  it('SABOTAGE: an input changed without regenerating the matrix or counts is a named stale input', async () => {
    fs.appendFileSync(path.join(tmp, IN.waivers), '\n')
    const m = JSON.parse(fs.readFileSync(path.join(tmp, IN.manifest), 'utf8'))
    m.files[0].sha256 = '0'.repeat(64)
    fs.writeFileSync(path.join(tmp, IN.manifest), JSON.stringify(m, null, 2))
    const stale = staleInputs(tmp).join('\n')
    expect(stale).toMatch(
      /generated from src\/data\/validation\/coverage-waivers\.json .* run npm run gen:coverage-matrix/
    )
    expect(stale).toMatch(
      /validation-counts\.generated\.json was generated from a different .* run npm run gen:validation-counts/
    )
    // …and the check reports them first, without regenerating anything.
    const before = fs.readFileSync(path.join(tmp, IN.publicMatrix))
    const { errors } = await checkReleaseEvidence(tmp)
    expect(errors[0]).toMatch(/^stale input:/)
    expect(fs.readFileSync(path.join(tmp, IN.publicMatrix)).equals(before)).toBe(true)
  }, 60000)

  it('SABOTAGE: a published matrix that differs from the generated one fails', async () => {
    fs.appendFileSync(path.join(tmp, IN.publicMatrix), ' ')
    const { errors } = await checkReleaseEvidence(tmp)
    expect(errors.join('\n')).toMatch(/coverage-matrix\.json differs from/)
  }, 60000)

  it('SABOTAGE: a review record naming one person twice fails; two distinct people approve', () => {
    const { reviewItems } = buildReleaseEvidence(tmp)
    const item = reviewItems.find((i) => i.id === 'public-claim:release-claims')!
    const rec = {
      schema: 'pqctoday.validation-review/v1',
      item: item.id,
      subjectSha256: item.subjectSha256,
      author: 'Fixture Author',
      sourceVerification: {
        reviewer: 'Fixture Reviewer',
        date: '2026-09-20',
        decision: 'approved',
      },
      claimReview: { reviewer: 'Fixture Reviewer', date: '2026-09-20', decision: 'approved' },
      decision: 'approved',
    }
    const file = path.join(tmp, IN.reviews, 'fixture.review.json')
    fs.writeFileSync(file, JSON.stringify(rec))
    const bad = buildReleaseEvidence(tmp)
    expect(bad.reviewProblems.map((p) => p.problem).join()).toMatch(/two distinct reviewers/)
    expect(bad.report.reviews.items.find((i) => i.id === item.id)?.status).toBe('awaiting-review')

    rec.claimReview.reviewer = 'Second Fixture Reviewer'
    fs.writeFileSync(file, JSON.stringify(rec))
    const good = buildReleaseEvidence(tmp)
    expect(good.reviewProblems).toEqual([])
    expect(good.report.reviews.items.find((i) => i.id === item.id)?.status).toBe('approved')
    // Recording a review never changes the reviewed figures.
    expect(claimsSha256(good.report as never)).toBe(claimsSha256(bad.report as never))
    expect(good.report.definitionOfDone[8].status).toBe('HUMAN-REQUIRED')
  })

  it('SABOTAGE: removing the disclaimer from a surface flips §10.1 #4 to FAIL', () => {
    const f = path.join(tmp, DISCLAIMER_SURFACES[0])
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/<ValidationDisclaimer\b[^>]*\/>/g, ''))
    const d = buildReleaseEvidence(tmp).report.definitionOfDone[3]
    expect(d.status).toBe('FAIL')
    expect(d.basis).toContain(DISCLAIMER_SURFACES[0])
  })
})
