// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, HardDrive, FlaskConical, Database } from 'lucide-react'
import { Button } from '../ui/button'

interface AlgorithmInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AlgorithmInfoModal({ isOpen, onClose }: AlgorithmInfoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50 print:hidden"
          />

          <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel p-6 max-w-lg w-full max-h-[85dvh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="algorithm-info-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 id="algorithm-info-modal-title" className="text-lg font-bold text-foreground">
                  About This Data
                </h2>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Performance Data */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-primary shrink-0" />
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Performance Data
                  </p>
                </div>
                <div className="space-y-2 pl-1">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Performance is expressed as{' '}
                      <span className="font-medium text-foreground">relative cycle counts</span>{' '}
                      (e.g., 1x, 10x, 50x) benchmarked against classical baselines &mdash; RSA-2048
                      for KEMs and ECDSA-P256 for digital signatures.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Values are compiled from NIST PQC submission documents, Round 3 evaluation
                      reports, and published benchmarks on x86-64 reference platforms.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Three categories: <span className="font-medium text-foreground">Fast</span>{' '}
                      (&le;1x baseline),{' '}
                      <span className="font-medium text-foreground">Moderate</span> (&le;10x), and{' '}
                      <span className="font-medium text-foreground">Slow</span> (&gt;10x).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Stack RAM figures are taken from algorithm authors&apos; reference
                      implementations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Size Data */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive size={14} className="text-primary shrink-0" />
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Size Data
                  </p>
                </div>
                <div className="space-y-2 pl-1">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Public key, private key, signature/ciphertext, and shared secret sizes are
                      shown in <span className="font-medium text-foreground">exact bytes</span>{' '}
                      &mdash; not estimates.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sourced from NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
                      specifications and algorithm authors&apos; published parameter tables.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verify It Yourself */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FlaskConical size={14} className="text-primary shrink-0" />
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Verify It Yourself
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-1">
                  You can independently verify both performance and sizes using two tools built into
                  this app:
                </p>
                <div className="space-y-2 pl-1">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <Link
                        to="/playground"
                        onClick={onClose}
                        className="font-medium text-primary hover:underline"
                      >
                        Playground
                      </Link>{' '}
                      &mdash; run ML-KEM, ML-DSA, SLH-DSA, and other PQC algorithms in-browser to
                      see actual key and signature sizes, plus timing measurements.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <Link
                        to="/openssl"
                        onClick={onClose}
                        className="font-medium text-primary hover:underline"
                      >
                        OpenSSL Studio
                      </Link>{' '}
                      &mdash; execute OpenSSL commands against the in-browser WASM build to generate
                      keys, sign data, and measure sizes directly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Sources */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database size={14} className="text-primary shrink-0" />
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Data Sources
                  </p>
                </div>
                <ul className="space-y-2 pl-1">
                  {[
                    'NIST FIPS 203 / 204 / 205 final specifications',
                    'NIST PQC Standardization Round 3 evaluation reports',
                    'Algorithm submission packages and reference implementations',
                    'pqc_complete_algorithm_reference CSV (bundled with this app)',
                  ].map((source, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{source}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
