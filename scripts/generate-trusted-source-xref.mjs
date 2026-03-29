#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-trusted-source-xref.mjs
 *
 * Generates src/data/trusted_source_xref_MMDDYYYY.csv by scanning all resource
 * CSVs and mapping their source fields to source_ids from trusted_sources CSV.
 *
 * Usage:
 *   node scripts/generate-trusted-source-xref.mjs [--dry-run] [--verbose]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const Papa = require('papaparse')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src', 'data')

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')

// ── Source field name aliases ────────────────────────────────────────────────
// Maps raw source field values → trusted_sources.source_id
const ALIASES = {
  // NIST
  NIST: 'nist-csrc',
  'NIST CSRC': 'nist-csrc',
  'NIST NCCoE': 'nist-csrc',
  'NIST SP': 'nist-csrc',
  'NIST IR': 'nist-ir',
  'NIST IR Publications': 'nist-ir',
  CMVP: 'cmvp',
  FIPS: 'fips-repo',
  'FIPS Standards': 'fips-repo',
  // IETF
  IETF: 'ietf',
  'IETF LAMPS': 'ietf',
  'IETF TLS WG': 'ietf',
  'IETF CFRG': 'ietf',
  'IETF PQUIP': 'ietf',
  'IETF IPSECME WG': 'ietf',
  'IETF Datatracker': 'ietf',
  'IETF Individual Submission': 'ietf',
  'IETF OAuth WG': 'ietf',
  // European/Government
  ANSSI: 'anssi',
  'ANSSI France': 'anssi',
  BSI: 'bsi',
  'BSI Germany': 'bsi',
  ENISA: 'enisa',
  NSA: 'nsa-advisory',
  'NSA CNSA 2.0': 'nsa-advisory',
  'NSA Cybersecurity Advisory': 'nsa-advisory',
  CISA: 'cisa',
  'CISA/NSA': 'cisa',
  'White House': 'cisa',
  'NCSC UK': 'ncsc-uk',
  'NCSC-UK': 'ncsc-uk',
  'UK NCSC': 'ncsc-uk',
  ACSC: 'acsc',
  CCCS: 'cccs',
  'CSE Canada': 'cccs',
  CSE: 'cccs',
  'CCCS Canadian Crypto Standards': 'cccs-crypto-std',
  'Canada CCCS': 'cccs',
  CRYPTREC: 'cryptrec',
  'Japan CRYPTREC': 'cryptrec',
  KISA: 'kisa',
  'Korea KISA': 'kisa',
  'CSA Singapore': 'csa-singapore',
  'Singapore CSA': 'csa-singapore',
  MAS: 'csa-singapore',
  'NCSC Netherlands': 'ncsc-nl',
  'NCSC-NL': 'ncsc-nl',
  'G7 Cyber Expert Group': 'g7-ceg',
  'G7 CEG': 'g7-ceg',
  'Federal Reserve': 'fed-reserve',
  Bundesdruckerei: 'bundesdruckerei',
  // Standards bodies
  ETSI: 'etsi-cyber',
  'ETSI ISG QSC': 'etsi-cyber',
  'ETSI ISG QKD': 'etsi-cyber',
  'ETSI TC CYBER WG QSC': 'etsi-cyber',
  'ETSI Cyber Security': 'etsi-cyber',
  IEEE: 'ieee-sa',
  'IEEE SA': 'ieee-sa',
  'ISO/IEC': 'iso-iec-sc27',
  'ISO/IEC JTC 1 SC 27': 'iso-iec-sc27',
  'PKI Consortium': 'pki-consortium',
  PKIC: 'pki-consortium',
  PQCA: 'pqca',
  'Post-Quantum Cryptography Alliance': 'pqca',
  TCG: 'tcg',
  'Trusted Computing Group': 'tcg',
  'ASC X9': 'ascx9',
  X9: 'ascx9',
  'FS-ISAC': 'fs-isac',
  // Industry
  IBM: 'ibm-research',
  'IBM Research': 'ibm-research',
  'IBM Quantum': 'ibm-research',
  PQShield: 'pqshield',
  SandboxAQ: 'sandboxaq',
  Thales: 'thales-research',
  'Cloud Security Alliance': 'csa-cloud',
  CSA: 'csa-cloud',
  OWASP: 'owasp',
  'Open Quantum Safe': 'oqs-project',
  OQS: 'oqs-project',
  'Linux Foundation': 'lf-qsc',
  'Ethereum Foundation': 'eth-foundation',
  Quantinuum: 'quantinuum',
  QuSecure: 'qusecure',
  Qrypt: 'qrypt',
  // Academic institutions
  'KU Leuven COSIC': 'ku-leuven-cosic',
  'KU Leuven': 'ku-leuven-cosic',
  COSIC: 'ku-leuven-cosic',
  'TU Eindhoven': 'tue-coding',
  'Ruhr University Bochum': 'rub-crypto',
  'Ruhr-Universität Bochum': 'rub-crypto',
  'INRIA France': 'inria-crypto',
  INRIA: 'inria-crypto',
  'MIT CSAIL': 'mit-csail',
  MIT: 'mit-csail',
  'Stanford ACG': 'stanford-acg',
  Stanford: 'stanford-acg',
  'ETH Zurich': 'eth-zurich-crypto',
  'UC Berkeley': 'uc-berkeley-bqic',
  'NUS Singapore CQT': 'nus-cqt',
  'Tsinghua University': 'tsinghua-ql',
  'University of Cincinnati': 'uc-cincinnati',
  // Academic leaders — org name variants from Leaders CSV
  Ruhr: 'rub-crypto',
  Eindhoven: 'tue-coding',
  // New vendors
  Xiphera: 'xiphera',
  'Crypto Quantique': 'crypto-quantique',
  'Kudelski Security': 'kudelski-iot',
  'Kudelski IoT': 'kudelski-iot',
  IntellectEU: 'intellect-eu',
  // Timeline OrgName full-form aliases — ONLY genuine same-entity mappings
  'National Security Agency': 'nsa-advisory',
  'National Institute of Standards and Technology': 'nist-csrc',
  'National Institute of Standards and Technology / NSA': 'nist-csrc',
  'NIST National Cybersecurity Center of Excellence': 'nist-csrc',
  "Agence nationale de la sécurité des systèmes d'information": 'anssi',
  'National Cyber Security Centre': 'ncsc-uk',
  'Canadian Centre for Cyber Security': 'cccs',
  'Australian Signals Directorate': 'acsc',
  'Bundesamt für Sicherheit in der Informationstechnik': 'bsi',
  'International Business Machines Corporation': 'ibm-research',
  'Cybersecurity and Infrastructure Security Agency': 'cisa',
  'PQShield Ltd': 'pqshield',
  'SandboxAQ Inc': 'sandboxaq',
  'European Union Agency for Cybersecurity': 'enisa',
  'National Intelligence Service / KISA': 'kisa',
  'National center of Incident readiness and Strategy for Cybersecurity': 'cryptrec',
  'Treasury Board of Canada Secretariat': 'cccs',
  'Government Communications Security Bureau / NCSC': 'cccs',
  'Monetary Authority of Singapore': 'csa-singapore',
  'Cyber Security Agency / Monetary Authority of Singapore': 'csa-singapore',
  'Cyber Security Agency / GovTech / IMDA': 'csa-singapore',
  'BSI with Bundesdruckerei and G+D': 'bsi',
  'BSI with German Aerospace Center': 'bsi',
  'Department for Science Innovation and Technology': 'ncsc-uk',
  'Samsung System LSI and Thales': 'thales-research',
  'NXP Semiconductors with PQShield': 'pqshield',
  'ETSI and University of Waterloo IQC': 'etsi-cyber',
  '3GPP Security Working Group SA3 / ETSI': 'etsi-cyber',
  'CA/Browser Forum S/MIME Certificate Working Group': 'pki-consortium',
  // Timeline OrgName short-form aliases
  ASD: 'acsc',
  'GCSB/NCSC': 'cccs',
  MSIT: 'kisa',
  'METI/NISC': 'cryptrec',
  'BSI/DLR': 'bsi',
  'BSI/Bundesdruckerei': 'bsi',
  'ANSSI/BSI/NLNCSA/SE': 'anssi',
  'ETSI/IQC': 'etsi-cyber',
  'CSA/MAS': 'csa-singapore',
  'CSA/GovTech/IMDA': 'csa-singapore',
  'MAS/BdF/CSA': 'csa-singapore',
  ISED: 'cccs',
  DSIT: 'ncsc-uk',
  // Aliases for NEW trusted sources (added 2026-03-28)
  'European Commission': 'ec',
  'European Commission (DG CNECT)': 'ec',
  'European Commission/ENISA': 'ec',
  'European Commission Digital Strategy — PQC Roadmap': 'ec',
  'Council of the European Union': 'ec',
  'European Parliament': 'ec',
  EC: 'ec',
  NATO: 'nato',
  'North Atlantic Treaty Organization': 'nato',
  FDA: 'fda',
  'FDA Cybersecurity for Medical Devices': 'fda',
  'FDA Premarket Cybersecurity Guidance 2023': 'fda',
  'FDA Drug Supply Chain Security Act (DSCSA)': 'fda',
  FBI: 'fbi',
  FTC: 'ftc',
  OMB: 'omb',
  'OMB/CISA': 'omb',
  ONCD: 'omb',
  'Office of Management and Budget': 'omb',
  Congress: 'us-congress',
  'US Congress': 'us-congress',
  'United States Congress': 'us-congress',
  'US Treasury': 'us-treasury',
  'US Dept of Education': 'us-congress',
  DISA: 'disa',
  DoD: 'disa',
  'Department of Defense': 'disa',
  'U.S. Department of Defense': 'disa',
  'DoD CIO (Katie Arrington)': 'disa',
  HKMA: 'hkma',
  'Hong Kong Monetary Authority': 'hkma',
  'Bank of England': 'boe',
  CMORG: 'boe',
  'CMORG/Bank of England': 'boe',
  'UK Financial Authorities': 'boe',
  'Bank of France': 'bdf',
  'Banque de France': 'bdf',
  'MAS/BdF': 'bdf',
  'Deutsche Bundesbank': 'bundesbank',
  NUKIB: 'nukib',
  'NUKIB Czech Republic': 'nukib',
  'Czech National Cyber and Information Security Agency': 'nukib',
  'NLNCSA Netherlands': 'nlncsa',
  'SNCSA Sweden': 'sncsa-sweden',
  'Bahrain NCSC': 'bahrain-ncsc',
  'Saudi NCA': 'saudi-nca',
  'National Cybersecurity Authority': 'saudi-nca',
  'UAE CSC': 'uae-csc',
  'UAE CSC/DESC': 'uae-csc',
  'UAE Cybersecurity Council': 'uae-csc',
  DESC: 'desc-dubai',
  'Dubai Electronic Security Center': 'desc-dubai',
  INCD: 'incd-israel',
  'INCD/BOI': 'incd-israel',
  'Israel National Cyber Directorate': 'incd-israel',
  'Israel National Cyber Directorate / Bank of Israel': 'incd-israel',
  'Bank of Israel': 'incd-israel',
  BOI: 'incd-israel',
  'CERT-In': 'cert-in',
  'Indian Computer Emergency Response Team': 'cert-in',
  NACSA: 'nacsa-malaysia',
  'NACSA Malaysia': 'nacsa-malaysia',
  'National Cyber Security Agency of Malaysia': 'nacsa-malaysia',
  'Malaysia Ministry of Digital': 'nacsa-malaysia',
  IMDA: 'imda-singapore',
  'IMDA Singapore': 'imda-singapore',
  'Infocomm Media Development Authority': 'imda-singapore',
  OASIS: 'oasis',
  'OASIS PKCS11 TC': 'oasis',
  'OASIS PKCS11 Technical Committee': 'oasis',
  'OASIS KMIP Technical Committee': 'oasis',
  'PCI SSC': 'pci-ssc',
  'PCI Security Standards Council': 'pci-ssc',
  'PCI Security Standards Council DSS 4.0.1': 'pci-ssc',
  EMVCo: 'emvco',
  'EMVCo Book 2 Security and Key Management': 'emvco',
  SWIFT: 'swift',
  Swift: 'swift',
  'FIDO Alliance': 'fido-alliance',
  'FIDO Alliance PQC Roadmap': 'fido-alliance',
  GSMA: 'gsma',
  'GSMA Post-Quantum Telco Network Taskforce': 'gsma',
  'GSMA Security Guidelines': 'gsma',
  'GSM Association': 'gsma',
  IEC: 'iec',
  'IEC 62443 Industrial Automation Security': 'iec',
  'IEC 62351 Power Systems Security Standards': 'iec',
  ANSI: 'ansi',
  RTCA: 'rtca',
  'RTCA/EUROCAE': 'rtca',
  'RTCA DO-326A / DO-356A Airworthiness Security': 'rtca',
  UNECE: 'unece',
  'UNECE WP.29 Regulations R155/R156': 'unece',
  OpenSSF: 'openssf',
  'SLSA Supply Chain Security Framework (OpenSSF)': 'openssf',
  Google: 'google',
  'Google LLC': 'google',
  Microsoft: 'microsoft',
  'Microsoft Corporation': 'microsoft',
  Cloudflare: 'cloudflare',
  'Cloudflare Research': 'cloudflare',
  DigiCert: 'digicert',
  Entrust: 'entrust',
  Keyfactor: 'keyfactor',
  'Keyfactor (InfoSec Global)': 'keyfactor',
  'InfoSec Global (Keyfactor)': 'keyfactor',
  'NTT Research': 'ntt-research',
  // Aliases for EXISTING sources (variant spellings)
  'ANSSI (France)': 'anssi',
  'BSI (Germany)': 'bsi',
  'ASD (Australia)': 'acsc',
  'ASD Australia': 'acsc',
  'CCCS Canada': 'cccs',
  'CRYPTREC Japan': 'cryptrec',
  NCSC: 'ncsc-uk',
  'NCSC (UK)': 'ncsc-uk',
  'UK National Cyber Security Centre': 'ncsc-uk',
  'UK Department for Science Innovation and Technology': 'ncsc-uk',
  NIS: 'kisa',
  'NIS Korea': 'kisa',
  'NIS/KISA': 'kisa',
  'KISA/NIS': 'kisa',
  'KISA/NIS/MSIT': 'kisa',
  'Ministry of Science and ICT': 'kisa',
  NISC: 'cryptrec',
  'NIST CMVP': 'cmvp',
  'NIST/NSA': 'nist-csrc',
  'NIST/HQC Team': 'nist-csrc',
  'NIST Post-Quantum Cryptography Standardization': 'nist-csrc',
  'NIST Cybersecurity Framework': 'nist-csrc',
  'NIST FIPS 203/204/205 Post-Quantum Cryptography Standards': 'nist-csrc',
  'NIST FIPS 206 FN-DSA Status': 'nist-csrc',
  'NIST IR 8547 Transition to Post-Quantum Cryptography Standards': 'nist-csrc',
  'NIST SP 800-227 Recommendations for KEMs': 'nist-csrc',
  'NIST SP 800-227 KEM Recommendations': 'nist-csrc',
  'NSA CNSA 2.0 Cybersecurity Advisory': 'nsa-advisory',
  'NSA CNSA 2.0 Guidance': 'nsa-advisory',
  'National Security Agency (NSA)': 'nsa-advisory',
  'ETSI QSC': 'etsi-cyber',
  'ETSI TC CYBER': 'etsi-cyber',
  'ETSI ISG Quantum-Safe Cryptography / 3GPP': 'etsi-cyber',
  'Linux Foundation PQCA': 'pqca',
  'Post-Quantum Cryptography Coalition': 'pqca',
  PQCC: 'pqca',
  'Ethereum Foundation PQC Program': 'eth-foundation',
  'Ethereum Foundation PQC Research Team': 'eth-foundation',
  'Cloud Security Alliance Quantum-Safe Guidelines': 'csa-cloud',
  'Cloud Security Alliance Quantum-Safe Security': 'csa-cloud',
  'OpenID Foundation': 'fido-alliance',
  'NXP/PQShield': 'pqshield',
  SEALSQ: 'pqshield',
  'Quantinuum/NQO': 'quantinuum',
  'Samsung/Thales': 'thales-research',
  'Thales Group': 'thales-research',
  // Compliance enforcement_body aliases
  'CA/Browser Forum': 'pki-consortium',
  'CA/Browser Forum PKI Standards': 'pki-consortium',
  'Federal Reserve Board': 'fed-reserve',
  '3GPP': 'gsma',
  '3GPP SA3': 'gsma',
  '3GPP Security Working Group SA3': 'gsma',
  // FIPS/SP/RFC standard identifiers (from algorithm CSV)
  'FIPS 203': 'nist-csrc',
  'FIPS 204': 'nist-csrc',
  'FIPS 205': 'nist-csrc',
  'FIPS 206 (Draft)': 'nist-csrc',
  'FIPS 186': 'nist-csrc',
  'NIST SP 800-208': 'nist-csrc',
  'SP 800-56A': 'nist-csrc',
  'SP 800-56B': 'nist-csrc',
  'RFC 7748': 'ietf',
  'RFC 7919': 'ietf',
  'RFC 8032': 'ietf',
  'Draft (Selected 2025)': 'nist-csrc',
  // Threats — vehicle / automotive / transport standards
  'ISO/SAE 21434 Road Vehicle Cybersecurity': 'iso-iec-sc27',
  'SAE J3061 / ISO/SAE 21434 Vehicle Cybersecurity': 'iso-iec-sc27',
  'ISO/IEC 14443 Contactless Card Standards': 'iso-iec-sc27',
  'ISO/IEC 30182 Smart City Concept Model': 'iso-iec-sc27',
  'ETSI EN 319 422 Qualified Timestamp Policy': 'etsi-cyber',
  '3GPP TS 33.501 5G Security Architecture': 'gsma',
  'GSMA eSIM Specification (SGP.22)': 'gsma',
  // Threats — NIST supplemental documents
  'NIST IR 8547 / NIST SP 800-210': 'nist-csrc',
  'NIST SP 800-210 Cloud Access Control': 'nist-csrc',
  'NIST SP 800-86 Guide to Integrating Forensic Techniques': 'nist-csrc',
  // Threats — IBM research
  'IBM Institute for Business Value — Secure the Post-Quantum Future 2025': 'ibm-research',
  // Threats — CISA / government
  'CISA Product Categories for PQC Technologies': 'cisa',
  'Federal PKI Policy Authority': 'cisa',
  "EPA America's Water Infrastructure Act (AWIA) 2018 / CISA": 'cisa',
  // Threats — EU regulations (eIDAS)
  'EU Regulation 910/2014 (eIDAS)': 'ec',
  'EU Regulation 2024/1183 (eIDAS 2.0)': 'ec',
  // Threats — IETF working groups
  'IETF SUIT Working Group (RFC 9019)': 'ietf',
  'IETF SUIT': 'ietf',
  'IETF PQUIP WG': 'ietf',
  'IETF TLS': 'ietf',
  'IETF TLS Working Group': 'ietf',
  'IETF COSE WG': 'ietf',
  'IETF CURDLE WG': 'ietf',
  'IETF IPSECME': 'ietf',
  'IETF JOSE WG': 'ietf',
  'IETF MLS': 'ietf',
  'IETF OAuth Working Group': 'ietf',
  'IETF OpenPGP WG': 'ietf',
  'IETF SMIME WG': 'ietf',
  'IETF UTA': 'ietf',
  'IEEE 802.1 Working Group': 'ieee-sa',
  // Threats — new specialized sources (r4)
  'ICAO Assembly Resolution A41-19': 'icao',
  'Global Risk Institute Quantum Threat Timeline 2025': 'gri',
  'Global Risk Institute': 'gri',
  GRI: 'gri',
  'NRC Cybersecurity Requirements (10 CFR 73.54)': 'nrc',
  'University of Toronto Smart Grid Security Research': 'u-toronto',
  'Bank for International Settlements Project Leap Phase 2': 'bis',
  'Bank for International Settlements': 'bis',
  BIS: 'bis',
  'BIS Innovation Hub': 'bis',
  'HHS HIPAA Security Rule': 'hhs',
  'HHS OCR': 'hhs',
  'NAIC Insurance Data Security Model Law (MDL-668)': 'naic',
  'NY DFS Cybersecurity Regulation (23 NYCRR 500)': 'nydfs',
  'GS1 Global Standards': 'gs1',
  GS1: 'gs1',
  'IMO Maritime Cyber Risk Management Guidelines': 'imo',
  'DCSA Electronic Bill of Lading Standards': 'dcsa',
  'WCO SAFE Framework of Standards': 'wco',
  'AWWA Cybersecurity Guidance for Water Utilities': 'awwa',
  'EN 50159 Railway Communication Security / ERA': 'era-rail',
  'OpenSSL PQC Integration': 'openssl-project',
  'OpenSSL Project': 'openssl-project',
  'Thales 2025 Data Threat Report Healthcare Edition': 'thales-research',
  // Compliance — enforcement body aliases
  'CC Recognition Arrangement': 'iso-iec-sc27',
  'EBA/ESMA/EIOPA': 'ec',
  'ESMA/EBA': 'ec',
  'EU DPAs': 'ec',
  'EU NIS Cooperation Group': 'enisa',
  'EU Horizon': 'ec',
  'GSA/FedRAMP PMO': 'omb',
  'GSA Federal Acquisition Service': 'omb',
  'ISO/SAE': 'iso-iec-sc27',
  NERC: 'nerc',
  'VDA/ENX': 'iso-iec-sc27',
  TSA: 'cisa',
  'DST/NQM': 'ncsc-uk',
  'National Quantum Mission': 'ncsc-uk',
  MODA: 'uae-csc',
  'DoD/OUSD(A&S)': 'disa',
  'G7 CEG/US Treasury': 'g7-ceg',
  'G7 Cyber Expert Group Statement (U.S. Treasury)': 'g7-ceg',
  'G7 Finance Ministers': 'g7-ceg',
  'ENISA/EU Member States': 'enisa',
  '21 EU cybersecurity agencies': 'enisa',
  ECCG: 'enisa',
  'ECCG/ENISA': 'enisa',
  NCA: 'saudi-nca',
  NCO: 'enisa',
  'NIS CG': 'enisa',
  ACN: 'enisa',
  CCN: 'enisa',
  CBJ: 'bis',
  'Swiss NCSC': 'bsi',
  'SCA/OSCCA': 'cryptrec',
  'OSCCA China': 'cryptrec',
  CAC: 'cryptrec',
  'CCSA China': 'cryptrec',
  ICCS: 'cryptrec',
  CACR: 'cryptrec',
  'CACR China': 'cryptrec',
  'SAC China': 'cryptrec',
  CFDIR: 'cryptrec',
  TEC: 'cert-in',
  'TEC India': 'cert-in',
  'DST India': 'cert-in',
  'India Ministry of Science & Technology (DST)': 'cert-in',
  'Department of Telecommunications': 'cert-in',
  'Telecommunications Engineering Centre': 'cert-in',
  DST: 'cert-in',
  'ADGM/TII': 'uae-csc',
  TII: 'uae-csc',
  Europol: 'enisa',
  'Europol/FS-ISAC': 'fs-isac',
  'eIDAS Expert Group': 'ec',
  'Quantum Safe Financial Forum': 'g7-ceg',
  'X9F Quantum Computing Risk Study Group': 'ascx9',
  'X9F4 Workgroup': 'ascx9',
  'Cloud Signature Consortium': 'pki-consortium',
  // Leaders — academic institutional affiliations
  'University of Waterloo': 'uwaterloo-iqc',
  'Sorbonne Université (LIP6/CNRS)': 'inria-crypto',
  'IRISA/Inria': 'inria-crypto',
  'ENS de Lyon': 'inria-crypto',
  GREYC: 'inria-crypto',
  'Université de Caen Normandie': 'inria-crypto',
  'Université de Rennes': 'inria-crypto',
  'Institut de Mathématiques de Bordeaux': 'inria-crypto',
  'Télécom Paris (IMT)': 'inria-crypto',
  'IBM Research Europe Zurich': 'ibm-research',
  'GovTech Singapore': 'csa-singapore',
  'Government of Canada': 'cccs',
  'Innovation Science and Economic Development Canada': 'cccs',
  Logius: 'ncsc-nl',
  'CWI Amsterdam': 'cwi-amsterdam',
  'TU Darmstadt': 'tu-darmstadt',
  'Leiden University': 'cwi-amsterdam',
  'Linköping University': 'ncsc-nl',
  'Edinburgh Napier University': 'ncsc-uk',
  "King's College London": 'ncsc-uk',
  'Hochschule Bonn-Rhein-Sieg (H-BRS)': 'rub-crypto',
  'Universität Bremen TZI': 'rub-crypto',
  'NYU Courant Institute of Mathematical Sciences': 'mit-csail',
  'Harvard Kennedy School': 'mit-csail',
  'QuICS (University of Maryland)': 'mit-csail',
  'University of Illinois': 'uc-berkeley-bqic',
  'University of Illinois Chicago': 'uc-berkeley-bqic',
  'UC San Diego': 'uc-berkeley-bqic',
  'University of Texas Austin': 'u-toronto',
  'Florida Atlantic University': 'uc-cincinnati',
  // Leaders — financial institutions
  'Banco Santander': 'g7-ceg',
  Citi: 'g7-ceg',
  DBS: 'csa-singapore',
  HSBC: 'boe',
  OCBC: 'csa-singapore',
  UOB: 'csa-singapore',
  SPTel: 'csa-singapore',
  Singtel: 'csa-singapore',
  'NEC/NICT': 'cryptrec',
  NEDO: 'cryptrec',
  CryptoLab: 'kisa',
  'Soonchunhyang University': 'kisa',
  evolutionQ: 'cccs',
  // GitHub URL aliases for migrate
  'https://github.com/aws/aws-lc': 'amazon-aws',
  'https://github.com/aws/s2n-tls': 'amazon-aws',
  'https://github.com/cloudflare/circl': 'cloudflare',
  'https://github.com/microsoft/SymCrypt': 'microsoft',
  'https://github.com/open-quantum-safe/oqs-provider': 'oqs-project',
  'https://github.com/PQClean/PQClean': 'oqs-project',
  'https://github.com/mupq/pqm4': 'oqs-project',
  'https://github.com/XMSS/xmss-reference': 'oqs-project',
  'https://github.com/drwetter/testssl.sh': 'oqs-project',
  'https://github.com/nabla-c0d3/sslyze': 'oqs-project',
  'https://github.com/cisco/hash-sigs': 'cisco-systems',
  'https://github.com/opendnssec/SoftHSMv2': 'oqs-project',
  'https://github.com/anvilsecure/pqcscan': 'pqca',
  'https://github.com/crt26/pqc-evaluation-tools': 'pqca',
  'https://github.com/rustls/rustls': 'pqca',
  'https://github.com/eu-digital-identity-wallet': 'ec',
  'https://github.com/openssl/openssl': 'openssl-project',
  'https://pqc-hqc.org/': 'nist-csrc',
  'https://botan.randombit.net/': 'oqs-project',
  'https://leancrypto.org/': 'oqs-project',
  'https://crates.io/crates/oqs': 'oqs-project',
  'https://crates.io/crates/pqcrypto': 'oqs-project',
  'https://docs.rs/ml-dsa': 'nist-csrc',
  'https://docs.rs/ml-kem': 'nist-csrc',
  'https://docs.rs/slh-dsa': 'nist-csrc',
  'https://pkg.go.dev/crypto/mlkem': 'nist-csrc',
  'https://openjdk.org/jeps/497': 'nist-csrc',
  'https://nodejs.org': 'ietf',
  'https://gnupg.org/': 'ietf',
  'https://www.gnutls.org/': 'ietf',
  'https://www.libressl.org/': 'oqs-project',
  'https://www.libssh.org': 'ietf',
  'https://www.openssh.org/': 'ietf',
  'https://www.strongswan.org/': 'ietf',
  'https://www.wireguard.com': 'ietf',
  'https://libreswan.org/': 'ietf',
  'https://openvpn.net': 'ietf',
  'https://www.sigstore.dev/': 'pqca',
  'https://notaryproject.dev/': 'pqca',
  'https://kubernetes.io': 'pqca',
  'https://istio.io': 'google',
  'https://letsencrypt.org/': 'pki-consortium',
  'https://www.ejbca.org/': 'pki-consortium',
  'https://smallstep.com/docs/step-ca/': 'pki-consortium',
  'https://www.opentext.com/products/atalla-network-security-processor': 'cmvp',
  'https://www.futurex.com/': 'cmvp',
  'https://www.futurex.com/products/vectera-plus': 'cmvp',
  'https://crypto4a.com/': 'cmvp',
  'https://crypto4a.com/products/blade-modules/qx-hsm': 'cmvp',
  'https://www.utimaco.com/': 'cmvp',
  'https://utimaco.com/': 'cmvp',
  'https://utimaco.com/data-protection/key-management/enterprise-secure-key-manager': 'cmvp',
  'https://utimaco.com/products/categories/payment-hsms': 'cmvp',
  'https://www.securosys.com/en/hsm/post-quantum-cryptography': 'cmvp',
  'https://www.securosys.com/cloud-security/cloudhsm-overview': 'cmvp',
  'https://www.idquantique.com/random-number-generation/products/quantis-random-number-generator/':
    'etsi-cyber',
  'https://www.idquantique.com/quantum-safe-security/products/cerberis-qkd-system/': 'etsi-cyber',
  'https://www.global.toshiba/ww/products-solutions/security-ict/qkd.html': 'etsi-cyber',
  'https://www.quintessencelabs.com/products/qstream/': 'etsi-cyber',
  'https://www.evolutionq.com/products/basejumpqdn': 'cccs',
  'https://www.evolutionq.com/products/basejumpski': 'cccs',
  'https://www.quantum-bridge.com/': 'etsi-cyber',
  // Domain-to-source map for migrate authoritative_source URLs

  // ── New ALIASES added for r5 (library authors, threats, leaders, timeline) ──
  // ISO/IEC (slash variant — existing alias has space)
  'ISO/IEC JTC 1/SC 27': 'iso-iec-sc27',
  'ISO/IEC JTC1 SC17': 'iso-iec-sc27',
  'ICCS China': 'iccs-china',

  // Bitcoin/crypto authors (BIPs, whitepaper, SLIP)
  'Satoshi Nakamoto': 'bitcoin-core',
  'Pieter Wuille (Bitcoin Core)': 'bitcoin-core',
  'Pieter Wuille': 'bitcoin-core',
  'Marek Palatinus': 'bitcoin-core',
  'Pavol Rusnak': 'bitcoin-core',
  'Aaron Voisine': 'bitcoin-core',
  'Sean Bowe': 'bitcoin-core',
  'Eric Lombrozo': 'bitcoin-core',
  'Johnson Lau': 'bitcoin-core',
  'Jonas Nick': 'bitcoin-core',
  'Tim Ruffing (Bitcoin Core)': 'bitcoin-core',
  'Tim Ruffing': 'bitcoin-core',
  'Anthony Towns (Bitcoin Core)': 'bitcoin-core',
  'Hunter Beast': 'bitcoin-core',
  'Bitcoin Core Community': 'bitcoin-core',
  SatoshiLabs: 'satoshilabs',

  // Ethereum authors
  'Vitalik Buterin': 'eth-foundation',
  'Gavin Wood (Ethereum Foundation)': 'eth-foundation',

  // SECG
  'Standards for Efficient Cryptography Group (SECG)': 'secg',
  'SEC 2': 'secg',

  // WEF and Rosenpass
  'World Economic Forum (WEF)': 'wef',
  'Rosenpass e.V.': 'rosenpass',

  // Academic
  'M. Pohl (Radboud University)': 'radboud-university',

  // RFC authors (individual names → ietf; URL fallback also handles this)
  'Tatu Ylonen': 'ietf',
  'Chris M. Lonvick (Ed.)': 'ietf',
  'Stephen Kent': 'ietf',
  'Karen Seo (BBN Technologies)': 'ietf',
  'D. Cooper': 'ietf',
  'S. Santesson': 'ietf',
  'S. Farrell': 'ietf',
  'S. Boeyen': 'ietf',
  'R. Housley': 'ietf',
  'W. Polk': 'ietf',
  'Ben Laurie': 'ietf',
  'Adam Langley': 'ietf',
  'Emilia Kasper (Google)': 'ietf',
  'K. Moriarty': 'ietf',
  'B. Kaliski': 'ietf',
  'J. Jonsson': 'ietf',
  'A. Rusch': 'ietf',
  'Eric Rescorla (Mozilla)': 'ietf',
  'Jim Schaad (August Cellars)': 'ietf',
  'Paul Wouters': 'ietf',
  'Daniel Huigens': 'ietf',
  'Justus Winter': 'ietf',
  'Niibe Yutaka': 'ietf',
  'Valery Smyslov': 'ietf',
  'Joseph A. Salowey': 'ietf',
  'Sean Turner': 'ietf',

  // Threats (main_source strings)
  'FS-ISAC — The Timeline for Post Quantum Cryptographic Migration': 'fs-isac',
  'PCI PIN Security Requirements': 'pci-ssc',
  'Federal Reserve HNDL Paper': 'federal-reserve',
  'Federal Reserve Board FEDS Paper September 2025': 'federal-reserve',
  'Geneva Association Systemic Cyber Risk Research': 'geneva-association',
  'Cryptocurrency Security Standard (CCSS)': 'ccss',
  'AACS Licensing Administrator Specifications': 'aacs',
  'AACS / Content Protection Standards': 'aacs',
  'DVB Project — Conditional Access System Standards': 'dvb-project',
  'Forescout Device Risk Research': 'forescout',

  // Leaders (Organization strings)
  'GIP ACYMA (cybermalveillance.gouv.fr)': 'gip-acyma',
  'Legion of the Bouncy Castle': 'bouncy-castle',
  'SECOM CO. LTD.': 'secom',
  PQStation: 'pqstation',

  // Compliance
  AICPA: 'aicpa',

  // Timeline (OrgName strings)
  'SandboxAQ/MITRE/LF': 'sandboxaq',
  TBS: 'tbs-canada',
  'China Telecom': 'china-telecom',
  LegCo: 'hk-legco',
  C4IR: 'c4ir-saudi',
  'Aramco/Pasqal': 'pasqal',
}

