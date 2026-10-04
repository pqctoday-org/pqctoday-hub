// SPDX-License-Identifier: GPL-3.0-only
/**
 * Generate the plain-data SEO catalogue for every routed tool page.
 *
 * The React registries remain the authoring source, but this generated file is
 * deliberately free of components, icons and lazy imports so PageMeta can use
 * it without pulling either registry into the boot bundle.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import { BUSINESS_TOOLS } from '../../src/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '../../src/components/Playground/workshopRegistry'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUTPUT = join(ROOT, 'src/seo/toolRouteMeta.generated.ts')
const CHECK = process.argv.includes('--check')

type Kind = 'business-tool' | 'browser-tool' | 'sandbox-tool' | 'lab'

interface ToolRouteRecord {
  path: string
  title: string
  description: string
  kind: Kind
  index: boolean
  sourceGlobs: string[]
  contentRegion: string
}

const LABS: ToolRouteRecord[] = [
  {
    path: '/playground/interactive',
    title: 'Interactive PQC Playground — Live Cryptography | PQC Today',
    description:
      'Generate keys, encapsulate secrets, sign messages and compare post-quantum algorithms in a browser-based WebAssembly cryptography playground.',
    kind: 'lab',
    index: true,
    sourceGlobs: ['src/components/Playground/PlaygroundView.tsx'],
    contentRegion: '#main-content',
  },
  {
    path: '/playground/hsm',
    title: 'PKCS#11 HSM Playground — SoftHSM in WebAssembly | PQC Today',
    description:
      'Explore PKCS#11 v3.2 operations, post-quantum keys and dual-engine validation using SoftHSM compiled to WebAssembly.',
    kind: 'lab',
    index: true,
    sourceGlobs: ['src/components/Playground/HsmPlayground.tsx', 'src/components/Playground/hsm'],
    contentRegion: '#main-content',
  },
  {
    path: '/playground/cacp',
    title: 'Crypto-Agility Control Plane — KMIP Policy Lab | PQC Today',
    description:
      'Test KMIP crypto-agility policies and observe cryptographic operations switch to post-quantum controls in an interactive browser lab.',
    kind: 'lab',
    index: true,
    sourceGlobs: ['src/components/Playground/kmip', 'src/wasm/kmip'],
    contentRegion: '#main-content',
  },
  {
    path: '/playground/docker',
    title: 'PQC Docker Sandbox — Full-Fidelity Integration Lab | PQC Today',
    description:
      'Understand the requirements and workflows for PQC Today container scenarios that exercise full cryptographic applications outside the browser.',
    kind: 'lab',
    index: true,
    sourceGlobs: ['src/components/Playground/DockerPlaygroundView.tsx'],
    contentRegion: '#main-content',
  },
]

function cleanDescription(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text.length <= 160) return text
  const candidate = text.slice(0, 157)
  const sentence = candidate.lastIndexOf('. ')
  if (sentence >= 80) return candidate.slice(0, sentence + 1)
  const word = candidate.lastIndexOf(' ')
  return `${candidate.slice(0, word > 80 ? word : 157).replace(/[,:;\s]+$/, '')}…`
}

const reserved = new Set(LABS.map((route) => route.path.slice('/playground/'.length)))
const collisions = WORKSHOP_TOOLS.map((tool) => tool.id).filter((id) => reserved.has(id))
if (collisions.length > 0) {
  throw new Error(`tool SEO routes collide with reserved lab paths: ${collisions.join(', ')}`)
}

const records: ToolRouteRecord[] = [
  ...BUSINESS_TOOLS.map((tool) => ({
    path: `/business/tools/${tool.id}`,
    title: `${tool.name} — PQC Business Tool | PQC Today`,
    description: cleanDescription(tool.description),
    kind: 'business-tool' as const,
    index: true,
    sourceGlobs: [
      'src/components/BusinessCenter/businessToolsRegistry.tsx',
      'src/components/BusinessCenter/BusinessToolRoute.tsx',
    ],
    contentRegion: '#main-content',
  })),
  ...WORKSHOP_TOOLS.map((tool) => ({
    path: `/playground/${tool.id}`,
    title: `${tool.name} — PQC Crypto Lab | PQC Today`,
    description: cleanDescription(tool.description),
    kind: (tool.sandbox ? 'sandbox-tool' : 'browser-tool') as Kind,
    index: true,
    sourceGlobs: tool.sandbox
      ? [
          'src/data/sandboxScenarios.ts',
          'src/components/Playground/SandboxScenarioEmbed.tsx',
          'src/components/Playground/PlaygroundToolRoute.tsx',
        ]
      : [
          'src/components/Playground/workshopRegistry.tsx',
          'src/components/Playground/PlaygroundToolRoute.tsx',
        ],
    contentRegion: '#main-content',
  })),
  ...LABS,
].sort((a, b) => a.path.localeCompare(b.path))

const paths = records.map((record) => record.path)
if (new Set(paths).size !== paths.length) throw new Error('duplicate generated tool route')

const prettierConfig = (await resolveConfig(OUTPUT)) ?? {}
const rendered = await format(
  `// SPDX-License-Identifier: GPL-3.0-only
// Generated by scripts/ci/gen-tool-route-meta.ts — do not edit by hand.

export type ToolRouteKind = 'business-tool' | 'browser-tool' | 'sandbox-tool' | 'lab'

export interface ToolRouteMeta {
  path: string
  title: string
  description: string
  kind: ToolRouteKind
  index: boolean
  sourceGlobs: string[]
  contentRegion: string
}

export const TOOL_ROUTE_META: readonly ToolRouteMeta[] = ${JSON.stringify(records, null, 2)}
`,
  { ...prettierConfig, filepath: OUTPUT }
)

if (CHECK) {
  let current = ''
  try {
    current = readFileSync(OUTPUT, 'utf8')
  } catch {
    // handled by comparison below
  }
  if (current !== rendered) {
    console.error('toolRouteMeta.generated.ts is stale — run: npm run gen:tool-route-meta')
    process.exit(1)
  }
  console.log(`✓ tool route metadata is current (${records.length} routes)`)
} else {
  writeFileSync(OUTPUT, rendered, 'utf8')
  const counts = records.reduce<Record<string, number>>((out, record) => {
    out[record.kind] = (out[record.kind] ?? 0) + 1
    return out
  }, {})
  console.log(`✓ wrote ${records.length} tool routes: ${JSON.stringify(counts)}`)
}
