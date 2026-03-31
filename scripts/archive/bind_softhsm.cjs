const fs = require('fs')

const f = 'src/wasm/softhsm.ts'
let c = fs.readFileSync(f, 'utf8')

if (!c.includes("export * from './softhsm/constants'")) {
  c += "\nexport * from './softhsm/constants';\n"
}
if (!c.includes("export * from './softhsm/crypto'")) {
  c += "export * from './softhsm/crypto';\n"
}
if (!c.includes("export * from './softhsm/memory'")) {
  c += "export * from './softhsm/memory';\n"
}

fs.writeFileSync(f, c, 'utf8')

// Also need to fix the internal imports between the 5 separated WASM files
const f2 = 'src/wasm/softhsm/crypto.ts'
let c2 = fs.readFileSync(f2, 'utf8')
if (c2.includes("import { readUlong, writeUlong, allocUlong, writeBytes } from './memory';")) {
  // writeUlong isn't exported by memory or doesn't exist? Oh, memory.ts doesn't export writeUlong.
}
