<?php
namespace Leen\Shop;

use Maksekeskus\Maksekeskus;
use Exception;

/**
 * Service class for Maksekeskus payment integration
 */
class MaksekeskusService {
    private $maksekeskus;
    private $logger;
    
    /**
     * Constructor
     */
    public function __construct() {
        // Initialize Maksekeskus SDK
        $this->maksekeskus = new Maksekeskus(
            MK_SHOP_ID,
            MK_API_OPEN_KEY,
            MK_API_SECRET_KEY,
            MK_TEST_MODE
        );
        
        $this->logger = new Logger();
    }
    
    /**
     * Get available payment methods
     * 
     * @param float $amount Order amount
     * @param string $country Country code (default: ee)
     * @return array Payment methods
     */
    public function getPaymentMethods($amount, $country = 'ee') {
        try {
            $context = [
                'amount' => $amount,
                'country' => $country,
                'currency' => 'EUR'
            ];
            
            $methods = $this->maksekeskus->getPaymentMethods($context);
            
            // Filter for banklinks only
            $banklinks = [];
            foreach ($methods as $method) {
                if ($method['category'] === 'banklink') {
                    $banklinks[] = $method;
                }
            }
            
            $this->logger->info('Retrieved ' . count($banklinks) . ' banklink payment methods');
            return $banklinks;
        } catch (Exception $e) {
            $this->logger->error('Error fetching payment methods: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Create a transaction
     * 
     * @param array $orderData Order data
     * @param string $paymentMethod Selected payment method
     * @return array Transaction data
     */
    public function createTransaction($orderData, $paymentMethod) {
        try {
            // Prepare transaction data
            $transaction = [
                'amount' => $orderData['total'],
                'currency' => 'EUR',
                'reference' => $this->generateReference($orderData['id']),
                'merchant_data' => json_encode([
                    'order_id' => $orderData['id'],
                    'customer_id' => $orderData['customer_id'] ?? null
                ]),
                'customer' => [
                    'email' => $orderData['email'],
                    'name' => $orderData['name'],
                    'country' => 'ee',
                    'locale' => 'et',
                    'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
                ],
                'return_url' => MK_RETURN_URL,
                'cancel_url' => MK_CANCEL_URL,
                'notification_url' => MK_NOTIFICATION_URL
            ];
            
            // Create transaction
            $result = $this->maksekeskus->createTransaction($transaction);
            
            // Get payment URL for the selected method
            $paymentUrl = null;
            foreach ($result['payment_methods'] as $method) {
                if ($method['method'] === $paymentMethod) {
                    $paymentUrl = $method['url'];
                    break;
                }
            }
            
            if (!$paymentUrl) {
                throw new Exception('Selected payment method not available');
            }
            
            $this->logger->info('Created transaction: ' . $result['id'] . ' for order: ' . $orderData['id']);
            
            return [
                'transaction_id' => $result['id'],
                'payment_url' => $paymentUrl
            ];
        } catch (Exception $e) {
            $this->logger->error('Error creating transaction: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Process payment notification
     * 
     * @param string $payload Raw notification payload
     * @param string $mac MAC signature from header
     * @return array Processed notification data
     */
    public function processNotification($payload, $mac) {
        try {
            // Verify MAC signature
            $calculatedMac = hash('sha512', $payload . MK_API_SECRET_KEY);
            
            if ($calculatedMac !== $mac) {
                $this->logger->error('MAC verification failed');
                throw new Exception('Invalid MAC signature');
            }
            
            // Decode payload
            $data = json_decode($payload, true);
            
            if (!$data) {
                throw new Exception('Invalid JSON payload');
            }
            
            // Extract merchant data
            $merchantData = json_decode($data['merchant_data'] ?? '{}', true);
            $orderId = $merchantData['order_id'] ?? null;
            
            // Process payment status
            $status = $data['status'] ?? '';
            $transactionId = $data['transaction'] ?? '';
            
            $this->logger->info("Notification received for transaction: $transactionId, status: $status, order: $orderId");
            
            return [
                'transaction_id' => $transactionId,
                'order_id' => $orderId,
                'status' => $status,
                'amount' => $data['amount'] ?? 0,
                'currency' => $data['currency'] ?? 'EUR',
                'timestamp' => date('Y-m-d H:i:s')
            ];
        } catch (Exception $e) {
            $this->logger->error('Error processing notification: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Generate reference number for transaction
     * 
     * @param int $orderId Order ID
     * @return string Reference number (max 20 chars)
     */
    private function generateReference($orderId) {
        // Format: LEEN + order ID + timestamp (truncated to fit 20 chars)
        $reference = 'LEEN' . $orderId . substr(time(), -6);
        
        // Ensure max 20 chars
        return substr($reference, 0, 20);
    }
}