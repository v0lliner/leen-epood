<?php
/**
 * Configuration file for Maksekeskus integration
 */

// Maksekeskus API credentials
define('MK_SHOP_ID', '4e2bed9a-aa24-4b87-801b-56c31c535d36');
define('MK_API_SECRET_KEY', 'HuK4tGfYB3RcOvz4tNcevILagbYRzi6OAqsfP8F1dmrsJIbED1SFWvdraHPa9LOz');
define('MK_API_OPEN_KEY', 'wo0pLGl9D8b0Lrn2ZpT0KvQKBid4qZQg');

// Test mode (set to false for production)
define('MK_TEST_MODE', false);

// URLs for Maksekeskus integration
define('MK_RETURN_URL', 'https://leen.ee/makse/korras');
define('MK_CANCEL_URL', 'https://leen.ee/makse/katkestatud');
define('MK_NOTIFICATION_URL', 'https://leen.ee/api/maksekeskus/notification');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'leen_shop');
define('DB_USER', 'leen_user');
define('DB_PASS', 'secure_password');

// Site configuration
define('SITE_URL', 'https://leen.ee');
define('ADMIN_EMAIL', 'leen@leen.ee');

// Logging
define('LOG_ENABLED', true);
define('LOG_PATH', __DIR__ . '/../logs');
define('LOG_LEVEL', 'info'); // debug, info, warning, error