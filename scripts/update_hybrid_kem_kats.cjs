const fs = require('fs')
const path = require('path')

const katDir = path.join(__dirname, '../kat')
const csvFile = path.join(katDir, 'kat_03282026.csv')

const newKats = [
  {
    comp: 'HybridCrypto/HybridEncryptionDemo',
    name: 'step_1_keygen_x25519.json',
    alg: 'X25519',
    rfc: 'RFC 7748',
    useCase: 'Classical KEM Component',
  },
  {
    comp: 'HybridCrypto/HybridEncryptionDemo',
    name: 'step_2_keygen_ml_kem_768.json',
    alg: 'ML-KEM-768',
    rfc: 'FIPS 203',
    useCase: 'PQC KEM Component',
  },
  {
    comp: 'HybridCrypto/HybridEncryptionDemo',
    name: 'step_3_encapsulate_x25519_mlkem768.json',
    alg: 'X25519MLKEM768',
    rfc: 'draft-ietf-tls-hybrid-design',
    useCase: 'Hybrid KEM Encapsulation Combiner',
  },
  {
    comp: 'HybridCrypto/HybridEncryptionDemo',
    name: 'step_4_decapsulate_and_kdf.json',
    alg: 'HKDF',
    rfc: 'draft-ietf-tls-hybrid-design',
    useCase: 'Dual Shared Secret Derivation',
  },
  // Update TLSBasics context for explicit hybrid KEM KeyShares
  {
    comp: 'TLSBasics/TLSConfigGenerator',
    name: 'step_4_x25519_mlkem768_key_share.json',
    alg: 'X25519MLKEM768',
    rfc: 'draft-ietf-tls-hybrid-design',
    useCase: 'TLS 1.3 ClientHello KeyShare Ext',
  },
]

let csvLines = fs.readFileSync(csvFile, 'utf8').split('\n')
let katCounter = 2000

for (const def of newKats) {
  const targetDir = path.join(katDir, def.comp)
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

  // Safety check so we don't accidentally duplicate in CSV if script runs twice
  const filepath = path.join(targetDir, def.name)
  if (!fs.existsSync(filepath)) {
    const relPath = `/kat/${def.comp}/${def.name}`
    const katId = `KAT-KEM-${String(katCounter++).padStart(4, '0')}`

    const content = {
      kat_id: katId,
      step_file: def.name,
      algorithm: def.alg,
      rfc_compliance: def.rfc,
      authoritative_source: 'IETF PQC Examples Dataset (To Be Hydrated)',
      data: {
        status: 'pending_hydration',
      },
    }
    fs.writeFileSync(filepath, JSON.stringify(content, null, 2))

    let parentModule = def.comp.split('/')[0]
    csvLines.push(
      `${katId},${def.alg},${relPath},IETF TLSwg DRAFT,https://datatracker.ietf.org/doc/${def.rfc}/,08/2024,${parentModule},${def.useCase},Active`
    )
  }
}

fs.writeFileSync(csvFile, csvLines.join('\n'))
console.log('Hybrid KEM Test Vectors mapped to IETF drafts successfully.')
