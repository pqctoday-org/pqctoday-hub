// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ShieldAlert,
  Cpu,
  CheckCircle,
  KeyRound,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { HsmKeyInspector } from '../../shared/HsmKeyInspector'
import { PkcsLogPanel } from '../components/PkcsLogPanel'

import { CKF_RW_SESSION, CKF_SERIAL_SESSION, CKU_USER } from '@/wasm/softhsm/constants'
import {
  getSoftHSMRustModule,
  hsm_generateRSAKeyPair,
  hsm_initToken,
  hsm_openUserSession,
} from '@/wasm/softhsm'

import {
  IKE_V2_MODES,
  IKE_V2_EXCHANGES,
  type IKEv2Mode,
  type IKEv2Payload,
} from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'
import {
  strongSwanEngine,
  type StrongSwanLog,
  type StrongSwanState,
} from '@/wasm/strongswan/bridge'
import {
  TBSCertificate as X509TBS,
  AlgorithmIdentifier as X509AlgId,
  Name as X509Name,
  RelativeDistinguishedName as X509RDN,
  AttributeTypeAndValue as X509ATV,
  AttributeValue as X509AttrValue,
  Validity as X509Validity,
  SubjectPublicKeyInfo as X509SPKI,
} from '@peculiar/asn1-x509'
import { AsnSerializer } from '@peculiar/asn1-schema'
import { useHsmContext } from './HsmContext'
import { openSSLService } from '@/services/crypto/OpenSSLService'

export interface VpnSimulationPanelProps {
  initialMode?: IKEv2Mode
}

type SoftHSMWasmModule = NonNullable<
  ReturnType<typeof getSoftHSMRustModule> extends Promise<infer T> ? T : never
>

// ── Minimal DER helpers (RSAPublicKey BIT STRING content only) ────────────────
function derCat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrays) {
    out.set(a, off)
    off += a.length
  }
  return out
}
function derLen(n: number): Uint8Array {
  if (n < 0x80) return new Uint8Array([n])
  if (n < 0x100) return new Uint8Array([0x81, n])
  return new Uint8Array([0x82, n >>> 8, n & 0xff])
}
function derTLV(tag: number, content: Uint8Array): Uint8Array {
  return derCat(new Uint8Array([tag]), derLen(content.length), content)
}
function derInteger(bytes: Uint8Array): Uint8Array {
  // Pad with 0x00 if high bit set (marks positive integer in two's complement)
  const padded = bytes[0] & 0x80 ? derCat(new Uint8Array([0x00]), bytes) : bytes
  return derTLV(0x02, padded)
}
/** RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER } */
function encodeRsaPublicKeyDER(n: Uint8Array, e: Uint8Array): Uint8Array {
  return derTLV(0x30, derCat(derInteger(n), derInteger(e)))
}
/** BIT STRING wrapper (unused-bits = 0) — for the outer Certificate signatureValue */
function derBitStr(bytes: Uint8Array): Uint8Array {
  return derTLV(0x03, derCat(new Uint8Array([0x00]), bytes))
}
/** SHA256withRSA AlgorithmIdentifier DER (fixed bytes) */
const SHA256_RSA_ALG_DER = new Uint8Array([
  0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b, 0x05, 0x00,
])

// ── softhsmv3 RSA public key extraction via C_GetAttributeValue ───────────────
function hsmExtractRsaPublicKey(
  M: SoftHSMWasmModule,
  hSession: number,
  hPubKey: number
): { n: Uint8Array; e: Uint8Array } {
  const CKA_MODULUS = 0x00000120
  const CKA_PUBLIC_EXPONENT = 0x00000122
  // CK_ATTRIBUTE = { CK_ULONG type, CK_VOID_PTR pValue, CK_ULONG ulValueLen } = 12 bytes (wasm32)
  const tpl = M._malloc(24) // 2 attributes
  M.setValue(tpl + 0, CKA_MODULUS, 'i32')
  M.setValue(tpl + 4, 0, 'i32') // pValue = NULL → get length
  M.setValue(tpl + 8, 0, 'i32')
  M.setValue(tpl + 12, CKA_PUBLIC_EXPONENT, 'i32')
  M.setValue(tpl + 16, 0, 'i32')
  M.setValue(tpl + 20, 0, 'i32')
  M._C_GetAttributeValue(hSession, hPubKey, tpl, 2)
  const nLen = M.getValue(tpl + 8, 'i32') >>> 0
  const eLen = M.getValue(tpl + 20, 'i32') >>> 0
  const nBuf = M._malloc(nLen)
  const eBuf = M._malloc(eLen)
  M.setValue(tpl + 4, nBuf, 'i32')
  M.setValue(tpl + 8, nLen, 'i32')
  M.setValue(tpl + 16, eBuf, 'i32')
  M.setValue(tpl + 20, eLen, 'i32')
  M._C_GetAttributeValue(hSession, hPubKey, tpl, 2)
  const n = new Uint8Array(M.HEAPU8.buffer, nBuf, nLen).slice()
  const e = new Uint8Array(M.HEAPU8.buffer, eBuf, eLen).slice()
  M._free(tpl)
  M._free(nBuf)
  M._free(eBuf)
  return { n, e }
}

// ── softhsmv3 signing via CKM_SHA256_RSA_PKCS ─────────────────────────────────
function hsmSign(
  M: SoftHSMWasmModule,
  hSession: number,
  hPrivKey: number,
  data: Uint8Array
): Uint8Array {
  const CKM_SHA256_RSA_PKCS = 0x00000040
  const mechPtr = M._malloc(12)
  M.setValue(mechPtr, CKM_SHA256_RSA_PKCS, 'i32')
  M.setValue(mechPtr + 4, 0, 'i32')
  M.setValue(mechPtr + 8, 0, 'i32')
  const rvInit = M._C_SignInit(hSession, mechPtr, hPrivKey) >>> 0
  M._free(mechPtr)
  if (rvInit !== 0) throw new Error(`C_SignInit rv=0x${rvInit.toString(16)}`)
  const dataPtr = M._malloc(data.length)
  M.HEAPU8.set(data, dataPtr)
  const sigLenPtr = M._malloc(4)
  // First call: NULL output to obtain signature length
  M.setValue(sigLenPtr, 0, 'i32')
  M._C_Sign(hSession, dataPtr, data.length, 0, sigLenPtr)
  const sigLen = M.getValue(sigLenPtr, 'i32') >>> 0
  const sigPtr = M._malloc(sigLen)
  M.setValue(sigLenPtr, sigLen, 'i32')
  const rvSign = M._C_Sign(hSession, dataPtr, data.length, sigPtr, sigLenPtr) >>> 0
  const sig = new Uint8Array(M.HEAPU8.buffer, sigPtr, M.getValue(sigLenPtr, 'i32') >>> 0).slice()
  M._free(dataPtr)
  M._free(sigLenPtr)
  M._free(sigPtr)
  if (rvSign !== 0) throw new Error(`C_Sign rv=0x${rvSign.toString(16)}`)
  return sig
}

// ── PKCS#11 v3.2 §5.19.6 — KEM shared secret key template ────────────────────
// Minimal 2-attr template proven to work with softhsmv3 C_EncapsulateKey/C_DecapsulateKey.
// softhsmv3 builds its own base attrs (CKA_CLASS, CKA_TOKEN, CKA_PRIVATE, CKA_KEY_TYPE)
// internally — caller only needs to supply attrs that differ from defaults:
//   CKA_VALUE_LEN = 32  (required by ck3 for OBJECT_OP_GENERATE; ML-KEM-768 = 32 bytes)
//   CKA_EXTRACTABLE = TRUE  (default is FALSE; must be explicit to allow C_GetAttributeValue)
function buildKemSecretKeyTmpl(M: SoftHSMWasmModule): {
  tpl: number
  count: number
  free: () => void
} {
  const pValLen = M._malloc(4)
  M.setValue(pValLen, 32, 'i32') // 32-byte ML-KEM-768 shared secret
  const pTrue = M._malloc(1)
  M.setValue(pTrue, 1, 'i8') // CK_TRUE

  const tpl = M._malloc(2 * 12) // 2 × CK_ATTRIBUTE { CK_ULONG type, CK_VOID_PTR pValue, CK_ULONG ulValueLen }
  // [0] CKA_VALUE_LEN = 32
  M.setValue(tpl + 0, 0x161, 'i32')
  M.setValue(tpl + 4, pValLen, 'i32')
  M.setValue(tpl + 8, 4, 'i32')
  // [1] CKA_EXTRACTABLE = TRUE
  M.setValue(tpl + 12, 0x162, 'i32')
  M.setValue(tpl + 16, pTrue, 'i32')
  M.setValue(tpl + 20, 1, 'i32')

  return {
    tpl,
    count: 2,
    free() {
      M._free(pValLen)
      M._free(pTrue)
      M._free(tpl)
    },
  }
}

