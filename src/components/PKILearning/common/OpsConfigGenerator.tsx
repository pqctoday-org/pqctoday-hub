// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Wrench, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { usePersonaStore } from '@/store/usePersonaStore'
import { cn } from '@/lib/utils'
import { FilterDropdown } from '@/components/common/FilterDropdown'

export interface ConfigSelection {
  id: string
  label: string
  options: { value: string; label: string }[]
  defaultValue: string
}

interface OpsConfigGeneratorProps {
  title: string
  description: string
  selections: ConfigSelection[]
  generateConfig: (selections: Record<string, string>) => string
}

export const OpsConfigGenerator: React.FC<OpsConfigGeneratorProps> = ({
  title,
  description,
  selections,
  generateConfig,
}) => {
  const { selectedPersona } = usePersonaStore()
  const isOps = selectedPersona === 'ops'
  const [copied, setCopied] = useState(false)

  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    for (const sel of selections) {
      defaults[sel.id] = sel.defaultValue
    }
    return defaults
  })

  const handleChange = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const configOutput = useMemo(() => generateConfig(values), [generateConfig, values])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(configOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [configOutput])

  return (
    <div
      className={cn(
        'glass-panel p-6 space-y-4',
        isOps && 'border-l-2 border-l-primary bg-primary/5'
      )}
    >
      <div className="flex items-center gap-3">
        <Wrench size={20} className="text-primary" aria-hidden="true" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {isOps && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30">
                Ops Guide
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Selection dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {selections.map((sel) => (
          <div key={sel.id}>
            <span className="block text-sm font-medium text-foreground mb-1">{sel.label}</span>
            <FilterDropdown
              noContainer
              selectedId={values[sel.id] ?? ''}
              onSelect={(id) => handleChange(sel.id, id)}
              items={sel.options.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>
        ))}
      </div>

      {/* Generated config */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>
        <CodeBlock code={configOutput} />
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground italic">
        For educational use only. Review and adapt configurations before deploying to production
        environments.
      </p>
    </div>
  )
}
