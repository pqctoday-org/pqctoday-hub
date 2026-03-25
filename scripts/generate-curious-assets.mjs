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
const GEMINI_MODEL = 'gemini-1.5-pro-002'
const FIXED_SEED = 133742
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'infographics')
const NEGATIVE_PROMPT =
  'text, words, letters, typography, labels, watermarks, messy, photorealistic humans, blurry, 3d render, cartoon'

function log(msg) {
  const ts = new Date().toISOString().substring(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function generateImagen(prompt, outputPath, token) {
  const url = `${BASE_URL}/publishers/google/models/${IMAGEN_MODEL}:predict`
  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      seed: FIXED_SEED,
      addWatermark: false,
      negativePrompt: NEGATIVE_PROMPT,
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
    const moduleId = parts[parts.findIndex((p) => p === 'modules') + 1]

    log(`---------- Processing: ${moduleId} ----------`)

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
    const imageOutputPath = path.join(OUTPUT_DIR, `gcp_${moduleId.toLowerCase()}-curious.png`)
    if (!fs.existsSync(imageOutputPath)) {
      const prompt = `Visual Style: STRICTLY 2D minimalist flat vector illustration. Corporate cybersecurity aesthetic. Solid dark navy background. Monochromatic cyan glowing line-art with striking amber highlights. NO TEXT.\nLayout: A perfect 2x2 split-screen grid, divided by thin cyan lines, forming 4 distinct quadrants.\nTopic constraint: Base the 4 cyber icons strictly on the theme of "${moduleId}". Each quadrant should show a distinct icon (like quantum computers, glowing servers, shields, code, etc.) relating to this topic but friendly and approachable for a curious beginner.`
      try {
        log(`Generating image for ${moduleId}...`)
        await generateImagen(prompt, imageOutputPath, token)
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
