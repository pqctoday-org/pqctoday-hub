// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { DEV_LANGUAGES } from './languageData'

const language = (id: string) => DEV_LANGUAGES.find((l) => l.id === id)!
const allText = (l: (typeof DEV_LANGUAGES)[number]) =>
  [
    l.memorySafetyDescription,
    l.ffiDescription,
    l.cryptoDevContext,
    ...l.pros,
    ...l.cons,
    ...l.cryptoLibraries.map((c) => c.description),
    ...l.pqcBindings,
  ].join('\n')

describe('language features are not taught as constant-time or native-code guarantees', () => {
  it('Zig comptime is not a constant-time checker', () => {
    const zig = allText(language('zig'))
    expect(zig).not.toMatch(/constant-time verification/i)
    expect(zig).not.toMatch(/verify constant-time properties at compile time/i)
    expect(zig).toMatch(/not a constant-time checker|does not verify constant-time/i)
  })

  it('Rust separates safe code from unsafe and FFI, and does not promise side-channel resistance', () => {
    const rust = allText(language('rust'))
    expect(rust).not.toMatch(/Excellent side-channel resistance/i)
    expect(rust).not.toMatch(/guaranteed at compile time — no buffer overflows/i)
    expect(rust).toMatch(/unsafe/)
    expect(rust).toMatch(/FFI/)
    expect(rust).toMatch(/best-effort/i)
  })

  it('Go does not claim blanket constant-time behaviour for the standard library', () => {
    const go = allText(language('go'))
    expect(go).not.toMatch(/Excellent standard library crypto/i)
    expect(go).toMatch(/per primitive and platform/i)
  })

  it('Java reports the foreign function and memory API as final in JDK 22', () => {
    const java = language('java').ffiDescription
    expect(java).not.toMatch(/incubating/i)
    expect(java).toMatch(/final in JDK 22/)
    expect(java).toMatch(/JEP 454/)
  })

  it('key zeroing statements say what is and is not cleared', () => {
    expect(language('go').memorySafetyDescription).toMatch(/only that slice/i)
    expect(allText(language('dotnet'))).toMatch(/copies elsewhere are not cleared/i)
  })
})

describe('no blanket language or library rankings in the prose', () => {
  const RANKING = [
    /best choice/i,
    /gold standard/i,
    /best-in-class/i,
    /most complete/i,
    /Maximum performance/i,
    /language of choice/i,
    /enterprise choice/i,
    /better than Java/i,
    /fastest path/i,
    /excels for/i,
  ]

  it.each(DEV_LANGUAGES.map((l) => [l.id, allText(l)] as const))('%s', (_id, text) => {
    for (const re of RANKING) expect(text).not.toMatch(re)
  })
})
