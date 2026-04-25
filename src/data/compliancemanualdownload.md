# Compliance Framework — Manual Download Guide

**Generated**: 2026-04-23
**Purpose**: Lists all compliance-framework primary-source documents that could
not be downloaded by the automated pipeline (`npm run download:library`).
Each entry includes the proposed `reference_id`, the authoritative URL (open
in a browser), and the target filename to save under `public/library/`.

After a manual download, update the framework's row in the latest
`library_*.csv` by setting `local_file=public/library/<filename>` and
`downloadable=yes`. Then re-run `npm run build` + the relevant enrichment
script to pick up the new source.

---

## Group 1 — EUR-Lex anti-bot blocked (7)

EUR-Lex returns `HTTP 202` with an empty body to any non-browser client
(including `curl`, `urllib`, `WebFetch`). The PDFs are fully public in a
browser.

| Framework        | Proposed `reference_id`    | Manual URL (open in browser)                                             | Save as `public/library/`      |
| ---------------- | -------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| NIS2             | `NIS2-DIRECTIVE-2022-2555` | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022L2555 | `NIS2-DIRECTIVE-2022-2555.pdf` |
| DORA             | `DORA-REG-2022-2554`       | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022R2554 | `DORA-REG-2022-2554.pdf`       |
| GDPR             | `GDPR-REG-2016-679`        | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679 | `GDPR-REG-2016-679.pdf`        |
| EIDAS            | `EIDAS-REG-910-2014`       | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32014R0910 | `EIDAS-REG-910-2014.pdf`       |
| EU-CRA           | `EU-CRA-REG-2024-2847`     | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R2847 | `EU-CRA-REG-2024-2847.pdf`     |
| MICA             | `MICA-REG-2023-1114`       | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32023R1114 | `MICA-REG-2023-1114.pdf`       |
| EU-REC-2024-1101 | `EU-REC-2024-1101-PDF`     | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024H1101 | `EU-REC-2024-1101.pdf`         |

**Tip**: EUR-Lex PDF button may say "Download PDF" or may render HTML first — use the download icon in the EUR-Lex viewer toolbar.

---

## Group 2 — US eCFR anti-scraping block (4)

The `ecfr.gov` site served a 10 KB "Request Access — programmatic access limited" HTML stub in place of the actual regulation text. The page is visible in a browser; you can also use the "Print/Download" → PDF path on each eCFR page.

| Framework   | Proposed `reference_id` | Manual URL (open in browser)                                                                  | Save as                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- | ---------------------- |
| HIPAA       | `HIPAA-45-CFR-164`      | https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164 → click _Download PDF_ | `HIPAA-45-CFR-164.pdf` |
| FERPA       | `FERPA-34-CFR-99`       | https://www.ecfr.gov/current/title-34/subtitle-A/part-99 → click _Download PDF_               | `FERPA-34-CFR-99.pdf`  |
| COPPA       | `COPPA-16-CFR-312`      | https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312 → click _Download PDF_  | `COPPA-16-CFR-312.pdf` |
| FDA-21CFR11 | `FDA-21-CFR-11`         | https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11 → click _Download PDF_   | `FDA-21-CFR-11.pdf`    |

**Alternative**: all four are also published at `govinfo.gov` as historical CFR annual snapshots (less current than eCFR). Or use NIST guidance docs that cite them (e.g. `NIST SP 800-66` for HIPAA is already in the library).

**Remediation note**: when you re-download these as real PDFs, _replace_ the existing `.html` files in `public/library/` (HIPAA-45-CFR-164.html, FERPA-34-CFR-99.html, COPPA-16-CFR-312.html, FDA-21-CFR-11.html) with the new `.pdf` files and update the `local_file` column in the library CSV.

---

## Group 3 — Site returned HTML instead of PDF (2)

The URL responded 200 OK, but the body was HTML — a maintenance page (MAS) or a 404 styled as HTML (NERC). Currently saved with a `.pdf` extension in `public/library/` but the content is HTML — these should be **replaced or removed**.

