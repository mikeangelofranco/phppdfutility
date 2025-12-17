<?php

declare(strict_types=1);

ini_set('display_errors', '0');
set_time_limit(45);
set_error_handler(static function (int $errno, string $errstr, string $errfile, int $errline): bool {
    // Suppress notices/warnings leaking HTML; convert to JSON.
    if (!(error_reporting() & $errno)) {
        return false;
    }
    respondJsonPdfSvc(500, "Internal error: {$errstr}");
    return true;
});
register_shutdown_function(static function (): void {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        respondJsonPdfSvc(500, 'Fatal error while processing.');
    }
});

require_once __DIR__ . '/../config/env.php';

loadEnv(__DIR__ . '/..');

function respondJsonPdfSvc(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

function resolvePythonCommandPdfSvc(): array
{
    $candidates = [
        ['python'],
        ['python3'],
        ['py', '-3'],
        ['py'],
    ];

    foreach ($candidates as $parts) {
        $testCmd = implode(' ', array_map('escapeshellarg', array_merge($parts, ['--version'])));
        $pipes = [];
        $proc = @proc_open($testCmd, [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ], $pipes, null, null);

        if (is_resource($proc)) {
            fclose($pipes[0]);
            stream_get_contents($pipes[1]);
            stream_get_contents($pipes[2]);
            $code = proc_close($proc);
            if ($code === 0) {
                return $parts;
            }
        }
    }

    return [];
}

function buildEnvPdfSvc(): array
{
    $env = $_ENV;
    if (!is_array($env)) {
        $env = [];
    }

    $pathVars = ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'COMSPEC', 'PATHEXT'];
    foreach ($pathVars as $var) {
        if (!isset($env[$var])) {
            $value = getenv($var);
            if ($value !== false) {
                $env[$var] = $value;
            }
        }
    }

    $vendorPy = realpath(__DIR__ . '/../vendor_py');
    if ($vendorPy) {
        $env['PYTHONPATH'] = $vendorPy . PATH_SEPARATOR . ($env['PYTHONPATH'] ?? '');
    }

    return $env;
}

function runPythonPdfSvc(array $scriptParts, array $args, array $env): array
{
    $cmd = array_merge($scriptParts, $args);
    $command = implode(' ', array_map('escapeshellarg', $cmd));
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $process = @proc_open($command, $descriptors, $pipes, null, $env);
    if (!is_resource($process)) {
        return [1, '', 'Unable to start process.'];
    }

    fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);

    return [$exitCode, $stdout, $stderr];
}

function saveBase64File(string $data, string $suffix): string
{
    $tmpBase = tempnam(sys_get_temp_dir(), 'pdfsvc_');
    if ($tmpBase === false) {
        return '';
    }
    $path = $tmpBase . $suffix;
    @unlink($tmpBase);

    $decoded = base64_decode($data, true);
    if ($decoded === false) {
        return '';
    }

    if (file_put_contents($path, $decoded) === false) {
        return '';
    }

    return $path;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJsonPdfSvc(405, 'Only POST is allowed.');
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    respondJsonPdfSvc(400, 'Invalid JSON payload.');
}

$operation = strtolower(trim((string) ($payload['operation'] ?? '')));
if ($operation === '') {
    respondJsonPdfSvc(400, 'Operation is required.');
}

$files = $payload['files'] ?? null;
if (!is_array($files) || count($files) === 0) {
    respondJsonPdfSvc(400, 'At least one file (base64) is required.');
}
$maxBytes = (int) env('MAX_UPLOAD_BYTES', 25 * 1024 * 1024);

$env = buildEnvPdfSvc();
$python = resolvePythonCommandPdfSvc();
if (count($python) === 0) {
    respondJsonPdfSvc(500, 'Python runtime is not available.');
}

$scriptDir = realpath(__DIR__ . '/../scripts');
if ($scriptDir === false) {
    respondJsonPdfSvc(500, 'Scripts directory missing.');
}

$temps = [];
$cleanup = static function () use (&$temps): void {
    foreach ($temps as $path) {
        if ($path && file_exists($path)) {
            @unlink($path);
        }
    }
};

