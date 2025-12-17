"""
Convert images to a single PDF using Pillow.

Usage:
    python images_to_pdf.py output.pdf image1.png image2.jpg ...
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except Exception as exc:  # pragma: no cover
    sys.stderr.write(f"Pillow import failed: {exc}\n")
    sys.exit(2)


def images_to_pdf(output: Path, images: list[Path]) -> None:
    opened = []
    try:
        for img_path in images:
            img = Image.open(img_path)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            opened.append(img)

        if not opened:
            raise ValueError("No images to convert.")

        first, *rest = opened
        first.save(output, "PDF", save_all=True, append_images=rest)
    finally:
        for img in opened:
            try:
                img.close()
            except Exception:
                pass


def main() -> int:
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: python images_to_pdf.py output.pdf image1.png image2.jpg ...\n")
        return 64  # EX_USAGE

    out = Path(sys.argv[1])
    inputs = [Path(p) for p in sys.argv[2:]]

    if any(not p.is_file() for p in inputs):
        sys.stderr.write("One or more input images are missing.\n")
        return 66  # EX_NOINPUT

    try:
        images_to_pdf(out, inputs)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 70  # EX_SOFTWARE

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
