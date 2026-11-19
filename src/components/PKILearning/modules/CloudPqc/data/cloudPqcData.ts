// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Late-2026 multi-cloud & SaaS PQC reference data for CloudPqc (LM-080).
 * Educational sample scenarios and provider capability metadata.
 * Always verify live regional/tier availability in provider documentation and APIs.
 */

export type CloudProviderId = 'aws' | 'azure' | 'gcp' | 'saas'
export type ControlOwner = 'customer' | 'shared' | 'provider'
export type CapabilityStatus = 'ga' | 'preview' | 'verify-in-region'

export interface CloudWorkloadSurface {
  id: string
  layer: string
  serviceExample: string
  protectedAsset: string
  owner: ControlOwner
  cryptoMechanism: string
  hndlUrgency: 'high' | 'medium' | 'low'
  customerActions: string[]
  providerResponsibility: string
  verificationEvidence: string
  commonMistake: string
}

export interface ProviderCapabilityRow {
  id: string
  provider: 'aws' | 'azure' | 'gcp'
  providerLabel: string
  layer: 'edge-tls' | 'kms-signing' | 'kms-kem' | 'byok-import' | 'hsm'
  layerLabel: string
  service: string
  status: CapabilityStatus
  statusLabel: string
  summary: string
  regionalOrTierCaveat: string
  verificationCommand: string
  evidenceToCollect: string
}

export interface CutoverFailureMode {
  id: string
  title: string
  layer: string
  severity: 'high' | 'medium'
  symptom: string
  rootCause: string
  sampleTelemetry: string
  mitigation: string
  rollbackTrigger: string
  productionCheck: string
}

export interface CutoverPhase {
  phase: number
  title: string
  goal: string
  gateCriteria: string
  ownerRoles: string
}

export interface SaasChecklistItem {
  id: string
  domain: 'transport' | 'kms-byok' | 'federation' | 'governance'
  domainLabel: string
  question: string
  whyItMatters: string
  drivers: string[]
  evidenceRequest: string
}

