"""
Redact text in a PDF by replacing matched strings in page content streams with [REDACTED].

Usage:
    python redact_pdf.py input.pdf output.pdf term1 term2 ...
"""
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfReader, PdfWriter
    from PyPDF2.generic import NameObject, DecodedStreamObject
except Exception as exc:  # pragma: no cover
    sys.stderr.write(f"PyPDF2 import failed: {exc}\n")
    sys.exit(2)


def get_content_bytes(page) -> bytes | None:
    contents = page.get_contents()
    if contents is None:
        return None
    try:
        return contents.get_data()
    except Exception:
        try:
            return b"".join(item.get_data() for item in contents)
        except Exception:
            return None


def set_content_bytes(page, data: bytes) -> None:
    stream = DecodedStreamObject()
    stream.set_data(data)
    page[NameObject("/Contents")] = stream


def redact_pdf(src: Path, dest: Path, terms: list[str]) -> None:
    reader = PdfReader(str(src))
    writer = PdfWriter()

    normalized = [t for t in (term.strip() for term in terms) if t]
    normalized_bytes = [term.encode("utf-8") for term in normalized]

    for page in reader.pages:
        data = get_content_bytes(page)
        if data is None:
            writer.add_page(page)
            continue

        new_data = data
        for term_bytes in normalized_bytes:
            if not term_bytes:
                continue
            new_data = new_data.replace(term_bytes, b"[REDACTED]")

        set_content_bytes(page, new_data)
        writer.add_page(page)

    with dest.open("wb") as fh:
        writer.write(fh)


def main() -> int:
    if len(sys.argv) < 4:
        sys.stderr.write("Usage: python redact_pdf.py input.pdf output.pdf term1 term2 ...\n")
        return 64  # EX_USAGE

    src = Path(sys.argv[1])
    dest = Path(sys.argv[2])
    terms = sys.argv[3:]

    if not src.is_file():
        sys.stderr.write("Source PDF missing.\n")
        return 66  # EX_NOINPUT

    try:
        redact_pdf(src, dest, terms)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 70  # EX_SOFTWARE

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