const DOMAIN_TO_SOURCE = {
  'csrc.nist.gov': 'nist-csrc',
  'nist.gov': 'nist-csrc',
  'ssi.gouv.fr': 'anssi',
  'bsi.bund.de': 'bsi',
  'enisa.europa.eu': 'enisa',
  'ncsc.gov.uk': 'ncsc-uk',
  'cisa.gov': 'cisa',
  'nsa.gov': 'nsa-advisory',
  'cyber.gov.au': 'acsc',
  'cyber.gc.ca': 'cccs',
  'cryptrec.go.jp': 'cryptrec',
  'kisa.or.kr': 'kisa',
  'csa.gov.sg': 'csa-singapore',
  'ncsc.nl': 'ncsc-nl',
  'etsi.org': 'etsi-cyber',
  'iso.org': 'iso-iec-sc27',
  'ieee.org': 'ieee-sa',
  'datatracker.ietf.org': 'ietf',
  'ietf.org': 'ietf',
  'pkic.org': 'pki-consortium',
  'pqca.org': 'pqca',
  'trustedcomputinggroup.org': 'tcg',
  'x9.org': 'ascx9',
  'fs-isac.com': 'fs-isac',
  'ibm.com': 'ibm-research',
  'pqshield.com': 'pqshield',
  'sandboxaq.com': 'sandboxaq',
  'thalesgroup.com': 'thales-research',
  'cloudsecurityalliance.org': 'csa-cloud',
  'openquantumsafe.org': 'oqs-project',
  'ethereum.org': 'eth-foundation',
  'quantinuum.com': 'quantinuum',
  'qusecure.com': 'qusecure',
  'qrypt.com': 'qrypt',
  'eprint.iacr.org': 'iacr-eprint',
  'arxiv.org': 'arxiv-crypto',
  // Academic institutions
  'pq-crystals.org': 'ku-leuven-cosic',
  'sphincs.org': 'tue-coding',
  'falcon-sign.info': 'inria-crypto',
  'classic.mceliece.org': 'tue-coding',
  // New vendors
  'xiphera.com': 'xiphera',
  'crypto-quantique.com': 'crypto-quantique',
  'kudelski-iot.com': 'kudelski-iot',
  'kudelski.com': 'kudelski-iot',
  'intellecteu.com': 'intellect-eu',
  // Major cloud/tech vendors (added r3 trusted sources)
  'microsoft.com': 'microsoft',
  'google.com': 'google',
  'googlesource.com': 'google',
  'android.com': 'google',
  'chromeos.google': 'google',
  'amazon.com': 'amazon-aws',
  'cloudflare.com': 'cloudflare',
  'digicert.com': 'digicert',
  'entrust.com': 'entrust',
  'keyfactor.com': 'keyfactor',
  // Network/security vendors (added r4 trusted sources)
  'cisco.com': 'cisco-systems',
  'fortinet.com': 'fortinet',
  'paloaltonetworks.com': 'palo-alto',
  'juniper.net': 'juniper-networks',
  'nokia.com': 'nokia',
  'ericsson.com': 'ericsson',
  // Software vendors (added r4 trusted sources)
  'openssl.org': 'openssl-project',
  'wolfssl.com': 'wolfssl',
  'bouncycastle.org': 'bouncy-castle',
  'oracle.com': 'oracle',
  'redhat.com': 'red-hat',
  'apple.com': 'apple',
  // Financial security vendors
  'utimaco.com': 'cmvp',
  'futurex.com': 'cmvp',
  'securosys.com': 'cmvp',
  'crypto4a.com': 'cmvp',
  // QKD vendors
  'idquantique.com': 'etsi-cyber',
  'quintessencelabs.com': 'etsi-cyber',
  // RFC / standards document hosts (added r5)
  'rfc-editor.org': 'ietf',
  'weforum.org': 'wef',
  'bitcoin.org': 'bitcoin-core',
  'secg.org': 'secg',
  'rosenpass.eu': 'rosenpass',
  'gmbz.org.cn': 'iccs-china',
  'cs.ru.nl': 'radboud-university',
  'ru.nl': 'radboud-university',
  'federalreserve.gov': 'federal-reserve',
  'aicpa-cima.com': 'aicpa',
  'aicpa.org': 'aicpa',
  'tbs-sct.gc.ca': 'tbs-canada',
  'dvb.org': 'dvb-project',
  'aacsla.com': 'aacs',
  'forescout.com': 'forescout',
  'cybermalveillance.gouv.fr': 'gip-acyma',
  'secom.co.jp': 'secom',
  'c4irsaudiarabia.org': 'c4ir-saudi',
  'pasqal.com': 'pasqal',
  'legco.gov.hk': 'hk-legco',
  'ccss.io': 'ccss',
  'cryptoconsortium.org': 'ccss',
  'genevaassociation.org': 'geneva-association',
  'satoshilabs.com': 'satoshilabs',
  'chinatelecom.com.cn': 'china-telecom',
}

