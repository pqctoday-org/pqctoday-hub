// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import samples from '../data/emailSizeSamples.json'
import { certificateFieldComparison } from '../data/emailSigningConstants'
import { measureEmailSample } from '../services/emailArtifactMeasurements'
import { ScrollFadeContainer } from '@/components/ui/ScrollFadeContainer'

export function EmailSizeComparison() {
  const [subject, setSubject] = useState('PQC workshop test message')
  const [lineEndings, setLineEndings] = useState('lf')
  const measured = samples.samples.map((sample) => ({
    sample,
    value: measureEmailSample(
      {
        ...sample,
        certPem: lineEndings === 'crlf' ? sample.certPem.replace(/\n/g, '\r\n') : sample.certPem,
      },
      samples.payload,
      subject
    ),
  }))
  const [rsa, pq] = measured.map((m) => m.value)
  const rows = [
    ['Public-key component (not SPKI)', rsa.componentBytes, pq.componentBytes],
    ['Complete SubjectPublicKeyInfo DER', rsa.spkiDerBytes, pq.spkiDerBytes],
    ['Certificate signature bytes', rsa.certSignatureBytes, pq.certSignatureBytes],
    ['Other certificate DER bytes', rsa.certOtherBytes, pq.certOtherBytes],
    ['Complete certificate DER', rsa.certDerBytes, pq.certDerBytes],
    ['Complete certificate PEM UTF-8', rsa.certPemBytes, pq.certPemBytes],
    ['Recovered signed payload UTF-8', rsa.payloadBytes, pq.payloadBytes],
    ['CMS signature bytes', rsa.cmsSignatureBytes, pq.cmsSignatureBytes],
    ['Complete opaque CMS SignedData DER', rsa.cmsBytes, pq.cmsBytes],
    ['MIME headers + separator UTF-8', rsa.headerBytes, pq.headerBytes],
    ['MIME base64 body + CRLF bytes', rsa.bodyBytes, pq.bodyBytes],
    ['Complete MIME entity UTF-8', rsa.mimeBytes, pq.mimeBytes],
    ['MIME overhead above raw payload', rsa.overheadBytes, pq.overheadBytes],
  ] as const
  return (
    <section className="space-y-4" aria-label="Measured email sample comparison">
      <h4 className="font-bold">Measured public encodings and signed-email size</h4>
      <p className="text-sm text-muted-foreground">
        Captured software samples matching the workshop’s existing RSA-3072 / CMS RSA-PSS and
        ML-DSA-65 commands. Independently decoded with OpenSSL 3.6.3. Both contain the same
        fictional UTF-8 message and one self-signed signer certificate; no chain is included. These
        are different security choices, not equivalent security levels.
      </p>
      <label className="block text-sm">
        Unsigned outer MIME Subject
        <input
          aria-label="Unsigned outer MIME Subject"
          className="block w-full rounded border border-border bg-background p-2"
          value={subject}
          onChange={(e) => setSubject(e.target.value.replace(/[\r\n]/g, ''))}
        />
      </label>
      <FilterDropdown
        label="Certificate PEM line endings"
        items={[
          { id: 'lf', label: 'LF' },
          { id: 'crlf', label: 'CRLF' },
        ]}
        selectedId={lineEndings}
        onSelect={(id) => setLineEndings(id === 'crlf' ? 'crlf' : 'lf')}
        hideDefaultOption
      />
      <p className="text-xs text-muted-foreground">
        Changing this outer header changes MIME bytes, not the signed payload or CMS signature. PEM
        whitespace changes textual bytes, not decoded certificate DER. The MIME serialization
        retains the existing 64-column base64, CRLF and explicit date: Thu, 12 Nov 2026 12:00:00
        GMT.
      </p>
      <ScrollFadeContainer>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Exact measured bytes for complete encodings and their components
            </caption>
            <thead>
              <tr>
                <th className="text-left p-2">Representation (bytes)</th>
                <th className="p-2">RSA-3072 / CMS RSA-PSS</th>
                <th className="p-2">ML-DSA-65</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b]) => (
                <tr key={label} className="border-b border-border">
                  <th scope="row" className="text-left p-2 font-medium">
                    {label}
                  </th>
                  <td className="p-2 font-mono">{a.toLocaleString('en-US')}</td>
                  <td className="p-2 font-mono">{b.toLocaleString('en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollFadeContainer>
      <details>
        <summary>Compare actual certificate fields</summary>
        <ScrollFadeContainer>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>RSA-3072 sample</th>
                  <th>ML-DSA-65 sample</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {certificateFieldComparison(rsa, pq).map((row) => (
                  <tr key={row.field}>
                    <th scope="row" className="p-2 text-left">
                      {row.field}
                    </th>
                    <td className="p-2 break-words">{row.rsaValue}</td>
                    <td className="p-2 break-words">{row.mlDsaValue}</td>
                    <td className="p-2">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollFadeContainer>
      </details>
      <p className="text-sm">
        For these certificates, the complete DER ratio is{' '}
        {(pq.certDerBytes / rsa.certDerBytes).toFixed(2)}×; complete SPKI DER is{' '}
        {(pq.spkiDerBytes / rsa.spkiDerBytes).toFixed(2)}×. The RSA modulus is {rsa.componentBytes}{' '}
        bytes, while the complete RSA public key SPKI is {rsa.spkiDerBytes} bytes. The ML-DSA
        component is its packed public key.
      </p>
      <div className="space-y-2" aria-label="Measured certificate size bars">
        {measured.map(({ sample, value }) => (
          <div key={sample.id}>
            <div className="flex justify-between gap-2 text-xs">
              <span>{sample.label} certificate DER</span>
              <span>{value.certDerBytes} bytes</span>
            </div>
            <div className="h-3 rounded bg-muted">
              <div
                className="h-3 rounded bg-primary"
                style={{
                  width: `${(100 * value.certDerBytes) / Math.max(rsa.certDerBytes, pq.certDerBytes)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <details>
        <summary>Inspect the signed message and actual certificate assumptions</summary>
        <pre className="whitespace-pre-wrap break-words text-xs p-2">{samples.payload}</pre>
        {measured.map(({ sample, value }) => (
          <div key={sample.id} className="mt-3 space-y-2 text-xs break-words">
            <h5 className="font-bold">{sample.label}</h5>
            <p>
              Subject: {value.subject}; issuer: {value.issuer}. Validity: {value.notBefore} to{' '}
              {value.notAfter}. Key OID: {value.keyOid}; certificate signature OID:{' '}
              {value.certSignatureOid}; CMS signature OID: {value.cmsSignatureOid}.
            </p>
            <p>
              Extension OIDs: {value.extensions.join(', ') || 'none'}. Certificate signature size
              depends on the issuer algorithm. These self-signed workshop certificates do not
              establish email-purpose profile conformance, chain trust or client interoperability;
              compare the extension examples separately.
            </p>
            <p>
              Certificate DER SHA-256: {sample.certificateSha256}; CMS DER SHA-256:{' '}
              {sample.cmsSha256}.
            </p>
            <label className="block">
              {sample.label} certificate PEM
              <textarea
                readOnly
                aria-label={`${sample.label} certificate PEM`}
                value={
                  lineEndings === 'crlf' ? sample.certPem.replace(/\n/g, '\r\n') : sample.certPem
                }
                className="w-full h-24 font-mono bg-background border border-border"
              />
            </label>
            <label className="block">
              {sample.label} CMS DER base64
              <textarea
                readOnly
                aria-label={`${sample.label} CMS DER base64`}
                value={sample.cmsBase64}
                className="w-full h-20 font-mono bg-background border border-border"
              />
            </label>
            <label className="block">
              {sample.label} complete MIME entity
              <textarea
                readOnly
                aria-label={`${sample.label} complete MIME entity`}
                value={value.mime}
                className="w-full h-28 font-mono bg-background border border-border"
              />
            </label>
          </div>
        ))}
      </details>
      <p className="text-xs text-muted-foreground">
        The retained sample signatures were independently checked with OpenSSL and their recovered
        content matched byte for byte. This view parses and counts the captured bytes; editing outer
        MIME headers does not run a new cryptographic operation or verify a deployed mail system.
        Use your mail tools to measure their actual issuer chain, extensions and serialization.
      </p>
    </section>
  )
}
