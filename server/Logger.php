<?php
namespace Leen\Shop;

/**
 * Simple logger class
 */
class Logger {
    private $logPath;
    private $logLevel;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->logPath = LOG_PATH;
        $this->logLevel = LOG_LEVEL;
        
        // Create log directory if it doesn't exist
        if (!file_exists($this->logPath)) {
            mkdir($this->logPath, 0755, true);
        }
    }
    
    /**
     * Log debug message
     * 
     * @param string $message Message to log
     */
    public function debug($message) {
        $this->log('DEBUG', $message);
    }
    
    /**
     * Log info message
     * 
     * @param string $message Message to log
     */
    public function info($message) {
        $this->log('INFO', $message);
    }
    
    /**
     * Log warning message
     * 
     * @param string $message Message to log
     */
    public function warning($message) {
        $this->log('WARNING', $message);
    }
    
    /**
     * Log error message
     * 
     * @param string $message Message to log
     */
    public function error($message) {
        $this->log('ERROR', $message);
    }
    
    /**
     * Log message
     * 
     * @param string $level Log level
     * @param string $message Message to log
     */
    private function log($level, $message) {
        if (!LOG_ENABLED) {
            return;
        }
        
        // Check log level
        $levels = [
            'DEBUG' => 0,
            'INFO' => 1,
            'WARNING' => 2,
            'ERROR' => 3
        ];
        
        $configLevel = strtoupper($this->logLevel);
        if ($levels[$level] < $levels[$configLevel]) {
            return;
        }
        
        // Format log message
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
        
        // Write to log file
        $logFile = $this->logPath . '/maksekeskus_' . date('Y-m-d') . '.log';
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }
}