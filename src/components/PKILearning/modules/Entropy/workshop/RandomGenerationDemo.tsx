import React, { useState, useCallback } from 'react'
import { Dice5, Play, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRandomBytes } from '@/utils/webCrypto'
import { arrayBufferToHex } from '@/utils/webCrypto'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { formatHex, binnedFrequency, formatTiming } from '../utils/outputFormatters'
import { BYTE_COUNT_OPTIONS } from '../utils/entropyConstants'
import { FilterDropdown } from '@/components/common/FilterDropdown'

interface GenerationResult {
  hex: string
  data: Uint8Array
  timeMs: number
}

const HISTOGRAM_BINS = 16

/** Bin label for a 16-bin histogram (e.g. "00-0F", "10-1F") */
function binLabel(index: number): string {
  const lo = (index * 16).toString(16).toUpperCase().padStart(2, '0')
  const hi = (index * 16 + 15).toString(16).toUpperCase().padStart(2, '0')
  return `${lo}-${hi}`
}

/** Simple inline histogram showing byte frequency across 16 bins */
const FrequencyHistogram: React.FC<{
  label: string
  data: Uint8Array
}> = ({ label, data }) => {
  const bins = binnedFrequency(data, HISTOGRAM_BINS)
  const maxCount = Math.max(...bins, 1)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-end gap-1 h-[72px] px-1">
        {bins.map((count, i) => {
          const heightPct = (count / maxCount) * 100
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full"
              title={`${binLabel(i)}: ${count} bytes`}
            >
              <div
                className="w-full rounded-t bg-primary/60 transition-all duration-300 min-h-[2px]"
                style={{ height: `${Math.max(heightPct, 3)}%` }}
              />
              <div className="bg-muted/30 w-full h-[1px]" />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 px-1">
        {bins.map((_, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] text-muted-foreground leading-tight"
          >
            {i % 4 === 0 ? binLabel(i).split('-')[0] : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Result card for a single RNG source */
const SourceCard: React.FC<{
  title: string
  result: GenerationResult | null
  loading: boolean
}> = ({ title, result, loading }) => (
  <div className="glass-panel p-4 flex-1 min-w-0 space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {result && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
          <Clock size={12} />
          {formatTiming(result.timeMs)}
        </span>
      )}
    </div>

    {loading ? (
      <div className="h-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    ) : result ? (
      <pre className="font-mono text-sm text-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {formatHex(result.data)}
      </pre>
    ) : (
      <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
        No data yet — click Generate
      </div>
    )}
  </div>
)

export const RandomGenerationDemo: React.FC = () => {
  const [byteCount, setByteCount] = useState<number>(64)
  const [webCryptoResult, setWebCryptoResult] = useState<GenerationResult | null>(null)
  const [opensslResult, setOpensslResult] = useState<GenerationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const byteCountItems = BYTE_COUNT_OPTIONS.map((n) => ({
    id: String(n),
    label: `${n} bytes`,
  }))

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setWebCryptoResult(null)
    setOpensslResult(null)

    try {
      // Run both sources in parallel
      const [webResult, sslResult] = await Promise.allSettled([
        // Web Crypto API
        (async () => {
          const t0 = performance.now()
          const bytes = getRandomBytes(byteCount)
          const webTime = performance.now() - t0
          return {
            hex: arrayBufferToHex(bytes.buffer as ArrayBuffer),
            data: bytes,
            timeMs: webTime,
          }
        })(),
        // OpenSSL WASM
        (async () => {
          const t1 = performance.now()
          const result = await openSSLService.execute(`rand -hex ${byteCount}`)
          const sslTime = performance.now() - t1
          const hexString = result.stdout.trim().replace(/[\s\n]/g, '')
          // Parse hex string back to Uint8Array for frequency analysis
          const bytes = new Uint8Array(byteCount)
          for (let i = 0; i < byteCount; i++) {
            bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16)
          }
          return {
            hex: hexString,
            data: bytes,
            timeMs: sslTime,
          }
        })(),
      ])

      if (webResult.status === 'fulfilled') {
        setWebCryptoResult(webResult.value)
      }
      if (sslResult.status === 'fulfilled') {
        setOpensslResult(sslResult.value)
      }
    } finally {
      setLoading(false)
    }
  }, [byteCount])

  const hasResults = webCryptoResult !== null || opensslResult !== null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Dice5 size={24} className="text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Random Byte Generation</h3>
          <p className="text-sm text-muted-foreground">
            Generate random bytes from two independent sources and compare their output side by
            side.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterDropdown
          items={byteCountItems}
          selectedId={String(byteCount)}
          onSelect={(id) => setByteCount(Number(id))}
          label="Bytes"
          noContainer
        />

        <Button variant="gradient" onClick={handleGenerate} disabled={loading}>
          <Play size={16} className="mr-2" />
          {loading ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {/* Side-by-side results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SourceCard title="Web Crypto API" result={webCryptoResult} loading={loading} />
        <SourceCard title="OpenSSL WASM" result={opensslResult} loading={loading} />
      </div>

      {/* Byte Frequency Histograms */}
      {hasResults && (
        <div className="glass-panel p-4 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Byte Frequency Distribution</h4>
          <p className="text-xs text-muted-foreground">
            Each bar represents the count of bytes falling within a 16-value range (0x00-0x0F,
            0x10-0x1F, etc.). Uniform randomness produces roughly equal bar heights.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {webCryptoResult && (
              <FrequencyHistogram label="Web Crypto API" data={webCryptoResult.data} />
            )}
            {opensslResult && <FrequencyHistogram label="OpenSSL WASM" data={opensslResult.data} />}
          </div>
        </div>
      )}

      {/* Educational note */}
      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
        Both sources ultimately rely on the operating system's entropy pool (e.g.,{' '}
        <code className="font-mono text-primary">/dev/urandom</code> on Linux). Web Crypto uses{' '}
        <code className="font-mono text-primary">crypto.getRandomValues()</code> and OpenSSL uses
        its internal DRBG seeded from OS entropy. The small timing differences reflect API overhead
        and WASM initialization, not entropy quality.
      </p>
    </div>
  )
}
