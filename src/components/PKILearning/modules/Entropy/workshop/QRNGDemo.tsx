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

/**
 * Public CMVP Entropy Validation Certificates for QRNG noise sources.
 * Every field is copied from the certificate page on csrc.nist.gov, checked
 * 2026-09-24. Replaces an unsourced product-certification line: the CMVP
 * search found no such certificate, and a web search for a BSI entry
 * returned only vendor pages.
 */
const QRNG_ESV_CHECKED_ON = '2026-09-24'
const ESV_CERT_BASE =
  'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/'
const QRNG_ESV_CERTIFICATES = [
  {
    vendor: 'ID Quantique',
    cert: 'E63',
    certUrl: `${ESV_CERT_BASE}63`,
    catalogLink: '/migrate?q=ID+Quantique+Quantis+QRNG',
    implementation: 'IDQ Quantis IID QRNG',
    scope: 'QRNG chips IDQ250C2, IDQ250C3, IDQ6MC1, IDQ20MC1, IDQ20MC1-S1, IDQ20MC1-S3',
    validated: '2023-08-25',
  },
  {
    vendor: 'QuintessenceLabs',
    cert: 'E145',
    certUrl: `${ESV_CERT_BASE}145`,
    catalogLink: '/migrate?q=QuintessenceLabs+qStream',
    implementation: 'qStream 100',
    scope: 'version 1.5, quantum tunnelling diode noise source',
    validated: '2024-06-21',
  },
  {
    vendor: 'Quantinuum',
    cert: 'E214',
    certUrl: `${ESV_CERT_BASE}214`,
    catalogLink: '/migrate?q=Quantinuum+Quantum+Origin',
    implementation: 'Entropy Source for Quantum Origin',
    scope: 'version 3.4.1, noise source classified Non-Physical',
    validated: '2024-11-22',
  },
] as const

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
          <span className="font-semibold text-status-info">
            Simulation — no QRNG hardware involved.
          </span>{' '}
          The &ldquo;QRNG&rdquo; sample below is generated on load (and on Try Another Sample) by
          the browser&rsquo;s{' '}
          <code className="font-mono text-primary">crypto.getRandomValues()</code> — the same
          classical CSPRNG call the &ldquo;CSPRNG&rdquo; panel uses. It stands in for QRNG output so
          you can see the data flow and the tests; nothing here comes from a quantum device.
        </p>
      </div>

      {/* Explanation Header */}
      <div className="glass-panel p-4">
        <p className="text-sm text-foreground leading-relaxed">
          This tool compares three samples side by side: a simulated &ldquo;QRNG&rdquo; sample, a
          fresh sample from your browser&apos;s CSPRNG (Web Crypto API), and a deliberately broken
          weak PRNG. The first two are the same kind of output, so any difference in their results
          is sampling noise. The weak PRNG should visibly fail several tests, which shows what the
          tests can catch.
        </p>
      </div>

      {/* What this demo proves / does not prove */}
      <div
        data-testid="qrng-proves-panel"
        className="glass-panel p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">What this demo shows</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>
              Simple statistical tests catch grossly broken output, like the weak PRNG&apos;s.
            </li>
            <li>Good output from different generators looks the same to these tests.</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">What it does not show</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Anything about a real QRNG — no quantum device is involved.</li>
            <li>
              How much entropy any source has. SP 800-90B estimates entropy from at least 1,000,000
              raw noise-source samples, not from 64 or 128 bytes of final output.
            </li>
            <li>That any source is validated or certified.</li>
          </ul>
        </div>
      </div>

      <WhyThisMatters title="Statistical Tests vs. the Noise Source" variant="info">
        <p>
          A working CSPRNG and a working QRNG both produce output that passes standard statistical
          tests, so tests on output <strong>cannot tell them apart</strong>. Passing is the floor,
          not the differentiator.
        </p>
        <p>
          The difference is the <strong>noise source</strong>, which SP 800-90B calls &ldquo;the
          root of security for the entropy source and for the RBG as a whole&rdquo;. A QRNG&apos;s
          noise source is a quantum process. Whether a particular device actually delivers its
          claimed entropy is established the same way as for any other source: an SP 800-90B
          assessment of its raw data, plus health tests that detect failures in operation. The word
          &ldquo;quantum&rdquo; is not evidence.
        </p>
        <p>
          SP 800-90B specifies the requirements and validation tests for entropy sources; it does
          not certify anything. CMVP issues Entropy Validation Certificates after an accredited
          testing lab submits the source&apos;s SP 800-90B conformance justification. Statistical
          tests on output are not that evidence.
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
            <h2 className="text-sm font-semibold text-foreground">Simulated QRNG</h2>
          </div>
          <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">
            crypto.getRandomValues() stand-in
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
            <h2 className="text-sm font-semibold text-foreground">CSPRNG (OS Entropy)</h2>
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
            <h2 className="text-sm font-semibold text-foreground">Weak PRNG</h2>
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
            <p className="text-xs font-medium text-foreground mb-2">Simulated QRNG Bit Structure</p>
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
            <p className="text-xs font-medium text-foreground mb-2">
              Simulated QRNG Autocorrelation
            </p>
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
          <h2 className="text-sm font-semibold text-foreground">Comparison Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Test</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Sim. QRNG Value
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    Sim. QRNG
                  </th>
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
                        {/* Surfaces caveats like "small sample — estimate unreliable below
                            1,000 bytes" next to the pass/fail verdict, same as EntropyTestingDemo —
                            without this a Min-Entropy fail at the default 64/128-byte sizes reads
                            as "this data has detectable patterns" with no explanation. */}
                        <div className="text-[10px] text-muted-foreground/80 font-mono">
                          {qr.detail}
                        </div>
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
            <strong>Simulated QRNG</strong> and <strong>CSPRNG</strong> usually get the same
            verdicts because they are the same kind of output &mdash; the simulated QRNG sample is
            CSPRNG output. At 64 or 128 bytes the min-entropy line can fail for either; that is a
            small-sample effect, not a finding about the source.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Statistical tests measure <em>output patterns</em>, not <em>source security</em>. A
            CSPRNG seeded with a compromised value can produce output that passes every test while
            being predictable to whoever knows the seed. Choosing a QRNG is a decision about the
            noise source; it still needs SP 800-90B validation and an SP 800-90C construction like
            any other source.
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
          {/* QRNG noise sources with public CMVP entropy certificates */}
          <div className="pt-1 border-t border-border/50">
            <p className="text-xs font-medium text-foreground mb-2">
              QRNG noise sources with CMVP Entropy Validation Certificates
            </p>
            <ul className="space-y-1">
              {QRNG_ESV_CERTIFICATES.map((cert) => (
                <li key={cert.cert} className="text-xs text-muted-foreground">
                  <a
                    href={cert.catalogLink}
                    className="text-primary underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {cert.vendor}
                  </a>{' '}
                  —{' '}
                  <a
                    href={cert.certUrl}
                    className="text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Entropy Certificate #{cert.cert}
                  </a>
                  : &ldquo;{cert.implementation}&rdquo; ({cert.scope}), validated {cert.validated}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground mt-2">
              Checked on the CMVP entropy-validation search on {QRNG_ESV_CHECKED_ON}. A certificate
              covers the implementation and versions it lists, not a vendor&apos;s whole product
              line.
            </p>
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
                BSI AIS 20/31 — Functionality Classes for RNGs
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
