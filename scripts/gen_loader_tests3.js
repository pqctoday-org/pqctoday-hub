import fs from 'fs'

const loaders = [
  { file: 'leadersData', exportName: 'leadersData', checkFields: ['id'], idFunc: 'item.id' },
  {
    file: 'migrateData',
    exportName: 'softwareData',
    checkFields: ['softwareName'],
    idFunc: 'item.softwareName',
  },
  { file: 'vendorData', exportName: 'vendors', checkFields: ['vendorId'], idFunc: 'item.vendorId' },
  {
    file: 'certificationXrefData',
    exportName: 'certificationXrefs',
    checkFields: ['softwareName'],
    idFunc: 'item.softwareName + "-" + item.certId',
  },
  {
    file: 'trustedSourcesData',
    exportName: 'trustedSources',
    checkFields: ['sourceId'],
    idFunc: 'item.sourceId',
  },
  {
    file: 'trustedSourceXrefData',
    exportName: 'trustedSourceXrefs',
    checkFields: ['resourceId', 'sourceId'],
    idFunc: 'item.resourceId + "-" + item.sourceId',
  },
  {
    file: 'authoritativeSourcesData',
    exportName: 'authoritativeSources',
    checkFields: ['sourceName'],
    idFunc: 'item.sourceName',
  },
  {
    file: 'timelineData',
    exportName: 'timelineData',
    checkFields: ['countryName'],
    idFunc: 'item.countryName',
  },
  {
    file: 'libraryData',
    exportName: 'libraryData',
    checkFields: ['referenceId'],
    idFunc: 'item.referenceId',
  },
  {
    file: 'threatsData',
    exportName: 'threatsData',
    checkFields: ['threatId'],
    idFunc: 'item.threatId',
  },
  {
    file: 'complianceData',
    exportName: 'complianceFrameworks',
    checkFields: ['id'],
    idFunc: 'item.id',
  },
]

for (const loader of loaders) {
  const expectsStr = loader.checkFields
    .map((f) => `expect((item as any).${f}).toBeTruthy();`)
    .join('\n      ')
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
      ${expectsStr}
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = ${loader.exportName}.map((item: any) => ${loader.idFunc})
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
console.log('Regenerated accurately!')
