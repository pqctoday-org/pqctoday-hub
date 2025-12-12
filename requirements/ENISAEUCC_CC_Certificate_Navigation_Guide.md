# CC Certificate & Security Target Navigation Guide

Instructions to manually access Common Criteria certificates and Security Targets from ANSSI and ENISA portals.

---

## ANSSI (French National Scheme)

### Main Certified Products Page

**URL:** `https://cyber.gouv.fr/decouvrir-les-solutions-certifiees`

**Navigation path:**

1. Go to `https://cyber.gouv.fr`
2. Click **"Développer des solutions de confiance"**
3. Click **"Trouver un produit/service de sécurité évalué"**
4. Click **"Découvrir les solutions certifiées"**

This page lists CC and CSPN certified products with links to:

- Certification Reports (Rapport de certification)
- Security Targets (Cible de sécurité)

---

### ANSSI PDF Catalog (Qualified/Certified Products)

**Direct download URL:**

```
https://cyber.gouv.fr/sites/default/files/document/catalogue-produits-services-qualifies-agrees-certifies-anssi.pdf
```

**Navigation path:**

1. Go to `https://cyber.gouv.fr/decouvrir-les-solutions-qualifiees`
2. Scroll down to find the PDF link: **"Catalogue des produits et services qualifiés agréés certifiés"**

---

### Individual Certificate Document URL Patterns

Once you have a certificate ID (e.g., `ANSSI-CC-2024/10`), documents are typically at:

| Document            | URL Pattern                                                                          |
| ------------------- | ------------------------------------------------------------------------------------ |
| **Report (FR)**     | `https://cyber.gouv.fr/sites/default/files/document_type/ANSSI-CC-2024_10fr.pdf`     |
| **Report (EN)**     | `https://cyber.gouv.fr/sites/default/files/document_type/ANSSI-CC-2024_10en.pdf`     |
| **Security Target** | `https://cyber.gouv.fr/sites/default/files/document_type/cible-anssi-cc-2024_10.pdf` |

For CSPN certificates, replace `CC` with `CSPN`.

---

## ENISA EUCC Portal (European Scheme)

### Main Certificates Listing

**URL:** `https://certification.enisa.europa.eu/certificates_en`

**Navigation path:**

1. Go to `https://certification.enisa.europa.eu`
2. Click **"Certificates"** in the top menu

This page lists all EUCC certificates issued across EU member states.

---

### Individual Certificate Pages

Each certificate has a dedicated page with download links:

**URL pattern:**

```
https://certification.enisa.europa.eu/certificates/{certificate-id}_en
```

**Examples:**

- `https://certification.enisa.europa.eu/certificates/eucc-anssi-2025-3-1_en`
- `https://certification.enisa.europa.eu/certificates/eucc-anssi-2025-3-2_en`
- `https://certification.enisa.europa.eu/certificates/eucc-3095-2025-07-01_en`

On each certificate page, you'll find direct download links for:

- **Certificate** (PDF)
- **Security Target** (PDF)
- **Certification Report** (PDF)

---

## Summary Table

| Source                | List URL                                                                                                              | What You Get                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **ANSSI CC/CSPN**     | `https://cyber.gouv.fr/decouvrir-les-solutions-certifiees`                                                            | Certified products with document links    |
| **ANSSI Catalog PDF** | `https://cyber.gouv.fr/sites/default/files/document/catalogue-produits-services-qualifies-agrees-certifies-anssi.pdf` | Full catalog (PDF download)               |
| **ENISA EUCC**        | `https://certification.enisa.europa.eu/certificates_en`                                                               | EU certificates with direct PDF downloads |

---

_Last updated: December 2025_
