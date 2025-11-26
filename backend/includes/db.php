<?php
// Show DB errors in logs (helpful for debugging)
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Read settings from environment variables
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: 3308;        // keeps your old local setup working
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'mixtape_db';

// Connect (note: port is a separate parameter)
try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name, (int)$db_port);
    $conn->set_charset('utf8mb4');
} catch (mysqli_sql_exception $e) {
    // Log error and return a proper 500
    error_log('MySQL connection failed: ' . $e->getMessage());
    http_response_code(500);
    die('DB connection failed.');
}
