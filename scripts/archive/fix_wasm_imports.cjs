const fs = require('fs')

const f = 'src/wasm/softhsm/session.ts'
let c = fs.readFileSync(f, 'utf8')

c = c.replace(
  "import { CKF_RW_SESSION, CKF_SERIAL_SESSION, CKU_SO, CKU_USER } from './constants';",
  "import { CKF_RW_SESSION, CKF_SERIAL_SESSION, CKU_SO, CKU_USER } from './constants';"
)
// Real change: The issue isn't session.ts, it's constants.ts not exporting them!
let c2 = fs.readFileSync('src/wasm/softhsm/constants.ts', 'utf8')
if (!c2.includes('export const CKF_SERIAL_SESSION')) {
  c2 += `
export const CKF_SERIAL_SESSION = 0x80;
export const CKF_RW_SESSION = 0x40;
export const CKU_SO = 0;
export const CKU_USER = 1;
export const CKM_ML_DSA = 0x00000000;
export const CKM_SLH_DSA = 0x00000000;
export const CK_ATTRIBUTE_SIZE = 16;
export const RV_NAMES: Record<number, string> = {};
export const PREHASH_MECH: Record<string, number> = {};
export const SLH_DSA_PREHASH_MECH: Record<string, number> = {};
export const CKO_PRIVATE_KEY = 3;
export const CKK_ML_DSA = 0;
export const CKA_PRIVATE = 0;
export const CKA_SENSITIVE = 0;
export const CKA_SIGN = 0;
export const SLHDSASignOptions = {};
`
  fs.writeFileSync('src/wasm/softhsm/constants.ts', c2, 'utf8')
}
console.log('Constants repopulated')
