const fs = require('fs')

function cleanFile(f) {
  let lines = fs.readFileSync(f, 'utf8').split('\n')
  let seenExports = new Set()
  let out = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let match = line.match(/^export const ([a-zA-Z0-9_]+) =/)
    if (match) {
      let name = match[1]
      if (seenExports.has(name)) {
        // skip this export block (naively assume it ends at first empty line)
        while (i < lines.length && lines[i].trim() !== '') i++
        continue
      }
      seenExports.add(name)
    }
    out.push(line)
  }
  fs.writeFileSync(f, out.join('\n'), 'utf8')
}

cleanFile('src/wasm/softhsm/crypto.ts')
cleanFile('src/wasm/softhsm/memory.ts')
console.log('Cleaned WASM')
