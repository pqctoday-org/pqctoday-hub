import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const licensesPath = path.join(__dirname, '../licenses.json')
const outputPath = path.join(__dirname, '../LICENSES.md')

try {
  const licenses = JSON.parse(fs.readFileSync(licensesPath, 'utf8'))
  let output =
    '# Third-Party Licenses\n\nThis project uses the following third-party open source software:\n\n'

  for (const [pkg, info] of Object.entries(licenses)) {
    const [name, version] =
      pkg.lastIndexOf('@') > 0
        ? [pkg.substring(0, pkg.lastIndexOf('@')), pkg.substring(pkg.lastIndexOf('@') + 1)]
        : [pkg, '']

    output += `## ${name} ${version}\n`
    output += `- **License:** ${info.licenses}\n`
    if (info.repository) {
      output += `- **Repository:** ${info.repository}\n`
    }
    output += '\n'

    if (info.licenseFile) {
      try {
        const licenseContent = fs.readFileSync(info.licenseFile, 'utf8')
        output += '```text\n'
        output += licenseContent.trim()
        output += '\n```\n\n'
      } catch {
        output += '> License file could not be read.\n\n'
      }
    } else {
      output += '> License file not found.\n\n'
    }

    output += '---\n\n'
  }

  fs.writeFileSync(outputPath, output)
  console.log(`Successfully generated ${outputPath}`)
} catch (error) {
  console.error('Error generating licenses:', error)
  process.exit(1)
}
