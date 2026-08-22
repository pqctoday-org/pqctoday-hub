// SPDX-License-Identifier: GPL-3.0-only
/**
 * Minimal OOXML PresentationML writer — enough for the text decks this app
 * actually produces, and nothing more.
 *
 * WHY THIS EXISTS. `pptxExport.ts` used pptxgenjs, whose only purpose here was
 * to lay out text boxes: the exporter calls addSlide/addText/addShape and
 * nothing else — no images, no charts, no tables, in 160 lines. pptxgenjs
 * pulls in `image-size`, which carries two open high-severity denial-of-service
 * advisories with no patched version available (GHSA-5p2g-fcmc-qvqq and the
 * ICNS parser advisory), and npm's only remedy is a breaking downgrade to
 * pptxgenjs 1.1.5.
 *
 * Writing the ~8 parts of a PresentationML package directly removes the whole
 * dependency chain rather than swapping one library for another. JSZip and
 * file-saver were already direct dependencies used by the VPN config exporter.
 *
 * SCOPE, deliberately narrow. Solid-colour slide backgrounds, absolutely
 * positioned text boxes with per-run size/bold/colour/alignment, simple
 * bulleted or plain paragraphs, and straight lines. A single slide layout and
 * master, because every slide here positions its own shapes and inherits
 * nothing. Anything beyond that — images, charts, tables, transitions,
 * speaker notes — is NOT supported and should not be bolted on here; that is
 * the point at which a real library earns its dependency back.
 */

/** English Metric Units per inch — the unit PresentationML measures in. */
const EMU_PER_INCH = 914400

export const inchesToEmu = (inches: number): number => Math.round(inches * EMU_PER_INCH)

/** Centipoints: PresentationML sizes text in 1/100th of a point. */
export const pointsToSz = (points: number): number => Math.round(points * 100)

export interface TextRun {
  text: string
  /** Renders as a bulleted paragraph rather than a plain one. */
  bullet?: boolean
}

export interface TextBox {
  xIn: number
  yIn: number
  wIn: number
  hIn: number
  runs: TextRun[]
  fontSize: number
  /** Six-digit hex, no leading '#'. */
  color: string
  bold?: boolean
  align?: 'l' | 'ctr' | 'r'
  /** Vertical anchor within the box. */
  anchor?: 't' | 'ctr' | 'b'
  /** Space after each paragraph, in points. */
  spaceAfter?: number
}

export interface LineShape {
  xIn: number
  yIn: number
  wIn: number
  /** Six-digit hex, no leading '#'. */
  color: string
  widthPt: number
}

export interface Slide {
  /** Six-digit hex, no leading '#'. */
  background: string
  textBoxes: TextBox[]
  lines?: LineShape[]
}

/**
 * XML text escaping.
 *
 * This is the one place a bug would be silent and total: an unescaped `&` or
 * `<` from artifact prose produces a package PowerPoint refuses to open, with
 * no clue as to which slide caused it. Artifact markdown routinely contains
 * ampersands ("Risk & Controls") and comparison operators.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Strip characters XML 1.0 forbids outright.
 *
 * Control characters cannot be escaped into legality — `&#x1F;` is still
 * invalid XML — so they have to be removed. Pasted content and PDF-derived
 * text carry them often enough to matter.
 */
export function stripInvalidXmlChars(value: string): string {
  // XML 1.0 permits #x9, #xA, #xD and #x20+; everything below that is illegal
  // and CANNOT be escaped into legality — `&#x1F;` is still invalid XML — so it
  // has to be removed. Also drops the two permanently-unassigned noncharacters
  // U+FFFE/U+FFFF. Written with explicit escapes rather than literal control
  // characters so the pattern survives copy/paste and reformatting.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
}

const safe = (value: string): string => escapeXml(stripInvalidXmlChars(value))

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

