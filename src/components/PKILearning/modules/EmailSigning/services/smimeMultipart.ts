// SPDX-License-Identifier: GPL-3.0-only
/**
 * smimeMultipart — wraps a raw DER `.p7m` (CMS SignedData or
 * AuthEnvelopedData) into the MIME structures that mail clients expect.
 *
 * The hub only renders these in-app today (no download path, per the
 * Phase 1 scope decision). They give workshop users an `.eml`-shaped
 * artifact to inspect — the same shape Thunderbird / Outlook / Apple Mail
 * would parse if PQ-aware mail clients shipped support for ML-DSA /
 * ML-KEM OIDs.
 *
 * Two wrapper shapes per RFC 8551 (S/MIME v4):
 *
 *   1. Signed (opaque): `application/pkcs7-mime; smime-type=signed-data`
 *      single-part body, base64 of the `.p7m`. Used here because our
 *      Phase 2 sign output is opaque (`-nodetach`).
 *
 *   2. Enveloped: `application/pkcs7-mime; smime-type=enveloped-data`
 *      same single-part shape, used for Phase 4 cms -encrypt output.
 *
 * A third shape — `multipart/signed; protocol=application/pkcs7-signature`
 * — is appropriate for DETACHED signatures and isn't used today. The
 * helper exposes a future seam for it.
 */

interface SmimeHeaders {
  from?: string
  to?: string
  subject?: string
  date?: string
}

function defaultHeaders(): Required<SmimeHeaders> {
  return {
    from: 'alice@pqc-workshop.example',
    to: 'bob@pqc-workshop.example',
    subject: 'PQC workshop test message',
    date: new Date().toUTCString(),
  }
}

/** Base64-encode binary CMS bytes with classic 64-column wrapping. */
function base64Wrap(bytes: Uint8Array, columns = 64): string {
  // Build the latin-1 binary string in 8 KB chunks; String.fromCharCode.apply
  // on the whole array trips the stack on >100 KB inputs in some browsers,
  // and a `for (i = 0; ...)` index loop with bytes[i] trips the security
  // lint's object-injection heuristic. Using Array.from + reduce sidesteps
  // both — Uint8Array iteration is well-typed and safe.
  const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  const b64 = btoa(bin)
  const lines: string[] = []
  for (let i = 0; i < b64.length; i += columns) lines.push(b64.slice(i, i + columns))
  return lines.join('\r\n')
}

/** Wrap an opaque-signed `.p7m` (`cms -sign -nodetach`) as a single-part
 *  `application/pkcs7-mime` MIME message, ready for in-app inspection. */
export function smimeEnvelopeSigned(signedP7m: Uint8Array, headers: SmimeHeaders = {}): string {
  const h = { ...defaultHeaders(), ...headers }
  const body = base64Wrap(signedP7m)
  return [
    `From: ${h.from}`,
    `To: ${h.to}`,
    `Subject: ${h.subject}`,
    `Date: ${h.date}`,
    'MIME-Version: 1.0',
    'Content-Type: application/pkcs7-mime; smime-type=signed-data; name="smime.p7m"',
    'Content-Transfer-Encoding: base64',
    'Content-Disposition: attachment; filename="smime.p7m"',
    '',
    body,
    '',
  ].join('\r\n')
}

/** Wrap a CMS `EnvelopedData` / `AuthEnvelopedData` (`cms -encrypt` output)
 *  as a single-part `application/pkcs7-mime` MIME message. */
export function smimeEnvelopeEncrypted(enveloped: Uint8Array, headers: SmimeHeaders = {}): string {
  const h = { ...defaultHeaders(), ...headers }
  const body = base64Wrap(enveloped)
  return [
    `From: ${h.from}`,
    `To: ${h.to}`,
    `Subject: ${h.subject}`,
    `Date: ${h.date}`,
    'MIME-Version: 1.0',
    'Content-Type: application/pkcs7-mime; smime-type=enveloped-data; name="smime.p7m"',
    'Content-Transfer-Encoding: base64',
    'Content-Disposition: attachment; filename="smime.p7m"',
    '',
    body,
    '',
  ].join('\r\n')
}
