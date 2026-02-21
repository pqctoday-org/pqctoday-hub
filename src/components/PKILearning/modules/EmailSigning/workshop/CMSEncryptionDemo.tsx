/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Lock, Key, Shuffle } from 'lucide-react'
import {
  CMS_AUTH_ENVELOPED_DATA_STRUCTURE,
  RECIPIENT_INFO_COMPARISON,
  type ASN1Node,
} from '../data/emailSigningConstants'

type EncryptionStep = 'content' | 'cek' | 'encap' | 'wrap'
type EncryptionMode = 'classical' | 'kem'

const ENCRYPTION_STEPS: {
  id: EncryptionStep
  label: string
  descriptions: Record<EncryptionMode, string>
}[] = [
  {
    id: 'content',
    label: '1. Content',
    descriptions: {
      classical: 'The email body is prepared as the content to be encrypted.',
      kem: 'The email body is prepared as the content to be encrypted.',
    },
  },
  {
    id: 'cek',
    label: '2. Generate CEK',
    descriptions: {
      classical: 'A random Content Encryption Key (CEK) is generated (e.g., AES-256-GCM key).',
      kem: 'A random Content Encryption Key (CEK) is generated (e.g., AES-256-GCM key).',
    },
  },
  {
    id: 'encap',
    label: '3. Key Exchange',
    descriptions: {
      classical:
        "RSA-OAEP: The CEK is directly encrypted with the recipient's RSA public key. The ciphertext goes into KeyTransRecipientInfo.encryptedKey.",
      kem: "ML-KEM Encapsulate: The recipient's ML-KEM public key produces a shared secret and KEM ciphertext. HKDF-SHA256 derives a key-wrap key from the shared secret. AES-WRAP wraps the CEK with the derived key.",
    },
  },
  {
    id: 'wrap',
    label: '4. CMS Wrap',
    descriptions: {
      classical:
        'The encrypted content and KeyTransRecipientInfo are assembled into CMS AuthEnvelopedData (RFC 5083). AEAD ciphers like AES-GCM require AuthEnvelopedData, not plain EnvelopedData.',
      kem: 'The encrypted content and KEMRecipientInfo (containing KEM ciphertext + wrapped CEK) are assembled into CMS AuthEnvelopedData (RFC 5083).',
    },
  },
]

