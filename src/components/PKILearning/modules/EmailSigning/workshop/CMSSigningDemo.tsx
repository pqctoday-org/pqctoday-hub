import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Hash, PenLine, Package } from 'lucide-react'
import {
  CMS_SIGNED_DATA_STRUCTURE,
  SIGNER_INFO_COMPARISON,
  type ASN1Node,
} from '../data/emailSigningConstants'

type SigningStep = 'content' | 'hash' | 'sign' | 'wrap'
type AlgorithmView = 'ecdsa' | 'ml-dsa'

const SIGNING_STEPS: { id: SigningStep; label: string; description: string }[] = [
  {
    id: 'content',
    label: '1. Content',
    description: 'The email body (or document) to be signed is prepared as the encapContentInfo.',
  },
  {
    id: 'hash',
    label: '2. Hash',
    description:
      'SHA-256 digest is computed over the signed attributes (content type, message digest, signing time).',
  },
  {
    id: 'sign',
    label: '3. Sign',
    description:
      "The digest is signed using the sender's private key (ECDSA or ML-DSA) to produce the signature value.",
  },
  {
    id: 'wrap',
    label: '4. CMS Wrap',
    description:
      'Everything is assembled into a CMS SignedData structure: version, digest algorithms, content, certificates, and signer infos.',
  },
]

const ASN1TreeNode: React.FC<{
  node: ASN1Node
  depth?: number
  activeStep: SigningStep
}> = ({ node, depth = 0, activeStep }) => {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  const isHighlighted =
    (activeStep === 'content' && node.label === 'encapContentInfo') ||
    (activeStep === 'hash' &&
      (node.label === 'digestAlgorithms' || node.label === 'signedAttrs')) ||
    (activeStep === 'sign' &&
      (node.label === 'signatureAlgorithm' || node.label === 'signature')) ||
    (activeStep === 'wrap' && depth === 0)

  return (
    <div className={`${depth > 0 ? 'ml-4' : ''}`}>
      <div
        role="button"
        tabIndex={hasChildren ? 0 : -1}
        className={`flex items-center gap-1 py-1 px-2 rounded text-xs cursor-pointer hover:bg-muted/50 transition-colors ${
          isHighlighted ? 'bg-primary/10 border border-primary/30' : ''
        }`}
        onClick={() => hasChildren && setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setExpanded(!expanded)
          }
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={12} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span
          className={`font-mono ${isHighlighted ? 'text-primary font-bold' : 'text-foreground'}`}
        >
          {node.label}
        </span>
        {node.oid && <span className="text-muted-foreground font-mono ml-1">({node.oid})</span>}
        {node.value && <span className="text-muted-foreground ml-1">&mdash; {node.value}</span>}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children?.map((child, idx) => (
            <ASN1TreeNode
              key={`${child.label}-${idx}`}
              node={child}
              depth={depth + 1}
              activeStep={activeStep}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const CMSSigningDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState<SigningStep>('content')
  const [algorithmView, setAlgorithmView] = useState<AlgorithmView>('ecdsa')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">CMS Signing Workflow</h3>
        <p className="text-sm text-muted-foreground">
          Walk through the four stages of creating a CMS SignedData structure. The ASN.1 tree below
          highlights the relevant fields at each step.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex flex-wrap gap-2">
        {SIGNING_STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStep === step.id
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {step.id === 'content' && <Package size={14} />}
            {step.id === 'hash' && <Hash size={14} />}
            {step.id === 'sign' && <PenLine size={14} />}
            {step.id === 'wrap' && <Package size={14} />}
            {step.label}
          </button>
        ))}
      </div>

      {/* Step Description */}
      <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
        <p className="text-sm text-foreground">
          {SIGNING_STEPS.find((s) => s.id === activeStep)?.description}
        </p>
      </div>

      {/* Visual Pipeline */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Signing Pipeline</h4>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
          {SIGNING_STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                role="button"
                tabIndex={0}
                className={`flex-1 text-center p-3 rounded-lg border transition-colors cursor-pointer ${
                  activeStep === step.id
                    ? 'bg-primary/10 border-primary/50 text-primary'
                    : SIGNING_STEPS.findIndex((s) => s.id === activeStep) > idx
                      ? 'bg-success/10 border-success/30 text-success'
                      : 'bg-muted/50 border-border text-muted-foreground'
                }`}
                onClick={() => setActiveStep(step.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveStep(step.id)
                  }
                }}
              >
                <div className="text-xs font-bold">{step.label}</div>
              </div>
              {idx < SIGNING_STEPS.length - 1 && (
                <span className="text-muted-foreground mx-1 hidden sm:block">&rarr;</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ASN.1 Tree View */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">CMS SignedData ASN.1 Structure</h4>
        <div className="bg-background rounded-lg p-3 border border-border max-h-96 overflow-y-auto">
          <ASN1TreeNode node={CMS_SIGNED_DATA_STRUCTURE} activeStep={activeStep} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Click to expand/collapse nodes. Highlighted fields correspond to the active step.
        </p>
      </div>

      {/* Algorithm Comparison */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground">Signer Info Comparison</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setAlgorithmView('ecdsa')}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                algorithmView === 'ecdsa'
                  ? 'bg-warning/20 text-warning border border-warning/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-warning/30'
              }`}
            >
              ECDSA P-256
            </button>
            <button
              onClick={() => setAlgorithmView('ml-dsa')}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                algorithmView === 'ml-dsa'
                  ? 'bg-success/20 text-success border border-success/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-success/30'
              }`}
            >
              ML-DSA-65
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Field</th>
                <th className="text-left p-2 font-bold">
                  {algorithmView === 'ecdsa' ? (
                    <span className="text-warning">ECDSA P-256</span>
                  ) : (
                    <span className="text-success">ML-DSA-65</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {SIGNER_INFO_COMPARISON.map((row) => {
                const value = algorithmView === 'ecdsa' ? row.ecdsaValue : row.mlDsaValue
                const isQuantumSafe = row.field === 'Quantum Safe'
                return (
                  <tr key={row.field} className="border-b border-border/50">
                    <td className="p-2 text-muted-foreground font-medium">{row.field}</td>
                    <td className="p-2 font-mono text-xs">
                      {isQuantumSafe ? (
                        <span
                          className={
                            value === 'Yes'
                              ? 'text-success font-bold'
                              : 'text-destructive font-bold'
                          }
                        >
                          {value}
                        </span>
                      ) : (
                        <span className="text-foreground">{value}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> The CMS SignedData structure is identical for classical and PQC
          algorithms &mdash; only the algorithm OIDs and size of the signature value change. This is
          by design: CMS was built with algorithm agility from the start (RFC 5652, 2009). ML-DSA
          signatures are defined for CMS in RFC 9882.
        </p>
      </div>
    </div>
  )
}
