import { complianceFrameworks } from './src/data/complianceData'
import { getSourcesForRecord } from './src/data/trustedSourceXrefData'

const missing = []
for (const fw of complianceFrameworks) {
  const sources = getSourcesForRecord('compliance', fw.id)
  if (sources.length === 0) {
    missing.push(fw)
  }
}

console.log(`Total compliance frameworks: ${complianceFrameworks.length}`)
console.log(`Frameworks missing a trusted source: ${missing.length}`)
if (missing.length > 0) {
  console.log('\nList of missing frameworks:')
  for (const fw of missing) {
    console.log(`- ${fw.id}: ${fw.label} (${fw.bodyType})`)
  }
}
