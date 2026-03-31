const fs = require('fs')
const { execSync } = require('child_process')

// Restore the original assessmentUtils to grab the full functions
execSync('git checkout HEAD src/hooks/assessmentUtils.ts')
const originalContent = fs.readFileSync('src/hooks/assessmentUtils.ts', 'utf8')

// The functions we need to copy
const fns = ['generateNarrative', 'generateKeyFindings', 'generatePersonaNarrative']

let generatorsAppend = '\n\n'

for (const fn of fns) {
  // Use a regex to grab the function body
  const regex = new RegExp(`function ${fn}\\s*\\([\\s\\S]*?\\n\\}`)
  const match = originalContent.match(regex)
  if (match) {
    // Make sure we export it
    const code = match[0].replace(`function ${fn}`, `export function ${fn}`)
    generatorsAppend += code + '\n\n'
  } else {
    console.error('Could not find', fn)
  }
}

const generatorsPath = 'src/hooks/assessment/generators.ts'
let generatorsContent = fs.readFileSync(generatorsPath, 'utf8')
generatorsContent += generatorsAppend
fs.writeFileSync(generatorsPath, generatorsContent)

// Fix orchestrator.ts by removing the mangled useAssessmentEngine
const orchestratorPath = 'src/hooks/assessment/orchestrator.ts'
let orchestratorContent = fs.readFileSync(orchestratorPath, 'utf8')

// It's manually messed up near the end. Let's just restore orchestrator.ts entirely!
// Wait, I can't git checkout orchestrator.ts because it's untracked/new!
// But I can fix the end of the file.
const badSyntax = `  export function useAssessmentEngine(input: AssessmentInput | null): AssessmentResult | null {
    return useMemo(() => {
      if (!input) return null
      return computeAssessment(input)
    }, [input])
  }
}`

const goodSyntax = `}

export function useAssessmentEngine(input: AssessmentInput | null): AssessmentResult | null {
  return useMemo(() => {
    if (!input) return null
    return computeAssessment(input)
  }, [input])
}
`

orchestratorContent = orchestratorContent.replace(badSyntax, goodSyntax)

// Make sure generatePersonaNarrative is imported
if (!orchestratorContent.includes('generatePersonaNarrative')) {
  orchestratorContent = orchestratorContent.replace(
    'generateNarrative, generateKeyFindings } from',
    'generateNarrative, generateKeyFindings, generatePersonaNarrative } from'
  )
}
fs.writeFileSync(orchestratorPath, orchestratorContent)

// Re-write the barrel file
const barrelContent = `// SPDX-License-Identifier: GPL-3.0-only
export * from './assessmentTypes';
export { computeAssessment, useAssessmentEngine } from './assessment/orchestrator';
`
fs.writeFileSync('src/hooks/assessmentUtils.ts', barrelContent)

console.log('Patch complete.')
