// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { Atom, Cpu, Play, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhyThisMatters } from '@/components/ui/WhyThisMatters'
import { getRandomBytes } from '@/utils/webCrypto'
import { runAllTests, type TestResult } from '../utils/entropyTests'
import { formatHex, binnedFrequency } from '../utils/outputFormatters'
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

const generateSimulatedQrng = (bytes: number): Uint8Array => {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return buf
}

/**
 * Generate a deliberately-weak PRNG sample for pedagogical contrast.
 *
 * Uses Math.random() with the high nibble masked off (`& 0x0F`), so every
 * byte falls in the range 0..15. This produces a uniform-looking source
 * to a casual eye but:
 *   - the monobit frequency test fails (every byte loses 4 of its 8 bits
 *     → ones-ratio collapses from ~0.5 to ~0.25)
 *   - chi-squared blows up (only 16 of 256 buckets ever populated)
 *   - SP 800-90B min-entropy collapses (∼4 bits/byte instead of ≥6)
 *   - the histogram is visibly broken (1/16 of the x-axis populated)
 *
 * This is NOT a real-world weak RNG; it is an explicitly-broken source
 * chosen to make BAD entropy visually obvious next to the CSPRNG /
 * QRNG-simulated samples.
 */
const generateWeakPrng = (bytes: number): Uint8Array => {
  const buf = new Uint8Array(bytes)
  for (let i = 0; i < bytes; i++) {
    buf[i] = Math.floor(Math.random() * 256) & 0x0f
  }
  return buf
}

