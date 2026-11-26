// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The tools data file (`src/data/tools_*.csv`, read through
 * `tools.generated.ts`) is the one place every organising field of a tool
 * lives. These tests keep it that way:
 *  - one row per tool and one tool per row, sandbox scenarios included;
 *  - no registry or sandbox table still carries a field that now lives in the file;
 *  - the generated records match the newest dated file;
 *  - a lesson link in code agrees with the `module` column;
 *  - every page-visible fact is identical to what the app showed before the move.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'
import { describe, it, expect } from 'vitest'
import {
  BUSINESS_TOOL_RECORDS,
  PLAYGROUND_TOOL_RECORDS,
  SANDBOX_TOOL_RECORDS,
  TOOL_RECORDS,
  TOOL_RECORD_BY_ID,
} from './generated/tools.generated'
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TOOLS,
} from '@/components/BusinessCenter/businessToolsRegistry'
import {
  CATEGORIES,
  SANDBOX_TOOL_PREFIX,
  WORKSHOP_TOOLS,
} from '@/components/Playground/workshopRegistry'
import { SANDBOX_SCENARIOS } from './sandboxScenarios'
import { LEARN_MODULES, LEARN_MODULE_BY_ID } from './generated/learnModules.generated'
import { getToolNiceMapping, getToolsForCompetencyArea } from './toolNiceMapping'
import { moduleIdFromToolLink } from './moduleToolLinks'
import golden from './__golden__/toolFacts.beforeMove.golden.json'
import { captureToolFacts } from './__fixtures__/toolSnapshot'

/** Sort key of a dated file name: date, then revision. */
const key = (file: string) => {
  const m = file.match(/^tools_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)!
  return `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(3, '0')}`
}

const sources = import.meta.glob<string>(
  [
    '../components/Playground/workshopRegistry.tsx',
    '../components/BusinessCenter/businessToolsRegistry.tsx',
    './sandboxNiceMapping.ts',
    './toolNiceMapping.ts',
    './moduleToolLinks.ts',
  ],
  { eager: true, query: '?raw', import: 'default' }
)
const source = (suffix: string) => {
  const hit = Object.entries(sources).find(([path]) => path.endsWith(suffix))
  if (!hit) throw new Error(`no source for ${suffix}`)
  return hit[1]
}

/** The lines of a registry's content array (between its declaration and the closing bracket). */
function arrayLines(src: string, name: string): string[] {
  const lines = src.split('\n')
  const start = lines.findIndex((line) =>
    new RegExp(`^(export )?const ${name}\\b.*=\\s*\\[$`).test(line)
  )
  expect(start, `${name} not found`).toBeGreaterThanOrEqual(0)
  const end = lines.indexOf(']', start)
  return lines.slice(start + 1, end)
}