const ASN1TreeNode: React.FC<{
  node: ASN1Node
  depth?: number
  activeStep: EncryptionStep
}> = ({ node, depth = 0, activeStep }) => {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  const isHighlighted =
    (activeStep === 'content' && node.label === 'authEncryptedContentInfo') ||
    (activeStep === 'cek' && node.label === 'contentEncryptionAlgorithm') ||
    (activeStep === 'encap' && node.label === 'recipientInfos') ||
    (activeStep === 'wrap' && depth === 0)

  const handleToggle = useCallback(() => {
    if (hasChildren) setExpanded((prev) => !prev)
  }, [hasChildren])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        setExpanded((prev) => !prev)
      }
    },
    [hasChildren]
  )

  return (
    <div className={`${depth > 0 ? 'ml-4' : ''}`}>
      <div
        role="button"
        tabIndex={hasChildren ? 0 : -1}
        className={`flex items-center gap-1 py-1 px-2 rounded text-xs cursor-pointer hover:bg-muted/50 transition-colors ${
          isHighlighted ? 'bg-primary/10 border border-primary/30' : ''
        }`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
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

interface PipelineStepProps {
  isActive: boolean
  className: string
  onClick: () => void
  children: React.ReactNode
}

const PipelineStep: React.FC<PipelineStepProps> = ({ isActive, className, onClick, children }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex-1 text-center p-3 rounded-lg border transition-colors cursor-pointer ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-pressed={isActive}
    >
      {children}
    </div>
  )
}

export const CMSEncryptionDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState<EncryptionStep>('content')
  const [encryptionMode, setEncryptionMode] = useState<EncryptionMode>('classical')

  const currentDescriptions = ENCRYPTION_STEPS.find((s) => s.id === activeStep)?.descriptions

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">CMS Encryption Workflow</h3>
        <p className="text-sm text-muted-foreground">
          Compare classical RSA key transport with KEM-based encryption (RFC 9629). Toggle between
          modes to see how the CMS AuthEnvelopedData structure changes.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEncryptionMode('classical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            encryptionMode === 'classical'
              ? 'bg-warning/20 text-warning border border-warning/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-warning/30'
          }`}
        >
          <Lock size={14} />
          RSA Key Transport
        </button>
        <button
          onClick={() => setEncryptionMode('kem')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            encryptionMode === 'kem'
              ? 'bg-success/20 text-success border border-success/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-success/30'
          }`}
        >
          <Key size={14} />
          ML-KEM (RFC 9629)
        </button>
      </div>

      {/* Step Progress */}
      <div className="flex flex-wrap gap-2">
        {ENCRYPTION_STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeStep === step.id
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Step Description */}
      <div
        className={`rounded-lg p-4 border ${
          encryptionMode === 'classical'
            ? 'bg-warning/5 border-warning/20'
            : 'bg-success/5 border-success/20'
        }`}
      >
        <p className="text-sm text-foreground">{currentDescriptions?.[encryptionMode]}</p>
      </div>

      {/* Visual Pipeline */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          {encryptionMode === 'classical' ? 'RSA Key Transport' : 'KEM + Key Wrap'} Pipeline
        </h4>
        {encryptionMode === 'classical' ? (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
              <PipelineStep
                isActive={activeStep === 'content'}
                className={
                  activeStep === 'content'
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('content')}
              >
                <div className="text-xs font-bold text-foreground">Email Body</div>
              </PipelineStep>
              <span className="text-muted-foreground mx-1 hidden sm:block">&rarr;</span>
              <PipelineStep
                isActive={activeStep === 'cek'}
                className={
                  activeStep === 'cek'
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('cek')}
              >
                <div className="text-xs font-bold text-foreground">AES-256 CEK</div>
                <div className="text-[10px] text-muted-foreground">random 256-bit key</div>
              </PipelineStep>
              <span className="text-muted-foreground mx-1 hidden sm:block">&rarr;</span>
              <PipelineStep
                isActive={activeStep === 'encap'}
                className={
                  activeStep === 'encap'
                    ? 'bg-warning/10 border-warning/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('encap')}
              >
                <div className="text-xs font-bold text-warning">RSA-OAEP Encrypt</div>
                <div className="text-[10px] text-muted-foreground">encrypt CEK directly</div>
              </PipelineStep>
              <span className="text-muted-foreground mx-1 hidden sm:block">&rarr;</span>
              <PipelineStep
                isActive={activeStep === 'wrap'}
                className={
                  activeStep === 'wrap'
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('wrap')}
              >
                <div className="text-xs font-bold text-foreground">AuthEnvelopedData</div>
                <div className="text-[10px] text-muted-foreground">RFC 5083 (AEAD)</div>
              </PipelineStep>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
              <PipelineStep
                isActive={activeStep === 'content'}
                className={
                  activeStep === 'content'
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('content')}
              >
                <div className="text-xs font-bold text-foreground">Email Body</div>
              </PipelineStep>
              <span className="text-muted-foreground mx-1 hidden sm:block">&rarr;</span>
              <PipelineStep
                isActive={activeStep === 'cek'}
                className={
                  activeStep === 'cek'
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('cek')}
              >
                <div className="text-xs font-bold text-foreground">AES-256 CEK</div>
                <div className="text-[10px] text-muted-foreground">random 256-bit key</div>
              </PipelineStep>
              <span className="text-muted-foreground mx-1 hidden sm:block">&rarr;</span>
              <PipelineStep
                isActive={activeStep === 'encap'}
                className={
                  activeStep === 'encap'
                    ? 'bg-success/10 border-success/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('encap')}
              >
                <div className="text-xs font-bold text-success">ML-KEM Encap</div>
                <div className="text-[10px] text-muted-foreground">
                  shared secret + KDF + AES-WRAP
                </div>
              </PipelineStep>
              <span className="text-muted-foreground mx-1 hidden sm:block">&rarr;</span>
              <PipelineStep
                isActive={activeStep === 'wrap'}
                className={
                  activeStep === 'wrap'
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/50 border-border'
                }
                onClick={() => setActiveStep('wrap')}
              >
                <div className="text-xs font-bold text-foreground">AuthEnvelopedData</div>
                <div className="text-[10px] text-muted-foreground">RFC 5083 (AEAD)</div>
              </PipelineStep>
            </div>

            {/* KEM Detail Breakdown */}
            {activeStep === 'encap' && (
              <div className="mt-3 bg-success/5 rounded-lg p-3 border border-success/20">
                <div className="text-xs font-bold text-success mb-2">
                  KEM Encapsulation Detail (RFC 9629)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded p-2 border border-border text-center">
                    <div className="text-[10px] font-bold text-foreground">Encapsulate</div>
                    <div className="text-[10px] text-muted-foreground">
                      ML-KEM-768(pk) &rarr; (ss, ct)
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 border border-border text-center">
                    <div className="text-[10px] font-bold text-foreground">Key Derivation</div>
                    <div className="text-[10px] text-muted-foreground">
                      HKDF-SHA256(ss) &rarr; wrap_key
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-2 border border-border text-center">
                    <div className="text-[10px] font-bold text-foreground">Key Wrap</div>
                    <div className="text-[10px] text-muted-foreground">
                      AES-WRAP(wrap_key, CEK) &rarr; wrapped_cek
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ASN.1 Tree View */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          CMS AuthEnvelopedData ASN.1 Structure
        </h4>
        <div className="bg-background rounded-lg p-3 border border-border max-h-80 overflow-y-auto">
          <ASN1TreeNode node={CMS_AUTH_ENVELOPED_DATA_STRUCTURE} activeStep={activeStep} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Click to expand/collapse nodes. Highlighted fields correspond to the active step.
        </p>
      </div>

      {/* RecipientInfo Comparison */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shuffle size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">RecipientInfo: Key Transport vs KEM</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Field</th>
                <th className="text-left p-2 font-bold">
                  <span className="text-warning">Classical (RSA)</span>
                </th>
                <th className="text-left p-2 font-bold">
                  <span className="text-success">PQC (ML-KEM)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {RECIPIENT_INFO_COMPARISON.map((row) => (
                <tr key={row.field} className="border-b border-border/50">
                  <td className="p-2 text-muted-foreground font-medium whitespace-nowrap">
                    {row.field}
                  </td>
                  <td className="p-2 font-mono text-xs text-foreground">{row.classicalValue}</td>
                  <td className="p-2 font-mono text-xs text-foreground">{row.pqcValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key insight:</strong> RFC 9629 introduces{' '}
          <code className="text-foreground/70">KEMRecipientInfo</code> as a new CHOICE in the CMS
          RecipientInfo structure. This is a non-breaking extension &mdash; existing CMS
          implementations simply skip recipient infos they don&apos;t understand. Modern S/MIME uses{' '}
          <code className="text-foreground/70">AuthEnvelopedData</code> (RFC 5083) with AEAD ciphers
          like AES-GCM, rather than plain <code className="text-foreground/70">EnvelopedData</code>{' '}
          which only provides confidentiality. Senders can include both{' '}
          <code className="text-foreground/70">KeyTransRecipientInfo</code> (RSA) and{' '}
          <code className="text-foreground/70">KEMRecipientInfo</code> (ML-KEM) for the same
          recipient during the transition period.
        </p>
      </div>
    </div>
  )
}
