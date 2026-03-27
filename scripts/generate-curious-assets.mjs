#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const PROJECT_ID = 'gen-lang-client-0481467456'
const REGION = 'us-central1'
const BASE_URL = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}`
const IMAGEN_MODEL = 'imagen-3.0-generate-001'
const GEMINI_MODEL = 'gemini-2.0-flash'
const FIXED_SEED = 133742

/** Maps module directory names → kebab-case module IDs (must stay in sync with CuriousSummaryBanner.tsx) */
const DIR_TO_MODULE_ID = {
  'Module1-Introduction': 'pqc-101',
  QuantumThreats: 'quantum-threats',
  HybridCrypto: 'hybrid-crypto',
  CryptoAgility: 'crypto-agility',
  TLSBasics: 'tls-basics',
  VPNSSHModule: 'vpn-ssh-pqc',
  EmailSigning: 'email-signing',
  PKIWorkshop: 'pki-workshop',
  KmsPqc: 'kms-pqc',
  HsmPqc: 'hsm-pqc',
  DataAssetSensitivity: 'data-asset-sensitivity',
  StatefulSignatures: 'stateful-signatures',
  DigitalAssets: 'digital-assets',
  FiveG: '5g-security',
  DigitalID: 'digital-id',
  Entropy: 'entropy-randomness',
  MerkleTreeCerts: 'merkle-tree-certs',
  QKD: 'qkd',
  VendorRisk: 'vendor-risk',
  ComplianceStrategy: 'compliance-strategy',
  MigrationProgram: 'migration-program',
  PQCRiskManagement: 'pqc-risk-management',
  PQCTestingValidation: 'pqc-testing-validation',
  PQCBusinessCase: 'pqc-business-case',
  PQCGovernance: 'pqc-governance',
  CodeSigning: 'code-signing',
  APISecurityJWT: 'api-security-jwt',
  IoTOT: 'iot-ot-pqc',
  ConfidentialComputing: 'confidential-computing',
  WebGatewayPQC: 'web-gateway-pqc',
  EMVPaymentPQC: 'emv-payment-pqc',
  CryptoDevAPIs: 'crypto-dev-apis',
  PlatformEngPQC: 'platform-eng-pqc',
  EnergyUtilities: 'energy-utilities-pqc',
  HealthcarePQC: 'healthcare-pqc',
  AerospacePQC: 'aerospace-pqc',
  AutomotivePQC: 'automotive-pqc',
  ExecQuantumImpact: 'exec-quantum-impact',
  DevQuantumImpact: 'dev-quantum-impact',
  ArchQuantumImpact: 'arch-quantum-impact',
  OpsQuantumImpact: 'ops-quantum-impact',
  ResearchQuantumImpact: 'research-quantum-impact',
  StandardsBodies: 'standards-bodies',
  AISecurityPQC: 'ai-security-pqc',
  SecretsManagementPQC: 'secrets-management-pqc',
  NetworkSecurityPQC: 'network-security-pqc',
  DatabaseEncryptionPQC: 'database-encryption-pqc',
  IAMPQC: 'iam-pqc',
  SecureBootPQC: 'secure-boot-pqc',
  OSPQC: 'os-pqc',
}
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'infographics')

/**
 * Quadrant titles for each module's curious infographic.
 * Format per quadrant: "TITLE - subtitle"
 * Follows the workflow documented in .agents/workflows/generate-learning-visual.md
 */
const MODULE_QUADRANTS = {
  'tls-basics': [
    'HANDSHAKE DEAL - exchanging digital greetings securely',
    'KEY SWAP - sharing secrets no one else can read',
    'DATA TUNNEL - wrapping messages in unbreakable armor',
    'TRUST CHECK - verifying who you are really talking to',
  ],
  'quantum-threats': [
    'HARVEST TODAY - stealing encrypted data right now',
    'DECRYPT TOMORROW - opening the vault with a quantum key',
    "CRACKING KEYS - shattering RSA with Shor's algorithm",
    'QUANTUM CLOCK - the countdown to cryptographic collapse',
  ],
  'stateful-signatures': [
    'ONE-TIME CODES - each signature burns the bridge behind it',
    'TREE OF TRUST - Merkle roots anchoring authenticity',
    'CHAIN REACTION - sequences that prevent replay attacks',
    'NO REPLAY - signatures that cannot be copied or reused',
  ],
  'standards-bodies': [
    'NIST RULES - setting the global post-quantum playbook',
    'FIPS APPROVED - earning the federal seal of cryptographic trust',
    'GLOBAL RACE - nations standardizing before quantum day',
    'SEAL OF TRUST - certification that your crypto is future-proof',
  ],
  'secure-boot-pqc': [
    'BOOT SHIELD - protecting the very first instruction',
    'FIRMWARE LOCK - signing code before the OS wakes up',
    'ROOT OF TRUST - the anchor that verifies everything above it',
    'VERIFIED LAUNCH - only signed software gets to run',
  ],
  'secrets-management-pqc': [
    'VAULT SEALED - locking credentials behind quantum-safe walls',
    'KEY ROTATION - swapping secrets before attackers can follow',
    'ZERO KNOWLEDGE - proving you know it without revealing it',
    'SECRET SAFE - automated secrets that never touch a human hand',
  ],
  'research-quantum-impact': [
    'LAB TO LAW - how academic breakthroughs become mandates',
    'PUBLISH PROTECT - securing findings from harvest attacks',
    'DATA SHIELD - long-lived research guarded for decades',
    'FUTURE PROOF - building today for a post-quantum tomorrow',
  ],
  'vendor-risk': [
    'SUPPLIER CHECK - auditing every cryptographic dependency',
    'CHAIN AUDIT - tracing quantum readiness through the supply chain',
    "THIRD PARTY - who owns your vendor's encryption keys",
    'RISK RATING - scoring partners by their PQC migration status',
  ],
  'vpn-ssh-pqc': [
    'TUNNEL SAFE - wrapping remote access in post-quantum armor',
    'KEY EXCHANGE - hybrid KEMs replacing classical Diffie-Hellman',
    'SHELL SHIELD - SSH sessions secured against quantum eavesdropping',
    'REMOTE LOCK - protecting every connection from harvest attacks',
  ],
  'ops-quantum-impact': [
    'OPS UPGRADE - patching infrastructure before quantum day',
    'PATCH PLAN - systematic rollout of PQC across the fleet',
    'MONITOR ALL - detecting classical crypto in production systems',
    'TEAM READY - training ops teams for the cryptographic transition',
  ],
}

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function generateImagen(moduleId, outputPath, token) {
  const url = `${BASE_URL}/publishers/google/models/${IMAGEN_MODEL}:predict`

  const prompt = `Visual Style: STRICTLY 2D minimalist flat vector illustration. Corporate cybersecurity aesthetic. Solid dark navy background. Monochromatic cyan glowing line-art with striking amber highlights. NO TEXT.\nLayout: A perfect 2x2 split-screen grid, divided by thin cyan lines, forming 4 distinct quadrants.\nTopic constraint: Base the 4 cyber icons strictly on the theme of "${moduleId}". Each quadrant should show a distinct icon (like quantum computers, glowing servers, shields, code, etc.) relating to this topic but friendly and approachable for a curious beginner.`

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      seed: FIXED_SEED,
      addWatermark: false,
      negativePrompt:
        'text, words, letters, typography, labels, watermarks, messy, photorealistic humans, blurry, 3d render, cartoon',
      outputOptions: { mimeType: 'image/png' },
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Imagen API error ${res.status}: ${JSON.stringify(data)}`)

  const base64Image =
    data.predictions?.[0]?.bytesBase64 || data.predictions?.[0]?.bytesBase64Encoded
  if (!base64Image) throw new Error(`No image returned: ${JSON.stringify(data).slice(0, 200)}`)

  fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'))
  log(`Saved Image: ${outputPath}`)
}

