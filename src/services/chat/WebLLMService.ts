// SPDX-License-Identifier: GPL-3.0-only
import type { ChatMessage, RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'
import { buildLocalSystemPrompt } from './promptBuilder'
import { DEFAULT_LOCAL_MODEL, QWEN35_LOCAL_MODEL } from './modelConfig'
import { classifyIntent } from './RetrievalService'

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

// VRAM, context window, and quantization sizes mirror the MLC prebuilt registry
// at https://github.com/mlc-ai/web-llm/blob/main/src/config.ts. Every MLC build
// currently ships a 4K context window — the underlying model architectures may
// support more, but the compiled WebLLM artifacts do not. Do not raise
// maxContextLength above 4096 without confirming a registry change.
//
// Native MLX evaluation on the production RAG harness did not show a reliable
// grounding-quality advantage for Qwen 3.5 9B. Qwen 3 8B is therefore the
// default for the app's 8 GB discrete-GPU target; Qwen 3.5 remains available
// for user-controlled comparison. The grounding gate is authoritative for
// both: model quality never substitutes for evidence.
export const WEBLLM_MODELS: WebLLMModel[] = [
  {
    id: DEFAULT_LOCAL_MODEL,
    label: 'Qwen 3 8B (4.5 GB) — Recommended',
    sizeGB: 4.5,
    maxContextLength: 4_096,
    vramMB: 5696,
    speed: 2,
    accuracy: 5,
    tip: 'Best-tested default for the corpus-grounded assistant. Targets an 8 GB discrete GPU (about 5.7 GB free VRAM required) or 16 GB+ Apple Silicon.',
  },
  {
    id: QWEN35_LOCAL_MODEL,
    label: 'Qwen 3.5 9B (5.1 GB) — Alternative',
    sizeGB: 5.1,
    maxContextLength: 4_096,
    vramMB: 6433,
    speed: 1,
    accuracy: 5,
    tip: 'Available for comparison but uses about 740 MB more VRAM. The native harness did not establish a consistent grounding advantage over Qwen 3 8B.',
  },
]

export { DEFAULT_LOCAL_MODEL, QWEN35_LOCAL_MODEL, QWEN3_LOCAL_MODEL } from './modelConfig'

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
 * UI-only mobile-OS detection — deliberately NOT used to gate
 * initializeEngine() itself (checkWebGPUBufferCapability + the crash guard
 * below handle that with real per-device data, not a UA guess). This exists
 * only so ProviderSetup.tsx can tell phone/tablet users upfront that Local
 * AI isn't a realistic option, instead of letting them discover it by
 * hitting a failed load. Confirmed via github.com/mlc-ai/web-llm/issues/753:
 * even a 3B model (roughly half this catalog's VRAM need) reliably crashes
 * the tab on iOS 26 Safari after downloading, closed upstream as "not
 * planned" — this is a known, unresolved platform limitation, not something
 * specific to this app's implementation.
 */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isIOS =
    /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  return isIOS || isAndroid
}

export interface GPUBufferCapability {
  ok: boolean
  /** Bytes, as reported by this device's actual WebGPU adapter — not estimated. */
  maxStorageBufferBindingSize: number
  maxBufferSize: number
}

// @mlc-ai/web-llm's own engine init always requests 1GB for both
// maxBufferSize and maxStorageBufferBindingSize, falling back to the WebGPU
// spec's baseline minimums (256MB / 128MB) if the adapter can't grant 1GB,
// and throwing if even those aren't available (see detectGPUDevice() in
// @mlc-ai/web-llm/lib/index.js). Below this floor, engine init fails on
// EVERY device, not just mobile — so checking it ourselves first, before a
// multi-GB download starts, gives an honest per-device answer instead of a
// blanket "mobile is blocked" guess. This matters because it's genuinely
// device-dependent: cheap Android GPUs (ARM Mali/Qualcomm Adreno) often sit
// at this 128MB floor, but Apple's own GPUs (iPhone/iPad share the same
// Metal-backed WebKit implementation macOS uses) have been reported well
// above it — a UA sniff can't tell those apart, a real adapter query can.
const WEBLLM_MIN_STORAGE_BUFFER_BYTES = 128 * 1024 * 1024

/**
 * Query what this device's WebGPU adapter actually reports for the two
 * limits web-llm's engine requires. Does NOT rule out every failure mode —
 * Safari additionally enforces an unrelated, undocumented cap on a tab's
 * TOTAL memory (covers the download + decompression + GPU-resident weights
 * together) that isn't queryable in advance from a webpage. Passing this
 * check means the GPU itself can address the required buffer sizes; it does
 * not guarantee the full multi-GB load will fit in that ceiling too — see
 * the session-scoped crash guard in initializeEngine() for how a load that
 * dies mid-flight from THAT limit is handled without looping.
 */
export async function checkWebGPUBufferCapability(): Promise<GPUBufferCapability | null> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = await (navigator as any).gpu?.requestAdapter()
    if (!adapter) return null
    const maxStorageBufferBindingSize: number = adapter.limits.maxStorageBufferBindingSize
    const maxBufferSize: number = adapter.limits.maxBufferSize
    return {
      ok: maxStorageBufferBindingSize >= WEBLLM_MIN_STORAGE_BUFFER_BYTES,
      maxStorageBufferBindingSize,
      maxBufferSize,
    }
  } catch {
    return null
  }
}

