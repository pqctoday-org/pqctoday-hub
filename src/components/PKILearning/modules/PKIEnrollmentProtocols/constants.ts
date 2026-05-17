// SPDX-License-Identifier: GPL-3.0-only
import { KeyRound, Send, RefreshCw, Layers, Inbox, FileSearch } from 'lucide-react'

export const MODULE_ID = 'pki-enrollment-protocols'

export interface WorkshopStep {
  id: string
  title: string
  description: string
  icon: typeof KeyRound
}

export const WORKSHOP_STEPS: WorkshopStep[] = [
  {
    id: 'keygen',
    title: 'Step 1: Generate End-Entity Key',
    description: 'Create an ML-DSA-65 keypair on the in-browser softHSM (PKCS#11 v3.2).',
    icon: KeyRound,
  },
  {
    id: 'cmp-ir',
    title: 'Step 2: CMP Initial Request (ir)',
    description:
      'Drive `openssl cmp -cmd ir` against the in-WASM mock CA to obtain an ML-DSA-65 X.509 cert.',
    icon: Send,
  },
  {
    id: 'est-enroll',
    title: 'Step 3: EST simpleenroll',
    description:
      'POST a PKCS#10 CSR to a simulated /.well-known/est/simpleenroll endpoint (RFC 7030).',
    icon: Inbox,
  },
  {
    id: 'cmp-kur',
    title: 'Step 4: CMP Key Update with ML-KEM',
    description: 'Rotate to an ML-KEM-768 key using CMP KUR encrCert POP (RFC 9810).',
    icon: RefreshCw,
  },
  {
    id: 'composite',
    title: 'Step 5: Composite Enrollment',
    description:
      'Issue a composite ML-DSA-65 + ECDSA-P256 cert (draft-ietf-lamps-pq-composite-sigs).',
    icon: Layers,
  },
  {
    id: 'cert-viewer',
    title: 'Step 6: Inspect Issued Certificate',
    description: 'Decode the issued cert with `openssl x509 -text -noout` and validate the chain.',
    icon: FileSearch,
  },
]

export const CA_ROOT_KEY_PATH = '/ca.key.pem'
export const CA_ROOT_CERT_PATH = '/ca.cert.pem'
export const EE_KEY_PATH = '/ee.key.pem'
export const EE_CERT_PATH = '/ee.cert.pem'

/** ML-DSA-65 — OpenSSL 3.5+ genpkey identifier */
export const ML_DSA_ALG = 'ML-DSA-65'
/** ML-KEM-768 — OpenSSL 3.5+ genpkey identifier */
export const ML_KEM_ALG = 'ML-KEM-768'
