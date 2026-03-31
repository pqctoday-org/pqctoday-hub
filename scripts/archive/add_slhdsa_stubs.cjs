const fs = require('fs')
let c = fs.readFileSync('src/wasm/softhsm/crypto.ts', 'utf8')
const stubs = `

export const hsm_generateSLHDSAKeyPair = (M: any, session: number, params: any) => { return {pubHandle: 0, privHandle: 0}; };
export const hsm_slhdsaSign = (M: any, session: number, key: number, msg: string, opts: any) => new Uint8Array();
export const hsm_slhdsaVerify = (M: any, session: number, key: number, msg: string, sig: Uint8Array, opts: any) => false;
`
if (!c.includes('hsm_generateSLHDSAKeyPair')) {
  fs.writeFileSync('src/wasm/softhsm/crypto.ts', c + stubs)
}
