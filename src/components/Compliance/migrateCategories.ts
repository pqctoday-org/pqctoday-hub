// SPDX-License-Identifier: GPL-3.0-only

export interface MigrateCategoryRef {
  categoryId: string
  categoryName: string
}

/**
 * Maps compliance cert record productCategory values to their equivalent
 * migrate CSC category. category_name values match exactly those in pqc_product_catalog CSV.
 * Unmapped values (too generic to categorise) return null and are excluded from the filter.
 * To support future localisation, translate only categoryName — categoryId is invariant.
 */
export const PRODUCT_CATEGORY_TO_MIGRATE: Record<string, MigrateCategoryRef> = {
  'Algorithm Implementation': { categoryId: 'CSC-001', categoryName: 'Cryptographic Libraries' },
  'Cryptographic Module': { categoryId: 'CSC-001', categoryName: 'Cryptographic Libraries' },
  Databases: { categoryId: 'CSC-007', categoryName: 'Database Encryption Software' },
  'Products for Digital Signatures': {
    categoryId: 'CSC-009',
    categoryName: 'Digital Signature Software',
  },
  Mobility: { categoryId: 'CSC-019', categoryName: 'Operating Systems & Platforms' },
  embarqué: { categoryId: 'CSC-026', categoryName: 'Secure Boot and Firmware Security' },
  'logiciel embarqué': {
    categoryId: 'CSC-026',
    categoryName: 'Secure Boot and Firmware Security',
  },
  'Operating Systems': { categoryId: 'CSC-031', categoryName: 'Operating Systems' },
  'Network and Network-Related Devices and Systems': {
    categoryId: 'CSC-033',
    categoryName: 'Network Security Software',
  },
  'Boundary Protection Devices and Systems': {
    categoryId: 'CSC-033',
    categoryName: 'Network Security Software',
  },
  'Detection Devices and Systems': {
    categoryId: 'CSC-033',
    categoryName: 'Network Security Software',
  },
  intrusions: { categoryId: 'CSC-033', categoryName: 'Network Security Software' },
  'ANSSI SYNACKTIV Pare-feu': {
    categoryId: 'CSC-033',
    categoryName: 'Network Security Software',
  },
  'GTS THALES Pare-feu': { categoryId: 'CSC-033', categoryName: 'Network Security Software' },
  'BULL OPPIDA Réseaux': { categoryId: 'CSC-048', categoryName: 'Network Encryptors' }, // BULL Trustway IP — network encryption appliance
  circuits: { categoryId: 'CSC-034', categoryName: 'Hardware Security & Semiconductors' },
  'Access Control Devices and Systems': {
    categoryId: 'CSC-042',
    categoryName: 'Identity & Access Management (IAM)',
  },
  'Biometric Systems and Devices': {
    categoryId: 'CSC-042',
    categoryName: 'Identity & Access Management (IAM)',
  },
  accès: { categoryId: 'CSC-042', categoryName: 'Identity & Access Management (IAM)' },
  'Data Protection': { categoryId: 'CSC-043', categoryName: 'Data Security & Protection' },
  'ANSSI SYNACKTIV Stockage sécurisé': {
    categoryId: 'CSC-053',
    categoryName: 'Secrets Management',
  }, // KeePassXC — password/secrets manager
  'D AMOSSYS Stockage sécurisé': {
    categoryId: 'CSC-043',
    categoryName: 'Data Security & Protection',
  },
  'FORECOMM SYNACKTIV Stockage sécurisé': {
    categoryId: 'CSC-043',
    categoryName: 'Data Security & Protection',
  },
  'GTS THALES Stockage sécurisé': {
    categoryId: 'CSC-043',
    categoryName: 'Data Security & Protection',
  },
  'O AMOSSYS stockage sécurisé': {
    categoryId: 'CSC-043',
    categoryName: 'Data Security & Protection',
  },
  'OPPIDA Stockage sécurisé': {
    categoryId: 'CSC-043',
    categoryName: 'Data Security & Protection',
  },
  'Trusted Computing': { categoryId: 'CSC-052', categoryName: 'Confidential Computing' },
  'ICs, Smart Cards and Smart Card-Related Devices and Systems': {
    categoryId: 'CSC-054',
    categoryName: 'Smart Cards & Secure Elements',
  },
  'Smartcard Controller': { categoryId: 'CSC-054', categoryName: 'Smart Cards & Secure Elements' },
  'Smartcards and similar devices': {
    categoryId: 'CSC-054',
    categoryName: 'Smart Cards & Secure Elements',
  },
  'smart card and similar device': {
    categoryId: 'CSC-054',
    categoryName: 'Smart Cards & Secure Elements',
  },
  'AMOSSYS Cartes à puce': {
    categoryId: 'CSC-043',
    categoryName: 'Data Security & Protection',
  }, // Blancco Driver Eraser — data erasure software (not a smart card product despite the label)
  // Previously unmapped — assigned from vendor/product evidence
  'Certified Product': {
    categoryId: 'CSC-054',
    categoryName: 'Smart Cards & Secure Elements',
  }, // eMRTD/SSCD smart card products (IDEMIA, INFINEON, AUSTRIA CARD)
  'Other Devices and Systems': {
    categoryId: 'CSC-039',
    categoryName: 'IoT Security',
  }, // Smart TVs and connected devices (Samsung Knox, LG webOS)
  'Multi-Function Devices': {
    categoryId: 'CSC-043',
    categoryName: 'Data Security & Protection',
  }, // Printers/MFPs evaluated for document data security (HP, Kyocera, Xerox)
  'Generic software and network products': {
    categoryId: 'CSC-033',
    categoryName: 'Network Security Software',
  }, // Cisco Nexus switches, Huawei routers
  'APPLE THALES Autres': {
    categoryId: 'CSC-029',
    categoryName: 'Payment Cryptography Systems',
  }, // Apple Pay products (Vision Pro, Mac Mini)
  'ERMA Divers': {
    categoryId: 'CSC-002',
    categoryName: 'Hardware Security Module (HSM) Software',
  }, // BULL TrustWay Proteccio HSM
  'IDEMIA AMOSSYS Logiciels': {
    categoryId: 'CSC-054',
    categoryName: 'Smart Cards & Secure Elements',
  }, // IDEMIA smart card OS
  'LINK OPPIDA Logiciels': {
    categoryId: 'CSC-011',
    categoryName: 'Secure Messaging and Communication',
  }, // EHO.LINK secure communication platform
  'THALES DIS CEA LETI Logiciels': {
    categoryId: 'CSC-054',
    categoryName: 'Smart Cards & Secure Elements',
  }, // THALES DIS (digital identity/smart card division) — SIRIUS_AA_01
  sécurisée: {
    categoryId: 'CSC-011',
    categoryName: 'Secure Messaging and Communication',
  }, // APIZEE video comm, HUAWEI, VirtualBrowser — all "Communication" type
  sécurité: {
    categoryId: 'CSC-041',
    categoryName: 'Certificate Lifecycle Management',
  }, // Security admin/PKI tools — "Administration et supervision de la sécurité" (EVERTRUST STREAM = CLM)
}

export function getMigrateCategory(productCategory: string): MigrateCategoryRef | null {
  return PRODUCT_CATEGORY_TO_MIGRATE[productCategory] ?? null
}
