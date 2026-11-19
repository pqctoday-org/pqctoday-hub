// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection, security/detect-non-literal-fs-filename */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { FIPS_OBJECT_SIZES } from './verification/fipsObjectSizes'
import {
  CLASSICAL_ECDSA_SIZES,
  CLASSICAL_EDDSA_SIZES,
  CLASSICAL_KEX_SIZES,
} from './verification/classicalObjectSizes'
import {
  computeBareLmsSizes,
  computeHssSizes,
  computeXmssSizes,
  STATEFUL_LMS_HSS_SIZES,
  STATEFUL_XMSS_SIZES,
} from './verification/statefulAndCandidateObjectSizes'
import {
  COMPOSITE_SIGNATURE_OBJECT_SIZES,
  HYBRID_KEM_OBJECT_SIZES,
  verifyInventoriedClaim,
  type InventoriedClaim,
} from './verification/hybridAndProtocolObjectSizes'
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js'
import { ml_kem512, ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js'
import {
  slh_dsa_sha2_128s,
  slh_dsa_sha2_128f,
  slh_dsa_sha2_192s,
  slh_dsa_sha2_192f,
  slh_dsa_sha2_256s,
  slh_dsa_sha2_256f,
  slh_dsa_shake_128s,
  slh_dsa_shake_128f,
  slh_dsa_shake_192s,
  slh_dsa_shake_192f,
  slh_dsa_shake_256s,
  slh_dsa_shake_256f,
} from '@noble/post-quantum/slh-dsa.js'
import { p256, p384, p521 } from '@noble/curves/nist.js'
import { ed25519, x25519 } from '@noble/curves/ed25519.js'

const slhSuites = {
  'SLH-DSA-SHA2-128s': slh_dsa_sha2_128s,
  'SLH-DSA-SHA2-128f': slh_dsa_sha2_128f,
  'SLH-DSA-SHA2-192s': slh_dsa_sha2_192s,
  'SLH-DSA-SHA2-192f': slh_dsa_sha2_192f,
  'SLH-DSA-SHA2-256s': slh_dsa_sha2_256s,
  'SLH-DSA-SHA2-256f': slh_dsa_sha2_256f,
  'SLH-DSA-SHAKE-128s': slh_dsa_shake_128s,
  'SLH-DSA-SHAKE-128f': slh_dsa_shake_128f,
  'SLH-DSA-SHAKE-192s': slh_dsa_shake_192s,
  'SLH-DSA-SHAKE-192f': slh_dsa_shake_192f,
  'SLH-DSA-SHAKE-256s': slh_dsa_shake_256s,
  'SLH-DSA-SHAKE-256f': slh_dsa_shake_256f,
}

const suites = {
  'ML-DSA-44': ml_dsa44,
  'ML-DSA-65': ml_dsa65,
  'ML-DSA-87': ml_dsa87,
  'ML-KEM-512': ml_kem512,
  'ML-KEM-768': ml_kem768,
  'ML-KEM-1024': ml_kem1024,
}

describe('independently sourced FIPS raw-object claims', () => {
  for (const [name, expected] of Object.entries(FIPS_OBJECT_SIZES)) {
    it(`${name}: registry agrees with the independently transcribed specification`, () => {
      expect(ALGORITHM_REGISTRY[name]).toMatchObject(expected)
    })
    if (name in slhSuites) {
      it(`${name}: declared engine lengths agree with FIPS (metadata, not an execution claim)`, () => {
        const suite = slhSuites[name as keyof typeof slhSuites]
        expect(suite.lengths.publicKey).toBe(expected.publicKeyBytes)
        expect(suite.lengths.secretKey).toBe(expected.privateKeyBytes)
        expect(suite.lengths.signature).toBe(expected.signatureOrCiphertextBytes)
      })
      continue
    }
    it(`${name}: actual engine output has the specified raw lengths`, () => {
      const suite = suites[name as keyof typeof suites]
      const { publicKey, secretKey } = suite.keygen()
      expect(publicKey.length).toBe(expected.publicKeyBytes)
      expect(secretKey.length).toBe(expected.privateKeyBytes)
      const message = new TextEncoder().encode('Fictional raw-object length check')
      const output =
        'sign' in suite ? suite.sign(message, secretKey) : suite.encapsulate(publicKey).cipherText
      expect(output.length).toBe(expected.signatureOrCiphertextBytes)
    })
  }
})

describe('independently sourced classical & stateful specification tables (@noble/curves + RFC formulas)', () => {
  it('verifies ECDSA P-256, P-384, and P-521 compressed, uncompressed, and raw signature lengths against @noble/curves', () => {
    const curves = [
      { key: 'ECDSA P-256', impl: p256 },
      { key: 'ECDSA P-384', impl: p384 },
      { key: 'ECDSA P-521', impl: p521 },
    ] as const
    const msg = new TextEncoder().encode('Fictional ECDSA specification check')
    for (const { key, impl } of curves) {
      const spec = CLASSICAL_ECDSA_SIZES[key]
      const { secretKey } = impl.keygen()
      const compressedPub = impl.getPublicKey(secretKey, true)
      const uncompressedPub = impl.getPublicKey(secretKey, false)
      const compactSig = impl.sign(msg, secretKey)
      expect(secretKey.length).toBe(spec.privateKeyBytes)
      expect(compressedPub.length).toBe(spec.compressedPublicKeyBytes)
      expect(uncompressedPub.length).toBe(spec.uncompressedPublicKeyBytes)
      expect(uncompressedPub.length - 1).toBe(spec.rawCoordinatePairBytes)
      expect(compactSig.length).toBe(spec.rawSignatureBytes)
    }
  })

  it('verifies Ed25519 and X25519 key and signature lengths against @noble/curves', () => {
    const edKeys = ed25519.keygen()
    const msg = new TextEncoder().encode('Fictional Ed25519 check')
    const edSig = ed25519.sign(msg, edKeys.secretKey)
    expect(edKeys.publicKey.length).toBe(CLASSICAL_EDDSA_SIZES.Ed25519.publicKeyBytes)
    expect(edKeys.secretKey.length).toBe(CLASSICAL_EDDSA_SIZES.Ed25519.privateSeedBytes)
    expect(edSig.length).toBe(CLASSICAL_EDDSA_SIZES.Ed25519.signatureBytes)

    const xKeysA = x25519.keygen()
    const xKeysB = x25519.keygen()
    const shared = x25519.getSharedSecret(xKeysA.secretKey, xKeysB.publicKey)
    expect(xKeysA.publicKey.length).toBe(CLASSICAL_KEX_SIZES.X25519.publicKeyBytes)
    expect(xKeysA.secretKey.length).toBe(CLASSICAL_KEX_SIZES.X25519.privateKeyBytes)
    expect(shared.length).toBe(CLASSICAL_KEX_SIZES.X25519.sharedSecretBytes)
  })

  it('verifies all RFC 8554 / RFC 9858 LMS & HSS and RFC 8391 XMSS / XMSS^MT parameter formulas', () => {
    for (const spec of Object.values(STATEFUL_LMS_HSS_SIZES)) {
      const bare = computeBareLmsSizes(spec.m, spec.levelHeights[0], spec.w)
      const hss = computeHssSizes(spec.m, spec.levelHeights, spec.w)
      expect(spec.barePublicKeyBytes).toBe(bare.publicKeyBytes)
      expect(spec.bareSignatureBytes).toBe(bare.signatureBytes)
      expect(spec.hssPublicKeyBytes).toBe(hss.publicKeyBytes)
      expect(spec.hssSignatureBytes).toBe(hss.signatureBytes)
    }
    for (const spec of Object.values(STATEFUL_XMSS_SIZES)) {
      const computed = computeXmssSizes(spec.h, spec.d)
      expect(spec.publicKeyBytes).toBe(computed.publicKeyWithOidBytes)
      expect(spec.signatureBytes).toBe(computed.signatureBytes)
    }
  })

  it('verifies hybrid KEM and composite signature sizes equal exact component sums', () => {
    expect(HYBRID_KEM_OBJECT_SIZES.X25519MLKEM768.clientPublicKeyShareBytes).toBe(1184 + 32)
    expect(HYBRID_KEM_OBJECT_SIZES.X25519MLKEM768.serverCiphertextShareBytes).toBe(1088 + 32)
    expect(HYBRID_KEM_OBJECT_SIZES.SecP256r1MLKEM768.clientPublicKeyShareBytes).toBe(1184 + 65)
    expect(HYBRID_KEM_OBJECT_SIZES.SecP384r1MLKEM1024.clientPublicKeyShareBytes).toBe(1568 + 97)
    expect(HYBRID_KEM_OBJECT_SIZES.SecP384r1MLKEM1024.sharedSecretBytes).toBe(48 + 32)
    const composite = COMPOSITE_SIGNATURE_OBJECT_SIZES['ECDSA-P256+ML-DSA-44']
    // RFC 10073 Table 6 includes the SEC 1 prefix and a variable DER signature.
    expect(composite.uncompressedConcatenatedPublicKeyBytes).toBe(1377)
    expect(composite.derSignatureMaxConcatenatedBytes).toBe(2492)
  })
})

describe('Module size inventory and encoding verification', () => {
  const repoRoot = path.resolve(__dirname, '../..')
  const sourceInventoryPath = path.resolve(
    repoRoot,
    'src/data/verification/module-claim-inventory.json'
  )
  const verifiedOutputPath = path.resolve(
    repoRoot,
    '../backups/hub-4213/module-claim-inventory-304-verified.json'
  )

  it('keeps the expected size when offered a plausible size from a different encoding', () => {
    const inventory = JSON.parse(fs.readFileSync(sourceInventoryPath, 'utf8')) as {
      claims: InventoriedClaim[]
    }
    const alternateEncodingProbes = [
      { file: 'otaOrchestrationData.ts', line: 107, alternate: 65 },
      { file: 'mtcConstants.ts', line: 29, alternate: 256 },
      { file: 'secureBootConstants.ts', line: 419, alternate: 64 },
      { file: 'secureBootConstants.ts', line: 409, alternate: 2348 },
      { file: 'gatewayData.ts', line: 390, alternate: 33 },
      { file: 'gatewayData.ts', line: 418, alternate: 1376 },
      { file: 'gatewayData.ts', line: 419, alternate: 2484 },
    ]
    for (const probe of alternateEncodingProbes) {
      const claim = inventory.claims.find(
        (entry) => entry.file.endsWith(probe.file) && entry.line === probe.line
      )
      expect(claim, probe.file).toBeDefined()
      expect(verifyInventoriedClaim({ ...claim!, value: probe.alternate }).expected).toBe(
        claim!.value
      )
      expect(probe.alternate).not.toBe(claim!.value)
    }
  })

  it('checks source values against fixed encodings and separates illustrations from standard sizes', () => {
    const rawJson = JSON.parse(fs.readFileSync(sourceInventoryPath, 'utf-8')) as {
      scope: string
      counts: Record<string, number>
      claims: InventoriedClaim[]
    }

    expect(rawJson.claims).toHaveLength(304)

    const sourceValues = new Map<string, Map<string, number[]>>()
    const verifiedClaims = rawJson.claims.map((claim) => {
      let values = sourceValues.get(claim.file)
      if (!values) {
        const source = ts.createSourceFile(
          claim.file,
          fs.readFileSync(path.resolve(repoRoot, claim.file), 'utf8'),
          ts.ScriptTarget.Latest
        )
        const entries = new Map<string, number[]>()
        function visit(node: ts.Node) {
          if (ts.isPropertyAssignment(node) && ts.isNumericLiteral(node.initializer)) {
            const line = source.getLineAndCharacterOfPosition(node.name.getStart(source)).line + 1
            const key = `${line}:${node.name.getText(source)}`
            entries.set(key, [...(entries.get(key) ?? []), Number(node.initializer.text)])
          }
          ts.forEachChild(node, visit)
        }
        visit(source)
        values = entries
        sourceValues.set(claim.file, values)
      }
      expect(
        values.get(`${claim.line}:${claim.field}`),
        `${claim.file}:${claim.line} ${claim.field}`
      ).toEqual([claim.value])

      const resolved = verifyInventoriedClaim(claim)
      expect(
        resolved.value,
        `Claim ${claim.file}:${claim.line} (${claim.field}) value ${claim.value} !== oracle expected ${resolved.expected} (${resolved.source})`
      ).toBe(resolved.expected)
      const probe = verifyInventoriedClaim({ ...claim, value: claim.value + 1 })
      expect(
        probe.expected,
        `Size must be independent of the observed value in ${claim.file}:${claim.line}`
      ).toBe(resolved.expected)
      expect(probe.encodingScope).toBe(resolved.encodingScope)
      return resolved
    })

    const matchesOracleCount = verifiedClaims.filter(
      (c) => c.disposition === 'matches-independent-oracle'
    ).length
    const sizingExampleCount = verifiedClaims.filter(
      (c) => c.disposition === 'illustrative-sizing-example'
    ).length
    const implementationConstantCount = verifiedClaims.filter(
      (c) => c.disposition === 'implementation-constant'
    ).length

    expect(matchesOracleCount).toBe(296)
    expect(sizingExampleCount).toBe(6)
    expect(implementationConstantCount).toBe(2)

    if (fs.existsSync(path.resolve(repoRoot, '../backups'))) {
      fs.mkdirSync(path.dirname(verifiedOutputPath), { recursive: true })
      fs.writeFileSync(
        verifiedOutputPath,
        JSON.stringify(
          {
            scope:
              '304 inventoried source literals. The receipt distinguishes protocol and encoding checks, illustrative RSA private-key estimates and arithmetic constants.',
            counts: {
              'matches-independent-oracle': matchesOracleCount,
              'illustrative-sizing-example': sizingExampleCount,
              'implementation-constant': implementationConstantCount,
            },
            claims: verifiedClaims,
          },
          null,
          2
        ) + '\n',
        'utf-8'
      )
    }
  })
})
