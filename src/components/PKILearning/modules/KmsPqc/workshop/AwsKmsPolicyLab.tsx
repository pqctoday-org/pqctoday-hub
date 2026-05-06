// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import { ShieldCheck, ShieldAlert, Cloud, Code, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateKmsPqcPolicy, type PolicyValidationResult } from '../utils/kmsPolicyEngine'

const INITIAL_JSON = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowUseOfTheKey",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::111122223333:role/AppRole" },
      "Action": ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "*"
    }
    // Add a Deny statement below to enforce aws:tlsCipherSuites contains "_PQ"
  ]
}`

export const AwsKmsPolicyLab: React.FC = () => {
  const [policyJson, setPolicyJson] = useState(INITIAL_JSON)
  const [validation, setValidation] = useState<PolicyValidationResult>({
    isValidJson: true,
    hasDenyStatement: false,
    enforcesPqcCipherSuite: false,
    protectsDecryptAction: false,
    isFullySecure: false,
  })

  // Validate dynamically
  useEffect(() => {
    setValidation(validateKmsPqcPolicy(policyJson))
  }, [policyJson])

  const insertSnippet = () => {
    const snippet = `    ,{
      "Sid": "EnforceHybridPQCTLS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "kms:Decrypt",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:tlsCipherSuites": "TLS_AES_256_GCM_SHA384_PQ"
        }
      }
    }`
    const insertPos = policyJson.lastIndexOf(']')
    if (insertPos !== -1) {
      setPolicyJson(
        policyJson.substring(0, insertPos) + snippet + '\n  ' + policyJson.substring(insertPos)
      )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-foreground">AWS KMS Key Policy Lab</h2>
        <p className="text-muted-foreground mt-2">
          Configure an AWS KMS Key Policy to strictly enforce Hybrid PQC TLS connections for all
          `kms:Decrypt` requests, protecting sensitive Master Keys from HNDL harvesting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="glass-panel overflow-hidden flex flex-col h-[500px]">
          <div className="bg-muted px-4 py-2 flex justify-between items-center border-b">
            <span className="font-mono text-xs flex items-center gap-2">
              <FileJson size={14} /> key-policy.json
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertSnippet}
              className="h-6 text-[10px] px-2"
            >
              Insert Solution Snippet
            </Button>
          </div>
          <textarea
            value={policyJson}
            onChange={(e) => setPolicyJson(e.target.value)}
            spellCheck={false}
            className="w-full h-full p-4 font-mono text-sm bg-transparent border-none outline-none resize-none text-foreground leading-relaxed"
          />
        </div>

        {/* Validation Dashboard */}
        <div className="glass-panel p-6 flex flex-col justify-between h-[500px]">
          <div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Cloud size={20} /> Evaluation Engine
            </h3>

            <div className="space-y-4">
              <ValidationRow label="Valid JSON Syntax" isSuccess={validation.isValidJson} />
              <ValidationRow
                label="Contains explicit 'Deny' statement"
                isSuccess={validation.hasDenyStatement}
              />
              <ValidationRow
                label="Protects 'kms:Decrypt' action"
                isSuccess={validation.protectsDecryptAction}
              />
              <ValidationRow
                label="Condition enforces aws:tlsCipherSuites with '_PQ'"
                isSuccess={validation.enforcesPqcCipherSuite}
              />
            </div>
          </div>

          <div className="mt-8">
            {validation.isFullySecure ? (
              <div className="bg-success/10 border border-success/30 p-4 rounded-lg flex gap-3 text-success-foreground animate-pulse-slow">
                <ShieldCheck size={28} className="shrink-0 text-success" />
                <div>
                  <h4 className="font-bold text-md mb-1">Policy is Quantum-Secure</h4>
                  <p className="text-sm opacity-90">
                    Excellent. By denying decryption requests where the TLS Cipher Suite does not
                    end in <code className="bg-background/50 px-1 rounded">_PQ</code>, you have
                    guaranteed that AWS KMS will reject classical-only connections. Your root keys
                    are protected against Store-Now-Decrypt-Later.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 text-destructive">
                <ShieldAlert size={28} className="shrink-0" />
                <div className="w-full">
                  <h4 className="font-bold text-md mb-1">Policy is Vulnerable</h4>
                  <p className="text-sm opacity-90 mb-2">
                    {validation.errorMessage ||
                      'The policy fails to enforce Hybrid PQC TLS requirements.'}
                  </p>
                  <code className="block bg-background/50 p-2 rounded text-xs overflow-x-auto whitespace-nowrap mt-2 text-foreground">
                    "Condition": &#123; "StringNotEquals": &#123; "aws:tlsCipherSuites":
                    "TLS_AES_256_GCM_SHA384_PQ" &#125; &#125;
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ValidationRow({ label, isSuccess }: { label: string; isSuccess: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
      <span className="text-sm font-medium">{label}</span>
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center ${isSuccess ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}
      >
        {isSuccess ? <ShieldCheck size={12} /> : <Code size={12} />}
      </div>
    </div>
  )
}