describe('tools data file: one row per tool', () => {
  it('has unique ids, and the ids of the three kinds never collide', () => {
    const ids = TOOL_RECORDS.map((row) => row.toolId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(TOOL_RECORDS).toHaveLength(95)
  })

  it('has exactly one row for every browser tool and one tool for every row', () => {
    const rows = PLAYGROUND_TOOL_RECORDS.map((row) => row.toolId).sort()
    const tools = WORKSHOP_TOOLS.filter((t) => !t.sandbox)
      .map((t) => t.id)
      .sort()
    expect(rows).toEqual(tools)
  })

  it('has exactly one row for every sandbox scenario and no row without a scenario', () => {
    const rows = SANDBOX_TOOL_RECORDS.map((row) => row.toolId).sort()
    const scenarios = SANDBOX_SCENARIOS.map((s) => `${SANDBOX_TOOL_PREFIX}${s.id}`).sort()
    expect(rows).toEqual(scenarios)
    expect(
      WORKSHOP_TOOLS.filter((t) => t.sandbox)
        .map((t) => t.id)
        .sort()
    ).toEqual(scenarios)
  })

  it('has exactly one row for every business tool and one tool for every row', () => {
    expect(BUSINESS_TOOL_RECORDS.map((row) => row.toolId).sort()).toEqual(
      BUSINESS_TOOLS.map((t) => t.id).sort()
    )
  })

  it('lists the browser tools and the scenarios in one run 1..58 and the business tools 1..37', () => {
    const run = [...PLAYGROUND_TOOL_RECORDS, ...SANDBOX_TOOL_RECORDS]
      .map((row) => row.order)
      .sort((a, b) => a - b)
    expect(run).toEqual(Array.from({ length: 58 }, (_, i) => i + 1))
    expect(BUSINESS_TOOL_RECORDS.map((row) => row.order)).toEqual(
      Array.from({ length: 37 }, (_, i) => i + 1)
    )
  })

  it('serves the registries in the order of the file', () => {
    expect(WORKSHOP_TOOLS.map((t) => t.id)).toEqual(
      [...PLAYGROUND_TOOL_RECORDS, ...SANDBOX_TOOL_RECORDS]
        .sort((a, b) => a.order - b.order)
        .map((row) => row.toolId)
    )
    expect(BUSINESS_TOOLS.map((t) => t.id)).toEqual(BUSINESS_TOOL_RECORDS.map((row) => row.toolId))
  })

  it('only uses categories the pages know', () => {
    for (const row of [...PLAYGROUND_TOOL_RECORDS, ...SANDBOX_TOOL_RECORDS]) {
      expect(CATEGORIES, row.toolId).toContain(row.category)
    }
    for (const row of BUSINESS_TOOL_RECORDS) {
      expect(BUSINESS_CATEGORIES, row.toolId).toContain(row.category)
    }
  })

  it('gives every Playground and sandbox tool at least one recommended role', () => {
    for (const row of [...PLAYGROUND_TOOL_RECORDS, ...SANDBOX_TOOL_RECORDS]) {
      expect(row.recommendedPersonas.length, row.toolId).toBeGreaterThan(0)
    }
  })
})

describe('tools data file: sandbox rows against the scenario file', () => {
  // The sandbox scenario file is written by an external sync and still carries a
  // title, a level and a track for each scenario. The Hub reads the data file;
  // these tests keep the two from drifting apart unnoticed.
  it.each(SANDBOX_SCENARIOS.map((s) => [s.id, s] as const))(
    'scenario %s agrees with its row',
    (_id, scenario) => {
      const row = TOOL_RECORD_BY_ID[`${SANDBOX_TOOL_PREFIX}${scenario.id}`]
      expect(row.kind).toBe('sandbox')
      if (row.kind !== 'sandbox') return
      expect(row.name).toBe(scenario.title)
      expect(row.level).toBe(scenario.difficulty)
      expect(row.sandboxTrack).toBe(scenario.trackId)
    }
  )

  it('numbers the sandbox tracking ids by the position of the scenario in the scenario file', () => {
    SANDBOX_SCENARIOS.forEach((scenario, index) => {
      const row = TOOL_RECORD_BY_ID[`${SANDBOX_TOOL_PREFIX}${scenario.id}`]
      expect(row.kind === 'sandbox' && row.ptId).toBe(
        `PT-SBX-${String(index + 1).padStart(3, '0')}`
      )
    })
  })
})

describe('tools data file: no organising field is left in code', () => {
  it('leaves no moved field in an entry of the Playground registry', () => {
    const offenders = arrayLines(source('workshopRegistry.tsx'), 'WORKSHOP_TOOL_CONTENT').filter(
      (line) =>
        /^ {4}(pt_id|version|name|category|difficulty|recommendedPersonas|sandbox|wip):/.test(line)
    )
    expect(offenders).toEqual([])
  })

  it('leaves no moved field in an entry of the business registry', () => {
    const offenders = arrayLines(
      source('businessToolsRegistry.tsx'),
      'BUSINESS_TOOL_CONTENT'
    ).filter((line) =>
      /^ {4}(name|category|audience|cswp39Zone|cswp39ZoneSubElement|cswp39SectionRef|cswp39SubSection|frameworkPhase):/.test(
        line
      )
    )
    expect(offenders).toEqual([])
  })

  it('has no sandbox table of categories or roles in the Playground registry', () => {
    const src = source('workshopRegistry.tsx')
    for (const name of [
      'SANDBOX_TRACK_PERSONAS',
      'SANDBOX_TRACK_CATEGORY',
      'SANDBOX_SCENARIO_CATEGORY',
      'sandboxDomainCategory',
    ]) {
      expect(src, name).not.toContain(name)
    }
  })

  it('has no sandbox NICE table left', () => {
    const src = source('sandboxNiceMapping.ts')
    for (const name of [
      'TIER_FROM_DIFFICULTY',
      'TRACK_DEFAULT_CAS',
      'TRACK_DEFAULT_WORK_ROLES',
      'SCENARIO_CA_OVERRIDES',
      'SCENARIO_WORK_ROLE_OVERRIDES',
    ]) {
      expect(src, name).not.toContain(name)
    }
  })

  it('has no hand-typed tool-to-lesson or tool title list left', () => {
    const src = source('moduleToolLinks.ts')
    expect(src).not.toMatch(/\['(hsm-capacity|slh-dsa|rng-demo)'/)
  })
})

describe('tools data file: generated records', () => {
  it('are current against the newest dated CSV', () => {
    const script = join(process.cwd(), 'scripts', 'ci', 'gen-tools.mjs')
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' })
    ).not.toThrow()
  })
})

describe('tools data file: NICE statements', () => {
  const STATEMENT = /^[KST]\d{4}$/

  it('lists only well-formed statement ids, each once, never as both taught and practised (the generator checks them against the NICE components)', () => {
    for (const row of TOOL_RECORDS) {
      const taught = row.niceStatementsTaught ?? []
      const practised = row.niceStatementsPractised ?? []
      for (const id of [...taught, ...practised]) {
        expect(id, `${row.toolId}: ${id}`).toMatch(STATEMENT)
      }
      expect(new Set(taught).size, `${row.toolId}: repeated taught id`).toBe(taught.length)
      expect(new Set(practised).size, `${row.toolId}: repeated practised id`).toBe(practised.length)
      expect(
        taught.filter((id) => practised.includes(id)),
        `${row.toolId}: taught and practised`
      ).toEqual([])
    }
  })

  it('has the two statement columns in the newest dated file, empty or filled', () => {
    const header = readFileSync(
      join(
        process.cwd(),
        'src',
        'data',
        readdirSync(join(process.cwd(), 'src', 'data'))
          .filter((f) => /^tools_\d{8}(_r\d+)?\.csv$/.test(f))
          .sort((a, b) => key(a).localeCompare(key(b)))
          .pop()!
      ),
      'utf8'
    ).split('\n')[0]
    expect(header.split(',')).toEqual(
      expect.arrayContaining(['nice_statements_taught', 'nice_statements_practised'])
    )
  })
})

describe('tools data file: lesson links', () => {
  it('names the lesson a tool opens, and only that lesson', () => {
    for (const tool of WORKSHOP_TOOLS.filter((t) => !t.sandbox)) {
      const row = TOOL_RECORD_BY_ID[tool.id]
      expect(row.kind).toBe('playground')
      if (row.kind !== 'playground') continue
      expect(row.module ?? null, `${tool.id}: moduleLink ${tool.moduleLink}`).toBe(
        moduleIdFromToolLink(tool.moduleLink)
      )
    }
  })

  it('points every module cell at a real lesson', () => {
    for (const row of TOOL_RECORDS) {
      if (row.module) expect(LEARN_MODULE_BY_ID[row.module], row.toolId).toBeDefined()
    }
  })

  it("repeats none of its lesson's NICE values in its own row", () => {
    // One copy: a Playground tool with a lesson reads its NICE tier, areas and roles from that lesson
    // (the generator does it); the tool's own cells stay blank. Sandbox scenarios keep their own.
    const dir = join(process.cwd(), 'src', 'data')
    const file = readdirSync(dir)
      .filter((f) => /^tools_\d{8}(_r\d+)?\.csv$/.test(f))
      .sort((a, b) => key(a).localeCompare(key(b)))
      .pop()!
    const rows = Papa.parse<Record<string, string>>(readFileSync(join(dir, file), 'utf8'), {
      header: true,
      skipEmptyLines: true,
    }).data
    const withLesson = rows.filter((row) => row.kind === 'playground' && row.module)
    expect(withLesson.length).toBeGreaterThan(30)
    for (const row of withLesson) {
      expect(
        [row.nice_tier, row.nice_competency_areas, row.nice_work_roles].filter(Boolean),
        `${row.tool_id} repeats its lesson's NICE values`
      ).toEqual([])
    }
  })

  it("gives a tool with a lesson that lesson's NICE values, in the NICE view too", () => {
    const tools = WORKSHOP_TOOLS.filter((tool) => !tool.sandbox)
    for (const row of PLAYGROUND_TOOL_RECORDS) {
      if (!row.module) continue
      const lesson = LEARN_MODULE_BY_ID[row.module]
      expect(row.niceTier, row.toolId).toBe(lesson.niceTier)
      expect(row.niceCompetencyAreas, row.toolId).toEqual(lesson.niceCompetencyAreas)
      expect(row.niceWorkRoles, row.toolId).toEqual(lesson.niceWorkRoles)
      const tool = tools.find((t) => t.id === row.toolId)!
      const ref = getToolNiceMapping(tool)
      expect(ref?.tier, `${row.toolId} in the NICE view`).toBe(lesson.niceTier)
      for (const area of lesson.niceCompetencyAreas) {
        expect(
          getToolsForCompetencyArea(area, tools).some((entry) => entry.tool.id === row.toolId),
          `${row.toolId} is listed under ${area}`
        ).toBe(true)
      }
    }
    // the two that had no NICE values before they were linked to a lesson
    for (const id of ['cacp-kmip', 'openssl-studio']) {
      expect(getToolNiceMapping(tools.find((t) => t.id === id)!), id).toBeDefined()
    }
  })

  it('agrees with the lessons file about which tool a lesson offers, except for one lesson', () => {
    // A lesson's `playground_tool` (lessons file) and the tool's own `module`
    // (this file) are two sides of one link. They agree for every lesson but one:
    // the code-signing lesson offers the firmware signing tool, whose own link
    // opens the secure-boot lesson. Visitors see both today; the owner decides
    // which side is right.
    const disagreements = LEARN_MODULES.filter((lesson) => lesson.playgroundTool).flatMap(
      (lesson) => {
        const row = TOOL_RECORD_BY_ID[lesson.playgroundTool!]
        const module = row?.kind === 'playground' ? row.module : undefined
        return module === lesson.id ? [] : [`${lesson.id} -> ${lesson.playgroundTool} (${module})`]
      }
    )
    expect(disagreements).toEqual(['code-signing -> firmware-signing (secure-boot-pqc)'])
  })
})

describe('the move changed nothing a page shows', () => {
  const now = captureToolFacts()
  const before = golden as unknown as Record<string, unknown>

  // The module-to-tools map is keyed by module; only the order of its keys differs now
  // (they follow the tools file, not a hand-typed list), so compare it by key.
  const byKey = (entries: unknown) =>
    [...(entries as [string, unknown][])].sort(([a], [b]) => a.localeCompare(b))

  // Changes made on purpose since the move, each one the owner's decision. They are applied to the
  // snapshot below, so everything else must still be identical to what pages showed before the move.
  //  - 25 Nov 2026 ("Link it to Crypto Agility"): the KMIP control plane tool opens the Crypto Agility
  //    lesson from its card (its own page stays /playground/cacp), so that lesson now offers it back.
  //  - 25 Nov 2026 ("Crypto Developer APIs"): OpenSSL Studio likewise opens the Crypto Developer APIs lesson.
  const intended = (key: string): unknown => {
    const snapshot = structuredClone(before[key])
    if (key === 'workshopTools') {
      for (const tool of snapshot as { id: string; moduleLink: string; version: string }[]) {
        // a changed lesson link is a change to the tool: its version goes up by a patch
        if (tool.id === 'cacp-kmip') {
          tool.moduleLink = '/learn/crypto-agility'
          tool.version = '1.0.10'
        }
        if (tool.id === 'openssl-studio') {
          tool.moduleLink = '/learn/crypto-dev-apis'
          tool.version = '1.0.8'
        }
      }
    }
    if (key === 'toolNice') {
      // the two tools linked to a lesson take that lesson's NICE values (the tool's entry in the snapshot was null)
      const ids = (before.workshopTools as { id: string }[]).map((tool) => tool.id)
      for (const [id, lessonId] of [
        ['cacp-kmip', 'crypto-agility'],
        ['openssl-studio', 'crypto-dev-apis'],
      ]) {
        const lesson = LEARN_MODULE_BY_ID[lessonId]
        ;(snapshot as unknown[])[ids.indexOf(id)] = {
          toolId: id,
          competencyAreas: [...lesson.niceCompetencyAreas],
          tier: lesson.niceTier,
          workRoles: [...lesson.niceWorkRoles],
        }
      }
    }
    if (key === 'toolsByModuleId')
      (snapshot as [string, string[]][]).push(
        ['crypto-agility', ['cacp-kmip']],
        ['crypto-dev-apis', ['openssl-studio']]
      )
    if (key === 'toolByModuleId')
      (snapshot as [string, string][]).push(
        ['crypto-agility', 'cacp-kmip'],
        ['crypto-dev-apis', 'openssl-studio']
      )
    return snapshot
  }

  it.each(Object.keys(before))('%s is identical to the pre-move snapshot', (key) => {
    if (key === 'toolsByModuleId' || key === 'toolByModuleId') {
      expect(byKey(now[key])).toEqual(byKey(intended(key)))
    } else {
      expect(now[key]).toEqual(intended(key))
    }
  })
  describe('what a learner can keep from a tool', () => {
    const artifactTypes = JSON.parse(
      readFileSync(join(process.cwd(), 'src', 'data', 'toolArtifactTypes.json'), 'utf8')
    ).types as { id: string; meaning: string }[]

    it('has the two output columns in the newest dated file, empty or filled', () => {
      const file = readdirSync(join(process.cwd(), 'src', 'data'))
        .filter((f) => /^tools_\d{8}(_r\d+)?\.csv$/.test(f))
        .sort((a, b) => key(a).localeCompare(key(b)))
        .pop()!
      const header = readFileSync(join(process.cwd(), 'src', 'data', file), 'utf8').split('\n')[0]
      expect(header.split(',')).toEqual(
        expect.arrayContaining(['produces_artifact', 'artifact_type'])
      )
    })

    it('lists each kind once, each with a meaning', () => {
      expect(artifactTypes.map((t) => t.id)).toEqual([
        'document',
        'certificate',
        'key',
        'tls-run',
        'run-record',
        'data-file',
      ])
      for (const t of artifactTypes) expect(t.meaning.length, t.id).toBeGreaterThan(10)
    })

    it('every record carries a kind only when it says it produces one', () => {
      const ids = artifactTypes.map((t) => t.id)
      for (const record of TOOL_RECORDS) {
        if (record.producesArtifact === true) {
          expect(ids, `${record.toolId}: artifactType`).toContain(record.artifactType)
        } else {
          expect(record.artifactType, `${record.toolId}: artifactType`).toBeUndefined()
        }
      }
    })
  })
})
