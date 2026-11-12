// SPDX-License-Identifier: AGPL-3.0-only
import Papa from 'papaparse'
import type { X509Attribute, ProfileMetadata } from './types'

const SUBJECT_IDS = new Map([
  ['commonName', 'CN'],
  ['countryName', 'C'],
  ['organizationName', 'O'],
  ['organizationalUnitName', 'OU'],
  ['stateOrProvinceName', 'ST'],
  ['localityName', 'L'],
  ['emailAddress', 'emailAddress'],
])

/** Shared interpretation of existing profile data; no presence rule is inferred from criticality. */
export function parseX509Profile(content: string): {
  attributes: X509Attribute[]
  metadata: ProfileMetadata
} {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })
  if (parsed.errors.length || !parsed.data.length)
    throw new Error('Cannot load profile: malformed CSV')
  const first = parsed.data[0]
  const attributes = parsed.data
    .filter((row) => row.ElementType === 'SubjectRDN' || row.ElementType === 'Extension')
    .map((row): X509Attribute => {
      const name = row.Name?.trim(),
        oid = row.OID?.trim()
      if (!name || !oid) throw new Error('Cannot load profile: field name or OID missing')
      const extension = row.ElementType === 'Extension'
      const criticalValue = row.Critical?.trim().toUpperCase()
      if (extension && criticalValue !== 'TRUE' && criticalValue !== 'FALSE')
        throw new Error(`Criticality is not established for ${name}`)
      const value = row.ExampleValue ?? ''
      return {
        id: SUBJECT_IDS.get(name) ?? oid,
        label: name,
        oid,
        elementType: row.ElementType,
        status: 'unknown',
        presenceBasis: 'Profile has no separate presence requirement field',
        critical: extension ? criticalValue === 'TRUE' : undefined,
        value,
        enabled: value.trim().length > 0,
        placeholder: value ? `e.g., ${value}` : 'Enter a sample value',
        description: row.AllowedValuesOrUsage ?? '',
        source: 'CA',
      }
    })
  if (!attributes.length) throw new Error('Cannot load profile: no supported attribute rows')
  if (new Set(attributes.map((attribute) => attribute.id)).size !== attributes.length)
    throw new Error(
      'Repeated profile attributes cannot be represented by this editor; no rows have been dropped'
    )
  return {
    attributes,
    metadata: {
      industry: first.Industry || 'Unknown',
      standard: first.Standard || 'Unknown',
      date: first.StandardDate || 'Unknown',
    },
  }
}

export class ProfileSemanticsError extends Error {}
export type ProfilePurpose = 'csr' | 'root' | 'leaf'
const EXTENSION_NAMES = new Map([
  ['2.5.29.19', 'basicConstraints'],
  ['2.5.29.30', 'nameConstraints'],
  ['2.5.29.36', 'policyConstraints'],
  ['2.5.29.31', 'crlDistributionPoints'],
  ['2.5.29.15', 'keyUsage'],
  ['2.5.29.17', 'subjectAltName'],
  ['2.5.29.14', 'subjectKeyIdentifier'],
  ['2.5.29.35', 'authorityKeyIdentifier'],
  ['1.3.6.1.5.5.7.1.1', 'authorityInfoAccess'],
  // Use the registered OID with arbitrary-extension ASN.1 syntax, not an
  // assumed OpenSSL short-name registration.
  ['1.3.6.1.5.5.7.1.34', '1.3.6.1.5.5.7.1.34'],
])
export function extensionName(attribute: X509Attribute): string {
  return EXTENSION_NAMES.get(attribute.oid) ?? EXTENSION_NAMES.get(attribute.id) ?? attribute.label
}

