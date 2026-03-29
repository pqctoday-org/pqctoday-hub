const fs = require('fs')
const path = require('path')
const modulesDir = path.join(process.cwd(), 'src', 'components', 'PKILearning', 'modules')
const allModuleFolders = fs
  .readdirSync(modulesDir)
  .filter((f) => fs.statSync(path.join(modulesDir, f)).isDirectory())

const urlSlug = 'merkle-tree-certs'
let foundFolder = null
for (const folder of allModuleFolders) {
  const indexPath = path.join(modulesDir, folder, 'index.tsx')
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8')
    if (
      content.includes(`path: '${urlSlug}'`) ||
      content.includes(`path: "${urlSlug}"`) ||
      content.includes(`slug: '${urlSlug}'`) ||
      content.includes(`slug: "${urlSlug}"`) ||
      content.includes(urlSlug)
    ) {
      foundFolder = path.join(modulesDir, folder)
      console.log('Found explicitly in:', folder)
      break
    }
  }
}
if (!foundFolder) {
  const possibleFolder = allModuleFolders.find(
    (f) =>
      f.toLowerCase() === urlSlug.replace(/-/g, '').toLowerCase() ||
      f.includes(urlSlug.split('-')[0])
  )
  if (possibleFolder) {
    foundFolder = path.join(modulesDir, possibleFolder)
    console.log('Found by fallback in:', possibleFolder)
  } else {
    console.log('Not found at all')
  }
}
