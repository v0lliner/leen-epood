<?php
namespace Controllers;

use Services\PaymentService;
use Clients\MaksekeskusClient;
use Repositories\MaksekeskusConfigRepository;
use Repositories\OrderRepository;

/**
 * Controller for payment webhooks
 */
class WebhookController {
    private $logger;
    private $envLoader;
    private $supabase;
    
    /**
     * Create a new webhook controller
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
     * Handle a payment notification webhook
     * 
     * @return void Outputs JSON response
     */
    public function handleNotification() {
        $this->logger->info("Payment notification received", [
            'time' => date('Y-m-d H:i:s'),
            'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ]);
        
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
            
            // Process the notification
            $result = $paymentService->processNotification($_REQUEST);
            
            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => $result['message'],
                    'order_id' => $result['order_id'] ?? null
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $result['message']
                ]);
            }
            
        } catch (\Exception $e) {
            // Log the error
            $this->logger->exception($e, "Payment notification processing failed");
            
            // Return error response
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Payment notification processing failed: ' . $e->getMessage()
            ]);
        }
        
        // Final log entry to confirm script completion
        $this->logger->info("Payment notification processing completed");
    }
}