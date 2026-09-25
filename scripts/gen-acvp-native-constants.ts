// SPDX-License-Identifier: GPL-3.0-only
// WS-H: derive tools/acvp-native/pkcs11_constants.py from the hub's PKCS#11
// tables (logic: src/services/acvp-xplat/nativeConstants.ts).
//   npx tsx scripts/gen-acvp-native-constants.ts          # write
//   npx tsx scripts/gen-acvp-native-constants.ts --check  # exit 1 on drift
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  HUB_CONTRACT_PATH,
  NATIVE_CONSTANTS_PATH,
  renderHubContract,
  renderNativeConstants,
} from '../src/services/acvp-xplat/nativeConstants'

const outputs: Array<[string, string]> = [
  [NATIVE_CONSTANTS_PATH, renderNativeConstants()],
  [HUB_CONTRACT_PATH, renderHubContract()],
]
const check = process.argv.includes('--check')
let stale = 0
for (const [rel, want] of outputs) {
  const target = path.join(process.cwd(), rel)
  if (check) {
    let have = ''
    try {
      have = readFileSync(target, 'utf8')
    } catch {
      // missing file is drift
    }
    if (have !== want) {
      stale++
      console.error(
        `[gen-acvp-native-constants] ${rel} is stale — run npm run gen:acvp-native-constants`
      )
    } else console.warn(`[gen-acvp-native-constants] ${rel} is current`)
  } else {
    writeFileSync(target, want)
    console.warn(`[gen-acvp-native-constants] wrote ${rel}`)
  }
}
if (stale > 0) process.exit(1)
