// SPDX-License-Identifier: AGPL-3.0-only
import { Buffer } from 'node:buffer'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QUIZ_QUESTIONS } from '@/data/quizData'
import { ALGORITHM_SECURITY_DATA } from '../../QuantumThreats/data/quantumConstants'
import { useQuizState } from '../hooks/useQuizState'

vi.mock('@/utils/analytics', () => ({ logQuizAnswer: vi.fn() }))
const get = (id: string) => QUIZ_QUESTIONS.find((q) => q.id === id)!
const targets = [
  'iamq-013',
  'comp-015',
  'comp-018',
  'qt-003',
  'qt-006',
  'qt-011',
  'thrt-009',
  'comp-013',
  'fund-012',
  'fund-014',
  'thrt-007',
  'thrt-010',
  'thrt-015',
  'thrt-004',
  'comp-020',
  'prot-020',
  'thrt-016',
  'comp-019',
]

describe('source-corrected quiz batch', () => {
  it('attributes Europol’s historical percentage to the survey actually cited', () => {
    const q = get('comp-020')
    expect(q.question).toContain('Europol’s 2025')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toContain(
      '2023 survey of 200 financial-sector leaders'
    )
    expect(q.explanation).toContain('not a current census of all executives')
    expect(q.sourceUrl).toContain('europol.europa.eu')
  })

  it('identifies the documented Samsung signature operation rather than mislabelling FIPS 204 as ML-KEM', () => {
    const q = get('prot-020')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toContain(
      'FIPS 204 digital-signature operations'
    )
    expect(q.explanation).toContain('FIPS 204 specifies ML-DSA digital signatures')
    expect(q.explanation).toContain('ML-KEM key encapsulation is specified by FIPS 203')
    expect(q.sourceUrl).toContain('semiconductor.samsung.com')
  })

  it('distinguishes the documented PlayReady content cipher from key protection and signing', () => {
    const q = get('thrt-016')
    expect(q.question).toContain('Microsoft’s documented PlayReady')
    const answer = q.options.find((o) => o.id === q.correctAnswer)?.text
    expect(answer).toContain('AES encrypts content')
    expect(answer).toContain('ECC protects content keys')
    expect(q.explanation).toContain('P-256 ECC ElGamal and ECDSA')
    expect(q.sourceUrl).toBe(
      'https://learn.microsoft.com/en-us/playready/packaging/content-encryption'
    )
  })

  it('teaches the concrete actions in Israel’s dated alert without a fabricated assessment deadline', () => {
    const q = get('comp-019')
    expect(q.question).toContain('6 March 2025')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toContain('cryptographic agility')
    expect(q.explanation).toContain('identifying relevant systems')
    expect(q.explanation).toContain('does not substantiate a universal end-of-2025')
    expect(q.sourceUrl).toContain('ALERT-CERT-IL-W-1855.pdf')
  })
  it('explains the known-public-key signature threat without unscoped holdings valuation', () => {
    const q = get('thrt-004')
    expect(q.question).toContain('known Bitcoin ECDSA public key')
    expect(q.explanation).toContain('signature forgery')
    expect(q.explanation).not.toContain('$718')
    expect(q.explanation).not.toContain('Satoshi')
    expect(q.sourceUrl).toContain('db7ec4fb976284581ba2adc77218af8711375d91')
  })
  it('uses the HHS occurrence-period cohort rather than mixing portal receipt dates or quantum causation', () => {
    const q = get('thrt-010')
    expect(q.question).toContain('at least 500 individuals')
    expect(q.question).toContain('occurred or ended in 2024')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toContain('663 breaches')
    expect(q.explanation).toContain('242,908,056')
    expect(q.explanation).toContain('742 large-breach reports')
    expect(q.explanation).toContain('do not establish that quantum attacks caused')
    expect(q.sourceUrl).toBe(
      'https://www.hhs.gov/sites/default/files/breach-report-to-congress-2024.pdf'
    )
  })

  it('keeps Ethereum team formation distinct from prize aggregation and completed deployment', () => {
    const q = get('thrt-007')
    expect(q.question).toContain('January 2026')
    expect(q.question).not.toContain('$2M')
    expect(q.explanation).toContain('a $1 million Poseidon research prize')
    expect(q.explanation).toContain('do not establish that all Ethereum accounts')
    expect(q.sourceUrl).toBe('https://ethereum.org/roadmap/security/quantum-resistance/')
  })

  it('teaches the actual FS-ISAC coordination warning without a manufactured collapse deadline', () => {
    const q = get('thrt-015')
    const answer = q.options.find((o) => o.id === q.correctAnswer)?.text
    expect(answer).toContain('coordinate sector dependencies')
    expect(answer).not.toContain('2030')
    expect(q.explanation).toContain('25 September 2025')
    expect(q.sourceUrl).toContain('fsisac.com/newsroom/')
  })
  it('scopes the healthcare percentage to the cited survey population and sensitive data', () => {
    const q = get('thrt-009')
    expect(q.question).toContain('2025 Thales Healthcare and Life Sciences')
    expect(q.question).toContain('sensitive cloud data')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toBe('4%')
    expect(q.explanation).toContain('not a current measurement of every healthcare provider')
    expect(q.sourceUrl).toContain('2025-data-threat-report-healthcare-cybersecurity')
  })

  it('ties the Czech target to the protected information, operation and environment', () => {
    const q = get('comp-013')
    expect(q.question).toContain('key establishment')
    expect(q.question).toContain('critical confidentiality')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toBe('Czech Republic')
    expect(q.explanation).toContain('scoped recommendation')
    expect(q.sourceUrl).toContain('portal.nukib.gov.cz')
  })

  it('makes both readiness answers independently reproducible from declared fictional inputs', () => {
    expect((1 / 4) * 100).toBe(25)
    expect((2 / 4) * 100).toBe(50)
    expect(get('fund-012').options.find((o) => o.id === get('fund-012').correctAnswer)?.text).toBe(
      '25 out of 100'
    )
    expect(get('fund-012').question).toContain('four readiness activities carry equal weight')
    expect(get('fund-012').source).toContain('fictional worked example')
    expect(((20 - 6) / 20) * 100).toBe(70)
    expect((6 / 20) * 100).toBe(30)
    expect(get('fund-014').options.find((o) => o.id === get('fund-014').correctAnswer)?.text).toBe(
      '70%'
    )
    expect(get('fund-014').question).toContain('20 in-scope applications')
    expect(get('fund-014').explanation).toContain('not a survey result')
  })
  it('reproduces the complete JWT size from the stated actual payload and header bytes', () => {
    const q = get('iamq-013')
    const payload = q.explanation.match(/(\{"sub".*?\})\./)![1]
    expect(JSON.parse(payload).tenant).toBe('fictional-team-alph')
    expect(Buffer.byteLength(payload, 'utf8')).toBe(150)
    const length = (header: string, body: string, signatureBytes: number) =>
      [Buffer.from(header), Buffer.from(body), Buffer.alloc(signatureBytes)]
        .map((v) => v.toString('base64url'))
        .join('.').length
    const classic = length('{"alg":"RS256","typ":"JWT"}', payload, 256)
    const pqc = length('{"alg":"ML-DSA-65","typ":"JWT"}', payload, 3309)
    expect([classic, pqc]).toEqual([580, 4656])
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toContain('4,656')
    expect(q.explanation).toContain('36 + 1 + 200 + 1 + 342 = 580')
    expect(q.explanation).toContain('42 + 1 + 200 + 1 + 4,412 = 4,656')
    expect(length('{"alg":"RS256","typ":"JWT"}', payload + ' ', 256)).toBe(classic + 2)
    expect(Buffer.alloc(3309).toString('base64url')).toHaveLength(4412)
    expect(pqc / classic).toBeCloseTo(8.03, 2)
  })

  it('distinguishes the order’s actual directed actions from assumed issuance of later guidance', () => {
    const q = get('comp-015')
    expect(q.sourceUrl).toContain('DCPD-202500669')
    expect(q.explanation).toContain('does not itself prove that later guidance was issued')
    expect(q.explanation).toContain('2 January 2030')
    expect(q.explanation).toContain('TLS 1.3 alone')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toContain('product')
    expect(q.explanation).not.toContain('issued federal buying guidance in January 2026')
  })

  it('describes G7 dates as risk-based planning context rather than a prescribed 2034 deadline', () => {
    const q = get('comp-018')
    expect(q.sourceUrl).toContain('gov.uk/government/publications/')
    expect(q.explanation).toContain('not regulatory expectations')
    expect(q.explanation).toContain('2030–2032')
    expect(q.explanation).toContain('2035')
    expect(q.explanation).not.toContain('2034')
    expect(q.options.find((o) => o.id === q.correctAnswer)?.text).toContain('non-authoritative')
  })

  it('keeps all three qubit questions tied to named estimates and roadmap scope', () => {
    const logical = 1280 + 131 + 7 * 18
    expect(logical).toBe(1537)
    expect(ALGORITHM_SECURITY_DATA.find((a) => a.name === 'RSA-2048')?.estimatedQubits).toBe(
      logical
    )
    expect(get('qt-003').explanation).toContain('897,864 physical qubits')
    expect(get('qt-003').explanation).toContain('1,537 logical qubits')
    expect(get('qt-006').options.find((o) => o.id === 'c')?.text).toContain('1,537')
    expect(get('qt-011').explanation).toContain('stated roadmap target')
    expect(get('qt-011').sourceUrl).toBe('https://www.ibm.com/roadmaps/quantum/2026/')
  })

  for (const id of targets) {
    it.each([true, false])(`scores the correct and contrary answer for ${id}: %s`, (correct) => {
      const q = get(id)
      const answer = correct
        ? String(q.correctAnswer)
        : q.options.find((o) => o.id !== q.correctAnswer)!.id
      const { result } = renderHook(() => useQuizState())
      act(() => result.current.startQuiz([q]))
      act(() => result.current.selectAnswer(q.id, answer))
      act(() => result.current.submitAnswer())
      expect(result.current.state.results[q.id]).toBe(correct)
    })
  }
})
