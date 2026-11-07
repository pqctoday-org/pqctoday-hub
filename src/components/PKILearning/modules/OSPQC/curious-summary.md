# OS Cryptography PQC — In Simple Terms

## What This Is About

Modern operating systems have a deep cryptographic stack. When you upgrade the system's foundational TLS configurations (like OpenSSL), those quantum protections automatically cascade to every tool and application running on the OS.

## Why It Matters

System TLS traffic and SSH sessions can be recorded today and decrypted later ("Harvest Now, Decrypt Later", HNDL) if their key exchange is classical-only. A post-quantum key exchange is the control for that, and it protects only the sessions that negotiate it. The SSH host key is a separate matter: a future quantum computer able to forge its signature could let an attacker impersonate your server in later connections, but it would not decrypt sessions that were already recorded, so host keys are retired before such a computer exists rather than to stop HNDL.

## The Key Takeaway

While upgrading a system's TLS is as simple as a configuration change (like enabling `X25519MLKEM768`), moving OS package signing (like RPM or DEB files) to post-quantum signatures is harder, because the signing server, repository metadata, and every end-user client must support the new signature. Red Hat has started signing RHEL 10.1 packages with a hybrid ML-DSA-87 + Ed448 key next to its RSA key, so clients that cannot check the new signature still check the old one; this lesson cites no equivalent for DEB.

## What's Happening

Operating system vendors are adding post-quantum support in stages. Microsoft's November 2025 Windows update added API support for the ML-KEM and ML-DSA algorithms (FIPS 203 and FIPS 204), and its July 14, 2026 update for Windows Server 2025 (KB5099536) added hybrid post-quantum key exchange to TLS 1.3. Microsoft's documentation lists the new key exchange groups as disabled by default, so an administrator turns them on, for example with Group Policy.
