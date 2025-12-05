const output = `read EC key
Private-Key: (256 bit)
priv:
    79:c9:89:51:92:46:6d:9a:05:56:b6:bb:54:cf:1d:
    03:5e:8f:61:a5:04:dd:6c:bd:ad:da:bc:58:b2:15:
    90:28
pub: 
    04:87:93:1d:c6:fa:4b:22:56:4f:a9:35:ae:c2:58:
    86:e3:c2:c9:e2:c4:60:27:be:5f:d6:54:20:54:95:
    a1:2a:da:08:c4:c0:b0:88:f8:9d:e3:f1:7f:1f:85:
    0d:69:b4:81:0b:e0:90:01:2e:be:60:64:c1:d4:66:
    ab:c9:3d:f9:e3
ASN1 OID: secp256k1`

const extractHexFromOpenSSLText = (output: string, sectionHeader: string): string => {
  // Match the section header, then capture all following lines that start with whitespace (indentation)
  // This assumes the hex dump is indented, which is standard OpenSSL behavior.
  // Actually, simpler: match section header, then capture all chars that are hex, colon, or whitespace,
  // BUT stop before a line that starts with a non-whitespace char (like "ASN1" or "pub:")

  // Let's use a loop to consume lines
  const lines = output.split('\n')
  let capturing = false
  let hex = ''

  for (const line of lines) {
    if (line.trim().startsWith(sectionHeader)) {
      capturing = true
      // Check if there is content on the same line (rare for openssl -text, usually next line)
      const parts = line.split(sectionHeader)
      if (parts[1] && parts[1].trim()) {
        hex += parts[1].trim()
      }
      continue
    }

    if (capturing) {
      // If line is empty or starts with non-whitespace (and isn't just a continuation), stop.
      // OpenSSL hex dump lines always start with spaces.
      if (
        line.trim().length > 0 &&
        !line.startsWith('    ') &&
        !line.startsWith('\t') &&
        !line.startsWith(' ')
      ) {
        break
      }
      hex += line.trim()
    }
  }

  return hex.replace(/[^0-9a-fA-F]/g, '')
}

const privHex = extractHexFromOpenSSLText(output, 'priv:')
console.log('Private Key Hex:', privHex)
console.log('Expected Length:', 64)
console.log('Actual Length:', privHex.length)

const pubHex = extractHexFromOpenSSLText(output, 'pub:')
console.log('Public Key Hex:', pubHex)
console.log('Expected Length:', 130)
console.log('Actual Length:', pubHex.length)

if (privHex.length !== 64) {
  console.error('ERROR: Private key extraction failed!')
}

if (pubHex.length !== 130) {
  console.error('ERROR: Public key extraction failed!')
}
