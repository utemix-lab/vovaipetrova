param(
  [string]$ServiceName = "VovaipetrovaDev"
)

$ErrorActionPreference = "Stop"

sc.exe stop $ServiceName | Out-Null
sc.exe delete $ServiceName | Out-Null

Write-Host "Service removed: $ServiceName"