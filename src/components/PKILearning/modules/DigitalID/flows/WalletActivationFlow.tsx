import React, { useMemo, useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { useStepWizard } from '../hooks/useStepWizard'
import { useKeyGeneration } from '../hooks/useKeyGeneration'
import { useArtifactManagement } from '../hooks/useArtifactManagement'
import { useFileRetrieval } from '../hooks/useFileRetrieval'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
import { EUDI_COMMANDS, getFilenames, MARIA_IDENTITY } from '../constants'
import { InfoTooltip } from '../components/InfoTooltip'
import {
  formatPublicKeyAsJWK,
  createSHA256Hash,
  formatTimestamp,
  createNonce,
} from '../utils/formatters'
import { bytesToHex } from '@noble/hashes/utils.js'

interface WalletActivationFlowProps {
  onBack: () => void
}

export const WalletActivationFlow: React.FC<WalletActivationFlowProps> = ({ onBack }) => {
  // Hooks
  const keyGen = useKeyGeneration('EUDI_P256') // Use P-256 (EUDI requirement)
  const artifacts = useArtifactManagement()
  const fileRetrieval = useFileRetrieval()

  // State
  const [wuaPublicKeyJWK, setWuaPublicKeyJWK] = useState<object | null>(null)

  // Filenames
  const filenames = useMemo(() => getFilenames('wua'), [])

  const steps: Step[] = [
    {
      id: 'wallet_install',
      title: 'Step 1: Wallet Installation',
      description: (
        <>
          María downloads the EUDI Wallet app from her national Wallet Provider. The app is a
          certified <InfoTooltip term="WSCA" /> (Wallet Secure Cryptographic Application) that will
          communicate with a remote <InfoTooltip term="WSCD" /> (Hardware Security Module).
        </>
      ),
      code: `# EUDI Wallet Installation
# Provider: Spanish National Wallet Provider
# Architecture: Remote HSM (WSCD hosted by provider)

# Wallet properties
PROVIDER="ES National Wallet Provider"
APP_VERSION="2.1.0"
WSCA_CERTIFIED=true
WSCD_TYPE="Remote HSM"
SUPPORTED_CURVES="P-256, P-384, P-521"

echo "Wallet installed successfully"
echo "Provider: $PROVIDER"
echo "WSCD Type: $WSCD_TYPE"`,
      language: 'bash',
      actionLabel: 'Install Wallet',
    },
    {
      id: 'hsm_partition',
      title: 'Step 2: HSM Partition Creation',
      description: (
        <>
          Upon first launch, the Wallet Provider's <InfoTooltip term="Remote HSM" /> creates a
          dedicated partition for María. This partition will store all her cryptographic keys in
          hardware-backed secure storage, isolated from other users.
        </>
      ),
      code: `# Remote HSM Partition Creation
# HSM: FIPS 140-3 Level 3 certified

USER_ID="maria.garcia@example.es"
PARTITION_ID="hsm-part-\${RANDOM}"
SECURITY_LEVEL="FIPS 140-3 Level 3"
KEY_STORAGE="Hardware-backed"
AUTHENTICATION="Multi-factor (PIN + Biometric)"

echo "HSM partition created for user: $USER_ID"
echo "Partition ID: $PARTITION_ID"
echo "Security Level: $SECURITY_LEVEL"`,
      language: 'bash',
      actionLabel: 'Create HSM Partition',
    },
    {
      id: 'gen_wua_key',
      title: 'Step 3: Generate WUA Key Pair',
      description: (
        <>
          The Remote HSM generates an ECDSA P-256 key pair for the <InfoTooltip term="WUA" />{' '}
          (Wallet Unit Attestation). This key will be used to prove the wallet's authenticity and
          security properties.
        </>
      ),
      code: `# Generate WUA key in Remote HSM
${EUDI_COMMANDS.GEN_WUA_KEY(filenames.PRIVATE_KEY)}

# Extract public key
${EUDI_COMMANDS.EXTRACT_PUB(filenames.PRIVATE_KEY, filenames.PUBLIC_KEY)}

# Display private key details
${EUDI_COMMANDS.DISPLAY_KEY(filenames.PRIVATE_KEY)}

# Display public key details
${EUDI_COMMANDS.DISPLAY_PUB(filenames.PUBLIC_KEY)}

# Key Properties:
# - Algorithm: ECDSA
# - Curve: P-256 (NIST secp256r1)
# - Storage: Remote HSM partition
# - Usage: WUA signing and attestation`,
      language: 'bash',
      actionLabel: 'Generate WUA Key',
    },
    {
      id: 'format_wua_jwk',
      title: 'Step 4: Format Public Key as JWK',
      description: (
        <>
          The WUA public key is formatted as a JSON Web Key (JWK) for use in the{' '}
          <InfoTooltip term="WUA" /> credential. This format is standard for EUDI Wallet
          cryptographic keys.
        </>
      ),
      code: `# Extract public key coordinates from OpenSSL output
${EUDI_COMMANDS.DISPLAY_PUB(filenames.PUBLIC_KEY)}

# Format as JWK (JSON Web Key)
# The output will be parsed to extract X and Y coordinates
# and encoded as Base64URL for JWK format:
#
# {
#   "kty": "EC",           // Key Type: Elliptic Curve
#   "crv": "P-256",        // Curve: NIST P-256
#   "x": "...",            // X coordinate (Base64URL)
#   "y": "...",            // Y coordinate (Base64URL)
#   "use": "sig",          // Usage: Signature
#   "kid": "wua-key-1",    // Key ID
#   "alg": "ES256"         // Algorithm: ECDSA with SHA-256
# }`,
      language: 'bash',
      actionLabel: 'Format as JWK',
    },
    {
      id: 'create_wua',
      title: 'Step 5: Issue WUA Credential',
      description: (
        <>
          The Wallet Provider issues a <InfoTooltip term="WUA" /> credential in SD-JWT format. This
          credential attests to the wallet's security properties, including that keys are stored in
          a certified Remote HSM.
        </>
      ),
      code: `# WUA Credential Structure (SD-JWT format)
# Issued by Wallet Provider, signed with provider's key

# Create WUA payload
cat > wua_payload.json << EOF
{
  "iss": "https://wallet-provider.es",
  "sub": "maria.garcia@example.es",
  "iat": $(date +%s),
  "exp": $(($(date +%s) + 31536000)),
  "wua_pub_key": { /* JWK from Step 4 */ },
  "wscd_type": "remote_hsm",
  "hsm_properties": {
    "certification": "FIPS 140-3 Level 3",
    "manufacturer": "Thales",
    "model": "Luna HSM",
    "firmware_version": "7.8.0"
  }
}
EOF

# In production, the Wallet Provider would:
# 1. Sign the payload with their private key
# 2. Create SD-JWT with selective disclosure
# 3. Return the complete credential to the wallet`,
      language: 'bash',
      actionLabel: 'Issue WUA',
    },
    {
      id: 'hsm_attestation',
      title: 'Step 6: HSM Key Attestation',
      description: (
        <>
          The Remote HSM creates an attestation signature proving that the WUA key was generated and
          is stored in certified hardware. This attestation can be verified by relying parties.
        </>
      ),
      code: `# HSM Key Attestation
# Proves: Key generated in HSM, hardware-backed, non-exportable

# Create attestation data
cat > attestation_data.json << EOF
{
  "key_id": "wua-key-1",
  "generated_in_hsm": true,
  "hardware_backed": true,
  "exportable": false,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Hash the attestation data (SHA-256)
openssl dgst -sha256 -binary attestation_data.json > attestation_hash.bin

# Sign with WUA private key (simulating HSM internal signing)
${EUDI_COMMANDS.SIGN(filenames.PRIVATE_KEY, 'attestation_hash.bin', 'attestation_signature.sig')}

# Display signature in hex
xxd -p attestation_signature.sig | tr -d '\\n'

# Verify attestation signature
${EUDI_COMMANDS.VERIFY(filenames.PUBLIC_KEY, 'attestation_hash.bin', 'attestation_signature.sig')}

echo "Attestation verified successfully"`,
      language: 'bash',
      actionLabel: 'Create HSM Attestation',
    },
  ]

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'wallet_install') {
      // Simulate wallet installation
      const walletInfo = {
        provider: 'ES National Wallet Provider',
        app_version: '2.1.0',
        wsca_certified: true,
        wscd_type: 'Remote HSM',
        supported_curves: ['P-256', 'P-384', 'P-521'],
        user: {
          name: `${MARIA_IDENTITY.given_name} ${MARIA_IDENTITY.family_name}`,
          country: MARIA_IDENTITY.birth_country,
        },
      }

      result = `✅ Wallet Installed Successfully!\n\n${JSON.stringify(walletInfo, null, 2)}`
    } else if (step.id === 'hsm_partition') {
      // Simulate HSM partition creation
      const hsmPartition = {
        user_id: 'maria.garcia@example.es',
        partition_id: `hsm-part-${crypto.randomUUID()}`,
        security_level: 'FIPS 140-3 Level 3',
        key_storage: 'Hardware-backed',
        authentication: 'Multi-factor (PIN + Biometric)',
        created_at: formatTimestamp(),
      }

      result = `✅ HSM Partition Created!\n\n${JSON.stringify(hsmPartition, null, 2)}`
    } else if (step.id === 'gen_wua_key') {
      // Generate WUA key using OpenSSL
      const { keyPair } = await keyGen.generateKeyPair(filenames.PRIVATE_KEY, filenames.PUBLIC_KEY)

      // Retrieve PEM content for display
      const files = fileRetrieval.prepareFilesForExecution([filenames.PRIVATE_KEY])
      const readRes = await openSSLService.execute(
        `openssl enc -base64 -in ${filenames.PRIVATE_KEY}`,
        files
      )
      const keyContent = atob(readRes.stdout.replace(/\n/g, ''))

      result = `✅ WUA Key Pair Generated in Remote HSM!\n\nPrivate Key (Hex):\n${keyPair.privateKeyHex}\n\nPublic Key (Hex):\n${keyPair.publicKeyHex}\n\nPEM Format:\n${keyContent}`
    } else if (step.id === 'format_wua_jwk') {
      if (!keyGen.publicKey) throw new Error('Public key not found. Please execute Step 3 first.')

      // Format public key as JWK
      const files = fileRetrieval.prepareFilesForExecution([filenames.PUBLIC_KEY])
      const jwk = await formatPublicKeyAsJWK(filenames.PUBLIC_KEY, files)

      // Add additional JWK fields
      const fullJWK = {
        ...jwk,
        use: 'sig',
        kid: 'wua-key-1',
        alg: 'ES256',
      }

      setWuaPublicKeyJWK(fullJWK)

      result = `✅ Public Key Formatted as JWK!\n\n${JSON.stringify(fullJWK, null, 2)}`
    } else if (step.id === 'create_wua') {
      if (!wuaPublicKeyJWK) throw new Error('WUA public key JWK not found')

      // Create WUA credential (SD-JWT format)
      const now = Math.floor(Date.now() / 1000)
      const wuaCredential = {
        iss: 'https://wallet-provider.es',
        sub: 'maria.garcia@example.es',
        iat: now,
        exp: now + 31536000, // 1 year
        wua_pub_key: wuaPublicKeyJWK,
        wscd_type: 'remote_hsm',
        hsm_properties: {
          certification: 'FIPS 140-3 Level 3',
          manufacturer: 'Thales',
          model: 'Luna HSM',
          firmware_version: '7.8.0',
        },
        nonce: createNonce(),
      }

      // In a real implementation, this would be signed by the Wallet Provider
      const wuaJWT = `eyJ...header...${btoa(JSON.stringify(wuaCredential))}.signature`

      result = `✅ WUA Credential Issued!\n\nWUA Payload:\n${JSON.stringify(wuaCredential, null, 2)}\n\nSD-JWT Token (abbreviated):\n${wuaJWT.slice(0, 100)}...`
    } else if (step.id === 'hsm_attestation') {
      if (!keyGen.publicKey) throw new Error('WUA key not found')

      // Create attestation data
      const attestationData = {
        key_id: 'wua-key-1',
        generated_in_hsm: true,
        hardware_backed: true,
        exportable: false,
        timestamp: formatTimestamp(),
      }

      // Hash the attestation data
      const attestationBytes = new TextEncoder().encode(JSON.stringify(attestationData))
      const hashBytes = createSHA256Hash(attestationBytes)

      // Save hash for signing
      const hashFilename = artifacts.saveHash('wua', hashBytes)

      // Sign with a simulated HSM root key (in real scenario, this would be HSM's internal key)
      const files = fileRetrieval.prepareFilesForExecution([filenames.PRIVATE_KEY, hashFilename])

      const sigFilename = `wua_attestation_${artifacts.getTimestamp()}.sig`
      const signCmd = `openssl pkeyutl -sign -inkey ${filenames.PRIVATE_KEY} -in ${hashFilename} -out ${sigFilename}`

      const res = await openSSLService.execute(signCmd, files)
      if (res.error) throw new Error(res.error)

      // Retrieve signature
      const sigData = res.files.find((f) => f.name === sigFilename)?.data || new Uint8Array()
      artifacts.saveSignature('wua', sigData)

      result = `✅ HSM Attestation Created!\n\nAttestation Data:\n${JSON.stringify(attestationData, null, 2)}\n\nAttestation Hash (SHA-256):\n${bytesToHex(hashBytes)}\n\nHSM Signature (Hex):\n${bytesToHex(sigData).slice(0, 100)}...`
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
          Understand how the EUDI Wallet is activated using a <InfoTooltip term="Remote HSM" />{' '}
          architecture. Learn about <InfoTooltip term="WUA" /> issuance, HSM key generation, and
          hardware attestation.
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
          <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Wallet Activated!</h3>
          <p className="text-sm text-muted-foreground mb-3">
            María's EUDI Wallet is now ready to receive credentials. The WUA proves that her wallet
            uses a certified Remote HSM for key storage.
          </p>
          <div className="text-xs text-muted-foreground">
            <strong>Next Steps:</strong> María can now request her PID (Person Identification Data)
            from the Motor Vehicle Authority.
          </div>
        </div>
      )}
    </div>
  )
}
