/**
 * Simple Node.js script to validate all hash test vectors
 * Run with: node validate-hash-vectors.mjs
 */

import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js'
import { sha3_256, keccak_256 } from '@noble/hashes/sha3.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { blake2b } from '@noble/hashes/blake2.js'
import { bytesToHex } from '@noble/hashes/utils.js'

// Test vectors from official standards
const TEST_VECTORS = [
  // SHA-256 (FIPS 180-4)
  {
    algo: 'SHA-256',
    input: '',
    expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    algo: 'SHA-256',
    input: 'abc',
    expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },

  // SHA-384 (FIPS 180-4)
  {
    algo: 'SHA-384',
    input: '',
    expected:
      '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
  },
  {
    algo: 'SHA-384',
    input: 'abc',
    expected:
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
  },

  // SHA-512 (FIPS 180-4)
  {
    algo: 'SHA-512',
    input: '',
    expected:
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
  },
  {
    algo: 'SHA-512',
    input: 'abc',
    expected:
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
  },

  // SHA3-256 (FIPS 202)
  {
    algo: 'SHA3-256',
    input: '',
    expected: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
  },
  {
    algo: 'SHA3-256',
    input: 'abc',
    expected: '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
  },

  // Keccak-256 (Ethereum)
  {
    algo: 'Keccak-256',
    input: '',
    expected: 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  },
  {
    algo: 'Keccak-256',
    input: 'abc',
    expected: '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
  },

  // RIPEMD-160 (ISO/IEC 10118-3)
  { algo: 'RIPEMD-160', input: '', expected: '9c1185a5c5e9fc54612808977ee8f548b2258d31' },
  { algo: 'RIPEMD-160', input: 'abc', expected: '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc' },

  // BLAKE2b-256 (RFC 7693)
  {
    algo: 'BLAKE2b-256',
    input: '',
    expected: '0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8',
  },
  {
    algo: 'BLAKE2b-256',
    input: 'abc',
    expected: 'bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319',
  },

  // BLAKE2b-512 (RFC 7693)
  {
    algo: 'BLAKE2b-512',
    input: '',
    expected:
      '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce',
  },
  {
    algo: 'BLAKE2b-512',
    input: 'abc',
    expected:
      'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
  },
]

function hash(algorithm, input) {
  const inputBytes = new TextEncoder().encode(input)

  switch (algorithm) {
    case 'SHA-256':
      return bytesToHex(sha256(inputBytes))
    case 'SHA-384':
      return bytesToHex(sha384(inputBytes))
    case 'SHA-512':
      return bytesToHex(sha512(inputBytes))
    case 'SHA3-256':
      return bytesToHex(sha3_256(inputBytes))
    case 'Keccak-256':
      return bytesToHex(keccak_256(inputBytes))
    case 'RIPEMD-160':
      return bytesToHex(ripemd160(inputBytes))
    case 'BLAKE2b-256':
      return bytesToHex(blake2b(inputBytes, { dkLen: 32 }))
    case 'BLAKE2b-512':
      return bytesToHex(blake2b(inputBytes, { dkLen: 64 }))
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`)
  }
}

console.log('🔐 Validating Hash Test Vectors\n')
console.log('='.repeat(80))

let passed = 0
let failed = 0
const failures = []

for (const vector of TEST_VECTORS) {
  const result = hash(vector.algo, vector.input)
  const isMatch = result.toLowerCase() === vector.expected.toLowerCase()

  if (isMatch) {
    passed++
    const inputDisplay = vector.input === '' ? '(empty)' : `"${vector.input}"`
    console.log(`✅ ${vector.algo.padEnd(15)} ${inputDisplay}`)
  } else {
    failed++
    failures.push({
      algo: vector.algo,
      input: vector.input,
      expected: vector.expected,
      actual: result,
    })
    console.log(`❌ ${vector.algo.padEnd(15)} "${vector.input}"`)
  }
}

console.log('='.repeat(80))
console.log(
  `\n📊 Results: ${passed} passed, ${failed} failed out of ${TEST_VECTORS.length} tests\n`
)

if (failures.length > 0) {
  console.log('❌ Failed Tests:\n')
  failures.forEach((f) => {
    console.log(`Algorithm: ${f.algo}`)
    console.log(`Input:     "${f.input}"`)
    console.log(`Expected:  ${f.expected}`)
    console.log(`Actual:    ${f.actual}`)
    console.log()
  })
  process.exit(1)
} else {
  console.log('✅ All test vectors passed!')
  console.log('\n🎉 Hash implementation validated against official standards:')
  console.log('   - FIPS 180-4 (SHA-2 family)')
  console.log('   - FIPS 202 (SHA-3)')
  console.log('   - RFC 7693 (BLAKE2)')
  console.log('   - ISO/IEC 10118-3 (RIPEMD-160)')
  console.log('   - Ethereum Foundation (Keccak-256)')
  process.exit(0)
}
