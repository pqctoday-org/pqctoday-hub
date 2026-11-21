# Custody PQC Migration — In Simple Terms

## What This Is About

A future quantum computer capable of breaking elliptic-curve cryptography does not just threaten blockchain addresses — it also threatens the encrypted channels, backup envelopes, and hardware attestation chains that surround a custody platform. This module explains what changes for HSMs, MPC clusters, enclaves, Shamir seed backups, hardware wallets, and smart accounts, and which parts a custodian can migrate today without waiting for blockchains to upgrade.

## Why It Matters

None of today’s custody architectures is quantum-safe on its own. Classical threshold MPC still outputs an ordinary elliptic-curve signature, share backups encrypted under RSA or ECDH can be harvested today and decrypted later, and no NIST-standardised post-quantum threshold signature exists yet. Waiting for Bitcoin or Ethereum to adopt post-quantum consensus leaves platform-controlled secrets and long-lived recovery envelopes unnecessarily exposed.

## The Key Takeaway

Separate your custody stack into three clocks: **platform-controlled** (channels, share backups, approval signatures — fix harvest-now-decrypt-later risks today with hybrid ML-KEM and move control-plane signing to ML-DSA), **account-controlled** (smart accounts can test hybrid PQ verification while watching residual classical keys), and **chain-controlled** (track protocol proposals without betting on unfinalised dates).

## What's Happening

In the interactive labs, you inspect what a quantum attacker breaks first across HSM, MPC, and enclave stacks, classify 15 custody components into migration phases and export a CSV/Markdown plan, explore how Shamir secret sharing compares to SLIP-39 encoding and hybrid KEM-DEM backup envelopes, and dissect hardware wallet "quantum-ready" claims into four distinct parts.
