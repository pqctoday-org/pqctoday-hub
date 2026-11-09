// SPDX-License-Identifier: AGPL-3.0-only
//
// pkcs11LearnContent.test.ts — the teaching text of the PKCS#11 v3.2 Learn track, its quiz and
// its glossary must state what the standards state. Each check reads the text a learner sees
// and tests the concept (what is claimed, what is distinguished), not a particular wording.
//
// Facts used, with their sources:
//  - Profile objects (CKO_PROFILE, CKA_PROFILE_ID): OASIS PKCS #11 Profiles v3.0 (2020) and
//    PKCS #11 Specification v3.1 (2023) — both before v3.2.
//  - CKA_ALLOWED_MECHANISMS, CKA_TRUSTED, CKA_WRAP_WITH_TRUSTED: PKCS #11 Specification v2.40.
//  - Session states: PKCS #11 v3.2 section 3.3 (CK_STATE) and the Usage Guide section 2.6, which
//    says read-only SO sessions do not exist.
//  - SLH-DSA-SHA2-128s / 128f sizes: NIST FIPS 205, Table 2.
import { describe, it, expect } from 'vitest'
import { V32_LESSONS, AES_KW_INTEGRITY_NOTE } from './pkcs11LessonsV32'
import { QUIZZES } from './pkcs11Quiz'
import { TAG_GLOSSARY, TERM_BY_ID } from './pkcs11Glossary'
import { SLH_DSA_SIG_BYTES, SLH_DSA_PUB_BYTES } from '@/wasm/softhsm/constants'
import type { QuizQuestion } from '@/components/Playground/learnkit/QuizCard'

const lesson = (id: string) => {
  const l = V32_LESSONS.find((x) => x.id === id)
  if (!l) throw new Error(`no lesson "${id}"`)
  return l
}
const lessonText = (id: string) => {
  const l = lesson(id)
  return [l.setup, ...l.notes, l.whyItMatters].join(' ')
}
const BANKS = new Map(Object.entries(QUIZZES))
const quiz = (id: string): QuizQuestion[] => {
  const q = BANKS.get(id)
  if (!q) throw new Error(`no quiz "${id}"`)
  return q
}
const right = (q: QuizQuestion) => `${q.options[q.answer]} ${q.why}`
const fmt = (n: number) => n.toLocaleString('en-US')

describe('authenticated wrap (AES-KW and AES-GCM)', () => {
  const q = quiz('authenticated-wrap')[0]

  it('the correct quiz answer says both mechanisms protect wrapped-key integrity', () => {
    expect(q.options[q.answer]).toMatch(/AES-KW/)
    expect(q.options[q.answer]).toMatch(/AES-GCM/)
    expect(q.options[q.answer]).toMatch(/integrity/i)
  })

  it('no option claims AES-KW accepts a modified wrapped key as correct', () => {
    expect(right(q)).not.toMatch(/has no integrity protection/i)
    expect(q.options.filter((_, i) => i !== q.answer).join(' ')).toMatch(/no integrity protection/i)
  })

  it('teaches AES-KW determinism, GCM IV uniqueness and associated data as separate properties', () => {
    const text = lessonText('authenticated-wrap')
    expect(text).toMatch(/AES-KW is deterministic/i)
    expect(text).toMatch(/never repeats under one key/i)
    expect(text).toMatch(/associated data/i)
    expect(right(q)).toMatch(/deterministic/i)
    expect(right(q)).toMatch(/never repeats/i)
  })

  it('does not call either construction categorically the strongest', () => {
    expect(lessonText('authenticated-wrap')).not.toMatch(
      /strongest|always better|more secure than/i
    )
    expect(right(q)).not.toMatch(/strongest|always better|more secure than/i)
  })

  describe('AES-KW altered-blob step', () => {
    const steps = lesson('authenticated-wrap').steps
    const kwIdx = steps.findIndex((s) => /CKM_AES_KEY_WRAP/.test(s.op))
    const gcmWrapIdx = steps.findIndex((s) => /C_WrapKeyAuthenticated \(AES-GCM\)/.test(s.op))
    const gcmTamperIdx = steps.findIndex((s) => /tampered blob/.test(s.op))

    it('comes after the AES-GCM wrap, unwrap and tamper steps and wraps with AES-KW itself', () => {
      expect(gcmWrapIdx).toBeGreaterThanOrEqual(0)
      expect(gcmTamperIdx).toBeGreaterThan(gcmWrapIdx)
      expect(kwIdx).toBeGreaterThan(gcmTamperIdx)
      expect(steps[kwIdx].op).toMatch(/C_WrapKey \+ C_UnwrapKey/)
      expect(steps[kwIdx].label).toMatch(/AES-KW/)
      expect(steps[kwIdx].label).toMatch(/alter one byte/i)
    })

    it('expects a refusal of C_UnwrapKey with the return code measured on both engines', () => {
      const step = steps[kwIdx]
      expect(step.expect).toBe('refusal')
      expect(step.expectedRefusal?.operations).toEqual(['C_UnwrapKey'])
      // CKR_WRAPPED_KEY_INVALID, measured on the C++ and Rust engines.
      expect(step.expectedRefusal?.returnCodes).toEqual([0x110])
    })

    it('says the wrap carries an integrity check and that this shows the check only', () => {
      expect(AES_KW_INTEGRITY_NOTE).toMatch(/integrity check value/)
      expect(AES_KW_INTEGRITY_NOTE).toMatch(/unwrap is refused when the wrapped bytes were altered/)
      expect(AES_KW_INTEGRITY_NOTE).toMatch(
        /shows the check, not that the wrapped key is secret or authentic to a given sender/
      )
      expect(lessonText('authenticated-wrap')).toContain(AES_KW_INTEGRITY_NOTE)
    })

    it('no longer says the tamper demonstration is limited to the GCM path', () => {
      const text = lessonText('authenticated-wrap')
      expect(text).not.toMatch(/only on the GCM path|only the selected GCM path/i)
      expect(text).toMatch(/RFC 3394, section 2\.2\.3/)
    })
  })
})

