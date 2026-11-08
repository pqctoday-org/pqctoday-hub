// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import curiousSummary from './curious-summary.md?raw'

describe('IAM plain-language summary keeps PKINIT and Golden Ticket apart', () => {
  it('says a broken PKINIT exchange exposes a session key, not that tickets can be forged', () => {
    expect(curiousSummary).toContain(
      "breaking a captured PKINIT exchange could expose that client's session key for as long as its ticket is valid"
    )
    expect(curiousSummary).toContain(
      'forging tickets for any account is a Golden Ticket, which needs the KRBTGT key and is a classical key-theft attack'
    )
    expect(curiousSummary).not.toContain('Quantum Golden Ticket')
  })

  it('advises planning the PKINIT upgrade once documented and protecting the KRBTGT key separately', () => {
    expect(curiousSummary).toContain(
      'plan the Kerberos PKINIT upgrade once Microsoft documents it; protect the KRBTGT key separately'
    )
    expect(curiousSummary).not.toContain('that prevents the catastrophic')
  })
})
