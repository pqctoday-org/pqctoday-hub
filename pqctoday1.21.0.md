# PQC Today: The Most Ambitious Open-Source Quantum-Readiness Platform I've Seen

**By a Cybersecurity Correspondent** | February 2026

---

## What Is It?

PQC Today is a free, open-source web application that attempts something audacious: to be a one-stop platform for understanding, planning, and hands-on experimenting with post-quantum cryptography. Built as a React single-page application running entirely in the browser, it combines educational content, real cryptographic operations (via OpenSSL 3.6.0 compiled to WebAssembly), migration planning tools, and live compliance tracking into a single cohesive experience.

It targets four personas — executives and CISOs, developers, architects, and researchers — and dynamically adapts its interface to surface what's most relevant to each.

---

## The Scope Is Staggering

Let me walk through what's packed into this platform, because the breadth genuinely surprised me:

**14 Learning Modules** organized into five tracks (Foundations, Strategy, Protocols, Infrastructure, Applications), each following a learn-then-simulate-then-exercise progression. Topics range from PQC 101 all the way to 5G SUCI deconcealment with ML-KEM-768 and blockchain address derivation for Bitcoin, Ethereum, and Solana. A 162-question quiz engine with smart sampling across eight categories rounds out the educational offering.

**OpenSSL Studio** — and this is where things get remarkable — runs a full OpenSSL v3.6.0 instance in the browser via WASM. Users can generate ML-KEM, ML-DSA, and SLH-DSA keypairs, build certificate chains, create PKCS#12 bundles, and perform LMS/HSS stateful signature operations. There's a virtual file system, command history, and ZIP backup/restore. No server. No install. Everything runs client-side.

**A Cryptographic Playground** for ML-KEM encapsulation/decapsulation, hybrid KEM operations, signature generation, hashing, and ACVP test vector validation — with real-time timing benchmarks color-coded by performance.

**A Global Migration Timeline** visualized as a Gantt chart showing country-specific PQC regulatory deadlines and migration phases, filterable by region.

**A Threat Dashboard** cataloguing 80 quantum threats across 20 industries, with HNDL (Harvest Now, Decrypt Later) risk window calculations and criticality ratings.

**A Migration Planner** tracking 193 verified PQC-ready products across a seven-layer infrastructure stack (from hardware secure elements up to cloud platforms), with category filtering and PQC support status.

**A 13-Step Risk Assessment Wizard** that produces a personalized quantum risk score across four dimensions (Quantum Exposure, Migration Complexity, Regulatory Pressure, Organizational Readiness), with PDF/print export, URL sharing, and CSV export.

**Live Compliance Tracking** for FIPS 140-3, ACVP, and Common Criteria certifications, scraped daily from authoritative sources.

**A Standards Library** with 232+ documents from NIST, IETF, ETSI, 3GPP, BSI, ANSSI, and others, with cascading filters and hierarchical document relationships.

**A Leaders Grid** profiling 100+ verified PQC thought leaders by country, sector, and contributions.

---

## What It Does Well

**The crypto actually works.** This isn't a slideware demo with fake outputs. The OpenSSL WASM integration means users are running real cryptographic operations — the same OpenSSL that powers production infrastructure — right in their browser tab. I generated ML-DSA-65 keypairs, signed data, verified signatures, and built a PQC certificate chain without leaving the page. For security professionals who learn by doing, this is invaluable.

**The pedagogical design is thoughtful.** Each learning module follows a consistent learn → simulate → exercise arc. The TLS module doesn't just explain the handshake — it simulates one with PQC key exchange. The PKI module doesn't just describe certificate chains — it has you build one. The 5G module walks through SUCI deconcealment. This is the difference between reading about PQC and understanding it.

