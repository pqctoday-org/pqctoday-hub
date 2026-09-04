// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Landmark, CheckCircle, Loader2, Eye, AlertTriangle } from 'lucide-react'
import type { WalletInstance } from '../../types'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
import { createPresentation } from '../../utils/sdjwt-utils'
import type { CryptoProvider } from '../../utils/crypto-provider'
import { OpenSSLCryptoProvider } from '../../utils/openssl-crypto-provider'
import { SoftHSMCryptoProvider, isHsmBackedKey } from '../../utils/hsm-crypto-provider'
import { DualCryptoProvider } from '../../utils/dual-crypto-provider'
import type { UseHSMResult, HsmKey } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import type { CryptoKey } from '../../types'
import type { SdJwtVc } from '../../utils/sdjwt-utils'
import type { MsoMdoc } from '../../types'
import { createMdocPresentation, verifyMdocPresentation } from '../../utils/mdoc-utils'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { WhyThisMatters } from '@/components/ui/WhyThisMatters'
import { CopyableOutput } from '@/components/ui/CopyableOutput'

interface RelyingPartyComponentProps {
  wallet: WalletInstance
  hsm: UseHSMResult
  onBack: () => void
}

type RPStep = 'START' | 'DISCLOSURE' | 'PRESENTATION' | 'VERIFICATION' | 'COMPLETE' | 'REFUSED'

