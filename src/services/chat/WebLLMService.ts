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
  /** Model's native maximum context window (tokens). Upper bound for the slider. */
  maxContextLength: number
  /** Approximate GPU VRAM needed (MB). From web-llm registry. */
  vramMB: number
  /** 1-5 speed rating (higher = faster). Relative to other models in catalog. */
  speed: 1 | 2 | 3 | 4 | 5
  /** 1-5 accuracy rating (higher = more accurate). Relative to other models in catalog. */
  accuracy: 1 | 2 | 3 | 4 | 5
  /** Short tip shown below the model selector. */
  tip: string
}

/* ------------------------------------------------------------------ */
/*  Model catalog                                                      */
/* ------------------------------------------------------------------ */

/** Minimum context window (tokens) users can select via the slider. */
export const MIN_CONTEXT_WINDOW = 2_048

/** Default context window for new users (tokens). Matches web-llm's own default. */
export const DEFAULT_CONTEXT_WINDOW = 4_096

export const WEBLLM_MODELS: WebLLMModel[] = [
  {
    id: 'Qwen3-1.7B-q4f16_1-MLC',
    label: 'Qwen 3 1.7B (1.0 GB) — Recommended',
    sizeGB: 1.0,
    maxContextLength: 8_192,
    vramMB: 2037,
    speed: 4,
    accuracy: 3,
    tip: 'Best balance of speed and quality. Works on most GPUs.',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B (1.5 GB) — Strong instruction following',
    sizeGB: 1.5,
    maxContextLength: 8_192,
    vramMB: 2264,
    speed: 3,
    accuracy: 4,
    tip: 'Best at following complex instructions — links, formatting, lists.',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    label: 'Phi 3.5 Mini (2.1 GB) — Largest context window',
    sizeGB: 2.1,
    maxContextLength: 16_384,
    vramMB: 3672,
    speed: 2,
    accuracy: 4,
    tip: 'Up to 16K context — feeds the model 4x more reference data.',
  },
  {
    id: 'Qwen3-4B-q4f16_1-MLC',
    label: 'Qwen 3 4B (2.3 GB) — Best quality',
    sizeGB: 2.3,
    maxContextLength: 8_192,
    vramMB: 3432,
    speed: 2,
    accuracy: 5,
    tip: 'Highest accuracy. Needs a dedicated or Apple Silicon GPU.',
  },
  {
    id: 'Qwen3-0.6B-q4f16_1-MLC',
    label: 'Qwen 3 0.6B (0.4 GB) — Fastest',
    sizeGB: 0.4,
    maxContextLength: 4_096,
    vramMB: 604,
    speed: 5,
    accuracy: 1,
    tip: 'Ultra-fast responses but lower accuracy. Good for quick lookups.',
  },
]

export const DEFAULT_LOCAL_MODEL = 'Qwen3-1.7B-q4f16_1-MLC'

/* ------------------------------------------------------------------ */
/*  Engine singleton                                                   */
/* ------------------------------------------------------------------ */

// Lazy-loaded — the @mlc-ai/web-llm module is only imported when
// initializeEngine is called, keeping it out of the initial bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engine: any = null
let loadedModelId: string | null = null
let isInitializing = false
let activeInitPromise: Promise<void> | null = null

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
 * Downloads model weights on first call (size varies by model);
 * subsequent calls use the browser Cache API.
 */
