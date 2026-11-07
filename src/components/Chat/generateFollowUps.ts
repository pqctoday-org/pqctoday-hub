// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A follow-up question that fits the kind of document the name refers to. A standard,
 * a policy, a validation program and a certification scheme answer different questions, so
 * no name is asked about as if every one issued a certificate: FIPS 203/204/205 define
 * algorithms (validated through CAVP), FIPS 140 defines module requirements (validated
 * through CMVP), and the rest are policy, guidance or scheme documents whose scope needs
 * checking first.
 */
function standardFollowUp(std: string): string {
  if (/^FIPS\s*140-[23]$/i.test(std)) {
    return `Which products have a CMVP module certificate under ${std}, and which algorithms does each cover?`
  }
  if (/^FIPS\s*20[345]$/i.test(std)) {
    return `Which implementations have CAVP algorithm validation for ${std}, and is the algorithm inside a validated module?`
  }
  if (/^CNSA/i.test(std)) {
    return `Does ${std} apply to my organization, and how is a product shown to meet it?`
  }
  if (/^(SP\s*800-|NIST\s*IR)/i.test(std)) {
    return `What does ${std} require or recommend, and does it apply to my systems?`
  }
  // ETSI (standards body), ANSSI (authority that also runs evaluation schemes)
  return `Is ${std} a standard, guidance or an evaluation scheme here, and does it apply to me?`
}

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
      followUps.push(standardFollowUp(std))
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
      case 'grc':
        followUps.push(
          'What obligation or framework does this trace to?',
          'What evidence would I need to show this is met?'
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
      case 'cert-engineer':
        followUps.push(
          'How is this tested for FIPS 140-3 or Common Criteria?',
          'What evidence would a validation lab need for this?'
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
