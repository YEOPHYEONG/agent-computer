#!/usr/bin/env python3
import re
import sys
import zipfile
import xml.etree.ElementTree as ET


def text_from_xml(data):
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return ""
    chunks = []
    for node in root.iter():
        if node.tag.endswith("}t") and node.text:
            chunks.append(node.text)
        elif node.tag.endswith("}tab"):
            chunks.append("\t")
        elif node.tag.endswith("}br"):
            chunks.append("\n")
    return " ".join(chunks)


def extract_docx(zf):
    names = ["word/document.xml"]
    names += sorted(n for n in zf.namelist() if n.startswith("word/header") or n.startswith("word/footer"))
    parts = []
    for name in names:
        if name in zf.namelist():
            parts.append(text_from_xml(zf.read(name)))
    return "\n\n".join(p for p in parts if p.strip())


def extract_pptx(zf):
    slide_names = sorted(
        (n for n in zf.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)),
        key=lambda n: int(re.search(r"slide(\d+)", n).group(1)),
    )
    parts = []
    for idx, name in enumerate(slide_names, start=1):
        text = text_from_xml(zf.read(name)).strip()
        parts.append(f"## Slide {idx}\n\n{text}")
    return "\n\n".join(parts)


def main():
    if len(sys.argv) != 3:
        print("Usage: extract_ooxml_text.py <file> <docx|pptx>", file=sys.stderr)
        return 2
    path, kind = sys.argv[1], sys.argv[2]
    with zipfile.ZipFile(path) as zf:
        if kind == "docx":
            print(extract_docx(zf))
        elif kind == "pptx":
            print(extract_pptx(zf))
        else:
            print(f"Unsupported kind: {kind}", file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
