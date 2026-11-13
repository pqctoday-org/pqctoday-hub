// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  GATEWAY_BENCHMARKS,
  GATEWAY_FIGURES_NOTE,
  HANDSHAKE_MITIGATIONS_NOTE,
} from '../data/gatewayData'
import {
  HANDSHAKE_SAMPLE_OPTIONS,
  compareMeasuredHandshake,
  exportHandshakeComparison,
} from '../data/measuredHandshakeComparison'
import { ALGORITHM_SIZES, getSizeBreakdown } from '../../MerkleTreeCerts/data/mtcConstants'

function formatRate(bytes: number): string {
  return `${bytes.toLocaleString()} B/s`
}
const mtc = getSizeBreakdown(ALGORITHM_SIZES.find((a) => a.shortName === 'ML-DSA-65')!)

export const HandshakeBudgetCalculator: React.FC = () => {
  const [profile, setProfile] = useState('classical')
  const [connPerSec, setConnPerSec] = useState('10000')
  const [mitigations, setMitigations] = useState<string[]>([])
  const cps = Number(connPerSec)
  const result = compareMeasuredHandshake(profile, mitigations, cps)
  const toggle = (id: string) =>
    setMitigations((previous) =>
      previous.includes(id) ? previous.filter((x) => x !== id) : [...previous, id]
    )
  return (
    <div className="space-y-6" data-testid="measured-handshake-calculator">
      <section className="glass-panel p-4 space-y-3">
        <h3 className="text-lg font-bold">Measured Handshake Comparison</h3>
        <p className="text-sm">
          Choose a retained sample, inspect every message, then compare a certificate-only
          substitution. These examples help you evaluate buffer and bandwidth requirements using
          your own captures.
        </p>
        <p className="text-xs text-muted-foreground">
          {result.runtime}, captured {result.measuredOn}; {result.certificateComposition}.{' '}
          {result.boundary}
        </p>
        <p className="text-xs text-muted-foreground">{result.scope}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FilterDropdown
            ariaLabel="Captured profile"
            label="Captured profile"
            items={[...HANDSHAKE_SAMPLE_OPTIONS]}
            selectedId={profile}
            onSelect={setProfile}
            hideDefaultOption
            noContainer
          />
          <FilterDropdown
            ariaLabel="New handshakes per second"
            label="New handshakes / second"
            items={[1000, 10000, 100000, 1000000].map((rate) => ({
              id: String(rate),
              label: `${rate.toLocaleString()} / sec`,
            }))}
            selectedId={connPerSec}
            onSelect={setConnPerSec}
            hideDefaultOption
            noContainer
          />
        </div>
      </section>
      <section className="glass-panel p-4 space-y-3">
        <h3 className="font-bold">Certificate alternatives</h3>
        <p className="text-xs text-muted-foreground" data-testid="handshake-mitigations-note">
          {HANDSHAKE_MITIGATIONS_NOTE}
        </p>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={mitigations.includes('compression')}
            onChange={() => toggle('compression')}
            className="mt-1"
          />
          <span>
            Certificate compression (zlib)
            <small className="block text-muted-foreground">
              Compress only the exact Certificate body. Include the 7-byte ClientHello offer and
              CompressedCertificate framing; all other cryptographic messages remain.
            </small>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={mitigations.includes('rpk')}
            onChange={() => toggle('rpk')}
            className="mt-1"
          />
          <span>
            Raw public key alternative
            <small className="block text-muted-foreground">
              Use the same leaf SPKI, preserve CertificateVerify and count 11 bytes of negotiation.
              Requires negotiated support and an external identity-to-key trust binding.
            </small>
          </span>
        </label>
        {result.unsupportedReason && (
          <p role="status" className="text-warning">
            {result.unsupportedReason}
          </p>
        )}
        <p className="text-xs text-muted-foreground sm:hidden">
          Swipe the message table to compare captured and variant byte columns.
        </p>
        <div className="overflow-x-auto" data-testid="handshake-message-table-scroll">
          <table className="w-full min-w-[540px] text-xs">
            <caption className="text-left font-bold mb-2">
              Seven-message handshake-layer accounting (bytes)
            </caption>
            <thead>
              <tr>
                <th className="text-left">Message</th>
                <th className="text-left">Direction</th>
                <th>Captured</th>
                <th>Variant</th>
              </tr>
            </thead>
            <tbody>
              {result.baselineMessages.map((message, index) => (
                <tr key={`${message.name}-${message.direction}`}>
                  <td className="py-2">{result.messages?.[index].name ?? message.name}</td>
                  <td>{message.direction}</td>
                  <td className="text-center">{message.bytes.toLocaleString()}</td>
                  <td className="text-center">
                    {result.messages?.[index].bytes.toLocaleString() ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Captured total:{' '}
          <strong data-testid="captured-total">{result.baselineBytes.toLocaleString()} B</strong>
        </p>
        <p>
          Modelled variant total:{' '}
          <strong data-testid="variant-total">
            {result.adjustedBytes === null
              ? 'Unavailable for this combination'
              : `${result.adjustedBytes.toLocaleString()} B`}
          </strong>
        </p>
        {result.savingsBytes !== null && (
          <p data-testid="handshake-savings">
            {result.savingsBytes.toLocaleString()} B saved; {result.negotiationBytes} B negotiation
            included.
          </p>
        )}
        <p className="text-sm">
          Handshake-layer bandwidth at {cps.toLocaleString()} new handshakes/sec:{' '}
          <strong data-testid="handshake-bandwidth">
            {result.bandwidthBytesPerSecond === null
              ? 'Unavailable for this combination'
              : formatRate(result.bandwidthBytesPerSecond)}
          </strong>
          . This excludes record protection and transport framing.
        </p>
        <a
          className="text-primary underline text-sm"
          download="handshake-comparison.json"
          href={`data:application/json;charset=utf-8,${encodeURIComponent(exportHandshakeComparison(result))}`}
        >
          Export comparison JSON
        </a>
      </section>
      <section className="glass-panel p-4 space-y-3">
        <h3 className="font-bold">Transport and connection reuse</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={mitigations.includes('http3-quic')}
            onChange={() => toggle('http3-quic')}
          />
          Consider QUIC transport
        </label>
        <p className="text-sm">{result.transportScope}</p>
        <p className="text-sm">
          Worked connection reuse comparison:{' '}
          {result.adjustedBytes === null
            ? 'choose one supported certificate alternative first'
            : `${result.adjustedBytes.toLocaleString()} B × 10,000 new handshakes/sec = ${(result.adjustedBytes * 10000).toLocaleString()} B/s; at an explicitly chosen 1,000 new handshakes/sec, ${(result.adjustedBytes * 1000).toLocaleString()} B/s`}
          . No automatic connection-count reduction is assumed; origin compatibility and connection
          reuse must be established separately.
        </p>
      </section>
      <section className="glass-panel p-4 space-y-3">
        <h3 className="font-bold">Resumption and MTC: different comparison boundaries</h3>
        <p className="text-sm">
          The selected capture has {result.authenticationComponentBytes.toLocaleString()} B of
          Certificate plus CertificateVerify. Removing just those leaves{' '}
          {result.remainingBeforePskEnvelopeChanges.toLocaleString()} B before PSK identity, binder,
          mode and selection changes. That is a component bound, not a resumed-handshake total; a
          returning client needs a usable ticket and negotiated support.
        </p>
        <p className="text-sm">
          The separate ML-DSA-65 MTC authenticated-component model compares{' '}
          {mtc.traditionalTotal.toLocaleString()} B traditional with {mtc.mtcTotal.toLocaleString()}{' '}
          B standalone (384-byte proof and one CA cosignature), or{' '}
          {mtc.mtcLandmarkTotal.toLocaleString()} B landmark-relative (736-byte proof and pre-synced
          subtree). These include CertificateVerify and their own metadata assumptions, not a
          negotiated whole TLS handshake.
        </p>
        <a href="/learn/merkle-tree-certs" className="text-primary underline text-sm">
          Explore the MTC component model and trust assumptions
        </a>
      </section>
      {/* Gateway Capacity Benchmarks */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="text-xs font-bold text-foreground mb-3">Gateway Capacity Benchmarks</div>
        <p className="text-xs text-muted-foreground mb-3" data-testid="gateway-figures-note">
          {GATEWAY_FIGURES_NOTE}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 pr-3">Gateway</th>
                <th className="pb-2 pr-3">Classical HS/s</th>
                <th className="pb-2 pr-3">PQC Hybrid HS/s</th>
                <th className="pb-2 pr-3">Capacity vs Target</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {GATEWAY_BENCHMARKS.map((b) => {
                const ratio = b.pqcHybridHandshakesPerSec / cps
                return (
                  <tr key={b.name}>
                    <td className="py-1.5 pr-3 font-medium text-foreground">{b.name}</td>
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                      {b.classicalHandshakesPerSec.toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                      {b.pqcHybridHandshakesPerSec.toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span
                        className={`font-mono ${ratio >= 1 ? 'text-status-success' : 'text-status-error'}`}
                      >
                        {ratio >= 1
                          ? `${ratio.toFixed(1)}\u00d7 OK`
                          : `${ratio.toFixed(2)}\u00d7 UNDER`}
                      </span>
                    </td>
                    <td className="py-1.5 text-muted-foreground">{b.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
