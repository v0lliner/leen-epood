import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/Admin/AdminLayout';
import { 
  queueAllProducts, 
  processStripeQueue, 
  getQueueStats, 
  cleanupQueue,
  getSyncStatus 
} from '../../utils/stripe-sync';

const StripeSync = () => {
  const { t } = useTranslation();
  const [queueStats, setQueueStats] = useState({ stats: [], recent_items: [] });
  const [syncStatus, setSyncStatus] = useState({ synced: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [queueData, statusData] = await Promise.all([
        getQueueStats(),
        getSyncStatus()
      ]);
      
      setQueueStats(queueData);
      setSyncStatus(statusData);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error loading data:', err);
      }
      setError('Failed to load sync data');
    }
  };

  const handleQueueAllProducts = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setResults(null);

    try {
      const result = await queueAllProducts();
      setSuccess(result.message || `Successfully queued ${result.queued} products for sync!`);
      await loadData();
    } catch (err) {
      setError(`Failed to queue products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessQueue = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setResults(null);

    try {
      const result = await processStripeQueue(10);
      setResults(result);
      setSuccess(result.message || `Processed ${result.processed} items successfully!`);
      await loadData();
    } catch (err) {
      setError(`Failed to process queue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFullMigration = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setResults(null);

    try {
      // First queue all products
      const queueResult = await queueAllProducts();
      
      if (queueResult.queued === 0) {
        setSuccess('All products are already synced!');
        return;
      }

      // Then process the queue
      const processResult = await processStripeQueue(queueResult.queued);
      setResults(processResult);
      setSuccess(`Full migration completed! ${processResult.successful} products synced, ${processResult.failed} failed.`);
      await loadData();
    } catch (err) {
      setError(`Migration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupQueue = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await cleanupQueue();
      setSuccess(result.message || 'Queue cleaned up successfully!');
      await loadData();
    } catch (err) {
      setError(`Cleanup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status) => {
    const stat = queueStats.stats?.find(s => s.status === status);
    return stat?.count || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('et-EE');
  };

  return (
    <AdminLayout>
      <div className="stripe-sync-container">
        <div className="sync-header">
          <h1>🏆 New Queue-Based Stripe Sync</h1>
          <p>Robust, scalable Stripe product synchronization with queue management</p>
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

        {/* Queue Status Overview */}
        <div className="status-overview">
          <h2>📊 Queue Status</h2>
          <div className="status-cards">
            <div className="status-card pending">
              <div className="status-number">{getStatusCount('pending')}</div>
              <div className="status-label">Pending Operations</div>
            </div>
            <div className="status-card processing">
              <div className="status-number">{getStatusCount('processing')}</div>
              <div className="status-label">Currently Processing</div>
            </div>
            <div className="status-card completed">
              <div className="status-number">{getStatusCount('completed')}</div>
              <div className="status-label">Completed</div>
            </div>
            <div className="status-card failed">
              <div className="status-number">{getStatusCount('failed')}</div>
              <div className="status-label">Failed</div>
            </div>
            <div className="status-card retrying">
              <div className="status-number">{getStatusCount('retrying')}</div>
              <div className="status-label">Retrying</div>
            </div>
          </div>
        </div>

        {/* Product Sync Status */}
        <div className="product-status-overview">
          <h2>🛍️ Product Sync Status</h2>
          <div className="product-status-cards">
            <div className="status-card synced">
              <div className="status-number">{syncStatus.synced}</div>
              <div className="status-label">Tõeliselt Sünkroonitud</div>
              <div className="status-sublabel">Stripe ID-d olemas</div>
            </div>
            <div className="status-card pending">
              <div className="status-number">{syncStatus.pending}</div>
              <div className="status-label">Ootab Sünkroonimist</div>
            </div>
            <div className="status-card failed">
              <div className="status-number">{syncStatus.failed}</div>
              <div className="status-label">Ebaõnnestunud</div>
            </div>
          </div>
        </div>

        {/* Queue Actions */}
        <div className="queue-actions">
          <h2>🎯 Queue Management</h2>
          
          <div className="action-cards">
            <div className="action-card primary">
              <div className="action-header">
                <h3>🚀 Full Migration</h3>
                <p>Queue all products that need syncing and process them immediately. This is the recommended way to start.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={handleFullMigration}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Running Migration...' : 'Start Full Migration'}
                </button>
              </div>
            </div>

            <div className="action-card">
              <div className="action-header">
                <h3>📦 Queue All Products</h3>
                <p>Add all products that need syncing to the queue. Use this to prepare for batch processing.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={handleQueueAllProducts}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Queueing...' : 'Queue All Products'}
                </button>
              </div>
            </div>

            <div className="action-card">
              <div className="action-header">
                <h3>⚡ Process Queue</h3>
                <p>Process pending items in the sync queue. This will sync queued products to Stripe.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={handleProcessQueue}
                  disabled={loading || getStatusCount('pending') === 0}
                  className="btn btn-secondary"
                >
                  {loading ? 'Processing...' : `Process Queue (${getStatusCount('pending')} items)`}
                </button>
              </div>
            </div>

            <div className="action-card">
              <div className="action-header">
                <h3>🧹 Cleanup Queue</h3>
                <p>Remove old completed operations from the queue to keep it clean.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={handleCleanupQueue}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Cleaning...' : 'Cleanup Old Items'}
                </button>
              </div>
            </div>

            <div className="action-card">
              <div className="action-header">
                <h3>🔄 Refresh Data</h3>
                <p>Reload queue statistics and sync status to see the latest state.</p>
              </div>
              <div className="action-footer">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Results */}
        {results && (
          <div className="processing-results">
            <h2>📋 Processing Results</h2>
            <div className="results-summary">
              <div className="result-stat">
                <span className="result-number">{results.processed}</span>
                <span className="result-label">Total Processed</span>
              </div>
              <div className="result-stat">
                <span className="result-number">{results.successful}</span>
                <span className="result-label">Successful</span>
              </div>
              <div className="result-stat">
                <span className="result-number">{results.failed}</span>
                <span className="result-label">Failed</span>
              </div>
            </div>

            {results.results && results.results.length > 0 && (
              <div className="results-details">
                <h3>Detailed Results</h3>
                <div className="results-list">
                  {results.results.map((result, index) => (
                    <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                      <div className="result-info">
                        <strong>Product ID: {result.product_id}</strong>
                        <span className="result-operation">{result.operation_type}</span>
                      </div>
                      <div className="result-status">
                        {result.success ? (
                          <span className="status-success">✅ Success</span>
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

        {/* Recent Queue Items */}
        {queueStats.recent_items && queueStats.recent_items.length > 0 && (
          <div className="recent-items">
            <h2>📝 Recent Queue Items</h2>
            <div className="items-table">
              <div className="table-header">
                <div className="table-cell">Product</div>
                <div className="table-cell">Operation</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Retries</div>
                <div className="table-cell">Created</div>
                <div className="table-cell">Processed</div>
              </div>
              {queueStats.recent_items.slice(0, 10).map((item) => (
                <div key={item.id} className="table-row">
                  <div className="table-cell">
                    <div className="product-info">
                      <strong>{item.products?.title || 'Unknown Product'}</strong>
                      <span className="product-id">{item.product_id}</span>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className={`operation-badge ${item.operation_type}`}>
                      {item.operation_type}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="table-cell">{item.retry_count}</div>
                  <div className="table-cell">{formatDate(item.created_at)}</div>
                  <div className="table-cell">{formatDate(item.processed_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="system-info">
          <h2>ℹ️ How the New System Works</h2>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-header">
                <div className="info-icon">🔄</div>
                <h3>Automatic Queueing</h3>
              </div>
              <div className="info-body">
                <p>When you create, update, or delete products, they are automatically added to the sync queue via database triggers. No manual intervention needed!</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <div className="info-icon">📋</div>
                <h3>Queue Processing</h3>
              </div>
              <div className="info-body">
                <p>The queue processor handles items in batches with rate limiting and automatic retries. Failed operations are retried up to 5 times with exponential backoff.</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <div className="info-icon">🛡️</div>
                <h3>Reliability</h3>
              </div>
              <div className="info-body">
                <p>Every operation is tracked and logged. If Stripe API is down, operations wait in the queue and are processed when the service is available again.</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-header">
                <div className="info-icon">📈</div>
                <h3>Scalability</h3>
              </div>
              <div className="info-body">
                <p>The system can handle hundreds of products efficiently. Batch processing and rate limiting ensure we never hit Stripe API limits.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stripe-sync-container {
          padding: 32px;
          max-width: 1400px;
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
          font-size: 2rem;
        }

        .sync-header p {
          color: #666;
          font-size: 1.125rem;
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

        .status-overview,
        .product-status-overview {
          margin-bottom: 48px;
        }

        .status-overview h2,
        .product-status-overview h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .status-cards,
        .product-status-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
        }

        .status-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
        }

        .status-card.pending {
          border-left-color: #ffc107;
        }

        .status-card.processing {
          border-left-color: #17a2b8;
        }

        .status-card.completed,
        .status-card.synced {
          border-left-color: #28a745;
        }

        .status-card.failed {
          border-left-color: #dc3545;
        }

        .status-card.retrying {
          border-left-color: #fd7e14;
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

        .queue-actions {
          margin-bottom: 48px;
        }

        .queue-actions h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .action-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
          border: 2px solid transparent;
        }

        .action-card.primary {
          border-color: var(--color-ultramarine);
          background: rgba(47, 62, 156, 0.02);
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

        .processing-results {
          margin-bottom: 48px;
        }

        .processing-results h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .results-summary {
          display: flex;
          gap: 32px;
          margin-bottom: 32px;
          justify-content: center;
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

        .result-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .result-operation {
          font-size: 0.8rem;
          color: #666;
          text-transform: uppercase;
          font-weight: 500;
        }

        .status-success {
          color: #2f855a;
          font-weight: 500;
        }

        .status-error {
          color: #c53030;
          font-weight: 500;
        }

        .recent-items {
          margin-bottom: 48px;
        }

        .recent-items h2 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 24px;
          font-size: 1.5rem;
        }

        .items-table {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 80px 120px 120px;
          gap: 16px;
          padding: 16px;
          background: #f8f9fa;
          font-weight: 600;
          border-bottom: 1px solid #e9ecef;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 80px 120px 120px;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          font-size: 0.9rem;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-id {
          font-size: 0.75rem;
          color: #666;
          font-family: var(--font-heading);
        }

        .operation-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .operation-badge.create {
          background: #d4edda;
          color: #155724;
        }

        .operation-badge.update {
          background: #cce5ff;
          color: #004085;
        }

        .operation-badge.delete {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.processing {
          background: #cce5ff;
          color: #004085;
        }

        .status-badge.completed {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.failed {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.retrying {
          background: #ffeaa7;
          color: #d63031;
        }

        .system-info {
          margin-bottom: 32px;
        }

        .system-info h2 {
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

          .status-cards,
          .product-status-cards {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
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

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-cell {
            padding: 8px 0;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default StripeSync;
