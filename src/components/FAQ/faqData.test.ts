// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { FAQ_DATA, PERSONA_FAQ_LEAD, personaLeadItems } from './faqData'
import type { PersonaId } from '@/data/learningPersonas'
import { MANIFESTS } from '../PKILearning/manifest/registry'
import { MODULE_TRACKS } from '../PKILearning/moduleData'
import { findLibraryItemByRef } from '@/data/libraryData'

// Legacy/short `/learn/<slug>` aliases that resolve outside the manifest-derived
// route set (kept in sync with PKILearningView's own ROUTE_ALIASES + the
// common-ground special path — see manifest/routes.test.ts for the sibling
// conformance check on the router side).
const LEARN_SLUG_ALIASES = ['mls', 'common-ground']
const VALID_LEARN_SLUGS = new Set<string>([...MANIFESTS.map((m) => m.id), ...LEARN_SLUG_ALIASES])

// Non-`/learn` top-level routes the FAQ deep-links into (see App.tsx).
const VALID_TOP_LEVEL_ROUTES = new Set<string>([
  '/learn',
  '/timeline',
  '/algorithms',
  '/library',
  '/playground',
  '/openssl',
  '/threats',
  '/leaders',
  '/compliance',
  '/changelog',
  '/migrate',
  '/about',
  '/assess',
  '/report',
  '/business',
  '/faq',
  '/terms',
  '/editorial-independence',
  '/sponsor',
  '/explore',
  '/patents',
  '/revisions',
  '/simulation',
])

describe('FAQ_DATA deep links', () => {
  const allItems = FAQ_DATA.flatMap((cat) => cat.items)

  it('has questions in every category', () => {
    for (const cat of FAQ_DATA) {
      expect(cat.items.length, `category "${cat.id}" has no questions`).toBeGreaterThan(0)
    }
  })

  it('every /learn/<slug> deep link resolves to a real module manifest', () => {
    for (const item of allItems) {
      if (!item.deepLink.startsWith('/learn/')) continue
      const slug = item.deepLink.slice('/learn/'.length).split('?')[0]
      expect(
        VALID_LEARN_SLUGS.has(slug),
        `dead /learn link "${item.deepLink}" on question "${item.question}"`
      ).toBe(true)
    }
  })

  it('every non-/learn deep link resolves to a real top-level route', () => {
    for (const item of allItems) {
      if (item.deepLink.startsWith('/learn/')) continue
      const path = item.deepLink.split('?')[0]
      expect(
        VALID_TOP_LEVEL_ROUTES.has(path),
        `unknown route "${item.deepLink}" on question "${item.question}"`
      ).toBe(true)
    }
  })

  it('has no dead /library?ref= links against the currently-wired library CSV', () => {
    for (const item of allItems) {
      if (!item.deepLink.startsWith('/library?ref=')) continue
      const ref = new URLSearchParams(item.deepLink.split('?')[1]).get('ref')
      expect(
        ref ? findLibraryItemByRef(ref) : undefined,
        `dead /library?ref= link "${item.deepLink}" on question "${item.question}"`
      ).toBeTruthy()
    }
  })
})