describe('what is new in v3.2 versus what existed before', () => {
  it('profile discovery, mechanism pinning and trusted wrapping are not labelled as new in v3.2', () => {
    for (const id of [
      'whats-new',
      'policy-pinning',
      'inspecting-policy',
      'trust-wrapping-policy',
    ]) {
      expect(lesson(id).tag, id).not.toBe('New in v3.2')
    }
  })

  it('lessons built on calls and parameters that v3.1 lacks keep the label', () => {
    expect(lesson('hedged-signing').tag).toBe('New in v3.2')
    expect(lesson('authenticated-wrap').tag).toBe('New in v3.2')
  })

  it('the first lesson separates the existing profile object from the new validation indicator', () => {
    const text = lessonText('whats-new')
    expect(text).toMatch(/Profiles v3\.0 and specification v3\.1/)
    expect(text).toMatch(/v3\.2/)
  })

  it('the trust lesson says the two trusted-key attributes already existed in v2.40', () => {
    expect(lessonText('trust-wrapping-policy')).toMatch(
      /already defined in the PKCS #11 Base Specification Version 2\.40/
    )
  })

  it('the glossary dates the profile and policy attributes before v3.2', () => {
    expect(TAG_GLOSSARY.CKO_PROFILE.def).toMatch(/v3\.0 and specification v3\.1/)
    expect(TAG_GLOSSARY.CKA_PROFILE_ID.def).toMatch(/before v3\.2/)
    expect(TAG_GLOSSARY.CKA_ALLOWED_MECHANISMS.def).toMatch(/v2\.40/)
    expect(TAG_GLOSSARY.CKA_TRUSTED.def).toMatch(/v2\.40/)
    expect(TAG_GLOSSARY.CKA_WRAP_WITH_TRUSTED.def).toMatch(/v2\.40/)
    expect(TERM_BY_ID['object-class'].def).toMatch(/predate v3\.2/)
    expect(TERM_BY_ID['baseline-provider'].def).toMatch(/Profiles v3\.0/)
  })

  it('the quiz on profile discovery says profile objects existed before v3.2', () => {
    const q = quiz('whats-new')[0]
    expect(right(q)).toMatch(/already existed before v3\.2|already defined this discovery/)
  })
})

describe('SLH-DSA sizes', () => {
  const byId = (table: Record<number, number>) =>
    new Map(Object.entries(table).map(([k, v]) => [Number(k), v] as const))
  const SIG = byId(SLH_DSA_SIG_BYTES)
  const PUB = byId(SLH_DSA_PUB_BYTES)
  const sig128s = SIG.get(0x01) ?? NaN // SLH-DSA-SHA2-128s
  const sig128f = SIG.get(0x03) ?? NaN // SLH-DSA-SHA2-128f
  const pub128s = PUB.get(0x01) ?? NaN

  it('the hash-based-signature quiz names the 128s profile and its sizes from the shared table', () => {
    const q = quiz('hash-based-signatures')[0]
    expect(q.q).toContain('SLH-DSA-SHA2-128s')
    expect(q.q).toContain(`${pub128s}-byte public key`)
    expect(q.q).toContain(`${fmt(sig128s)}-byte signature`)
  })

  it('the explanation keeps the 128f figure separate and labelled', () => {
    const q = quiz('hash-based-signatures')[0]
    expect(q.why).toContain(`${fmt(sig128f)} for SHA2-128f`)
    expect(q.why).toContain(`${fmt(sig128s)} bytes for SHA2-128s`)
  })

  it('the lesson notes agree with the quiz and the table', () => {
    const text = lessonText('hash-based-signatures')
    expect(text).toContain(`${fmt(sig128s)}-byte signature`)
    expect(text).toContain(`${fmt(sig128f)} bytes`)
    expect(text).toContain(`${pub128s}-byte public key`)
  })
})

