// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Reviewed identities for the long tail of publisher and scheme-body strings in
 * the active Compliance catalogue. The source URLs are the official organization,
 * scheme, legislation, or publication pages already reviewed for the matching
 * catalogue records. Composite strings remain explicit identities: silently
 * splitting them would lose who jointly published or operated the instrument.
 */
import type { SourceOrganization, SourceOrganizationKind } from './sourceOrganizations'

const VERIFIED_AT = '2026-10-17'

function source(
  id: string,
  name: string,
  aliases: readonly string[],
  kind: SourceOrganizationKind,
  domiciles: readonly string[],
  scope: SourceOrganization['scope'],
  sourceUrl: string,
  relationshipOverride?: SourceOrganization['relationshipOverride']
): SourceOrganization {
  return {
    id,
    name,
    aliases,
    kind,
    domiciles,
    scope,
    sourceUrl,
    verifiedAt: VERIFIED_AT,
    ...(relationshipOverride ? { relationshipOverride } : {}),
  }
}

export const CATALOGUE_SOURCE_ORGANIZATIONS: readonly SourceOrganization[] = [
  source(
    'intl-3gpp-sa3',
    '3GPP SA3',
    ['3GPP', '3GPP SA3'],
    'standards_body',
    [],
    'international',
    'https://www.3gpp.org/specifications-groups/sa-plenary/sa3-security'
  ),
  source(
    'intl-african-union-commission',
    'African Union Commission',
    ['African Union Commission'],
    'government_agency',
    [],
    'regional',
    'https://au.int/en/commission'
  ),
  source(
    'cl-anci',
    'Agencia Nacional de Ciberseguridad (ANCI)',
    ['Agencia Nacional de Ciberseguridad (ANCI)'],
    'regulator',
    ['Chile'],
    'national',
    'https://anci.gob.cl/'
  ),
  source(
    'br-anpd',
    'Autoridade Nacional de Proteção de Dados (ANPD)',
    ['ANPD'],
    'regulator',
    ['Brazil'],
    'national',
    'https://www.gov.br/anpd/pt-br'
  ),
  source(
    'pe-anpd-pcm',
    'ANPD Peru and PCM-SeGDi',
    ['ANPD (Peru); PCM-SeGDi'],
    'regulator',
    ['Peru'],
    'national',
    'https://www.gob.pe/anpd'
  ),
  source(
    'au-apra',
    'Australian Prudential Regulation Authority (APRA)',
    ['APRA'],
    'regulator',
    ['Australia'],
    'national',
    'https://www.apra.gov.au/'
  ),
  source(
    'intl-asc-x9-ansi',
    'ASC X9 and ANSI',
    ['ASC X9; ANSI'],
    'standards_body',
    ['United States'],
    'international',
    'https://x9.org/'
  ),
  source(
    'au-austrac',
    'Australian Transaction Reports and Analysis Centre (AUSTRAC)',
    ['AUSTRAC'],
    'regulator',
    ['Australia'],
    'national',
    'https://www.austrac.gov.au/'
  ),
  source(
    'au-aca-asd',
    'Australian Certification Authority and ASD',
    ['Australian Certification Authority (ACA), Australian Signals Directorate'],
    'certification_scheme',
    ['Australia'],
    'national',
    'https://www.cyber.gov.au/business-government/protecting-devices-systems/assessment-evaluation-programs/australian-information-security-evaluation-program'
  ),
  source(
    'br-bacen',
    'Banco Central do Brasil (BACEN)',
    ['Banco Central do Brasil (BACEN)'],
    'regulator',
    ['Brazil'],
    'national',
    'https://www.bcb.gov.br/'
  ),
  source(
    'my-bnm',
    'Bank Negara Malaysia (BNM)',
    ['Bank Negara Malaysia (BNM)'],
    'regulator',
    ['Malaysia'],
    'national',
    'https://www.bnm.gov.my/'
  ),
  source(
    'uk-pra',
    'Prudential Regulation Authority',
    ['Bank of England — Prudential Regulation Authority'],
    'regulator',
    ['United Kingdom'],
    'national',
    'https://www.bankofengland.co.uk/prudential-regulation'
  ),
  source(
    'il-boi',
    'Bank of Israel',
    ['Bank of Israel'],
    'regulator',
    ['Israel'],
    'national',
    'https://www.boi.org.il/en/'
  ),
  source(
    'intl-bis',
    'Bank for International Settlements (BIS)',
    ['BIS'],
    'international_arrangement',
    [],
    'international',
    'https://www.bis.org/about/index.htm'
  ),
  source(
    'at-bmi',
    'Austrian Federal Ministry of the Interior (BMI)',
    ['BMI'],
    'government_agency',
    ['Austria'],
    'national',
    'https://www.bmi.gv.at/'
  ),
  source(
    'intl-cab-forum',
    'CA/Browser Forum',
    ['CA/Browser Forum'],
    'industry_consortium',
    [],
    'international',
    'https://cabforum.org/'
  ),
  source(
    'cn-cac-product-certification',
    'CAC, MIIT, MPS and CNCA product-certification authorities',
    ['CAC with MIIT, MPS and CNCA (qualified certification/testing institutions)'],
    'certification_scheme',
    ['China'],
    'national',
    'https://www.cac.gov.cn/2023-04/17/c_1683373663312410.htm'
  ),
  source(
    'jo-cbj',
    'Central Bank of Jordan (CBJ)',
    ['CBJ'],
    'regulator',
    ['Jordan'],
    'national',
    'https://www.cbj.gov.jo/'
  ),
  source(
    'be-ccb',
    'Centre for Cybersecurity Belgium (CCB)',
    ['CCB (Centre for Cybersecurity Belgium)'],
    'government_agency',
    ['Belgium'],
    'national',
    'https://ccb.belgium.be/'
  ),
  source(
    'es-ccn',
    'National Cryptologic Centre (CCN)',
    ['CCN'],
    'government_agency',
    ['Spain'],
    'national',
    'https://www.ccn.cni.es/'
  ),
  source(
    'in-cert-in',
    'Indian Computer Emergency Response Team (CERT-In)',
    ['CERT-In', 'Indian Computer Emergency Response Team (CERT-In)'],
    'government_agency',
    ['India'],
    'national',
    'https://www.cert-in.org.in/'
  ),
  source(
    'us-cisa-nsa',
    'CISA and NSA',
    ['CISA/NSA'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.cisa.gov/quantum'
  ),
  source(
    'cn-cnitsec',
    'China Information Technology Security Evaluation Center (CNITSEC)',
    ['CNITSEC (China Information Technology Security Evaluation Center)'],
    'certification_scheme',
    ['China'],
    'national',
    'https://www.itsec.gov.cn/'
  ),
  source(
    'mx-cnbv',
    'Comisión Nacional Bancaria y de Valores (CNBV)',
    ['Comisión Nacional Bancaria y de Valores (CNBV)'],
    'regulator',
    ['Mexico'],
    'national',
    'https://www.gob.mx/cnbv/es/que-hacemos'
  ),
  source(
    'jp-cryptrec',
    'CRYPTREC',
    ['CRYPTREC'],
    'standards_body',
    ['Japan'],
    'national',
    'https://www.cryptrec.go.jp/'
  ),
  source(
    'intl-cloud-security-alliance',
    'Cloud Security Alliance (CSA)',
    ['CSA'],
    'industry_consortium',
    [],
    'international',
    'https://cloudsecurityalliance.org/'
  ),
  source(
    'sg-csa',
    'Cyber Security Agency of Singapore (CSA)',
    ['CSA Singapore', 'Cyber Security Agency of Singapore (CSA)'],
    'government_agency',
    ['Singapore'],
    'national',
    'https://www.csa.gov.sg/'
  ),
  source(
    'se-csec-fmv',
    'CSEC at the Swedish Defence Materiel Administration',
    ['CSEC, Swedish Defence Materiel Administration (FMV)'],
    'certification_scheme',
    ['Sweden'],
    'national',
    'https://www.fmv.se/verksamhet/csec/'
  ),
  source(
    'intl-cri',
    'Cyber Risk Institute (CRI)',
    ['Cyber Risk Institute (CRI)'],
    'industry_consortium',
    [],
    'international',
    'https://cyberriskinstitute.org/'
  ),
  source(
    'in-data-protection-board',
    'Data Protection Board of India',
    ['Data Protection Board of India'],
    'regulator',
    ['India'],
    'national',
    'https://www.meity.gov.in/data-protection-framework'
  ),
  source(
    'us-disa',
    'Defense Information Systems Agency (DISA)',
    ['DISA'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.disa.mil/'
  ),
  source(
    'us-dod-ousd-as',
    'US Department of Defense OUSD(A&S)',
    ['DoD/OUSD(A&S)'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.acq.osd.mil/'
  ),
  source(
    'in-dst-nqm',
    'India DST and National Quantum Mission',
    ['DST/NQM'],
    'government_agency',
    ['India'],
    'national',
    'https://dst.gov.in/national-quantum-mission-nqm'
  ),
  source(
    'eu-esas',
    'European Supervisory Authorities',
    ['EBA/ESMA/EIOPA'],
    'regulator',
    [],
    'regional',
    'https://www.esas-joint-committee.europa.eu/'
  ),
  source(
    'intl-etsi-eu-commission',
    'ETSI and European Commission',
    ['ETSI/EU Commission'],
    'standards_body',
    [],
    'regional',
    'https://www.etsi.org/'
  ),
  source(
    'eu-dpas',
    'European Union data-protection authorities',
    ['EU DPAs'],
    'regulator',
    [],
    'regional',
    'https://www.edpb.europa.eu/about-edpb/about-edpb/members_en'
  ),
  source(
    'eu-eba-ncas',
    'European Banking Authority and national competent authorities',
    ['European Banking Authority (EBA); national competent authorities'],
    'regulator',
    [],
    'regional',
    'https://www.eba.europa.eu/about-us/legal-and-policy-framework/eba-regulation-and-institutional-framework'
  ),
  source(
    'eu-commission',
    'European Commission',
    ['European Commission'],
    'government_agency',
    [],
    'regional',
    'https://commission.europa.eu/about-european-commission_en'
  ),
  source(
    'eu-commission-enisa',
    'European Commission and ENISA',
    ['European Commission/ENISA'],
    'government_agency',
    [],
    'regional',
    'https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act'
  ),
  source(
    'eu-europol-fsisac',
    'Europol and FS-ISAC',
    ['Europol/FS-ISAC'],
    'government_agency',
    [],
    'regional',
    'https://www.europol.europa.eu/cms/sites/default/files/documents/Quantum-safe-financial-forum-2025.pdf'
  ),
  source(
    'us-fbi-cjis',
    'FBI Criminal Justice Information Services Division',
    ['FBI Criminal Justice Information Services (CJIS) Division'],
    'government_agency',
    ['United States'],
    'national',
    'https://le.fbi.gov/informational-tools/cjis-security-policy-resource-center'
  ),
  source(
    'us-fda',
    'US Food and Drug Administration (FDA)',
    ['FDA'],
    'regulator',
    ['United States'],
    'national',
    'https://www.fda.gov/about-fda'
  ),
  source(
    'us-faa',
    'US Federal Aviation Administration',
    ['Federal Aviation Administration'],
    'regulator',
    ['United States'],
    'national',
    'https://www.faa.gov/about'
  ),
  source(
    'us-ffiec',
    'Federal Financial Institutions Examination Council (FFIEC)',
    ['Federal Financial Institutions Examination Council (FFIEC)'],
    'regulator',
    ['United States'],
    'national',
    'https://www.ffiec.gov/'
  ),
  source(
    'ru-fsb-tc26',
    'FSB and TC 26 (Rosstandart)',
    ['FSB; TC 26 (Rosstandart)'],
    'standards_body',
    ['Russia'],
    'national',
    'https://tc26.ru/'
  ),
  source(
    'ru-fstec',
    'Federal Service for Technical and Export Control (FSTEC)',
    ['FSTEC of Russia (Federal Service for Technical and Export Control)'],
    'certification_scheme',
    ['Russia'],
    'national',
    'https://fstec.ru/'
  ),
  source(
    'us-ftc',
    'US Federal Trade Commission (FTC)',
    ['FTC'],
    'regulator',
    ['United States'],
    'national',
    'https://www.ftc.gov/about-ftc/mission'
  ),
  source(
    'intl-g7-ceg-us-treasury',
    'G7 Cyber Expert Group and US Treasury',
    ['G7 CEG/US Treasury'],
    'international_arrangement',
    [],
    'international',
    'https://home.treasury.gov/system/files/136/G7-CEG-Quantum-Roadmap.pdf'
  ),
  source(
    'nz-gcsb-ncsc',
    'New Zealand GCSB and NCSC',
    ['GCSB/NCSC'],
    'government_agency',
    ['New Zealand'],
    'national',
    'https://www.ncsc.govt.nz/about-us/'
  ),
  source(
    'us-gsa-fedramp',
    'GSA FedRAMP Program Management Office',
    ['GSA/FedRAMP PMO'],
    'certification_scheme',
    ['United States'],
    'national',
    'https://www.fedramp.gov/'
  ),
  source(
    'intl-gsma',
    'GSMA',
    ['GSMA'],
    'industry_consortium',
    [],
    'international',
    'https://www.gsma.com/about-us/'
  ),
  source(
    'us-hhs-ocr',
    'US HHS Office for Civil Rights',
    ['HHS OCR'],
    'regulator',
    ['United States'],
    'national',
    'https://www.hhs.gov/ocr/about-us/index.html'
  ),
  source(
    'hk-hkma',
    'Hong Kong Monetary Authority (HKMA)',
    ['HKMA'],
    'regulator',
    ['Hong Kong'],
    'national',
    'https://www.hkma.gov.hk/eng/about-us/'
  ),
  source(
    'il-incd',
    'Israel National Cyber Directorate (INCD)',
    ['INCD'],
    'government_agency',
    ['Israel'],
    'national',
    'https://www.gov.il/en/departments/israel_national_cyber_directorate/govil-landing-page'
  ),
  source(
    'za-information-regulator',
    'Information Regulator South Africa',
    ['Information Regulator (South Africa)'],
    'regulator',
    ['South Africa'],
    'national',
    'https://inforegulator.org.za/'
  ),
  source(
    'jp-ipa',
    'Information-technology Promotion Agency (IPA)',
    ['Information-technology Promotion Agency (IPA)'],
    'certification_scheme',
    ['Japan'],
    'national',
    'https://www.ipa.go.jp/en/'
  ),
  source(
    'jp-ipa-meti',
    'IPA and METI',
    ['IPA/METI'],
    'certification_scheme',
    ['Japan'],
    'national',
    'https://www.ipa.go.jp/en/security/jcmvp/index.html'
  ),
  source(
    'intl-iso-sae',
    'ISO and SAE International',
    ['ISO/SAE'],
    'standards_body',
    [],
    'international',
    'https://www.iso.org/standard/70918.html'
  ),
  source(
    'kr-itscc',
    'IT Security Certification Center (ITSCC)',
    ['IT Security Certification Center (ITSCC)'],
    'certification_scheme',
    ['South Korea'],
    'national',
    'https://www.itscc.kr/main.do'
  ),
  source(
    'intl-itu-t',
    'ITU Telecommunication Standardization Sector (ITU-T)',
    ['ITU-T'],
    'standards_body',
    [],
    'international',
    'https://www.itu.int/en/ITU-T/about/Pages/default.aspx'
  ),
  source(
    'kr-kisa-nis',
    'KISA and National Intelligence Service',
    ['KISA/NIS'],
    'standards_body',
    ['South Korea'],
    'national',
    'https://www.kisa.or.kr/EN/402'
  ),
  source(
    'kr-kisa-nis-msit',
    'KISA, NIS and MSIT',
    ['KISA/NIS/MSIT'],
    'standards_body',
    ['South Korea'],
    'national',
    'https://kpqc.or.kr/contents/01_company/sub01.html'
  ),
  source(
    'tr-kvkk-btk-tubitak',
    'KVKK Authority, BTK and TÜBİTAK BİLGEM',
    ['KVK Kurumu; BTK; TÜBİTAK BİLGEM'],
    'government_agency',
    ['Turkey'],
    'national',
    'https://www.kvkk.gov.tr/'
  ),
  source(
    'intl-linux-foundation',
    'Linux Foundation',
    ['Linux Foundation'],
    'industry_consortium',
    [],
    'international',
    'https://www.linuxfoundation.org/about'
  ),
  source(
    'my-mycc',
    'Malaysian Common Criteria Certification Body',
    ['Malaysian Common Criteria Certification Body (MyCB), CyberSecurity Malaysia'],
    'certification_scheme',
    ['Malaysia'],
    'national',
    'https://www.cybersecurity.my/portal-main/services/malaysian-common-criteria-scheme-overview'
  ),
  source(
    'sg-mas',
    'Monetary Authority of Singapore (MAS)',
    ['MAS'],
    'regulator',
    ['Singapore'],
    'national',
    'https://www.mas.gov.sg/who-we-are'
  ),
  source(
    'vn-mic-mps',
    'Vietnam MIC and Ministry of Public Security',
    ['MIC; A05 (Ministry of Public Security)'],
    'government_agency',
    ['Vietnam'],
    'national',
    'https://english.mic.gov.vn/'
  ),
  source(
    'pl-moda-nask',
    'Polish Ministry of Digital Affairs and NASK',
    ['Ministry of Digital Affairs; NASK'],
    'government_agency',
    ['Poland'],
    'national',
    'https://www.gov.pl/web/digitalization'
  ),
  source(
    'kz-digital-ministry',
    'Kazakhstan Ministry of Digital Development, Innovation and Aerospace Industry',
    ['Ministry of Digital Development, Innovation and Aerospace Industry of Kazakhstan'],
    'certification_scheme',
    ['Kazakhstan'],
    'national',
    'https://www.gov.kz/memleket/entities/mdai?lang=en'
  ),
  source(
    'tw-moda',
    'Taiwan Ministry of Digital Affairs (MODA)',
    ['MODA'],
    'government_agency',
    ['Taiwan'],
    'national',
    'https://moda.gov.tw/en/'
  ),
  source(
    'se-msb',
    'Swedish Civil Contingencies Agency (MSB)',
    ['Myndigheten för samhällsskydd och beredskap (MSB)'],
    'government_agency',
    ['Sweden'],
    'national',
    'https://www.msb.se/en/'
  ),
  source(
    'my-nacsa',
    'Malaysia National Cyber Security Agency (NACSA)',
    ['NACSA'],
    'government_agency',
    ['Malaysia'],
    'national',
    'https://www.nacsa.gov.my/'
  ),
  source(
    'no-nsm',
    'Norwegian National Security Authority (NSM)',
    ['Nasjonal sikkerhetsmyndighet (NSM)'],
    'government_agency',
    ['Norway'],
    'national',
    'https://nsm.no/areas-of-expertise/cyber-security/'
  ),
  source(
    'pl-nask-certification',
    'NASK Common Criteria Certification Body',
    ['NASK Certification Body, NASK National Research Institute'],
    'certification_scheme',
    ['Poland'],
    'national',
    'https://certyfikacja.nask.pl/en/en-common-criteria/'
  ),
  source(
    'cz-nukib',
    'National Cyber and Information Security Agency (NÚKIB)',
    ['National Cyber and Information Security Agency (NÚKIB)'],
    'regulator',
    ['Czech Republic'],
    'national',
    'https://nukib.gov.cz/en/'
  ),
  source(
    'qa-ncsa',
    'Qatar National Cyber Security Agency',
    ['National Cyber Security Agency (NCSA), National Cyber Governance and Assurance Affairs'],
    'certification_scheme',
    ['Qatar'],
    'national',
    'https://ncsa.gov.qa/en/pages/qccs'
  ),
  source(
    'sa-nca',
    'Saudi National Cybersecurity Authority (NCA)',
    ['NCA'],
    'regulator',
    ['Saudi Arabia'],
    'national',
    'https://nca.gov.sa/en/'
  ),
  source(
    'fi-ncsc-traficom',
    'NCSC-FI at Traficom',
    ['NCSC-FI / Traficom'],
    'government_agency',
    ['Finland'],
    'national',
    'https://www.kyberturvallisuuskeskus.fi/en/'
  ),
  source(
    'ie-ncsc',
    'National Cyber Security Centre Ireland',
    ['NCSC-IE (under DECC)'],
    'government_agency',
    ['Ireland'],
    'national',
    'https://www.ncsc.gov.ie/'
  ),
  source(
    'nl-ncsc',
    'National Cyber Security Centre Netherlands',
    ['NCSC-NL'],
    'government_agency',
    ['Netherlands'],
    'national',
    'https://www.ncsc.nl/'
  ),
  source(
    'ng-ndpc',
    'Nigeria Data Protection Commission',
    ['NDPC (Nigeria Data Protection Commission)'],
    'regulator',
    ['Nigeria'],
    'national',
    'https://ndpc.gov.ng/'
  ),
  source(
    'intl-nerc',
    'North American Electric Reliability Corporation (NERC)',
    ['NERC'],
    'regulator',
    ['United States', 'Canada'],
    'regional',
    'https://www.nerc.com/AboutNERC/Pages/default.aspx'
  ),
  source(
    'kr-nis-kcmvp',
    'Korean National Intelligence Service',
    ['NIS'],
    'certification_scheme',
    ['South Korea'],
    'national',
    'https://www.ncsc.go.kr/ko/main/cryptoModule.html'
  ),
  source(
    'se-unnamed-supervisory-authority',
    'Supervisory authority not yet named by the statute',
    [
      'Not stated in source (statute delegates naming the supervisory authority to a future government decision)',
    ],
    'government_agency',
    [],
    'national',
    'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/cybersakerhetslag-20251506_sfs-2025-1506/',
    'unclassified'
  ),
  source(
    'ph-npc-dict',
    'Philippines National Privacy Commission and DICT',
    ['NPC (Philippines); DICT'],
    'regulator',
    ['Philippines'],
    'national',
    'https://privacy.gov.ph/'
  ),
  source(
    'us-nsa-omb',
    'NSA and Office of Management and Budget',
    ['NSA/OMB'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.federalregister.gov/documents/2025/06/11/2025-10804/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694'
  ),
  source(
    'us-nydfs',
    'New York State Department of Financial Services',
    ['NY DFS'],
    'regulator',
    ['United States'],
    'national',
    'https://www.dfs.ny.gov/industry-guidance/cybersecurity'
  ),
  source(
    'au-oaic',
    'Office of the Australian Information Commissioner',
    ['OAIC'],
    'regulator',
    ['Australia'],
    'national',
    'https://www.oaic.gov.au/about-the-OAIC'
  ),
  source(
    'intl-oasis-pkcs11',
    'OASIS PKCS 11 Technical Committee',
    ['OASIS', 'OASIS PKCS11 TC'],
    'standards_body',
    [],
    'international',
    'https://www.oasis-open.org/committees/pkcs11/'
  ),
  source(
    'ke-odpc',
    'Office of the Data Protection Commissioner Kenya',
    ['ODPC (Kenya)'],
    'regulator',
    ['Kenya'],
    'national',
    'https://www.odpc.go.ke/'
  ),
  source(
    'us-omb',
    'US Office of Management and Budget',
    ['OMB'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.whitehouse.gov/omb/'
  ),
  source(
    'us-omb-dhs',
    'US Office of Management and Budget and DHS',
    ['OMB / DHS'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.whitehouse.gov/wp-content/uploads/2018/12/M-19-03.pdf'
  ),
  source(
    'us-omb-cisa',
    'US Office of Management and Budget and CISA',
    ['OMB/CISA'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.cisa.gov/topics/cyber-threats-and-advisories/federal-information-security-modernization-act'
  ),
  source(
    'us-omb-congress',
    'US Office of Management and Budget and Congress',
    ['OMB/Congress'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.congress.gov/bill/117th-congress/house-bill/7535/text'
  ),
  source(
    'it-ocsi-acn',
    'OCSI at the Italian National Cybersecurity Agency',
    [
      'Organismo di Certificazione della Sicurezza Informatica (OCSI), Agenzia per la Cybersicurezza Nazionale (ACN)',
    ],
    'certification_scheme',
    ['Italy'],
    'national',
    'https://www.ocsi.gov.it/index.php/organismo/lo-schema.html'
  ),
  source(
    'ca-osfi',
    'Office of the Superintendent of Financial Institutions',
    ['OSFI'],
    'regulator',
    ['Canada'],
    'national',
    'https://www.osfi-bsif.gc.ca/en/about-osfi'
  ),
  source(
    'id-ojk',
    'Otoritas Jasa Keuangan (OJK)',
    ['Otoritas Jasa Keuangan (OJK)'],
    'regulator',
    ['Indonesia'],
    'national',
    'https://ojk.go.id/en/tentang-ojk/'
  ),
  source(
    'intl-pci-ssc',
    'PCI Security Standards Council',
    ['PCI SSC'],
    'industry_consortium',
    [],
    'international',
    'https://www.pcisecuritystandards.org/about_us/'
  ),
  source(
    'id-pdp-bssn',
    'Indonesia PDP authority and BSSN',
    ['PDP Authority (under KomDigi); BSSN'],
    'regulator',
    ['Indonesia'],
    'national',
    'https://peraturan.bpk.go.id/Download/224884/UU%20Nomor%2027%20Tahun%202022.pdf'
  ),
  source(
    'th-pdpc-ncsa-etda',
    'Thailand PDPC, NCSA and ETDA',
    ['PDPC (Thailand); NCSA; ETDA'],
    'regulator',
    ['Thailand'],
    'national',
    'https://www.pdpc.or.th/'
  ),
  source(
    'intl-pki-consortium',
    'PKI Consortium',
    ['PKI Consortium'],
    'industry_consortium',
    [],
    'international',
    'https://pkic.org/about/'
  ),
  source(
    'in-rbi',
    'Reserve Bank of India',
    ['Reserve Bank of India'],
    'regulator',
    ['India'],
    'national',
    'https://www.rbi.org.in/'
  ),
  source(
    'ee-ria',
    'Estonian Information System Authority (RIA)',
    ['RIA (Estonian Information System Authority)'],
    'government_agency',
    ['Estonia'],
    'national',
    'https://www.ria.ee/en'
  ),
  source(
    'intl-rtca',
    'RTCA',
    ['RTCA'],
    'standards_body',
    [],
    'international',
    'https://www.rtca.org/about/'
  ),
  source(
    'intl-rtca-eurocae',
    'RTCA and EUROCAE',
    ['RTCA/EUROCAE'],
    'standards_body',
    [],
    'international',
    'https://www.rtca.org/products/do-326a-electronic/'
  ),
  source(
    'sa-sama',
    'Saudi Central Bank (SAMA)',
    ['Saudi Central Bank (SAMA)'],
    'regulator',
    ['Saudi Arabia'],
    'national',
    'https://www.sama.gov.sa/en-US/About/Pages/default.aspx'
  ),
  source(
    'cn-sca-oscca',
    'Chinese State Cryptography Administration',
    ['SCA/OSCCA'],
    'standards_body',
    ['China'],
    'national',
    'https://www.sca.gov.cn/sca/jggk/index.shtml'
  ),
  source(
    'no-sertit',
    'SERTIT at the Norwegian National Security Authority',
    ['SERTIT, Norwegian National Security Authority (NSM)'],
    'certification_scheme',
    ['Norway'],
    'national',
    'https://sertit.no/the-norwegian-certification-scheme/about-the-certification-scheme/'
  ),
  source(
    'co-sic-mintic-colcert',
    'Colombia SIC, MinTIC and ColCERT',
    ['SIC; MinTIC; ColCERT'],
    'regulator',
    ['Colombia'],
    'national',
    'https://www.sic.gov.co/'
  ),
  source(
    'in-stqc',
    'STQC Directorate at the Ministry of Electronics and Information Technology',
    ['STQC Directorate, Ministry of Electronics and Information Technology'],
    'certification_scheme',
    ['India'],
    'national',
    'https://commoncriteria-india.gov.in/indian-common-criteria-certification-scheme-ic3s-overview'
  ),
  source(
    'pe-sbs',
    'Superintendencia de Banca, Seguros y AFP',
    ['Superintendencia de Banca, Seguros y AFP (SBS)'],
    'regulator',
    ['Peru'],
    'national',
    'https://www.sbs.gob.pe/'
  ),
  source(
    'co-sfc',
    'Superintendencia Financiera de Colombia',
    ['Superintendencia Financiera de Colombia (SFC)'],
    'regulator',
    ['Colombia'],
    'national',
    'https://www.superfinanciera.gov.co/'
  ),
  source(
    'intl-swift',
    'SWIFT',
    ['SWIFT'],
    'industry_consortium',
    [],
    'international',
    'https://www.swift.com/about-us'
  ),
  source(
    'ch-ncsc',
    'Swiss National Cyber Security Centre',
    ['Swiss NCSC'],
    'government_agency',
    ['Switzerland'],
    'national',
    'https://www.ncsc.admin.ch/ncsc/en/home.html'
  ),
  source(
    'nl-trustcb-nscib',
    'TrustCB, National Scheme Authority for NSCIB',
    ['TrustCB (National Scheme Authority for NSCIB)'],
    'certification_scheme',
    ['Netherlands'],
    'national',
    'https://trustcb.com/common-criteria/nscib/'
  ),
  source(
    'us-tsa',
    'US Transportation Security Administration',
    ['TSA'],
    'regulator',
    ['United States'],
    'national',
    'https://www.tsa.gov/about'
  ),
  source(
    'tr-tse',
    'Turkish Standards Institution (TSE)',
    ['Turk Standardlari Enstitusu (TSE)'],
    'certification_scheme',
    ['Turkey'],
    'national',
    'https://www.tse.org.tr/ortak-kriter-belgelendirme-hizmetleri/'
  ),
  source(
    'uk-ico',
    'UK Information Commissioner’s Office',
    ["UK Information Commissioner's Office"],
    'regulator',
    ['United Kingdom'],
    'national',
    'https://ico.org.uk/about-the-ico/'
  ),
  source(
    'intl-unece',
    'United Nations Economic Commission for Europe',
    ['UNECE'],
    'international_arrangement',
    [],
    'international',
    'https://unece.org/about-unece'
  ),
  source(
    'uy-urcdp-agesic',
    'Uruguay URCDP and AGESIC',
    ['URCDP; AGESIC'],
    'regulator',
    ['Uruguay'],
    'national',
    'https://www.gub.uy/unidad-reguladora-control-datos-personales/'
  ),
  source(
    'us-education',
    'US Department of Education',
    ['US Dept of Education'],
    'government_agency',
    ['United States'],
    'national',
    'https://www.ed.gov/about/ed-overview'
  ),
  source(
    'eu-vda-enx',
    'VDA and ENX Association',
    ['VDA/ENX'],
    'industry_consortium',
    [],
    'regional',
    'https://enx.com/en-US/enxassociation/'
  ),
  source(
    'us-white-house-nsc-cisa',
    'White House NSC and CISA',
    ['White House / NSC, operationalized via CISA as National Coordinator'],
    'government_agency',
    ['United States'],
    'national',
    'https://bidenwhitehouse.archives.gov/briefing-room/presidential-actions/2024/04/30/national-security-memorandum-on-critical-infrastructure-security-and-resilience/'
  ),
  source(
    'us-white-house-nsc',
    'White House National Security Council',
    ['White House/NSC'],
    'government_agency',
    ['United States'],
    'national',
    'https://bidenwhitehouse.archives.gov/nsc/'
  ),
]