export const CLOUD_WORKLOAD_SURFACES: CloudWorkloadSurface[] = [
  {
    id: 'edge-cdn',
    layer: 'Edge / CDN & Load Balancers',
    serviceExample: 'CloudFront / ALB, Azure Front Door, GCP Cloud Load Balancing',
    protectedAsset:
      'External customer session payloads and API request/response streams in transit',
    owner: 'shared',
    cryptoMechanism: 'TLS 1.3 hybrid key exchange (X25519MLKEM768, RFC 10024 codepoint 0x11EC)',
    hndlUrgency: 'high',
    customerActions: [
      'Select a TLS 1.3 security policy that enables X25519MLKEM768 on every public listener.',
      'Verify the CDN-to-origin leg separately; edge hybrid TLS does not upgrade origin TLS.',
      'Test for middlebox or WAF ClientHello truncation before broad cutover.',
    ],
    providerResponsibility:
      'Maintains TLS library implementation, NamedGroup codepoints, and edge POP termination hardware.',
    verificationEvidence:
      'Active TLS handshake capture (openssl s_client / tshark) showing negotiated group X25519MLKEM768 (0x11EC) on both edge and origin legs.',
    commonMistake:
      'Assuming a green CDN dashboard means end-to-end hybrid TLS when the origin load balancer still negotiates classical X25519 or P-256.',
  },
  {
    id: 'api-gateway',
    layer: 'API Gateway & Service Mesh',
    serviceExample: 'AWS API Gateway, Azure APIM, Apigee, Envoy / Istio east-west mTLS',
    protectedAsset:
      'Inter-service authentication tokens, customer PII, and partner B2B API payloads',
    owner: 'customer',
    cryptoMechanism:
      'TLS 1.3 hybrid key exchange + X.509 mTLS certificates (transitioning toward ML-DSA)',
    hndlUrgency: 'high',
    customerActions: [
      'Audit custom domain TLS policies on API gateways and ingress controllers.',
      'Upgrade Envoy/ingress runtime versions and verify east-west mTLS cipher/group telemetry.',
      'Check header and certificate size budgets before introducing ML-DSA leaf certificates.',
    ],
    providerResponsibility:
      'Provides managed gateway endpoints and supported TLS policy profiles for managed tiers.',
    verificationEvidence:
      'Gateway access logs and Envoy TLS telemetry showing negotiated NamedGroup and protocol version per route.',
    commonMistake:
      'Migrating north-south ingress while leaving east-west cross-AZ or cross-region traffic on classical TLS 1.2.',
  },
  {
    id: 'kms-hsm',
    layer: 'Cloud KMS & Cloud HSM',
    serviceExample: 'AWS KMS / CloudHSM, GCP Cloud KMS, Azure Key Vault / Managed HSM',
    protectedAsset:
      'Root KEKs, data-encryption key wrappers, and long-lived software/document signing keys',
    owner: 'shared',
    cryptoMechanism: 'ML-DSA (FIPS 204), SLH-DSA (FIPS 205), ML-KEM (FIPS 203), AES-256-GCM DEKs',
    hndlUrgency: 'medium',
    customerActions: [
      'Select PQC key specs where supported and enforce kms:KeySpec / IAM guardrails on key creation.',
      'Verify BYOK import wrapping mechanics (RSA-only vs. HPKE Preview) before claiming quantum-safe key transport.',
      'Confirm FIPS 140-3 CMVP validation status per region and cluster type.',
    ],
    providerResponsibility:
      'Operates underlying HSM modules, firmware validation, and KMS API endpoints.',
    verificationEvidence:
      'KMS key metadata export (DescribeKey / key version properties), IAM policy checks, and CloudTrail tlsDetails.keyExchange logs.',
    commonMistake:
      'Assuming a KMS key policy can force hybrid post-quantum TLS to the KMS API (TLS group selection is a client SDK/runtime setting).',
  },
  {
    id: 'object-storage',
    layer: 'Object Storage & Archiving Service',
    serviceExample:
      'Amazon S3 SSE-KMS, Azure Blob Storage CMK, GCS CMEK (records archiving service)',
    protectedAsset:
      'Long-lived encrypted records (financial, health, legal archives retained 7–30+ years)',
    owner: 'shared',
    cryptoMechanism:
      'AES-256 symmetric data encryption (quantum-resistant) + KMS KEK wrapping + TLS transport',
    hndlUrgency: 'high',
    customerActions: [
      'Distinguish the archiving service from the protected long-lived records it stores.',
      'Verify AES-256 encryption at rest and enforce hybrid PQ TLS on client uploads/downloads to prevent HNDL capture in transit.',
      'Plan KMS KEK rotation and re-wrapping for customer-managed keys when PQC wrapping is adopted.',
    ],
    providerResponsibility:
      'Manages storage media encryption, service-side AES-256 execution, and KMS integration plumbing.',
    verificationEvidence:
      'Bucket encryption policy audit (SSE-KMS / CMEK), client SDK TLS group telemetry, and retention classification mapping.',
    commonMistake:
      'Treating the records themselves as the "service" or assuming AES-256 at rest protects records captured in transit over classical TLS.',
  },
  {
    id: 'iam-oidc',
    layer: 'IAM, OIDC & SAML Federation',
    serviceExample: 'Microsoft Entra ID, Okta, AWS IAM Identity Center, Google Cloud Identity',
    protectedAsset: 'Federated identity assertions, session tokens, and cross-account trust chains',
    owner: 'provider',
    cryptoMechanism: 'JWT/JWS (RS256/ES256 today; ML-DSA roadmap) and SAML XMLDSig',
    hndlUrgency: 'low',
    customerActions: [
      'Inventory every IdP, JWKS endpoint, and SAML metadata trust anchor.',
      'Verify whether relying-party libraries and WAF header limits can accept larger PQC-signed tokens.',
      'Track IdP vendor PQC signing roadmaps; do not confuse TLS transport PQC with token-signing PQC.',
    ],
    providerResponsibility:
      'Generates IdP signing keys, publishes JWKS/SAML metadata, and introduces PQC JWS/XMLDSig support.',
    verificationEvidence:
      'IdP JWKS inspection, relying-party library inventory, and vendor PQC roadmap statement with target milestones.',
    commonMistake:
      'Prioritizing short-lived OIDC access-token signing ahead of high-HNDL TLS transport, or ignoring HTTP header size limits for larger ML-DSA JWTs.',
  },
  {
    id: 'saas-apps',
    layer: 'Third-Party SaaS Applications',
    serviceExample: 'CRM, ERP, HRIS, ticketing, analytics, and managed observability platforms',
    protectedAsset:
      'Regulated customer data, HR records, and intellectual property processed by SaaS vendors',
    owner: 'provider',
    cryptoMechanism:
      'Vendor-managed TLS ingress, SaaS-managed or BYOK encryption, subprocessor links',
    hndlUrgency: 'high',
    customerActions: [
      'Classify SaaS tenants by data sensitivity and retention horizon.',
      'Request verifiable evidence (negotiated TLS NamedGroup, BYOK scope, FIPS 140-3 cert IDs, subprocessor PQC status).',
      'Treat unanswered vendor questionnaires as unverified exposure, never as low risk.',
    ],
    providerResponsibility:
      'Controls application TLS termination, internal service-to-service crypto, database encryption, and subprocessor contracts.',
    verificationEvidence:
      'Independent TLS probe of SaaS public endpoints, signed vendor CBOM/attestation, and BYOK key-revocation test records.',
    commonMistake:
      'Accepting a marketing "quantum-ready" statement without checking whether public endpoints negotiate X25519MLKEM768 or whether BYOK covers backups and search indexes.',
  },
]

