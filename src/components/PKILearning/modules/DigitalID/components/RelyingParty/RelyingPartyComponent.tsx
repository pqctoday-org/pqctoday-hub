// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Landmark, CheckCircle, Loader2, Eye, AlertTriangle } from 'lucide-react'
import type { WalletInstance } from '../../types'
import { useDigitalIDLogs } from '../../hooks/useDigitalIDLogs'
import { createPresentation } from '../../utils/sdjwt-utils'
import {
  verifySampleSdPresentation,
  sampleHolderMatchesIssuer,
} from '../../utils/samplePresentation'
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

type DisclosureSource = 'diploma' | 'pid'
type DisclosureClaim = { key: string; source: DisclosureSource }
const BANK_AUDIENCE = 'https://bank.example.com'
const OTHER_AUDIENCE = 'https://other-bank.example.com'

const REQUESTED_CLAIMS: DisclosureClaim[] = [
  { key: 'family_name', source: 'pid' },
  { key: 'given_name', source: 'pid' },
  { key: 'degree', source: 'diploma' },
  { key: 'age_over_18', source: 'pid' },
]
const claimId = ({ source, key }: DisclosureClaim) => `${source}:${key}`
const claimLabel = ({ source, key }: DisclosureClaim) =>
  `${key} (${source === 'pid' ? 'PID' : 'diploma'})`
const DEFAULT_SELECTION = REQUESTED_CLAIMS.map(claimId)

