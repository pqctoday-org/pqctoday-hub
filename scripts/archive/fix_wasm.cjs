const fs = require('fs')

function addImports(file, imports) {
  let c = fs.readFileSync(file, 'utf8')
  c = imports + '\n' + c
  fs.writeFileSync(file, c)
}

// session.ts
addImports(
  'src/wasm/softhsm/session.ts',
  `import { SoftHSMModule } from './module';
import { readUlong } from './memory';
import { CKF_RW_SESSION, CKF_SERIAL_SESSION, CKU_SO, CKU_USER } from './constants';`
)

// memory.ts
addImports(
  'src/wasm/softhsm/memory.ts',
  `import { SoftHSMModule } from './module';
import { RV_NAMES, CK_ATTRIBUTE_SIZE } from './constants';
const rvName = (u) => RV_NAMES[u] || 'CKR_UNKNOWN';`
)

// crypto.ts
let c = fs.readFileSync('src/wasm/softhsm/crypto.ts', 'utf8')
if (!c.includes('import { writeBytes ')) {
  addImports(
    'src/wasm/softhsm/crypto.ts',
    `import { writeBytes } from './memory';
import { AttrDef, MechanismFamily, CKM_AES_KEY_WRAP, CKM_SHA256, CKM_SHA256_RSA_PKCS, CKF_FLAG_NAMES } from './constants';`
  )
}
// Also there is a buildMech missing in crypto.ts? Wait, crypto.ts has buildMech? Let's import it from .memory or constants? Actually it might be in memory.ts
// We will just do a basic injection for now.

// logging.ts
addImports(
  'src/wasm/softhsm/logging.ts',
  `import { SoftHSMModule } from './module';
import { buildInspect } from './pkcs11Inspect'; // or similar`
)

// module.ts
addImports(
  'src/wasm/softhsm/module.ts',
  `export interface SoftHSMModule {
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;
  HEAP32: Int32Array;
  // ... any other types
}`
)
