const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, 'SVG')

const layers = [
  {
    folder: 'Cloud',
    color: '#06B6D4',
    components: [
      'Cloud KMS',
      'Cloud HSM',
      'Encryption Gateways',
      'Crypto Agility',
      'KMS',
      'IAM',
      'Crypto Discovery',
      'Digital Identity',
    ],
  },
  {
    folder: 'Network',
    color: '#3B82F6',
    components: [
      'VPN',
      'IPsec',
      'Network Security',
      'Network Encryptors',
      'Protocol Analyzers',
      '5G & Telecom',
      'Testing & Validation',
    ],
  },
  {
    folder: 'Application Servers',
    color: '#8B5CF6',
    components: [
      'TLS/SSL',
      'SSH',
      'Web Browsers',
      'App Servers',
      'Email',
      'Messaging',
      'Blockchain',
      'Payment',
      'VPN',
      'Remote Access',
      'CI/CD',
    ],
  },
  {
    folder: 'Libraries & SDKs',
    color: '#10B981',
    components: [
      'Cryptographic Libraries',
      'PQC Libraries',
      'API Security',
      'Code Signing',
      'Digital Signatures',
      'Disk Encryption',
      'SDKs',
    ],
  },
  {
    folder: 'Security Software',
    color: '#D946EF',
    components: [
      'Data Protection',
      'Digital Identity',
      'Secrets Management',
      'Security Discovery',
      'IoT/OT',
      'AI/ML Security',
      'Supply Chain',
    ],
  },
  { folder: 'Database', color: '#059669', components: ['Database Encryption Software'] },
  {
    folder: 'Security Stack',
    color: '#EF4444',
    components: [
      'KMS',
      'PKI',
      'Crypto & PQC Libraries',
      'CLM',
      'Secrets',
      'IAM',
      'CIAM',
      'Data Protection',
      'Crypto Discovery',
      'TLS/SSL',
      'Digital Identity',
    ],
  },
  {
    folder: 'Operating System',
    color: '#F59E0B',
    components: ['Operating Systems', 'Network OS', 'Disk & File Encryption'],
  },
  {
    folder: 'Hardware & Secure Elements',
    color: '#6B7280',
    components: [
      'HSMs',
      'Smart Cards',
      'Secure Boot',
      'Semiconductors',
      'QRNG',
      'QKD',
      'Confidential Computing',
      '5G & Telecom',
    ],
  },
]

// Solid, thick path data for 3D styling
const solidIcons = {
  key: '<path d="M14.5 2c-3.5 0-6.4 2.8-6.5 6.3l-6 6v3.7h3.7v-2h2v-2h2l1.2-1.2c1.1.4 2.3.5 3.6.1 3.2-1 4.8-4.4 3.7-7.6-1-3.2-4.4-4.8-7.6-3.7-.4.1-.7.2-1 .4M16.5 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  lock: '<path d="M17 11V7a5 5 0 0 0-10 0v4H4v11h16V11h-3zM9 7a3 3 0 0 1 6 0v4H9V7z"/>',
  server:
    '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><circle cx="6" cy="6" r="1.5" fill="#fff"/><circle cx="6" cy="18" r="1.5" fill="#fff"/>',
  user: '<path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M18 21a6 6 0 0 0-12 0h12z"/>',
  search:
    '<path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zM9.5 14C7 14 5 12 5 9.5S7 5 9.5 5 14 7 14 9.5 12 14 9.5 14z"/>',
  network:
    '<circle cx="12" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M11 9L7.5 15.5M13 9l3.5 6.5M8 18h8" stroke-width="2" stroke="currentColor" fill="none"/>',
  code: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>',
  database:
    '<path d="M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3z"/><path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8c0 1.7-3.6 3-8 3s-8-1.3-8-3z"/>',
  cpu: '<path d="M18 6V4h-2V2h-2v2h-4V2H8v2H6V2H4v2H2v2h2v4H2v2h2v4H2v2h2v2h2v2h2v-2h4v2h2v-2h2v-2h2v-2h-2v-4h2v-2h-2V6h2zm-4 10H10v-6h4v6z"/>',
  monitor:
    '<path d="M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6v2H8v2h8v-2h-2v-2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>',
  mail: '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>',
  credit_card:
    '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6h16v2H4V6zm0 10v-4h16v4H4z"/>',
  default: '<circle cx="12" cy="12" r="10"/>',
}

function getIconForComponent(name) {
  const lName = name.toLowerCase()
  if (lName.includes('kms') || lName.includes('key') || lName.includes('secrets'))
    return solidIcons.key
  if (lName.includes('identity') || lName.includes('iam') || lName.includes('ciam'))
    return solidIcons.user
  if (
    lName.includes('shield') ||
    lName.includes('protection') ||
    lName.includes('security') ||
    lName.includes('ipsec') ||
    lName.includes('tls')
  )
    return solidIcons.shield
  if (lName.includes('encrypt')) return solidIcons.lock
  if (
    lName.includes('hsm') ||
    lName.includes('server') ||
    lName.includes('gateway') ||
    lName.includes('app server')
  )
    return solidIcons.server
  if (
    lName.includes('network') ||
    lName.includes('vpn') ||
    lName.includes('5g') ||
    lName.includes('telecom')
  )
    return solidIcons.network
  if (
    lName.includes('code') ||
    lName.includes('library') ||
    lName.includes('libraries') ||
    lName.includes('sdk') ||
    lName.includes('api')
  )
    return solidIcons.code
  if (lName.includes('discovery') || lName.includes('testing') || lName.includes('analyzers'))
    return solidIcons.search
  if (lName.includes('database') || lName.includes('disk')) return solidIcons.database
  if (
    lName.includes('hardware') ||
    lName.includes('semiconductor') ||
    lName.includes('smart card') ||
    lName.includes('iot')
  )
    return solidIcons.cpu
  if (lName.includes('os') || lName.includes('operating system') || lName.includes('browser'))
    return solidIcons.monitor
  if (lName.includes('mail') || lName.includes('messaging')) return solidIcons.mail
  if (lName.includes('payment') || lName.includes('blockchain')) return solidIcons.credit_card

  return solidIcons.default
}

