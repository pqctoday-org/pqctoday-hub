import { useState, useEffect } from 'react'
import { Database } from 'lucide-react'

export function CorpusFreshnessBadge() {
  const [date, setDate] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import('@/services/chat/RetrievalService').then(({ retrievalService }) => {
      retrievalService
        .initialize()
        .then(() => {
          if (!cancelled) setDate(retrievalService.corpusDate)
        })
        .catch(() => {
          // Corpus not loaded yet — badge will not show
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!date) return null

  const parsed = new Date(date)
  const formatted = parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const ageMs = Date.now() - parsed.getTime()
  const isStale = ageMs > 30 * 24 * 60 * 60 * 1000

  return (
    <p
      className={`text-xs flex items-center justify-center gap-1 ${isStale ? 'text-status-warning' : 'text-muted-foreground/60'}`}
    >
      <Database size={10} />
      {isStale ? `Data may be outdated (${formatted})` : `Data current as of ${formatted}`}
    </p>
  )
}
