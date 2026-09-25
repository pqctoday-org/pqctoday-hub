// SPDX-License-Identifier: GPL-3.0-only
// WS-H: derive tools/acvp-native/pkcs11_constants.py from the hub's PKCS#11
// tables (logic: src/services/acvp-xplat/nativeConstants.ts).
//   npx tsx scripts/gen-acvp-native-constants.ts          # write
//   npx tsx scripts/gen-acvp-native-constants.ts --check  # exit 1 on drift
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  NATIVE_CONSTANTS_PATH,
  renderNativeConstants,
} from '../src/services/acvp-xplat/nativeConstants'

const target = path.join(process.cwd(), NATIVE_CONSTANTS_PATH)
const want = renderNativeConstants()
if (process.argv.includes('--check')) {
  let have = ''
  try {
    have = readFileSync(target, 'utf8')
  } catch {
    // missing file is drift
  }
  if (have !== want) {
    console.error(
      `[gen-acvp-native-constants] ${NATIVE_CONSTANTS_PATH} is stale — run npm run gen:acvp-native-constants`
    )
    process.exit(1)
  }
  console.warn(`[gen-acvp-native-constants] ${NATIVE_CONSTANTS_PATH} is current`)
} else {
  writeFileSync(target, want)
  console.warn(`[gen-acvp-native-constants] wrote ${NATIVE_CONSTANTS_PATH}`)
}