| Framework    | Saved as (wrong)                                                         | Issue                                              | Manual URL / alternative                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NERC-CIP     | `public/library/NERC-CIP-REQS.pdf` (56 KB HTML)                          | The `RSCompleteSet.pdf` URL no longer serves a PDF | Try https://www.nerc.com/pa/Stand/Reliability%20Standards/AllReliabilityStandards.aspx (browse per-standard), or download individual CIP-002 through CIP-014 PDFs; save as `NERC-CIP-ALL.pdf`                         |
| MAS-CIRCULAR | `public/library/MAS-CIRCULAR-IT-RISK.pdf` (833 KB HTML maintenance page) | mas.gov.sg served a "Maintenance" page             | Retry the original URL in a browser after a few hours: https://www.mas.gov.sg/-/media/MAS/Regulations-and-Financial-Stability/Regulatory-and-Supervisory-Framework/Risk-Management/TRM-Guidelines-18-January-2021.pdf |

---

## Group 4 — URL verification failed (9)

These URLs returned 403, 404, or timeouts. Each needs a working authoritative replacement URL before backfill is possible.

| Framework     | Proposed `reference_id`  | Failed URL                                                                                        | Status        | Suggested alternative to verify                                                                                                              |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PCI-DSS       | `PCI-DSS-4.0`            | https://listings.pcisecuritystandards.org/documents/PCI-DSS-v4_0.pdf                              | 403 Forbidden | PCI SSC document library requires site registration; the full spec is paywall-gated even after registration. See PCI SSC Document Library.   |
| SWIFT-CSP     | `SWIFT-CSP-CSCF`         | https://www.swift.com/myswift/customer-security-programme-csp/security-controls                   | timeout       | Requires SWIFT member login; try https://www.swift.com/our-solutions/compliance-and-shared-services/customer-security-programme-csp          |
| DISA-STIG     | `DISA-STIG-APP-SEC`      | https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_ASD_V5R3_SRG.zip                          | 404 Not Found | Try https://public.cyber.mil/stigs/downloads/ and pick _Application Security and Development STIG_                                           |
| UN-ECE-WP29   | `UNECE-WP29-R155`        | https://unece.org/sites/default/files/2021-03/R155e.pdf                                           | 403 Forbidden | https://unece.org/transport/documents/2021/03/standards/un-regulation-no-155-cyber-security-and-cyber-security (find R155 PDF from doc list) |
| TSA-PIPELINE  | `TSA-PIPELINE-SD-02C`    | https://www.tsa.gov/sites/default/files/sd-pipeline-2021-02c.pdf                                  | 404 Not Found | https://www.tsa.gov/for-industry/pipelines (latest SD 02-D was superseded; find current)                                                     |
| NZISM         | `NZISM-V3-7`             | https://nzism.gcsb.govt.nz/api/documents/NZISM-v3.7-Dec23.pdf                                     | 403 Forbidden | https://nzism.gcsb.govt.nz/ (browse-only; may require browser)                                                                               |
| CMMC          | `CMMC-2.0-MODEL`         | https://dodcio.defense.gov/Portals/0/Documents/CMMC/ModelOverview_V2.0_FINAL_20211202_508.pdf     | 403 Forbidden | https://dodcio.defense.gov/CMMC/Documentation/ (find current model overview PDF)                                                             |
| HKMA-PQC      | `HKMA-PQC-Circular-2024` | https://www.hkma.gov.hk/media/eng/doc/key-information/guidelines-and-circular/2024/20241126e1.pdf | 404 Not Found | https://www.hkma.gov.hk/eng/news-and-media/press-releases/ (search "quantum")                                                                |
| DFS-NYCRR-500 | `NY-DFS-NYCRR-500`       | https://www.dfs.ny.gov/system/files/documents/2023/11/rf_fs_23NYCRR500_amend2_text_20231101.pdf   | 404 Not Found | https://www.dfs.ny.gov/industry_guidance/cybersecurity (find current 23 NYCRR 500 text)                                                      |
| NG-NDPR       | `NG-NDPR-TEXT`           | http://ndpr.org.ng/wp-content/uploads/2023/06/NDPA.pdf                                            | DNS failure   | https://ndpc.gov.ng/ (NDPC replaced NDPR; NDPA 2023 is the new law)                                                                          |

---

## Group 5 — Known paywalled (4)

Out of scope for automated pipeline. Optional manual purchase / licensing:

