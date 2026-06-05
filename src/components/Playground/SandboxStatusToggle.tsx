// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Container, Loader2, Mail, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../ui/button'
import { useSandboxStore } from '@/store/useSandboxStore'

interface SandboxStatusToggleProps {
  className?: string
}

/**
 * Header chip that reflects sandbox reachability.
 * - Auto-probes once on mount when status is idle.
 * - Click while offline: opens a popover with the contact-for-access CTA + Retry.
 * - Click while online: triggers a fresh probe (acts as refresh).
 */
export const SandboxStatusToggle: React.FC<SandboxStatusToggleProps> = ({ className }) => {
  const status = useSandboxStore((s) => s.status)
  const probe = useSandboxStore((s) => s.probe)
  const probedRef = useRef(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (probedRef.current) return
    if (status === 'idle') {
      probedRef.current = true
      void probe()
    }
  }, [status, probe])

  useEffect(() => {
    if (!popoverOpen) return
    const handleDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopoverOpen(false)
    }
    document.addEventListener('mousedown', handleDocClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleDocClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [popoverOpen])

  const handleClick = useCallback(() => {
    if (status === 'checking') return
    if (status === 'online') {
      void probe()
      return
    }
    setPopoverOpen((open) => !open)
  }, [status, probe])

  const handleRetry = useCallback(() => {
    void probe()
  }, [probe])

  const dotClass =
    status === 'online'
      ? 'bg-status-success'
      : status === 'checking'
        ? 'bg-status-warning'
        : 'bg-muted-foreground/50'

  const label =
    status === 'online'
      ? 'Sandbox online'
      : status === 'checking'
        ? 'Checking sandbox…'
        : 'Sandbox offline'

  const Icon = status === 'checking' ? Loader2 : status === 'online' ? Container : RefreshCw

  return (
    <div ref={wrapperRef} className={clsx('relative inline-block', className)}>
      <Button
        variant="ghost"
        onClick={handleClick}
        disabled={status === 'checking'}
        aria-pressed={status === 'online'}
        aria-expanded={popoverOpen}
        aria-haspopup={status !== 'online' ? 'dialog' : undefined}
        aria-label={
          status === 'online'
            ? 'Sandbox online — click to re-check'
            : 'Sandbox offline — click for access info'
        }
        className={clsx(
          'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap',
          status === 'online'
            ? 'border-status-success/40 bg-status-success/10 text-status-success hover:bg-status-success/15'
            : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
        )}
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotClass)} aria-hidden="true" />
        <Icon
          className={clsx('w-3.5 h-3.5', status === 'checking' && 'animate-spin')}
          aria-hidden="true"
        />
        <span>{label}</span>
      </Button>

      {popoverOpen && status !== 'online' && (
        <div
          role="dialog"
          aria-label="Sandbox access"
          className="glass-panel absolute right-0 top-full z-50 mt-2 w-80 p-4 border-primary/20 space-y-3 shadow-glow"
        >
          <div className="flex items-start gap-2">
            <Container className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Container access required</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Sandbox scenarios run inside isolated Docker containers hosted by PQC Today. Contact
                us to have your environment provisioned — containers are spun up on demand and
                destroyed after the session.
              </p>
            </div>
          </div>
          <a
            href="mailto:pqctoday@gmail.com?subject=Sandbox%20Access%20Request"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-foreground text-xs font-medium rounded-lg transition-colors border border-primary/20 w-full justify-center"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            pqctoday@gmail.com — Request access
          </a>
          <Button
            variant="ghost"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            Retry probe
          </Button>
        </div>
      )}
    </div>
  )
}