/** One emitter for CSR requests and certificate extensions. Never drops a selected constraint. */
export function serializeProfileExtensions(
  attributes: X509Attribute[],
  purpose: ProfilePurpose
): string {
  const seen = new Set<string>()
  const seenNames = new Set<string>()
  const selected = attributes.filter((a) => a.enabled && a.elementType === 'Extension')
  // Do not accidentally provide the payload of another raw @section/ASN1
  // reference. The three callers also own these outer configuration sections.
  const reservedSections = new Set(['req', 'dn', 'new_oids', 'v3_ca', 'req_ext', 'extensions'])
  for (const attribute of selected) {
    for (const match of attribute.value.matchAll(
      /(?:@|\b(?:SEQUENCE|SEQ|SET)\s*:)\s*["']?([a-z0-9_.-]+)/gi
    ))
      reservedSections.add(match[1])
  }
  const sections: string[] = []
  const lines = selected
    .map((attribute) => {
      const name = extensionName(attribute)
      const identity = attribute.oid || name
      if (seen.has(identity) || seenNames.has(name))
        fail(`Duplicate extension ${name}; keep one selected value`)
      seen.add(identity)
      seenNames.add(name)
      if (typeof attribute.critical !== 'boolean')
        fail(`Review criticality for ${name}; it is not established for this field`)
      let value = attribute.value.trim()
      if (!value || /[\r\n]/.test(value)) fail(`Enter a single-line extension value for ${name}`)
      if (/^critical\s*,/i.test(value)) {
        if (!attribute.critical)
          fail(`${name} value says critical but its separate critical flag is false`)
        value = value.replace(/^critical\s*,\s*/i, '')
      }
      if (name === 'basicConstraints') value = normalizeBasicConstraints(value, purpose)
      else if (name === 'nameConstraints') value = normalizeNameConstraints(value, purpose)
      else if (name === 'policyConstraints') value = normalizePolicyConstraints(value, purpose)
      else if (name === 'subjectAltName')
        value = value
          .split(',')
          .map((token) =>
            token
              .trim()
              .replace(/^dNSName\s*=\s*/i, 'DNS:')
              .replace(/^URI\s*=\s*/i, 'URI:')
          )
          .join(',')
      else if (name === 'crlDistributionPoints' && /^https?:\/\/[^,\s]+$/i.test(value))
        value = `URI:${value}`
      else if (name === 'authorityInfoAccess')
        value = value.replace(/^(OCSP|caIssuers)\s+(https?:\/\/\S+)$/i, '$1;URI:$2')
      else if (name === 'subjectKeyIdentifier' && /^hash of SPKI$/i.test(value))
        // Match the existing root generator's `hash` mechanism; raw wording is
        // retained in the profile editor, not presented as a parsed hash fact.
        value = 'hash'
      else if (name === 'authorityKeyIdentifier' && /^same as SKI$/i.test(value)) {
        if (purpose !== 'root') fail('The same-as-SKI example is defined for a self-signed root')
        value = 'keyid:always'
      } else if (
        name === 'authorityKeyIdentifier' &&
        /^keyIdentifier from issuer SKI$/i.test(value)
      ) {
        if (purpose === 'csr') fail('An issuer key identifier is not available in a CSR request')
        value = 'keyid:always'
      } else if (name === '1.3.6.1.5.5.7.1.34') {
        if (attribute.critical) fail('RFC 9310 NFTypes MUST NOT be critical')
        // RFC 9310 section 3 defines IA5String SIZE(1..32), printable ASCII
        // excluding spaces, unique entries and ascending ASCII order.
        const types = attribute.value.split(',')
        if (types.some((type) => type.length < 1 || type.length > 32 || /[^\x21-\x7e]/.test(type)))
          fail('RFC 9310 NFTypes require 1..32 printable ASCII characters without spaces')
        if (new Set(types).size !== types.length) fail('RFC 9310 NFTypes must be unique')
        types.sort()
        let suffix = 1
        while (reservedSections.has(`pqctoday_profile_nftypes_${suffix}`)) suffix++
        const section = `pqctoday_profile_nftypes_${suffix}`
        reservedSections.add(section)
        sections.push(
          `\n[ ${section} ]\n` +
            types
              .map((type, index) => {
                // Quote the entire value so RFC-valid #, $, quotes and backslashes
                // remain literal IA5String bytes rather than config directives.
                const literal = type
                  .replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\$/g, '\\$')
                return `nf.${index + 1} = "IA5STRING:${literal}"\n`
              })
              .join('')
        )
        value = `ASN1:SEQUENCE:${section}`
      } else if (/constraints/i.test(name))
        fail(
          `Unsupported constraint ${name}; it has not been omitted. Edit the example or explicitly deselect it.`
        )
      return `${name} = ${attribute.critical ? 'critical,' : ''}${value.replace(/\\/g, '\\\\')}\n`
    })
    .join('')
  // Every caller appends this result after its extension-section header.
  // Auxiliary sections must follow all extension entries, never interrupt them.
  return lines + sections.join('')
}

