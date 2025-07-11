<?php
/**
 * Environment variable loader
 * 
 * Loads environment variables from .env files and provides
 * utility functions for accessing them.
 */
class EnvLoader {
    private $loaded = false;
    private $logger;
    private $envFile;
    
    /**
     * Create a new environment loader
     * 
     * @param Logger $logger Logger instance
     */
    public function __construct($logger) {
        $this->logger = $logger;
    }
    
    /**
     * Load environment variables from .env file
     * 
     * @return bool Whether loading was successful
     */
    public function load() {
        if ($this->loaded) {
            return true;
        }
        
        // Try multiple possible locations for .env file
        $possibleLocations = [
            dirname(dirname(dirname(__DIR__))) . '/.env',
            dirname(dirname(__DIR__)) . '/.env',
            dirname(__DIR__) . '/.env',
            __DIR__ . '/../../../.env',
            __DIR__ . '/../../.env'
        ];
        
        foreach ($possibleLocations as $location) {
            if (file_exists($location)) {
                $this->envFile = $location;
                $this->logger->info("Found .env file at: {$location}");
                break;
            }
        }
        
        if (!$this->envFile) {
            $this->logger->error("No .env file found in any of the expected locations");
            return false;
        }
        
        $lines = file($this->envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            $this->logger->error("Failed to read .env file: {$this->envFile}");
            return false;
        }
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }
            
            // Parse line
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                // Remove quotes if present
                if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                    $value = substr($value, 1, -1);
                } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                    $value = substr($value, 1, -1);
                }
                
                // Set environment variable
                putenv("$name=$value");
            }
        }
        
        $this->loaded = true;
        $this->logger->info("Environment variables loaded successfully");
        
        return true;
    }
    
    /**
     * Get an environment variable with fallback
     * 
     * @param string $name Variable name
     * @param mixed $default Default value if not found
     * @return mixed Variable value or default
     */
    public function get($name, $default = null) {
        $value = getenv($name);
        
        if ($value === false) {
            $this->logger->warning("Environment variable not found: {$name}");
            return $default;
        }
        
        return $value;
    }
    
    /**
     * Get a required environment variable
     * 
     * @param string $name Variable name
     * @throws Exception if variable is not set
     * @return string Variable value
     */
    public function getRequired($name) {
        $value = $this->get($name);
        
        if ($value === null) {
            $this->logger->error("Required environment variable missing: {$name}");
            throw new Exception("Required environment variable missing: {$name}");
        }
        
        return $value;
    }
    
    /**
     * Check if all required environment variables are set
     * 
     * @param array $requiredVars List of required variable names
     * @return bool Whether all variables are set
     */
    public function validateRequired($requiredVars) {
        $missing = [];
        
        foreach ($requiredVars as $var) {
            if ($this->get($var) === null) {
                $missing[] = $var;
            }
        }
        
        if (!empty($missing)) {
            $this->logger->error("Missing required environment variables", [
                'missing' => $missing
            ]);
            return false;
        }
        
        return true;
    }
}