// SPDX-License-Identifier: GPL-3.0-only
/** Extract entity names from assistant response and generate follow-up questions (fallback). */
export function generateFollowUps(
  content: string,
  tab?: string,
  persona?: string | null
): string[] {
  const followUps: string[] = []
  const seen = new Set<string>()

  // Match PQC algorithm names (broadened)
  const algoMatches = content.match(
    /\b(ML-KEM(?:-\d+)?|ML-DSA(?:-\d+)?|SLH-DSA(?:-\d+)?|FN-DSA|FALCON|Kyber(?:-\d+)?|Dilithium(?:-\d+)?|FrodoKEM|HQC|Classic.?McEliece|BIKE|LMS|XMSS|HSS|SPHINCS\+?|X-Wing|X25519MLKEM768)(?!\w)/gi
  )
  if (algoMatches) {
    const algo = algoMatches[0].replace(/-\d+$/, '')
    const key = `algo-${algo.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      followUps.push(`What are the performance characteristics of ${algo}?`)
    }
  }

  // Match FIPS/CNSA/NIST standards (broadened)
  const stdMatches = content.match(
    /\b(FIPS\s*20[345]|FIPS\s*140-[23]|CNSA\s*2\.0|SP\s*800-\d+|NIST\s*IR\s*\d+|ETSI|ANSSI)\b/gi
  )
  if (stdMatches && followUps.length < 3) {
    const std = stdMatches[0]
    const key = `std-${std.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      followUps.push(`Which products have ${std} certification?`)
    }
  }

  // Match product/vendor names (broadened)
  const productMatches = content.match(
    /\b(OpenSSL|Botan|BouncyCastle|Bouncy Castle|Thales|Entrust|Fortanix|Marvell|SafeNet|wolfSSL|GnuTLS|AWS|Azure|Google Cloud|Cloudflare|PQShield|SandboxAQ|IBM|Cisco|Palo Alto|DigiCert|Venafi|HashiCorp|Keyfactor)\b/gi
  )
  if (productMatches && followUps.length < 3) {
    const product = productMatches[0]
    const key = `prod-${product.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      followUps.push(`What PQC algorithms does ${product} support?`)
    }
  }

  // Match learning module topics (broadened)
  const moduleMatches = content.match(
    /\b(TLS\s*1\.3|hybrid key exchange|hybrid crypto|crypto agility|digital assets|blockchain|QKD|key management|PKI|5G|IoT|VPN|SSH|email signing|S\/MIME|code signing|digital identity|entropy|DRBG|Merkle tree|certificate|CBOM)\b/gi
  )
  if (moduleMatches && followUps.length < 3) {
    const topic = moduleMatches[0]
    const key = `mod-${topic.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      followUps.push(`Tell me more about ${topic} and PQC`)
    }
  }

  // Workshop-aware follow-up
  if (tab && tab !== 'learn' && followUps.length < 3) {
    followUps.push('What should I try next in the workshop?')
  }

  // Persona-aware generic fallbacks when no entity matches
  if (followUps.length === 0) {
    switch (persona) {
      case 'executive':
        followUps.push(
          'What is the business impact of this?',
          'How should I prioritize this in our migration roadmap?'
        )
        break
      case 'developer':
        followUps.push('Show me an implementation example', 'What libraries support this?')
        break
      case 'architect':
        followUps.push(
          'How does this affect our security architecture?',
          'What are the integration considerations?'
        )
        break
      case 'researcher':
        followUps.push(
          'What are the latest research developments on this?',
          'How does this compare to alternative approaches?'
        )
        break
      case 'ops':
        followUps.push(
          'What are the operational deployment steps?',
          'How do I configure this in our infrastructure?'
        )
        break
      default:
        followUps.push('Tell me more about this topic', 'How does this relate to PQC migration?')
    }
  }

  return followUps.slice(0, 3)
}
