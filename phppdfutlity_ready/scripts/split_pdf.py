"""
Split a PDF into per-page PDFs and package them into a ZIP.

Usage:
    python split_pdf.py input.pdf output.zip
"""
import sys
from io import BytesIO
from pathlib import Path
import zipfile

try:
    from PyPDF2 import PdfReader, PdfWriter
except Exception as exc:  # pragma: no cover
    sys.stderr.write(f"PyPDF2 import failed: {exc}\n")
    sys.exit(2)


def split_pdf(src: Path, dest_zip: Path) -> None:
    reader = PdfReader(str(src))
    if len(reader.pages) == 0:
        raise ValueError("PDF has no pages.")

    with zipfile.ZipFile(dest_zip, "w", compression=zipfile.ZIP_DEFLATED) as zipf:
        for index, page in enumerate(reader.pages, start=1):
            writer = PdfWriter()
            writer.add_page(page)
            buffer = BytesIO()
            writer.write(buffer)
            zipf.writestr(f"page-{index}.pdf", buffer.getvalue())


def main() -> int:
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: python split_pdf.py input.pdf output.zip\n")
        return 64

    src = Path(sys.argv[1])
    dest = Path(sys.argv[2])

    if not src.is_file():
        sys.stderr.write("Source file missing.\n")
        return 66

    try:
        split_pdf(src, dest)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 70

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
