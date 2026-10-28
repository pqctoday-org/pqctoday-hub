// SPDX-License-Identifier: AGPL-3.0-only
//
// Lesson 5 (An honest LMS) says what the refusal shows: this openssl build has no LMS, because
// OpenSSL 3.6 turns LMS off unless it is built with enable-lms. The OpenSSL 3.6 documentation
// (EVP_PKEY-LMS) says: "The OpenSSL providers only support LMS signature verification" and
// "LMS support is disabled by default at compile-time. To enable it, specify the enable-lms build
// configuration option." The LMS panel's three actions all run in the bundled WebAssembly engine.
// The glossary and lesson 10 describe the same build: the PKCS#11 provider is loaded and lists
// composite ML-DSA algorithms, and no FIPS provider is loaded.
import { describe, it, expect } from 'vitest'
import { OPENSSL_LESSONS } from './opensslLessons'
import { OPENSSL_QUIZZES } from './opensslQuiz'
import { TAG_GLOSSARY, TERMS } from './opensslGlossary'

const lesson5 = OPENSSL_LESSONS.find((l) => l.id === 'honest-lms')!
const lesson10 = OPENSSL_LESSONS.find((l) => l.id === 'config-files')!
const term = (id: string) => TERMS.find((t) => t.id === id)?.def ?? ''

describe('OpenSSL Studio lesson 5: what the LMS refusal shows', () => {
  it('quotes the OpenSSL 3.6 documentation that LMS is off unless built with enable-lms', () => {
    expect(lesson5.setup).toContain(
      '"LMS support is disabled by default at compile-time. To enable it, specify the enable-lms build configuration option."'
    )
    expect(lesson5.setup).toContain(
      "This Studio's openssl build was not configured with enable-lms."
    )
    // the maintainer's words stay, but only as the reason for generation and signing
    expect(lesson5.setup).toContain('"this should be done in hardware not software"')
  })

  it('says a build with enable-lms can verify and this one cannot', () => {
    const notes = lesson5.notes.join(' ')
    expect(notes).toContain('A build configured with enable-lms can verify LMS signatures')
    expect(notes).toContain('"only support LMS signature verification"')
    expect(notes).toContain('This build cannot, because it was not configured with enable-lms.')
    expect(notes).not.toContain('pkeyutl -verify against an LMS public key works')
    expect(notes).not.toContain('Verification IS supported by the CLI')
  })

  it('says the error is the one any build without LMS prints, not a policy decision', () => {
    const notes = lesson5.notes.join(' ')
    expect(notes).toContain('the error any OpenSSL build prints when LMS was not compiled in')
    expect(notes).toContain('a missing option in this build, not a policy decision')
  })

  it('says the panel generates, signs and verifies in WebAssembly, and the command preview is for reference', () => {
    const notes = lesson5.notes.join(' ')
    expect(notes).toContain('generates, signs and verifies with a bundled WebAssembly engine')
    expect(notes).toContain('none of its three actions runs through the openssl CLI')
    expect(notes).toContain('The Command Preview it shows for LMS is for reference only.')
    expect(notes).not.toContain('only routes -verify through the real openssl CLI')
    expect(lesson5.blurb).toContain('generates, signs and verifies via a separate WASM engine')
  })

  it('no longer calls the refusal proof of a deliberate OpenSSL boundary', () => {
    expect(lesson5.whyItMatters).not.toContain('IS the proof')
    expect(lesson5.whyItMatters).not.toContain('drew this boundary deliberately')
    expect(lesson5.whyItMatters).toContain('shows what this openssl build lacks')
    const quiz = OPENSSL_QUIZZES['honest-lms'][0]
    expect(quiz.options.join(' ')).not.toContain(
      "proving OpenSSL genuinely doesn't support LMS keygen"
    )
    expect(quiz.options[quiz.answer]).toContain('this openssl build cannot generate an LMS key')
  })

  it('the glossary entry for LMS says verification needs enable-lms', () => {
    expect(TAG_GLOSSARY['LMS'].def).toContain(
      'only in a build configured with enable-lms (off by default)'
    )
  })
})

describe('OpenSSL Studio glossary and lesson 10: providers and composites match the Explore panel', () => {
  it('the composite-signature entry has no hard-coded count and no "not functional" clause', () => {
    const def = term('composite-signature')
    expect(def).toContain(
      "This build's pkcs11 provider lists composite ML-DSA algorithms (draft-lamps-19 labels); see Explore > Query this build for the current list."
    )
    expect(def).not.toContain('registers 3')
    expect(def).not.toContain('not currently functional')
  })

  it('lesson 10 says the build loads the default, legacy and PKCS#11 providers and no FIPS provider', () => {
    const notes = lesson10.notes.join(' ')
    expect(notes).toContain(
      'loads the default, legacy and PKCS#11 providers and no FIPS provider, so it is not the validated module'
    )
    expect(notes).not.toContain('loads only the default and legacy providers')
  })
})
