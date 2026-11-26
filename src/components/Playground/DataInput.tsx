// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useEffect, useId } from 'react'
import { clsx } from 'clsx'
import { FileText, Binary } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  height?: string
  inputType?: 'text' | 'binary'
  onValidityChange?: (valid: boolean) => void
}

import { asciiToHex, bytesToHex, hexToAscii, hexToBytes, isHex } from '../../utils/dataInputUtils'

export const DataInput: React.FC<DataInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  readOnly = false,
  height = 'h-32',
  inputType = 'text',
  onValidityChange,
}) => {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [viewMode, setViewMode] = useState<'ascii' | 'hex'>(inputType === 'text' ? 'ascii' : 'hex')
  const [localValue, setLocalValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Calculate display value based on current props and view mode
  const getDisplayValue = (val: string, mode: 'ascii' | 'hex', type: 'text' | 'binary') => {
    if (type === 'text') {
      return mode === 'ascii' ? val : bytesToHex(new TextEncoder().encode(val))
    } else {
      // type === 'binary' (val is hex)
      return mode === 'hex' ? val : hexToAscii(val)
    }
  }

  // Update local value when prop value changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalValue(getDisplayValue(value, viewMode, inputType))
    setError(null)
    onValidityChange?.(true)
  }, [value, viewMode, inputType, onValidityChange])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    if (viewMode === 'hex' && !isHex(newValue)) {
      setError('Enter complete hexadecimal bytes.')
      onValidityChange?.(false)
      return
    }

    try {
      const parsed =
        inputType === 'text'
          ? viewMode === 'ascii'
            ? newValue
            : new TextDecoder('utf-8', { fatal: true }).decode(hexToBytes(newValue))
          : viewMode === 'hex'
            ? newValue
            : asciiToHex(newValue)
      if (inputType === 'binary' && !isHex(parsed)) {
        setError('Enter complete hexadecimal bytes to represent this input.')
        onValidityChange?.(false)
        return
      }
      onChange(parsed)
      setError(null)
      onValidityChange?.(true)
    } catch {
      setError('These hexadecimal bytes are not valid UTF-8 text.')
      onValidityChange?.(false)
    }
  }

  return (
    <div className="bg-muted/30 rounded-xl border border-border p-4 transition-colors hover:border-primary/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-bold text-foreground">
          {label}
        </label>
        <div className="flex bg-muted rounded-lg p-1 border border-border">
          <Button
            variant="ghost"
            onClick={() => setViewMode('ascii')}
            aria-pressed={viewMode === 'ascii'}
            className={clsx(
              'px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all',
              viewMode === 'ascii'
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText size={12} /> ASCII
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewMode('hex')}
            aria-pressed={viewMode === 'hex'}
            className={clsx(
              'px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all',
              viewMode === 'hex'
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Binary size={12} /> HEX
          </Button>
        </div>
      </div>

      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        value={localValue}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={clsx(
          'w-full bg-background border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary font-mono resize-none transition-colors',
          height,
          error ? 'border-destructive/50 focus:border-destructive' : 'border-border',
          readOnly ? 'opacity-70 cursor-not-allowed' : ''
        )}
      />

      {error && (
        <div id={errorId} role="status" className="mt-2 text-xs font-medium text-status-error">
          {error}
        </div>
      )}
    </div>
  )
}
