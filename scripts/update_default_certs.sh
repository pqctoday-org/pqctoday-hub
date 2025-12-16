#!/bin/bash
# Extract certs from generated_certs.txt and create new defaultCertificates.ts

INPUT="generated_certs.txt"
OUTPUT="src/components/PKILearning/modules/TLSBasics/utils/defaultCertificates.ts"

# Extract each section
extract_section() {
    local start="$1"
    local end="$2"
    sed -n "/${start}/,/${end}/p" "$INPUT" | grep -v "$start" | grep -v "$end"
}

RSA_ROOT=$(extract_section "RSA_ROOT_CA_START" "RSA_ROOT_CA_END")
RSA_SERVER_KEY=$(extract_section "RSA_SERVER_KEY_START" "RSA_SERVER_KEY_END")
RSA_SERVER_CERT=$(extract_section "RSA_SERVER_CERT_START" "RSA_SERVER_CERT_END")
RSA_CLIENT_KEY=$(extract_section "RSA_CLIENT_KEY_START" "RSA_CLIENT_KEY_END")
RSA_CLIENT_CERT=$(extract_section "RSA_CLIENT_CERT_START" "RSA_CLIENT_CERT_END")
MLDSA_ROOT=$(extract_section "MLDSA_ROOT_CA_START" "MLDSA_ROOT_CA_END")
MLDSA_SERVER_KEY=$(extract_section "MLDSA_SERVER_KEY_START" "MLDSA_SERVER_KEY_END")
MLDSA_SERVER_CERT=$(extract_section "MLDSA_SERVER_CERT_START" "MLDSA_SERVER_CERT_END")
MLDSA_CLIENT_KEY=$(extract_section "MLDSA_CLIENT_KEY_START" "MLDSA_CLIENT_KEY_END")
MLDSA_CLIENT_CERT=$(extract_section "MLDSA_CLIENT_CERT_START" "MLDSA_CLIENT_CERT_END")

cat > "$OUTPUT" << EOF
// Default TLS Certificates - Generated $(date '+%Y-%m-%d') with OpenSSL 3.6.0
// RSA Root CA signs both Server and Client certs for mTLS support

export const DEFAULT_ROOT_CA = \`${RSA_ROOT}\`

export const DEFAULT_SERVER_KEY = \`${RSA_SERVER_KEY}\`

export const DEFAULT_SERVER_CERT = \`${RSA_SERVER_CERT}\`

export const DEFAULT_CLIENT_KEY = \`${RSA_CLIENT_KEY}\`

export const DEFAULT_CLIENT_CERT = \`${RSA_CLIENT_CERT}\`

// ML-DSA-44 Root CA signs both Server and Client certs for PQC mTLS

export const DEFAULT_MLDSA_ROOT_CA = \`${MLDSA_ROOT}\`

export const DEFAULT_MLDSA_SERVER_KEY = \`${MLDSA_SERVER_KEY}\`

export const DEFAULT_MLDSA_SERVER_CERT = \`${MLDSA_SERVER_CERT}\`

export const DEFAULT_MLDSA_CLIENT_KEY = \`${MLDSA_CLIENT_KEY}\`

export const DEFAULT_MLDSA_CLIENT_CERT = \`${MLDSA_CLIENT_CERT}\`
EOF

echo "Updated $OUTPUT with new certificates"
