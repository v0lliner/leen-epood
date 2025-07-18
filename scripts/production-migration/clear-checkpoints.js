#!/usr/bin/env node

/**
 * Checkpoint Cleanup Utility
 * 
 * Clears migration checkpoints and logs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MIGRATION_CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function clearCheckpoints() {
  console.log('🧹 Clearing migration checkpoints and logs...');
  
  const checkpointPath = path.resolve(__dirname, '../../', MIGRATION_CONFIG.CHECKPOINT_FILE);
  const backupPath = checkpointPath + '.backup';
  const logPath = path.resolve(__dirname, '../../', MIGRATION_CONFIG.LOG_FILE_PATH);
  const logsDir = path.dirname(logPath);
  
  let cleared = 0;
  
  // Clear checkpoint files
  [checkpointPath, backupPath].forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${path.basename(filePath)}`);
      cleared++;
    }
  });
  
  // Clear log files
  if (fs.existsSync(logsDir)) {
    const logFiles = fs.readdirSync(logsDir).filter(file => 
      file.endsWith('.log') || file.startsWith('migration-backup-')
    );
    
    logFiles.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
      cleared++;
    });
  }
  
  if (cleared === 0) {
    console.log('ℹ️  No checkpoint or log files found to clear.');
  } else {
    console.log(`🎉 Cleared ${cleared} files successfully!`);
  }
}

clearCheckpoints();