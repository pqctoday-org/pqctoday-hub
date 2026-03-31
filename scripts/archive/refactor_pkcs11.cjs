const { Project } = require('ts-morph')
const path = require('path')
const fs = require('fs')

const projectDir = path.join(__dirname, '..')
const project = new Project({
  tsConfigFilePath: path.join(projectDir, 'tsconfig.app.json'),
})

const sourceFilePath = path.join(projectDir, 'src/wasm/pkcs11Inspect.ts')
const sourceFile = project.addSourceFileAtPath(sourceFilePath)
const targetDir = path.join(projectDir, 'src/wasm/inspect')

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

let typesContent = '// SPDX-License-Identifier: GPL-3.0-only\n// Extracted Types\n\n'
let constantsContent =
  "// SPDX-License-Identifier: GPL-3.0-only\nimport type { ConstEntry } from './types'\n\n"
let decodersContent =
  "// SPDX-License-Identifier: GPL-3.0-only\nimport { CKA_TABLE, CKM_TABLE, CKK_TABLE, CKO_TABLE, CKR_TABLE } from './constants'\nimport type { DecodedValue, DecodedAttribute, DecodedSignParam, DecodedMechanism, InspectSection, Pkcs11LogInspect } from './types'\n\n"

// 1. Extract Interfaces and Type Aliases to types.ts
const interfaces = sourceFile.getInterfaces()
const typeAliases = sourceFile.getTypeAliases()

interfaces.forEach((i) => {
  typesContent += 'export ' + i.getText() + '\n\n'
})
typeAliases.forEach((t) => {
  typesContent += 'export ' + t.getText() + '\n\n'
})

// Since ConstEntry might not have been exported originally, make sure we capture it
const constEntryInterface = sourceFile.getInterface('ConstEntry')
if (!constEntryInterface) {
  // It might be a type alias, but it was found above. If it's private, ts-morph `getText()` gets the original text.
  // We prefixed with `export` above, so it will be fine.
}

// 2. Extract massive VariableDeclarations (Constants) to constants.ts
const variableStatements = sourceFile.getVariableStatements()
const constantNames = ['CKA_TABLE', 'CKM_TABLE', 'CKK_TABLE', 'CKO_TABLE', 'CKR_TABLE', 'ASN1_OIDS']
const constantExports = []

variableStatements.forEach((stmt) => {
  const isTarget = stmt.getDeclarations().some((d) => constantNames.includes(d.getName()))
  if (isTarget) {
    let text = stmt.getText()
    if (!text.startsWith('export')) {
      text = 'export ' + text
    }
    constantsContent += text + '\n\n'
    stmt.getDeclarations().forEach((d) => constantExports.push(d.getName()))
  }
})

// 3. Extract Functions to decoders.ts
const functions = sourceFile.getFunctions()
const functionExports = []

functions.forEach((func) => {
  let text = func.getText()
  if (!text.startsWith('export')) {
    text = 'export ' + text
  }
  decodersContent += text + '\n\n'
  functionExports.push(func.getName())
})

// 4. Write new files
fs.writeFileSync(path.join(targetDir, 'types.ts'), typesContent, 'utf8')
fs.writeFileSync(path.join(targetDir, 'constants.ts'), constantsContent, 'utf8')
fs.writeFileSync(path.join(targetDir, 'decoders.ts'), decodersContent, 'utf8')

// 5. Convert original pkcs11Inspect.ts to a Barrel File
sourceFile.removeText()
sourceFile.addExportDeclarations([
  { moduleSpecifier: './inspect/types' },
  { moduleSpecifier: './inspect/constants' },
  { moduleSpecifier: './inspect/decoders' },
])

project.saveSync()
console.log('pkcs11Inspect AST Splitting Complete')