export const PROVIDER_CAPABILITY_MATRIX: ProviderCapabilityRow[] = [
  {
    id: 'aws-edge-tls',
    provider: 'aws',
    providerLabel: 'AWS',
    layer: 'edge-tls',
    layerLabel: 'Edge & API TLS',
    service: 'CloudFront, ALB, API Gateway & AWS KMS Endpoints',
    status: 'ga',
    statusLabel: 'GA (verify policy & region)',
    summary:
      'Hybrid post-quantum key exchange X25519MLKEM768 (RFC 10024, 0x11EC) is supported on CloudFront, ALB TLS 1.3 policies, and AWS KMS endpoints (listed on FIPS and non-FIPS endpoints in commercial Regions).',
    regionalOrTierCaveat:
      'AWS pages differ on the edges: Infrastructure security in AWS KMS notes hybrid PQ TLS is supported in all Regions except China Regions and is not supported on AWS GovCloud (US) FIPS endpoints. Always verify your exact endpoint and Region.',
    verificationCommand:
      'openssl s_client -connect <endpoint>:443 -tls1_3 -groups X25519MLKEM768:X25519 -brief',
    evidenceToCollect:
      'Negotiated group output (X25519MLKEM768) plus CloudTrail tlsDetails.keyExchange records for KMS API calls.',
  },
  {
    id: 'aws-kms-mldsa',
    provider: 'aws',
    providerLabel: 'AWS',
    layer: 'kms-signing',
    layerLabel: 'KMS Signing',
    service: 'AWS KMS (ML_DSA_44, ML_DSA_65, ML_DSA_87)',
    status: 'ga',
    statusLabel: 'GA (since June 2025)',
    summary:
      'AWS KMS offers FIPS 204 ML-DSA signing keys (ML_DSA_44, ML_DSA_65, ML_DSA_87) backed by FIPS 140-3 Level 3 validated HSMs.',
    regionalOrTierCaveat:
      'Key policy must constrain kms:KeySpec and kms:KeyUsage (SIGN_VERIFY) on CreateKey; no key policy condition can require post-quantum TLS.',
    verificationCommand:
      'aws kms describe-key --key-id <key-arn> --query "KeyMetadata.{KeySpec:KeySpec,KeyUsage:KeyUsage,Origin:Origin}"',
    evidenceToCollect:
      'DescribeKey output confirming ML_DSA_* KeySpec and IAM/key-policy review confirming classical CreateKey paths are restricted.',
  },
  {
    id: 'aws-kms-mlkem',
    provider: 'aws',
    providerLabel: 'AWS',
    layer: 'kms-kem',
    layerLabel: 'KMS Key Encapsulation',
    service: 'AWS KMS (ML_KEM_512, ML_KEM_768, ML_KEM_1024)',
    status: 'ga',
    statusLabel: 'GA (launched 26 Oct 2026)',
    summary:
      'AWS KMS supports ML-KEM key-establishment keys (Encapsulate / Decapsulate) in commercial and US GovCloud Regions. AWS KMS has no KMIP endpoint, and Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application.',
    regionalOrTierCaveat:
      'Not available in the China, Middle East (UAE), and Middle East (Bahrain) Regions. Application code must handle the returned 32-byte shared secret safely in memory.',
    verificationCommand:
      'aws kms create-key --key-spec ML_KEM_768 --key-usage KEY_AGREEMENT --region us-east-1 --dry-run',
    evidenceToCollect:
      'Regional availability verification, KeySpec audit, and application memory-handling review for Decapsulate callers.',
  },
  {
    id: 'aws-kms-byok',
    provider: 'aws',
    providerLabel: 'AWS',
    layer: 'byok-import',
    layerLabel: 'BYOK / Key Import',
    service: 'AWS KMS External Key Material Import',
    status: 'verify-in-region',
    statusLabel: 'RSA-Only Wrap (Constraint)',
    summary:
      'AWS KMS imports key material under an RSA wrapping key (RSA_2048, RSA_3072, or RSA_4096), or an SM2 wrapping key in the China Regions, and cannot import key material into ML-DSA or ML-KEM KMS keys.',
    regionalOrTierCaveat:
      'Even when the ImportKeyMaterial API call rides hybrid PQ TLS, the wrapping layer itself remains classical RSA.',
    verificationCommand:
      'aws kms get-parameters-for-import --key-id <key-id> --wrapping-algorithm RSA_AES_KEY_WRAP_SHA_256 --wrapping-key-spec RSA_4096',
    evidenceToCollect:
      'Documented risk acceptance or compensating controls for classical BYOK transport wrapping; verify Origin=EXTERNAL vs. AWS_KMS.',
  },
  {
    id: 'aws-cloudhsm',
    provider: 'aws',
    providerLabel: 'AWS',
    layer: 'hsm',
    layerLabel: 'Dedicated Cloud HSM',
    service: 'AWS CloudHSM (hsm2m.medium)',
    status: 'verify-in-region',
    statusLabel: 'ML-DSA Only (No ML-KEM)',
    summary:
      'AWS CloudHSM documents ML-DSA key generation and signing (in FIPS mode on hsm2m.medium clusters from 1 September 2026), but documents no ML-KEM command.',
    regionalOrTierCaveat:
      'Verify cluster instance type (hsm2m.medium) and active FIPS 140-3 firmware level; do not plan CloudHSM-native ML-KEM until documented.',
    verificationCommand:
      'aws cloudhsmv2 describe-clusters --query "Clusters[].{Id:ClusterId,HsmType:HsmType,Mode:Mode}"',
    evidenceToCollect:
      'Cluster description confirming hsm2m.medium and FIPS mode, plus PKCS#11 mechanism list from the deployed client SDK.',
  },
  {
    id: 'gcp-edge-tls',
    provider: 'gcp',
    providerLabel: 'GCP',
    layer: 'edge-tls',
    layerLabel: 'Edge & API TLS',
    service: 'Cloud Load Balancing & Cloud Armor',
    status: 'ga',
    statusLabel: 'GA (verify SSL policy)',
    summary:
      'Google Cloud Load Balancing supports TLS 1.3 hybrid post-quantum key exchange (X25519MLKEM768) on modern SSL policies.',
    regionalOrTierCaveat:
      'Custom or legacy SSL policies pinned to TLS 1.2 or restricted cipher profiles will bypass hybrid key exchange.',
    verificationCommand:
      'gcloud compute ssl-policies describe <policy-name> --format="yaml(profile,minTlsVersion,enabledFeatures)"',
    evidenceToCollect:
      'SSL policy export plus external TLS probe confirming X25519MLKEM768 negotiation on the load balancer VIP.',
  },
  {
    id: 'gcp-kms-signing',
    provider: 'gcp',
    providerLabel: 'GCP',
    layer: 'kms-signing',
    layerLabel: 'KMS Signing',
    service: 'Google Cloud KMS (ML-DSA & SLH-DSA)',
    status: 'ga',
    statusLabel: 'GA (since July 2026)',
    summary:
      'Google Cloud KMS offers generally available FIPS 204 ML-DSA and FIPS 205 SLH-DSA signing algorithms (GA since 16 July 2026).',
    regionalOrTierCaveat:
      'Confirm protection level (SOFTWARE vs. HSM) and target location support before provisioning production key rings.',
    verificationCommand:
      'gcloud kms keys versions describe 1 --key <key> --keyring <ring> --location <loc> --format="value(algorithm,protectionLevel)"',
    evidenceToCollect:
      'Key version metadata showing PQ_SIGN_ML_DSA_* or PQ_SIGN_SLH_DSA_* and protection level.',
  },
  {
    id: 'gcp-kms-kem',
    provider: 'gcp',
    providerLabel: 'GCP',
    layer: 'kms-kem',
    layerLabel: 'KMS Key Encapsulation',
    service: 'Google Cloud KMS (ML-KEM & X-Wing)',
    status: 'verify-in-region',
    statusLabel: 'Verify GA vs. Preview',
    summary:
      'Google Cloud KMS exposes ML-KEM and X-Wing key-encapsulation algorithms. Check current status carefully: Google’s July 2026 announcement describes ML-KEM GA while Cloud KMS release notes have listed ML-KEM and X-Wing in Preview.',
    regionalOrTierCaveat:
      'Confirm SLA, protection level, and regional availability directly in the target GCP project before production cutover.',
    verificationCommand:
      'gcloud kms keys list --keyring <ring> --location <loc> --format="table(name,purpose,versionTemplate.algorithm)"',
    evidenceToCollect:
      'Live project test of key creation and encapsulation in the target region plus current Google Cloud KMS release-note snapshot.',
  },
  {
    id: 'gcp-kms-byok',
    provider: 'gcp',
    providerLabel: 'GCP',
    layer: 'byok-import',
    layerLabel: 'BYOK / Key Import',
    service: 'Google Cloud KMS Quantum-Safe Key Import (HPKE)',
    status: 'preview',
    statusLabel: 'Preview (Software Keys)',
    summary:
      'Google Cloud KMS quantum-safe key import wraps imported key material with HPKE (RFC 9180) using X-Wing, ML-KEM-768, or ML-KEM-1024 with HKDF-SHA256 and AES-256-GCM. Standard Cloud KMS key import uses RSA-based wrapping.',
    regionalOrTierCaveat:
      'Quantum-safe HPKE import is in Preview and covers software-protected keys only; verify HSM-backed import requirements separately.',
    verificationCommand:
      'gcloud kms import-jobs describe <job-id> --keyring <ring> --location <loc> --format="yaml(importMethod,protectionLevel,state)"',
    evidenceToCollect:
      'Import job descriptor confirming HPKE import method (where eligible) or documented classical RSA wrap boundary.',
  },
  {
    id: 'azure-edge-tls',
    provider: 'azure',
    providerLabel: 'Azure',
    layer: 'edge-tls',
    layerLabel: 'Edge & API TLS',
    service: 'Azure Front Door & Application Gateway',
    status: 'verify-in-region',
    statusLabel: 'Verify Policy & Tier',
    summary:
      'Azure Front Door and Application Gateway support TLS 1.3 policies; verify hybrid X25519MLKEM768 negotiation per SKU, region, and custom TLS policy.',
    regionalOrTierCaveat:
      'Predefined TLS 1.2 policies or legacy Application Gateway v1/custom policies will not negotiate TLS 1.3 hybrid groups.',
    verificationCommand:
      'az network application-gateway ssl-policy show --gateway-name <gw> --resource-group <rg> --query "{PolicyType:policyType,PolicyName:policyName,MinProtocolVersion:minProtocolVersion}"',
    evidenceToCollect:
      'SSL policy configuration export combined with an active TLS 1.3 NamedGroup probe against the public VIP.',
  },
  {
    id: 'azure-kv-byok',
    provider: 'azure',
    providerLabel: 'Azure',
    layer: 'byok-import',
    layerLabel: 'BYOK / Key Import',
    service: 'Azure Key Vault & Managed HSM BYOK',
    status: 'verify-in-region',
    statusLabel: 'RSA-HSM Wrap (No KMIP)',
    summary:
      'Azure Key Vault BYOK transfers a key wrapped with CKM_RSA_AES_KEY_WRAP under an RSA-HSM key exchange key of 2048, 3072, or 4096 bits. No KMIP endpoint is documented for Azure Key Vault.',
    regionalOrTierCaveat:
      'Track Azure Key Vault / Managed HSM release notes for PQC key-type GA per region; verify FIPS 140-3 validation status for Managed HSM pools.',
    verificationCommand:
      'az keyvault show --name <vault-name> --query "{Sku:properties.sku.name,EnablePurgeProtection:properties.enablePurgeProtection}"',
    evidenceToCollect:
      'Vault/Managed HSM tier audit, BYOK transfer ceremony log (KEK size and wrapping mechanism), and current Microsoft PQC roadmap evidence.',
  },
]

