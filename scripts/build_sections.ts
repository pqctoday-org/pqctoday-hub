import * as fs from 'fs'
import * as path from 'path'

const dir = 'src/components/About/sections'

const sectionsToBuild = [
  { file: 'temp_Bio_Section___Mission_Statement.tsx', name: 'VisionSection' },
  { file: 'temp_Transparency_&_Disclaimer_Section.tsx', name: 'TransparencySection' },
  { file: 'temp_Google_Drive_Sync_—_Privacy_Section.tsx', name: 'CloudSyncPrivacySection' },
  { file: 'temp_Community_Section.tsx', name: 'CommunitySection' }, // Also needs Stronger Together
  { file: 'temp_Data_Foundation_Section.tsx', name: 'DataFoundationSection' },
  { file: 'temp_SBOM_Section.tsx', name: 'SbomSection' },
  { file: 'temp_Security_Audit_Section.tsx', name: 'SecurityAuditSection' },
  { file: 'temp_Data_Privacy_Section.tsx', name: 'DataPrivacySection' },
  { file: 'temp_License_Section.tsx', name: 'LicenseSection' },
  { file: 'temp_RAG_&_Gemini_Flash_2.5_Section.tsx', name: 'RagAiSection' },
  { file: 'temp_Cryptography_Buff_Section.tsx', name: 'CryptoBuffSection' },
  { file: 'temp_Appearance_Section.tsx', name: 'AppearanceSection' },
]

// For each section, wrap it in a function and save.
for (const s of sectionsToBuild) {
  const content = fs.readFileSync(path.join(dir, s.file), 'utf8')

  // Make it responsive by replacing "p-6" with "p-4 md:p-6"
  const responsiveContent = content.replace(/p-6/g, 'p-4 md:p-6')

  // Create shell
  const out = `
export function ${s.name}() {
  return (
    ${responsiveContent}
  )
}
`
  fs.writeFileSync(path.join(dir, s.name + '.tsx'), out)
}
console.log('Built shells')
