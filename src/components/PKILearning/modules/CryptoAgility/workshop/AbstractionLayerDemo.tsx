import React, { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import {
  ABSTRACTION_LAYERS,
  ABSTRACTION_BACKENDS,
  APP_CODE_SAMPLE,
  ANTI_PATTERNS,
} from '../data/architecturePatterns'

interface AbstractionLayerDemoProps {
  initialBackend?: string
}

export const AbstractionLayerDemo: React.FC<AbstractionLayerDemoProps> = ({
  initialBackend = 'rsa',
}) => {
  const [selectedBackend, setSelectedBackend] = useState(initialBackend)
  const backend =
    ABSTRACTION_BACKENDS.find((b) => b.id === selectedBackend) || ABSTRACTION_BACKENDS[0]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Abstraction Layer Demo</h3>
        <p className="text-sm text-muted-foreground">
          Toggle between algorithm backends to see how a crypto-agile architecture lets you swap
          algorithms without changing application code.
        </p>
      </div>

      {/* Backend selector */}
      <div className="flex flex-wrap gap-2">
        {ABSTRACTION_BACKENDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBackend(b.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedBackend === b.id
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {b.label}
            {b.quantumSafe ? (
              <CheckCircle size={12} className="inline ml-1 text-success" />
            ) : (
              <XCircle size={12} className="inline ml-1 text-destructive" />
            )}
          </button>
        ))}
      </div>

      {/* Architecture visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Abstraction layers */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-foreground mb-3">Architecture Layers</h4>
          {ABSTRACTION_LAYERS.map((layer, idx) => {
            const isAlgorithmLayer = layer.id === 'algorithm'
            return (
              <div
                key={layer.id}
                className={`p-3 rounded-lg border transition-all ${
                  isAlgorithmLayer
                    ? backend.quantumSafe
                      ? 'border-success/50 bg-success/5'
                      : 'border-destructive/50 bg-destructive/5'
                    : 'border-border bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                    <span className="text-sm font-bold text-foreground">{layer.label}</span>
                  </div>
                  {isAlgorithmLayer && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded border font-bold ${
                        backend.quantumSafe
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}
                    >
                      {backend.algorithm}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAlgorithmLayer
                    ? `Currently: ${backend.algorithm} — ${backend.keySize}`
                    : layer.description}
                </p>
                {idx < ABSTRACTION_LAYERS.length - 1 && (
                  <div className="flex justify-center mt-2">
                    <span className="text-muted-foreground text-xs">&darr;</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Code + Config */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">
              Application Code
              <span className="text-xs text-success ml-2 font-normal">(never changes)</span>
            </h4>
            <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto font-mono max-h-64 overflow-y-auto">
              {APP_CODE_SAMPLE}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">
              Backend Configuration
              <span
                className={`text-xs ml-2 font-normal ${
                  backend.quantumSafe ? 'text-success' : 'text-destructive'
                }`}
              >
                ({backend.quantumSafe ? 'quantum-safe' : 'quantum-vulnerable'})
              </span>
            </h4>
            <pre
              className={`text-[10px] p-3 rounded border overflow-x-auto font-mono ${
                backend.quantumSafe
                  ? 'bg-success/5 border-success/20'
                  : 'bg-destructive/5 border-destructive/20'
              }`}
            >
              {backend.config}
            </pre>
          </div>

          {/* Key insight */}
          <div
            className={`p-3 rounded-lg border ${
              backend.quantumSafe
                ? 'bg-success/10 border-success/20'
                : 'bg-warning/10 border-warning/20'
            }`}
          >
            <p className="text-xs text-foreground">
              {backend.type === 'classical' ? (
                <>
                  <strong>Current state:</strong> This RSA-2048 configuration is vulnerable to
                  quantum attack. To migrate, you only need to change the configuration file &mdash;
                  no application code changes required.
                </>
              ) : backend.type === 'pqc' ? (
                <>
                  <strong>Post-quantum:</strong> ML-KEM-768 provides NIST Level 3 quantum
                  resistance. The same application code works because the abstraction layer handles
                  the different key sizes and encapsulation mechanics.
                </>
              ) : (
                <>
                  <strong>Hybrid (recommended):</strong> X25519MLKEM768 provides both classical and
                  quantum security. If ML-KEM is broken, X25519 still protects. If X25519 is broken
                  by a quantum computer, ML-KEM still protects.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Anti-patterns */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">Common Anti-Patterns</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {ANTI_PATTERNS.map((pattern) => (
            <div key={pattern.id} className="glass-panel p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                    pattern.severity === 'critical'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-warning/10 text-warning border-warning/20'
                  }`}
                >
                  {pattern.severity.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-foreground">{pattern.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{pattern.description}</p>
              <pre className="text-[10px] bg-background p-2 rounded border border-border font-mono overflow-x-auto">
                {pattern.example}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
