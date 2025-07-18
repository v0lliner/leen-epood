/**
 * Advanced logging system for migration operations
 */

import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
  correlationId?: string;
}

export class Logger {
  private logLevel: LogLevel;
  private logFile: string;
  private correlationId: string;

  constructor(logLevel: LogLevel = 'INFO', logFile?: string) {
    this.logLevel = logLevel;
    this.correlationId = this.generateCorrelationId();
    
    if (logFile) {
      this.logFile = logFile;
      this.ensureLogDirectory();
    } else {
      const timestamp = new Date().toISOString().split('T')[0];
      this.logFile = path.join(process.cwd(), 'logs', `migration-${timestamp}.log`);
      this.ensureLogDirectory();
    }
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? ` | Error: ${entry.error.message}\nStack: ${entry.error.stack}` : '';
    const correlationId = entry.correlationId ? ` | ID: ${entry.correlationId}` : '';
    
    return `[${timestamp}] ${entry.level}${correlationId} | ${entry.message}${context}${error}\n`;
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const logLine = this.formatLogEntry(entry);
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const message = this.formatLogEntry(entry).trim();
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(message);
        break;
      case 'INFO':
        console.info(message);
        break;
      case 'WARN':
        console.warn(message);
        break;
      case 'ERROR':
        console.error(message);
        break;
    }
  }

  public log(level: LogLevel, message: string, context?: any, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
      correlationId: this.correlationId,
    };

    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  public debug(message: string, context?: any): void {
    this.log('DEBUG', message, context);
  }

  public info(message: string, context?: any): void {
    this.log('INFO', message, context);
  }

  public warn(message: string, context?: any, error?: Error): void {
    this.log('WARN', message, context, error);
  }

  public error(message: string, context?: any, error?: Error): void {
    this.log('ERROR', message, context, error);
  }

  public setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  public getCorrelationId(): string {
    return this.correlationId;
  }

  public createChildLogger(suffix: string): Logger {
    const childLogger = new Logger(this.logLevel, this.logFile);
    childLogger.setCorrelationId(`${this.correlationId}-${suffix}`);
    return childLogger;
  }
}

// Progress logger for real-time updates
export class ProgressLogger {
  private logger: Logger;
  private startTime: Date;
  private lastUpdate: Date;

  constructor(logger: Logger) {
    this.logger = logger;
    this.startTime = new Date();
    this.lastUpdate = new Date();
  }

  public logProgress(
    processed: number,
    total: number,
    successful: number,
    failed: number,
    currentItem?: string
  ): void {
    const now = new Date();
    const elapsed = now.getTime() - this.startTime.getTime();
    const rate = processed / (elapsed / 1000);
    const remaining = total - processed;
    const eta = remaining > 0 ? new Date(now.getTime() + (remaining / rate) * 1000) : null;

    const progress = {
      processed,
      total,
      successful,
      failed,
      percentage: ((processed / total) * 100).toFixed(2),
      rate: rate.toFixed(2),
      elapsed: this.formatDuration(elapsed),
      eta: eta ? eta.toISOString() : 'N/A',
      currentItem,
    };

    this.logger.info('Migration progress update', progress);

    // Update console with a clean progress line
    if (now.getTime() - this.lastUpdate.getTime() > 5000) { // Update every 5 seconds
      console.log(`\n📊 Progress: ${progress.percentage}% (${processed}/${total}) | Success: ${successful} | Failed: ${failed} | Rate: ${progress.rate}/s | ETA: ${progress.eta}`);
      this.lastUpdate = now;
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}