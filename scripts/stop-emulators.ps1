$ports = @(9099, 8080, 5000, 5001, 4000, 4400, 4500)
$pids = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique

if ($pids) {
  foreach ($pid in $pids) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process $pid"
  }
} else {
  Write-Host "No emulator processes found on default ports."
}
