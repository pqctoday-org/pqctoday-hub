// SPDX-License-Identifier: AGPL-3.0-only
//
// Lesson 10 (Config files demystified) carries the note that explains the FIPS
// provider. Its last sentence says this in-browser build loads the default, legacy
// and PKCS#11 providers and no FIPS provider, so the test also pins the worker's
// provider list.
import { describe, it, expect } from 'vitest'
import { OPENSSL_LESSONS } from './opensslLessons'
import worker from '../worker/openssl.worker.ts?raw'

const FIPS_NOTE =
  "In OpenSSL, the part that can be FIPS validated is the FIPS provider, a separate loadable module. Only a FIPS provider built from an OpenSSL version that has a valid FIPS certificate counts, and the certificate links to a Security Policy that you must follow. The openssl fipsinstall command runs the module's self-tests and writes the module configuration file. This in-browser build loads the default, legacy and PKCS#11 providers and no FIPS provider, so it is not the validated module."

describe('OpenSSL Studio Lesson 10 - FIPS provider note', () => {
  it('has the FIPS provider note in the notes of the config-files lesson only', () => {
    const lesson = OPENSSL_LESSONS.find((l) => l.id === 'config-files')
    expect(lesson?.n).toBe(10)
    expect(lesson?.notes).toContain(FIPS_NOTE)
    const others = OPENSSL_LESSONS.filter((l) => l.id !== 'config-files')
    for (const l of others) {
      expect(l.notes.join(' '), l.id).not.toContain('fipsinstall')
    }
  })

  it('stays true: the worker config lists the default and legacy providers and no FIPS provider', () => {
    const section = /\[provider_sect\]\n([\s\S]*?)\n\[/.exec(worker)?.[1] ?? ''
    expect(section.trim().split('\n')).toEqual(['default = default_sect', 'legacy = legacy_sect'])
    expect(worker).not.toMatch(/fips\s*=\s*fips_sect/)
  })
})
