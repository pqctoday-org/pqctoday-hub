// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What the MovieLabs Specification for Enhanced Content Protection (ECP), Version 1.4
 * (August 2024), asks for. Library: `MovieLabs-ECP-v1-4`.
 *
 * Each entry restates one group of requirements as the document words them; the
 * document says "shall", so the lesson says "asks that". ECP describes itself as a set of
 * high-level specifications and says each studio decides which practices it requires, so
 * none of this is a rule that binds a service by itself.
 */

export interface EcpPractice {
  id: string
  group: 'Threat' | 'DRM system' | 'Platform' | 'Operator' | 'Certification'
  title: string
  text: string
  where: string
}

export const ECP_EDITION = 'MovieLabs Specification for Enhanced Content Protection, Version 1.4'
export const ECP_DATE = 'August 2024'

export const ECP_STATUS_NOTE =
  'ECP describes itself as a set of high-level specifications from MovieLabs, and each studio decides individually which practices are prerequisites to the distribution of its content in any particular situation.'

export const ECP_PRACTICES: EcpPractice[] = [
  {
    id: 'hack-one-hack-all',
    group: 'Threat',
    title: '“Hack one, hack all”',
    text: 'ECP describes ripping software as enabled by two “hack one, hack all” scenarios. Breaking protection on one device, for example a PC and drive combination or a mobile streaming device, breaks it on a wide class of devices.',
    where: 'Problems/Threats',
  },
  {
    id: 'platform-limit',
    group: 'DRM system',
    title: 'Limit a compromise to one platform',
    text: 'The MovieLabs ECP specification says that the compromise of security on one platform shall be limited to that platform.',
    where: 'DRM System Specifications, “Hack One, Only Hack One”',
  },
  {
    id: 'device-binding',
    group: 'DRM system',
    title: 'Bind license keys to a device',
    text: 'ECP asks that license keys be encrypted so that they cannot be decrypted without the keys of the individual device the license was issued for, and that compromising the keys of a set of devices not make it easier to derive the keys of another device.',
    where: 'DRM System Specifications, “Binding to Device”',
  },
  {
    id: 'revoke-renew',
    group: 'DRM system',
    title: 'Revoke and renew',
    text: 'ECP asks that the system be able to revoke and renew versions of its client component and to revoke individual devices or classes of devices.',
    where: 'DRM System Specifications, “Revocation & Renewal”',
  },
  {
    id: 'cipher',
    group: 'DRM system',
    title: 'Content cipher',
    text: 'ECP names a cipher of “AES 128 or better” for the system and asks the platform to support a content cipher of AES 128 or better.',
    where: 'DRM System Specifications, “Cryptography”; Platform Specifications, “Encryption”',
  },
  {
    id: 'secure-pipeline',
    group: 'Platform',
    title: 'Secure media pipeline',
    text: 'ECP asks the platform to implement a secure media pipeline that protects secrets and video end to end, from decryption through to protected output.',
    where: 'Platform Specifications, “Secure Media Pipeline”',
  },
  {
    id: 'hdcp',
    group: 'DRM system',
    title: 'Output protection',
    text: 'ECP asks that the system support a requirement of HDCP 2.2 or better for specific content types, such as Ultra HD or enhanced HD, and a requirement set by the content provider, for example in the license.',
    where: 'DRM System Specifications, “Outputs & Link Protection”',
  },
  {
    id: 'watermark',
    group: 'Platform',
    title: 'Forensic watermarking',
    text: 'ECP asks that the system be able to securely forensically mark video at the server and/or client to recover information necessary to address breaches.',
    where: 'End-to-End System Specifications, “Forensic Watermarking”',
  },
  {
    id: 'dev-production',
    group: 'Platform',
    title: 'Development code stays off production units',
    text: 'ECP asks that development code be securely prevented from running on production units, for example by revoking the signing certificate or by using a different root certificate and hardware root of trust.',
    where: 'End-to-End System Specifications',
  },
  {
    id: 'operator-keys',
    group: 'Operator',
    title: 'Separate content keys',
    text: 'ECP asks that content protected at ECP level use content encryption keys different from those used for content protected below ECP level.',
    where: 'End-to-End System Specifications, “Operator Practices”',
  },
  {
    id: 'operator-cdn',
    group: 'Operator',
    title: 'Content off public CDNs until needed',
    text: 'ECP asks that content not be placed on publicly accessible CDNs earlier than is necessary operationally for deployment and testing; its example is no earlier than two days before the release date.',
    where: 'End-to-End System Specifications, “Operator Practices”',
  },
  {
    id: 'operator-updates',
    group: 'Operator',
    title: 'Restrict content when updates stop',
    text: 'ECP asks that the system give operators the ability to restrict content when devices stop receiving DRM-related security updates.',
    where: 'DRM System Specifications, “Revocation & Renewal”',
  },
  {
    id: 'certification',
    group: 'Certification',
    title: 'Third-party certification',
    text: 'ECP asks that the compliance of the system and the robustness of its implementation be certified by a combination of third parties and trusted implementers, and that forensic watermarks be tested for robustness by a third party.',
    where: 'End-to-End System Specifications, “Certification”',
  },
]

export const ECP_GROUPS: EcpPractice['group'][] = [
  'Threat',
  'DRM system',
  'Platform',
  'Operator',
  'Certification',
]
