const { Project, SyntaxKind } = require('ts-morph')
const path = require('path')
const fs = require('fs')

async function splitAssessmentUtils() {
  const projectPath = path.resolve(__dirname, '..')
  console.log('Project root:', projectPath)

  const project = new Project({
    tsConfigFilePath: path.join(projectPath, 'tsconfig.app.json'),
  })

  const sourceFile = project.getSourceFile('src/hooks/assessmentUtils.ts')
  if (!sourceFile) {
    console.error('File not found')
    process.exit(1)
  }

  const outDir = path.join(projectPath, 'src/hooks/assessment')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const modules = {
    scoring: [
      'computeQuantumExposure',
      'computeMigrationComplexity',
      'computeRegulatoryPressure',
      'computeOrganizationalReadiness',
      'computeCompositeScore',
      'getMaxSensitivity',
      'getMaxRetentionYears',
      'parseDeadlineYear',
      'getIndustryRetentionDefault',
    ],
    riskWindows: [
      'getEffectiveThreatYear',
      'computeHNDLRiskWindow',
      'computeHNFLRiskWindow',
      'computeMigrationEffort',
    ],
    generators: [
      'buildAlgorithmHighlightUrl',
      'buildThreatsUrl',
      'generateCategoryDrivers',
      'generateExtendedActions',
      'generateExecutiveSummary',
      'generateQuickSummary',
    ],
    personas: [
      'ActionReframing',
      'reframeActionsForPersona',
      'PERSONA_UNKNOWN_WEIGHTS',
      'DEFAULT_UNKNOWN_WEIGHTS',
      'getPersonaWeights',
    ],
    orchestrator: ['computeAssessment', 'buildAssessmentProfile'],
  }

  const baseImports = `import {
  ALGORITHM_DB,
  COMPLIANCE_DB,
  DATA_RETENTION_YEARS,
  DATA_SENSITIVITY_SCORES,
  USE_CASE_WEIGHTS,
  ALGORITHM_WEIGHTS,
  DEFAULT_ALGORITHM_WEIGHT,
  AGILITY_COMPLEXITY,
  INFRA_COMPLEXITY,
  AssessmentInput,
  AssessmentProfile,
  ComplianceImpact,
  CategoryScores,
  CategoryDrivers,
  HNDLRiskWindow,
  HNFLRiskWindow,
  MigrationEffortItem,
  RecommendedAction,
  AssessmentResult,
  AlgorithmMigration,
} from '../assessmentTypes';\n\n`

  for (const [modName, fns] of Object.entries(modules)) {
    let content = baseImports

    if (modName === 'scoring') {
      content += `import { PERSONA_UNKNOWN_WEIGHTS, DEFAULT_UNKNOWN_WEIGHTS, getPersonaWeights } from './personas';\n\n`
    } else if (modName === 'riskWindows') {
      content += `import { getMaxRetentionYears } from './scoring';\n\n`
    } else if (modName === 'orchestrator') {
      content += `import { computeQuantumExposure, computeMigrationComplexity, computeRegulatoryPressure, computeCompositeScore, computeOrganizationalReadiness } from './scoring';\n`
      content += `import { computeHNDLRiskWindow, computeHNFLRiskWindow, computeMigrationEffort } from './riskWindows';\n`
      content += `import { generateCategoryDrivers, generateExtendedActions, generateExecutiveSummary, generateQuickSummary } from './generators';\n`
      content += `import { reframeActionsForPersona } from './personas';\n\n`
    }

    for (const fnName of fns) {
      // Robust way to find a top-level statement defining the name
      const statements = sourceFile.getStatements()
      let foundNode = null
      for (const statement of statements) {
        if (
          statement.getKind() === SyntaxKind.FunctionDeclaration &&
          statement.getName() === fnName
        ) {
          foundNode = statement
          break
        }
        if (statement.getKind() === SyntaxKind.ClassDeclaration && statement.getName() === fnName) {
          foundNode = statement
          break
        }
        if (
          statement.getKind() === SyntaxKind.InterfaceDeclaration &&
          statement.getName() === fnName
        ) {
          foundNode = statement
          break
        }
        if (
          statement.getKind() === SyntaxKind.TypeAliasDeclaration &&
          statement.getName() === fnName
        ) {
          foundNode = statement
          break
        }
        if (statement.getKind() === SyntaxKind.VariableStatement) {
          const decls = statement.getDeclarations()
          if (decls.some((d) => d.getName() === fnName)) {
            foundNode = statement
            break
          }
        }
      }

      if (foundNode) {
        if (foundNode.isExported && !foundNode.isExported()) {
          try {
            foundNode.setIsExported(true)
          } catch (_e) {
            /* ignore */
          }
        } else if (
          foundNode.getKind() === SyntaxKind.VariableStatement &&
          !foundNode.isExported()
        ) {
          try {
            foundNode.setIsExported(true)
          } catch (_e) {
            /* ignore */
          }
        }

        let text = foundNode.getText()
        if (
          !text.startsWith('export ') &&
          !text.includes('export const') &&
          !text.includes('export interface')
        ) {
          text = 'export ' + text
        }

        content += text + '\n\n'
      } else {
        console.warn(`Could not find ${fnName} in source file`)
      }
    }

    const newFilePath = path.join(outDir, `${modName}.ts`)
    fs.writeFileSync(newFilePath, content)
    console.log(`Created ${newFilePath}`)
  }

  const proxyContent = `// SPDX-License-Identifier: GPL-3.0-only
export * from './assessmentTypes';
export { computeAssessment } from './assessment/orchestrator';
`
  fs.writeFileSync(path.join(projectPath, 'src/hooks/assessmentUtils.ts'), proxyContent)
  console.log('Rewrote assessmentUtils.ts')
}

splitAssessmentUtils().catch(console.error)
