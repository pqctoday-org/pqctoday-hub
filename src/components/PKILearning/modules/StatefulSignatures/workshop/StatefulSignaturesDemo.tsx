import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Info, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { useHSM } from '@/hooks/useHSM'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import hssKatData from '@/data/kat/lms_hss_rfc8554.json'
import xmssKatData from '@/data/kat/xmss_rfc8391.json'
import {
  CKK_HSS,
  CKM_HSS,
  CKM_XMSS_KEY_PAIR_GEN,
  CKK_XMSS,
  CKP_XMSS_SHA2_10_256,
  CKM_XMSS,
} from '@/wasm/softhsm/constants'
import { hsm_generateStatefulKeyPair, hsm_statefulSignBytes } from '@/wasm/softhsm/pqc'
import {
  hsm_importStatefulPublicKey,
  hsm_statefulVerifyBytes,
  hsm_setKatSeed,
  hsm_extractKeyValue,
} from '@/wasm/softhsm'
import { StateManagementVisualizer } from './StateManagementVisualizer'
import { XMSSKeyGenDemo } from './XMSSKeyGenDemo'

function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
}
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

type KatRow = {
  label: string
  hex: string
  type?: 'data' | 'header' | 'pass' | 'fail' | 'warn'
}

const LIVE_OPERATIONS = ['C_GenerateKeyPair', 'C_SignInit', 'C_Sign']

