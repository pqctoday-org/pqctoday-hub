/**
 * Reference Test Vectors for Cryptographic Hash Functions
 *
 * These test vectors are from official standards and widely-used test suites:
 * - NIST CAVP (Cryptographic Algorithm Validation Program)
 * - RFC specifications
 * - Official implementation test suites
 *
 * Each test vector includes:
 * - input: The input message (ASCII string)
 * - expected: The expected hash output (hex string)
 * - source: Reference to the standard or test suite
 */

export interface HashTestVector {
  algorithm: string
  input: string
  expected: string
  source: string
  description: string
}

export const HASH_TEST_VECTORS: HashTestVector[] = [
  // SHA-256 Test Vectors (FIPS 180-4)
  {
    algorithm: 'SHA-256',
    input: '',
    expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    source: 'FIPS 180-4',
    description: 'Empty string',
  },
  {
    algorithm: 'SHA-256',
    input: 'abc',
    expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    source: 'FIPS 180-4',
    description: 'Standard test vector "abc"',
  },
  {
    algorithm: 'SHA-256',
    input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    expected: '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    source: 'FIPS 180-4',
    description: 'Long message test',
  },

  // SHA-384 Test Vectors (FIPS 180-4)
  {
    algorithm: 'SHA-384',
    input: '',
    expected:
      '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
    source: 'FIPS 180-4',
    description: 'Empty string',
  },
  {
    algorithm: 'SHA-384',
    input: 'abc',
    expected:
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    source: 'FIPS 180-4',
    description: 'Standard test vector "abc"',
  },

  // SHA-512 Test Vectors (FIPS 180-4)
  {
    algorithm: 'SHA-512',
    input: '',
    expected:
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
    source: 'FIPS 180-4',
    description: 'Empty string',
  },
  {
    algorithm: 'SHA-512',
    input: 'abc',
    expected:
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    source: 'FIPS 180-4',
    description: 'Standard test vector "abc"',
  },

  // SHA3-256 Test Vectors (FIPS 202)
  {
    algorithm: 'SHA3-256',
    input: '',
    expected: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    source: 'FIPS 202',
    description: 'Empty string',
  },
  {
    algorithm: 'SHA3-256',
    input: 'abc',
    expected: '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    source: 'FIPS 202',
    description: 'Standard test vector "abc"',
  },

  // Keccak-256 Test Vectors (Original Keccak, used by Ethereum)
  {
    algorithm: 'Keccak-256',
    input: '',
    expected: 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    source: 'Ethereum Foundation',
    description: 'Empty string (Ethereum empty hash)',
  },
  {
    algorithm: 'Keccak-256',
    input: 'abc',
    expected: '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
    source: 'Keccak Test Suite',
    description: 'Standard test vector "abc"',
  },
  {
    algorithm: 'Keccak-256',
    input: 'Hello, World!',
    expected: 'acaf3289d7b601cbd114fb36c4d29c85bbfd5e133f14cb355c3fd8d99367964f',
    source: 'Common test',
    description: 'Hello World test',
  },

  // RIPEMD-160 Test Vectors (ISO/IEC 10118-3)
  {
    algorithm: 'RIPEMD-160',
    input: '',
    expected: '9c1185a5c5e9fc54612808977ee8f548b2258d31',
    source: 'ISO/IEC 10118-3',
    description: 'Empty string',
  },
  {
    algorithm: 'RIPEMD-160',
    input: 'abc',
    expected: '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc',
    source: 'ISO/IEC 10118-3',
    description: 'Standard test vector "abc"',
  },
  {
    algorithm: 'RIPEMD-160',
    input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    expected: '12a053384a9c0c88e405a06c27dcf49ada62eb2b',
    source: 'ISO/IEC 10118-3',
    description: 'Long message test',
  },

  // BLAKE2b-256 Test Vectors (RFC 7693)
  {
    algorithm: 'BLAKE2b-256',
    input: '',
    expected: '0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8',
    source: 'RFC 7693',
    description: 'Empty string',
  },
  {
    algorithm: 'BLAKE2b-256',
    input: 'abc',
    expected: 'bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319',
    source: 'RFC 7693',
    description: 'Standard test vector "abc"',
  },

  // BLAKE2b-512 Test Vectors (RFC 7693)
  {
    algorithm: 'BLAKE2b-512',
    input: '',
    expected:
      '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce',
    source: 'RFC 7693',
    description: 'Empty string',
  },
  {
    algorithm: 'BLAKE2b-512',
    input: 'abc',
    expected:
      'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
    source: 'RFC 7693',
    description: 'Standard test vector "abc"',
  },

  // Additional practical test cases
  {
    algorithm: 'SHA-256',
    input: 'Hello Hashing World!',
    // Computed value - will verify in tests
    expected: 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    source: 'Default playground input',
    description: 'Default input text for playground',
  },
]

/**
 * Get test vectors for a specific algorithm
 */
export function getTestVectorsForAlgorithm(algorithm: string): HashTestVector[] {
  return HASH_TEST_VECTORS.filter((v) => v.algorithm === algorithm)
}

/**
 * Get a simple test vector (usually "abc") for quick validation
 */
export function getSimpleTestVector(algorithm: string): HashTestVector | undefined {
  return HASH_TEST_VECTORS.find((v) => v.algorithm === algorithm && v.input === 'abc')
}

/**
 * Validate all test vectors against the implementation
 * Returns array of validation results
 */
export async function validateAllTestVectors(
  hashFunction: (algorithm: string, input: string, inputType: 'hex' | 'ascii') => string
): Promise<Array<{ vector: HashTestVector; passed: boolean; actual?: string }>> {
  const results: Array<{ vector: HashTestVector; passed: boolean; actual?: string }> = []

  for (const vector of HASH_TEST_VECTORS) {
    try {
      const actual = hashFunction(vector.algorithm, vector.input, 'ascii')
      const passed = actual.toLowerCase() === vector.expected.toLowerCase()
      results.push({ vector, passed, actual })
    } catch {
      results.push({ vector, passed: false, actual: undefined })
    }
  }

  return results
}
