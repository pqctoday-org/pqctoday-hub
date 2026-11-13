// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Play, ExternalLink, ShieldCheck, Wifi, Server } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { deriveTlsImporterSample, TLS_SAMPLE_CONTEXT } from './tlsPskImporterSample'
import { createSshExchangeSample, assessSshExchange, sshSampleHex } from './sshExchangeHashSample'
import {
  createSampleQkdNode,
  generateEcp256KeyPair,
  ppkIdOpaqueFromQkdKeyId,
  runIkeQkdSample,
  type IkeSaKeys,
  type PpkMixResult,
  type PpkPathOutcome,
} from './ikev2KeyDerivationSample'

function getRandomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getQkdJson(qkdSecret: string): string {
  const hexArray = qkdSecret.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  const base64Key = btoa(String.fromCharCode(...hexArray))
  const keyId = crypto.randomUUID ? crypto.randomUUID() : getRandomHex(16)
  return JSON.stringify({ keys: [{ key_ID: keyId, key: base64Key }] }, null, 2)
}

async function hkdfDerive(ikm: Uint8Array, info: string, length: number): Promise<string> {
  const ikmCopy = new Uint8Array(ikm) as Uint8Array<ArrayBuffer>
  const keyMaterial = await crypto.subtle.importKey('raw', ikmCopy, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32).buffer,
      info: new TextEncoder().encode(info).buffer,
    },
    keyMaterial,
    length * 8
  )
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Local UI attempt tracking; it does not change the sample cryptographic operations.
function useSampleOperation<T>() {
  const [result, setResult] = useState<T | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const generation = useRef(0)
  const busy = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const run = useCallback(async (operation: () => T | Promise<T>) => {
    if (busy.current) return
    busy.current = true
    const attempt = ++generation.current
    setRunning(true)
    setResult(null)
    setError(null)
    try {
      const next = await operation()
      if (mounted.current && generation.current === attempt) setResult(next)
    } catch (cause) {
      if (mounted.current && generation.current === attempt)
        setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      busy.current = false
      if (mounted.current) setRunning(false)
    }
  }, [])
  return { result, running, error, run }
}

interface TlsSampleView {
  qkdSecret: string
  qkdResponseJson: string
  keyId: string
  serializedIdentity: string
  identityHash: string
  epskx: string
  hkdfLabel: string
  ipsk: string
  earlySecret: string
}
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

// ─── TLS 1.3 Panel ──────────────────────────────────────────────────────────

