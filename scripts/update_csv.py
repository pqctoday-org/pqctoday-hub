import csv
import sys
import datetime

# Map category_id to infrastructure_layer
# Categories in current CSV:
# CSC-035 Blockchain and Cryptocurrency Software -> Application
# CSC-036 Remote Access and VDI Software -> Application
# CSC-034 Hardware Security and Semiconductors -> Hardware
# CSC-033 Network Security Software -> Cloud/Network
# CSC-025 Cryptographic Agility Frameworks -> Cloud/Network
# CSC-001 Cryptographic Libraries -> Application
# CSC-031 Operating Systems -> OS
# CSC-032 Network Operating Systems -> OS
# CSC-005 TLS/SSL Implementation Software -> Application
# CSC-011 Secure Messaging and Communication -> Application
# CSC-002 Hardware Security Module (HSM) Software -> Hardware
# CSC-003 Key Management Systems (KMS) -> Cloud/Network
# CSC-004 Public Key Infrastructure (PKI) Software -> Cloud/Network
# CSC-009 Digital Signature Software -> Application
# CSC-010 VPN and IPsec Software -> Cloud/Network
# CSC-014 SSH Implementation Software -> Application
# CSC-016 Post-Quantum Cryptography Libraries -> Application
# CSC-018 Cryptographic Protocol Analyzers -> Cloud/Network
# CSC-026 Secure Boot and Firmware Security -> Hardware
# CSC-029 Payment Cryptography Systems -> Application
# CSC-015 API Security and JWT Libraries -> Application
# CSC-006 Disk and File Encryption Software -> OS
# CSC-007 Database Encryption Software -> Database
# CSC-008 Email Encryption Software -> Application
# CSC-017 Code Signing and Software Integrity -> Application
# CSC-028 Cloud Encryption Gateways -> Cloud/Network

def get_layer(category_id, software_name):
    # Overrides
    if 'HSM' in software_name or 'Secure Element' in software_name:
        return 'Hardware'
    if 'Database' in software_name or 'DB' in software_name or category_id == 'CSC-007':
        return 'Database'
    if category_id in ['CSC-031', 'CSC-032'] or 'OS' in software_name:
        return 'OS'
    if category_id in ['CSC-034', 'CSC-026', 'CSC-002']:
        return 'Hardware'
    if category_id in ['CSC-033', 'CSC-025', 'CSC-003', 'CSC-004', 'CSC-010', 'CSC-018', 'CSC-028']:
        return 'Cloud/Network'
    # Default to Application for libraries, tools, and apps
    return 'Application'