// ── Build a self-signed X.509 certificate entirely on softhsmv3 ───────────────
// Key pair is generated on the HSM; the private key never leaves it.
// @peculiar/asn1-x509 handles TBSCertificate DER encoding.
// softhsmv3 C_Sign (CKM_SHA256_RSA_PKCS) produces the signature.
// Certificate DER is assembled manually to avoid re-serialisation divergence.
function buildHsmSelfSignedCert(
  M: SoftHSMWasmModule,
  hSession: number,
  hPubKey: number,
  hPrivKey: number,
  cn: string,
  org: string
): string {
  // 1. Extract RSA public key (n, e) from softhsmv3
  const { n, e } = hsmExtractRsaPublicKey(M, hSession, hPubKey)
  const rsaPubKeyDer = encodeRsaPublicKeyDER(n, e) // RSAPublicKey DER

  // 2. Build SubjectPublicKeyInfo via @peculiar/asn1-x509
  const spki = new X509SPKI({
    algorithm: new X509AlgId({ algorithm: '1.2.840.113549.1.1.1' }), // id-rsaEncryption
    subjectPublicKey: rsaPubKeyDer.buffer.slice(
      rsaPubKeyDer.byteOffset,
      rsaPubKeyDer.byteOffset + rsaPubKeyDer.byteLength
    ) as ArrayBuffer,
  })

  // 3. Build Name (CN + O)
  const buildName = (commonName: string, organization: string) =>
    new X509Name([
      new X509RDN([
        new X509ATV({ type: '2.5.4.3', value: new X509AttrValue({ utf8String: commonName }) }),
      ]),
      new X509RDN([
        new X509ATV({
          type: '2.5.4.10',
          value: new X509AttrValue({ utf8String: organization }),
        }),
      ]),
    ])

  // 4. Random serial (8 bytes, high bit clear → positive integer)
  const serial = crypto.getRandomValues(new Uint8Array(8))
  serial[0] &= 0x7f

  const now = new Date()
  const expiry = new Date(now.getTime() + 10 * 365.25 * 24 * 3600 * 1000)
  const sigAlgId = new X509AlgId({ algorithm: '1.2.840.113549.1.1.11' }) // sha256WithRSAEncryption

  // 5. Build TBSCertificate and serialize to DER (this is what we sign)
  const tbs = new X509TBS({
    version: 2, // v3
    serialNumber: serial.buffer,
    signature: sigAlgId,
    issuer: buildName(cn, org),
    validity: new X509Validity({ notBefore: now, notAfter: expiry }),
    subject: buildName(cn, org),
    subjectPublicKeyInfo: spki,
  })
  const tbsDer = new Uint8Array(AsnSerializer.serialize(tbs))

  // 6. Sign TBSCertificate with the softhsmv3 private key (never exported)
  const signature = hsmSign(M, hSession, hPrivKey, tbsDer)

  // 7. Assemble Certificate DER manually (avoids re-serialisation of TBS)
  //    Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
  const certDer = derTLV(0x30, derCat(tbsDer, SHA256_RSA_ALG_DER, derBitStr(signature)))

  // 8. PEM encode
  const b64 = btoa(String.fromCharCode(...certDer))
  const lines = b64.match(/.{1,64}/g) ?? []
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`
}

const PayloadCard: React.FC<{
  payload: IKEv2Payload
  index: number
  highlighted: boolean
  isFragmented?: boolean
}> = ({ payload, highlighted, isFragmented }) => (
  <div
    className={`rounded-lg p-2 border text-xs transition-all duration-300 ${
      highlighted
        ? isFragmented
          ? 'bg-destructive/10 border-destructive/40 shadow-[0_0_8px_hsl(var(--destructive)/0.15)] animate-pulse'
          : 'bg-primary/10 border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
        : 'bg-muted/50 border-border'
    }`}
  >
    <div className="flex items-center justify-between mb-1">
      <span className={`font-bold ${isFragmented ? 'text-destructive' : 'text-foreground'}`}>
        {payload.abbreviation}
      </span>
      <span className="text-muted-foreground">{payload.sizeBytes} B</span>
    </div>
    <p className="text-muted-foreground text-[10px]">{payload.description}</p>
    {isFragmented && (
      <div className="text-destructive text-[10px] mt-1 font-bold flex items-center gap-1">
        <ShieldAlert size={10} /> Packet dropped (Exceeds MTU)
      </div>
    )}
  </div>
)

// ── C6: IKE phase annotation for charon.log entries ───────────────────────────
type IkePhase = 'SETUP' | 'IKE_SA_INIT' | 'IKE_INTERMEDIATE' | 'IKE_AUTH'

function getIkePhase(text: string, mode: IKEv2Mode): IkePhase | null {
  if (/C_Initialize|C_OpenSession|C_Login|C_GetSlotList|C_GetSlotInfo/.test(text)) return 'SETUP'
  if (/C_GenerateKeyPair|C_GenerateKey/.test(text)) return 'IKE_SA_INIT'
  if (/EncapsulateKey|DecapsulateKey/.test(text))
    return mode === 'hybrid' ? 'IKE_INTERMEDIATE' : 'IKE_SA_INIT'
  if (/C_Sign|C_Verify|C_Find|CERT/.test(text)) return 'IKE_AUTH'
  return null
}

const IKE_PHASE_CLASS: Record<IkePhase, string> = {
  SETUP: 'bg-muted text-muted-foreground',
  IKE_SA_INIT: 'bg-primary/20 text-primary',
  IKE_INTERMEDIATE: 'bg-secondary/20 text-secondary',
  IKE_AUTH: 'bg-accent/20 text-accent-foreground',
}

export const VpnSimulationPanel: React.FC<VpnSimulationPanelProps> = ({ initialMode }) => {
  const { moduleRef, hSessionRef, addHsmLog, addHsmKey, hsmKeys, clearHsmKeys, removeHsmKey } =
    useHsmContext()
  const hsmKeysRef = React.useRef(hsmKeys)
  React.useEffect(() => {
    hsmKeysRef.current = hsmKeys
  }, [hsmKeys])
  const [selectedMode, setSelectedMode] = useState<IKEv2Mode>(initialMode ?? 'classical')
  const [currentStep, setCurrentStep] = useState(0)
  const [mtu, setMtu] = useState<number>(1500)
  const [allowFragmentation, setAllowFragmentation] = useState<boolean>(true)
  const [ssState, setSsState] = useState<StrongSwanState>('UNINITIALIZED')
  const [charonFailed, setCharonFailed] = useState(false)
  const [sabError, setSabError] = useState<string | null>(null)
  const [rpcMode, setRpcMode] = useState(true)
  const [showQkdNote, setShowQkdNote] = useState(false)
  const [ssLogs, setSsLogs] = useState<StrongSwanLog[]>([])
  const [kemSecrets, setKemSecrets] = useState<{
    responder?: { hex: string; kcv: string }
    initiator?: { hex: string; kcv: string }
  }>({})

  const serverSessionRef = React.useRef(0)
  const vpnSlotsRef = React.useRef<{ init: number; resp: number }>({ init: 0, resp: 1 })
  // Guards VPN-specific slot init — separate from moduleRef since other panels share that ref.
  const vpnRpcInitRef = React.useRef(false)

  // VPN RPC state: session mapping + per-call sign/verify context
  const vpnStateRef = React.useRef<{
    sessions: Map<number, number> // logical slotId per softhsmv3 session handle
    signMechType: number
    signHKey: number
    verifyMechType: number
    verifyHKey: number
  }>({
    sessions: new Map(),
    signMechType: 0,
    signHKey: 0,
    verifyMechType: 0,
    verifyHKey: 0,
  })

  // Auth mode: PSK works now, pubkey is future
  const [authMode, setAuthMode] = useState<'psk' | 'dual'>('psk')
  const [clientPsk, setClientPsk] = useState('pqc-wasm-demo-key-2026')
  const [serverPsk, setServerPsk] = useState('pqc-wasm-demo-key-2026')
  const pskMismatch = clientPsk !== serverPsk

  // Cert pre-provisioning state (C8): certs must be generated before starting the daemon
  const [certData, setCertData] = useState<{
    initCert: string
    respCert: string
  } | null>(null)
  const [certGenLoading, setCertGenLoading] = useState(false)
  const [showCertInspector, setShowCertInspector] = useState(false)
  const [certInspectorText, setCertInspectorText] = useState<string | null>(null)

  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Single PKCS#11 module — softhsmv3 is statically linked.
  // Both slots (0=initiator keys, 1=responder keys) are accessible via one C_Initialize.
  const charonConfig = `charon {
  integrity_test = no
  load_modular = no
  load = pkcs11 nonce aes sha1 sha2 hmac kdf
  plugins {
    pkcs11 {
      use_hasher = no
      use_rng = yes
      use_dh = yes
      use_ecc = yes
      modules {
        softhsm {
          path = libsofthsmv3.so
        }
      }
    }
  }
  filelog {
    stderr {
      time_format = %H:%M:%S
      default = 1
      mgr = 1
      ike = 2
      net = 1
      enc = 1
      cfg = 2
      lib = 2
    }
  }
}`

  // Build ipsec.conf from role + KE mode + auth mode.
  const buildIpsecConf = useCallback(
    (role: 'initiator' | 'responder', mode: IKEv2Mode, auth: 'psk' | 'dual') => {
      let modeIke = 'aes256-mlkem768-sha384!'
      if (mode === 'classical') modeIke = 'aes256-sha256-modp3072!'
      if (mode === 'hybrid') modeIke = 'aes256-mlkem768-x25519-sha384!'
      const left = role === 'initiator' ? '192.168.0.1' : '192.168.0.2'
      const right = role === 'initiator' ? '192.168.0.2' : '192.168.0.1'
      const auto = role === 'initiator' ? 'start' : 'route'
      const myCert = role === 'initiator' ? 'initiator' : 'responder'
      const peerCert = role === 'initiator' ? 'responder' : 'initiator'
      const authLines =
        auth === 'psk'
          ? `  leftauth=psk\n  right=${right}\n  rightauth=psk`
          : `  leftauth=psk\n  leftauth2=pubkey\n  leftcert=/etc/ipsec.d/certs/${myCert}.crt\n  right=${right}\n  rightauth=psk\n  rightauth2=pubkey\n  rightcert=/etc/ipsec.d/certs/${peerCert}.crt`
      return `config setup\n  strictcrlpolicy=no\nconn %default\n  ikelifetime=60m\n  keylife=20m\n  rekeymargin=3m\n  keyingtries=1\nconn host-host\n  left=${left}\n${authLines}\n  ike=${modeIke}\n  esp=aes256gcm16!\n  auto=${auto}`
    },
    []
  )

  const [activeInitConfig, setActiveInitConfig] = useState(charonConfig)
  const [activeRespConfig, setActiveRespConfig] = useState(charonConfig)
  const [activeInitIpsec, setActiveInitIpsec] = useState(() =>
    buildIpsecConf('initiator', selectedMode, 'psk')
  )
  const [activeRespIpsec, setActiveRespIpsec] = useState(() =>
    buildIpsecConf('responder', selectedMode, 'psk')
  )

  // Rebuild ipsec.conf and strongswan.conf whenever KE mode or auth mode changes.
  React.useEffect(() => {
    setActiveInitIpsec(buildIpsecConf('initiator', selectedMode, authMode))
    setActiveRespIpsec(buildIpsecConf('responder', selectedMode, authMode))
    // Dual auth requires the openssl plugin for certificate parsing/verification.
    const pluginList =
      authMode === 'dual'
        ? 'pkcs11 nonce aes sha1 sha2 hmac kdf openssl'
        : 'pkcs11 nonce aes sha1 sha2 hmac kdf'
    const updatedCharon = charonConfig.replace('pkcs11 nonce aes sha1 sha2 hmac kdf', pluginList)
    setActiveInitConfig(updatedCharon)
    setActiveRespConfig(updatedCharon)
  }, [selectedMode, authMode, buildIpsecConf, charonConfig])

  React.useEffect(() => {
    const handleLog = (log: StrongSwanLog) => {
      setSsLogs((prev) => {
        const next = [...prev, log]
        return next.length > 500 ? next.slice(next.length - 500) : next
      })
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }

      // Auto-advance UI slideshow based on actual charon log output
      const text = log.text.toLowerCase()

      // Basic IKEv2 heuristic log parser mapping
      if (text.includes('initiating ike_sa')) {
        setCurrentStep(1)
      } else if (
        text.includes('parsing ike_sa_init response') ||
        text.includes('parsed ike_sa_init response')
      ) {
        setCurrentStep(2)
      } else if (text.includes('authentication of') && text.includes('successful')) {
        setCurrentStep(stepsLengthRef.current - 1)
      } else if (text.includes('ike_sa') && text.includes('established between')) {
        setCurrentStep(stepsLengthRef.current - 1)
        setCharonFailed(false)
      } else if (
        text.includes('establishing ike_sa failed') ||
        text.includes('fatal error') ||
        text.includes('error:') ||
        text.includes('signature validation failed')
      ) {
        setCharonFailed(true)
      }
    }
    const handleState = (state: StrongSwanState) => setSsState(state)

    strongSwanEngine.addLogListener(handleLog)
    strongSwanEngine.addStateListener(handleState)

    // Wire up RPC handler — dispatches charon's PKCS#11 calls into softhsmv3 in real time.
    // Both arrays alias the same SharedArrayBuffer so writes are immediately visible to the worker.
    strongSwanEngine.setRpcHandler((sab, workerRole) => {
      const flagView = new Int32Array(sab, 0, 12)
      const p = new Int32Array(sab, 48) // payload i32 view (same as rpcPayloadI32 in worker)
      const payloadView = new Uint8Array(sab, 48) // payload byte view
      const cmdId = Atomics.load(flagView, 0)

      const M = moduleRef.current
      if (!M) {
        Atomics.store(flagView, 2, 0x05) // CKR_GENERAL_ERROR
        Atomics.store(flagView, 1, 2)
        Atomics.notify(flagView, 1, 1)
        strongSwanEngine.dispatchLog({
          level: 'error',
          text: `[RPC] cmd=${cmdId}: softhsmv3 not initialized — please initialize the HSM first`,
        })
        return
      }

      const state = vpnStateRef.current
      const argP0 = p[0] >>> 0 // capture BEFORE switch mutates p[0]
      const argP2 = p[2] >>> 0 // capture BEFORE switch mutates p[2] (used by cmdId 4 wantList)
      let rv = 0 // CKR_OK default

      try {
        switch (cmdId) {
          // ── C_Initialize ─────────────────────────────────────────────────────
          case 0: {
            const r = M._C_Initialize(0) >>> 0
            rv = r === 0x191 ? 0 : r // CKR_CRYPTOKI_ALREADY_INITIALIZED → OK
            strongSwanEngine.dispatchLog({
              level: 'info',
              text: `[RPC] C_Initialize → rv=0x${rv.toString(16)} (raw=0x${r.toString(16)})`,
            })
            break
          }

          // ── C_Finalize ───────────────────────────────────────────────────────
          case 1:
            rv = 0
            break

          // ── C_GetSlotList ────────────────────────────────────────────────────
          // Each worker sees exactly ONE slot — its own reserved slot (logical ID 0).
          // C_GetSlotInfo is NOT intercepted; it goes to the worker's local softhsmv3
          // which wasm_hsm_init always initialises with slot 0 present. Returning only
          // slot 0 avoids any cross-slot confusion: the initiator worker never touches
          // the responder slot and vice versa. Real slot mapping happens in C_OpenSession.
          case 4: {
            const wantList = p[2]
            p[0] = 1 // exactly one slot per worker
            if (wantList) {
              p[1] = 0 // logical slot 0 — always; maps to worker's own real slot in C_OpenSession
            }
            rv = 0
            break
          }

          // ── C_GetTokenInfo ───────────────────────────────────────────────────
          // Write a minimal CK_TOKEN_INFO (160 bytes) into payload[4..164].
          // CKF_TOKEN_INITIALIZED=0x400 | CKF_RNG=0x01 | CKF_USER_PIN_INITIALIZED=0x08
          // CKF_LOGIN_REQUIRED is intentionally cleared — we auto-login in C_OpenSession.
          case 6: {
            const slotId6 = p[0] >>> 0
            payloadView.fill(0x20, 4, 100) // space-pad label/mfr/model/serial (TOKEN_INFO bytes 0-95)
            payloadView.fill(0, 100, 164) // zero numeric fields (TOKEN_INFO bytes 96-159)
            const dv = new DataView(sab, 48 + 4) // DataView over TOKEN_INFO struct (starts at payload byte 4)
            dv.setUint32(96, 0x409, true) // flags: TOKEN_INITIALIZED|RNG|USER_PIN_INITIALIZED
            dv.setUint32(100, 0xffffffff, true) // ulMaxSessionCount = CK_EFFECTIVELY_INFINITE
            dv.setUint32(104, 0, true) // ulSessionCount (current)
            dv.setUint32(108, 0xffffffff, true) // ulMaxRwSessionCount = CK_EFFECTIVELY_INFINITE
            dv.setUint32(112, 0, true) // ulRwSessionCount (current)
            dv.setUint32(116, 255, true) // ulMaxPinLen
            dv.setUint32(120, 4, true) // ulMinPinLen
            dv.setUint32(124, 0xffffffff, true) // ulTotalPublicMemory = CK_UNAVAILABLE
            dv.setUint32(128, 0xffffffff, true) // ulFreePublicMemory = CK_UNAVAILABLE
            dv.setUint32(132, 0xffffffff, true) // ulTotalPrivateMemory = CK_UNAVAILABLE
            dv.setUint32(136, 0xffffffff, true) // ulFreePrivateMemory = CK_UNAVAILABLE
            rv = 0
            strongSwanEngine.dispatchLog({
              level: 'info',
              text: `[RPC] C_GetTokenInfo slotId=${slotId6} → flags=0x409 ulMaxSess=∞`,
            })
            break
          }

          // ── C_GetMechanismList ───────────────────────────────────────────────
          case 7: {
            const mechs = [
              0x00,
              0x01,
              0x06,
              0x40,
              0x43, // RSA_PKCS_KEY_PAIR_GEN, RSA_PKCS, SHA1_RSA_PKCS, SHA256_RSA_PKCS, SHA256_RSA_PKCS_PSS
              0x1040,
              0x1050, // EC_KEY_PAIR_GEN, ECDH1_DERIVE — required by pkcs11_dh for ECP_256 key exchange
              0x000f,
              0x0017, // CKM_ML_KEM_KEY_PAIR_GEN, CKM_ML_KEM
              0x001c, // CKM_ML_DSA_KEY_PAIR_GEN
            ]
            const wantList7 = p[2]
            p[0] = mechs.length
            if (wantList7)
              mechs.forEach((m, i) => {
                p[1 + i] = m
              })
            rv = 0
            break
          }

          // ── C_OpenSession ─────────────────────────────────────────────────────
          // Charon sees only one slot (logical 0) per worker (see C_GetSlotList above).
          // Route to the correct real slot in the main-thread softhsmv3 based on the
          // worker's role — initiator always uses its reserved slot, responder likewise.
          case 12: {
            const slotId12 = p[0] >>> 0
            const flags12 = p[1] >>> 0
            // Each worker owns exactly one slot; workerRole decides which real slot to open.
            const realSlot12 =
              workerRole === 'initiator' ? vpnSlotsRef.current.init : vpnSlotsRef.current.resp
            const sessPtr = M._malloc(4)
            const r12 =
              M._C_OpenSession(realSlot12, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, sessPtr) >>> 0
            if (r12 === 0) {
              const hSess = M.getValue(sessPtr, 'i32') >>> 0
              const pinBytes = new TextEncoder().encode('user1234')
              const pinPtr = M._malloc(pinBytes.length)
              M.HEAPU8.set(pinBytes, pinPtr)
              const loginRv = M._C_Login(hSess, CKU_USER, pinPtr, pinBytes.length) >>> 0
              M._free(pinPtr)
              p[0] = hSess
              state.sessions.set(hSess, slotId12)
              // Capture responder's first session for server HsmKeyInspector
              if (workerRole === 'responder' && !serverSessionRef.current)
                serverSessionRef.current = hSess
              strongSwanEngine.dispatchLog({
                level: 'info',
                text: `[RPC] C_OpenSession slotId=${slotId12} flags=0x${flags12.toString(16)} → hSess=${hSess} loginRv=0x${loginRv.toString(16)}`,
              })
            } else {
              strongSwanEngine.dispatchLog({
                level: 'error',
                text: `[RPC] C_OpenSession slotId=${slotId12} FAILED rv=0x${r12.toString(16)}`,
              })
            }
            M._free(sessPtr)
            rv = r12
            break
          }

          // ── C_CloseSession ───────────────────────────────────────────────────
          case 13: {
            const hSess13 = p[0] >>> 0
            state.sessions.delete(hSess13)
            M._C_CloseSession(hSess13)
            rv = 0
            strongSwanEngine.dispatchLog({
              level: 'info',
              text: `[RPC] C_CloseSession hSess=${hSess13}`,
            })
            break
          }

          // ── C_Login ── already logged in during OpenSession ──────────────────
          case 18:
            rv = 0x100
            break // CKR_USER_ALREADY_LOGGED_IN

          // ── C_Logout ─────────────────────────────────────────────────────────
          case 19:
            rv = 0
            break

          // ── C_GetAttributeValue ───────────────────────────────────────────────
          // Two-pass softhsmv3 call: first get sizes (NULL pValue), then values.
          // Worker already serialised attrCount types+capacities into payload.
          case 24: {
            const hSess24 = p[0] >>> 0
            const hObj = p[1] >>> 0
            const attrCount = p[2] >>> 0
            const types: number[] = []
            for (let i = 0; i < attrCount; i++) types.push(p[3 + i * 2] >>> 0)

            // Pass 1: null pValue → get actual sizes
            const tpl1 = M._malloc(attrCount * 12)
            types.forEach((t, i) => {
              M.setValue(tpl1 + i * 12, t, 'i32')
              M.setValue(tpl1 + i * 12 + 4, 0, 'i32')
              M.setValue(tpl1 + i * 12 + 8, 0, 'i32')
            })
            M._C_GetAttributeValue(hSess24, hObj, tpl1, attrCount)
            const sizes = types.map((_, i) => M.getValue(tpl1 + i * 12 + 8, 'i32') >>> 0)
            M._free(tpl1)

            // Pass 2: allocate buffers and fill
            const valPtrs = sizes.map((s) => (s > 0 ? M._malloc(s) : 0))
            const tpl2 = M._malloc(attrCount * 12)
            types.forEach((t, i) => {
              M.setValue(tpl2 + i * 12, t, 'i32')
              M.setValue(tpl2 + i * 12 + 4, valPtrs[i], 'i32')
              M.setValue(tpl2 + i * 12 + 8, sizes[i], 'i32')
            })
            rv = M._C_GetAttributeValue(hSess24, hObj, tpl2, attrCount) >>> 0

            // Serialize: write actual lengths into payload[3+i*2], values after header
            const byteBase = (3 + attrCount * 2) * 4
            let bytePos = 0
            types.forEach((_, i) => {
              const len = M.getValue(tpl2 + i * 12 + 8, 'i32') >>> 0
              p[3 + i * 2] = len
              if (valPtrs[i] && len > 0) {
                payloadView.set(M.HEAPU8.subarray(valPtrs[i], valPtrs[i] + len), byteBase + bytePos)
              }
              bytePos += len
              if (valPtrs[i]) M._free(valPtrs[i])
            })
            M._free(tpl2)
            break
          }

          // ── C_FindObjectsInit ─────────────────────────────────────────────────
          case 26: {
            const hSess26 = p[0] >>> 0
            const attrCount26 = p[1] >>> 0
            const byteBase26 = (2 + attrCount26 * 2) * 4
            let bytePos26 = 0

            const tplPtr26 = M._malloc(attrCount26 * 12)
            for (let i = 0; i < attrCount26; i++) {
              const attrType = p[2 + i * 2]
              const attrLen = p[3 + i * 2]

              M.setValue(tplPtr26 + i * 12, attrType, 'i32')
              if (attrLen > 0) {
                const valPtr = M._malloc(attrLen)
                M.HEAPU8.set(
                  payloadView.subarray(byteBase26 + bytePos26, byteBase26 + bytePos26 + attrLen),
                  valPtr
                )
                M.setValue(tplPtr26 + i * 12 + 4, valPtr, 'i32')
              } else {
                M.setValue(tplPtr26 + i * 12 + 4, 0, 'i32')
              }
              M.setValue(tplPtr26 + i * 12 + 8, attrLen, 'i32')
              bytePos26 += attrLen
            }

            rv = M._C_FindObjectsInit(hSess26, tplPtr26, attrCount26) >>> 0

            for (let i = 0; i < attrCount26; i++) {
              const valPtr = M.getValue(tplPtr26 + i * 12 + 4, 'i32')
              if (valPtr) M._free(valPtr)
            }
            M._free(tplPtr26)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_FindObjectsInit hSess=${hSess26} attrCount=${attrCount26} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_FindObjects ─────────────────────────────────────────────────────
          case 27: {
            const hSess27 = p[0] >>> 0
            const maxCount27 = p[1] >>> 0
            const handlesPtr = M._malloc(maxCount27 * 4)
            const countPtr = M._malloc(4)
            rv = M._C_FindObjects(hSess27, handlesPtr, maxCount27, countPtr) >>> 0

            if (rv === 0) {
              const foundCount = M.getValue(countPtr, 'i32') >>> 0
              p[0] = foundCount
              for (let i = 0; i < foundCount; i++) {
                p[1 + i] = M.getValue(handlesPtr + i * 4, 'i32') >>> 0
              }
              strongSwanEngine.dispatchLog({
                level: 'info',
                text: `[RPC] C_FindObjects maxCount=${maxCount27} found=${foundCount} (worker=${workerRole})`,
              })
            } else {
              strongSwanEngine.dispatchLog({
                level: 'error',
                text: `[RPC] C_FindObjects failed rv=0x${rv.toString(16)}`,
              })
            }
            M._free(handlesPtr)
            M._free(countPtr)
            break
          }

          // ── C_FindObjectsFinal ────────────────────────────────────────────────
          case 28: {
            const hSess28 = p[0] >>> 0
            rv = M._C_FindObjectsFinal(hSess28) >>> 0
            break
          }

          // ── C_SignInit ────────────────────────────────────────────────────────
          // Call softhsmv3 immediately; signing state lives in the WASM session object.
          case 42: {
            const hSess42 = p[0] >>> 0
            const mechType42 = p[1] >>> 0
            const paramLen42 = p[2] >>> 0
            const hKey42 = p[3] >>> 0
            const mechPtr42 = M._malloc(12)
            M.setValue(mechPtr42, mechType42, 'i32')
            if (paramLen42 > 0) {
              const paramPtr42 = M._malloc(paramLen42)
              M.HEAPU8.set(payloadView.subarray(16, 16 + paramLen42), paramPtr42)
              M.setValue(mechPtr42 + 4, paramPtr42, 'i32')
              M.setValue(mechPtr42 + 8, paramLen42, 'i32')
              rv = M._C_SignInit(hSess42, mechPtr42, hKey42) >>> 0
              M._free(paramPtr42)
            } else {
              M.setValue(mechPtr42 + 4, 0, 'i32')
              M.setValue(mechPtr42 + 8, 0, 'i32')
              rv = M._C_SignInit(hSess42, mechPtr42, hKey42) >>> 0
            }
            M._free(mechPtr42)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_SignInit hSess=${hSess42} mech=0x${mechType42.toString(16)} hKey=${hKey42} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_Sign ───────────────────────────────────────────────────────────
          // wantSig=0: return buffer-size hint without signing (preserves WASM signing state).
          // wantSig=1: call softhsmv3 C_Sign; write signature into payload[4..].
          case 43: {
            const hSess43 = p[0] >>> 0
            const dataLen43 = p[1] >>> 0
            const wantSig43 = p[2]
            if (!wantSig43) {
              p[0] = 4096 // conservative size estimate; charon allocates this much
              rv = 0
              strongSwanEngine.dispatchLog({
                level: 'info',
                text: `[RPC] C_Sign hSess=${hSess43} sizeQuery → hint=4096`,
              })
            } else {
              const dataPtr43 = M._malloc(dataLen43)
              M.HEAPU8.set(payloadView.subarray(12, 12 + dataLen43), dataPtr43)
              const sigBufPtr43 = M._malloc(4096)
              const sigLenPtr43 = M._malloc(4)
              M.setValue(sigLenPtr43, 4096, 'i32')
              rv = M._C_Sign(hSess43, dataPtr43, dataLen43, sigBufPtr43, sigLenPtr43) >>> 0
              const sigLen43 = M.getValue(sigLenPtr43, 'i32') >>> 0
              p[0] = sigLen43
              if (rv === 0 && sigLen43 > 0) {
                payloadView.set(M.HEAPU8.subarray(sigBufPtr43, sigBufPtr43 + sigLen43), 4)
              }
              M._free(dataPtr43)
              M._free(sigBufPtr43)
              M._free(sigLenPtr43)
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_Sign hSess=${hSess43} dataLen=${dataLen43} → sigLen=${sigLen43} rv=0x${rv.toString(16)}`,
              })
            }
            break
          }

          // ── C_VerifyInit ──────────────────────────────────────────────────────
          case 48: {
            const hSess48 = p[0] >>> 0
            const mechType48 = p[1] >>> 0
            const paramLen48 = p[2] >>> 0
            const hKey48 = p[3] >>> 0
            const mechPtr48 = M._malloc(12)
            M.setValue(mechPtr48, mechType48, 'i32')
            if (paramLen48 > 0) {
              const paramPtr48 = M._malloc(paramLen48)
              M.HEAPU8.set(payloadView.subarray(16, 16 + paramLen48), paramPtr48)
              M.setValue(mechPtr48 + 4, paramPtr48, 'i32')
              M.setValue(mechPtr48 + 8, paramLen48, 'i32')
              rv = M._C_VerifyInit(hSess48, mechPtr48, hKey48) >>> 0
              M._free(paramPtr48)
            } else {
              M.setValue(mechPtr48 + 4, 0, 'i32')
              M.setValue(mechPtr48 + 8, 0, 'i32')
              rv = M._C_VerifyInit(hSess48, mechPtr48, hKey48) >>> 0
            }
            M._free(mechPtr48)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_VerifyInit hSess=${hSess48} mech=0x${mechType48.toString(16)} hKey=${hKey48} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_Verify ──────────────────────────────────────────────────────────
          case 49: {
            const hSess49 = p[0] >>> 0
            const dataLen49 = p[1] >>> 0
            const sigLen49 = p[2] >>> 0
            const dataPtr49 = M._malloc(dataLen49)
            const sigPtr49 = M._malloc(sigLen49)
            M.HEAPU8.set(payloadView.subarray(12, 12 + dataLen49), dataPtr49)
            M.HEAPU8.set(payloadView.subarray(12 + dataLen49, 12 + dataLen49 + sigLen49), sigPtr49)
            rv = M._C_Verify(hSess49, dataPtr49, dataLen49, sigPtr49, sigLen49) >>> 0
            M._free(dataPtr49)
            M._free(sigPtr49)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_Verify hSess=${hSess49} dataLen=${dataLen49} sigLen=${sigLen49} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_GenerateKeyPair ────────────────────────────────────────────────
          case 59: {
            const hSess59 = p[0] >>> 0
            const mechType59 = p[1] >>> 0
            const pubCount59 = p[2] >>> 0
            const privCount59 = p[3] >>> 0

            const mechPtr59 = M._malloc(12)
            M.setValue(mechPtr59, mechType59, 'i32')
            M.setValue(mechPtr59 + 4, 0, 'i32') // param ptr
            M.setValue(mechPtr59 + 8, 0, 'i32') // param len

            const deserializeTpl = (count: number, startHdrOff: number, byteBase: number) => {
              const tplPtr = M._malloc(count * 12)
              let byteOff = 0
              let hdrOff = startHdrOff
              for (let i = 0; i < count; i++) {
                const type = p[hdrOff++]
                const valLen = p[hdrOff++]
                M.setValue(tplPtr + i * 12, type, 'i32')
                if (valLen > 0) {
                  const valPtr = M._malloc(valLen)
                  M.HEAPU8.set(
                    payloadView.subarray(byteBase + byteOff, byteBase + byteOff + valLen),
                    valPtr
                  )
                  M.setValue(tplPtr + i * 12 + 4, valPtr, 'i32')
                } else {
                  M.setValue(tplPtr + i * 12 + 4, 0, 'i32')
                }
                M.setValue(tplPtr + i * 12 + 8, valLen, 'i32')
                byteOff += valLen > 0 ? valLen : 0
              }
              return { tplPtr, totalBytes: byteOff }
            }

            const byteBase59 = (4 + (pubCount59 + privCount59) * 2) * 4
            const pubTpl = deserializeTpl(pubCount59, 4, byteBase59)
            const privTpl = deserializeTpl(
              privCount59,
              4 + pubCount59 * 2,
              byteBase59 + pubTpl.totalBytes
            )

            const pubKeyPtr = M._malloc(4)
            const privKeyPtr = M._malloc(4)

            // Inject CKA_TOKEN=CK_TRUE into both templates so generated keys are token
            // objects that survive C_CloseSession and can be inspected afterwards.
            // Strategy: allocate an extended array (n+1 entries), copy the original entries
            // (sharing their valPtrs — do NOT free them via the extended array), then add the
            // CKA_TOKEN entry with its own boolPtr at the end.
            const injectTokenFlag = (srcTplPtr: number, srcCount: number) => {
              const extTplPtr = M._malloc((srcCount + 1) * 12)
              M.HEAPU8.set(M.HEAPU8.subarray(srcTplPtr, srcTplPtr + srcCount * 12), extTplPtr)
              const boolPtr = M._malloc(1)
              M.HEAPU8[boolPtr] = 1 // CK_TRUE
              M.setValue(extTplPtr + srcCount * 12, 0x00000001, 'i32') // CKA_TOKEN
              M.setValue(extTplPtr + srcCount * 12 + 4, boolPtr, 'i32') // pValue
              M.setValue(extTplPtr + srcCount * 12 + 8, 1, 'i32') // ulValueLen (CK_BBOOL)
              return { extTplPtr, boolPtr }
            }
            const extPub = injectTokenFlag(pubTpl.tplPtr, pubCount59)
            const extPriv = injectTokenFlag(privTpl.tplPtr, privCount59)

            // ML-KEM public key: CKA_PARAMETER_SET (0x061d) has ck3 flag = MUST be in generate template.
            // charon's pkcs11_kem.c only sends {CKA_DERIVE=CK_TRUE} — inject CKP_ML_KEM_768 (2) here.
            const CKA_PARAMETER_SET_ID = 0x0000061d
            let finalPubPtr = extPub.extTplPtr
            let finalPubCount = pubCount59 + 1
            let paramSetValPtr: number | null = null

            if (mechType59 === 0x000f) {
              finalPubCount = pubCount59 + 2
              const newPubPtr = M._malloc(finalPubCount * 12)
              M.HEAPU8.set(
                M.HEAPU8.subarray(extPub.extTplPtr, extPub.extTplPtr + (pubCount59 + 1) * 12),
                newPubPtr
              )
              paramSetValPtr = M._malloc(4)
              M.setValue(paramSetValPtr, 2, 'i32') // CKP_ML_KEM_768 = 2
              M.setValue(newPubPtr + (pubCount59 + 1) * 12, CKA_PARAMETER_SET_ID, 'i32')
              M.setValue(newPubPtr + (pubCount59 + 1) * 12 + 4, paramSetValPtr, 'i32')
              M.setValue(newPubPtr + (pubCount59 + 1) * 12 + 8, 4, 'i32')
              M._free(extPub.boolPtr)
              M._free(extPub.extTplPtr)
              finalPubPtr = newPubPtr
            }

            rv =
              M._C_GenerateKeyPair(
                hSess59,
                mechPtr59,
                finalPubPtr,
                finalPubCount,
                extPriv.extTplPtr,
                privCount59 + 1,
                pubKeyPtr,
                privKeyPtr
              ) >>> 0

            // Free extended arrays only (NOT their shared valPtrs 0..n-1 — those belong to originals)
            if (paramSetValPtr !== null) {
              M._free(paramSetValPtr)
              M._free(finalPubPtr)
            } else {
              M._free(extPub.boolPtr)
              M._free(extPub.extTplPtr)
            }
            M._free(extPriv.boolPtr)
            M._free(extPriv.extTplPtr)

            if (rv === 0) {
              p[0] = M.getValue(pubKeyPtr, 'i32') >>> 0
              p[1] = M.getValue(privKeyPtr, 'i32') >>> 0
              // Register keys in the context so the Key Inspector populates
              const isEC = mechType59 === 0x1040
              const isMlDsa = mechType59 === 0x001c
              const isMlKem = mechType59 === 0x000f
              const family = isEC ? 'ecdh' : isMlDsa ? 'ml-dsa' : isMlKem ? 'ml-kem' : 'rsa'
              const variant = isEC ? 'P-256' : isMlDsa ? 'ML-DSA' : isMlKem ? 'ML-KEM' : 'RSA'
              const keyLabel = isEC ? 'ECDH' : isMlDsa ? 'ML-DSA' : isMlKem ? 'ML-KEM' : 'RSA'
              const ts = new Date().toISOString()
              const keySlotId = workerRole === 'initiator' ? 0 : 1
              addHsmKey({
                handle: p[0],
                family,
                role: 'public',
                label: `${keyLabel} Public Key`,
                variant,
                engine: 'rust',
                generatedAt: ts,
                slotId: keySlotId,
              })
              addHsmKey({
                handle: p[1],
                family,
                role: 'private',
                label: `${keyLabel} Private Key`,
                variant,
                engine: 'rust',
                generatedAt: ts,
                slotId: keySlotId,
              })
            }

            M._free(mechPtr59)
            const freeTplVals = (tplPtr: number, count: number) => {
              for (let i = 0; i < count; i++) {
                const valPtr = M.getValue(tplPtr + i * 12 + 4, 'i32')
                if (valPtr) M._free(valPtr)
              }
              M._free(tplPtr)
            }
            freeTplVals(pubTpl.tplPtr, pubCount59)
            freeTplVals(privTpl.tplPtr, privCount59)
            M._free(pubKeyPtr)
            M._free(privKeyPtr)

            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_GenerateKeyPair hSess=${hSess59} mech=0x${mechType59.toString(16)} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_EncapsulateKey ────────────────────────────────────────────────
          case 68: {
            const hSess68 = p[0] >>> 0
            const mechType68 = p[1] >>> 0
            const hKey68 = p[2] >>> 0
            const wantCt = p[3]

            const mechPtr68 = M._malloc(12)
            M.setValue(mechPtr68, mechType68, 'i32')
            M.setValue(mechPtr68 + 4, 0, 'i32')
            M.setValue(mechPtr68 + 8, 0, 'i32')

            if (!wantCt) {
              const ctLenPtr = M._malloc(4)
              const dummyKeyPtr68 = M._malloc(4) // phKey must be non-NULL even for size query (softhsmv3 guards phKey before size-query path)
              // softhsmv3 8-param: (hSess, pMech, hPubKey, pTemplate=NULL, ulAttrCount=0, pCiphertext=NULL, pulCtLen, phKey=NULL)
              rv =
                M._C_EncapsulateKey(
                  hSess68,
                  mechPtr68,
                  hKey68,
                  0,
                  0,
                  0,
                  ctLenPtr,
                  dummyKeyPtr68
                ) >>> 0
              if (rv === 0) p[0] = M.getValue(ctLenPtr, 'i32') >>> 0
              M._free(ctLenPtr)
              M._free(dummyKeyPtr68)
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_EncapsulateKey SizeQuery hSess=${hSess68} hKey=${hKey68} → rv=0x${rv.toString(16)} len=${p[0]}`,
              })
            } else {
              const ctLenPtr = M._malloc(4)
              M.setValue(ctLenPtr, 4096, 'i32')
              const ctBufPtr = M._malloc(4096)
              const hSecretKeyPtr = M._malloc(4)
              const kemTmpl68 = buildKemSecretKeyTmpl(M)
              // softhsmv3 8-param: (hSess, pMech, hPubKey, pTemplate, ulAttrCount, pCiphertext, pulCtLen, phKey)
              rv =
                M._C_EncapsulateKey(
                  hSess68,
                  mechPtr68,
                  hKey68,
                  kemTmpl68.tpl,
                  kemTmpl68.count,
                  ctBufPtr,
                  ctLenPtr,
                  hSecretKeyPtr
                ) >>> 0
              if (rv === 0) {
                const ctLen = M.getValue(ctLenPtr, 'i32') >>> 0
                p[0] = ctLen
                p[1] = M.getValue(hSecretKeyPtr, 'i32') >>> 0
                if (ctLen > 0) {
                  payloadView.set(M.HEAPU8.subarray(ctBufPtr, ctBufPtr + ctLen), 8)
                }
              }
              M._free(ctLenPtr)
              M._free(ctBufPtr)
              M._free(hSecretKeyPtr)
              kemTmpl68.free()
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_EncapsulateKey Exec hSess=${hSess68} hKey=${hKey68} → rv=0x${rv.toString(16)} len=${p[0]} secKey=${p[1]}`,
              })
            }
            M._free(mechPtr68)
            break
          }

          // ── C_DecapsulateKey ────────────────────────────────────────────────
          case 69: {
            const hSess69 = p[0] >>> 0
            const mechType69 = p[1] >>> 0
            const hKey69 = p[2] >>> 0
            const ctLen69 = p[3] >>> 0

            const mechPtr69 = M._malloc(12)
            M.setValue(mechPtr69, mechType69, 'i32')
            M.setValue(mechPtr69 + 4, 0, 'i32')
            M.setValue(mechPtr69 + 8, 0, 'i32')

            const ctBufPtr69 = M._malloc(ctLen69)
            if (ctLen69 > 0) {
              M.HEAPU8.set(payloadView.subarray(16, 16 + ctLen69), ctBufPtr69)
            }

            const hSecretKeyPtr69 = M._malloc(4)
            const kemTmpl69 = buildKemSecretKeyTmpl(M)
            // softhsmv3 8-param: (hSess, pMech, hPrivKey, pTemplate, ulAttrCount, pCiphertext, ulCtLen, phKey)
            rv =
              M._C_DecapsulateKey(
                hSess69,
                mechPtr69,
                hKey69,
                kemTmpl69.tpl,
                kemTmpl69.count,
                ctBufPtr69,
                ctLen69,
                hSecretKeyPtr69
              ) >>> 0

            if (rv === 0) {
              p[0] = M.getValue(hSecretKeyPtr69, 'i32') >>> 0
            }

            M._free(mechPtr69)
            M._free(ctBufPtr69)
            M._free(hSecretKeyPtr69)
            kemTmpl69.free()
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_DecapsulateKey Exec hSess=${hSess69} hKey=${hKey69} → rv=0x${rv.toString(16)} secKey=${p[0]}`,
            })
            break
          }

          case 90: {
            // C_GenerateRandom — p[0]=hSess, p[1]=len → bytes at payloadView[8..]
            const hSess90 = p[0] >>> 0
            const len90 = p[1] >>> 0
            if (len90 > 0) {
              const bufPtr90 = M._malloc(len90)
              rv = M._C_GenerateRandom(hSess90, bufPtr90, len90) >>> 0
              if (rv === 0) payloadView.set(M.HEAPU8.subarray(bufPtr90, bufPtr90 + len90), 8)
              M._free(bufPtr90)
            }
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_GenerateRandom hSess=${hSess90} len=${len90} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          case 91: {
            // C_DeriveKey (ECDH1_DERIVE) — p[0..7]=hSess/mechType/baseKey/attrCount/mechParamType/kdf/sharedDataLen/pubDataLen
            // pubkey bytes at payloadView[byteBase..], template values follow
            const hSess91 = p[0] >>> 0
            const mechType91 = p[1] >>> 0
            const baseKey91 = p[2] >>> 0
            const attrCount91 = p[3] >>> 0
            const mechParamType91 = p[4] >>> 0 // 1 = ECDH1_DERIVE_PARAMS
            const kdf91 = p[5] >>> 0
            const pubDataLen91 = p[7] >>> 0
            const byteBase91 = (8 + attrCount91 * 2) * 4

            if (mechParamType91 === 1 && pubDataLen91 > 0) {
              const PARAMS_SIZE = 20 // sizeof(CK_ECDH1_DERIVE_PARAMS) in 32-bit WASM
              const paramsPtr91 = M._malloc(PARAMS_SIZE + pubDataLen91)
              const pubkeyPtr91 = paramsPtr91 + PARAMS_SIZE
              M.HEAPU8.set(new Uint8Array(sab, 48 + byteBase91, pubDataLen91), pubkeyPtr91)
              M.setValue(paramsPtr91, kdf91, 'i32')
              M.setValue(paramsPtr91 + 4, 0, 'i32') // ulSharedDataLen
              M.setValue(paramsPtr91 + 8, 0, 'i32') // pSharedData = NULL
              M.setValue(paramsPtr91 + 12, pubDataLen91, 'i32')
              M.setValue(paramsPtr91 + 16, pubkeyPtr91, 'i32')

              const mechPtr91 = M._malloc(12)
              M.setValue(mechPtr91, mechType91, 'i32')
              M.setValue(mechPtr91 + 4, paramsPtr91, 'i32')
              M.setValue(mechPtr91 + 8, PARAMS_SIZE, 'i32')

              const tplPtr91 = M._malloc(attrCount91 * 12)
              let byteOff91 = pubDataLen91
              for (let i = 0; i < attrCount91; i++) {
                const t91 = p[8 + i * 2] >>> 0
                const l91 = p[9 + i * 2] >>> 0
                M.setValue(tplPtr91 + i * 12, t91, 'i32')
                if (l91 > 0) {
                  const vPtr91 = M._malloc(l91)
                  M.HEAPU8.set(new Uint8Array(sab, 48 + byteBase91 + byteOff91, l91), vPtr91)
                  M.setValue(tplPtr91 + i * 12 + 4, vPtr91, 'i32')
                  byteOff91 += l91
                } else {
                  M.setValue(tplPtr91 + i * 12 + 4, 0, 'i32')
                }
                M.setValue(tplPtr91 + i * 12 + 8, l91, 'i32')
              }

              const newKeyPtr91 = M._malloc(4)
              rv =
                M._C_DeriveKey(
                  hSess91,
                  mechPtr91,
                  baseKey91,
                  tplPtr91,
                  attrCount91,
                  newKeyPtr91
                ) >>> 0
              if (rv === 0) p[0] = M.getValue(newKeyPtr91, 'i32') >>> 0

              M._free(paramsPtr91)
              M._free(mechPtr91)
              M._free(tplPtr91)
              M._free(newKeyPtr91)
            } else {
              rv = 0x50 // CKR_FUNCTION_NOT_SUPPORTED — unsupported mech param type
            }

            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_DeriveKey hSess=${hSess91} mech=0x${mechType91.toString(16)} base=${baseKey91} attrCnt=${attrCount91} → rv=0x${rv.toString(16)} newKey=${p[0]}`,
            })
            break
          }

          // ── C_CreateObject (cmdId 30) ─────────────────────────────────────────
          // Responder imports initiator's ML-KEM public key before C_EncapsulateKey.
          // p[0]=hSess, p[1]=attrCount; p[2+i*2]=type, p[3+i*2]=len per attr.
          // Byte values at byteBase=(2+attrCount*2)*4. Output: p[0]=hObject.
          case 30: {
            const hSess30 = p[0] >>> 0
            const cnt30 = p[1] >>> 0
            const byteBase30 = (2 + cnt30 * 2) * 4
            const tplPtr30 = M._malloc(cnt30 * 12)
            let byteOff30 = 0
            for (let i = 0; i < cnt30; i++) {
              const attrType30 = p[2 + i * 2] >>> 0
              const attrLen30 = p[3 + i * 2] >>> 0
              M.setValue(tplPtr30 + i * 12, attrType30, 'i32')
              if (attrLen30 > 0) {
                const valPtr30 = M._malloc(attrLen30)
                M.HEAPU8.set(
                  payloadView.subarray(byteBase30 + byteOff30, byteBase30 + byteOff30 + attrLen30),
                  valPtr30
                )
                M.setValue(tplPtr30 + i * 12 + 4, valPtr30, 'i32')
                byteOff30 += attrLen30
              } else {
                M.setValue(tplPtr30 + i * 12 + 4, 0, 'i32')
              }
              M.setValue(tplPtr30 + i * 12 + 8, attrLen30, 'i32')
            }
            const hObjPtr30 = M._malloc(4)
            rv = M._C_CreateObject(hSess30, tplPtr30, cnt30, hObjPtr30) >>> 0
            if (rv === 0) p[0] = M.getValue(hObjPtr30, 'i32') >>> 0
            for (let i = 0; i < cnt30; i++) {
              const vp = M.getValue(tplPtr30 + i * 12 + 4, 'i32')
              if (vp) M._free(vp)
            }
            M._free(tplPtr30)
            M._free(hObjPtr30)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_CreateObject hSess=${hSess30} attrCount=${cnt30} → rv=0x${rv.toString(16)} hObject=${p[0]}`,
            })
            break
          }

          // ── C_EncapsulateKey (cmdId 92, PKCS#11 v3.0) ────────────────────────
          // Responder-side ML-KEM encapsulation against imported initiator pubkey.
          // p[0]=hSess, p[1]=mechType, p[2]=hPublicKey, p[3]=wantCt (0=sizeQuery, 1=full).
          // Output: p[0]=ctLen, p[1]=hSecretKey; ciphertext at payloadView[16..].
          case 92: {
            const hSess92 = p[0] >>> 0
            const mechType92 = p[1] >>> 0
            const hKey92 = p[2] >>> 0
            const wantCt92 = p[3]
            const mechPtr92 = M._malloc(12)
            M.setValue(mechPtr92, mechType92, 'i32')
            M.setValue(mechPtr92 + 4, 0, 'i32')
            M.setValue(mechPtr92 + 8, 0, 'i32')
            if (!wantCt92) {
              const ctLenPtr92 = M._malloc(4)
              const dummyKeyPtr92 = M._malloc(4) // phKey must be non-NULL even for size query (softhsmv3 guards phKey before size-query path)
              // softhsmv3 C_EncapsulateKey has 8 params (PKCS#11 v3.2):
              // (hSession, pMechanism, hPublicKey, pTemplate, ulAttrCount, pCiphertext, pulCiphertextLen, phKey)
              rv =
                M._C_EncapsulateKey(
                  hSess92,
                  mechPtr92,
                  hKey92,
                  0,
                  0,
                  0,
                  ctLenPtr92,
                  dummyKeyPtr92
                ) >>> 0
              if (rv === 0) p[0] = M.getValue(ctLenPtr92, 'i32') >>> 0
              M._free(ctLenPtr92)
              M._free(dummyKeyPtr92)
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_EncapsulateKey(92) SizeQuery hSess=${hSess92} hKey=${hKey92} → rv=0x${rv.toString(16)} len=${p[0]}`,
              })
            } else {
              const ctLenPtr92 = M._malloc(4)
              M.setValue(ctLenPtr92, 4096, 'i32')
              const ctBufPtr92 = M._malloc(4096)
              const hSecretKeyPtr92 = M._malloc(4)
              const kemTmpl92 = buildKemSecretKeyTmpl(M)
              // softhsmv3 8-param: (hSess, pMech, hPubKey, pTemplate, ulAttrCount, pCiphertext, pulCtLen, phKey)
              rv =
                M._C_EncapsulateKey(
                  hSess92,
                  mechPtr92,
                  hKey92,
                  kemTmpl92.tpl,
                  kemTmpl92.count,
                  ctBufPtr92,
                  ctLenPtr92,
                  hSecretKeyPtr92
                ) >>> 0
              if (rv === 0) {
                const ctLen92 = M.getValue(ctLenPtr92, 'i32') >>> 0
                p[0] = ctLen92
                p[1] = M.getValue(hSecretKeyPtr92, 'i32') >>> 0
                if (ctLen92 > 0)
                  payloadView.set(M.HEAPU8.subarray(ctBufPtr92, ctBufPtr92 + ctLen92), 16)
                // Extract raw shared secret bytes via C_GetAttributeValue(CKA_VALUE)
                // CKA_SENSITIVE=FALSE allows plaintext read — same path charon uses for SKEYSEED
                const CKA_VALUE = 0x00000011
                const valLenPtr92 = M._malloc(12)
                M.setValue(valLenPtr92 + 0, CKA_VALUE, 'i32')
                M.setValue(valLenPtr92 + 4, 0, 'i32')
                M.setValue(valLenPtr92 + 8, 0, 'i32')
                M._C_GetAttributeValue(hSess92, p[1], valLenPtr92, 1)
                const secretLen92 = M.getValue(valLenPtr92 + 8, 'i32') >>> 0
                let secretHex92 = ''
                if (secretLen92 > 0) {
                  const valBuf92 = M._malloc(secretLen92)
                  M.setValue(valLenPtr92 + 4, valBuf92, 'i32')
                  M._C_GetAttributeValue(hSess92, p[1], valLenPtr92, 1)
                  secretHex92 = Array.from(M.HEAPU8.subarray(valBuf92, valBuf92 + secretLen92))
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join('')
                  M._free(valBuf92)
                }
                M._free(valLenPtr92)
                // First 3 bytes of the raw secret as a comparison fingerprint
                const fp92 = secretHex92.slice(0, 6)
                // Case 92 always runs on the responder worker
                setKemSecrets((prev) => ({
                  ...prev,
                  responder: { hex: secretHex92, kcv: fp92 },
                }))
                const keySlotId92 = workerRole === 'initiator' ? 0 : 1
                addHsmKey({
                  handle: p[1],
                  family: 'ml-kem',
                  role: 'secret',
                  label: `ML-KEM Session Key${fp92 ? ` FP:${fp92}` : secretHex92 ? ` — ${secretHex92.slice(0, 16)}…` : ''}`,
                  variant: 'ML-KEM-768',
                  engine: 'rust',
                  generatedAt: new Date().toISOString(),
                  slotId: keySlotId92,
                })
                strongSwanEngine.dispatchLog({
                  level: 'info',
                  text: `[RPC] ML-KEM shared secret (${secretLen92}B): 0x${secretHex92 || '(read failed)'}${fp92 ? ` | FP: 0x${fp92}` : ''}`,
                })
              }
              M._free(ctLenPtr92)
              M._free(ctBufPtr92)
              M._free(hSecretKeyPtr92)
              kemTmpl92.free()
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_EncapsulateKey(92) Exec hSess=${hSess92} hKey=${hKey92} → rv=0x${rv.toString(16)} ctLen=${p[0]} secKey=${p[1]}`,
              })
            }
            M._free(mechPtr92)
            break
          }

          // ── C_DecapsulateKey (cmdId 93, PKCS#11 v3.0) ────────────────────────
          // Initiator-side ML-KEM decapsulation of ciphertext from responder.
          // p[0]=hSess, p[1]=mechType, p[2]=hPrivKey, p[3]=ctLen; CT at payloadView[16..].
          // Output: p[0]=hSecretKey.
          case 93: {
            const hSess93 = p[0] >>> 0
            const mechType93 = p[1] >>> 0
            const hKey93 = p[2] >>> 0
            const ctLen93 = p[3] >>> 0
            const mechPtr93 = M._malloc(12)
            M.setValue(mechPtr93, mechType93, 'i32')
            M.setValue(mechPtr93 + 4, 0, 'i32')
            M.setValue(mechPtr93 + 8, 0, 'i32')
            const ctBufPtr93 = M._malloc(Math.max(ctLen93, 1))
            if (ctLen93 > 0) M.HEAPU8.set(payloadView.subarray(16, 16 + ctLen93), ctBufPtr93)
            const hSecretKeyPtr93 = M._malloc(4)
            const kemTmpl93 = buildKemSecretKeyTmpl(M)
            // softhsmv3 8-param: (hSess, pMech, hPrivKey, pTemplate, ulAttrCount, pCiphertext, ulCtLen, phKey)
            rv =
              M._C_DecapsulateKey(
                hSess93,
                mechPtr93,
                hKey93,
                kemTmpl93.tpl,
                kemTmpl93.count,
                ctBufPtr93,
                ctLen93,
                hSecretKeyPtr93
              ) >>> 0
            if (rv === 0) {
              p[0] = M.getValue(hSecretKeyPtr93, 'i32') >>> 0
              // Extract raw shared secret bytes — must match responder's encapsulated value
              const CKA_VALUE = 0x00000011
              const valLenPtr93 = M._malloc(12)
              M.setValue(valLenPtr93 + 0, CKA_VALUE, 'i32')
              M.setValue(valLenPtr93 + 4, 0, 'i32')
              M.setValue(valLenPtr93 + 8, 0, 'i32')
              M._C_GetAttributeValue(hSess93, p[0], valLenPtr93, 1)
              const secretLen93 = M.getValue(valLenPtr93 + 8, 'i32') >>> 0
              let secretHex93 = ''
              if (secretLen93 > 0) {
                const valBuf93 = M._malloc(secretLen93)
                M.setValue(valLenPtr93 + 4, valBuf93, 'i32')
                M._C_GetAttributeValue(hSess93, p[0], valLenPtr93, 1)
                secretHex93 = Array.from(M.HEAPU8.subarray(valBuf93, valBuf93 + secretLen93))
                  .map((b) => b.toString(16).padStart(2, '0'))
                  .join('')
                M._free(valBuf93)
              }
              M._free(valLenPtr93)
              // First 3 bytes of the raw secret as a comparison fingerprint
              const fp93 = secretHex93.slice(0, 6)
              // Case 93 always runs on the initiator worker
              setKemSecrets((prev) => ({
                ...prev,
                initiator: { hex: secretHex93, kcv: fp93 },
              }))
              const keySlotId93 = workerRole === 'initiator' ? 0 : 1
              addHsmKey({
                handle: p[0],
                family: 'ml-kem',
                role: 'secret',
                label: `ML-KEM Session Key${fp93 ? ` FP:${fp93}` : secretHex93 ? ` — ${secretHex93.slice(0, 16)}…` : ''}`,
                variant: 'ML-KEM-768',
                engine: 'rust',
                generatedAt: new Date().toISOString(),
                slotId: keySlotId93,
              })
              strongSwanEngine.dispatchLog({
                level: 'info',
                text: `[RPC] ML-KEM shared secret (${secretLen93}B): 0x${secretHex93 || '(read failed)'}${fp93 ? ` | FP: 0x${fp93}` : ''}`,
              })
            }
            M._free(mechPtr93)
            M._free(ctBufPtr93)
            M._free(hSecretKeyPtr93)
            kemTmpl93.free()
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_DecapsulateKey(93) hSess=${hSess93} hKey=${hKey93} ctLen=${ctLen93} → rv=0x${rv.toString(16)} secKey=${p[0]}`,
            })
            break
          }

          default:
            rv = 0x54 // CKR_FUNCTION_NOT_SUPPORTED — do not silently succeed for unknown commands
            strongSwanEngine.dispatchLog({
              level: 'error',
              text: `[RPC] Unknown PKCS#11 command cmdId=${cmdId} → CKR_FUNCTION_NOT_SUPPORTED (0x54)`,
            })
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        strongSwanEngine.dispatchLog({ level: 'error', text: `[RPC cmd=${cmdId}] ${msg}` })
        rv = 0x50 // CKR_FUNCTION_NOT_SUPPORTED
      }

      const PKCS11_FN: Record<number, string> = {
        0: 'C_Initialize',
        1: 'C_Finalize',
        4: 'C_GetSlotList',
        6: 'C_GetTokenInfo',
        7: 'C_GetMechanismList',
        12: 'C_OpenSession',
        13: 'C_CloseSession',
        18: 'C_Login',
        19: 'C_Logout',
        24: 'C_GetAttributeValue',
        26: 'C_FindObjectsInit',
        27: 'C_FindObjects',
        28: 'C_FindObjectsFinal',
        30: 'C_CreateObject',
        42: 'C_SignInit',
        43: 'C_Sign',
        48: 'C_VerifyInit',
        49: 'C_Verify',
        59: 'C_GenerateKeyPair',
        68: 'C_EncapsulateKey',
        69: 'C_DecapsulateKey',
        90: 'C_GenerateRandom',
        91: 'C_DeriveKey',
        92: 'C_EncapsulateKey(v3)',
        93: 'C_DecapsulateKey(v3)',
      }
      // Per-function label for the first argument (captured before switch mutated p[0])
      const PKCS11_ARG0: Record<number, string> = {
        0: '',
        1: '',
        4: `tokenPresent=${argP2}`,
        6: `slotId=${argP0}`,
        7: `slotId=${argP0}`,
        12: `slotId=${argP0}`,
        13: `hSession=${argP0}`,
        18: `hSession=${argP0}`,
        19: `hSession=${argP0}`,
        24: `hSession=${argP0}`,
        26: `hSession=${argP0}`,
        27: `hSession=${argP0}`,
        28: `hSession=${argP0}`,
        30: `hSession=${argP0}`,
        42: `hSession=${argP0}`,
        43: `hSession=${argP0}`,
        48: `hSession=${argP0}`,
        49: `hSession=${argP0}`,
        59: `hSession=${argP0}`,
        68: `hSession=${argP0}`,
        69: `hSession=${argP0}`,
        90: `hSession=${argP0}`,
        91: `hSession=${argP0}`,
        92: `hSession=${argP0}`,
        93: `hSession=${argP0}`,
      }
      // Skip internal plumbing from the PKCS#11 log panel — these are not crypto operations.
      // C_GetAttributeValue is used for key material extraction and is already summarised in
      // the crypto op log entries above. The others are bookkeeping with no educational value.
      const VPN_LOG_SKIP = new Set([
        24, // C_GetAttributeValue — key extraction plumbing
        1, // C_Finalize — bookkeeping
        19, // C_Logout — bookkeeping
        28, // C_FindObjectsFinal — bookkeeping (FindInit/FindObjects still shown)
      ])
      if (!VPN_LOG_SKIP.has(cmdId)) {
        addHsmLog({
          id: Date.now() + Math.floor(Math.random() * 1000),
          timestamp: new Date().toISOString().split('T')[1]?.split('.')[0] || '',
          fn: PKCS11_FN[cmdId] ?? `C_Unknown_${cmdId}`,
          args: `[${workerRole}] ${PKCS11_ARG0[cmdId] ?? `arg0=${argP0}`}`,
          rvName: rv === 0 ? 'CKR_OK' : `0x${rv.toString(16)}`,
          rvHex: `0x${rv.toString(16).padStart(8, '0')}`,
          ok: rv === 0,
          ms: 0,
        })
      }

      Atomics.store(flagView, 2, rv)
      Atomics.store(flagView, 1, 2)
      Atomics.notify(flagView, 1, 1)
    })

    return () => {
      strongSwanEngine.removeLogListener(handleLog)
      strongSwanEngine.removeStateListener(handleState)
      strongSwanEngine.setRpcHandler(() => {})
      strongSwanEngine.destroy()
    }
  }, [moduleRef, hSessionRef, addHsmLog, addHsmKey])

  const exchange = IKE_V2_EXCHANGES[selectedMode]
  const modeConfig = IKE_V2_MODES.find((m) => m.id === selectedMode)

  const steps = useMemo(() => {
    if (!exchange) return []
    const result = [
      {
        label: 'IKE_SA_INIT Request',
        direction: 'right' as const,
        message: exchange.ikeSaInit.initiator,
      },
      {
        label: 'IKE_SA_INIT Response',
        direction: 'left' as const,
        message: exchange.ikeSaInit.responder,
      },
    ]

    if (exchange.ikeIntermediate) {
      result.push(
        {
          label: 'IKE_INTERMEDIATE Request',
          direction: 'right' as const,
          message: exchange.ikeIntermediate.initiator,
        },
        {
          label: 'IKE_INTERMEDIATE Response',
          direction: 'left' as const,
          message: exchange.ikeIntermediate.responder,
        }
      )
    }

    result.push(
      {
        label: 'IKE_AUTH Request',
        direction: 'right' as const,
        message: exchange.ikeAuth.initiator,
      },
      {
        label: 'IKE_AUTH Response',
        direction: 'left' as const,
        message: exchange.ikeAuth.responder,
      }
    )
    return result
  }, [exchange])

  // Keep a ref to steps.length that is always current without adding steps to the
  // useEffect dependency array (which would re-subscribe log/state listeners on every mode change).
  const stepsLengthRef = React.useRef(steps.length)
  stepsLengthRef.current = steps.length

  const hasCrashed = useMemo(() => {
    if (charonFailed) return true
    if (exchange && steps.length > 0) {
      const stepData = steps[currentStep]
      if (stepData) {
        const payloadSize = stepData.message.payloads.reduce((acc, p) => acc + p.sizeBytes, 0)
        if (payloadSize > mtu && !allowFragmentation) {
          return true
        }
      }
    }
    return false
  }, [currentStep, mtu, allowFragmentation, exchange, steps, charonFailed])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setSsLogs([])
    setCharonFailed(false)
    setCertData(null)
    setKemSecrets({})
    // Reset slot init guard so the next Generate Certs / Start Daemon gets fresh slots.
    vpnRpcInitRef.current = false
    strongSwanEngine.destroy()
    // Don't re-init here — user must click "Start Daemon" to pass configs.
  }, [vpnRpcInitRef])

  // Provision RSA-3072 key pairs into softhsmv3 and build self-signed X.509 certs.
  // The private key is generated on the HSM and never exported — cert is signed via
  // C_Sign (CKM_SHA256_RSA_PKCS). @peculiar/asn1-x509 handles TBSCertificate DER.
  // This mirrors real-world HSM provisioning: keys exist before the IKE daemon starts.
  const generateCerts = useCallback(async () => {
    setCertGenLoading(true)
    try {
      // ── 1. Initialize softhsmv3 slots (first run only; idempotent on regenerate) ─
      if (!vpnRpcInitRef.current) {
        const rawM = moduleRef.current ?? (await getSoftHSMRustModule())
        rawM._C_Initialize(0) // idempotent — CKR_CRYPTOKI_ALREADY_INITIALIZED is OK

        const getRawSlots = (M: typeof rawM) => {
          const MAX = 32
          const listPtr = M._malloc(MAX * 4)
          const cntPtr = M._malloc(4)
          M.setValue(cntPtr, MAX, 'i32')
          const rv = M._C_GetSlotList(0, listPtr, cntPtr) >>> 0
          const cnt = rv === 0 ? M.getValue(cntPtr, 'i32') >>> 0 : 0
          const ids: number[] = []
          for (let i = 0; i < cnt; i++) ids.push(M.getValue(listPtr + i * 4, 'i32') >>> 0)
          M._free(listPtr)
          M._free(cntPtr)
          return ids
        }
        const ensureEmptySlot = (M: typeof rawM) => {
          const cntPtr = M._malloc(4)
          M._C_GetSlotList(0, 0, cntPtr)
          M._free(cntPtr)
        }

        ensureEmptySlot(rawM)
        const slots0 = getRawSlots(rawM)
        const uninitSlot0 = slots0[slots0.length - 1]
        hsm_initToken(rawM, uninitSlot0, '1234', 'PQC VPN Initiator')
        const realInitSlot = uninitSlot0
        const hSessInit = hsm_openUserSession(rawM, realInitSlot, '1234', 'user1234')

        ensureEmptySlot(rawM)
        const slots1 = getRawSlots(rawM)
        const uninitSlot1 = slots1[slots1.length - 1]
        hsm_initToken(rawM, uninitSlot1, '1234', 'PQC VPN Responder')
        const realRespSlot = uninitSlot1
        const hSessResp = hsm_openUserSession(rawM, realRespSlot, '1234', 'user1234')

        vpnSlotsRef.current = { init: realInitSlot, resp: realRespSlot }
        hSessionRef.current = hSessInit
        serverSessionRef.current = hSessResp
        vpnRpcInitRef.current = true
        if (!moduleRef.current) moduleRef.current = rawM
      }

      // ── 2. Generate RSA-3072 key pairs on softhsmv3 ───────────────────────────────
      const M = moduleRef.current!
      const hSessInit = hSessionRef.current
      const hSessResp = serverSessionRef.current
      const { init: realInitSlot, resp: realRespSlot } = vpnSlotsRef.current
      const ts = new Date().toISOString()
      const initKeys = hsm_generateRSAKeyPair(M, hSessInit, 3072, false, 'vpn-initiator', true)
      const respKeys = hsm_generateRSAKeyPair(M, hSessResp, 3072, false, 'vpn-responder', true)

      // Tag with logical slot IDs (0 = initiator, 1 = responder) — the Key Inspector
      // filters by these values. Physical slot IDs (realInitSlot, realRespSlot) may be
      // higher when the module is shared with other HSM panels that already claimed 0/1.
      addHsmKey({
        handle: initKeys.pubHandle,
        family: 'rsa',
        role: 'public',
        label: 'RSA-3072 Public Key',
        variant: 'RSA-3072',
        engine: 'rust',
        generatedAt: ts,
        slotId: 0,
      })
      addHsmKey({
        handle: initKeys.privHandle,
        family: 'rsa',
        role: 'private',
        label: 'RSA-3072 Private Key',
        variant: 'RSA-3072',
        engine: 'rust',
        generatedAt: ts,
        slotId: 0,
      })
      addHsmKey({
        handle: respKeys.pubHandle,
        family: 'rsa',
        role: 'public',
        label: 'RSA-3072 Public Key',
        variant: 'RSA-3072',
        engine: 'rust',
        generatedAt: ts,
        slotId: 1,
      })
      addHsmKey({
        handle: respKeys.privHandle,
        family: 'rsa',
        role: 'private',
        label: 'RSA-3072 Private Key',
        variant: 'RSA-3072',
        engine: 'rust',
        generatedAt: ts,
        slotId: 1,
      })

      strongSwanEngine.dispatchLog({
        level: 'info',
        text: `[CERT] RSA-3072 key pairs provisioned to softhsmv3 — initSlot=${realInitSlot} respSlot=${realRespSlot}`,
      })

      // ── 3. Build self-signed X.509 certs — private keys never leave softhsmv3 ─────
      const initCert = buildHsmSelfSignedCert(
        M,
        hSessInit,
        initKeys.pubHandle,
        initKeys.privHandle,
        'vpn-initiator',
        'PQC-Simulation'
      )
      const respCert = buildHsmSelfSignedCert(
        M,
        hSessResp,
        respKeys.pubHandle,
        respKeys.privHandle,
        'vpn-responder',
        'PQC-Simulation'
      )

      setCertData({ initCert, respCert })
      strongSwanEngine.dispatchLog({
        level: 'info',
        text: '[CERT] RSA-3072 certs signed by softhsmv3 — CN=vpn-initiator, CN=vpn-responder. Private keys remain in HSM. Click Start Daemon to begin.',
      })
    } catch (err: unknown) {
      setSabError(err instanceof Error ? err.message : String(err))
    } finally {
      setCertGenLoading(false)
    }
  }, [moduleRef, hSessionRef, serverSessionRef, vpnRpcInitRef, vpnSlotsRef, addHsmKey])

  const inspectCert = useCallback(
    async (role: 'initiator' | 'responder') => {
      if (!certData) return
      const pem = role === 'initiator' ? certData.initCert : certData.respCert
      try {
        const res = await openSSLService.execute('openssl x509 -noout -text -in cert.pem', [
          { name: 'cert.pem', data: new TextEncoder().encode(pem) },
        ])
        setCertInspectorText(res.stdout || 'No output from openssl x509')
      } catch (err: unknown) {
        setCertInspectorText(err instanceof Error ? err.message : String(err))
      }
      setShowCertInspector(true)
    },
    [certData]
  )

  const handleModeChange = useCallback(
    (mode: IKEv2Mode) => {
      // Destroy running daemon — config changes require restart
      strongSwanEngine.destroy()
      setSsLogs([])
      setSelectedMode(mode)
      setCurrentStep(0)
      setCharonFailed(false)
      // Reset VPN slot state so the next Start Daemon initializes fresh slots for the new mode.
      // Without this, stale vpnSlotsRef from a previous dual-auth run (e.g., {init:2,resp:3})
      // would be used for pure-PQC mode, causing wrong session mapping.
      vpnRpcInitRef.current = false
      vpnSlotsRef.current = { init: 0, resp: 1 }
      setCertData(null)
      setKemSecrets({})
    },
    [vpnRpcInitRef, vpnSlotsRef]
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ui" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ui">UI Controls</TabsTrigger>
          <TabsTrigger value="raw">Raw Config</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="animate-fade-in mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border p-4 rounded-xl">
            <div className="space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Key Exchange Mode
              </div>
              <div className="flex flex-wrap gap-2">
                {IKE_V2_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      selectedMode === mode.id
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              {modeConfig && (
                <p className="text-[11px] text-muted-foreground">{modeConfig.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Network Constraints
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="mtuSlider">Maximum Transmission Unit (MTU)</label>
                  <span className="font-bold font-mono">{mtu} Bytes</span>
                </div>
                <input
                  type="range"
                  id="mtuSlider"
                  min="500"
                  max="4000"
                  step="100"
                  value={mtu}
                  onChange={(e) => setMtu(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fragToggle"
                  checked={allowFragmentation}
                  onChange={(e) => setAllowFragmentation(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <label htmlFor="fragToggle" className="text-sm font-medium">
                  Enable IKE Message Fragmentation (RFC 7383)
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                PQC key exchange payloads are 10–16× larger than classical DH (ML-KEM-768
                encapsulation key: 1,184 B vs. ECP-256: 64 B), often exceeding UDP MTU. RFC 7383
                splits oversized IKE messages into fragments reassembled before processing.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="animate-fade-in mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>strongswan.conf (Initiator)</span>
              </div>
              <textarea
                value={activeInitConfig}
                onChange={(e) => setActiveInitConfig(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
                <span>strongswan.conf (Responder)</span>
              </div>
              <textarea
                value={activeRespConfig}
                onChange={(e) => setActiveRespConfig(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>ipsec.conf (Initiator)</span>
              </div>
              <textarea
                value={activeInitIpsec}
                onChange={(e) => setActiveInitIpsec(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
                <span>ipsec.conf (Responder)</span>
              </div>
              <textarea
                value={activeRespIpsec}
                onChange={(e) => setActiveRespIpsec(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
              {selectedMode !== 'classical' && (
                <p className="text-[10px] text-muted-foreground/70 italic mt-1">
                  ML-KEM proposal strings (e.g. <code>aes256-mlkem768-sha384!</code>) are
                  simulation-only — real StrongSwan requires the ipsecme-ikev2-mlkem patch and
                  IANA-assigned transform IDs.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {hasCrashed && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center justify-between text-destructive animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} />
            <div>
              <h4 className="font-bold">MTU Exceeded - Packet Dropped</h4>
              <p className="text-xs opacity-80">
                The current payload size exceeds the MTU of {mtu} bytes, and fragmentation is
                disabled. The VPN tunnel has failed to initialize.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-destructive/20 rounded hover:bg-destructive/30 text-sm font-bold transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {sabError && (
        <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center justify-between text-status-error animate-in fade-in slide-in-from-top-4 my-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} />
            <div>
              <h4 className="font-bold">Execution Environment Unsupported</h4>
              <p className="text-xs opacity-80 max-w-[600px] mt-1 line-clamp-2">{sabError}</p>
            </div>
          </div>
          <button
            onClick={() => setSabError(null)}
            className="px-3 py-1.5 bg-status-error/20 rounded hover:bg-status-error/30 text-sm font-bold transition-colors shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <GlossaryAutoWrap>
        <div
          className={`overflow-x-auto relative ${hasCrashed ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start min-w-[480px]">
            <div>
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="text-sm font-bold text-primary">Initiator (Client)</span>
                </div>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) =>
                  step.direction === 'right' ? (
                    <div
                      key={step.label}
                      className={`transition-all duration-300 ${
                        idx <= currentStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                        {step.label}
                        {idx === currentStep &&
                          allowFragmentation &&
                          step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                            <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[9px] rounded uppercase font-bold border border-warning/30">
                              Fragmented
                            </span>
                          )}
                      </div>
                      <div className="space-y-1.5 relative">
                        {step.message.payloads.map((payload, pIdx) => (
                          <PayloadCard
                            key={`${step.label}-${pIdx}`}
                            payload={payload}
                            index={pIdx}
                            highlighted={idx === currentStep}
                            isFragmented={hasCrashed && idx === currentStep}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={step.label} className="h-4" />
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-14 border-x border-border/30 px-4">
              {steps.map((step, idx) => (
                <div
                  key={step.label}
                  className={`flex flex-col items-center justify-center transition-all duration-300 ${
                    idx <= currentStep ? 'opacity-100' : 'opacity-20'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  {step.direction === 'right' ? (
                    <ArrowRight size={20} className="text-primary mb-1" />
                  ) : (
                    <ArrowLeft size={20} className="text-secondary mb-1" />
                  )}

                  {idx === currentStep &&
                    allowFragmentation &&
                    step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                      <div className="flex gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-warning rounded-full"></span>
                        <span className="w-1.5 h-1.5 bg-warning rounded-full delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-warning rounded-full delay-150"></span>
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div>
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30">
                  <span className="text-sm font-bold text-secondary">Responder (Gateway)</span>
                </div>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) =>
                  step.direction === 'left' ? (
                    <div
                      key={step.label}
                      className={`transition-all duration-300 ${
                        idx <= currentStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                        {step.label}
                        {idx === currentStep &&
                          allowFragmentation &&
                          step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                            <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[9px] rounded uppercase font-bold border border-warning/30">
                              Assembled
                            </span>
                          )}
                      </div>
                      <div className="space-y-1.5">
                        {step.message.payloads.map((payload, pIdx) => (
                          <PayloadCard
                            key={`${step.label}-${pIdx}`}
                            payload={payload}
                            index={pIdx}
                            highlighted={idx === currentStep}
                            isFragmented={hasCrashed && idx === currentStep}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={step.label} className="h-4" />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </GlossaryAutoWrap>

      <div className="flex items-center justify-between mt-4 bg-muted/30 p-2 rounded-lg border border-border">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0 || hasCrashed}
          className="px-4 py-2 rounded border border-border hover:bg-muted disabled:opacity-50 text-sm transition-colors"
        >
          &larr; Previous Phase
        </button>
        <div className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border border-border flex items-center gap-2">
          <span>
            Sequence {currentStep + 1} of {steps.length}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] uppercase ${ssState === 'RUNNING' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
          >
            Daemon: {ssState}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="p-2 border border-border rounded hover:bg-muted"
            title="Restart Simulation"
          >
            <RotateCcw size={16} />
          </button>
          {currentStep === 0 && ssState === 'UNINITIALIZED' && (
            <div className="flex gap-2 items-center">
              <label
                htmlFor="vpn-psk"
                className="text-[10px] text-muted-foreground whitespace-nowrap"
              >
                PSK:
              </label>
              <input
                id="vpn-psk"
                type="text"
                value={clientPsk}
                onChange={(e) => {
                  setClientPsk(e.target.value)
                  setServerPsk(e.target.value)
                }}
                className="w-40 text-[11px] px-1.5 py-0.5 rounded border border-border bg-background font-mono"
                placeholder="Pre-shared key"
              />
              {pskMismatch && <span className="text-[10px] text-status-warning">mismatch</span>}
            </div>
          )}
          {currentStep === 0 && ssState === 'UNINITIALIZED' && (
            <label
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer select-none"
              title="HSM RPC: bridges the charon WASM daemon to the softhsmv3 WASM module running on the main thread via SharedArrayBuffer. When enabled, all PKCS#11 calls (key generation, KEM encap/decap, signing) are dispatched from the daemon worker to the main-thread HSM and logged in the Diagnostic Boundary below. Requires SharedArrayBuffer (Cross-Origin Isolation). Disable to run charon with its built-in software crypto instead."
            >
              <input
                type="checkbox"
                checked={rpcMode}
                onChange={(e) => setRpcMode(e.target.checked)}
                className="accent-primary"
              />
              HSM RPC
            </label>
          )}
          {currentStep === 0 && ssState === 'UNINITIALIZED' ? (
            <div className="flex items-center gap-2 flex-wrap">
              {authMode === 'dual' && (
                <>
                  <button
                    onClick={generateCerts}
                    disabled={certGenLoading}
                    className="px-4 py-2 bg-secondary text-secondary-foreground font-bold rounded shadow-sm hover:bg-secondary/90 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {certGenLoading
                      ? 'Generating…'
                      : certData
                        ? 'Regenerate Certs'
                        : 'Generate Certs'}
                  </button>
                  {certData && (
                    <>
                      <button
                        onClick={() => inspectCert('initiator')}
                        className="px-3 py-2 border border-border rounded text-xs font-medium hover:bg-muted transition-colors"
                        title="Inspect initiator certificate"
                      >
                        Inspect Initiator
                      </button>
                      <button
                        onClick={() => inspectCert('responder')}
                        className="px-3 py-2 border border-border rounded text-xs font-medium hover:bg-muted transition-colors"
                        title="Inspect responder certificate"
                      >
                        Inspect Responder
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                onClick={async () => {
                  if (authMode === 'dual' && !certData) return
                  if (typeof SharedArrayBuffer === 'undefined') {
                    setSabError(
                      'SharedArrayBuffer is disabled in this environment. The full WASM PQC Proxy requires strict Cross-Origin Isolation (or a Chromium-based browser) to marshal memory contexts. Please check your browser or iframe security settings.'
                    )
                    return
                  }

                  try {
                    // RSA-3072 is the only auth key type supported by strongSwan charon
                    // in this WASM build. ML-DSA auth requires an IANA IKEv2 AUTH method
                    // that does not exist yet — wired when upstream support lands.
                    // The handshake always completes via PSK (WASM_PSK env var).
                    strongSwanEngine.setKeySpec(1, 3072, 3072)

                    // In RPC mode, ensure the main-thread softhsmv3 is initialized and
                    // both VPN tokens (initiator + responder) are ready in their own slots.
                    // NOTE: moduleRef.current may already be set by another HSM panel —
                    // we guard with vpnRpcInitRef, not moduleRef.
                    if (rpcMode) {
                      const rawM = moduleRef.current ?? (await getSoftHSMRustModule())
                      rawM._C_Initialize(0) // idempotent — CKR_CRYPTOKI_ALREADY_INITIALIZED is OK

                      if (!vpnRpcInitRef.current) {
                        // ── Slot discovery facts ───────────────────────────────────────────────
                        // softhsmv3 WASM uses sequential integer slot IDs (0, 1, 2, ...).
                        // isTokenPresent() always returns true, so C_GetSlotList(1) and (0)
                        // return the same slots. Uninitialized tokens appear at the BACK of
                        // the list. A direct list query (skip NULL/count query first) has no
                        // side effects — the count query is what adds new empty slots.
                        // After C_InitToken(slotId), the slot ID is UNCHANGED.

                        // Direct list query: pass a large buffer, skip the NULL/count call.
                        // This reads the current slot list without triggering new-slot insertion.
                        const getRawSlots = (M: typeof rawM) => {
                          const MAX = 32
                          const listPtr = M._malloc(MAX * 4)
                          const cntPtr = M._malloc(4)
                          M.setValue(cntPtr, MAX, 'i32')
                          const rv = M._C_GetSlotList(0, listPtr, cntPtr) >>> 0
                          const cnt = rv === 0 ? M.getValue(cntPtr, 'i32') >>> 0 : 0
                          const ids: number[] = []
                          for (let i = 0; i < cnt; i++)
                            ids.push(M.getValue(listPtr + i * 4, 'i32') >>> 0)
                          M._free(listPtr)
                          M._free(cntPtr)
                          return ids
                        }

                        // NULL/count query: triggers softhsmv3 to add a new empty slot if
                        // all current tokens are initialized (so there's always one free slot).
                        const ensureEmptySlot = (M: typeof rawM) => {
                          const cntPtr = M._malloc(4)
                          M._C_GetSlotList(0, 0, cntPtr)
                          M._free(cntPtr)
                        }

                        // Guarantee at least one free (uninitialized) slot exists.
                        ensureEmptySlot(rawM)

                        // The LAST slot in the direct-query list is always uninitialized.
                        const slots0 = getRawSlots(rawM)
                        const uninitSlot0 = slots0[slots0.length - 1]
                        hsm_initToken(rawM, uninitSlot0, '1234', 'PQC VPN Initiator')
                        // C_InitToken leaves the slot ID unchanged → uninitSlot0 IS the init slot.
                        const realInitSlot = uninitSlot0

                        const hSessInit = hsm_openUserSession(
                          rawM,
                          realInitSlot,
                          '1234',
                          'user1234'
                        )

                        // hsm_initToken internally calls C_GetSlotList(NULL) which may have already
                        // added a new empty slot; ensureEmptySlot is idempotent when one exists.
                        ensureEmptySlot(rawM)
                        const slots1 = getRawSlots(rawM)
                        const uninitSlot1 = slots1[slots1.length - 1]
                        hsm_initToken(rawM, uninitSlot1, '1234', 'PQC VPN Responder')
                        const realRespSlot = uninitSlot1

                        const hSessResp = hsm_openUserSession(
                          rawM,
                          realRespSlot,
                          '1234',
                          'user1234'
                        )

                        vpnSlotsRef.current = { init: realInitSlot, resp: realRespSlot }
                        hSessionRef.current = hSessInit
                        serverSessionRef.current = hSessResp
                        vpnRpcInitRef.current = true

                        strongSwanEngine.dispatchLog({
                          level: 'info',
                          text: `[RPC] softhsmv3 ready — initSlot=${realInitSlot} respSlot=${realRespSlot}`,
                        })
                      } else {
                        // Slots already initialized by generateCerts (pre-provisioning flow).
                        // Key pairs are already in the HSM and Key Inspector — do not regenerate.
                        strongSwanEngine.dispatchLog({
                          level: 'info',
                          text: `[RPC] reusing pre-provisioned VPN slots — initSlot=${vpnSlotsRef.current.init} respSlot=${vpnSlotsRef.current.resp}`,
                        })
                      }

                      if (!moduleRef.current) moduleRef.current = rawM
                    }

                    const proposalMode =
                      selectedMode === 'pure-pqc' ? 1 : selectedMode === 'hybrid' ? 2 : 0

                    if (authMode === 'dual' && certData) {
                      // Use pre-provisioned certs generated before daemon start (C8 flow).
                      // ipsec.secrets: PSK only — charon's pkcs11 plugin discovers the private
                      // key via PKCS#11 RPC (C_FindObjects matching the cert's public key modulus).
                      // No RSA key file needed in ipsec.secrets when leftauth2=pubkey via pkcs11.
                      const initSecrets = `: PSK "${clientPsk}"\n`
                      const respSecrets = `: PSK "${serverPsk}"\n`
                      strongSwanEngine.dispatchLog({
                        level: 'info',
                        text: '[CERT] Loading pre-provisioned RSA-3072 certificates into daemon filesystem. Private keys accessed via PKCS#11 RPC.',
                      })
                      strongSwanEngine.init(
                        {
                          'strongswan.conf': activeInitConfig,
                          'ipsec.conf': activeInitIpsec,
                          'ipsec.secrets': initSecrets,
                          '/etc/ipsec.d/certs/initiator.crt': certData.initCert,
                          '/etc/ipsec.d/certs/responder.crt': certData.respCert,
                        },
                        {
                          'strongswan.conf': activeRespConfig,
                          'ipsec.conf': activeRespIpsec,
                          'ipsec.secrets': respSecrets,
                          '/etc/ipsec.d/certs/responder.crt': certData.respCert,
                          '/etc/ipsec.d/certs/initiator.crt': certData.initCert,
                        },
                        { initPsk: clientPsk, respPsk: serverPsk },
                        rpcMode,
                        proposalMode
                      )
                    } else {
                      strongSwanEngine.init(
                        { 'strongswan.conf': activeInitConfig, 'ipsec.conf': activeInitIpsec },
                        { 'strongswan.conf': activeRespConfig, 'ipsec.conf': activeRespIpsec },
                        { initPsk: clientPsk, respPsk: serverPsk },
                        rpcMode,
                        proposalMode
                      )
                    }
                    setCurrentStep(1)
                  } catch (err: unknown) {
                    setSabError(err instanceof Error ? err.message : String(err))
                  }
                }}
                disabled={authMode === 'dual' && !certData}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded shadow-sm hover:bg-primary/90 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={authMode === 'dual' && !certData ? 'Generate certificates first' : undefined}
              >
                Start Daemon
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={true}
              className="px-4 py-2 bg-primary/50 text-white font-bold rounded shadow-sm opacity-50 cursor-not-allowed text-sm transition-colors"
              title="UI automatically advances based on daemon log output"
            >
              {hasCrashed
                ? 'Tunnel Failed'
                : currentStep === steps.length - 1
                  ? 'Tunnel Established'
                  : 'Awaiting Negotiation...'}
            </button>
          )}
        </div>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden bg-muted/30 pb-2">
        <div className="bg-muted px-4 py-1.5 text-xs font-mono font-bold border-b border-border text-muted-foreground flex justify-between items-center">
          <span>charon.log</span>
          <div className="flex items-center gap-2">
            <span>WASM IKEv2 KEM Daemon</span>
            <button
              className="px-2 py-0.5 rounded text-[10px] bg-background/50 hover:bg-background border border-border/50 transition-colors"
              onClick={() => {
                const text = ssLogs.map((l) => `[${l.level}] ${l.text}`).join('\n')
                navigator.clipboard.writeText(text)
              }}
              title="Copy logs to clipboard"
            >
              Copy
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="p-3 h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed"
        >
          {ssLogs.length === 0 ? (
            <div className="text-muted-foreground/50 italic">Awaiting daemon initialization...</div>
          ) : (
            ssLogs.map((log, i) => {
              const phase = getIkePhase(log.text, selectedMode)
              return (
                <div
                  key={i}
                  className={log.level === 'error' ? 'text-destructive' : 'text-success/80'}
                >
                  <span className="opacity-50 mr-2">
                    [{new Date().toISOString().split('T')[1]?.split('.')[0]}]
                  </span>
                  {phase && (
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded mr-1.5 font-bold ${IKE_PHASE_CLASS[phase]}`}
                    >
                      {phase}
                    </span>
                  )}
                  {log.text}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Cpu size={16} /> Tunnel Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className={`p-3 rounded-xl border flex flex-col justify-center items-center ${currentStep === steps.length - 1 && !hasCrashed ? 'bg-success/10 border-success/30' : 'bg-card border-border'}`}
          >
            <span
              className={`text-2xl font-bold ${currentStep === steps.length - 1 && !hasCrashed ? 'text-success' : ''}`}
            >
              {hasCrashed ? (
                '--'
              ) : currentStep === steps.length - 1 ? (
                <CheckCircle className="inline-block text-success" />
              ) : (
                '...'
              )}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Status
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">{exchange.totalBytes.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Total Bytes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">
              {exchange.totalInitiatorBytes.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Initiator Bytes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">{exchange.roundTrips}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Round Trips
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-sm font-bold font-mono">
              {selectedMode === 'classical' ? 'N/A' : 'Level 3'}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              NIST Sec. Level
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-start overflow-hidden">
            <span className="text-[11px] font-bold font-mono truncate w-full">
              {modeConfig?.dhGroup ?? '—'}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              KE Algorithm
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-start overflow-hidden">
            <span className="text-[11px] font-bold font-mono truncate w-full">
              {selectedMode === 'pure-pqc' ? 'ML-DSA-65 (pending)' : 'RSA-3072'}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Auth Algorithm
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border flex flex-col justify-center items-center ${selectedMode === 'classical' ? 'bg-status-warning/10 border-status-warning/30' : 'bg-status-success/10 border-status-success/30'}`}
          >
            <span
              className={`text-sm font-bold ${selectedMode === 'classical' ? 'text-status-warning' : 'text-status-success'}`}
            >
              {selectedMode === 'classical' ? 'No' : 'KEX ✓'}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Quantum-Safe
            </span>
          </div>
        </div>
      </div>

      {(kemSecrets.responder || kemSecrets.initiator) && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
            <ShieldAlert size={16} /> ML-KEM Shared Secret Verification
          </h4>
          {(() => {
            const rHex = kemSecrets.responder?.hex ?? ''
            const iHex = kemSecrets.initiator?.hex ?? ''
            const rKcv = kemSecrets.responder?.kcv ?? ''
            const iKcv = kemSecrets.initiator?.kcv ?? ''
            const bothReady = rHex.length > 0 && iHex.length > 0
            const hexMatch = bothReady && rHex === iHex
            return (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['responder', 'initiator'] as const).map((side) => {
                    const hex = side === 'responder' ? rHex : iHex
                    const kcv = side === 'responder' ? rKcv : iKcv
                    return (
                      <div
                        key={side}
                        className="rounded-xl border border-border bg-card p-3 space-y-1"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {side === 'responder' ? 'Server (Encapsulated)' : 'Client (Decapsulated)'}
                        </div>
                        {hex ? (
                          <>
                            <div className="font-mono text-[10px] break-all leading-relaxed text-foreground bg-muted/40 rounded p-2">
                              {hex}
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-muted-foreground font-bold">FP:</span>
                              <span className="font-mono font-bold text-primary">
                                0x{kcv || '—'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-muted-foreground italic">
                            Awaiting KEM…
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {bothReady && (
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold border ${
                      hexMatch
                        ? 'bg-status-success/10 border-status-success/30 text-status-success'
                        : 'bg-status-error/10 border-status-error/30 text-status-error'
                    }`}
                  >
                    {hexMatch ? (
                      <>
                        <CheckCircle size={14} />
                        Shared secrets match — FP: 0x{rKcv} ✓ SKEYSEED derivation is consistent
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={14} />
                        MISMATCH — FP server: 0x{rKcv} / client: 0x{iKcv}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {(kemSecrets.responder || kemSecrets.initiator) && selectedMode !== 'classical' && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
            <KeyRound size={16} /> SKEYSEED Key Derivation
          </h4>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <pre className="text-[11px] font-mono bg-muted/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {selectedMode === 'pure-pqc'
                ? `SKEYSEED = prf(Ni ‖ Nr, ss_kem)\n         = PRF-HMAC-SHA-256(Ni ‖ Nr,\n             0x${kemSecrets.responder?.hex ?? '…'})`
                : `SKEYSEED = prf(Ni ‖ Nr, ss_ecdh ‖ ss_kem)\n                         ↑ ECDH      ↑ ML-KEM-768\n             0x<ecdh-secret> ‖ 0x${kemSecrets.responder?.hex ?? '…'}`}
            </pre>
            <div className="text-[11px] text-muted-foreground space-y-1">
              {selectedMode === 'pure-pqc' ? (
                <>
                  <p>
                    All session key material (SK_e, SK_a, SK_d) is derived exclusively from the
                    ML-KEM shared secret — fully quantum-safe from the first exchange.
                  </p>
                  <p className="text-muted-foreground/70">
                    Spec: draft-ietf-ipsecme-ikev2-mlkem §5 · RFC 7296 §2.14
                  </p>
                </>
              ) : (
                <>
                  <p>
                    The combined PRF input forces an attacker to break{' '}
                    <span className="font-semibold text-foreground">both</span> the classical ECDH
                    and ML-KEM-768 shared secrets to recover SKEYSEED. Either alone is insufficient.
                  </p>
                  <p className="text-muted-foreground/70">
                    Spec: draft-ietf-ipsecme-ikev2-mlkem §5 · RFC 9370 §2.1 · RFC 7296 §2.14
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pt-6 mt-6 border-t border-border">
        <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Cpu size={16} /> PKCS#11 Cryptographic Diagnostic Boundary
            </h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {rpcMode && ssState !== 'UNINITIALIZED' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                  Full WASM Proxy Active
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40"></span>
                  HSM: Awaiting Start
                </>
              )}
            </div>
          </div>

          <div className="p-4">
            {ssState === 'UNINITIALIZED' && (
              <div className="mb-4 p-3 border border-border rounded-lg bg-muted/30 space-y-2">
                <div className="text-xs font-semibold">Authentication Mode</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuthMode('psk')}
                    className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${authMode === 'psk' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    PSK Only
                  </button>
                  <button
                    onClick={() => setAuthMode('dual')}
                    className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${authMode === 'dual' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    PSK + Certificate (RFC 4739)
                  </button>
                </div>
                {authMode === 'dual' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-start gap-2 p-2 rounded border border-status-warning/40 bg-status-warning/10 text-[10px] text-foreground">
                      <ShieldAlert size={12} className="text-status-warning mt-0.5 shrink-0" />
                      <span>
                        <span className="font-semibold text-status-warning">
                          Auth is NOT quantum-safe.
                        </span>{' '}
                        Certificate auth uses RSA-3072 — a classical algorithm. ML-DSA
                        authentication for IKEv2 requires an IANA AUTH method not yet assigned
                        (draft-ietf-ipsecme-ikev2-mldsa). Generate and inspect certs below before
                        starting the daemon.
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Dual auth per RFC 4739 — PSK + certificate. In production, use CA-signed
                      certificates from a trusted PKI.
                    </p>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={showQkdNote}
                    onChange={(e) => setShowQkdNote(e.target.checked)}
                    className="w-3 h-3 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    PSK distribution via QKD / quantum-safe methods
                    <span className="ml-1 text-[10px] opacity-60">
                      (informational — not simulated)
                    </span>
                  </span>
                </label>
                {showQkdNote && (
                  <div className="text-[10px] text-muted-foreground space-y-1 p-2 bg-muted/20 rounded border border-border">
                    <p className="font-semibold text-foreground">Quantum-Safe PSK Distribution</p>
                    <p>
                      <span className="font-medium">QKD (Quantum Key Distribution)</span> — uses
                      quantum optics (BB84, E91) to distribute symmetric key material over a
                      dedicated optical channel. Eavesdropping disturbs the quantum state and is
                      detectable. Requires dedicated QKD hardware and fibre links between peers; not
                      suitable for internet-scale deployment.
                    </p>
                    <p>
                      <span className="font-medium">QRNG-seeded PSK</span> — a Quantum Random Number
                      Generator (e.g. ID Quantique, QuintessenceLabs) produces entropy from a
                      physical quantum source. The resulting key material is distributed out-of-band
                      (courier, secure channel) and is computationally indistinguishable from QKD
                      output to an adversary without the channel.
                    </p>
                    <p>
                      <span className="font-medium">PQC-wrapped PSK (hybrid)</span> — the PSK is
                      encapsulated under a post-quantum KEM (e.g. ML-KEM-768, BIKE, HQC) over a
                      standard IP network. Combines quantum-resistant confidentiality with scalable
                      deployment. Governed by ETSI GS QKD 014 and NIST SP 800-232.
                    </p>
                    <p className="text-muted-foreground/70">
                      NIST SP 800-232 and ETSI GS QKD 014 cover these distribution models. In this
                      simulation the PSK is entered manually — in production, inject it from your
                      QKD appliance or PQC-wrapped key transport.
                    </p>
                  </div>
                )}
              </div>
            )}
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="mb-4 grid grid-cols-2 w-[400px]">
                <TabsTrigger
                  value="client"
                  className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <ShieldAlert size={16} /> Client Token (Slot 1)
                </TabsTrigger>
                <TabsTrigger
                  value="server"
                  className="gap-2 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary"
                >
                  <ShieldAlert size={16} /> Server Token (Slot 2)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="space-y-4">
                {ssState === 'UNINITIALIZED' && (
                  <div className="mb-4 p-3 border border-border rounded-lg bg-muted/30 space-y-3">
                    <div>
                      <div className="text-xs font-semibold mb-1">Client PSK</div>
                      <input
                        type="text"
                        value={clientPsk}
                        onChange={(e) => setClientPsk(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded border border-border bg-background font-mono"
                        placeholder="Pre-shared key"
                      />
                      {pskMismatch && (
                        <p className="text-[10px] text-status-warning mt-1">
                          PSK does not match server — IKE AUTH will fail
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        PSK can be distributed via QKD for quantum-safe key establishment.
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2">Authentication Key Type</div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-xs px-2 py-1 rounded border border-primary/40 bg-primary/10 text-primary font-medium">
                          RSA-3072 (active)
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded border border-border bg-muted/50 text-muted-foreground opacity-60 cursor-not-allowed"
                          title="ML-DSA IKEv2 authentication requires an IANA AUTH method not yet assigned"
                        >
                          ML-DSA — coming soon
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4 p-4 border border-border bg-muted/30 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  <div className="text-xs font-mono mb-2 flex items-center justify-between text-foreground">
                    <span className="font-semibold">Client Identity Parameter Mapping</span>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded">
                      {authMode === 'psk' ? 'leftauth=psk' : 'leftauth=psk + leftauth2=pubkey'}
                    </span>
                  </div>
                  <pre className="text-xs text-slate-800 font-mono">
                    {activeInitIpsec
                      .split('\n')
                      .filter((l: string) => l.includes('left'))
                      .map((l: string) => l.trim())
                      .join('\n')}
                  </pre>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <HsmKeyInspector
                      keys={hsmKeys.filter((k) => k.slotId === 0 || k.slotId === undefined)}
                      moduleRef={moduleRef}
                      hSessionRef={hSessionRef}
                      onRemoveKey={removeHsmKey}
                      onClear={clearHsmKeys}
                      title="Client Token (Slot 1)"
                    />
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/30 text-foreground">
                    <PkcsLogPanel filterFn={(e) => e.args.includes('[initiator]')} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="server" className="space-y-4">
                {ssState === 'UNINITIALIZED' && (
                  <div className="mb-4 p-3 border border-border rounded-lg bg-muted/30 space-y-3">
                    <div>
                      <div className="text-xs font-semibold mb-1">Server PSK</div>
                      <input
                        type="text"
                        value={serverPsk}
                        onChange={(e) => setServerPsk(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded border border-border bg-background font-mono"
                        placeholder="Pre-shared key"
                      />
                      {pskMismatch && (
                        <p className="text-[10px] text-status-warning mt-1">
                          PSK does not match client — IKE AUTH will fail
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        PSK can be distributed via QKD for quantum-safe key establishment.
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2">Authentication Key Type</div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-xs px-2 py-1 rounded border border-secondary/40 bg-secondary/10 text-secondary font-medium">
                          RSA-3072 (active)
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded border border-border bg-muted/50 text-muted-foreground opacity-60 cursor-not-allowed"
                          title="ML-DSA IKEv2 authentication requires an IANA AUTH method not yet assigned"
                        >
                          ML-DSA — coming soon
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4 p-4 border border-border bg-muted/30 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                  <div className="text-xs font-mono mb-2 flex items-center justify-between text-foreground">
                    <span className="font-semibold">Server Identity Parameter Mapping</span>
                    <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                      {authMode === 'psk' ? 'rightauth=psk' : 'rightauth=psk + rightauth2=pubkey'}
                    </span>
                  </div>
                  <pre className="text-xs text-foreground font-mono">
                    {activeInitIpsec
                      .split('\n')
                      .filter((l: string) => l.includes('right'))
                      .map((l: string) => l.trim())
                      .join('\n')}
                  </pre>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <HsmKeyInspector
                      keys={hsmKeys.filter((k) => k.slotId === 1)}
                      moduleRef={moduleRef}
                      hSessionRef={serverSessionRef}
                      onRemoveKey={removeHsmKey}
                      onClear={clearHsmKeys}
                      title="Server Token (Slot 2)"
                    />
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/30 text-foreground">
                    <PkcsLogPanel filterFn={(e) => e.args.includes('[responder]')} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Certificate Inspection Modal */}
      {showCertInspector && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setShowCertInspector(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowCertInspector(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Certificate Inspector"
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden mx-4"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ShieldAlert size={16} className="text-status-warning" />
                Certificate Inspector — RSA-3072 (classical, not quantum-safe)
              </h3>
              <button
                onClick={() => setShowCertInspector(false)}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {certInspectorText ? (
                <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
                  {certInspectorText}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm">Loading certificate details…</p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end">
              <button
                onClick={() => setShowCertInspector(false)}
                className="px-3 py-1.5 bg-muted rounded text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
