const fs = require('fs')
let c = fs.readFileSync('src/wasm/softhsm/constants.ts', 'utf8')

if (!c.includes('export interface AttrDef')) {
  c +=
    '\nexport interface AttrDef { type: number; ulongVal?: number; boolVal?: boolean; bytesLen?: number; bytesPtr?: number; }\n'
}
if (!c.includes('RV_NAMES')) c += 'export const RV_NAMES: Record<number, string> = {};\n'
if (!c.includes('PKCS11_PARAMS')) c += 'export const PKCS11_PARAMS: Record<string, number> = {};\n'
if (!c.includes('MechanismFamily'))
  c +=
    'export type MechanismFamily = "pqc" | "asymmetric" | "symmetric" | "hash" | "kdf" | "other";\n'
fs.writeFileSync('src/wasm/softhsm/constants.ts', c, 'utf8')
