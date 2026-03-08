// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import {
  Shield,
  Cloud,
  Key,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { FilterDropdown } from '../common/FilterDropdown'
import { useChatStore } from '@/store/useChatStore'
import { validateApiKey } from '@/services/chat/GeminiService'
import {
  checkWebGPUSupport,
  WEBLLM_MODELS,
  DEFAULT_LOCAL_MODEL,
  MIN_CONTEXT_WINDOW,
  DEFAULT_CONTEXT_WINDOW,
} from '@/services/chat/WebLLMService'

type ValidationState = 'idle' | 'validating' | 'success' | 'error'
type WebGPUCheck = 'checking' | 'supported' | 'unsupported'

export const ProviderSetup: React.FC = () => {
  const setApiKey = useChatStore((s) => s.setApiKey)
  const setProvider = useChatStore((s) => s.setProvider)
  const setLocalModel = useChatStore((s) => s.setLocalModel)
  const setLocalContextWindow = useChatStore((s) => s.setLocalContextWindow)

  // Gemini state
  const [keyInput, setKeyInput] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Local state
  const [selectedModel, setSelectedModel] = useState(DEFAULT_LOCAL_MODEL)
  const [contextWindow, setContextWindow] = useState(DEFAULT_CONTEXT_WINDOW)
  const [webgpuCheck, setWebgpuCheck] = useState<WebGPUCheck>('checking')
  const [showConsent, setShowConsent] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const selectedModelData = WEBLLM_MODELS.find((m) => m.id === selectedModel)
  const modelMaxContext = selectedModelData?.maxContextLength ?? MIN_CONTEXT_WINDOW

  // Check WebGPU support on mount
  useEffect(() => {
    checkWebGPUSupport().then((supported) => {
      setWebgpuCheck(supported ? 'supported' : 'unsupported')
    })
  }, [])

  const handleGeminiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = keyInput.trim()
    if (!trimmed) return

    setValidationState('validating')
    setErrorMsg('')

    try {
      const valid = await validateApiKey(trimmed)
      if (valid) {
        setValidationState('success')
        setTimeout(() => {
          setApiKey(trimmed)
          setProvider('gemini')
        }, 500)
      } else {
        setValidationState('error')
        setErrorMsg('This API key is not valid. Please check it and try again.')
      }
    } catch {
      setValidationState('error')
      setErrorMsg('Unable to reach Google AI. Please check your internet connection.')
    }
  }

  const handleLocalStart = () => {
    setLocalModel(selectedModel)
    setLocalContextWindow(contextWindow)
    setProvider('local')
  }

  const handleModelChange = (id: string) => {
    setSelectedModel(id)
    const newMax = WEBLLM_MODELS.find((m) => m.id === id)?.maxContextLength ?? MIN_CONTEXT_WINDOW
    // Snap to the highest valid preset for the new model
    if (contextWindow > newMax) setContextWindow(newMax <= 4_096 ? 4_096 : newMax)
  }

  const modelItems = WEBLLM_MODELS.map((m) => ({ id: m.id, label: m.label }))

  /**
   * Context window presets with user-facing descriptions.
   * RAG budget scales at ~45% of context × 4 chars/token.
   * Chunk estimates assume ~400 chars/chunk average.
   * vramMB = model base VRAM + estimated KV cache for this context length.
   * KV cache ≈ num_layers × 2 × kv_heads × head_dim × 2 bytes × tokens.
   * Filtered to only show presets the selected model supports.
   */
  const contextPresets = [
    {
      tokens: 4_096,
      label: '4K',
      chunks: 9,
      coverage: '60%',
      hw: 'Any GPU',
      note: 'Safe default',
      highVram: false,
    },
    {
      tokens: 6_144,
      label: '6K',
      chunks: 15,
      coverage: '100%',
      hw: '4 GB+ GPU',
      note: 'Full coverage',
      highVram: false,
    },
    {
      tokens: 8_192,
      label: '8K',
      chunks: 21,
      coverage: '100%',
      hw: '8 GB GPU / Apple Silicon',
      note: 'Best quality',
      highVram: (selectedModelData?.vramMB ?? 0) > 3_000,
    },
    {
      tokens: 12_288,
      label: '12K',
      chunks: 30,
      coverage: '100%',
      hw: '12 GB+ GPU / Apple Silicon',
      note: 'Deep context',
      highVram: true,
    },
    {
      tokens: 16_384,
      label: '16K',
      chunks: 40,
      coverage: '100%',
      hw: '16 GB+ GPU',
      note: 'Maximum context',
      highVram: true,
    },
  ].filter((p) => p.tokens <= modelMaxContext)

  // Chunk count for the currently selected local context window, used in Gemini comparison
  const localChunks = contextPresets.find((p) => p.tokens === contextWindow)?.chunks ?? 9

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Choose Your AI Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Select how PQC Assistant processes your questions.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local (Private) Card */}
          <div className="glass-panel rounded-xl p-5 space-y-4 border border-border max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-status-success/20 flex items-center justify-center">
                <Shield size={18} className="text-status-success" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Local (Private)</h4>
                <p className="text-xs text-muted-foreground">100% on-device</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Everything stays on your device — zero network requests during inference. Answers are
              shorter and less detailed than cloud, but your data never leaves your browser.
            </p>

            {webgpuCheck === 'checking' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Checking WebGPU support...
              </div>
            )}

            {webgpuCheck === 'unsupported' && (
              <div className="rounded-lg bg-status-warning/10 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-status-warning">
                  <AlertTriangle size={14} />
                  WebGPU is not available
                </div>
                <p className="text-xs text-muted-foreground">
                  Local AI requires WebGPU. Please use Chrome 113+, Edge 113+, or Safari 18+ (macOS
                  Sequoia).
                </p>
              </div>
            )}

            {webgpuCheck === 'supported' && (
              <>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Model</span>
                  <FilterDropdown
                    items={modelItems}
                    selectedId={selectedModel}
                    onSelect={handleModelChange}
                    noContainer
                    label="Model"
                  />
                  {selectedModelData && (
                    <div className="rounded-lg border border-border bg-muted/10 p-2.5 space-y-1.5">
                      <p className="text-[11px] text-muted-foreground">{selectedModelData.tip}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>
                          Speed{' '}
                          <span className="text-foreground font-medium">
                            {'●'.repeat(selectedModelData.speed)}
                            {'○'.repeat(5 - selectedModelData.speed)}
                          </span>
                        </span>
                        <span>
                          Accuracy{' '}
                          <span className="text-foreground font-medium">
                            {'●'.repeat(selectedModelData.accuracy)}
                            {'○'.repeat(5 - selectedModelData.accuracy)}
                          </span>
                        </span>
                        <span>VRAM ~{(selectedModelData.vramMB / 1024).toFixed(1)} GB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Context window presets */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Context Window</span>
                  <div className="space-y-1.5">
                    {contextPresets.map((p) => (
                      <button
                        key={p.tokens}
                        type="button"
                        onClick={() => setContextWindow(p.tokens)}
                        className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                          contextWindow === p.tokens
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-muted/10 hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            {p.label} tokens
                          </span>
                          <div className="flex items-center gap-1.5">
                            {p.highVram && (
                              <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-status-warning/15 text-status-warning">
                                High VRAM
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{p.note}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {p.chunks} chunks &middot; {p.coverage} coverage
                          </span>
                          <span className="text-[10px] text-muted-foreground">{p.hw}</span>
                        </div>
                        {p.highVram && contextWindow === p.tokens && (
                          <p className="text-[10px] text-status-warning mt-1">
                            If loading fails with an out-of-memory error, switch to a lower context
                            window or a smaller model.
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info panel */}
                <button
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Info size={12} />
                  How does local AI work?
                </button>
                {showInfo && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-xs text-muted-foreground">
                    <p>
                      <strong className="text-foreground">WebLLM</strong> runs AI models directly in
                      your browser using <strong>WebGPU</strong>, which gives the model access to
                      your device&apos;s GPU for fast inference.
                    </p>
                    <p>
                      <strong className="text-foreground">GPU Memory</strong> is the main
                      constraint. Model weights + a <strong>KV cache</strong> (scales with context
                      window) must fit in your GPU memory. Integrated GPUs share 4–8 GB with system
                      RAM.
                    </p>
                    <p>
                      <strong className="text-foreground">Context Window</strong> controls how much
                      reference data (RAG chunks) the model sees alongside your question. A larger
                      window means more relevant facts are included, improving answer quality. The
                      4K default works on any GPU — increase if your hardware allows.
                    </p>
                    <p>
                      <strong className="text-foreground">Choosing a model</strong>: Qwen 3 1.7B is
                      the best all-rounder. Llama 3.2 3B excels at following formatting rules
                      (links, lists). Phi 3.5 Mini can use up to 16K context for the deepest
                      answers. Qwen 3 4B gives the highest accuracy but needs more VRAM. Qwen 3 0.6B
                      is the fastest for quick lookups.
                    </p>
                    <p>
                      <strong className="text-foreground">Limitations vs Cloud</strong>: Local
                      models (0.6–4B parameters) are much smaller than Gemini (cloud). They may give
                      shorter answers, miss nuances, and produce fewer deep links to app pages. For
                      best results, ask specific, focused questions.
                    </p>
                  </div>
                )}

                {!showConsent ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      One-time download ({selectedModelData?.sizeGB ?? '?'} GB). Cached in your
                      browser for instant startup.
                    </p>
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={() => setShowConsent(true)}
                    >
                      Get Started
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                    <p className="text-xs text-foreground font-medium">Download Acknowledgement</p>
                    <p className="text-xs text-muted-foreground">
                      The model{' '}
                      <strong>
                        {WEBLLM_MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel}
                      </strong>{' '}
                      will be downloaded from{' '}
                      <a
                        href={`https://huggingface.co/mlc-ai/${selectedModel}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        huggingface.co/mlc-ai
                      </a>
                      . This is a one-time download of{' '}
                      {WEBLLM_MODELS.find((m) => m.id === selectedModel)?.sizeGB ?? '?'} GB that
                      will be cached in your browser.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      After download, the model runs entirely on your device — no data is sent to
                      any server during inference.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Ensure <strong>huggingface.co</strong> is not blocked by your ad blocker,
                      firewall, or VPN.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="gradient" className="flex-1" onClick={handleLocalStart}>
                        Agree & Download
                      </Button>
                      <Button
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => setShowConsent(false)}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Gemini (Cloud) Card */}
          <div className="glass-panel rounded-xl p-5 space-y-4 border border-border max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Cloud size={18} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Gemini 2.5 Flash (Cloud)</h4>
                <p className="text-xs text-muted-foreground">1M token context · 40+ languages</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Powered by Google&apos;s Gemini 2.5 Flash — a frontier model orders of magnitude
              larger than any local option. Your questions are processed on Google&apos;s servers.
            </p>

            {/* Feature comparison */}
            <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
              <p className="text-[11px] font-medium text-foreground">
                Why Gemini outperforms local models
              </p>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-status-success mt-0.5 shrink-0">●</span>
                  <span>
                    <strong className="text-foreground">
                      All retrieved chunks per query (~15–20)
                    </strong>{' '}
                    — vs ~{localChunks} chunks with your current local setting. More context = more
                    accurate, detailed answers
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-success mt-0.5 shrink-0">●</span>
                  <span>
                    <strong className="text-foreground">40+ languages</strong> — ask questions in
                    French, German, Japanese, Arabic, Chinese, Spanish, and more
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-success mt-0.5 shrink-0">●</span>
                  <span>
                    <strong className="text-foreground">Instant first token</strong> — no model
                    download, no GPU warm-up, no memory constraints
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-success mt-0.5 shrink-0">●</span>
                  <span>
                    <strong className="text-foreground">Richer answers</strong> — more deep links,
                    better reasoning across multi-step PQC migration questions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-success mt-0.5 shrink-0">●</span>
                  <span>
                    <strong className="text-foreground">Free tier</strong> — Google AI Studio
                    provides a free API key with generous daily limits
                  </span>
                </li>
              </ul>
              <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border">
                PQC Today has no affiliation with Google and receives no referral fees. We recommend
                Gemini because it gives users the best experience with this tool.
              </p>
            </div>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Get your free API key
              <ExternalLink size={14} />
            </a>

            <form onSubmit={handleGeminiSubmit} className="space-y-3">
              <Input
                type="password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value)
                  if (validationState === 'error') setValidationState('idle')
                }}
                placeholder="Paste your API key here"
                className="w-full bg-muted/30 border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                autoComplete="off"
                aria-label="Gemini API key"
              />

              {validationState === 'error' && (
                <div className="flex items-center gap-2 text-sm text-status-error">
                  <AlertCircle size={14} />
                  {errorMsg}
                </div>
              )}

              {validationState === 'success' && (
                <div className="flex items-center gap-2 text-sm text-status-success">
                  <CheckCircle size={14} />
                  Connected successfully!
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={!keyInput.trim() || validationState === 'validating'}
              >
                {validationState === 'validating' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    Save & Connect
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Privacy note */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            <strong>Local:</strong> Everything stays on your device — questions, answers, and model.
            No data is ever sent to any server.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Cloud:</strong> Your API key is stored only in your browser (never sent to our
            servers). Your conversations are sent to Google&apos;s Gemini API for processing.
          </p>
        </div>
      </div>
    </div>
  )
}
