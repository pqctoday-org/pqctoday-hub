import {
  Users,
  Globe,
  Lightbulb,
  HelpCircle,
  Cpu,
  BookOpen,
  Trophy,
  FileText,
  CalendarDays,
  ShieldAlert,
  Package,
  Stamp,
} from 'lucide-react'

export const MISSION_TAGS = [
  '48 learning modules',
  '14 business planning tools',
  '14-step risk assessment',
  '385+ migration catalog',
  'PKCS#11 v3.2 simulator',
  'FIPS 203 / 204 / 205',
  'AI assistant — runs locally',
  'Zero data collected',
]

export const PRINCIPLES = [
  {
    label: 'Worldwide',
    text: 'Not US-centric. NIST, ETSI, GSMA, ANSSI, ASD — all regulatory frameworks treated equally.',
  },
  {
    label: 'Transparent',
    text: 'Open source. GitHub-governed. Every correction, contribution, and decision is publicly auditable.',
  },
  {
    label: 'Neutral',
    text: 'No vendor relationships. No commercial bias. We do not take sides — we provide data so you can.',
  },
  {
    label: 'Private by design',
    text: 'No registration. No data collection. Processing runs on your device. We never know you visited.',
  },
  {
    label: 'Free at the core',
    text: 'Access to knowledge must not be gated. The community edition is free. Always.',
  },
  {
    label: 'Community governed',
    text: 'PQC practitioners set the roadmap. The platform serves the community, not the other way around.',
  },
]

export const NOT_ITEMS = [
  {
    label: 'Not a vendor',
    text: 'We have no commercial relationships with HSM, cloud, or security vendors. Our content is not for sale.',
  },
  {
    label: 'Not a standards body',
    text: 'We reference and empower NIST, ETSI, ANSSI, and GSMA. We do not replace them.',
  },
  {
    label: 'Not a surveillance platform',
    text: 'We collect zero user data. We do not know who you are. We never will.',
  },
  {
    label: 'Not US-only',
    text: 'The quantum transition is a global challenge. Our platform is designed for every regulatory environment.',
  },
]

export const DATA_FOUNDATION = [
  { dataset: 'Timeline Events', records: 203, sources: '80+ orgs, 50+ countries' },
  { dataset: 'Library Resources', records: 325, sources: '30+ standards bodies' },
  { dataset: 'Algorithm Reference', records: 46, sources: 'FIPS 203/204/205/206' },
  { dataset: 'Compliance Frameworks', records: 91, sources: 'NIST, ACVP, CC, ANSSI' },
  { dataset: 'Migrate Products', records: 385, sources: '7 infrastructure layers' },
  { dataset: 'Threat Landscape', records: 79, sources: '8+ industry sectors' },
  { dataset: 'Industry Leaders', records: 181, sources: 'Public, Private, Academic' },
  { dataset: 'Quiz Questions', records: 820, sources: 'All PQC topic areas' },
  { dataset: 'Authoritative Sources', records: 88, sources: 'Gov, Academic, Industry' },
  { dataset: 'Learning Modules', records: 48, sources: '2,400+ min of content' },
]

export const DISCUSSIONS_BASE = 'https://github.com/pqctoday/pqc-timeline-app/discussions/'

export const DISCUSSIONS = [
  {
    number: 108,
    icon: Users,
    label: 'Contribute',
    description: 'I need your help to improve pqctoday.com',
  },
  {
    number: 109,
    icon: Globe,
    label: 'PQC News',
    description: 'Share general information about PQC',
  },
  { number: 110, icon: Lightbulb, label: 'Ideas', description: 'Post your ideas for improvements' },
  { number: 111, icon: HelpCircle, label: 'Q&A', description: 'Ask questions — answered ASAP' },
  { number: 113, icon: Cpu, label: 'Algorithms', description: 'Update or add a new algorithm' },
  {
    number: 115,
    icon: BookOpen,
    label: 'Learn Modules',
    description: 'Update or add a new learning module',
  },
  {
    number: 116,
    icon: Trophy,
    label: 'Leaders',
    description: 'I consent to be added as a PQC leader',
    url: 'https://github.com/pqctoday/pqc-timeline-app/discussions/new?category=i-consent-to-be-added-as-a-pqc-leader',
  },
  {
    number: 117,
    icon: FileText,
    label: 'References',
    description: 'Update or add a reference document',
  },
  {
    number: 118,
    icon: CalendarDays,
    label: 'Timeline',
    description: 'Change or add a new timeline',
  },
  { number: 119, icon: ShieldAlert, label: 'Threats', description: 'Change or add a new threat' },
  { number: 120, icon: Package, label: 'Products', description: 'Change or add a new product' },
  {
    number: 0,
    icon: Stamp,
    label: 'Library Endorsements',
    description: 'Endorse a library resource for relevance and accuracy',
    url: 'https://github.com/pqctoday/pqc-timeline-app/discussions/categories/library-resource-endorsement',
  },
]

