#!/usr/bin/env node
/**
 * PQC Today — Curious Persona Visual Generator (Vertex AI / Imagen 3)
 *
 * Generates 4-quadrant infographics for the "curious" (non-specialist) persona.
 * Same layout and 3D aesthetic as the standard GCP visuals, but with jargon-free
 * titles and subtitles aimed at non-technical beginners.
 *
 * Usage:
 *   export GCLOUD_TOKEN="$(gcloud auth print-access-token)"
 *   node scripts/generate-curious-visuals.mjs                # generate all missing
 *   node scripts/generate-curious-visuals.mjs --only tls-basics  # one module
 *   node scripts/generate-curious-visuals.mjs --force            # overwrite existing
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const PROJECT_ID = 'gen-lang-client-0481467456'
const REGION = 'us-central1'
const BASE_URL = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}`
const IMAGEN_MODEL = 'imagen-3.0-generate-001'
const FIXED_SEED = 133742
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'infographics')

/**
 * Jargon-free quadrant titles for each module's curious infographic.
 * Format: "TITLE - subtitle" — no technical terms, aimed at non-specialists.
 */
const MODULE_QUADRANTS = {
  'pqc-101': [
    'SECRET CODES - how computers hide your private messages',
    'SUPER COMPUTERS - new machines that can break old locks',
    'NEW LOCKS - stronger codes designed for the future',
    'SAFE TOMORROW - keeping your data protected for decades',
  ],
  'quantum-threats': [
    'HARVEST TODAY - stealing locked data right now',
    'UNLOCK LATER - opening the vault with a future super computer',
    "BREAKING CODES - cracking today's locks in seconds",
    'TICKING CLOCK - the countdown to broken security',
  ],
  'hybrid-crypto': [
    'DOUBLE LOCK - using two different locks on the same door',
    'SAFETY NET - if one lock breaks the other still holds',
    'SMOOTH SWITCH - changing locks without shutting the door',
    'BEST OF BOTH - combining old reliability with new strength',
  ],
  'crypto-agility': [
    'SWAP READY - changing your locks quickly when needed',
    'PLUG AND PLAY - new security that drops right in',
    'NO DOWNTIME - upgrading without stopping the system',
    'FUTURE FLEX - staying ready for whatever comes next',
  ],
  'tls-basics': [
    'HELLO HANDSHAKE - two computers agreeing to talk safely',
    'SECRET SWAP - sharing a private key no one else can see',
    'SAFE TUNNEL - wrapping every message in invisible armor',
    'TRUST CHECK - making sure you are talking to the right person',
  ],
  'vpn-ssh-pqc': [
    'PRIVATE TUNNEL - a hidden path for your internet traffic',
    'REMOTE SAFE - connecting to work from anywhere securely',
    'SESSION GUARD - keeping hackers out of your connection',
    'FUTURE TUNNEL - tunnels that even super computers cannot crack',
  ],
  'email-signing': [
    'SEALED LETTER - proving nobody tampered with your email',
    'VERIFIED SENDER - confirming who really sent the message',
    'TAMPER PROOF - a digital wax seal that cannot be faked',
    'FUTURE MAIL - email signatures safe from future threats',
  ],
  'pki-workshop': [
    'DIGITAL PASSPORT - a certificate that proves who you are online',
    'TRUST CHAIN - a ladder of approval from top to bottom',
    'CERTIFICATE CHECK - verifying every digital ID is genuine',
    'NEW SIGNATURES - future-proof stamps of authenticity',
  ],
  'kms-pqc': [
    'KEY VAULT - a secure safe for all your digital keys',
    'AUTO ROTATE - changing keys automatically on schedule',
    'ACCESS RULES - controlling who can use which keys',
    'QUANTUM VAULT - key storage safe from future computers',
  ],
  'hsm-pqc': [
    'HARDWARE SAFE - a physical box that guards your keys',
    'TAMPER ALERT - the box destroys keys if someone breaks in',
    'SPEED LOCK - fast security operations inside the box',
    'FUTURE BOX - hardware upgraded for next-generation threats',
  ],
  'data-asset-sensitivity': [
    'DATA RANKING - sorting your information by how secret it is',
    'HIGH VALUE - identifying the data worth protecting most',
    'RISK LEVELS - knowing which files need the strongest locks',
    'PROTECT FIRST - upgrading security where it matters most',
  ],
  'stateful-signatures': [
    'ONE TIME USE - each signature can only be used once',
    'TRUST TREE - a branching root structure that anchors trust',
    'COUNTING UP - keeping track so no signature repeats',
    'NO COPIES - stamps that cannot be duplicated or reused',
  ],
  'digital-assets': [
    'DIGITAL MONEY - protecting cryptocurrency and tokens',
    'WALLET GUARD - keeping your digital wallet safe',
    'SIGNED DEALS - transactions nobody can forge',
    'FUTURE COINS - digital assets safe from super computers',
  ],
  '5g-security': [
    'MOBILE NETWORKS - protecting the airwaves you use every day',
    'NETWORK TRUST - making sure connections are genuine',
    'TRAFFIC GUARD - stopping eavesdroppers on wireless signals',
    'FUTURE WIRELESS - mobile networks ready for tomorrow',
  ],
  'digital-id': [
    'ONLINE IDENTITY - proving who you are on the internet',
    'ID CHECK - verifying digital documents are real',
    'PRIVACY FIRST - sharing only what is needed',
    'LASTING ID - identities that stay secure for a lifetime',
  ],
  'entropy-randomness': [
    'TRUE RANDOM - generating numbers nobody can predict',
    'DICE ROLL - why good randomness makes good security',
    'WEAK RANDOM - what happens when randomness fails',
    'QUANTUM DICE - using physics for perfect unpredictability',
  ],
  'merkle-tree-certs': [
    'TREE STRUCTURE - organizing trust like branches on a tree',
    'PROOF PATH - following the branches to verify the root',
    'BATCH CHECK - verifying many items with one calculation',
    'COMPACT PROOF - small evidence that proves big things',
  ],
  qkd: [
    'LIGHT KEYS - sending secret keys using beams of light',
    'SPY DETECTOR - knowing instantly if someone is listening',
    'PHYSICS LOCK - security guaranteed by the laws of nature',
    'UNBREAKABLE LINK - a connection no computer can crack',
  ],
  'vendor-risk': [
    'SUPPLIER CHECK - making sure your partners are secure',
    'CHAIN REVIEW - tracing security through every supplier',
    'OUTSIDE RISK - understanding threats from third parties',
    'PARTNER SCORE - rating suppliers by how ready they are',
  ],
  'compliance-strategy': [
    'RULE BOOK - understanding what regulations require',
    'DEADLINE MAP - knowing when new rules take effect',
    'GLOBAL RULES - navigating requirements across countries',
    'STAY COMPLIANT - a plan to meet every deadline',
  ],
  'migration-program': [
    'ROAD MAP - planning the journey to stronger security',
    'STEP BY STEP - breaking the upgrade into manageable phases',
    'TEAM EFFORT - coordinating across the whole organization',
    'FINISH LINE - completing the transition on schedule',
  ],
  'pqc-risk-management': [
    'RISK RADAR - scanning for hidden security weaknesses',
    'SCORE CARD - rating each system by how exposed it is',
    'ACTION PLAN - deciding which systems to upgrade first',
    'SAFE ZONE - reducing risk until the danger is gone',
  ],
  'pqc-testing-validation': [
    'TEST DRIVE - trying new security before going live',
    'SPEED CHECK - measuring how fast the new protection runs',
    'TEAM PLAY - making sure old and new systems work together',
    'APPROVAL STAMP - earning the official seal of safety',
  ],
  'pqc-business-case': [
    'COST OF RISK - what happens if you do not upgrade',
    'BUDGET PLAN - how much the transition really costs',
    'PAYOFF - the long-term savings of acting early',
    'BOARD READY - presenting the case to decision makers',
  ],
  'pqc-governance': [
    'SECURITY RULES - setting policies for the whole organization',
    'RULE CHAOS - what happens without clear guidelines',
    'AUDIT TRAIL - checking that everyone follows the rules',
    'OVERSIGHT - continuous monitoring and course correction',
  ],
  'code-signing': [
    'STAMP OF TRUST - proving software has not been tampered with',
    'VERIFIED CODE - confirming who really wrote the program',
    'FAKE ALERT - detecting software with forged signatures',
    'LASTING STAMP - code signatures safe from future threats',
  ],
  'api-security-jwt': [
    'DIGITAL PASS - a token that proves your app has permission',
    'FAKE PASS - when attackers forge their way through',
    'STRONGER STAMP - signatures that cannot be counterfeited',
    'APP SHIELD - protecting every app connection from threats',
  ],
  'iot-ot-pqc': [
    'SMART THINGS - tiny devices connected to the internet',
    'WEAK LINKS - why small devices are easy targets',
    'TINY LOCKS - fitting strong security into small gadgets',
    'SAFE MACHINES - protecting factories and equipment',
  ],
  'confidential-computing': [
    'SEALED ROOM - processing data inside a locked chamber',
    'HIDDEN WORK - computing without ever exposing the data',
    'TRUST BUBBLE - a safe space inside the processor',
    'FUTURE CHAMBER - sealed computing ready for new threats',
  ],
  'web-gateway-pqc': [
    'FRONT DOOR - the gateway that inspects all web traffic',
    'TRAFFIC SCAN - checking every packet for hidden threats',
    'SPEED BUMP - balancing security checks with performance',
    'FUTURE GATE - web gateways ready for stronger defenses',
  ],
  'emv-payment-pqc': [
    'TAP TO PAY - how your card talks to the terminal',
    'PAYMENT GUARD - protecting your money during transactions',
    'CHIP SHIELD - the tiny chip that keeps your card safe',
    'FUTURE PAY - payment systems ready for tomorrow',
  ],
  'crypto-dev-apis': [
    'CODE TOOLS - the building blocks developers use for security',
    'RIGHT CHOICE - picking the best tool for the job',
    'EASY SWITCH - changing security libraries without rewriting',
    'FUTURE CODE - developer tools ready for new standards',
  ],
  'platform-eng-pqc': [
    'BUILD PLATFORM - the foundation everything runs on',
    'AUTO SECURE - baking security into every deployment',
    'UPGRADE BASE - strengthening the platform underneath',
    'FUTURE READY - infrastructure prepared for new threats',
  ],
  'energy-utilities-pqc': [
    'POWER GRID - protecting the systems that keep the lights on',
    'CONTROL ROOM - securing the computers that run utilities',
    'LONG LIFE - equipment that must stay secure for decades',
    'GRID SHIELD - energy infrastructure ready for the future',
  ],
  'healthcare-pqc': [
    'PATIENT DATA - protecting the most sensitive health records',
    'HOSPITAL NETWORK - securing connected medical devices',
    'PRIVACY RULES - meeting strict health data regulations',
    'HEALTHY FUTURE - healthcare systems safe for decades',
  ],
  'aerospace-pqc': [
    'SKY SIGNALS - protecting communications in flight',
    'SATELLITE LINK - securing connections far from Earth',
    'MISSION DATA - keeping classified information safe',
    'SPACE READY - aerospace systems prepared for the future',
  ],
  'automotive-pqc': [
    'CONNECTED CARS - vehicles that talk to the internet',
    'ROAD SIGNALS - securing car-to-car communication',
    'UPDATE SAFE - protecting over-the-air software updates',
    'DRIVE FUTURE - cars secured for decades on the road',
  ],
  'exec-quantum-impact': [
    'BOARD BRIEF - what leaders need to know about quantum risk',
    'BUSINESS RISK - how quantum threats affect the bottom line',
    'DECISION TIME - when to start investing in new security',
    'LEAD THE WAY - guiding your organization through the change',
  ],
  'dev-quantum-impact': [
    'CODE CHANGE - what developers need to update in their apps',
    'NEW LIBRARIES - switching to future-proof security tools',
    'TEST FIRST - verifying new code works before shipping',
    'BUILD SECURE - writing software ready for tomorrow',
  ],
  'arch-quantum-impact': [
    'FULL VIEW - seeing your entire system layout from above',
    'WEAK SPOTS - finding outdated security in your design',
    'UPGRADE PATH - the safest route to modernize the system',
    'BUILD LASTING - designing systems that stay secure for decades',
  ],
  'ops-quantum-impact': [
    'SYSTEM UPDATE - upgrading your live infrastructure safely',
    'ROLL OUT - deploying changes step by step across the fleet',
    'WATCH CLOSE - monitoring systems during the transition',
    'TEAM READY - preparing your operations team for the switch',
  ],
  'research-quantum-impact': [
    'LAB TO RULES - how research discoveries become regulations',
    'PROTECT FINDINGS - keeping research data safe from spying',
    'LONG GUARD - protecting data that must stay secret for decades',
    'BUILD AHEAD - preparing today for a safer tomorrow',
  ],
  'standards-bodies': [
    'RULE MAKERS - the organizations setting new safety standards',
    'CERTIFIED SAFE - earning the official stamp of approval',
    'GLOBAL EFFORT - countries working together on new rules',
    'TRUST SEAL - proof that your security meets the standard',
  ],
  'ai-security-pqc': [
    'SMART SHIELD - protecting AI systems from new threats',
    'MODEL GUARD - keeping machine learning models safe',
    'DATA FEED - securing the information AI learns from',
    'FUTURE AI - artificial intelligence ready for quantum age',
  ],
  'secrets-management-pqc': [
    'PASSWORD VAULT - a digital safe for all your secrets',
    'AUTO CHANGE - rotating passwords before anyone can steal them',
    'NEED TO KNOW - sharing secrets only with the right people',
    'SAFE SECRETS - a vault that future computers cannot open',
  ],
  'network-security-pqc': [
    'NETWORK WALLS - barriers that protect your digital highway',
    'TRAFFIC WATCH - inspecting data flowing through the network',
    'HIDDEN PATHS - stopping attackers from sneaking through',
    'FUTURE WALLS - network defenses ready for new threats',
  ],
  'database-encryption-pqc': [
    'DATA LOCK - scrambling stored information so nobody can read it',
    'KEY CONTROL - managing who can unlock the database',
    'ALWAYS LOCKED - keeping data encrypted even while in use',
    'FUTURE LOCK - database protection that lasts for decades',
  ],
  'iam-pqc': [
    'WHO ARE YOU - verifying every person and device',
    'ACCESS PASS - granting the right permissions to the right people',
    'FAKE ID STOP - blocking imposters from getting in',
    'FUTURE ID - identity systems that stay secure for years',
  ],
  'secure-boot-pqc': [
    'FIRST STEP - protecting the very first thing a computer does',
    'CODE CHECK - making sure software has not been tampered with',
    'TRUST ANCHOR - the foundation that everything else depends on',
    'SAFE START - startup protection ready for future threats',
  ],
  'os-pqc': [
    'SYSTEM CORE - the operating system that runs everything',
    'UPDATE SAFE - installing patches without breaking security',
    'DRIVER TRUST - making sure hardware talks to software safely',
    'FUTURE CORE - operating systems ready for stronger protection',
  ],
}

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function generateImagen(moduleId, outputPath, token) {
  const url = `${BASE_URL}/publishers/google/models/${IMAGEN_MODEL}:predict`

  const quadrants = MODULE_QUADRANTS[moduleId]
  if (!quadrants) {
    throw new Error(`No MODULE_QUADRANTS entry for "${moduleId}". Add one before generating.`)
  }

  const q = quadrants.map((s) => {
    const idx = s.indexOf(' - ')
    return [s.slice(0, idx), s.slice(idx + 3)]
  })

  const prompt = `Create a 4-quadrant infographic matching the EXACT typography size, cyan/amber glowing 3D vector aesthetic, and dark navy background of a cybersecurity infographic.
CRITICAL RULE: NEVER print my visual instructions on the image.

Quadrant 1 Large Title: '${q[0][0]}'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it: '${q[0][1]}'.
Quadrant 2 Large Title: '${q[1][0]}'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it: '${q[1][1]}'.
Quadrant 3 Large Title: '${q[2][0]}'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it: '${q[2][1]}'.
Quadrant 4 Large Title: '${q[3][0]}'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it: '${q[3][1]}'.`

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      seed: FIXED_SEED,
      addWatermark: false,
      negativePrompt: 'messy, photorealistic humans, blurry, 3d render, cartoon',
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
  log(`Saved: ${outputPath}`)
}

