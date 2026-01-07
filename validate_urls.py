import csv
import urllib.request
import urllib.error
import ssl
import sys

# Disable SSL certificate verification for checking
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

csv_path = '/Users/ericamador/antigravity/pqc-timeline-app/src/data/quantum_threats_hsm_industries_12152025.csv'

def check_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            final_url = response.geturl()
            status = response.getcode()
            content = response.read(2048).decode('utf-8', errors='ignore').lower()
            
            is_generic = False
            # If the URL is just a domain or doesn't contain specific slugs, it might be generic
            if url.count('/') <= 3:
                is_generic = True
            
            is_paywall = False
            paywall_keywords = ['subscribe', 'login to read', 'paywall', 'sign in']
            for kw in paywall_keywords:
                if kw in content:
                    is_paywall = True
                    break
            
            return {
                'status': status,
                'final_url': final_url,
                'is_redirect': url != final_url,
                'is_generic': is_generic,
                'is_paywall': is_paywall,
                'error': None
            }
    except Exception as e:
        return {'error': str(e)}

results = []
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        url = row['source_url'].strip()
        tid = row['threat_id']
        print(f"Checking {tid}: {url}")
        res = check_url(url)
        results.append({'threat_id': tid, 'url': url, 'validation': res})

for r in results:
    tid = r['threat_id']
    v = r['validation']
    if 'error' in v and v['error']:
         print(f"{tid}: ERROR - {v['error']}")
    else:
         status_str = "OK" if v['status'] == 200 else f"STATUS {v['status']}"
         labels = []
         if v['is_redirect']: labels.append("REDIRECT")
         if v['is_generic']: labels.append("GENERIC")
         if v['is_paywall']: labels.append("PAYWALL?")
         print(f"{tid}: {status_str} {' '.join(labels)} -> {v['final_url']}")
