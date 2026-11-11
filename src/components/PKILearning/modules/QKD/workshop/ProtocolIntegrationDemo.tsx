// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Play, ExternalLink, ShieldCheck, Wifi, Server, Terminal } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { deriveTlsImporterSample, TLS_SAMPLE_CONTEXT } from './tlsPskImporterSample'

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

const IKEv2Panel: React.FC = () => {
  const {
    result,
    running,
    error,
    run: runSample,
  } = useSampleOperation<{
    qkdSecret: string
    qkdResponseJson: string
    ni: string
    nr: string
    skeyseed: string
  }>()

  const run = useCallback(
    () =>
      runSample(async () => {
        const qkdHex = getRandomHex(32)
        const ni = getRandomHex(32) // Initiator nonce
        const nr = getRandomHex(32) // Responder nonce

        // Authored HKDF illustration, not RFC 7296 SKEYSEED or a QKD integration profile.
        // We simulate: HKDF(IKM = qkdSecret || Ni || Nr, info = "SKEYSEED")
        const combined = new Uint8Array(96)
        for (let i = 0; i < 32; i++) {
          combined[i] = parseInt(qkdHex.slice(i * 2, i * 2 + 2), 16)
          combined[32 + i] = parseInt(ni.slice(i * 2, i * 2 + 2), 16)
          combined[64 + i] = parseInt(nr.slice(i * 2, i * 2 + 2), 16)
        }
        const skeyseed = await hkdfDerive(combined, 'SKEYSEED', 32)
        return { qkdSecret: qkdHex, qkdResponseJson: getQkdJson(qkdHex), ni, nr, skeyseed }
      }),
    [runSample]
  )

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wifi size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">
            IKEv2 / IPsec Context — Local HKDF Illustration
          </h3>
          <a
            href="https://datatracker.ietf.org/doc/html/rfc7296"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
          >
            RFC 7296 <ExternalLink size={11} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          RFC 7296 defines SKEYSEED = prf(Ni | Nr, g^ir), using the negotiated PRF and DH shared
          secret. This panel instead runs an authored HKDF-SHA256 example over local sample bytes.
          It is not IKEv2 SKEYSEED, an authenticated exchange or a standardized QKD integration.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① Local Sample Inputs</div>
          <div className="text-muted-foreground">
            Generate local 32-byte samples labelled Ni and Nr; no IKE_SA_INIT message is sent.
          </div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">② Actual Demonstration</div>
          <code className="text-muted-foreground block">HKDF-SHA256(sample || Ni || Nr)</code>
          <div className="mt-1 text-muted-foreground">
            Salt: 32 zero bytes; info: "SKEYSEED"; output: 32 bytes. This is not a protocol
            combiner.
          </div>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ Local HKDF Output</div>
          <code className="text-muted-foreground block">Not the RFC 7296 SKEYSEED</code>
          <div className="mt-1 text-muted-foreground">
            No negotiation, peer authentication, child SA or packet encryption is executed.
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-bold text-muted-foreground mb-1">RFC 7296 §2.14 — Nonces</div>
        <p className="text-xs text-muted-foreground">
          Treat the RFC as protocol background, not a claim that this local example meets it.
          Production tools must support the agreed integration profile, negotiated PRF, peer
          authentication and interoperability tests. A local HKDF output is not evidence of those
          capabilities.
        </p>
      </div>

      <Button
        variant="gradient"
        onClick={run}
        disabled={running}
        className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Simulating…' : 'Run Local IKE-Context HKDF Example'}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Locally Generated Sample Key Container
              </div>
              <pre className="text-xs font-mono text-primary overflow-x-auto">
                {result.qkdResponseJson}
              </pre>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Ni (initiator nonce)</div>
              <code className="text-xs font-mono text-foreground break-all">{result.ni}</code>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Nr (responder nonce)</div>
              <code className="text-xs font-mono text-foreground break-all">{result.nr}</code>
            </div>
          </div>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">
              Local HKDF output — not IKEv2 SKEYSEED
            </div>
            <code className="text-xs font-mono text-success break-all">{result.skeyseed}</code>
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
  } = useSampleOperation<{
    qkdSecret: string
    qkdResponseJson: string
    clientCookie: string
    serverCookie: string
    sessionId: string
  }>()

  const run = useCallback(
    () =>
      runSample(async () => {
        const qkdHex = getRandomHex(32)
        const clientCookie = getRandomHex(16)
        const serverCookie = getRandomHex(16)

        // SSH session ID: H = hash(V_C || V_S || I_C || I_S || K_S || e || f || K)
        // This illustration does not compute that exchange hash or replace a negotiated SSH method.
        // We simulate: HKDF(IKM = qkd || client_cookie || server_cookie, info = "SSH session-id")
        const combined = new Uint8Array(64)
        for (let i = 0; i < 32; i++) combined[i] = parseInt(qkdHex.slice(i * 2, i * 2 + 2), 16)
        for (let i = 0; i < 16; i++)
          combined[32 + i] = parseInt(clientCookie.slice(i * 2, i * 2 + 2), 16)
        for (let i = 0; i < 16; i++)
          combined[48 + i] = parseInt(serverCookie.slice(i * 2, i * 2 + 2), 16)

        const sessionId = await hkdfDerive(combined, 'SSH session-id', 32)
        return {
          qkdSecret: qkdHex,
          qkdResponseJson: getQkdJson(qkdHex),
          clientCookie,
          serverCookie,
          sessionId,
        }
      }),
    [runSample]
  )

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">SSH Context — Local HKDF Illustration</h3>
          <a
            href="https://datatracker.ietf.org/doc/html/rfc4253"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary flex items-center gap-1 hover:underline"
          >
            RFC 4253 <ExternalLink size={11} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          RFC 4253 defines negotiated key exchange, a transcript-bound exchange hash and host
          authentication. This panel only applies HKDF-SHA256 to local sample bytes and two
          cookie-labelled values. Its output is not an SSH exchange hash or session identifier.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① Local Cookie-Labelled Samples</div>
          <div className="text-muted-foreground">
            Generate two local 16-byte values. No KEXINIT message or peer is executed.
          </div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">② Actual Demonstration</div>
          <code className="text-muted-foreground block">
            HKDF-SHA256(sample || client_cookie || server_cookie)
          </code>
          <div className="mt-1 text-muted-foreground">
            Salt: 32 zero bytes; info: "SSH session-id"; output: 32 bytes. No standard key exchange
            is implemented.
          </div>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ Local HKDF Output</div>
          <code className="text-muted-foreground block">Not the RFC 4253 exchange hash H</code>
          <div className="mt-1 text-muted-foreground">
            No transcript encoding, host-signature check or SSH traffic-key derivation is executed.
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-bold text-muted-foreground mb-1">RFC 4253 §7.1 — Cookie</div>
        <p className="text-xs text-muted-foreground">
          The RFC cookie requirement is background. This local example does not establish a
          standards-defined QKD exchange or stronger end-to-end security. Evaluate negotiated method
          support, transcript/host authentication and negative interoperability tests with your
          production tools.
        </p>
      </div>

      <Button
        variant="gradient"
        onClick={run}
        disabled={running}
        className="px-4 py-2 font-bold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Simulating…' : 'Run Local SSH-Context HKDF Example'}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Locally Generated Sample Key Container
              </div>
              <pre className="text-xs font-mono text-primary overflow-x-auto">
                {result.qkdResponseJson}
              </pre>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Client Cookie</div>
              <code className="text-xs font-mono text-foreground break-all">
                {result.clientCookie}
              </code>
            </div>
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Server Cookie</div>
              <code className="text-xs font-mono text-foreground break-all">
                {result.serverCookie}
              </code>
            </div>
          </div>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">
              Local HKDF output — not SSH session ID H
            </div>
            <code className="text-xs font-mono text-success break-all">{result.sessionId}</code>
          </div>
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
          Explore local importer-mechanics and HKDF calculations beside related protocol references.
          These demonstrations do not execute QKD key delivery, a protocol handshake, peer
          authentication or interoperability checks. Production tools must implement and test the
          supported profile on both endpoints.
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
