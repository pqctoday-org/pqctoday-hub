// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  checkToolVersions,
  literalStrings,
  newestToolsCsv,
  parseToolBlocks,
  semverGt,
} from './check-tool-version-bump'

/** A registry in the shape it had before the organising fields moved to the data file. */
function oldRegistry(opts: { alphaName?: string; alphaVersion?: string; extra?: string } = {}) {
  return `export const WORKSHOP_TOOLS: WorkshopTool[] = [
  {
    id: 'alpha',
    pt_id: 'PT-001',
    version: '${opts.alphaVersion ?? '1.0.0'}',
    name: '${opts.alphaName ?? 'Alpha Tool'}',
    description:
      'Does alpha things',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-KEM'],
    icon: ShieldCheck,
    moduleLink: '/learn/alpha-module',
    keywords: ['alpha'],
    difficulty: 'advanced',
    requires: [],
    recommendedPersonas: ['developer', 'architect'],
    intro: {
      whatYouWillDo: 'Run it',
      workedExample: 'Run it twice',
    },
  },
  {
    id: 'api-security-jwt',
    pt_id: 'PT-032',
    version: '1.3.5',
    name: 'API Security & JWT Workshop',
    description: 'JWT',
    category: 'OpenSSL Studio',
    algorithms: [],
    icon: ShieldCheck,
    moduleLink: '/learn/api-security-jwt',
    keywords: [],
    difficulty: 'intermediate',
    requires: [],
    recommendedPersonas: ['developer'],
  },
]
${opts.extra ?? ''}
const SANDBOX_SCENARIO_CATEGORY: Record<string, WorkshopCategory> = {
  'api-security-jwt': 'OpenSSL Studio',
  'firmware-hss': 'HSM / PKCS#11',
}
`
}

/** The same registry after a pure move: the moved fields are gone, the rest is untouched. */
function movedRegistry(
  opts: { extra?: string; alphaDescription?: string; keepJwtMap?: boolean } = {}
) {
  return `export const WORKSHOP_TOOL_CONTENT: WorkshopToolContent[] = [
  {
    id: 'alpha',
    description:
      '${opts.alphaDescription ?? 'Does alpha things'}',
    algorithms: ['ML-KEM'],
    icon: ShieldCheck,
    moduleLink: '/learn/alpha-module',
    keywords: ['alpha'],
    requires: [],
    intro: {
      whatYouWillDo: 'Run it',
      workedExample: 'Run it twice',
    },
  },
  {
    id: 'api-security-jwt',
    description: 'JWT',
    algorithms: [],
    icon: ShieldCheck,
    moduleLink: '/learn/api-security-jwt',
    keywords: [],
    requires: [],
  },
]
${opts.extra ?? ''}
const SANDBOX_SCENARIO_CATEGORY: Record<string, WorkshopCategory> = {
${opts.keepJwtMap ? "  'api-security-jwt': 'OpenSSL Studio',\n" : ''}  'firmware-hss': 'HSM / PKCS#11',
}
`
}

const HEADER =
  'tool_id,kind,pt_id,version,name,category,order,level,module,sandbox_track,recommended_personas,audience,nice_tier,nice_competency_areas,nice_work_roles,framework_phase,cswp39_zone,cswp39_zone_sub_element,cswp39_section_ref,cswp39_sub_section,work_in_progress'

function csv(opts: { alpha?: Partial<Record<string, string>>; jwtLevel?: string } = {}) {
  const alpha = {
    version: '1.0.0',
    name: 'Alpha Tool',
    category: 'HSM / PKCS#11',
    level: 'advanced',
    personas: 'developer;architect',
    ...opts.alpha,
  }
  return [
    HEADER,
    `alpha,playground,PT-001,${alpha.version},${alpha.name},${alpha.category},1,${alpha.level},alpha-module,,${alpha.personas},,,,,,,,,,`,
    `api-security-jwt,playground,PT-032,1.3.5,API Security & JWT Workshop,OpenSSL Studio,2,${opts.jwtLevel ?? 'intermediate'},api-security-jwt,,developer,,,,,,,,,,`,
    'sbx-tls,sandbox,PT-SBX-001,,OpenSSL TLS,Protocol Simulations,3,advanced,,protocol-simulation,developer,,,,,,,,,,true',
    'roi-calculator,business,,,ROI Calculator,Risk & Strategy,1,,,,,,,,,p0,governance,,§5,,',
  ].join('\n')
}

