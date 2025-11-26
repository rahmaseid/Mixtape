<?php
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/includes/db.php';

if (isset($conn) && $conn instanceof mysqli && !$conn->connect_errno) {
    echo "OK: connected to DB as {$conn->host_info}\n";
} else {
    echo "ERROR: " . ($conn->connect_error ?? 'Unknown error') . "\n";
}
