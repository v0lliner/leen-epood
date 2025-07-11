<?php
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/SupabaseClient.php';
require_once __DIR__ . '/../maksekeskus/vendor/autoload.php';

use Maksekeskus\Maksekeskus;

/**
 * Payment processor for handling Maksekeskus payments
 * 
 * Centralizes payment processing logic and provides a consistent
 * interface for payment operations.
 */
class PaymentProcessor {
    private $maksekeskus;
    private $supabase;
    private $logger;
    
    /**
     * Create a new payment processor
     * 
     * @param string $shopId Maksekeskus shop ID
     * @param string $publicKey Maksekeskus public key
     * @param string $privateKey Maksekeskus private key
     * @param bool $testMode Whether to use test mode
     * @param SupabaseClient $supabase Supabase client
     * @param Logger $logger Logger instance
     */
    public function __construct($shopId, $publicKey, $privateKey, $testMode, $supabase, $logger) {
        $this->logger = $logger;
        $this->supabase = $supabase;
        
        try {
            $this->maksekeskus = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
            $this->logger->info("Maksekeskus client initialized", [
                'shop_id' => $shopId,
                'test_mode' => $testMode ? 'true' : 'false'
            ]);
        } catch (Exception $e) {
            $this->logger->exception($e, "Failed to initialize Maksekeskus client");
            throw $e;
        }
    }
    
    /**
     * Verify the MAC signature of a payment notification
     * 
     * @param array $request Request data (typically $_REQUEST)
     * @return bool Whether the signature is valid
     */
    public function verifySignature($request) {
        try {
            $isValid = $this->maksekeskus->verifyMac($request);
            $this->logger->info("MAC signature verification", [
                'valid' => $isValid ? 'true' : 'false'
            ]);
            return $isValid;
        } catch (Exception $e) {
            $this->logger->exception($e, "MAC signature verification failed");
            return false;
        }
    }
    
    /**
     * Extract payment data from a request
     * 
     * @param array $request Request data (typically $_REQUEST)
     * @return object|null Payment data or null on failure
     */
    public function extractPaymentData($request) {
        try {
            $data = $this->maksekeskus->extractRequestData($request, true);
            $this->logger->info("Payment data extracted successfully");
            return $data;
        } catch (Exception $e) {
            $this->logger->exception($e, "Failed to extract payment data");
            return null;
        }
    }
    
    /**
     * Process a payment notification and create/update order
     * 
     * @param object $paymentData Payment data from Maksekeskus
     * @return array Processing result with status and message
     */
    public function processPaymentNotification($paymentData) {
        $this->logger->info("Processing payment notification", [
            'transaction' => $paymentData->transaction ?? null,
            'status' => $paymentData->status ?? null,
            'reference' => $paymentData->reference ?? null
        ]);
        
        // Only process completed payments
        if ($paymentData->status !== 'COMPLETED') {
            $this->logger->info("Payment not completed, status: " . ($paymentData->status ?? 'unknown'));
            return [
                'success' => false,
                'message' => 'Payment not completed',
                'status' => $paymentData->status ?? 'unknown'
            ];
        }
        
        // Extract transaction details
        $transactionId = $paymentData->transaction ?? null;
        $reference = $paymentData->reference ?? null;
        
        if (!$transactionId && !$reference) {
            $this->logger->error("Missing transaction ID and reference");
            return [
                'success' => false,
                'message' => 'Missing transaction ID and reference'
            ];
        }
        
        // Extract merchant data (customer and order details)
        $merchantData = null;
        if (isset($paymentData->merchant_data)) {
            try {
                $merchantData = json_decode($paymentData->merchant_data);
                $this->logger->info("Merchant data decoded successfully");
            } catch (Exception $e) {
                $this->logger->exception($e, "Failed to decode merchant data");
                $merchantData = null;
            }
        }
        
        if (!$merchantData) {
            $this->logger->error("Missing or invalid merchant data");
            return [
                'success' => false,
                'message' => 'Missing or invalid merchant data'
            ];
        }
        
        // Check if order already exists
        $existingOrder = null;
        if ($reference) {
            $existingOrder = $this->supabase->getByField('orders', 'reference', $reference);
            
            if ($existingOrder) {
                $this->logger->info("Order already exists", [
                    'order_id' => $existingOrder['id'],
                    'reference' => $reference
                ]);
                
                // Update existing order
                $updateResult = $this->supabase->updateByField('orders', 'reference', $reference, [
                    'status' => 'PAID'
                ]);
                
                if ($updateResult) {
                    $this->logger->info("Order status updated to PAID", [
                        'order_id' => $existingOrder['id']
                    ]);
                } else {
                    $this->logger->error("Failed to update order status", [
                        'order_id' => $existingOrder['id']
                    ]);
                }
                
                // Create payment record
                $this->createPaymentRecord($existingOrder['id'], $paymentData);
                
                return [
                    'success' => true,
                    'message' => 'Order updated successfully',
                    'order_id' => $existingOrder['id']
                ];
            }
        }
        
        // Create new order
        $orderData = $this->prepareOrderData($merchantData, $paymentData);
        
        $newOrder = $this->supabase->insert('orders', $orderData);
        
        if (!$newOrder) {
            $this->logger->error("Failed to create order", [
                'order_data' => $orderData
            ]);
            return [
                'success' => false,
                'message' => 'Failed to create order'
            ];
        }
        
        $this->logger->info("Order created successfully", [
            'order_id' => $newOrder['id']
        ]);
        
        // Create order items
        if (isset($merchantData->items) && is_array($merchantData->items)) {
            foreach ($merchantData->items as $item) {
                $orderItemData = [
                    'order_id' => $newOrder['id'],
                    'product_id' => $item->id ?? null,
                    'product_title' => $item->title ?? 'Unknown Product',
                    'quantity' => $item->quantity ?? 1,
                    'price' => (float)($item->price ?? 0)
                ];
                
                $orderItem = $this->supabase->insert('order_items', $orderItemData);
                
                if (!$orderItem) {
                    $this->logger->error("Failed to create order item", [
                        'order_item_data' => $orderItemData
                    ]);
                } else {
                    $this->logger->info("Order item created successfully", [
                        'order_item_id' => $orderItem['id']
                    ]);
                }
            }
        }
        
        // Create payment record
        $this->createPaymentRecord($newOrder['id'], $paymentData);
        
        return [
            'success' => true,
            'message' => 'Order created successfully',
            'order_id' => $newOrder['id']
        ];
    }
    
