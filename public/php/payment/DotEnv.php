<?php

class DotEnv
{
    private static $variables = [];
    private static $loaded = false;

    public static function load($path)
    {
        if (self::$loaded) {
            return;
        }

        $envFile = $path . '/.env';
        if (!file_exists($envFile)) {
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // Remove quotes if present
            if (preg_match('/^"(.*)"$/', $value, $matches)) {
                $value = $matches[1];
            } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                $value = $matches[1];
            }

            self::$variables[$name] = $value;
            $_ENV[$name] = $value;
            putenv("$name=$value");
        }

        self::$loaded = true;
    }

    public static function get($key, $default = null)
    {
        return self::$variables[$key] ?? $_ENV[$key] ?? getenv($key) ?? $default;
    }
}