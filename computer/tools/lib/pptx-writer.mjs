import { promises as fs } from 'node:fs';
import { basename, dirname } from 'node:path';
import { createZipBuffer } from './zip.mjs';
import { ensureDir } from './files.mjs';

const SLIDE_W = 12192000;
const SLIDE_H = 6858000;
const EMU_PER_IN = 914400;

export async function writeEditablePptx(path, deck) {
  await ensureDir(dirname(path));
  const slides = deck.slides || [];
  const files = buildPackage(deck, slides);
  await fs.writeFile(path, createZipBuffer(files));
  return path;
}

function buildPackage(deck, slides) {
  const files = {};
  files['[Content_Types].xml'] = contentTypes(slides.length);
  files['_rels/.rels'] = rootRels();
  files['docProps/app.xml'] = appXml(slides.length);
  files['docProps/core.xml'] = coreXml(deck.title || 'Agent Computer Deck');
  files['ppt/presentation.xml'] = presentationXml(slides.length);
  files['ppt/_rels/presentation.xml.rels'] = presentationRels(slides.length);
  files['ppt/presProps.xml'] = simpleXml('p:presentationPr');
  files['ppt/viewProps.xml'] = simpleXml('p:viewPr');
  files['ppt/tableStyles.xml'] = tableStyles();
  files['ppt/theme/theme1.xml'] = themeXml();
  files['ppt/slideMasters/slideMaster1.xml'] = slideMasterXml();
  files['ppt/slideMasters/_rels/slideMaster1.xml.rels'] = slideMasterRels();
  files['ppt/slideLayouts/slideLayout1.xml'] = slideLayoutXml();
  files['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] = slideLayoutRels();

  slides.forEach((slide, index) => {
    const n = index + 1;
    files[`ppt/slides/slide${n}.xml`] = slideXml(slide, n);
    files[`ppt/slides/_rels/slide${n}.xml.rels`] = slideRels();
    files[`ppt/notesSlides/notesSlide${n}.xml`] = notesSlideXml(slide.notes || '');
    files[`ppt/notesSlides/_rels/notesSlide${n}.xml.rels`] = notesSlideRels(n);
  });

  files['ppt/notesMasters/notesMaster1.xml'] = notesMasterXml();
  files['ppt/notesMasters/_rels/notesMaster1.xml.rels'] = notesMasterRels();
  return files;
}

function slideXml(slide, index) {
  const elements = [];
  let shapeId = 2;
  elements.push(background(slide.background || 'F7F4EC', shapeId++));
  for (const item of slide.items || []) {
    if (item.type === 'line') elements.push(lineShape(item, shapeId++));
    else if (item.type === 'table') elements.push(tableFrame(item, shapeId++));
    else elements.push(textShape(item, shapeId++));
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${elements.join('\n')}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function background(color, id) {
  return `<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="Background"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
  <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
</p:sp>`;
}

function textShape(item, id) {
  const x = emu(item.x);
  const y = emu(item.y);
  const w = emu(item.w);
  const h = emu(item.h);
  const fill = item.fill ? `<a:solidFill><a:srgbClr val="${item.fill}"/></a:solidFill>` : '<a:noFill/>';
  const line = item.line ? `<a:ln w="${Math.round((item.lineWidth || 0.75) * 12700)}"><a:solidFill><a:srgbClr val="${item.line}"/></a:solidFill></a:ln>` : '<a:ln><a:noFill/></a:ln>';
  const preset = item.shape || 'roundRect';
  const text = paragraphs(item.text || '', item);
  return `<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="${xml(item.name || 'Editable text')}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="${preset}"><a:avLst/></a:prstGeom>${fill}${line}</p:spPr>
  <p:txBody><a:bodyPr wrap="square" anchor="${item.valign || 't'}" lIns="${emu(item.padX ?? 0.04)}" tIns="${emu(item.padY ?? 0.04)}" rIns="${emu(item.padX ?? 0.04)}" bIns="${emu(item.padY ?? 0.04)}"/><a:lstStyle/>${text}</p:txBody>
</p:sp>`;
}

function lineShape(item, id) {
  return `<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="${xml(item.name || 'Editable line')}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="${emu(item.x)}" y="${emu(item.y)}"/><a:ext cx="${emu(item.w)}" cy="${emu(item.h)}"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${Math.round((item.width || 1) * 12700)}"><a:solidFill><a:srgbClr val="${item.color || 'DED7C8'}"/></a:solidFill></a:ln></p:spPr>
  <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
</p:sp>`;
}

function tableFrame(item, id) {
  const x = emu(item.x);
  const y = emu(item.y);
  const w = emu(item.w);
  const h = emu(item.h);
  const rows = item.rows || [];
  const colCount = Math.max(1, ...rows.map((row) => row.length));
  const colWidths = normalizedColWidths(item.colWidths, colCount);
  const gridCols = colWidths.map((width) => `<a:gridCol w="${Math.max(1, Math.round(w * width))}"/>`).join('');
  const rowHeight = Math.max(1, Math.round(h / Math.max(1, rows.length)));
  const tableRows = rows.map((row, rowIndex) => tableRow(row, colCount, rowHeight, rowIndex, item)).join('');
  return `<p:graphicFrame>
  <p:nvGraphicFramePr><p:cNvPr id="${id}" name="${xml(item.name || 'Editable table')}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>
  <p:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></p:xfrm>
  <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl>
    <a:tblPr firstRow="1" bandRow="1"><a:tableStyleId>{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}</a:tableStyleId></a:tblPr>
    <a:tblGrid>${gridCols}</a:tblGrid>
    ${tableRows}
  </a:tbl></a:graphicData></a:graphic>
</p:graphicFrame>`;
}

function normalizedColWidths(widths, colCount) {
  if (Array.isArray(widths) && widths.length === colCount) {
    const total = widths.reduce((sum, width) => sum + Number(width || 0), 0);
    if (total > 0) return widths.map((width) => Number(width || 0) / total);
  }
  return Array.from({ length: colCount }, () => 1 / colCount);
}

function tableRow(row, colCount, rowHeight, rowIndex, item) {
  const cells = Array.from({ length: colCount }, (_, index) => row[index] || '');
  const xmlCells = cells.map((cell) => tableCell(cell, rowIndex, item)).join('');
  return `<a:tr h="${rowHeight}">${xmlCells}</a:tr>`;
}

function tableCell(value, rowIndex, item) {
  const isHeader = rowIndex === 0;
  const fill = isHeader ? (item.headerFill || 'EEE8FF') : (rowIndex % 2 ? 'FFFFFF' : (item.bandFill || 'FFFDF7'));
  const color = isHeader ? (item.headerColor || '4C1D95') : (item.color || '111827');
  const fontSize = isHeader ? ((item.fontSize || 7.2) + 0.3) : (item.fontSize || 7.2);
  const text = paragraphs(value || '', { fontSize, bold: isHeader, color, padX: 0.04, padY: 0.02 });
  return `<a:tc>
  <a:txBody><a:bodyPr wrap="square" anchor="t" lIns="${emu(0.05)}" tIns="${emu(0.04)}" rIns="${emu(0.05)}" bIns="${emu(0.04)}"/><a:lstStyle/>${text}</a:txBody>
  <a:tcPr><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill><a:lnL w="${Math.round(0.5 * 12700)}"><a:solidFill><a:srgbClr val="${item.line || 'DED7C8'}"/></a:solidFill></a:lnL><a:lnR w="${Math.round(0.5 * 12700)}"><a:solidFill><a:srgbClr val="${item.line || 'DED7C8'}"/></a:solidFill></a:lnR><a:lnT w="${Math.round(0.5 * 12700)}"><a:solidFill><a:srgbClr val="${item.line || 'DED7C8'}"/></a:solidFill></a:lnT><a:lnB w="${Math.round(0.5 * 12700)}"><a:solidFill><a:srgbClr val="${item.line || 'DED7C8'}"/></a:solidFill></a:lnB></a:tcPr>
</a:tc>`;
}

function paragraphs(text, item) {
  const lines = String(text).split('\n');
  return lines.map((line) => `<a:p><a:pPr algn="${item.align || 'l'}"/><a:r><a:rPr lang="en-US" sz="${Math.round((item.fontSize || 12) * 100)}"${item.bold ? ' b="1"' : ''}${item.italic ? ' i="1"' : ''}><a:solidFill><a:srgbClr val="${item.color || '111827'}"/></a:solidFill><a:latin typeface="${xml(item.fontFace || 'Arial')}"/></a:rPr><a:t>${xml(line)}</a:t></a:r></a:p>`).join('');
}

function contentTypes(slideCount) {
  const slideOverrides = Array.from({ length: slideCount }, (_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('');
  const notesOverrides = Array.from({ length: slideCount }, (_, i) => `<Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>
${slideOverrides}${notesOverrides}
</Types>`;
}

function rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
}

function presentationRels(slideCount) {
  const slideRels = Array.from({ length: slideCount }, (_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slideRels}<Relationship Id="rId${slideCount + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId${slideCount + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/></Relationships>`;
}

function presentationXml(slideCount) {
  const ids = Array.from({ length: slideCount }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${ids}</p:sldIdLst><p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}" type="wide"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle/></p:presentation>`;
}

function slideRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
}

function notesSlideRels(slideNumber) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNumber}.xml"/></Relationships>`;
}

function notesSlideXml(notes) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="685800"/><a:ext cx="5486400" cy="6858000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/>${paragraphs(notes || 'Source map/reference layer.', { fontSize: 12 })}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}

function slideMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`;
}

function slideMasterRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;
}

function slideLayoutXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}

function slideLayoutRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;
}

function notesMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:notesMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle/></p:notesMaster>`;
}

function notesMasterRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;
}

function themeXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="AgentComputer"><a:themeElements><a:clrScheme name="AgentComputer"><a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="F7F4EC"/></a:lt1><a:dk2><a:srgbClr val="4B5563"/></a:dk2><a:lt2><a:srgbClr val="FFFDF7"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="6D28D9"/></a:accent2><a:accent3><a:srgbClr val="2F855A"/></a:accent3><a:accent4><a:srgbClr val="B7791F"/></a:accent4><a:accent5><a:srgbClr val="C2410C"/></a:accent5><a:accent6><a:srgbClr val="DED7C8"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="6D28D9"/></a:folHlink></a:clrScheme><a:fontScheme name="AgentComputer"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="AgentComputer"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
}

function tableStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`;
}

function appXml(slideCount) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Agent Computer</Application><PresentationFormat>Widescreen</PresentationFormat><Slides>${slideCount}</Slides><Notes>${slideCount}</Notes></Properties>`;
}

function coreXml(title) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(title)}</dc:title><dc:creator>Agent Computer ppt-builder</dc:creator><cp:lastModifiedBy>Agent Computer ppt-builder</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
}

function simpleXml(tag) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><${tag} xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`;
}

function emu(inches) {
  return Math.round((Number(inches) || 0) * EMU_PER_IN);
}

function xml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function pptxBasename(path) {
  return basename(path).replace(/\.pptx$/i, '');
}
