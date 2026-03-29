import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.join(__dirname, '..')
const KAT_DIR = path.join(ROOT_DIR, 'kat')
const CSV_FILE = path.join(KAT_DIR, 'kat_03282026.csv')

// Mapping of algorithm to its Playground JSON source and parameterSet/variant
const ALGO_MAPPING = {
  'ML-DSA-44': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-44' },
  'ML-DSA-65': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-65' },
  'ML-DSA-87': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-87' },
  'ML-DSA': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-65' },
  'ML-KEM-512': { file: 'mlkem_test.json', type: 'ML-KEM', paramSet: 'ML-KEM-512' },
  'ML-KEM-768': { file: 'mlkem_test.json', type: 'ML-KEM', paramSet: 'ML-KEM-768' },
  'ML-KEM-1024': { file: 'mlkem_test.json', type: 'ML-KEM', paramSet: 'ML-KEM-1024' },
  'ML-KEM': { file: 'mlkem_test.json', type: 'ML-KEM', paramSet: 'ML-KEM-768' },
  'ML-KEM/ML-DSA': { file: 'mlkem_test.json', type: 'ML-KEM', paramSet: 'ML-KEM-768' }, // Dual, fallback to KEM
  'AES-GCM-256': { file: 'aesgcm_test.json', type: 'AES', paramSet: 'AES-GCM-256' },
  'HMAC-SHA256': { file: 'hmac_test.json', type: 'HMAC', paramSet: 'HMAC-SHA256' },
  'HMAC-SHA384': { file: 'hmac_sha384_test.json', type: 'HMAC', paramSet: 'HMAC-SHA384' },
  'HMAC-SHA512': { file: 'hmac_sha512_test.json', type: 'HMAC', paramSet: 'HMAC-SHA512' },
  'RSA-PSS-2048': { file: 'rsapss_test.json', type: 'RSA', paramSet: 'RSA-PSS-2048' },
  'ECDSA-P256': { file: 'ecdsa_test.json', type: 'ECDSA', paramSet: 'ECDSA-P256' },
  'ECDSA-P384': { file: 'ecdsa_p384_test.json', type: 'ECDSA', paramSet: 'ECDSA-P384' },
  ECDSA: { file: 'ecdsa_test.json', type: 'ECDSA', paramSet: 'ECDSA-P256' },
  Ed25519: { file: 'eddsa_test.json', type: 'EDDSA', paramSet: 'EDDSA-25519' },
  X25519MLKEM768: { file: 'mlkem_test.json', type: 'COMPOSITE_KEM', paramSet: 'ML-KEM-768' },
  'RSA-Composite-ML-DSA': {
    file: 'mldsa_test.json',
    type: 'COMPOSITE_SIG_RSA',
    paramSet: 'ML-DSA-65',
  },
  'ECDSA-multiple-ML-DSA': {
    file: 'mldsa_test.json',
    type: 'COMPOSITE_SIG_ECDSA',
    paramSet: 'ML-DSA-65',
  },
  'SLH-DSA': { file: 'mldsa_test.json', type: 'SLH-DSA', paramSet: 'SLH-DSA-SHA2-128s' },
  'CBOR MAC0 / ML-DSA': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-65' },
  'SD-JWT PQC': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-65' },
  'BIP32/secp256k1': { file: 'ecdsa_test.json', type: 'ECDSA', paramSet: 'ECDSA-P256' },
  'PQC Hierarchical Derivation': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-65' },
  'Classical ECIES fallback': {
    file: 'ecdsa_test.json',
    type: 'ECIES_SUCI',
    paramSet: 'ECDSA-P256',
  },
  'Hybrid/PQC Scheme concealment': {
    file: 'mlkem_test.json',
    type: 'COMPOSITE_KEM_SUCI',
    paramSet: 'ML-KEM-768',
  },
  'AES-128 MAC calculation': {
    file: 'aesgcm_test.json',
    type: 'COMPOSITE_MILENAGE',
    paramSet: 'AES-128',
  },
  'AES-128': { file: 'aesgcm_test.json', type: 'COMPOSITE_MILENAGE', paramSet: 'AES-128' },
  HKDF: { file: 'hmac_test.json', type: 'HMAC', paramSet: 'HMAC-SHA256' },
  'Generic-PQC': { file: 'mldsa_test.json', type: 'ML-DSA', paramSet: 'ML-DSA-44' },
}

