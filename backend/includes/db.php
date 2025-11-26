<?php
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'mixtape_db';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';
$db_port = getenv('DB_PORT') ?: 3308; 

// Create connection
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name, (int)$db_port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
