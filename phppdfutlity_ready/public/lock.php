<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

loadEnv(__DIR__ . '/..');

set_time_limit(30);

function respondJson(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJson(405, 'Only POST is allowed.');
}

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    respondJson(400, 'PDF upload missing.');
}

$maxBytes = (int) env('MAX_UPLOAD_BYTES', 25 * 1024 * 1024); // 25MB default
$srcPath = $_FILES['file']['tmp_name'];
$originalName = $_FILES['file']['name'] ?? 'document.pdf';
$size = filesize($srcPath);
if ($size === false || $size <= 0) {
    respondJson(400, 'Uploaded file is empty.');
}
if ($size > $maxBytes) {
    respondJson(400, 'Uploaded file exceeds size limit.');
}

$mime = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = $finfo ? finfo_file($finfo, $srcPath) : '';
    if ($finfo) {
        finfo_close($finfo);
    }
}
$looksPdf = stripos((string) $mime, 'pdf') !== false || preg_match('/\\.pdf$/i', $originalName);
if (!$looksPdf) {
    respondJson(400, 'Uploaded file must be a PDF.');
}

$password = trim((string) ($_POST['password'] ?? ''));
if ($password === '') {
    respondJson(400, 'Password is required.');
}

$tmpBase = tempnam(sys_get_temp_dir(), 'locked_pdf_');
if ($tmpBase === false) {
    respondJson(500, 'Unable to prepare temporary file.');
}
$tmpOut = $tmpBase . '.pdf';
@unlink($tmpBase);

$scriptPath = realpath(__DIR__ . '/../scripts/lock_pdf.py');
$vendorPy = realpath(__DIR__ . '/../vendor_py');

if ($scriptPath === false || !file_exists($scriptPath)) {
    respondJson(500, 'Lock script is missing.');
}

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

if ($vendorPy) {
    $env['PYTHONPATH'] = $vendorPy;
}

/**
 * Locate a Python executable available on the host.
 *
 * @return string[] Command parts (e.g., ['python'] or ['py', '-3'])
 */
function resolvePythonCommand(): array
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

$pythonParts = resolvePythonCommand();
if (count($pythonParts) === 0) {
    respondJson(500, 'Python runtime is not available for locking.');
}

$cmd = array_merge(
    $pythonParts,
    [$scriptPath, $srcPath, $tmpOut, $password]
);

$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$process = proc_open(
    implode(' ', array_map('escapeshellarg', $cmd)),
    $descriptors,
    $pipes,
    null,
    $env
);

if (!is_resource($process)) {
    respondJson(500, 'Unable to start lock process.');
}

fclose($pipes[0]);
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$exitCode = proc_close($process);

if ($exitCode !== 0 || !file_exists($tmpOut)) {
    @unlink($tmpOut);
    $message = trim($stderr ?: $stdout ?: 'Failed to lock the PDF.');
    respondJson(500, $message);
}

$downloadName = preg_replace('/\\.pdf$/i', '', $originalName);
$downloadName = $downloadName !== '' ? $downloadName : 'document';
$downloadName = str_replace(['"', '\\'], '', $downloadName) . '-locked.pdf';

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Content-Length: ' . filesize($tmpOut));
readfile($tmpOut);
@unlink($tmpOut);
exit;
