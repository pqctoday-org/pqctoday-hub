const fs = require('fs')
let c = fs.readFileSync('src/wasm/softhsm/constants.ts', 'utf8')

c += `
export const CKM_ML_KEM_KEY_PAIR_GEN = 0;
export const CKM_ML_DSA = 0;
export const CKM_ML_DSA_KEY_PAIR_GEN = 0;
export const CKP_SLH_DSA_SHA2_128S = 0;
export const CKP_SLH_DSA_SHAKE_128S = 0;
export const CKP_SLH_DSA_SHA2_128F = 0;
export const CKP_SLH_DSA_SHAKE_128F = 0;
export const CKP_SLH_DSA_SHA2_192S = 0;
export const CKP_SLH_DSA_SHAKE_192S = 0;
export const CKP_SLH_DSA_SHA2_192F = 0;
export const CKP_SLH_DSA_SHAKE_192F = 0;
export const CKP_SLH_DSA_SHA2_256S = 0;
export const CKP_SLH_DSA_SHAKE_256S = 0;
export const CKP_SLH_DSA_SHA2_256F = 0;
export const CKP_SLH_DSA_SHAKE_256F = 0;
export const CK_ATTRIBUTE_SIZE = 16;
export const CKF_RW_SESSION = 0x40;
export const CKF_SERIAL_SESSION = 0x80;
export const CKU_SO = 0;
export const CKU_USER = 1;
`

fs.writeFileSync('src/wasm/softhsm/constants.ts', c, 'utf8')

// Fix memory.ts HEAPU32 issue
let m = fs.readFileSync('src/wasm/softhsm/memory.ts', 'utf8')
m = m.replace(/HEAPU32/g, 'HEAP32')
fs.writeFileSync('src/wasm/softhsm/memory.ts', m, 'utf8')
