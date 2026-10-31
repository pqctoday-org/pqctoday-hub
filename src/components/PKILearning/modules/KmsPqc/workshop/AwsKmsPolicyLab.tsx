// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useState } from 'react'
import { ShieldCheck, ShieldAlert, Cloud, Code, FileJson, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateKmsPqcPolicy } from '../utils/kmsPolicyEngine'

// An IAM policy for the people who create KMS keys. kms:CreateKey is governed
// by IAM policy, not by a key policy (the key does not exist yet).
const INITIAL_JSON = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowKeyAdministration",
      "Effect": "Allow",
      "Action": ["kms:DescribeKey", "kms:ListKeys", "kms:TagResource"],
      "Resource": "*"
    }
  ]
}`

const SOLUTION = `    ,{
      "Sid": "CreateMlDsaSigningKeysOnly",
      "Effect": "Allow",
      "Action": "kms:CreateKey",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:KeySpec": ["ML_DSA_65", "ML_DSA_87"],
          "kms:KeyUsage": "SIGN_VERIFY"
        }
      }
    }`

export const AwsKmsPolicyLab: React.FC = () => {
  const [policyJson, setPolicyJson] = useState(INITIAL_JSON)
  const validation = useMemo(() => validateKmsPqcPolicy(policyJson), [policyJson])

  const insertSnippet = () => {
    const insertPos = policyJson.lastIndexOf(']')
    if (insertPos !== -1) {
      setPolicyJson(
        policyJson.substring(0, insertPos) + SOLUTION + '\n  ' + policyJson.substring(insertPos)
      )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-foreground">AWS KMS Policy Lab</h2>
        <p className="text-muted-foreground mt-2">
          Write an IAM policy that lets your key administrators create post-quantum signing keys,
          and nothing weaker. AWS KMS offers ML-DSA keys for signing (key specs{' '}
          <code>ML_DSA_44</code>, <code>ML_DSA_65</code>, <code>ML_DSA_87</code>, key usage{' '}
          <code>SIGN_VERIFY</code>).
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Your task: add an <code>Allow</code> statement for <code>kms:CreateKey</code> whose
          condition limits <code>kms:KeySpec</code> to ML-DSA specs and requires{' '}
          <code>kms:KeyUsage</code> to be <code>SIGN_VERIFY</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="min-w-0 glass-panel overflow-hidden flex flex-col h-[500px]">
          <div className="bg-muted px-4 py-2 flex justify-between items-center border-b gap-2 flex-wrap">
            <span className="font-mono text-xs flex items-center gap-2 min-w-0 truncate">
              <FileJson size={14} className="shrink-0" /> key-admin-iam-policy.json
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertSnippet}
              className="h-6 text-[10px] px-2 shrink-0"
            >
              Insert Solution Snippet
            </Button>
          </div>
          <textarea
            aria-label="key-admin-iam-policy.json editor"
            value={policyJson}
            onChange={(e) => setPolicyJson(e.target.value)}
            spellCheck={false}
            className="w-full h-full p-4 font-mono text-sm bg-transparent border-none outline-none resize-none text-foreground leading-relaxed"
          />
        </div>

        {/* Validation Dashboard */}
        <div className="min-w-0 glass-panel p-6 flex flex-col justify-between h-[500px] overflow-y-auto">
          <div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Cloud size={20} /> Policy checks
            </h3>

            <div className="space-y-3">
              <ValidationRow label="Valid JSON syntax" isSuccess={validation.isValidJson} />
              <ValidationRow
                label="Allows the 'kms:CreateKey' action"
                isSuccess={validation.allowsCreateKey}
              />
              <ValidationRow
                label="'kms:KeySpec' limited to ML-DSA specs"
                isSuccess={validation.restrictsKeySpecToMlDsa}
              />
              <ValidationRow
                label="'kms:KeyUsage' must be SIGN_VERIFY"
                isSuccess={validation.requiresSignVerify}
              />
              <ValidationRow
                label="Uses only condition keys AWS has"
                isSuccess={validation.usesOnlyRealConditionKeys}
              />
            </div>
          </div>

          <div className="mt-6">
            {validation.isComplete ? (
              <div className="bg-success/10 border border-success/30 p-4 rounded-lg flex gap-3 text-success-foreground">
                <ShieldCheck size={28} className="shrink-0 text-success" />
                <div>
                  <h4 className="font-bold text-md mb-1">New signing keys will be ML-DSA</h4>
                  <p className="text-sm opacity-90">
                    Administrators under this policy can only create ML-DSA signing keys. It does
                    not touch existing keys, and it says nothing about how clients connect: that
                    part is below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 text-status-error">
                <ShieldAlert size={28} className="shrink-0" />
                <div className="w-full">
                  <h4 className="font-bold text-md mb-1">Not there yet</h4>
                  <p className="text-sm opacity-90">
                    {validation.errorMessage ?? 'The policy does not meet the task yet.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-5 space-y-2 text-sm text-muted-foreground">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <Info size={16} /> What a policy cannot do: require post-quantum TLS
        </h3>
        <p>
          AWS KMS endpoints accept hybrid post-quantum TLS (ECDH with ML-KEM), but no IAM or key
          policy condition can require it. It is a client setting: for example, in the AWS SDK for
          Java 2.x, build the AWS CRT HTTP client with <code>postQuantumTlsEnabled(true)</code>{' '}
          (aws-crt-client 2.30.22 or later). To check that it is in use, look at the{' '}
          <code>tlsDetails.keyExchange</code> field of the call's CloudTrail entry, which shows a
          hybrid group such as <code>X25519MLKEM768</code>.
        </p>
        <p>
          AWS KMS offers ML-KEM key specs (ML_KEM_512, ML_KEM_768, ML_KEM_1024) and hybrid
          post-quantum TLS on its endpoints; data encrypted under KMS symmetric keys uses
          AES-256-GCM.
        </p>
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
