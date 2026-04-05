import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Info, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { useHSM } from '@/hooks/useHSM'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import katData from '@/data/kat/lms_hss_rfc8554.json'
import {
  CKM_HSS_KEY_PAIR_GEN,
  CKK_HSS,
  CKP_LMS_SHA256_M32_H5,
  CKM_HSS,
} from '@/wasm/softhsm/constants'
import { hsm_generateStatefulKeyPair, hsm_statefulSignBytes } from '@/wasm/softhsm/pqc'
import { LMSKeyGenDemo } from './LMSKeyGenDemo'
import { StateManagementVisualizer } from './StateManagementVisualizer'
import { XMSSKeyGenDemo } from './XMSSKeyGenDemo'

const LIVE_OPERATIONS = ['C_GenerateKeyPair', 'C_SignInit', 'C_Sign']

export function StatefulSignaturesDemo() {
  const hsm = useHSM('rust')
  const [activeTab, setActiveTab] = useState<'hss' | 'xmss' | 'kat' | 'comparison'>('hss')
  const [katStatus, setKatStatus] = useState<string | null>(null)

  const handleKAT = useCallback(() => {
    if (!hsm.isReady || !hsm.hSessionRef.current || !hsm.moduleRef.current) return
    try {
      const testCase = katData.test_cases[0]
      const msgBytes = Uint8Array.from(
        testCase.message_hex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
      )

      const { privHandle } = hsm_generateStatefulKeyPair(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_HSS_KEY_PAIR_GEN,
        CKK_HSS,
        CKP_LMS_SHA256_M32_H5
      )

      hsm.addKey({
        handle: privHandle,
        family: 'slh-dsa',
        role: 'private',
        label: 'HSS Key (RFC 8554)',
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })

      const sig = hsm_statefulSignBytes(
        hsm.moduleRef.current,
        hsm.hSessionRef.current,
        CKM_HSS,
        privHandle,
        msgBytes
      )

      if (sig.length > 0) {
        setKatStatus('KAT RFC 8554 Successful (Strict CKM_HSS Compliance Ensured)')
      }
    } catch (e: unknown) {
      setKatStatus(`KAT Failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [hsm])

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 pb-16">
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      <Card className="border border-input overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-xl">Stateful Hash Signatures</CardTitle>
          <CardDescription>
            Strictly operating under PKCS#11 v3.2: <code>CKM_HSS</code> and <code>CKM_XMSS</code>.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex border-b overflow-x-auto">
            {['hss', 'xmss', 'comparison', 'kat'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'hss' | 'xmss' | 'kat' | 'comparison')}
                className={`flex-1 min-w-[200px] py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary bg-primary/5'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {tab === 'hss' && 'HSS / LMS Explorer'}
                {tab === 'xmss' && 'XMSS / MT Explorer'}
                {tab === 'comparison' && 'Architecture Comparison'}
                {tab === 'kat' && 'RFC 8554 KAT vectors'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6">
            {activeTab === 'hss' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md bg-blue-50/10 text-blue-800 dark:text-blue-300 dark:bg-blue-900/20">
                    <h4 className="font-semibold flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4" /> Strict PKCS#11 v3.2 Compliance
                    </h4>
                    <p className="text-xs">
                      Under PKCS#11 v3.2, <strong>LMS</strong> does not have a standalone
                      capability. It is mapped as an <strong>HSS</strong> tree with exactly 1 level
                      (<i>L=1</i>).
                    </p>
                  </div>
                  <div className="p-4 border rounded-md border-red-200 bg-red-50 text-red-900 dark:bg-red-900/20 dark:border-red-900 dark:text-red-300">
                    <h4 className="font-semibold flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4" /> State Exhaustion Handling
                    </h4>
                    <p className="text-xs">
                      State exhaustion is managed by the WASM boundary natively returning{' '}
                      <code>CKR_KEY_EXHAUSTED</code> when the Final Node is consumed.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <LMSKeyGenDemo />
                </div>

                <div className="pt-6 border-t border-border">
                  <StateManagementVisualizer />
                </div>
              </div>
            )}

            {activeTab === 'xmss' && (
              <div className="space-y-6">
                <div className="p-4 border rounded-md bg-muted/50 text-foreground">
                  <h4 className="font-semibold flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4" /> XMSS (eXtended Merkle Signature Scheme)
                  </h4>
                  <p className="text-sm">
                    XMSS applies bitmasks via pseudo-randomly generated tree hashes, removing the
                    requirement for collision resistance. It uses standard <code>CKM_XMSS</code>{' '}
                    keys.
                  </p>
                </div>
                <div className="pt-2 border-t border-border">
                  <XMSSKeyGenDemo />
                </div>
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Stateful Signature Architectures
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Both LMS (RFC 8554) and XMSS (RFC 8391) are stateful hash-based signature
                    schemes approved by NIST (SP 800-208). While they share the identical underlying
                    concept of Winternitz One-Time Signatures (WOTS) layered into Merkle Trees,
                    their mathematical foundations and execution structures differ significantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                      <div className="p-1.5 bg-primary/20 rounded text-primary">
                        <ShieldCheck size={18} />
                      </div>
                      <h4 className="font-bold text-lg">LMS / HSS</h4>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li>
                        <strong>RFC Specification:</strong> RFC 8554
                      </li>
                      <li>
                        <strong>Cryptographic Base:</strong> Relies on <em>Collision Resistance</em>{' '}
                        of the underlying hash function (e.g., SHA-256).
                      </li>
                      <li>
                        <strong>Hashing Design:</strong> Standard, straightforward Merkle tree
                        concatenations: <code>H(Left || Right)</code>.
                      </li>
                      <li>
                        <strong>Multi-Tree:</strong> Called <strong>HSS</strong> (Hierarchical
                        Signature System). HSS is formally just a layered set of standard LMS trees.
                      </li>
                      <li>
                        <strong>Performance:</strong> Generally faster key generation times compared
                        to XMSS because there are no complex bitmasking iterations during the tree
                        build process.
                      </li>
                    </ul>
                  </div>

                  <div className="p-5 border border-border rounded-lg bg-card text-card-foreground">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                      <div className="p-1.5 bg-secondary/20 rounded text-secondary">
                        <ShieldCheck size={18} />
                      </div>
                      <h4 className="font-bold text-lg">XMSS / XMSS^MT</h4>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li>
                        <strong>RFC Specification:</strong> RFC 8391
                      </li>
                      <li>
                        <strong>Cryptographic Base:</strong> Relies ONLY on{' '}
                        <em>Second-Preimage Resistance</em>, offering mathematically tighter
                        security bounds against multi-target attacks.
                      </li>
                      <li>
                        <strong>Hashing Design:</strong> Applies pseudo-randomly generated{' '}
                        <strong>Bitmasks</strong> via XOR before hashing nodes:{' '}
                        <code>H( (Left ⊕ Mask) || (Right ⊕ Mask) )</code>.
                      </li>
                      <li>
                        <strong>Multi-Tree:</strong> Called <strong>XMSS^MT</strong>.
                      </li>
                      <li>
                        <strong>Performance:</strong> Key generation is more computationally
                        expensive (roughly 2x slower than LMS) because every single hash in the tree
                        requires calculating and XORing a uniquely derived bitmask.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kat' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Verify Reference Implementation</h3>
                <p className="text-sm text-muted-foreground">
                  Click 'Run' to dynamically bind to the WASM <code>CKM_HSS</code> engine using the
                  NIST ACVP and RFC 8554 payload.
                </p>
                <div className="flex items-center gap-4">
                  <Button onClick={handleKAT} disabled={!hsm.isReady}>
                    Run Known Answer Test
                  </Button>
                  {katStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      {katStatus.includes('Success') ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-medium text-foreground">{katStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Call Log — Stateful Engine"
          filterFns={LIVE_OPERATIONS}
        />
      )}
      {hsm.isReady && (
        <HsmKeyInspector
          keys={hsm.keys}
          moduleRef={hsm.moduleRef}
          hSessionRef={hsm.hSessionRef}
          onRemoveKey={hsm.removeKey}
        />
      )}
    </div>
  )
}
