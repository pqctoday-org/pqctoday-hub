#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""
CC Security Target PQC Extraction — qwen3:14b
Extracts vendor, product name, PQC capabilities, product brief, and category
from Common Criteria security target PDFs in public/cc/.

Usage:
    python3 scripts/extract-cc-pqc-ollama.py
    python3 scripts/extract-cc-pqc-ollama.py --rerun        # reprocess all, overwrite existing
    python3 scripts/extract-cc-pqc-ollama.py --pdf path/to/file.pdf  # single file
"""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

# ── Configuration ────────────────────────────────────────────────────────────

DEFAULT_MODEL = "qwen3:14b"
OLLAMA_URL = "http://localhost:11434/api/generate"

CC_PDF_DIR = Path("public/cc")
COMPLIANCE_JSON = Path("public/data/compliance-data.json")
OUTPUT_DIR = Path("src/data/cc-extractions")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Max chars per excerpt window around crypto sections
WINDOW_CHARS = 3000
# Max chars for the header (cover page + TOC)
HEADER_CHARS = 3000
# Max total chars sent to model — qwen3:14b has 128K context, 40K gives good coverage
MAX_TOTAL_CHARS = 40000

# ── PQC Algorithm Categories ─────────────────────────────────────────────────

PRODUCT_CATEGORIES = [
    "Hardware Security Module (HSM)",
    "Smart Card / Secure Element",
    "TPM / Trusted Platform Module",
    "Cryptographic Library",
    "Network Encryptor",
    "Operating System",
    "Application Server",
    "Smart Meter",
    "SIM / eSIM",
    "IP Core / FPGA",
    "Database",
    "Other",
]

# ── Extraction Prompt ─────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a security certification expert. Extract structured information from Common Criteria security target documents. Be precise and factual — only report what is explicitly stated in the document. Do not infer or guess."""

def build_prompt(text: str) -> str:
    return f"""Extract the following fields from this Common Criteria security target document.

Return ONLY valid JSON, no markdown, no explanation.

Fields to extract:
- vendor: Legal company name of the product developer (e.g. "Thales DIS France SA")
- product_name: Exact product name and version as stated on the cover page
- pqc_algorithms: List of post-quantum cryptographic algorithms implemented. Use NIST standard names only:
  ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS, HSS, SPHINCS+, Falcon.
  Also accept: Kyber (map to ML-KEM), Dilithium (map to ML-DSA), CRYSTALS-Kyber, CRYSTALS-Dilithium.
  Return empty list [] if no PQC algorithms are present.
  IMPORTANT: "DLMS" is a metering protocol, NOT the LMS signature scheme. Do not include it.
  IMPORTANT: "realms" is not LMS. Only include explicit cryptographic algorithm references.
- pqc_standard_refs: List of NIST standard references if mentioned (e.g. ["FIPS 203", "FIPS 204", "SP 800-208"])
- product_brief: 1-2 sentence description of what the product is and does
- product_category: One of: {", ".join(f'"{c}"' for c in PRODUCT_CATEGORIES)}
- assurance_level: EAL level (e.g. "EAL5+" or "EAL4+,ALC_FLR.3") or null if not found
- classical_algorithms: Key classical crypto algorithms mentioned (e.g. ["RSA-2048", "ECDSA P-256", "AES-256"])

Document text:
---
{text}
---

JSON output:"""


# ── Ollama Client ─────────────────────────────────────────────────────────────

def call_ollama(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """Call Ollama API and return the response text."""
    import urllib.request

    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 2048,
        },
    }).encode()

    req = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        result = json.loads(resp.read())
    return result.get("response", "")


def parse_json_response(raw: str) -> dict:
    """Extract and parse JSON from model response."""
    # Strip <think>...</think> blocks (qwen3 chain-of-thought)
    raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()

    # Try direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Extract JSON block
    match = re.search(r"\{[\s\S]+\}", raw)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return {}


# ── PDF Text Extraction ───────────────────────────────────────────────────────

# Specific PQC algorithm names — windows around these are always captured
ALGO_KEYWORDS = re.compile(
    r"\b(ML-KEM|ML-DSA|SLH-DSA|LMS|XMSS|HSS|SPHINCS\+|Falcon|"
    r"Kyber|Dilithium|CRYSTALS|FIPS\s+20[3-5]|SP\s+800-208)\b",
    re.IGNORECASE,
)

# Section headings — used to find the broader crypto chapter
SECTION_KEYWORDS = re.compile(
    r"\b(cryptographic\s+(function|algorithm|mechanism|service)|"
    r"algorithm\s+(specification|list|support|implemented)|"
    r"post.quantum|hash.based\s+signature)\b",
    re.IGNORECASE,
)