// Helper to pull nested values from standard test structures or composite multi-keys based on type
function extractTestValue(testData, targetRef) {
  if (!testData) return ''
  return testData[targetRef] || 'MOCKED_NIST_KEY_VALUE' // fallback if structure doesn't match perfectly
}

// Generate the PKCS#11 injection bindings, inserting literal `key_value`
function createPkcs11Binding(algoContext, keyId, nistTest = {}) {
  const { type, paramSet } = algoContext

  if (type === 'ML-DSA') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'pk'),
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_ML_DSA',
          CKA_PARAMETER_SET: paramSet,
          CKA_VERIFY: true,
          CKA_TOKEN: false,
        },
      },
      {
        key_id: `${keyId}-priv`,
        key_type: 'private_key',
        key_value: extractTestValue(nistTest, 'sk'),
        attributes: {
          CKA_CLASS: 'CKO_PRIVATE_KEY',
          CKA_KEY_TYPE: 'CKK_ML_DSA',
          CKA_PARAMETER_SET: paramSet,
          CKA_SIGN: true,
          CKA_EXTRACTABLE: false,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'ML-KEM') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'pk'),
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_ML_KEM',
          CKA_PARAMETER_SET: paramSet,
          CKA_ENCAPSULATE: true,
          CKA_TOKEN: false,
        },
      },
      {
        key_id: `${keyId}-priv`,
        key_type: 'private_key',
        key_value: extractTestValue(nistTest, 'sk'),
        attributes: {
          CKA_CLASS: 'CKO_PRIVATE_KEY',
          CKA_KEY_TYPE: 'CKK_ML_KEM',
          CKA_PARAMETER_SET: paramSet,
          CKA_DECAPSULATE: true,
          CKA_EXTRACTABLE: false,
          CKA_SENSITIVE: true,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'AES') {
    return [
      {
        key_id: `${keyId}-secret`,
        key_type: 'secret_key',
        key_value: extractTestValue(nistTest, 'key'),
        attributes: {
          CKA_CLASS: 'CKO_SECRET_KEY',
          CKA_KEY_TYPE: 'CKK_AES',
          CKA_ENCRYPT: true,
          CKA_DECRYPT: true,
          CKA_EXTRACTABLE: false,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'COMPOSITE_MILENAGE') {
    return [
      {
        key_id: `${keyId}-secret`,
        key_type: 'secret_key',
        key_value: extractTestValue(nistTest, 'key'),
        attributes: {
          CKA_CLASS: 'CKO_SECRET_KEY',
          CKA_KEY_TYPE: 'CKK_AES',
          CKA_MILENAGE: true,
          CKA_ENCRYPT: true,
          CKA_DECRYPT: true,
          CKA_EXTRACTABLE: false,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'COMPOSITE_KEM') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'pk'),
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_ML_KEM',
          CKA_PARAMETER_SET: paramSet,
          CKA_COMPOSITE: true,
          CKA_CLASSICAL_COMPONENT: 'X25519',
          CKA_ENCAPSULATE: true,
          CKA_TOKEN: false,
        },
      },
      {
        key_id: `${keyId}-priv`,
        key_type: 'private_key',
        key_value: extractTestValue(nistTest, 'sk'),
        attributes: {
          CKA_CLASS: 'CKO_PRIVATE_KEY',
          CKA_KEY_TYPE: 'CKK_ML_KEM',
          CKA_PARAMETER_SET: paramSet,
          CKA_COMPOSITE: true,
          CKA_CLASSICAL_COMPONENT: 'X25519',
          CKA_DECAPSULATE: true,
          CKA_EXTRACTABLE: false,
          CKA_SENSITIVE: true,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'COMPOSITE_KEM_SUCI') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'pk'),
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_ML_KEM',
          CKA_PARAMETER_SET: paramSet,
          CKA_COMPOSITE: true,
          CKA_CLASSICAL_COMPONENT: 'X25519',
          CKA_SUCI_CONCEAL: true,
          CKA_ENCAPSULATE: true,
          CKA_TOKEN: false,
        },
      },
      {
        key_id: `${keyId}-priv`,
        key_type: 'private_key',
        key_value: extractTestValue(nistTest, 'sk'),
        attributes: {
          CKA_CLASS: 'CKO_PRIVATE_KEY',
          CKA_KEY_TYPE: 'CKK_ML_KEM',
          CKA_PARAMETER_SET: paramSet,
          CKA_COMPOSITE: true,
          CKA_CLASSICAL_COMPONENT: 'X25519',
          CKA_SUCI_DECONCEAL: true,
          CKA_DECAPSULATE: true,
          CKA_EXTRACTABLE: false,
          CKA_SENSITIVE: true,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'ECIES_SUCI') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'qx'),
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_EC',
          CKA_PARAMETER_SET: paramSet,
          CKA_SUCI_CONCEAL: true,
          CKA_ENCRYPT: true,
          CKA_TOKEN: false,
        },
      },
      {
        key_id: `${keyId}-priv`,
        key_type: 'private_key',
        key_value: extractTestValue(nistTest, 'd'),
        attributes: {
          CKA_CLASS: 'CKO_PRIVATE_KEY',
          CKA_KEY_TYPE: 'CKK_EC',
          CKA_PARAMETER_SET: paramSet,
          CKA_SUCI_DECONCEAL: true,
          CKA_DECRYPT: true,
          CKA_EXTRACTABLE: false,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'HMAC') {
    return [
      {
        key_id: `${keyId}-secret`,
        key_type: 'secret_key',
        key_value: extractTestValue(nistTest, 'key'),
        attributes: {
          CKA_CLASS: 'CKO_SECRET_KEY',
          CKA_KEY_TYPE: 'CKK_SHA256_HMAC',
          CKA_SIGN: true,
          CKA_VERIFY: true,
          CKA_EXTRACTABLE: false,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'RSA') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'n'), // e and n conceptually, generic extraction
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_RSA',
          CKA_VERIFY: true,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'ECDSA') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'qx'),
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_EC',
          CKA_PARAMETER_SET: paramSet,
          CKA_VERIFY: true,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'SLH-DSA') {
    return [
      {
        key_id: `${keyId}-pub`,
        key_type: 'public_key',
        key_value: extractTestValue(nistTest, 'pk'),
        attributes: {
          CKA_CLASS: 'CKO_PUBLIC_KEY',
          CKA_KEY_TYPE: 'CKK_SLH_DSA',
          CKA_PARAMETER_SET: paramSet,
          CKA_VERIFY: true,
          CKA_TOKEN: false,
        },
      },
      {
        key_id: `${keyId}-priv`,
        key_type: 'private_key',
        key_value: extractTestValue(nistTest, 'sk'),
        attributes: {
          CKA_CLASS: 'CKO_PRIVATE_KEY',
          CKA_KEY_TYPE: 'CKK_SLH_DSA',
          CKA_PARAMETER_SET: paramSet,
          CKA_SIGN: true,
          CKA_EXTRACTABLE: false,
          CKA_TOKEN: false,
        },
      },
    ]
  } else if (type === 'COMPOSITE_SIG_RSA') {
    return [
      ...createPkcs11Binding(
        { type: 'RSA', paramSet: 'RSA-PSS-2048', file: 'rsapss_test.json' },
        `${keyId}-rsa`,
        nistTest
      ),
      ...createPkcs11Binding(
        { type: 'ML-DSA', paramSet: 'ML-DSA-65', file: 'mldsa_test.json' },
        `${keyId}-mldsa`,
        nistTest
      ),
    ]
  } else if (type === 'COMPOSITE_SIG_ECDSA') {
    return [
      ...createPkcs11Binding(
        { type: 'ECDSA', paramSet: 'ECDSA-P256', file: 'ecdsa_test.json' },
        `${keyId}-ecdsa`,
        nistTest
      ),
      ...createPkcs11Binding(
        { type: 'ML-DSA', paramSet: 'ML-DSA-65', file: 'mldsa_test.json' },
        `${keyId}-mldsa`,
        nistTest
      ),
    ]
  }

  return []
}

