// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useEffect } from 'react'
import {
  Shield,
  Cloud,
  Key,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Plane,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { FilterDropdown } from '../common/FilterDropdown'
import { useChatStore } from '@/store/useChatStore'
import { useAirplaneModeStore } from '@/store/useAirplaneModeStore'
import { validateApiKey } from '@/services/chat/GeminiService'
import {
  checkWebGPUSupport,
  checkWebGPUBufferCapability,
  isMobileBrowser,
  WEBLLM_MODELS,
  DEFAULT_LOCAL_MODEL,
  MIN_CONTEXT_WINDOW,
  DEFAULT_CONTEXT_WINDOW,
} from '@/services/chat/WebLLMService'

type ValidationState = 'idle' | 'validating' | 'success' | 'error'
type WebGPUCheck = 'checking' | 'supported' | 'unsupported'
type BufferCheck = 'checking' | 'sufficient' | { insufficientMB: number }

export const ProviderSetup: React.FC = () => {
  const setApiKey = useChatStore((s) => s.setApiKey)
  const setProvider = useChatStore((s) => s.setProvider)
  const setLocalModel = useChatStore((s) => s.setLocalModel)
  const setLocalContextWindow = useChatStore((s) => s.setLocalContextWindow)
  const airplaneMode = useAirplaneModeStore((s) => s.isEnabled)

  // Gemini state
  const [keyInput, setKeyInput] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Local state
  const [selectedModel, setSelectedModel] = useState(DEFAULT_LOCAL_MODEL)
  const [contextWindow, setContextWindow] = useState(DEFAULT_CONTEXT_WINDOW)
  const [webgpuCheck, setWebgpuCheck] = useState<WebGPUCheck>('checking')
  // Real per-device GPU buffer limits, not a mobile/desktop guess — see
  // checkWebGPUBufferCapability() for why a UA sniff can't answer this.
  const [bufferCheck, setBufferCheck] = useState<BufferCheck>('checking')
  // Phones/tablets skip the WebGPU/buffer checks entirely — confirmed via a
  // real upstream issue (see isMobileBrowser() doc comment) that even a much
  // smaller model reliably crashes the tab on iOS Safari, so there's no
  // honest way to offer this as a working option there.
  const [isMobile] = useState(() => isMobileBrowser())
  const [showConsent, setShowConsent] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  // Double acknowledgement gate. Both must be explicitly ticked before the user
  // can start a local-AI session. Reset each time the user backs out so they
  // re-confirm rather than passively re-using a prior agreement.
  const [ackExploratory, setAckExploratory] = useState(false)
  const [ackQualityRisk, setAckQualityRisk] = useState(false)

  const selectedModelData = WEBLLM_MODELS.find((m) => m.id === selectedModel)
  const defaultModelData = WEBLLM_MODELS.find((m) => m.id === DEFAULT_LOCAL_MODEL)
  const modelMaxContext = selectedModelData?.maxContextLength ?? MIN_CONTEXT_WINDOW

  // Check WebGPU support, then the device's real GPU buffer limits, on mount
  useEffect(() => {
    checkWebGPUSupport().then((supported) => {
      setWebgpuCheck(supported ? 'supported' : 'unsupported')
      if (!supported) return
      checkWebGPUBufferCapability().then((capability) => {
        if (!capability || capability.ok) {
          setBufferCheck('sufficient')
        } else {
          setBufferCheck({
            insufficientMB: Math.round(capability.maxStorageBufferBindingSize / (1024 * 1024)),
          })
        }
      })
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

  // Cloud is Flash-only (no model picker exists in this app), so the
  // mobile-blocked Local card can send users straight to the one field that
  // matters instead of leaving them to find the Gemini card themselves.
  const focusGeminiApiKeyInput = () => {
    const el = document.getElementById('provider-gemini-api-key')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ;(el as HTMLInputElement | null)?.focus()
  }

  const handleModelChange = (id: string) => {
    setSelectedModel(id)
    const newMax = WEBLLM_MODELS.find((m) => m.id === id)?.maxContextLength ?? MIN_CONTEXT_WINDOW
    // Snap to the highest valid preset for the new model
    if (contextWindow > newMax) setContextWindow(newMax <= 4_096 ? 4_096 : newMax)
  }

  const modelItems = WEBLLM_MODELS.map((m) => ({ id: m.id, label: m.label }))

  // Offer only budgets supported by the selected compiled model artifact.
  // A context budget is not a measurement of retrieved or whole-corpus coverage.
  const contextPresets = [4_096, 6_144, 8_192, 12_288, 16_384]
    .filter((tokens) => tokens <= modelMaxContext)
    .map((tokens) => ({ tokens, label: `${tokens / 1024}K` }))

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
          {/* Local (Private) Card — phones/tablets get a compact explanation
              instead of the full picker; see isMobile doc comment above. */}
          {isMobile ? (
            <div className="glass-panel rounded-xl p-5 space-y-3 border border-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center">
                  <Shield size={18} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">Local (Private)</h4>
                  <p className="text-xs text-muted-foreground">Desktop browsers only</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Local AI runs the model directly in your browser tab, which needs more memory than
                mobile browsers can reliably provide — even much smaller models than this one&apos;s
                crash the tab partway through loading on current phones and tablets. It works well
                on desktop browsers (Chrome, Edge, or Safari on macOS) with a capable GPU.
              </p>
              <p className="text-sm text-muted-foreground">
                On this device, use <strong className="text-foreground">Cloud (Gemini)</strong> — no
                download or local GPU requirement. Check the cited sources rather than assuming a
                provider guarantees accuracy.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-5 space-y-4 border border-border max-h-[80vh] overflow-y-auto">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-status-success/20 flex items-center justify-center">
                  <Shield size={18} className="text-status-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-foreground">Local (Private)</h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-status-warning/20 text-status-warning">
                      Experimental
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Fully on-device</p>
                </div>
              </div>

              {/* Local models can draft unsupported text, so explain the display gate
                before the user invests time downloading the model. */}
              <div className="rounded-lg bg-status-success/10 border border-status-success/30 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-status-success">
                  <Shield size={14} className="shrink-0" />
                  Corpus-only display guardrail
                </div>
                <p className="text-xs text-muted-foreground">
                  The selected model drafts the answer entirely in your browser. Every substantive
                  sentence must map to quoted evidence from the retrieved PQC Today corpus before it
                  is displayed. Unsupported drafts are withheld rather than shown.
                </p>
                <p className="text-xs text-muted-foreground">
                  The model receives no web-search tool and cannot fall back to outside knowledge.
                  If the retrieved corpus is insufficient, the assistant says so. Local mode targets
                  an 8 GB discrete GPU with about 6.5 GB free VRAM, or 16 GB+ Apple Silicon.
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Everything stays on your device — zero network requests during inference. Your data
                never leaves your browser.
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
                    Local AI requires WebGPU. Please use Chrome 113+, Edge 113+, or Safari 18+
                    (macOS Sequoia).
                  </p>
                </div>
              )}

              {webgpuCheck === 'supported' && bufferCheck === 'checking' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Checking this device&apos;s GPU capability...
                </div>
              )}

              {webgpuCheck === 'supported' && typeof bufferCheck === 'object' && (
                <div className="rounded-lg bg-status-warning/10 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-status-warning">
                    <AlertTriangle size={14} />
                    This device&apos;s GPU can&apos;t run local AI
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This app&apos;s local AI needs GPU buffers of at least 128MB. Your
                    browser&apos;s WebGPU driver reports a maximum of {bufferCheck.insufficientMB}MB
                    on this device — a limit common on lower-end mobile GPUs. Please use Cloud
                    (Gemini) instead.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={focusGeminiApiKeyInput}
                    className="w-full"
                  >
                    <Cloud size={14} />
                    Use Cloud (Gemini) instead
                  </Button>
                </div>
              )}

              {webgpuCheck === 'supported' && bufferCheck === 'sufficient' && (
                <>
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Model</span>
                    {/* When only one model is offered, render a static label instead of
                      a single-item dropdown — avoids implying choice that doesn't exist. */}
                    {WEBLLM_MODELS.length > 1 ? (
                      <FilterDropdown
                        items={modelItems}
                        selectedId={selectedModel}
                        onSelect={handleModelChange}
                        ariaLabel="Local AI model"
                        hideDefaultOption
                        noContainer
                      />
                    ) : (
                      <div className="rounded-lg border border-border bg-muted/10 p-2.5">
                        <p className="text-sm font-medium text-foreground">
                          {selectedModelData?.label ?? selectedModel}
                        </p>
                      </div>
                    )}
                    {selectedModelData && (
                      <div className="rounded-lg border border-border bg-muted/10 p-2.5 space-y-1.5">
                        <p className="text-[11px] text-muted-foreground">{selectedModelData.tip}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Configured GPU-memory estimate: ~
                          {(selectedModelData.vramMB / 1024).toFixed(1)} GB. This is not a measured
                          speed or accuracy rating for your device or question.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Context window presets */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Context Window
                    </span>
                    <div className="space-y-1.5">
                      {contextPresets.map((p) => (
                        <Button
                          variant="ghost"
                          size="tile"
                          key={p.tokens}
                          type="button"
                          onClick={() => setContextWindow(p.tokens)}
                          className={`min-h-0 p-2.5 border transition-colors ${
                            contextWindow === p.tokens
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-muted/10 hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-foreground">
                              {p.label} tokens
                            </span>
                            {p.tokens === DEFAULT_CONTEXT_WINDOW && (
                              <span className="text-[10px] text-muted-foreground">App default</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Configured token budget; not corpus coverage
                          </p>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Info panel */}
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setShowInfo(!showInfo)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Info size={12} />
                    How does local AI work?
                  </Button>
                  {showInfo && (
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">WebLLM</strong> runs AI models directly
                        in your browser using <strong>WebGPU</strong>, which gives the model access
                        to your device&apos;s GPU for fast inference.
                      </p>
                      <p>
                        <strong className="text-foreground">GPU Memory</strong> is the main
                        constraint. Model weights + a <strong>KV cache</strong> (scales with context
                        window) must fit in your GPU memory. Integrated GPUs share 4–8 GB with
                        system RAM.
                      </p>
                      <p>
                        <strong className="text-foreground">On phones and tablets</strong>, the
                        browser itself typically caps a single tab&apos;s total memory well below
                        what this model needs — a limit the browser doesn&apos;t expose in advance,
                        so it can only show up as the download failing partway through. If that
                        happens, use Cloud (Gemini) instead — no download or GPU memory required.
                      </p>
                      <p>
                        <strong className="text-foreground">Context Window</strong> is the token
                        budget shared by the question, conversation, retrieved reference material
                        and response. Chunk lengths and prompt selection affect what fits. A larger
                        budget does not guarantee coverage or accuracy. Only budgets supported by
                        the selected model artifact are offered; loading can still fail on a device
                        with insufficient memory.
                      </p>
                      <p>
                        <strong className="text-foreground">Current default</strong>:{' '}
                        {defaultModelData?.label ?? DEFAULT_LOCAL_MODEL}. The other listed options
                        are available for comparison. Their configured context limits and memory
                        estimates are shown above; a default or model choice does not establish that
                        an answer is accurate or supported.
                      </p>
                      <p>
                        <strong className="text-foreground">Limitations</strong>: Model output can
                        be incomplete or unsupported. Failed drafts are withheld; use the linked
                        corpus sources for authoritative detail.
                      </p>
                    </div>
                  )}

                  {!showConsent ? (
                    <>
                      {/* Acknowledgement #1 — local limitations. Stays in the main card so
                        the user faces it before clicking Get Started. */}
                      <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-border bg-muted/10 p-3 hover:border-muted-foreground/30">
                        <input
                          type="checkbox"
                          checked={ackQualityRisk}
                          onChange={(e) => setAckQualityRisk(e.target.checked)}
                          className="mt-0.5 shrink-0 h-4 w-4 accent-primary"
                          aria-describedby="local-ack-quality-text"
                        />
                        <span
                          id="local-ack-quality-text"
                          className="text-xs text-foreground leading-relaxed"
                        >
                          I understand that local AI may be unable to produce a verified answer, and
                          that I should use the linked corpus sources for authoritative decisions.
                        </span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Model download ({selectedModelData?.sizeGB ?? '?'} GB). A retained browser
                        cache can avoid another download; startup time still depends on the device.
                      </p>
                      <Button
                        variant="gradient"
                        className="w-full"
                        onClick={() => setShowConsent(true)}
                        disabled={!ackQualityRisk}
                      >
                        Get Started
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                      <p className="text-xs text-foreground font-medium">
                        Download Acknowledgement
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The model{' '}
                        <strong>
                          {WEBLLM_MODELS.find((m) => m.id === selectedModel)?.label ??
                            selectedModel}
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
                      <p className="text-xs text-muted-foreground">
                        Ensure <strong>huggingface.co</strong> is not blocked by your ad blocker,
                        firewall, or VPN.
                      </p>
                      {/* Acknowledgement #2 — exploratory status, distinct from #1.
                        Required to enable the final "Agree & Download" button. */}
                      <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-status-warning/30 bg-status-warning/10 p-3">
                        <input
                          type="checkbox"
                          checked={ackExploratory}
                          onChange={(e) => setAckExploratory(e.target.checked)}
                          className="mt-0.5 shrink-0 h-4 w-4 accent-primary"
                          aria-describedby="local-ack-exploratory-text"
                        />
                        <span
                          id="local-ack-exploratory-text"
                          className="text-xs text-foreground leading-relaxed"
                        >
                          I understand that local AI is an <strong>exploratory feature</strong> and
                          may return a source-verification notice instead of an answer when its
                          draft cannot be tied to retrieved corpus evidence.
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="gradient"
                          className="flex-1"
                          onClick={handleLocalStart}
                          disabled={!ackExploratory}
                        >
                          Agree & Download
                        </Button>
                        <Button
                          variant="ghost"
                          className="shrink-0"
                          onClick={() => {
                            // Reset both ack flags so backing out forces a fresh
                            // re-confirmation rather than passively reusing prior consent.
                            setShowConsent(false)
                            setAckExploratory(false)
                            setAckQualityRisk(false)
                          }}
                        >
                          Back
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Gemini (Cloud) Card */}
          <div
            className={`glass-panel rounded-xl p-5 space-y-4 border-2 border-primary/40 max-h-[80vh] overflow-y-auto ${
              airplaneMode ? 'opacity-50 pointer-events-none' : ''
            }`}
            aria-disabled={airplaneMode}
          >
            {airplaneMode && (
              <div className="rounded-lg bg-status-warning/10 border border-status-warning/30 p-3 flex items-center gap-2 pointer-events-auto opacity-100">
                <Plane size={14} className="text-status-warning shrink-0" />
                <p className="text-xs text-foreground">
                  Gemini requires an internet connection. Use the Local model for Airplane Mode.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Cloud size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground">
                    Gemini 3.8 Flash (Cloud)
                  </h4>
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Configured cloud provider</p>
              </div>
            </div>

            {/* Describe the cloud processing path without a comparative quality score. */}
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle size={14} className="shrink-0" />
                Corpus-based cloud processing
              </div>
              <p className="text-xs text-muted-foreground">
                Gemini 3.8 Flash answers from the retrieved PQC corpus. Every substantive sentence
                must map to quoted corpus evidence before the answer is displayed. Web search and
                external tools are disabled.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Powered by Google&apos;s Gemini 3.8 Flash. Your question and retrieved corpus passages
              are processed on Google&apos;s servers, but the model receives no web-search tool.
            </p>

            <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
              <p className="text-[11px] font-medium text-foreground">
                Cloud processing considerations
              </p>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc pl-4">
                <li>
                  Your question and retrieved passages are sent to the configured provider. The app
                  bounds the supplied reference material; this is not whole-corpus coverage.
                </li>
                <li>
                  Local and cloud prompts can include different amounts of material. More context
                  does not guarantee a correct answer; inspect the cited sources and their limits.
                </li>
                <li>
                  No local model download is needed. Response time depends on the service and
                  connection; immediate responses are not guaranteed.
                </li>
                <li>
                  Check the provider&apos;s current eligibility, usage limits and pricing before
                  connecting.
                </li>
              </ul>
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                PQC Today has no affiliation with Google and receives no referral fees. These
                controls describe this app&apos;s processing choices, not a comparative quality
                benchmark.
              </p>
            </div>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Get an API key
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
                id="provider-gemini-api-key"
                error={validationState === 'error' ? errorMsg : undefined}
              />

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
