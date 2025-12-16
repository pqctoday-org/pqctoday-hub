#!/bin/bash
# Generate fresh RSA and ML-DSA-44 certificate chains for TLS module
# Uses OpenSSL 3.6.0 with PQC support

set -e
OPENSSL=/opt/homebrew/bin/openssl

echo "OpenSSL version: $($OPENSSL version)"
echo ""

# Create temp directory
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

cd $TMPDIR

echo "=== Generating RSA Certificate Chain ==="

# RSA Root CA
$OPENSSL genpkey -algorithm RSA -out rsa_root.key -pkeyopt rsa_keygen_bits:2048
$OPENSSL req -new -x509 -key rsa_root.key -out rsa_root.crt -days 365 \
  -subj "/CN=PQC Demo RSA Root/O=PQC Demo/C=US"

# RSA Server Key and CSR
$OPENSSL genpkey -algorithm RSA -out rsa_server.key -pkeyopt rsa_keygen_bits:2048
$OPENSSL req -new -key rsa_server.key -out rsa_server.csr \
  -subj "/CN=localhost/O=PQC Demo Server/C=US"
# Sign with Root CA
$OPENSSL x509 -req -in rsa_server.csr -CA rsa_root.crt -CAkey rsa_root.key \
  -CAcreateserial -out rsa_server.crt -days 365

# RSA Client Key and CSR
$OPENSSL genpkey -algorithm RSA -out rsa_client.key -pkeyopt rsa_keygen_bits:2048
$OPENSSL req -new -key rsa_client.key -out rsa_client.csr \
  -subj "/CN=client/O=PQC Demo Client/C=US"
# Sign with Root CA
$OPENSSL x509 -req -in rsa_client.csr -CA rsa_root.crt -CAkey rsa_root.key \
  -CAcreateserial -out rsa_client.crt -days 365

echo "RSA chain generated."

echo ""
echo "=== Generating ML-DSA-44 Certificate Chain ==="

# ML-DSA-44 Root CA
$OPENSSL genpkey -algorithm mldsa44 -out mldsa_root.key
$OPENSSL req -new -x509 -key mldsa_root.key -out mldsa_root.crt -days 365 \
  -subj "/CN=PQC Demo ML-DSA Root/O=PQC Demo/C=US"

# ML-DSA-44 Server Key and CSR
$OPENSSL genpkey -algorithm mldsa44 -out mldsa_server.key
$OPENSSL req -new -key mldsa_server.key -out mldsa_server.csr \
  -subj "/CN=localhost/O=PQC Demo Server/C=US"
# Sign with Root CA
$OPENSSL x509 -req -in mldsa_server.csr -CA mldsa_root.crt -CAkey mldsa_root.key \
  -CAcreateserial -out mldsa_server.crt -days 365

# ML-DSA-44 Client Key and CSR
$OPENSSL genpkey -algorithm mldsa44 -out mldsa_client.key
$OPENSSL req -new -key mldsa_client.key -out mldsa_client.csr \
  -subj "/CN=client/O=PQC Demo Client/C=US"
# Sign with Root CA
$OPENSSL x509 -req -in mldsa_client.csr -CA mldsa_root.crt -CAkey mldsa_root.key \
  -CAcreateserial -out mldsa_client.crt -days 365

echo "ML-DSA-44 chain generated."

echo ""
echo "===== BEGIN OUTPUT ====="

echo "RSA_ROOT_CA_START"
cat rsa_root.crt
echo "RSA_ROOT_CA_END"

echo "RSA_SERVER_KEY_START"
cat rsa_server.key
echo "RSA_SERVER_KEY_END"

echo "RSA_SERVER_CERT_START"
cat rsa_server.crt
echo "RSA_SERVER_CERT_END"

echo "RSA_CLIENT_KEY_START"
cat rsa_client.key
echo "RSA_CLIENT_KEY_END"

echo "RSA_CLIENT_CERT_START"
cat rsa_client.crt
echo "RSA_CLIENT_CERT_END"

echo "MLDSA_ROOT_CA_START"
cat mldsa_root.crt
echo "MLDSA_ROOT_CA_END"

echo "MLDSA_SERVER_KEY_START"
cat mldsa_server.key
echo "MLDSA_SERVER_KEY_END"

echo "MLDSA_SERVER_CERT_START"
cat mldsa_server.crt
echo "MLDSA_SERVER_CERT_END"

echo "MLDSA_CLIENT_KEY_START"
cat mldsa_client.key
echo "MLDSA_CLIENT_KEY_END"

echo "MLDSA_CLIENT_CERT_START"
cat mldsa_client.crt
echo "MLDSA_CLIENT_CERT_END"

echo "===== END OUTPUT ====="
