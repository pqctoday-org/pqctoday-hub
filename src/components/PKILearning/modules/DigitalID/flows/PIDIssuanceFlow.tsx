import React, { useMemo, useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { useArtifactManagement } from '../hooks/useArtifactManagement'
import { useFileRetrieval } from '../hooks/useFileRetrieval'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { EUDI_COMMANDS, getFilenames, MARIA_IDENTITY, OPENID4VCI_METADATA } from '../constants'
import { InfoTooltip } from '../components/InfoTooltip'
import { createSHA256Hash, formatTimestamp, createNonce } from '../utils/formatters'
import { bytesToHex } from '@noble/hashes/utils.js'

interface PIDIssuanceFlowProps {
  onBack: () => void
}

export const PIDIssuanceFlow: React.FC<PIDIssuanceFlowProps> = ({ onBack }) => {
  // Hooks
  const keyGen = useKeyGeneration('EUDI_P256')
  const artifacts = useArtifactManagement()
  const fileRetrieval = useFileRetrieval()

  // State
  const [authorizationCode, setAuthorizationCode] = useState<string | null>(null)

  // Filenames
  const filenames = useMemo(() => getFilenames('pid'), [])

  const steps: Step[] = [
    {
      id: 'discover_issuer',
      title: 'Step 1: Discover PID Issuer',
      description: (
        <>
          María's wallet discovers the Motor Vehicle Authority (MVA) as the{' '}
          <InfoTooltip term="PID" /> issuer. The wallet retrieves the issuer's{' '}
          <InfoTooltip term="OpenID4VCI" /> metadata to learn about supported credentials and
          endpoints.
        </>
      ),
      code: `# Discover OpenID4VCI Issuer Metadata
# Issuer: Motor Vehicle Authority (MVA)

ISSUER_URL="https://mva.gov.es"

# Fetch .well-known configuration
curl -s "\${ISSUER_URL}/.well-known/openid-credential-issuer" | jq .

# Expected metadata includes:
# - credential_issuer: Issuer identifier
# - credential_endpoint: Where to request credentials
# - authorization_endpoint: OAuth 2.0 authorization
# - token_endpoint: OAuth 2.0 token exchange
# - credentials_supported: List of available credentials (mDL, etc.)`,
      language: 'bash',
      actionLabel: 'Discover Issuer',
    },
    {
      id: 'gen_pid_key',
      title: 'Step 2: Generate PID Key Pair',
      description: (
        <>
          The wallet generates a new ECDSA P-256 key pair in the Remote HSM for the{' '}
          <InfoTooltip term="PID" /> credential. This key will be cryptographically bound to the PID
          using <InfoTooltip term="Device Binding" />.
        </>
      ),
      code: `# Generate PID key pair in Remote HSM
${EUDI_COMMANDS.GEN_PID_KEY(filenames.PRIVATE_KEY)}

# Extract public key
${EUDI_COMMANDS.EXTRACT_PUB(filenames.PRIVATE_KEY, filenames.PUBLIC_KEY)}

# Display key details
${EUDI_COMMANDS.DISPLAY_KEY(filenames.PRIVATE_KEY)}
${EUDI_COMMANDS.DISPLAY_PUB(filenames.PUBLIC_KEY)}

# Key will be bound to the PID credential
# User must prove possession during presentation`,
      language: 'bash',
      actionLabel: 'Generate PID Key',
    },
    {
      id: 'authorize',
      title: 'Step 3: Authorization Request',
      description: (
        <>
          The wallet initiates the <InfoTooltip term="OpenID4VCI" /> flow by sending an
          authorization request to the MVA. María authenticates using her national eID and
          authorizes the wallet to receive her driver's license.
        </>
      ),
      code: `# OpenID4VCI Authorization Request (Pushed Authorization Request)
PAR_ENDPOINT="https://mva.gov.es/par"

# Create authorization request
cat > auth_request.json << EOF
{
  "client_id": "wallet.es",
  "response_type": "code",
  "scope": "openid org.iso.18013.5.1.mDL",
  "redirect_uri": "eudi-wallet://callback",
  "code_challenge": "$(echo -n \${RANDOM} | sha256sum | base64url)",
  "code_challenge_method": "S256",
  "state": "$(uuidgen)",
  "nonce": "$(uuidgen)"
}
EOF

# Send PAR request
curl -X POST "\${PAR_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d @auth_request.json

# User authenticates with national eID
# MVA verifies identity and issues authorization code`,
      language: 'bash',
      actionLabel: 'Authorize',
    },
    {
      id: 'token_exchange',
      title: 'Step 4: Token Exchange',
      description: (
        <>
          After María authorizes, the wallet exchanges the authorization code for an access token.
          This token will be used to request the PID credential from the MVA.
        </>
      ),
      code: `# Exchange authorization code for access token
TOKEN_ENDPOINT="https://mva.gov.es/token"
AUTH_CODE="<authorization_code_from_step_3>"

curl -X POST "\${TOKEN_ENDPOINT}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=\${AUTH_CODE}" \\
  -d "client_id=wallet.es" \\
  -d "code_verifier=<pkce_verifier>" \\
  -d "redirect_uri=eudi-wallet://callback"

# Response includes:
# - access_token: For credential request
# - token_type: "Bearer"
# - expires_in: Token validity (e.g., 3600 seconds)
# - c_nonce: Challenge for key proof`,
      language: 'bash',
      actionLabel: 'Exchange Token',
    },
    {
      id: 'create_key_proof',
      title: 'Step 5: Create Key Proof',
      description: (
        <>
          The wallet creates a cryptographic proof of possession for the PID public key. This JWT is
          signed with the PID private key and includes the c_nonce from the token response.
        </>
      ),
      code: `# Create Key Proof JWT (proof of possession)
# Proves wallet controls the private key for device binding

# Create proof payload
cat > proof_payload.json << EOF
{
  "iss": "wallet.es",
  "aud": "https://mva.gov.es",
  "iat": $(date +%s),
  "nonce": "<c_nonce_from_token_response>"
}
EOF

# Hash the payload
$ openssl dgst -sha256 -binary proof_payload.json > proof_hash.bin

# Sign with PID private key
${EUDI_COMMANDS.SIGN(filenames.PRIVATE_KEY, 'proof_hash.bin', 'proof_signature.sig')}

# Create JWT: header.payload.signature (Base64URL encoded)
# This proves possession of the private key`,
      language: 'bash',
      actionLabel: 'Create Key Proof',
    },
    {
      id: 'request_credential',
      title: 'Step 6: Request PID Credential',
      description: (
        <>
          The wallet requests the <InfoTooltip term="mDL" /> credential from the MVA, including the
          key proof and public key. The MVA issues the credential bound to María's PID key.
        </>
      ),
      code: `# Request mDL credential from MVA
CREDENTIAL_ENDPOINT="https://mva.gov.es/credentials"

# Create credential request
cat > credential_request.json << EOF
{
  "format": "mso_mdoc",
  "doctype": "org.iso.18013.5.1.mDL",
  "proof": {
    "proof_type": "jwt",
    "jwt": "<key_proof_jwt_from_step_5>"
  },
  "credential_identifier": "org.iso.18013.5.1.mDL"
}
EOF

# Send credential request with access token
curl -X POST "\${CREDENTIAL_ENDPOINT}" \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d @credential_request.json

# MVA returns mDL credential:
# - Signed with MVA's private key
# - Contains María's identity attributes
# - Cryptographically bound to PID public key
# - Format: ISO 18013-5 Mobile Security Object (MSO)`,
      language: 'bash',
      actionLabel: 'Request Credential',
    },
    {
      id: 'verify_credential',
      title: 'Step 7: Verify PID Credential',
      description: (
        <>
          The wallet verifies the received <InfoTooltip term="mDL" /> credential by checking the
          MVA's signature and validating the credential structure. The PID is now ready for
          presentation to relying parties.
        </>
      ),
      code: `# Verify mDL credential signature
# Extract MVA's public key from certificate

# Download MVA certificate
curl -s "https://mva.gov.es/cert.pem" > mva_cert.pem

# Extract public key from certificate
$ openssl x509 -in mva_cert.pem -pubkey -noout > mva_public.pem

# Verify credential signature (COSE Sign1 structure)
# In production, this would verify the CBOR-encoded MSO
# For education: verify a sample signature

echo "Verifying mDL credential signature..."
${EUDI_COMMANDS.VERIFY('mva_public.pem', 'credential_data.bin', 'credential_signature.sig')}

echo "✓ PID credential verified successfully"
echo "✓ Credential bound to device key"
echo "✓ Ready for presentation"`,
      language: 'bash',
      actionLabel: 'Verify Credential',
    },
  ]

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'discover_issuer') {
      // Simulate issuer discovery
      const metadata = {
        ...OPENID4VCI_METADATA,
        discovered_at: formatTimestamp(),
      }

      result = `✅ PID Issuer Discovered!\n\nIssuer Metadata:\n${JSON.stringify(metadata, null, 2)}`
    } else if (step.id === 'gen_pid_key') {
      // Generate PID key using OpenSSL
      const { keyPair } = await keyGen.generateKeyPair(filenames.PRIVATE_KEY, filenames.PUBLIC_KEY)

      result = `✅ PID Key Pair Generated in Remote HSM!\n\nPrivate Key (Hex):\n${keyPair.privateKeyHex}\n\nPublic Key (Hex):\n${keyPair.publicKeyHex}\n\nKey will be bound to PID credential`
    } else if (step.id === 'authorize') {
      // Simulate authorization
      const authRequest = {
        client_id: 'wallet.es',
        response_type: 'code',
        scope: 'openid org.iso.18013.5.1.mDL',
        redirect_uri: 'eudi-wallet://callback',
        code_challenge_method: 'S256',
        state: createNonce(),
        nonce: createNonce(),
      }

      const code = createNonce()
      setAuthorizationCode(code)

      result = `✅ Authorization Successful!\n\nAuthorization Request:\n${JSON.stringify(authRequest, null, 2)}\n\nAuthorization Code:\n${code}\n\nUser authenticated with national eID`
    } else if (step.id === 'token_exchange') {
      if (!authorizationCode) throw new Error('Authorization code not found')

      const tokenResponse = {
        access_token: createNonce(),
        token_type: 'Bearer',
        expires_in: 3600,
        c_nonce: createNonce(),
        c_nonce_expires_in: 86400,
      }

      result = `✅ Token Exchange Successful!\n\nToken Response:\n${JSON.stringify(tokenResponse, null, 2)}`
    } else if (step.id === 'create_key_proof') {
      if (!keyGen.publicKey) throw new Error('PID key not found')

      // Create proof payload
      const proofPayload = {
        iss: 'wallet.es',
        aud: 'https://mva.gov.es',
        iat: Math.floor(Date.now() / 1000),
        nonce: createNonce(),
      }

      // Hash and sign
      const payloadBytes = new TextEncoder().encode(JSON.stringify(proofPayload))
      const hashBytes = createSHA256Hash(payloadBytes)

      const hashFilename = artifacts.saveHash('pid_proof', hashBytes)
      const files = fileRetrieval.prepareFilesForExecution([filenames.PRIVATE_KEY, hashFilename])

      const sigFilename = `pid_proof_${artifacts.getTimestamp()}.sig`
      const signCmd = `openssl pkeyutl -sign -inkey ${filenames.PRIVATE_KEY} -in ${hashFilename} -out ${sigFilename}`

      const res = await openSSLService.execute(signCmd, files)
      if (res.error) throw new Error(res.error)

      const sigData = res.files.find((f) => f.name === sigFilename)?.data || new Uint8Array()
      artifacts.saveSignature('pid_proof', sigData)

      result = `✅ Key Proof Created!\n\nProof Payload:\n${JSON.stringify(proofPayload, null, 2)}\n\nProof Hash (SHA-256):\n${bytesToHex(hashBytes)}\n\nProof Signature (Hex):\n${bytesToHex(sigData).slice(0, 100)}...`
    } else if (step.id === 'request_credential') {
      // Simulate credential request
      const credentialRequest = {
        format: 'mso_mdoc',
        doctype: 'org.iso.18013.5.1.mDL',
        proof: {
          proof_type: 'jwt',
          jwt: '<key_proof_jwt>',
        },
      }

      const mdlCredential = {
        format: 'mso_mdoc',
        doctype: 'org.iso.18013.5.1.mDL',
        issuer_signed: {
          nameSpaces: {
            'org.iso.18013.5.1': {
              family_name: MARIA_IDENTITY.family_name,
              given_name: MARIA_IDENTITY.given_name,
              birth_date: MARIA_IDENTITY.birth_date,
              document_number: MARIA_IDENTITY.document_number,
              issuing_country: MARIA_IDENTITY.issuing_country,
            },
          },
        },
        device_key: '<pid_public_key_jwk>',
      }

      result = `✅ mDL Credential Received!\n\nCredential Request:\n${JSON.stringify(credentialRequest, null, 2)}\n\nmDL Credential:\n${JSON.stringify(mdlCredential, null, 2)}`
    } else if (step.id === 'verify_credential') {
      // Simulate credential verification
      const verification = {
        signature_valid: true,
        issuer_trusted: true,
        device_key_bound: true,
        credential_status: 'valid',
        verified_at: formatTimestamp(),
      }

      result = `✅ PID Credential Verified!\n\nVerification Result:\n${JSON.stringify(verification, null, 2)}\n\nPID is ready for presentation to relying parties`
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
          Understand the <InfoTooltip term="OpenID4VCI" /> protocol for issuing a{' '}
          <InfoTooltip term="PID" /> (Driver's License as <InfoTooltip term="mDL" />
          ). Learn about authorization, token exchange, key proofs, and credential binding.
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
          <h3 className="text-lg font-semibold text-green-400 mb-2">✅ PID Issued!</h3>
          <p className="text-sm text-muted-foreground mb-3">
            María now has a verified driver's license (mDL) in her EUDI Wallet. The credential is
            cryptographically bound to her device key and can be presented to relying parties.
          </p>
          <div className="text-xs text-muted-foreground">
            <strong>Next Steps:</strong> María can now request additional attestations (e.g.,
            university diploma) or present her PID to relying parties.
          </div>
        </div>
      )}
    </div>
  )
}
