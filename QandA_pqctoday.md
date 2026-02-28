# PQC Today — Q&A Test Suite

> **Purpose:** Test harness for the PQC Assistant's RAG retrieval and response quality.
> Each answer includes deep links to the exact app location (page, tab, step).
> Use these questions to validate that the assistant returns accurate, grounded responses.

---

## 1. Landing Page (`/`)

**Q1:** What are the seven journey steps shown on the PQC Today landing page?
**A1:** The seven steps are: **Learn** → **Assess** → **Explore** → **Test** → **Deploy** → **Ramp Up** → **Stay Agile**. They represent the full PQC adoption lifecycle, from education through ongoing monitoring. Start your journey at the [Landing page](/).

**Q2:** What four persona types does PQC Today support, and how do they affect the experience?
**A2:** The four personas are **Executive**, **Developer**, **Architect**, and **Researcher**. Each persona sees different priority recommendations — "For you" badges highlight the most relevant journey steps, and the [Assess report](/assess) tailors recommendations to the persona's role.

**Q3:** How many learning modules does PQC Today offer?
**A3:** PQC Today offers [25 interactive learning modules](/learn) covering fundamentals, infrastructure, advanced cryptography, domain applications, and an executive track, plus a comprehensive [quiz with 470 questions](/learn/quiz).

**Q4:** How many PQC-ready software products does the platform track?
**A4:** The [Migrate catalog](/migrate) tracks over 220 PQC-ready tools and products across 7 infrastructure layers plus web browsers.

**Q5:** What is the compliance deadline range covered by PQC Today?
**A5:** The platform tracks compliance deadlines from **2024 through 2036**, covering mandates like [CNSA 2.0](/compliance?q=CNSA%202.0), [EU Coordinated Roadmap](/compliance?q=EU%20Recommendation), and [NIST IR 8547](/library?ref=NIST-IR-8547) deprecation timelines.

**Q6:** Is PQC Today open source, and under what license?
**A6:** Yes, PQC Today is open source under the **GPL-3.0 license**. Details are on the [About page](/about).

**Q7:** What does the ScoreCard on the landing page track?
**A7:** The ScoreCard tracks your **Learning Journey progress** with a judo belt grading system (White through Black belt), reflecting how many [learning modules](/learn) and [quiz categories](/learn/quiz) you've completed.

**Q8:** Which three navigation paths are always visible regardless of persona selection?
**A8:** [Learn](/learn), [Timeline](/timeline), and [Threats](/threats) are always visible and never dimmed, regardless of which persona is active.

**Q9:** What cryptographic technologies power the in-browser demonstrations?
**A9:** PQC Today uses **OpenSSL WASM v3.6.0** (primary), **liboqs-js v0.15.1** (PQC algorithms), and the **Web Crypto API** — all running entirely in the browser. Try them in the [Playground](/playground) or [OpenSSL Studio](/openssl).

**Q10:** How does PQC Today differ from a simulation-only platform?
**A10:** PQC Today performs **real cryptographic operations** via WebAssembly — actual key generation, encapsulation, signing, and verification happen in your browser. The [Playground](/playground?algo=ML-KEM-768) lets you generate real ML-KEM keys and measure execution time.

---

## 2. Timeline (`/timeline`)

**Q1:** What phase types are shown in the global PQC migration timeline?
**A1:** The [Timeline](/timeline) displays 10 phase types: **Discovery**, **Testing**, **POC** (proof of concept), **Migration**, **Standardization**, **Guidance**, **Policy**, **Regulation**, **Research**, and **Deadline**. Each represents a different stage of a country's PQC transition.

**Q2:** Which country has the most aggressive PQC migration deadline, and what year?
**A2:** **Australia** mandates PQC adoption by **2030** via ASD ISM-1917, making it roughly 5 years ahead of the US and UK timelines. See [Australia's timeline](/timeline?country=Australia).

**Q3:** What are Canada's three PQC migration phases?
**A3:** Canada's CCCS roadmap specifies: departmental plans by **2026**, high-priority system migration by **2031**, and full transition by **2035**. View the full roadmap at [Canada's timeline](/timeline?country=Canada).

**Q4:** What is the EU's coordinated PQC transition target date?
**A4:** The EU Coordinated Implementation Roadmap v1.1 targets high-risk system transition by **December 2030** and full transition by **December 2035**. National roadmaps were due by December 2026. See [EU timeline](/timeline?country=EU).

**Q5:** When does the UK plan to complete its PQC transition?
**A5:** The UK NCSC published a three-phase roadmap with full PQC transition by **2035**. The phases cover discovery (by 2028), high-priority migration, and complete migration. See [UK timeline](/timeline?country=United%20Kingdom).