def extract_pdf_text(pdf_path: Path) -> str:
    """Extract text from PDF: cover page + windows around actual PQC algorithm mentions."""
    result = subprocess.run(
        ["pdftotext", str(pdf_path), "-"],
        capture_output=True,
        timeout=60,
    )
    full_text = result.stdout.decode("utf-8", errors="replace")

    if not full_text:
        return ""

    # Always include the document header (cover page info)
    header = full_text[:HEADER_CHARS]

    # Priority 1: windows around specific algorithm names (most relevant)
    algo_positions = [m.start() for m in ALGO_KEYWORDS.finditer(full_text)]

    # Priority 2: windows around section headings (broader context)
    section_positions = [m.start() for m in SECTION_KEYWORDS.finditer(full_text)]

    all_positions = sorted(set(algo_positions + section_positions))

    if not all_positions:
        return header

    # Build merged windows, algo hits get priority (sort first)
    # Give algo hits larger window, section hits smaller
    raw_windows: list[tuple[int, int, int]] = []  # (start, end, priority)
    for pos in algo_positions:
        raw_windows.append((max(0, pos - 800), min(len(full_text), pos + WINDOW_CHARS), 0))
    for pos in section_positions:
        raw_windows.append((max(0, pos - 200), min(len(full_text), pos + 1500), 1))

    # Sort by start position, merge overlapping
    raw_windows.sort(key=lambda w: (w[2], w[0]))  # priority first, then position
    merged: list[tuple[int, int]] = []
    for start, end, _ in sorted(raw_windows, key=lambda w: w[0]):
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))

    # Collect excerpts up to MAX_TOTAL_CHARS
    excerpts = [header]
    total = len(header)
    for start, end in merged:
        # Skip windows fully within header
        if end <= HEADER_CHARS:
            continue
        chunk = full_text[start:end]
        if total + len(chunk) > MAX_TOTAL_CHARS:
            remaining = MAX_TOTAL_CHARS - total
            if remaining > 200:
                excerpts.append(chunk[:remaining])
            break
        excerpts.append(chunk)
        total += len(chunk)

    return "\n\n[...]\n\n".join(excerpts)


# ── Per-PDF Processing ────────────────────────────────────────────────────────

def process_pdf(pdf_path: Path, model: str, rerun: bool) -> dict | None:
    """Extract PQC info from a single security target PDF."""
    out_file = OUTPUT_DIR / f"{pdf_path.stem}.json"

    if out_file.exists() and not rerun:
        print(f"  SKIP (cached): {pdf_path.name}")
        return json.loads(out_file.read_text())

    text = extract_pdf_text(pdf_path)
    if len(text) < 200:
        print(f"  SKIP (no text): {pdf_path.name}")
        return None

    print(f"  Processing: {pdf_path.name} ({len(text)} chars) ...", end=" ", flush=True)

    prompt = build_prompt(text)
    try:
        raw = call_ollama(prompt, model)
        extracted = parse_json_response(raw)
    except Exception as e:
        print(f"FAIL: {e}")
        return None

    if not extracted:
        print(f"FAIL (no JSON parsed) — raw: {raw[:200]!r}")
        return None

    # Normalize pqc_algorithms
    algo_map = {
        "kyber": "ML-KEM",
        "crystals-kyber": "ML-KEM",
        "dilithium": "ML-DSA",
        "crystals-dilithium": "ML-DSA",
    }
    raw_algos = extracted.get("pqc_algorithms", [])
    normalized = []
    for a in raw_algos:
        low = a.lower().strip()
        normalized.append(algo_map.get(low, a))
    extracted["pqc_algorithms"] = list(dict.fromkeys(normalized))  # deduplicate, preserve order

    # Attach source metadata
    extracted["_source_pdf"] = pdf_path.name

    out_file.write_text(json.dumps(extracted, indent=2, ensure_ascii=False))
    algos = ", ".join(extracted["pqc_algorithms"]) or "none"
    print(f"OK — pqc=[{algos}]")
    return extracted


# ── Summary Report ────────────────────────────────────────────────────────────

def print_summary(results: list[dict]) -> None:
    print("\n" + "=" * 90)
    print(f"{'PDF / Product':<55} {'PQC Algorithms':<30} {'Category'}")
    print("-" * 90)
    for r in sorted(results, key=lambda x: x.get("product_name", "")):
        name = r.get("product_name", r.get("_source_pdf", "?"))[:54]
        algos = ", ".join(r.get("pqc_algorithms", [])) or "—"
        cat = r.get("product_category", "?")[:25]
        print(f"{name:<55} {algos:<30} {cat}")

    with_pqc = [r for r in results if r.get("pqc_algorithms")]
    print(f"\nTotal: {len(results)} | With PQC: {len(with_pqc)} | No PQC: {len(results) - len(with_pqc)}")


