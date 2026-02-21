/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import {
  KeyRound,
  Send,
  Database,
  Lock,
  RefreshCw,
  Archive,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
} from 'lucide-react'
import { KEY_LIFECYCLE_STAGES, KEY_SIZE_COMPARISONS } from '../data/keyManagementConstants'

const STAGE_ICONS = [KeyRound, Send, Database, Lock, RefreshCw, Archive, Trash2]

export const KeyLifecycleDemo: React.FC = () => {
  const [currentStage, setCurrentStage] = useState(0)
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set())

  const stage = KEY_LIFECYCLE_STAGES[currentStage]
  const Icon = STAGE_ICONS[currentStage]

  const markComplete = () => {
    setCompletedStages((prev) => new Set([...prev, currentStage]))
    if (currentStage < KEY_LIFECYCLE_STAGES.length - 1) {
      setCurrentStage(currentStage + 1)
    }
  }

  // Key size data for the comparison view
  const classicalKeys = KEY_SIZE_COMPARISONS.filter((k) => k.type === 'classical')
  const pqcKeys = KEY_SIZE_COMPARISONS.filter((k) => k.type === 'pqc')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Key Lifecycle Visualization</h3>
        <p className="text-sm text-muted-foreground">
          Walk through each stage of the cryptographic key lifecycle. At each stage, see what
          changes when migrating from RSA to ML-KEM/ML-DSA &mdash; key sizes, storage requirements,
          and operational considerations.
        </p>
      </div>

      {/* Stage stepper */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {KEY_LIFECYCLE_STAGES.map((s, idx) => {
            const StageIcon = STAGE_ICONS[idx]
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStage(idx)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  idx === currentStage
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : completedStages.has(idx)
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {completedStages.has(idx) ? <CheckCircle size={12} /> : <StageIcon size={12} />}
                <span className="hidden sm:inline">{s.name}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{
            width: `${(completedStages.size / KEY_LIFECYCLE_STAGES.length) * 100}%`,
          }}
        />
      </div>

      {/* Current stage detail */}
      {stage && (
        <div className="glass-panel p-6 border-l-4 border-l-primary">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Icon size={24} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  Stage {currentStage + 1} of 7
                </span>
              </div>
              <h4 className="text-xl font-bold text-foreground">{stage.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Classical approach */}
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold">
                  CLASSICAL
                </span>
                <span className="text-xs text-muted-foreground">RSA / ECDSA</span>
              </div>
              <p className="text-xs text-foreground/80">{stage.classicalApproach}</p>
            </div>

            {/* PQC impact */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                  PQC IMPACT
                </span>
                <span className="text-xs text-muted-foreground">ML-KEM / ML-DSA</span>
              </div>
              <p className="text-xs text-foreground/80">{stage.pqcImpact}</p>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded border border-border">
            <span className="text-xs font-bold text-foreground">Reference: </span>
            <span className="text-xs text-muted-foreground">{stage.nistReference}</span>
          </div>
        </div>
      )}

      {/* Key Size Comparison Table */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">
          Key Size Comparison: Classical vs PQC
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Public Key
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Private Key
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Sig / CT</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Security</th>
              </tr>
            </thead>
            <tbody>
              {classicalKeys.map((k) => (
                <tr key={k.algorithm} className="border-b border-border/50">
                  <td className="py-2 px-2 font-mono text-destructive">{k.algorithm}</td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.publicKeyBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.privateKeyBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.signatureOrCiphertextBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-destructive">{k.nistLevel}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="py-1">
                  <div className="border-t-2 border-primary/30" />
                </td>
              </tr>
              {pqcKeys.map((k) => (
                <tr key={k.algorithm} className="border-b border-border/50">
                  <td className="py-2 px-2 font-mono text-primary">{k.algorithm}</td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.publicKeyBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.privateKeyBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {k.signatureOrCiphertextBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-success">{k.nistLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Sig / CT = Signature size (for signing algorithms) or Ciphertext size (for KEMs). All
          sizes in bytes. PQC algorithms produce significantly larger artifacts.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => setCurrentStage(Math.max(0, currentStage - 1))}
          disabled={currentStage === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm rounded border border-border hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          onClick={markComplete}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors"
        >
          {completedStages.has(currentStage) ? (
            <>
              <CheckCircle size={14} /> Completed
            </>
          ) : currentStage === KEY_LIFECYCLE_STAGES.length - 1 ? (
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
