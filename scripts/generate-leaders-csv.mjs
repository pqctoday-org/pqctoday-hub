#!/usr/bin/env node
// scripts/generate-leaders-csv.mjs
// Generates leaders_03122026.csv with:
//   1. Updated KeyResourceUrl for existing leaders found in enrichment files
//   2. All new leaders extracted from enrichment Authors fields

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const headers = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => (row[h] = values[idx] ?? ''))
    rows.push(row)
  }
  return { headers, rows }
}

function csvField(val) {
  if (val == null) return ''
  const s = String(val)
  // Quote if contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function rowToCsv(headers, row) {
  return headers.map((h) => csvField(row[h] ?? '')).join(',')
}

function avatar(name, color) {
  const encoded = name
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .replace(/\s+/g, '+')
  return `https://ui-avatars.com/api/?name=${encoded}&background=0b0d17&color=${color}&size=128&bold=true`
}

// ─── Category colors ─────────────────────────────────────────────────────────
const COLORS = {
  Government: '22d3ee',
  'Industry Vendor': 'a78bfa',
  'Industry Adopter': '10b981',
  'Algorithm Inventor': 'f59e0b',
  Standards: '60a5fa',
}

// ─── 1. KeyResourceUrl updates for existing leaders ──────────────────────────
// Key: leader Name (exact match from CSV); Value: library reference_ids to ADD (semicolon-sep)
// These ref_ids link to /library?ref=ID for validated, catalogued references only.
// The script will APPEND new ref_ids to existing KeyResourceUrl, deduplicating.

const EXISTING_UPDATES = {
  // From extraction script (exact matches — enrichment ref_ids = library reference_ids)
  'John Gray': 'draft-bonnell-lamps-chameleon-certs-07',
  'Mike Ounsworth': 'draft-bonnell-lamps-chameleon-certs-07',
  'Scott Fluhrer': 'RFC-9909;draft-sfluhrer-ipsecme-ikev2-mldsa-00;draft-sfluhrer-ssh-mldsa',
  'Prof. Dr. Michele Mosca': 'GRI-Quantum-Threat-Timeline-2024;GRI-Quantum-Threat-Timeline-2025',
  'Russ Housley': 'RFC 5652;RFC 5083',
  'David Hook': 'draft-bonnell-lamps-chameleon-certs-07',

  // Manual additions — abbreviated IETF authors; ref_ids from library
  'Tim Hollebeek': 'draft-ietf-pquip-pqc-engineers-14',
  'Panos Kampanakis': 'RFC-9909;draft-ietf-tls-ecdhe-mlkem-04;draft-ietf-pquip-pqc-engineers-14',
  'Bas Westerbaan': 'RFC 9881',
  'Kris Kwiatkowski': 'draft-ietf-tls-ecdhe-mlkem-04;draft-kwiatkowski-pquip-pqc-migration-00',
  'Dr. Douglas Stebila': 'draft-ietf-tls-ecdhe-mlkem-04',

  // Algorithm inventors — NIST finalized standards (library ref_ids)
  'Dr. Vadim Lyubashevsky': 'FIPS 203;FIPS 204',
  'Prof. Dr. Léo Ducas': 'FIPS 203;FIPS 204',
  'Dr. Joppe Bos': 'FIPS 203',
  'Prof. Dr. Eike Kiltz': 'FIPS 203;FIPS 204',
  'Dr. Gregor Seiler': 'FIPS 204',
  'Prof. Dr. Andreas Hülsing': 'FIPS 205',
  'Dr. Jean-Philippe Aumasson': 'FIPS 205',
  'Damien Stehlé': 'FIPS 203;FIPS 204',
  'Pierre-Alain Fouque': 'FIPS 206',
  'Éric Brier': 'FIPS 206',
  'Daniel J. Bernstein': 'FIPS 205',
  // HQC authors — FIPS 207 published; use library ref_id
  'Dr. Carlos Aguilar Melchor': 'FIPS-207-HQC',
  'Prof. Dr. Gilles Zémor': 'FIPS-207-HQC',

  // NIST leaders — finalized FIPS/IR documents (library ref_ids)
  'Dr. Dustin Moody': 'NIST IR 8413;FIPS 203',
  'Dr. Lily Chen': 'FIPS 203;FIPS 204;FIPS 205',
  'Dr. Gorjan Alagic': 'NIST IR 8413',

  // Standards contributors
  'Sofia Celi': '', // PQUIP WG page — not a library record; clear
  'Sophie Schmieg': 'FIPS 205',
  'Matthew Campagna': 'FIPS 203',
  'Dr. Thom Wiggers': 'draft-ietf-tls-ecdhe-mlkem-04',
  'Corey Bonnell': 'draft-bonnell-lamps-chameleon-certs-07',
}

// ─── 2. New leaders to add ───────────────────────────────────────────────────

