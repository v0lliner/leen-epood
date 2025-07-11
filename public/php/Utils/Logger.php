<?php
namespace Utils;

/**
 * Structured logging utility for payment processing
 * 
 * Provides consistent logging across all payment-related operations
 * with proper error handling and file management.
 */
class Logger {
    private $logFile;
    private $logDir;
    private $component;
    
    /**
     * Create a new logger instance
     * 
     * @param string $component Component name for log prefix
     * @param string $logFile Log file name (without directory)
     */
    public function __construct($component, $logFile) {
        $this->component = $component;
        $this->logFile = $logFile;
        $this->logDir = dirname(dirname(__DIR__)) . '/logs';
        
        // Ensure log directory exists
        if (!is_dir($this->logDir)) {
            if (!mkdir($this->logDir, 0777, true)) {
                error_log("Failed to create log directory: {$this->logDir}");
            } else {
                chmod($this->logDir, 0777); // Ensure directory is writable
            }
        }
    }
    
    /**
     * Log a message with optional data
     * 
     * @param string $message Log message
     * @param mixed $data Optional data to include in log
     * @param string $level Log level (info, warning, error)
     * @return bool Success status
     */
    public function log($message, $data = null, $level = 'info') {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] [{$level}] [{$this->component}] {$message}";
        
        if ($data !== null) {
            if (is_array($data) || is_object($data)) {
                $logEntry .= ": " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } else {
                $logEntry .= ": " . $data;
            }
        }
        
        $logEntry .= PHP_EOL;
        
        $fullPath = $this->logDir . '/' . $this->logFile;
        
        // Try to write to log file
        $result = @file_put_contents($fullPath, $logEntry, FILE_APPEND);
        
        // If writing fails, try to create the file
        if ($result === false) {
            @touch($fullPath);
            @chmod($fullPath, 0666);
            $result = @file_put_contents($fullPath, $logEntry, FILE_APPEND);
        }
        
        // If still failing, log to PHP error log
        if ($result === false) {
            error_log("Failed to write to log file {$fullPath}. Message: {$logEntry}");
            return false;
        }
        
        return true;
    }
    
    /**
     * Log an info message
     * 
     * @param string $message Log message
     * @param mixed $data Optional data to include in log
     * @return bool Success status
     */
    public function info($message, $data = null) {
        return $this->log($message, $data, 'info');
    }
    
    /**
     * Log a warning message
     * 
     * @param string $message Log message
     * @param mixed $data Optional data to include in log
     * @return bool Success status
     */
    public function warning($message, $data = null) {
        return $this->log($message, $data, 'warning');
    }
    
    /**
     * Log an error message
     * 
     * @param string $message Log message
     * @param mixed $data Optional data to include in log
     * @return bool Success status
     */
    public function error($message, $data = null) {
        return $this->log($message, $data, 'error');
    }
    
    /**
     * Log an exception with stack trace
     * 
     * @param Exception $e Exception to log
     * @param string $context Optional context information
     * @return bool Success status
     */
    public function exception($e, $context = '') {
        $message = $context ? "{$context}: " : "";
        $message .= get_class($e) . ": {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}";
        
        $data = [
            'trace' => $e->getTraceAsString()
        ];
        
        return $this->log($message, $data, 'error');
    }
}