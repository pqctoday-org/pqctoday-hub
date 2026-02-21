import React, { useState } from 'react'
import { ALGORITHM_SECURITY_DATA } from '../data/quantumConstants'

interface KeySizeAnalyzerProps {
  initialAlgorithmA?: string
  initialAlgorithmB?: string
}

export const KeySizeAnalyzer: React.FC<KeySizeAnalyzerProps> = ({
  initialAlgorithmA,
  initialAlgorithmB,
}) => {
  const [algorithmA, setAlgorithmA] = useState(initialAlgorithmA || 'RSA-2048')
  const [algorithmB, setAlgorithmB] = useState(initialAlgorithmB || 'ML-KEM-768')

  const dataA = ALGORITHM_SECURITY_DATA.find((a) => a.name === algorithmA)
  const dataB = ALGORITHM_SECURITY_DATA.find((a) => a.name === algorithmB)

  const algorithmNames = ALGORITHM_SECURITY_DATA.map((a) => a.name)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'broken':
        return (
          <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold">
            BROKEN
          </span>
        )
      case 'weakened':
        return (
          <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
            WEAKENED
          </span>
        )
      case 'safe':
        return (
          <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
            SAFE
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Key Size Analyzer</h3>
        <p className="text-sm text-muted-foreground">
          Compare two algorithms side-by-side to see how their security profiles differ under
          quantum attack.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="algorithm-a-select"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Algorithm A
          </label>
          <select
            id="algorithm-a-select"
            value={algorithmA}
            onChange={(e) => setAlgorithmA(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground"
          >
            {algorithmNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="algorithm-b-select"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Algorithm B
          </label>
          <select
            id="algorithm-b-select"
            value={algorithmB}
            onChange={(e) => setAlgorithmB(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground"
          >
            {algorithmNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison table */}
      {dataA && dataB && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Property</th>
                <th className="text-center p-3 text-primary font-bold">{dataA.name}</th>
                <th className="text-center p-3 text-secondary font-bold">{dataB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground">Type</td>
                <td className="p-3 text-center capitalize">{dataA.type}</td>
                <td className="p-3 text-center capitalize">{dataB.type}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground">Category</td>
                <td className="p-3 text-center capitalize">{dataA.category}</td>
                <td className="p-3 text-center capitalize">{dataB.category}</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground">Classical Security</td>
                <td className="p-3 text-center font-bold">{dataA.classicalBits}-bit</td>
                <td className="p-3 text-center font-bold">{dataB.classicalBits}-bit</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground">Quantum Security</td>
                <td className="p-3 text-center font-bold">
                  <span
                    className={
                      dataA.status === 'broken'
                        ? 'text-destructive'
                        : dataA.status === 'weakened'
                          ? 'text-warning'
                          : 'text-success'
                    }
                  >
                    {dataA.quantumBits}-bit
                  </span>
                </td>
                <td className="p-3 text-center font-bold">
                  <span
                    className={
                      dataB.status === 'broken'
                        ? 'text-destructive'
                        : dataB.status === 'weakened'
                          ? 'text-warning'
                          : 'text-success'
                    }
                  >
                    {dataB.quantumBits}-bit
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground">Security Reduction</td>
                <td className="p-3 text-center">
                  {dataA.quantumBits === dataA.classicalBits
                    ? 'None'
                    : dataA.quantumBits === 0
                      ? '100%'
                      : `${Math.round(((dataA.classicalBits - dataA.quantumBits) / dataA.classicalBits) * 100)}%`}
                </td>
                <td className="p-3 text-center">
                  {dataB.quantumBits === dataB.classicalBits
                    ? 'None'
                    : dataB.quantumBits === 0
                      ? '100%'
                      : `${Math.round(((dataB.classicalBits - dataB.quantumBits) / dataB.classicalBits) * 100)}%`}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground">Quantum Attack</td>
                <td className="p-3 text-center text-xs">
                  {dataA.quantumAttack === 'shor'
                    ? "Shor's"
                    : dataA.quantumAttack === 'grover'
                      ? "Grover's"
                      : 'None'}
                </td>
                <td className="p-3 text-center text-xs">
                  {dataB.quantumAttack === 'shor'
                    ? "Shor's"
                    : dataB.quantumAttack === 'grover'
                      ? "Grover's"
                      : 'None'}
                </td>
              </tr>
              {(dataA.estimatedQubits || dataB.estimatedQubits) && (
                <tr className="border-b border-border/50">
                  <td className="p-3 text-muted-foreground">Est. Logical Qubits</td>
                  <td className="p-3 text-center">
                    {dataA.estimatedQubits ? `~${dataA.estimatedQubits.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    {dataB.estimatedQubits ? `~${dataB.estimatedQubits.toLocaleString()}` : 'N/A'}
                  </td>
                </tr>
              )}
              <tr className="border-b border-border/50">
                <td className="p-3 text-muted-foreground">Post-Quantum Status</td>
                <td className="p-3 text-center">{getStatusBadge(dataA.status)}</td>
                <td className="p-3 text-center">{getStatusBadge(dataB.status)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {dataA && dataB && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">{dataA.name}</div>
            <p className="text-xs text-muted-foreground">{dataA.notes}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-secondary mb-1">{dataB.name}</div>
            <p className="text-xs text-muted-foreground">{dataB.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
