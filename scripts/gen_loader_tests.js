import fs from 'fs'
import path from 'path'

// Define the loaders and the array export name we care about
const loaders = [
  { file: 'leadersData', exportName: 'leadersData', idField: 'id' },
  { file: 'migrateData', exportName: 'softwareData', idField: 'tracking_id' },
  { file: 'vendorData', exportName: 'vendors', idField: 'id' },
  { file: 'certificationXrefData', exportName: 'certificationXrefs', idField: 'reference_id' },
  { file: 'trustedSourcesData', exportName: 'trustedSources', idField: 'id' },
  { file: 'trustedSourceXrefData', exportName: 'trustedSourceXrefs', idField: 'implementation_id' },
  { file: 'authoritativeSourcesData', exportName: 'authoritativeSources', idField: 'reference_id' },
  { file: 'timelineData', exportName: 'timelineData', idField: 'id' },
  { file: 'libraryData', exportName: 'libraryData', idField: 'reference_id' },
  { file: 'threatsData', exportName: 'threatsData', idField: 'id' },
]

for (const loader of loaders) {
  const code = `import { describe, it, expect } from 'vitest'
import { ${loader.exportName} } from './${loader.file}'

describe('${loader.file}', () => {
  it('loads without error', () => {
    expect(${loader.exportName}.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of ${loader.exportName}) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of ${loader.exportName}) {
      // Assuming almost every object has an ID field
      expect((item as any).${loader.idField} || (item as any).id || (item as any).name || (item as any).title || (item as any).reference_id).toBeTruthy()
    }
  })

  it('has unique IDs', () => {
    // We check uniqueness on either the given idField or fallback to a standard one
    const ids = ${loader.exportName}.map((item: any) => item.${loader.idField} || item.id || item.name || item.reference_id)
    // Filter out undefined if some rows don't have this exact primary key
    const validIds = ids.filter((id: any) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
`

  fs.writeFileSync(`src/data/${loader.file}.test.ts`, code, 'utf8')
  console.log(`Generated src/data/${loader.file}.test.ts`)
}

// Special case for standardsRegistry
const registryCode = `import { describe, it, expect } from 'vitest'
import { standardsCount, getStandard, hasStandard } from './standardsRegistry'

describe('standardsRegistry', () => {
  it('loads without error', () => {
    expect(standardsCount).toBeGreaterThan(0)
  })

  it('getStandard throws on missing, succeeds on existing', () => {
    // We expect FIPS 203 to exist as a standard
    expect(hasStandard('FIPS 203')).toBe(true)
    const std = getStandard('FIPS 203')
    expect(std.id).toBe('FIPS 203')
    
    expect(() => getStandard('NON_EXISTENT')).toThrow()
  })
})
`
fs.writeFileSync('src/data/standardsRegistry.test.ts', registryCode, 'utf8')
console.log('Generated src/data/standardsRegistry.test.ts')
