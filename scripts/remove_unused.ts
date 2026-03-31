/* eslint-disable */
import { Project } from 'ts-morph'

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
})
project.addSourceFilesAtPaths('src/components/About/sections/**/*.tsx')

for (const sourceFile of project.getSourceFiles()) {
  // Fix imports
  sourceFile.fixUnusedIdentifiers()

  // Find all VariableDeclaration and check if they are unused
  const varDeclarations = sourceFile.getVariableDeclarations()
  for (const dec of varDeclarations) {
    const nameNode = dec.getNameNode()

    // For arrays like [isFoo, setIsFoo]
    if (nameNode.getKindName() === 'ArrayBindingPattern') {
      let allUnused = true
      for (const el of (nameNode as any).getElements()) {
        if (el.getKindName() === 'OmittedExpression') continue
        const name = el.getNameNode()
        const refs = name.findReferencesAsNodes()
        // A reference is the declaration itself. If > 1, it's used.
        if (refs.length > 1) {
          allUnused = false
        }
      }
      if (allUnused) {
        dec.getVariableStatement()?.remove()
      }
    } else if (nameNode.getKindName() === 'ObjectBindingPattern') {
      let allUnused = true
      for (const el of (nameNode as any).getElements()) {
        const name = el.getNameNode()
        const refs = name.findReferencesAsNodes()
        if (refs.length > 1) {
          allUnused = false
        }
      }
      if (allUnused) {
        dec.getVariableStatement()?.remove()
      }
    }
  }

  sourceFile.saveSync()
}
console.log('Done fixing unused vars')