    /**
     * Prepare order data from merchant data and payment data
     * 
     * @param object $merchantData Merchant data from payment
     * @param object $paymentData Payment data from Maksekeskus
     * @return array Order data for database
     */
    private function prepareOrderData($merchantData, $paymentData) {
        $orderData = [
            'customer_name' => $merchantData->customer_name ?? null,
            'customer_email' => $merchantData->customer_email ?? null,
            'customer_phone' => $merchantData->customer_phone ?? null,
            'shipping_address' => $merchantData->shipping_address ?? null,
            'shipping_city' => $merchantData->shipping_city ?? null,
            'shipping_postal_code' => $merchantData->shipping_postal_code ?? null,
            'shipping_country' => $merchantData->shipping_country ?? null,
            'total_amount' => (float)($paymentData->amount ?? 0),
            'currency' => $paymentData->currency ?? 'EUR',
            'status' => 'PAID',
            'reference' => $paymentData->reference ?? null,
            'omniva_parcel_machine_id' => $merchantData->omnivaParcelMachineId ?? null,
            'omniva_parcel_machine_name' => $merchantData->omnivaParcelMachineName ?? null
        ];
        
        // Ensure string types for fields that require it
        if (isset($orderData['omniva_parcel_machine_id'])) {
            $orderData['omniva_parcel_machine_id'] = (string)$orderData['omniva_parcel_machine_id'];
        }
        
        if (isset($orderData['customer_phone'])) {
            $orderData['customer_phone'] = (string)$orderData['customer_phone'];
        }
        
        if (isset($orderData['customer_email'])) {
            $orderData['customer_email'] = (string)$orderData['customer_email'];
        }
        
        $this->logger->info("Prepared order data", [
            'reference' => $orderData['reference']
        ]);
        
        return $orderData;
    }
    
    /**
     * Create a payment record for an order
     * 
     * @param string $orderId Order ID
     * @param object $paymentData Payment data from Maksekeskus
     * @return bool Success status
     */
    private function createPaymentRecord($orderId, $paymentData) {
        $paymentData = [
            'order_id' => $orderId,
            'transaction_id' => $paymentData->transaction ?? null,
            'payment_method' => $paymentData->method ?? 'unknown',
            'amount' => (float)($paymentData->amount ?? 0),
            'currency' => $paymentData->currency ?? 'EUR',
            'status' => $paymentData->status ?? 'UNKNOWN'
        ];
        
        $payment = $this->supabase->insert('order_payments', $paymentData);
        
        if (!$payment) {
            $this->logger->error("Failed to create payment record", [
                'payment_data' => $paymentData
            ]);
            return false;
        }
        
        $this->logger->info("Payment record created successfully", [
            'payment_id' => $payment['id']
        ]);
        
        return true;
    }
    
    /**
     * Get transaction details from Maksekeskus
     * 
     * @param string $transactionId Transaction ID
     * @return object|null Transaction details or null on failure
     */
    public function getTransaction($transactionId) {
        try {
            $transaction = $this->maksekeskus->getTransaction($transactionId);
            $this->logger->info("Transaction details retrieved", [
                'transaction_id' => $transactionId
            ]);
            return $transaction;
        } catch (Exception $e) {
            $this->logger->exception($e, "Failed to get transaction details");
            return null;
        }
    }
}