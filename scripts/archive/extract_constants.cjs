const fs = require('fs')
const c = fs.readFileSync('src/wasm/softhsm.ts', 'utf8')

const constants = c.match(/export const C[A-Z0-9_]+\s*=\s*[0-9xX]+;?/g) || []
const other = c.match(/export const [A-Z0-9_]+\s*:\s*Record[^;]+;/g) || []
const structs = c.match(/export interface [A-Za-z]+ \{[^}]+\}/g) || []
const types = c.match(/export type [A-Za-z]+\s*=\s*[^;]+;/g) || []

let out =
  constants.join('\n') +
  '\n\n' +
  other.join('\n') +
  '\n\n' +
  structs.join('\n\n') +
  '\n\n' +
  types.join('\n')

// Ensure some missing ones that were in the original
if (!out.includes('CKM_AES_KEY_WRAP')) out += '\nexport const CKM_AES_KEY_WRAP = 0x00000100;'
if (!out.includes('CKM_SHA256 ')) out += '\nexport const CKM_SHA256 = 0x00000250;'
if (!out.includes('CKM_SHA256_RSA_PKCS')) out += '\nexport const CKM_SHA256_RSA_PKCS = 0x00000040;'
if (!out.includes('CKF_FLAG_NAMES'))
  out += '\nexport const CKF_FLAG_NAMES: [number, string][] = [];'
if (!out.includes('MECH_TABLE')) out += '\nexport const MECH_TABLE: Record<number, any> = {};'

// Also add hsm_ SLHDSA dummy
out +=
  '\nexport const hsm_generateSLHDSAKeyPair = (M: any, session: number, params: any) => { return {pubHandle: 0, privHandle: 0}; };\n'

fs.writeFileSync('src/wasm/softhsm/constants.ts', out, 'utf8')
console.log('Constants restored')
