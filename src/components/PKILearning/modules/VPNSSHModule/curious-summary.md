# VPN/IPsec & SSH — In Simple Terms

## What This Is About

When you work from home and connect to your company's network, you probably use a VPN — a Virtual Private Network. Think of it as a private tunnel through the public internet. Everything traveling through that tunnel is encrypted, so even if someone is watching the highway of internet traffic, they cannot see what is inside your tunnel.

SSH is a similar idea but for a different purpose. System administrators use SSH to remotely control servers and computers — like reaching through the internet to type commands on a machine in a data center miles away. SSH creates its own encrypted tunnel to keep those commands and responses private.

Both VPN and SSH rely on the same types of encryption that quantum computers threaten. The "tunnel walls" are built using math problems that a powerful quantum computer could solve, which would be like making the tunnel walls transparent — anyone with a quantum computer could see right through them.

IPsec is the technical standard that most business VPNs use under the hood. It handles the details of how the tunnel is built, how the two sides prove their identity to each other, and how the encryption keys are created and refreshed.

## Why It Matters

VPNs and SSH are everywhere. Millions of remote workers depend on VPNs every day. Nearly every server on the internet is managed through SSH. Corporate networks, government agencies, hospitals, and military systems all use these tools to protect their most sensitive communications and operations.

If these tunnels become transparent to quantum computers, attackers could intercept remote work sessions, steal administrative access to critical servers, or eavesdrop on internal corporate communications. Data captured from VPN and SSH sessions today could be stored and decrypted once quantum computers are available.

## The Key Takeaway

VPNs and SSH are the secure tunnels that connect remote workers, manage critical systems, and protect sensitive communications worldwide. Upgrading these tunnels to use quantum-safe encryption is urgent because they carry some of the most valuable data in any organization.

## What's Happening

Open-source SSH implementations, like OpenSSH, have already added support for quantum-safe key exchange methods. VPN vendors are beginning to test and certify quantum-safe versions of IPsec. NIST's new encryption standards provide the algorithms these tools need. Several governments have identified VPN and SSH upgrades as early priorities in their quantum transition plans, and testing is underway in defense and financial networks.
