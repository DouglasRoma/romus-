$ErrorActionPreference = 'Stop'
$atlasNode = (Get-Command node -ErrorAction Stop).Source
Start-Process -FilePath $atlasNode -ArgumentList @('scripts/dev.cjs') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'development.log') -RedirectStandardError (Join-Path $PSScriptRoot 'development-error.log')
