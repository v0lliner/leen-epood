<?php
namespace Repositories;

/**
 * Repository for order-related database operations
 */
class OrderRepository {
    private $supabase;
    private $logger;
    
    /**
     * Create a new order repository
     * 
     * @param \Repositories\SupabaseRepository $supabase Supabase client
     * @param \Utils\Logger $logger Logger instance
     */
    public function __construct($supabase, $logger) {
        $this->supabase = $supabase;
        $this->logger = $logger;
    }
    
    /**
     * Get order by ID
     * 
     * @param string $id Order ID
     * @return array|null Order data or null if not found
     */
    public function getOrderById($id) {
        return $this->supabase->getById('orders', $id);
    }
    
    /**
     * Get order by reference
     * 
     * @param string $reference Order reference
     * @return array|null Order data or null if not found
     */
    public function getOrderByReference($reference) {
        return $this->supabase->getByField('orders', 'reference', $reference);
    }
    
    /**
     * Get order by order number
     * 
     * @param string $orderNumber Order number
     * @return array|null Order data or null if not found
     */
    public function getOrderByOrderNumber($orderNumber) {
        return $this->supabase->getByField('orders', 'order_number', $orderNumber);
    }
    
    /**
     * Create a new order
     * 
     * @param array $orderData Order data
     * @return array|null Created order or null on failure
     */
    public function createOrder($orderData) {
        $this->logger->info("Creating order", [
            'customer_name' => $orderData['customer_name'] ?? 'unknown',
            'reference' => $orderData['reference'] ?? 'unknown'
        ]);
        
        return $this->supabase->insert('orders', $orderData);
    }
    
    /**
     * Update order status
     * 
     * @param string $id Order ID
     * @param string $status New status
     * @return bool Success status
     */
    public function updateOrderStatus($id, $status) {
        $this->logger->info("Updating order status", [
            'order_id' => $id,
            'status' => $status
        ]);
        
        return $this->supabase->update('orders', $id, [
            'status' => $status
        ]);
    }
    
    /**
     * Update order by reference
     * 
     * @param string $reference Order reference
     * @param array $data Updated data
     * @return bool Success status
     */
    public function updateOrderByReference($reference, $data) {
        $this->logger->info("Updating order by reference", [
            'reference' => $reference
        ]);
        
        return $this->supabase->updateByField('orders', 'reference', $reference, $data);
    }
    
    /**
     * Create order items
     * 
     * @param string $orderId Order ID
     * @param array $items Order items
     * @return array Created items
     */
    public function createOrderItems($orderId, $items) {
        $this->logger->info("Creating order items", [
            'order_id' => $orderId,
            'item_count' => count($items)
        ]);
        
        $createdItems = [];
        
        foreach ($items as $item) {
            $orderItemData = [
                'order_id' => $orderId,
                'product_id' => $item->id ?? null,
                'product_title' => $item->title ?? 'Unknown Product',
                'quantity' => $item->quantity ?? 1,
                'price' => (float)($item->price ?? 0)
            ];
            
            $orderItem = $this->supabase->insert('order_items', $orderItemData);
            
            if ($orderItem) {
                $createdItems[] = $orderItem;
            } else {
                $this->logger->error("Failed to create order item", [
                    'order_item_data' => $orderItemData
                ]);
            }
        }
        
        return $createdItems;
    }
    
    /**
     * Create payment record
     * 
     * @param string $orderId Order ID
     * @param object $paymentData Payment data
     * @return array|null Created payment or null on failure
     */
    public function createPayment($orderId, $paymentData) {
        $this->logger->info("Creating payment record", [
            'order_id' => $orderId,
            'transaction_id' => $paymentData->transaction ?? 'unknown'
        ]);
        
        $paymentRecord = [
            'order_id' => $orderId,
            'transaction_id' => $paymentData->transaction ?? null,
            'payment_method' => $paymentData->method ?? 'unknown',
            'amount' => (float)($paymentData->amount ?? 0),
            'currency' => $paymentData->currency ?? 'EUR',
            'status' => $paymentData->status ?? 'UNKNOWN'
        ];
        
        return $this->supabase->insert('order_payments', $paymentRecord);
    }
    
    /**
     * Update order with Omniva shipment details
     * 
     * @param string $orderId Order ID
     * @param string $barcode Omniva barcode
     * @param string $trackingUrl Tracking URL
     * @param string $labelUrl Label URL
     * @return bool Success status
     */
    public function updateOrderWithShipmentDetails($orderId, $barcode, $trackingUrl, $labelUrl) {
        $this->logger->info("Updating order with shipment details", [
            'order_id' => $orderId,
            'barcode' => $barcode
        ]);
        
        return $this->supabase->update('orders', $orderId, [
            'omniva_barcode' => $barcode,
            'tracking_url' => $trackingUrl,
            'label_url' => $labelUrl,
            'shipment_registered_at' => date('c') // ISO 8601 format
        ]);
    }
}