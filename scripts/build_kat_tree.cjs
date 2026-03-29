const fs = require('fs')
const path = require('path')

const modulesDir = path.join(__dirname, '../src/components/PKILearning/modules')
const katDir = path.join(__dirname, '../kat')
const csvFile = path.join(katDir, 'kat_03282026.csv')

// Remove the old flat test-vectors folder
const testVectorsPath = path.join(katDir, 'test-vectors')
if (fs.existsSync(testVectorsPath)) {
  fs.rmSync(testVectorsPath, { recursive: true, force: true })
}

// 1. Find all active workshop modules
const moduleFolders = fs
  .readdirSync(modulesDir)
  .filter((f) => fs.statSync(path.join(modulesDir, f)).isDirectory())

let csvRows = [
  'kat_id,algorithm,local_kat_file,main_site_source,specific_kat_url,source_freshness_date,learning_module_id,use_case_validated,integration_status',
]
let katCounter = 1

for (const modName of moduleFolders) {
  const workshopPath = path.join(modulesDir, modName, 'workshop')
  if (!fs.existsSync(workshopPath)) continue

  const components = fs
    .readdirSync(workshopPath)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.replace('.tsx', ''))

  for (const comp of components) {
    const outDir = path.join(katDir, modName, comp)
    fs.mkdirSync(outDir, { recursive: true })

    // Logic to determine which steps to create based on component name
    let stepsToCreate = []
    let alg = 'Generic-PQC'
    let useCase = `${comp} Execution`

    if (comp.includes('Builder') || comp.includes('Generator')) {
      stepsToCreate = ['step_1_keygen.json', 'step_2_compute.json']
      alg = modName.includes('Merkle') ? 'LMS/XMSS' : 'ML-KEM/ML-DSA'
    } else if (comp.includes('Verifier') || comp.includes('Analyzer')) {
      stepsToCreate = ['step_1_load_asset.json', 'step_2_verify_signature.json']
      alg = 'ML-DSA'
    } else if (comp.includes('Signing') || comp.includes('Signer')) {
      stepsToCreate = ['step_1_hash.json', 'step_2_sign.json']
      alg = 'ML-DSA'
    } else if (comp.includes('Migrator') || comp.includes('Planner')) {
      // For architectural modules, maybe just a matrix analysis placeholder
      stepsToCreate = ['step_1_algorithm_selection.json']
      useCase = 'Migration Assessment Analysis'
    } else {
      stepsToCreate = ['step_1_execution.json']
    }

    // Specifically override for known workshops like MerkleTreeBuilder
    if (comp === 'MerkleTreeBuilder') {
      stepsToCreate = [
        'step_1_serialize_cert.json',
        'step_2_leaf_hash_0x00.json',
        'step_3_internal_node_hash_0x01.json',
      ]
      alg = 'SHA-256 (LMS internals)'
    } else if (comp === 'InclusionProofGenerator') {
      stepsToCreate = ['step_1_extract_sibling_hashes.json']
      alg = 'SHA-256 (LMS internals)'
    } else if (comp === 'ProofVerifier') {
      stepsToCreate = ['step_1_recompute_root.json']
      alg = 'SHA-256 (LMS internals)'
    } else if (comp === 'TLSConfigGenerator') {
      stepsToCreate = [
        'step_1_ml_kem_768_keygen.json',
        'step_2_encapsulate.json',
        'step_3_decapsulate.json',
      ]
      alg = 'ML-KEM-768'
    } else if (comp === 'BinarySigning' || comp === 'PackageSigning') {
      stepsToCreate = [
        'step_1_ml_dsa_65_keygen.json',
        'step_2_sign_artifact.json',
        'step_3_verify_artifact.json',
      ]
      alg = 'ML-DSA-65'
    }

    for (const stepFile of stepsToCreate) {
      const filePath = path.join(outDir, stepFile)
      const katId = `KAT-${comp.toUpperCase().substring(0, 8)}-${String(katCounter++).padStart(3, '0')}`

      // Create the physical JSON file
      const content = {
        kat_id: katId,
        step: stepFile.replace('.json', ''),
        algorithm: alg,
        authoritative_source: 'NIST FIPS Validated Vectors (To Be Populated via CLI)',
        data: {
          input: '...',
          expected_output: '...',
        },
      }

      // If we have actual RSP files, we would load them here.
      // We inject the stateful sig hashes if we match Merkle.
      if (alg === 'SHA-256 (LMS internals)' && fs.existsSync(path.join(katDir, 'sig_stfl'))) {
        content.data.reference_rsp = `/kat/sig_stfl/lms/LMS_SHA256_H10_W8.rsp`
      }

      fs.writeFileSync(filePath, JSON.stringify(content, null, 2))

      // Append to CSV Tracking List
      const relPath = `/kat/${modName}/${comp}/${stepFile}`
      csvRows.push(
        `${katId},${alg},${relPath},NIST CSRC,https://csrc.nist.gov/projects/post-quantum-cryptography,08/2024,${modName},${useCase},Active`
      )
    }
  }
}

// Rewrite the comprehensive CSV matrix
fs.writeFileSync(csvFile, csvRows.join('\n'))

console.log(
  `Generated ${katCounter - 1} discrete KAT step files directly mirroring component workshops!`
)
console.log(`Updated tracking matrix at ${csvFile}`)
