 
# 1. Get Local IP Address (Preferred: WiFi or Ethernet)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Wi-Fi|Ethernet' -and $_.PrefixOrigin -eq 'Dhcp' } | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "Could not detect local IP. Defaulting to localhost." -ForegroundColor Yellow
    $ip = "localhost"
}
else {
    Write-Host "Detected Local IP: $ip" -ForegroundColor Green
}

# 2. Update Frontend API Config
$apiFile = "$PSScriptRoot\frontend\src\services\api.ts"
if (Test-Path $apiFile) {
    $content = Get-Content $apiFile
    $newContent = $content -replace "(const|let) BASE_URL = 'http://.*:3000/api';", "`$1 BASE_URL = 'http://$($ip):3000/api';"
    Set-Content $apiFile $newContent
    Write-Host "Updated frontend/src/services/api.ts with IP: $ip" -ForegroundColor Green
}
else {
    Write-Host "Warning: frontend/src/services/api.ts not found!" -ForegroundColor Red
}

# 3. Check Database Connection (Quick Probe)
Write-Host "Checking Database Connectivity..." -ForegroundColor Cyan
$envFile = "$PSScriptRoot\backend\.env"
if (Test-Path $envFile) {
    # Extract Hostname from DATABASE_URL
    $envContent = Get-Content $envFile
    $dbUrlLine = $envContent | Where-Object { $_ -match "DATABASE_URL" }
    if ($dbUrlLine -match "@(.*):") {
        $dbHost = $matches[1]
        Write-Host "Probing DB Host: $dbHost"
        try {
            $test = Test-NetConnection -ComputerName $dbHost -Port 5432 -WarningAction SilentlyContinue
            if ($test.PingSucceeded -or $test.TcpTestSucceeded) {
                Write-Host "Database is REACHABLE." -ForegroundColor Green
            }
            else {
                Write-Host "CRITICAL: Database ($dbHost) is UNREACHABLE." -ForegroundColor Red
                Write-Host "Action: Check your internet or Wake up your Supabase project." -ForegroundColor Yellow
                Read-Host "Press Enter to continue anyway..."
            }
        }
        catch {
            Write-Host "Could not test connection (Network Error)." -ForegroundColor Red
        }
    }
}

# 4. Start Servers
Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "cd backend; npm run dev" -WindowStyle Normal

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Write-Host "Please scan the QR code with Expo Go." -ForegroundColor Yellow
Write-Host "If you see 'Network Error' or 'Remote Update Failed', stop this script and run:" -ForegroundColor Magenta
Write-Host "cd frontend; npm run tunnel" -ForegroundColor Magenta
Start-Process powershell -ArgumentList "cd frontend; npx expo start -c" -WindowStyle Normal

Write-Host "Airswitch is launching! 🚀" -ForegroundColor Green