async function main() {
  const token = process.env.GCLOUD_TOKEN
  if (!token) {
    throw new Error(
      'GCLOUD_TOKEN environment variable is missing. Run: export GCLOUD_TOKEN="$(gcloud auth print-access-token)"'
    )
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const force = process.argv.includes('--force')
  const onlyIdx = process.argv.indexOf('--only')
  const onlyId = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : null

  const moduleIds = onlyId ? [onlyId] : Object.keys(MODULE_QUADRANTS)

  log(`Generating curious visuals for ${moduleIds.length} modules (force=${force})...`)

  let generated = 0
  let skipped = 0

  for (const moduleId of moduleIds) {
    const outputPath = path.join(OUTPUT_DIR, `gcp_${moduleId}-curious.png`)

    if (!force && fs.existsSync(outputPath)) {
      log(`[skip] ${outputPath} already exists`)
      skipped++
      continue
    }

    try {
      log(`Generating: ${moduleId}...`)
      await generateImagen(moduleId, outputPath, token)
      generated++
    } catch (err) {
      log(`FAILED ${moduleId}: ${err.message}`)
    }

    log('Waiting 5 seconds to respect API quotas...')
    await new Promise((r) => setTimeout(r, 5000))
  }

  log(`Done! Generated: ${generated}, Skipped: ${skipped}`)
}

main().catch(console.error)
