<?php
namespace Clients;

require_once __DIR__ . '/../maksekeskus/vendor/autoload.php';

use Maksekeskus\Maksekeskus;
use Maksekeskus\MKException;

/**
 * Client for interacting with Maksekeskus payment gateway
 */
class MaksekeskusClient {
    private $maksekeskus;
    private $logger;
    private $testMode;
    
    /**
     * Create a new Maksekeskus client
     * 
     * @param string $shopId Maksekeskus shop ID
     * @param string $publicKey Maksekeskus public key
     * @param string $privateKey Maksekeskus private key
     * @param bool $testMode Whether to use test mode
     * @param \Utils\Logger $logger Logger instance
     */
    public function __construct($shopId, $publicKey, $privateKey, $testMode, $logger) {
        $this->logger = $logger;
        $this->testMode = $testMode;
        
        try {
            $this->maksekeskus = new Maksekeskus($shopId, $publicKey, $privateKey, $testMode);
            $this->logger->info("Maksekeskus client initialized", [
                'shop_id' => $shopId,
                'test_mode' => $testMode ? 'true' : 'false'
            ]);
        } catch (\Exception $e) {
            $this->logger->exception($e, "Failed to initialize Maksekeskus client");
            throw $e;
        }
    }
    
    /**
     * Create a new transaction
     * 
     * @param array $transactionData Transaction data
     * @return object Transaction object
     * @throws \Exception if transaction creation fails
     */
    public function createTransaction($transactionData) {
        try {
            $this->logger->info("Creating transaction", [
                'reference' => $transactionData['transaction']['reference'] ?? 'unknown'
            ]);
            
            $transaction = $this->maksekeskus->createTransaction($transactionData);
            
            $this->logger->info("Transaction created successfully", [
                'transaction_id' => $transaction->id ?? 'unknown'
            ]);
            
            return $transaction;
        } catch (MKException $e) {
            $this->logger->exception($e, "Failed to create transaction");
            throw new \Exception("Failed to create transaction: " . $e->getMessage(), 0, $e);
        } catch (\Exception $e) {
            $this->logger->exception($e, "Unexpected error creating transaction");
            throw $e;
        }
    }
    
    /**
     * Verify the MAC signature of a payment notification
     * 
     * @param array $request Request data (typically $_REQUEST)
     * @return bool Whether the signature is valid
     */
    public function verifyMac($request) {
        try {
            $isValid = $this->maksekeskus->verifyMac($request);
            $this->logger->info("MAC signature verification", [
                'valid' => $isValid ? 'true' : 'false'
            ]);
            return $isValid;
        } catch (\Exception $e) {
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
    public function extractRequestData($request) {
        try {
            $data = $this->maksekeskus->extractRequestData($request, true);
            $this->logger->info("Payment data extracted successfully");
            return $data;
        } catch (\Exception $e) {
            $this->logger->exception($e, "Failed to extract payment data");
            return null;
        }
    }
    
    /**
     * Get transaction details
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
        } catch (\Exception $e) {
            $this->logger->exception($e, "Failed to get transaction details");
            return null;
        }
    }
    
    /**
     * Get payment methods
     * 
     * @param array $params Request parameters
     * @return object|null Payment methods or null on failure
     */
    public function getPaymentMethods($params) {
        try {
            $methods = $this->maksekeskus->getPaymentMethods($params);
            $this->logger->info("Payment methods retrieved");
            return $methods;
        } catch (\Exception $e) {
            $this->logger->exception($e, "Failed to get payment methods");
            return null;
        }
    }
}