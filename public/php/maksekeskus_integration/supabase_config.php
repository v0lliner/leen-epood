<?php
// public/php/maksekeskus_integration/supabase_config.php

// Log environment variables for debugging
error_log("Looking for .env variables");
error_log("SUPABASE_URL exists: " . (isset($_ENV['SUPABASE_URL']) ? "YES" : "NO"));
error_log("SUPABASE_SERVICE_ROLE_KEY exists: " . (isset($_ENV['SUPABASE_SERVICE_ROLE_KEY']) ? "YES" : "NO"));

/**
 * This file previously contained Maksekeskus configuration.
 * Since we're removing Maksekeskus, this file now only serves as a placeholder.
 * In the future, you can implement your own payment provider configuration here.
 */