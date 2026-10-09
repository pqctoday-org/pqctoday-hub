# OT & Industrial Control Systems PQC — In Simple Terms

## What This Is About

Power grids, pipelines, water plants, railways, factories and big buildings are run by industrial computers — controllers that open breakers, move valves and set temperatures. This module is about keeping those systems trustworthy once quantum computers can break today's public-key cryptography.

## Why It Matters

In these systems the scariest quantum attack is not reading old messages. It is forgery: a quantum computer could fake the digital signatures that tell a controller "this software update really came from the manufacturer" or "this command really came from the control room". Controllers stay in service for 20 years or more, so the keys they trust have to be replaced long before that becomes possible.

## How Attackers Get In

There are three ways into these systems. Most attacks start in the company's office network and work their way down into the plant, so protecting the office side protects the plant too. Others come in through remote connections, such as vendor support links and internet-connected sensors, which should all pass through one guarded entry point. The last way is physical: someone on site or nearby, where most of the equipment checks nothing at all about who is sending it commands.

## The Key Takeaway

The fastest messages — like the 3-millisecond trip signals inside a substation — are already protected with symmetric codes that quantum computers don't break, so they stay as they are. The work is in the slower parts around them: the keys that sign firmware and configurations, the certificates that identify devices, and the remote-access links into the plant.

## What's Happening

Industrial standards such as IEC 62443 don't mention post-quantum cryptography yet, and protocols like OPC UA, BACnet/SC and DNP3 have no quantum-safe options published. Operators are starting with an inventory, moving their signing keys to new schemes such as LMS and ML-DSA, and protecting remote access with hybrid key exchange while the standards catch up.