**The assessment wizard is genuinely useful for enterprise teams.** It asks the right questions (what crypto are you running? what's your data retention period? what compliance frameworks apply?) and produces actionable output: a compound risk score, algorithm-specific migration urgency levels, and a compliance gap analysis. The "I don't know" escape hatches on every question are a smart UX choice — they acknowledge the reality that most organizations don't have complete crypto inventories yet.

**The migration planner fills a real gap.** Tracking which HSMs, KMS platforms, TLS libraries, and cloud services support which PQC algorithms is tedious, fragmented work. Having 193 products organized by infrastructure layer with PQC support status (Yes/Limited/Planned/No) in one filterable view is the kind of tool migration teams actually need.

**It respects the user's time.** The persona system isn't gimmicky — it genuinely surfaces different content for a CISO (risk scores, compliance, timelines) versus a developer (playground, OpenSSL studio, algorithm specs). The Quick vs. Comprehensive assessment modes (2 minutes vs. 5 minutes) show awareness that different users have different depth requirements.

**Data quality is high.** The compliance data is scraped from authoritative sources on a daily schedule. The algorithm specifications match NIST FIPS 203/204/205. The timeline data includes real regulatory deadlines with source citations. The threat data includes HNDL risk window calculations. This isn't generic "quantum is coming" content — it's specific, cited, and current.

---

## What I'd Want to See Improved

**No collaborative or team features.** The assessment results, learning progress, and migration plans all live in browser localStorage. For an enterprise tool, there's no way to share an assessment across a team, track organizational progress, or compare risk scores across business units. Even a simple export-and-import workflow for assessment results would help (CSV export exists, but a structured JSON round-trip for team sharing would be more useful).

**The learning modules lack a clear completion pathway.** While individual module progress is tracked, there's no overarching "PQC certification" or structured learning path that guides users from beginner to advanced. The five tracks exist but feel loosely coupled. A guided curriculum with prerequisites and a final capstone assessment would transform this from "a collection of excellent modules" into "a PQC training program."

**Threat modeling could go deeper.** The 80 threats across 20 industries are useful as awareness tools, but they don't connect to the user's actual environment. Integrating the threat data with the assessment wizard — so that after completing an assessment, users see "here are the 12 threats most relevant to your industry, crypto stack, and data retention profile" — would make both features more powerful.

**No API or integration story.** For organizations that want to embed PQC readiness checks into their CI/CD pipelines, security dashboards, or GRC platforms, there's no programmatic interface. A REST API or even a CLI tool that runs the assessment engine headlessly would open up enterprise adoption significantly.

**The compliance module could surface trends.** Right now it shows current certification status. Showing how the number of PQC-validated modules has grown over time, which vendors are leading, and which algorithm families are getting the most validation activity would add analytical value beyond the raw data.

**Mobile experience is functional but cramped.** The Gantt charts, algorithm comparison tables, and OpenSSL studio are inherently desktop-oriented. While responsive views exist (list views on mobile, for example), the power-user features that make this platform special are best experienced on a large screen. This limits its utility for executives reviewing assessment results on a phone, or engineers doing quick lookups in the field.

**No offline mode.** Given that the entire crypto stack runs client-side via WASM, this platform is tantalizingly close to working offline. A service worker with proper caching could make this a fully offline-capable PWA — useful for air-gapped environments or conference demos without reliable Wi-Fi.

---

## The Bottom Line

PQC Today occupies a unique position in the quantum-readiness landscape. Commercial offerings from the major consulting firms charge five- and six-figure sums for PQC readiness assessments that often amount to a questionnaire and a PDF. NIST's own resources are authoritative but fragmented across dozens of publications. Vendor-specific tools only cover their own product ecosystems.

This platform does something none of those do: it puts real PQC cryptography in the user's hands, wraps it in structured education, connects it to live compliance data, and produces actionable migration plans — all for free, all open-source, all running in the browser with zero server dependencies.

Is it enterprise-ready? Not quite. The lack of team collaboration, SSO, and audit trails means it's a planning and education tool, not a GRC platform. But for the security architect who needs to understand ML-KEM encapsulation, the CISO who needs a quantum risk score for the board, or the developer who wants to test PQC certificate chains before touching production infrastructure — this is the best free tool available today.

The PQC migration is a decade-long industry transformation. Tools like this, which democratize access to knowledge and hands-on experience, will determine how smoothly that transition goes.

**Rating: 4.2 / 5**

_PQC Today is available at its GitHub Pages deployment under GPL-3.0 license._