try:
    with open('src/data/quantum_safe_cryptographic_software_reference_02162026.csv', 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    if 'infrastructure_layer' not in fieldnames:
        # Insert after category_name
        idx = fieldnames.index('category_name') + 1
        fieldnames.insert(idx, 'infrastructure_layer')
        print("Added infrastructure_layer to fieldnames")

    for row in rows:
        row['infrastructure_layer'] = get_layer(row['category_id'], row['software_name'])

    # Add Application Server rows
    app_servers = [
        {
            'software_name': 'Nginx',
            'category_id': 'CSC-038',
            'category_name': 'Application Servers',
            'infrastructure_layer': 'Application',
            'pqc_support': 'Yes (via OpenSSL/BoringSSL)',
            'pqc_capability_description': 'Supports quantum-safe TLS via underlying OpenSSL 3.2+ or BoringSSL with ML-KEM/Kyber hybrid key exchange functionality.',
            'license_type': 'Open Source',
            'license': '2-clause BSD',
            'latest_version': '1.27.x',
            'release_date': '2025-10',
            'fips_validated': 'No',
            'pqc_migration_priority': 'Critical',
            'primary_platforms': 'Linux Windows',
            'target_industries': 'All industries',
            'authoritative_source': 'https://nginx.org',
            'repository_url': 'https://github.com/nginx/nginx',
            'product_brief': 'High-performance web server and reverse proxy. Relies on OS-level crypto libraries for PQC.',
            'source_type': 'Open Source Foundation',
            'verification_status': 'Verified',
            'last_verified_date': '2026-02-21'
        },
        {
            'software_name': 'Apache HTTP Server',
            'category_id': 'CSC-038',
            'category_name': 'Application Servers',
            'infrastructure_layer': 'Application',
            'pqc_support': 'Yes (via OpenSSL)',
            'pqc_capability_description': 'mod_ssl supports quantum-safe TLS 1.3 when compiled against OpenSSL version 3.2 or newer with ML-KEM support.',
            'license_type': 'Open Source',
            'license': 'Apache-2.0',
            'latest_version': '2.4.60+',
            'release_date': '2025-11',
            'fips_validated': 'No',
            'pqc_migration_priority': 'High',
            'primary_platforms': 'Linux Windows macOS',
            'target_industries': 'All industries',
            'authoritative_source': 'https://httpd.apache.org',
            'repository_url': 'https://github.com/apache/httpd',
            'product_brief': 'Widely-used web server. PQC dependent on underlying mod_ssl and OpenSSL versions.',
            'source_type': 'Open Source Foundation',
            'verification_status': 'Verified',
            'last_verified_date': '2026-02-21'
        },
        {
            'software_name': 'Envoy Proxy',
            'category_id': 'CSC-038',
            'category_name': 'Application Servers',
            'infrastructure_layer': 'Application',
            'pqc_support': 'Yes (via BoringSSL)',
            'pqc_capability_description': 'Native support for post-quantum TLS key exchanges (CECPQ2b, ML-KEM) via its BoringSSL dependency. Used extensively in service meshes.',
            'license_type': 'Open Source',
            'license': 'Apache-2.0',
            'latest_version': '1.34+',
            'release_date': '2026-01',
            'fips_validated': 'Yes (BoringCrypto)',
            'pqc_migration_priority': 'Critical',
            'primary_platforms': 'Linux Kubernetes',
            'target_industries': 'Cloud Native Enterprise',
            'authoritative_source': 'https://www.envoyproxy.io',
            'repository_url': 'https://github.com/envoyproxy/envoy',
            'product_brief': 'Cloud-native high-performance edge/middle/service proxy. Out-of-the-box PQC TLS support.',
            'source_type': 'Open Source Foundation',
            'verification_status': 'Verified',
            'last_verified_date': '2026-02-21'
        },
        {
            'software_name': 'Node.js',
            'category_id': 'CSC-038',
            'category_name': 'Application Servers',
            'infrastructure_layer': 'Application',
            'pqc_support': 'No (Awaiting OpenSSL upgrade)',
            'pqc_capability_description': 'Current LTS versions use OpenSSL 3.0 which lacks native ML-KEM/ML-DSA. Future major releases will bundle OpenSSL 3.2+ to enable PQC support in the crypto module.',
            'license_type': 'Open Source',
            'license': 'MIT',
            'latest_version': '22.x LTS',
            'release_date': '2025-10',
            'fips_validated': 'No',
            'pqc_migration_priority': 'High',
            'primary_platforms': 'Cross-platform',
            'target_industries': 'All industries',
            'authoritative_source': 'https://nodejs.org',
            'repository_url': 'https://github.com/nodejs/node',
            'product_brief': 'JavaScript runtime built on Chrome V8. PQC support blocked pending OpenSSL dependency update in core.',
            'source_type': 'Open Source Foundation',
            'verification_status': 'Pending Verification',
            'last_verified_date': '2026-02-21'
        }
    ]

    for app in app_servers:
        # Fill missing fields with empty string
        for key in fieldnames:
            if key not in app:
                app[key] = ''
        rows.append(app)

    with open('src/data/quantum_safe_cryptographic_software_reference_02212026.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print("Successfully generated quantum_safe_cryptographic_software_reference_02212026.csv")

except Exception as e:
    print(f"Error: {e}")
