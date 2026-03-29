#!/usr/bin/env node
/**
 * generate-acvp-extras.mjs — Adds additional test cases (tcId=2, tcId=3) to existing
 * ACVP vector files so different learning modules can use distinct test data.
 *
 * Run once: node scripts/generate-acvp-extras.mjs
 * Then commit the updated src/data/acvp/*.json files.
 */
import {
  createHash,
  createHmac,
  generateKeyPairSync,
  sign,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createSign,
  createVerify,
} from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ACVP_DIR = join(__dirname, '..', 'src', 'data', 'acvp')

function toHex(buf) {
  return Buffer.from(buf).toString('hex')
}

// ── SHA-256 extra vectors ────────────────────────────────────────────────────
// Already has 3 test cases — no extras needed

// ── AES-GCM extra vectors ────────────────────────────────────────────────────
function generateAESGCMVector() {
  const key = randomBytes(32)
  const iv = randomBytes(12)
  const pt = Buffer.from(
    'AES-256-GCM ACVP extra test vector for module-specific KAT differentiation'
  )
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(pt), cipher.final()])
  const tag = cipher.getAuthTag()
  return { key: toHex(key), iv: toHex(iv), pt: toHex(pt), ct: toHex(ct), tag: toHex(tag) }
}

// ── AES-CBC extra vectors ────────────────────────────────────────────────────
function generateAESCBCVector() {
  const key = randomBytes(32)
  const iv = randomBytes(16)
  const pt = Buffer.from('AES-CBC-256 ACVP extra test for PKCS#11 validation with domain context')
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const ct = Buffer.concat([cipher.update(pt), cipher.final()])
  return { key: toHex(key), iv: toHex(iv), pt: toHex(pt), ct: toHex(ct) }
}

// ── AES-CTR extra vectors ────────────────────────────────────────────────────
function generateAESCTRVector() {
  const key = randomBytes(32)
  const iv = randomBytes(16)
  const pt = Buffer.from('AES-CTR-256 ACVP extra test vector for counter mode validation')
  const cipher = createCipheriv('aes-256-ctr', key, iv)
  const ct = Buffer.concat([cipher.update(pt), cipher.final()])
  return { key: toHex(key), iv: toHex(iv), pt: toHex(pt), ct: toHex(ct) }
}

// ── HMAC-SHA256 extra vectors ────────────────────────────────────────────────
function generateHMACVector(hashAlg, keyLen) {
  const key = randomBytes(keyLen)
  const msg = Buffer.from(`HMAC-${hashAlg} ACVP extra test vector for module KAT differentiation`)
  const mac = createHmac(hashAlg.toLowerCase().replace('-', ''), key).update(msg).digest()
  return { key: toHex(key), msg: toHex(msg), mac: toHex(mac) }
}

// ── ECDSA P-256 extra vectors ────────────────────────────────────────────────
function generateECDSAVector(curve, hashAlg) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: curve === 'P-256' ? 'prime256v1' : 'secp384r1',
  })
  const msg = Buffer.from(`ECDSA ${curve} ACVP extra test vector for sigVer differentiation`)
  const sigDer = sign(hashAlg === 'SHA-256' ? 'sha256' : 'sha384', msg, privateKey)

  // Extract raw (r, s) from DER
  const jwk = publicKey.export({ format: 'jwk' })
  const qx = Buffer.from(jwk.x, 'base64url').toString('hex')
  const qy = Buffer.from(jwk.y, 'base64url').toString('hex')

  // Parse DER signature to get r and s
  let offset = 2 // skip 0x30, length
  if (sigDer[1] & 0x80) offset += sigDer[1] & 0x7f // long form length
  offset++ // 0x02 tag for r
  const rLen = sigDer[offset++]
  const rBytes = sigDer.slice(offset, offset + rLen)
  offset += rLen
  offset++ // 0x02 tag for s
  const sLen = sigDer[offset++]
  const sBytes = sigDer.slice(offset, offset + sLen)

  // Pad/trim to field size
  const fieldSize = curve === 'P-256' ? 32 : 48
  const r = Buffer.from(rBytes)
    .slice(-fieldSize)
    .toString('hex')
    .padStart(fieldSize * 2, '0')
  const s = Buffer.from(sBytes)
    .slice(-fieldSize)
    .toString('hex')
    .padStart(fieldSize * 2, '0')

  return { qx, qy, msg: toHex(msg), r, s, testPassed: true }
}

// ── Update files ─────────────────────────────────────────────────────────────
function updateFile(filename, updater) {
  const path = join(ACVP_DIR, filename)
  const data = JSON.parse(readFileSync(path, 'utf8'))
  updater(data)
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
  console.log(`Updated ${filename}`)
}

// AES-GCM: add tcId=2,3
updateFile('aesgcm_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 3) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateAESGCMVector())
  group.tests.push(generateAESGCMVector())
})

// AES-CBC: add tcId=2
updateFile('aescbc_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateAESCBCVector())
})

// AES-CTR: add tcId=2
updateFile('aesctr_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateAESCTRVector())
})

// HMAC-SHA256: add tcId=2
updateFile('hmac_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateHMACVector('SHA-256', 32))
})

// HMAC-SHA384: add tcId=2
updateFile('hmac_sha384_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateHMACVector('SHA-384', 48))
})

// HMAC-SHA512: add tcId=2
updateFile('hmac_sha512_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateHMACVector('SHA-512', 64))
})

// ECDSA P-256: add tcId=2
updateFile('ecdsa_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateECDSAVector('P-256', 'SHA-256'))
})

// ECDSA P-384: add tcId=2
updateFile('ecdsa_p384_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  group.tests.push(generateECDSAVector('P-384', 'SHA-384'))
})

// EdDSA Ed25519: add tcId=2
updateFile('eddsa_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const msg = Buffer.from('EdDSA Ed25519 ACVP extra test vector for module KAT differentiation')
  const sig = sign(null, msg, privateKey)
  const jwk = publicKey.export({ format: 'jwk' })
  const pk = Buffer.from(jwk.x, 'base64url').toString('hex')
  group.tests.push({ pk, msg: toHex(msg), signature: toHex(sig), testPassed: true })
})

// RSA-PSS: add tcId=2
updateFile('rsapss_test.json', (data) => {
  const group = data.testGroups[0]
  if (group.tests.length >= 2) {
    console.log('  Already has extras, skipping')
    return
  }
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const msg = Buffer.from('RSA-PSS ACVP extra test vector for quantum threat comparison')
  const sig = createSign('RSA-SHA256')
    .update(msg)
    .sign({ key: privateKey, padding: 6 /* RSA_PKCS1_PSS_PADDING */, saltLength: 32 })
  const jwk = publicKey.export({ format: 'jwk' })
  const n = Buffer.from(jwk.n, 'base64url').toString('hex')
  const e = Buffer.from(jwk.e, 'base64url').toString('hex')
  group.tests.push({ n, e, msg: toHex(msg), signature: toHex(sig), testPassed: true })
})

console.log('\nDone. All ACVP files updated with extra test vectors.')
