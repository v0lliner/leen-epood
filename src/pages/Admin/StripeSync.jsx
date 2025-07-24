import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/Admin/AdminLayout';
import { migrateAllProducts, syncSingleProduct, processPendingSync, getSyncStatus, debugProducts } from '../../utils/stripe-sync';

const StripeSync = () => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState({ synced: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [migrationResults, setMigrationResults] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Error loading sync status:', err);
      setError('Failed to load sync status');
    }
  };

  const handleDebugProducts = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const results = await debugProducts();
      setDebugInfo(results.debug_info);
      setSuccess('Debug info loaded successfully!');
    } catch (err) {
      setError(`Debug failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateAll = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setMigrationResults(null);

    try {
      const results = await migrateAllProducts(5); // Process 5 products at a time
      setMigrationResults(results);
      setSuccess(results.message || `Migration completed! ${results.migrated} products synced, ${results.failed} failed.`);
      await loadSyncStatus();
    } catch (err) {
      setError(`Migration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const results = await processPendingSync(10);
      setSuccess(`Processed ${results.processed} pending operations.`);
      await loadSyncStatus();
    } catch (err) {
      setError(`Processing failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="stripe-sync-container">
        <div className="sync-header">
          <h1>Stripe Product Synchronization</h1>
          <p>Manage product synchronization between your CMS and Stripe</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✅</div>
            <div className="alert-content">
              <h4>Success</h4>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Sync Status Overview */}
        <div className="status-overview">
          <h2>Sync Status Overview</h2>
          <div className="status-cards">
            <div className="status-card synced">
              <div className="status-number">{syncStatus.synced}</div>
              <div className="status-label">Synced Products</div>
            </div>
            <div className="status-card pending">
              <div className="status-number">{syncStatus.pending}</div>
              <div className="status-label">Pending Sync</div>
            </div>
            <div className="status-card failed">
              <div className="status-number">{syncStatus.failed}</div>
              <div className="status-label">Failed Operations (24h)</div>
            </div>
          </div>
        </div>

        {/* Migration Actions */}
        <div className="migration-section">
          <h2>Migration & Sync Actions</h2>
          
          <div className="action-cards">
            <div className="action-card">
              <div className="action-header">
                <h3>🔄 Migrate All Products</h3>
                <p>Migrate all existing products to Stripe. This will create Stripe products and prices for all available products that haven't been synced yet.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={handleMigrateAll}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Migrating...' : 'Start Migration'}
                </button>
              </div>
            </div>

            <div className="action-card">
              <div className="action-header">
                <h3>⚡ Process Pending</h3>
                <p>Process any pending sync operations that may have failed or are waiting to be retried.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={handleProcessPending}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Processing...' : 'Process Pending'}
                </button>
              </div>
            </div>

            <div className="action-card">
              <div className="action-header">
                <h3>🐛 Debug Products</h3>
                <p>Check which products need syncing and debug any issues with the sync process.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={handleDebugProducts}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Debugging...' : 'Debug Products'}
                </button>
              </div>
            </div>

            <div className="action-card">
              <div className="action-header">
                <h3>📊 Refresh Status</h3>
                <p>Refresh the sync status overview to see the latest synchronization state.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={loadSyncStatus}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Migration Results */}
        {migrationResults && (
          <div className="migration-results">
            <h2>Migration Results</h2>
            <div className="results-summary">
              <div className="result-stat">
                <span className="result-number">{migrationResults.migrated}</span>
                <span className="result-label">Successfully Migrated</span>
              </div>
              <div className="result-stat">
                <span className="result-number">{migrationResults.failed}</span>
                <span className="result-label">Failed</span>
              </div>
            </div>

            {migrationResults.results && migrationResults.results.length > 0 && (
              <div className="results-details">
                <h3>Detailed Results</h3>
                <div className="results-list">
                  {migrationResults.results.map((result, index) => (
                    <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                      <div className="result-product">
                        <strong>{result.product_title}</strong>
                        <span className="result-id">ID: {result.product_id}</span>
                      </div>
                      <div className="result-status">
                        {result.success ? (
                          <span className="status-success">✅ Synced</span>
                        ) : (
                          <span className="status-error">❌ {result.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug Results */}
        {debugInfo && (
          <div className="debug-results">
            <h2>🐛 Debug Information</h2>
            <div className="debug-summary">
              <div className="debug-stat">
                <span className="debug-number">{debugInfo.total_products}</span>
                <span className="debug-label">Total Products</span>
              </div>
              <div className="debug-stat">
                <span className="debug-number">{debugInfo.available_products}</span>
                <span className="debug-label">Available Products</span>
              </div>
              <div className="debug-stat">
                <span className="debug-number">{debugInfo.needs_sync}</span>
                <span className="debug-label">Need Sync</span>
              </div>
            </div>

            {debugInfo.products_needing_sync && debugInfo.products_needing_sync.length > 0 && (
              <div className="debug-details">
                <h3>Products Needing Sync</h3>
                <div className="debug-list">
                  {debugInfo.products_needing_sync.map((product, index) => (
                    <div key={index} className="debug-item">
                      <div className="debug-product">
                        <strong>{product.title}</strong>
                        <span className="debug-id">ID: {product.id}</span>
                      </div>
                      <div className="debug-status">
                        <span className={`debug-badge ${product.has_stripe_product ? 'success' : 'missing'}`}>
                          Product: {product.has_stripe_product ? '✅' : '❌'}
                        </span>
                        <span className={`debug-badge ${product.has_stripe_price ? 'success' : 'missing'}`}>
                          Price: {product.has_stripe_price ? '✅' : '❌'}
                        </span>
                        <span className="debug-sync-status">
                          Status: {product.sync_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Important Notes */}
        <div className="info-section">
          <h2>Important Information</h2>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-header">
                <div className="info-icon">🔄</div>
                <h3>Automatic Sync</h3>
              </div>
              <div className="info-body">
                <p>New products are automatically synced to Stripe when created or updated in the CMS. The sync happens in the background via database triggers.</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <div className="info-icon">⚠️</div>
                <h3>Rate Limits</h3>
              </div>
              <div className="info-body">
                <p>Stripe API has rate limits. The migration processes products in batches with delays to avoid hitting these limits. Large migrations may take time.</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <div className="info-icon">🔒</div>
                <h3>Data Safety</h3>
              </div>
              <div className="info-body">
                <p>All sync operations are logged and can be retried. Failed operations are automatically retried up to 3 times before being marked as failed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stripe-sync-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .sync-header {
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .sync-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
        }

        .sync-header p {
          color: #666;
          font-size: 1rem;
          margin: 0;
        }

        .alert {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid transparent;
        }

        .alert-error {
          background-color: #fff5f5;
          border-color: #fed7d7;
          color: #c53030;
        }

        .alert-success {
          background-color: #f0fff4;
          border-color: #c6f6d5;
          color: #2f855a;
        }

        .alert-icon {
          flex-shrink: 0;
          margin-right: 12px;
          font-size: 1.25rem;
        }

        .alert-content h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .alert-content p {
          margin: 0;
          font-size: 0.9rem;
        }

        .status-overview {
          margin-bottom: 48px;
        }

        .status-overview h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .status-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .status-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
        }

        .status-card.synced {
          border-left-color: #28a745;
        }

        .status-card.pending {
          border-left-color: #ffc107;
        }

        .status-card.failed {
          border-left-color: #dc3545;
        }

        .status-number {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          font-weight: 600;
          color: var(--color-ultramarine);
          display: block;
          margin-bottom: 8px;
        }

        .status-label {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .migration-section {
          margin-bottom: 48px;
        }

        .migration-section h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .action-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .action-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .action-header h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 12px;
          font-size: 1.125rem;
        }

        .action-header p {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .action-footer {
          margin-top: 20px;
        }

        .migration-results {
          margin-bottom: 48px;
        }

        .migration-results h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .results-summary {
          display: flex;
          gap: 32px;
          margin-bottom: 32px;
        }

        .result-stat {
          text-align: center;
        }

        .result-number {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-ultramarine);
          display: block;
          margin-bottom: 4px;
        }

        .result-label {
          font-size: 0.9rem;
          color: #666;
        }

        .results-details {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .results-details h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 16px;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .result-item.success {
          background-color: #f8fff9;
          border-color: #c6f6d5;
        }

        .result-item.error {
          background-color: #fff5f5;
          border-color: #fed7d7;
        }

        .result-product {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .result-id {
          font-size: 0.8rem;
          color: #666;
          font-family: var(--font-heading);
        }

        .status-success {
          color: #2f855a;
          font-weight: 500;
        }

        .status-error {
          color: #c53030;
          font-weight: 500;
        }

        .debug-results {
          margin-bottom: 48px;
        }

        .debug-results h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .debug-summary {
          display: flex;
          gap: 32px;
          margin-bottom: 32px;
        }

        .debug-stat {
          text-align: center;
        }

        .debug-number {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-ultramarine);
          display: block;
          margin-bottom: 4px;
        }

        .debug-label {
          font-size: 0.9rem;
          color: #666;
        }

        .debug-details {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .debug-details h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 16px;
        }

        .debug-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .debug-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #e9ecef;
          background-color: #f8f9fa;
        }

        .debug-product {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .debug-id {
          font-size: 0.8rem;
          color: #666;
          font-family: var(--font-heading);
        }

        .debug-status {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .debug-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .debug-badge.success {
          background-color: #d4edda;
          color: #155724;
        }

        .debug-badge.missing {
          background-color: #f8d7da;
          color: #721c24;
        }

        .debug-sync-status {
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
        }

        .info-section {
          margin-bottom: 32px;
        }

        .info-section h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .info-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .info-icon {
          font-size: 1.5rem;
        }

        .info-header h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin: 0;
          font-size: 1rem;
        }

        .info-body p {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
          box-shadow: 0 2px 4px rgba(47, 62, 156, 0.2);
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
          box-shadow: 0 2px 4px rgba(108, 117, 125, 0.2);
        }

        @media (max-width: 768px) {
          .stripe-sync-container {
            padding: 24px 16px;
          }

          .status-cards {
            grid-template-columns: 1fr;
          }

          .action-cards {
            grid-template-columns: 1fr;
          }

          .info-cards {
            grid-template-columns: 1fr;
          }

          .results-summary {
            flex-direction: column;
            gap: 16px;
          }

          .result-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .debug-summary {
            flex-direction: column;
            gap: 16px;
          }

          .debug-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .debug-status {
            align-self: stretch;
            justify-content: flex-start;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default StripeSync;