function paragraph(run: TextRun, box: TextBox): string {
  const props: string[] = []
  if (box.align) props.push(`algn="${box.align}"`)
  if (box.spaceAfter) props.push('')
  const spacing = box.spaceAfter
    ? `<a:spcAft><a:spcPts val="${pointsToSz(box.spaceAfter)}"/></a:spcAft>`
    : ''
  // buNone is explicit: without it a paragraph inherits the layout's bullet,
  // so plain paragraphs silently acquire bullets on some renderers.
  const bullet = run.bullet
    ? '<a:buFont typeface="Arial" panose="020B0604020202020204" pitchFamily="34" charset="0"/><a:buChar char="&#8226;"/>'
    : '<a:buNone/>'
  const indent = run.bullet ? ' marL="228600" indent="-228600"' : ''
  const pPr = `<a:pPr${indent}${props.filter(Boolean).length ? ' ' + props.filter(Boolean).join(' ') : ''}>${spacing}${bullet}</a:pPr>`
  const rPr = `<a:rPr lang="en-US" sz="${pointsToSz(box.fontSize)}"${box.bold ? ' b="1"' : ''} dirty="0"><a:solidFill><a:srgbClr val="${box.color}"/></a:solidFill></a:rPr>`
  return `<a:p>${pPr}<a:r>${rPr}<a:t>${safe(run.text)}</a:t></a:r></a:p>`
}

function textBoxXml(box: TextBox, id: number): string {
  const body = box.runs.length
    ? box.runs.map((r) => paragraph(r, box)).join('')
    : '<a:p><a:endParaRPr lang="en-US"/></a:p>'
  return (
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="TextBox ${id}"/>` +
    '<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
    `<p:spPr><a:xfrm><a:off x="${inchesToEmu(box.xIn)}" y="${inchesToEmu(box.yIn)}"/>` +
    `<a:ext cx="${inchesToEmu(box.wIn)}" cy="${inchesToEmu(box.hIn)}"/></a:xfrm>` +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>' +
    `<p:txBody><a:bodyPr wrap="square" anchor="${box.anchor ?? 't'}"><a:normAutofit/></a:bodyPr>` +
    `<a:lstStyle/>${body}</p:txBody></p:sp>`
  )
}

function lineXml(line: LineShape, id: number): string {
  return (
    `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Line ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm><a:off x="${inchesToEmu(line.xIn)}" y="${inchesToEmu(line.yIn)}"/>` +
    `<a:ext cx="${inchesToEmu(line.wIn)}" cy="0"/></a:xfrm>` +
    '<a:prstGeom prst="line"><a:avLst/></a:prstGeom>' +
    `<a:ln w="${Math.round(line.widthPt * 12700)}"><a:solidFill><a:srgbClr val="${line.color}"/></a:solidFill></a:ln>` +
    '</p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>'
  )
}

export function slideXml(slide: Slide): string {
  let id = 2
  const shapes = [
    ...slide.textBoxes.map((b) => textBoxXml(b, id++)),
    ...(slide.lines ?? []).map((l) => lineXml(l, id++)),
  ].join('')
  return (
    `${XML_DECL}\n<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
    `<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${slide.background}"/></a:solidFill>` +
    '<a:effectLst/></p:bgPr></p:bg>' +
    '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
    '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
    `${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
  )
}

/** 16:9 wide, matching pptxgenjs's LAYOUT_WIDE: 13.333in × 7.5in. */
export const SLIDE_W_EMU = 12192000
export const SLIDE_H_EMU = 6858000

export function contentTypesXml(slideCount: number): string {
  const slides = Array.from(
    { length: slideCount },
    (_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join('')
  return (
    `${XML_DECL}\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' +
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' +
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
    `${slides}</Types>`
  )
}

