/* eslint-disable */
import { Project, SourceFile } from 'ts-morph'
import * as fs from 'fs'
import * as path from 'path'

// Initialize ts-morph
const project = new Project({
  tsConfigFilePath: 'tsconfig.node.json', // or just compilerOptions if needed
  compilerOptions: {
    target: 99, // ESNext
  },
})

project.addSourceFilesAtPaths('src/wasm/softhsm.ts')
const sourceFile = project.getSourceFileOrThrow('src/wasm/softhsm.ts')

const destDir = 'src/wasm/softhsm'
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

// Helper to create a new file
function createDestFile(name: string): SourceFile {
  const filePath = path.join(destDir, name)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  return project.createSourceFile(filePath, '', { overwrite: true })
}

const fLoaders = createDestFile('loaders.ts')
const fLogging = createDestFile('logging.ts')
const fConstants = createDestFile('constants.ts')
const fHelpers = createDestFile('helpers.ts')
const fSession = createDestFile('session.ts')
const fObjects = createDestFile('objects.ts')
const fPqc = createDestFile('pqc.ts')
const fClassical = createDestFile('classical.ts')
const fSymmetric = createDestFile('symmetric.ts')
const fKeywrap = createDestFile('keywrap.ts')
const fKdf = createDestFile('kdf.ts')

const mapping = [
  // Loaders
  { name: 'getSoftHSMCppModule', dest: fLoaders },
  { name: 'getSoftHSMRustModule', dest: fLoaders },
  { name: 'clearSoftHSMCache', dest: fLoaders },

  // Logging
  { name: 'createLoggingProxy', dest: fLogging },
  { name: 'Pkcs11LogEntry', dest: fLogging },
  { name: '_logId', dest: fLogging },
  { name: 'RV_NAMES', dest: fLogging },
  { name: 'rvName', dest: fLogging },
  { name: 'fmtTime', dest: fLogging },
  { name: 'PKCS11_PARAMS', dest: fLogging },
  { name: 'fmtArg', dest: fLogging },
  { name: 'fmtArgs', dest: fLogging },

  // Constants
  { name: 'CKF_RW_SESSION', dest: fConstants },
  { name: 'CKF_SERIAL_SESSION', dest: fConstants },
  { name: 'CKU_SO', dest: fConstants },
  { name: 'CKU_USER', dest: fConstants },
  { name: 'CKO_PUBLIC_KEY', dest: fConstants },
  { name: 'CKO_PRIVATE_KEY', dest: fConstants },
  { name: 'CKO_SECRET_KEY', dest: fConstants },
  { name: 'CKK_ML_KEM', dest: fConstants },
  { name: 'CKK_ML_DSA', dest: fConstants },
  { name: 'CKM_ML_KEM_KEY_PAIR_GEN', dest: fConstants },
  { name: 'CKM_ML_KEM', dest: fConstants },
  { name: 'CKM_ML_DSA_KEY_PAIR_GEN', dest: fConstants },
  { name: 'CKM_ML_DSA', dest: fConstants },
  { name: 'CKA_CLASS', dest: fConstants },
  { name: 'CKA_TOKEN', dest: fConstants },
  { name: 'CKA_PRIVATE', dest: fConstants },
  { name: 'CKA_SENSITIVE', dest: fConstants },
  { name: 'CKA_SIGN', dest: fConstants },
  { name: 'CKA_VERIFY', dest: fConstants },
  { name: 'CKA_EXTRACTABLE', dest: fConstants },
  { name: 'CKA_VALUE_LEN', dest: fConstants },
  { name: 'CKA_VALUE', dest: fConstants },
  { name: 'CKA_KEY_TYPE', dest: fConstants },
  { name: 'CKA_PARAMETER_SET', dest: fConstants },
  { name: 'CKA_LOCAL', dest: fConstants },
  { name: 'CKA_NEVER_EXTRACTABLE', dest: fConstants },
  { name: 'CKA_ALWAYS_SENSITIVE', dest: fConstants },
  { name: 'CKA_KEY_GEN_MECHANISM', dest: fConstants },
  { name: 'CKA_ENCAPSULATE', dest: fConstants },
  { name: 'CKA_DECAPSULATE', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA224', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA256', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA384', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA512', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA3_224', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA3_256', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA3_384', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHA3_512', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHAKE128', dest: fConstants },
  { name: 'CKM_HASH_ML_DSA_SHAKE256', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA224', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA256', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA384', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA512', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA3_224', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA3_256', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA3_384', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHA3_512', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHAKE128', dest: fConstants },
  { name: 'CKM_HASH_SLH_DSA_SHAKE256', dest: fConstants },
  { name: 'CKH_HEDGE_PREFERRED', dest: fConstants },
  { name: 'CKH_HEDGE_REQUIRED', dest: fConstants },
  { name: 'CKH_DETERMINISTIC_REQUIRED', dest: fConstants },
  { name: 'CKP_ML_KEM_512', dest: fConstants },
  { name: 'CKP_ML_KEM_768', dest: fConstants },
  { name: 'CKP_ML_KEM_1024', dest: fConstants },
  { name: 'CKP_ML_DSA_44', dest: fConstants },
  { name: 'CKP_ML_DSA_65', dest: fConstants },
  { name: 'CKP_ML_DSA_87', dest: fConstants },
  { name: 'CK_ATTRIBUTE_SIZE', dest: fConstants },

  // Helpers
  { name: 'allocUlong', dest: fHelpers },
  { name: 'readUlong', dest: fHelpers },
  { name: 'writeUlong', dest: fHelpers },
  { name: 'writeStr', dest: fHelpers },
  { name: 'checkRV', dest: fHelpers },
  { name: 'AttrDef', dest: fHelpers },
  { name: 'buildTemplate', dest: fHelpers },
  { name: 'freeTemplate', dest: fHelpers },
]

console.log('Starting ts-morph refactor loop...')
for (const entry of mapping) {
  // Move variable declarations
  const varDec = sourceFile.getVariableDeclaration(entry.name)
  if (varDec) {
    const varStatement = varDec.getVariableStatement()
    if (varStatement) {
      entry.dest.addVariableStatement({
        declarationKind: varStatement.getDeclarationKind(),
        declarations: [
          {
            name: entry.name,
            initializer: varDec.getInitializer()?.getText(),
            type: varDec.getTypeNode()?.getText(),
          },
        ],
        isExported: varStatement.isExported(),
      })
      // Optionally copy comments above it.
      continue
    }
  }

  // Move Type Aliases/Interfaces
  const typeAlias = sourceFile.getTypeAlias(entry.name)
  if (typeAlias) {
    entry.dest.addTypeAlias({
      name: entry.name,
      type: typeAlias.getTypeNode()?.getText() || 'any',
      isExported: typeAlias.isExported(),
    })
    continue
  }

  const interfaceDec = sourceFile.getInterface(entry.name)
  if (interfaceDec) {
    entry.dest.addInterface({
      name: entry.name,
      properties: interfaceDec.getProperties().map((p) => ({
        name: p.getName(),
        type: p.getTypeNode()?.getText(),
        hasQuestionToken: p.hasQuestionToken(),
      })),
      isExported: interfaceDec.isExported(),
    })
    continue
  }
}

// Write the files down so we have them initially.
project.saveSync()
console.log('Base extraction complete. Files saved.')
