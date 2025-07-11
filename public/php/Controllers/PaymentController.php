<?php
namespace Controllers;

use Services\PaymentService;
use Clients\MaksekeskusClient;
use Repositories\MaksekeskusConfigRepository;

/**
 * Controller for payment processing
 */
class PaymentController {
    private $logger;
    private $envLoader;
    private $supabase;
    
    /**
     * Create a new payment controller
     * 
     * @param \Utils\Logger $logger Logger instance
     * @param \Utils\EnvLoader $envLoader Environment loader
     * @param \Repositories\SupabaseRepository $supabase Supabase client
     */
    public function __construct($logger, $envLoader, $supabase) {
        $this->logger = $logger;
        $this->envLoader = $envLoader;
        $this->supabase = $supabase;
    }
    
    /**
     * Process a payment request
     * 
     * @return void Outputs JSON response
     */
    public function processPayment() {
        $this->logger->info("Payment processing request received", [
            'time' => date('Y-m-d H:i:s'),
            'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        // Check if it's a POST request
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            $this->logger->error("Invalid request method", ['method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown']);
            return;
        }
        
        try {
            // Validate required environment variables
            $requiredVars = [
                'SUPABASE_URL',
                'SUPABASE_SERVICE_ROLE_KEY',
                'MAKSEKESKUS_SHOP_ID',
                'MAKSEKESKUS_PUBLIC_KEY',
                'MAKSEKESKUS_PRIVATE_KEY'
            ];
            
            if (!$this->envLoader->validateRequired($requiredVars)) {
                throw new \Exception("Missing required environment variables");
            }
            
            // Initialize repositories
            require_once __DIR__ . '/../Repositories/OrderRepository.php';
            require_once __DIR__ . '/../Repositories/MaksekeskusConfigRepository.php';
            
            $orderRepository = new \Repositories\OrderRepository($this->supabase, $this->logger);
            $configRepository = new \Repositories\MaksekeskusConfigRepository($this->supabase, $this->logger);
            
            // Get Maksekeskus configuration
            $config = $configRepository->getActiveConfig();
            
            if (!$config) {
                // Use environment variables as fallback
                $shopId = $this->envLoader->getRequired('MAKSEKESKUS_SHOP_ID');
                $publicKey = $this->envLoader->getRequired('MAKSEKESKUS_PUBLIC_KEY');
                $privateKey = $this->envLoader->getRequired('MAKSEKESKUS_PRIVATE_KEY');
                $testMode = $this->envLoader->get('MAKSEKESKUS_TEST_MODE') === 'true';
            } else {
                // Use configuration from database
                $shopId = $config['shop_id'];
                $publicKey = $config['api_open_key'];
                $privateKey = $config['api_secret_key'];
                $testMode = $config['test_mode'];
            }
            
            // Initialize clients
            require_once __DIR__ . '/../Clients/MaksekeskusClient.php';
            $maksekeskusClient = new \Clients\MaksekeskusClient(
                $shopId,
                $publicKey,
                $privateKey,
                $testMode,
                $this->logger
            );
            
            // Initialize services
            require_once __DIR__ . '/../Services/PaymentService.php';
            $paymentService = new \Services\PaymentService(
                $maksekeskusClient,
                $orderRepository,
                $this->logger
            );
            
            // Get the raw POST data
            $rawData = file_get_contents('php://input');
            $this->logger->info("Received payment request data", ['raw_data_length' => strlen($rawData)]);
            
            // Decode the JSON data
            $data = json_decode($rawData, true);
            
            // Check if JSON is valid
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON data: ' . json_last_error_msg()]);
                $this->logger->error("Invalid JSON data", ['error' => json_last_error_msg()]);
                return;
            }
            
            // Validate required fields
            if (!isset($data['amount']) || !isset($data['reference']) || !isset($data['email']) || !isset($data['paymentMethod'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                $this->logger->error("Missing required fields in payment request");
                return;
            }
            
            // Create transaction
            $result = $paymentService->createTransaction($data);
            
            // Return the transaction ID and payment URL
            echo json_encode([
                'transactionId' => $result['transactionId'],
                'paymentUrl' => $result['paymentUrl']
            ]);
            
        } catch (\Exception $e) {
            // Log the error
            $this->logger->exception($e, "Payment processing failed");
            
            // Return error response
            http_response_code(500);
            echo json_encode([
                'error' => 'Payment processing failed: ' . $e->getMessage()
            ]);
        }
        
        // Final log entry to confirm script completion
        $this->logger->info("Payment processing completed");
    }
}