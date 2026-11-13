// SPDX-License-Identifier: AGPL-3.0-only
//
// Driftguards for the construction layer (cryptoConstructions.ts, added
// 2026-11-13). Check ids K1–K10 follow the construction-layer plan. They pin:
//   - the registry is internally consistent (algorithms, outlook, successions);
//   - every value in the three construction columns resolves;
//   - rows agree with the constructions they claim (outlook and algorithms);
//   - every construction is used by an active row;
//   - every proof resolves to an active Library row a reader can open freely.
// Per-row proof (a cited document names the construction) is checked by the
// private proof matcher, which reads the cached documents.

import { describe, expect, it } from 'vitest'
import {
  CRYPTO_CONSTRUCTIONS,
  CYCLONEDX_PRIMITIVES,
  HYBRID_CLASSICAL_HALF_ELSEWHERE,
  NO_FAMILY_EXEMPT,
  PQC_OUTLOOK_LABEL,
  STANDARDS_STATUS_LABEL,
  getConstruction,
  instantiationsOf,
  isKnownConstruction,
  type CryptoConstruction,
} from './cryptoConstructions'
import { CRYPTO_MECHANISMS, getMechanismFamily, isKnownMechanism } from './cryptoMechanisms'
import { ALGORITHM_EXPLANATIONS } from './algorithmExplanations'
import { loadIndustryLandscape } from './industryLandscapeData'
import { libraryData } from './libraryData'
import { MANIFEST_BY_ID } from '../components/PKILearning/manifest/registry'
import algorithmsGlossary from './glossary/algorithms.json'
import conceptsGlossary from './glossary/concepts.json'
import protocolsGlossary from './glossary/protocols.json'
import standardsGlossary from './glossary/standards.json'
import organizationsGlossary from './glossary/organizations.json'
import pkcs11Glossary from './glossary/pkcs11.json'

const { useCases, standards } = loadIndustryLandscape()

/** Symmetric families: valid on the PQC side because they stay and are only re-sized. */
const SYMMETRIC_FAMILIES = new Set(['AES', 'SHA', 'SNOW3G', 'ZUC', 'ChaCha20', 'Ascon', '3DES'])

const libraryById = new Map(libraryData.map((r) => [r.referenceId, r]))

const glossaryTerms = new Set(
  [
    algorithmsGlossary,
    conceptsGlossary,
    protocolsGlossary,
    standardsGlossary,
    organizationsGlossary,
    pkcs11Glossary,
  ].flatMap((g) => (Array.isArray(g) ? g : []).map((e: { term: string }) => e.term))
)

function allProofRefs(c: CryptoConstruction): string[] {
  return [
    ...c.proofRefs,
    ...instantiationsOf(c).flatMap((x) => x.inst.proofRefs),
    ...(c.successions ?? []).flatMap((s) => s.proofRefs),
  ]
}

