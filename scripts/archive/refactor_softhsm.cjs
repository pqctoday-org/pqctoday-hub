const { Project, SyntaxKind } = require('ts-morph')
const path = require('path')
const fs = require('fs')

const projectDir = path.join(__dirname, '..')
const project = new Project({
  tsConfigFilePath: path.join(projectDir, 'tsconfig.app.json'),
})

const sourceFilePath = path.join(projectDir, 'src/wasm/softhsm.ts')
const sourceFile = project.addSourceFileAtPath(sourceFilePath)
const targetDir = path.join(projectDir, 'src/wasm/softhsm')

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// Provide a manual header for each
let buffers = {
  constants: `// SPDX-License-Identifier: GPL-3.0-only\n\n`,
  logging: `// SPDX-License-Identifier: GPL-3.0-only\nimport type { Pkcs11LogInspect } from "../pkcs11Inspect";\nimport { RV_NAMES, PKCS11_PARAMS } from "./constants";\nimport type { SoftHSMModule } from "./module";\n\n`,
  memory: `// SPDX-License-Identifier: GPL-3.0-only\nimport type { SoftHSMModule } from "./module";\n\n`,
  module: `// SPDX-License-Identifier: GPL-3.0-only\nimport { createLoggingProxy } from "./logging";\n\n`,
  session: `// SPDX-License-Identifier: GPL-3.0-only\nimport type { SoftHSMModule } from "./module";\nimport { writeStr, allocUlong, writeUlong, checkRV, buildTemplate, freeTemplate } from "./memory";\n\n`,
  crypto: `// SPDX-License-Identifier: GPL-3.0-only\nimport type { SoftHSMModule } from "./module";\nimport { allocUlong, readUlong, writeUlong, buildTemplate, freeTemplate, checkRV, writeStr } from "./memory";\nimport { MECH_TABLE, MLDSAPreHash, MechanismInfo } from "./constants";\n\n`,
}

const toConstants = [
  'RV_NAMES',
  'PKCS11_PARAMS',
  'CKF_FLAG_NAMES',
  'MECH_TABLE',
  'MLDSAPreHash',
  'MechanismFamily',
  'MechanismInfo',
  'MechEntry',
]
const toLogging = [
  'Pkcs11LogEntry',
  'createLoggingProxy',
  'fmtTime',
  'fmtArg',
  'fmtArgs',
  'rvName',
  '_logId',
]
const toMemory = [
  'allocUlong',
  'readUlong',
  'writeUlong',
  'writeStr',
  'checkRV',
  'AttrDef',
  'buildTemplate',
  'freeTemplate',
]
const toModule = ['SoftHSMModule', 'getSoftHSMModule', 'clearSoftHSMCache', 'modulePromise']
const toSession = ['hsm_initialize', 'hsm_getFirstSlot', 'hsm_initToken', 'hsm_openUserSession']
const toCrypto = [
  'kemParamSet',
  'dsaParamSet',
  'hsm_generateMLKEMKeyPair',
  'hsm_encapsulate',
  'hsm_decapsulate',
  'hsm_extractKeyValue',
  'hsm_extractECPoint',
  'hsm_generateMLDSAKeyPair',
  'hsm_sign',
  'hsm_verify',
  'hsm_slhdsaSign',
  'hsm_slhdsaVerify',
  'hsm_unwrapKey',
  'hsm_digestUpdate',
  'hsm_digestFinal',
  'hsm_digestMultiPart',
  'hsm_signUpdate',
  'hsm_signFinal',
  'hsm_signMultiPart',
  'decodeMechFlags',
  'hsm_getMechanismList',
  'hsm_getMechanismInfo',
  'hsm_getAllMechanisms',
]

const allStatements = sourceFile.getStatements()

allStatements.forEach((stmt) => {
  let name = ''

  if (stmt.isKind(SyntaxKind.FunctionDeclaration)) {
    name = stmt.getName() || ''
  } else if (
    stmt.isKind(SyntaxKind.InterfaceDeclaration) ||
    stmt.isKind(SyntaxKind.TypeAliasDeclaration)
  ) {
    name = stmt.getName()
  } else if (stmt.isKind(SyntaxKind.VariableStatement)) {
    const decs = stmt.getDeclarations()
    if (decs.length > 0) {
      name = decs[0].getName()
    }
  }

  let targetKey = null
  if (toConstants.includes(name) || name.startsWith('CKM_') || name.startsWith('CKR_')) {
    targetKey = 'constants'
  } else if (toLogging.includes(name)) {
    targetKey = 'logging'
  } else if (toMemory.includes(name)) {
    targetKey = 'memory'
  } else if (toModule.includes(name)) {
    targetKey = 'module'
  } else if (toSession.includes(name)) {
    targetKey = 'session'
  } else if (toCrypto.includes(name)) {
    targetKey = 'crypto'
  }

  if (targetKey) {
    let text = stmt.getText()
    const isExportedAlready = text.startsWith('export ')
    const isInternal = name === '_logId' || name === 'modulePromise' || name === 'RV_NAMES'

    if (!isExportedAlready && !isInternal) {
      if (
        text.startsWith('const ') ||
        text.startsWith('let ') ||
        text.startsWith('type ') ||
        text.startsWith('interface ') ||
        text.startsWith('function ')
      ) {
        text = 'export ' + text
      } else {
        // If it started with comments, export needs to go after comments ideally, but for this refactor we can just prepend if it's safe.
        // To be perfectly safe, `Project` nodes should be exported via `stmt.setIsExported(true)` then `.getText()`.
        stmt.setIsExported(true)
        text = stmt.getText()
      }
    }

    buffers[targetKey] += text + '\n\n'
  }
})

fs.writeFileSync(path.join(targetDir, 'constants.ts'), buffers.constants, 'utf8')
fs.writeFileSync(path.join(targetDir, 'logging.ts'), buffers.logging, 'utf8')
fs.writeFileSync(path.join(targetDir, 'memory.ts'), buffers.memory, 'utf8')
fs.writeFileSync(path.join(targetDir, 'module.ts'), buffers.module, 'utf8')
fs.writeFileSync(path.join(targetDir, 'session.ts'), buffers.session, 'utf8')
fs.writeFileSync(path.join(targetDir, 'crypto.ts'), buffers.crypto, 'utf8')

const barrelContent = `// SPDX-License-Identifier: GPL-3.0-only
export * from './softhsm/constants';
export * from './softhsm/logging';
export * from './softhsm/memory';
export * from './softhsm/module';
export * from './softhsm/session';
export * from './softhsm/crypto';
`

fs.writeFileSync(sourceFilePath, barrelContent, 'utf8')

console.log('SoftHSM Refactoring Complete')
