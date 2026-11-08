// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'
import introSource from './components/DatabaseEncryptionIntroduction.tsx?raw'
import plannerSource from './workshop/TDEMigrationPlanner.tsx?raw'

const flat = (text: string) => text.replace(/\s+/g, ' ')

describe('database re-encryption commands and figures are stated as they work', () => {
  it('names the Oracle online rekey command in full and notes the free-space cost', () => {
    const cmd = 'ALTER TABLESPACE <name> ENCRYPTION ONLINE REKEY'
    expect(plannerSource).toContain(`commandNote: '${cmd}'`)
    expect(flat(plannerSource)).toContain(
      'ONLINE conversion builds new datafiles and needs free space'
    )
    expect(ragSummary).toContain(`Oracle: \`${cmd}\``)
    expect(ragSummary).toContain(`Oracle (\`${cmd}\`)`)
    expect(flat(introSource)).toContain('ALTER TABLESPACE ... ENCRYPTION ONLINE REKEY')
    expect(plannerSource).not.toContain("commandNote: 'ALTER TABLESPACE <name> REKEY'")
    expect(ragSummary).not.toContain('ALTER TABLESPACE REKEY')
  })

  it('does not require the SQL Server EKM provider to import ML-KEM-1024', () => {
    expect(plannerSource).not.toContain('EKM provider must support ML-KEM-1024 import')
  })

  it('does not present pg_tde as having a REKEY statement', () => {
    expect(plannerSource).toContain("commandNote: 'pg_tde principal-key rotation function'")
    expect(plannerSource).not.toContain("commandNote: 'pg_tde REKEY'")
    expect(flat(plannerSource)).toContain('Converting existing tables rewrites them.')
    expect(flat(introSource)).toContain(
      'PostgreSQL pg_tde: converting existing tables rewrites them under an exclusive lock'
    )
  })

  it('names the MongoDB key-vault re-wrap call for client-side encrypted fields', () => {
    expect(flat(introSource)).toContain('KeyVault.rewrapManyDataKey')
  })

  it('labels CPU, downtime and readiness figures as samples', () => {
    const intro = flat(introSource)
    expect(intro).toContain('Sample assumption: CPU overhead of 5&ndash;15%')
    expect(intro).toContain(
      'Sample assumption: a maintenance window of 2&ndash;8 hours for a 1TB database'
    )
    expect(ragSummary).toContain('(illustrative 30% PQC readiness)')
    expect(ragSummary).toContain('(illustrative 65% PQC readiness)')
    expect(ragSummary).toContain('(illustrative 90% PQC readiness)')
    expect(ragSummary).not.toContain('with zero application downtime')
  })

  it('says the cloud database receives the plaintext DEK after the on-premises unwrap', () => {
    expect(ragSummary).toContain(
      'Cloud database receives the plaintext DEK after the on-premises unwrap'
    )
    expect(flat(introSource)).toMatch(
      /Cloud receives the plaintext\{' '\} ?<InlineTooltip term="DEK">DEK<\/InlineTooltip> after the on-premises unwrap/
    )
    expect(ragSummary).not.toContain('receives only encrypted DEKs')
    expect(flat(introSource)).not.toContain('Cloud receives only encrypted')
  })
})