describe('session states in the glossary', () => {
  const def = TERM_BY_ID['session-state'].def
  const states = [
    'R/O Public Session',
    'R/O User Functions',
    'R/W Public Session',
    'R/W User Functions',
    'R/W SO Functions',
  ]

  it('lists the five basic states by their standard names', () => {
    for (const s of states) expect(def, s).toContain(s)
  })

  it('does not imply a read-only Security Officer state', () => {
    expect(def).not.toMatch(/R\/O SO|read-only SO (state|functions)/i)
    expect(def).toMatch(/read-only SO sessions do not exist/i)
  })

  it('distinguishes session state from per-operation authentication', () => {
    expect(def).toMatch(/CKA_ALWAYS_AUTHENTICATE/)
    expect(def).toMatch(/context-specific/i)
    expect(def).toMatch(/rather than the session/i)
  })
})

describe('signing migration capstone', () => {
  const text = lessonText('migration-capstone')

  it('scopes completion to local handles, not to a deployment cutover', () => {
    expect(text).toMatch(/local key-lifecycle sample, not a complete deployment cutover/i)
    expect(text).toMatch(/does not revoke trust/i)
  })

  it('separates signing and forgery risk from decryption and harvest-now-decrypt-later', () => {
    expect(text).toMatch(/signing and future forgery risk/i)
    expect(text).toMatch(/different migration consideration/i)
  })

  it('retires the legacy private key but keeps the legacy public key', () => {
    const steps = lesson('migration-capstone').steps
    const retire = steps.find((st) => st.op.startsWith('C_DestroyObject'))
    expect(retire?.op).toMatch(/legacy private key/i)
    expect(retire?.label).toMatch(/keep its public key/i)
    expect(text).toMatch(/retires only the legacy private key/i)
    expect(text).toMatch(/keeps the legacy public-key object/i)
    expect(text).not.toMatch(/deletes the legacy public-key object too/i)
  })

  it('keeps verification public keys and trust or time evidence for historical signatures', () => {
    expect(text).toMatch(/verification public key/i)
    expect(text).toMatch(/trust and time evidence/i)
    expect(text).toMatch(/must still be verified/i)
  })
})

describe('validation indicators versus module validation', () => {
  const text = lessonText('whats-new')

  it('does not treat a zero flag as proof that no module certificate exists', () => {
    expect(text).toMatch(/Zero does not establish the absence of a module certificate/)
  })

  it('does not treat a set flag as proof of product certification', () => {
    expect(text).toMatch(/a set flag does not establish product certification/)
  })

  it('points to the exact module, approved configuration, certificate and security policy', () => {
    expect(text).toMatch(/exact module/)
    expect(text).toMatch(/approved configuration/)
    expect(text).toMatch(/CMVP certificate and security policy/)
  })

  it('labels the sample build as sample behaviour, not a CMVP record', () => {
    expect(text).toMatch(/sample behaviour, not a CMVP record/)
  })
})

describe('random-byte quiz', () => {
  const q = quiz('digest-random')[0]

  it('rejects "outputs can never repeat" as a requirement and accepts deterministic internals', () => {
    expect(q.options[q.answer]).toMatch(/deterministic internals/i)
    expect(q.options[q.answer]).not.toMatch(/never repeat|can never|must differ/i)
    expect(q.options.some((o, i) => i !== q.answer && /never repeat/i.test(o))).toBe(true)
  })

  it('does not infer entropy quality or seeding from distinct outputs', () => {
    expect(q.why).toMatch(/do not establish unpredictability or validate seeding/i)
    expect(q.options.some((o, i) => i !== q.answer && /prove that the generator/i.test(o))).toBe(
      true
    )
  })

  it('points to generator assumptions, reseeding and entropy-source health tests', () => {
    expect(q.why).toMatch(/seed is kept secret/i)
    expect(q.why).toMatch(/reseed/i)
    expect(q.why).toMatch(/health tests/i)
  })

  it('presents two sample outputs as an illustration, not a conformance test', () => {
    expect(q.why).toMatch(/illustration, not a conformance test/i)
  })
})
