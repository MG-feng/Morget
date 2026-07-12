$ErrorActionPreference = "Stop"
Push-Location (Split-Path $PSScriptRoot -Parent)
dotnet restore
dotnet build -c Release
Write-Host "Build complete." -ForegroundColor Green
Pop-Location
