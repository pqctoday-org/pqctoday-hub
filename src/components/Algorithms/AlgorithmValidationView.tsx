// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ShieldAlert, FlaskConical, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ImplementationAttacksView } from './ImplementationAttacksView'
import { KATView } from './KATView'

type ValidationSection = 'attacks' | 'kat'

/**
 * "Validation" tab — houses the two interactive reference views that used to be
 * buried as the 5th/6th accordion sections of the Detailed Comparison tab:
 * Implementation Attacks (side-channel / fault reference) and KAT Validation
 * (live in-browser known-answer-test vectors). Each is a collapsible section so
 * the heavy KAT runner only mounts when opened. Researchers land with KAT open.
 */
export function AlgorithmValidationView() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [open, setOpen] = useState<Set<ValidationSection>>(
    () => new Set<ValidationSection>(selectedPersona === 'researcher' ? ['kat'] : [])
  )

  const toggle = (id: ValidationSection) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const sections: Array<{
    id: ValidationSection
    icon: React.ReactNode
    label: string
    caption: string
    content: React.ReactNode
  }> = [
    {
      id: 'attacks',
      icon: <ShieldAlert size={16} />,
      label: 'Implementation Attacks',
      caption: 'Side-channel and fault-injection considerations per algorithm family.',
      content: <ImplementationAttacksView />,
    },
    {
      id: 'kat',
      icon: <FlaskConical size={16} />,
      label: 'KAT Validation',
      caption: 'Run pinned known-answer-test vectors live in your browser via WASM.',
      content: <KATView />,
    },
  ]

  return (
    <div className="space-y-3">
      {sections.map(({ id, icon, label, caption, content }) => {
        const isOpen = open.has(id)
        return (
          <section
            key={id}
            className="glass-panel overflow-hidden"
            data-workshop-target={`section-validation-${id}`}
          >
            <Button
              variant="ghost"
              onClick={() => toggle(id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 h-auto rounded-none"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-primary">{icon}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground font-normal">{caption}</span>
                </span>
              </span>
              <ChevronDown
                size={18}
                className={clsx(
                  'shrink-0 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
            {isOpen && <div className="border-t border-border p-4">{content}</div>}
          </section>
        )
      })}
    </div>
  )
}
