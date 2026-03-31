const fs = require('fs')

const f1 = 'src/wasm/softhsm.ts'
let c1 = fs.readFileSync(f1, 'utf8')

const missingExports = [
  'CKM_SHA256_HMAC',
  'CKM_SHA384_HMAC',
  'CKM_SHA512_HMAC',
  'CKM_SHA3_256_HMAC',
  'CKM_SHA3_512_HMAC',
  'CKO_SECRET_KEY',
  'CKA_CLASS',
  'CKA_KEY_TYPE',
  'CKA_TOKEN',
  'CKA_EXTRACTABLE',
  'CKA_VALUE_LEN',
  'CKK_AES',
]

let exportLine = c1.indexOf('export {')
if (exportLine !== -1) {
  const end = c1.indexOf('}', exportLine)
  const existingExports = c1.substring(exportLine + 8, end)
  const newExports = missingExports.filter((e) => !existingExports.includes(e))
  if (newExports.length > 0) {
    // Need to add exports out of constants
    c1 += `\nexport { ${newExports.join(', ')} } from './softhsm/constants';\n`
    fs.writeFileSync(f1, c1, 'utf8')
  }
} else {
  c1 += `\nexport { ${missingExports.join(', ')} } from './softhsm/constants';\n`
  fs.writeFileSync(f1, c1, 'utf8')
}

// Since I have massive `Cannot redeclare block-scoped variable` errors in some of the wasm files, it means a previous script ran and broke them.
// src/wasm/softhsm/crypto.ts
// src/wasm/softhsm/memory.ts
console.log('Done.')
