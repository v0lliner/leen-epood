/**
 * Advanced Logging System for Migration
 * 
 * Provides structured logging with multiple levels, file output, and error tracking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MIGRATION_CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationLogger {
  constructor() {
    this.logLevel = MIGRATION_CONFIG.LOG_LEVEL;
    this.logToFile = MIGRATION_CONFIG.LOG_TO_FILE;
    this.logFilePath = path.resolve(__dirname, '../../', MIGRATION_CONFIG.LOG_FILE_PATH);
    this.startTime = new Date();
    this.errorCount = 0;
    this.warningCount = 0;
    
    this.initializeLogFile();
  }

  initializeLogFile() {
    if (!this.logToFile) return;
    
    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Initialize log file with session header
      const header = `\n${'='.repeat(80)}\nMIGRATION SESSION STARTED: ${this.startTime.toISOString()}\n${'='.repeat(80)}\n`;
      fs.appendFileSync(this.logFilePath, header);
    } catch (error) {
      console.error('Failed to initialize log file:', error.message);
      this.logToFile = false;
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime.getTime();
    const elapsedFormatted = `+${(elapsed / 1000).toFixed(2)}s`;
    
    let formattedMessage = `[${timestamp}] [${elapsedFormatted}] [${level}] ${message}`;
    
    if (data) {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    return formattedMessage;
  }

  shouldLog(level) {
    const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  writeToFile(message) {
    if (!this.logToFile) return;
    
    try {
      fs.appendFileSync(this.logFilePath, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  debug(message, data = null) {
    if (!this.shouldLog('DEBUG')) return;
    
    const formatted = this.formatMessage('DEBUG', message, data);
    console.log(`🔍 ${formatted}`);
    this.writeToFile(formatted);
  }

  info(message, data = null) {
    if (!this.shouldLog('INFO')) return;
    
    const formatted = this.formatMessage('INFO', message, data);
    console.log(`ℹ️  ${formatted}`);
    this.writeToFile(formatted);
  }

  warn(message, data = null) {
    if (!this.shouldLog('WARN')) return;
    
    this.warningCount++;
    const formatted = this.formatMessage('WARN', message, data);
    console.warn(`⚠️  ${formatted}`);
    this.writeToFile(formatted);
  }

  error(message, error = null, data = null) {
    this.errorCount++;
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...data
    } : data;
    
    const formatted = this.formatMessage('ERROR', message, errorData);
    console.error(`❌ ${formatted}`);
    this.writeToFile(formatted);
  }

  success(message, data = null) {
    const formatted = this.formatMessage('SUCCESS', message, data);
    console.log(`✅ ${formatted}`);
    this.writeToFile(formatted);
  }

  progress(current, total, message = '') {
    const percentage = ((current / total) * 100).toFixed(1);
    const progressBar = this.createProgressBar(current, total);
    const progressMessage = `Progress: ${progressBar} ${percentage}% (${current}/${total}) ${message}`;
    
    console.log(`🔄 ${progressMessage}`);
    this.writeToFile(this.formatMessage('PROGRESS', progressMessage));
  }

  createProgressBar(current, total, width = 30) {
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }

  summary() {
    const duration = Date.now() - this.startTime.getTime();
    const durationFormatted = `${(duration / 1000).toFixed(2)}s`;
    
    const summaryData = {
      duration: durationFormatted,
      errors: this.errorCount,
      warnings: this.warningCount,
      startTime: this.startTime.toISOString(),
      endTime: new Date().toISOString()
    };
    
    const message = `Migration session completed in ${durationFormatted} with ${this.errorCount} errors and ${this.warningCount} warnings`;
    
    console.log(`\n📊 ${this.formatMessage('SUMMARY', message, summaryData)}`);
    this.writeToFile(`\n${this.formatMessage('SUMMARY', message, summaryData)}`);
    
    if (this.logToFile) {
      console.log(`📝 Full log available at: ${this.logFilePath}`);
    }
    
    return summaryData;
  }
}

export default MigrationLogger;