/**
 * Session-scoped guard against the auto-restart loop: if a load starts and
 * this same tab session still shows it "in progress" on the NEXT call, the
 * page was reloaded before the previous attempt reached success or a clean
 * catch — i.e. the tab was killed mid-load (most plausibly Safari's
 * unqueryable total-memory ceiling, see checkWebGPUBufferCapability) rather
 * than navigated away from. sessionStorage specifically (not localStorage)
 * survives exactly this kind of same-tab reload/restore while still
 * resetting on a genuinely fresh tab, so a real crash is distinguishable
 * from a normal new visit.
 */
const CRASH_GUARD_KEY = 'webllm-load-in-progress'

function clearCrashGuard(): void {
  try {
    sessionStorage.removeItem(CRASH_GUARD_KEY)
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — guard is a
    // best-effort safety net, not a hard requirement.
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

  // See the crash-guard doc comment above: a stuck flag means the PREVIOUS
  // call for this model never reached success or a clean catch, i.e. this
  // tab was reloaded mid-load. Require an explicit retry rather than
  // silently repeating whatever killed it.
  let priorAttemptStuck = false
  try {
    priorAttemptStuck = sessionStorage.getItem(CRASH_GUARD_KEY) === modelId
    if (priorAttemptStuck) {
      sessionStorage.removeItem(CRASH_GUARD_KEY)
    } else {
      sessionStorage.setItem(CRASH_GUARD_KEY, modelId)
    }
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — proceed without the guard.
  }
  if (priorAttemptStuck) {
    onProgress({ status: 'error', text: 'Previous load did not finish.', progress: 0 })
    throw new Error(
      'The previous attempt to load this model did not finish — most likely the browser ran ' +
        'out of memory partway through and reloaded the page. Click Retry to try again, or ' +
        'switch to Cloud (Gemini).'
    )
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

    const capability = await checkWebGPUBufferCapability()
    if (capability && !capability.ok) {
      const reportedMB = Math.round(capability.maxStorageBufferBindingSize / (1024 * 1024))
      onProgress({
        status: 'unsupported',
        text: `This device's GPU only supports ${reportedMB}MB buffers (128MB+ required).`,
        progress: 0,
      })
      throw new Error(
        `Your device's WebGPU driver reports a maximum buffer size of ${reportedMB}MB, but this ` +
          'model needs at least 128MB — a limit common on lower-end mobile GPUs. Please switch to ' +
          'Cloud (Gemini) instead.'
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
    const { CreateMLCEngine, prebuiltAppConfig } = await import('@mlc-ai/web-llm')

    // The default Cache API backend can fail while committing multi-gigabyte
    // Qwen shards (Chrome reports an opaque `Cache.add` internal error). OPFS
    // is a first-class WebLLM backend and is a better fit for these large,
    // persistent browser artifacts.
    const appConfig = {
      ...prebuiltAppConfig,
      cacheBackend: 'opfs' as const,
      opfsAccessMode: 'auto' as const,
    }

    try {
      engine = await CreateMLCEngine(
        modelId,
        {
          appConfig,
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

  activeInitPromise = doInit()
    .then(() => clearCrashGuard())
    .catch((err) => {
      clearCrashGuard()
      throw err
    })
    .finally(() => {
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
 * Thrown when the local engine stops responding mid-session — most commonly
 * because the browser reclaimed the WebGPU device from a backgrounded tab
 * (Qwen 3.5 9B holds ~6.4GB of VRAM, which browsers reclaim aggressively).
 * Callers should re-run initializeEngine() and retry rather than treat this
 * as a terminal error, since the underlying model files are still cached.
 */
export class EngineDisconnectedError extends Error {
  constructor() {
    super(
      'The local model lost its GPU session (this can happen when the browser reclaims ' +
        'memory from a backgrounded tab). Reloading the model automatically.'
    )
    this.name = 'EngineDisconnectedError'
  }
}

type LocalPromptMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Build the WebLLM request in one testable place. WebLLM reads its
 * model-specific flags from `extra_body`; a top-level `enable_thinking`
 * property is accepted by JavaScript but silently ignored by the engine.
 */
export function buildLocalCompletionRequest(messages: LocalPromptMessage[], maxTokens: number) {
  return {
    messages,
    temperature: 0,
    max_tokens: maxTokens,
    extra_body: { enable_thinking: false },
    stream: true as const,
    stream_options: { include_usage: true },
  }
}

/** Remove Qwen reasoning blocks, including a tag split across stream chunks. */
export function stripLocalThinking(raw: string): string {
  const firstToken = raw.trimStart().toLowerCase()
  if ('<think>'.startsWith(firstToken)) return ''
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/i, '')
}

/** Keep broad catalog prompts small and avoid near-duplicate product variants. */
export function selectLocalPromptChunks(chunks: RAGChunk[], userQuery: string): RAGChunk[] {
  if (classifyIntent(userQuery) !== 'catalog_lookup') return chunks
  const normalizedQuery = userQuery.toLowerCase()
  const compactCatalogQuery =
    /\b(cryptographic\s+)?librar(?:y|ies)\b/.test(normalizedQuery) ||
    (/\b(learn|learning|lesson|lessons|course|courses|training)\b/.test(normalizedQuery) &&
      /\b(module|modules|lesson|lessons|course|courses)\b/.test(normalizedQuery))
  if (!compactCatalogQuery) return chunks

  const selected: RAGChunk[] = []
  const families = new Set<string>()
  for (const chunk of chunks) {
    const family = chunk.title.toLowerCase().split(/\s+/).slice(0, 2).join(' ')
    if (families.has(family)) continue
    families.add(family)
    selected.push(chunk)
    if (selected.length === 3) break
  }
  return selected
}

/**
 * Detect errors that mean the underlying WebGPU device/engine is dead rather
 * than a normal generation failure. web-llm surfaces this either as a
 * `DeviceLostError` (thrown synchronously from init/reload) or, if the device
 * is lost while idle, as a `ModelNotLoadedError` on the next call (web-llm's
 * internal device.lost handler silently unloads its own pipeline first).
 */
function isEngineDisconnectedError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return (
    err.name === 'DeviceLostError' ||
    err.name === 'ModelNotLoadedError' ||
    /device was lost|gpudevice|lost the device/i.test(err.message)
  )
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
  // The native comparison completes grounded answers within 512 tokens. A
  // larger ceiling adds browser latency without improving answer coverage.
  const maxResponseTokens = Math.min(512, Math.round(safeContextWindow * 0.125))
  const maxInventory = Math.min(25, Math.max(8, Math.floor(safeContextWindow / 400)))

  // RetrievalService already ranks and trust-adjusts these chunks. Re-sorting
  // by generic corpus priority pushed exact answer chunks out of the 4K prompt
  // (measured for UAE PQC Index and NIST ACVP queries).
  // The source drawer retains every retrieved result. Generation only needs
  // three representative catalog records; sending all twenty makes small
  // models enumerate until the token ceiling instead of answering concisely.
  const latestUserQuery = [...messages]
    .reverse()
    .find((message) => message.role === 'user')?.content
  const promptChunks = selectLocalPromptChunks(contextChunks, latestUserQuery ?? '')
  const systemPrompt = buildLocalSystemPrompt(
    promptChunks,
    pageContext,
    ragCharBudget,
    maxInventory
  )

  // Convert ChatMessage[] to OpenAI-compatible format.
  const history = messages.slice(-maxHistoryMsgs).map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }))
  // Inject /no_think for Qwen 3 models. The directive is honored most reliably
  // when present in BOTH the system prompt and the trailing user turn —
  // user-only injection is flaky on Qwen 3 4B with longer system prompts and
  // can leave the entire response trapped inside an unclosed <think> block
  // that the strip below removes, producing an empty visible answer.
  const isQwen = loadedModelId?.startsWith('Qwen') ?? false
  const finalSystemPrompt = isQwen ? '/no_think\n' + systemPrompt : systemPrompt
  if (isQwen && history.length > 0 && history[history.length - 1].role === 'user') {
    history[history.length - 1] = {
      ...history[history.length - 1],
      content: '/no_think\n' + history[history.length - 1].content,
    }
  }
  const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: finalSystemPrompt },
    ...history,
  ]

  // Strip <think>...</think> blocks from Qwen 3 output.
  // Approach: accumulate full text, regex-strip after each chunk, yield only new clean content.
  // This handles all edge cases (split tags, nested whitespace, unclosed blocks).
  // Optimization: skip regex when no <think> tag has been seen (common with /no_think).
  let accumulated = ''
  let yieldedLength = 0
  let hitTokenLimit = false

  try {
    const stream = await engine.chat.completions.create(
      buildLocalCompletionRequest(formattedMessages, maxResponseTokens)
    )

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
          hitTokenLimit = true
        }
        continue
      }

      accumulated += delta
      const cleaned = stripLocalThinking(accumulated)

      // Yield only the new portion since last yield
      if (cleaned.length > yieldedLength) {
        yield cleaned.slice(yieldedLength)
        yieldedLength = cleaned.length
      }
    }
  } catch (err) {
    if (isEngineDisconnectedError(err)) {
      // The engine is unusable now regardless of what our module thinks —
      // clear our state so the next call re-initializes from scratch instead
      // of repeatedly hitting the same dead engine.
      await unloadEngine()
      throw new EngineDisconnectedError()
    }
    throw err
  }

  // Final flush: strip any trailing unclosed <think> block
  const final = stripLocalThinking(accumulated)
  if (final.length > yieldedLength) {
    yield final.slice(yieldedLength)
  }

  // Only annotate truncation when a visible answer exists. If a model ever
  // returns thinking-only output again, yield nothing and let the shared
  // finalizer produce a safe extractive response from retrieved corpus data.
  if (hitTokenLimit && final.trim().length > 0) {
    yield '\n\n*(Response truncated — try asking a more specific question.)*'
  }
}