// ── Category-level fallback for migrate ─────────────────────────────────────
// Maps migrate category_id → authoritative standard body that governs that
// product category. Used as last resort when URL domain matching fails.
// match_method = 'category-inferred' — lower confidence than domain/alias match.
const CATEGORY_SOURCE_FALLBACK = {
  'CSC-001': 'cmvp', // Hardware HSM → FIPS 140 CMVP validation
  'CSC-002': 'cmvp', // Network/Cloud HSM → FIPS 140
  'CSC-003': 'pki-consortium', // CA Software → PKI Consortium
  'CSC-004': 'pki-consortium', // PKI Software
  'CSC-005': 'pki-consortium', // Certificate Management
  'CSC-006': 'pki-consortium', // Root CA Programs
  'CSC-007': 'ietf', // SSH Tools → IETF RFC 4251+
  'CSC-008': 'ietf', // Email Encryption → IETF (S/MIME, PGP)
  'CSC-009': 'ietf', // Firewall/Network → IETF
  'CSC-010': 'ietf', // VPN → IETF (IPsec/OpenVPN RFCs)
  'CSC-011': 'ietf', // TLS/SSL libraries → IETF RFC 8446+
  'CSC-014': 'ietf', // Network Security
  'CSC-015': 'ietf', // S/MIME → IETF
  'CSC-016': 'pki-consortium', // Document Signing
  'CSC-017': 'pki-consortium', // Code Signing
  'CSC-018': 'cmvp', // Hardware Enclaves → FIPS 140
  'CSC-025': 'cmvp', // Cloud HSM → FIPS 140
  'CSC-026': 'nist-csrc', // Key Management → NIST SP 800-57
  'CSC-028': 'ietf', // API Security → IETF OAuth/JWT
  'CSC-029': 'pki-consortium', // Certificate Lifecycle
  'CSC-030': 'etsi-cyber', // QKD Systems → ETSI ISG QKD
  'CSC-031': 'oqs-project', // Crypto Libraries → Open Quantum Safe
  'CSC-032': 'nist-csrc', // SIEM/Analytics → NIST CSF
  'CSC-033': 'nist-csrc', // Operating Systems → NIST FIPS
  'CSC-034': 'ietf', // Identity/SSO → IETF OAuth/OIDC
  'CSC-036': 'ietf', // Remote Access/VDI → IETF
  'CSC-037': 'nist-csrc', // Crypto Discovery → NIST IR 8547
  'CSC-038': 'fido-alliance', // IAM → FIDO2/WebAuthn
  'CSC-039': 'csa-cloud', // Cloud Security → CSA
  'CSC-040': 'ietf', // Network Defense
  'CSC-041': 'iec', // ICS/OT Security → IEC 62443
  'CSC-042': 'iec', // IoT/Embedded → IEC 62443
  'CSC-043': 'ietf', // Blockchain Crypto → IETF
  'CSC-044': 'ietf', // Email/Messaging → IETF
  'CSC-045': 'nist-csrc', // Database Encryption → NIST
  'CSC-046': 'iso-iec-sc27', // Smart Cards/Tokens → ISO/IEC
  'CSC-047': 'nist-csrc', // Entropy/TRNG → NIST SP 800-90A
  'CSC-048': 'gsma', // 5G/Telecom → GSMA
  'CSC-049': 'nist-csrc', // Crypto Discovery Tools
  'CSC-050': 'ietf', // Secure Communications → IETF
  'CSC-051': 'fido-alliance', // Authentication → FIDO2
  'CSC-052': 'pki-consortium', // Digital Signatures
  'CSC-053': 'nist-csrc', // Secrets Management → NIST
  'CSC-054': 'ietf', // DNS → IETF DNSSEC
  'CSC-055': 'nist-csrc', // Key Management → NIST
  'CSC-056': 'ietf', // Web Security → IETF
  'CSC-057': 'cmvp', // Hardware Security Elements → FIPS 140
  'CSC-058': 'ietf', // Blockchain/DLT → IETF protocols
  'CSC-059': 'csa-cloud', // SASE/Zero Trust → CSA
  'CSC-060': 'nist-csrc', // Compliance Tools → NIST CSF
  'CSC-061': 'nist-csrc', // Crypto Agility → NIST IR 8547
}