| Framework | Proposed `reference_id` | Source     | Notes                                                                     |
| --------- | ----------------------- | ---------- | ------------------------------------------------------------------------- |
| PCI-DSS   | `PCI-DSS-4.0`           | PCI SSC    | Member or individual registration required. Also listed in Group 4 above. |
| SOC-2     | `SOC2-AICPA`            | AICPA      | Commercial publication.                                                   |
| ISO-27001 | `ISO-IEC-27001-2022`    | ISO        | ~CHF 124.                                                                 |
| TISAX     | (various)               | ENX Portal | Member login required.                                                    |

---

## Group 6 — Paywall / no-URL (3)

National PQC strategies whose primary-source document URLs could not be identified:

| Framework       | Suggested search starting point |
| --------------- | ------------------------------- |
| TAIWAN-MODA-PQC | https://moda.gov.tw/en/         |
| ITALY-ACN-PQC   | https://www.acn.gov.it/         |
| SPAIN-CCN-PQC   | https://www.ccn.cni.es/         |

---

## Group 7 — Restricted / Member-only (5)

Not publicly downloadable:

| Framework    | Why                                                      |
| ------------ | -------------------------------------------------------- |
| NATO-4774    | STANAG — restricted distribution                         |
| TISAX        | ENX Portal — automotive-industry login                   |
| G7-CEG-PQC   | G7 Cyber Expert Group communiques — limited distribution |
| EUROPOL-QSFF | Europol Quantum-Safe Financial Forum — stakeholder-only  |
| FSISAC-PQC   | FS-ISAC member portal login                              |

---

## Group 8 — No URL mapping identified yet (4)

Need follow-up research to locate primary-source docs:

| Framework   | Label                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| BOI-PQC     | BOI Quantum Risk Directive (Israel Bank of Israel)                                                        |
| BIS-158-PQC | BIS Paper 158 Quantum Roadmap _(note: `BIS-Paper-158` is already in library — this one may be redundant)_ |
| EG-PDPL     | Egypt Personal Data Protection Law                                                                        |
| AU-MALABO   | African Union Malabo Convention                                                                           |

---

## Procedure to add a manually-downloaded doc

1. Save the PDF to `public/library/<filename>` using the proposed filename from the tables above.
2. Copy the latest library CSV to a new same-day revision:
   `cp src/data/library_04232026_r2.csv src/data/library_04232026_r3.csv`
3. Open the new CSV and either:
   - **Update** the existing row (if the `reference_id` is already in the CSV with an empty or wrong `local_file`) by setting `local_file=public/library/<filename>` and `downloadable=yes`, OR
   - **Add a new row** using the proposed `reference_id` from this guide, filling at least `reference_id`, `document_title`, `download_url`, `local_file=public/library/<filename>`, `downloadable=yes`, `manual_category=Compliance Frameworks`, `document_status=Active`, `change_status=New`, `region_scope`, `authors_or_organization`, `vetting_body`, `peer_reviewed=Yes`.
4. Update `scripts/enrich-compliance-fwks-ollama.py` — in the `FRAMEWORK_TO_LIBRARY` dict, map the compliance-CSV `id` (e.g. `NIS2`) to the new `reference_id` (e.g. `NIS2-DIRECTIVE-2022-2555`). Remove the corresponding entry from `KNOWN_UNREACHABLE`.
5. Run the enrichment on just the new doc:
   `python3 scripts/enrich-compliance-fwks-ollama.py --force-ids "<new-reference_id>" --verbose`
6. Verify the rows in `src/data/pqc_maturity_governance_requirements_<today>.csv`.

---

## Summary

| Group                              | Count  | Action                            |
| ---------------------------------- | ------ | --------------------------------- |
| EU regulations (EUR-Lex blocked)   | 7      | Manual browser download           |
| US eCFR anti-scraping block        | 4      | Browser _Download PDF_ button     |
| HTML-instead-of-PDF                | 2      | Find alternative URL + redownload |
| URL 403/404/timeout                | 9      | Research working URLs             |
| Paywalled                          | 4      | Optional licensing                |
| Regional/country — no URL          | 3      | Research                          |
| Restricted/member-only             | 5      | Out of scope                      |
| No URL mapping                     | 4      | Research                          |
| **Total manual-action frameworks** | **38** |                                   |
