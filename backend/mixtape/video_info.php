<?php
header('Content-Type: application/json');
require_once '../includes/db.php';
require_once '../auth/session_check.php';

if (!isset($_GET['video_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing video_id parameter']);
    exit();
}

$video_id = $_GET['video_id'];
$api_key = 'AIzaSyB3kARbw6-7x133tQTpLcriW4X1DfX16a0';

$api_url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=$video_id&key=$api_key";
$response = file_get_contents($api_url);

if ($response === FALSE) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch video metadata']);
    exit();
}

$data = json_decode($response, true);

if (empty($data['items'])) {
    http_response_code(404);
    echo json_encode(['error' => 'Video not found']);
    exit();
}

$item = $data['items'][0];
$title = $item['snippet']['title'];
$duration_iso = $item['contentDetails']['duration'];

function convert_duration($duration) {
    $interval = new DateInterval($duration);
    return ($interval->h * 3600) + ($interval->i * 60) + $interval->s;
}

$duration_seconds = convert_duration($duration_iso);
$url = "https://www.youtube.com/watch?v=$video_id";

// Check if song already exists
$stmt = $conn->prepare("SELECT song_id FROM songs WHERE video_id = ?");
$stmt->bind_param("s", $video_id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($song_id);
    $stmt->fetch();
    $stmt->close();
} else {
    $stmt->close();
    $stmt = $conn->prepare("INSERT INTO songs (video_id, title, duration, url) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssis", $video_id, $title, $duration_seconds, $url);
    $stmt->execute();
    $song_id = $stmt->insert_id;
    $stmt->close();
}

echo json_encode([
    'song_id' => $song_id,
    'title' => $title,
    'duration' => $duration_seconds,
    'url' => $url
]);

$conn->close();
?>
