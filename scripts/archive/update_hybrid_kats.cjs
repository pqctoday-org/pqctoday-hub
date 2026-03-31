const fs = require('fs')
const path = require('path')

const hcDir = path.join(__dirname, '../kat/HybridCrypto')
const csvFile = path.join(__dirname, '../kat/kat_03282026.csv')

// Remove existing generic generic files
const subdirs = [
  'CompositeCertificateViewer',
  'HybridCASetup',
  'HybridCertFormats',
  'HybridCertInspector',
  'HybridEncryptionDemo',
  'HybridKeyGeneration',
]
for (const sd of subdirs) {
  const target = path.join(hcDir, sd)
  if (fs.existsSync(target)) {
    fs.readdirSync(target).forEach((f) => fs.unlinkSync(path.join(target, f)))
  } else {
    fs.mkdirSync(target, { recursive: true })
  }
}

// Define specific KATs for IETF PQC Certificate Variants
const katDefinitions = {
  HybridCertFormats: [
    {
      name: 'step_1_draft_lamps_x509_alt_pubkey_ext.json',
      alg: 'ML-DSA-65',
      rfc: 'draft-ietf-lamps-x509-alt-pubkey-08',
      useCase: 'Non-Composite X509 Alt Sig Extension Verify',
    },
    {
      name: 'step_2_draft_lamps_pq_composite_sigs.json',
      alg: 'RSA-Composite-ML-DSA',
      rfc: 'draft-ietf-lamps-pq-composite-sigs-07',
      useCase: 'Composite Certificate Signature Verify',
    },
    {
      name: 'step_3_draft_lamps_multi_key_ext.json',
      alg: 'ECDSA-multiple-ML-DSA',
      rfc: 'draft-ietf-lamps-multi-key-01',
      useCase: 'Multiple Public-Key Extension Processing',
    },
  ],
  CompositeCertificateViewer: [
    {
      name: 'step_1_composite_decode_asn1.json',
      alg: 'ASN1',
      rfc: 'draft-ietf-lamps-pq-composite-sigs',
      useCase: 'Decode Composite ASN.1 Sequence',
    },
    {
      name: 'step_2_verify_nested_signatures.json',
      alg: 'RSA-Composite-ML-DSA',
      rfc: 'draft-ietf-lamps-pq-composite-sigs',
      useCase: 'Nested Signature Block Validation',
    },
  ],
  HybridKeyGeneration: [
    {
      name: 'step_1_keygen_classical_p256.json',
      alg: 'ECDSA-P256',
      rfc: 'FIPS 186-4',
      useCase: 'Classical KeyGen',
    },
    {
      name: 'step_2_keygen_pqc_ml_dsa_65.json',
      alg: 'ML-DSA-65',
      rfc: 'FIPS 204',
      useCase: 'PQC KeyGen',
    },
    {
      name: 'step_3_bind_composite_keys.json',
      alg: 'Bind-Format',
      rfc: 'draft-ietf-lamps-pq-composite-keys',
      useCase: 'Composite Key Sequence Binding',
    },
  ],
  HybridCertInspector: [
    {
      name: 'step_1_parse_alt_signature_algorithm.json',
      alg: 'ML-DSA-65',
      rfc: 'draft-ietf-lamps-x509-alt-pubkey',
      useCase: 'Inspect Alt Signature Alg ID',
    },
    {
      name: 'step_2_validate_subject_alt_public_key_info.json',
      alg: 'ML-DSA-65',
      rfc: 'draft-ietf-lamps-x509-alt-pubkey',
      useCase: 'SubjectAltPublicKeyInfo Verification',
    },
  ],
}

let currentCsv = fs.readFileSync(csvFile, 'utf8').split('\n')
// Filter out old generic HybridCrypto rows
let newCsvLines = currentCsv.filter((line) => !line.includes(',HybridCrypto,'))

let katCounter = 1000

for (const comp in katDefinitions) {
  for (const def of katDefinitions[comp]) {
    const filePath = path.join(hcDir, comp, def.name)
    const relPath = `/kat/HybridCrypto/${comp}/${def.name}`
    const katId = `KAT-HYB-${String(katCounter++).padStart(4, '0')}`

    const content = {
      kat_id: katId,
      step_file: def.name,
      algorithm: def.alg,
      rfc_compliance: def.rfc,
      authoritative_source: 'IETF PQC Examples Dataset (To Be Hydrated)',
      data: {
        encoded_cert_asn1: '...',
        extracted_pqc_signature: '...',
      },
    }
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2))

    // Add back into CSV
    newCsvLines.push(
      `${katId},${def.alg},${relPath},IETF LAMPS DRAFT,https://datatracker.ietf.org/doc/${def.rfc.replace(/-\d\d$/, '')}/,08/2024,HybridCrypto,${def.useCase},Active`
    )
  }
}

fs.writeFileSync(csvFile, newCsvLines.join('\n'))
console.log('Successfully updated HybridCrypto PQC format variants & IETF RFC mappings!')
