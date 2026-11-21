# Custody Key Threats & Controls — In Simple Terms

## What This Is About

Keeping a digital-asset private key locked inside hardware does not stop theft if an attacker can trick people or software into signing the wrong transaction. This module shows who can actually make a custody system sign today, how real incidents succeeded without stealing a raw key, and which combinations of controls stop them.

## Why It Matters

Standard hardware security module APIs such as PKCS#11 `C_Sign` sign whatever 32-byte digest an authorized session sends them — they do not read blockchain smart-contract calls or judge whether a payee is safe. Meanwhile, browser screens can be tampered with, pre-signed authorizations can stay valid long after an emergency shutdown, and AI agents can be tricked into spending funds unless limits sit inside the signing boundary.

## The Key Takeaway

Security comes from putting transaction decoding, policy checks, and quorum approvals inside a protected boundary, and from stating exactly which authorities — signers, approver screens, recovery quorums, and upgrade keys — an attacker must not control.

## What's Happening

In the interactive labs, you test blind signing against clear signing plus policy enforcement in a browser HSM emulator, gate a classical signature behind post-quantum `ML-DSA-65` quorum approvals with nonce and expiry checks, run a live 2-of-3 RFC 9591 FROST threshold signature where parties enforce independent local policies, and scope an AI agent wallet against prompt injection and runaway loops.
