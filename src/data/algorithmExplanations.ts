// SPDX-License-Identifier: AGPL-3.0-only
//
// Plain-language explanations for the algorithm families of the Industry
// Landscape lens (owner decision D6, 2026-11-12): every entry in the lens,
// algorithms included, gets a short explanation and a code-drawn diagram.
// Kept apart from cryptoMechanisms.ts so the algorithm vocabulary and its
// checks stay unchanged; a driftguard requires one entry per family.
// Wording states what each family does and what PQC changes for it, at the
// level the glossary entry (linked where one exists) already explains.

import type { DiagramSpec } from './cryptoConstructions'

export interface AlgorithmExplanation {
  plain: string
  whyItMattersForPqc: string
  glossaryTerm?: string
  diagram: DiagramSpec
}

const sign = (alg: string): DiagramSpec => ({
  inputs: ['message', 'private key'],
  combiner: `${alg} signing`,
  outputs: ['signature (checked with the public key)'],
})
const kem = (alg: string): DiagramSpec => ({
  inputs: ['recipient public key'],
  combiner: `${alg} encapsulation`,
  outputs: ['ciphertext', 'shared secret'],
})
const kex = (alg: string): DiagramSpec => ({
  inputs: ['my private key', 'peer public key'],
  combiner: alg,
  outputs: ['shared secret'],
})
const cipher = (alg: string): DiagramSpec => ({
  inputs: ['key', 'data'],
  combiner: alg,
  outputs: ['encrypted data'],
})