export async function initializeEngine(
  modelId: string,
  onProgress: (progress: WebLLMProgress) => void,
  contextWindowSize: number = DEFAULT_CONTEXT_WINDOW
): Promise<void> {
  // Prevent concurrent initialization (React re-renders can fire useEffect multiple times).
  // Return the existing promise so callers await the same operation instead of
  // silently returning undefined and treating the engine as ready.
  if (isInitializing && activeInitPromise) return activeInitPromise

  // Clamp context window to the model's maximum (defense against stale localStorage values)
  const modelMax =
    WEBLLM_MODELS.find((m) => m.id === modelId)?.maxContextLength ?? DEFAULT_CONTEXT_WINDOW
  const clampedContextWindow = Math.min(Math.max(contextWindowSize, MIN_CONTEXT_WINDOW), modelMax)

  // If already loaded with the same model, nothing to do
  if (engine && loadedModelId === modelId) return

  // If loaded with a different model, unload first
  if (engine && loadedModelId !== modelId) {
    await unloadEngine()
  }

  isInitializing = true

  const doInit = async () => {
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

    // Pre-flight: verify we can reach HuggingFace before attempting a multi-GB download
    onProgress({
      status: 'downloading',
      text: 'Checking connectivity to HuggingFace...',
      progress: 0,
    })
    try {
      const testUrl = `https://huggingface.co/mlc-ai/${modelId}/resolve/main/mlc-chat-config.json`
      const res = await fetch(testUrl, { method: 'HEAD', mode: 'cors' })
      if (!res.ok) {
        console.error('[WebLLM] Pre-flight check failed:', res.status, res.statusText, testUrl)
        throw new Error(
          `Cannot reach model files on huggingface.co (HTTP ${res.status}). ` +
            'Check your network connection, ad blocker, and firewall settings.'
        )
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('Cannot reach')) throw err
      console.error('[WebLLM] Pre-flight connectivity check failed:', err)
      throw new Error(
        'Cannot connect to huggingface.co to download the model. ' +
          'This is usually caused by an ad blocker, browser extension, firewall, or VPN blocking requests to huggingface.co. ' +
          'Try: (1) disable ad blockers for this site, (2) check your firewall/VPN settings, ' +
          '(3) try opening https://huggingface.co directly in your browser to verify access.'
      )
    }

    onProgress({ status: 'downloading', text: 'Loading model...', progress: 0 })

    // Dynamic import to keep @mlc-ai/web-llm out of the initial bundle (~100KB)
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

    try {
      engine = await CreateMLCEngine(
        modelId,
        {
          initProgressCallback: (report: { progress: number; text: string }) => {
            onProgress({
              status: 'downloading',
              text: report.text,
              progress: report.progress,
            })
          },
          logLevel: 'WARN',
        },
        {
          // Override web-llm's default 4096 context window with user-selected size
          context_window_size: clampedContextWindow,
        }
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined

      // Log full error details to console for debugging
      console.error('[WebLLM] Failed to initialize engine:', {
        modelId,
        error: msg,
        stack,
        cause: err instanceof Error ? err.cause : undefined,
      })

      // Provide actionable diagnostics for common failure modes
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        throw new Error(
          `Network error downloading model "${modelId}" from huggingface.co. ` +
            'Possible causes: (1) an ad blocker or browser extension is blocking requests to huggingface.co, ' +
            '(2) your firewall or VPN is restricting access, ' +
            '(3) the browser storage/cache is full (try clearing site data), ' +
            '(4) unstable network connection. Check the browser console (F12) for details.'
        )
      }
      if (msg.includes('out of memory') || msg.includes('OOM') || msg.includes('GPUBuffer')) {
        throw new Error(
          `Not enough GPU memory to load "${modelId}" (requires ~${
            WEBLLM_MODELS.find((m) => m.id === modelId)?.sizeGB ?? '?'
          } GB VRAM). ` + 'Try closing other GPU-intensive tabs or selecting a smaller model.'
        )
      }
      if (msg.includes('not found') || msg.includes('404')) {
        throw new Error(
          `Model "${modelId}" was not found in the model registry. ` +
            'This model may have been removed. Please select a different model.'
        )
      }
      // Pass through with full context
      throw new Error(`Failed to load model "${modelId}": ${msg}`)
    }

    loadedModelId = modelId
    onProgress({ status: 'ready', text: 'Model ready', progress: 1 })
  }

  activeInitPromise = doInit().finally(() => {
    isInitializing = false
    activeInitPromise = null
  })

  return activeInitPromise
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
  pageContext?: PageContext,
  contextWindowSize: number = DEFAULT_CONTEXT_WINDOW
): AsyncGenerator<string> {
  if (!engine) {
    throw new Error('Local model not loaded. Please wait for the model to finish downloading.')
  }

  // Clamp context window to safe bounds (matches initializeEngine clamping)
  const modelMax =
    WEBLLM_MODELS.find((m) => m.id === loadedModelId)?.maxContextLength ?? DEFAULT_CONTEXT_WINDOW
  const safeContextWindow = Math.min(Math.max(contextWindowSize, MIN_CONTEXT_WINDOW), modelMax)

  // Scale budgets based on user-selected context window (typically 4K–16K tokens).
  // Token-to-char ratio: ~4 chars per token.
  // Local system prompt is compact (~115 tokens / ~460 chars), so we can allocate
  // more to RAG context than cloud models. Budget breakdown:
  //   ~45% RAG context, ~5% system prompt, ~10% conversation, ~20% response, ~20% headroom
  const totalChars = safeContextWindow * 4
  const ragCharBudget = Math.round(totalChars * 0.45)
  const maxHistoryMsgs = Math.min(6, Math.max(2, Math.floor(safeContextWindow / 2048)))
  const maxResponseTokens = Math.min(2048, Math.round(safeContextWindow * 0.2))
  const maxInventory = Math.min(20, Math.max(5, Math.floor(safeContextWindow / 512)))

  const systemPrompt = buildLocalSystemPrompt(
    contextChunks,
    pageContext,
    ragCharBudget,
    maxInventory
  )

  // Convert ChatMessage[] to OpenAI-compatible format.
  const history = messages.slice(-maxHistoryMsgs).map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }))
  // Inject /no_think into the last user message for Qwen 3 models only.
  // This directive disables Qwen's internal thinking mode; other model families ignore it.
  const isQwen = loadedModelId?.startsWith('Qwen') ?? false
  if (isQwen && history.length > 0 && history[history.length - 1].role === 'user') {
    history[history.length - 1] = {
      ...history[history.length - 1],
      content: '/no_think\n' + history[history.length - 1].content,
    }
  }
  const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history,
  ]

  const stream = await engine.chat.completions.create({
    messages: formattedMessages,
    temperature: 0.2,
    max_tokens: maxResponseTokens,
    top_p: 0.85,
    frequency_penalty: 0.4,
    stream: true,
    stream_options: { include_usage: true },
  })

  // Strip <think>...</think> blocks from Qwen 3 output.
  // Approach: accumulate full text, regex-strip after each chunk, yield only new clean content.
  // This handles all edge cases (split tags, nested whitespace, unclosed blocks).
  // Optimization: skip regex when no <think> tag has been seen (common with /no_think).
  let accumulated = ''
  let yieldedLength = 0
  let seenThink = false

  for await (const chunk of stream) {
    if (signal?.aborted) {
      try {
        await engine.interruptGenerate()
      } catch {
        // Best effort interrupt
      }
      return
    }

    const delta = chunk.choices?.[0]?.delta?.content
    if (!delta) {
      const finishReason = chunk.choices?.[0]?.finish_reason
      if (finishReason === 'length') {
        yield '\n\n*(Response truncated — try asking a more specific question.)*'
      }
      continue
    }

    accumulated += delta

    // Track whether we've ever seen a <think> tag to skip regex on clean streams
    if (!seenThink && accumulated.includes('<think>')) seenThink = true

    // Strip all closed <think>...</think> blocks, then truncate at any unclosed <think>
    let cleaned = seenThink ? accumulated.replace(/<think>[\s\S]*?<\/think>/g, '') : accumulated
    if (seenThink) {
      const unclosedIdx = cleaned.indexOf('<think>')
      if (unclosedIdx !== -1) cleaned = cleaned.slice(0, unclosedIdx)
    }

    // Yield only the new portion since last yield
    if (cleaned.length > yieldedLength) {
      yield cleaned.slice(yieldedLength)
      yieldedLength = cleaned.length
    }
  }

  // Final flush: strip any trailing unclosed <think> block
  const final = seenThink
    ? accumulated.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '')
    : accumulated
  if (final.length > yieldedLength) {
    yield final.slice(yieldedLength)
  }
}
