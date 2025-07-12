<?php

class DotEnv
{
    /**
     * Get an environment variable
     * 
     * @param string $key The environment variable name
     * @param mixed $default Default value if the environment variable is not set
     * @return mixed The environment variable value or the default value
     */
    public static function get($key, $default = null)
    {
        // First check $_SERVER which is most reliable
        if (isset($_SERVER[$key])) {
            return $_SERVER[$key];
        }
        
        // Then check $_ENV
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        
        // Finally check getenv()
        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }
        
        // Return default if not found
        return $default;
    }

    /**
     * Load environment variables from server environment
     * This is a no-op function that exists for backward compatibility
     */
    public static function load($path)
    {
        // This function now does nothing - we're bypassing .env file completely
        // It exists only for backward compatibility
        return;
    }
}