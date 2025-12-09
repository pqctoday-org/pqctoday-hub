import React, { useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { EUDI_COMMANDS, OPENID4VP_PRESENTATION_DEF, MARIA_IDENTITY } from '../constants'
import { InfoTooltip } from '../components/InfoTooltip'
import { formatTimestamp, createNonce } from '../utils/formatters'

interface RelyingPartyFlowProps {
  onBack: () => void
}

export const RelyingPartyFlow: React.FC<RelyingPartyFlowProps> = ({ onBack }) => {
  // Hooks

  // State
  const [presentationRequest, setPresentationRequest] = useState<{ nonce: string } | null>(null)

  // Filenames
  // const filenames = useMemo(() => getFilenames('presentation'), [])

  const steps: Step[] = [
    {
      id: 'request_presentation',
      title: 'Step 1: Request Credential Presentation',
      description: (
        <>
          A bank (<InfoTooltip term="Relying Party" />) requests María to present her PID and
          diploma for account opening. The bank sends a presentation request using{' '}
          <InfoTooltip term="OpenID4VP" /> protocol.
        </>
      ),
      code: `# OpenID4VP Presentation Request
# Relying Party: Premium Bank

# Bank creates presentation definition
cat > presentation_request.json << EOF
{
  "client_id": "https://bank.example.com",
  "client_id_scheme": "web-origin",
  "response_type": "vp_token",
  "response_mode": "direct_post",
  "response_uri": "https://bank.example.com/verify",
  "nonce": "$(uuidgen)",
  "presentation_definition": {
    "id": "premium_account_opening",
    "input_descriptors": [
      {
        "id": "pid_identity",
        "name": "Identity Verification",
        "purpose": "KYC compliance",
        "format": {"mso_mdoc": {}},
        "constraints": {
          "fields": [
            {"path": ["$.family_name"], "intent_to_retain": true},
            {"path": ["$.given_name"], "intent_to_retain": true},
            {"path": ["$.birth_date"], "intent_to_retain": true},
            {"path": ["$.resident_address"], "intent_to_retain": true}
          ]
        }
      },
      {
        "id": "diploma_education",
        "name": "Education Verification",
        "purpose": "Premium account eligibility",
        "format": {"vc+sd-jwt": {}},
        "constraints": {
          "fields": [
            {"path": ["$.degree_type"]},
            {"path": ["$.institution_name"]}
          ]
        }
      }
    ]
  }
}
EOF

# Bank sends request via QR code or deep link
# Wallet receives and parses presentation request`,
      language: 'bash',
      actionLabel: 'Request Presentation',
    },
    {
      id: 'select_credentials',
      title: 'Step 2: Select Credentials',
      description: (
        <>
          María's wallet analyzes the presentation request and identifies matching credentials. She
          reviews what information will be shared and selects which credentials to present.
        </>
      ),
      code: `# Wallet analyzes presentation request
# Matches credentials to input descriptors

# Match PID (mDL) for identity verification
echo "Matching credential for 'pid_identity':"
echo "- Credential: Driver's License (mDL)"
echo "- Format: mso_mdoc"
echo "- Attributes requested:"
echo "  * family_name (will be retained by RP)"
echo "  * given_name (will be retained by RP)"
echo "  * birth_date (will be retained by RP)"
echo "  * resident_address (will be retained by RP)"

# Match Diploma for education verification
echo "Matching credential for 'diploma_education':"
echo "- Credential: University Diploma"
echo "- Format: vc+sd-jwt"
echo "- Attributes requested:"
echo "  * degree_type (selective disclosure)"
echo "  * institution_name (selective disclosure)"

# User consent required before presentation`,
      language: 'bash',
      actionLabel: 'Select Credentials',
    },
    {
      id: 'create_device_proof',
      title: 'Step 3: Create Device Binding Proof',
      description: (
        <>
          The wallet creates a proof of possession for each credential's device key. This proves
          María controls the private keys associated with the credentials, preventing credential
          theft and replay attacks.
        </>
      ),
      code: `# Create device binding proofs for each credential

# Proof for PID (mDL)
cat > pid_proof_payload.json << EOF
{
  "aud": "https://bank.example.com",
  "iat": $(date +%s),
  "nonce": "<presentation_nonce>"
}
EOF

# Hash and sign with PID private key
openssl dgst -sha256 -binary pid_proof_payload.json > pid_proof_hash.bin
${EUDI_COMMANDS.SIGN('pid_private.pem', 'pid_proof_hash.bin', 'pid_proof.sig')}

# Proof for Diploma
cat > diploma_proof_payload.json << EOF
{
  "aud": "https://bank.example.com",
  "iat": $(date +%s),
  "nonce": "<presentation_nonce>"
}
EOF

# Hash and sign with Diploma private key
openssl dgst -sha384 -binary diploma_proof_payload.json > diploma_proof_hash.bin
${EUDI_COMMANDS.SIGN('diploma_private.pem', 'diploma_proof_hash.bin', 'diploma_proof.sig')}

# Proofs demonstrate possession of private keys
# Prevents credential theft and replay attacks`,
      language: 'bash',
      actionLabel: 'Create Proofs',
    },
    {
      id: 'selective_disclosure',
      title: 'Step 4: Apply Selective Disclosure',
      description: (
        <>
          For the diploma credential, María selectively discloses only the requested attributes
          (degree type and institution). Other attributes like graduation date and honors remain
          hidden using <InfoTooltip term="SD-JWT" /> selective disclosure.
        </>
      ),
      code: `# Apply selective disclosure for diploma
# Only reveal requested attributes

# Full SD-JWT has 5 disclosures:
# 1. family_name
# 2. given_name  
# 3. degree_type (REQUESTED)
# 4. degree_field
# 5. institution_name (REQUESTED)

# Select only requested disclosures
SELECTED_DISCLOSURES=(
  "\${DISCLOSURE_3}"  # degree_type
  "\${DISCLOSURE_5}"  # institution_name
)

# Create presentation SD-JWT
# Format: JWT~disclosure3~disclosure5
# (omitting disclosures 1, 2, 4)

echo "Selective disclosure applied:"
echo "✓ Revealing: degree_type, institution_name"
echo "✗ Hidden: family_name, given_name, degree_field"
echo "✗ Hidden: graduation_date, diploma_number, honors"

# Privacy-preserving presentation
# Only necessary attributes disclosed`,
      language: 'bash',
      actionLabel: 'Apply Disclosure',
    },
    {
      id: 'submit_presentation',
      title: 'Step 5: Submit Presentation',
      description: (
        <>
          The wallet creates a Verifiable Presentation containing both credentials with their device
          binding proofs and submits it to the bank's verification endpoint.
        </>
      ),
      code: `# Create and submit Verifiable Presentation

cat > vp_token.json << EOF
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiablePresentation"],
  "holder": "did:key:<wallet_did>",
  "verifiableCredential": [
    {
      "credential": "<mdl_credential>",
      "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "proofPurpose": "authentication",
        "verificationMethod": "did:key:<pid_key>",
        "jws": "<pid_device_proof_jwt>"
      }
    },
    {
      "credential": "<diploma_sdjwt>~<disclosure3>~<disclosure5>",
      "proof": {
        "type": "EcdsaSecp384r1Signature2019",
        "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "proofPurpose": "authentication",
        "verificationMethod": "did:key:<diploma_key>",
        "jws": "<diploma_device_proof_jwt>"
      }
    }
  ]
}
EOF

# Submit to bank's verification endpoint
curl -X POST "https://bank.example.com/verify" \\
  -H "Content-Type": "application/json" \\
  -d @vp_token.json`,
      language: 'bash',
      actionLabel: 'Submit Presentation',
    },
    {
      id: 'verify_presentation',
      title: 'Step 6: Relying Party Verification',
      description: (
        <>
          The bank verifies the presentation by checking issuer signatures, device binding proofs,
          credential validity, and trust framework compliance. Upon successful verification, María's
          account is opened.
        </>
      ),
      code: `# Relying Party Verification Process

echo "=== Verifying PID (mDL) ==="

# 1. Verify issuer signature (MVA)
curl -s "https://mva.gov.es/cert.pem" > mva_cert.pem
openssl x509 -in mva_cert.pem -pubkey -noout > mva_public.pem
${EUDI_COMMANDS.VERIFY('mva_public.pem', 'mdl_data.bin', 'mdl_signature.sig')}
echo "✓ MVA signature valid"

# 2. Verify device binding proof
${EUDI_COMMANDS.VERIFY('pid_public.pem', 'pid_proof_hash.bin', 'pid_proof.sig')}
echo "✓ Device binding proof valid"

# 3. Check credential status (not revoked)
curl -s "https://mva.gov.es/status/12345678X" | jq .status
echo "✓ Credential not revoked"

echo "=== Verifying Diploma (SD-JWT) ==="

# 1. Verify university signature
curl -s "https://university.edu/cert.pem" > university_cert.pem
openssl x509 -in university_cert.pem -pubkey -noout > university_public.pem
${EUDI_COMMANDS.VERIFY('university_public.pem', 'diploma_jwt_hash.bin', 'diploma_signature.sig')}
echo "✓ University signature valid"

# 2. Verify selective disclosures
echo "✓ Disclosure hashes match _sd array"

# 3. Verify device binding proof
${EUDI_COMMANDS.VERIFY('diploma_public.pem', 'diploma_proof_hash.bin', 'diploma_proof.sig')}
echo "✓ Device binding proof valid"

echo "=== Verification Complete ==="
echo "✓ All credentials verified"
echo "✓ Identity confirmed: María García"
echo "✓ Education confirmed: Master of Science, State University"
echo "✓ Account opening approved"`,
      language: 'bash',
      actionLabel: 'Verify Presentation',
    },
  ]

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'request_presentation') {
      const request = {
        ...OPENID4VP_PRESENTATION_DEF,
        client_id: 'https://bank.example.com',
        response_uri: 'https://bank.example.com/verify',
        nonce: createNonce(),
        created_at: formatTimestamp(),
      }

      setPresentationRequest(request)

      result = `✅ Presentation Request Received!\n\nRequest:\n${JSON.stringify(request, null, 2)}`
    } else if (step.id === 'select_credentials') {
      const matches = {
        pid_identity: {
          credential: 'Driver License (mDL)',
          format: 'mso_mdoc',
          attributes: ['family_name', 'given_name', 'birth_date', 'resident_address'],
          intent_to_retain: true,
        },
        diploma_education: {
          credential: 'University Diploma',
          format: 'vc+sd-jwt',
          attributes: ['degree_type', 'institution_name'],
          selective_disclosure: true,
        },
      }

      result = `✅ Credentials Selected!\n\nMatched Credentials:\n${JSON.stringify(matches, null, 2)}\n\nUser consent required before presentation`
    } else if (step.id === 'create_device_proof') {
      // Create device proofs
      const pidProof = {
        aud: 'https://bank.example.com',
        iat: Math.floor(Date.now() / 1000),
        nonce: presentationRequest ? presentationRequest.nonce : createNonce(),
      }

      const diplomaProof = {
        aud: 'https://bank.example.com',
        iat: Math.floor(Date.now() / 1000),
        nonce: presentationRequest ? presentationRequest.nonce : createNonce(),
      }

      result = `✅ Device Binding Proofs Created!\n\nPID Proof:\n${JSON.stringify(pidProof, null, 2)}\n\nDiploma Proof:\n${JSON.stringify(diplomaProof, null, 2)}\n\nProofs signed with device private keys`
    } else if (step.id === 'selective_disclosure') {
      const disclosure = {
        total_attributes: 8,
        requested_attributes: 2,
        disclosed: ['degree_type', 'institution_name'],
        hidden: [
          'family_name',
          'given_name',
          'degree_field',
          'graduation_date',
          'diploma_number',
          'honors',
        ],
      }

      result = `✅ Selective Disclosure Applied!\n\nDisclosure Summary:\n${JSON.stringify(disclosure, null, 2)}\n\nPrivacy preserved - only necessary attributes revealed`
    } else if (step.id === 'submit_presentation') {
      const vpToken = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder: 'did:key:wallet',
        verifiableCredential: [
          {
            credential: 'mDL',
            proof: 'device_binding_proof_jwt',
          },
          {
            credential: 'diploma_sd_jwt',
            proof: 'device_binding_proof_jwt',
          },
        ],
        submitted_at: formatTimestamp(),
      }

      result = `✅ Presentation Submitted!\n\nVerifiable Presentation:\n${JSON.stringify(vpToken, null, 2)}`
    } else if (step.id === 'verify_presentation') {
      const verification = {
        pid_verification: {
          issuer_signature: 'valid',
          device_binding: 'valid',
          credential_status: 'not_revoked',
          trust_framework: 'eIDAS',
        },
        diploma_verification: {
          issuer_signature: 'valid',
          disclosure_hashes: 'valid',
          device_binding: 'valid',
          selective_disclosure: 'applied',
        },
        identity_confirmed: {
          family_name: MARIA_IDENTITY.family_name,
          given_name: MARIA_IDENTITY.given_name,
          birth_date: MARIA_IDENTITY.birth_date,
        },
        education_confirmed: {
          degree_type: 'Master of Science',
          institution: 'State University',
        },
        decision: 'APPROVED',
        verified_at: formatTimestamp(),
      }

      result = `✅ Presentation Verified!\n\nVerification Result:\n${JSON.stringify(verification, null, 2)}\n\nAccount opening approved!`
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
          Understand credential presentation and verification using <InfoTooltip term="OpenID4VP" />
          . Learn about presentation requests, credential selection, device binding proofs,
          selective disclosure, and relying party verification.
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
          <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Verification Complete!</h3>
          <p className="text-sm text-muted-foreground mb-3">
            The bank has successfully verified María's identity and education credentials. Her
            premium account has been opened. The entire process was privacy-preserving with
            selective disclosure.
          </p>
          <div className="text-xs text-muted-foreground">
            <strong>Key Achievements:</strong> Completed all 5 EUDI Wallet modules - Wallet
            activation, PID issuance, Attestation issuance, QES signing, and Credential
            presentation!
          </div>
        </div>
      )}
    </div>
  )
}
