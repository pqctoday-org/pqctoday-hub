// SPDX-License-Identifier: GPL-3.0-only

export interface ProductExtraction {
  platformName: string
  category: string
  productName: string
  productBrief: string
  pqcSupport: string
  pqcCapabilityDescription: string
  pqcMigrationPriority: string
  cryptoPrimitives: string
  keyManagementModel: string
  supportedBlockchains: string
  architectureType: string
  infrastructureLayer: string
  licenseType: string
  regulatoryStatus: string
  pqcRoadmapDetails: string
  consensusMechanism: string
  signatureSchemes: string
  authoritativeSourceUrl: string
  // v3/v4 dimensions
  implementationAttackSurface: string
  cryptoDiscovery: string
  testingValidation: string
  qkdProtocols: string
  qrngEntropy: string
  constrainedDeviceIoT: string
  supplyChainRisk: string
  deploymentComplexity: string
  financialBusinessImpact: string
  organizationalReadiness: string
}

interface RawExtraction {
  platform_name: string
  category: string
  product_name: string
  product_brief: string
  pqc_support: string
  pqc_capability_description: string
  pqc_migration_priority: string
  crypto_primitives: string
  key_management_model: string
  supported_blockchains: string
  architecture_type: string
  infrastructure_layer: string
  license_type: string
  regulatory_status: string
  pqc_roadmap_details: string
  consensus_mechanism: string
  signature_schemes: string
  authoritative_source_url: string
  implementation_attack_surface?: string
  cryptographic_discovery_inventory?: string
  testing_validation_methods?: string
  qkd_protocols_quantum_networking?: string
  qrng_entropy_sources?: string
  constrained_device_iot_suitability?: string
  supply_chain_vendor_risk?: string
  deployment_migration_complexity?: string
  financial_business_impact?: string
  organizational_readiness?: string
}

function mapRaw(raw: RawExtraction): ProductExtraction {
  return {
    platformName: raw.platform_name ?? '',
    category: raw.category ?? '',
    productName: raw.product_name ?? '',
    productBrief: raw.product_brief ?? '',
    pqcSupport: raw.pqc_support ?? '',
    pqcCapabilityDescription: raw.pqc_capability_description ?? '',
    pqcMigrationPriority: raw.pqc_migration_priority ?? '',
    cryptoPrimitives: raw.crypto_primitives ?? '',
    keyManagementModel: raw.key_management_model ?? '',
    supportedBlockchains: raw.supported_blockchains ?? '',
    architectureType: raw.architecture_type ?? '',
    infrastructureLayer: raw.infrastructure_layer ?? '',
    licenseType: raw.license_type ?? '',
    regulatoryStatus: raw.regulatory_status ?? '',
    pqcRoadmapDetails: raw.pqc_roadmap_details ?? '',
    consensusMechanism: raw.consensus_mechanism ?? '',
    signatureSchemes: raw.signature_schemes ?? '',
    authoritativeSourceUrl: raw.authoritative_source_url ?? '',
    // v3/v4 dimensions
    implementationAttackSurface: raw.implementation_attack_surface ?? '',
    cryptoDiscovery: raw.cryptographic_discovery_inventory ?? '',
    testingValidation: raw.testing_validation_methods ?? '',
    qkdProtocols: raw.qkd_protocols_quantum_networking ?? '',
    qrngEntropy: raw.qrng_entropy_sources ?? '',
    constrainedDeviceIoT: raw.constrained_device_iot_suitability ?? '',
    supplyChainRisk: raw.supply_chain_vendor_risk ?? '',
    deploymentComplexity: raw.deployment_migration_complexity ?? '',
    financialBusinessImpact: raw.financial_business_impact ?? '',
    organizationalReadiness: raw.organizational_readiness ?? '',
  }
}

// ---------------------------------------------------------------------------
// Auto-discover extraction JSON files via import.meta.glob
// ---------------------------------------------------------------------------

function loadExtractions(): Map<string, ProductExtraction> {
  const modules = import.meta.glob('./product-extractions/*_extractions_*.json', {
    eager: true,
  }) as Record<string, { default: RawExtraction[] }>

  const lookup = new Map<string, ProductExtraction>()

  for (const [, mod] of Object.entries(modules)) {
    const items = mod.default ?? mod
    if (!Array.isArray(items)) continue
    for (const raw of items as RawExtraction[]) {
      if (!raw.platform_name) continue
      const key = raw.platform_name.toLowerCase().trim()
      lookup.set(key, mapRaw(raw))
    }
  }

  return lookup
}

export const productExtractions: Map<string, ProductExtraction> = loadExtractions()

/** Case-insensitive lookup by softwareName (matches against platform_name) */
export function getProductExtraction(softwareName: string): ProductExtraction | undefined {
  return productExtractions.get(softwareName.toLowerCase().trim())
}
