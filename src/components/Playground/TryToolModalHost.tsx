// SPDX-License-Identifier: GPL-3.0-only
/**
 * TryToolModalHost — runs a playground workshop tool *in place*, on whatever
 * page you're already on, from a `?try=<tool id>` param. Sibling of
 * SpecDrawerHost: same URL-as-state contract, so Back closes it and the link
 * stays copy-pasteable.
 *
 * Safe because the workshop demos are already embeddable — each one is a
 * self-contained component that Learn modules render inline today, and none of
 * them touch PlaygroundProvider's contexts. Tools that DO need the provider
 * (the /playground/interactive workspace) are deliberately not handled here:
 * unknown ids fall through to the real route.
 *
 * The registry and the tool chunk load on demand, so no page pays for this
 * until someone presses Try.
 */
import { Suspense, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'
import FocusLock from 'react-focus-lock'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAchievementStore } from '@/store/useAchievementStore'

interface LoadedTool {
  id: string
  name: string
  category: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Comp: React.ComponentType<any>
}

export function TryToolModalHost() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toolId = params.get('try')
  const [loaded, setLoaded] = useState<LoadedTool | null>(null)

  const close = () => {
    const next = new URLSearchParams(params)
    next.delete('try')
    // replace, not push: Back should leave the page, not reopen the tool.
    setParams(next, { replace: true })
  }

  useEffect(() => {
    if (!toolId) {
      setLoaded(null)
      return
    }
    let cancelled = false
    // Anything this host can't render in place (unknown id, or a tool that
    // needs the playground provider) goes to the real route instead.
    const fallback = () => {
      if (!cancelled) navigate(`/playground/${toolId}`, { replace: true })
    }
    import('./workshopRegistry')
      .then((reg) => {
        if (cancelled) return
        const tool = reg.WORKSHOP_TOOLS.find((t) => t.id === toolId)
        // Key is validated against the registry's own tool list on the line above.
        // eslint-disable-next-line security/detect-object-injection
        const Comp = toolId in reg.ONBACK_COMPONENTS ? undefined : reg.TOOL_COMPONENTS[toolId]
        if (!tool || !Comp) return fallback()
        useAchievementStore.getState().recordPlaygroundToolUsage(tool.id)
        setLoaded({ id: tool.id, name: tool.name, category: tool.category, Comp })
      })
      .catch(fallback)
    return () => {
      cancelled = true
    }
  }, [toolId, navigate])

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (toolId) document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId, params])

  const open = Boolean(toolId) && loaded?.id === toolId

  return (
    <AnimatePresence>
      {open && loaded && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50 print:hidden"
          />
          <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4 print:hidden">
            <FocusLock returnFocus>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                className="glass-panel flex max-h-[90dvh] w-[min(72rem,92vw)] flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label={`${loaded.name} — live tool`}
              >
                <div className="flex items-center gap-3 border-b border-border px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{loaded.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{loaded.category}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Link
                      to={`/playground/${loaded.id}`}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      title="Open this tool on its own page"
                    >
                      <ExternalLink size={12} />
                      Open full tool
                    </Link>
                    <Button variant="ghost" size="sm" onClick={close} aria-label="Close tool">
                      <X size={16} />
                    </Button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <loaded.Comp />
                  </Suspense>
                </div>
              </motion.div>
            </FocusLock>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