export const CUTOVER_FAILURE_MODES: CutoverFailureMode[] = [
  {
    id: 'middlebox-truncation',
    title: 'Middlebox ClientHello Truncation',
    layer: 'Edge / WAF / Enterprise Proxy',
    severity: 'high',
    symptom:
      'TLS 1.3 handshakes with X25519MLKEM768 stall or reset after ClientHello on specific partner networks or legacy inline appliances.',
    rootCause:
      'An X25519MLKEM768 key_share adds ~1,216 bytes (32-byte X25519 + 1,184-byte ML-KEM-768 public key) to ClientHello, pushing it across two TCP segments (~1,460-byte MSS). Legacy DPI middleboxes that expect single-packet ClientHello messages drop or reset the connection.',
    sampleTelemetry:
      'SYN -> SYN-ACK -> ClientHello (1,682 bytes, 2 TCP segments) -> TCP RST from inline inspection appliance (timeout 3000ms).',
    mitigation:
      'Run canary probes from representative client/partner networks, update inline WAF/proxy firmware to RFC 9846/10024 multi-segment ClientHello parsing, and keep X25519 fallback enabled during staged rollout.',
    rollbackTrigger:
      'Handshake failure rate increases >0.5% on canary VIP or partner synthetic probe fails 3 consecutive cycles.',
    productionCheck:
      'Verify multi-segment ClientHello handling in staging with openssl s_client -groups X25519MLKEM768 across every inline firewall/WAF path.',
  },
  {
    id: 'edge-origin-mismatch',
    title: 'Edge-Leg Hybrid vs. Origin-Leg Classical Mismatch',
    layer: 'CDN -> Origin Load Balancer',
    severity: 'high',
    symptom:
      'External browsers negotiate X25519MLKEM768 with the CDN, so external scanners report "PQC enabled", while CDN-to-origin traffic over public backbone links remains classical X25519 or TLS 1.2.',
    rootCause:
      'CDN edge TLS policies and origin-connection TLS policies are configured independently; teams upgrade the public listener but forget the origin pool or API gateway upstream.',
    sampleTelemetry:
      'Edge POP log: tls_group=0x11EC (X25519MLKEM768) | Origin ALB log: tls_protocol=TLSv1.3, tls_group=0x001D (X25519 classical-only).',
    mitigation:
      'Audit both legs as separate cryptographic surfaces in your CBOM/posture registry, upgrade origin listeners to TLS 1.3 hybrid policies, and alert on classical-only origin negotiations.',
    rollbackTrigger: 'Origin 502/525 TLS handshake errors after switching origin TLS policy.',
    productionCheck:
      'Compare edge access logs against origin load-balancer TLS logs for the same request trace ID.',
  },
  {
    id: 'rsa-byok-constraint',
    title: 'RSA-Only BYOK Import Boundary',
    layer: 'On-Prem HSM -> Cloud KMS',
    severity: 'medium',
    symptom:
      'Architecture documentation claims "end-to-end quantum-safe BYOK", but audit reveals the key-import ceremony wraps customer keys under a classical RSA-4096 KEK.',
    rootCause:
      'AWS KMS import wrapping is RSA-only (RSA_2048/3072/4096, or SM2 in China Regions) and Azure Key Vault BYOK uses CKM_RSA_AES_KEY_WRAP under an RSA-HSM KEK. Only Google Cloud KMS offers a Preview HPKE quantum-safe import path (software-protected keys).',
    sampleTelemetry:
      'AWS CloudTrail ImportKeyMaterial: tlsDetails.keyExchange=X25519MLKEM768, requestParameters.wrappingAlgorithm=RSA_AES_KEY_WRAP_SHA_256.',
    mitigation:
      'Document the exact transport vs. wrapping boundary: hybrid PQ TLS protects the API call in transit, while the RSA wrap remains classical. Evaluate cloud-native KMS key generation vs. BYOK risk trade-offs and track provider HPKE/ML-KEM import updates.',
    rollbackTrigger:
      'Compliance audit flags undocumented classical wrapping in a regulated BYOK workflow.',
    productionCheck:
      'Inspect GetParametersForImport / Azure BYOK ceremony logs and verify whether Origin=EXTERNAL keys rely on classical wrapping.',
  },
  {
    id: 'fips-140-2-historical',
    title: 'FIPS 140-2 Historical Transition (Sept 2026)',
    layer: 'Cloud KMS / HSM Compliance',
    severity: 'medium',
    symptom:
      'Procurement or federal/regulated audit rejects a cloud workload whose cryptographic module relies on a FIPS 140-2 certificate moved to Historical status in September 2026.',
    rootCause:
      'NIST CMVP moved FIPS 140-2 certificates to Historical status in September 2026. Legacy cloud HSM clusters, older container crypto modules, or unverified regional endpoints may still reference Historical FIPS 140-2 validations rather than active FIPS 140-3 certificates.',
    sampleTelemetry:
      'Compliance scan: cluster=hsm1.medium (legacy FIPS 140-2 Historical) vs. required hsm2m.medium / FIPS 140-3 validated module.',
    mitigation:
      'Map every cloud KMS/HSM endpoint and container FIPS module to its active CMVP FIPS 140-3 certificate number and Security Policy; migrate legacy HSM clusters before audit deadlines.',
    rollbackTrigger:
      'Workload fails FIPS-mode self-test after upgrading base image or HSM client library.',
    productionCheck:
      'Cross-check deployed cloud KMS/HSM module versions and container FIPS providers against the live NIST CMVP validated module list.',
  },
]