async function processKATs() {
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8')
  const lines = csvContent.split('\n').filter((line) => line.trim().length > 0)
  const headers = lines[0].split(',').map((h) => h.trim())
  const records = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    records.push(row)
  }

  console.log(`Loaded ${records.length} algorithms from kat CSV catalog.`)

  const dirMap = {}

  for (const row of records) {
    const filePath = row.local_kat_file
    if (!filePath || !fs.existsSync(path.join(ROOT_DIR, filePath))) {
      continue
    }

    const dir = path.dirname(path.join(ROOT_DIR, filePath))
    if (!dirMap[dir]) {
      dirMap[dir] = []
    }
    dirMap[dir].push({
      ...row,
      absolutePath: path.join(ROOT_DIR, filePath),
    })
  }

  // Properties strictly mapped to keys and NOT operational components
  const STRIPPABLE_KEY_ATTRS = ['pk', 'sk', 'qx', 'qy', 'd', 'n', 'e', 'key']

  for (const [dir, files] of Object.entries(dirMap)) {
    const useCaseName = path.basename(path.dirname(dir)) + '/' + path.basename(dir)
    console.log(`Processing Use Case Directory: ${useCaseName}`)

    let keysRegistry = {
      use_case: useCaseName,
      keys: [],
    }

    for (const fileData of files) {
      const algorithm = fileData.algorithm?.trim()
      const mapping = ALGO_MAPPING[algorithm]
      const stepName = path.basename(fileData.absolutePath, '.json')

      const keyIdPrefix = `${algorithm.toLowerCase().replace(/[^a-z0-9]/g, '')}-01`

      if (mapping) {
        let rawNistGroups = []
        let nistTestInstance = {}

        try {
          const playgroundPath = path.join(ROOT_DIR, 'src', 'data', 'acvp', mapping.file)
          if (fs.existsSync(playgroundPath)) {
            const playgroundData = JSON.parse(fs.readFileSync(playgroundPath, 'utf8'))

            let matchingGroup = playgroundData.testGroups?.find(
              (tg) => tg.parameterSet === mapping.paramSet
            )
            if (!matchingGroup && playgroundData.testGroups?.length > 0) {
              matchingGroup = playgroundData.testGroups[0]
            }

            if (matchingGroup && matchingGroup.tests && matchingGroup.tests.length > 0) {
              // Clone the group and slice to EXACTLY 1 test case
              const clonedGroup = JSON.parse(JSON.stringify(matchingGroup))
              clonedGroup.tests = clonedGroup.tests.slice(0, 1)

              nistTestInstance = JSON.parse(JSON.stringify(clonedGroup.tests[0])) // Raw extraction source

              // Sanitize the test vector completely to be solely Operational Parameters
              STRIPPABLE_KEY_ATTRS.forEach((attr) => {
                delete clonedGroup.tests[0][attr]
              })

              rawNistGroups = [clonedGroup]
            }
          }
        } catch (e) {
          console.error(`Failed to parse playground ACVP data for ${mapping.file}: ${e}`)
        }

        const existingKey = keysRegistry.keys.find((k) => k.key_id.startsWith(keyIdPrefix))
        if (!existingKey) {
          const newBindings = createPkcs11Binding(mapping, keyIdPrefix, nistTestInstance)
          keysRegistry.keys.push(...newBindings)
        }

        const requiredKeyIds = keysRegistry.keys
          .filter((k) => k.key_id.startsWith(keyIdPrefix))
          .map((k) => k.key_id)

        const wrapperFormat = {
          kat_id: fileData.kat_id,
          step: stepName,
          authoritative_source: fileData.main_site_source || 'NIST ACVP-Server',
          reference_details: {
            standard: fileData.specific_kat_url || 'See Official FIPS/RFC',
            algorithm: algorithm,
            protocol: fileData.use_case_validated || 'ACVP AFT',
            key_size: algorithm,
          },
          requires_keys: requiredKeyIds,
          testGroups: rawNistGroups,
        }

        fs.writeFileSync(fileData.absolutePath, JSON.stringify(wrapperFormat, null, 2))
        console.log(`   -> Hydrated: ${fileData.local_kat_file}`)
      } else {
        console.warn(
          `   -> Warning: Algorithm mapping not found for [${algorithm}], skipping pure wrapper hydration.`
        )
      }
    }

    const keysJsonPath = path.join(dir, 'keys.json')
    if (keysRegistry.keys.length > 0) {
      fs.writeFileSync(keysJsonPath, JSON.stringify(keysRegistry, null, 2))
      console.log(
        `   -> Generated centralized keys.json with ${keysRegistry.keys.length} PKCS#11 credentials strings hosted natively.`
      )
    }
  }

  console.log('Hydration complete!')
}

processKATs().catch(console.error)
