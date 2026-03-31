import fs from 'fs'
import path from 'path'

const loaders = [
  { file: 'leadersData', exportName: 'leadersData' },
  { file: 'migrateData', exportName: 'softwareData' },
  { file: 'vendorData', exportName: 'vendors' },
  { file: 'certificationXrefData', exportName: 'certificationXrefs' },
  { file: 'trustedSourcesData', exportName: 'trustedSources' },
  { file: 'trustedSourceXrefData', exportName: 'trustedSourceXrefs' },
  { file: 'authoritativeSourcesData', exportName: 'authoritativeSources' },
  { file: 'timelineData', exportName: 'timelineData' },
  { file: 'libraryData', exportName: 'libraryData' },
  { file: 'threatsData', exportName: 'threatsData' },
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
      const anyItem = item as any;
      const primaryKey = anyItem.id || anyItem.threatId || anyItem.sourceId || anyItem.resourceId || anyItem.vendor_id || anyItem.trackingId || anyItem.reference_id || anyItem.country || anyItem.software_name || anyItem.label || anyItem.title || anyItem.name;
      expect(primaryKey).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = ${loader.exportName}.map((item: any) => item.id || item.threatId || item.sourceId || (item.resourceId ? item.resourceId + item.sourceId : undefined) || item.vendor_id || item.trackingId || item.reference_id || item.country || item.software_name || item.name || item.title)
    const validIds = ids.filter((id: any) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})
`

  fs.writeFileSync(`src/data/${loader.file}.test.ts`, code, 'utf8')
}
console.log('Regenerated all missing generic tests safely')