function normalizeBasicConstraints(value: string, purpose: ProfilePurpose): string {
  let ca: string | undefined, path: string | undefined
  for (const token of value.split(',')) {
    const caMatch = token.trim().match(/^ca\s*[:=]\s*(true|false)$/i)
    const pathMatch = token.trim().match(/^(?:pathlen|pathlenconstraint)\s*[:=]\s*(\d+)$/i)
    if (caMatch && ca === undefined) ca = caMatch[1].toUpperCase()
    else if (pathMatch && path === undefined && Number.isSafeInteger(Number(pathMatch[1])))
      path = String(Number(pathMatch[1]))
    else
      fail(
        'Unsupported basicConstraints syntax; use CA:TRUE or CA:FALSE and an optional nonnegative pathlen'
      )
  }
  if (!ca || (ca === 'FALSE' && path !== undefined))
    fail('basicConstraints pathlen requires CA:TRUE')
  if (purpose === 'root' && ca !== 'TRUE')
    fail('The root sample requires CA:TRUE; the explicit profile value will not be replaced')
  if (purpose === 'leaf' && ca !== 'FALSE')
    fail(
      'This end-entity sample cannot issue a CA certificate; the explicit profile value will not be replaced'
    )
  return `CA:${ca}${path === undefined ? '' : `,pathlen:${path}`}`
}
function normalizeNameConstraints(value: string, purpose: ProfilePurpose): string {
  if (purpose === 'leaf')
    fail(
      'nameConstraints is not supported for this end-entity sample; use an appropriate CA exercise'
    )
  return value
    .split(',')
    .map((token) => {
      const match = token
        .trim()
        .match(
          /^(permitted|excluded)\s*[;:]\s*(?:DNS\s*:|dNSName\s*=)\s*(\.?[a-z0-9][a-z0-9.-]*)$/i
        )
      if (!match)
        fail(
          'Unsupported nameConstraints example. Inline permitted;DNS:.example.com is supported; directory names and referenced sections need a separately prepared configuration. No constraint has been dropped.'
        )
      return `${match[1].toLowerCase()};DNS:${match[2]}`
    })
    .join(',')
}
function normalizePolicyConstraints(value: string, purpose: ProfilePurpose): string {
  if (purpose === 'leaf') fail('policyConstraints is not supported for this end-entity sample')
  const seen = new Set<string>()
  return value
    .split(',')
    .map((token) => {
      const match = token.trim().match(/^(requireExplicitPolicy|inhibitPolicyMapping)\s*:\s*(\d+)$/)
      if (!match || seen.has(match[1]) || !Number.isSafeInteger(Number(match[2])))
        fail(
          'Unsupported policyConstraints syntax; use distinct nonnegative requireExplicitPolicy / inhibitPolicyMapping values'
        )
      seen.add(match[1])
      return `${match[1]}:${Number(match[2])}`
    })
    .join(',')
}
function fail(message: string): never {
  throw new ProfileSemanticsError(message)
}
