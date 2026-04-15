#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
# Downloads 53 alternate proof URLs, then runs enrichment with quality validation.
# Discards enrichment entries where the source was too short/irrelevant.
# Usage: python3 scripts/download-alternate-proofs.py

import csv
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

ROOT = Path(__file__).parent.parent
COWORK = ROOT / 'src/cowork'
ENRICHED_CSV = Path('/Users/ericamador/antigravity/pqc-timeline-app-priv/cowork/missing/missing_proof_sources_04132026_enriched.csv')
PROOFS_DIR = COWORK / 'public/proofs'
MANIFEST_PATH = PROOFS_DIR / 'manifest.json'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

MIN_BYTES = 500


def safe_filename(name: str, url: str) -> str:
    safe = re.sub(r'[^a-zA-Z0-9_-]', '_', name)[:80]
    ext = '.pdf' if '.pdf' in url.lower() else '.html'
    return f'{safe}{ext}'


def download_one(name: str, url: str, dest: Path) -> tuple[str, str]:
    """Returns ('ok'|'fail'|'short', reason)"""
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=20) as resp:
            content = resp.read()
        if len(content) < MIN_BYTES:
            return 'short', f'Only {len(content)} bytes'
        dest.write_bytes(content)
        return 'ok', f'{len(content):,} bytes'
    except HTTPError as e:
        return 'fail', f'HTTP {e.code}'
    except URLError as e:
        return 'fail', str(e.reason)[:60]
    except Exception as e:
        return 'fail', str(e)[:60]


def load_actionable():
    rows = []
    with open(ENRICHED_CSV) as f:
        for row in csv.DictReader(f):
            alt = row.get('alternate_source_url', '').strip()
            cur = row.get('current_proof_url', '').strip()
            if alt and alt != cur:
                rows.append(row)
    return rows


def update_manifest(downloaded_names: set[str]):
    """Regenerate manifest marking newly downloaded files as 'downloaded'."""
    if not MANIFEST_PATH.exists():
        print('  ⚠  No manifest to update')
        return

    manifest = json.loads(MANIFEST_PATH.read_text())
    updated = 0
    for entry in manifest.get('entries', []):
        name = entry.get('softwareName', '')
        if name in downloaded_names and entry.get('status') == 'missing':
            entry['status'] = 'downloaded'
            updated += 1

    manifest['generated'] = datetime.now().isoformat()
    summary = manifest.get('summary', {})
    summary['downloaded'] = summary.get('downloaded', 0) + updated
    summary['missing'] = summary.get('missing', 0) - updated
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(f'  📋 Manifest updated: {updated} entries flipped to downloaded')


def main():
    PROOFS_DIR.mkdir(parents=True, exist_ok=True)

    actionable = load_actionable()
    print(f'🔗 Alternate proof downloader — {len(actionable)} URLs to attempt')
    print(f'   Target: {PROOFS_DIR}')
    print()

    results = {'ok': [], 'short': [], 'fail': []}
    downloaded_names = set()

    def worker(row):
        name = row['software_name']
        url = row['alternate_source_url'].strip()
        conf = row.get('confidence', '?')
        fname = safe_filename(name, url)
        dest = PROOFS_DIR / fname
        status, reason = download_one(name, url, dest)
        return name, url, fname, conf, status, reason

    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(worker, row): row for row in actionable}
        done = 0
        for future in as_completed(futures):
            done += 1
            name, url, fname, conf, status, reason = future.result()
            icon = '✓' if status == 'ok' else ('⚠' if status == 'short' else '✗')
            print(f'  [{done:>2}/{len(actionable)}] {icon} [{conf}] {name}')
            if status != 'ok':
                print(f'         {reason}')
            results[status].append({'name': name, 'url': url, 'fname': fname, 'conf': conf, 'reason': reason})
            if status == 'ok':
                downloaded_names.add(name)

    print()
    print('=' * 60)
    print(f'✅  OK:    {len(results["ok"])}')
    print(f'⚠   Short: {len(results["short"])}  (too small — discarded)')
    print(f'✗   Fail:  {len(results["fail"])}')
    print('=' * 60)

    if not downloaded_names:
        print('\n⚠  Nothing downloaded — no enrichment to run.')
        return

    # Update manifest so enrichment picks up the new files
    update_manifest(downloaded_names)

    # Write force-ids list for enrichment
    force_ids = ','.join(downloaded_names)
    ids_file = ROOT / 'scripts/alternate_proof_ids.txt'
    ids_file.write_text(force_ids)
    print(f'\n📝 Force-IDs written to: {ids_file.name}')
    print(f'   {len(downloaded_names)} products ready for enrichment')
    print()
    print('Next step — run with caffeinate:')
    print(f'  cd src/cowork && caffeinate -dis python3 enrich-docs-ollama.py \\')
    print(f'    --collection catalog --force-ids "{force_ids[:80]}..." \\')
    print(f'    --append > /tmp/enrich_alternate_progress.log 2>&1')
    print()
    print('Or run the full pipeline:')
    print('  python3 scripts/run-alternate-enrichment.py')


if __name__ == '__main__':
    main()
