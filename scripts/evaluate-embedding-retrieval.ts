#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/** Evaluate the committed embedding index against the current-corpus gold set. */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pipeline, env } from '@huggingface/transformers'
import { CURRENT_CORPUS_GOLDEN_QUESTIONS } from '../src/services/chat/evaluation/currentCorpusGoldenQuestions'

interface EmbeddingMeta {
  model: string
  dimensions: number
  chunkCount: number
  byteOffsets: Record<string, number>
}

const root = process.cwd()
const meta = JSON.parse(
  readFileSync(path.join(root, 'public/data/embeddings-meta.json'), 'utf8')
) as EmbeddingMeta
const vectorsBuffer = readFileSync(path.join(root, 'public/data/embeddings.bin'))
const vectors = new Float32Array(
  vectorsBuffer.buffer,
  vectorsBuffer.byteOffset,
  vectorsBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT
)

env.allowRemoteModels = true
env.allowLocalModels = false
env.useBrowserCache = false

const encoder = await pipeline('feature-extraction', meta.model, { dtype: 'q8' })
let recall5Hits = 0
let recall15Hits = 0
let expected = 0

for (const question of CURRENT_CORPUS_GOLDEN_QUESTIONS) {
  const tensor = await encoder(question.query, { pooling: 'mean', normalize: true })
  const query = tensor.data as Float32Array
  const scores: Array<{ id: string; score: number }> = []

  for (const [id, byteOffset] of Object.entries(meta.byteOffsets)) {
    const start = byteOffset / Float32Array.BYTES_PER_ELEMENT
    let score = 0
    // Offsets and dimensions come from the signed build artifact; bracketed
    // access is the hot loop over packed Float32 vectors, not object injection.
    // eslint-disable-next-line security/detect-object-injection
    for (let i = 0; i < meta.dimensions; i++) score += query[i] * vectors[start + i]
    scores.push({ id, score })
  }
  scores.sort((a, b) => b.score - a.score)

  const top5 = scores.slice(0, 5)
  const top15 = scores.slice(0, 15)
  const misses: string[] = []
  for (const prefix of question.semanticMustInclude) {
    expected++
    if (top5.some((hit) => hit.id.startsWith(prefix))) recall5Hits++
    if (top15.some((hit) => hit.id.startsWith(prefix))) recall15Hits++
    else misses.push(prefix)
  }

  console.log(`\n${question.id}: ${question.query}`)
  console.log(top5.map((hit) => `${hit.score.toFixed(3)} ${hit.id}`).join('\n'))
  if (misses.length > 0) console.log(`missing@15: ${misses.join(', ')}`)
}

console.log('\nEmbedding retrieval summary')
console.log(
  `Recall@5:  ${recall5Hits}/${expected} (${((recall5Hits / expected) * 100).toFixed(1)}%)`
)
console.log(
  `Recall@15: ${recall15Hits}/${expected} (${((recall15Hits / expected) * 100).toFixed(1)}%)`
)
