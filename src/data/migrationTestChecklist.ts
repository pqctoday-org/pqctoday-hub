// SPDX-License-Identifier: AGPL-3.0-only
/**
 * One shared list of PQC migration test lines, tagged by the roles whose test
 * plans use them. The architect's test plan, the operations test plan and the
 * developer's engineering migration plan all seed from here, so a line such as
 * the downgrade check reads the same everywhere. Add a role tag to reuse a
 * line; add a new line only when no existing one says it.
 */

export type ChecklistRole = 'architect' | 'ops' | 'developer'

export type ChecklistArea =
  'interoperability' | 'negotiation' | 'certificates' | 'keys' | 'capacity' | 'operations'

export interface ChecklistLine {
  /** Stable id; never reuse or renumber, saved test plans refer to it. */
  id: string
  area: ChecklistArea
  text: string
  roles: ChecklistRole[]
}

export const MIGRATION_TEST_CHECKLIST: ChecklistLine[] = [
  {
    id: 'interop-positive',
    area: 'interoperability',
    text: 'Each client and server pair completes the handshake with the target algorithm or hybrid group.',
    roles: ['architect', 'ops', 'developer'],
  },
  {
    id: 'interop-negative',
    area: 'interoperability',
    text: 'A peer without the target algorithm fails in the expected, logged way (no silent fallback).',
    roles: ['architect', 'ops', 'developer'],
  },
  {
    id: 'tls-hrr',
    area: 'negotiation',
    text: 'HelloRetryRequest: a mutually supported group the client sent no key share for is negotiated after one retry.',
    roles: ['architect', 'developer'],
  },
  {
    id: 'tls-no-common-group',
    area: 'negotiation',
    text: 'No common group: the handshake fails with handshake_failure, and the failure is visible in monitoring.',
    roles: ['architect', 'developer'],
  },
  {
    id: 'downgrade-policy',
    area: 'negotiation',
    text: 'Downgrade to classical is refused unless policy allows it for that peer, and every allowed fallback is logged.',
    roles: ['architect', 'ops', 'developer'],
  },
  {
    id: 'cert-chain-validation',
    area: 'certificates',
    text: 'Relying parties validate the new certificate chain (including any composite or related-certificate format chosen).',
    roles: ['architect', 'ops'],
  },
  {
    id: 'cert-rollover',
    area: 'certificates',
    text: 'Certificate rollover: old and new chains are both accepted during the overlap and the old one is retired on schedule.',
    roles: ['architect', 'ops'],
  },
  {
    id: 'cert-revocation',
    area: 'certificates',
    text: 'Revocation (CRL or OCSP) works for the new certificates, and response sizes stay within limits.',
    roles: ['architect', 'ops'],
  },
  {
    id: 'key-rekey-alias',
    area: 'keys',
    text: 'Rekey: applications that look keys up by alias keep working, and anything that stored the old key identifier is found and updated.',
    roles: ['architect', 'ops', 'developer'],
  },
  {
    id: 'key-backup-restore',
    area: 'keys',
    text: 'Key backup, restore and recovery work for the new key types in the KMS or HSM.',
    roles: ['architect', 'ops'],
  },
  {
    id: 'size-limits',
    area: 'capacity',
    text: 'Larger keys, signatures and certificates fit every buffer, database column, message and MTU on the path.',
    roles: ['architect', 'ops', 'developer'],
  },
  {
    id: 'capacity-latency',
    area: 'capacity',
    text: 'Throughput and latency under peak load stay within the service objectives (handshakes, signing, KMS/HSM calls).',
    roles: ['architect', 'ops'],
  },
  {
    id: 'observability',
    area: 'operations',
    text: 'Monitoring shows which algorithm each connection and signature used, so the migration can be measured.',
    roles: ['architect', 'ops'],
  },
  {
    id: 'rollback',
    area: 'operations',
    text: 'Rollback to the previous configuration is tested separately from algorithm downgrade, with a named owner.',
    roles: ['architect', 'ops', 'developer'],
  },
]

export const checklistFor = (role: ChecklistRole): ChecklistLine[] =>
  MIGRATION_TEST_CHECKLIST.filter((l) => l.roles.includes(role))
