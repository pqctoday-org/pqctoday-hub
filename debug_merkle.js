const fs = require('fs')
const path = require('path')
const dirPath = path.join(
  process.cwd(),
  'src',
  'components',
  'PKILearning',
  'modules',
  'MerkleTreeCerts'
)

function readAllTsx(dirPath) {
  let result = ''
  if (!fs.existsSync(dirPath)) return result
  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    if (file === 'node_modules') continue
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      result += readAllTsx(fullPath)
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.md')) {
      result += fs.readFileSync(fullPath, 'utf-8') + '\n'
    }
  }
  return result
}

const sourceCode = readAllTsx(dirPath)
const normalizedSource = sourceCode.toLowerCase().replace(/[,.()[\]"']/g, '')

const kws = ['12.3 KB', '45 KB', '900 bytes', '5.7 KB', 'RFC 9162', 'RFC 6962']
for (const kw of kws) {
  const normalizedKw = kw.toLowerCase().replace(/[,.()[\]"']/g, '')
  console.log(`Checking ${kw} -> ${normalizedKw}`)
  console.log(`Found: ${normalizedSource.includes(normalizedKw)}`)
}
