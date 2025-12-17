# PHP PDF Utility - Deployment Package

This folder is a cleaned, deployable build ready for CodeCanyon distribution.

## Included
- `public/` – Front-end, modal flows, and API endpoints (`pdfservice.php`, `lock.php`, etc.).
- `scripts/` – Python helpers for lock/unlock/merge/split/convert/redact.
- `config/` – Environment loader.
- `vendor_py/` – Vendored PyPDF2 dependency.
- `.env.example` – Example environment file (includes `MAX_UPLOAD_BYTES`).
- `docs/` – Installation and API guides.

## Quick Start
1) Copy `phppdfutlity_ready` to your server.
2) Serve `public/` via PHP 8+ (Apache/Nginx or `php -S localhost:8000 -t public`).
3) Ensure Python 3 is on PATH.
4) Install Python deps:
   ```bash
   pip install PyPDF2 Pillow pypdfium2
   ```
5) Copy `.env.example` to `.env` and adjust branding/colors and `MAX_UPLOAD_BYTES` (default 25MB per file).
6) Test UI tools and the unified API `/pdfservice`.

## Unified API (POST /pdfservice)
- Endpoint: `POST /pdfservice`
- Headers: `Content-Type: application/json`
- Payload:
  ```json
  {
    "operation": "lock",          // lock | unlock | merge | split | redact | convert to pdf | convert to image
    "password": "secret",        // required for lock/unlock
    "files": ["<base64 file>"],  // array; multiple for merge/convert to pdf
    "text": ["TermA", "TermB"], // for redact
    "order": [0,1,2]              // optional for merge ordering
  }
  ```
- Response: binary PDF or ZIP (for split/convert-to-image). Errors: JSON `{ "error": "message" }` with non-2xx status.

## Notes
- Redaction is string replacement in content streams; results depend on PDF text encoding.
- Per-file size limit defaults to 25MB (`MAX_UPLOAD_BYTES`).
- If the host lacks system Python/deps, install or vendor them.

## Licensing
- Uses Google Fonts (Space Grotesk, JetBrains Mono) and pdf.js/pdf-lib (open source). Include their licenses if required by the marketplace.

See `docs/INSTALL.md`, `docs/API.md`, and `docs/CHANGELOG.md` for details.
