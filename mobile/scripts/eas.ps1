# PowerShell wrapper for EAS CLI from mobile/
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$envFile = Join-Path $PWD ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^EAS_PROJECT_ID=(.*)$') {
      $env:EAS_PROJECT_ID = $matches[1].Trim()
    }
  }
}

if (-not $env:EAS_PROJECT_ID) {
  $env:EAS_PROJECT_ID = "02bf57c4-f43f-4cbf-9ccd-e644893f93a7"
}

$env:EAS_NO_VCS = "1"
& npx eas-cli @Args
exit $LASTEXITCODE
