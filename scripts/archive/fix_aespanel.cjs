const fs = require('fs')
const content = fs.readFileSync('src/components/Playground/hsm/HsmSymmetricPanel.tsx', 'utf8')
const startStr = "const AesPanel = ({ mode }: { mode: 'aes-gcm' | 'aes-cbc' }) => {"
const startIdx = content.indexOf(startStr)
let endIdx = -1

let openBraces = 0
let inString = false
let stringChar = ''
let idx = startIdx
while (idx < content.length && content[idx] !== '{') idx++
for (; idx < content.length; idx++) {
  const char = content[idx]
  if (inString) {
    if (char === '\\\\') {
      idx++
      continue
    }
    if (char === stringChar) {
      inString = false
    }
    continue
  } else if (char === '"' || char === "'" || char === '`') {
    inString = true
    stringChar = char
    continue
  }
  if (char === '{') openBraces++
  else if (char === '}') {
    openBraces--
    if (openBraces === 0) {
      endIdx = idx
      break
    }
  }
}

const block = content.substring(startIdx, endIdx + 1)
const destFile = 'src/components/Playground/hsm/symmetric/AesPanel.tsx'
let destContent = fs.readFileSync(destFile, 'utf8')
destContent = destContent.replace('export const AesPanel = ({ mode }\\n', 'export ' + block + '\\n')
fs.writeFileSync(destFile, destContent, 'utf8')

const newMain = content.replace(block, '// AesPanel extracted')
fs.writeFileSync('src/components/Playground/hsm/HsmSymmetricPanel.tsx', newMain, 'utf8')
