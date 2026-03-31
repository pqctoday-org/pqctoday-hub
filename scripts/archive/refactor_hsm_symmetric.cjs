const fs = require('fs')
const path = require('path')

const srcFile = path.join(__dirname, '../src/components/Playground/hsm/HsmSymmetricPanel.tsx')
const destDir = path.join(__dirname, '../src/components/Playground/hsm/symmetric')

let content = fs.readFileSync(srcFile, 'utf8')

const COMMON_IMPORTS = [
  "import { useState } from 'react'",
  "import { Lock, Loader2, CheckCircle, XCircle } from 'lucide-react'",
  "import { Button } from '../../../ui/button'",
  "import { ErrorAlert } from '../../../ui/error-alert'",
  'import {',
  '  CKM_SHA256_HMAC,',
  '  CKM_SHA384_HMAC,',
  '  CKM_SHA512_HMAC,',
  '  CKM_SHA3_256_HMAC,',
  '  CKM_SHA3_512_HMAC,',
  '  hsm_generateAESKey,',
  '  hsm_aesEncrypt,',
  '  hsm_aesDecrypt,',
  '  hsm_aesCtrEncrypt,',
  '  hsm_aesCtrDecrypt,',
  '  hsm_aesCmac,',
  '  hsm_generateHMACKey,',
  '  hsm_hmac,',
  '  hsm_hmacVerify,',
  '  hsm_generateRandom,',
  '  hsm_seedRandom,',
  '  hsm_aesWrapKey,',
  '  hsm_unwrapKey,',
  '  CKO_SECRET_KEY,',
  '  CKA_CLASS,',
  '  CKA_KEY_TYPE,',
  '  CKA_TOKEN,',
  '  CKA_EXTRACTABLE,',
  '  CKA_VALUE_LEN,',
  '  CKK_AES,',
  '  type AttrDef,',
  "} from '../../../../wasm/softhsm'",
  "import { useHsmContext } from '../HsmContext'",
  "import { HsmResultRow, toHex, hexSnippet } from '../shared'",
  '',
  'const HMAC_ALGOS = [',
  "  { label: 'HMAC-SHA-256', mech: CKM_SHA256_HMAC, outBytes: 32 },",
  "  { label: 'HMAC-SHA-384', mech: CKM_SHA384_HMAC, outBytes: 48 },",
  "  { label: 'HMAC-SHA-512', mech: CKM_SHA512_HMAC, outBytes: 64 },",
  "  { label: 'HMAC-SHA3-256', mech: CKM_SHA3_256_HMAC, outBytes: 32 },",
  "  { label: 'HMAC-SHA3-512', mech: CKM_SHA3_512_HMAC, outBytes: 64 },",
  '] as const;',
  '',
].join('\\n')

function extractHardcoded(compName, startStr) {
  const startIdx = content.indexOf(startStr)
  if (startIdx === -1) {
    console.error('Could not find start for', compName)
    return
  }

  let openBraces = 0
  let idx = startIdx
  while (idx < content.length && content[idx] !== '{') idx++

  let inString = false
  let stringChar = ''
  let inComment = false

  for (; idx < content.length; idx++) {
    const char = content[idx]
    const nextChar = content[idx + 1] || ''

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false
        idx++
      }
      continue
    } else if (!inString && char === '/' && nextChar === '*') {
      inComment = true
      idx++
      continue
    }

    if (inString) {
      if (char === '\\\\') {
        idx++
        continue
      }
      if (char === stringChar) {
        inString = false
      }
      continue
    } else if (char === '"' || char === "'" || char === '`') {
      inString = true
      stringChar = char
      continue
    }

    if (char === '{') openBraces++
    else if (char === '}') {
      openBraces--
      if (openBraces === 0) {
        const block = content.substring(startIdx, idx + 1)
        const newFile = path.join(destDir, compName + '.tsx')
        fs.writeFileSync(newFile, COMMON_IMPORTS + 'export ' + block + '\\n', 'utf8')
        content = content.replace(
          block,
          '// ' + compName + ' extracted to symmetric/' + compName + '.tsx'
        )
        return
      }
    }
  }
}

content = fs.readFileSync(srcFile, 'utf8')

// I already extracted AesPanel in previous run, but I'll undo and redo from git if possible, or just extract the rest
// But since the previous script mutated the file and replaced AesPanel, let's just restore srcFile from git and run cleanly.