// Convert hex to HSL to easily generate darker/lighter 3D variants
function hexToHSL(H) {
  let r = 0,
    g = 0,
    b = 0
  if (H.length == 4) {
    r = '0x' + H[1] + H[1]
    g = '0x' + H[2] + H[2]
    b = '0x' + H[3] + H[3]
  } else if (H.length == 7) {
    r = '0x' + H[1] + H[2]
    g = '0x' + H[3] + H[4]
    b = '0x' + H[5] + H[6]
  }
  r /= 255
  g /= 255
  b /= 255
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0

  if (delta == 0) h = 0
  else if (cmax == r) h = ((g - b) / delta) % 6
  else if (cmax == g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4
  h = Math.round(h * 60)
  if (h < 0) h += 360

  l = (cmax + cmin) / 2
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)
  return { h, s, l }
}

function HSLToHex(h, s, l) {
  s /= 100
  l /= 100
  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0
  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }
  r = Math.round((r + m) * 255).toString(16)
  g = Math.round((g + m) * 255).toString(16)
  b = Math.round((b + m) * 255).toString(16)
  if (r.length == 1) r = '0' + r
  if (g.length == 1) g = '0' + g
  if (b.length == 1) b = '0' + b
  return '#' + r + g + b
}

function generate3DSvg(iconPath, baseHex, width = 64, height = 64) {
  const hsl = hexToHSL(baseHex)

  // Create realistic lighting shades
  const lightColor = HSLToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 30))
  const midColor = baseHex
  const darkColor = HSLToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 25))
  const shadowColor = HSLToHex(hsl.h, Math.max(0, hsl.s - 20), Math.max(0, hsl.l - 40))

  // The magical 3D filters: Dropshadow, Inner Bevel, and Glassy Specular
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32" width="${width}" height="${height}">
        <defs>
            <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${lightColor}" />
                <stop offset="50%" stop-color="${midColor}" />
                <stop offset="100%" stop-color="${darkColor}" />
            </linearGradient>

            <linearGradient id="specularGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
                <stop offset="20%" stop-color="#ffffff" stop-opacity="0.1" />
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </linearGradient>

            <filter id="glass3D" x="-20%" y="-20%" width="140%" height="140%">
                <!-- Drop shadow -->
                <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="${shadowColor}" flood-opacity="0.6"/>
                
                <!-- Inner glow (bevel top) -->
                <feComponentTransfer in="SourceAlpha" result="alpha"/>
                <feGaussianBlur in="alpha" stdDeviation="1" result="blur"/>
                <feOffset dx="-1" dy="-1" in="blur" result="offsetBlur"/>
                <feComposite operator="arithmetic" k2="-1" k3="1" in2="alpha" in="offsetBlur" result="invGlow"/>
                <feFlood flood-color="#ffffff" flood-opacity="0.9" result="glowColor"/>
                <feComposite operator="in" in="glowColor" in2="invGlow" result="topGlow"/>

                <!-- Inner shadow (bevel bottom) -->
                <feOffset dx="2" dy="2" in="blur" result="offsetBlurBottom"/>
                <feComposite operator="arithmetic" k2="-1" k3="1" in2="alpha" in="offsetBlurBottom" result="invShadow"/>
                <feFlood flood-color="${shadowColor}" flood-opacity="0.8" result="shadowColorIn"/>
                <feComposite operator="in" in="shadowColorIn" in2="invShadow" result="bottomShadow"/>

                <!-- Combine -->
                <feMerge>
                    <feMergeNode in="SourceGraphic"/>
                    <feMergeNode in="topGlow"/>
                    <feMergeNode in="bottomShadow"/>
                </feMerge>
            </filter>
        </defs>

        <!-- Base 3D shape -->
        <g filter="url(#glass3D)" fill="url(#mainGrad)">
            ${iconPath}
        </g>
        
        <!-- Glass specular highlight on top -->
        <g fill="url(#specularGrad)">
            ${iconPath}
        </g>
    </svg>`
}

layers.forEach((layer) => {
  const layerDir = path.join(outDir, layer.folder.replace(/[^a-zA-Z0-9]/g, '_'))
  if (!fs.existsSync(layerDir)) {
    fs.mkdirSync(layerDir, { recursive: true })
  }

  layer.components.forEach((comp) => {
    const safeName = comp
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
    const iconPath = getIconForComponent(comp)
    const svgContent = generate3DSvg(iconPath, layer.color)

    fs.writeFileSync(path.join(layerDir, `${safeName}.svg`), svgContent)
    console.log(`Generated 3D ${layer.folder}/${safeName}.svg`)
  })
})
