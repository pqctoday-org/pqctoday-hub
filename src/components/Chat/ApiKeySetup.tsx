// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Key, ExternalLink, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useChatStore } from '@/store/useChatStore'
import { validateApiKey } from '@/services/chat/GeminiService'

type ValidationState = 'idle' | 'validating' | 'success' | 'error'

export const ApiKeySetup: React.FC = () => {
  const [keyInput, setKeyInput] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const setApiKey = useChatStore((s) => s.setApiKey)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = keyInput.trim()
    if (!trimmed) return

    setValidationState('validating')
    setErrorMsg('')

    try {
      const valid = await validateApiKey(trimmed)
      if (valid) {
        setValidationState('success')
        setTimeout(() => setApiKey(trimmed), 500)
      } else {
        setValidationState('error')
        setErrorMsg('This API key is not valid. Please check it and try again.')
      }
    } catch {
      setValidationState('error')
      setErrorMsg('Unable to reach Google AI. Please check your internet connection.')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Key size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Connect to Gemini AI</h3>
          <p className="text-sm text-muted-foreground">
            PQC Assistant uses Google&apos;s Gemini Flash model. Get a free API key from Google AI
            Studio.
          </p>
        </div>

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
        >
          Get your free API key
          <ExternalLink size={14} />
        </a>

        <form onSubmit={handleSubmit} className="space-y-3">
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
            id="gemini-api-key"
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
              'Save & Connect'
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Your key is stored locally in your browser. It is never sent to our servers.
        </p>
      </div>
    </div>
  )
}
