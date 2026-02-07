$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$startup = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startup "vovaipetrova-dev.lnk"
$target = "$root\scripts\start-dev-hidden.vbs"

if (-not (Test-Path $target)) {
  throw "Missing start-dev.ps1 at $target"
}

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$target`""
$shortcut.WorkingDirectory = $root
$shortcut.WindowStyle = 7
$shortcut.Save()

Write-Host "Autostart shortcut created: $shortcutPath"