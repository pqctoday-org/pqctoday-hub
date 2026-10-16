// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ExecutiveDocument } from '@/services/storage/types'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { toolPathFor } from './rolePack'
import {
  buildOperationsPack,
  extractMarkdownTables,
  OPERATIONS_PACK_DISCLAIMER,
  OPERATIONS_PACK_PANEL_PATH,
  OPERATIONS_PACK_SECTIONS,
  operationsPackFiles,
  splitRow,
  tablesToCsvFiles,
} from './operationsPack'
import { testPlanFromChecklist, testPlanMarkdown } from './architectureArtifacts'
import { checklistFor } from '@/data/migrationTestChecklist'
import {
  OPERATIONS_PACK_HISTORY_ROUTE,
  OPERATIONS_PACK_TYPES,
} from '@/services/history/seedHistory'

const now = new Date('2026-10-16T12:00:00Z')

const doc = (over: Partial<ExecutiveDocument>): ExecutiveDocument => ({
  id: over.id ?? 'x',
  moduleId: 'migration-program',
  type: 'deployment-playbook',
  title: 'Playbook',
  data: '# Playbook\n\nBody',
  createdAt: Date.parse('2026-10-01T00:00:00Z'),
  ...over,
})

describe('operations pack', () => {
  it('lists every section as missing, with its tool, when nothing is saved', () => {
    const pack = buildOperationsPack({ documents: [], now, origin: 'https://example.test' })
    expect(pack.present).toEqual([])
    expect(pack.missing).toHaveLength(OPERATIONS_PACK_SECTIONS.length)
    for (const m of pack.missing) expect(m.toolPath).toBeTruthy()
    expect(pack.markdown).toContain(`Sections: 0 of ${OPERATIONS_PACK_SECTIONS.length} present`)
    expect(pack.markdown).toContain('https://example.test/business/tools/deployment-playbook')
    expect(pack.markdown).toContain('https://example.test/playground/hsm-capacity')
    expect(pack.markdown).toContain(OPERATIONS_PACK_DISCLAIMER)
  })

  it('history links for its own artifact types open the pack', () => {
    expect(OPERATIONS_PACK_HISTORY_ROUTE).toBe(OPERATIONS_PACK_PANEL_PATH)
    const own = OPERATIONS_PACK_SECTIONS.map((s) => s.type).filter(
      (t) =>
        ![
          'refresh-cycle-alignment',
          'infra-modernization-plan',
          'migration-roadmap',
          'deployment-playbook',
          'kpi-tracker',
          'migration-verification',
        ].includes(t)
    )
    expect([...OPERATIONS_PACK_TYPES].sort()).toEqual([...own].sort())
  })

  it('every section links to a page that exists', () => {
    const businessIds = new Set(BUSINESS_TOOLS.map((t) => t.id))
    const playgroundIds = new Set(WORKSHOP_TOOLS.map((t) => t.id))
    for (const s of OPERATIONS_PACK_SECTIONS) {
      const path = String(toolPathFor(s))
      if (path.startsWith('/business/tools/')) {
        expect(businessIds.has(path.replace('/business/tools/', '')), path).toBe(true)
      } else if (path.startsWith('/playground/')) {
        expect(playgroundIds.has(path.replace('/playground/', '')), path).toBe(true)
      } else {
        expect([OPERATIONS_PACK_PANEL_PATH, '/learn/vpn-ssh-pqc']).toContain(path)
      }
    }
  })

  it('includes every saved configuration fragment, oldest first', () => {
    const pack = buildOperationsPack({
      now,
      documents: [
        doc({
          id: 'b',
          type: 'protocol-config',
          moduleId: 'tls-basics:tls-config:nginx:hybrid',
          title: 'nginx TLS (Hybrid)',
          data: '# Configuration: nginx',
          updatedAt: Date.parse('2026-10-05T00:00:00Z'),
        }),
        doc({
          id: 'a',
          type: 'protocol-config',
          moduleId: 'vpn-ssh-pqc:ssh-config:sshd_config:hybrid',
          title: 'OpenSSH server (Hybrid)',
          data: '# Configuration: OpenSSH',
          updatedAt: Date.parse('2026-10-03T00:00:00Z'),
        }),
      ],
    })
    expect(pack.present).toEqual(['protocol-config'])
    const md = pack.markdown
    expect(md.indexOf('OpenSSH server (Hybrid)')).toBeLessThan(md.indexOf('nginx TLS (Hybrid)'))
    expect(md).toContain('Protocol Configuration (2)')
  })
})