const NEW_LEADERS = [
  {
    Name: 'Tomofumi Okubo',
    Country: 'USA',
    Role: 'Software Engineer; Standards Contributor',
    Organization: 'DigiCert',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of Chameleon Certificates IETF Internet-Draft (draft-bonnell-lamps-chameleon-certs) and active contributor to IETF LAMPS Working Group hybrid PKI specifications; represents DigiCert in standardization of PQC X.509 certificate formats and encoding.',
    ImageUrl: avatar('Tomofumi Okubo', COLORS.Standards),
    WebsiteUrl: 'https://www.digicert.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'draft-bonnell-lamps-chameleon-certs-07',
  },
  {
    Name: 'Dr. Marco Piani',
    Country: 'Canada',
    Role: 'Senior Research Analyst',
    Organization: 'evolutionQ Inc.',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author with Michele Mosca of the annual Global Risk Institute Quantum Threat Timeline reports (2024, 2025); provides quantitative probabilistic assessments of cryptographically relevant quantum computer (CRQC) timelines used by policymakers and enterprises worldwide.',
    ImageUrl: avatar('Marco Piani', COLORS.Standards),
    WebsiteUrl: 'https://evolutionq.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'GRI-Quantum-Threat-Timeline-2024;GRI-Quantum-Threat-Timeline-2025',
  },
  {
    Name: 'Alison Becker',
    Country: 'USA',
    Role: 'Cryptographer',
    Organization: 'National Security Agency (NSA)',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NSA cryptographer and co-author of RFC 9763, specifying algorithm identifiers for ML-KEM, ML-DSA, and SLH-DSA for use with the Commercial National Security Algorithm Suite 2.0 (CNSA 2.0); contributes to NSA public guidance on quantum-safe cryptography.',
    ImageUrl: avatar('Alison Becker', COLORS.Government),
    WebsiteUrl: 'https://www.nsa.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9763',
  },
  {
    Name: 'Michael Jenkins',
    Country: 'USA',
    Role: 'Technical Director; Cryptographer',
    Organization: 'National Security Agency (NSA)',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NSA Technical Director and co-author of RFC 9763 defining algorithm identifiers for post-quantum algorithms in CNSA 2.0; contributor to NSA public guidance on quantum-safe cryptography transitions for national security systems.',
    ImageUrl: avatar('Michael Jenkins', COLORS.Government),
    WebsiteUrl: 'https://www.nsa.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9763',
  },
  {
    Name: 'Rebecca Guthrie',
    Country: 'USA',
    Role: 'Cryptographer',
    Organization: 'National Security Agency (NSA)',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NSA cryptographer and co-author of RFC 9763, establishing the algorithm identifiers for ML-KEM, ML-DSA, and SLH-DSA used in federal CNSA 2.0 implementations; contributes to standards underpinning U.S. national security PQC migration.',
    ImageUrl: avatar('Rebecca Guthrie', COLORS.Government),
    WebsiteUrl: 'https://www.nsa.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9763',
  },
  {
    Name: 'Allen Roginsky',
    Country: 'USA',
    Role: 'Research Scientist',
    Organization: 'NIST',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NIST Computer Security Division researcher and co-author of NIST SP 800-131A Revision 3, providing guidance on transitioning cryptographic key lengths and algorithms to post-quantum standards across U.S. federal systems.',
    ImageUrl: avatar('Allen Roginsky', COLORS.Government),
    WebsiteUrl: 'https://csrc.nist.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'NIST-SP-800-131A-Rev3',
  },
  {
    Name: 'Elaine Barker',
    Country: 'USA',
    Role: 'Research Scientist',
    Organization: 'NIST',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NIST researcher and co-author of NIST SP 800-131A Revision 3, guiding federal agencies on transitioning cryptographic key lengths and algorithms to post-quantum standards; long-time contributor to NIST SP 800-57 key management recommendations.',
    ImageUrl: avatar('Elaine Barker', COLORS.Government),
    WebsiteUrl: 'https://csrc.nist.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'NIST-SP-800-131A-Rev3',
  },
  {
    Name: 'Suzanne Lightman',
    Country: 'USA',
    Role: 'Research Scientist; Project Lead',
    Organization: 'NIST NCCoE',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NIST NCCoE project lead and co-author of NIST SP 800-82 Revision 3 (Guide to Operational Technology Security); key contributor to guidance on OT/ICS PQC migration for critical infrastructure sectors including energy, manufacturing, and transportation.',
    ImageUrl: avatar('Suzanne Lightman', COLORS.Government),
    WebsiteUrl: 'https://www.nccoe.nist.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'NIST SP 800-82 Rev. 3',
  },
  {
    Name: 'Michael Thompson',
    Country: 'USA',
    Role: 'Lead Engineer; OT Security Expert',
    Organization: 'MITRE',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'MITRE engineer and co-author of NIST SP 800-82 Revision 3, providing authoritative guidance on cybersecurity for operational technology (OT) environments; his work informs PQC migration planning for industrial control systems and critical infrastructure.',
    ImageUrl: avatar('Michael Thompson', COLORS.Standards),
    WebsiteUrl: 'https://www.mitre.org/',
    LinkedinUrl: '',
    KeyResourceUrl: 'NIST SP 800-82 Rev. 3',
  },
  {
    Name: 'Eric Rescorla',
    Country: 'USA',
    Role: 'Chief Technology Officer',
    Organization: 'Mozilla',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Chief Technology Officer at Mozilla; primary editor of TLS 1.3 (RFC 8446) and DTLS 1.3 (RFC 9147); one of the most influential contributors to modern web security protocols whose standards are the primary migration targets for quantum-safe TLS deployment.',
    ImageUrl: avatar('Eric Rescorla', COLORS.Standards),
    WebsiteUrl: 'https://mozilla.org/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 8446;RFC 9147',
  },
  {
    Name: 'David Benjamin',
    Country: 'USA',
    Role: 'Senior Software Engineer; Standards Contributor',
    Organization: 'Google',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Google software engineer and co-author of the IETF Merkle Tree Certificates Internet-Draft, developing post-quantum optimized certificate compression for TLS that dramatically reduces handshake sizes while enabling PQC algorithms; active contributor to TLS and BoringSSL.',
    ImageUrl: avatar('David Benjamin', COLORS.Standards),
    WebsiteUrl: 'https://www.google.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'draft-ietf-plants-merkle-tree-certs',
  },
  {
    Name: 'Jake Massimo',
    Country: 'USA',
    Role: 'Applied Scientist; Cryptography Researcher',
    Organization: 'Amazon Web Services',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'AWS cryptography researcher and co-author of RFC 9909 (Post-Quantum Traditional Hybrid Key Encapsulation Methods), defining standards for combining classical and PQC key exchange mechanisms in a secure hybrid construction adopted in TLS and IKEv2.',
    ImageUrl: avatar('Jake Massimo', COLORS.Standards),
    WebsiteUrl: 'https://aws.amazon.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9909',
  },
  {
    Name: 'Jim Schaad',
    Country: 'USA',
    Role: 'Security Standards Contributor',
    Organization: 'August Cellars',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Prolific IETF security standards author who edited COSE (RFC 9052), CBOR security formats, and S/MIME cryptographic message standards; his foundational work enables PQC algorithm integration in constrained IoT environments. Passed away August 2021.',
    ImageUrl: avatar('Jim Schaad', COLORS.Standards),
    WebsiteUrl: '',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 9052',
  },
  {
    Name: 'Karen Seo',
    Country: 'USA',
    Role: 'Network Security Engineer',
    Organization: 'BBN Technologies',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of RFC 4301 (Security Architecture for IP / IPsec), the foundational standard for IPsec that forms the basis for quantum-safe VPN migration planning under CNSA 2.0 and NIST guidance across government and enterprise environments.',
    ImageUrl: avatar('Karen Seo', COLORS.Standards),
    WebsiteUrl: '',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 4301',
  },
  {
    Name: 'Stephen Kent',
    Country: 'USA',
    Role: 'Chief Scientist, Information Security',
    Organization: 'BBN Technologies',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Author of RFC 4303 (IP Encapsulating Security Payload) and RFC 4301 (IPsec Architecture), foundational VPN security standards that are primary migration targets in quantum-safe transition programs; former IETF Security Area Director.',
    ImageUrl: avatar('Stephen Kent', COLORS.Standards),
    WebsiteUrl: '',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 4303;RFC 4301',
  },
  {
    Name: 'Pieter Wuille',
    Country: 'Belgium/USA',
    Role: 'Bitcoin Core Developer; Co-Founder',
    Organization: 'Bitcoin Core;Chaincode Labs',
    Type: 'Private',
    Category: 'Algorithm Inventor',
    Contribution:
      'Author of BIP-32 (Hierarchical Deterministic Wallets) and BIP-141 (Segregated Witness), foundational Bitcoin cryptographic standards; co-author of BIP-340 Schnorr signatures; co-founder of Chaincode Labs; his protocol designs are primary targets for digital asset PQC migration.',
    ImageUrl: avatar('Pieter Wuille', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://chaincode.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'BIP-32;BIP-141',
  },
  {
    Name: 'Tim Ruffing',
    Country: 'Germany',
    Role: 'Research Scientist; Cryptographer',
    Organization: 'Blockstream',
    Type: 'Private',
    Category: 'Algorithm Inventor',
    Contribution:
      'Author of BIP-340 (Schnorr Signatures for Bitcoin), enabling efficient signature aggregation; researcher at Blockstream; co-author of MuSig2 threshold signatures; his signature schemes are central to digital asset cryptographic infrastructure requiring PQC migration.',
    ImageUrl: avatar('Tim Ruffing', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://blockstream.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'BIP-340',
  },
  {
    Name: 'Anthony Towns',
    Country: 'Australia',
    Role: 'Bitcoin Core Developer; Researcher',
    Organization: 'Bitcoin Core',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Author of BIP-341 (Taproot), upgrading Bitcoin smart contracts with Schnorr signatures and Merkle trees; independent Bitcoin Core developer whose protocol upgrades are relevant to PQC migration planning for digital asset ecosystems.',
    ImageUrl: avatar('Anthony Towns', COLORS.Standards),
    WebsiteUrl: '',
    LinkedinUrl: '',
    KeyResourceUrl: 'BIP-341',
  },
  {
    Name: 'Gavin Wood',
    Country: 'UK',
    Role: 'Co-Founder; CTO',
    Organization: 'Ethereum Foundation;Parity Technologies',
    Type: 'Private',
    Category: 'Industry Vendor',
    Contribution:
      'Co-founder of Ethereum and author of the Ethereum Yellow Paper defining the EVM protocol; founder of Parity Technologies and Polkadot/Web3 Foundation; his foundational blockchain architecture designs are central to PQC migration strategies for decentralized infrastructure.',
    ImageUrl: avatar('Gavin Wood', COLORS['Industry Vendor']),
    WebsiteUrl: 'https://ethereum.org/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Ethereum-Yellow-Paper',
  },
  {
    Name: 'Brian Campbell',
    Country: 'USA',
    Role: 'Senior Technical Architect; OAuth Expert',
    Organization: 'Ping Identity',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of SD-JWT Verifiable Credentials (RFC-9901) and DPoP (RFC 9449); prolific IETF OAuth working group contributor; his digital identity and access token standards require PQC-safe signature migration across enterprise SSO and identity infrastructure.',
    ImageUrl: avatar('Brian Campbell', COLORS.Standards),
    WebsiteUrl: 'https://www.pingidentity.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9901-SD-JWT-VC;RFC 9449',
  },
  {
    Name: 'Daniel Fett',
    Country: 'Germany',
    Role: 'Security Researcher; OAuth Expert',
    Organization: 'Authlete',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of SD-JWT Verifiable Credentials (RFC-9901) and DPoP (RFC 9449); active IETF OAuth working group contributor; his digital identity standards form the basis for quantum-safe verifiable credential and access token systems in the EU and globally.',
    ImageUrl: avatar('Daniel Fett', COLORS.Standards),
    WebsiteUrl: 'https://authlete.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9901-SD-JWT-VC;RFC 9449',
  },
  {
    Name: 'John Bradley',
    Country: 'Canada',
    Role: 'Senior Technical Architect; Identity Standards Expert',
    Organization: 'Yubico',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of DPoP (RFC 9449) and JSON Web Token (RFC 7519); active in OpenID Foundation and IETF OAuth working group; his identity token standards are critical quantum migration targets for enterprise single sign-on and API security.',
    ImageUrl: avatar('John Bradley', COLORS.Standards),
    WebsiteUrl: 'https://www.yubico.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 9449;RFC 7519',
  },
  {
    Name: 'Kristina Yasuda',
    Country: 'Japan/USA',
    Role: 'Senior Identity Standards Engineer',
    Organization: 'Microsoft',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of SD-JWT Verifiable Credentials (RFC-9901) and active contributor to W3C Verifiable Credentials Data Model; contributes to quantum-safe digital identity infrastructure at Microsoft and IETF decentralized identity standards.',
    ImageUrl: avatar('Kristina Yasuda', COLORS.Standards),
    WebsiteUrl: 'https://www.microsoft.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9901-SD-JWT-VC',
  },
  {
    Name: 'Mark D. Baushke',
    Country: 'USA',
    Role: 'Network Security Engineer',
    Organization: 'Juniper Networks',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Author of RFC 8731 (Use of Curve25519 and Curve448 in SSH), establishing the baseline elliptic curve cryptography in SSH that is central to the PQC-SSH migration path; active in IETF CURDLE working group for cryptographic algorithm updates.',
    ImageUrl: avatar('Mark D. Baushke', COLORS.Standards),
    WebsiteUrl: 'https://www.juniper.net/',
    LinkedinUrl: '',
    KeyResourceUrl: 'IETF RFC 8731',
  },
  {
    Name: 'Paul Bastian',
    Country: 'Germany',
    Role: 'Security Engineer; Standards Contributor',
    Organization: 'Bundesdruckerei (BDR)',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of the IETF Token Status List draft, defining scalable mechanisms for verifiable credential revocation in digital identity systems; employee of Bundesdruckerei (German federal security printing), driving quantum-safe government digital identity infrastructure.',
    ImageUrl: avatar('Paul Bastian', COLORS.Standards),
    WebsiteUrl: 'https://www.bundesdruckerei.de/',
    LinkedinUrl: '',
    KeyResourceUrl: 'IETF-Token-Status-List',
  },
  {
    Name: 'Tobias Looker',
    Country: 'New Zealand',
    Role: 'Principal Cryptography Engineer',
    Organization: 'MATTR',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of the IETF Token Status List draft; principal cryptography engineer at MATTR; expert in W3C Verifiable Credentials, DIF decentralized identity, and OpenID Connect for Verifiable Presentations; driving quantum-safe digital credential infrastructure.',
    ImageUrl: avatar('Tobias Looker', COLORS.Standards),
    WebsiteUrl: 'https://mattr.global/',
    LinkedinUrl: '',
    KeyResourceUrl: 'IETF-Token-Status-List',
  },
  {
    Name: 'Emilia Kasper',
    Country: 'Netherlands/USA',
    Role: 'Software Engineer; Security Researcher',
    Organization: 'Google',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of RFC 6962 (Certificate Transparency), the foundational PKI audit log mechanism being extended for PQC certificate monitoring; OpenSSL contributor; worked on early PQC experiments in Chrome alongside the Cloudflare team.',
    ImageUrl: avatar('Emilia Kasper', COLORS.Standards),
    WebsiteUrl: 'https://www.google.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 6962',
  },
  {
    Name: 'Chris M. Lonvick',
    Country: 'USA',
    Role: 'Network Security Engineer; RFC Editor',
    Organization: 'Cisco Systems',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-editor of SSH Architecture (RFC 4251) and SSH Transport Layer Protocol (RFC 4253), the foundational standards for SSH whose algorithms are primary targets in quantum-safe migration plans worldwide.',
    ImageUrl: avatar('Chris M. Lonvick', COLORS.Standards),
    WebsiteUrl: 'https://www.cisco.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 4251;IETF RFC 4253',
  },
  {
    Name: 'Tatu Ylonen',
    Country: 'Finland',
    Role: 'Inventor of SSH; CEO',
    Organization: 'SSH Communications Security',
    Type: 'Private',
    Category: 'Algorithm Inventor',
    Contribution:
      'Inventor of the Secure Shell (SSH) protocol (1995); co-editor of SSH RFC standards (RFC 4251–4253); founder of SSH Communications Security; his protocol is one of the primary migration targets in quantum-safe transition programs globally, protecting billions of server connections.',
    ImageUrl: avatar('Tatu Ylonen', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://www.ssh.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'IETF RFC 4253;RFC 4251',
  },
  {
    Name: 'Ben Laurie',
    Country: 'UK',
    Role: 'Security Researcher',
    Organization: 'Google',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-inventor of Certificate Transparency (CT2 RFC 9162) at Google; contributor to quantum-safe PKI monitoring infrastructure; original OpenSSL developer; his CT log auditing mechanisms are being extended to support PQC certificate ecosystems.',
    ImageUrl: avatar('Ben Laurie', COLORS.Standards),
    WebsiteUrl: 'https://www.google.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 6962',
  },
  {
    Name: 'Hannes Tschofenig',
    Country: 'Germany',
    Role: 'Professor; IETF Security Expert',
    Organization: 'Hochschule Bonn-Rhein-Sieg (H-BRS)',
    Type: 'Academic',
    Category: 'Standards',
    Contribution:
      'Professor at H-BRS and prolific IETF contributor; co-author of JOSE PQC KEM draft, DTLS 1.3 (RFC 9147), SUIT firmware update protocol (RFC 9019), and IoT device authentication standards; instrumental in bringing post-quantum cryptography to constrained IoT and embedded environments.',
    ImageUrl: avatar('Hannes Tschofenig', COLORS.Standards),
    WebsiteUrl: 'https://www.h-brs.de/',
    LinkedinUrl: '',
    KeyResourceUrl: 'draft-ietf-jose-pqc-kem;RFC 9147;RFC 9019;RFC 7250',
  },
  {
    Name: 'Paul Hoffman',
    Country: 'USA',
    Role: 'Distinguished Engineer; IETF Veteran',
    Organization: 'ICANN',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Distinguished Engineer at ICANN and long-time IETF contributor; co-author of IKEv2 (RFC 7296) and numerous internet security RFCs; significant contributor to DNS security (DNSSEC) and quantum-safe protocol integration in core internet infrastructure.',
    ImageUrl: avatar('Paul Hoffman', COLORS.Standards),
    WebsiteUrl: 'https://www.icann.org/',
    LinkedinUrl: '',
    KeyResourceUrl: 'IETF RFC 7296',
  },
  {
    Name: 'Carsten Bormann',
    Country: 'Germany',
    Role: 'Professor; IETF Expert',
    Organization: 'Universität Bremen TZI',
    Type: 'Academic',
    Category: 'Standards',
    Contribution:
      'Professor at Universität Bremen and leading IETF contributor; co-author of CBOR (Concise Binary Object Representation), CoAP (Constrained Application Protocol), and RFC 7228 defining IoT constraints taxonomy; his compact encoding standards enable PQC in constrained devices.',
    ImageUrl: avatar('Carsten Bormann', COLORS.Standards),
    WebsiteUrl: 'https://www.uni-bremen.de/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 7228',
  },
  {
    Name: 'Charlie Kaufman',
    Country: 'USA',
    Role: 'Security Researcher; Standards Author',
    Organization: 'Microsoft',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Primary author of IKEv2 (RFC 7296), the key negotiation protocol used in IPsec VPNs and a critical migration target for PQC-safe infrastructure; 30+ year contributor to internet security protocols and IETF security area working groups.',
    ImageUrl: avatar('Charlie Kaufman', COLORS.Standards),
    WebsiteUrl: 'https://www.microsoft.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'IETF RFC 7296',
  },
  {
    Name: 'Paul Wouters',
    Country: 'Netherlands/USA',
    Role: 'Senior Software Engineer; IETF Expert',
    Organization: 'Red Hat',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Senior Engineer at Red Hat and active IETF contributor; co-author of RFC 7250 (Using Raw Public Keys in TLS) and contributor to IKEv2/IPsec PQC integration; leads Fedora/RHEL cryptography policy enabling PQC algorithm support across Linux distributions.',
    ImageUrl: avatar('Paul Wouters', COLORS.Standards),
    WebsiteUrl: 'https://www.redhat.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 7250',
  },
  {
    Name: 'Rob Stradling',
    Country: 'UK',
    Role: 'Senior Research Engineer',
    Organization: 'Sectigo',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Senior Research Engineer at Sectigo and co-author of Certificate Transparency v2 (RFC 9162); contributor to crt.sh certificate transparency log search and the broader CT ecosystem that forms the verification backbone for PQC certificate deployment monitoring.',
    ImageUrl: avatar('Rob Stradling', COLORS.Standards),
    WebsiteUrl: 'https://sectigo.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC-9162',
  },
  {
    Name: 'John Gilmore',
    Country: 'USA',
    Role: 'Co-Founder; Cryptography Advocate',
    Organization: 'Electronic Frontier Foundation (EFF)',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-founder of the Electronic Frontier Foundation (EFF) and cypherpunk; co-author of RFC 7250 (Using Raw Public Keys in TLS); early advocate for strong cryptography and export freedom; his work on minimal-state TLS authentication is relevant to constrained-environment PQC deployments.',
    ImageUrl: avatar('John Gilmore', COLORS.Standards),
    WebsiteUrl: 'https://www.eff.org/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 7250',
  },
  {
    Name: 'Katie Arrington',
    Country: 'USA',
    Role: 'Chief Information Officer (CIO)',
    Organization: 'U.S. Department of Defense',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'Chief Information Officer of the U.S. Department of Defense; issued the DoD PQC Migration Memo (2025) directing DoD components to begin preparing for migration to post-quantum cryptography; driving federal PQC adoption across the defense industrial base and supply chain.',
    ImageUrl: avatar('Katie Arrington', COLORS.Government),
    WebsiteUrl: 'https://dodcio.defense.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'DoD-CIO-PQC-Memo-2025',
  },
  {
    Name: 'Nat Sakimura',
    Country: 'Japan',
    Role: 'Research Fellow; OpenID Foundation Chairman Emeritus',
    Organization: 'Nomura Research Institute (NRI)',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Co-author of JSON Web Signature (RFC 7515) and JSON Web Token (RFC 7519); lead designer of OpenID Connect; Chairman Emeritus of the OpenID Foundation; his identity token standards are fundamental migration targets for enterprise authentication requiring PQC-safe signatures.',
    ImageUrl: avatar('Nat Sakimura', COLORS.Standards),
    WebsiteUrl: 'https://www.nri.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 7515;RFC 7519',
  },
  {
    Name: 'Brendan Moran',
    Country: 'Ireland',
    Role: 'Principal Architect; SUIT WG Co-Chair',
    Organization: 'Arm',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Principal Architect at Arm and IETF SUIT Working Group co-chair; co-author of RFC 9019 (A Firmware Update Architecture for Internet of Things), defining secure firmware update mechanisms for IoT devices requiring PQC-safe signing as legacy hash-based algorithms are retired.',
    ImageUrl: avatar('Brendan Moran', COLORS.Standards),
    WebsiteUrl: 'https://www.arm.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 9019',
  },

  // ── CA/Browser Forum S/MIME PQC ──────────────────────────────────────────────

  {
    Name: 'Stephen Davidson',
    Country: 'Canada',
    Role: 'Standards Technology Strategist; S/MIME WG Chair',
    Organization: 'DigiCert',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Chair of the CA/Browser Forum S/MIME Certificate Working Group; proposed CA/Browser Forum Ballot SMC013 enabling ML-DSA and ML-KEM in S/MIME certificates; DigiCert representative driving post-quantum migration standards for email security and publicly-trusted PKI.',
    ImageUrl: avatar('Stephen Davidson', COLORS.Standards),
    WebsiteUrl: 'https://www.digicert.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'CA-B-Forum-Ballot-SMC013',
  },
  {
    Name: 'Martijn Katerbarg',
    Country: 'Netherlands',
    Role: 'Principal Technologist; CA/Browser Forum Contributor',
    Organization: 'Sectigo',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Endorsed CA/Browser Forum Ballot SMC013 enabling ML-DSA and ML-KEM in S/MIME certificates; Sectigo representative to the CA/Browser Forum S/MIME Certificate Working Group; contributes to post-quantum certificate policy development for publicly-trusted certificate authorities.',
    ImageUrl: avatar('Martijn Katerbarg', COLORS.Standards),
    WebsiteUrl: 'https://sectigo.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'CA-B-Forum-Ballot-SMC013',
  },
  {
    Name: 'Clint Wilson',
    Country: 'USA',
    Role: 'Security Engineer; CA/Browser Forum Contributor',
    Organization: 'Apple',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      "Apple's representative to the CA/Browser Forum root program; endorsed Ballot SMC013/SMC014 enabling PQC algorithms in S/MIME certificates; shapes root store policy decisions governing post-quantum certificate trust and algorithm transitions for billions of Apple devices worldwide.",
    ImageUrl: avatar('Clint Wilson', COLORS.Standards),
    WebsiteUrl: 'https://www.apple.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'CA-B-Forum-Ballot-SMC013',
  },
  {
    Name: 'Ashish Dhiman',
    Country: 'India',
    Role: 'Principal Engineer; CA/Browser Forum Contributor',
    Organization: 'GlobalSign',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Endorsed CA/Browser Forum Ballot SMC013/SMC014 enabling post-quantum algorithms in S/MIME certificates; GlobalSign representative to the CA/Browser Forum driving adoption of ML-DSA and ML-KEM in publicly-trusted certificate authorities for quantum-safe email and document signing.',
    ImageUrl: avatar('Ashish Dhiman', COLORS.Standards),
    WebsiteUrl: 'https://www.globalsign.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'CA-B-Forum-Ballot-SMC013',
  },
  {
    Name: 'Andreas Henschel',
    Country: 'Germany',
    Role: 'PKI Expert; CA/Browser Forum Contributor',
    Organization: 'D-Trust',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Endorsed CA/Browser Forum Ballot SMC013 enabling ML-DSA and ML-KEM in S/MIME certificates; D-Trust (BSI subsidiary) representative to the CA/Browser Forum; drives post-quantum certificate standards for German and European digital identity infrastructure.',
    ImageUrl: avatar('Andreas Henschel', COLORS.Standards),
    WebsiteUrl: 'https://www.d-trust.net/',
    LinkedinUrl: '',
    KeyResourceUrl: 'CA-B-Forum-Ballot-SMC013',
  },

  // ── PKCS#11 Standards ────────────────────────────────────────────────────────

  {
    Name: 'Tony Cox',
    Country: 'Australia',
    Role: 'PKCS#11 Specification Editor; Security Standards Expert',
    Organization: 'Cryptsoft',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Lead editor of PKCS#11 v3.0 and v3.2 Cryptographic Token Interface Standards at OASIS; founder of Cryptsoft; his specifications define the HSM programming interface used by all hardware security modules implementing post-quantum algorithms including ML-KEM, ML-DSA, and SLH-DSA.',
    ImageUrl: avatar('Tony Cox', COLORS.Standards),
    WebsiteUrl: 'https://www.cryptsoft.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'PKCS11-V3-OASIS;PKCS11-V32-OASIS',
  },
  {
    Name: 'Robert Relyea',
    Country: 'USA',
    Role: 'Senior Software Engineer; PKCS#11 TC Chair',
    Organization: 'Red Hat',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'OASIS PKCS#11 Technical Committee Chair for v3.1 and v3.2; Red Hat cryptography engineer and NSS (Network Security Services) developer; leads standardization of PKCS#11 post-quantum cryptography mechanisms enabling ML-KEM, ML-DSA, and SLH-DSA in open-source HSM implementations.',
    ImageUrl: avatar('Robert Relyea', COLORS.Standards),
    WebsiteUrl: 'https://www.redhat.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'PKCS11-V32-OASIS;PKCS11-V31-OASIS',
  },
  {
    Name: 'Dieter Bong',
    Country: 'Germany',
    Role: 'Engineering Lead; PKCS#11 Editor',
    Organization: 'Utimaco',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Editor of PKCS#11 v3.2 at OASIS and contributor to v3.0; Utimaco HSM engineer responsible for defining C_EncapsulateKey and C_DecapsulateKey extensions and ML-KEM, ML-DSA, and SLH-DSA mechanism specifications enabling post-quantum operations in hardware security modules.',
    ImageUrl: avatar('Dieter Bong', COLORS.Standards),
    WebsiteUrl: 'https://utimaco.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'PKCS11-V32-OASIS;PKCS11-V31-OASIS',
  },
  {
    Name: 'Valerie Fenwick',
    Country: 'USA',
    Role: 'Principal Engineer; PKCS#11 TC Chair',
    Organization: 'Oracle',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'OASIS PKCS#11 Technical Committee Chair for v3.2; Oracle cryptography engineer co-chairing standardization of post-quantum interfaces for hardware security modules; instrumental in incorporating ML-KEM, ML-DSA, and SLH-DSA mechanisms and new KEM function signatures into the PKCS#11 v3.2 standard.',
    ImageUrl: avatar('Valerie Fenwick', COLORS.Standards),
    WebsiteUrl: 'https://www.oracle.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'PKCS11-V32-OASIS;PKCS11-V3-OASIS',
  },

  // ── Cloudflare PQC Researchers ──────────────────────────────────────────────

  {
    Name: 'Luke Valenta',
    Country: 'USA',
    Role: 'Research Engineer; Cryptography Researcher',
    Organization: 'Cloudflare',
    Type: 'Private',
    Category: 'Industry Adopter',
    Contribution:
      "Co-author of Cloudflare's Merkle Tree Certificates proposal redesigning WebPKI for post-quantum authentication; contributor to the annual State of the Post-Quantum Internet research; leads Cloudflare's work on reducing TLS handshake sizes while enabling PQC certificate deployment at scale.",
    ImageUrl: avatar('Luke Valenta', COLORS['Industry Adopter']),
    WebsiteUrl: 'https://research.cloudflare.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Cloudflare-MTC-Blog;Cloudflare-PQ-Internet-2025',
  },
  {
    Name: 'Christopher Patton',
    Country: 'USA',
    Role: 'Research Engineer; Cryptography Researcher',
    Organization: 'Cloudflare',
    Type: 'Private',
    Category: 'Industry Adopter',
    Contribution:
      "Co-author of Cloudflare's Merkle Tree Certificates proposal redesigning WebPKI for quantum-safe authentication; contributor to IETF PQUIP working group and IKEv2 post-quantum standardization; Cloudflare researcher advancing quantum-safe protocol deployment across the Internet.",
    ImageUrl: avatar('Christopher Patton', COLORS['Industry Adopter']),
    WebsiteUrl: 'https://research.cloudflare.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Cloudflare-MTC-Blog',
  },
  {
    Name: 'Vânia Gonçalves',
    Country: 'Portugal',
    Role: 'Research Engineer; Cryptography Researcher',
    Organization: 'Cloudflare',
    Type: 'Private',
    Category: 'Industry Adopter',
    Contribution:
      "Co-author of Cloudflare's Merkle Tree Certificates proposal redesigning WebPKI for post-quantum cryptographic authentication; Cloudflare researcher contributing to the technical foundation for quantum-safe certificate deployment that dramatically reduces TLS handshake overhead from PQC signature sizes.",
    ImageUrl: avatar('Vania Goncalves', COLORS['Industry Adopter']),
    WebsiteUrl: 'https://research.cloudflare.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Cloudflare-MTC-Blog',
  },

  // ── Quantum Computing Threat Researchers ────────────────────────────────────

  {
    Name: 'Craig Gidney',
    Country: 'USA',
    Role: 'Senior Research Scientist; Quantum Software Engineer',
    Organization: 'Google Quantum AI',
    Type: 'Private',
    Category: 'Algorithm Inventor',
    Contribution:
      "Google Quantum AI researcher whose work on quantum circuit optimization and Shor's algorithm resource estimation provides key benchmarks for the quantum computing power required to break RSA and elliptic curve cryptography; his published qubit count analyses directly inform PQC migration urgency timelines used by NIST, NSA, and global policymakers.",
    ImageUrl: avatar('Craig Gidney', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://quantumai.google/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Cloudflare-PQ-Internet-2025',
  },
  {
    Name: 'Yilei Chen',
    Country: 'China',
    Role: 'Professor; Cryptographer',
    Organization: 'Tsinghua University',
    Type: 'Academic',
    Category: 'Algorithm Inventor',
    Contribution:
      'Researcher who published a 2024 paper proposing a quantum algorithm that appeared to threaten the security of lattice-based cryptographic schemes underlying ML-KEM and ML-DSA; the work (later found to have a flaw) prompted NIST to intensify security analysis of finalized PQC standards and underscored the importance of ongoing cryptographic research for quantum-safe migration.',
    ImageUrl: avatar('Yilei Chen', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://www.tsinghua.edu.cn/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Cloudflare-PQ-Internet-2025',
  },
  {
    Name: 'Samuel Jaques',
    Country: 'Canada',
    Role: 'Research Fellow; Quantum Cryptanalyst',
    Organization: 'University of Waterloo',
    Type: 'Academic',
    Category: 'Algorithm Inventor',
    Contribution:
      'University of Waterloo researcher specializing in quantum algorithm resource estimation for cryptanalysis; his work on precise qubit and gate count benchmarks for quantum attacks on classical cryptosystems informs security parameter selection for NIST PQC standard algorithms and global migration timeline planning.',
    ImageUrl: avatar('Samuel Jaques', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://uwaterloo.ca/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Cloudflare-PQ-Internet-2025',
  },

  // ── IKEv2/VPN PQC Standards ─────────────────────────────────────────────────

  {
    Name: 'Valery Smyslov',
    Country: 'Russia',
    Role: 'Network Security Expert; IKEv2 Author',
    Organization: 'ELVIS-PLUS',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Author of RFC 9593 (Announcing Supported Authentication Methods in IKEv2) enabling PQC signature algorithm negotiation in IPsec VPNs; prolific IETF IPsecME working group contributor driving standardization of ML-KEM and ML-DSA integration in IKEv2 — the key protocol for enterprise VPN post-quantum migration.',
    ImageUrl: avatar('Valery Smyslov', COLORS.Standards),
    WebsiteUrl: '',
    LinkedinUrl: '',
    KeyResourceUrl: 'RFC 9593',
  },

  // ── NIST Cryptographers ─────────────────────────────────────────────────────

  {
    Name: 'Meltem Sönmez Turan',
    Country: 'USA',
    Role: 'Research Scientist; Cryptographer',
    Organization: 'NIST',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NIST cryptographer and co-author of NIST SP 800-56C Revision 2 (Key-Derivation Methods in Key-Establishment Schemes) and NIST SP 800-108 Revision 1 (Key Derivation using PRFs); her work on key derivation standards underpins post-quantum key management implementations and hybrid classical/PQC key establishment in federal systems.',
    ImageUrl: avatar('Meltem Sonmez Turan', COLORS.Government),
    WebsiteUrl: 'https://csrc.nist.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'NIST-SP-800-56C-R2;NIST-SP-800-108-R1',
  },
  {
    Name: 'John Kelsey',
    Country: 'USA',
    Role: 'Research Scientist; Cryptographer',
    Organization: 'NIST',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NIST cryptographer and co-author of the NIST PQC Standardization status reports (NIST IR 8413, 8545) documenting the selection of ML-KEM, ML-DSA, SLH-DSA, and HQC; contributor to key derivation standards (NIST SP 800-56C R2); a foundational contributor to the decade-long NIST PQC standardization process.',
    ImageUrl: avatar('John Kelsey', COLORS.Government),
    WebsiteUrl: 'https://csrc.nist.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'NIST IR 8413;NIST-SP-800-56C-R2',
  },
  {
    Name: 'Quynh Dang',
    Country: 'USA',
    Role: 'Research Scientist; Cryptographer',
    Organization: 'NIST',
    Type: 'Public',
    Category: 'Government',
    Contribution:
      'NIST cryptographer and co-author of NIST IR 8413 (Third Round PQC Status Report) and NIST SP 800-56C Revision 2; contributes to NIST key management and post-quantum standardization research; her technical work on key derivation methods supports quantum-safe cryptographic implementations across federal infrastructure.',
    ImageUrl: avatar('Quynh Dang', COLORS.Government),
    WebsiteUrl: 'https://csrc.nist.gov/',
    LinkedinUrl: '',
    KeyResourceUrl: 'NIST IR 8413;NIST-SP-800-56C-R2',
  },

  // ── QKD Researchers ─────────────────────────────────────────────────────────

  {
    Name: 'Romain Alléaume',
    Country: 'France',
    Role: 'Professor; QKD Standards Expert',
    Organization: 'Télécom Paris (IMT)',
    Type: 'Academic',
    Category: 'Standards',
    Contribution:
      'Professor at Télécom Paris and contributor to ETSI GS QKD 012 (Device and Communication Channel Parameters); active in ETSI QKD Industry Specification Group driving interoperability standards for quantum key distribution networks; his research bridges theoretical QKD security proofs and practical network deployment.',
    ImageUrl: avatar('Romain Alleaume', COLORS.Standards),
    WebsiteUrl: 'https://www.telecom-paris.fr/',
    LinkedinUrl: '',
    KeyResourceUrl: 'ETSI-GS-QKD-012',
  },
  {
    Name: 'Marco Lucamarini',
    Country: 'UK',
    Role: 'Principal Research Scientist; QKD Expert',
    Organization: 'Toshiba Research Europe',
    Type: 'Private',
    Category: 'Algorithm Inventor',
    Contribution:
      'Toshiba Research Europe QKD researcher and contributor to ETSI GS QKD 012; co-inventor of Twin-Field QKD, a breakthrough protocol that dramatically extends the distance over which quantum key distribution can operate beyond the repeaterless bound, enabling practical long-distance quantum-safe key exchange.',
    ImageUrl: avatar('Marco Lucamarini', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://www.toshiba.eu/pages/eu/Cambridge-Research-Laboratory/',
    LinkedinUrl: '',
    KeyResourceUrl: 'ETSI-GS-QKD-012',
  },
  {
    Name: 'Bruno Huttner',
    Country: 'Switzerland',
    Role: 'Chief Quantum Officer',
    Organization: 'ID Quantique',
    Type: 'Private',
    Category: 'Industry Vendor',
    Contribution:
      "Chief Quantum Officer at ID Quantique, the world's leading commercial QKD provider; contributor to ETSI GS QKD 014 REST-based Key Delivery API standard; drives commercial quantum key distribution deployment and integration of QKD with post-quantum cryptography in hybrid security architectures for financial, government, and critical infrastructure clients.",
    ImageUrl: avatar('Bruno Huttner', COLORS['Industry Vendor']),
    WebsiteUrl: 'https://www.idquantique.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'ETSI-GS-QKD-014',
  },

  // ── Financial Sector / FS-ISAC ──────────────────────────────────────────────

  {
    Name: 'Peter Bordow',
    Country: 'USA',
    Role: 'Distinguished Engineer; FS-ISAC PQC Workgroup Chair',
    Organization: 'Wells Fargo',
    Type: 'Private',
    Category: 'Industry Adopter',
    Contribution:
      "Distinguished Engineer and Managing Director of Quantum Security at Wells Fargo; Chair of the FS-ISAC Post-Quantum Cryptography Workgroup leading the financial sector's collective response to quantum threats; drives PQC migration standards, best practices, and risk frameworks for the global financial services industry.",
    ImageUrl: avatar('Peter Bordow', COLORS['Industry Adopter']),
    WebsiteUrl: 'https://www.wellsfargo.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'Europol-FS-ISAC-PQC-Financial-2026',
  },

  // ── ASC X9 Financial Standards ──────────────────────────────────────────────

  {
    Name: 'Steve Stevens',
    Country: 'USA',
    Role: 'Executive Director',
    Organization: 'Accredited Standards Committee X9',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Executive Director of ASC X9, the ANSI-accredited standards body for the US financial services industry. Leads X9 initiatives on post-quantum cryptography including the X9 Financial PKI (launched June 2025 with DigiCert), the X9 PQC Financial Readiness Needs Assessment, and the quantum computing risk study program. Drives cross-sector adoption of PQC standards for payment systems, PKI, and financial cryptographic infrastructure.',
    ImageUrl: avatar('Steve Stevens', COLORS['Standards']),
    WebsiteUrl: 'https://x9.org/',
    LinkedinUrl: 'https://www.linkedin.com/in/steve-stevens-5b06892/',
    KeyResourceUrl: 'ASC-X9-Financial-PKI;ASC-X9-PQC-Readiness-2025;ASC-X9-IR-F01-2022',
  },

  {
    Name: 'Roy C. DeCicco',
    Country: 'USA',
    Role: 'Former Chair, ASC X9; Managing Director',
    Organization: 'JPMorgan Chase',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Former Chair of ASC X9 (until 2021); led the committee during the development of foundational financial cryptography standards including the X9 TR 50-2019 on Quantum Techniques in CMS and the initial quantum computing risk assessment for the financial industry. Managing Director at JPMorgan Chase responsible for cryptographic standards and financial PKI governance.',
    ImageUrl: avatar('Roy C. DeCicco', COLORS['Standards']),
    WebsiteUrl: 'https://x9.org/',
    LinkedinUrl: '',
    KeyResourceUrl: 'ASC-X9-TR-50-2019;ASC-X9-IR-F01-2022',
  },

  {
    Name: 'Angela Hendershott',
    Country: 'USA',
    Role: 'Vice Chair',
    Organization: 'Accredited Standards Committee X9',
    Type: 'Private',
    Category: 'Standards',
    Contribution:
      'Vice Chair of ASC X9; supports governance and standards development for the financial services industry including post-quantum cryptography transition initiatives. Contributes to X9 standards for financial PKI, cryptographic key management, and the quantum computing risk framework for financial institutions.',
    ImageUrl: avatar('Angela Hendershott', COLORS['Standards']),
    WebsiteUrl: 'https://x9.org/',
    LinkedinUrl: '',
    KeyResourceUrl: 'ASC-X9-TR-50-2019',
  },

  // ── PQShield / Algorithm Research ───────────────────────────────────────────

  {
    Name: 'Shuichi Katsumata',
    Country: 'UK',
    Role: 'Lead Cryptography Researcher',
    Organization: 'PQShield',
    Type: 'Private',
    Category: 'Algorithm Inventor',
    Contribution:
      'Lead cryptography researcher at PQShield advancing lattice-based cryptography theory; contributor to ML-KEM security analysis and hybrid key exchange IETF standardization; his theoretical work on tightly-secure lattice signatures and modular lattice schemes strengthens the cryptographic foundations of NIST PQC standards.',
    ImageUrl: avatar('Shuichi Katsumata', COLORS['Algorithm Inventor']),
    WebsiteUrl: 'https://pqshield.com/',
    LinkedinUrl: '',
    KeyResourceUrl: 'FIPS 203',
  },
]

// ─── 3. Apply updates and write CSV ─────────────────────────────────────────

const srcPath = join(ROOT, 'src/data/leaders_03082026.csv')
const dstPath = join(ROOT, 'src/data/leaders_03122026_r1.csv')

const { headers, rows } = parseCSV(readFileSync(srcPath, 'utf8'))

// Apply KeyResourceUrl updates to existing rows.
// Policy: KeyResourceUrl must ONLY contain library reference_ids.
//   - Leaders in EXISTING_UPDATES: SET (replace) with library ref_ids
//   - Leaders NOT in EXISTING_UPDATES: CLEAR any existing external URLs
let updatedCount = 0
for (const row of rows) {
  const update = EXISTING_UPDATES[row.Name]

  if (update !== undefined) {
    // Explicitly mapped: set to library ref_ids (replacing any existing external URL)
    const newVal = update.trim()
    if (row.KeyResourceUrl !== newVal) {
      row.KeyResourceUrl = newVal
      updatedCount++
      if (newVal) {
        console.log(`SET:   ${row.Name} → ${newVal.substring(0, 80)}`)
      } else {
        console.log(`CLEAR: ${row.Name} (no library ref available)`)
      }
    }
  } else if (row.KeyResourceUrl && row.KeyResourceUrl.trim()) {
    // Not in EXISTING_UPDATES but has an external URL — clear it
    row.KeyResourceUrl = ''
    updatedCount++
    console.log(`CLEAR: ${row.Name} (external URL removed — not mapped to library ref)`)
  }
}

// Check for existing names in NEW_LEADERS to avoid duplicates
const existingNames = new Set(rows.map((r) => r.Name.toLowerCase().trim()))
const toAdd = NEW_LEADERS.filter((nl) => {
  const nameNorm = nl.Name.toLowerCase().trim()
  if (existingNames.has(nameNorm)) {
    console.warn(`SKIP (already exists): ${nl.Name}`)
    return false
  }
  return true
})

console.log(`\nUpdated ${updatedCount} existing leaders`)
console.log(`Adding ${toAdd.length} new leaders`)
console.log(`Total leaders: ${rows.length + toAdd.length}`)

// Build output rows
const allRows = [
  ...rows,
  ...toAdd.map((nl) => {
    const row = {}
    headers.forEach((h) => (row[h] = nl[h] ?? ''))
    return row
  }),
]

// Write CSV
const lines = [
  headers.join(','),
  ...allRows.map((r) => rowToCsv(headers, r)),
  '', // trailing newline
]
writeFileSync(dstPath, lines.join('\n'), 'utf8')
console.log(`\nWrote ${dstPath}`)
console.log(`Total: ${allRows.length} leaders`)
