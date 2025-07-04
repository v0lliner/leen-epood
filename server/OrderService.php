<?php
namespace Leen\Shop;

use PDO;
use Exception;

/**
 * Service class for order management
 */
class OrderService {
    private $db;
    private $logger;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
        
        $this->logger = new Logger();
    }
    
    /**
     * Create a new order
     * 
     * @param array $orderData Order data
     * @return int Order ID
     */
    public function createOrder($orderData) {
        try {
            $this->db->beginTransaction();
            
            // Insert order
            $stmt = $this->db->prepare("
                INSERT INTO orders (
                    customer_name, customer_email, customer_phone, 
                    shipping_address, shipping_city, shipping_postal_code, shipping_country,
                    total_amount, currency, status, notes, created_at
                ) VALUES (
                    :name, :email, :phone,
                    :address, :city, :postal_code, :country,
                    :total, :currency, :status, :notes, NOW()
                )
            ");
            
            $stmt->execute([
                'name' => $orderData['name'],
                'email' => $orderData['email'],
                'phone' => $orderData['phone'],
                'address' => $orderData['address'],
                'city' => $orderData['city'],
                'postal_code' => $orderData['postalCode'],
                'country' => $orderData['country'],
                'total' => $orderData['total'],
                'currency' => 'EUR',
                'status' => 'PENDING',
                'notes' => $orderData['notes'] ?? null
            ]);
            
            $orderId = $this->db->lastInsertId();
            
            // Insert order items
            foreach ($orderData['items'] as $item) {
                $stmt = $this->db->prepare("
                    INSERT INTO order_items (
                        order_id, product_id, product_title, quantity, price
                    ) VALUES (
                        :order_id, :product_id, :product_title, :quantity, :price
                    )
                ");
                
                $stmt->execute([
                    'order_id' => $orderId,
                    'product_id' => $item['id'],
                    'product_title' => $item['title'],
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $this->extractPrice($item['price'])
                ]);
            }
            
            $this->db->commit();
            $this->logger->info("Created order #$orderId with " . count($orderData['items']) . " items");
            
            return $orderId;
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->logger->error('Error creating order: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update order payment status
     * 
     * @param int $orderId Order ID
     * @param string $status Payment status
     * @param string $transactionId Transaction ID
     * @return bool Success
     */
    public function updateOrderPaymentStatus($orderId, $status, $transactionId) {
        try {
            // Check if this transaction has already been processed
            $stmt = $this->db->prepare("
                SELECT transaction_id, status 
                FROM order_payments 
                WHERE order_id = :order_id AND transaction_id = :transaction_id
            ");
            
            $stmt->execute([
                'order_id' => $orderId,
                'transaction_id' => $transactionId
            ]);
            
            $existingPayment = $stmt->fetch();
            
            if ($existingPayment) {
                // Already processed this transaction
                $this->logger->info("Transaction $transactionId for order #$orderId already processed with status: " . $existingPayment['status']);
                
                // Only update if new status is COMPLETED and old status wasn't
                if ($status === 'COMPLETED' && $existingPayment['status'] !== 'COMPLETED') {
                    $this->updateOrderStatus($orderId, 'PAID');
                    $this->updatePaymentStatus($transactionId, 'COMPLETED');
                    $this->logger->info("Updated order #$orderId status to PAID");
                }
                
                return true;
            }
            
            // Insert new payment record
            $stmt = $this->db->prepare("
                INSERT INTO order_payments (
                    order_id, transaction_id, status, created_at
                ) VALUES (
                    :order_id, :transaction_id, :status, NOW()
                )
            ");
            
            $stmt->execute([
                'order_id' => $orderId,
                'transaction_id' => $transactionId,
                'status' => $status
            ]);
            
            // Update order status if payment completed
            if ($status === 'COMPLETED') {
                $this->updateOrderStatus($orderId, 'PAID');
                $this->logger->info("Order #$orderId marked as PAID");
                
                // Mark products as sold
                $this->markProductsAsSold($orderId);
            }
            
            $this->logger->info("Recorded payment for order #$orderId with status: $status");
            return true;
        } catch (Exception $e) {
            $this->logger->error('Error updating order payment status: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update order status
     * 
     * @param int $orderId Order ID
     * @param string $status New status
     * @return bool Success
     */
    private function updateOrderStatus($orderId, $status) {
        $stmt = $this->db->prepare("
            UPDATE orders 
            SET status = :status, updated_at = NOW() 
            WHERE id = :order_id
        ");
        
        return $stmt->execute([
            'order_id' => $orderId,
            'status' => $status
        ]);
    }
    
    /**
     * Update payment status
     * 
     * @param string $transactionId Transaction ID
     * @param string $status New status
     * @return bool Success
     */
    private function updatePaymentStatus($transactionId, $status) {
        $stmt = $this->db->prepare("
            UPDATE order_payments 
            SET status = :status, updated_at = NOW() 
            WHERE transaction_id = :transaction_id
        ");
        
        return $stmt->execute([
            'transaction_id' => $transactionId,
            'status' => $status
        ]);
    }
    
    /**
     * Mark products as sold
     * 
     * @param int $orderId Order ID
     */
    private function markProductsAsSold($orderId) {
        try {
            // Get products from order
            $stmt = $this->db->prepare("
                SELECT product_id 
                FROM order_items 
                WHERE order_id = :order_id
            ");
            
            $stmt->execute(['order_id' => $orderId]);
            $items = $stmt->fetchAll();
            
            // Update product availability
            foreach ($items as $item) {
                $stmt = $this->db->prepare("
                    UPDATE products 
                    SET available = false, updated_at = NOW() 
                    WHERE id = :product_id
                ");
                
                $stmt->execute(['product_id' => $item['product_id']]);
            }
            
            $this->logger->info("Marked " . count($items) . " products as sold for order #$orderId");
        } catch (Exception $e) {
            $this->logger->error('Error marking products as sold: ' . $e->getMessage());
            // Don't throw, as this is a non-critical operation
        }
    }
    
    /**
     * Extract price from formatted price string
     * 
     * @param string $priceString Price string (e.g. "10.99€")
     * @return float Price as float
     */
    private function extractPrice($priceString) {
        // Remove currency symbol and any whitespace
        $price = preg_replace('/[^\d.,]/', '', $priceString);
        
        // Replace comma with dot for decimal point (European format)
        $price = str_replace(',', '.', $price);
        
        return (float) $price;
    }
}