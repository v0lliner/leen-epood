/**
 * Checkpoint and Recovery System
 * 
 * Manages migration state persistence and recovery capabilities.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MIGRATION_CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CheckpointManager {
  constructor(logger) {
    this.logger = logger;
    this.checkpointPath = path.resolve(__dirname, '../../', MIGRATION_CONFIG.CHECKPOINT_FILE);
    this.backupPath = this.checkpointPath + '.backup';
    this.checkpointInterval = MIGRATION_CONFIG.CHECKPOINT_INTERVAL;
    this.lastCheckpoint = 0;
    
    this.ensureCheckpointDirectory();
  }

  ensureCheckpointDirectory() {
    try {
      const checkpointDir = path.dirname(this.checkpointPath);
      if (!fs.existsSync(checkpointDir)) {
        fs.mkdirSync(checkpointDir, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to create checkpoint directory', error);
    }
  }

  saveCheckpoint(migrationState) {
    try {
      // Create backup of existing checkpoint
      if (fs.existsSync(this.checkpointPath)) {
        fs.copyFileSync(this.checkpointPath, this.backupPath);
      }
      
      const checkpointData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        state: migrationState,
        metadata: {
          processedCount: migrationState.processedCount || 0,
          successCount: migrationState.successCount || 0,
          errorCount: migrationState.errorCount || 0,
          lastProcessedId: migrationState.lastProcessedId || null
        }
      };
      
      fs.writeFileSync(this.checkpointPath, JSON.stringify(checkpointData, null, 2));
      this.lastCheckpoint = migrationState.processedCount || 0;
      
      this.logger.debug('Checkpoint saved', {
        processedCount: checkpointData.metadata.processedCount,
        timestamp: checkpointData.timestamp
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to save checkpoint', error);
      return false;
    }
  }

  loadCheckpoint() {
    try {
      if (!fs.existsSync(this.checkpointPath)) {
        this.logger.info('No existing checkpoint found, starting fresh migration');
        return null;
      }
      
      const checkpointData = JSON.parse(fs.readFileSync(this.checkpointPath, 'utf8'));
      
      // Validate checkpoint structure
      if (!checkpointData.version || !checkpointData.state) {
        throw new Error('Invalid checkpoint format');
      }
      
      this.logger.info('Checkpoint loaded successfully', {
        timestamp: checkpointData.timestamp,
        processedCount: checkpointData.metadata.processedCount
      });
      
      return checkpointData.state;
    } catch (error) {
      this.logger.error('Failed to load checkpoint', error);
      
      // Try to load backup
      return this.loadBackupCheckpoint();
    }
  }

  loadBackupCheckpoint() {
    try {
      if (!fs.existsSync(this.backupPath)) {
        this.logger.warn('No backup checkpoint available');
        return null;
      }
      
      const backupData = JSON.parse(fs.readFileSync(this.backupPath, 'utf8'));
      
      this.logger.warn('Loaded backup checkpoint', {
        timestamp: backupData.timestamp,
        processedCount: backupData.metadata.processedCount
      });
      
      return backupData.state;
    } catch (error) {
      this.logger.error('Failed to load backup checkpoint', error);
      return null;
    }
  }

  shouldSaveCheckpoint(currentCount) {
    return currentCount - this.lastCheckpoint >= this.checkpointInterval;
  }

  clearCheckpoint() {
    try {
      if (fs.existsSync(this.checkpointPath)) {
        fs.unlinkSync(this.checkpointPath);
      }
      if (fs.existsSync(this.backupPath)) {
        fs.unlinkSync(this.backupPath);
      }
      
      this.logger.info('Checkpoints cleared');
      return true;
    } catch (error) {
      this.logger.error('Failed to clear checkpoints', error);
      return false;
    }
  }

  createMigrationBackup(products) {
    if (!MIGRATION_CONFIG.BACKUP_BEFORE_MIGRATION) {
      return true;
    }
    
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        productCount: products.length,
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          stripe_product_id: p.stripe_product_id,
          stripe_price_id: p.stripe_price_id,
          sync_status: p.sync_status
        }))
      };
      
      const backupPath = path.resolve(__dirname, '../../logs', `migration-backup-${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      
      this.logger.info('Migration backup created', {
        backupPath,
        productCount: products.length
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to create migration backup', error);
      return false;
    }
  }

  getRecoveryInfo() {
    try {
      const checkpoint = this.loadCheckpoint();
      if (!checkpoint) {
        return { hasRecoveryData: false };
      }
      
      return {
        hasRecoveryData: true,
        lastProcessedId: checkpoint.lastProcessedId,
        processedCount: checkpoint.processedCount,
        timestamp: checkpoint.timestamp
      };
    } catch (error) {
      this.logger.error('Failed to get recovery info', error);
      return { hasRecoveryData: false, error: error.message };
    }
  }
}

export default CheckpointManager;