**Q6:** What is Czech Republic's PQC deadline, and why is it notable?
**A6:** Czech Republic set a **2027** deadline, making it the **first EU member state with a specific PQC migration deadline**. View details at [Czech Republic's timeline](/timeline?country=Czech%20Republic).

**Q7:** What PQC milestone did SandboxAQ achieve with the Pentagon?
**A7:** SandboxAQ deployed **AQtive Guard** to the Pentagon under a 5-year deal for cryptographic discovery and migration. This is tracked as a major industry milestone on the [Timeline](/timeline).

**Q8:** What regions can you filter the timeline by?
**A8:** The [Timeline](/timeline) supports filtering by four regions: **Americas**, **EMEA** (Europe, Middle East, Africa), **Asia-Pacific**, and **Global/International** organizations.

**Q9:** What is the difference between a "Milestone" and a "Phase" event type on the timeline?
**A9:** A **Milestone** is a singular achievement (e.g., a standard publication or product launch), while a **Phase** spans multiple years representing an ongoing transition (e.g., a country's migration period). Both are displayed on the [Timeline Gantt chart](/timeline).

**Q10:** What is Germany's QUANTITY initiative?
**A10:** Germany's **QUANTITY initiative** targets PQC readiness by **2030**, led by BSI. Germany also produced the world's first quantum-secure ID card in November 2025. See [Germany's timeline](/timeline?country=Germany).

**Q11:** What is Israel's PQC timeline milestone?
**A11:** Israel mandated **quantum threat assessments beginning in 2025**, making it one of the earliest countries to require formal evaluation. View at [Israel's timeline](/timeline?country=Israel).

**Q12:** When does the G7 financial sector target for PQC transition?
**A12:** The G7 financial sector PQC transition target is **2034**, focused on ensuring global payment and settlement systems are quantum-safe. This is tracked under the [Global timeline](/timeline).

**Q13:** How does China's PQC program differ from NIST-aligned countries?
**A13:** China's **NGCC (Next-Generation Commercial Cryptography)** program may require OSCCA-approved algorithms that differ from NIST standards, potentially requiring **dual algorithm sets** for organizations operating in both jurisdictions. See [China's timeline](/timeline?country=China).

**Q14:** What is Taiwan's PQC migration deadline?
**A14:** Taiwan targets PQC migration by **2027**, making it one of the earliest deadlines in the Asia-Pacific region alongside Australia's 2030 mandate. See [Taiwan's timeline](/timeline?country=Taiwan).

**Q15:** When did Microsoft announce its core infrastructure PQC transition?
**A15:** Microsoft announced acceleration of its **Core Infrastructure Transition** starting in **2026**, covering Azure, Windows, and enterprise services. This is tracked on the [Timeline](/timeline).

---

## 3. Algorithms (`/algorithms`)

**Q1:** What FIPS standard covers ML-KEM (Kyber), and when was it published?
**A1:** ML-KEM is covered by **FIPS 203**, published in **August 2024**. It is the primary NIST-standardized key encapsulation mechanism. See [ML-KEM details](/algorithms?highlight=ML-KEM-768) and the [FIPS 203 standard](/library?ref=FIPS-203).

**Q2:** What are the three ML-KEM parameter sets and their NIST security levels?
**A2:** **ML-KEM-512** (Level 1, 128-bit), **ML-KEM-768** (Level 3, 192-bit), and **ML-KEM-1024** (Level 5, 256-bit). Higher levels provide more security but larger key sizes. Compare them at [Algorithms](/algorithms?highlight=ML-KEM-512,ML-KEM-768,ML-KEM-1024).

**Q3:** What is the approximate public key size of ML-KEM-768?
**A3:** ML-KEM-768 has a public key of approximately **1,184 bytes** and a ciphertext of ~1,088 bytes. View full specs at [ML-KEM-768](/algorithms?highlight=ML-KEM-768).

**Q4:** What FIPS standard covers ML-DSA (Dilithium)?
**A4:** ML-DSA is covered by **FIPS 204**, published in **August 2024**. It is the primary NIST-standardized digital signature algorithm. See [ML-DSA details](/algorithms?highlight=ML-DSA-65).

**Q5:** What are the ML-DSA parameter sets and their signature sizes?
**A5:** **ML-DSA-44** (~2,420 byte signatures, Level 2), **ML-DSA-65** (~3,309 byte signatures, Level 3), and **ML-DSA-87** (~4,627 byte signatures, Level 5). Compare at [Algorithms](/algorithms?highlight=ML-DSA-44,ML-DSA-65,ML-DSA-87).

**Q6:** What is SLH-DSA (SPHINCS+) and how many variants does it have?
**A6:** SLH-DSA is a **stateless hash-based signature scheme** covered by **FIPS 205**. It has **12 variants** across SHA2/SHAKE hash functions, three security levels (128/192/256), and fast (f) or small (s) parameter sets. Explore in the [Playground key store](/playground) or at [Algorithms](/algorithms?highlight=SLH-DSA).

**Q7:** What is FN-DSA (Falcon) and what makes it distinctive?
**A7:** FN-DSA is covered by **FIPS 206** (finalized October 2024). Its key advantage is **compact signatures** — FN-DSA-512 produces ~666 byte average / 690 byte max signatures, much smaller than ML-DSA. See [FN-DSA details](/algorithms?highlight=FN-DSA-512).

**Q8:** What is HQC and what is its standardization status?
**A8:** **HQC (Hamming Quasi-Cyclic)** is a **code-based KEM** selected by NIST in 2025 as a backup to ML-KEM. It is in **draft standard** status (Round 4 selection). The [Compliance Strategy module](/learn/compliance-strategy?tab=learn) covers its policy implications.

**Q9:** Why is Classic McEliece considered impractical for most applications?
**A9:** Classic McEliece has **public keys of 0.5–1.3 MB**, making it impractical for bandwidth-constrained protocols like TLS handshakes. However, it has the strongest security analysis of any code-based scheme. See [Algorithm comparison](/algorithms?highlight=Classic-McEliece).

**Q10:** What is the recommended PQC replacement for RSA-2048?
**A10:** The recommended transition path is RSA-2048 → **ML-KEM-768 + ML-DSA-65** (balanced security, Level 3). For highest security (CNSA 2.0), use ML-KEM-1024 + ML-DSA-87. See the [Transition Guide](/algorithms).

**Q11:** What NIST security levels exist and what do they correspond to?
**A11:** NIST defines 5 security levels: **Level 1** (AES-128 equivalent), **Level 2** (SHA-256 collision), **Level 3** (AES-192), **Level 4** (SHA-384 collision), and **Level 5** (AES-256). Most PQC algorithms target Levels 1, 3, or 5. See [Algorithms](/algorithms).

**Q12:** When does NIST IR 8547 plan to deprecate and disallow classical algorithms?
**A12:** NIST IR 8547 (finalized March 2025) plans to **deprecate** RSA and ECC by **2030** and **disallow** them by **2035**. See the [NIST IR 8547 reference](/library?ref=NIST-IR-8547).

**Q13:** What is a hybrid cryptographic approach?
**A13:** Hybrid cryptography combines a **classical algorithm** (e.g., ECDH X25519) with a **PQC algorithm** (e.g., ML-KEM-768) so that security holds even if one scheme is broken. Learn more in the [Hybrid Crypto module](/learn/hybrid-crypto?tab=learn).

**Q14:** What are LMS and XMSS, and when should they be used?
**A14:** LMS and XMSS are **stateful hash-based signature schemes** defined in **SP 800-208**. They're ideal for **firmware signing** where the number of signatures is bounded. LMS verifies ~4x faster than XMSS on constrained MCUs. Learn more in the [Stateful Signatures module](/learn/stateful-signatures?tab=learn).

**Q15:** How does FrodoKEM differ from ML-KEM?
**A15:** FrodoKEM uses conservative **plain LWE** (not structured lattices), making it potentially more resistant to lattice attacks but with **significantly larger keys** (~9–20 KB public keys). It was a NIST alternate candidate but is **not standardized**. See [FrodoKEM](/algorithms?highlight=FrodoKEM).

**Q16:** What is the performance trade-off between SLH-DSA-128f and SLH-DSA-128s?
**A16:** The **f (fast)** variant has faster signing but larger signatures (~7.8 KB), while the **s (small)** variant has smaller signatures (~17 KB for 256-bit) but slower signing. Both share the same verification speed. Explore all 12 variants in the [Playground](/playground).

**Q17:** What classical algorithms are quantum-vulnerable?
**A17:** **RSA** (all sizes), **ECDSA** (P-256/P-384/P-521), **ECDH** (X25519/X448), and **EdDSA** are all vulnerable to Shor's algorithm on a quantum computer. The [Quantum Threats module](/learn/quantum-threats?tab=learn) explains why.

**Q18:** What is the CNSA 2.0 exclusive phase deadline for all classical algorithms?
**A18:** CNSA 2.0 sets **2030** as the start of the "exclusive" phase where only PQC algorithms are permitted for national security systems, with full transition by **2035**. See [CNSA 2.0 compliance](/compliance?q=CNSA%202.0).

**Q19:** What algorithm would you recommend for signing IoT firmware on a Cortex-M4 microcontroller?
**A19:** **LMS** (Leighton-Micali Signature) is recommended — it's the **fastest PQC verifier on constrained MCUs**, approximately 4x faster than XMSS on Cortex-M4. Learn more in the [IoT/OT module](/learn/iot-ot-pqc?tab=workshop) and [Stateful Signatures module](/learn/stateful-signatures?tab=learn).

**Q20:** What is the difference between a KEM and traditional key exchange?
**A20:** A **Key Encapsulation Mechanism (KEM)** generates a shared secret by encapsulating it with the recipient's public key, rather than using interactive Diffie-Hellman-style exchange. ML-KEM replaces ECDH for post-quantum key agreement. Try it hands-on in the [Playground KEM tab](/playground?algo=ML-KEM-768).

---

## 4. Library (`/library`)

**Q1:** What are the four FIPS standards published for PQC, and what do they cover?
**A1:** **[FIPS 203](/library?ref=FIPS-203)** (ML-KEM/Kyber), **[FIPS 204](/library?ref=FIPS-204)** (ML-DSA/Dilithium), **[FIPS 205](/library?ref=FIPS-205)** (SLH-DSA/SPHINCS+), and **[FIPS 206](/library?ref=FIPS-206)** (FN-DSA/Falcon). All were finalized in 2024.

**Q2:** What is RFC 9629 about?
**A2:** [RFC 9629](/library?ref=RFC-9629) specifies how to use **Key Encapsulation Mechanisms (KEMs) in Cryptographic Message Syntax (CMS)**, enabling PQC key transport in S/MIME and other CMS-based protocols.

**Q3:** What does the IETF draft-ietf-tls-ecdhe-mlkem define?
**A3:** This draft (in the RFC Editor Queue) defines **hybrid TLS 1.3 key exchange** combining ECDHE (X25519) with ML-KEM for post-quantum protection while maintaining backward compatibility. See the [Library](/library) and [TLS Basics module](/learn/tls-basics?tab=learn).

**Q4:** What is ETSI TS 103 744?
**A4:** [ETSI TS 103 744](/library) defines the European standard for **quantum-safe hybrid KEM**, specifying how to combine classical and PQC key encapsulation in European telecommunications infrastructure.

**Q5:** What does BSI TR-02102 cover?
**A5:** The [BSI TR-02102](/library) series provides German federal guidelines for cryptographic algorithms in **TLS, IPsec, and SSH**, including PQC algorithm recommendations updated in the v2026-01 revision.

**Q6:** What is the ANSSI PQC Position Paper?
**A6:** The ANSSI Position Paper mandates that French-qualified security products must support **hybrid PQC** (classical + post-quantum combined) starting from 2025, with phased transition through 2030. See the [Library](/library) and [Compliance Strategy module](/learn/compliance-strategy?tab=learn).

**Q7:** What does SP 800-208 standardize?
**A7:** [SP 800-208](/library) standardizes **LMS, HSS, XMSS, and XMSS^MT** — stateful hash-based signature schemes for scenarios like firmware signing where state management is feasible. Learn more in the [Stateful Signatures module](/learn/stateful-signatures?tab=learn).

**Q8:** What are RFC 9881 and RFC 9882?
**A8:** [RFC 9881](/library) specifies **ML-DSA in X.509 certificates** and [RFC 9882](/library) specifies **ML-DSA in CMS** — together they enable PQC digital signatures in PKI and signed content ecosystems.

**Q9:** What is NIST IR 8547?
**A9:** [NIST IR 8547](/library?ref=NIST-IR-8547) is the transition guidance document — draft November 2024, finalized March 2025 — that sets the **deprecation (2030) and disallowance (2035)** timeline for classical cryptographic algorithms.

**Q10:** What does RFC 9802 cover?
**A10:** [RFC 9802](/library) specifies how to use **HSS/LMS and XMSS** hash-based signatures in **X.509 certificates**, enabling stateful signature schemes in PKI.

**Q11:** What is the CCCS ITSM.40.001?
**A11:** The Canadian Centre for Cyber Security's [ITSM.40.001](/library) is the federal PQC migration roadmap, effective June 2025, covering government systems transition through 2035.

**Q12:** How many document categories does the Library support for filtering?
**A12:** The [Library](/library) supports filtering across **16 categories** including Standards, RFCs, Compliance, Protocols, PKI/Certificates, Firmware & Code Signing, and more.

**Q13:** What RFC covers PQC pre-shared keys for IKEv2 VPN?
**A13:** [RFC 8784](/library) defines **PQC PSK (Pre-Shared Key) for IKEv2**, allowing VPN tunnels to add quantum resistance via hybrid PSK + classical key exchange. The [VPN & SSH module](/learn/vpn-ssh-pqc?tab=learn) covers this in depth.

**Q14:** What is RFC 9701?
**A14:** [RFC 9701](/library) defines the **Token Status List** format for efficient revocation checking of digital credentials, relevant to PQC certificate lifecycle management.

**Q15:** What does the Library's cross-reference system connect?
**A15:** The Library cross-references **compliance frameworks** (via `libraryRefs`), **timeline events** (via `timelineRefs`), and **inter-document dependencies** — so you can trace from a compliance deadline to the standards it references. Browse at [Library](/library).

---

## 5. Threats (`/threats`)

**Q1:** What is a "Harvest Now, Decrypt Later" (HNDL) attack?
**A1:** HNDL is a strategy where adversaries **intercept and store encrypted data today**, planning to decrypt it in the future when quantum computers become powerful enough to break the encryption. This is the primary near-term quantum threat. Learn more in the [Quantum Threats module](/learn/quantum-threats?tab=learn) and the [Threats dashboard](/threats).

**Q2:** What is HNFL and how does it differ from HNDL?
**A2:** **Harvest Now, Forge Later (HNFL)** targets digital signatures rather than encryption — adversaries plan to forge signatures once quantum computers can break ECDSA/RSA. This threatens code signing, certificates, and legal documents. See [Threats](/threats) and the [PQC Risk Management module](/learn/pqc-risk-management?tab=learn).

**Q3:** What is the estimated probability of a Cryptographically Relevant Quantum Computer (CRQC) within 10 years?
**A3:** According to the Global Risk Institute's 2024 assessment, there is a **19–34% probability** of a CRQC emerging within 10 years. This uncertainty is a key driver for early PQC migration. See [Threats](/threats).

**Q4:** Why is the financial services industry particularly vulnerable to quantum threats?
**A4:** Financial services face threats including SWIFT/TARGET2 settlement system exposure, HSM backup key extraction (RSA-wrapped master keys), and long-lived transaction records. BIS Project Leap tested hybrid PQC on TARGET2. See [financial threats](/threats?industry=Financial%20Services).

**Q5:** What quantum threat does the aerospace industry face with HNDL?
**A5:** Aircraft avionics systems using RSA/ECDSA have **30–40 year lifespans**, meaning data encrypted today must survive quantum attacks decades into the future. NSA CNSA 2.0 mandates PQC by 2035 for these systems. See [aerospace threats](/threats?industry=Aerospace).

**Q6:** How much Bitcoin value is at risk from quantum attacks?
**A6:** Approximately **$718 billion** in Bitcoin sits in quantum-vulnerable P2PK (Pay-to-Public-Key) addresses where the public key is exposed. Ethereum has established a **$2M PQC research fund** (January 2026). See [cryptocurrency threats](/threats?industry=Cryptocurrency).

**Q7:** What is the quantum threat to healthcare data?
**A7:** Healthcare faces HNDL attacks on **patient records** — genomic and mental health data retain sensitivity **indefinitely**. In 2024, there were **677 major breaches** exposing 182M+ individuals. See [healthcare threats](/threats?industry=Healthcare).

**Q8:** What is the quantum threat to government classified data?
**A8:** TOP SECRET data requires **25–75+ year protection**, making it the highest-priority HNDL target. Nuclear command and control (NC3) systems have **50+ year lifecycles**. See [government threats](/threats?industry=Government).

**Q9:** How does the IoT sector face unique PQC challenges?
**A9:** Billions of constrained IoT devices using ECDSA/RSA have **no practical firmware update path** and 15–25 year lifecycles (industrial SCADA per IEC 62443). Resource constraints make PQC key sizes problematic. See [IoT threats](/threats?industry=IoT) and the [IoT/OT module](/learn/iot-ot-pqc?tab=learn).

**Q10:** What is the average quantum-safe readiness score according to IBM's index?
**A10:** Organizations score an average of **25 out of 100** on IBM's Quantum Safe Readiness Index, indicating widespread unpreparedness. Europol found **86% of executives** are unprepared. See [cross-industry threats](/threats).

**Q11:** What threat does quantum computing pose to power grid SCADA systems?
**A11:** Power grid SCADA systems (IEC 62351) rely on RSA/ECDSA with **20–30 year equipment lifecycles**. Quantum attacks could compromise grid control authentication. Nuclear facilities face even longer lifecycles (60+ year licenses). See [energy threats](/threats?industry=Energy).

**Q12:** How does the automotive industry's V2X PKI face quantum risk?
**A12:** Vehicle-to-Everything (V2X) PKI uses ECDSA P-256, and vehicles have **12+ year lifespans**. Quantum-enabled forgery of V2X messages could cause safety incidents. OTA firmware update forgery is another critical threat. See [automotive threats](/threats?industry=Automotive).

**Q13:** What is the quantum threat to satellite communications?
**A13:** Satellite communication systems face HNDL attacks on encrypted orbital data links, with satellite hardware lifespans of **15–20 years**. NSA CNSA 2.0 mandates PQC for all satellite encryption by 2035. See [aerospace threats](/threats?industry=Aerospace).

**Q14:** What threat criticality levels does the Threats dashboard use?
**A14:** The [Threats dashboard](/threats) uses five severity levels: **Critical** (immediate action), **High** (1–3 year timeline), **Medium-High**, **Medium**, and **Low**. Each threat includes specific crypto at risk and PQC replacement recommendations.

**Q15:** How many industries does the Threats dashboard cover?
**A15:** The [Threats dashboard](/threats) covers **15+ industries** including Aerospace, Automotive, Cloud Computing, Cryptocurrency, Energy, Financial Services, Government, Healthcare, Insurance, IoT, Telecommunications, and cross-industry threats.

**Q16:** What does each threat entry include?
**A16:** Each [threat entry](/threats) includes: threat ID, industry, detailed description, criticality level, **crypto at risk** (specific vulnerable algorithm/protocol), **PQC replacement** recommendation, relevant regulation/source, confidence percentage, and **related learning modules**.

**Q17:** What is the quantum threat to 5G telecommunications?
**A17:** 5G infrastructure relies on ECDSA and AKA (Authentication and Key Agreement) protocols. Quantum attacks could compromise network slicing authentication and subscriber identity protection (SUPI/SUCI). See [telecom threats](/threats?industry=Telecommunications) and the [5G Security module](/learn/5g-security?tab=learn).

**Q18:** What cross-industry threat does NIST IR 8547 address?
**A18:** NIST IR 8547 establishes the **deprecation (2030) and disallowance (2035)** timeline for all classical algorithms, affecting every industry that uses RSA, ECDSA, or ECDH. See [Threats](/threats) and [NIST IR 8547](/library?ref=NIST-IR-8547).

**Q19:** How does the insurance industry face quantum risk?
**A19:** Insurance companies hold **long-term policyholder data** (decades of PII, health records, financial details) vulnerable to HNDL. Actuarial models and policy records must remain confidential for policy lifetimes. See [insurance threats](/threats?industry=Insurance).

**Q20:** What is the cloud computing quantum threat?
**A20:** Cloud providers face threats to **TLS-protected data in transit**, stored encryption keys, and multi-tenant isolation mechanisms. A CRQC could compromise shared HSM key hierarchies protecting millions of customer keys. See [cloud threats](/threats?industry=Cloud%20Computing).

---

## 6. Compliance (`/compliance`)

**Q1:** What is CNSA 2.0 and what are its key deadlines?
**A1:** CNSA 2.0 is the NSA's mandate for US national security systems. Key deadlines: software/firmware signing **preferred by 2025, exclusive by 2030**; networking equipment **preferred by 2026**; NSS acquisitions **exclusive by 2027**; web/cloud **exclusive by 2033**; full transition by **2035**. See [CNSA 2.0](/compliance?q=CNSA%202.0).

**Q2:** What is the FIPS 140-3 validation backlog and why does it matter?
**A2:** The **CMVP (Cryptographic Module Validation Program)** has a significant backlog — validated PQC modules lag behind standard publication. Organizations needing FIPS-validated PQC may face delays. The [Compliance Strategy module](/learn/compliance-strategy?tab=learn) covers this dependency.

**Q3:** What is eIDAS 2.0 and its PQC requirement?
**A3:** eIDAS 2.0 is the EU Digital Identity regulation requiring **quantum-safe wallet deployments** starting 2027+. All EU digital identity wallets must incorporate PQC to protect citizen credentials long-term. See [Compliance](/compliance?q=eIDAS) and the [Compliance Strategy module](/learn/compliance-strategy?tab=learn).

**Q4:** What is DORA and when did enforcement begin?
**A4:** **DORA (Digital Operational Resilience Act)** is an EU regulation for financial sector digital resilience. Enforcement began **January 2025**. It requires ICT risk management including cryptographic readiness. See [Compliance](/compliance?q=DORA).

**Q5:** What does the EU Recommendation 2024/1101 require?
**A5:** EU Recommendation 2024/1101 establishes a coordinated PQC roadmap: national transition roadmaps by **December 2026**, high-risk systems transitioned by **December 2030**, and full transition by **December 2035**. See [EU compliance](/compliance?q=EU%20Recommendation).

**Q6:** When must ANSSI-qualified French products support PQC?
**A6:** ANSSI requires PQC in all products submitted for qualification from **2027**, with hybrid (classical + PQC combined) as the mandatory approach. The phased transition runs 2025–2030. See [Compliance](/compliance?q=ANSSI).

**Q7:** What is the Korean PQC standardization timeline?
**A7:** Korea's **KpqC** program targets standardization by **2029** and full migration by **2035**, running its own PQC competition parallel to NIST. The [KCMVP](/compliance) validates Korean cryptographic modules. See [Compliance](/compliance).

**Q8:** What PQC-related certification does ACVP provide?
**A8:** **ACVP (Automated Cryptographic Validation Protocol)** validates algorithm implementations against NIST test vectors. Products must pass ACVP testing for ML-KEM, ML-DSA, and SLH-DSA before FIPS 140-3 module validation. See [Compliance](/compliance?q=ACVP).

**Q9:** What is a CBOM and why is it important for PQC compliance?
**A9:** A **Cryptographic Bill of Materials (CBOM)** is an inventory of all cryptographic algorithms, protocols, and key types in your systems. Europol found **86% of executives lack** this inventory, making migration planning impossible. The [Assess wizard](/assess?step=0) helps build one.

**Q10:** What industry regulation covers payment card PQC requirements?
**A10:** **PCI-DSS** (Payment Card Industry Data Security Standard) governs payment cryptography. While no explicit PQC deadline exists yet, the standard requires "strong cryptography" which will evolve to include PQC. See [Compliance](/compliance?q=PCI-DSS) and [financial threats](/threats?industry=Financial%20Services).

**Q11:** What is NERC-CIP and its relevance to PQC?
**A11:** **NERC-CIP** (North American Electric Reliability Corporation Critical Infrastructure Protection) standards govern power grid cybersecurity. Equipment lifecycles of 20–30 years make early PQC planning essential. See [Compliance](/compliance?q=NERC-CIP) and [energy threats](/threats?industry=Energy).

**Q12:** What does Executive Order 14306 require?
**A12:** **EO 14306** (June 2025) and subsequent CISA procurement guidance (January 2026) require federal agencies to prioritize PQC-capable products in procurement decisions. See the [Compliance Strategy module](/learn/compliance-strategy?tab=learn).

**Q13:** How does NIS2 relate to PQC?
**A13:** The **EU NIS2 Directive** (transposition completed October 2024) requires enhanced cybersecurity risk management for essential and important entities, implicitly covering cryptographic resilience against quantum threats. See [Compliance](/compliance?q=NIS2).

**Q14:** What is the GSMA NG.116 standard?
**A14:** **GSMA NG.116** provides PQC guidelines for mobile operators targeting **2026–2028** implementation, covering SIM authentication, network signaling, and subscriber privacy. See [Compliance](/compliance?q=GSMA) and the [5G Security module](/learn/5g-security?tab=learn).

**Q15:** What is Common Criteria's role in PQC certification?
**A15:** **Common Criteria (ISO/IEC 15408)** evaluates IT security products. The **EUCC v2.0** (EU Cybersecurity Certification Scheme, April 2025 update) now includes PQC in its agreed cryptographic mechanisms. See [Compliance](/compliance?q=Common%20Criteria).

**Q16:** What is the FIPS 140-3 Implementation Guidance for PQC?
**A16:** Published **September 2025**, the FIPS 140-3 IG provides specific guidance on how PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) should be validated in cryptographic modules, addressing hybrid mode and transition period requirements. See [Compliance](/compliance?q=FIPS%20140-3).

**Q17:** What does ISO/SAE 21434 cover?
**A17:** **ISO/SAE 21434** specifies cybersecurity engineering for road vehicles, covering the full lifecycle from concept through decommissioning. With vehicle lifespans of 12+ years, PQC planning is critical. See [Compliance](/compliance) and [automotive threats](/threats?industry=Automotive).

**Q18:** What is the New Zealand NZISM PQC timeline?
**A18:** The **NZISM v3.9** specifies a phased PQC transition from **2026 to 2030** for New Zealand government systems, aligned with the Five Eyes alliance approach.

**Q19:** What is BSI's approach to PQC?
**A19:** Germany's **BSI** updated TR-02102 (v2026-01) with PQC recommendations for TLS, IPsec, and SSH. BSI also leads the QUANTITY initiative targeting national PQC readiness by 2030 and produced the world's first quantum-secure ID card. See [Compliance](/compliance?q=BSI).

**Q20:** How does HIPAA relate to PQC?
**A20:** **HIPAA** requires encryption for protected health information (PHI) but has **no explicit PQC deadline yet**. However, given indefinite data sensitivity and HNDL risks, healthcare organizations should plan proactively. See [Compliance](/compliance?q=HIPAA) and [healthcare threats](/threats?industry=Healthcare).

---

## 7. Migrate (`/migrate`)

**Q1:** What are the seven phases of the PQC migration framework?
**A1:** The seven phases are: **Assess** (cryptographic inventory/CBOM), **Plan** (risk prioritization), **Prepare** (tooling & vendor engagement), **Test** (pilot hybrid deployments), **Migrate** (hybrid certificate rollout), **Launch** (production deployment), and **Ramp Up** (monitoring & optimization). Explore them at [Migrate](/migrate).

**Q2:** What infrastructure layers does the Migrate catalog organize products by?
**A2:** The [Migrate catalog](/migrate) uses 7 infrastructure layers: **Operating Systems**, **Databases**, **VPN/Network**, **Code Signing**, **Cryptographic Libraries**, **Devices/IoT**, **Other**, plus a **Web Browsers** category (Chrome, Edge, Firefox, Safari with ML-KEM TLS 1.3).

**Q3:** What do the three FIPS badge tiers mean?
**A3:** **Validated** (green) = FIPS 140-3 validated module. **Partial** (amber) = FedRAMP, WebTrust, or FIPS-mode claims without full CMVP validation. **No** (gray) = no FIPS certification. Filter by FIPS status at [Migrate](/migrate).

**Q4:** What phase should you start if you haven't begun PQC migration?
**A4:** Start with the **Assess** phase — build a Cryptographic Bill of Materials (CBOM), map certificate chains, and identify quantum-vulnerable algorithms. The [Assess wizard](/assess?step=0) automates this with a 13-step questionnaire. Then explore relevant products at [Migrate](/migrate).

**Q5:** What does the "Prepare" migration phase involve?
**A5:** The Prepare phase involves selecting PQC libraries (OpenSSL 3.5+, AWS-LC, BoringSSL), upgrading **HSM firmware** (Thales, Entrust, Utimaco), setting up hybrid certificate infrastructure, and engaging vendor PQC roadmaps. See [Migrate](/migrate).

**Q6:** What happens in the "Test" migration phase?
**A6:** The Test phase involves piloting **hybrid TLS/SSH with ML-KEM + X25519**, testing VPN PQC tunnels (IKEv2, strongSwan), measuring performance impact, and validating certificate chain interoperability. Try it yourself in the [Playground](/playground?algo=ML-KEM-768).

**Q7:** How can you filter the Migrate catalog by industry?
**A7:** Use the industry filter or deep link with `?industry=` parameter — e.g., [Migrate for Finance](/migrate?industry=Finance%20%26%20Banking) or [Migrate for Healthcare](/migrate?industry=Healthcare). Products are tagged with target industries in their metadata.

**Q8:** What web browsers support ML-KEM TLS 1.3?
**A8:** **Chrome**, **Edge**, **Firefox**, and **Safari** all support ML-KEM for TLS 1.3 key exchange. Cloudflare reports 38%+ of HTTPS traffic is now PQC-protected. See the [Migrate Web Browsers section](/migrate).

**Q9:** What does the certification cross-reference show?
**A9:** The certification cross-reference links migrate products to their **FIPS/ACVP/Common Criteria** certifications from the compliance database, showing which products have validated PQC implementations. See product details in the [Migrate catalog](/migrate).

**Q10:** What should organizations re-encrypt during the "Launch" phase?
**A10:** The Launch phase includes re-encrypting **archived data** (HNDL counter-measures), updating **secure boot chains** (UEFI, TPM), migrating **email/S/MIME encryption**, and completing **disk/database encryption** migration. See [Migrate](/migrate).

**Q11:** How many PQC-ready software products does the catalog track?
**A11:** The [Migrate catalog](/migrate) tracks over **220 PQC-ready products** across all infrastructure layers, with searchable fields for name, PQC capabilities, license, and target industries.

**Q12:** What is the "Ramp Up" phase focused on?
**A12:** Ramp Up focuses on deploying **continuous crypto monitoring**, deprecating legacy algorithms, optimizing PQC performance, and preparing for **future algorithm agility** in case standards evolve. See [Migrate](/migrate).

**Q13:** How does the Migrate page connect to the Assess wizard?
**A13:** The [Assess report](/report) includes direct links to relevant [Migrate](/migrate) products filtered by your assessment results — industry, infrastructure, and compliance framework selections drive the product recommendations.

**Q14:** What cryptographic libraries should organizations evaluate first?
**A14:** Key PQC-capable libraries include **OpenSSL 3.5+**, **AWS-LC**, **BoringSSL**, and **liboqs**. Search for them at [Migrate](/migrate?q=OpenSSL) to compare their FIPS status, supported algorithms, and target platforms.

**Q15:** What is the purpose of the infrastructure stack visualization?
**A15:** The infrastructure stack shows the **hierarchical relationship** between migration layers — from OS and hardware at the bottom through cryptographic libraries, network/VPN, databases, to applications at the top. Each layer can be expanded to browse products. See [Migrate](/migrate).

---

## 8. Assess (`/assess`)

**Q1:** What are the 13 steps of the comprehensive assessment wizard?
**A1:** The 13 steps are: **Industry** → **Country** → **Crypto Stack** → **Data Sensitivity** → **Compliance** → **Migration Status** → **Use Cases** → **Data Retention** → **Credential Lifetime** → **Organization Scale** → **Crypto Agility** → **Infrastructure** → **Vendor Dependencies** → **Timeline Pressure**. Start at [Assess](/assess).

**Q2:** How does the quick assessment mode differ from comprehensive?
**A2:** **Quick mode** covers 6 steps (~2 minutes) for a rapid baseline, while **comprehensive mode** covers all 13 steps (~5 minutes) for detailed migration planning with full risk scoring. Both are available at [Assess](/assess).

**Q3:** What four risk categories does the assessment report generate?
**A3:** The report scores four categories: **Strategic Risk** (long-term quantum exposure), **Operational Risk** (system complexity and migration effort), **Compliance Risk** (regulatory deadline pressure), and **Vendor Risk** (third-party dependency control). View your results at [Report](/report).

**Q4:** How does the HNDL window calculation work?
**A4:** The HNDL window = **data retention period** minus **estimated time to CRQC**. If your data must be protected for 20 years and CRQC arrives in 10, you have a 10-year exposure window where harvested data is vulnerable. Set your retention at [Assess step 7](/assess?step=7).

**Q5:** How does country selection affect the assessment?
**A5:** Your [country selection](/assess?step=1) drives **country-aligned compliance deadlines** in the Timeline step and **filters compliance frameworks** to show only relevant regulations (e.g., selecting France shows ANSSI, selecting USA shows CNSA 2.0 and CISA).

**Q6:** What does the Data Sensitivity step assess?
**A6:** The [Data Sensitivity step](/assess?step=3) classifies your data types as **Highly Sensitive**, **Confidential**, **Internal**, or **Public** (multi-select). Scoring uses **worst-case** — if any data is Highly Sensitive, that drives the risk score.

**Q7:** How does crypto agility affect risk scoring?
**A7:** The [Crypto Agility step](/assess?step=10) rates your organization's ability to swap algorithms: "Can quickly swap" (lowest risk) to "Difficult to change" (highest risk). Low agility increases both operational and strategic risk scores.

**Q8:** What compliance frameworks are filtered by industry?
**A8:** The [Compliance step](/assess?step=4) dynamically filters frameworks based on your industry selection — e.g., Healthcare sees HIPAA and FDA 21 CFR Part 11, Finance sees PCI-DSS and DORA, Government sees FedRAMP and CNSA 2.0.

**Q9:** How does the assessment handle vendor dependency risk?
**A9:** The [Vendor Dependencies step](/assess?step=12) evaluates third-party crypto control: **Unknown** (highest risk), **Vendor-controlled**, **Hybrid**, or **Self-managed** (lowest risk). This feeds the Vendor Risk category in the report.

**Q10:** Can you resume an incomplete assessment?
**A10:** Yes, the assessment auto-saves progress at each step via localStorage. When you return to [Assess](/assess), it resumes where you left off. A Reset button with confirmation allows starting over.

**Q11:** How does the persona affect report recommendations?
**A11:** The report tailors recommendations to your persona: **Executives** see business impact, ROI, and timelines; **Developers** see implementation details; **Architects** see integration patterns; **Researchers** see academic references. Set your persona on the [Landing page](/).

**Q12:** What use cases can be selected in the assessment?
**A12:** The [Use Cases step](/assess?step=6) includes: **TLS/HTTPS**, **Code Signing**, **Email Encryption**, **VPN**, **Database Encryption**, **Digital Assets**, and more. Each selected use case maps to specific migration recommendations.

**Q13:** How does infrastructure type affect the assessment?
**A13:** The [Infrastructure step](/assess?step=11) classifies your stack as **On-premise**, **Cloud-hybrid**, or **Cloud-native**. Cloud-native environments may migrate faster (vendor-managed crypto updates), while on-premise requires more manual effort.

**Q14:** What is the purpose of the Timeline Pressure step?
**A14:** The [Timeline Pressure step](/assess?step=12) maps your organization to specific compliance deadlines (CNSA 2.0 2027–2030 prefer windows, country-specific deadlines). Higher pressure increases Compliance Risk scoring.

**Q15:** Can the assessment report be printed or saved as PDF?
**A15:** Yes, the [Report](/report) supports **Print/PDF** with a formatted header (PQC Today version, Industry, Country, DateTime) and footer. CollapsibleSections auto-expand, and action buttons are hidden for clean output.

---

## 9. Playground (`/playground`)

**Q1:** What cryptographic operations can you perform in the Playground?
**A1:** The [Playground](/playground) supports 8 operation categories across tabs: **Key Store** (key management), **Data** (input/output), **KEM & Encrypt** (ML-KEM encapsulation), **Symmetric Encryption** (AES, ChaCha20), **Hashing** (SHA-2/3, SHAKE), **Sign & Verify** (ML-DSA, ECDSA), **ACVP Testing** (compliance vectors), and **Logs** (operation history).

**Q2:** How can you test ML-KEM key encapsulation in the browser?
**A2:** Navigate to the [Playground with ML-KEM pre-selected](/playground?algo=ML-KEM-768), generate a key pair in the Key Store tab, then use the KEM & Encrypt tab to encapsulate and decapsulate a shared secret — all using real WebAssembly operations, not simulations.

**Q3:** What PQC signature algorithms are available in the Playground?
**A3:** The [Playground](/playground) supports **ML-DSA** (Dilithium) for lattice-based signatures, all **12 SLH-DSA** (SPHINCS+) variants, and **FN-DSA** (Falcon) via liboqs — covering all three NIST-standardized PQC signature families.

**Q4:** What does the ACVP Testing tab do?
**A4:** The ACVP tab validates algorithm implementations against **NIST test vectors**, helping verify that the WebAssembly crypto operations match expected outputs — similar to the compliance testing required for FIPS 140-3 validation. Try it at [Playground](/playground).

**Q5:** How are execution times displayed?
**A5:** Each operation shows execution time in milliseconds with color coding: **green** (<100ms), **amber** (<500ms), **red** (>500ms). The last operation is logged in the header bar. View the Logs tab for full history at [Playground](/playground).

**Q6:** What symmetric encryption algorithms are available?
**A6:** The [Playground](/playground) supports **AES-256-GCM**, **AES-128-CBC**, and **ChaCha20-Poly1305** for symmetric encryption operations, powered by OpenSSL WASM v3.6.0.

**Q7:** Can you generate and manage multiple key pairs?
**A7:** Yes, the Key Store tab maintains generated keys with metadata (algorithm, key size, creation time). You can generate, export, and import keys for any supported algorithm. The key count is displayed in the tab label. See [Playground](/playground).

**Q8:** What hash functions are available?
**A8:** The Hashing tab supports the **SHA-2 family** (SHA-256, SHA-384, SHA-512), **SHA-3**, and **SHAKE256** — covering all hash functions used by PQC algorithms internally. Try at [Playground](/playground).

**Q9:** What is the difference between the Playground and OpenSSL Studio?
**A9:** The [Playground](/playground) provides a structured UI with tabs for specific operations (KEM, Sign, Encrypt), while [OpenSSL Studio](/openssl) gives you a command-line interface to run arbitrary OpenSSL commands. The Playground is better for quick algorithm testing; OpenSSL Studio for learning command syntax.

**Q10:** What WebAssembly backends power the Playground?
**A10:** The Playground uses two WASM backends: **OpenSSL v3.6.0** (primary, for standard operations) and **@oqs/liboqs-js v0.15.1** (for PQC algorithms not in OpenSSL, like FrodoKEM, HQC, Classic McEliece, and extra SLH-DSA variants). See [About](/about) for the full SBOM.

---

## 10. OpenSSL Studio (`/openssl`)

**Q1:** What version of OpenSSL runs in the browser via OpenSSL Studio?
**A1:** [OpenSSL Studio](/openssl) runs **OpenSSL v3.6.0** entirely in-browser via WebAssembly — no local installation required. You can verify this by running the `version` command.

**Q2:** What command categories are available in OpenSSL Studio?
**A2:** [OpenSSL Studio](/openssl) provides **14 command categories**: genpkey, req, x509, enc, dgst, hash, rand, version, files, kem, pkcs12, lms, configutl, and kdf — covering key generation through certificate management.

**Q3:** How do you generate a PQC key pair using OpenSSL Studio?
**A3:** Use the `genpkey` command with a PQC algorithm parameter — e.g., `openssl genpkey -algorithm ML-KEM-768 -out mlkem768.pem` for ML-KEM, or `openssl genpkey -algorithm ML-DSA-65 -out mldsa65.pem` for ML-DSA. Try it at [OpenSSL Studio](/openssl).

**Q4:** Can you create X.509 certificates with PQC algorithms?
**A4:** Yes — use `req` to create a CSR with ML-DSA signing, then `x509` to self-sign or CA-sign the certificate. OpenSSL v3.6.0 natively supports ML-KEM, ML-DSA, and SLH-DSA for certificate operations. See [OpenSSL Studio](/openssl).

**Q5:** What is the difference between `genpkey` and the deprecated `ec`/`ecparam` commands?
**A5:** `genpkey` is the **modern, unified** command for generating any key type (RSA, ECC, PQC), while `ec`/`ecparam` are deprecated legacy commands for ECC only. Always use `genpkey` for new key generation. See [OpenSSL Studio](/openssl).

**Q6:** How do you perform symmetric encryption in OpenSSL Studio?
**A6:** Use the `enc` command — e.g., `openssl enc -aes-256-gcm -in plaintext.txt -out encrypted.bin -pass pass:mypassword`. The enc category supports AES, ChaCha20, and other symmetric ciphers. Try at [OpenSSL Studio](/openssl).

**Q7:** What does the `dgst` command do?
**A7:** The `dgst` command computes **message digests** (hashes) — e.g., `openssl dgst -sha256 file.txt`. It supports SHA-2, SHA-3, and SHAKE families. Useful for verifying file integrity. See [OpenSSL Studio](/openssl).

**Q8:** How do you perform KEM operations in OpenSSL Studio?
**A8:** Use the `kem` command category for ML-KEM key encapsulation and decapsulation. This lets you generate a shared secret using the recipient's public key, mimicking how PQC key exchange works in TLS 1.3. See [OpenSSL Studio](/openssl).

**Q9:** What does the LMS command category cover?
**A9:** The `lms` category handles **Leighton-Micali Signature** operations — stateful hash-based signatures per SP 800-208. This is the recommended approach for firmware signing on constrained devices. See [OpenSSL Studio](/openssl) and the [Stateful Signatures module](/learn/stateful-signatures?tab=learn).

**Q10:** How is the OpenSSL Studio interface organized?
**A10:** The interface has two panes: **Left pane** contains the Command Builder with interactive parameter selection for each command category. **Right pane** has three sections: File Manager (view generated files), File Editor (edit configs), and Terminal Output / Operation Log toggle. See [OpenSSL Studio](/openssl).

**Q11:** Can you export generated keys from OpenSSL Studio?
**A11:** Yes — the File Manager in the right pane lets you view, download, and manage all generated files (keys, certificates, encrypted data) in PEM, DER, PKCS#8, and PKCS#12 formats. See [OpenSSL Studio](/openssl).

**Q12:** What is the `rand` command used for?
**A12:** The `rand` command generates **cryptographically secure random bytes** for seeding, nonce generation, or testing. Usage: `openssl rand -hex 32` for 32 random bytes in hex. See [OpenSSL Studio](/openssl).

**Q13:** How do you create a PKCS#12 keystore?
**A13:** Use the `pkcs12` command to bundle a private key and certificate chain into a single encrypted file — useful for importing into browsers and Java keystores. See [OpenSSL Studio](/openssl).

**Q14:** What is the `kdf` command category?
**A14:** The `kdf` category performs **Key Derivation Functions** — deriving encryption keys from passwords or shared secrets using algorithms like HKDF, PBKDF2, and scrypt. See [OpenSSL Studio](/openssl).

**Q15:** Can you create a self-signed CA certificate with PQC?
**A15:** Yes — generate an ML-DSA key with `genpkey`, create a CSR with `req` specifying CA extensions, then self-sign with `x509`. This creates a PQC root CA for testing hybrid certificate chains. See [OpenSSL Studio](/openssl) and the [PKI Workshop module](/learn/pki-workshop?tab=workshop).

---

## 11. Leaders (`/leaders`)

**Q1:** Who led the NIST PQC standardization effort?
**A1:** **Dustin Moody** at NIST led the 8-year standardization effort that selected the FIPS 203/204/205 finalists. He is profiled on the [Leaders page](/leaders?leader=Dustin%20Moody).

**Q2:** Who are the principal designers of ML-KEM and ML-DSA?
**A2:** **Vadim Lyubashevsky** (IBM Research) is the principal designer of both ML-KEM (Kyber) and ML-DSA (Dilithium). **Leo Ducas** (CWI/Leiden University) co-designed Kyber, Dilithium, NewHope, and Frodo. See [Leaders](/leaders).

**Q3:** What percentage of HTTPS traffic is PQC-protected according to Cloudflare?
**A3:** **Bas Westerbaan** at Cloudflare reported that **38%+** of HTTPS traffic was PQC-protected as of March 2025. See his profile at [Leaders](/leaders?leader=Bas%20Westerbaan).

**Q4:** What is SandboxAQ's role in PQC?
**A4:** **Jack Hidary** founded the quantum group at Alphabet that became SandboxAQ. The company is a **PQC Alliance founding member** and deployed AQtive Guard to the Pentagon. See [Leaders](/leaders?leader=Jack%20Hidary).

**Q5:** What sectors can you filter leaders by?
**A5:** The [Leaders page](/leaders) supports three sector filters: **Public** (government agencies), **Private** (industry vendors), and **Academic** (university researchers). Combine with country and text search.

**Q6:** Who published the UK's PQC migration roadmap?
**A6:** **Ollie Whitehouse**, the first-ever NCSC CTO, published the UK's 3-phase PQC migration roadmap with a 2035 deadline. See his profile at [Leaders](/leaders?leader=Ollie%20Whitehouse).

**Q7:** What did Germany's BSI achieve with quantum-secure ID cards?
**A7:** Under **Claudia Plattner**'s leadership, BSI produced the **world's first quantum-secure ID card** in November 2025. See [Leaders](/leaders?leader=Claudia%20Plattner).

**Q8:** Who is Lily Chen and what is her contribution?
**A8:** **Lily Chen** at NIST has 30+ years of cryptography experience and is a co-architect of the NIST PQC standardization process alongside Dustin Moody. See [Leaders](/leaders?leader=Lily%20Chen).

**Q9:** What is Panos Kampanakis's contribution to PQC?
**A9:** **Panos Kampanakis** at AWS architected AWS's PQC strategy, including ML-KEM integration in FIPS 140-3 validated modules. See [Leaders](/leaders?leader=Panos%20Kampanakis).

**Q10:** How many PQC leaders does the platform profile?
**A10:** The [Leaders page](/leaders) profiles **50+ global PQC leaders** across government, industry, and academia from 15+ countries, organized by sector and searchable by name, country, or contribution area.

---

## 12. Learn (`/learn`)

**Q1:** How are the 25 learning modules organized?
**A1:** Modules are organized into tracks: **Fundamentals** (PQC 101, Quantum Threats, Hybrid Crypto, Crypto Agility, TLS Basics), **Infrastructure & Protocols** (VPN/SSH, Email Signing, PKI Workshop, Code Signing), **Advanced Cryptography** (Key Management, Stateful Signatures, Entropy, Merkle Tree Certs, QKD), **Domain Applications** (5G, Digital Assets, Digital ID, API Security, IoT/OT), and **Enterprise/Executive** (Compliance Strategy, Migration Program, Risk Management, Business Case, Governance). Browse all at [Learn](/learn).

**Q2:** What tabs does each learning module have?
**A2:** Each module has up to 5 tabs: **Learn** (introduction/theory), **Workshop** (interactive exercises), **Exercises** (scenario challenges), **References** (related Library standards), and **Tools** (relevant Migrate products). Example: [PQC Governance Workshop](/learn/pqc-governance?tab=workshop).

**Q3:** How many quiz questions are available and how are they organized?
**A3:** The [Quiz](/learn/quiz) has **470 questions** across **32 categories** — one per module plus cross-module combinations. Questions are sourced from a versioned CSV and support adaptive difficulty.

**Q4:** What does the QKD module's BB84 simulator demonstrate?
**A4:** The [QKD module](/learn/qkd?tab=workshop) includes a configurable **BB84 protocol simulator** with an Eve interception slider — you can adjust the eavesdropper's interception rate and observe how it affects the quantum bit error rate and key generation success.

**Q5:** What does the IoT/OT module cover about energy constraints?
**A5:** The [IoT/OT module](/learn/iot-ot-pqc?tab=learn) covers energy budgets for PQC on battery devices, recommending **PSK session resumption** over repeated full handshakes to reduce power consumption. It also covers Ascon lightweight crypto and secure elements (ARM TrustZone-M, Infineon OPTIGA TPM).

**Q6:** What interactive tool does the Compliance Strategy module provide?
**A6:** The [Compliance Strategy module](/learn/compliance-strategy?tab=workshop) includes a **Jurisdiction Mapper** covering 24 jurisdictions across 4 regions, with conflict detection for China's OSCCA algorithms and early-deadline flagging for Australia, Taiwan, and Czech Republic.

**Q7:** What is the PQC Governance module's RACI builder?
**A7:** The [PQC Governance module](/learn/pqc-governance?tab=workshop) includes a **RACI Builder** with 10 activities and click-to-cycle cells (R→A→C→I→empty). It validates that every activity has an Accountable assignment and includes a 4-level escalation framework.

**Q8:** What does the Entropy & Randomness module teach?
**A8:** The [Entropy module](/learn/entropy-randomness?tab=learn) covers **NIST SP 800-90** series, random number generation, entropy sources, DRBG (Deterministic Random Bit Generator), and includes an interactive **Entropy Testing Demo** for evaluating randomness quality.

**Q9:** Which modules are recommended for executives?
**A9:** The executive track includes: [PQC Governance](/learn/pqc-governance), [PQC Business Case](/learn/pqc-business-case), [PQC Risk Management](/learn/pqc-risk-management), [Compliance Strategy](/learn/compliance-strategy), and [Migration Program](/learn/migration-program). These focus on business impact, ROI, and regulatory timelines.

**Q10:** What does the Digital Assets module cover?
**A10:** The [Digital Assets module](/learn/digital-assets?tab=learn) covers quantum threats to cryptocurrency and blockchain — including Bitcoin's vulnerable P2PK addresses, Ethereum's PQC research fund, private key management, and PQC-safe blockchain protocols.

**Q11:** What does the API Security & JWT module teach?
**A11:** The [API Security module](/learn/api-security-jwt?tab=learn) covers JSON Web Tokens, API authentication, **ML-DSA for JWS** (JSON Web Signature), and hybrid JWT approaches for PQC transition in web APIs.

**Q12:** How does the Code Signing module relate to firmware security?
**A12:** The [Code Signing module](/learn/code-signing?tab=learn) covers software integrity, firmware signing with ML-DSA and SLH-DSA, container image signing, and timestamp services. It connects to the [Stateful Signatures module](/learn/stateful-signatures?tab=learn) for LMS/HSS firmware use cases.

**Q13:** What does the Vendor Risk module assess?
**A13:** The [Vendor Risk module](/learn/vendor-risk?tab=learn) evaluates third-party cryptographic dependencies — supplier PQC roadmaps, contract requirements, migration timeline alignment, and supply chain security for cryptographic components.

**Q14:** How many exercises does the IoT/OT module now have?
**A14:** The [IoT/OT module](/learn/iot-ot-pqc?tab=exercises) now has **5 exercises** including the new **Certificate Chain Bloat Analyzer** (Exercise 4) which demonstrates reducing a ~22 KB ML-DSA-65 chain to ~3 KB using Merkle Tree Certificates and compression.

**Q15:** What learning progression system does PQC Today use?
**A15:** PQC Today uses a **judo belt grading system** (White through Black belt) tracked via the ScoreCard on the [Landing page](/). Progress is persisted across sessions via the module store, and the [Quiz](/learn/quiz) covers all 25 modules with 470 questions across 32 categories.

---

## 13. About (`/about`)

**Q1:** What cryptographic libraries does PQC Today's SBOM list?
**A1:** The [About page](/about) SBOM lists: **OpenSSL WASM v3.6.0** (primary), **@oqs/liboqs-js v0.15.1** (PQC via liboqs), **@noble/curves** (secp256k1, Ed25519), **@scure/bip32 and bip39** (HD wallets), **micro-eth-signer** (Ethereum), and **ed25519-hd-key**. Web Crypto API handles X25519 and P-256.

**Q2:** What is PQC Today's data privacy policy?
**A2:** PQC Today is a **static site with no backend or database**. There is no data collection, no cookies, no tracking, and no third-party services. All persistence is **localStorage only** and all cryptography runs **client-side via WASM**. See [About](/about).

**Q3:** What security audit results does the About page show?
**A3:** The [About page](/about) shows the latest security audit: **0 production vulnerabilities**, with dev-only findings (ESLint toolchain ReDoS vulnerabilities in minimatch and ajv) that don't affect the deployed application.

**Q4:** What license does PQC Today use?
**A4:** PQC Today is licensed under **GPL-3.0** (GNU General Public License v3.0). The full license and source code are linked from the [About page](/about).

**Q5:** How does the PQC Assistant work?
**A5:** The PQC Assistant uses **RAG (Retrieval-Augmented Generation)** with a corpus of ~1,900 chunks aggregated from 22 data sources, combined with **Gemini 2.5 Flash** for response generation. It requires a user-provided Google API key (BYOK model). See [About](/about).

**Q6:** What are the PQC Assistant's three core capabilities?
**A6:** **Grounded Answers** (responses backed by retrieved corpus data), **Deep Linking** (every named item links to the exact app page/tab/step), and **PQC Domain Expertise** (trained on the full platform content). See [About](/about).

**Q7:** What testing frameworks does PQC Today use?
**A7:** **Vitest** for unit tests (with @testing-library/react), **Playwright** for E2E tests (Chromium, Firefox, WebKit), and **axe-playwright** for accessibility testing. Coverage thresholds are 70% lines/functions/statements and 60% branches. See [About](/about).

**Q8:** What UI framework and version does PQC Today use?
**A8:** PQC Today uses **React v19** with **Tailwind CSS v4** for styling, **Framer Motion** for animations, **Lucide React** for icons, and **React Router v7** for client-side routing. Full SBOM at [About](/about).

**Q9:** What AI tools were used in developing PQC Today?
**A9:** The [About page](/about) acknowledges use of **Google Antigravity**, **ChatGPT**, **Claude AI**, **Perplexity**, and **Gemini Pro** in the development process.

**Q10:** What build tools does PQC Today use?
**A10:** PQC Today uses **Vite** as the build tool with **TypeScript** in strict mode, **ESLint v9** (flat config with security plugin), and **Prettier** for formatting. Pre-commit hooks via **Husky + lint-staged** auto-format staged files. See [About](/about).