describe('tables to CSV', () => {
  it('splits rows and keeps escaped pipes inside a cell', () => {
    expect(splitRow('| a | b \\| c | d |')).toEqual(['a', 'b | c', 'd'])
  })

  it('finds tables under their headings and ignores code fences', () => {
    const md = [
      '## Results',
      '',
      '| Scenario | HSMs |',
      '|---|---|',
      '| Today | 2 |',
      '| After | 50 |',
      '',
      '```',
      '| not | a table |',
      '|---|---|',
      '```',
      '### Results',
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
    ].join('\n')
    const tables = extractMarkdownTables(md)
    expect(tables).toHaveLength(2)
    expect(tables[0]).toEqual({
      section: 'Results',
      heading: 'Results',
      header: ['Scenario', 'HSMs'],
      rows: [
        ['Today', '2'],
        ['After', '50'],
      ],
    })
    const files = tablesToCsvFiles(tables)
    expect(files.map((f) => f.path)).toEqual(['tables/results.csv', 'tables/results-2.csv'])
    expect(files[0].content).toBe('Scenario,HSMs\nToday,2\nAfter,50')
  })

  it('reads delimiter rows with colons and single dashes (GFM), as migration verification writes them', () => {
    const md = ['| System | Negotiation | Proof |', '|---|:--:|:-:|', '| api | yes | no |'].join(
      '\n'
    )
    expect(extractMarkdownTables(md)[0].rows).toEqual([['api', 'yes', 'no']])
  })

  it('names each CSV after its pack section and heading', () => {
    const { markdown } = buildOperationsPack({
      now,
      documents: [
        doc({
          type: 'hsm-capacity-plan',
          moduleId: 'hsm-capacity',
          data: '# HSM capacity plan\n\n## Results\n\n| A | B |\n|---|---|\n| 1 | 2 |',
        }),
        doc({
          type: 'cert-capacity-plan',
          moduleId: 'cert-capacity',
          data: '# Certificate capacity plan\n\n## Results\n\n| A | B |\n|---|---|\n| 3 | 4 |',
        }),
      ],
    })
    const paths = tablesToCsvFiles(extractMarkdownTables(markdown)).map((f) => f.path)
    expect(paths).toContain('tables/hsm-capacity-plan--results.csv')
    expect(paths).toContain('tables/certificate-capacity-plan--results.csv')
  })

  it('keeps configuration comments inside code fences as they were generated', () => {
    const config = '# Requires OpenSSH 9.9+\nKexAlgorithms mlkem768x25519-sha256'
    const { markdown } = buildOperationsPack({
      now,
      documents: [
        doc({
          type: 'protocol-config',
          moduleId: 'vpn-ssh-pqc:ssh-config:sshd_config:hybrid',
          data: `# Configuration: OpenSSH\n\n\`\`\`\n${config}\n\`\`\`\n`,
        }),
      ],
    })
    expect(markdown).toContain(`\n${config}\n`)
    expect(markdown).toContain('#### Configuration: OpenSSH')
  })

  it('zips the pack, a README and one CSV per table', () => {
    const plan = testPlanMarkdown(
      testPlanFromChecklist(checklistFor('ops')),
      'Operations test plan'
    )
    const { markdown } = buildOperationsPack({
      now,
      documents: [doc({ type: 'ops-test-plan', moduleId: 'operations-pack', data: plan })],
    })
    const files = operationsPackFiles(markdown)
    const paths = files.map((f) => f.path)
    expect(paths).toContain('operations-pack/README.md')
    expect(paths).toContain('operations-pack/operations-pack.md')
    const csv = files.find((f) => f.path === 'operations-pack/tables/operations-test-plan.csv')
    expect(csv?.content).toMatch(/^#,Check,Owner,Result\n1,/)
    expect(String(csv?.content).split('\n')).toHaveLength(checklistFor('ops').length + 1)
  })
})