const base = { registry: oldRegistry() }

describe('parseToolBlocks', () => {
  it('finds every tool entry, with nested objects, by line', () => {
    const blocks = parseToolBlocks(oldRegistry())
    expect(blocks.map((b) => b.id)).toEqual(['alpha', 'api-security-jwt'])
    expect(blocks[0].fields.get('intro')).toContain('workedExample')
    expect(blocks[0].fields.get('recommendedPersonas')).toBe("['developer', 'architect']")
  })

  it('finds the entries of a registry after the move', () => {
    expect(parseToolBlocks(movedRegistry()).map((b) => b.id)).toEqual(['alpha', 'api-security-jwt'])
  })

  it('reads nothing where there is no tool array', () => {
    expect(parseToolBlocks('export const X = 1\n')).toEqual([])
  })
})

describe('literalStrings', () => {
  it('reads a string, a list of strings and unescapes quotes', () => {
    expect(literalStrings(" 'a b'")).toEqual(['a b'])
    expect(literalStrings('[\'x\', "y"]')).toEqual(['x', 'y'])
    expect(literalStrings("'it\\'s'")).toEqual(["it's"])
  })
  it('refuses anything that is not only string literals', () => {
    expect(literalStrings('somethingElse')).toBeNull()
    expect(literalStrings('`a${b}`')).toBeNull()
  })
})

describe('check-tool-version-bump: the parser sees the real registry shape', () => {
  it('flags a name change in code with no version raise', () => {
    const result = checkToolVersions(base, {
      registry: oldRegistry({ alphaName: 'Alpha Renamed' }),
    })
    expect(result.modified).toEqual(['alpha'])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain("'alpha'")
  })

  it('passes a name change that raises the version', () => {
    const result = checkToolVersions(base, {
      registry: oldRegistry({ alphaName: 'Alpha Renamed', alphaVersion: '1.0.1' }),
    })
    expect(result.errors).toEqual([])
    expect(result.bumped).toEqual([
      { tool_id: 'alpha', old_version: '1.0.0', new_version: '1.0.1' },
    ])
  })

  it('does not flag a tool because another line of the file mentions its id', () => {
    const head = {
      registry: oldRegistry().replace(
        "'firmware-hss': 'HSM / PKCS#11',",
        "'api-security-jwt': 'Other',\n  'firmware-hss': 'HSM / PKCS#11',"
      ),
    }
    expect(checkToolVersions(base, head).errors).toEqual([])
  })

  it('passes an edit to another tool only', () => {
    const head = {
      registry: oldRegistry().replace("description: 'JWT'", "description: 'JWT tokens'"),
    }
    const result = checkToolVersions(base, head)
    expect(result.modified).toEqual(['api-security-jwt'])
    expect(result.errors).toHaveLength(1)
  })
})

