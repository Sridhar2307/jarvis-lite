$ErrorActionPreference = "Stop"

$desktopPath = [Environment]::GetFolderPath("Desktop")
$projectDir = (Get-Item (Join-Path $PSScriptRoot "..")).FullName
$batPath = Join-Path $projectDir "launch-ecd.bat"
$iconPath = Join-Path $projectDir "public\favicon.ico"
$shortcutPath = Join-Path $desktopPath "JARVIS Executive Dashboard (ECD).lnk"

Write-Host "Creating desktop shortcut at: $shortcutPath"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c `"$batPath`""
$Shortcut.WorkingDirectory = $projectDir
if (Test-Path $iconPath) {
    $Shortcut.IconLocation = "$iconPath, 0"
}
$Shortcut.Hotkey = "Ctrl+Alt+J"
$Shortcut.Description = "Launch JARVIS Executive Command Dashboard (ECD) Chained Window [Ctrl+Alt+J]"
$Shortcut.WindowStyle = 7
$Shortcut.Save()

Write-Host "SUCCESS: Desktop shortcut created successfully!"
Write-Host "Global Shortcut Key: Ctrl + Alt + J"
