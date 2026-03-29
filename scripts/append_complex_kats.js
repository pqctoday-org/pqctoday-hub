import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const KAT_DIR = path.join(__dirname, '../kat')
const CSV_FILE = path.join(KAT_DIR, 'kat_03282026.csv')

const complexModules = [
  // FiveG
  {
    path: 'FiveG/MilenageAuthentication/step_1_milenage_f1_mac_compute.json',
    id: 'KAT-5G-1001',
    alg: 'AES-128 MAC calculation',
    source: '3GPP TS 33.501',
    url: 'https://www.3gpp.org/',
    date: '08/2024',
    module: 'FiveG',
    useCase: 'Milenage F1 MAC Compute',
    status: 'Active',
  },
  {
    path: 'FiveG/MilenageAuthentication/step_2_milenage_f2_res_extraction.json',
    id: 'KAT-5G-1002',
    alg: 'AES-128',
    source: '3GPP TS 33.501',
    url: 'https://www.3gpp.org/',
    date: '08/2024',
    module: 'FiveG',
    useCase: 'Milenage F2 RES Extraction',
    status: 'Active',
  },
  {
    path: 'FiveG/SUCIPrivacyProtection/step_1_suci_profile_c_keygen.json',
    id: 'KAT-5G-1003',
    alg: 'Classical ECIES fallback',
    source: '3GPP TS 33.501',
    url: 'https://www.3gpp.org/',
    date: '08/2024',
    module: 'FiveG',
    useCase: 'SUCI Profile C Keygen',
    status: 'Active',
  },
  {
    path: 'FiveG/SUCIPrivacyProtection/step_2_suci_pqc_profile_mlkem_encapsulation.json',
    id: 'KAT-5G-1004',
    alg: 'Hybrid/PQC Scheme concealment',
    source: '3GPP TS 33.501',
    url: 'https://www.3gpp.org/',
    date: '08/2024',
    module: 'FiveG',
    useCase: 'SUCI PQC Profile MLKEM Encapsulation',
    status: 'Active',
  },

  // DigitalAssets
  {
    path: 'DigitalAssets/BIP32Wallets/step_1_bip32_secp256k1_derivation.json',
    id: 'KAT-DA-2001',
    alg: 'BIP32/secp256k1',
    source: 'BIP32',
    url: 'https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki',
    date: '08/2024',
    module: 'DigitalAssets',
    useCase: 'BIP32 SECP256K1 Derivation',
    status: 'Active',
  },
  {
    path: 'DigitalAssets/BIP32Wallets/step_2_pqc_hierarchical_derivation.json',
    id: 'KAT-DA-2002',
    alg: 'PQC Hierarchical Derivation',
    source: 'PQC Wallet Standard',
    url: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
    date: '08/2024',
    module: 'DigitalAssets',
    useCase: 'PQC HD Wallet Transition',
    status: 'Active',
  },
  {
    path: 'DigitalAssets/OnChainProtocols/step_1_ethereum_ecdsa_sign_tx.json',
    id: 'KAT-DA-2003',
    alg: 'ECDSA',
    source: 'EIP',
    url: 'https://eips.ethereum.org/',
    date: '08/2024',
    module: 'DigitalAssets',
    useCase: 'Ethereum ECDSA Sign Tx',
    status: 'Active',
  },
  {
    path: 'DigitalAssets/OnChainProtocols/step_2_solana_ed25519_sign_tx.json',
    id: 'KAT-DA-2004',
    alg: 'Ed25519',
    source: 'Solana',
    url: 'https://solana.com/',
    date: '08/2024',
    module: 'DigitalAssets',
    useCase: 'Solana Ed25519 Sign Tx',
    status: 'Active',
  },
  {
    path: 'DigitalAssets/OnChainProtocols/step_3_pqc_mldsa_sign_tx.json',
    id: 'KAT-DA-2005',
    alg: 'ML-DSA',
    source: 'PQC Blockchain Draft',
    url: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
    date: '08/2024',
    module: 'DigitalAssets',
    useCase: 'Quantum Resistant Ledger Trans.',
    status: 'Active',
  },

  // DigitalID
  {
    path: 'DigitalID/mDocFormats/step_1_mdoc_cbor_mac0_sign_mldsa.json',
    id: 'KAT-DID-3001',
    alg: 'CBOR MAC0 / ML-DSA',
    source: 'ISO 18013-5',
    url: 'https://www.iso.org/standard/69084.html',
    date: '08/2024',
    module: 'DigitalID',
    useCase: 'Issuer Authentication',
    status: 'Active',
  },
  {
    path: 'DigitalID/mDocFormats/step_2_device_engagement_mlkem_encapsulate.json',
    id: 'KAT-DID-3002',
    alg: 'ML-KEM',
    source: 'ISO 18013-5',
    url: 'https://www.iso.org/standard/69084.html',
    date: '08/2024',
    module: 'DigitalID',
    useCase: 'Proximity BLE session setup',
    status: 'Active',
  },
  {
    path: 'DigitalID/SDJWTCredentials/step_1_sdjwt_selective_disclosure_issue.json',
    id: 'KAT-DID-3003',
    alg: 'SD-JWT PQC',
    source: 'IETF OAuth DRAFT',
    url: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-selective-disclosure-jwt/',
    date: '08/2024',
    module: 'DigitalID',
    useCase: 'SD-JWT Selective Disclosure Issue',
    status: 'Active',
  },
]

// 1. Overwrite existing directories and JSON files with proper schema
complexModules.forEach((mod) => {
  const fullPath = path.join(KAT_DIR, mod.path)
  const dirPath = path.dirname(fullPath)

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  const stepName = path.basename(mod.path, '.json')

  const content = {
    kat_id: mod.id,
    step: stepName,
    algorithm: mod.alg,
    authoritative_source: `${mod.source} (To Be Populated via CLI)`,
    data: {
      input: '...',
      expected_output: '...',
    },
  }

  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf8')
  console.log(`Updated ${mod.path}`)
})

console.log('Successfully updated JSON schemas for complex modules.')
