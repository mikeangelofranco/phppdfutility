"""
Merge multiple PDFs into a single PDF.

Usage:
    python merge_pdf.py output.pdf input1.pdf input2.pdf ...
"""
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfMerger
except Exception as exc:  # pragma: no cover
    sys.stderr.write(f"PyPDF2 import failed: {exc}\n")
    sys.exit(2)


def merge(output: Path, inputs: list[Path]) -> None:
    merger = PdfMerger()
    for pdf in inputs:
        merger.append(str(pdf))
    with output.open("wb") as fh:
        merger.write(fh)


def main() -> int:
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: python merge_pdf.py output.pdf input1.pdf input2.pdf ...\n")
        return 64  # EX_USAGE

    out = Path(sys.argv[1])
    inputs = [Path(p) for p in sys.argv[2:]]

    if any(not p.is_file() for p in inputs):
        sys.stderr.write("One or more input PDFs are missing.\n")
        return 66  # EX_NOINPUT

    try:
        merge(out, inputs)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 70  # EX_SOFTWARE

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
