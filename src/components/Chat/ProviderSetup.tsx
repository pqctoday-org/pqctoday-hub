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
} from '@/services/chat/WebLLMService'

type ValidationState = 'idle' | 'validating' | 'success' | 'error'
type WebGPUCheck = 'checking' | 'supported' | 'unsupported'

export const ProviderSetup: React.FC = () => {
  const setApiKey = useChatStore((s) => s.setApiKey)
  const setProvider = useChatStore((s) => s.setProvider)
  const setLocalModel = useChatStore((s) => s.setLocalModel)

  // Gemini state
  const [keyInput, setKeyInput] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Local state
  const [selectedModel, setSelectedModel] = useState(DEFAULT_LOCAL_MODEL)
  const [webgpuCheck, setWebgpuCheck] = useState<WebGPUCheck>('checking')

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
    setProvider('local')
  }

  const modelItems = WEBLLM_MODELS.map((m) => ({ id: m.id, label: m.label }))

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-6">
      <div className="max-w-2xl w-full space-y-6">
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
          <div className="glass-panel rounded-xl p-5 space-y-4 border border-border">
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
              All AI processing happens in your browser. Your questions and data never leave your
              device. Powered by WebGPU.
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
                    onSelect={setSelectedModel}
                    noContainer
                    label="Model"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  One-time download (
                  {WEBLLM_MODELS.find((m) => m.id === selectedModel)?.sizeGB ?? '?'} GB). Cached in
                  your browser for instant startup.
                </p>
                <Button variant="gradient" className="w-full" onClick={handleLocalStart}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Gemini (Cloud) Card */}
          <div className="glass-panel rounded-xl p-5 space-y-4 border border-border">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <Cloud size={18} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Gemini (Cloud)</h4>
                <p className="text-xs text-muted-foreground">Powerful cloud AI</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Uses Google&apos;s Gemini 2.5 Flash model. Free API key required. Queries are sent to
              Google&apos;s servers.
            </p>

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
            <strong>Local:</strong> Everything stays on your device. No network requests during
            inference.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Cloud:</strong> Your API key is stored locally. Queries are sent to
            Google&apos;s Gemini API.
          </p>
        </div>
      </div>
    </div>
  )
}
