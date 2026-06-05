// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useRef } from 'react'
import { Container, Loader2, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../ui/button'
import { useSandboxStore } from '@/store/useSandboxStore'

interface SandboxStatusToggleProps {
  className?: string
}

/**
 * Header chip that reflects sandbox reachability and lets the user retry.
 * - Auto-probes once on mount when status is idle.
 * - Click while offline/unconfigured/idle triggers a new probe.
 * - Click while online performs a fresh probe (acts as refresh).
 */
export const SandboxStatusToggle: React.FC<SandboxStatusToggleProps> = ({ className }) => {
  const status = useSandboxStore((s) => s.status)
  const probe = useSandboxStore((s) => s.probe)
  const probedRef = useRef(false)

  useEffect(() => {
    if (probedRef.current) return
    if (status === 'idle') {
      probedRef.current = true
      void probe()
    }
  }, [status, probe])

  const handleClick = useCallback(() => {
    if (status === 'checking') return
    void probe()
  }, [status, probe])

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
    <Button
      variant="ghost"
      onClick={handleClick}
      disabled={status === 'checking'}
      aria-pressed={status === 'online'}
      aria-label={
        status === 'online'
          ? 'Sandbox online — click to re-check'
          : 'Sandbox offline — click to retry'
      }
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap',
        status === 'online'
          ? 'border-status-success/40 bg-status-success/10 text-status-success hover:bg-status-success/15'
          : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30',
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotClass)} aria-hidden="true" />
      <Icon
        className={clsx('w-3.5 h-3.5', status === 'checking' && 'animate-spin')}
        aria-hidden="true"
      />
      <span>{label}</span>
    </Button>
  )
}
