const fs = require('fs')
const path = require('path')

function prependContent(file, prefix) {
  let c = fs.readFileSync(file, 'utf8')
  // strip the previous bad prefix if present
  if (
    c.includes('export interface SoftHSMModule {') ||
    c.includes('import type { SoftHSMModule }') ||
    c.includes('import { SoftHSMModule }')
  ) {
    c = c
      .split('\n')
      .filter(
        (line) =>
          !line.includes('SoftHSMModule {') &&
          !line.includes('import {') &&
          !line.includes('import type {') &&
          !line.includes('./constants') &&
          !line.includes('./memory') &&
          !line.includes('./pkcs11Inspect') &&
          !line.includes('./module') &&
          !line.includes('rvName =')
      )
      .join('\n')
  }
  fs.writeFileSync(file, prefix + '\n' + c)
}

// 1. module.ts
prependContent(
  'src/wasm/softhsm/module.ts',
  `import type { SoftHSMModule } from '@pqctoday/softhsm-wasm';`
)

// 2. memory.ts
prependContent(
  'src/wasm/softhsm/memory.ts',
  `import type { SoftHSMModule } from '@pqctoday/softhsm-wasm';
import { RV_NAMES, CK_ATTRIBUTE_SIZE } from './constants';
const rvName = (u: number) => RV_NAMES[u] || 'CKR_UNKNOWN';
export const writeBytes = (M: SoftHSMModule, data: Uint8Array): number => {
  const ptr = M._malloc(data.length); M.HEAPU8.set(data, ptr); return ptr;
};
export const allocUlong = (M: SoftHSMModule): number => M._malloc(4);
export const writeStr = (M: SoftHSMModule, str: string): number => {
  const buf = new TextEncoder().encode(str);
  return writeBytes(M, buf);
};
`
)

// 3. session.ts
prependContent(
  'src/wasm/softhsm/session.ts',
  `import type { SoftHSMModule } from '@pqctoday/softhsm-wasm';
import { CKF_RW_SESSION, CKF_SERIAL_SESSION, CKU_SO, CKU_USER } from './constants';
import { readUlong, allocUlong, writeUlong, writeStr } from './memory';
import { checkRV } from './logging';
`
)

// 4. crypto.ts
prependContent(
  'src/wasm/softhsm/crypto.ts',
  `import type { SoftHSMModule } from '@pqctoday/softhsm-wasm';
import { readUlong, writeUlong, allocUlong, writeBytes } from './memory';
import { checkRV } from './logging';
import { AttrDef, MechanismInfo, MechanismFamily, CKM_AES_KEY_WRAP, CKM_SHA256, CKM_SHA256_RSA_PKCS, CKF_FLAG_NAMES, MECH_TABLE, 
  CKM_ML_KEM_KEY_PAIR_GEN, CKM_ML_DSA, CKM_ML_DSA_KEY_PAIR_GEN, 
  CKP_SLH_DSA_SHA2_128S, CKP_SLH_DSA_SHAKE_128S, CKP_SLH_DSA_SHA2_128F, CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHA2_192S, CKP_SLH_DSA_SHAKE_192S, CKP_SLH_DSA_SHA2_192F, CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHA2_256S, CKP_SLH_DSA_SHAKE_256S, CKP_SLH_DSA_SHA2_256F, CKP_SLH_DSA_SHAKE_256F
} from './constants';

export interface MLDSASignOptions { hedging?: 'preferred' | 'required' | 'deterministic'; context?: Uint8Array; preHash?: any; }
export type MLDSAPreHash = string;
export type SLHDSAPreHash = string;

/** Decode a CKF_ flags bitmask into an array of short flag names. */
const decodeMechFlags = (flags: number): string[] =>
  CKF_FLAG_NAMES.filter(([bit]) => (flags & bit) !== 0).map(([, name]) => name)

// Dummy buildMech until proper implementation
const buildMech = (M: any, type: number): number => M._malloc(12);
`
)

// 5. logging.ts
prependContent(
  'src/wasm/softhsm/logging.ts',
  `import type { SoftHSMModule } from '@pqctoday/softhsm-wasm';
import { buildInspect } from '../pkcs11Inspect';
import { RV_NAMES, PKCS11_PARAMS } from './constants';
`
)

console.log('Imports fixed')
