import type { TLSConfig } from '../../../../../store/tls-learning.store'

export const generateOpenSSLConfig = (config: TLSConfig, side: 'client' | 'server'): string => {
  // If user is in raw mode, use their custom config directly
  if (config.mode === 'raw' && config.rawConfig) {
    return config.rawConfig
  }

  // Otherwise, generate from UI settings
  const cipherSuites = config.cipherSuites.join(':')
  const groups = config.groups.join(':')
  const sigAlgs = config.signatureAlgorithms.join(':')

  // Basic Template
  let conf = `openssl_conf = default_conf

[ default_conf ]
ssl_conf = ssl_sect

[ ssl_sect ]
system_default = system_default_sect

[ system_default_sect ]
`

  if (cipherSuites) {
    conf += `Ciphersuites = ${cipherSuites}\n`
  }

  // Note: CipherString is for TLS 1.2, Ciphersuites for 1.3
  // We can set both to be safe or just 1.3
  // conf += `CipherString = DEFAULT\n`

  if (groups) {
    conf += `Groups = ${groups}\n`
  }

  if (sigAlgs) {
    conf += `SignatureAlgorithms = ${sigAlgs}\n`
  }

  conf += `MinProtocol = TLSv1.3\n`
  conf += `MaxProtocol = TLSv1.3\n`

  if (side === 'server' && config.verifyClient) {
    // Request and Require Client Certificate
    conf += `VerifyMode = Peer,Request\n`
    conf += `VerifyCAFile = /ssl/ca.crt\n` // Ensure it checks the CA
  }

  if (side === 'client' && config.clientAuthEnabled) {
    // Should automatic if certs are loaded, but good to be explicit if possible
    // Client doesn't usually set VerifyMode like this for its own cert sending?
    // It sends if requested.
  }

  return conf
}