const TLSPanel: React.FC = () => {
  const { result, running, error, run: runSample } = useSampleOperation<TlsSampleView>()
  const run = useCallback(
    () =>
      runSample(async () => {
        const qkdSecret = getRandomHex(32)
        const pskBytes = new Uint8Array(32)
        for (let i = 0; i < 32; i++) pskBytes[i] = parseInt(qkdSecret.slice(i * 2, i * 2 + 2), 16)
        const qkdResponseJson = getQkdJson(qkdSecret)
        const response = JSON.parse(qkdResponseJson) as { keys: { key_ID: string }[] }
        const keyId = response.keys[0]?.key_ID
        if (!keyId) throw new Error('Local sample key_ID is missing')
        const computed = await deriveTlsImporterSample(
          pskBytes,
          new TextEncoder().encode(keyId),
          new TextEncoder().encode(TLS_SAMPLE_CONTEXT)
        )
        return {
          qkdSecret,
          qkdResponseJson,
          keyId,
          serializedIdentity: hex(computed.serializedIdentity),
          identityHash: hex(computed.identityHash),
          epskx: hex(computed.epskx),
          hkdfLabel: hex(computed.hkdfLabel),
          ipsk: hex(computed.ipsk),
          earlySecret: hex(computed.earlySecret),
        }
      }),
    [runSample]
  )

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">
            TLS 1.3 — Executed Importer Mechanics Sample
          </h3>
          <a
            href="https://datatracker.ietf.org/doc/html/rfc9258"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
          >
            RFC 9258 <ExternalLink size={11} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          This worked example computes RFC 9258 importer mechanics from a synthetic 32-byte EPSK,
          its fake key_ID, and an explicitly public sample context. It selects TLS 1.3 (0x0304),
          target HKDF-SHA-256 (0x0001, 32 bytes), and EPSK-associated SHA-256. The context is a
          teaching input, not a QKD channel binding. No TLS handshake, remote key delivery or peer
          runs here.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① Key Delivery Reference — Not Executed</div>
          <code className="text-muted-foreground block">
            POST /api/v1/keys/&#123;slave_SAE_ID&#125;/enc_keys
          </code>
          <div className="mt-1 text-muted-foreground">
            Peer: POST /api/v1/keys/&#123;master_SAE_ID&#125;/dec_keys with delivered key_IDs.
            Mutual TLS authenticates SAE and KME before API use.
          </div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">
            ② Importer Mechanics — Computed Locally
          </div>
          <div className="text-muted-foreground">
            Serialize the external identity and context with 16-bit byte lengths, then the target
            protocol and KDF. Extract epskx, hash the full identity and expand with the TLS 1.3
            "derived psk" label. The local IPSK is the input to the Early Secret calculation.
          </div>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ TLS 1.3 Handshake — Omitted</div>
          <div className="text-muted-foreground">
            Use production tools to inspect the negotiated PSK mode, imported identity and binder,
            peer authentication and derived-key agreement. No handshake or peer runs in this panel.
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-bold text-muted-foreground mb-1">
          What changes with QKD vs. standard TLS 1.3
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            <strong>Without a PSK</strong>: Early Secret = HKDF-Extract(0, 0); the (EC)DHE shared
            secret enters at the Handshake Secret
          </li>
          <li>
            <strong>With a PSK in the actual TLS key schedule</strong>: Early Secret =
            HKDF-Extract(0, PSK). Zero is the salt; PSK is the input keying material. RFC 9258
            diversification happens before that step. This sample computes the selected importer and
            Early Secret mechanics; it does not execute TLS negotiation or a binder check.
          </li>
          <li>
            RFC 9258 imported PSKs use the binder label &quot;imp binder&quot;. Both endpoints need
            compatible importer and binder handling; that compatibility alone does not guarantee PSK
            selection or TLS handshake success. Other negotiation and authentication checks must
            also succeed.
          </li>
        </ul>
      </div>

      <Button
        variant="gradient"
        onClick={run}
        disabled={running}
        className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Calculating…' : 'Run TLS Importer Mechanics'}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-status-error">
          Sample operation failed: {error}. Retry when ready.
        </p>
      )}
      {result && (
        <div className="bg-success/5 rounded p-4 border border-success/20 space-y-3">
          <div className="text-xs font-bold text-success">
            Importer mechanics calculated locally — no handshake validation
          </div>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">
              Locally Generated Sample Key Container
            </div>
            <pre className="text-xs font-mono text-primary overflow-auto whitespace-pre-wrap break-all">
              {result.qkdResponseJson}
            </pre>
          </div>
          <dl className="space-y-3 text-xs">
            {[
              ['Synthetic EPSK (32 bytes, hex)', result.qkdSecret],
              ['External identity (fake key_ID, UTF8)', result.keyId],
              ['Public sample context (not a QKD channel binding)', TLS_SAMPLE_CONTEXT],
              [
                'Selected target protocol / target KDF / EPSK hash',
                '0x0304 TLS 1.3 / 0x0001 HKDF-SHA-256, 32 bytes / SHA-256',
              ],
              ['Serialized ImportedIdentity (hex)', result.serializedIdentity],
              ['SHA-256(ImportedIdentity)', result.identityHash],
              ['epskx = HKDF-Extract(zero salt, EPSK)', result.epskx],
              ['TLS 1.3 HkdfLabel for derived psk (hex)', result.hkdfLabel],
              ['Calculated IPSK (32 bytes, sample context)', result.ipsk],
              ['Early Secret = HKDF-Extract(zero salt, IPSK)', result.earlySecret],
            ].map(([label, value]) => (
              <div key={label} className="bg-background rounded p-3 border border-border">
                <dt className="text-muted-foreground mb-1">{label}</dt>
                <dd>
                  <code className="font-mono break-all">{value}</code>
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            The UUID, local EPSK and public context are fictional inputs. This calculation does not
            establish QKD-derived key delivery, a protocol-specific channel binding, TLS binder
            validation, authentication or negotiated key agreement. With your production tools,
            inspect matching imported identities/contexts and negative binder/handshake tests for
            the actual supported profile.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── IKEv2 Panel ─────────────────────────────────────────────────────────────

interface IkeView {
  ni: string
  nr: string
  spiI: string
  spiR: string
  sharedX: string
  skeyseed: string
  qkdKeyId: string
  qkdResponseJson: string
  ppkIdHex: string
  mandatory: boolean
  plain: Record<string, string>
  withPpk: PpkPathView
  withoutPpk: PpkPathView
  /** What the supplied key stores actually produce; Path 1 is only claimed when this is 'ppk'. */
  actualPath: PpkPathOutcome['path']
}
type PpkPathView =
  | {
      path: 'ppk'
      initiator: PpkSideView
      responderMatches: boolean
    }
  | { path: 'plain-ikev2'; reason: string }
  | { path: 'abort'; reason: string }
interface PpkSideView {
  skD: string
  skPi: string
  skPr: string
  primedSkD: string
  primedSkPi: string
  primedSkPr: string
}

const IKE_UNCHANGED_KEYS: [string, keyof IkeSaKeys][] = [
  ['SK_ai', 'skAi'],
  ['SK_ar', 'skAr'],
  ['SK_ei', 'skEi'],
  ['SK_er', 'skEr'],
]

function uuidV4(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const h = hex(bytes)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

function sideView(side: PpkMixResult): PpkSideView {
  return {
    skD: hex(side.keys.skD),
    skPi: hex(side.keys.skPi),
    skPr: hex(side.keys.skPr),
    primedSkD: hex(side.primed.skD),
    primedSkPi: hex(side.primed.skPi),
    primedSkPr: hex(side.primed.skPr),
  }
}

function pathView(outcome: PpkPathOutcome): PpkPathView {
  if (outcome.path === 'ppk') {
    const initiator = sideView(outcome.initiator)
    const responder = sideView(outcome.responder)
    return {
      path: 'ppk',
      initiator,
      responderMatches:
        initiator.skD === responder.skD &&
        initiator.skPi === responder.skPi &&
        initiator.skPr === responder.skPr,
    }
  }
  return outcome
}

const KeyRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-background rounded p-3 border border-border">
    <dt className="text-xs text-muted-foreground mb-1">{label}</dt>
    <dd>
      <code className="text-xs font-mono break-all">{value}</code>
    </dd>
  </div>
)

const IKEv2Panel: React.FC = () => {
  const { result, running, error, run: runSample } = useSampleOperation<IkeView>()
  const [mandatory, setMandatory] = useState(false)

  const run = useCallback(
    () =>
      runSample(() => {
        const ni = randomBytes(32)
        const nr = randomBytes(32)
        const spiI = randomBytes(8)
        const spiR = randomBytes(8)
        // Fictional peers. Each peer holds only its own private value.
        const initiator = generateEcp256KeyPair()
        const responder = generateEcp256KeyPair()
        // ETSI GS QKD 014: the master side obtains a key and its key_ID; the peer's own node later
        // returns the same key for that key_ID. Both nodes are local stand-ins here.
        const qkdKey = randomBytes(32)
        const qkdKeyId = uuidV4()
        const initiatorNode = createSampleQkdNode(new Map([[qkdKeyId, qkdKey]]))
        // Both nodes hold the key here; the fallback path is computed from the same exchange with the responder's node empty.
        const responderNode = createSampleQkdNode(new Map([[qkdKeyId, qkdKey]]))
        const outcome = runIkeQkdSample({
          ni,
          nr,
          spiI,
          spiR,
          initiator,
          responder,
          qkdKeyId,
          initiatorNode,
          responderNode,
          ppkMandatory: mandatory,
        })
        const qkdResponseJson = JSON.stringify(
          { keys: [{ key_ID: qkdKeyId, key: btoa(String.fromCharCode(...qkdKey)) }] },
          null,
          2
        )
        return {
          ni: hex(ni),
          nr: hex(nr),
          spiI: hex(spiI),
          spiR: hex(spiR),
          sharedX: hex(outcome.sharedXInitiator),
          skeyseed: hex(outcome.plain.skeyseed),
          qkdKeyId,
          qkdResponseJson,
          ppkIdHex: hex(ppkIdOpaqueFromQkdKeyId(qkdKeyId)),
          mandatory,
          plain: {
            'SK_d′': hex(outcome.plain.skD),
            SK_ai: hex(outcome.plain.skAi),
            SK_ar: hex(outcome.plain.skAr),
            SK_ei: hex(outcome.plain.skEi),
            SK_er: hex(outcome.plain.skEr),
            'SK_pi′': hex(outcome.plain.skPi),
            'SK_pr′': hex(outcome.plain.skPr),
          },
          withPpk: pathView(outcome.withPpk),
          withoutPpk: pathView(outcome.withoutPpk),
          actualPath: outcome.actual.path,
        }
      }),
    [runSample, mandatory]
  )

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Wifi size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">
            IKEv2 / IPsec: SKEYSEED and SK_* with a QKD Key as RFC 8784 PPK
          </h3>
          <a
            href="https://datatracker.ietf.org/doc/html/rfc7296#section-2.14"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
          >
            RFC 7296 §2.14 <ExternalLink size={11} />
          </a>
          <a
            href="https://datatracker.ietf.org/doc/html/rfc8784"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            RFC 8784 <ExternalLink size={11} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          This panel computes the real IKEv2 key derivation for two fictional peers using the Hub
          classical profile (ECP-256, DH group 19; PRF-HMAC-SHA-256; AES-256-CBC with
          HMAC-SHA-256-128, so every key is 32 bytes). Then it applies RFC 8784: the QKD key is the
          post-quantum preshared key (PPK), its ETSI GS QKD 014 key ID is sent as the PPK_ID, and
          each peer fetches the key from its own QKD node by that ID. The PPK is optional: if a peer
          lacks it, the exchange continues as plain IKEv2 and the session is not quantum-safe.
          Peers, nonces, SPIs and keys are fictional. No IKE_SA_INIT or IKE_AUTH message is sent, no
          peer is authenticated, no Child SA is created and no real QKD link is used.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① Ordinary IKEv2 (RFC 7296 §2.14)</div>
          <code className="text-muted-foreground block">SKEYSEED = prf(Ni | Nr, g^ir)</code>
          <code className="text-muted-foreground block">
            &#123;SK_d′ | SK_ai | SK_ar | SK_ei | SK_er | SK_pi′ | SK_pr′&#125; = prf+(SKEYSEED, Ni
            | Nr | SPIi | SPIr)
          </code>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">② PPK in use (RFC 8784 §3)</div>
          <code className="text-muted-foreground block">SK_d = prf+(PPK, SK_d′)</code>
          <code className="text-muted-foreground block">SK_pi = prf+(PPK, SK_pi′)</code>
          <code className="text-muted-foreground block">SK_pr = prf+(PPK, SK_pr′)</code>
          <div className="mt-1 text-muted-foreground">
            SKEYSEED, SK_ai, SK_ar, SK_ei and SK_er are unchanged.
          </div>
        </div>
        <div className="bg-warning/5 border border-warning/20 rounded p-3">
          <div className="font-bold text-warning mb-1">③ No PPK: plain IKEv2 fallback</div>
          <div className="text-muted-foreground">
            Optional PPK: the exchange continues with the ① keys. These keys rest on ECP-256 alone,
            so a recorded exchange is exposed once ECDH is broken. Mandatory PPK: the negotiation
            aborts.
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border space-y-2">
        <div className="text-xs font-bold text-muted-foreground">PPK policy (RFC 8784 §2)</div>
        <div className="flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="ppk-policy"
              checked={!mandatory}
              onChange={() => setMandatory(false)}
            />
            Optional: allow fallback to plain IKEv2 (default)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="ppk-policy"
              checked={mandatory}
              onChange={() => setMandatory(true)}
            />
            Mandatory: abort if the PPK is missing
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          The PPK_ID sent in the PPK_IDENTITY notification (type 16436) starts with the PPK_ID type
          octet, 1 for PPK_ID_OPAQUE, followed by the key ID. RFC 8784 leaves the opaque content to
          the peers; this sample sends the 16 octets of the QKD key ID UUID. It is a sample choice,
          not a standardized QKD binding.
        </p>
      </div>

      <Button
        variant="gradient"
        onClick={run}
        disabled={running}
        className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Calculating…' : 'Run IKEv2 + RFC 8784 Key Derivation'}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-status-error">
          Sample operation failed: {error}. Retry when ready.
        </p>
      )}
      {result && (
        <div className="space-y-4">
          <div className="bg-success/5 rounded p-4 border border-success/20 space-y-3">
            <div className="text-xs font-bold text-success">
              Key derivation calculated locally for two fictional peers; no IKE message was sent
            </div>
            <dl className="space-y-2">
              <KeyRow label="Ni (initiator nonce, 32 bytes)" value={result.ni} />
              <KeyRow label="Nr (responder nonce, 32 bytes)" value={result.nr} />
              <KeyRow label="SPIi (initiator SPI, 8 bytes, fictional)" value={result.spiI} />
              <KeyRow label="SPIr (responder SPI, 8 bytes, fictional)" value={result.spiR} />
              <KeyRow
                label="g^ir (ECP-256 shared x coordinate, 32 bytes; both peers computed the same value)"
                value={result.sharedX}
              />
              <KeyRow
                label="SKEYSEED = prf(Ni | Nr, g^ir), PRF-HMAC-SHA-256"
                value={result.skeyseed}
              />
              {Object.entries(result.plain).map(([name, value]) => (
                <KeyRow
                  key={name}
                  label={`${name} (plain IKEv2, prf+(SKEYSEED, Ni | Nr | SPIi | SPIr); the final key when no PPK is used)`}
                  value={value}
                />
              ))}
            </dl>
          </div>

          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">
              Locally generated QKD key container (ETSI GS QKD 014 format; the key is the PPK)
            </div>
            <pre className="text-xs font-mono text-primary overflow-auto whitespace-pre-wrap break-all">
              {result.qkdResponseJson}
            </pre>
            <dl className="space-y-2 mt-2">
              <KeyRow label="QKD key_ID (sent as the PPK_ID content)" value={result.qkdKeyId} />
              <KeyRow
                label="PPK_ID as sent: type 1 (PPK_ID_OPAQUE) then the 16 key ID octets"
                value={result.ppkIdHex}
              />
            </dl>
          </div>

          <div className="bg-success/5 rounded p-4 border border-success/20 space-y-3">
            <div className="text-sm font-bold text-success">
              {result.actualPath === 'ppk'
                ? 'Path 1: both peers fetched the key from their own QKD node, PPK in use'
                : 'Path 1 (hypothetical, not what happened): if both peers had fetched the key, PPK in use'}
            </div>
            {result.withPpk.path === 'ppk' ? (
              <>
                <dl className="space-y-2">
                  <KeyRow
                    label="SK_d′ (before mixing)"
                    value={result.withPpk.initiator.primedSkD}
                  />
                  <KeyRow label="SK_d = prf+(PPK, SK_d′)" value={result.withPpk.initiator.skD} />
                  <KeyRow
                    label="SK_pi′ (before mixing)"
                    value={result.withPpk.initiator.primedSkPi}
                  />
                  <KeyRow label="SK_pi = prf+(PPK, SK_pi′)" value={result.withPpk.initiator.skPi} />
                  <KeyRow
                    label="SK_pr′ (before mixing)"
                    value={result.withPpk.initiator.primedSkPr}
                  />
                  <KeyRow label="SK_pr = prf+(PPK, SK_pr′)" value={result.withPpk.initiator.skPr} />
                </dl>
                <p className="text-xs text-muted-foreground">
                  {result.withPpk.responderMatches
                    ? 'The responder derived identical SK_d, SK_pi and SK_pr from the key its own node returned for the same key ID. '
                    : 'The peers derived different keys. '}
                  SK_ai, SK_ar, SK_ei and SK_er are unchanged:{' '}
                  {IKE_UNCHANGED_KEYS.map(([label]) => label).join(', ')} equal the plain-IKEv2
                  values above. SK_d feeds every Child SA key and later IKE SA rekey, so those
                  depend on the QKD key as well as on ECP-256. This holds if the QKD key has at
                  least 256 bits of entropy (RFC 8784 §6) and the rest of the profile is
                  quantum-resistant.
                </p>
              </>
            ) : (
              <p className="text-xs text-status-error">{result.withPpk.reason}</p>
            )}
          </div>

          <div className="bg-warning/5 rounded p-4 border border-warning/30 space-y-3">
            <div className="text-sm font-bold text-warning">
              Path 2: the responder&apos;s QKD node cannot supply the key, no PPK (
              {result.mandatory ? 'PPK mandatory' : 'PPK optional'})
            </div>
            {result.withoutPpk.path === 'plain-ikev2' && (
              <>
                <p className="text-xs text-foreground font-bold">
                  This session is NOT quantum-safe. {result.withoutPpk.reason}
                </p>
                <p className="text-xs text-muted-foreground">
                  The final SK_d, SK_pi and SK_pr on this path are the plain-IKEv2 values listed
                  above (SK_d′, SK_pi′, SK_pr′ unchanged), derived from ECP-256 alone. An attacker
                  who records this exchange can recover every key from it once a quantum computer
                  breaks ECP-256 Diffie-Hellman. Allowing fallback keeps the link up; it gives up
                  the QKD protection for that session.
                </p>
              </>
            )}
            {result.withoutPpk.path === 'abort' && (
              <p className="text-xs text-foreground font-bold">
                No session is established. {result.withoutPpk.reason}
              </p>
            )}
            {result.withoutPpk.path === 'ppk' && (
              <p className="text-xs text-status-error">Unexpected: a PPK was found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MACsec Panel ────────────────────────────────────────────────────────────

const MACsecPanel: React.FC = () => {
  const {
    result,
    running,
    error,
    run: runSample,
  } = useSampleOperation<{
    qkdSecret: string
    qkdResponseJson: string
    sak: string
    sci: string
  }>()

  const run = useCallback(
    () =>
      runSample(async () => {
        const qkdHex = getRandomHex(32)
        const sci = getRandomHex(8) // Secure Channel Identifier (8 bytes)
        const qkdBytes = new Uint8Array(32)
        for (let i = 0; i < 32; i++) qkdBytes[i] = parseInt(qkdHex.slice(i * 2, i * 2 + 2), 16)
        // SAK derived: HKDF(IKM=qkd_secret, info="MACsec SAK v1 " + SCI)
        const sak = await hkdfDerive(qkdBytes, `MACsec SAK v1 ${sci}`, 32)
        return { qkdSecret: qkdHex, qkdResponseJson: getQkdJson(qkdHex), sak, sci }
      }),
    [runSample]
  )

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Server size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">MACsec Context — Local HKDF Illustration</h3>
          <a
            href="https://1.ieee802.org/security/802-1ae-2018/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
          >
            IEEE 802.1AE <ExternalLink size={11} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          MACsec (IEEE 802.1AE) encrypts Ethernet frames with AES-GCM using a{' '}
          <strong>Secure Association Key (SAK)</strong>. Normally the SAK is negotiated via MACsec
          Key Agreement (MKA). ETSI GS QKD 002 says QKD &quot;may also be used to provide keys for
          the IEEE 802.1 MACsec layer 2 protocol&quot;; this workshop&apos;s design derives the SAK
          from sample bytes shaped like key-delivery output; this does not install a SAK or run MKA.
          The same document says the overall security level of a QKD link encryptor &quot;is
          determined by both the QKD component, and the link encryptor component&quot;, so the link
          is not information-theoretically secure end to end.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① Key Delivery Reference — Not Executed</div>
          <code className="text-muted-foreground block">
            POST /api/v1/keys/&#123;slave_SAE_ID&#125;/enc_keys
          </code>
          <div className="mt-1 text-muted-foreground">
            Master enc_keys and peer dec_keys correlate key_IDs over mutually authenticated TLS; no
            request is sent here.
          </div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">② Authored HKDF Example</div>
          <code className="text-muted-foreground block">HKDF(</code>
          <code className="text-muted-foreground block ml-2">IKM = qkd_secret,</code>
          <code className="text-muted-foreground block ml-2">
            info = &quot;MACsec SAK v1 &quot; + SCI
          </code>
          <code className="text-muted-foreground block">)</code>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ Production Operations — Omitted</div>
          <div className="text-muted-foreground">
            No MKA, SAK installation, packet number/nonce construction, frame encryption or
            throughput test is executed.
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-bold text-muted-foreground mb-1">
          IEEE 802.1AE §10 — Cipher Suites
        </div>
        <p className="text-xs text-muted-foreground">
          MACsec supports GCM-AES-128, GCM-AES-256, and XPN variants for high-speed links. The SAK
          is a 128- or 256-bit AES key — exactly the output size produced by HKDF from a 256-bit QKD
          secret. This local output is not evidence of a negotiated or installed SAK. Check the
          exact cipher profile, nonce rules, key installation and rotation behavior in production
          tools.
        </p>
      </div>

      <Button
        variant="gradient"
        onClick={run}
        disabled={running}
        className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Simulating…' : 'Run Local MACsec-Context HKDF Example'}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-status-error">
          Sample operation failed: {error}. Retry when ready.
        </p>
      )}
      {result && (
        <div className="bg-success/5 rounded p-4 border border-success/20 space-y-2">
          <div className="text-xs font-bold text-success">
            Local sample operation only — no protocol validation
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Locally Generated Sample Key Container
              </div>
              <pre className="text-xs font-mono text-primary overflow-x-auto">
                {result.qkdResponseJson}
              </pre>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">
                SCI — Secure Channel Identifier
              </div>
              <code className="text-xs font-mono text-foreground break-all">{result.sci}</code>
            </div>
          </div>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">
              Local HKDF-SHA256 output; info = &quot;MACsec SAK v1 &quot; + SCI
            </div>
            <code className="text-xs font-mono text-success break-all">{result.sak}</code>
          </div>
          <div className="text-xs text-muted-foreground">
            Only one local derivation runs. No second endpoint, key installation or MACsec
            interoperability is checked.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SSH Panel ───────────────────────────────────────────────────────────────

const SSHPanel: React.FC = () => {
  const {
    result,
    running,
    error,
    run: runSample,
  } = useSampleOperation<ReturnType<typeof createSshExchangeSample>>()
  const [changedIdentification, setChangedIdentification] = useState(false)
  const execute = (rekey = false) => {
    setChangedIdentification(false)
    void runSample(() =>
      createSshExchangeSample(
        rekey && result ? { hostSecret: result.hostSecret, sessionId: result.sessionId } : {}
      )
    )
  }
  const fields =
    result && changedIdentification
      ? {
          ...result.fields,
          V_C: new TextEncoder().encode(new TextDecoder().decode(result.fields.V_C) + '-changed'),
        }
      : result?.fields
  const checked =
    result && fields
      ? assessSshExchange(fields, result.signature, result.hostPublic, result.sessionId)
      : null
  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 space-y-2">
        <h3 className="font-bold text-foreground">SSH — Complete Exchange-Hash Reference Sample</h3>
        <p className="text-xs text-muted-foreground">
          Existing conventional profile: curve25519-sha256 / ssh-ed25519, aes128-ctr, hmac-sha2-256,
          no compression. Fresh fictional local X25519 keys establish the same K at both endpoints.
          An Ed25519 sample host key signs the complete exchange hash H. Retained public
          identification and full KEXINIT payloads are inputs; no new network negotiation or login
          runs. Cookies are inside KEXINIT, not substitutes for its name lists.
        </p>
        <p className="text-xs text-muted-foreground">
          This selected SSH method does not consume a QKD key. The QKD delivery API and any
          QKD-injection profile are separate. SSH traffic-key derivation and AES encryption remain
          conventional; this calculation makes no information-theoretic security claim. In your
          production SSH tools inspect the complete negotiated method, host-key pin,
          exchange-hash/signature checks, positive and negative peer tests and rekey behavior.
        </p>
        <a
          className="text-xs text-primary underline"
          href="https://www.rfc-editor.org/rfc/rfc8731.html#section-3"
          target="_blank"
          rel="noopener noreferrer"
        >
          RFC 8731 / RFC 5656 exchange fields
        </a>
      </div>
      <Button
        className="max-w-full h-auto whitespace-normal text-left"
        onClick={() => execute()}
        disabled={running}
        variant="gradient"
      >
        {running ? 'Calculating…' : 'Run Complete SSH Exchange-Hash Sample'}
      </Button>
      {error && <p role="alert">Sample operation failed: {error}. Retry when ready.</p>}
      {result && checked && (
        <div className="glass-panel p-4 space-y-3">
          <p className="font-bold" role="status">
            {checked.verified
              ? 'Host signature VALID for this complete transcript'
              : 'Host signature REJECTED for the changed transcript'}
          </p>
          <p className="text-xs">
            Both local endpoints derived the same nonzero X25519 K. The trusted host public key is
            pinned to this fictional sample; that does not establish a production host identity.
          </p>
          <dl className="space-y-2 text-xs">
            {checked.encoded.map((field) => (
              <div key={field.name} className="bg-background p-3 rounded">
                <dt>
                  {field.name}: {field.bytes.length} encoded bytes
                  {field.name === 'K' ? ' (canonical positive mpint)' : ' (SSH string)'}
                </dt>
                <dd className="font-mono break-all">{sshSampleHex(field.bytes)}</dd>
              </div>
            ))}
            <div>
              <dt>Complete serialized exchange-hash input</dt>
              <dd>
                {checked.bytes.length} bytes; all eight fields in V_C, V_S, I_C, I_S, K_S, Q_C, Q_S,
                K order
              </dd>
            </div>
            <div>
              <dt>Current H = SHA-256(complete encoded input)</dt>
              <dd aria-label="Current SSH exchange hash" className="font-mono break-all">
                {sshSampleHex(checked.hash)}
              </dd>
            </div>
            <div>
              <dt>Session identifier = first exchange H (retained across rekey)</dt>
              <dd aria-label="First SSH session identifier" className="font-mono break-all">
                {sshSampleHex(checked.sessionId)}
              </dd>
            </div>
            <div>
              <dt>Host signature (Ed25519 over H, 64 bytes)</dt>
              <dd className="font-mono break-all">{sshSampleHex(result.signature)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setChangedIdentification(!changedIdentification)}>
              {changedIdentification
                ? 'Restore Original Transcript'
                : 'Change Client Identification'}
            </Button>
            <Button onClick={() => execute(true)} disabled={running}>
              Rekey Local Sample
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Changing a public identification field changes H and rejects the unchanged host
            signature. Rekey generates fresh ephemeral values and a new valid signature while
            preserving the original session identifier and sample host key. No traffic-key
            installation, packet encryption or QKD delivery is executed.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProtocolIntegrationDemo: React.FC<{ initialProtocol?: string }> = ({
  initialProtocol,
}) => {
  const [activeProtocol, setActiveProtocol] = useState(initialProtocol ?? 'tls')

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded p-4">
        <p className="text-xs text-muted-foreground">
          Explore local importer mechanics, HKDF examples and a complete conventional SSH
          exchange-hash sample. These demonstrations do not execute QKD key delivery, a protocol
          handshake, peer authentication or interoperability checks. Production tools must implement
          and test the supported profile on both endpoints.
        </p>
      </div>

      <Tabs value={activeProtocol} onValueChange={setActiveProtocol}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tls">TLS 1.3</TabsTrigger>
          <TabsTrigger value="ikev2">IKEv2</TabsTrigger>
          <TabsTrigger value="macsec">MACsec</TabsTrigger>
          <TabsTrigger value="ssh">SSH</TabsTrigger>
        </TabsList>

        <TabsContent value="tls">
          <TLSPanel />
        </TabsContent>
        <TabsContent value="ikev2">
          <IKEv2Panel />
        </TabsContent>
        <TabsContent value="macsec">
          <MACsecPanel />
        </TabsContent>
        <TabsContent value="ssh">
          <SSHPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