// ── Utilities ────────────────────────────────────────────────────────────────

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data } = Papa.parse(content.trim(), { header: true, skipEmptyLines: true })
  return data
}

function findLatestCSV(prefix) {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith(prefix) && f.endsWith('.csv'))
  if (!files.length) return null
  const parsed = files
    .map((f) => {
      const m = f.match(/(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      const date = new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]))
      return { file: f, date, rev: m[4] ? parseInt(m[4]) : 0 }
    })
    .filter(Boolean)
  parsed.sort((a, b) => {
    const td = b.date - a.date
    return td !== 0 ? td : b.rev - a.rev
  })
  return path.join(DATA_DIR, parsed[0].file)
}

function normalize(str) {
  return str?.trim() ?? ''
}

function resolveSourceId(rawValue, sourceIdSet, unmatched) {
  if (!rawValue) return null
  const val = normalize(rawValue)
  if (!val) return null

  // Direct alias lookup
  if (ALIASES[val]) return { sourceId: ALIASES[val], method: 'mapped' }

  // Case-insensitive alias lookup
  const lowerVal = val.toLowerCase()
  for (const [alias, sid] of Object.entries(ALIASES)) {
    if (alias.toLowerCase() === lowerVal) return { sourceId: sid, method: 'mapped' }
  }

  // Try to match as source_name in trusted_sources
  for (const sid of sourceIdSet.values()) {
    if (sid.toLowerCase() === lowerVal) return { sourceId: sid, method: 'exact' }
  }

  // Try as URL → domain lookup
  try {
    const url = new URL(val)
    const hostname = url.hostname.replace(/^www\./, '')
    if (DOMAIN_TO_SOURCE[hostname]) {
      return { sourceId: DOMAIN_TO_SOURCE[hostname], method: 'inferred' }
    }
    // Try subdomain stripping
    const parts = hostname.split('.')
    if (parts.length > 2) {
      const apex = parts.slice(-2).join('.')
      if (DOMAIN_TO_SOURCE[apex]) {
        return { sourceId: DOMAIN_TO_SOURCE[apex], method: 'inferred' }
      }
    }
  } catch {
    // Not a URL, no domain match
  }

  unmatched.add(val)
  return null
}

