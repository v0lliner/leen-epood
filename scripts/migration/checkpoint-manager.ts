/**
 * Checkpoint management for migration resume capabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { CheckpointData, MigrationProgress } from './types';
import { Logger } from './logger';

export class CheckpointManager {
  private checkpointFile: string;
  private logger: Logger;
  private checkpointInterval: number;

  constructor(logger: Logger, checkpointInterval: number = 100) {
    this.logger = logger.createChildLogger('checkpoint');
    this.checkpointInterval = checkpointInterval;
    
    const timestamp = new Date().toISOString().split('T')[0];
    this.checkpointFile = path.join(
      process.cwd(),
      'checkpoints',
      `migration-checkpoint-${timestamp}.json`
    );
    
    this.ensureCheckpointDirectory();
  }

  private ensureCheckpointDirectory(): void {
    const checkpointDir = path.dirname(this.checkpointFile);
    if (!fs.existsSync(checkpointDir)) {
      fs.mkdirSync(checkpointDir, { recursive: true });
    }
  }

  public saveCheckpoint(
    lastProcessedId: string,
    progress: MigrationProgress,
    configHash: string
  ): void {
    try {
      const checkpointData: CheckpointData = {
        lastProcessedId,
        progress,
        timestamp: new Date(),
        configHash,
      };

      fs.writeFileSync(
        this.checkpointFile,
        JSON.stringify(checkpointData, null, 2)
      );

      this.logger.debug('Checkpoint saved', {
        lastProcessedId,
        processedRecords: progress.processedRecords,
        totalRecords: progress.totalRecords,
      });
    } catch (error) {
      this.logger.error('Failed to save checkpoint', {}, error);
    }
  }

  public loadCheckpoint(): CheckpointData | null {
    try {
      if (!fs.existsSync(this.checkpointFile)) {
        this.logger.info('No existing checkpoint found');
        return null;
      }

      const checkpointData = JSON.parse(
        fs.readFileSync(this.checkpointFile, 'utf-8')
      ) as CheckpointData;

      // Convert timestamp back to Date object
      checkpointData.timestamp = new Date(checkpointData.timestamp);
      checkpointData.progress.startTime = new Date(checkpointData.progress.startTime);
      
      if (checkpointData.progress.estimatedCompletion) {
        checkpointData.progress.estimatedCompletion = new Date(
          checkpointData.progress.estimatedCompletion
        );
      }

      this.logger.info('Checkpoint loaded', {
        timestamp: checkpointData.timestamp,
        lastProcessedId: checkpointData.lastProcessedId,
        processedRecords: checkpointData.progress.processedRecords,
      });

      return checkpointData;
    } catch (error) {
      this.logger.error('Failed to load checkpoint', {}, error);
      return null;
    }
  }

  public shouldSaveCheckpoint(processedCount: number): boolean {
    return processedCount % this.checkpointInterval === 0;
  }

  public clearCheckpoint(): void {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        fs.unlinkSync(this.checkpointFile);
        this.logger.info('Checkpoint cleared');
      }
    } catch (error) {
      this.logger.error('Failed to clear checkpoint', {}, error);
    }
  }

  public validateCheckpoint(checkpointData: CheckpointData, configHash: string): boolean {
    if (checkpointData.configHash !== configHash) {
      this.logger.warn('Checkpoint configuration mismatch', {
        checkpointHash: checkpointData.configHash,
        currentHash: configHash,
      });
      return false;
    }

    // Check if checkpoint is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const age = Date.now() - checkpointData.timestamp.getTime();
    
    if (age > maxAge) {
      this.logger.warn('Checkpoint is too old', {
        age: Math.round(age / (60 * 60 * 1000)),
        maxAgeHours: 24,
      });
      return false;
    }

    return true;
  }

  public getCheckpointFile(): string {
    return this.checkpointFile;
  }
}