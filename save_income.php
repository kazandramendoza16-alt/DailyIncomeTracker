<?php
// Your existing headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// Your database credentials
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "income_tracker";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => "Connection failed: " . $conn->connect_error]));
}

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['rows']) || empty($data['week_start_date'])) {
    die(json_encode(['success' => false, 'message' => "No data or week start date received."]));
}

// Extract the week_start_date from the received data
$weekStartDate = $data['week_start_date'];

// Prepare SQL statement for insertion with the new column
$sql = "INSERT INTO income_tracker (income_source, sunday, monday, tuesday, wednesday, thursday, friday, saturday, weekly_total, week_start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    die(json_encode(['success' => false, 'message' => "Error preparing statement: " . $conn->error]));
}

// Loop through the received rows and insert into the database
foreach ($data['rows'] as $row) {
    $sunday = $row['daily_income'][0];
    $monday = $row['daily_income'][1];
    $tuesday = $row['daily_income'][2];
    $wednesday = $row['daily_income'][3];
    $thursday = $row['daily_income'][4];
    $friday = $row['daily_income'][5];
    $saturday = $row['daily_income'][6];
    $row_weekly_total = array_sum($row['daily_income']);

    // Bind parameters, including the new date parameter
    $stmt->bind_param("sdddddddds", 
        $row['source'], 
        $sunday, 
        $monday, 
        $tuesday, 
        $wednesday, 
        $thursday, 
        $friday, 
        $saturday, 
        $row_weekly_total, 
        $weekStartDate
    );
    $stmt->execute();
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'message' => 'Data saved successfully.']);
?>