export const CUTOVER_PHASES: CutoverPhase[] = [
  {
    phase: 1,
    title: 'Inventory & Surface Split',
    goal: 'Classify every cloud listener, origin leg, KMS key, BYOK flow, and SaaS tenant by control owner and protected-asset retention.',
    gateCriteria:
      '100% of external VIPs and long-lived data stores mapped; no unknown origin-leg TLS policies.',
    ownerRoles: 'Security Architect + Platform Ops',
  },
  {
    phase: 2,
    title: 'Canary Edge & Origin TLS',
    goal: 'Enable X25519MLKEM768 on staging and canary public listeners plus origin legs; validate middlebox ClientHello handling.',
    gateCriteria:
      'Zero middlebox handshake regressions (<0.5% error delta) and verified 0x11EC telemetry on both legs.',
    ownerRoles: 'IT Ops / DevOps + Network Eng',
  },
  {
    phase: 3,
    title: 'KMS Key Specs, Guardrails & FIPS 140-3',
    goal: 'Enable PQC signing/KEM specs in target regions, enforce IAM CreateKey guardrails, document BYOK boundaries, and verify FIPS 140-3 certificates.',
    gateCriteria:
      'IAM/policy guardrails tested; CloudTrail tlsDetails.keyExchange verified; FIPS 140-3 cert IDs recorded.',
    ownerRoles: 'Security Architect + Developers',
  },
  {
    phase: 4,
    title: 'SaaS Evidence & Drift Monitoring',
    goal: 'Close SaaS vendor evidence gaps (TLS, BYOK, federation, subprocessors) and wire continuous TLS/KMS drift alerts into SIEM.',
    gateCriteria:
      'All tier-1 SaaS tenants have verified evidence or tracked risk exceptions; drift alerts active.',
    ownerRoles: 'GRC + SOC / Ops',
  },
]

