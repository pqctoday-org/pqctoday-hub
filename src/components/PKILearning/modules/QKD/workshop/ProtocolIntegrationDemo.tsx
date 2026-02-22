/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Play, ExternalLink, ShieldCheck, Wifi, Server, Terminal } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

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
  const keyMaterial = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
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

interface SimResult {
  qkdSecret: string
  qkdResponseJson: string
  derivedField: string
  label: string
}

// ─── TLS 1.3 Panel ──────────────────────────────────────────────────────────

const TLSPanel: React.FC = () => {
  const [result, setResult] = useState<SimResult | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(async () => {
    setRunning(true)
    const qkdSecret = getRandomHex(32)
    const pskBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) pskBytes[i] = parseInt(qkdSecret.slice(i * 2, i * 2 + 2), 16)
    // RFC 9258: the imported PSK is used directly — no further derivation step shown here
    setResult({
      qkdSecret,
      qkdResponseJson: getQkdJson(qkdSecret),
      derivedField: qkdSecret,
      label: 'TLS 1.3 external_psk (RFC 9258)',
    })
    setRunning(false)
  }, [])

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">TLS 1.3 — External PSK Import (RFC 9258)</h3>
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
          RFC 8446 (TLS 1.3) derives session keys from a shared secret produced by the key exchange
          (e.g., ECDH or ML-KEM). RFC 9258 adds an <strong>external PSK importer</strong>: a QKD key
          delivered via the ETSI GS QKD 014 REST API can be bound to a specific KDF hash and
          imported as a pre-shared key, replacing or augmenting the key-exchange-derived secret.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① ETSI QKD 014</div>
          <code className="text-muted-foreground block">GET /api/v1/keys/&#123;SAE_ID&#125;/1</code>
          <div className="mt-1 text-muted-foreground">Both sides retrieve the same key_ID</div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">② RFC 9258 Importer</div>
          <code className="text-muted-foreground block">ImportedIdentity &#123;</code>
          <code className="text-muted-foreground block ml-2">external_identity: key_ID,</code>
          <code className="text-muted-foreground block ml-2">hash: SHA-256</code>
          <code className="text-muted-foreground block">&#125;</code>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ TLS 1.3 Handshake</div>
          <div className="text-muted-foreground">
            PSK binder replaces or augments ECDH-derived Early Secret in the key schedule (RFC 8446
            §7.1)
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-bold text-muted-foreground mb-1">
          What changes with QKD vs. standard TLS 1.3
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            <strong>Without QKD</strong>: Early Secret = HKDF-Extract(0, DHE shared secret)
          </li>
          <li>
            <strong>With QKD (RFC 9258)</strong>: Early Secret = HKDF-Extract(PSK=QKD key, 0) —
            information-theoretically secure PSK replaces the computational DHE secret
          </li>
          <li>No protocol modifications required — RFC 9258 is an extension to existing TLS 1.3</li>
        </ul>
      </div>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Simulating…' : 'Simulate PSK Import'}
      </button>

      {result && (
        <div className="bg-success/5 rounded p-4 border border-success/20 space-y-2">
          <div className="text-xs font-bold text-success">
            Simulated — for educational purposes only
          </div>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">
              QKD Manager Response (ETSI GS QKD 014 JSON)
            </div>
            <pre className="text-xs font-mono text-primary overflow-x-auto">
              {result.qkdResponseJson}
            </pre>
          </div>
          <div className="bg-background rounded p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">{result.label}</div>
            <code className="text-xs font-mono text-success break-all">{result.derivedField}</code>
          </div>
          <div className="text-xs text-muted-foreground">
            This 32-byte secret becomes the TLS 1.3 PSK. It is never transmitted — both endpoints
            independently retrieved the same key_ID from their local QKD key manager.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── IKEv2 Panel ─────────────────────────────────────────────────────────────

const IKEv2Panel: React.FC = () => {
  const [result, setResult] = useState<{
    qkdSecret: string
    qkdResponseJson: string
    ni: string
    nr: string
    skeyseed: string
  } | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(async () => {
    setRunning(true)
    const qkdHex = getRandomHex(32)
    const ni = getRandomHex(32) // Initiator nonce
    const nr = getRandomHex(32) // Responder nonce

    // SKEYSEED = prf(Ni | Nr, g^ir) — with QKD, g^ir is replaced/seeded by qkdSecret
    // We simulate: HKDF(IKM = qkdSecret || Ni || Nr, info = "SKEYSEED")
    const combined = new Uint8Array(96)
    for (let i = 0; i < 32; i++) {
      combined[i] = parseInt(qkdHex.slice(i * 2, i * 2 + 2), 16)
      combined[32 + i] = parseInt(ni.slice(i * 2, i * 2 + 2), 16)
      combined[64 + i] = parseInt(nr.slice(i * 2, i * 2 + 2), 16)
    }
    const skeyseed = await hkdfDerive(combined, 'SKEYSEED', 32)
    setResult({ qkdSecret: qkdHex, qkdResponseJson: getQkdJson(qkdHex), ni, nr, skeyseed })
    setRunning(false)
  }, [])

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Wifi size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">
            IKEv2 / IPsec — QKD-seeded Nonces (RFC 7296)
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
          IKEv2 uses nonces Ni (initiator) and Nr (responder) in the IKE_SA_INIT exchange to derive
          SKEYSEED: <code>prf(Ni | Nr, g^ir)</code>. When QKD is deployed on the same fiber backbone
          as an IPsec link, the QKD-shared secret can replace or be mixed into <code>g^ir</code>,
          making SKEYSEED information-theoretically secure even against a quantum adversary.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① IKE_SA_INIT</div>
          <div className="text-muted-foreground">
            Initiator sends Ni (random nonce, 32 bytes) alongside DH proposal
          </div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">② QKD Augmentation</div>
          <code className="text-muted-foreground block">g^ir_hybrid = g^ir XOR qkd_secret</code>
          <div className="mt-1 text-muted-foreground">Or: concat then HKDF before PRF step</div>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ SKEYSEED</div>
          <code className="text-muted-foreground block">prf(Ni | Nr, g^ir_hybrid)</code>
          <div className="mt-1 text-muted-foreground">All child SA keys derive from this root</div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-bold text-muted-foreground mb-1">RFC 7296 §2.14 — Nonces</div>
        <p className="text-xs text-muted-foreground">
          &ldquo;Nonces used in IKEv2 MUST be randomly chosen, MUST be at least 128 bits in size,
          and MUST be at least half the key size of the negotiated PRF.&rdquo; A QKD-sourced random
          value meets this requirement while providing information-theoretic quality.
        </p>
      </div>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Simulating…' : 'Simulate IKEv2 Key Derivation'}
      </button>

      {result && (
        <div className="bg-success/5 rounded p-4 border border-success/20 space-y-2">
          <div className="text-xs font-bold text-success">
            Simulated — for educational purposes only
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">QKD Manager Response</div>
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
              SKEYSEED = prf(Ni | Nr | QKD_secret)
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
  const [result, setResult] = useState<{
    qkdSecret: string
    qkdResponseJson: string
    sak: string
    sci: string
  } | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(async () => {
    setRunning(true)
    const qkdHex = getRandomHex(32)
    const sci = getRandomHex(8) // Secure Channel Identifier (8 bytes)
    const qkdBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) qkdBytes[i] = parseInt(qkdHex.slice(i * 2, i * 2 + 2), 16)
    // SAK derived: HKDF(IKM=qkd_secret, info="MACsec SAK v1 " + SCI)
    const sak = await hkdfDerive(qkdBytes, `MACsec SAK v1 ${sci}`, 32)
    setResult({ qkdSecret: qkdHex, qkdResponseJson: getQkdJson(qkdHex), sak, sci })
    setRunning(false)
  }, [])

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Server size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">
            MACsec — QKD-derived SAK (IEEE 802.1AE + ETSI QKD 014)
          </h3>
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
          Key Agreement (MKA). With QKD on fiber links, the SAK can be derived directly from the
          QKD-shared secret via ETSI GS QKD 014 — eliminating the MKA negotiation round-trip and
          providing information-theoretic key material at the link layer.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① ETSI QKD 014 Key Fetch</div>
          <code className="text-muted-foreground block">GET /api/v1/keys/&#123;SAE_ID&#125;/1</code>
          <div className="mt-1 text-muted-foreground">
            Both link endpoints fetch matching key by key_ID
          </div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">② SAK Derivation</div>
          <code className="text-muted-foreground block">HKDF(</code>
          <code className="text-muted-foreground block ml-2">IKM = qkd_secret,</code>
          <code className="text-muted-foreground block ml-2">info = &quot;SAK&quot; || SCI</code>
          <code className="text-muted-foreground block">)</code>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ MACsec GCM-AES-256</div>
          <div className="text-muted-foreground">
            SAK injected; GCM nonce = Packet Number (PN) || IV. Frames encrypted at wire speed.
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
          secret. No protocol changes required; QKD replaces the MKA-negotiated CAK/SAK.
        </p>
      </div>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Simulating…' : 'Simulate SAK Derivation'}
      </button>

      {result && (
        <div className="bg-success/5 rounded p-4 border border-success/20 space-y-2">
          <div className="text-xs font-bold text-success">
            Simulated — for educational purposes only
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">QKD Manager Response</div>
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
              SAK = HKDF(qkd_secret, &quot;MACsec SAK v1&quot; || SCI)
            </div>
            <code className="text-xs font-mono text-success break-all">{result.sak}</code>
          </div>
          <div className="text-xs text-muted-foreground">
            Both link endpoints independently derive the same SAK. It is never sent over the wire.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SSH Panel ───────────────────────────────────────────────────────────────

const SSHPanel: React.FC = () => {
  const [result, setResult] = useState<{
    qkdSecret: string
    qkdResponseJson: string
    clientCookie: string
    serverCookie: string
    sessionId: string
  } | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(async () => {
    setRunning(true)
    const qkdHex = getRandomHex(32)
    const clientCookie = getRandomHex(16)
    const serverCookie = getRandomHex(16)

    // SSH session ID: H = hash(V_C || V_S || I_C || I_S || K_S || e || f || K)
    // With QKD, K (shared DH secret) is replaced/augmented by qkd_secret
    // We simulate: HKDF(IKM = qkd || client_cookie || server_cookie, info = "SSH session-id")
    const combined = new Uint8Array(64)
    for (let i = 0; i < 32; i++) combined[i] = parseInt(qkdHex.slice(i * 2, i * 2 + 2), 16)
    for (let i = 0; i < 16; i++)
      combined[32 + i] = parseInt(clientCookie.slice(i * 2, i * 2 + 2), 16)
    for (let i = 0; i < 16; i++)
      combined[48 + i] = parseInt(serverCookie.slice(i * 2, i * 2 + 2), 16)

    const sessionId = await hkdfDerive(combined, 'SSH session-id', 32)
    setResult({
      qkdSecret: qkdHex,
      qkdResponseJson: getQkdJson(qkdHex),
      clientCookie,
      serverCookie,
      sessionId,
    })
    setRunning(false)
  }, [])

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={16} className="text-primary" />
          <h3 className="font-bold text-foreground">
            SSH — QKD-seeded Cookie / Session ID (RFC 4253)
          </h3>
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
          SSH (RFC 4253) generates a 16-byte random <strong>cookie</strong> in both the client and
          server&apos;s KEXINIT messages to ensure neither party fully controls the session keys.
          The session ID <code>H</code> is computed as{' '}
          <code>hash(V_C || V_S || I_C || I_S || K_S || e || f || K)</code> where <code>K</code> is
          the DH shared secret. A QKD-sourced entropy value can replace or be mixed into{' '}
          <code>K</code>, making the session ID and all derived keys information-theoretically
          secure.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-primary/5 border border-primary/20 rounded p-3">
          <div className="font-bold text-primary mb-1">① SSH KEXINIT</div>
          <div className="text-muted-foreground">
            Client cookie (16 bytes) + Server cookie (16 bytes) — both randomly generated per RFC
            4253 §7.1
          </div>
        </div>
        <div className="bg-muted/40 border border-border rounded p-3">
          <div className="font-bold text-foreground mb-1">② QKD K injection</div>
          <code className="text-muted-foreground block">K_hybrid = K_DH XOR qkd_secret</code>
          <div className="mt-1 text-muted-foreground">Or: K_hybrid = HKDF(K_DH || qkd_secret)</div>
        </div>
        <div className="bg-success/5 border border-success/20 rounded p-3">
          <div className="font-bold text-success mb-1">③ Session ID H</div>
          <code className="text-muted-foreground block">H = SHA-256(... || K_hybrid)</code>
          <div className="mt-1 text-muted-foreground">
            All enc/mac/iv keys derived from H via RFC 4253 §7.2
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-bold text-muted-foreground mb-1">RFC 4253 §7.1 — Cookie</div>
        <p className="text-xs text-muted-foreground">
          &ldquo;The cookie MUST be a random value generated by the sender. Its purpose is to make
          it impossible for either side to fully determine the keys.&rdquo; QKD-sourced randomness
          provides information-theoretic quality for this role, exceeding CSPRNG guarantees.
        </p>
      </div>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 bg-primary text-black font-bold rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Play size={14} /> {running ? 'Simulating…' : 'Simulate SSH Session ID'}
      </button>

      {result && (
        <div className="bg-success/5 rounded p-4 border border-success/20 space-y-2">
          <div className="text-xs font-bold text-success">
            Simulated — for educational purposes only
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-background rounded p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">QKD Manager Response</div>
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
              Session ID H = SHA-256(cookies || QKD_secret)
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
          Protocols that accept <strong>nonces</strong> or <strong>pre-shared keys</strong> can
          integrate QKD without protocol changes. Select a protocol to see the exact injection
          point, the relevant RFC clause, and a live simulation using a randomly generated mock QKD
          secret.
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