describe('PERSONA_FAQ_LEAD — B+ remediation 4.1', () => {
  const allQuestions = new Set(FAQ_DATA.flatMap((c) => c.items).map((i) => i.question))

  it('every lead question resolves to a real FAQ item, verbatim', () => {
    // This is the constraint that keeps the lead block a REORDERING of the page
    // rather than a second, divergent FAQ that can promise answers the page
    // does not contain.
    for (const [persona, questions] of Object.entries(PERSONA_FAQ_LEAD)) {
      for (const q of questions) {
        expect(allQuestions.has(q), `${persona}: "${q}" is not in FAQ_DATA`).toBe(true)
      }
    }
  })

  it('gives every persona exactly three, and resolves all of them', () => {
    for (const persona of Object.keys(PERSONA_FAQ_LEAD) as PersonaId[]) {
      expect(PERSONA_FAQ_LEAD[persona]).toHaveLength(3)
      expect(personaLeadItems(persona)).toHaveLength(3)
    }
  })

  it('leads with nothing when no role is chosen', () => {
    expect(personaLeadItems(null)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Scope and wording of specific answers. These check the concept each answer
// must keep distinct (construction vs policy, idealized vs operational,
// adopted requirement vs prediction), not the exact sentences.
// ---------------------------------------------------------------------------

const answerOf = (question: string): string => {
  const item = FAQ_DATA.flatMap((c) => c.items).find((i) => i.question === question)
  if (!item) throw new Error(`FAQ question not found: ${question}`)
  return item.answer
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data')

/** The algorithm reference CSV the loaders would actually pick: newest date,
 *  then highest revision number (numeric, so r10 sorts after r9). */
function wiredAlgorithmReference(): Record<string, string>[] {
  const pattern = /^pqc_complete_algorithm_reference_\d{8}(?:_r\d+)?\.csv$/
  const files = readdirSync(dataDir)
    .filter((f) => pattern.test(f))
    .map((f) => {
      const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      return {
        f,
        date: m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])).getTime() : 0,
        rev: m?.[4] ? parseInt(m[4], 10) : 0,
      }
    })
    .sort((a, b) => b.date - a.date || b.rev - a.rev)
  expect(files.length).toBeGreaterThan(0)
  const text = readFileSync(join(dataDir, files[0].f), 'utf-8')
  return Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  }).data
}

describe('NIST security categories', () => {
  it('state each ML-KEM and ML-DSA parameter set in the category the reference data gives it', () => {
    const expected = new Map<string, number>()
    for (const row of wiredAlgorithmReference()) {
      if (/^ml-(kem|dsa)-\d+$/.test(row.algorithm_id)) {
        expected.set(row.algorithm_id.toUpperCase(), Number(row.nist_security_level))
      }
    }
    expect(expected.size).toBe(6)

    const answer = answerOf('What NIST security levels exist?')
    const stated = new Map<string, number>()
    const sentence = /((?:ML-(?:KEM|DSA)-\d+(?:, | and )?)+) are categories ((?:\d(?:, | and )?)+)/g
    for (const m of answer.matchAll(sentence)) {
      const names = m[1].split(/, | and /).filter(Boolean)
      const levels = m[2].split(/, | and /).filter(Boolean)
      expect(names.length).toBe(levels.length)
      names.forEach((n, i) => stated.set(n, Number(levels[i])))
    }
    expect(Object.fromEntries(stated)).toEqual(Object.fromEntries(expected))
  })

  it('does not present a category as a deployment preference', () => {
    const answer = answerOf('What NIST security levels exist?')
    expect(answer).not.toMatch(/most deployments use/i)
  })
})

describe('hybrid cryptography answers', () => {
  it('qualify the either-component-unbroken claim with the combiner and the acceptance policy', () => {
    const answer = answerOf('What is a hybrid cryptographic approach?')
    expect(answer).toMatch(/combiner/i)
    expect(answer).toMatch(/classical-only|fall ?back|downgrad/i)
    expect(answer).toMatch(/authentication/i)
    expect(answer).toMatch(/verifiers require both|require both/i)
  })

  it('separate IPsec compatibility from post-quantum protection', () => {
    const answer = answerOf('What PQC algorithms work for VPN/IPsec?')
    expect(answer).toMatch(/unless both peers/i)
    expect(answer).toMatch(/compatibility, not post-quantum protection/i)
    expect(answer).not.toMatch(/to ensure backward compatibility and defense in depth/i)
  })
})

describe("Grover's algorithm answers", () => {
  const grover = FAQ_DATA.flatMap((c) => c.items).filter((i) => /Grover/.test(i.answer))

  it('exist for both the symmetric-encryption and the RSA-versus-AES questions', () => {
    const questions = grover.map((i) => i.question)
    expect(questions).toContain("How does Grover's algorithm affect symmetric encryption?")
    expect(questions).toContain('Why is RSA vulnerable but AES is not?')
  })

  it('label any halved key length as an idealized figure', () => {
    for (const item of grover) {
      if (/\b(?:64|128)-bit (?:security|key)|2\^(?:64|128)/.test(item.answer)) {
        expect(item.answer, `"${item.question}" quotes a halved key length`).toMatch(/idealized/i)
      }
    }
  })

  it('keep the key-size recommendation separate from the idealized count', () => {
    for (const q of ["How does Grover's algorithm affect symmetric encryption?"]) {
      const answer = answerOf(q)
      expect(answer).toMatch(/policy choice/i)
      expect(answer).not.toMatch(/AES-128 drops to 64-bit/i)
      expect(answer).not.toMatch(/AES-128 may need to be phased out/i)
    }
  })
})

describe('ETSI TS 103 744 answer', () => {
  const answer = answerOf('What is ETSI TS 103 744?')

  it('describes hybrid key establishment, not telecom migration guidance', () => {
    expect(answer).toMatch(/hybrid key/i)
    expect(answer).not.toMatch(
      /migration guidance for adopting post-quantum cryptography in telecom/i
    )
  })

  it('points telecom migration questions to a separate reference the library holds', () => {
    expect(answer).toMatch(/GSMA PQ\.03/)
    expect(findLibraryItemByRef('GSMA PQ.03 PQC Guidelines')).toBeTruthy()
  })
})

describe('Japan, Singapore and Australia timeline answer', () => {
  const answer = answerOf('What PQC timelines exist for Japan, Singapore, and Australia?')

  it('gives each country its own dated milestones and authority', () => {
    expect(answer).toMatch(/Japan[^.]*2035/)
    expect(answer).toMatch(/31 March 2027/)
    expect(answer).toMatch(/1 January 2028/)
    expect(answer).toMatch(/31 December 2031/)
    expect(answer).toMatch(/Information Security Manual/)
    expect(answer).toMatch(/beyond 2030/)
    expect(answer).toMatch(/Monetary Authority of Singapore/)
  })

  it('does not group all three as less prescriptive on deadlines', () => {
    expect(answer).not.toMatch(/less prescriptive on deadlines/i)
  })
})

describe('regulatory obligations that are not yet adopted', () => {
  it('eIDAS 2.0 separates the regulation text from the EU recommendation', () => {
    const answer = answerOf("What is eIDAS 2.0's PQC requirement?")
    expect(answer).toMatch(/2024\/1183/)
    expect(answer).toMatch(/2024\/1101/)
    expect(answer).not.toMatch(/it requires crypto agility and quantum-readiness/i)
  })

  it('NERC-CIP, Common Criteria and the energy sector do not state future duties as settled', () => {
    const nerc = answerOf("What is NERC-CIP's relevance to PQC?")
    const cc = answerOf("What is Common Criteria's role in PQC?")
    const energy = answerOf('What is the energy sector PQC migration?')
    for (const answer of [nerc, cc, energy]) {
      expect(answer).not.toMatch(/will (?:increasingly )?require/i)
      expect(answer).not.toMatch(/future evaluations will/i)
    }
    expect(nerc).toMatch(/CIP-012/)
    expect(cc).toMatch(/scheme/i)
    expect(cc).not.toMatch(/\b31 member/i)
  })

  it('ISO/SAE 21434 is described as technology-neutral, not as a crypto-agility mandate', () => {
    const standard = answerOf('What is ISO/SAE 21434?')
    expect(standard).toMatch(/does not prescribe/i)
    expect(standard).not.toMatch(/It mandates crypto agility/i)
    const automotive = answerOf('How does the automotive industry approach PQC?')
    expect(automotive).not.toMatch(/requires cryptographic agility/i)
    expect(automotive).toMatch(/design guidance/i)
  })
})

describe('operations, payments and secrets answers', () => {
  it('certificate rotation lists separate drivers and not a generic CRL-size cause', () => {
    const answer = answerOf('What PQC operations tasks should IT teams plan?')
    expect(answer).not.toMatch(/larger revocation lists/i)
    for (const driver of [
      /policy/i,
      /compromise/i,
      /validity/i,
      /transition/i,
      /number of certificates/i,
    ]) {
      expect(answer).toMatch(driver)
    }
  })

  it('EMV keeps symmetric DUKPT derivation apart from key injection and card authentication', () => {
    const answer = answerOf('What is the PQC impact on payment systems (EMV)?')
    expect(answer).not.toMatch(/DUKPT terminal key injection must migrate to ML-KEM/i)
    expect(answer).not.toMatch(/FN-DSA-512 is preferred/i)
    expect(answer).toMatch(/DUKPT[\s\S]*using symmetric cryptography/i)
    expect(answer).toMatch(/injected or loaded remotely|key injection/i)
    expect(answer).toMatch(/Card authentication/)
  })

  it('Vault separates symmetric mechanisms, secret sharing and signatures, and labels proposals', () => {
    const answer = answerOf("What is HashiCorp Vault's PQC migration path?")
    expect(answer).not.toMatch(/shamir shares also need PQC-compatible encryption/i)
    expect(answer).toMatch(/Shamir/)
    expect(answer).toMatch(/does not itself use public-key encryption/i)
    expect(answer).toMatch(/proposed integration/i)
  })

  it('database encryption shows the unchanged symmetric case next to the exposed asymmetric wrapper', () => {
    const answer = answerOf('What database encryption changes need PQC?')
    expect(answer).not.toMatch(/master key wrapping from RSA to ML-KEM/i)
    expect(answer).toMatch(/symmetric/i)
    expect(answer).toMatch(/stays unchanged|needs no algorithm change/i)
    expect(answer).toMatch(/asymmetric/i)
  })
})

describe('library and protocol-stack answers', () => {
  it('loading an OpenSSL provider is not equated with automatic application support', () => {
    const answer = answerOf('What is the OpenSSL provider architecture for PQC?')
    expect(answer).not.toMatch(/automatically gain access/i)
    expect(answer).toMatch(/3\.5/)
    expect(answer).toMatch(/handshake test|negotiated/i)
  })

  it('Linux TLS setup names versions and hybrid groups rather than cipher suites', () => {
    const answer = answerOf('How do you configure PQC TLS on Linux?')
    expect(answer).not.toMatch(/hybrid PQC cipher suites/i)
    expect(answer).toMatch(/RHEL 10\.1/)
    expect(answer).toMatch(/negotiated group/i)
  })

  it('channel security is not said to prevent federated-learning poisoning', () => {
    const answer = answerOf('How does PQC protect AI systems?')
    expect(answer).not.toMatch(/channel security preventing model poisoning/i)
    expect(answer).toMatch(/does not prevent model poisoning/i)
    expect(answer).toMatch(/aggregation/i)
  })

  it('developer library advice separates research libraries from production evaluation', () => {
    const answer = answerOf('What PQC libraries should developers use?')
    expect(answer).toMatch(/production/i)
    expect(answer).toMatch(/prototypes/i)
    expect(answer).toMatch(/unmaintained/i)
    expect(answer).toMatch(/validat/i)
    expect(answer).not.toMatch(/pqcrypto for Rust/)
  })

  it('the learning-modules answer names exactly the catalogue tracks (it once listed an Executive track and left out Governance & Risk)', () => {
    const answer = answerOf('How many learning modules does PQC Today offer?')
    for (const { track } of MODULE_TRACKS) expect(answer).toContain(track)
    expect(answer).not.toContain('Executive')
    // The answer spells the count out; a tenth track means the answer needs rewording.
    expect(MODULE_TRACKS).toHaveLength(9)
    expect(answer).toContain('nine tracks')
  })
})
