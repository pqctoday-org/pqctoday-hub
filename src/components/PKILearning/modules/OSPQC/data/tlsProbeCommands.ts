// SPDX-License-Identifier: AGPL-3.0-only
/** A fresh OpenSSL process tests its loaded configuration, without a -groups override.
 * TLS_HOST/TLS_ENDPOINT may point to a fictional test server; use SSL_CERT_FILE for its CA.
 * Keep the handshake exit status: a grep match alone is not a successful connection.
 */
export const OPENSSL_CONFIG_PROBE = `TLS_HOST=\${TLS_HOST:-cloudflare.com}
TLS_ENDPOINT=\${TLS_ENDPOINT:-"$TLS_HOST:443"}
if openssl s_client -connect "$TLS_ENDPOINT" -servername "$TLS_HOST" \\
  -tls1_3 -verify_return_error -verify_hostname "$TLS_HOST" \\
  </dev/null >tls-check.txt 2>&1; then
  grep -E 'Negotiated TLS1.3 group|Peer Temp Key|Server Temp Key|Verification:|Verify return code:' tls-check.txt
else
  tls_status=$?
  cat tls-check.txt
  exit "$tls_status"
fi`

/** Full isolated sample configuration; the existing default provider supplies these groups.
 * This is not a replacement for a distribution's system configuration or crypto policy.
 */
export const ISOLATED_OPENSSL_CONFIG = `# OpenSSL 3.5.0+ only; run in a sample directory.
cat >tls-sample.cnf <<'EOF'
openssl_conf = default_conf
[default_conf]
ssl_conf = ssl_sect
[ssl_sect]
system_default = system_default_sect
[system_default_sect]
MinProtocol = TLSv1.2
CipherString = DEFAULT@SECLEVEL=2
Groups = x25519mlkem768:x25519:prime256v1:secp384r1
EOF
export OPENSSL_CONF="$PWD/tls-sample.cnf"`
