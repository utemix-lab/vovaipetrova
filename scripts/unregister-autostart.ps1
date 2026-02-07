$ErrorActionPreference = "Stop"

$startup = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startup "vovaipetrova-dev.lnk"

if (Test-Path $shortcutPath) {
  Remove-Item $shortcutPath -Force
  Write-Host "Autostart shortcut removed: $shortcutPath"
} else {
  Write-Host "Autostart shortcut not found: $shortcutPath"
}