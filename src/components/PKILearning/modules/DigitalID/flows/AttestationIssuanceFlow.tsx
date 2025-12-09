import React, { useMemo, useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { EUDI_COMMANDS, getFilenames, DIPLOMA_DATA } from '../constants'
import { InfoTooltip } from '../components/InfoTooltip'
import { formatTimestamp, createNonce, createDisclosure, hashDisclosure } from '../utils/formatters'

interface AttestationIssuanceFlowProps {
  onBack: () => void
}

export const AttestationIssuanceFlow: React.FC<AttestationIssuanceFlowProps> = ({ onBack }) => {
  // Hooks
  const keyGen = useKeyGeneration('bitcoin')
  // const artifacts = useArtifactManagement()
  // const fileRetrieval = useFileRetrieval()

  // State
  const [disclosures, setDisclosures] = useState<string[]>([])

  // Filenames
  const filenames = useMemo(() => getFilenames('diploma'), [])

  const steps: Step[] = [
    {
      id: 'discover_university',
      title: 'Step 1: Discover University Issuer',
      description: (
        <>
          María's wallet discovers the State University as an attestation provider. The university
          is a <InfoTooltip term="PuB-EAA" /> (Public Body Electronic Attestation of Attributes)
          provider, authorized to issue educational credentials.
        </>
      ),
      code: `# Discover University Attestation Provider
# Provider Type: PuB-EAA (Public Body)

UNIVERSITY_URL="https://university.edu"

# Fetch issuer metadata
curl -s "\${UNIVERSITY_URL}/.well-known/openid-credential-issuer" | jq .

# University is registered as:
# - PuB-EAA Provider (Public Body)
# - Authentic Source: Ministry of Education
# - Supported Credentials: University Diplomas (SD-JWT VC format)`,
      language: 'bash',
      actionLabel: 'Discover University',
    },
    {
      id: 'gen_diploma_key',
      title: 'Step 2: Generate Diploma Key Pair',
      description: (
        <>
          The wallet generates a new ECDSA P-384 key pair in the Remote HSM for the diploma
          attestation. This key will be bound to the credential for proof of possession.
        </>
      ),
      code: `# Generate Diploma key pair in Remote HSM (P-384)
\${EUDI_COMMANDS.GEN_DIPLOMA_KEY(filenames.PRIVATE_KEY)}

# Extract public key
\${EUDI_COMMANDS.EXTRACT_PUB(filenames.PRIVATE_KEY, filenames.PUBLIC_KEY)}

# Display key details
\${EUDI_COMMANDS.DISPLAY_KEY(filenames.PRIVATE_KEY)}
\${EUDI_COMMANDS.DISPLAY_PUB(filenames.PUBLIC_KEY)}

# Note: P-384 provides higher security for long-lived credentials
# Diploma attestations may be valid for many years`,
      language: 'bash',
      actionLabel: 'Generate Diploma Key',
    },
    {
      id: 'authorize_university',
      title: 'Step 3: Authorization with University',
      description: (
        <>
          María authorizes the wallet to receive her diploma attestation. The university verifies
          her identity using her PID and checks the authentic source (Ministry of Education) for
          diploma records.
        </>
      ),
      code: `# OpenID4VCI Authorization with University
AUTH_ENDPOINT="https://university.edu/authorize"

# Create authorization request
cat > auth_request.json << EOF
{
  "client_id": "wallet.es",
  "response_type": "code",
  "scope": "openid diploma_credential",
  "redirect_uri": "eudi-wallet://callback",
  "code_challenge": "$(echo -n \${RANDOM} | sha256sum | base64url)",
  "code_challenge_method": "S256",
  "state": "$(uuidgen)",
  "nonce": "$(uuidgen)",
  "claims": {
    "id_token": {
      "verified_claims": {
        "verification": {
          "trust_framework": "eidas"
        },
        "claims": {
          "given_name": null,
          "family_name": null
        }
      }
    }
  }
}
EOF

# University verifies:
# 1. María's identity via PID presentation
# 2. Diploma record in Ministry of Education database
# 3. Consent for credential issuance`,
      language: 'bash',
      actionLabel: 'Authorize',
    },
    {
      id: 'create_disclosures',
      title: 'Step 4: Create Selective Disclosures',
      description: (
        <>
          The university creates selective disclosures for the diploma attributes using{' '}
          <InfoTooltip term="SD-JWT" /> format. Each claim is individually disclosed with a unique
          salt, allowing María to selectively reveal attributes.
        </>
      ),
      code: `# Create SD-JWT Disclosures
# Each disclosure: Base64URL(JSON([salt, claim_name, claim_value]))

# Disclosure 1: Family Name
SALT_1=$(openssl rand -hex 16)
echo "[\\"$SALT_1\\", \\"family_name\\", \\"García\\"]" | base64url

# Disclosure 2: Given Name  
SALT_2=$(openssl rand -hex 16)
echo "[\\"$SALT_2\\", \\"given_name\\", \\"María Elena\\"]" | base64url

# Disclosure 3: Degree Type
SALT_3=$(openssl rand -hex 16)
echo "[\\"$SALT_3\\", \\"degree_type\\", \\"Master of Science\\"]" | base64url

# Disclosure 4: Degree Field
SALT_4=$(openssl rand -hex 16)
echo "[\\"$SALT_4\\", \\"degree_field\\", \\"Computer Science\\"]" | base64url

# Disclosure 5: Institution
SALT_5=$(openssl rand -hex 16)
echo "[\\"$SALT_5\\", \\"institution_name\\", \\"State University\\"]" | base64url

# Each disclosure is hashed with SHA-256 for inclusion in SD-JWT`,
      language: 'bash',
      actionLabel: 'Create Disclosures',
    },
    {
      id: 'issue_sdjwt',
      title: 'Step 5: Issue SD-JWT Credential',
      description: (
        <>
          The university issues the diploma as an <InfoTooltip term="SD-JWT" /> Verifiable
          Credential. The credential contains hashed disclosures, allowing selective attribute
          revelation during presentation.
        </>
      ),
      code: `# Create SD-JWT Credential
# Format: JWT with _sd array containing disclosure hashes

# Create JWT payload with disclosure hashes
cat > sdjwt_payload.json << EOF
{
  "iss": "https://university.edu",
  "sub": "maria.garcia@example.es",
  "iat": $(date +%s),
  "exp": $(($(date +%s) + 157680000)),
  "vct": "https://credentials.university.edu/diploma",
  "_sd": [
    "$(echo disclosure_1 | sha256sum | base64url)",
    "$(echo disclosure_2 | sha256sum | base64url)",
    "$(echo disclosure_3 | sha256sum | base64url)",
    "$(echo disclosure_4 | sha256sum | base64url)",
    "$(echo disclosure_5 | sha256sum | base64url)"
  ],
  "graduation_date": "2023-06-15",
  "diploma_number": "MSC-2023-12345",
  "cnf": {
    "jwk": { /* Diploma public key JWK */ }
  }
}
EOF

# Sign JWT with university's private key (ES384)
# Result: header.payload.signature~disclosure1~disclosure2~...`,
      language: 'bash',
      actionLabel: 'Issue SD-JWT',
    },
    {
      id: 'verify_attestation',
      title: 'Step 6: Verify Attestation',
      description: (
        <>
          The wallet verifies the diploma attestation by checking the university's signature,
          validating the disclosure hashes, and confirming the credential is bound to the diploma
          key.
        </>
      ),
      code: `# Verify SD-JWT Diploma Attestation

# Download university certificate
curl -s "https://university.edu/cert.pem" > university_cert.pem

# Extract public key
openssl x509 -in university_cert.pem -pubkey -noout > university_public.pem

# Verify JWT signature (ES384)
# Parse JWT: header.payload.signature
JWT_HEADER=$(echo $SD_JWT | cut -d. -f1)
JWT_PAYLOAD=$(echo $SD_JWT | cut -d. -f2)
JWT_SIGNATURE=$(echo $SD_JWT | cut -d. -f3 | cut -d~ -f1)

# Create signing input
echo -n "\${JWT_HEADER}.\${JWT_PAYLOAD}" > jwt_signing_input.txt

# Hash with SHA-384
openssl dgst -sha384 -binary jwt_signing_input.txt > jwt_hash.bin

# Verify signature
${EUDI_COMMANDS.VERIFY('university_public.pem', 'jwt_hash.bin', 'jwt_signature.sig')}

# Verify disclosure hashes match _sd array
echo "✓ Diploma attestation verified successfully"
echo "✓ Credential bound to device key"
echo "✓ Selective disclosure enabled"`,
      language: 'bash',
      actionLabel: 'Verify Attestation',
    },
  ]

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'discover_university') {
      const metadata = {
        credential_issuer: 'https://university.edu',
        credential_endpoint: 'https://university.edu/credentials',
        authorization_endpoint: 'https://university.edu/authorize',
        token_endpoint: 'https://university.edu/token',
        credentials_supported: [
          {
            format: 'vc+sd-jwt',
            vct: 'https://credentials.university.edu/diploma',
            cryptographic_binding_methods_supported: ['jwk'],
            cryptographic_suites_supported: ['ES384'],
          },
        ],
        discovered_at: formatTimestamp(),
      }

      result = `✅ University Issuer Discovered!\n\nIssuer Metadata:\n${JSON.stringify(metadata, null, 2)}`
    } else if (step.id === 'gen_diploma_key') {
      const { keyPair } = await keyGen.generateKeyPair(filenames.PRIVATE_KEY, filenames.PUBLIC_KEY)

      result = `✅ Diploma Key Pair Generated (P-384)!\n\nPrivate Key (Hex):\n${keyPair.privateKeyHex}\n\nPublic Key (Hex):\n${keyPair.publicKeyHex}\n\nHigher security for long-lived credentials`
    } else if (step.id === 'authorize_university') {
      const authRequest = {
        client_id: 'wallet.es',
        response_type: 'code',
        scope: 'openid diploma_credential',
        redirect_uri: 'eudi-wallet://callback',
        code_challenge_method: 'S256',
        state: createNonce(),
        nonce: createNonce(),
      }

      result = `✅ Authorization Successful!\n\nAuthorization Request:\n${JSON.stringify(authRequest, null, 2)}\n\nUniversity verified:\n- Identity via PID\n- Diploma record in Ministry database\n- User consent obtained`
    } else if (step.id === 'create_disclosures') {
      // Create selective disclosures
      const salt1 = createNonce()
      const salt2 = createNonce()
      const salt3 = createNonce()
      const salt4 = createNonce()
      const salt5 = createNonce()

      const disc1 = createDisclosure(salt1, 'family_name', DIPLOMA_DATA.family_name)
      const disc2 = createDisclosure(salt2, 'given_name', DIPLOMA_DATA.given_name)
      const disc3 = createDisclosure(salt3, 'degree_type', DIPLOMA_DATA.degree_type)
      const disc4 = createDisclosure(salt4, 'degree_field', DIPLOMA_DATA.degree_field)
      const disc5 = createDisclosure(salt5, 'institution_name', DIPLOMA_DATA.institution_name)

      const disclosureList = [disc1, disc2, disc3, disc4, disc5]
      setDisclosures(disclosureList)

      // Hash disclosures
      const hash1 = hashDisclosure(disc1)
      const hash2 = hashDisclosure(disc2)
      const hash3 = hashDisclosure(disc3)
      const hash4 = hashDisclosure(disc4)
      const hash5 = hashDisclosure(disc5)

      result = `✅ Selective Disclosures Created!\n\nDisclosures:\n1. family_name: ${disc1.slice(0, 40)}...\n2. given_name: ${disc2.slice(0, 40)}...\n3. degree_type: ${disc3.slice(0, 40)}...\n4. degree_field: ${disc4.slice(0, 40)}...\n5. institution: ${disc5.slice(0, 40)}...\n\nDisclosure Hashes (for _sd array):\n1. ${hash1}\n2. ${hash2}\n3. ${hash3}\n4. ${hash4}\n5. ${hash5}`
    } else if (step.id === 'issue_sdjwt') {
      if (disclosures.length === 0) throw new Error('Disclosures not created')

      const sdJwtPayload = {
        iss: 'https://university.edu',
        sub: 'maria.garcia@example.es',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 157680000, // 5 years
        vct: 'https://credentials.university.edu/diploma',
        _sd: disclosures.map((d) => hashDisclosure(d)),
        graduation_date: DIPLOMA_DATA.graduation_date,
        diploma_number: DIPLOMA_DATA.diploma_number,
        cnf: {
          jwk: '<diploma_public_key_jwk>',
        },
      }

      // Simulate SD-JWT creation
      const sdJwt = `eyJ...header...${btoa(JSON.stringify(sdJwtPayload))}.signature~${disclosures.join('~')}`

      result = `✅ SD-JWT Credential Issued!\n\nSD-JWT Payload:\n${JSON.stringify(sdJwtPayload, null, 2)}\n\nSD-JWT (abbreviated):\n${sdJwt.slice(0, 100)}...\n\nDisclosures attached: ${disclosures.length}`
    } else if (step.id === 'verify_attestation') {
      const verification = {
        signature_valid: true,
        issuer_trusted: true,
        device_key_bound: true,
        disclosure_hashes_valid: true,
        credential_status: 'valid',
        selective_disclosure_enabled: true,
        verified_at: formatTimestamp(),
      }

      result = `✅ Diploma Attestation Verified!\n\nVerification Result:\n${JSON.stringify(verification, null, 2)}\n\nDiploma is ready for selective presentation`
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
          Understand <InfoTooltip term="SD-JWT" /> (Selective Disclosure JWT) for attestation
          issuance. Learn how to create disclosures, hash claims, and enable selective attribute
          revelation for privacy-preserving presentations.
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
            ✅ Diploma Attestation Issued!
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            María now has a university diploma attestation with selective disclosure capabilities.
            She can choose which attributes to reveal when presenting to relying parties.
          </p>
          <div className="text-xs text-muted-foreground">
            <strong>Next Steps:</strong> María can present her diploma selectively (e.g., reveal
            only degree type without personal details) or combine it with her PID for comprehensive
            verification.
          </div>
        </div>
      )}
    </div>
  )
}