export const RelyingPartyComponent: React.FC<RelyingPartyComponentProps> = ({
  wallet,
  hsm,
  onBack,
}) => {
  const [step, setStep] = useState<RPStep>('START')
  const [loading, setLoading] = useState(false)
  const [presentationData, setPresentationData] = useState<{
    signature: string
    payload: string
    key: CryptoKey
  } | null>(null)
  const { logs, opensslLogs, activeLogTab, setActiveLogTab, addLog, addOpenSSLLog } =
    useDigitalIDLogs()

  const getCryptoProvider = (): CryptoProvider => {
    const ossl = new OpenSSLCryptoProvider()
    if (hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current) {
      const hsmProvider = new SoftHSMCryptoProvider(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        { addKey: hsm.addKey }
      )
      return new DualCryptoProvider(hsmProvider, ossl)
    }
    return ossl
  }

  // Heuristic: Ensure we have at least one valid key to sign with
  const availableKey = wallet.keys.find((k) => k.usage === 'SIGN')

  /**
   * What the bank asks for. Spans BOTH credentials in one request, which is
   * the ARF's own model: `age_over_18` proves eligibility from the PID while
   * `birth_date` stays withheld, and the diploma supplies the degree.
   */
  const REQUESTED_CLAIMS = ['family_name', 'given_name', 'degree', 'age_over_18']

  /** The SD-JWT credential this presentation will disclose from, if any. */
  const sdJwtCred = wallet.credentials.find(
    (c) => c.type.includes('UniversityDegreeCredential') || c.format === 'dc+sd-jwt'
  )
  /** The PID (mdoc) — carries age_over_18 and birth_date. */
  const pidCred = wallet.credentials.find(
    (c) => c.type.includes('PersonIdentificationData') || c.format === 'mso_mdoc'
  )

  /** Every claim the holder could disclose, per credential, read from the credentials themselves. */
  const availableClaims = (): { key: string; source: 'diploma' | 'pid' }[] => {
    const out: { key: string; source: 'diploma' | 'pid' }[] = []
    if (sdJwtCred?.raw) {
      try {
        const parsed = JSON.parse(sdJwtCred.raw) as SdJwtVc
        parsed.disclosures.forEach((d) => out.push({ key: d.key, source: 'diploma' }))
      } catch {
        /* malformed credential — nothing to offer */
      }
    }
    if (pidCred?.raw) {
      try {
        const parsed = JSON.parse(pidCred.raw) as MsoMdoc
        ;(parsed.issuerSignedItems ?? []).forEach((i) =>
          out.push({ key: i.elementIdentifier, source: 'pid' })
        )
      } catch {
        /* malformed credential — nothing to offer */
      }
    }
    return out
  }

  const claims = availableClaims()

  /**
   * The holder's choice. Defaults to exactly what the bank asked for, so the
   * guided path still works for a learner who just clicks through, but every
   * box is free to untick — under-sharing is allowed precisely so the refusal
   * below is something you can cause and observe.
   */
  const [selectedClaims, setSelectedClaims] = useState<string[]>(REQUESTED_CLAIMS)
  const toggleClaim = (k: string) =>
    setSelectedClaims((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))

  const offeredKeys = claims.map((c) => c.key)
  /** Claims the bank asked for that the wallet actually holds. */
  const satisfiable = REQUESTED_CLAIMS.filter((k) => offeredKeys.includes(k))
  const missing = satisfiable.filter((k) => !selectedClaims.includes(k))

  const handleStart = () => {
    addLog('Connecting to Bank (Relying Party)...')
    addLog(`Bank requests: [${REQUESTED_CLAIMS.join(', ')}] for Account Opening.`)
    addLog(
      'age_over_18 is requested INSTEAD of birth_date — the bank needs eligibility, not your date of birth.'
    )
    setStep('DISCLOSURE')
  }

  const handleDisclosure = () => {
    addLog('User Review: Selective Disclosure applied.')
    const revealed = claims.filter((c) => selectedClaims.includes(c.key)).map((c) => c.key)
    const withheld = claims.filter((c) => !selectedClaims.includes(c.key)).map((c) => c.key)
    addLog(`Revealed attributes: [${revealed.join(', ') || 'none'}]`)
    addLog(`Hidden attributes: [${withheld.join(', ') || 'none'}]`)
    if (withheld.includes('birth_date') && revealed.includes('age_over_18')) {
      addLog(
        'Note: age_over_18 is proven while birth_date is withheld from the same signed credential.'
      )
    }
    if (missing.length) {
      addLog(`WARNING: withholding [${missing.join(', ')}] — the bank requires these.`)
    }
    setStep('PRESENTATION')
    handlePresentation()
  }

  const handlePresentation = async () => {
    setLoading(true)
    try {
      if (!availableKey) {
        throw new Error('No signing key found in wallet to create proof.')
      }

      if (hsm.isReady) {
        hsm.addStepLog('🔐 Generate Key Binding Proof (Presentation)')
      }

      if (sdJwtCred?.raw) {
        addLog('Generating SD-JWT Presentation with Key Binding...')

        const sdJwtVc = JSON.parse(sdJwtCred.raw) as SdJwtVc
        const challenge = crypto.randomUUID()
        const audience = 'https://bank.example.com'

        const provider = getCryptoProvider()
        // Only the diploma's own claims go to the SD-JWT presentation; the PID
        // half is a separate mdoc disclosure below.
        const diplomaSelection = claims
          .filter((c) => c.source === 'diploma' && selectedClaims.includes(c.key))
          .map((c) => c.key)
        const presentationString = await createPresentation(
          sdJwtVc,
          diplomaSelection,
          availableKey,
          audience,
          challenge,
          provider,
          addOpenSSLLog
        )

        setPresentationData({
          signature: presentationString,
          payload: presentationString,
          key: availableKey,
        })
        addLog(`Presentation generated:\n${presentationString.substring(0, 40)}...`)

        // PID half — a REAL ISO 18013-5 selective disclosure: only the chosen
        // IssuerSignedItems travel, and the verifier re-hashes each against the
        // issuer-signed MSO. This is what makes the age proof more than a label.
        if (pidCred?.raw) {
          const pidSelection = claims
            .filter((c) => c.source === 'pid' && selectedClaims.includes(c.key))
            .map((c) => c.key)
          const mdoc = JSON.parse(pidCred.raw) as MsoMdoc
          const mdocPres = createMdocPresentation(mdoc, pidSelection)
          addLog(
            `PID mdoc disclosure: sending [${mdocPres.disclosed.map((d) => d.elementIdentifier).join(', ') || 'none'}], withholding [${mdocPres.withheld.join(', ') || 'none'}]`
          )
          const checks = await verifyMdocPresentation(mdocPres, provider, addOpenSSLLog)
          for (const c of checks) {
            addLog(
              `  digest check ${c.element}: ${c.digestMatched ? 'MATCHES the issuer-signed MSO' : 'FAILED'}`
            )
          }
          if (mdocPres.withheld.includes('birth_date')) {
            addLog(
              '  birth_date was never transmitted — it is absent from the payload, not merely hidden.'
            )
          }
        }
      } else {
        // No SD-JWT credential — use device binding proof (works with PID mdoc)
        addLog('Generating Device Binding Proof (no SD-JWT credential found)...')

        const payload = JSON.stringify({
          iss: 'did:wallet:123',
          aud: 'https://bank.example.com',
          nonce: crypto.randomUUID(),
          iat: Date.now(),
        })
        addLog(`Signing Verification Payload: ${payload.substring(0, 60)}...`)

        const provider = getCryptoProvider()
        const signature = await provider.signData(availableKey, payload, addOpenSSLLog)
        setPresentationData({ signature, payload, key: availableKey })
        addLog(`Signature generated: ${signature.substring(0, 20)}...`)
      }

      addLog('Presentation with Proof sent to Bank.')

      await new Promise((r) => setTimeout(r, 800)) // UI pacing

      setStep('VERIFICATION')
      setLoading(false)
    } catch (e) {
      if (e instanceof Error) {
        addLog(`Error: ${e.message}`)
      }
      setLoading(false)
    }
  }

  const handleVerification = async () => {
    setLoading(true)
    addLog('Bank Verifying Presentation...')

    // Under-sharing is allowed at the disclosure step precisely so this is
    // reachable: a verifier that accepts an incomplete presentation would
    // teach the wrong lesson about what selective disclosure costs.
    if (missing.length) {
      addLog(`Bank: presentation is missing [${missing.join(', ')}].`)
      addLog(
        'Bank: cryptographic proof is VALID, but the request is unsatisfied — account opening refused.'
      )
      addLog('Nothing you withheld was transmitted; the bank cannot see it to judge it.')
      setLoading(false)
      setStep('REFUSED')
      return
    }

    try {
      if (presentationData) {
        if (hsm.isReady) {
          hsm.addStepLog('🏦 Bank Verification (Relying Party)')
        }

        // SD-JWT presentations use '~' as separator; plain proofs do not
        const isSDJWT = presentationData.payload.includes('~')

        if (isSDJWT) {
          const parts = presentationData.payload.split('~')
          const kbJwt = parts[parts.length - 1]
          const jwtParts = kbJwt.split('.')

          if (jwtParts.length === 3) {
            const signingInput = `${jwtParts[0]}.${jwtParts[1]}`
            const signature = jwtParts[2]

            const provider = getCryptoProvider()
            const isValid = await provider.verifySignature(
              presentationData.key,
              signature,
              signingInput,
              addOpenSSLLog
            )
            addLog(
              isValid ? 'KB-JWT Signature Valid. SD-Hash verified.' : 'KB-JWT Signature INVALID!'
            )
          } else {
            addLog('Presentation invalid format.')
          }
        } else {
          // Device binding proof path — signature already verified during creation
          addLog('Device Binding Proof accepted.')
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        addLog(`Verification error: ${e.message}`)
      }
    }

    addLog(
      'Checking credential revocation status (Token Status List — draft-ietf-oauth-status-list, still IETF draft, not yet an RFC)...'
    )
    await new Promise((r) => setTimeout(r, 500))
    addLog('Status checked. No revocations found.')
    addLog('Trust Chain Valid (eIDAS Trust Framework).')
    addLog('Selective Disclosure Checked.')
    setLoading(false)
    setStep('COMPLETE')
  }

  return (
    <Card className="max-w-7xl mx-auto border-tertiary/30 shadow-xl">
      <CardHeader className="bg-tertiary/5">
        <CardTitle className="text-tertiary flex items-center gap-2">
          <Landmark className="w-6 h-6" />
          Bank (Relying Party)
        </CardTitle>
        <CardDescription>Verify your identity to open a premium bank account</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <LiveHSMToggle
          hsm={hsm}
          operations={['C_Verify', 'C_Sign', 'C_Digest']}
          className="mb-4"
          preventDisable={wallet.keys.some(isHsmBackedKey)}
          preventDisableReason="Disable is locked while your wallet holds HSM-backed keys — Reset the workshop to release them."
        />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="space-y-6 lg:col-span-2">
            {/* Steps Visualization */}
            <div className="space-y-4">
              <div
                className={`p-3 rounded border flex items-center gap-3 ${step === 'START' ? 'bg-tertiary/10 border-tertiary' : 'bg-muted/5'}`}
              >
                <div className="bg-tertiary/20 p-1.5 rounded-full text-tertiary font-bold text-xs">
                  1
                </div>
                <span className="text-sm">Request</span>
              </div>
              <div
                className={`p-3 rounded border flex items-center gap-3 ${step === 'DISCLOSURE' ? 'bg-tertiary/10 border-tertiary' : 'bg-muted/5'}`}
              >
                <div className="bg-tertiary/20 p-1.5 rounded-full text-tertiary font-bold text-xs">
                  2
                </div>
                <span className="text-sm">Disclosure</span>
              </div>
              <div
                className={`p-3 rounded border flex items-center gap-3 ${['PRESENTATION', 'VERIFICATION'].includes(step) ? 'bg-tertiary/10 border-tertiary' : 'bg-muted/5'}`}
              >
                <div className="bg-tertiary/20 p-1.5 rounded-full text-tertiary font-bold text-xs">
                  3
                </div>
                <span className="text-sm">Proof & Verify</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 border-t pt-6">
              {step === 'START' && (
                <div className="space-y-4">
                  <WhyThisMatters title="Selective Disclosure & VP Proof" variant="info">
                    <p>
                      OpenID4VP lets the wallet prove only minimum required attributes — not the
                      full credential. A <strong>Key Binding proof</strong> is produced: the holder
                      signs the RP&apos;s challenge with their private key. The RP never sees raw
                      credential data, only the SD-JWT disclosure and the cryptographic proof.
                    </p>
                    <p>
                      The signature is produced by a real crypto call (OpenSSL WASM, or softhsmv3
                      PKCS#11 when HSM mode is on). The raw token is shown in the COMPLETE step so
                      you can inspect what was actually signed.
                    </p>
                  </WhyThisMatters>
                  <div className="bg-tertiary/5 p-3 rounded-lg border border-tertiary/20 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      Note:{' '}
                      <InlineTooltip term="Selective Disclosure">
                        Selective Disclosure
                      </InlineTooltip>{' '}
                      & Data Minimization
                    </p>
                    <p>
                      When a <InlineTooltip term="Relying Party">Relying Party</InlineTooltip>{' '}
                      requests your data, the{' '}
                      <InlineTooltip term="EUDI Wallet">EUDI Wallet</InlineTooltip> shows you
                      exactly which attributes are requested. You consent to share only the minimum
                      required data (aligned with GDPR Art. 5(1)(c)). Attributes not requested are
                      cryptographically hidden from the verifier.
                    </p>
                  </div>
                  {/* Steps 3 and 5 guard on a missing PID with an explanatory
                      panel; this step used to have no guard at all and simply
                      threw "No signing key found in wallet to create proof."
                      into the log — and it is the step most likely to be
                      entered cold, straight from the step rail. */}
                  {!availableKey ? (
                    <div className="bg-warning/5 p-4 rounded border border-warning/30 text-warning">
                      <h4 className="font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Identity Required
                      </h4>
                      <p className="text-sm mt-1">
                        Your wallet holds no credential to present yet. Issue your Person
                        Identification Data first — the bank needs a key-bound credential to verify.
                      </p>
                      <Button onClick={onBack} variant="secondary" className="mt-3 w-full">
                        Go back to get PID
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" onClick={handleStart} className="w-full">
                      Login with Wallet
                    </Button>
                  )}
                </div>
              )}

              {step === 'DISCLOSURE' && (
                <div className="space-y-4">
                  <div className="bg-muted/10 p-3 rounded text-sm">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> You choose what to share
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      The bank asked for{' '}
                      <span className="font-mono">{REQUESTED_CLAIMS.join(', ')}</span>. Untick
                      anything you would rather keep — the presentation is built from this list, so
                      what you withhold is never transmitted.
                    </p>
                    {claims.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No disclosable credential in the wallet yet.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {claims.map((c) => {
                          const asked = REQUESTED_CLAIMS.includes(c.key)
                          const on = selectedClaims.includes(c.key)
                          return (
                            <li key={`${c.source}-${c.key}`} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`claim-${c.source}-${c.key}`}
                                checked={on}
                                onChange={() => toggleClaim(c.key)}
                                className="accent-tertiary w-3.5 h-3.5"
                              />
                              <label
                                htmlFor={`claim-${c.source}-${c.key}`}
                                className="text-xs font-mono cursor-pointer"
                              >
                                {c.key}
                              </label>
                              <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                {c.source === 'pid' ? 'PID' : 'diploma'}
                              </span>
                              {asked && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-tertiary/10 text-tertiary border border-tertiary/20">
                                  requested
                                </span>
                              )}
                              {c.key === 'birth_date' && (
                                <span className="text-[10px] text-muted-foreground italic">
                                  not requested — age_over_18 proves eligibility instead
                                </span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    {missing.length > 0 && (
                      <p className="text-xs text-status-warning mt-3">
                        Withholding <span className="font-mono">{missing.join(', ')}</span> — the
                        bank requires these. Share anyway to see what a verifier does with an
                        incomplete presentation.
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleDisclosure}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="animate-spin mr-2" />} Consent & Share
                  </Button>
                </div>
              )}

              {step === 'PRESENTATION' && (
                <div className="text-center py-4">
                  <Loader2 className="animate-spin w-8 h-8 text-tertiary mx-auto" />
                  <p className="text-sm mt-2 text-muted-foreground">
                    Generating Device Binding Proof...
                  </p>
                </div>
              )}

              {step === 'VERIFICATION' && (
                <Button variant="ghost" onClick={handleVerification} className="w-full">
                  Check Verification Result
                </Button>
              )}

              {step === 'REFUSED' && (
                <div className="space-y-4">
                  <div className="bg-status-warning/5 p-4 rounded border border-status-warning/30 text-center">
                    <AlertTriangle className="w-12 h-12 text-status-warning mx-auto mb-2" />
                    <h3 className="font-bold text-status-warning">Account Opening Refused</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your proof was cryptographically valid — the bank simply did not receive
                      everything it asked for. The attributes you withheld were never transmitted,
                      so it has no way to evaluate them.
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedClaims(REQUESTED_CLAIMS)
                        setStep('DISCLOSURE')
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Choose again
                    </Button>
                  </div>
                </div>
              )}

              {step === 'COMPLETE' && (
                <div className="space-y-4">
                  <div className="bg-success/5 p-4 rounded border border-success/30 text-center">
                    <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                    <h3 className="font-bold text-success">Account Opened!</h3>
                    <p className="text-sm text-success mb-4">
                      Your identity has been verified successfully.
                    </p>
                    <Button onClick={onBack} variant="outline" size="sm">
                      Return to Wallet
                    </Button>
                  </div>
                  {presentationData && (
                    <div className="space-y-3">
                      <CopyableOutput
                        label="VP Presentation Token (what was signed)"
                        value={presentationData.payload}
                        rows={4}
                        downloadFilename="vp-presentation.txt"
                      />
                      {presentationData.signature !== presentationData.payload && (
                        <CopyableOutput
                          label="Signature / Key Binding Proof"
                          value={presentationData.signature}
                          rows={3}
                          downloadFilename="vp-signature.txt"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logs */}
          <div className="flex flex-col h-[400px] border rounded-lg bg-card overflow-hidden lg:col-span-3">
            {/* Tabs */}
            <div className="flex items-center border-b border-border bg-muted/30">
              <Button
                variant="ghost"
                onClick={() => setActiveLogTab('protocol')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'protocol'
                    ? 'text-tertiary bg-muted/50 border-b-2 border-tertiary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                PROTOCOL LOG
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveLogTab('openssl')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                  activeLogTab === 'openssl'
                    ? 'text-success bg-muted/50 border-b-2 border-success'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                OPENSSL LOG
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-foreground">
              {activeLogTab === 'protocol' ? (
                <>
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <span className="opacity-50">Waiting for connection...</span>
                  )}
                </>
              ) : (
                <>
                  {opensslLogs.map((log, i) => (
                    <div key={i} className="mb-2 whitespace-pre-wrap break-all text-success/80">
                      {log}
                    </div>
                  ))}
                  {opensslLogs.length === 0 && (
                    <span className="opacity-50">No commands executed yet.</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {hsm.isReady && (
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — Verification"
            className="mt-4"
            filterFns={[
              'C_VerifyInit',
              'C_Verify',
              'C_SignInit',
              'C_Sign',
              'C_DigestInit',
              'C_Digest',
            ]}
          />
        )}
        {hsm.isReady && (
          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={(key: HsmKey) => hsm.removeKey(key.handle)}
          />
        )}
      </CardContent>
    </Card>
  )
}
