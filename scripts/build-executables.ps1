$ErrorActionPreference = "Stop"

$projectDir = (Get-Item (Join-Path $PSScriptRoot "..")).FullName
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$icon = Join-Path $projectDir "public\favicon.ico"

Write-Host "Building Windows Executables (.exe)..." -ForegroundColor Cyan

# 1. Compile JARVIS_ECD.exe
Write-Host "Compiling JARVIS_ECD.exe..."
& $csc /target:winexe "/win32icon:$icon" /out:"$projectDir\JARVIS_ECD.exe" "$projectDir\installer\JarvisLauncher.cs" /reference:System.Windows.Forms.dll /reference:System.dll

# 2. Compile JARVIS_Setup.exe
Write-Host "Compiling JARVIS_Setup.exe..."
& $csc /target:winexe "/win32icon:$icon" /out:"$projectDir\JARVIS_Setup.exe" "$projectDir\installer\JarvisSetup.cs" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.dll /reference:Microsoft.CSharp.dll

Write-Host "SUCCESS: JARVIS_Setup.exe and JARVIS_ECD.exe compiled successfully!" -ForegroundColor Green
