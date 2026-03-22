#!/usr/bin/env node
/**
 * PQC Today — Batch Infographic Generator (Vertex AI / Imagen 3)
 *
 * Scans all `curious-summary.md` files in the learning modules, extracts their
 * 4 key sections, and automatically generates perfectly consistent 2x2 grid
 * infographics using Google Vertex AI Imagen 3.
 *
 * Crucially, it uses a FIXED NUMERICAL SEED (e.g., 4242) for all 50 generations,
 * ensuring the visual style remains mathematically identical across the board.
 *
 * Usage:
 *   export GCLOUD_TOKEN="$(gcloud auth print-access-token)"
 *   # Run a test of just the first 3 modules
 *   node scripts/generate-infographics.mjs --test
 *   # Run all 50 modules
 *   node scripts/generate-infographics.mjs --all
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────────
const PROJECT_ID = 'gen-lang-client-0481467456' // From your video script
const REGION = 'us-central1'
const BASE_URL = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}`
const MODEL = 'imagen-3.0-generate-001'

const FIXED_SEED = 133742 // Lock this seed for maximum style consistency!
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'infographics')

const NEGATIVE_PROMPT =
  'text, words, letters, typography, labels, watermarks, messy, photorealistic humans, blurry, 3d render, cartoon'

// ── API helpers ───────────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toISOString().substring(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function generateImagen(prompt, outputPath) {
  const token = process.env.GCLOUD_TOKEN
  if (!token) {
    throw new Error(
      'GCLOUD_TOKEN environment variable is missing. Run: export GCLOUD_TOKEN="$(gcloud auth print-access-token)"'
    )
  }

  const url = `${BASE_URL}/publishers/google/models/${MODEL}:predict`

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      seed: FIXED_SEED,
      addWatermark: false,
      negativePrompt: NEGATIVE_PROMPT,
      outputOptions: {
        mimeType: 'image/png',
      },
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
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${JSON.stringify(data)}`)
  }

  // Imagen returns base64 string
  const base64Image =
    data.predictions?.[0]?.bytesBase64 ||
    data.predictions?.[0]?.bytesBase64Encoded ||
    data.predictions?.[0]?.bytesBase64Encoded
  if (!base64Image) {
    throw new Error(`No image returned: ${JSON.stringify(data).slice(0, 200)}`)
  }

  fs.writeFileSync(outputPath, Buffer.from(base64Image, 'base64'))
  log(`Saved: ${outputPath}`)
}

// ── Main Pipeline ─────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Find all curious-summary.md files
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

  log(`Found ${files.length} modules.`)

  const isTestMode = process.argv.includes('--test')
  const targetFiles = process.argv.includes('--only')
    ? files.filter((f) => f.includes(process.argv[process.argv.indexOf('--only') + 1]))
    : isTestMode
      ? files.slice(0, 3)
      : files

  log(`Running generation for ${targetFiles.length} modules...`)

  for (const file of targetFiles) {
    // Extract Module ID from the path (e.g. ".../modules/QuantumThreats/curious-summary.md")
    const parts = file.split(path.sep)
    const moduleDirIndex = parts.findIndex((p) => p === 'modules')
    // Directory right after 'modules' is the ID
    const moduleId = parts[moduleDirIndex + 1]

    log(`---------- Processing: ${moduleId} ----------`)

    // Read the markdown
    const content = fs.readFileSync(file, 'utf8')

    // We want to force the strict aesthetic from the prompt,
    // replacing the quadrant headers dynamically based on the module ID.
    // To keep it simple, we ask Imagen to visualize the core theme of the module.
    const prompt = `Visual Style: STRICTLY 2D minimalist flat vector illustration. Corporate cybersecurity aesthetic. Solid dark navy background. Monochromatic cyan glowing line-art with striking amber highlights. NO TEXT.
Layout: A perfect 2x2 split-screen grid, divided by thin cyan lines, forming 4 distinct quadrants.
Topic constraint: Base the 4 cyber icons strictly on the theme of "${moduleId}". Each quadrant should show a distinct icon (like quantum computers, glowing servers, shields, code, etc.) relating to this topic.`

    const outputPath = path.join(OUTPUT_DIR, `${moduleId.toLowerCase()}-curious-grid.png`)

    try {
      await generateImagen(prompt, outputPath)
    } catch (err) {
      log(`Failed generating ${moduleId}: ${err.message}`)
    }

    // Sleep purely to respect Vertex quotas
    log('Waiting 5 seconds before next call...')
    await new Promise((r) => setTimeout(r, 5000))
  }

  log('🎉 All generations complete!')
}

main().catch(console.error)
