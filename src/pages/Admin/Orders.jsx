import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'

const AdminOrders = () => {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetails, setOrderDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadOrders()
  }, []) 

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/php/admin/orders.php')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders || [])
      } else {
        setError(data.error || 'Failed to load orders')
      }
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Tellimuste laadimine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }

  const loadOrderDetails = async (orderId) => {
    if (!orderId) return
    
    setDetailsLoading(true) 
    try {
      const response = await fetch(`/php/admin/orders.php/${orderId}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setOrderDetails(data.order || null)
      } else {
        setError(data.error || 'Failed to load order details')
      }
    } catch (err) {
      console.error('Error loading order details:', err)
      setError('Tellimuse detailide laadimine ebaõnnestus')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    loadOrderDetails(order.id)
  }

  const handleCloseDetails = () => {
    setSelectedOrder(null)
    setOrderDetails(null)
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/php/admin/orders.php/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Update orders list
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
        
        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
        
        // Update order details if loaded
        if (orderDetails && orderDetails.id === orderId) {
          setOrderDetails({ ...orderDetails, status: newStatus })
        }
      } else {
        setError(data.error || 'Failed to update order status')
      }
    } catch (err) {
      console.error('Error updating order status:', err)
      setError('Tellimuse staatuse uuendamine ebaõnnestus')
    }
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': 'Ootel',
      'PAID': 'Makstud',
      'PROCESSING': 'Töötlemisel',
      'SHIPPED': 'Saadetud',
      'COMPLETED': 'Lõpetatud',
      'CANCELLED': 'Tühistatud',
      'REFUNDED': 'Tagastatud'
    }
    
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    const statusClassMap = {
      'PENDING': 'status-pending',
      'PAID': 'status-paid',
      'PROCESSING': 'status-processing',
      'SHIPPED': 'status-shipped',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled',
      'REFUNDED': 'status-refunded'
    }
    
    return statusClassMap[status] || ''
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    return date.toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter ? order.status === statusFilter : true
    const matchesSearch = searchTerm 
      ? (order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()))
      : true
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laadin tellimusi...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="orders-container">
        <div className="orders-header">
          <h1>Tellimused</h1>
          <div className="orders-count">
            Kokku: <strong>{orders.length}</strong> tellimust
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('Backend server') && (
                    <p className="mt-2">
                      <strong>To fix this:</strong> Run <code className="bg-red-100 px-1 rounded">php -S localhost:8000 -t public</code> in your terminal.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Otsi tellimusi</label>
              <input
                type="text"
                placeholder="Otsi tellimuse numbri, nime või e-posti järgi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Staatus</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-input"
              >
                <option value="">Kõik staatused</option>
                <option value="PENDING">Ootel</option>
                <option value="PAID">Makstud</option>
                <option value="PROCESSING">Töötlemisel</option>
                <option value="SHIPPED">Saadetud</option>
                <option value="COMPLETED">Lõpetatud</option>
                <option value="CANCELLED">Tühistatud</option>
                <option value="REFUNDED">Tagastatud</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            {orders.length === 0 ? (
              <>
                <div className="empty-icon">📋</div>
                <h3>Tellimusi pole veel</h3>
                <p>Kui kliendid teevad tellimusi, ilmuvad need siia.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>Otsingule vastavaid tellimusi ei leitud</h3>
                <p>Proovige muuta otsingukriteeriumeid</p>
              </>
            )}
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Tellimuse nr</th>
                  <th>Kuupäev</th>
                  <th>Klient</th>
                  <th>Summa</th>
                  <th>Staatus</th>
                  <th>Tegevused</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={selectedOrder?.id === order.id ? 'selected-row' : ''}>
                    <td>{order.order_number || '-'}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{order.customer_name}</div>
                        <div className="customer-email">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="amount-cell">{order.total_amount} {order.currency}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewDetails(order)}
                        className="btn btn-small btn-secondary"
                      >
                        Vaata
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="order-details-modal">
            <div className="modal-overlay" onClick={handleCloseDetails}></div>
            <div className="modal-content">
              <div className="modal-header">
                <h2>Tellimuse detailid</h2>
                <button className="modal-close" onClick={handleCloseDetails}>×</button>
              </div>
              
              {detailsLoading ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Laadin tellimuse detaile...</p>
                </div>
              ) : orderDetails ? (
                <div className="modal-body">
                  <div className="order-details-grid">
                    <div className="order-info-section">
                      <h3>Tellimuse info</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Tellimuse nr:</span>
                          <span className="info-value">{orderDetails.order_number || '-'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Kuupäev:</span>
                          <span className="info-value">{formatDate(orderDetails.created_at)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Staatus:</span>
                          <span className={`info-value status-badge ${getStatusClass(orderDetails.status)}`}>
                            {getStatusLabel(orderDetails.status)}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Summa:</span>
                          <span className="info-value">{orderDetails.total_amount} {orderDetails.currency}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="customer-info-section">
                      <h3>Kliendi info</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Nimi:</span>
                          <span className="info-value">{orderDetails.customer_name}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">E-post:</span>
                          <span className="info-value">{orderDetails.customer_email}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Telefon:</span>
                          <span className="info-value">{orderDetails.customer_phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shipping-info-section">
                      <h3>Tarneinfo</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Aadress:</span>
                          <span className="info-value">{orderDetails.shipping_address}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Linn:</span>
                          <span className="info-value">{orderDetails.shipping_city}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Postiindeks:</span>
                          <span className="info-value">{orderDetails.shipping_postal_code}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Riik:</span>
                          <span className="info-value">{orderDetails.shipping_country}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {orderDetails.notes && (
                    <div className="notes-section">
                      <h3>Märkused</h3>
                      <div className="notes-content">
                        {orderDetails.notes}
                      </div>
                    </div>
                  )}
                  
                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div className="order-items-section">
                      <h3>Tellitud tooted</h3>
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th>Toode</th>
                            <th>Hind</th>
                            <th>Kogus</th>
                            <th>Summa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.product_title}</td>
                              <td>{item.price} €</td>
                              <td>{item.quantity}</td>
                              <td>{(item.price * item.quantity).toFixed(2)} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {orderDetails.payments && orderDetails.payments.length > 0 && (
                    <div className="payment-info-section">
                      <h3>Maksed</h3>
                      <table className="payments-table">
                        <thead>
                          <tr>
                            <th>Makse ID</th>
                            <th>Makseviis</th>
                            <th>Summa</th>
                            <th>Staatus</th>
                            <th>Kuupäev</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{payment.transaction_id}</td>
                              <td>{payment.payment_method}</td>
                              <td>{payment.amount} {payment.currency}</td>
                              <td>
                                <span className={`status-badge ${getStatusClass(payment.status)}`}>
                                  {getStatusLabel(payment.status)}
                                </span>
                              </td>
                              <td>{formatDate(payment.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="order-actions">
                    <h3>Muuda staatust</h3>
                    <div className="status-buttons">
                      {orderDetails.status === 'PAID' && (
                        <button 
                          onClick={() => handleUpdateStatus(orderDetails.id, 'PROCESSING')}
                          className="btn btn-status btn-processing"
                        >
                          Märgi töötlemisele
                        </button>
                      )}
                      
                      {(orderDetails.status === 'PAID' || orderDetails.status === 'PROCESSING') && (
                        <button 
                          onClick={() => handleUpdateStatus(orderDetails.id, 'SHIPPED')}
                          className="btn btn-status btn-shipped"
                        >
                          Märgi saadetud
                        </button>
                      )}
                      
                      {(orderDetails.status === 'PAID' || orderDetails.status === 'PROCESSING' || orderDetails.status === 'SHIPPED') && (
                        <button 
                          onClick={() => handleUpdateStatus(orderDetails.id, 'COMPLETED')}
                          className="btn btn-status btn-completed"
                        >
                          Märgi lõpetatuks
                        </button>
                      )}
                      
                      {orderDetails.status !== 'CANCELLED' && orderDetails.status !== 'REFUNDED' && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Kas olete kindel, et soovite tellimuse tühistada?')) {
                              handleUpdateStatus(orderDetails.id, 'CANCELLED')
                            }
                          }}
                          className="btn btn-status btn-cancelled"
                        >
                          Tühista tellimus
                        </button>
                      )}
                      
                      {(orderDetails.status === 'PAID' || orderDetails.status === 'COMPLETED') && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Kas olete kindel, et soovite tellimuse tagastada?')) {
                              handleUpdateStatus(orderDetails.id, 'REFUNDED')
                            }
                          }}
                          className="btn btn-status btn-refunded"
                        >
                          Märgi tagastatuks
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="modal-error">
                  <p>Tellimuse detailide laadimine ebaõnnestus</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .orders-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .orders-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin: 0;
        }

        .orders-count {
          font-size: 1rem;
          color: #666;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
        }

        .filters-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
          margin-bottom: 32px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .filter-input {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .filter-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
        }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 24px;
          font-size: 1rem;
        }

        .orders-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th {
          background-color: #f8f9fa;
          padding: 16px;
          text-align: left;
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          border-bottom: 1px solid #e9ecef;
        }

        .orders-table td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }

        .orders-table tr:last-child td {
          border-bottom: none;
        }

        .orders-table tr:hover {
          background-color: #f8f9fa;
        }

        .selected-row {
          background-color: rgba(47, 62, 156, 0.05) !important;
        }

        .customer-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .customer-name {
          font-weight: 500;
        }

        .customer-email {
          font-size: 0.85rem;
          color: #666;
        }

        .amount-cell {
          font-family: var(--font-heading);
          font-weight: 500;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-paid {
          background-color: #d1ecf1;
          color: #0c5460;
        }

        .status-processing {
          background-color: #cce5ff;
          color: #004085;
        }

        .status-shipped {
          background-color: #d4edda;
          color: #155724;
        }

        .status-completed {
          background-color: #d4edda;
          color: #155724;
        }

        .status-cancelled {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-refunded {
          background-color: #e2e3e5;
          color: #383d41;
        }

        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.85rem;
          display: inline-block;
          text-align: center;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        /* Modal Styles */
        .order-details-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          cursor: pointer;
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          z-index: 1001;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e9ecef;
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
        }

        .modal-header h2 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin: 0;
          font-size: 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background-color: #f0f0f0;
          color: #333;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          gap: 16px;
        }

        .modal-error {
          padding: 24px;
          text-align: center;
          color: #c33;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .order-info-section,
        .customer-info-section,
        .shipping-info-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
        }

        .order-info-section h3,
        .customer-info-section h3,
        .shipping-info-section h3,
        .notes-section h3,
        .order-items-section h3,
        .payment-info-section h3,
        .order-actions h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.125rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 0.85rem;
          color: #666;
        }

        .info-value {
          font-weight: 500;
        }

        .notes-section {
          margin-bottom: 32px;
        }

        .notes-content {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          white-space: pre-line;
        }

        .order-items-section,
        .payment-info-section {
          margin-bottom: 32px;
        }

        .order-items-table,
        .payments-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }

        .order-items-table th,
        .payments-table th {
          background-color: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          border-bottom: 1px solid #e9ecef;
        }

        .order-items-table td,
        .payments-table td {
          padding: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .order-actions {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .status-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }

        .btn-status {
          padding: 8px 16px;
          font-size: 0.9rem;
        }

        .btn-processing {
          background-color: #007bff;
          color: white;
        }

        .btn-shipped {
          background-color: #17a2b8;
          color: white;
        }

        .btn-completed {
          background-color: #28a745;
          color: white;
        }

        .btn-cancelled {
          background-color: #dc3545;
          color: white;
        }

        .btn-refunded {
          background-color: #6c757d;
          color: white;
        }

        .tracking-link {
          color: var(--color-ultramarine);
          text-decoration: underline;
          transition: opacity 0.2s ease;
        }

        .tracking-link:hover {
          opacity: 0.8;
        }

        .status-registered {
          background-color: #d1ecf1;
          color: #0c5460;
        }

        .status-failed {
          background-color: #f8d7da;
          color: #721c24;
        }

        @media (max-width: 768px) {
          .orders-container {
            padding: 24px 16px;
          }

          .orders-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .filters-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .order-details-grid {
            grid-template-columns: 1fr;
          }

          .status-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .modal-content {
            width: 95%;
            max-height: 95vh;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminOrders