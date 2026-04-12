// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { Package, FileText, Loader2, CheckCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOCK_RPM_PACKAGE, SIGNING_MODES, type SigningMode } from '../constants'

type SigningModeId = 'classical' | 'pqc' | 'hybrid'

interface SigningResult {
  mode: SigningMode
  headerHex: string
  steps: string[]
  timestamp: string
}

/** Generate realistic-looking hex string */
function generateHex(bytes: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}

export const PackageSigning: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<SigningModeId>('hybrid')
  const [signingResult, setSigningResult] = useState<SigningResult | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)

  const activeMode = SIGNING_MODES.find((m) => m.id === selectedMode)!

  const handleSignPackage = useCallback(async () => {
    setIsSigning(true)
    setSigningResult(null)
    setCurrentStep(0)

    const steps =
      selectedMode === 'hybrid'
        ? [
            'Computing SHA-256 digest of RPM payload...',
            'Generating ML-DSA-87 signature over digest...',
            'Generating Ed448 signature over digest...',
            'Building composite signature header...',
            'Attaching RPM signature tags (RPMSIGTAG_PQC)...',
            'Writing signed RPM header...',
          ]
        : selectedMode === 'pqc'
          ? [
              'Computing SHA-256 digest of RPM payload...',
              'Generating ML-DSA-87 signature over digest...',
              'Attaching RPM signature tag (RPMSIGTAG_PQC)...',
              'Writing signed RPM header...',
            ]
          : [
              'Computing SHA-256 digest of RPM payload...',
              'Generating RSA-4096 signature over digest...',
              'Attaching RPM signature tag (RPMSIGTAG_RSA)...',
              'Writing signed RPM header...',
            ]

    // Animate through steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i)
      await new Promise((resolve) => setTimeout(resolve, 400))
    }

    setSigningResult({
      mode: activeMode,
      headerHex: generateHex(activeMode.sigSize),
      steps,
      timestamp: new Date().toISOString(),
    })
    setCurrentStep(-1)
    setIsSigning(false)
  }, [selectedMode, activeMode])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">RPM Package Signing Simulation</h3>
        <p className="text-sm text-muted-foreground">
          Simulate signing an RPM package with classical, PQC, or hybrid algorithms. Compare
          signature sizes and compatibility across signing modes.
        </p>
      </div>

      {/* Mock Package Info */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Package Details</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Name</div>
            <div className="text-sm font-mono text-foreground">{MOCK_RPM_PACKAGE.name}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Version</div>
            <div className="text-sm font-mono text-foreground">
              {MOCK_RPM_PACKAGE.version}-{MOCK_RPM_PACKAGE.release}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Architecture</div>
            <div className="text-sm font-mono text-foreground">{MOCK_RPM_PACKAGE.arch}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Size</div>
            <div className="text-sm font-mono text-foreground">
              {MOCK_RPM_PACKAGE.sizeKB.toLocaleString()} KB
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[10px] font-bold text-muted-foreground mb-1">Files</div>
          <div className="bg-background rounded p-2 border border-border">
            {MOCK_RPM_PACKAGE.files.map((file) => (
              <div key={file} className="flex items-center gap-2 py-0.5">
                <FileText size={10} className="text-muted-foreground shrink-0" />
                <span className="font-mono text-[11px] text-foreground">{file}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signing Mode Selection */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Select Signing Mode</h4>
        <div className="flex flex-wrap gap-2">
          {SIGNING_MODES.map((mode) => (
            <Button
              variant="ghost"
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode.id as SigningModeId)
                setSigningResult(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMode === mode.id
                  ? mode.id === 'classical'
                    ? 'bg-warning/20 text-warning border border-warning/50'
                    : mode.id === 'pqc'
                      ? 'bg-success/20 text-success border border-success/50'
                      : 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              <div>{mode.label}</div>
              <div className="text-[10px] opacity-70">{mode.algorithm}</div>
            </Button>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Signature size: <span className="font-mono">{activeMode.sigSize.toLocaleString()}</span>{' '}
          bytes &middot; Verification: {activeMode.verifyTime} &middot; Compatibility:{' '}
          {activeMode.compatible}
        </div>
      </div>

      {/* Sign Button */}
      <div className="flex justify-center">
        <Button
          variant="gradient"
          onClick={handleSignPackage}
          disabled={isSigning}
          className="text-sm px-6"
        >
          {isSigning ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" /> Signing Package...
            </>
          ) : (
            <>
              <Shield size={14} className="mr-2" /> Sign Package
            </>
          )}
        </Button>
      </div>

      {/* Signing Steps Animation */}
      {isSigning && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Signing Progress</h4>
          <div className="space-y-2">
            {(selectedMode === 'hybrid'
              ? [
                  'Computing SHA-256 digest of RPM payload...',
                  'Generating ML-DSA-87 signature over digest...',
                  'Generating Ed448 signature over digest...',
                  'Building composite signature header...',
                  'Attaching RPM signature tags (RPMSIGTAG_PQC)...',
                  'Writing signed RPM header...',
                ]
              : selectedMode === 'pqc'
                ? [
                    'Computing SHA-256 digest of RPM payload...',
                    'Generating ML-DSA-87 signature over digest...',
                    'Attaching RPM signature tag (RPMSIGTAG_PQC)...',
                    'Writing signed RPM header...',
                  ]
                : [
                    'Computing SHA-256 digest of RPM payload...',
                    'Generating RSA-4096 signature over digest...',
                    'Attaching RPM signature tag (RPMSIGTAG_RSA)...',
                    'Writing signed RPM header...',
                  ]
            ).map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 text-sm transition-opacity ${
                  idx <= currentStep ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {idx < currentStep ? (
                  <CheckCircle size={14} className="text-success shrink-0" />
                ) : idx === currentStep ? (
                  <Loader2 size={14} className="animate-spin text-primary shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                )}
                <span
                  className={`font-mono text-xs ${idx <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signing Result */}
      {signingResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Signature Header */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-success" />
              <h4 className="text-sm font-bold text-foreground">Package Signed Successfully</h4>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Algorithm:</span>{' '}
                <span className="font-mono text-foreground">{signingResult.mode.algorithm}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Signature Size:</span>{' '}
                <span className="font-mono text-foreground">
                  {signingResult.mode.sigSize.toLocaleString()} bytes
                </span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Timestamp:</span>{' '}
                <span className="font-mono text-foreground">{signingResult.timestamp}</span>
              </div>
            </div>

            {/* RPM Signature Header Structure */}
            <div className="mt-3">
              <div className="text-xs font-bold text-foreground mb-2">
                RPM Signature Header Structure
              </div>
              <div className="bg-background rounded-lg p-3 border border-border font-mono text-[11px] text-foreground space-y-1">
                <div className="text-muted-foreground">
                  # rpm --query --qf &apos;%&#123;SIGPGP&#125;\n&apos;
                </div>
                <div>
                  <span className="text-primary">Header Tag:</span> RPMSIGTAG_
                  {selectedMode === 'classical' ? 'RSA' : 'PQC'}
                </div>
                <div>
                  <span className="text-primary">Algorithm:</span> {signingResult.mode.algorithm}
                </div>
                <div>
                  <span className="text-primary">Hash:</span> SHA-256
                </div>
                <div>
                  <span className="text-primary">Signature:</span>
                </div>
                <div className="ml-4 text-[10px] text-muted-foreground break-all">
                  {signingResult.headerHex.slice(0, 128)}...
                </div>
                {selectedMode === 'hybrid' && (
                  <>
                    <div className="mt-1 text-muted-foreground">
                      # Composite signature contains both:
                    </div>
                    <div className="ml-4">
                      <span className="text-success">ML-DSA-87:</span> 4,627 bytes
                    </div>
                    <div className="ml-4">
                      <span className="text-warning">Ed448:</span> 114 bytes
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="rounded-lg p-4 border bg-success/10 border-success/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-success" />
              <span className="text-sm font-bold text-success">Verification Passed</span>
            </div>
            <div className="font-mono text-[11px] text-foreground space-y-1">
              <div className="text-muted-foreground">
                $ rpm --checksig {MOCK_RPM_PACKAGE.name}-{MOCK_RPM_PACKAGE.version}-
                {MOCK_RPM_PACKAGE.release}.{MOCK_RPM_PACKAGE.arch}.rpm
              </div>
              <div>
                {MOCK_RPM_PACKAGE.name}-{MOCK_RPM_PACKAGE.version}-{MOCK_RPM_PACKAGE.release}.
                {MOCK_RPM_PACKAGE.arch}.rpm: digests signatures OK
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Signing Mode Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Mode</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right p-2 text-muted-foreground font-medium">Sig Size</th>
                <th className="text-right p-2 text-muted-foreground font-medium">Verify Time</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Compatibility</th>
              </tr>
            </thead>
            <tbody>
              {SIGNING_MODES.map((mode) => (
                <tr
                  key={mode.id}
                  className={`border-b border-border/50 ${mode.id === selectedMode ? 'bg-primary/5' : ''}`}
                >
                  <td className="p-2 font-medium text-foreground">
                    {mode.label}
                    {mode.id === selectedMode && (
                      <span className="ml-2 text-[10px] text-primary font-bold">(selected)</span>
                    )}
                  </td>
                  <td className="p-2 font-mono text-xs text-foreground">{mode.algorithm}</td>
                  <td className="p-2 text-right font-mono text-xs text-foreground">
                    {mode.sigSize.toLocaleString()} B
                  </td>
                  <td className="p-2 text-right font-mono text-xs text-foreground">
                    {mode.verifyTime}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">{mode.compatible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> This simulation demonstrates the RPM package signing workflow with
          realistic signature sizes. Red Hat has implemented hybrid ML-DSA-87+Ed448 composite
          signatures in RHEL 10, making it the first major Linux distribution to ship PQC package
          signing. The composite approach ensures backward compatibility &mdash; older RPM tools can
          still verify the Ed448 component.
        </p>
      </div>
    </div>
  )
}
