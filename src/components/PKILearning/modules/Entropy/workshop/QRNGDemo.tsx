// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { Atom, Cpu, Play, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRandomBytes } from '@/utils/webCrypto'
import { runAllTests, type TestResult } from '../utils/entropyTests'
import { formatHex, binnedFrequency } from '../utils/outputFormatters'
import { QRNG_SAMPLE_64, QRNG_SAMPLE_128 } from '../utils/entropyConstants'
import { BitMatrixGrid } from '../components/BitMatrixGrid'
import { LagPlot } from '../components/LagPlot'

type SampleSize = 64 | 128

const HISTOGRAM_BINS = 16

/** Bin label for a 16-bin histogram (e.g. "00-0F", "10-1F") */
function binLabel(index: number): string {
  const lo = (index * 16).toString(16).toUpperCase().padStart(2, '0')
  const hi = (index * 16 + 15).toString(16).toUpperCase().padStart(2, '0')
  return `${lo}-${hi}`
}

/** Simple inline histogram showing byte frequency across 16 bins */
const FrequencyHistogram: React.FC<{ data: Uint8Array }> = ({ data }) => {
  const bins = binnedFrequency(data, HISTOGRAM_BINS)
  const maxCount = Math.max(...bins, 1)

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-[60px] px-1">
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

/** Pass/Fail icon */
const PassFailIcon: React.FC<{ passed: boolean }> = ({ passed }) =>
  passed ? (
    <CheckCircle size={16} className="text-status-success" />
  ) : (
    <XCircle size={16} className="text-status-error" />
  )

/** Format a test value for display */
function formatTestValue(result: TestResult): string {
  if (result.name === 'Frequency (Monobit)') {
    return `${(result.value * 100).toFixed(1)}%`
  }
  if (result.name === 'Min-Entropy') {
    return `${result.value.toFixed(2)} b/B`
  }
  if (result.name === 'Repetition Count') {
    return String(result.value)
  }
  return result.value.toFixed(2)
}

export const QRNGDemo: React.FC = () => {
  const [sampleSize, setSampleSize] = useState<SampleSize>(64)
  const [trngData, setTrngData] = useState<Uint8Array | null>(null)
  const [qrngResults, setQrngResults] = useState<TestResult[] | null>(null)
  const [trngResults, setTrngResults] = useState<TestResult[] | null>(null)

  const qrngSample = sampleSize === 64 ? QRNG_SAMPLE_64 : QRNG_SAMPLE_128

  const handleGenerateTRNG = useCallback(() => {
    const bytes = getRandomBytes(sampleSize)
    setTrngData(bytes)
    // Clear previous comparison results when new TRNG data is generated
    setTrngResults(null)
    setQrngResults(null)
  }, [sampleSize])

  const handleCompare = useCallback(() => {
    if (!trngData) return
    setQrngResults(runAllTests(qrngSample))
    setTrngResults(runAllTests(trngData))
  }, [qrngSample, trngData])

  const handleSizeChange = useCallback((size: SampleSize) => {
    setSampleSize(size)
    setTrngData(null)
    setQrngResults(null)
    setTrngResults(null)
  }, [])

  const hasComparison = qrngResults !== null && trngResults !== null

  return (
    <div className="space-y-6">
      {/* Explanation Header */}
      <div className="glass-panel p-4 space-y-2">
        <p className="text-sm text-foreground leading-relaxed">
          This step compares a reference high-quality random sample with locally generated random
          data from your browser&apos;s CSPRNG (via Web Crypto API).
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Note:</span> The QRNG sample is a
          cryptographically secure random reference generated via Node.js{' '}
          <code className="font-mono text-primary">crypto.randomBytes()</code>. In a production QRNG
          setup, this data would come from a quantum source such as the ANU QRNG (qrng.anu.edu.au),
          which measures vacuum fluctuations.
        </p>
      </div>

      {/* Sample Size Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Sample Size:</span>
        <div className="flex gap-2">
          <Button
            variant={sampleSize === 64 ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleSizeChange(64)}
          >
            64 bytes
          </Button>
          <Button
            variant={sampleSize === 128 ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleSizeChange(128)}
          >
            128 bytes
          </Button>
        </div>
      </div>

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QRNG Card */}
        <div className="glass-panel p-4 space-y-3 relative">
          <div className="absolute top-4 right-4 flex items-center">
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded">
              Simulated
            </span>
          </div>
          <div className="flex items-center gap-2 pr-20">
            <Atom size={18} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">QRNG (Quantum)</h4>
          </div>
          <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
            Reference random sample
          </span>
          <pre className="font-mono text-xs text-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatHex(qrngSample)}
          </pre>
          <FrequencyHistogram data={qrngSample} />
        </div>

        {/* CSPRNG Card */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">CSPRNG (OS Entropy)</h4>
          </div>
          <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
            Browser Web Crypto API
          </span>
          <Button variant="outline" size="sm" onClick={handleGenerateTRNG}>
            <Play size={14} className="mr-1.5" />
            Generate CSPRNG
          </Button>
          {trngData ? (
            <>
              <pre className="font-mono text-xs text-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {formatHex(trngData)}
              </pre>
              <FrequencyHistogram data={trngData} />
            </>
          ) : (
            <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
              No data yet — click Generate TRNG
            </div>
          )}
        </div>
      </div>

      {/* Bit Structure Comparison */}
      {trngData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">QRNG Bit Structure</p>
            <BitMatrixGrid data={qrngSample} compact />
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">CSPRNG Bit Structure</p>
            <BitMatrixGrid data={trngData} compact />
          </div>
        </div>
      )}

      {/* Lag Plot Comparison */}
      {trngData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">QRNG Autocorrelation</p>
            <LagPlot data={qrngSample} size={180} />
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">CSPRNG Autocorrelation</p>
            <LagPlot data={trngData} size={180} />
          </div>
        </div>
      )}

      {/* Compare Button */}
      <div className="flex justify-center">
        <Button variant="gradient" onClick={handleCompare} disabled={!trngData}>
          <Play size={16} className="mr-2" />
          Run Entropy Tests on Both Samples
        </Button>
      </div>

      {/* Comparison Results Table */}
      {hasComparison && (
        <div className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Comparison Results</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Test</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    QRNG Value
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">QRNG</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    CSPRNG Value
                  </th>
                  <th className="text-center py-2 pl-2 text-muted-foreground font-medium">
                    CSPRNG
                  </th>
                </tr>
              </thead>
              <tbody>
                {qrngResults.map((qr, i) => {
                  const tr = trngResults[i]
                  return (
                    <tr key={qr.name} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        <div className="font-medium text-foreground">{qr.name}</div>
                        <div className="text-xs text-muted-foreground">{qr.description}</div>
                      </td>
                      <td className="text-right py-2 px-3 font-mono text-xs text-foreground">
                        {formatTestValue(qr)}
                      </td>
                      <td className="text-center py-2 px-2">
                        <div className="flex justify-center">
                          <PassFailIcon passed={qr.passed} />
                        </div>
                      </td>
                      <td className="text-right py-2 px-3 font-mono text-xs text-foreground">
                        {formatTestValue(tr)}
                      </td>
                      <td className="text-center py-2 pl-2">
                        <div className="flex justify-center">
                          <PassFailIcon passed={tr.passed} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Callout */}
      <div className="glass-panel p-4 space-y-2 border-t border-border">
        <p className="text-sm text-foreground leading-relaxed">
          Both CSPRNG and QRNG produce high-quality randomness that passes statistical tests.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The fundamental difference is the entropy source: a CSPRNG like Web Crypto API uses a DRBG
          seeded from OS entropy (hardware TRNG), while a QRNG derives randomness directly from
          quantum mechanical phenomena (photon detection, vacuum fluctuations).
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">For PQC:</span> Hardware TRNGs are already
          quantum-safe (they don&apos;t rely on computational hardness). QRNG adds defense-in-depth
          by providing an independent entropy source grounded in quantum physics.
        </p>
      </div>
    </div>
  )
}
