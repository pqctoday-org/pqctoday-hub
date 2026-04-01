import { Project } from 'ts-morph'
import * as fs from 'fs'

const project = new Project()
const sourceFile = project.addSourceFileAtPath('src/components/Playground/tabs/KemOpsTab.tsx')

// Extract imports to reuse
const imports = sourceFile.getImportDeclarations().map(imp => imp.getText())

// Define targets to extract
const targets = [
  { name: 'HsmKemPanel', file: 'src/components/Playground/tabs/HsmKemPanel.tsx' },
  { name: 'KemOpsTabSoftware', file: 'src/components/Playground/tabs/KemOpsTabSoftware.tsx' },
  { name: 'X25519ECDHPanel', file: 'src/components/Playground/tabs/X25519ECDHPanel.tsx' }
]

const helperCodeList = []

// Find shared helpers the components might use (constants, functions outside functions)
for (const varDecl of sourceFile.getVariableStatements()) {
  const name = varDecl.getDeclarations()[0].getName()
  if (!targets.some(t => t.name === name) && name !== 'KemOpsTab') {
    helperCodeList.push(varDecl.getText())
  }
}

const sharedHelpers = helperCodeList.join('\n\n')

// For each target, create a new file containing the imports, helpers, and the component
for (const target of targets) {
  let compText = ''
  
  // Try to find it as a variable declaration
  const varDecl = sourceFile.getVariableStatement(target.name)
  if (varDecl) {
    compText = varDecl.getText()
    // Make sure it's exported in the new file
    if (!varDecl.hasExportKeyword()) {
      compText = 'export ' + compText
    }
  } else {
    // Maybe it's a function declaration
    const funcDecl = sourceFile.getFunction(target.name)
    if (funcDecl) {
      compText = funcDecl.getText()
      if (!funcDecl.hasExportKeyword()) {
        compText = 'export ' + compText
      }
    }
  }

  if (compText) {
    const fileContent = imports.join('\n') + '\n\n' + sharedHelpers + '\n\n' + compText + '\n'
    fs.writeFileSync(target.file, fileContent, 'utf8')
    console.log('Extracted ' + target.name)
    
    // Remove from original
    const statement = sourceFile.getVariableStatement(target.name) || sourceFile.getFunction(target.name)
    if (statement) {
      statement.remove()
    }
  }
}

// Now we need to update the composition root (KemOpsTab.tsx) to import them
const rootImports = `
import { HsmKemPanel } from './HsmKemPanel'
import { KemOpsTabSoftware } from './KemOpsTabSoftware'
import { X25519ECDHPanel } from './X25519ECDHPanel'
`

// Save changes to the original file
sourceFile.saveSync()

// Patch original file text slightly since TS Morph sometimes messes up top-level syntax formatting
const curText = fs.readFileSync('src/components/Playground/tabs/KemOpsTab.tsx', 'utf8')
fs.writeFileSync('src/components/Playground/tabs/KemOpsTab.tsx', rootImports + '\\n' + curText, 'utf8')

console.log('Done splitting KemOpsTab')
