const fs = require('fs')
let c = fs.readFileSync('src/wasm/softhsm/constants.ts', 'utf8')

if (!c.includes('export interface MechanismInfo')) {
  c += `
export interface MechanismInfo {
    type: number;
    typeHex: string;
    name: string;
    description: string;
    ulMinKeySize: number;
    ulMaxKeySize: number;
    flags: number;
    flagNames: string[];
    family: string;
}
`
}
fs.writeFileSync('src/wasm/softhsm/constants.ts', c, 'utf8')

// Also remove duplicate hsm_generateSLHDSAKeyPair from softhsm.ts logic
let s = fs.readFileSync('src/wasm/softhsm.ts', 'utf8')
s = s.replace(/export \* from '\.\/softhsm\/crypto';/g, '')
s += "\nexport * from './softhsm/crypto';\n"
fs.writeFileSync('src/wasm/softhsm.ts', s, 'utf8')

// Fix the inspect types typo
let i = fs.readFileSync('src/wasm/inspect/types.ts', 'utf8')
i = i.replace(/export export /g, 'export ')
fs.writeFileSync('src/wasm/inspect/types.ts', i, 'utf8')
