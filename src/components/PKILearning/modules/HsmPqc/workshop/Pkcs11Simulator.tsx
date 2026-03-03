// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Play, ChevronDown, ChevronUp, CheckCircle, Server, Cloud, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HSM_PKCS11_OPERATIONS, HSM_VENDORS, STATUS_LABELS } from '../data/hsmVendorData'

export const Pkcs11Simulator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [expandedClassical, setExpandedClassical] = useState<number | null>(null)
  const [expandedVendor, setExpandedVendor] = useState<number | null>(null)
  const [showVendorSummary, setShowVendorSummary] = useState(false)

  const operations = HSM_PKCS11_OPERATIONS
  const currentOp = operations[currentStep]

  const handleExecuteStep = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
  }, [currentStep])

  const handleNext = useCallback(() => {
    if (currentStep < operations.length - 1) {
      setCurrentStep(currentStep + 1)
      setExpandedClassical(null)
      setExpandedVendor(null)
    }
  }, [currentStep, operations.length])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setExpandedClassical(null)
      setExpandedVendor(null)
    }
  }, [currentStep])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setExpandedClassical(null)
    setExpandedVendor(null)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">PKCS#11 PQC Operation Simulator</h3>
        <p className="text-sm text-muted-foreground">
          Step through 8 PKCS#11 operations demonstrating PQC key generation, encapsulation,
          signing, and stateful signature management. Each step shows the API call, expected output,
          and vendor support comparison.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Operation {currentStep + 1} of {operations.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {completedSteps.size} / {operations.length} completed
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${(completedSteps.size / operations.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Operation Flow Diagram — 4x2 grid */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Operation Flow</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {operations.map((op, idx) => (
            <button
              key={op.id}
              onClick={() => {
                setCurrentStep(idx)
                setExpandedClassical(null)
                setExpandedVendor(null)
              }}
              className={`text-left rounded-lg p-2 border text-xs transition-colors ${
                idx === currentStep
                  ? 'border-primary bg-primary/10 text-primary'
                  : completedSteps.has(idx)
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                {completedSteps.has(idx) ? (
                  <CheckCircle size={10} className="text-success shrink-0" />
                ) : (
                  <span className="text-[10px] font-bold">{op.step}.</span>
                )}
                <span className="font-medium truncate">
                  {op.name.split(' ').slice(0, 3).join(' ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Operation Detail */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-foreground">
              Step {currentOp.step}: {currentOp.name}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{currentOp.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleReset} className="text-xs">
              <RotateCcw size={12} className="mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* PKCS#11 API Call */}
        <div className="mb-4">
          <h5 className="text-xs font-bold text-muted-foreground mb-2">PKCS#11 API Call</h5>
          <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
            <pre className="text-xs font-mono text-foreground whitespace-pre">
              {currentOp.command}
            </pre>
          </div>
        </div>

        {/* Detail */}
        <div className="mb-4">
          <h5 className="text-xs font-bold text-muted-foreground mb-2">Detail</h5>
          <p className="text-sm text-foreground/80">{currentOp.detail}</p>
        </div>

        {/* Execute Button */}
        {!completedSteps.has(currentStep) ? (
          <Button variant="gradient" onClick={handleExecuteStep} className="mb-4">
            <Play size={14} className="mr-1" fill="currentColor" />
            Execute Operation
          </Button>
        ) : (
          <div className="mb-4">
            {/* Expected Output */}
            <h5 className="text-xs font-bold text-muted-foreground mb-2">Expected Output</h5>
            <div className="bg-success/5 rounded-lg p-4 border border-success/20 animate-fade-in">
              <pre className="text-xs font-mono text-foreground whitespace-pre">
                {currentOp.output}
              </pre>
            </div>
          </div>
        )}

        {/* Classical Comparison (collapsible) */}
        {currentOp.classicalEquivalent && (
          <div className="border border-border rounded-lg overflow-hidden mb-3">
            <button
              onClick={() =>
                setExpandedClassical(expandedClassical === currentStep ? null : currentStep)
              }
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 text-sm font-medium text-foreground"
            >
              <span>Classical Comparison</span>
              {expandedClassical === currentStep ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </button>
            {expandedClassical === currentStep && (
              <div className="px-4 py-3 text-sm text-foreground/80 animate-fade-in">
                <p className="font-mono text-xs">{currentOp.classicalEquivalent}</p>
              </div>
            )}
          </div>
        )}

        {/* On-Prem vs Cloud Notes (collapsible) */}
        {currentOp.vendorNotes && (
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedVendor(expandedVendor === currentStep ? null : currentStep)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 text-sm font-medium text-foreground"
            >
              <span>On-Prem vs Cloud</span>
              {expandedVendor === currentStep ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </button>
            {expandedVendor === currentStep && (
              <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    <Server size={12} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">On-Prem</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentOp.vendorNotes.onPrem}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    <Cloud size={12} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">Cloud</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentOp.vendorNotes.cloud}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          &larr; Previous
        </Button>
        {currentStep < operations.length - 1 ? (
          <Button variant="outline" onClick={handleNext}>
            Next &rarr;
          </Button>
        ) : (
          <Button variant="gradient" onClick={() => setShowVendorSummary(!showVendorSummary)}>
            {showVendorSummary ? 'Hide' : 'Show'} Vendor Summary
          </Button>
        )}
      </div>

      {/* Vendor Summary (expandable at bottom) */}
      {showVendorSummary && (
        <div className="glass-panel p-6 animate-fade-in">
          <h4 className="text-base font-bold text-foreground mb-4">
            HSM Vendor PQC Support Summary
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Vendor</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Product</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithms</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">FIPS</th>
                </tr>
              </thead>
              <tbody>
                {HSM_VENDORS.map((vendor) => {
                  const statusInfo = STATUS_LABELS[vendor.pqcSupportStatus]
                  return (
                    <tr key={vendor.id} className="border-b border-border/50">
                      <td className="p-2 text-xs font-bold text-foreground">{vendor.name}</td>
                      <td className="p-2 text-xs text-muted-foreground">{vendor.product}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            vendor.type === 'on-prem'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-secondary/10 text-secondary'
                          }`}
                        >
                          {vendor.type}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {vendor.supportedPQCAlgorithms.slice(0, 2).join(', ')}
                        {vendor.supportedPQCAlgorithms.length > 2 && '...'}
                      </td>
                      <td className="p-2 text-xs text-center text-muted-foreground">
                        {vendor.fips140Level.replace('FIPS ', '').substring(0, 12)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> This simulator demonstrates the PKCS#11 API call sequence and
          expected outputs for PQC HSM operations. In a production environment, these operations
          execute within the HSM&apos;s FIPS 140-3 validated security boundary. All outputs shown
          are representative of actual API responses. This is for educational purposes only.
        </p>
      </div>
    </div>
  )
}
