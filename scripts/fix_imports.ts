/* eslint-disable */
import { Project } from 'ts-morph'

const project = new Project({
  tsConfigFilePath: 'tsconfig.node.json',
})

project.addSourceFilesAtPaths('src/wasm/softhsm/*.ts')

for (const sourceFile of project.getSourceFiles()) {
  // Organize imports strips unused ones and sometimes fixes types.
  sourceFile.organizeImports()

  // Manually ensure types/interfaces are imported as type
  // Find all imports
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const defaultImport = importDecl.getDefaultImport()
    const namedImports = importDecl.getNamedImports()

    // The types we know we need to import as 'type'
    const knownTypes = [
      'AttrDef',
      'SoftHSMModule',
      'SessionInfo',
      'TokenInfo',
      'MechanismInfo',
      'Pkcs11LogEntry',
      'Pkcs11LogInspect',
      'InspectSection',
      'DecodedMechanism',
      'DecodedAttribute',
      'DecodedValue',
    ]

    let allAreTypes = true
    for (const ni of namedImports) {
      if (knownTypes.includes(ni.getName())) {
        ni.setIsTypeOnly(true)
      } else {
        allAreTypes = false
      }
    }
  }

  // Also fix unused manually if TS didn't catch them all:
  // (organizeImports handles most natively)
}

project.saveSync()
console.log('Imports fixed!')
