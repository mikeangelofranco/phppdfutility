"""
Unlock (decrypt) a password-protected PDF using PyPDF2.

Usage:
    python unlock_pdf.py input.pdf output.pdf password
"""
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfReader, PdfWriter
except Exception as exc:  # pragma: no cover - bubble a clear error to PHP
    sys.stderr.write(f"PyPDF2 import failed: {exc}\n")
    sys.exit(2)


def unlock_pdf(src: Path, dest: Path, password: str) -> None:
    reader = PdfReader(str(src))

    if reader.is_encrypted:
        try:
            result = reader.decrypt(password)
        except Exception as exc:  # pragma: no cover
            raise ValueError(f"Unable to decrypt PDF: {exc}") from exc

        if result == 0:
            raise ValueError("Invalid password for PDF.")

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    if reader.metadata:
        writer.add_metadata(reader.metadata)

    with dest.open("wb") as fh:
        writer.write(fh)


def main() -> int:
    if len(sys.argv) != 4:
        sys.stderr.write("Usage: python unlock_pdf.py input.pdf output.pdf password\n")
        return 64  # EX_USAGE

    src = Path(sys.argv[1])
    dest = Path(sys.argv[2])
    password = sys.argv[3]

    if not src.is_file():
        sys.stderr.write("Source file missing.\n")
        return 66  # EX_NOINPUT

    if password == "":
        sys.stderr.write("Password required to unlock PDF.\n")
        return 64

    try:
        unlock_pdf(src, dest, password)
    except ValueError as exc:
        sys.stderr.write(str(exc))
        return 65  # EX_DATAERR (bad password/format)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 70  # EX_SOFTWARE

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