async function rewriteText(content, token) {
  const url = `${BASE_URL}/publishers/google/models/${GEMINI_MODEL}:generateContent`
  const prompt = `Rewrite the following summary to be completely free of technical jargon, aimed at a 'curious' but non-technical beginner persona. Make it easy to read, engaging, and extremely simple to understand. DO NOT include any markdown headers like '# Summary' in your final output, just return the paragraphs directly, keeping the same core layout/meaning but simplified.\n\nOriginal:\n${content}`

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7 },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(data)}`)

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!resultText)
    throw new Error(`No text returned by Gemini: ${JSON.stringify(data).slice(0, 200)}`)
  return resultText.trim()
}

async function main() {
  const token = process.env.GCLOUD_TOKEN
  if (!token) throw new Error('GCLOUD_TOKEN environment variable is missing.')

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const searchPattern = path.join(
    PROJECT_ROOT,
    'src',
    'components',
    'PKILearning',
    'modules',
    '**',
    'curious-summary.md'
  )
  const files = globSync(searchPattern)

  log(`Found ${files.length} modules. Process all modules...`)

  for (const file of files) {
    const parts = file.split(path.sep)
    const dirName = parts[parts.findIndex((p) => p === 'modules') + 1]
    const moduleId = DIR_TO_MODULE_ID[dirName] ?? dirName.toLowerCase()

    log(`---------- Processing: ${dirName} → ${moduleId} ----------`)

    // TEXT REWRITE
    const content = fs.readFileSync(file, 'utf8')
    const textOutputPath = path.join(path.dirname(file), 'curious-summary-curious.md')
    if (!fs.existsSync(textOutputPath)) {
      try {
        log(`Rewriting text for ${moduleId}...`)
        const newText = await rewriteText(content, token)
        fs.writeFileSync(textOutputPath, newText)
        log(`Saved Text: ${textOutputPath}`)
      } catch (err) {
        log(`Failed text generation for ${moduleId}: ${err.message}`)
      }
    } else {
      log(`Text ${textOutputPath} already exists. Skipping...`)
    }

    // IMAGE REWRITE
    const imageOutputPath = path.join(OUTPUT_DIR, `gcp_${moduleId}-curious.png`)
    if (!fs.existsSync(imageOutputPath)) {
      try {
        log(`Generating image for ${moduleId}...`)
        await generateImagen(moduleId, imageOutputPath, token)
      } catch (err) {
        log(`Failed image generation for ${moduleId}: ${err.message}`)
      }
    } else {
      log(`Image ${imageOutputPath} already exists. Skipping...`)
    }

    log('Waiting 5 seconds before next call to respect quotas...')
    await new Promise((r) => setTimeout(r, 5000))
  }
  log('🎉 All generations complete!')
}

main().catch(console.error)