def cross_check_compliance_json(results: list[dict]) -> None:
    """Compare extraction results vs what compliance-data.json currently records."""
    if not COMPLIANCE_JSON.exists():
        return

    with open(COMPLIANCE_JSON) as f:
        compliance = json.load(f)

    cc_pqc = {
        r["productName"]: r["pqcCoverage"]
        for r in compliance
        if r.get("source") == "Common Criteria"
        and r.get("pqcCoverage")
        and r["pqcCoverage"] not in ("", "No PQC Mechanisms Detected")
    }

    print("\n── Cross-check vs compliance-data.json ──")
    print(f"{'Product':<55} {'compliance-data.json':<30} {'qwen extraction'}")
    print("-" * 100)

    for r in results:
        pdf_name = r.get("_source_pdf", "")
        extracted_algos = set(r.get("pqc_algorithms", []))

        # Try to match by product name substring
        matched_key = None
        prod_name = r.get("product_name", "")
        for key in cc_pqc:
            if any(word in key for word in prod_name.split()[:3] if len(word) > 3):
                matched_key = key
                break

        if matched_key:
            recorded = cc_pqc[matched_key]
            recorded_set = set(a.strip() for a in recorded.split(","))
            status = "OK" if recorded_set == extracted_algos else "MISMATCH"
            if status == "MISMATCH":
                print(f"{prod_name[:55]:<55} {recorded:<30} {', '.join(sorted(extracted_algos)) or '—'} ← {status}")
        elif extracted_algos:
            print(f"{prod_name[:55]:<55} {'(not in compliance-data)':<30} {', '.join(sorted(extracted_algos))} ← NEW PQC")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Extract PQC info from CC security target PDFs")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Ollama model (default: {DEFAULT_MODEL})")
    parser.add_argument("--rerun", action="store_true", help="Reprocess all PDFs, overwrite cached results")
    parser.add_argument("--pdf", type=Path, help="Process a single PDF file")
    parser.add_argument("--pqc-only", action="store_true",
                        help="Only process PDFs that compliance-data.json already flags as PQC")
    args = parser.parse_args()

    # Check Ollama is running
    try:
        import urllib.request
        urllib.request.urlopen("http://localhost:11434/api/tags", timeout=5)
    except Exception:
        print("ERROR: Ollama is not running. Start with: ollama serve", file=sys.stderr)
        sys.exit(1)

    if args.pdf:
        pdfs = [args.pdf]
    elif args.pqc_only:
        # Build set of filenames from compliance-data.json PQC-flagged certs
        pqc_filenames: set[str] = set()
        if COMPLIANCE_JSON.exists():
            with open(COMPLIANCE_JSON) as f:
                compliance = json.load(f)
            for rec in compliance:
                if (rec.get("source") == "Common Criteria"
                        and rec.get("pqcCoverage")
                        and rec["pqcCoverage"] not in ("", "No PQC Mechanisms Detected")):
                    for url_list in (rec.get("securityTargetUrls") or [], rec.get("certificationReportUrls") or []):
                        for url in url_list:
                            fname = re.sub(r"[^a-zA-Z0-9]+", "-", rec["productName"])[:60].strip("-").lower()
                            pqc_filenames.add(fname)
        pdfs = [p for p in sorted(CC_PDF_DIR.glob("*.pdf"))
                if any(p.stem.startswith(fn[:20]) or fn.startswith(p.stem[:20]) for fn in pqc_filenames)
                or p.stem in pqc_filenames]
        # Fallback: use all PDFs in public/cc/ if filtering yields nothing (all were pre-selected)
        if not pdfs:
            pdfs = sorted(CC_PDF_DIR.glob("*.pdf"))
        print(f"--pqc-only: {len(pdfs)} PDFs to process")
    else:
        pdfs = sorted(CC_PDF_DIR.glob("*.pdf"))
        print(f"Found {len(pdfs)} PDFs in {CC_PDF_DIR}/")

    results = []
    for pdf in pdfs:
        result = process_pdf(pdf, args.model, args.rerun)
        if result:
            results.append(result)
        time.sleep(0.2)

    if results:
        print_summary(results)
        cross_check_compliance_json(results)

    # Write combined JSON
    combined_path = OUTPUT_DIR / "cc_pqc_extractions.json"
    combined_path.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\nWrote {combined_path} ({len(results)} records)")


if __name__ == "__main__":
    main()