export const ALGORITHM_EXPLANATIONS: Record<string, AlgorithmExplanation> = {
  'RSA-sig': {
    plain:
      'RSA signatures prove who signed a document or certificate: the signer uses a private key, and anyone can check the signature with the matching public key.',
    whyItMattersForPqc:
      'A large quantum computer running Shor’s algorithm breaks RSA, so signatures move to ML-DSA, SLH-DSA or FN-DSA.',
    glossaryTerm: 'RSA',
    diagram: sign('RSA'),
  },
  'RSA-kex': {
    plain:
      'RSA key transport encrypts a secret key with the recipient’s RSA public key, so only the recipient can recover it. Older TLS, encrypted email and HSM key import use it.',
    whyItMattersForPqc:
      'Shor’s algorithm breaks RSA, so key transport moves to a KEM such as ML-KEM.',
    glossaryTerm: 'RSA',
    diagram: {
      inputs: ['recipient RSA public key', 'secret key'],
      combiner: 'RSA encryption',
      outputs: ['encrypted key'],
    },
  },
  ECDSA: {
    plain:
      'ECDSA is the elliptic-curve signature scheme used in many web certificates, in code signing and in many blockchains. It gives the same assurance as RSA with much smaller keys.',
    whyItMattersForPqc:
      'Elliptic-curve cryptography is also broken by Shor’s algorithm, so ECDSA signatures move to post-quantum signature schemes.',
    glossaryTerm: 'ECDSA',
    diagram: sign('ECDSA'),
  },
  ECDH: {
    plain:
      'Elliptic-curve Diffie-Hellman lets two parties each combine their own private key with the other’s public key and arrive at the same shared secret, without ever sending it.',
    whyItMattersForPqc:
      'A quantum computer can recover the secret from recorded traffic, so key exchange moves to ML-KEM, usually in a hybrid with ECDH first.',
    glossaryTerm: 'ECDH',
    diagram: kex('elliptic-curve Diffie-Hellman'),
  },
  FFDH: {
    plain:
      'Finite-field Diffie-Hellman is the original Diffie-Hellman key exchange over large prime numbers rather than elliptic curves, still used in some VPN and TLS configurations.',
    whyItMattersForPqc:
      'Shor’s algorithm breaks it in the same way as ECDH, so it also gives way to ML-KEM.',
    glossaryTerm: 'Diffie-Hellman',
    diagram: kex('finite-field Diffie-Hellman'),
  },
  X25519: {
    plain:
      'X25519 is a fast elliptic-curve Diffie-Hellman key exchange on Curve25519, widely used in TLS 1.3, SSH, Signal and WireGuard.',
    whyItMattersForPqc:
      'It is broken by a quantum computer; hybrids such as X25519MLKEM768 combine it with ML-KEM so the key stays safe if either part holds.',
    glossaryTerm: 'X25519',
    diagram: kex('X25519'),
  },
  EdDSA: {
    plain:
      'EdDSA (most often Ed25519) is a modern elliptic-curve signature scheme, used by SSH keys and by several blockchains for transaction signatures.',
    whyItMattersForPqc:
      'Like every elliptic-curve scheme, it is broken by Shor’s algorithm and needs a post-quantum successor.',
    glossaryTerm: 'EdDSA',
    diagram: sign('EdDSA'),
  },
  BLS: {
    plain:
      'BLS signatures, on the BLS12-381 curve, can be added together so that many signers produce one short signature. Ethereum’s validators rely on this.',
    whyItMattersForPqc:
      'They are pairing-based and broken by a quantum computer, and we found no standardised post-quantum scheme that aggregates the same way (checked 13 Nov 2026).',
    diagram: sign('BLS'),
  },
  Schnorr: {
    plain:
      'Schnorr signatures (such as sr25519 on Polkadot and BIP-340 on Bitcoin) are simple elliptic-curve signatures that combine well across several signers.',
    whyItMattersForPqc:
      'They are broken by a quantum computer; chains that use them have to change signature scheme to a post-quantum one.',
    diagram: sign('Schnorr'),
  },
  SM2: {
    plain:
      'SM2 is China’s national elliptic-curve public-key standard, covering signatures, key exchange and encryption, used in Chinese payment, TLS and identity systems.',
    whyItMattersForPqc:
      'As an elliptic-curve scheme it is broken by Shor’s algorithm and needs a post-quantum successor.',
    glossaryTerm: 'SM2',
    diagram: sign('SM2'),
  },
  SNOW3G: {
    plain:
      'SNOW 3G is a stream cipher that encrypts and protects the integrity of traffic on 3G, 4G and 5G radio links.',
    whyItMattersForPqc:
      'It is symmetric, so it is not broken by Shor’s algorithm; the mobile industry’s upgrade path is to 256-bit variants.',
    diagram: cipher('SNOW 3G'),
  },
  ZUC: {
    plain:
      'ZUC is a stream cipher used for confidentiality and integrity of 4G and 5G radio traffic, alongside SNOW 3G and AES.',
    whyItMattersForPqc: 'It is symmetric, so it stays; 3GPP’s uplift is a 256-bit version.',
    diagram: cipher('ZUC'),
  },
  'ML-KEM': {
    plain:
      'ML-KEM (FIPS 203) is NIST’s main post-quantum key encapsulation mechanism: the sender uses the recipient’s public key to create a ciphertext and a shared secret that only the recipient can recover.',
    whyItMattersForPqc:
      'It is the standard replacement for RSA key transport and Diffie-Hellman key exchange.',
    glossaryTerm: 'ML-KEM',
    diagram: kem('ML-KEM'),
  },
  'ML-DSA': {
    plain:
      'ML-DSA (FIPS 204) is NIST’s main post-quantum signature scheme, based on lattice problems, for certificates, code signing and authentication.',
    whyItMattersForPqc:
      'It is the general-purpose replacement for RSA and elliptic-curve signatures; its keys and signatures are larger.',
    glossaryTerm: 'ML-DSA',
    diagram: sign('ML-DSA'),
  },
  'SLH-DSA': {
    plain:
      'SLH-DSA (FIPS 205) is a post-quantum signature scheme built only from hash functions, so its security rests on very conservative assumptions.',
    whyItMattersForPqc:
      'It is a backup to ML-DSA with a different mathematical basis, at the cost of larger signatures.',
    glossaryTerm: 'SLH-DSA',
    diagram: sign('SLH-DSA'),
  },
  'FN-DSA': {
    plain:
      'FN-DSA (the Falcon scheme) is a lattice-based post-quantum signature with smaller signatures than ML-DSA; NIST is preparing it as FIPS 206, which had not been published as of 13 Nov 2026.',
    whyItMattersForPqc:
      'It suits places where signature size matters, such as certificates sent on every connection.',
    glossaryTerm: 'FN-DSA',
    diagram: sign('FN-DSA'),
  },
  HQC: {
    plain:
      'HQC is a code-based post-quantum key encapsulation mechanism that NIST selected as a second KEM, built on different mathematics from ML-KEM.',
    whyItMattersForPqc:
      'It gives a fallback if a weakness were ever found in ML-KEM’s lattice problem.',
    glossaryTerm: 'HQC',
    diagram: kem('HQC'),
  },
  FrodoKEM: {
    plain:
      'FrodoKEM is a conservative lattice-based KEM built on the plain learning-with-errors problem, with larger keys than ML-KEM.',
    whyItMattersForPqc:
      'Some European agencies recommend it for long-term protection because of its conservative assumptions.',
    glossaryTerm: 'FrodoKEM',
    diagram: kem('FrodoKEM'),
  },
  'Classic-McEliece': {
    plain:
      'Classic McEliece is a code-based KEM studied since 1978. Its ciphertexts are small but its public keys are very large.',
    whyItMattersForPqc:
      'It suits uses where the public key can be stored in advance, such as VPN peers, and is valued for its long track record.',
    glossaryTerm: 'Classic McEliece',
    diagram: kem('Classic McEliece'),
  },
  LMS: {
    plain:
      'LMS is a hash-based signature scheme for signing firmware and software updates. Each key can sign only a limited number of messages, and the signer must keep track of which ones it has used (HSS arranges LMS keys in layers to sign more).',
    whyItMattersForPqc:
      'It is already approved for post-quantum firmware signing, provided the signer manages its state carefully.',
    glossaryTerm: 'LMS',
    diagram: sign('LMS'),
  },
  XMSS: {
    plain:
      'XMSS is a stateful hash-based signature scheme, like LMS, used mainly for firmware and long-lived code signing.',
    whyItMattersForPqc:
      'It is quantum-resistant today, with the same need to track each signing key’s state.',
    glossaryTerm: 'XMSS',
    diagram: sign('XMSS'),
  },
  AES: {
    plain:
      'AES is the standard symmetric block cipher: the same secret key encrypts and decrypts. It protects almost all stored and transmitted data once a key has been agreed.',
    whyItMattersForPqc:
      'Quantum computers do not break it. Some guidance, such as NSA’s CNSA 2.0, requires 256-bit keys for long-term protection.',
    glossaryTerm: 'AES',
    diagram: cipher('AES'),
  },
  SHA: {
    plain:
      'SHA-2 and SHA-3 are hash functions: they turn any input into a short fingerprint that changes completely if the input changes. Signatures, key derivation and certificates all rely on them.',
    whyItMattersForPqc: 'They stay; the choice of output length depends on the security goal.',
    glossaryTerm: 'SHA-3',
    diagram: { inputs: ['data'], combiner: 'hash function', outputs: ['fixed-size digest'] },
  },
  ChaCha20: {
    plain:
      'ChaCha20 is a fast stream cipher, usually paired with the Poly1305 authenticator as ChaCha20-Poly1305 in TLS, SSH and WireGuard.',
    whyItMattersForPqc: 'It is symmetric with a 256-bit key, so it stays.',
    glossaryTerm: 'ChaCha20-Poly1305',
    diagram: cipher('ChaCha20'),
  },
  Ascon: {
    plain:
      'Ascon is NIST’s lightweight cryptography standard (SP 800-232) for small devices such as sensors, providing authenticated encryption and hashing.',
    whyItMattersForPqc: 'It is symmetric, so it stays.',
    glossaryTerm: 'Ascon',
    diagram: cipher('Ascon'),
  },
  '3DES': {
    plain:
      'Triple DES applies the old DES cipher three times. It is still found in payment systems, mostly in PIN and key management.',
    whyItMattersForPqc:
      'It is being retired for classical reasons (small block size), not because of quantum computers; payments are moving to AES.',
    diagram: cipher('Triple DES'),
  },
}