export function presentationXml(slideCount: number): string {
  const ids = Array.from(
    { length: slideCount },
    (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`
  ).join('')
  return (
    `${XML_DECL}\n<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">' +
    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
    `<p:sldIdLst>${ids}</p:sldIdLst>` +
    `<p:sldSz cx="${SLIDE_W_EMU}" cy="${SLIDE_H_EMU}"/><p:notesSz cx="${SLIDE_H_EMU}" cy="${SLIDE_W_EMU}"/>` +
    '</p:presentation>'
  )
}

export function presentationRelsXml(slideCount: number): string {
  const slides = Array.from(
    { length: slideCount },
    (_, i) =>
      `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
  ).join('')
  return (
    `${XML_DECL}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>' +
    slides +
    `<Relationship Id="rId${slideCount + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>` +
    '</Relationships>'
  )
}

const ROOT_RELS =
  `${XML_DECL}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>' +
  '</Relationships>'

const EMPTY_SP_TREE =
  '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
  '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
  '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>'

const SLIDE_MASTER =
  `${XML_DECL}\n<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
  `<p:cSld>${EMPTY_SP_TREE}</p:cSld>` +
  '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" ' +
  'accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>' +
  '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>' +
  '</p:sldMaster>'

const SLIDE_MASTER_RELS =
  `${XML_DECL}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>' +
  '</Relationships>'

const SLIDE_LAYOUT =
  `${XML_DECL}\n<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">' +
  `<p:cSld name="Blank">${EMPTY_SP_TREE}</p:cSld>` +
  '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'

const SLIDE_LAYOUT_RELS =
  `${XML_DECL}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>' +
  '</Relationships>'

const SLIDE_RELS =
  `${XML_DECL}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
  '</Relationships>'

/** A theme is mandatory: PowerPoint refuses a package whose master has none. */
function themeXml(): string {
  const fontScheme =
    '<a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>' +
    '<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
  const clr = (name: string, val: string) => `<a:${name}><a:srgbClr val="${val}"/></a:${name}>`
  const colorScheme =
    '<a:clrScheme name="Office">' +
    '<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>' +
    '<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' +
    clr('dk2', '44546A') +
    clr('lt2', 'E7E6E6') +
    clr('accent1', '4472C4') +
    clr('accent2', 'ED7D31') +
    clr('accent3', 'A5A5A5') +
    clr('accent4', 'FFC000') +
    clr('accent5', '5B9BD5') +
    clr('accent6', '70AD47') +
    clr('hlink', '0563C1') +
    clr('folHlink', '954F72') +
    '</a:clrScheme>'
  const fill =
    '<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>' +
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>' +
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
  const line =
    '<a:lnStyleLst>' +
    '<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>' +
    '<a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>' +
    '<a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>' +
    '</a:lnStyleLst>'
  const effect =
    '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
  const bg =
    '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>' +
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>' +
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
  return (
    `${XML_DECL}\n<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">` +
    `<a:themeElements>${colorScheme}${fontScheme}` +
    `<a:fmtScheme name="Office">${fill}${line}${effect}${bg}</a:fmtScheme>` +
    '</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>'
  )
}

/** Every part of the package, keyed by its path inside the zip. */
export function buildPackageParts(slides: Slide[]): Record<string, string> {
  if (slides.length === 0) {
    throw new Error('a PPTX package needs at least one slide')
  }
  const parts: Record<string, string> = {
    '[Content_Types].xml': contentTypesXml(slides.length),
    '_rels/.rels': ROOT_RELS,
    'ppt/presentation.xml': presentationXml(slides.length),
    'ppt/_rels/presentation.xml.rels': presentationRelsXml(slides.length),
    'ppt/slideMasters/slideMaster1.xml': SLIDE_MASTER,
    'ppt/slideMasters/_rels/slideMaster1.xml.rels': SLIDE_MASTER_RELS,
    'ppt/slideLayouts/slideLayout1.xml': SLIDE_LAYOUT,
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels': SLIDE_LAYOUT_RELS,
    'ppt/theme/theme1.xml': themeXml(),
  }
  slides.forEach((slide, i) => {
    parts[`ppt/slides/slide${i + 1}.xml`] = slideXml(slide)
    parts[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = SLIDE_RELS
  })
  return parts
}
