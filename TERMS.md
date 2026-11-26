# Terms of Service

**Effective Date:** October 4, 2026
**Last Updated:** November 26, 2026

## 1. Acceptance of Terms

These Terms of Service ("Terms") apply to your use of the PQC Today website at [www.pqctoday.com](https://www.pqctoday.com/) (the "Platform"). If you do not agree to these Terms, do not use the website.

The source code in the Platform's GitHub repositories is not governed by these Terms. Your rights to use, copy, modify and distribute it come from its licence (section 2), and these Terms add no conditions to it.

## 2. License

The Platform's source code is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0-only)**, with a commercial licence on request; see [COPYRIGHT.md](./COPYRIGHT.md). The full license text is available in the [LICENSE](./LICENSE) file. Nothing in these Terms restricts rights granted under the AGPL-3.0.

## 3. Educational Purpose and Cryptographic Disclaimer

The Platform is an **educational and research tool** for post-quantum cryptography (PQC). All cryptographic operations — including key generation, signing, verification, encryption, decryption, and key encapsulation — are performed **client-side in your browser** using WebAssembly (WASM) modules, the Web Crypto API and JavaScript libraries, and are intended **for educational and demonstration purposes only**.

In short: this is a demo, not a certified crypto library — never use keys it generates to protect anything real.

**Disclaimer:**

- The Platform is not certified. Keys it generates are not suitable for protecting production systems, real data, or financial transactions.
- The Platform is not a substitute for professionally audited cryptographic implementations.
- Assessment results, migration recommendations and compliance guidance are educational information, not professional legal, security, or regulatory advice.

## 4. Export Compliance and Sanctions

Encryption export controls depend on the item, its distribution and the parties and destinations involved. An open-source licence and export authorization are separate questions.

### 4.1 Classification and public availability

The Platform includes real cryptographic software. Encryption software may fall under ECCN 5D002, but an algorithm name alone does not determine the classification or whether an item is subject to the U.S. Export Administration Regulations (EAR). Source code, corresponding object code and modified distributions can require different treatment. Consult the [BIS guidance on encryption items not subject to the EAR](https://www.bis.gov/learn-support/encryption-controls/encryption-items-not-subject-to-ear).

### 4.2 Conditions and exceptions

[EAR section 742.15(b)](https://www.bis.gov/regulations/ear/742) describes the treatment of publicly available encryption source code, including applicable notification conditions. License Exception ENC has its own conditions for eligible encryption items. This notice does not assert that every Platform component or redistribution automatically qualifies for an exception or exemption.

### 4.3 Your responsibility for export and sanctions law

Users are responsible for the laws applicable to their activities. Check current item, destination, end-use and restricted-party rules with [BIS](https://www.bis.gov/) and the [OFAC sanctions programs](https://ofac.treasury.gov/sanctions-programs-and-country-information). Comprehensive US sanctions on Syria ended effective July 1, 2025; targeted restrictions can still apply. See [OFAC’s current Syria-related program information](https://ofac.treasury.gov/sanctions-programs-and-country-information/paarss). This section is a notice about the law, not a condition of the software licence.

## 5. Acceptable Use

When using the website, you agree not to:

- Use it for any unlawful purpose or in violation of any applicable laws or regulations.
- Present the website as your own creation.
- Attempt to compromise, disrupt, or interfere with its infrastructure or other users' access.
- Scrape, crawl, or harvest data from it in a manner that degrades service for other users.

PQC Today, LLC does not endorse use of the Platform to develop weapons, conduct surveillance, or violate human rights.

## 6. No Warranty

THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, OR NON-INFRINGEMENT. This is consistent with Sections 15 and 16 of the AGPL-3.0 license.

The Platform aggregates data from public sources including NIST, ETSI, IETF, BSI, ANSSI, ISO/IEC, and others. Content may be inaccurate, incomplete, or outdated. You should independently verify all information before making decisions based on it.

## 7. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE MAINTAINERS, CONTRIBUTORS, AND AFFILIATES OF PQC TODAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM.

## 8. Third-Party Content and Attribution

The Platform references and aggregates content from third-party organizations including but not limited to:

- **NIST** (National Institute of Standards and Technology)
- **ETSI** (European Telecommunications Standards Institute)
- **IETF** (Internet Engineering Task Force)
- **BSI** (Bundesamt fur Sicherheit in der Informationstechnik)
- **ANSSI** (Agence nationale de la securite des systemes d'information)
- **ISO/IEC** (International Organization for Standardization)
- **Common Criteria** (CCRA)

The Platform is not affiliated with, endorsed by, or sponsored by any of these organizations. All trademarks, service marks, and trade names are the property of their respective owners.

## 9. Intellectual Property

- The Platform's source code is licensed under AGPL-3.0-only (see COPYRIGHT.md for the third-party parts that keep their own licences).
- Original educational content, data compilations, and visualizations are copyright of the PQC Today maintainers.
- Third-party standards, specifications, and documents referenced by the Platform are subject to their respective licenses and copyright terms.

## 10. Privacy and Analytics

The Platform has no user accounts and no login credentials, and no server of its own that processes your data. All cryptographic operations and assessments run entirely in your browser, using client-side WebAssembly modules, the Web Crypto API and JavaScript libraries.

We use **Google Analytics 4 (GA4)** on every visit. It starts when a page loads, and the Platform has no consent prompt or on/off switch yet. GA4 collects anonymous usage data: page views, aggregated interaction events (e.g., which learning modules are started or completed, and searches, with the text you type scrubbed of email addresses, web addresses, IP addresses and long key-like strings), and basic browser details such as language and screen size. GA4 sets cookies that give your browser a random identifier so repeat visits can be counted. The page address we send has nothing after a "?" or "#". Two automatic GA4 features (site search and navigation tracking) read the browser's own address instead, and can record text after a "?", such as a search term or the data in a shared-report link. Google also receives your IP address when your browser sends these events. We do not send names, email addresses or account details. Analytics are disabled entirely when the Platform is accessed on localhost.

To stop analytics, block them in your browser: use a content blocker that blocks Google Analytics requests (google-analytics.com), block cookies for this site, or install Google's opt-out browser add-on. For details on how Google processes analytics data, see [Google's Privacy Policy](https://policies.google.com/privacy).

The Platform's **PQC Assistant** answers from the Platform's own records, on your device. It uses no language model and asks for no API key, and your questions are not sent to any outside service.

Local browser storage (localStorage) keeps your learning progress, preferences and saved assessments on your device. We do not receive it. It leaves your browser only if you share a report link.

## 11. Modifications

We reserve the right to modify these Terms at any time. Changes will be indicated by updating the "Last Updated" date. Continued use of the Platform after changes constitutes acceptance of the modified Terms.

## 12. Governing Law

These Terms are governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions.

## 13. Contact

For questions about these Terms, please open a discussion on [GitHub Discussions](https://github.com/pqctoday-org/pqctoday-hub/discussions) or contact the maintainers through the repository.
