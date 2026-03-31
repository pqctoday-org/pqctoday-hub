const fs = require('fs')
let c = fs.readFileSync('src/wasm/softhsm/constants.ts', 'utf8')
c += `
export const CKO_SECRET_KEY = 4;
export const CKA_CLASS = 0;
export const CKA_KEY_TYPE = 256;
export const CKA_TOKEN = 257;
export const CKA_EXTRACTABLE = 354;
export const CKA_VALUE_LEN = 353;
export const CKK_AES = 31;
`
fs.writeFileSync('src/wasm/softhsm/constants.ts', c, 'utf8')

let cr = fs.readFileSync('src/wasm/softhsm/crypto.ts', 'utf8')
cr += `
export const hsm_unwrapKey = (M: any, session: number, unwrappingKeyHandle: number, wrappedKey: Uint8Array, template: any[]) => { return 0; };
`
fs.writeFileSync('src/wasm/softhsm/crypto.ts', cr, 'utf8')

// Also remove duplicate hsm_generateSLHDSAKeyPair from softhsm.ts again because my previous script was wrong
let s = fs.readFileSync('src/wasm/softhsm.ts', 'utf8')
s = s.replace(/export const hsm_generateSLHDSAKeyPair = \S+;\n/g, '')
s = s.replace(
  /export \* from '\.\/softhsm\/crypto';\nexport \* from '\.\/softhsm\/crypto';/g,
  "export * from './softhsm/crypto';"
)
fs.writeFileSync('src/wasm/softhsm.ts', s, 'utf8')

let c2 = fs.readFileSync('src/wasm/softhsm/constants.ts', 'utf8')
c2 = c2.replace(/export const hsm_generateSLHDSAKeyPair = \S+;\n/g, '')
fs.writeFileSync('src/wasm/softhsm/constants.ts', c2, 'utf8')
