// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo, useEffect } from 'react'
import type { WalletInstance } from '../../types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Key, FileText, Plus, Smartphone } from 'lucide-react'
import {
  inspectStoredCredential,
  inspectedJson,
  recordedIsoTime,
  type RecordedTime,
} from '../../utils/credentialInspection'

interface WalletComponentProps {
  wallet: WalletInstance
  onAddCredential: () => void
}

export const WalletComponent: React.FC<WalletComponentProps> = ({ wallet, onAddCredential }) => {
  const [inspectId, setInspectId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const inspections = useMemo(
    () =>
      new Map(
        wallet.credentials.map((credential) => [credential.id, inspectStoredCredential(credential)])
      ),
    [wallet.credentials]
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-status-info" />
            EUDI Wallet
          </h2>
          <p className="text-muted-foreground">Managed by: {wallet.owner.legalName}</p>
        </div>
        <Button variant="ghost" onClick={onAddCredential} className="gap-2">
          <Plus className="w-4 h-4" /> Add Credential
        </Button>
      </div>

      <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">PQC Readiness</p>
        <p>
          The OpenID4VP and OpenID4VCI specifications use classical ECDSA (for example on a P-256
          key) in most of their examples. The eIDAS 2.0 regulation (Regulation (EU) 2024/1183) and
          ARF texts we checked do not mention quantum computing. NIST has standardised ML-DSA and
          SLH-DSA as post-quantum signatures.
          <span className="text-muted-foreground/80">
            {' '}
            Target: the NIS Cooperation Group Coordinated Implementation Roadmap (2025) asks for
            high-risk use cases to be migrated by the end of 2030 (it does not name EUDI Wallets) —
            not ETSI TS 119 182-1, which is the unrelated JAdES JSON-signature format spec.
          </span>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground mb-4">
        <strong className="text-foreground">What is selective disclosure?</strong> In EUDI wallets,
        you control which credential fields you share with each relying party. For example, you can
        prove "over 18" to a bank without revealing your exact date of birth. You will choose which
        fields to reveal in Step 4.
      </div>

      <p className="text-xs text-muted-foreground">
        Look for production wallet and verifier tools that inspect the supported encoded profile and
        check actual validity fields, signatures, issuer trust and applicable status information.
      </p>

      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credentials" className="gap-2">
            <FileText className="w-4 h-4" /> Credentials
          </TabsTrigger>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="w-4 h-4" /> Hardware Keys
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Shield className="w-4 h-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="mt-4 space-y-4">
          {wallet.credentials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mb-2 opacity-50" />
                <p>No credentials installed yet.</p>
                <Button variant="link" onClick={onAddCredential}>
                  Get your first ID
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallet.credentials.map((cred) => {
                const inspection = inspections.get(cred.id)!
                return (
                  <Card
                    key={cred.id}
                    className="relative overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-muted/50"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <FileText className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {cred.type.includes('PersonIdentificationData') ||
                        cred.format === 'mso_mdoc'
                          ? '🇪🇺'
                          : '🎓'}
                        {cred.type.includes('PersonIdentificationData')
                          ? 'Person Identification Data'
                          : 'University Diploma'}
                      </CardTitle>
                      <CardDescription>{cred.issuer}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-semibold">Declared sample format:</span>{' '}
                          {cred.format}
                        </p>
                        <dl className="space-y-2" aria-label="Recorded time fields">
                          {[
                            recordedIsoTime('Stored issuanceDate', cred.issuanceDate),
                            recordedIsoTime('Stored expirationDate', cred.expirationDate, true),
                            ...inspection.times,
                          ].map((time) => (
                            <TimeField key={time.label} time={time} now={now} />
                          ))}
                        </dl>
                        <p className="text-xs text-muted-foreground">
                          These are recorded fields and comparisons with this device's clock, not a
                          credential validity result. Signatures, disclosure digests, issuer trust
                          and status are not checked by this inspector. Stored metadata and encoded
                          fields are shown separately; neither is replaced with an assumed duration.
                        </p>
                        {!inspection.ok && (
                          <p className="text-xs text-muted-foreground">
                            Encoded time fields are unavailable: {inspection.error}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 text-xs h-8 w-full"
                          onClick={() => setInspectId(inspectId === cred.id ? null : cred.id)}
                        >
                          {inspectId === cred.id ? 'Hide inspection' : 'Inspect encoded sample'}
                        </Button>

                        {inspectId === cred.id && (
                          <div className="mt-2 text-left">
                            {inspection.ok ? (
                              <>
                                <p className="mb-2 text-xs text-muted-foreground">
                                  Encoded sample structure parsed. This is not signature
                                  verification or full profile/conformance validation.
                                </p>
                                <details className="mb-2" open>
                                  <summary className="text-xs font-medium">
                                    {inspection.encodedLabel}
                                  </summary>
                                  <pre className="p-3 bg-card border border-border font-mono text-[10px] rounded overflow-auto whitespace-pre-wrap break-all max-h-48">
                                    {inspection.encoded}
                                  </pre>
                                </details>
                                <details className="mb-2">
                                  <summary className="text-xs font-medium">
                                    Decoded encoded fields — not verified
                                  </summary>
                                  <pre className="p-3 bg-card border border-border font-mono text-[10px] rounded overflow-auto whitespace-pre-wrap break-all max-h-48">
                                    {inspectedJson(inspection.decoded)}
                                  </pre>
                                </details>
                              </>
                            ) : (
                              <p role="alert" className="mb-2 text-xs text-destructive">
                                Inspection incomplete: {inspection.error}
                              </p>
                            )}
                            <details>
                              <summary className="text-xs font-medium">
                                Stored wrapper / raw field — separate representation
                              </summary>
                              <pre className="p-3 bg-card border border-border font-mono text-[10px] rounded overflow-auto whitespace-pre-wrap break-all max-h-48">
                                {cred.raw ?? 'Not recorded'}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keys" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>HSM Secure Storage</CardTitle>
              <CardDescription>
                Cryptographic keys stored in the simulated Remote HSM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.keys.length === 0 ? (
                <p className="text-muted-foreground">No keys generated yet.</p>
              ) : (
                <div className="space-y-4">
                  {wallet.keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Key className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium">{key.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {key.algorithm} / {key.curve}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Created: {new Date(key.created).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {wallet.history.length === 0 ? (
                <p className="text-muted-foreground">No activity recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {wallet.history.map((log) => (
                    <li key={log.id} className="text-sm p-2 border-l-2 pl-4 border-primary">
                      <span className="font-semibold">{log.type}</span>: {log.details}
                      <span className="block text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TimeField({ time, now }: { time: RecordedTime; now: number }) {
  return (
    <div className="text-xs break-words">
      <dt className="font-semibold">{time.label}</dt>
      <dd>
        <code>
          {time.raw === undefined
            ? 'Not recorded'
            : typeof time.raw === 'string'
              ? time.raw || '(empty)'
              : inspectedJson(time.raw)}
        </code>
        {time.issue ? (
          <span className="block text-muted-foreground">Unknown — {time.issue}</span>
        ) : (
          <>
            <span className="block text-muted-foreground">UTC: {time.iso}</span>
            {time.expiration && (
              <span
                className={
                  time.milliseconds! <= now
                    ? 'block text-status-warning font-medium'
                    : 'block text-muted-foreground'
                }
              >
                {time.milliseconds! <= now
                  ? 'Expiration date has passed'
                  : 'Expiration date is ahead of this device’s clock'}
              </span>
            )}
          </>
        )}
      </dd>
    </div>
  )
}
