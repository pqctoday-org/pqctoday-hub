// SPDX-License-Identifier: AGPL-3.0-only
export const OLD_PATHS = ['legacy-gateway', 'direct-legacy'] as const
export const REPLACEMENT_PATH = 'replacement-route'
const ALL_PATHS: readonly string[] = [...OLD_PATHS, REPLACEMENT_PATH]

export interface RetirementPacket {
  label: string
  inventory: string[]
  routes: { target: string; enabled: boolean }[]
  trustReferences: string[]
  dependencyReferences: string[]
  observations: { target: string; outcome: 'accept' | 'reject' }[]
}

export const RETIREMENT_PACKETS: RetirementPacket[] = [
  {
    label: 'Before cutover',
    inventory: ['legacy-gateway', 'direct-legacy', 'replacement-route'],
    routes: [
      { target: 'legacy-gateway', enabled: true },
      { target: 'direct-legacy', enabled: true },
      { target: 'replacement-route', enabled: true },
    ],
    trustReferences: ['legacy-connection-trust'],
    dependencyReferences: ['batch-reader -> direct-legacy'],
    observations: [
      { target: 'legacy-gateway', outcome: 'accept' },
      { target: 'direct-legacy', outcome: 'accept' },
      { target: 'replacement-route', outcome: 'accept' },
    ],
  },
  {
    label: 'Gateway removed, fallback remains',
    inventory: ['direct-legacy', 'replacement-route'],
    routes: [
      { target: 'direct-legacy', enabled: true },
      { target: 'replacement-route', enabled: true },
    ],
    trustReferences: ['legacy-connection-trust'],
    dependencyReferences: ['batch-reader -> direct-legacy'],
    observations: [
      { target: 'legacy-gateway', outcome: 'reject' },
      { target: 'direct-legacy', outcome: 'accept' },
      { target: 'replacement-route', outcome: 'accept' },
    ],
  },
  {
    label: 'Follow-up cleanup',
    inventory: ['replacement-route'],
    routes: [{ target: 'replacement-route', enabled: true }],
    trustReferences: [],
    dependencyReferences: [],
    observations: [
      { target: 'legacy-gateway', outcome: 'reject' },
      { target: 'direct-legacy', outcome: 'reject' },
      { target: 'replacement-route', outcome: 'accept' },
    ],
  },
]

export interface RetirementInterpretation {
  status: 'consistent' | 'incomplete'
  remaining: string[]
  issues: string[]
}

/** Interpret finite fictional records. Never infer an observation from configuration. */
export function interpretRetirementPacket(input: unknown): RetirementInterpretation {
  const invalid = (message: string): RetirementInterpretation => ({
    status: 'incomplete',
    remaining: [],
    issues: [message],
  })
  if (!input || typeof input !== 'object') return invalid('Packet missing or malformed')
  const p = input as Record<string, unknown>
  const strings = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0)
  if (typeof p.label !== 'string' || !p.label.trim()) return invalid('Snapshot identity missing')
  for (const key of ['inventory', 'trustReferences', 'dependencyReferences']) {
    if (!strings(p[key])) return invalid(`${key} missing or malformed`)
    if (new Set(p[key]).size !== p[key].length) return invalid(`${key} has duplicate records`)
  }
  if (
    !Array.isArray(p.routes) ||
    !p.routes.every(
      (entry) => entry && typeof entry.target === 'string' && typeof entry.enabled === 'boolean'
    )
  ) {
    return invalid('Route configuration missing or malformed')
  }
  if (
    !Array.isArray(p.observations) ||
    !p.observations.every(
      (entry) =>
        entry && typeof entry.target === 'string' && ['accept', 'reject'].includes(entry.outcome)
    )
  ) {
    return invalid('Observations missing or malformed')
  }
  const packet = input as RetirementPacket
  for (const [kind, rows] of [
    ['routes', packet.routes],
    ['observations', packet.observations],
  ] as const) {
    if (new Set(rows.map((row) => row.target)).size !== rows.length)
      return invalid(`${kind} has duplicate targets`)
    if (rows.some((row) => !ALL_PATHS.includes(row.target)))
      return invalid(`${kind} contains an undeclared target`)
  }
  if (packet.inventory.some((target) => !ALL_PATHS.includes(target)))
    return invalid('Inventory contains an undeclared target')
  const remaining = [
    ...packet.inventory
      .filter((target) => OLD_PATHS.some((old) => old === target))
      .map((target) => `Inventory: ${target}`),
    ...packet.routes
      .filter((route) => OLD_PATHS.some((old) => old === route.target))
      .map(
        (route) =>
          `Configured old route: ${route.target} (${route.enabled ? 'enabled' : 'disabled'})`
      ),
    ...packet.trustReferences.map((target) => `Trust reference: ${target}`),
    ...packet.dependencyReferences.map((target) => `Dependency: ${target}`),
  ]
  const issues: string[] = []
  for (const target of OLD_PATHS) {
    const observation = packet.observations.find((row) => row.target === target)
    if (!observation) issues.push(`Observation missing: ${target}`)
    else if (observation.outcome !== 'reject') issues.push(`Old path still accepts: ${target}`)
  }
  if (
    !packet.inventory.includes(REPLACEMENT_PATH) ||
    !packet.routes.some((route) => route.target === REPLACEMENT_PATH && route.enabled)
  ) {
    issues.push('Replacement inventory/configuration incomplete')
  }
  const replacement = packet.observations.find((row) => row.target === REPLACEMENT_PATH)
  if (!replacement) issues.push('Replacement observation missing')
  else if (replacement.outcome !== 'accept') issues.push('Replacement control rejected')
  return {
    status: remaining.length || issues.length ? 'incomplete' : 'consistent',
    remaining,
    issues,
  }
}

export const RETIREMENT_PACKET_LIMIT =
  'Authored fictional observations, not executed network or cryptographic tests. Consistency covers only the declared sample routes. Connection-trust removal does not mean deleting historical signature-verification material or protected records.'

export function retirementPacketMarkdown(packet: RetirementPacket): string {
  const result = interpretRetirementPacket(packet)
  return [
    '# Fictional records-service retirement packet',
    `Snapshot: ${packet.label}`,
    `Interpretation: ${result.status === 'consistent' ? 'Consistent for the declared sample paths' : 'Incomplete: old paths or evidence gaps remain'}`,
    '## Before cutover records',
    '```json',
    JSON.stringify(RETIREMENT_PACKETS[0], null, 2),
    '```',
    '## Selected records',
    '```json',
    JSON.stringify(packet, null, 2),
    '```',
    '## Remaining references',
    ...(result.remaining.length ? result.remaining.map((item) => `- ${item}`) : ['- None']),
    '## Evidence gaps or contrary observations',
    ...(result.issues.length ? result.issues.map((item) => `- ${item}`) : ['- None']),
    '## Meaning and limits',
    RETIREMENT_PACKET_LIMIT,
    'In your tools, compare inventory/configuration, trace trust and dependencies, and test every old path plus a replacement control. Retain target/configuration identity, observation time, tool/version and outcome. Module validation, algorithm tests and CVE scans do not establish route removal.',
    'Inspecting this sample does not complete or save the separate planning checklist.',
  ].join('\n\n')
}
