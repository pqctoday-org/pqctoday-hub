// SPDX-License-Identifier: GPL-3.0-only
/**
 * Step 3 — Constrained handshakes: DTLS 1.3 vs EDHOC, plus a BLE Mesh /
 * Matter provisioning view. Every number is a model estimate built from exact
 * key/signature sizes and the message structure of RFC 9147, RFC 9528 and the
 * Mesh Protocol PB-ADV segmentation; the UI says so.
 */
import React, { useMemo, useState } from 'react'
import { AlertTriangle, Radio, Network } from 'lucide-react'
import {
  HANDSHAKE_KEMS,
  HANDSHAKE_SIGS,
  IEEE802154_PAYLOAD,
  PBADV_CONT_SEGMENT,
  PBADV_FIRST_SEGMENT,
  PBADV_MAX_SEGMENTS,
  PBADV_MAX_TRANSACTION,
  dtlsHandshake,
  edhocHandshake,
  pbAdvSegments,
  sigSizesOf,
  chainSizes,
  type HandshakeResult,
} from '../utils/sizing'
import { Button } from '@/components/ui/button'

export interface HandshakeConfig {
  view?: 'handshake' | 'provisioning'
  kemId?: string
  sigId?: string
}

const fmt = (n: number) => n.toLocaleString('en-US')

export const ConstrainedHandshakeVisualizer: React.FC<{ initial?: HandshakeConfig }> = ({
  initial,
}) => {
  const [view, setView] = useState<'handshake' | 'provisioning'>(initial?.view ?? 'handshake')
  const [kemId, setKemId] = useState(initial?.kemId ?? 'x25519')
  const [sigId, setSigId] = useState(initial?.sigId ?? 'ecdsa-p256')
  const [credByValue, setCredByValue] = useState(false)

  const dtls = useMemo(() => dtlsHandshake(kemId, sigId), [kemId, sigId])
  const edhoc = useMemo(
    () => edhocHandshake(kemId, sigId, credByValue),
    [kemId, sigId, credByValue]
  )
  const dtlsBase = useMemo(() => dtlsHandshake('x25519', 'ecdsa-p256'), [])

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={view === 'handshake' ? 'default' : 'outline'}
          onClick={() => setView('handshake')}
          className="text-xs"
        >
          <Network size={14} className="mr-1" /> DTLS 1.3 vs EDHOC
        </Button>
        <Button
          variant={view === 'provisioning' ? 'default' : 'outline'}
          onClick={() => setView('provisioning')}
          className="text-xs"
        >
          <Radio size={14} className="mr-1" /> BLE Mesh &amp; Matter provisioning
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Picker
          title="Key establishment"
          options={Object.entries(HANDSHAKE_KEMS).map(([id, k]) => ({ id, name: k.name }))}
          value={kemId}
          onChange={setKemId}
        />
        <Picker
          title="Authentication (signature)"
          options={Object.entries(HANDSHAKE_SIGS).map(([id, s]) => ({ id, name: s.name }))}
          value={sigId}
          onChange={setSigId}
        />
      </div>

      {view === 'handshake' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FlowPanel
              title="DTLS 1.3 (RFC 9147), certificate chain"
              subtitle="Certificate message carries leaf + intermediate: 2 public keys + 2 signatures (root stays on the device)"
              result={dtls}
            />
            <FlowPanel
              title="EDHOC (RFC 9528) + OSCORE (RFC 8613)"
              subtitle={
                credByValue
                  ? 'Credential sent by value (one certificate each way)'
                  : 'Credentials by reference (kid) — no certificate crosses the air'
              }
              result={edhoc}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={credByValue}
              onChange={(e) => setCredByValue(e.target.checked)}
              className="accent-primary"
            />
            EDHOC: send credentials by value instead of by reference
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <Stat
              label="DTLS vs classical DTLS"
              value={`${(dtls.totalBytes / dtlsBase.totalBytes).toFixed(1)}×`}
              note={`${fmt(dtlsBase.totalBytes)} B baseline (X25519 + ECDSA P-256)`}
            />
            <Stat
              label="EDHOC vs DTLS (this choice)"
              value={`${((edhoc.totalBytes / dtls.totalBytes) * 100).toFixed(0)}%`}
              note="of the DTLS bytes"
            />
            <Stat
              label="802.15.4 frames, DTLS / EDHOC"
              value={`${fmt(dtls.radioFrames)} / ${fmt(edhoc.radioFrames)}`}
              note={`~${IEEE802154_PAYLOAD} B usable per 127 B frame with link security`}
            />
          </div>

          {dtls.radioFrames > 50 && (
            <div className="flex items-start gap-3 bg-warning/10 rounded-lg p-4 border border-warning/30 text-xs">
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                Over a 6LoWPAN mesh this DTLS handshake needs {fmt(dtls.radioFrames)} radio frames.
                Losing any one fragment of a datagram loses the whole datagram, and DTLS retransmits
                whole flights. EDHOC with credentials by reference avoids the chain entirely; with
                PQC keys it still has to move the KEM key, ciphertext and two signatures.
              </p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            Model estimate (±10–20%), not a packet capture. Datagrams use the IPv6 minimum MTU
            (1,280 B); radio frames assume 6LoWPAN header compression and ~{IEEE802154_PAYLOAD} B of
            payload per IEEE 802.15.4 frame (draft-ietf-iotops-7228bis, size class S1). PQ EDHOC
            follows draft-ietf-lake-pqsuites (KEM key in message_1, ciphertext in message_2).
          </p>
        </>
      ) : (
        <ProvisioningView kemId={kemId} sigId={sigId} />
      )}
    </div>
  )
}

