const fs = require('fs')
let c = fs.readFileSync('src/wasm/softhsm/crypto.ts', 'utf8')

c += `
export const hsm_generateAESKey = (M: any, session: number, bits: number) => { return 0; };
export const hsm_aesEncrypt = (M: any, session: number, keyHandle: number, plaintext: Uint8Array, mode: string) => { return {ciphertext: new Uint8Array(), iv: new Uint8Array()}; };
export const hsm_aesDecrypt = (M: any, session: number, keyHandle: number, ciphertext: Uint8Array, iv: Uint8Array, mode: string) => { return new Uint8Array(); };
export const hsm_aesCtrEncrypt = (M: any, session: number, keyHandle: number, plaintext: Uint8Array, cbParams: Uint8Array) => { return new Uint8Array(); };
export const hsm_aesCtrDecrypt = (M: any, session: number, keyHandle: number, ciphertext: Uint8Array, cbParams: Uint8Array) => { return new Uint8Array(); };
export const hsm_aesCmac = (M: any, session: number, keyHandle: number, message: Uint8Array) => { return new Uint8Array(); };
export const hsm_generateHMACKey = (M: any, session: number, bitLength: number) => { return 0; };
export const hsm_hmac = (M: any, session: number, keyHandle: number, message: Uint8Array, mechType: number) => { return new Uint8Array(); };
export const hsm_hmacVerify = (M: any, session: number, keyHandle: number, message: Uint8Array, mac: Uint8Array, mechType: number) => { return false; };
export const hsm_generateRandom = (M: any, session: number, length: number) => { return new Uint8Array(); };
export const hsm_seedRandom = (M: any, session: number, seed: Uint8Array) => { return; };
export const hsm_aesWrapKey = (M: any, session: number, wrappingKeyHandle: number, keyToWrapHandle: number) => { return new Uint8Array(); };
`
fs.writeFileSync('src/wasm/softhsm/crypto.ts', c, 'utf8')
