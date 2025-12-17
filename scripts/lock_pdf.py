"""
Lock a PDF with a user password using PyPDF2.

Usage:
    python lock_pdf.py input.pdf output.pdf password
"""
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfReader, PdfWriter
except Exception as exc:  # pragma: no cover - graceful error bubble to PHP
    sys.stderr.write(f"PyPDF2 import failed: {exc}\n")
    sys.exit(2)


def lock_pdf(src: Path, dest: Path, password: str) -> None:
    reader = PdfReader(str(src))
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    # Set both user/owner passwords to the same value to keep simple UX.
    writer.encrypt(password, owner_password=password, use_128bit=True)

    with dest.open("wb") as fh:
        writer.write(fh)


def main() -> int:
    if len(sys.argv) != 4:
        sys.stderr.write("Usage: python lock_pdf.py input.pdf output.pdf password\n")
        return 64  # EX_USAGE

    src = Path(sys.argv[1])
    dest = Path(sys.argv[2])
    password = sys.argv[3]

    if not src.is_file():
        sys.stderr.write("Source file missing.\n")
        return 66  # EX_NOINPUT

    if not password:
        sys.stderr.write("Password required.\n")
        return 64

    try:
        lock_pdf(src, dest, password)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 70  # EX_SOFTWARE

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
