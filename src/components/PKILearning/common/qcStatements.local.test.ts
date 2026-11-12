// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fromBER, Null, ObjectIdentifier, Sequence } from 'asn1js'
import { normalizeQcStatements } from './qcStatements'
import {
  parseX509Profile,
  ProfileSemanticsError,
  serializeProfileExtensions,
} from './profileSemantics'

const payload =
  '30293008060604008e4601013008060604008e4601043013060604008e4601063009060704008e46010601'
const oid = (value: string) => new ObjectIdentifier({ value })
const sequence = (value: (Sequence | ObjectIdentifier | Null)[]) => new Sequence({ value })
const der = (value: Sequence) =>
  `DER:${Array.from(new Uint8Array(value.toBER(false)), (b) => b.toString(16).padStart(2, '0')).join('')}`
const qc = (value = `DER:${payload}`) =>
  ({
    id: '1.3.6.1.5.5.7.1.3',
    oid: '1.3.6.1.5.5.7.1.3',
    label: 'qcStatements',
    value,
    enabled: true,
    critical: false,
    elementType: 'Extension',
    status: 'unknown',
    placeholder: '',
    description: '',
  }) as const
const profiles = import.meta.glob<string>(
  [
    '../../../data/x509_profiles/Cert-Financial_ETSI_EN319412-2_2025.csv',
    '../../../data/x509_profiles/Cert-Financial_ETSI_EN319412-2_04072026.csv',
  ],
  { query: '?raw', import: 'default', eager: true }
)

describe('approved fictional natural-person/device QC payload', () => {
  it('independently decodes compliance, device and eSignature statements without inventing a monetary limit', () => {
    expect(normalizeQcStatements(`DER:${payload}`, false)).toBe(`DER:${payload}`)
    const parsed = fromBER(
      Uint8Array.from(payload.match(/../g)!, (x) => Number.parseInt(x, 16)).buffer
    )
    expect(parsed.offset).toBe(43)
    expect(parsed.result).toBeInstanceOf(Sequence)
    const statements = (parsed.result as Sequence).valueBlock.value as Sequence[]
    expect(
      statements.map((s) => (s.valueBlock.value[0] as ObjectIdentifier).valueBlock.toString())
    ).toEqual(['0.4.0.1862.1.1', '0.4.0.1862.1.4', '0.4.0.1862.1.6'])
    expect(statements[0].valueBlock.value).toHaveLength(1)
    expect(statements[1].valueBlock.value).toHaveLength(1)
    const types = statements[2].valueBlock.value[1] as Sequence
    expect(types.valueBlock.value).toHaveLength(1)
    expect((types.valueBlock.value[0] as ObjectIdentifier).valueBlock.toString()).toBe(
      '0.4.0.1862.1.6.1'
    )
  })
  it.each(Object.entries(profiles))(
    'projects the reviewed candidate through all actual selected extensions for %s, without editing raw rows',
    (_name, text) => {
      // Data is separately guarded for application; this test explicitly projects
      // the approved fields until the canonical source transaction is applied.
      const original = parseX509Profile(text).attributes
      const before = structuredClone(original)
      const attributes = original.map((a) =>
        a.label === 'qcStatements'
          ? { ...a, ...qc() }
          : a.label === 'certificatePolicies'
            ? { ...a, value: '0.4.0.194112.1.2' }
            : a
      )
      const output = serializeProfileExtensions(attributes, 'leaf')
      expect(output).toContain(`qcStatements = DER:${payload}\n`)
      expect(output).toContain('certificatePolicies = 0.4.0.194112.1.2\n')
      expect(output).not.toContain('critical,DER:')
      expect(output).not.toContain('ASN1:SEQUENCE:qcs')
      expect(output.trim().split('\n')).toHaveLength(
        original.filter((a) => a.enabled && a.elementType === 'Extension').length
      )
      expect(attributes.find((a) => a.label === 'commonName')?.value).toBe('Jane Doe')
      expect(original).toEqual(before)
    }
  )
  it.each([
    'ASN1:SEQUENCE:qcs',
    `DER:${payload.slice(0, -2)}`,
    `DER:${payload}00`,
    `DER:31${payload.slice(2)}`,
    'DER:zz',
    'DER:',
  ])('refuses an unresolved or malformed payload %s', (value) => {
    expect(() => serializeProfileExtensions([qc(value)], 'leaf')).toThrow(/qcStatement|QCStatement/)
  })
  it('does not serialize contradictory outer metadata or critical ETSI statements', () => {
    expect(() => serializeProfileExtensions([qc('ASN1:SEQUENCE:qcs')], 'leaf')).toThrow(
      ProfileSemanticsError
    )
    expect(() =>
      serializeProfileExtensions([{ ...qc(), oid: '1.3.6.1.5.5.7.1.12' }], 'leaf')
    ).toThrow(/extension OID/)
    expect(() => serializeProfileExtensions([{ ...qc(), critical: true }], 'leaf')).toThrow(
      /non-critical/
    )
  })
  it('refuses altered known statement shapes while retaining unknown identifiers uninterpreted', () => {
    for (const id of ['0.4.0.1862.1.1', '0.4.0.1862.1.4'])
      expect(() =>
        normalizeQcStatements(der(sequence([sequence([oid(id), new Null()])])), false)
      ).toThrow(/do not carry/)
    expect(() =>
      normalizeQcStatements(der(sequence([sequence([oid('0.4.0.1862.1.6'), new Null()])])), false)
    ).toThrow(/QcType/)
    expect(() =>
      normalizeQcStatements(
        der(
          sequence([
            sequence([
              oid('0.4.0.1862.1.6'),
              sequence([oid('0.4.0.1862.1.6.1'), oid('0.4.0.1862.1.6.2')]),
            ]),
          ])
        ),
        false
      )
    ).toThrow(/exactly one/)
    expect(() =>
      normalizeQcStatements(
        der(sequence([sequence([oid('0.4.0.1862.1.1')]), sequence([oid('0.4.0.1862.1.1')])])),
        false
      )
    ).toThrow(/repeat/)
    const unknown = der(sequence([sequence([oid('1.2.3.4'), new Null()])]))
    expect(normalizeQcStatements(unknown, false)).toBe(unknown)
  })
})
