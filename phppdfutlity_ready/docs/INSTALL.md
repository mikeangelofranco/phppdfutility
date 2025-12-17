# Installation Guide

## Requirements
- PHP 8.0+ with `proc_open` enabled
- Python 3.9+ on PATH
- Python packages: `PyPDF2`, `Pillow`, `pypdfium2`
- Web server serving `public/` as the document root (or `php -S localhost:8000 -t public` for quick dev)

## Setup Steps
1) Copy the contents of `phppdfutlity_ready` to your server.
2) Install Python packages:
   ```bash
   pip install PyPDF2 Pillow pypdfium2
   ```
3) Create an `.env` file from the provided example:
   ```bash
   cp .env.example .env
   ```
   Update app name, colors, optional metadata, and `MAX_UPLOAD_BYTES` (per-file limit, default 25MB).
4) Start your server pointing to `public/`.
5) Test endpoints via browser and Postman (see `docs/API.md`).

## File/Folder Overview
- `public/` - Front-end, modal flows, API endpoints (`pdfservice.php`, `lock.php`, etc.).
- `scripts/` - Python helpers for each operation.
- `vendor_py/` - Vendored PyPDF2 dependency (for environments without site-packages).
- `config/` - Environment loader.
- `.env.example` - Template for environment variables.
- `docs/` - Documentation for installation and API use.

## PHP Configuration
- Ensure `proc_open` is allowed (used to call Python scripts).
- Increase `upload_max_filesize` and `post_max_size` if needed for large PDFs.

## Python Path
- The app tries `python`, `python3`, `py -3`, `py`. Ensure one resolves on your server.
- `vendor_py` is auto-added to `PYTHONPATH` for PyPDF2. Pillow/pypdfium2 must be installed globally or vendored separately.

## Testing Checklist
- Upload a PDF and use Lock/Unlock/Merge/Split/Convert/Redact in the UI.
- Use Postman to call `/pdfservice` with sample base64 payloads (see `docs/API.md`) and confirm PDF/ZIP downloads.
- Verify redaction on sample PDFs (note encoding caveats in `docs/API.md`).
- If errors occur, check server logs and ensure Python deps are installed.
