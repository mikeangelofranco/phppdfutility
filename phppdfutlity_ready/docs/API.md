# API Guide - /pdfservice

## Endpoint
- `POST /pdfservice`
- Headers: `Content-Type: application/json`
- Response: Binary file (PDF or ZIP). On errors, JSON `{ "error": "..." }` with non-2xx status.

## Payload
```
{
  "operation": "lock",          // lock | unlock | merge | split | redact | convert to pdf | convert to image
  "password": "secret",        // required for lock/unlock
  "files": ["<base64 file>"],  // array of base64-encoded files; merge/convert to pdf can include multiple
  "text": ["TermA", "TermB"], // required for redact
  "order": [0,1,2]              // optional order for merge
}
```

## Examples
- Lock: `{ "operation": "lock", "password": "1234", "files": ["<base64pdf>"] }`
- Unlock: `{ "operation": "unlock", "password": "1234", "files": ["<base64pdf>"] }`
- Merge: `{ "operation": "merge", "files": ["<base64pdf1>", "<base64pdf2>"] }`
- Split: `{ "operation": "split", "files": ["<base64pdf>"] }`
- Redact: `{ "operation": "redact", "text": ["Name", "SSN"], "files": ["<base64pdf>"] }`
- Convert to image: `{ "operation": "convert to image", "files": ["<base64pdf>"] }` (ZIP of PNGs)
- Convert to pdf: `{ "operation": "convert to pdf", "files": ["<base64img1>", "<base64img2>"] }`

## Notes & Limitations
- Per-file size limit defaults to 25MB (`MAX_UPLOAD_BYTES` env var).
- Redaction is string replacement in content streams; accuracy depends on the PDF text encoding.
- Requires Python 3 with `PyPDF2`, `Pillow`, `pypdfium2` installed on the host.

## Postman Tips
- Use raw JSON body and `Content-Type: application/json`.
- Use the Send dropdown and choose **Send and Download** to save the binary response. The Body tab may show gibberish for binaries.
