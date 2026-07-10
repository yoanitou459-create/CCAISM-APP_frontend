# Sync backend files only — preserves frontend design on main
# Usage: .\scripts\sync-backend.ps1 <ref>
# Example: .\scripts\sync-backend.ps1 origin/backend/firestore-auth

param(
    [Parameter(Mandatory = $true)]
    [string]$Ref
)

$ErrorActionPreference = "Stop"
$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH

$BackendPaths = @(
    "src/firebase.ts",
    "src/utils",
    "src/hooks",
    "firestore.rules",
    "firebase-blueprint.json"
)

Write-Host ">> Fetch origin..."
git fetch origin

Write-Host ">> Checkout main..."
git checkout main
git pull origin main

Write-Host ">> Apply backend files from: $Ref"
git checkout $Ref -- @BackendPaths

Write-Host ""
Write-Host ">> Fichiers modifies :"
git status --short

Write-Host ""
Write-Host ">> Lancez: npm run build"
Write-Host ">> Puis: git commit -m 'chore: sync backend depuis $Ref'"
Write-Host ">> Et:   git push origin main"
