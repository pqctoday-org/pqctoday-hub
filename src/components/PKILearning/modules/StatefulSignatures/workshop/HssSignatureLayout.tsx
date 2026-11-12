// SPDX-License-Identifier: AGPL-3.0-only
import type { DecodedHssSignature, DecodedLmsSignature, EncodedField } from './hssSignatureDecode'
function Field({ name, field }: { name: string; field: EncodedField }) {
  return (
    <details className="rounded border border-border p-2">
      <summary className="break-words">
        {name}: offset {field.offset}, {field.length} bytes (end {field.offset + field.length},
        exclusive)
      </summary>
      <pre className="mt-1 whitespace-pre-wrap break-all text-[10px]">{field.hex}</pre>
    </details>
  )
}
function Signature({ signature, level }: { signature: DecodedLmsSignature; level: number }) {
  return (
    <section aria-label={`LMS signature level ${level}`} className="space-y-2">
      <h5 className="font-bold">
        LMS signature level {level} — {signature.bytes.length} bytes at offset{' '}
        {signature.bytes.offset}
      </h5>
      <p>
        Leaf index q: {signature.q}; LMS type: {signature.lms.id} ({signature.lms.name}); LMOTS
        type: {signature.lmots.type.id} ({signature.lmots.type.name}).
      </p>
      <Field name="q (u32 big-endian)" field={signature.qField} />
      <Field name="LMOTS type (u32 big-endian)" field={signature.lmots.typeField} />
      <Field name="LMOTS signature (type + C + y)" field={signature.lmots.bytes} />
      <Field name="C randomizer" field={signature.lmots.C} />
      <Field
        name={`LMOTS y payload (${signature.lmots.type.p} × ${signature.lmots.type.n} bytes)`}
        field={signature.lmots.payload}
      />
      <details>
        <summary>Inspect each of the {signature.lmots.y.length} Winternitz chain values</summary>
        <div className="space-y-1">
          {signature.lmots.y.map((field, i) => (
            <Field key={field.offset} name={`y[${i}]`} field={field} />
          ))}
        </div>
      </details>
      <Field name="LMS type (u32 big-endian)" field={signature.typeField} />
      <Field
        name={`Authentication path (${signature.lms.h} × ${signature.lms.m} bytes)`}
        field={signature.authPathBytes}
      />
      <details>
        <summary>Inspect {signature.authPath.length} authentication-path nodes</summary>
        <div className="space-y-1">
          {signature.authPath.map((field, i) => (
            <Field key={field.offset} name={`path[${i}]`} field={field} />
          ))}
        </div>
      </details>
    </section>
  )
}
export function HssSignatureLayout({ decoded }: { decoded: DecodedHssSignature }) {
  return (
    <section
      aria-label="Decoded HSS signature"
      className="space-y-3 rounded border border-border p-3 text-xs"
    >
      <h4 className="font-bold">Decoded HSS signature structure</h4>
      <p>
        Nspk (signed child public keys): {decoded.nspk}. Encoded hierarchy levels: {decoded.levels}.
        Parsed {decoded.totalBytes} bytes with no remainder.
      </p>
      <Field name="HSS Nspk (u32 big-endian)" field={decoded.prefix} />
      <p className="text-muted-foreground">
        Offsets are zero-based in the returned signature. RFC 8554 defines levels as Nspk + 1. This
        is structural decoding, not signature verification, root-key authentication or a check of
        remaining signing capacity. Registered RFC 8554 / RFC 9858 typecodes determine field
        lengths.
      </p>
      {decoded.signedPublicKeys.map(({ signature, publicKey }, i) => (
        <div key={signature.bytes.offset} className="space-y-3 border-t border-border pt-3">
          <Signature signature={signature} level={i} />
          <section aria-label={`Signed child public key ${i + 1}`} className="space-y-2">
            <h5 className="font-bold">
              Signed child public key {i + 1} — {publicKey.bytes.length} bytes at offset{' '}
              {publicKey.bytes.offset}
            </h5>
            <p>
              LMS type: {publicKey.lms.id} ({publicKey.lms.name}); LMOTS type: {publicKey.lmots.id}{' '}
              ({publicKey.lmots.name}).
            </p>
            <Field name="Child LMS public key" field={publicKey.bytes} />
            <Field name="Child LMS type (u32 big-endian)" field={publicKey.lmsTypeField} />
            <Field name="Child LMOTS type (u32 big-endian)" field={publicKey.lmotsTypeField} />
            <Field name="Child identifier I" field={publicKey.I} />
            <Field name="Child root T[1]" field={publicKey.root} />
          </section>
        </div>
      ))}
      <div className="border-t border-border pt-3">
        <Signature signature={decoded.messageSignature} level={decoded.nspk} />
      </div>
      <p className="text-muted-foreground">
        Use the verifier and expected public key in your own tools to check signature mathematics
        and trust. Byte layout alone cannot establish either.
      </p>
    </section>
  )
}
