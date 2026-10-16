# Terms of Service

**Effective Date:** October 4, 2026
**Last Updated:** October 16, 2026

## 1. Acceptance of Terms

These Terms of Service ("Terms") apply to your use of the PQC Today website at [www.pqctoday.com](https://www.pqctoday.com/) (the "Platform"). If you do not agree to these Terms, do not use the website.

The source code in the Platform's GitHub repositories is not governed by these Terms. Your rights to use, copy, modify and distribute it come from its licence (section 2), and these Terms add no conditions to it.

## 2. License

The Platform's source code is licensed under the **GNU General Public License v3.0 (GPL-3.0-only)**. The full license text is available in the [LICENSE](./LICENSE) file. Nothing in these Terms restricts rights granted under the GPL-3.0.

## 3. Educational Purpose and Cryptographic Disclaimer

The Platform is an **educational and research tool** for post-quantum cryptography (PQC). All cryptographic operations — including key generation, signing, verification, encryption, decryption, and key encapsulation — are performed **client-side in your browser** using WebAssembly (WASM) and are intended **for educational and demonstration purposes only**.

In short: this is a demo, not a certified crypto library — never use keys it generates to protect anything real.

**Disclaimer:**

- The Platform is not certified. Keys it generates are not suitable for protecting production systems, real data, or financial transactions.
- The Platform is not a substitute for professionally audited cryptographic implementations.
- Assessment results, migration recommendations and compliance guidance are educational information, not professional legal, security, or regulatory advice.

## 4. Export Compliance and Sanctions

In short: because this Platform bundles real cryptographic source code, U.S. export control and sanctions law applies to it — details below.

### 4.1 Classification

The Platform embeds open-source cryptographic software classified under **Export Control Classification Number (ECCN) 5D002** pursuant to the U.S. Export Administration Regulations (EAR). This includes but is not limited to: OpenSSL, liboqs, ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), AES, RSA, ECDSA, ECDH, Ed25519, secp256k1, FrodoKEM, HQC, Classic McEliece, and Falcon.

### 4.2 License Exception

Distribution is authorized under **License Exception TSU (§740.13 EAR)** for publicly available encryption source code and **License Exception ENC (§740.17 EAR)** for mass-market encryption software.

### 4.3 Your responsibility for export and sanctions law

Users are responsible for complying with the export control and sanctions laws that apply to them. U.S. law, for example, restricts exports to countries and territories under comprehensive U.S. sanctions (such as Cuba, Iran, North Korea, Syria, and the Crimea, Donetsk and Luhansk regions of Ukraine) and to parties on the BIS Entity List, the Treasury Department's Specially Designated Nationals (SDN) List, or other restricted party lists. This section is a notice about the law, not a condition of the software licence.

## 5. Acceptable Use

When using the website, you agree not to:

- Use it for any unlawful purpose or in violation of any applicable laws or regulations.
- Present the website as your own creation.
- Attempt to compromise, disrupt, or interfere with its infrastructure or other users' access.
- Scrape, crawl, or harvest data from it in a manner that degrades service for other users.

PQC Today, LLC does not endorse use of the Platform to develop weapons, conduct surveillance, or violate human rights.

## 6. No Warranty

THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, OR NON-INFRINGEMENT. This is consistent with Sections 15 and 16 of the GPL-3.0 license.

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

- The Platform's source code is licensed under GPL-3.0.
- Original educational content, data compilations, and visualizations are copyright of the PQC Today maintainers.
- Third-party standards, specifications, and documents referenced by the Platform are subject to their respective licenses and copyright terms.

## 10. Privacy and Analytics

The Platform has no user accounts and no login credentials, and no server of its own that processes your data. All cryptographic operations and assessments run entirely in your browser using client-side WebAssembly.

We use **Google Analytics 4 (GA4)** on every visit. It starts when a page loads, and the Platform has no consent prompt or on/off switch yet. GA4 collects anonymous usage data: page views, aggregated interaction events (e.g., which learning modules are started or completed, and searches, with the text you type scrubbed of email addresses, web addresses, IP addresses and long key-like strings), and basic browser details such as language and screen size. GA4 sets cookies that give your browser a random identifier so repeat visits can be counted. The page address we send has nothing after a "?" or "#". Two automatic GA4 features (site search and navigation tracking) read the browser's own address instead, and can record text after a "?", such as a search term or the data in a shared-report link. Google also receives your IP address when your browser sends these events. We do not send names, email addresses or account details. Analytics are disabled entirely when the Platform is accessed on localhost.

To stop analytics, block them in your browser: use a content blocker that blocks Google Analytics requests (google-analytics.com), block cookies for this site, or install Google's opt-out browser add-on. For details on how Google processes analytics data, see [Google's Privacy Policy](https://policies.google.com/privacy).

The Platform's **PQC Assistant** chat feature offers two modes. When using **Google Gemini Flash**, your chat messages and page context are sent to Google's servers for processing. You must provide your own Google AI API key to use this mode. Your API key is stored locally in your browser and is never transmitted to PQC Today's infrastructure. Google's use of data sent via the Gemini API is governed by [Google's Gemini API Terms of Service](https://ai.google.dev/gemini-api/terms). Alternatively, you can use the **Local LLM (WebLLM)** mode, which runs the AI model entirely in your browser — no data leaves your device.

Local browser storage (localStorage) keeps your learning progress, preferences, saved assessments and, if you add one, your AI provider key on your device. We do not receive it. It leaves your browser only if you share a report link or use the Gemini cloud mode described above.

## 11. Modifications

We reserve the right to modify these Terms at any time. Changes will be indicated by updating the "Last Updated" date. Continued use of the Platform after changes constitutes acceptance of the modified Terms.

## 12. Governing Law

These Terms are governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions.

## 13. Contact

For questions about these Terms, please open a discussion on [GitHub Discussions](https://github.com/pqctoday-org/pqctoday-hub/discussions) or contact the maintainers through the repository.
