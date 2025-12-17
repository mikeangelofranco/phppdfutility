<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

loadEnv(__DIR__ . '/..');

function respondJsonSplit(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJsonSplit(405, 'Only POST is allowed.');
}

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    respondJsonSplit(400, 'PDF upload missing.');
}

$srcPath = $_FILES['file']['tmp_name'];
$originalName = $_FILES['file']['name'] ?? 'document.pdf';

$tmpBase = tempnam(sys_get_temp_dir(), 'split_pdf_');
if ($tmpBase === false) {
    respondJsonSplit(500, 'Unable to prepare temporary file.');
}
$tmpZip = $tmpBase . '.zip';
@unlink($tmpBase);

$scriptPath = realpath(__DIR__ . '/../scripts/split_pdf.py');
$vendorPy = realpath(__DIR__ . '/../vendor_py');

if ($scriptPath === false || !file_exists($scriptPath)) {
    respondJsonSplit(500, 'Split script is missing.');
}

function resolvePythonCommandSplit(): array
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

$pythonParts = resolvePythonCommandSplit();
if (count($pythonParts) === 0) {
    respondJsonSplit(500, 'Python runtime is not available for splitting.');
}

$cmd = array_merge(
    $pythonParts,
    [$scriptPath, $srcPath, $tmpZip]
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
    respondJsonSplit(500, 'Unable to start split process.');
}

fclose($pipes[0]);
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$exitCode = proc_close($process);

if ($exitCode !== 0 || !file_exists($tmpZip)) {
    @unlink($tmpZip);
    $message = trim($stderr ?: $stdout ?: 'Failed to split the PDF.');
    respondJsonSplit(500, $message);
}

$downloadName = preg_replace('/\\.pdf$/i', '', $originalName);
$downloadName = $downloadName !== '' ? $downloadName : 'document';
$downloadName = str_replace(['"', '\\'], '', $downloadName) . '-split.zip';

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Content-Length: ' . filesize($tmpZip));
readfile($tmpZip);
@unlink($tmpZip);
exit;