export const SAAS_CHECKLIST_ITEMS: SaasChecklistItem[] = [
  {
    id: 'saas-edge-tls',
    domain: 'transport',
    domainLabel: 'Transport & Edge TLS',
    question:
      'Have you independently verified that the SaaS vendor’s public web, API, and webhook endpoints negotiate TLS 1.3 hybrid key exchange (X25519MLKEM768)?',
    whyItMatters:
      'Marketing statements do not prove endpoint configuration; unverified endpoints remain exposed to HNDL interception on long-lived customer payloads.',
    drivers: ['NIST IR 8547', 'RFC 10024', 'OMB M-26-15'],
    evidenceRequest:
      'Independent openssl/TLS probe output per public hostname showing negotiated NamedGroup 0x11EC (X25519MLKEM768).',
  },
  {
    id: 'saas-byok-boundary',
    domain: 'kms-byok',
    domainLabel: 'KMS & BYOK Scope',
    question:
      'Has the vendor documented exactly which data stores (primary DB, backups, search indexes, telemetry) are covered by customer-managed keys (BYOK/HYOK) and what wrapping mechanism is used?',
    whyItMatters:
      'BYOK frequently covers primary storage while leaving backups, caches, or logs under provider-managed keys, and cloud BYOK import wrapping is often classical RSA.',
    drivers: ['NIST SP 800-210', 'FIPS 203', 'FIPS 140-3'],
    evidenceRequest:
      'Signed architecture diagram of BYOK scope, key-revocation SLA, and wrapping algorithm specification.',
  },
  {
    id: 'saas-fips-validation',
    domain: 'kms-byok',
    domainLabel: 'KMS & BYOK Scope',
    question:
      'Has the vendor provided active FIPS 140-3 CMVP certificate numbers (replacing FIPS 140-2 certificates moved to Historical status in September 2026) for cryptographic modules protecting regulated data?',
    whyItMatters:
      'Relying on Historical FIPS 140-2 claims can fail federal, financial, and regulated enterprise procurement gates.',
    drivers: ['FIPS 140-3', 'EO 14412', 'OMB M-26-15'],
    evidenceRequest:
      'CMVP certificate numbers, module versions, and scope statement mapping modules to production tenants.',
  },
  {
    id: 'saas-oidc-saml',
    domain: 'federation',
    domainLabel: 'Identity & Federation',
    question:
      'Does your identity/federation inventory record the current OIDC/SAML signing algorithms, token-size limits in relying parties, and the IdP’s PQC signing roadmap?',
    whyItMatters:
      'ML-DSA signatures (~3.3 KB for ML-DSA-65) significantly expand JWTs and SAML assertions, which can break WAF/proxy HTTP header size limits during future cutovers.',
    drivers: ['FIPS 204', 'NIST IR 8547'],
    evidenceRequest:
      'JWKS/SAML metadata inventory, WAF header-limit test report, and IdP PQC milestone schedule.',
  },
  {
    id: 'saas-subprocessors',
    domain: 'governance',
    domainLabel: 'Governance & Subprocessors',
    question:
      'Does the vendor’s CBOM or PQC attestation cover critical fourth-party subprocessors (underlying IaaS, CDN, KMS, and backup providers) and commit to notifying customers of cryptographic downgrades?',
    whyItMatters:
      'A SaaS application inherits the weakest cryptographic link in its underlying cloud, CDN, and backup subprocessors.',
    drivers: ['NIST IR 8547', 'EO 14412', 'OMB M-26-15'],
    evidenceRequest:
      'Subprocessor list mapped to cryptographic responsibilities plus contractual/SLA change-notification terms.',
  },
  {
    id: 'saas-multi-account-drift',
    domain: 'governance',
    domainLabel: 'Governance & Subprocessors',
    question:
      'Across your own multi-account cloud estate (AWS Organizations / Azure Management Groups / GCP Folders), do you have automated posture checks detecting classical-only TLS policies or unapproved KMS key specs?',
    whyItMatters:
      'Point-in-time migration checks decay quickly as new accounts, load balancers, and KMS keys are provisioned via IaC.',
    drivers: ['NIST IR 8547', 'OMB M-26-15'],
    evidenceRequest:
      'Cloud posture rule exports (AWS Config / Azure Policy / GCP Org Policy) and sample drift alert tickets.',
  },
]