function ProvisioningView({ kemId, sigId }: { kemId: string; sigId: string }) {
  const kem = HANDSHAKE_KEMS[kemId] ?? HANDSHAKE_KEMS['x25519']
  const isClassical = kemId === 'x25519'
  // Mesh provisioning exchanges P-256 public keys today (64 B + 1 B opcode)
  const keyPdu = (isClassical ? 64 : kem.sizes.publicKeyBytes) + 1
  const ctPdu = (isClassical ? 64 : kem.sizes.ciphertextBytes) + 1
  const keySeg = pbAdvSegments(keyPdu)
  const ctSeg = pbAdvSegments(ctPdu)
  const sig = sigSizesOf((HANDSHAKE_SIGS[sigId] ?? HANDSHAKE_SIGS['ecdsa-p256']).algId)
  const matterChain = chainSizes(sig, sig, sig) // DAC (leaf) + PAI (intermediate); PAA is the anchor
  const matterMessages = Math.ceil(matterChain.sent / 1232)

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-2">
          Bluetooth Mesh provisioning over PB-ADV
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Provisioning PDUs are split into Generic Provisioning segments: {PBADV_FIRST_SEGMENT} B in
          the Transaction Start, {PBADV_CONT_SEGMENT} B in each Continuation, at most{' '}
          {PBADV_MAX_SEGMENTS} segments ({fmt(PBADV_MAX_TRANSACTION)} B) per transaction.
          {isClassical
            ? ' Today both sides exchange a 64-byte P-256 public key (ECDH), authenticated out of band.'
            : ` No PQC provisioning algorithm is defined in Mesh Protocol 1.1 — this shows what carrying a ${kem.name} key would cost.`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <Stat
            label={`Provisioner → device: ${isClassical ? 'P-256 public key' : 'KEM public key'}`}
            value={`${keySeg.segments} segments`}
            note={`${fmt(keyPdu)} B PDU${keySeg.fits ? '' : ' — exceeds one PB-ADV transaction'}`}
            warn={!keySeg.fits}
          />
          <Stat
            label={`Device → provisioner: ${isClassical ? 'P-256 public key' : 'KEM ciphertext'}`}
            value={`${ctSeg.segments} segments`}
            note={`${fmt(ctPdu)} B PDU${ctSeg.fits ? '' : ' — exceeds one PB-ADV transaction'}`}
            warn={!ctSeg.fits}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Mesh Protocol 1.1 also adds certificate-based provisioning: the device&apos;s X.509
          certificate is read from provisioning records rather than trusted from an OOB value. With
          a PQC certificate those records grow by the key and signature sizes below. A practical PQC
          path today is out of band: bootstrap over NFC or a QR code, or over a GATT bearer with a
          larger MTU, then provision with keys that already fit. Model estimate.
        </p>
      </div>

      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-2">Matter commissioning</div>
        <p className="text-xs text-muted-foreground mb-3">
          A commissioner first runs PASE (SPAKE2+ over P-256 with the setup passcode), then checks
          device attestation: the Device Attestation Certificate (DAC) chains to a Product
          Attestation Intermediate (PAI) and a Product Attestation Authority (PAA) the commissioner
          already trusts. Operational sessions then use CASE (Sigma: ECDH + ECDSA P-256). All three
          are classical today; a PQC Matter needs new CASE suites and PQC attestation certificates.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <Stat
            label="DAC (leaf)"
            value={`${fmt(matterChain.leaf)} B`}
            note="subject key + PAI signature"
          />
          <Stat
            label="PAI (intermediate)"
            value={`${fmt(matterChain.intermediate)} B`}
            note="subject key + PAA signature"
          />
          <Stat
            label="Attestation chain sent"
            value={`${fmt(matterChain.sent)} B`}
            note={`≈ ${matterMessages} IPv6-MTU message${matterMessages === 1 ? '' : 's'}; the PAA is not sent`}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Certificate sizes use the module&apos;s X.509 model (≈300 B of structure + subject key +
          issuer signature). Model estimate.
        </p>
      </div>
    </div>
  )
}

function Picker({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: { id: string; name: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="glass-panel p-4">
      <div className="text-sm font-bold text-foreground mb-3">{title}</div>
      <div className="space-y-2">
        {options.map((o) => (
          <Button
            variant="ghost"
            size="tile"
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`w-full p-2 rounded-lg border text-left text-sm ${
              o.id === value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
            }`}
          >
            {o.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

function FlowPanel({
  title,
  subtitle,
  result,
}: {
  title: string
  subtitle: string
  result: HandshakeResult
}) {
  const max = Math.max(...result.messages.map((m) => m.bytes))
  return (
    <div className="glass-panel p-4">
      <div className="text-sm font-bold text-foreground">{title}</div>
      <div className="text-[10px] text-muted-foreground mb-3">{subtitle}</div>
      <div className="space-y-2">
        {result.messages.map((m, i) => (
          <div key={`${m.label}-${i}`}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-muted-foreground">
                {m.from === 'client' ? 'Device → server' : 'Server → device'} — {m.label}
              </span>
              <span className="font-mono text-foreground">{fmt(m.bytes)} B</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${m.bytes === max ? 'bg-primary/70' : 'bg-success/50'}`}
                style={{ width: `${Math.max((m.bytes / max) * 100, 3)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-border flex justify-between text-xs">
        <span className="font-bold text-foreground">Total</span>
        <span className="font-mono font-bold text-primary">
          {fmt(result.totalBytes)} B · {result.datagrams} datagram
          {result.datagrams === 1 ? '' : 's'} · {fmt(result.radioFrames)} frames
        </span>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  note,
  warn,
}: {
  label: string
  value: string
  note?: string
  warn?: boolean
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${warn ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/50'}`}
    >
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold font-mono text-foreground">{value}</div>
      {note && <div className="text-[10px] text-muted-foreground">{note}</div>}
    </div>
  )
}