export const RelyingPartyComponent: React.FC<RelyingPartyComponentProps> = ({
  wallet,
  hsm,
  onBack,
}) => {
  const [step, setStep] = useState<RPStep>('START')
  const [loading, setLoading] = useState(false)
  const [verifyOtherAudience, setVerifyOtherAudience] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [presentationData, setPresentationData] = useState<{
    signature: string
    payload: string
    key: CryptoKey
    nonce: string
    issuerJwt?: string
    pid?: ReturnType<typeof createMdocPresentation>
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

  /** The SD-JWT credential this presentation will disclose from, if any. */
  const sdJwtCred = wallet.credentials.find(
    (c) => c.type.includes('UniversityDegreeCredential') || c.format === 'dc+sd-jwt'
  )
  /** The PID (mdoc) — carries age_over_18 and birth_date. */
  const pidCred = wallet.credentials.find(
    (c) => c.type.includes('PersonIdentificationData') || c.format === 'mso_mdoc'
  )

  // Use the credential's saved sample key binding rather than the wallet's first key.
  const availableKey = wallet.keys.find((key) => {
    if (key.usage !== 'SIGN') return false
    if (!sdJwtCred?.raw) return true
    try {
      return sampleHolderMatchesIssuer(key, (JSON.parse(sdJwtCred.raw) as SdJwtVc).issuerJwt)
    } catch {
      return false
    }
  })

  /** Every claim the holder could disclose, per credential, read from the credentials themselves. */
  const availableClaims = (): DisclosureClaim[] => {
    const out: DisclosureClaim[] = []
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

  const [selectedClaims, setSelectedClaims] = useState(DEFAULT_SELECTION)
  const toggleClaim = (id: string) =>
    setSelectedClaims((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const selected = (claim: DisclosureClaim) => selectedClaims.includes(claimId(claim))
  const unavailable = REQUESTED_CLAIMS.filter(
    (required) => !claims.some((claim) => claimId(claim) === claimId(required))
  )
  const withheldRequired = REQUESTED_CLAIMS.filter(
    (required) => !unavailable.includes(required) && !selected(required)
  )
  const requestedLabels = REQUESTED_CLAIMS.map(claimLabel).join(', ')

  const handleStart = () => {
    addLog('Connecting to Bank (Relying Party)...')
    addLog(`Bank requests: [${requestedLabels}] for Account Opening.`)
    addLog(
      'age_over_18 is requested INSTEAD of birth_date — the bank needs eligibility, not your date of birth.'
    )
    setStep('DISCLOSURE')
  }

  const handleDisclosure = () => {
    addLog('User Review: Selective Disclosure applied.')
    const revealed = claims.filter(selected).map(claimLabel)
    const withheld = claims.filter((claim) => !selected(claim)).map(claimLabel)
    addLog(`Revealed attributes: [${revealed.join(', ') || 'none'}]`)
    addLog(`Hidden attributes: [${withheld.join(', ') || 'none'}]`)
    if (unavailable.length || withheldRequired.length) {
      addLog(
        `Sample request is incomplete: ${[...unavailable, ...withheldRequired].map(claimLabel).join(', ')}.`
      )
    }
    setStep('PRESENTATION')
    handlePresentation()
  }

  const handlePresentation = async () => {
    setLoading(true)
    setVerificationError(null)
    setPresentationData(null)
    try {
      if (!availableKey) {
        throw new Error('No signing key found in wallet to create proof.')
      }

      if (hsm.isReady) {
        hsm.addStepLog('🔐 Generate Key Binding Proof (Presentation)')
      }

      const provider = getCryptoProvider()
      const nonce = crypto.randomUUID()
      let signature: string
      let payload: string
      let issuerJwt: string | undefined

      if (sdJwtCred?.raw) {
        addLog('Generating SD-JWT Presentation with Key Binding...')
        const sdJwtVc = JSON.parse(sdJwtCred.raw) as SdJwtVc
        const diplomaSelection = claims
          .filter((claim) => claim.source === 'diploma' && selected(claim))
          .map((claim) => claim.key)
        payload = await createPresentation(
          sdJwtVc,
          diplomaSelection,
          availableKey,
          BANK_AUDIENCE,
          nonce,
          provider,
          addOpenSSLLog
        )
        signature = payload
        issuerJwt = sdJwtVc.issuerJwt
      } else {
        addLog('Generating Device Binding Proof (no SD-JWT credential found)...')
        payload = JSON.stringify({
          iss: 'did:wallet:123',
          aud: BANK_AUDIENCE,
          nonce,
          iat: Date.now(),
        })
        signature = await provider.signData(availableKey, payload, addOpenSSLLog)
      }

      const pidSelection = claims
        .filter((claim) => claim.source === 'pid' && selected(claim))
        .map((claim) => claim.key)
      const pid = pidCred?.raw
        ? createMdocPresentation(JSON.parse(pidCred.raw) as MsoMdoc, pidSelection)
        : undefined
      if (pid) {
        addLog(
          `PID mdoc disclosure: sending [${pid.disclosed.map((item) => item.elementIdentifier).join(', ') || 'none'}], withholding [${pid.withheld.join(', ') || 'none'}]`
        )
      }
      setPresentationData({ signature, payload, key: availableKey, nonce, issuerJwt, pid })
      addLog('Presentation with Proof sent to Bank.')

      await new Promise((r) => setTimeout(r, 800)) // UI pacing

      setStep('VERIFICATION')
      setLoading(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sample presentation failed.'
      addLog(message)
      setVerificationError(message)
      setPresentationData(null)
      setLoading(false)
      setStep('REFUSED')
    }
  }

  const handleVerification = async () => {
    setLoading(true)
    setVerificationError(null)
    addLog('Checking the sample presentation...')
    try {
      if (!presentationData) throw new Error('No complete sample presentation is available.')
      const provider = getCryptoProvider()
      const expectedAudience = verifyOtherAudience ? OTHER_AUDIENCE : BANK_AUDIENCE
      let diplomaClaims: string[] = []
      if (presentationData.issuerJwt) {
        diplomaClaims = await verifySampleSdPresentation(
          presentationData.payload,
          {
            issuerJwt: presentationData.issuerJwt,
            nonce: presentationData.nonce,
            audience: expectedAudience,
          },
          presentationData.key,
          provider,
          addOpenSSLLog
        )
        addLog(
          'Sample holder signature, saved key confirmation, nonce/audience and disclosure digest bindings passed.'
        )
      } else {
        const payload = JSON.parse(presentationData.payload)
        if (payload.nonce !== presentationData.nonce || payload.aud !== expectedAudience)
          throw new Error('Sample device-proof challenge mismatch.')
        if (
          !(await provider.verifySignature(
            presentationData.key,
            presentationData.signature,
            presentationData.payload,
            addOpenSSLLog
          ))
        )
          throw new Error(
            'Sample device-binding signature check did not pass. Inspect the operation log for the cause.'
          )
        addLog('Sample device-binding signature and challenge passed.')
      }
      const pidChecks = presentationData.pid
        ? await verifyMdocPresentation(presentationData.pid, provider, addOpenSSLLog)
        : []
      if (pidChecks.some((check) => !check.digestMatched))
        throw new Error('Sample PID disclosure digest verification failed.')
      for (const check of pidChecks) addLog(`PID digest matches the saved MSO: ${check.element}.`)
      const verifiedClaims = {
        diploma: diplomaClaims,
        pid: pidChecks.map((check) => check.element),
      }
      const missing = REQUESTED_CLAIMS.filter(
        (claim) => !verifiedClaims[claim.source].includes(claim.key)
      )
      if (missing.length)
        throw new Error(`The sample request is missing: ${missing.map(claimLabel).join(', ')}.`)
      addLog(
        'Issuer-chain trust, revocation/status and account-approval decisions are simulated assumptions, not checks performed by this exercise.'
      )
      addLog(
        'The sample does not implement a complete SD-JWT/mdoc verifier or production freshness policy.'
      )
      setStep('COMPLETE')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sample presentation verification failed.'
      addLog(message)
      setVerificationError(message)
      setStep('REFUSED')
    } finally {
      setLoading(false)
    }
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
        {verificationError && (
          <p role="alert" className="text-status-error">
            {verificationError}
          </p>
        )}
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
                      The bank asked for <span className="font-mono">{requestedLabels}</span>.
                      Untick anything you would rather keep — the presentation is built from this
                      list, so what you withhold is never transmitted.
                    </p>
                    {claims.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No disclosable credential in the wallet yet.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {claims.map((c) => {
                          const asked = DEFAULT_SELECTION.includes(claimId(c))
                          const on = selected(c)
                          return (
                            <li key={`${c.source}-${c.key}`} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`claim-${c.source}-${c.key}`}
                                checked={on}
                                onChange={() => toggleClaim(claimId(c))}
                                aria-label={claimLabel(c)}
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
                    {unavailable.length > 0 && (
                      <p className="text-xs text-status-warning mt-3">
                        The wallet lacks {unavailable.map(claimLabel).join(', ')}. Share the
                        available claims to see how the bank handles the incomplete request.
                      </p>
                    )}
                    {withheldRequired.length > 0 && (
                      <p className="text-xs text-status-warning mt-3">
                        You chose to withhold {withheldRequired.map(claimLabel).join(', ')}. The
                        bank requires these attributes.
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
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    The holder signed for {BANK_AUDIENCE}. Try the same presentation with another
                    recipient to see how the audience check works.
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={verifyOtherAudience}
                      onChange={(event) => setVerifyOtherAudience(event.target.checked)}
                    />
                    Verify for another recipient
                  </label>
                  <Button
                    variant="ghost"
                    onClick={handleVerification}
                    disabled={loading}
                    className="w-full"
                  >
                    Check Verification Result
                  </Button>
                </div>
              )}

              {step === 'REFUSED' && (
                <div className="space-y-4">
                  <div className="bg-status-warning/5 p-4 rounded border border-status-warning/30 text-center">
                    <AlertTriangle className="w-12 h-12 text-status-warning mx-auto mb-2" />
                    <h3 className="font-bold text-status-warning">Account Opening Refused</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A sample proof check failed or required information was missing. Read the
                      recorded reason above before trying again. Withheld attributes are not
                      transmitted by this sample presentation.
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedClaims(DEFAULT_SELECTION)
                        setVerifyOtherAudience(false)
                        setVerificationError(null)
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
                    <h3 className="font-bold text-success">Sample account opening accepted</h3>
                    <p className="text-sm text-success mb-4">
                      Sample proof checks passed. Identity approval, issuer trust, status checks and
                      the account decision remain simulated.
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
                    <span className="text-muted-foreground">Waiting for connection...</span>
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
                    <span className="text-muted-foreground">No commands executed yet.</span>
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