export const CRYPTO_BUFF_SITES = [
  {
    label: 'NIST Post-Quantum Cryptography',
    description:
      'Official NIST PQC standardization project — FIPS 203/204/205 standards, submissions, and status updates',
    url: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
  },
  {
    label: 'Open Quantum Safe (OQS)',
    description:
      'Open-source PQC library (liboqs) and OpenSSL/BoringSSL integrations — reference implementations',
    url: 'https://openquantumsafe.org',
  },
  {
    label: 'IACR ePrint Archive',
    description: 'Preprint server for cryptography research — where PQC papers appear first',
    url: 'https://eprint.iacr.org',
  },
  {
    label: 'A Security Site — PQC',
    description:
      'Prof. Bill Buchanan OBE — extensive PQC algorithm references and interactive labs',
    url: 'https://asecuritysite.com/pqc',
  },
  {
    label: 'cr.yp.to — Daniel J. Bernstein',
    description:
      'Co-creator of SPHINCS+/SLH-DSA and NTRU contributor — papers, software, and PQC commentary',
    url: 'https://cr.yp.to',
  },
  {
    label: 'Cryptographic Engineering — Matthew Green',
    description:
      'Johns Hopkins professor — accessible deep dives on PQC, protocol security, and crypto policy',
    url: 'https://blog.cryptographyengineering.com',
  },
  {
    label: 'Schneier on Security',
    description: "Bruce Schneier's blog — crypto policy, applied security, and PQC commentary",
    url: 'https://www.schneier.com',
  },
  {
    label: 'Stanford Cryptography Group',
    description: "Dan Boneh's research group — papers, courses, and applied crypto projects",
    url: 'https://crypto.stanford.edu',
  },
  {
    label: 'Cryptography I — Dan Boneh (Coursera)',
    description: "The gold-standard free online cryptography course by Stanford's Dan Boneh",
    url: 'https://www.coursera.org/learn/crypto',
  },
  {
    label: 'MIT OpenCourseWare — Cryptography',
    description: 'Free MIT lecture notes and problem sets for cryptography courses',
    url: 'https://ocw.mit.edu',
  },
]

export const CRYPTO_BUFF_BOOKS = [
  {
    title: 'Post-Quantum Cryptography',
    author: 'Daniel J. Bernstein, Johannes Buchmann & Erik Dahmen',
    description:
      'The foundational PQC textbook — lattice, code-based, hash-based, and multivariate algorithm families',
    url: 'https://link.springer.com/book/10.1007/978-3-540-88702-7',
  },
  {
    title: 'An Introduction to Mathematical Cryptography',
    author: 'Jeffrey Hoffstein, Jill Pipher & Joseph H. Silverman',
    description:
      'Lattice-based crypto foundations (the math behind ML-KEM and ML-DSA) — by the creators of NTRU',
    url: 'https://link.springer.com/book/10.1007/978-1-4939-1711-2',
  },
  {
    title: 'A Graduate Course in Applied Cryptography',
    author: 'Dan Boneh & Victor Shoup',
    description:
      'Comprehensive and free — provable security, public-key encryption, and signature schemes',
    url: 'https://toc.cryptobook.us',
  },
  {
    title: 'Real World Cryptography',
    author: 'David Wong',
    description:
      'Hands-on guide to modern crypto primitives, protocols, and their real-world application',
    url: 'https://www.manning.com/books/real-world-cryptography',
  },
  {
    title: 'Serious Cryptography',
    author: 'Jean-Philippe Aumasson',
    description: 'Practical guide to modern encryption — symmetric, asymmetric, and protocols',
    url: 'https://nostarch.com/seriouscrypto',
  },
  {
    title: 'Applied Cryptography',
    author: 'Bruce Schneier',
    description: 'The classic reference on cryptographic protocols, algorithms, and source code',
    url: 'https://www.schneier.com/books/applied-cryptography/',
  },
  {
    title: 'The Code Book',
    author: 'Simon Singh',
    description: 'The history of codes and ciphers — from Caesar to quantum cryptography',
    url: 'https://simonsingh.net/books/the-code-book/',
  },
  {
    title: 'Self-Sovereign Identity',
    author: 'Alex Preukschat & Drummond Reed',
    description: 'Decentralized digital identity architecture, VCs, DIDs, and trust frameworks',
    url: 'https://www.manning.com/books/self-sovereign-identity',
  },
]
