// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Cpu } from 'lucide-react'
import { FilterDropdown, type FilterDropdownItem } from '@/components/common/FilterDropdown'
import {
  ALGORITHM_SECURITY_DATA,
  CURRENT_QUANTUM_COMPUTERS,
  type AlgorithmSecurityData,
} from '../data/quantumConstants'

interface SecurityLevelDegradationProps {
  initialAlgorithm?: string
}

export const SecurityLevelDegradation: React.FC<SecurityLevelDegradationProps> = ({
  initialAlgorithm,
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(
    initialAlgorithm || ALGORITHM_SECURITY_DATA[0].name
  )

  const algorithmData = useMemo(
    () => ALGORITHM_SECURITY_DATA.find((a) => a.name === selectedAlgorithm),
    [selectedAlgorithm]
  )

  const algorithmItems: FilterDropdownItem[] = useMemo(() => {
    const groups = [
      {
        label: 'Classical Asymmetric',
        items: ALGORITHM_SECURITY_DATA.filter(
          (a) => a.type === 'classical' && a.category === 'asymmetric'
        ),
      },
      {
        label: 'Symmetric',
        items: ALGORITHM_SECURITY_DATA.filter((a) => a.category === 'symmetric'),
      },
      {
        label: 'Hash Functions',
        items: ALGORITHM_SECURITY_DATA.filter((a) => a.category === 'hash'),
      },
      {
        label: 'Post-Quantum',
        items: ALGORITHM_SECURITY_DATA.filter((a) => a.type === 'pqc'),
      },
    ]
    return groups.flatMap((group) => group.items.map((a) => ({ id: a.name, label: `${a.name}` })))
  }, [])

  const maxBits = 256

  const getStatusColor = (status: AlgorithmSecurityData['status']) => {
    switch (status) {
      case 'broken':
        return 'text-destructive'
      case 'weakened':
        return 'text-warning'
      case 'safe':
        return 'text-success'
    }
  }

  const getBarColor = (status: AlgorithmSecurityData['status']) => {
    switch (status) {
      case 'broken':
        return 'bg-destructive'
      case 'weakened':
        return 'bg-warning'
      case 'safe':
        return 'bg-success'
    }
  }

  const getAttackLabel = (attack: AlgorithmSecurityData['quantumAttack']) => {
    switch (attack) {
      case 'shor':
        return "Shor's Algorithm"
      case 'grover':
        return "Grover's Algorithm"
      case 'none':
        return 'No known quantum attack'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Security Level Degradation</h3>
        <p className="text-sm text-muted-foreground">
          Select an algorithm to see how its security level changes under quantum attack.
        </p>
      </div>

      {/* Algorithm selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <FilterDropdown
            label="Select Algorithm"
            items={algorithmItems}
            selectedId={selectedAlgorithm}
            onSelect={setSelectedAlgorithm}
            noContainer
            className="w-full"
          />
        </div>

        {algorithmData && (
          <>
            <div>
              <span className="block text-xs font-medium text-muted-foreground mb-1">
                Quantum Attack Type
              </span>
              <div className="bg-muted/50 border border-border rounded px-3 py-2 text-sm">
                {getAttackLabel(algorithmData.quantumAttack)}
              </div>
            </div>
            <div>
              <span className="block text-xs font-medium text-muted-foreground mb-1">
                Post-Quantum Status
              </span>
              <div
                className={`bg-muted/50 border border-border rounded px-3 py-2 text-sm font-bold ${getStatusColor(algorithmData.status)}`}
              >
                {algorithmData.status === 'broken'
                  ? 'BROKEN'
                  : algorithmData.status === 'weakened'
                    ? 'WEAKENED'
                    : 'SAFE'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visual comparison */}
      {algorithmData && (
        <div className="space-y-4">
          <div className="glass-panel p-4">
            <div className="space-y-4">
              {/* Classical security bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Classical Security</span>
                  <span className="font-bold text-foreground">
                    {algorithmData.classicalBits}-bit
                  </span>
                </div>
                <div className="h-8 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${(algorithmData.classicalBits / maxBits) * 100}%` }}
                  >
                    <span className="text-[10px] font-bold text-black">
                      {algorithmData.classicalBits}-bit
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantum security bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Quantum Security</span>
                  <span className={`font-bold ${getStatusColor(algorithmData.status)}`}>
                    {algorithmData.quantumBits}-bit
                  </span>
                </div>
                <div className="h-8 bg-muted/30 rounded-full overflow-hidden">
                  {algorithmData.quantumBits > 0 ? (
                    <div
                      className={`h-full ${getBarColor(algorithmData.status)} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${(algorithmData.quantumBits / maxBits) * 100}%` }}
                    >
                      <span className="text-[10px] font-bold text-black">
                        {algorithmData.quantumBits}-bit
                      </span>
                    </div>
                  ) : (
                    <div className="h-full flex items-center pl-3">
                      <span className="text-xs font-bold text-destructive">
                        0-bit — Completely broken
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reduction indicator */}
              <div className="text-center">
                {algorithmData.quantumBits === algorithmData.classicalBits ? (
                  <span className="text-sm font-bold text-success">
                    No security reduction — quantum-resistant
                  </span>
                ) : algorithmData.quantumBits === 0 ? (
                  <span className="text-sm font-bold text-destructive">
                    100% security loss — {algorithmData.classicalBits}-bit → 0-bit
                  </span>
                ) : (
                  <span className="text-sm font-bold text-warning">
                    {Math.round(
                      ((algorithmData.classicalBits - algorithmData.quantumBits) /
                        algorithmData.classicalBits) *
                        100
                    )}
                    % security reduction — {algorithmData.classicalBits}-bit →{' '}
                    {algorithmData.quantumBits}-bit
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Algorithm Type:</span>
                <span className="ml-2 font-medium capitalize">{algorithmData.category}</span>
              </div>
              {algorithmData.estimatedQubits && (
                <div>
                  <span className="text-muted-foreground">Est. Qubits:</span>
                  <span className="ml-2 font-medium">
                    ~{algorithmData.estimatedQubits.toLocaleString()} logical
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{algorithmData.notes}</p>
          </div>

          {/* Panel A — Qubit gap: required logical vs. today's physical */}
          {algorithmData.estimatedQubits && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  Qubit Gap: Required vs. Today&apos;s Hardware
                </h4>
              </div>

              {/* Required — full-width reference bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Required to break (logical qubits)</span>
                  <span className="font-bold text-destructive">
                    ~{algorithmData.estimatedQubits.toLocaleString()}
                  </span>
                </div>
                <div className="h-4 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-destructive/70 rounded-full w-full" />
                </div>
              </div>

              {/* One bar per machine — physical qubits scaled against required logical */}
              {CURRENT_QUANTUM_COMPUTERS.map((qc) => {
                const pct = Math.min(
                  (qc.physicalQubits / algorithmData.estimatedQubits!) * 100,
                  100
                )
                return (
                  <div key={`${qc.vendor}-${qc.name}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {qc.vendor} {qc.name} ({qc.year}) — physical
                      </span>
                      <span className="font-bold text-primary">
                        {qc.physicalQubits.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              <p className="text-xs text-muted-foreground">
                Physical qubits (blue) are not interchangeable with logical qubits (red) — see the
                error-correction overhead breakdown below.
              </p>
            </div>
          )}

          {/* Panel B — Physical/logical ratio per machine */}
          {algorithmData.estimatedQubits && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  Physical → Logical Overhead
                </h4>
              </div>

              <p className="text-xs text-muted-foreground">
                Fault-tolerant computation requires many noisy physical qubits to produce one
                reliable logical qubit. The ratio depends on gate fidelity and error-correction
                scheme. The last column shows how many physical qubits this attack would need at
                each machine&apos;s current ratio.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-1 pr-2 text-muted-foreground font-medium">
                        Machine
                      </th>
                      <th className="text-right py-1 px-2 text-muted-foreground font-medium">
                        Physical
                      </th>
                      <th className="text-right py-1 px-2 text-muted-foreground font-medium">
                        Logical*
                      </th>
                      <th className="text-right py-1 px-2 text-muted-foreground font-medium">
                        Ratio
                      </th>
                      <th className="text-right py-1 pl-2 text-muted-foreground font-medium">
                        Physical needed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CURRENT_QUANTUM_COMPUTERS.map((qc) => {
                      const ratio = Math.round(qc.physicalQubits / qc.estimatedLogicalQubits)
                      const physicalNeeded = algorithmData.estimatedQubits! * ratio
                      return (
                        <tr
                          key={`ratio-${qc.vendor}-${qc.name}`}
                          className="border-b border-border/30"
                        >
                          <td className="py-1.5 pr-2 text-foreground">
                            {qc.vendor} {qc.name}
                          </td>
                          <td className="py-1.5 px-2 text-right text-primary">
                            {qc.physicalQubits.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-2 text-right text-success">
                            ~{qc.estimatedLogicalQubits}
                          </td>
                          <td className="py-1.5 px-2 text-right text-warning">
                            {ratio.toLocaleString()}:1
                          </td>
                          <td className="py-1.5 pl-2 text-right text-destructive font-medium">
                            ~{physicalNeeded.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-muted-foreground">
                * Estimated logical qubits based on published experimental results. Full
                fault-tolerant operation for cryptographic attacks is projected to require ~1,000:1
                physical-to-logical at scale. &quot;Physical needed&quot; = required logical qubits
                × this machine&apos;s current ratio.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