try {
    $op = $operation;
    $normalizedOp = $op;

    $needsPdf = in_array($normalizedOp, ['lock', 'unlock', 'merge', 'split', 'redact', 'convert to image'], true);
    $isImageToPdf = $normalizedOp === 'convert to pdf';

    if ($needsPdf && count($files) === 0) {
        respondJsonPdfSvc(400, 'PDF input is required for this operation.');
    }

    if ($isImageToPdf && count($files) === 0) {
        respondJsonPdfSvc(400, 'At least one image is required to convert to PDF.');
    }

    $decodedPaths = [];
    $allowedImageMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    foreach ($files as $index => $fileData) {
        $suffix = '.bin';
        if ($needsPdf) {
            $suffix = '.pdf';
        }
        $path = saveBase64File((string) $fileData, $suffix);
        if ($path === '') {
            $cleanup();
            respondJsonPdfSvc(400, "Unable to decode file at index {$index}.");
        }
        $size = filesize($path);
        if ($size === false || $size <= 0) {
            $cleanup();
            respondJsonPdfSvc(400, "Uploaded file at index {$index} is empty.");
        }
        if ($size > $maxBytes) {
            $cleanup();
            respondJsonPdfSvc(400, "File at index {$index} exceeds size limit.");
        }

        $mime = '';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = $finfo ? finfo_file($finfo, $path) : '';
            if ($finfo) {
                finfo_close($finfo);
            }
        }

        if ($needsPdf && stripos((string) $mime, 'pdf') === false && !preg_match('/\\.pdf$/i', $path)) {
            $cleanup();
            respondJsonPdfSvc(400, "File at index {$index} must be a PDF.");
        }
        if ($isImageToPdf && !in_array(strtolower((string) $mime), $allowedImageMimes, true)) {
            $cleanup();
            respondJsonPdfSvc(400, "File at index {$index} must be an image (PNG/JPEG/WebP).");
        }

        $decodedPaths[] = $path;
        $temps[] = $path;
    }

    $output = '';
    $contentType = 'application/pdf';

    if ($normalizedOp === 'lock') {
        $password = trim((string) ($payload['password'] ?? ''));
        if ($password === '') {
            $cleanup();
            respondJsonPdfSvc(400, 'Password is required for lock.');
        }
        $script = $scriptDir . '/lock_pdf.py';
        $output = tempnam(sys_get_temp_dir(), 'pdfsvc_lock_') . '.pdf';
        $temps[] = $output;
        [$code, $stdout, $stderr] = runPythonPdfSvc(
            array_merge($python, [$script]),
            [$decodedPaths[0], $output, $password],
            $env
        );
        if ($code !== 0 || !file_exists($output)) {
            $cleanup();
            respondJsonPdfSvc(500, trim($stderr ?: $stdout ?: 'Failed to lock PDF.'));
        }
    } elseif ($normalizedOp === 'unlock') {
        $password = trim((string) ($payload['password'] ?? ''));
        if ($password === '') {
            $cleanup();
            respondJsonPdfSvc(400, 'Password is required for unlock.');
        }
        $script = $scriptDir . '/unlock_pdf.py';
        $output = tempnam(sys_get_temp_dir(), 'pdfsvc_unlock_') . '.pdf';
        $temps[] = $output;
        [$code, $stdout, $stderr] = runPythonPdfSvc(
            array_merge($python, [$script]),
            [$decodedPaths[0], $output, $password],
            $env
        );
        if ($code !== 0 || !file_exists($output)) {
            $cleanup();
            respondJsonPdfSvc(500, trim($stderr ?: $stdout ?: 'Failed to unlock PDF.'));
        }
    } elseif ($normalizedOp === 'split') {
        $script = $scriptDir . '/split_pdf.py';
        $output = tempnam(sys_get_temp_dir(), 'pdfsvc_split_') . '.zip';
        $temps[] = $output;
        $contentType = 'application/zip';
        [$code, $stdout, $stderr] = runPythonPdfSvc(
            array_merge($python, [$script]),
            [$decodedPaths[0], $output],
            $env
        );
        if ($code !== 0 || !file_exists($output)) {
            $cleanup();
            respondJsonPdfSvc(500, trim($stderr ?: $stdout ?: 'Failed to split PDF.'));
        }
    } elseif ($normalizedOp === 'merge') {
        if (count($decodedPaths) < 2) {
            $cleanup();
            respondJsonPdfSvc(400, 'At least two PDFs are required to merge.');
        }
        $order = $payload['order'] ?? null;
        if (is_array($order) && count($order) === count($decodedPaths)) {
            $ordered = [];
            foreach ($order as $idx) {
                $i = (int) $idx;
                if (isset($decodedPaths[$i])) {
                    $ordered[] = $decodedPaths[$i];
                }
            }
            if (count($ordered) === count($decodedPaths)) {
                $decodedPaths = $ordered;
            }
        }
        $script = $scriptDir . '/merge_pdf.py';
        $output = tempnam(sys_get_temp_dir(), 'pdfsvc_merge_') . '.pdf';
        $temps[] = $output;
        [$code, $stdout, $stderr] = runPythonPdfSvc(
            array_merge($python, [$script]),
            array_merge([$output], $decodedPaths),
            $env
        );
        if ($code !== 0 || !file_exists($output)) {
            $cleanup();
            respondJsonPdfSvc(500, trim($stderr ?: $stdout ?: 'Failed to merge PDFs.'));
        }
    } elseif ($normalizedOp === 'convert to image') {
        $script = $scriptDir . '/pdf_to_images.py';
        $output = tempnam(sys_get_temp_dir(), 'pdfsvc_img_') . '.zip';
        $temps[] = $output;
        $contentType = 'application/zip';
        [$code, $stdout, $stderr] = runPythonPdfSvc(
            array_merge($python, [$script]),
            [$decodedPaths[0], $output],
            $env
        );
        if ($code !== 0 || !file_exists($output)) {
            $cleanup();
            respondJsonPdfSvc(500, trim($stderr ?: $stdout ?: 'Failed to convert PDF to images.'));
        }
    } elseif ($normalizedOp === 'convert to pdf') {
        $script = $scriptDir . '/images_to_pdf.py';
        $output = tempnam(sys_get_temp_dir(), 'pdfsvc_imgpdf_') . '.pdf';
        $temps[] = $output;
        [$code, $stdout, $stderr] = runPythonPdfSvc(
            array_merge($python, [$script]),
            array_merge([$output], $decodedPaths),
            $env
        );
        if ($code !== 0 || !file_exists($output)) {
            $cleanup();
            respondJsonPdfSvc(500, trim($stderr ?: $stdout ?: 'Failed to convert images to PDF.'));
        }
    } elseif ($normalizedOp === 'redact') {
        $terms = $payload['text'] ?? [];
        if (!is_array($terms) || count($terms) === 0) {
            $cleanup();
            respondJsonPdfSvc(400, 'Redaction text list is required.');
        }
        $script = $scriptDir . '/redact_pdf.py';
        $output = tempnam(sys_get_temp_dir(), 'pdfsvc_redact_') . '.pdf';
        $temps[] = $output;
        [$code, $stdout, $stderr] = runPythonPdfSvc(
            array_merge($python, [$script]),
            array_merge([$decodedPaths[0], $output], array_map('strval', $terms)),
            $env
        );
        if ($code !== 0 || !file_exists($output)) {
            $cleanup();
            respondJsonPdfSvc(500, trim($stderr ?: $stdout ?: 'Failed to redact PDF.'));
        }
    } else {
        $cleanup();
        respondJsonPdfSvc(400, 'Unsupported operation.');
    }

    if (!file_exists($output)) {
        $cleanup();
        respondJsonPdfSvc(500, 'Output file missing.');
    }

    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . filesize($output));
    header('Content-Disposition: attachment; filename="pdfservice-result.' . ($contentType === 'application/zip' ? 'zip' : 'pdf') . '"');
    readfile($output);
    $cleanup();
    exit;
} catch (Throwable $e) {
    $cleanup();
    respondJsonPdfSvc(500, 'Unexpected error: ' . $e->getMessage());
}
