$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceDirectory = Join-Path $projectRoot "dist-offline"
$indexFile = Join-Path $sourceDirectory "index.html"
$archiveFile = Join-Path $projectRoot "plant-offline.zip"

if (-not (Test-Path $indexFile)) {
  throw "Offline build not found: $indexFile"
}

$maxAttempts = 5
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  try {
    Start-Sleep -Seconds 2
    Compress-Archive `
      -Path (Join-Path $sourceDirectory "*") `
      -DestinationPath $archiveFile `
      -CompressionLevel Optimal `
      -Force
    break
  }
  catch {
    if ($attempt -eq $maxAttempts) {
      throw
    }
    Write-Host "Archive is busy, retrying ($attempt/$maxAttempts)..."
  }
}

$archiveSize = [math]::Round((Get-Item $archiveFile).Length / 1MB, 2)
Write-Host "Offline package created: $archiveFile ($archiveSize MB)"
