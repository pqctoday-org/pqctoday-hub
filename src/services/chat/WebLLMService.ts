// SPDX-License-Identifier: GPL-3.0-only
import type { ChatMessage, RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'
import { buildLocalSystemPrompt } from './promptBuilder'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WebLLMStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error' | 'unsupported'

export interface WebLLMProgress {
  status: WebLLMStatus
  text: string
  progress: number // 0-1
}

export interface WebLLMModel {
  id: string
  label: string
  sizeGB: number
  contextLength: number
}

/* ------------------------------------------------------------------ */
/*  Model catalog                                                      */
/* ------------------------------------------------------------------ */

export const WEBLLM_MODELS: WebLLMModel[] = [
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    label: 'Phi-3.5 Mini (2.2 GB)',
    sizeGB: 2.2,
    contextLength: 128_000,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 1.5B (1.0 GB)',
    sizeGB: 1.0,
    contextLength: 32_000,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B (0.7 GB)',
    sizeGB: 0.7,
    contextLength: 8_000,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    label: 'SmolLM2 1.7B (1.0 GB)',
    sizeGB: 1.0,
    contextLength: 8_000,
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 3B (1.8 GB)',
    sizeGB: 1.8,
    contextLength: 32_000,
  },
]

export const DEFAULT_LOCAL_MODEL = 'Phi-3.5-mini-instruct-q4f16_1-MLC'

/* ------------------------------------------------------------------ */
/*  Engine singleton                                                   */
/* ------------------------------------------------------------------ */

// Lazy-loaded — the @mlc-ai/web-llm module is only imported when
// initializeEngine is called, keeping it out of the initial bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engine: any = null
let loadedModelId: string | null = null

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Check whether the browser supports WebGPU (required for local inference).
 * On macOS this maps to Metal; on Windows/Linux to Vulkan/D3D12.
 */
export async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = await (navigator as any).gpu?.requestAdapter()
    return adapter !== null && adapter !== undefined
  } catch {
    return false
  }
}

/**
 * Load the WebLLM engine with the specified model.
 * Downloads model weights on first call (~2 GB for Phi-3.5 Mini);
 * subsequent calls use the browser Cache API.
 */
export async function initializeEngine(
  modelId: string,
  onProgress: (progress: WebLLMProgress) => void
): Promise<void> {
  // If already loaded with the same model, nothing to do
  if (engine && loadedModelId === modelId) return

  // If loaded with a different model, unload first
  if (engine && loadedModelId !== modelId) {
    await unloadEngine()
  }

  onProgress({ status: 'checking', text: 'Checking WebGPU support...', progress: 0 })

  const supported = await checkWebGPUSupport()
  if (!supported) {
    onProgress({
      status: 'unsupported',
      text: 'WebGPU is not available in this browser.',
      progress: 0,
    })
    throw new Error(
      'WebGPU is not supported in this browser. Please use Chrome 113+, Edge 113+, or Safari 18+.'
    )
  }

  onProgress({ status: 'downloading', text: 'Loading model...', progress: 0 })

  // Dynamic import to keep @mlc-ai/web-llm out of the initial bundle (~100KB)
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report: { progress: number; text: string }) => {
      onProgress({
        status: 'downloading',
        text: report.text,
        progress: report.progress,
      })
    },
    logLevel: 'WARN',
  })

  loadedModelId = modelId
  onProgress({ status: 'ready', text: 'Model ready', progress: 1 })
}

/** Whether the engine is loaded and ready to generate. */
export function isEngineReady(): boolean {
  return engine !== null && loadedModelId !== null
}

/** Returns the currently loaded model ID, or null if none. */
export function getLoadedModel(): string | null {
  return loadedModelId
}

/** Unload the current model and free GPU resources. */
export async function unloadEngine(): Promise<void> {
  if (engine) {
    try {
      await engine.unload()
    } catch {
      // Ignore unload errors
    }
    engine = null
    loadedModelId = null
  }
}

/**
 * Stream a chat completion from the local WebLLM engine.
 * Uses the same RAG pipeline as GeminiService — same corpus, same retrieval,
 * but with a streamlined system prompt optimized for smaller models.
 */
export async function* streamResponse(
  messages: ChatMessage[],
  contextChunks: RAGChunk[],
  signal?: AbortSignal,
  pageContext?: PageContext
): AsyncGenerator<string> {
  if (!engine) {
    throw new Error('Local model not loaded. Please wait for the model to finish downloading.')
  }

  const systemPrompt = buildLocalSystemPrompt(contextChunks, pageContext)

  // Convert ChatMessage[] to OpenAI-compatible format
  const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10).map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ]

  const stream = await engine.chat.completions.create({
    messages: formattedMessages,
    temperature: 0.3,
    max_tokens: 4096,
    top_p: 0.9,
    stream: true,
    stream_options: { include_usage: true },
  })

  for await (const chunk of stream) {
    // Check abort between chunks
    if (signal?.aborted) {
      try {
        await engine.interruptGenerate()
      } catch {
        // Best effort interrupt
      }
      return
    }

    const delta = chunk.choices?.[0]?.delta?.content
    if (delta) yield delta

    // Handle finish reasons
    const finishReason = chunk.choices?.[0]?.finish_reason
    if (finishReason === 'length') {
      yield '\n\n*(Response truncated — try asking a more specific question.)*'
    }
  }
}
