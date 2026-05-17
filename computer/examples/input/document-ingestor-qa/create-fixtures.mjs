import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZipBuffer } from '../../../tools/lib/zip.mjs';
import { writeEditablePptx } from '../../../tools/lib/pptx-writer.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function xml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function docxParagraph(text) {
  return `<w:p><w:r><w:t>${xml(text)}</w:t></w:r></w:p>`;
}

function buildDocx() {
  const body = [
    'DOCX QA Fixture',
    'Preserve this exact DOCX sentence: assembly line throughput = 42 units/hour.',
    'Checklist: sensor calibration, batch traceability, exception owner.'
  ].map(docxParagraph).join('');

  return createZipBuffer({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr/></w:body>
</w:document>`
  });
}

function pdfText(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf() {
  const lines = [
    'PDF QA Fixture',
    'Preserve this exact PDF sentence: downtime alert alpha-17.',
    'Process step: render dependency should be required.'
  ];
  const stream = [
    'BT',
    '/F1 16 Tf',
    '72 720 Td',
    '22 TL',
    ...lines.flatMap((line, index) => index === 0 ? [`(${pdfText(line)}) Tj`] : ['T*', `(${pdfText(line)}) Tj`]),
    'ET'
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

async function main() {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHxcCAr7BQpQAAAAASUVORK5CYII=',
    'base64'
  );
  await fs.writeFile(join(here, 'di-qa-20260516-image.png'), png);
  await fs.writeFile(join(here, 'di-qa-20260516-docx.docx'), buildDocx());
  await fs.writeFile(join(here, 'di-qa-20260516-pdf.pdf'), buildPdf());
  await writeEditablePptx(join(here, 'di-qa-20260516-pptx.pptx'), {
    title: 'PPTX QA Fixture',
    slides: [
      {
        background: 'FFFFFF',
        items: [
          {
            type: 'text',
            x: 0.7,
            y: 0.7,
            w: 8.5,
            h: 1.3,
            fontSize: 28,
            bold: true,
            text: 'PPTX QA Fixture'
          },
          {
            type: 'text',
            x: 0.8,
            y: 2.1,
            w: 10.5,
            h: 1.4,
            fontSize: 18,
            text: 'Preserve this exact PPTX sentence: changeover window beta-9.\\nRenderer should be required for slide images.'
          }
        ],
        notes: 'PPTX fixture notes: render dependency should be required.'
      }
    ]
  });

  console.log(`Wrote fixtures in ${here}`);
}

main();
