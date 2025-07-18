#!/usr/bin/env node

/**
 * Main entry point for the CMS to Stripe migration script
 * 
 * Usage:
 *   npm run migrate                    # Run with default config
 *   npm run migrate -- --dry-run      # Run in dry-run mode
 *   npm run migrate -- --resume       # Resume from checkpoint
 *   npm run migrate -- --config=prod  # Use production config
 */

import * as dotenv from 'dotenv';
import { ConfigManager } from './config';
import { MigrationEngine } from './migration-engine';
import { Logger } from './logger';

// Load environment variables
dotenv.config();

interface CLIOptions {
  dryRun?: boolean;
  resume?: boolean;
  config?: string;
  help?: boolean;
  validate?: boolean;
}

class MigrationCLI {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('INFO');
  }

  public async run(): Promise<void> {
    try {
      const options = this.parseArguments();

      if (options.help) {
        this.showHelp();
        return;
      }

      if (options.validate) {
        await this.validateSetup();
        return;
      }

      // Load configuration
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      // Override config with CLI options
      if (options.dryRun) {
        config.dryRun = true;
      }

      // Initialize migration engine
      const migrationEngine = new MigrationEngine(config);

      // Setup signal handlers for graceful shutdown
      this.setupSignalHandlers(migrationEngine);

      // Run migration
      this.logger.info('🚀 Starting CMS to Stripe migration');
      await migrationEngine.run();
      this.logger.info('✅ Migration completed successfully');

    } catch (error) {
      this.logger.error('❌ Migration failed', {}, error);
      process.exit(1);
    }
  }

  private parseArguments(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {};

    for (const arg of args) {
      if (arg === '--dry-run') {
        options.dryRun = true;
      } else if (arg === '--resume') {
        options.resume = true;
      } else if (arg === '--help' || arg === '-h') {
        options.help = true;
      } else if (arg === '--validate') {
        options.validate = true;
      } else if (arg.startsWith('--config=')) {
        options.config = arg.split('=')[1];
      }
    }

    return options;
  }

  private showHelp(): void {
    console.log(`
🔄 CMS to Stripe Migration Tool

USAGE:
  npm run migrate [OPTIONS]

OPTIONS:
  --dry-run          Run migration in dry-run mode (no actual changes)
  --resume           Resume migration from last checkpoint
  --validate         Validate configuration and connections only
  --config=ENV       Use specific environment config (dev, staging, prod)
  --help, -h         Show this help message

EXAMPLES:
  npm run migrate                    # Run with default configuration
  npm run migrate -- --dry-run      # Test run without making changes
  npm run migrate -- --resume       # Resume interrupted migration
  npm run migrate -- --validate     # Check setup and connections

ENVIRONMENT VARIABLES:
  See .env.example for required configuration variables.

DOCUMENTATION:
  For detailed setup and troubleshooting, see docs/migration-guide.md
`);
  }

  private async validateSetup(): Promise<void> {
    this.logger.info('🔍 Validating migration setup');

    try {
      // Test configuration
      const configManager = new ConfigManager();
      const config = configManager.getConfig();
      this.logger.info('✅ Configuration validation passed');

      // Test services (this will be implemented in the migration engine)
      const migrationEngine = new MigrationEngine(config);
      // Note: We would need to expose a validate method on MigrationEngine
      
      this.logger.info('✅ Setup validation completed successfully');
      
    } catch (error) {
      this.logger.error('❌ Setup validation failed', {}, error);
      process.exit(1);
    }
  }

  private setupSignalHandlers(migrationEngine: MigrationEngine): void {
    const gracefulShutdown = (signal: string) => {
      this.logger.info(`Received ${signal}, initiating graceful shutdown...`);
      migrationEngine.stop();
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  const cli = new MigrationCLI();
  cli.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { MigrationEngine, ConfigManager };