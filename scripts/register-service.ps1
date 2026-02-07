param(
  [string]$ServiceName = "VovaipetrovaDev",
  [string]$DisplayName = "Vovaipetrova Dev Server"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = "$root\scripts\start-dev-service.ps1"

if (-not (Test-Path $target)) {
  throw "Missing start-dev.ps1 at $target"
}

$binPath = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$target`""

sc.exe create $ServiceName binPath= $binPath start= auto DisplayName= $DisplayName | Out-Null
sc.exe description $ServiceName "Keeps Vovaipetrova dev server running" | Out-Null
sc.exe failure $ServiceName reset= 0 actions= restart/5000/restart/5000/restart/5000 | Out-Null
sc.exe failureflag $ServiceName 1 | Out-Null
sc.exe start $ServiceName | Out-Null

Write-Host "Service created and started: $ServiceName"