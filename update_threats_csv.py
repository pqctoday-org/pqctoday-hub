import csv

input_path = '/Users/ericamador/antigravity/pqc-timeline-app/src/data/quantum_threats_hsm_industries_12152025.csv'
output_path = '/Users/ericamador/antigravity/pqc-timeline-app/src/data/quantum_threats_hsm_industries_01062026.csv'

# Mapping of threat types to accuracy percentages
# HNDL = 100%
# Aggressive Forgery = 15%
# Standard Forgery = 5%
# Infrastructure/Mid-term = 50%

url_repairs = {
    'AERO-001': 'https://researchgate.net/publication/380720546_Post-Quantum_Cryptography_for_Safety-Critical_Avionics_Systems',
    'AERO-002': 'https://www.icao.int/Meetings/a41/Documents/WP/wp_091_en.pdf',
    'AERO-003': 'https://www.easa.europa.eu/sites/default/files/dfu/Opinion%20No%2003-2021.pdf',
    'AERO-007': 'https://www.airbus.com/en/newsroom/press-releases/2023/12/airbus-leads-consortium-to-deploy-quantum-communication-infrastructure-euroqci',
    'THREAT-FIN-127': 'https://www.fsisac.com/hubfs/Knowledge/PQC/PreparingForAPostQuantumWorldByManagingCryptographicRisk.pdf',
    'THREAT-HC-126': 'https://cpl.thalesgroup.com/resources/healthcare-data-threat-report',
    'THREAT-CI-126': 'https://www.utoronto.ca/news/u-t-researchers-lead-quantum-security-project-protect-power-grids',
    'GOV-001': 'https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF',
    'FIN-009': 'https://www.bis.org/publ/bisbull88.htm', # Leap is well covered in Paper 88 too
    'TELCO-006': 'https://www.gsma.com/security/post-quantum-telco-network-taskforce/', # Better deep link
    'IT-006': 'https://www.openssl.org/blog/blog/2024/04/16/pqc-update/', # Specific OpenSSL PQC post
}

def get_accuracy(desc, crit):
    desc_l = desc.lower()
    if 'hndl' in desc_l or 'harvest' in desc_l:
        return 100
    if crit == 'Critical':
        if 'forgery' in desc_l or 'compromise' in desc_l:
            return 15
        return 50
    if crit == 'High':
        if 'forgery' in desc_l or 'compromise' in desc_l:
            return 10
        return 30
    return 5

with open(input_path, mode='r', encoding='utf-8') as f_in:
    reader = csv.DictReader(f_in)
    fieldnames = reader.fieldnames + ['accuracy_pct']
    
    with open(output_path, mode='w', encoding='utf-8', newline='') as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in reader:
            tid = row['threat_id']
            # Repair URL if mapping exists
            if tid in url_repairs:
                row['source_url'] = url_repairs[tid]
            
            # Calculate accuracy
            row['accuracy_pct'] = get_accuracy(row['threat_description'], row['criticality'])
            
            writer.writerow(row)

print(f"Successfully generated {output_path}")
