/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Circle,
  Server,
  Terminal,
  Info,
} from 'lucide-react'
import { HSM_PKCS11_OPERATIONS, HSM_VENDORS, STATUS_LABELS } from '../data/hsmVendorData'

export const HSMSimulator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [showVendors, setShowVendors] = useState(false)

  const operation = HSM_PKCS11_OPERATIONS[currentStep]

  const markComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    if (currentStep < HSM_PKCS11_OPERATIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">HSM Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Step through simulated PKCS#11 operations on a post-quantum HSM. Each step shows the
          actual API call, what happens inside the HSM, and the expected output.
        </p>
      </div>

      {/* Operation stepper */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {HSM_PKCS11_OPERATIONS.map((op, idx) => (
            <button
              key={op.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                idx === currentStep
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : completedSteps.has(idx)
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {completedSteps.has(idx) ? <CheckCircle size={12} /> : <Circle size={12} />}
              <span className="hidden sm:inline">Step {op.step}</span>
              <span className="sm:hidden">{op.step}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{
            width: `${(completedSteps.size / HSM_PKCS11_OPERATIONS.length) * 100}%`,
          }}
        />
      </div>

      {/* Current operation detail */}
      {operation && (
        <div className="glass-panel p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Server size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  Step {operation.step} of {HSM_PKCS11_OPERATIONS.length}
                </span>
              </div>
              <h4 className="text-xl font-bold text-foreground">{operation.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{operation.description}</p>
            </div>
          </div>

          {/* PKCS#11 Command */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={14} className="text-secondary" />
              <h5 className="text-sm font-bold text-foreground">PKCS#11 API Call</h5>
            </div>
            <pre className="text-[10px] bg-background p-4 rounded border border-border overflow-x-auto font-mono whitespace-pre">
              {operation.command}
            </pre>
          </div>

          {/* Detail explanation */}
          <div className="mb-4 bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80">{operation.detail}</p>
            </div>
          </div>

          {/* Output */}
          <div>
            <h5 className="text-sm font-bold text-foreground mb-2">Expected Output</h5>
            <pre className="text-[10px] bg-success/5 p-4 rounded border border-success/20 overflow-x-auto font-mono whitespace-pre text-success">
              {operation.output}
            </pre>
          </div>
        </div>
      )}

      {/* Operation flow diagram */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">PQC HSM Operation Flow</h4>
        <div className="space-y-2 text-center">
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                currentStep === 0
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : completedSteps.has(0)
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted/50 text-muted-foreground border-border'
              }`}
            >
              1. Generate Key Pair
            </div>
            <div
              className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                currentStep === 1
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : completedSteps.has(1)
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted/50 text-muted-foreground border-border'
              }`}
            >
              2. Export Public Key
            </div>
            <div
              className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                currentStep === 2
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : completedSteps.has(2)
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted/50 text-muted-foreground border-border'
              }`}
            >
              3. Wrap (Encapsulate)
            </div>
          </div>
          <div className="text-muted-foreground text-xs">&darr;</div>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                currentStep === 3
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : completedSteps.has(3)
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted/50 text-muted-foreground border-border'
              }`}
            >
              4. Unwrap (Decapsulate)
            </div>
            <div
              className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                currentStep === 4
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : completedSteps.has(4)
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted/50 text-muted-foreground border-border'
              }`}
            >
              5. Sign (ML-DSA)
            </div>
            <div
              className={`p-2 rounded border text-[10px] font-bold transition-colors ${
                currentStep === 5
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : completedSteps.has(5)
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted/50 text-muted-foreground border-border'
              }`}
            >
              6. Verify (ML-DSA)
            </div>
          </div>
        </div>
      </div>

      {/* HSM Vendor Comparison Toggle */}
      <div className="glass-panel p-6">
        <button
          onClick={() => setShowVendors(!showVendors)}
          className="flex items-center gap-2 text-sm font-bold text-foreground w-full"
        >
          <Server size={16} className="text-primary" />
          HSM Vendor PQC Support
          <ChevronRight
            size={14}
            className={`text-muted-foreground transition-transform ml-auto ${showVendors ? 'rotate-90' : ''}`}
          />
        </button>
        {showVendors && (
          <div className="mt-4 space-y-2">
            {HSM_VENDORS.map((vendor) => {
              const status = STATUS_LABELS[vendor.pqcSupportStatus]
              return (
                <div key={vendor.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          {vendor.name} {vendor.product}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {vendor.fips140Level} &bull; {vendor.formFactor.toUpperCase()} &bull; FW{' '}
                        {vendor.firmwareVersion}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {vendor.supportedPQCAlgorithms.map((algo) => (
                          <span
                            key={algo}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                          >
                            {algo}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{vendor.notes}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm rounded border border-border hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          onClick={markComplete}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors"
        >
          {completedSteps.has(currentStep) ? (
            <>
              <CheckCircle size={14} /> Completed
            </>
          ) : currentStep === HSM_PKCS11_OPERATIONS.length - 1 ? (
            <>
              Mark Complete <CheckCircle size={14} />
            </>
          ) : (
            <>
              Complete &amp; Next <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
