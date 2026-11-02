<?php

$dsn = 'mysql:host=127.0.0.1;port=3306;dbname=cde_test;charset=utf8mb4';
$user = 'root';
$pass = '';

$pdo1 = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdoMon = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Reset product 6 stock to 1
$pdo1->exec("UPDATE products SET stock = 1 WHERE id = 6;");

echo "[Main Process] Starting transaction and acquiring EXCLUSIVE lock on product ID=6...\n";
$pdo1->beginTransaction();
$stmt1 = $pdo1->query("SELECT id, name, stock FROM products WHERE id = 6 FOR UPDATE;");
$prod1 = $stmt1->fetch(PDO::FETCH_ASSOC);
echo "[Main Process] Lock GRANTED for PID=" . getmypid() . ". Current stock: {$prod1['stock']}\n";

// Launch Worker Process 2 attempting to lock the exact same row
$workerCode = <<<'CODE'
<?php
$dsn = 'mysql:host=127.0.0.1;port=3306;dbname=cde_test;charset=utf8mb4';
$pdo = new PDO($dsn, 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$start = microtime(true);
echo "[Worker Process 2] Requesting lock on product ID=6 at " . date('H:i:s') . "...\n";
$pdo->beginTransaction();
$stmt = $pdo->query("SELECT id, name, stock FROM products WHERE id = 6 FOR UPDATE;");
$prod = $stmt->fetch(PDO::FETCH_ASSOC);
$waited = round(microtime(true) - $start, 3);
echo "[Worker Process 2] Lock ACQUIRED after waiting {$waited} seconds! Read stock: {$prod['stock']}\n";
$pdo->commit();
CODE;

$workerFile = __DIR__ . '/worker_lock.php';
file_put_contents($workerFile, $workerCode);

$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];
$process = proc_open("php " . escapeshellarg($workerFile), $descriptors, $pipes);

// Give worker time to hit the lock and enter WAITING state
usleep(600000); // 600ms

echo "\n==================== PERFORMANCE_SCHEMA.DATA_LOCKS ====================\n";
$locks = $pdoMon->query("
    SELECT ENGINE, OBJECT_NAME, INDEX_NAME, LOCK_TYPE, LOCK_MODE, LOCK_STATUS, LOCK_DATA 
    FROM performance_schema.data_locks 
    WHERE OBJECT_NAME = 'products';
")->fetchAll(PDO::FETCH_ASSOC);
foreach ($locks as $row) {
    printf("Table: %-10s | Index: %-8s | Type: %-6s | Mode: %-15s | Status: %-8s | Data: %s\n",
        $row['OBJECT_NAME'], $row['INDEX_NAME'] ?? 'TABLE', $row['LOCK_TYPE'], $row['LOCK_MODE'], $row['LOCK_STATUS'], $row['LOCK_DATA'] ?? 'N/A');
}

echo "\n==================== PERFORMANCE_SCHEMA.DATA_LOCK_WAITS ====================\n";
$waits = $pdoMon->query("
    SELECT REQUESTING_ENGINE_TRANSACTION_ID, BLOCKING_ENGINE_TRANSACTION_ID 
    FROM performance_schema.data_lock_waits;
")->fetchAll(PDO::FETCH_ASSOC);
foreach ($waits as $row) {
    echo "WAITING Tx ID: {$row['REQUESTING_ENGINE_TRANSACTION_ID']} is BLOCKED by Tx ID: {$row['BLOCKING_ENGINE_TRANSACTION_ID']}\n";
}

echo "\n[Main Process] Updating stock from 1 to 0 and committing transaction...\n";
$pdo1->exec("UPDATE products SET stock = 0 WHERE id = 6;");
$pdo1->commit();
echo "[Main Process] Transaction COMMITTED. Lock released at " . date('H:i:s') . ".\n\n";

$workerOutput = stream_get_contents($pipes[1]);
fclose($pipes[1]);
fclose($pipes[2]);
proc_close($process);

echo $workerOutput;

@unlink($workerFile);
