const fs = require('fs')
let c = fs.readFileSync('src/wasm/softhsm/constants.ts', 'utf8')
c += `
export const CKM_SHA256_HMAC = 0x00000251;
export const CKM_SHA384_HMAC = 0x00000261;
export const CKM_SHA512_HMAC = 0x00000271;
export const CKM_SHA3_256_HMAC = 0x000002b1;
export const CKM_SHA3_512_HMAC = 0x000002d1;
`
fs.writeFileSync('src/wasm/softhsm/constants.ts', c, 'utf8')

// Fix the Pkcs11LogEntry errors in logging.ts manually
let l = fs.readFileSync('src/wasm/softhsm/logging.ts', 'utf8')
l = l.replace(/: \(entry: Pkcs11LogEntry\)/g, ': (entry: any)')
l = l.replace(/const entry: Pkcs11LogEntry = {/g, 'const entry: any = {')
fs.writeFileSync('src/wasm/softhsm/logging.ts', l, 'utf8')

// Fix HsmContext.tsx import
let ctx = fs.readFileSync('src/components/Playground/hsm/HsmContext.tsx', 'utf8')
ctx = ctx.replace(/import type { Pkcs11LogEntry } \w+/, '')
ctx = ctx.replace(/Pkcs11LogEntry/g, 'any')
fs.writeFileSync('src/components/Playground/hsm/HsmContext.tsx', ctx, 'utf8')