describe('check-tool-version-bump: a pure move to the data file', () => {
  it('passes when the moved fields are removed and the file carries the same values', () => {
    const result = checkToolVersions(base, { registry: movedRegistry(), csv: csv() })
    expect(result.modified).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('passes when removing a sandbox-map line whose key equals a native tool id', () => {
    // base still has 'api-security-jwt' in the map; the head drops that line.
    const result = checkToolVersions(base, {
      registry: movedRegistry({ keepJwtMap: false }),
      csv: csv(),
    })
    expect(result.errors).toEqual([])
    expect(result.modified).not.toContain('api-security-jwt')
  })

  it('fails when a value changed during the move', () => {
    const result = checkToolVersions(base, {
      registry: movedRegistry(),
      csv: csv({ alpha: { level: 'beginner' } }),
    })
    expect(result.modified).toEqual(['alpha'])
    expect(result.errors).toHaveLength(1)
  })

  it('fails when a removed field has no value in the file', () => {
    const blank = csv().replace('developer;architect', '')
    const result = checkToolVersions(base, { registry: movedRegistry(), csv: blank })
    expect(result.modified).toEqual(['alpha'])
  })

  it('fails when a list value differs in order or content', () => {
    const result = checkToolVersions(base, {
      registry: movedRegistry(),
      csv: csv({ alpha: { personas: 'architect;developer' } }),
    })
    expect(result.modified).toEqual(['alpha'])
  })

  it('fails when kept content changes during the move', () => {
    const result = checkToolVersions(base, {
      registry: movedRegistry({ alphaDescription: 'Does different things' }),
      csv: csv(),
    })
    expect(result.modified).toEqual(['alpha'])
  })

  it('does not treat comment lines or blank lines as a change', () => {
    const withComment = movedRegistry().replace(
      "    algorithms: ['ML-KEM'],",
      "    // a note about the entry\n\n    algorithms: ['ML-KEM'],"
    )
    expect(checkToolVersions(base, { registry: withComment, csv: csv() }).errors).toEqual([])
  })
})

describe('check-tool-version-bump: edits after the move', () => {
  const moved = { registry: movedRegistry(), csv: csv() }

  it('flags a name change in the data file with no version raise', () => {
    const head = { registry: movedRegistry(), csv: csv({ alpha: { name: 'Alpha Renamed' } }) }
    const result = checkToolVersions(moved, head)
    expect(result.modified).toEqual(['alpha'])
    expect(result.errors).toHaveLength(1)
  })

  it('counts a version raise in the data file', () => {
    const head = {
      registry: movedRegistry(),
      csv: csv({ alpha: { name: 'Alpha Renamed', version: '1.1.0' } }),
    }
    const result = checkToolVersions(moved, head)
    expect(result.errors).toEqual([])
    expect(result.bumped).toEqual([
      { tool_id: 'alpha', old_version: '1.0.0', new_version: '1.1.0' },
    ])
  })

  it('flags a changed lesson link in the data file', () => {
    const head = { registry: movedRegistry(), csv: csv().replace('alpha-module', 'other-module') }
    expect(checkToolVersions(moved, head).modified).toEqual(['alpha'])
  })

  it('does not flag a reorder, a sandbox row or a business row', () => {
    const reordered = csv()
      .replace('advanced,alpha-module', 'advanced,alpha-module')
      .replace('Protocol Simulations,3', 'Protocol Simulations,9')
      .replace('Risk & Strategy,1', 'Risk & Strategy,4')
    expect(checkToolVersions(moved, { registry: movedRegistry(), csv: reordered }).errors).toEqual(
      []
    )
  })

  it('does not require a bump for a new tool', () => {
    const head = {
      registry: oldRegistry({ extra: '' }).replace("id: 'alpha'", "id: 'alpha-two'"),
      csv: undefined,
    }
    const result = checkToolVersions(base, head)
    expect(result.errors.filter((e) => e.includes('alpha-two'))).toEqual([])
  })
})

describe('helpers', () => {
  it('compares versions', () => {
    expect(semverGt('1.0.0', '1.0.1')).toBe(true)
    expect(semverGt('1.0.9', '1.1.0')).toBe(true)
    expect(semverGt('1.1.0', '1.1.0')).toBe(false)
    expect(semverGt('2.0.0', '1.9.9')).toBe(false)
  })

  it('picks the newest dated tools file', () => {
    expect(
      newestToolsCsv([
        'tools_11252026.csv',
        'tools_11252026_r2.csv',
        'tools_12012026.csv',
        'x.csv',
        'tools_10012027.csv',
      ])
    ).toBe('tools_10012027.csv')
    expect(newestToolsCsv(['tools_11252026.csv', 'tools_11252026_r2.csv'])).toBe(
      'tools_11252026_r2.csv'
    )
    expect(newestToolsCsv(['x.csv'])).toBeNull()
  })
})
