"""
Convert a PDF to PNG images (one per page) and bundle into a ZIP.

Usage:
    python pdf_to_images.py input.pdf output.zip
"""
import io
import sys
import zipfile
from pathlib import Path

try:
    import pypdfium2 as pdfium
except Exception as exc:  # pragma: no cover
    sys.stderr.write(f"pypdfium2 import failed: {exc}\n")
    sys.exit(2)


def pdf_to_images(src: Path, dest: Path) -> None:
    pdf = pdfium.PdfDocument(str(src))
    with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for i, page in enumerate(pdf):
            bmp = page.render(scale=2.0).to_pil()
            buf = io.BytesIO()
            bmp.save(buf, format="PNG")
            zf.writestr(f"page-{i+1}.png", buf.getvalue())
            buf.close()
            bmp.close()
    pdf.close()


def main() -> int:
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: python pdf_to_images.py input.pdf output.zip\n")
        return 64  # EX_USAGE

    src = Path(sys.argv[1])
    dest = Path(sys.argv[2])

    if not src.is_file():
        sys.stderr.write("Source PDF is missing.\n")
        return 66  # EX_NOINPUT

    try:
        pdf_to_images(src, dest)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 70  # EX_SOFTWARE

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