export function StatefulSignaturesDemo() {
  const hsm = useHSM('rust')
  const [activeTab, setActiveTab] = useState<'hss' | 'xmss' | 'kat' | 'comparison'>('hss')
  const [katScheme, setKatScheme] = useState<'hss' | 'xmss'>('hss')
  const [hssKatStatus, setHssKatStatus] = useState<string | null>(null)
  const [xmssKatStatus, setXmssKatStatus] = useState<string | null>(null)

  const [hssHexRows, setHssHexRows] = useState<KatRow[]>([])
  const [xmssHexRows, setXmssHexRows] = useState<KatRow[]>([])

  const handleHssKAT = useCallback(() => {
    if (!hsm.isReady || !hsm.hSessionRef.current || !hsm.moduleRef.current) return
    setHssKatStatus(null)
    setHssHexRows([])
    const M = hsm.moduleRef.current
    const session = hsm.hSessionRef.current
    try {
      const tc = hssKatData.test_cases[0]
      const msgBytes = hexToBytes(tc.message_hex)
      const sigBytes = hexToBytes(tc.signature_hex)
      const pubKeyBytes = hexToBytes(tc.pub_key_hex)
      const rows: KatRow[] = []

      rows.push({ label: 'Source', hex: 'RFC 8554 Appendix F · Test Case 1', type: 'header' })
      rows.push({
        label: 'Algorithm',
        hex: `HSS L=${tc.levels} · ${tc.lms_type} (h=5) · ${tc.lmots_type}`,
      })
      rows.push({ label: 'Public key', hex: `${tc.pub_key_len} B — ${tc.pub_key_hex}` })
      rows.push({ label: 'Message', hex: `${msgBytes.length} B — ${tc.message_hex}` })
      rows.push({
        label: 'Signature',
        hex: `${tc.signature_len} B — Nspk=${parseInt(tc.signature_hex.slice(0, 8), 16)} — ${tc.signature_hex.slice(0, 64)}…`,
      })

      rows.push({
        label: 'C_CreateObject',
        hex: 'CKO_PUBLIC_KEY + CKK_HSS + CKA_VALUE + CKA_VERIFY=true',
        type: 'header',
      })
      const pubHandle = hsm_importStatefulPublicKey(M, session, CKK_HSS, pubKeyBytes)
      hsm.addKey({
        handle: pubHandle,
        family: 'hss',
        role: 'public',
        label: 'HSS Pubkey (RFC 8554 App. F)',
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
      const importedPubBytes = hsm_extractKeyValue(M, session, pubHandle)
      const importedPubHex = bytesToHex(importedPubBytes)
      const pubMatch = importedPubHex === tc.pub_key_hex
      rows.push({ label: '→ handle', hex: `0x${pubHandle.toString(16).padStart(8, '0')}` })
      rows.push({ label: 'RFC pubkey (60 B)', hex: tc.pub_key_hex })
      rows.push({
        label: 'Read-back pubkey',
        hex: `${importedPubHex} ${pubMatch ? '✓ matches RFC' : '✗ mismatch'}`,
        type: pubMatch ? 'pass' : 'fail',
      })

      rows.push({
        label: 'C_VerifyInit + C_Verify',
        hex: `CKM_HSS · msg=${msgBytes.length} B · sig=${sigBytes.length} B`,
        type: 'header',
      })
      const ckrCode = hsm_statefulVerifyBytes(M, session, CKM_HSS, pubHandle, msgBytes, sigBytes)
      const passed = ckrCode === 0
      rows.push({
        label: '→ C_Verify result',
        hex: `0x${ckrCode.toString(16).padStart(8, '0')} — ${passed ? 'CKR_OK ✓' : 'INVALID ✗'}`,
        type: passed ? 'pass' : 'fail',
      })

      rows.push({
        label: 'VERDICT',
        hex: passed ? 'PASS ✓' : 'FAIL ✗',
        type: passed ? 'pass' : 'fail',
      })
      setHssHexRows(rows)

      setHssKatStatus(
        passed
          ? `PASS — C_Verify CKR_OK · RFC 8554 Appendix F Test Case 1 (HSS L=2, LMS_SHA256_M32_H5, LMOTS_SHA256_N32_W8)`
          : `FAIL — C_Verify returned 0x${ckrCode.toString(16).padStart(8, '0')} (expected CKR_OK = 0x00000000)`
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setHssHexRows([{ label: 'EXCEPTION', hex: msg, type: 'fail' }])
      setHssKatStatus(`FAIL: ${msg}`)
    }
  }, [hsm])

  const handleXmssKAT = useCallback(() => {
    if (!hsm.isReady || !hsm.hSessionRef.current || !hsm.moduleRef.current) return
    setXmssKatStatus(null)
    setXmssHexRows([])
    const M = hsm.moduleRef.current
    const session = hsm.hSessionRef.current
    try {
      const tc = xmssKatData.test_cases[0]
      const msgBytes = hexToBytes(tc.message_hex)
      const expectedPubHex = tc.expected_pub_key_hex
      const rows: KatRow[] = []

      rows.push({
        label: 'Source',
        hex: 'NIST SP 800-208 §7 · RFC 8391 §4.1 (no published KAT vectors)',
        type: 'header',
      })
      rows.push({
        label: 'Parameter set',
        hex: `${xmssKatData.parameter_set} · h=10 · n=32 · w=16 · sig=2500 B`,
      })
      rows.push({
        label: 'Validation method',
        hex: 'Known-seed → deterministic keygen → golden pubkey comparison + round-trip sign/verify',
      })
      rows.push({ label: 'Message', hex: `${msgBytes.length} B — ${tc.message_hex}` })

      rows.push({
        label: '_set_kat_seed',
        hex: `96-byte seed: SK_SEED(32×00) ∥ SK_PRF(32×00) ∥ PUB_SEED(32×00)`,
        type: 'header',
      })
      rows.push({ label: 'Seed (96 B)', hex: xmssKatData.kat_seed_hex })
      hsm_setKatSeed(M, xmssKatData.kat_seed_hex)

      rows.push({
        label: 'C_GenerateKeyPair',
        hex: 'CKM_XMSS_KEY_PAIR_GEN · CKP_XMSS_SHA2_10_256',
        type: 'header',
      })
      const { pubHandle, privHandle } = hsm_generateStatefulKeyPair(
        M,
        session,
        CKM_XMSS_KEY_PAIR_GEN,
        CKK_XMSS,
        CKP_XMSS_SHA2_10_256
      )
      hsm.addKey({
        handle: privHandle,
        family: 'xmss',
        role: 'private',
        label: 'XMSS Privkey (zero seed)',
        generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
      rows.push({ label: '→ privHandle', hex: `0x${privHandle.toString(16).padStart(8, '0')}` })
      rows.push({ label: '→ pubHandle', hex: `0x${pubHandle.toString(16).padStart(8, '0')}` })

      rows.push({
        label: 'Pubkey comparison',
        hex: `Expected (golden) vs. Derived (zero seed) — ${tc.expected_pub_key_len} B each`,
        type: 'header',
      })
      const actualPubBytes = hsm_extractKeyValue(M, session, pubHandle)
      const actualPubHex = bytesToHex(actualPubBytes)
      const pubkeyMatch = actualPubHex === expectedPubHex
      // Find first differing byte for diagnostics
      const firstDiff = pubkeyMatch
        ? -1
        : [...Array(Math.min(expectedPubHex.length, actualPubHex.length) / 2)].findIndex(
            (_, i) =>
              expectedPubHex.slice(i * 2, i * 2 + 2) !== actualPubHex.slice(i * 2, i * 2 + 2)
          )
      rows.push({ label: 'Expected pubkey (68 B)', hex: expectedPubHex })
      rows.push({
        label: 'Derived pubkey  (68 B)',
        hex: `${actualPubHex}`,
        type: pubkeyMatch ? 'pass' : 'fail',
      })
      rows.push({
        label: 'Pubkey match',
        hex: pubkeyMatch
          ? `✓ MATCH — all ${tc.expected_pub_key_len} bytes identical`
          : `✗ MISMATCH — first difference at byte ${firstDiff}`,
        type: pubkeyMatch ? 'pass' : 'fail',
      })

      rows.push({
        label: 'C_SignInit + C_Sign',
        hex: `CKM_XMSS · privHandle=0x${privHandle.toString(16)} · msg=${msgBytes.length} B`,
        type: 'header',
      })
      const sig = hsm_statefulSignBytes(M, session, CKM_XMSS, privHandle, msgBytes)
      const sigLenOk = sig.length === tc.expected_sig_len
      rows.push({
        label: `→ sig length`,
        hex: `${sig.length} B ${sigLenOk ? `✓ (expected ${tc.expected_sig_len} B)` : `✗ (expected ${tc.expected_sig_len} B)`}`,
        type: sigLenOk ? 'pass' : 'fail',
      })
      rows.push({ label: 'Signature (2500 B)', hex: bytesToHex(sig) })

      rows.push({
        label: 'C_VerifyInit + C_Verify',
        hex: `CKM_XMSS · pubHandle=0x${pubHandle.toString(16)} · sig=${sig.length} B`,
        type: 'header',
      })
      const ckrCode = hsm_statefulVerifyBytes(M, session, CKM_XMSS, pubHandle, msgBytes, sig)
      const verifyOk = ckrCode === 0
      rows.push({
        label: '→ C_Verify result',
        hex: `0x${ckrCode.toString(16).padStart(8, '0')} — ${verifyOk ? 'CKR_OK ✓' : 'INVALID ✗'}`,
        type: verifyOk ? 'pass' : 'fail',
      })

      const allPass = pubkeyMatch && verifyOk && sigLenOk
      rows.push({
        label: 'VERDICT',
        hex: allPass ? 'PASS ✓' : 'FAIL ✗',
        type: allPass ? 'pass' : 'fail',
      })
      setXmssHexRows(rows)

      if (allPass) {
        setXmssKatStatus(
          `PASS — Pubkey matches golden · C_Verify CKR_OK · sig ${sig.length} B (NIST SP 800-208 XMSS-SHA2_10_256)`
        )
      } else if (!pubkeyMatch) {
        setXmssKatStatus(
          `FAIL — Pubkey mismatch at byte ${firstDiff}: seed injection did not produce expected key`
        )
      } else if (!verifyOk) {
        setXmssKatStatus(`FAIL — C_Verify returned 0x${ckrCode.toString(16).padStart(8, '0')}`)
      } else {
        setXmssKatStatus(
          `WARN — Sig length mismatch: got ${sig.length} B, expected ${tc.expected_sig_len} B`
        )
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setXmssHexRows([{ label: 'EXCEPTION', hex: msg, type: 'fail' }])
      setXmssKatStatus(`FAIL: ${msg}`)
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
                {tab === 'kat' && 'KAT Vectors'}
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
                  <StateManagementVisualizer hsm={hsm} />
                </div>

                {hsm.isReady && (
                  <Pkcs11LogPanel
                    log={hsm.log}
                    onClear={hsm.clearLog}
                    title="PKCS#11 Call Log — HSS / LMS Engine"
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
                  <XMSSKeyGenDemo hsm={hsm} />
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

                {/* Multi-tree production variants comparison */}
                <div className="p-4 border border-border rounded-lg bg-muted/20">
                  <h4 className="text-sm font-bold text-foreground mb-3">
                    Multi-Tree Production Variants: HSS vs XMSS^MT
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Single-tree LMS and XMSS are primarily for learning. Production deployments use
                    their multi-tree variants to dramatically increase the number of available
                    signatures without proportionally increasing key generation time.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 pr-4 text-muted-foreground font-medium">
                            Property
                          </th>
                          <th className="text-left py-1.5 pr-4 text-primary font-medium">
                            HSS (multi-level LMS)
                          </th>
                          <th className="text-left py-1.5 text-secondary font-medium">XMSS^MT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {[
                          ['Spec', 'RFC 8554 §6', 'RFC 8391 §4'],
                          [
                            'Structure',
                            'L independently generated LMS trees; each tree uses its own random seed',
                            'All sub-trees derived from a single master seed via a PRF',
                          ],
                          [
                            'Backup/Recovery',
                            'Each level can be regenerated independently from its seed; partial compromise is isolated',
                            'Compromising the master seed compromises the entire hierarchy',
                          ],
                          [
                            'PKCS#11 v3.2',
                            'CKM_HSS — single mechanism covers L=1..8',
                            'CKM_XMSSMT — separate from single-tree CKM_XMSS',
                          ],
                          [
                            'Key generation',
                            'Generate only the top tree upfront; lower trees are generated on-demand',
                            'Must pre-generate the full top-layer tree; lower layers on-demand',
                          ],
                          [
                            'State storage',
                            '4 bytes (current index) per level = 4×L bytes total',
                            '4 bytes for the global leaf index',
                          ],
                        ].map(([prop, hss, xmssmt]) => (
                          <tr key={prop}>
                            <td className="py-1.5 pr-4 text-muted-foreground">{prop}</td>
                            <td className="py-1.5 pr-4 text-foreground">{hss}</td>
                            <td className="py-1.5 text-foreground">{xmssmt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kat' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Known Answer Tests</h3>
                  <p className="text-sm text-muted-foreground">
                    Verify the WASM PKCS#11 engine against RFC reference test vectors. Select a
                    scheme, then run the KAT. The PKCS#11 call trace appears below.
                  </p>
                </div>

                {/* Scheme selector */}
                <div className="flex items-center gap-6">
                  {(['hss', 'xmss'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="kat-scheme"
                        value={s}
                        checked={katScheme === s}
                        onChange={() => setKatScheme(s)}
                        className="accent-primary w-3.5 h-3.5"
                      />
                      <span
                        className={`text-sm font-medium ${katScheme === s ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        {s === 'hss' ? 'HSS / LMS — RFC 8554' : 'XMSS — RFC 8391'}
                      </span>
                    </label>
                  ))}
                </div>

                {/* HSS panel */}
                {katScheme === 'hss' && (
                  <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
                    <div>
                      <p className="text-sm font-semibold">HSS/LMS · C_CreateObject + CKM_HSS</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        RFC 8554 Appendix F Test Case 1 · LMS_SHA256_M32_H5 · L=2 · imports RFC
                        pubkey → C_VerifyInit + C_Verify with RFC signature
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button onClick={handleHssKAT} disabled={!hsm.isReady} variant="gradient">
                        Run HSS KAT
                      </Button>
                      {hssKatStatus && (
                        <div className="flex items-center gap-2 text-sm">
                          {hssKatStatus.startsWith('PASS') ? (
                            <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-status-error shrink-0" />
                          )}
                          <span className="font-mono text-xs text-foreground">{hssKatStatus}</span>
                        </div>
                      )}
                    </div>
                    {hssHexRows.length > 0 && (
                      <table className="w-full text-xs font-mono border-collapse mt-1">
                        <tbody>
                          {hssHexRows.map((row, i) =>
                            row.type === 'header' ? (
                              <tr key={i} className="border-t-2 border-border bg-muted/30">
                                <td
                                  colSpan={2}
                                  className="py-1.5 px-2 text-xs font-semibold text-muted-foreground tracking-wide"
                                >
                                  {row.label}
                                  {row.hex ? ` — ${row.hex}` : ''}
                                </td>
                              </tr>
                            ) : (
                              <tr key={i} className="border-t border-border/40">
                                <td className="py-1 pr-3 text-muted-foreground whitespace-nowrap w-48 align-top">
                                  {row.label}
                                </td>
                                <td
                                  className={`py-1 break-all align-top ${
                                    row.type === 'pass'
                                      ? 'text-status-success font-semibold'
                                      : row.type === 'fail'
                                        ? 'text-status-error font-semibold'
                                        : 'text-foreground'
                                  }`}
                                >
                                  {row.hex}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* XMSS panel */}
                {katScheme === 'xmss' && (
                  <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
                    <div>
                      <p className="text-sm font-semibold">
                        XMSS · _set_kat_seed + CKM_XMSS_KEY_PAIR_GEN + CKM_XMSS
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        NIST SP 800-208 / RFC 8391 XMSS-SHA2_10_256 · h=10 · deterministic keygen
                        via known seed → pubkey comparison → C_VerifyInit + C_Verify
                      </p>
                      <p className="text-xs text-status-info mt-1">
                        Note: RFC 8391 (informational) does not publish KAT vectors. This test
                        injects a known 96-byte zero seed via the softhsmv3{' '}
                        <code>_set_kat_seed</code> hook, derives the public key deterministically,
                        and compares it against a pre-computed golden value — proving implementation
                        correctness via NIST SP 800-208 parameter compliance.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button onClick={handleXmssKAT} disabled={!hsm.isReady} variant="gradient">
                        Run XMSS KAT
                      </Button>
                      {xmssKatStatus && (
                        <div className="flex items-center gap-2 text-sm">
                          {xmssKatStatus.startsWith('PASS') ? (
                            <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
                          ) : xmssKatStatus.startsWith('WARN') ? (
                            <Info className="h-4 w-4 text-status-warning shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-status-error shrink-0" />
                          )}
                          <span className="font-mono text-xs text-foreground">{xmssKatStatus}</span>
                        </div>
                      )}
                    </div>
                    {xmssHexRows.length > 0 && (
                      <table className="w-full text-xs font-mono border-collapse mt-1">
                        <tbody>
                          {xmssHexRows.map((row, i) =>
                            row.type === 'header' ? (
                              <tr key={i} className="border-t-2 border-border bg-muted/30">
                                <td
                                  colSpan={2}
                                  className="py-1.5 px-2 text-xs font-semibold text-muted-foreground tracking-wide"
                                >
                                  {row.label}
                                  {row.hex ? ` — ${row.hex}` : ''}
                                </td>
                              </tr>
                            ) : (
                              <tr key={i} className="border-t border-border/40">
                                <td className="py-1 pr-3 text-muted-foreground whitespace-nowrap w-48 align-top">
                                  {row.label}
                                </td>
                                <td
                                  className={`py-1 break-all align-top ${
                                    row.type === 'pass'
                                      ? 'text-status-success font-semibold'
                                      : row.type === 'fail'
                                        ? 'text-status-error font-semibold'
                                        : 'text-foreground'
                                  }`}
                                >
                                  {row.hex}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* PKCS#11 call trace */}
                {hsm.isReady && (
                  <Pkcs11LogPanel
                    log={hsm.log}
                    onClear={hsm.clearLog}
                    title="PKCS#11 Call Log — KAT Execution"
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
