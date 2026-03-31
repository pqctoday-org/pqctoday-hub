const { Project } = require('ts-morph')
const fs = require('fs')
const { execSync } = require('child_process')
const path = require('path')

// 1. Checkout original assessmentUtils.ts safely
execSync('git checkout HEAD src/hooks/assessmentUtils.ts')

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.app.json'),
})

const sourceFile = project.addSourceFileAtPath(
  path.join(__dirname, '../src/hooks/assessmentUtils.ts')
)

const fnsToExtract = {
  generateNarrative: 'src/hooks/assessment/generators.ts',
  generateKeyFindings: 'src/hooks/assessment/generators.ts',
  generatePersonaNarrative: 'src/hooks/assessment/personas.ts',
}

// Also we need to fix orchestrator.ts imports.
// First, extract the functions:
for (const [fnName, targetPath] of Object.entries(fnsToExtract)) {
  const fnDecl = sourceFile.getFunction(fnName)
  if (fnDecl) {
    let fnText = fnDecl.getText()
    // Ensure it's exported
    if (!fnText.startsWith('export')) {
      fnText = 'export ' + fnText
    }
    const fullTargetPath = path.join(__dirname, '..', targetPath)
    const currentTargetContent = fs.readFileSync(fullTargetPath, 'utf8')

    // Quick check to avoid double appending if it somehow ran partially
    // but the regex failed early, so we'll just append.
    // Let's wipe the regex appended garbage first by doing a clean checkout!
    fs.appendFileSync(fullTargetPath, '\n\n' + fnText + '\n')
    console.log(`Extracted ${fnName} to ${targetPath}`)
  } else {
    console.log(`Function ${fnName} not found.`)
  }
}

// 2. Fix orchestrator.ts properly
const orchestratorPath = path.join(__dirname, '../src/hooks/assessment/orchestrator.ts')
let orchestratorContent = fs.readFileSync(orchestratorPath, 'utf8')

if (!orchestratorContent.includes('generatePersonaNarrative')) {
  orchestratorContent = orchestratorContent.replace(
    /import \{ reframeActionsForPersona \} from '\.\/personas';/,
    "import { reframeActionsForPersona, generatePersonaNarrative } from './personas';"
  )
}

fs.writeFileSync(orchestratorPath, orchestratorContent)

// 3. Revert assessmentUtils.ts to the barrel file
const barrelContent = `// SPDX-License-Identifier: GPL-3.0-only
export * from './assessmentTypes';
export { computeAssessment, useAssessmentEngine } from './assessment/orchestrator';
`
fs.writeFileSync(path.join(__dirname, '../src/hooks/assessmentUtils.ts'), barrelContent)

console.log('AST Patch completed.')
