# Push mobile/.env values to EAS (development, preview, production).
# Usage: cd mobile; .\scripts\set-eas-env.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$envFile = Join-Path $PWD ".env"
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile - copy .env.example and fill in your keys first."
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  if ($_ -match '^([^=]+)=(.*)$') {
    $vars[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$allEnvs = @("--environment", "development", "--environment", "preview", "--environment", "production")
$storeEnvs = @("--environment", "preview", "--environment", "production")

$required = @(
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
  "EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID_IOS",
  "EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID_ANDROID"
)

function Set-EasEnvVar {
  param(
    [string]$Name,
    [string]$Value,
    [string[]]$EnvFlags,
    [string]$Visibility = "sensitive"
  )
  if (-not $Value) {
    Write-Warning "Skipping $Name (empty in .env)"
    return
  }
  Write-Host "Setting $Name ..."
  npx eas-cli env:create `
    --name $Name `
    --value $Value `
    @EnvFlags `
    --visibility $Visibility `
    --non-interactive `
    --force
  if ($LASTEXITCODE -ne 0) { throw "eas env:create failed for $Name" }
}

if ($vars["EAS_PROJECT_ID"]) {
  $env:EAS_PROJECT_ID = $vars["EAS_PROJECT_ID"]
} else {
  throw "Missing EAS_PROJECT_ID in .env - run: npx eas-cli init --non-interactive --force"
}

foreach ($name in $required) {
  Set-EasEnvVar -Name $name -Value $vars[$name] -EnvFlags $allEnvs
}

Set-EasEnvVar -Name "EXPO_PUBLIC_PRIVACY_POLICY_URL" -Value $vars["EXPO_PUBLIC_PRIVACY_POLICY_URL"] -EnvFlags $storeEnvs -Visibility "plaintext"

Write-Host "Done. Verify with: npx eas-cli env:list"
