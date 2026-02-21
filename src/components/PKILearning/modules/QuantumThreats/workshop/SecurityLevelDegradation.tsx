import React, { useState, useMemo } from 'react'
import { ALGORITHM_SECURITY_DATA, type AlgorithmSecurityData } from '../data/quantumConstants'

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
          <label
            htmlFor="degradation-algorithm-select"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Select Algorithm
          </label>
          <select
            id="degradation-algorithm-select"
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground"
          >
            <optgroup label="Classical Asymmetric">
              {ALGORITHM_SECURITY_DATA.filter(
                (a) => a.type === 'classical' && a.category === 'asymmetric'
              ).map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Symmetric">
              {ALGORITHM_SECURITY_DATA.filter((a) => a.category === 'symmetric').map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Hash Functions">
              {ALGORITHM_SECURITY_DATA.filter((a) => a.category === 'hash').map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Post-Quantum">
              {ALGORITHM_SECURITY_DATA.filter((a) => a.type === 'pqc').map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          </select>
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
            <div className="grid grid-cols-2 gap-3 text-sm">
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
        </div>
      )}
    </div>
  )
}
