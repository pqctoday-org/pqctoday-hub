// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SOURCING_STRATEGIES, WIZARD_QUESTIONS } from './buildBuyData'

const commercial = SOURCING_STRATEGIES.find((s) => s.id === 'commercial')!
const prosText = commercial.pros.map((p) => p.text)

describe('commercial licensing is not presented as automatic compliance or liability transfer', () => {
  it('does not promise a certification burden of zero or an automatic liability transfer', () => {
    const text = [commercial.tagline, commercial.description, ...prosText].join('\n')
    expect(text).not.toMatch(/no certification burden/i)
    expect(text).not.toMatch(/Liability transfer/i)
    expect(text).not.toMatch(/guaranteed response times/i)
    expect(text).not.toMatch(/paperwork/i)
  })

  it('scopes a FIPS validation to the module, not to the application', () => {
    const validated = commercial.pros.find((p) => /validated module/i.test(p.text))!
    expect(validated.text).toMatch(/named module/i)
    expect(validated.text).toMatch(/not your application/i)
  })

  it('labels warranties and support as contract-dependent', () => {
    const warranty = commercial.pros.find((p) => /Warranties/i.test(p.text))!
    expect(warranty.text).toMatch(/depend on the licence agreement/i)
    expect(warranty.text).toMatch(/does not transfer/i)
    const support = commercial.pros.find((p) => /Vendor support/i.test(p.text))!
    expect(support.text).toMatch(/contract/i)
  })

  it('states the FIPS 140-2 sunset that the old "pre-certified 140-2/3" wording ignored', () => {
    const validated = commercial.pros.find((p) => /validated module/i.test(p.text))!
    expect(validated.text).toMatch(/FIPS 140-2/)
    expect(validated.text).toMatch(/Historical list/i)
  })
})

describe('FIPS requirement wording matches who the standard applies to', () => {
  it('does not claim FIPS is mandatory for whole sectors or invent a mandatory level', () => {
    const text = [
      ...commercial.bestFor,
      ...WIZARD_QUESTIONS.flatMap((q) => q.options.map((o) => o.label)),
    ].join('\n')
    expect(text).not.toMatch(/FIPS mandatory/i)
    expect(text).not.toMatch(/Level 2\+ mandatory/i)
    expect(text).not.toMatch(/FIPS Level 3\+/i)
  })

  it('ties validation to a requirement (regulator, contract, or federal use), not to the sector alone', () => {
    const [finance, health, government] = commercial.bestFor
    expect(finance).toMatch(/requires a validated module/i)
    expect(health).toMatch(/check what applies/i)
    expect(government).toMatch(/federal/i)
  })
})