export const QRNGDemo: React.FC = () => {
  const [sampleSize, setSampleSize] = useState<SampleSize>(64)
  const [qrngSample, setQrngSample] = useState<Uint8Array>(() => generateSimulatedQrng(64))
  const [trngData, setTrngData] = useState<Uint8Array | null>(null)
  const [weakSample, setWeakSample] = useState<Uint8Array>(() => generateWeakPrng(64))
  const [qrngResults, setQrngResults] = useState<TestResult[] | null>(null)
  const [trngResults, setTrngResults] = useState<TestResult[] | null>(null)
  const [weakResults, setWeakResults] = useState<TestResult[] | null>(null)

  const handleGenerateTRNG = useCallback(() => {
    const bytes = getRandomBytes(sampleSize)
    setTrngData(bytes)
    // Clear previous comparison results when new TRNG data is generated
    setTrngResults(null)
    setQrngResults(null)
    setWeakResults(null)
  }, [sampleSize])

  const handleCompare = useCallback(() => {
    if (!trngData) return
    setQrngResults(runAllTests(qrngSample))
    setTrngResults(runAllTests(trngData))
    setWeakResults(runAllTests(weakSample))
  }, [qrngSample, trngData, weakSample])

  const handleSizeChange = useCallback((size: SampleSize) => {
    setSampleSize(size)
    setQrngSample(generateSimulatedQrng(size))
    setWeakSample(generateWeakPrng(size))
    setTrngData(null)
    setQrngResults(null)
    setTrngResults(null)
    setWeakResults(null)
  }, [])

  const hasComparison = qrngResults !== null && trngResults !== null && weakResults !== null

  return (
    <div className="space-y-6">
      {/* Simulation Disclaimer — prominently first */}
      <div className="glass-panel p-3 flex gap-3 items-start border border-status-info/20 bg-status-info/5">
        <span className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full bg-status-info/15 p-1">
          <Atom size={14} className="text-status-info" />
        </span>
        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-semibold text-status-info">Simulated reference:</span> The
          &ldquo;QRNG&rdquo; sample shown below was generated via Node.js{' '}
          <code className="font-mono text-primary">crypto.randomBytes()</code> — a classical CSPRNG
          — and stored as a static constant for offline use. In a production system this data would
          come from a hardware quantum source (photon detection or vacuum fluctuations). Statistical
          quality is equivalent; the <em>physical entropy source</em> differs.
        </p>
      </div>

      {/* Explanation Header */}
      <div className="glass-panel p-4">
        <p className="text-sm text-foreground leading-relaxed">
          This step compares three sources side by side: a pre-generated reference sample
          (representing QRNG-quality output), locally generated random data from your browser&apos;s
          CSPRNG (Web Crypto API), and a deliberately-broken weak PRNG. The QRNG and CSPRNG should
          pass every test &mdash; they are statistically indistinguishable at this sample size. The
          weak PRNG should visibly fail several tests, illustrating what the tests are actually
          designed to catch.
        </p>
      </div>

      <WhyThisMatters title="Statistical Equivalence vs. Quantum Origin" variant="info">
        <p>
          A classical CSPRNG (ChaCha20-DRBG, AES-CTR-DRBG, or the OS entropy pool) and a true
          quantum random number generator <strong>produce indistinguishable output</strong> under
          every standard statistical test — monobit, frequency, min-entropy, autocorrelation. The
          bit patterns you see in the hex and histogram displays above will be equally uniform for
          both sources. This is by design: statistical quality is the floor, not the differentiator.
        </p>
        <p>
          The practical difference is the <strong>physical entropy source</strong>. CSPRNG output
          depends on OS entropy events (hardware interrupts, disk I/O timing) which, on a
          deterministic machine, are bounded in unpredictability. A photon-detection or vacuum-state
          QRNG draws on quantum-mechanical randomness that is fundamentally unpredictable by any
          physical process — no adversary with unlimited classical compute can predict it.
        </p>
        <p>
          For most cryptographic uses (session key generation, nonces, IVs) a well-seeded CSPRNG is
          fully sufficient — NIST FIPS 140-3 approved DRBGs are the standard. QRNG matters in two
          specific scenarios: (1) long-lived key material in high-assurance HSMs where
          <strong>seed unpredictability</strong> must be provable to evaluators, and (2)
          quantum-resistant long-term keys where you want the key bits themselves to have quantum
          entropy. NIST SP 800-90B certifies entropy source quality for both cases — statistical
          tests alone are not sufficient certification evidence.
        </p>
      </WhyThisMatters>

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* QRNG Card */}
        <div className="min-w-0 glass-panel p-4 space-y-3 relative">
          <div className="absolute top-4 right-4 flex items-center">
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded">
              Simulated
            </span>
          </div>
          <div className="flex items-center gap-2 pr-20">
            <Atom size={18} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">QRNG Reference</h4>
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
        <div className="min-w-0 glass-panel p-4 space-y-3">
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
              No data yet — click Generate CSPRNG
            </div>
          )}
        </div>

        {/* Weak PRNG Card — pedagogical contrast (visibly bad source) */}
        <div className="min-w-0 glass-panel p-4 space-y-3 relative border border-status-error/30">
          <div className="absolute top-4 right-4 flex items-center">
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider bg-status-error/10 text-status-error border border-status-error/20 px-2 py-0.5 rounded">
              Broken
            </span>
          </div>
          <div className="flex items-center gap-2 pr-20">
            <Cpu size={18} className="text-status-error" />
            <h4 className="text-sm font-semibold text-foreground">Weak PRNG</h4>
          </div>
          <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
            Math.random() &amp; 0x0F · high nibble forced to 0
          </span>
          <pre className="font-mono text-xs text-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {formatHex(weakSample)}
          </pre>
          <FrequencyHistogram data={weakSample} />
        </div>
      </div>

      {/* Bit Structure Comparison */}
      {trngData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="min-w-0 glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">QRNG Bit Structure</p>
            <BitMatrixGrid data={qrngSample} compact />
          </div>
          <div className="min-w-0 glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">CSPRNG Bit Structure</p>
            <BitMatrixGrid data={trngData} compact />
          </div>
          <div className="min-w-0 glass-panel p-4 border border-status-error/30">
            <p className="text-xs font-medium text-foreground mb-2">Weak PRNG Bit Structure</p>
            <BitMatrixGrid data={weakSample} compact />
          </div>
        </div>
      )}

      {/* Lag Plot Comparison */}
      {trngData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="min-w-0 glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">QRNG Autocorrelation</p>
            <LagPlot data={qrngSample} size={180} />
          </div>
          <div className="min-w-0 glass-panel p-4">
            <p className="text-xs font-medium text-foreground mb-2">CSPRNG Autocorrelation</p>
            <LagPlot data={trngData} size={180} />
          </div>
          <div className="min-w-0 glass-panel p-4 border border-status-error/30">
            <p className="text-xs font-medium text-foreground mb-2">Weak PRNG Autocorrelation</p>
            <LagPlot data={weakSample} size={180} />
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
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    CSPRNG
                  </th>
                  <th className="text-right py-2 px-3 text-status-error font-medium">Weak Value</th>
                  <th className="text-center py-2 pl-2 text-status-error font-medium">Weak</th>
                </tr>
              </thead>
              <tbody>
                {qrngResults.map((qr, i) => {
                  const tr = trngResults[i]
                  const wk = weakResults[i]
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
                      <td className="text-center py-2 px-2">
                        <div className="flex justify-center">
                          <PassFailIcon passed={tr.passed} />
                        </div>
                      </td>
                      <td className="text-right py-2 px-3 font-mono text-xs text-foreground">
                        {formatTestValue(wk)}
                      </td>
                      <td className="text-center py-2 pl-2">
                        <div className="flex justify-center">
                          <PassFailIcon passed={wk.passed} />
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

      {hasComparison && (
        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">What the three sources tell you</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="text-status-error">Weak PRNG</strong> visibly fails the histogram,
            chi-squared, and min-entropy tests because it only ever emits values 0&ndash;15 (the
            high nibble is forced to zero). This is what bad entropy actually looks like &mdash; and
            it&apos;s exactly what the statistical tests are designed to catch.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong>QRNG-simulated</strong> and <strong>CSPRNG</strong> both pass every test because
            at this sample size they are statistically indistinguishable. The simulated QRNG sample
            is itself CSPRNG output &mdash; in a production system it would come from a hardware
            quantum source (photon detection, vacuum fluctuations). The byte distributions look
            identical because they are.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Statistical tests measure <em>output quality</em>, not <em>source security</em>. A
            CSPRNG seeded with a compromised value (weak entropy, side-channel, backdoored RNG) can
            produce output that passes every test while being completely predictable to an attacker.
            QRNG matters when you need provable seed unpredictability for long-lived cryptographic
            material &mdash; not for everyday session keys, where a well-seeded CSPRNG (NIST FIPS
            140-3 DRBG) is the standard.
          </p>
        </div>
      )}

      {hasComparison && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setQrngSample(generateSimulatedQrng(sampleSize))
              setWeakSample(generateWeakPrng(sampleSize))
              setTrngData(null)
              setQrngResults(null)
              setTrngResults(null)
              setWeakResults(null)
            }}
          >
            Try Another Sample
          </Button>
        </div>
      )}

      {/* Educational Callout */}
      {hasComparison && (
        <div className="glass-panel p-4 space-y-3 border-l-4 border-l-primary bg-primary/5">
          {/* Production QRNG Products */}
          <div className="pt-1 border-t border-border/50">
            <p className="text-xs font-medium text-foreground mb-2">
              Production QRNG Hardware &amp; Services
            </p>
            <ul className="space-y-1">
              <li className="text-xs text-muted-foreground">
                <a
                  href="/migrate?q=ID+Quantique+Quantis+QRNG"
                  className="text-primary underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ID Quantique Quantis QRNG
                </a>{' '}
                — Quantis 2.0 (PCIe/USB), 2024 · FIPS 140-2 / AIS 31 certified
              </li>
              <li className="text-xs text-muted-foreground">
                <a
                  href="/migrate?q=Quantinuum+Quantum+Origin"
                  className="text-primary underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Quantinuum Quantum Origin
                </a>{' '}
                — Cloud API, 2025 · First software QRNG with NIST SP 800-90B validation (April 2025)
              </li>
              <li className="text-xs text-muted-foreground">
                <a
                  href="/migrate?q=QuintessenceLabs+qStream"
                  className="text-primary underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  QuintessenceLabs qStream
                </a>{' '}
                — qStream 200 (PCIe/Network), 2024 · NIST SP 800-90B compliant
              </li>
            </ul>
          </div>

          {/* Related Standards */}
          <div className="pt-1 border-t border-border/50">
            <p className="text-xs font-medium text-foreground mb-2">Related Standards</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <a
                href="/library?ref=NIST-SP-800-90B"
                className="text-xs text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                NIST SP 800-90B — Entropy Source Requirements
              </a>
              <a
                href="/library?ref=NIST-SP-800-90A-R1"
                className="text-xs text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                NIST SP 800-90A — DRBG Mechanisms
              </a>
              <a
                href="/library?ref=NIST-SP-800-90C"
                className="text-xs text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                NIST SP 800-90C — RBG Constructions
              </a>
              <a
                href="/library?ref=NIST-SP-800-22-R1A"
                className="text-xs text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                NIST SP 800-22 — Statistical Test Suite
              </a>
              <a
                href="/library?ref=BSI-AIS-20-31"
                className="text-xs text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                BSI AIS 20/31 — TRNG/QRNG Certification
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