describe('construction layer driftguards', () => {
  it('construction ids are unique and CSV-safe', () => {
    const ids = CRYPTO_CONSTRUCTIONS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id, id).toMatch(/^[A-Za-z0-9][A-Za-z0-9-]*$/)
  })

  it('K1: every value in the construction columns resolves to a construction', () => {
    const bad: string[] = []
    for (const uc of useCases)
      for (const id of [...uc.classicalConstructions, ...uc.pqcConstructions])
        if (!isKnownConstruction(id)) bad.push(`${uc.useCaseId}: ${id}`)
    for (const st of standards)
      for (const id of st.constructionsReferenced)
        if (!isKnownConstruction(id)) bad.push(`${st.standardId}: ${id}`)
    expect(bad).toEqual([])
  })

  it('K2: instantiation algorithms resolve; empty only with a stated reason; builtOn is acyclic', () => {
    for (const c of CRYPTO_CONSTRUCTIONS) {
      for (const { side, inst } of instantiationsOf(c)) {
        for (const a of inst.algorithms)
          expect(isKnownMechanism(a), `${c.id} ${side}: unknown algorithm ${a}`).toBe(true)
        if (inst.algorithms.length === 0)
          expect(
            NO_FAMILY_EXEMPT[c.id],
            `${c.id} ${side}: empty algorithms without a reason`
          ).toBeTruthy()
        expect(inst.proofRefs.length, `${c.id} ${side}: no proof`).toBeGreaterThan(0)
      }
      for (const b of c.builtOn ?? [])
        expect(isKnownConstruction(b), `${c.id} builtOn ${b}`).toBe(true)
    }
    for (const id of Object.keys(NO_FAMILY_EXEMPT)) expect(isKnownConstruction(id), id).toBe(true)
    const visit = (id: string, path: string[]) => {
      expect(path.includes(id), `builtOn cycle: ${[...path, id].join(' → ')}`).toBe(false)
      for (const b of getConstruction(id)?.builtOn ?? []) visit(b, [...path, id])
    }
    for (const c of CRYPTO_CONSTRUCTIONS) visit(c.id, [])
  })

  it('K3: CycloneDX primitive is in the 1.7 enum; "other" states a reason', () => {
    for (const c of CRYPTO_CONSTRUCTIONS) {
      expect(CYCLONEDX_PRIMITIVES as readonly string[], c.id).toContain(c.cycloneDxPrimitive)
      if (c.cycloneDxPrimitive === 'other') expect(c.otherReason, c.id).toBeTruthy()
    }
  })

  it('K4: the PQC outlook matches the instantiations and successions', () => {
    for (const c of CRYPTO_CONSTRUCTIONS) {
      const has = (k: 'classical' | 'pqc' | 'hybrid') => (c[k]?.length ?? 0) > 0
      switch (c.outlook) {
        case 'stays-both':
          expect(has('classical') && (has('pqc') || has('hybrid')), c.id).toBe(true)
          break
        case 'replaced':
          expect(
            (c.successions ?? []).filter((x) => x.relation === 'replaced-by').length,
            `${c.id}: replaced without a successor`
          ).toBeGreaterThan(0)
          expect(has('classical'), c.id).toBe(true)
          break
        case 'extended':
          expect(
            (c.successions ?? []).filter((x) => x.relation === 'extended-by').length,
            `${c.id}: extended without the part that extends it`
          ).toBeGreaterThan(0)
          expect(has('classical'), c.id).toBe(true)
          break
        case 'bridge':
          expect(has('hybrid'), `${c.id}: bridge without a hybrid instantiation`).toBe(true)
          break
        case 'pqc-native':
          expect(has('classical'), `${c.id}: pqc-native with a classical instantiation`).toBe(false)
          expect(has('pqc') || has('hybrid'), c.id).toBe(true)
          break
        case 'no-successor-yet':
          expect(c.noSuccessorReason, c.id).toBeTruthy()
          expect(c.noSuccessorCheckedOn, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          break
      }
      if (c.outlook !== 'replaced' && c.outlook !== 'extended')
        expect(c.successions ?? [], c.id).toEqual([])
      for (const x of c.successions ?? [])
        expect(x.relation, `${c.id} → ${x.to}`).toBe(
          c.outlook === 'extended' ? 'extended-by' : 'replaced-by'
        )
      // A PQC instantiation names only PQC families or symmetric families.
      for (const inst of c.pqc ?? [])
        for (const a of inst.algorithms) {
          const fam = getMechanismFamily(a)
          expect(
            fam && (!fam.classical || SYMMETRIC_FAMILIES.has(a)),
            `${c.id}: classical asymmetric ${a} in a pqc instantiation`
          ).toBe(true)
        }
      // A hybrid instantiation needs both halves, unless the construction is
      // listed with the reason its classical half is not an algorithm family.
      for (const inst of c.hybrid ?? []) {
        const fams = inst.algorithms.map((a) => getMechanismFamily(a))
        const hasPq = fams.some((f) => f && !f.classical)
        const hasClassical = fams.some((f) => f && f.classical)
        expect(hasPq, `${c.id}: hybrid instantiation without a PQC algorithm`).toBe(true)
        expect(
          hasClassical || Boolean(HYBRID_CLASSICAL_HALF_ELSEWHERE[c.id]),
          `${c.id}: hybrid without a classical half`
        ).toBe(true)
      }
    }
  })

  it('K4b: successions point at real constructions and form no cycle', () => {
    for (const c of CRYPTO_CONSTRUCTIONS)
      for (const s of c.successions ?? []) {
        const to = getConstruction(s.to)
        expect(to, `${c.id} → ${s.to}`).toBeDefined()
        expect(to?.outlook, `${c.id} → ${s.to}: successor is itself being replaced`).not.toBe(
          'replaced'
        )
        expect(s.context, `${c.id} → ${s.to}: no context`).toBeTruthy()
        expect(s.proofRefs.length, `${c.id} → ${s.to}: no proof`).toBeGreaterThan(0)
      }
  })

  it('K4c: a use case running a replaced construction targets its successor', () => {
    const gaps: string[] = []
    for (const uc of useCases)
      for (const id of uc.classicalConstructions) {
        const c = getConstruction(id)
        if (c?.outlook !== 'replaced' || uc.pqcMechanisms.length === 0) continue
        const successors = new Set((c.successions ?? []).map((s) => s.to))
        if (!uc.pqcConstructions.some((p) => successors.has(p)))
          gaps.push(`${uc.useCaseId}: ${id} without one of ${[...successors].join(', ')}`)
      }
    expect(gaps).toEqual([])
  })

  it('K5: construction columns agree with each construction’s outlook', () => {
    const bad: string[] = []
    for (const uc of useCases) {
      for (const id of uc.classicalConstructions)
        if (getConstruction(id)?.outlook === 'pqc-native')
          bad.push(`${uc.useCaseId}: ${id} is new for PQC, not run today`)
      for (const id of uc.pqcConstructions) {
        const o = getConstruction(id)?.outlook
        if (o === 'replaced' || o === 'no-successor-yet')
          bad.push(`${uc.useCaseId}: ${id} (${o}) cannot be a PQC target`)
      }
    }
    expect(bad).toEqual([])
  })

  // An instantiation with no algorithm family (NO_FAMILY_EXEMPT, e.g. a
  // preshared-key construction) is covered by any row: it needs no algorithm.
  it('K6: each claimed construction has an instantiation the row’s algorithms cover', () => {
    const bad: string[] = []
    for (const uc of useCases) {
      const classical = new Set(uc.classicalMechanisms)
      const pqc = new Set(uc.pqcMechanisms)
      const all = new Set([...classical, ...pqc])
      for (const id of uc.classicalConstructions) {
        const c = getConstruction(id)
        if (!c) continue
        const ok = [...(c.classical ?? []), ...(c.hybrid ?? [])].some((inst) =>
          inst.algorithms.every((a) => all.has(a))
        )
        if (!ok) bad.push(`${uc.useCaseId}: classical ${id} needs one of its algorithm sets`)
      }
      for (const id of uc.pqcConstructions) {
        const c = getConstruction(id)
        if (!c) continue
        const ok = [...(c.pqc ?? []), ...(c.hybrid ?? [])].some((inst) =>
          inst.algorithms.every((a) => {
            const fam = getMechanismFamily(a)
            return fam && (fam.classical ? all.has(a) : pqc.has(a))
          })
        )
        if (!ok) bad.push(`${uc.useCaseId}: PQC ${id} needs one of its algorithm sets`)
      }
    }
    expect(bad).toEqual([])
  })

  it('K7: every construction is used by an active row, directly or inside one a use case names', () => {
    // Same rule as constructionUsage(): a standards row counts directly, and
    // "inside" propagates through builtOn from use-case usage only, so every
    // construction that passes here has a non-zero count in the UI.
    const named = useCases.flatMap((u) => [...u.classicalConstructions, ...u.pqcConstructions])
    const used = new Set([...named, ...standards.flatMap((s) => s.constructionsReferenced)])
    const seen = new Set<string>()
    const stack = [...new Set(named)]
    while (stack.length > 0) {
      const id = stack.pop()!
      if (seen.has(id)) continue
      seen.add(id)
      for (const b of getConstruction(id)?.builtOn ?? []) {
        used.add(b)
        stack.push(b)
      }
    }
    const unused = CRYPTO_CONSTRUCTIONS.map((c) => c.id).filter((id) => !used.has(id))
    expect(unused).toEqual([])
  })

  it('K8: every proof resolves to an active Library row that is not a paid document', () => {
    // libraryData holds ACTIVE rows only and marks paid ones. The stricter
    // rule (access_type classified, and never registration-required or
    // blocked) needs the raw CSV and is checked by the private validator.
    const bad: string[] = []
    for (const c of CRYPTO_CONSTRUCTIONS)
      for (const ref of new Set(allProofRefs(c))) {
        const row = libraryById.get(ref)
        if (!row) bad.push(`${c.id}: ${ref} is not an active Library row`)
        else if (row.accessType === 'paid') bad.push(`${c.id}: ${ref} is paid`)
      }
    expect(bad).toEqual([])
  })

  // Row-level: a row is flagged only when EVERY PQC construction it names is
  // still research or study; one standardised construction can carry the claim.
  it('K9: a research or study PQC construction is not claimed as standardised', () => {
    const bad: string[] = []
    for (const uc of useCases) {
      if (uc.pqcClaimBasis !== 'standardised' || uc.pqcConstructions.length === 0) continue
      const allImmature = uc.pqcConstructions.every((id) => {
        const c = getConstruction(id)
        const statuses = [...(c?.pqc ?? []), ...(c?.hybrid ?? [])].map((i) => i.status)
        return statuses.length > 0 && statuses.every((s) => s === 'study' || s === 'research')
      })
      if (allImmature) bad.push(uc.useCaseId)
    }
    expect(bad).toEqual([])
  })

  it('K10: every construction has a complete plain-language explanation', () => {
    for (const c of CRYPTO_CONSTRUCTIONS) {
      const e = c.explain
      expect(e.plain.length, `${c.id}: plain`).toBeGreaterThan(60)
      expect(e.whyItMattersForPqc.length, `${c.id}: why`).toBeGreaterThan(30)
      expect(e.diagram.inputs.length, `${c.id}: diagram inputs`).toBeGreaterThan(0)
      expect(e.diagram.outputs.length, `${c.id}: diagram outputs`).toBeGreaterThan(0)
      if (e.glossaryTerm)
        expect(glossaryTerms.has(e.glossaryTerm), `${c.id}: glossary ${e.glossaryTerm}`).toBe(true)
      if (e.learnModuleId)
        expect(MANIFEST_BY_ID[e.learnModuleId], `${c.id}: module ${e.learnModuleId}`).toBeDefined()
    }
  })

  it('K10: every algorithm family has a plain-language explanation (D6)', () => {
    const families = CRYPTO_MECHANISMS.map((m) => m.family)
    expect(Object.keys(ALGORITHM_EXPLANATIONS).sort()).toEqual([...families].sort())
    for (const [fam, e] of Object.entries(ALGORITHM_EXPLANATIONS)) {
      expect(e.plain.length, fam).toBeGreaterThan(60)
      expect(e.whyItMattersForPqc.length, fam).toBeGreaterThan(20)
      if (e.glossaryTerm)
        expect(glossaryTerms.has(e.glossaryTerm), `${fam}: ${e.glossaryTerm}`).toBe(true)
    }
  })

  it('every outlook and status has a reader-facing label', () => {
    for (const c of CRYPTO_CONSTRUCTIONS) {
      expect(PQC_OUTLOOK_LABEL[c.outlook]).toBeTruthy()
      for (const { inst } of instantiationsOf(c))
        expect(STANDARDS_STATUS_LABEL[inst.status]).toBeTruthy()
    }
  })
})
