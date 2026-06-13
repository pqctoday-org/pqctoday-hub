### What This Is About

PQC migration does not end when the certificates are swapped. The Security Operations Center inherits a permanent new job: making sure migrated systems stay migrated, that hybrid connections are not quietly knocked back to old cryptography, and that the organization is ready for the next algorithm transition after this one. This module shows SOC directors and analysts how to build that capability on the SIEM, network monitoring, and certificate tools they already own.

### Why It Matters

There are five things a quantum-aware SOC watches for: a hybrid connection being forced back to classical crypto (a downgrade attack), systems drifting back to old algorithms after migration, suspicious activity around new post-quantum certificates, forged digital signatures (Trust Now, Forge Later), and adversaries quietly harvesting long-lived encrypted data to decrypt once a quantum computer exists (Harvest Now, Decrypt Later). None of it works without one prerequisite: a live, machine-readable registry that records what cryptography each system is supposed to be using. If that registry is a quarterly spreadsheet emailed around, every detection rule falls apart.

### The Key Takeaway

The SOC builds detection on what it already has, then layers on quantum threat intelligence across three time horizons (hours, weeks, years), four incident-response playbooks, and annual tabletop exercises with names like "The Friday Afternoon CVE" and "Signing Key Compromise." The single biggest enabler is the cryptographic posture registry; the single biggest engineering hurdle is teaching the SIEM to recognize post-quantum key exchanges, which are negotiated by codepoints most tools cannot yet parse.

### What's Happening

SOC teams are negotiating SIEM-integrated access to the migration program's cryptographic posture registry, writing custom rules to spot hybrid-downgrade attacks while filtering out their own middleboxes' false alarms, subscribing to the NIST PQC mailing list and IETF working groups for tactical threat intelligence, and running tabletop exercises to pressure-test their quantum incident-response playbooks before a real CVE lands at 16:30 on a Friday.
