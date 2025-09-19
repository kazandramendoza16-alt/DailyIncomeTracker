<?php
// Add CORS headers for cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Database credentials
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

// Get the week start date from the URL query parameters
$selected_date = $_GET['week_start_date'] ?? null;

// Validate the date parameter
if (empty($selected_date)) {
    die(json_encode(['success' => false, 'message' => "Week start date not provided."]));
}

// Calculate the start and end dates of the week
// DATE_SUB subtracts days, and DAYOFWEEK returns 1 for Sunday, 2 for Monday, etc.
$sql_start_of_week = "SELECT DATE_SUB(?, INTERVAL (DAYOFWEEK(?) - 1) DAY) AS week_start";
$stmt_start = $conn->prepare($sql_start_of_week);
$stmt_start->bind_param("ss", $selected_date, $selected_date);
$stmt_start->execute();
$result_start = $stmt_start->get_result();
$week_start_date = $result_start->fetch_assoc()['week_start'];
$stmt_start->close();

$sql_end_of_week = "SELECT DATE_ADD(?, INTERVAL (7 - DAYOFWEEK(?)) DAY) AS week_end";
$stmt_end = $conn->prepare($sql_end_of_week);
$stmt_end->bind_param("ss", $selected_date, $selected_date);
$stmt_end->execute();
$result_end = $stmt_end->get_result();
$week_end_date = $result_end->fetch_assoc()['week_end'];
$stmt_end->close();

// Prepare the SQL statement to select records within the date range
$sql = "SELECT * FROM income_tracker WHERE week_start_date BETWEEN ? AND ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    die(json_encode(['success' => false, 'message' => "Error preparing statement: " . $conn->error]));
}

// Bind the start and end date parameters and execute the query
$stmt->bind_param("ss", $week_start_date, $week_end_date);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

// Close the statement and connection
$stmt->close();
$conn->close();

// Return the fetched data as a JSON response
echo json_encode(['success' => true, 'data' => $data]);
?>