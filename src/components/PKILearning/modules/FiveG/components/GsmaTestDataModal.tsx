// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { X, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import gsmaVectors from '@/data/kat/gsma_suci_ts33501_annex_c.json'
import { Button } from '@/components/ui/button'

interface GsmaTestDataModalProps {
  open: boolean
  onClose: () => void
}

interface VectorEntry {
  id: string
  profile: string
  scheme_id: string
  supi_type: string
  description: string
  hn_priv_hex?: string
  hn_pub_hex?: string
  hn_pub_compressed_hex?: string
  eph_priv_hex?: string
  eph_pub_hex?: string
  eph_pub_compressed_hex?: string
  scheme_output?: string
  scheme_output_parts?: {
    eph_pub?: string
    eph_pub_compressed?: string
    cipher_msin?: string
    mac_tag?: string
  }
  supi_example?: string
  note?: string
}

function HexField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="mb-2">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="flex items-start gap-2">
        <code
          className={`text-xs break-all text-foreground bg-muted/60 px-2 py-1 rounded flex-1 ${mono ? 'font-mono' : ''}`}
        >
          {value}
        </code>
        <Button
          variant="ghost"
          onClick={copy}
          className="text-xs text-muted-foreground hover:text-primary shrink-0 pt-1"
          title="Copy"
        >
          {copied ? '✓' : '⎘'}
        </Button>
      </div>
    </div>
  )
}

function VectorCard({ vector }: { vector: VectorEntry }) {
  const [expanded, setExpanded] = useState(false)
  const profileColor =
    vector.profile === 'A' ? 'border-primary/40 bg-primary/5' : 'border-secondary/40 bg-secondary/5'
  const schemeParts = vector.scheme_output_parts

  return (
    <div className={`rounded-lg border ${profileColor} overflow-hidden`}>
      <Button
        variant="ghost"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
            Profile {vector.profile}
          </span>
          <span className="text-xs text-muted-foreground">Scheme {vector.scheme_id}</span>
          <span className="text-xs text-muted-foreground ml-2">· {vector.supi_type}</span>
        </div>
        {expanded ? (
          <ChevronDown size={14} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground" />
        )}
      </Button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border/40 pt-3 space-y-3">
          {vector.supi_example && (
            <div className="text-xs text-muted-foreground italic">
              SUPI: <span className="font-mono text-foreground">{vector.supi_example}</span>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-foreground mb-1">Home Network Key Pair</div>
            {vector.hn_priv_hex && <HexField label="HN Private Key" value={vector.hn_priv_hex} />}
            {vector.hn_pub_compressed_hex && (
              <HexField label="HN Public Key (compressed)" value={vector.hn_pub_compressed_hex} />
            )}
            {vector.hn_pub_hex && (
              <HexField
                label={`HN Public Key (${vector.profile === 'A' ? '32-byte raw X25519' : 'uncompressed P-256, 65 bytes'})`}
                value={vector.hn_pub_hex}
              />
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-foreground mb-1">
              Ephemeral Key Pair (USIM)
            </div>
            {vector.eph_priv_hex && (
              <HexField label="Ephemeral Private Key" value={vector.eph_priv_hex} />
            )}
            {vector.eph_pub_compressed_hex && (
              <HexField
                label="Ephemeral Public Key (compressed — used in SUCI scheme output)"
                value={vector.eph_pub_compressed_hex}
              />
            )}
            {vector.eph_pub_hex && (
              <HexField
                label={`Ephemeral Public Key (${vector.profile === 'A' ? '32-byte raw X25519' : 'uncompressed P-256, 65 bytes — SharedInfo for KDF'})`}
                value={vector.eph_pub_hex}
              />
            )}
          </div>

          {schemeParts && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-1">
                Scheme Output Breakdown
                <span className="text-muted-foreground font-normal ml-1">
                  (EphPub ‖ Ciphertext ‖ MAC)
                </span>
              </div>
              {(schemeParts.eph_pub ?? schemeParts.eph_pub_compressed) && (
                <HexField
                  label={
                    schemeParts.eph_pub_compressed
                      ? 'Ephemeral Public Key (compressed)'
                      : 'Ephemeral Public Key (raw)'
                  }
                  value={(schemeParts.eph_pub ?? schemeParts.eph_pub_compressed)!}
                />
              )}
              {schemeParts.cipher_msin && (
                <HexField
                  label="Encrypted MSIN (AES-128-CTR ciphertext)"
                  value={schemeParts.cipher_msin}
                />
              )}
              {schemeParts.mac_tag && (
                <HexField
                  label="MAC Tag (HMAC-SHA-256 truncated to 8 bytes)"
                  value={schemeParts.mac_tag}
                />
              )}
            </div>
          )}

          {vector.scheme_output && (
            <HexField label="Full Scheme Output (concatenated)" value={vector.scheme_output} />
          )}

          {vector.note && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1.5 italic">
              {vector.note}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const GsmaTestDataModal: React.FC<GsmaTestDataModalProps> = ({ open, onClose }) => {
  if (!open) return null

  const vectors =
    (gsmaVectors as { official_3gpp_vectors?: VectorEntry[] }).official_3gpp_vectors ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative bg-background border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
          <div>
            <div className="font-bold text-foreground">
              3GPP TS 33.501 Annex C.4 — Reference Vectors
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Official ETSI/3GPP test key material · Profile A (X25519) and Profile B (P-256)
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <div className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
            Each vector provides both IMSI-based and NAI-based SUPI variants. For Profile B, the
            scheme output uses the <strong>compressed</strong> ephemeral public key (33 bytes with
            02/03 prefix), while the ECDH computation and KDF SharedInfo use the{' '}
            <strong>uncompressed</strong> form (65 bytes). The same home network key pair is reused
            across both Profile B vectors.
          </div>

          {vectors.map((v) => (
            <VectorCard key={v.id} vector={v} />
          ))}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <ExternalLink size={11} />
            <span>Source: 3GPP TS 33.501 V18.x.x Annex C.4, publicly available via ETSI</span>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-border flex justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors text-foreground"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
