import React, { useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { useArtifactManagement } from '../hooks/useArtifactManagement'
import { EUDI_COMMANDS, CSC_API_ENDPOINTS } from '../constants'
import { InfoTooltip } from '../components/InfoTooltip'
import { createSHA256Hash, formatTimestamp, createNonce } from '../utils/formatters'
import { bytesToHex } from '@noble/hashes/utils.js'

interface QESProviderFlowProps {
  onBack: () => void
}

export const QESProviderFlow: React.FC<QESProviderFlowProps> = ({ onBack }) => {
  // Hooks
  // const keyGen = useKeyGeneration('bitcoin')
  const artifacts = useArtifactManagement()
  // const fileRetrieval = useFileRetrieval()

  // State
  const [sad, setSad] = useState<string | null>(null)

  // Filenames
  // const filenames = useMemo(() => getFilenames('qes'), [])

  const steps: Step[] = [
    {
      id: 'discover_qtsp',
      title: 'Step 1: Discover QES Provider',
      description: (
        <>
          María needs to sign a property deed with a <InfoTooltip term="QES" /> (Qualified
          Electronic Signature). Her wallet discovers a <InfoTooltip term="QTSP" /> that provides
          remote signature services via the <InfoTooltip term="CSC API" />.
        </>
      ),
      code: `# Discover Remote QES Provider (QTSP)
# Protocol: CSC API (Cloud Signature Consortium)

QTSP_URL="https://qtsp.signature-provider.eu"

# Fetch CSC API info endpoint
curl -s "\${QTSP_URL}${CSC_API_ENDPOINTS.info}" | jq .

# QTSP provides:
# - Remote signature creation (server-side HSM)
# - QES certificates (eIDAS qualified)
# - Multi-factor authorization (PIN + OTP)
# - Supported algorithms: ES256, ES384, RS256`,
      language: 'bash',
      actionLabel: 'Discover QTSP',
    },
    {
      id: 'list_credentials',
      title: 'Step 2: List Signing Credentials',
      description: (
        <>
          The wallet requests a list of María's signing credentials from the QTSP. These are
          qualified certificates stored in the QTSP's remote HSM, each associated with a private key
          that never leaves the HSM.
        </>
      ),
      code: `# List available signing credentials
# CSC API: credentials/list

ACCESS_TOKEN="<oauth_access_token>"

curl -X POST "\${QTSP_URL}${CSC_API_ENDPOINTS.credentials_list}" \\
  -H "Authorization: Bearer \${ACCESS_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "credentialInfo": true,
    "certificates": "chain",
    "certInfo": true,
    "authInfo": true
  }'

# Response includes:
# - credentialIDs: List of available credentials
# - certificates: X.509 certificate chains
# - authMode: Required authorization (PIN, OTP, etc.)
# - SCAL: Signature Creation Application Level (1 or 2)`,
      language: 'bash',
      actionLabel: 'List Credentials',
    },
    {
      id: 'authorize_signing',
      title: 'Step 3: Authorize Signature Creation',
      description: (
        <>
          María authorizes the signature operation using multi-factor authentication. The QTSP
          verifies her identity and returns a Signature Activation Data (SAD) token that authorizes
          a single signature operation.
        </>
      ),
      code: `# Authorize signature creation
# CSC API: credentials/authorize

CREDENTIAL_ID="qes-cert-12345"
PIN="<user_pin>"
OTP="<one_time_password>"

curl -X POST "\${QTSP_URL}${CSC_API_ENDPOINTS.credentials_authorize}" \\
  -H "Authorization: Bearer \${ACCESS_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"credentialID\\": \\"\${CREDENTIAL_ID}\\",
    \\"numSignatures\\": 1,
    \\"PIN\\": \\"\${PIN}\\",
    \\"OTP\\": \\"\${OTP}\\",
    \\"description\\": \\"Property deed signature\\"
  }"

# Response:
# - SAD: Signature Activation Data (single-use token)
# - expiresIn: Token validity period (e.g., 300 seconds)

# User has authenticated with:
# 1. Something they know (PIN)
# 2. Something they have (OTP device)`,
      language: 'bash',
      actionLabel: 'Authorize',
    },
    {
      id: 'prepare_document',
      title: 'Step 4: Prepare Document Hash',
      description: (
        <>
          The wallet prepares the property deed for signing by computing its SHA-256 hash. Only the
          hash is sent to the QTSP, ensuring the document content remains private.
        </>
      ),
      code: `# Prepare document for signing
DOCUMENT="property_deed.pdf"

# Compute SHA-256 hash of document
openssl dgst -sha256 -binary \${DOCUMENT} > document_hash.bin

# Display hash in hex
HASH_HEX=$(xxd -p document_hash.bin | tr -d '\\n')
echo "Document Hash (SHA-256): \${HASH_HEX}"

# Convert to Base64 for CSC API
HASH_B64=$(base64 -w 0 document_hash.bin)
echo "Document Hash (Base64): \${HASH_B64}"

# Only the hash is sent to QTSP
# Document content never leaves the wallet`,
      language: 'bash',
      actionLabel: 'Prepare Hash',
    },
    {
      id: 'sign_hash',
      title: 'Step 5: Remote Signature Creation',
      description: (
        <>
          The QTSP creates a qualified electronic signature on the document hash using María's
          private key stored in the remote HSM. The signature is legally equivalent to a handwritten
          signature under eIDAS regulation.
        </>
      ),
      code: `# Create remote signature
# CSC API: signatures/signHash

HASH_B64="<document_hash_base64>"
SAD="<signature_activation_data>"

curl -X POST "\${QTSP_URL}${CSC_API_ENDPOINTS.signatures_signHash}" \\
  -H "Authorization: Bearer \${ACCESS_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"credentialID\\": \\"\${CREDENTIAL_ID}\\",
    \\"SAD\\": \\"\${SAD}\\",
    \\"hash\\": [\\"\${HASH_B64}\\"],
    \\"hashAlgo\\": \\"2.16.840.1.101.3.4.2.1\\",
    \\"signAlgo\\": \\"1.2.840.10045.4.3.2\\"
  }"

# Response:
# - signatures: Array of Base64-encoded signatures
# - validationInfo: Timestamp, certificate chain

# Signature created in QTSP HSM
# Private key never exposed
# QES has legal validity under eIDAS`,
      language: 'bash',
      actionLabel: 'Sign Hash',
    },
    {
      id: 'verify_qes',
      title: 'Step 6: Verify QES Signature',
      description: (
        <>
          The wallet verifies the QES signature using María's public key from the qualified
          certificate. The signature can be verified by any relying party using standard PKI tools.
        </>
      ),
      code: `# Verify QES signature

# Extract public key from QES certificate
openssl x509 -in qes_certificate.pem -pubkey -noout > qes_public.pem

# Verify signature (ECDSA with SHA-256)
${EUDI_COMMANDS.VERIFY('qes_public.pem', 'document_hash.bin', 'qes_signature.sig')}

# Verify certificate chain
openssl verify -CAfile qtsp_root_ca.pem \\
  -untrusted qtsp_intermediate_ca.pem \\
  qes_certificate.pem

# Check certificate is qualified (QC statements)
openssl x509 -in qes_certificate.pem -text -noout | grep -A 5 "qcStatements"

echo "✓ QES signature verified successfully"
echo "✓ Certificate chain valid"
echo "✓ Qualified certificate confirmed"
echo "✓ Signature legally binding under eIDAS"`,
      language: 'bash',
      actionLabel: 'Verify QES',
    },
  ]

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'discover_qtsp') {
      const qtspInfo = {
        specs: 'CSC API v2.0.0.2',
        name: 'European Trust Service Provider',
        logo: 'https://qtsp.signature-provider.eu/logo.png',
        region: 'EU',
        lang: ['en', 'es', 'de', 'fr'],
        description: 'Qualified Trust Service Provider under eIDAS',
        authType: ['PIN', 'OTP'],
        methods: ['auth/login', 'credentials/list', 'credentials/authorize', 'signatures/signHash'],
        discovered_at: formatTimestamp(),
      }

      result = `✅ QTSP Discovered!\n\nQTSP Info:\n${JSON.stringify(qtspInfo, null, 2)}`
    } else if (step.id === 'list_credentials') {
      const credentials = {
        credentialIDs: ['qes-cert-12345'],
        credentialInfos: [
          {
            credentialID: 'qes-cert-12345',
            description: 'María García - QES Certificate',
            signatureQualifier: 'eu_eidas_qes',
            key: {
              status: 'enabled',
              algo: ['1.2.840.10045.4.3.2'], // ECDSA with SHA-256
              len: 256,
            },
            cert: {
              status: 'valid',
              certificates: ['<base64_cert>'],
              issuerDN: 'CN=QTSP CA, O=Trust Provider, C=EU',
              subjectDN: 'CN=María García, C=ES',
              validFrom: '2024-01-01T00:00:00Z',
              validTo: '2027-01-01T00:00:00Z',
            },
            authMode: 'explicit',
            SCAL: '2',
          },
        ],
      }

      result = `✅ Signing Credentials Retrieved!\n\nCredentials:\n${JSON.stringify(credentials, null, 2)}`
    } else if (step.id === 'authorize_signing') {
      const sad = createNonce()
      setSad(sad)

      const authResponse = {
        SAD: sad,
        expiresIn: 300,
      }

      result = `✅ Signature Authorized!\n\nAuthorization Response:\n${JSON.stringify(authResponse, null, 2)}\n\nMulti-factor authentication completed:\n- PIN verified\n- OTP validated\n- SAD token issued (valid for 5 minutes)`
    } else if (step.id === 'prepare_document') {
      // Create sample document hash
      const documentContent = new TextEncoder().encode('Property Deed - Sample Document Content')
      const hashBytes = createSHA256Hash(documentContent)
      const hashHex = bytesToHex(hashBytes)

      artifacts.saveHash('property_deed', hashBytes)

      result = `✅ Document Hash Prepared!\n\nDocument: property_deed.pdf\nHash Algorithm: SHA-256\n\nHash (Hex):\n${hashHex}\n\nHash (Base64):\n${btoa(String.fromCharCode(...hashBytes))}\n\nOnly hash sent to QTSP - document stays private`
    } else if (step.id === 'sign_hash') {
      if (!sad) throw new Error('SAD token not found. Please complete authorization first.')

      // Simulate signature creation
      const signatureResponse = {
        signatures: ['<base64_encoded_signature>'],
        validationInfo: {
          timestamp: formatTimestamp(),
          certificateChain: ['<qes_cert>', '<intermediate_ca>', '<root_ca>'],
        },
      }

      result = `✅ QES Signature Created!\n\nSignature Response:\n${JSON.stringify(signatureResponse, null, 2)}\n\nSignature created in QTSP HSM\nPrivate key never exposed\nLegally binding under eIDAS`
    } else if (step.id === 'verify_qes') {
      const verification = {
        signature_valid: true,
        certificate_chain_valid: true,
        certificate_qualified: true,
        signature_algorithm: 'ECDSA with SHA-256',
        eidas_compliant: true,
        legal_validity: 'Equivalent to handwritten signature',
        verified_at: formatTimestamp(),
      }

      result = `✅ QES Signature Verified!\n\nVerification Result:\n${JSON.stringify(verification, null, 2)}\n\nProperty deed is now legally signed`
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
    <div className="space-y-6">
      {/* Educational Context */}
      <div className="glass-panel p-4 bg-primary/5 border-primary/20">
        <h3 className="text-lg font-semibold text-primary mb-2">🎓 Learning Objective</h3>
        <p className="text-sm text-muted-foreground">
          Understand remote <InfoTooltip term="QES" /> creation using the{' '}
          <InfoTooltip term="CSC API" />. Learn about qualified certificates, multi-factor
          authorization, remote HSM signing, and eIDAS compliance for legally binding electronic
          signatures.
        </p>
      </div>

      {/* Step Wizard */}
      <StepWizard
        steps={steps}
        currentStepIndex={wizard.currentStep}
        onExecute={() => wizard.execute(executeStep)}
        output={wizard.output}
        isExecuting={wizard.isExecuting}
        error={wizard.error}
        isStepComplete={wizard.isStepComplete}
        onNext={wizard.handleNext}
        onBack={wizard.handleBack}
        onComplete={onBack}
      />

      {/* Additional Information */}
      {wizard.currentStep === steps.length - 1 && wizard.isStepComplete && (
        <div className="glass-panel p-4 bg-green-500/5 border-green-500/20">
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            ✅ Document Signed with QES!
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            María has successfully signed the property deed with a Qualified Electronic Signature.
            The signature has the same legal validity as a handwritten signature under eIDAS
            regulation.
          </p>
          <div className="text-xs text-muted-foreground">
            <strong>Key Points:</strong> QES created in remote HSM, multi-factor authentication
            required, private key never exposed, legally binding across EU member states.
          </div>
        </div>
      )}
    </div>
  )
}
