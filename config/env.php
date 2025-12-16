<?php

declare(strict_types=1);

/**
 * Lightweight .env loader without external dependencies.
 */
if (!function_exists('env')) {
    function env(string $key, $default = null)
    {
        if (array_key_exists($key, $_ENV)) {
            return $_ENV[$key];
        }
        if (array_key_exists($key, $_SERVER)) {
            return $_SERVER[$key];
        }

        $value = getenv($key);

        return $value !== false ? $value : $default;
    }
}

if (!function_exists('loadEnv')) {
    function loadEnv(string $directory): array
    {
        $path = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.env';
        $loaded = [];

        if (!is_readable($path)) {
            return $loaded;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || envStartsWith($line, '#')) {
                continue;
            }

            if (strpos($line, '=') === false) {
                continue;
            }

            [$name, $raw] = explode('=', $line, 2);
            $name = trim($name);
            $value = parseEnvValue(trim($raw));

            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
            $loaded[$name] = $value;
        }

        return $loaded;
    }
}

if (!function_exists('envStartsWith')) {
    function envStartsWith(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

if (!function_exists('envEndsWith')) {
    function envEndsWith(string $haystack, string $needle): bool
    {
        $length = strlen($needle);
        if ($length === 0) {
            return true;
        }

        return substr($haystack, -$length) === $needle;
    }
}

if (!function_exists('parseEnvValue')) {
    function parseEnvValue(string $value): string
    {
        if (envStartsWith($value, '"') && envEndsWith($value, '"')) {
            return stripcslashes(substr($value, 1, -1));
        }

        if (envStartsWith($value, "'") && envEndsWith($value, "'")) {
            return str_replace("\\'", "'", substr($value, 1, -1));
        }

        return $value;
    }
}
