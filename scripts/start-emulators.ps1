$javaCandidates = @(
  "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot\bin",
  "C:\Program Files\Eclipse Adoptium\jdk-21*\bin",
  "C:\Program Files\Java\*\bin"
)

foreach ($pattern in $javaCandidates) {
  $resolved = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($resolved) {
    $env:Path = "$($resolved.FullName);$env:Path"
    break
  }
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Write-Error "Java not found. Install OpenJDK 21: winget install Microsoft.OpenJDK.21"
  exit 1
}

Set-Location $PSScriptRoot\..
npx firebase emulators:start --project skywings-flight-assistant