function today() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}${dd}${yyyy}`
}

// ── Main ────────────────────────────────────────────────────────────────────

const trustedPath = findLatestCSV('trusted_sources_')
if (!trustedPath) {
  console.error('ERROR: No trusted_sources_*.csv found in src/data/')
  process.exit(1)
}

const trustedRows = readCSV(trustedPath)
const sourceIdSet = new Set(trustedRows.map((r) => r.source_id).filter(Boolean))
const sourceNameToId = new Map(trustedRows.map((r) => [normalize(r.source_name), r.source_id]))

// Augment aliases with source_name → source_id from the CSV
for (const [name, sid] of sourceNameToId) {
  if (name && !ALIASES[name]) ALIASES[name] = sid
}

console.log(`Loaded ${trustedRows.length} trusted sources from ${path.basename(trustedPath)}`)

const xrefRows = []
const unmatched = new Set()

/**
 * Process a resource CSV: extract source field (may be semicolon-delimited),
 * resolve each part to a source_id, emit xref rows.
 * @param {string} [fallbackCategoryField] — optional: for migrate, the field
 *   holding category_id for CATEGORY_SOURCE_FALLBACK lookup (last resort).
 */
function processCSV(prefix, resourceType, idField, sourceField, fallbackCategoryField, urlField) {
  const csvPath = findLatestCSV(prefix)
  if (!csvPath) {
    console.warn(`  SKIP: no CSV found for prefix "${prefix}"`)
    return { total: 0, matched: 0 }
  }
  const rows = readCSV(csvPath)
  let matched = 0

  for (const row of rows) {
    const resourceId = normalize(row[idField])
    if (!resourceId) continue

    // Try direct trusted_source_id field first (highest precision)
    const directTSI = normalize(row.trusted_source_id)
    if (directTSI && sourceIdSet.has(directTSI)) {
      const key = `${resourceType}:${resourceId}:${directTSI}`
      xrefRows.push({
        resource_type: resourceType,
        resource_id: resourceId,
        source_id: directTSI,
        match_method: 'direct',
      })
      matched++
      continue
    }

    const sourceRaw = row[sourceField] ?? ''
    const parts = sourceRaw
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)

    const seen = new Set()
    let rowMatched = false
    for (const part of parts) {
      const resolved = resolveSourceId(part, sourceIdSet, unmatched)
      if (!resolved) continue
      const key = `${resourceType}:${resourceId}:${resolved.sourceId}`
      if (seen.has(key)) continue
      seen.add(key)
      xrefRows.push({
        resource_type: resourceType,
        resource_id: resourceId,
        source_id: resolved.sourceId,
        match_method: resolved.method,
      })
      rowMatched = true
      matched++
    }

    // URL field fallback: try a secondary URL column for domain matching (e.g. download_url for library)
    if (!rowMatched && urlField) {
      const urlVal = normalize(row[urlField])
      if (urlVal) {
        const resolved = resolveSourceId(urlVal, sourceIdSet, new Set())
        if (resolved) {
          const key = `${resourceType}:${resourceId}:${resolved.sourceId}`
          if (!seen.has(key)) {
            seen.add(key)
            xrefRows.push({
              resource_type: resourceType,
              resource_id: resourceId,
              source_id: resolved.sourceId,
              match_method: resolved.method,
            })
            rowMatched = true
            matched++
          }
        }
      }
    }

    // Category fallback: used for migrate when URL matching fails
    if (!rowMatched && fallbackCategoryField) {
      const categoryId = normalize(row[fallbackCategoryField])
      const fallbackSourceId = categoryId ? CATEGORY_SOURCE_FALLBACK[categoryId] : null
      if (fallbackSourceId && sourceIdSet.has(fallbackSourceId)) {
        const key = `${resourceType}:${resourceId}:${fallbackSourceId}`
        if (!seen.has(key)) {
          seen.add(key)
          xrefRows.push({
            resource_type: resourceType,
            resource_id: resourceId,
            source_id: fallbackSourceId,
            match_method: 'category-inferred',
          })
          matched++
        }
      }
    }
  }

  const pct = rows.length > 0 ? Math.round((matched / rows.length) * 100) : 0
  console.log(
    `  ${resourceType}: ${matched}/${rows.length} records matched (${pct}%) — ${path.basename(csvPath)}`
  )
  return { total: rows.length, matched }
}

console.log('\nProcessing resource CSVs...')

processCSV('library_', 'library', 'reference_id', 'authors_or_organization', null, 'download_url')
processCSV('quantum_threats_hsm_industries_', 'threats', 'threat_id', 'main_source')
processCSV('timeline_', 'timeline', 'Title', 'OrgName')
processCSV('leaders_', 'leaders', 'Name', 'Organization')
processCSV('compliance_', 'compliance', 'id', 'enforcement_body')
processCSV(
  'pqc_product_catalog_',
  'migrate',
  'software_name',
  'authoritative_source',
  'category_id'
)
processCSV('pqc_complete_algorithm_reference_', 'algorithm', 'Algorithm', 'FIPS Standard')

// ── Output ─────────────────────────────────────────────────────────────────

if (unmatched.size > 0) {
  console.warn(`\nUnmatched source values (${unmatched.size}) — add to ALIASES if needed:`)
  for (const v of [...unmatched].sort()) {
    console.warn(`  "${v}"`)
  }
}

console.log(`\nGenerated ${xrefRows.length} xref rows`)

if (DRY_RUN) {
  console.log('DRY RUN: no file written')
  process.exit(0)
}

const outFile = `trusted_source_xref_${today()}.csv`
const outPath = path.join(DATA_DIR, outFile)

// Check if file already exists (same-day run) → add revision suffix
let finalPath = outPath
if (fs.existsSync(outPath)) {
  let rev = 1
  while (fs.existsSync(path.join(DATA_DIR, `trusted_source_xref_${today()}_r${rev}.csv`))) {
    rev++
  }
  finalPath = path.join(DATA_DIR, `trusted_source_xref_${today()}_r${rev}.csv`)
}

const csv = Papa.unparse(xrefRows, { header: true })
fs.writeFileSync(finalPath, csv + '\n')
console.log(`\nWrote: ${path.basename(finalPath)}`)

if (VERBOSE) {
  const byType = {}
  for (const r of xrefRows) {
    byType[r.resource_type] = (byType[r.resource_type] ?? 0) + 1
  }
  console.log('\nBreakdown by resource type:')
  for (const [t, n] of Object.entries(byType).sort()) {
    console.log(`  ${t}: ${n}`)
  }
}
