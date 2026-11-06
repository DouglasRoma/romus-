param([switch]$IncludeClipboard,[switch]$IncludePackageDownloads,[switch]$RemoveOldInstallers)
$ErrorActionPreference = 'Stop'
$atlasProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$atlasTempRoot = (Resolve-Path -LiteralPath $env:TEMP).ProviderPath.TrimEnd('\')
$atlasBuildRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'ImageAtlasBuild'))
$atlasBuilderCache = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'electron-builder\Cache'))
$atlasElectronCache = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'electron\Cache'))
$atlasPackageCache = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'npm-cache\_cacache'))
$atlasOldRelease = Join-Path $atlasProject 'release\win-unpacked'
$atlasReleaseRoot = [IO.Path]::GetFullPath((Join-Path $atlasProject 'release'))
$atlasCaptures = Join-Path $atlasProject 'test-results'
$atlasPackage = Get-Content -LiteralPath (Join-Path $atlasProject 'package.json') -Raw | ConvertFrom-Json
$atlasVersion = $atlasPackage.version
$atlasInstallerName = $atlasPackage.build.win.artifactName.Replace('${version}',$atlasVersion).Replace('${ext}','exe')
$atlasInstaller = Join-Path $atlasReleaseRoot $atlasInstallerName
if (-not (Test-Path -LiteralPath $atlasInstaller)) { throw 'O instalador atual precisa ser preservado antes da limpeza.' }
$atlasInstallerHash = (Get-FileHash -LiteralPath $atlasInstaller -Algorithm SHA256).Hash
$atlasFreeBefore = (Get-PSDrive -Name C).Free
$atlasProcesses = @(Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('electron.exe','ROMUS.exe','Image Atlas.exe','node.exe','makensis.exe','7za.exe') -or ($_.Name -like 'Image-Atlas-*-Setup.exe' -or $_.Name -like 'ROMUS-*-Setup.exe') } | ForEach-Object { $_.CommandLine })
$atlasPrefixes = @('atlas-actions-','atlas-check-','atlas-folders-','atlas-selection-','atlas-startup-','atlas-visual-')
foreach ($atlasTest in Get-ChildItem -LiteralPath (Join-Path $atlasProject 'tests') -File -Filter '*.cjs') {
    $atlasText = Get-Content -LiteralPath $atlasTest.FullName -Raw
    $atlasPrefixes += [regex]::Matches($atlasText, "atlas-[a-z-]+-") | ForEach-Object { $_.Value }
}
$atlasPrefixes = @($atlasPrefixes | Sort-Object -Unique)
$atlasTargets = [Collections.Generic.List[string]]::new()
if ($IncludePackageDownloads -and (Test-Path -LiteralPath $atlasPackageCache)) { $atlasTargets.Add($atlasPackageCache) }
if ($RemoveOldInstallers) { foreach ($atlasOldInstaller in Get-ChildItem -LiteralPath $atlasReleaseRoot -File -Filter '*-Setup.exe') { if ($atlasOldInstaller.Name -match '^(?:Image-Atlas|ROMUS)-(\d+\.\d+\.\d+)-Setup\.exe$' -and [version]$Matches[1] -lt [version]$atlasVersion) { $atlasTargets.Add($atlasOldInstaller.FullName) } } }
foreach ($atlasPath in @($atlasBuildRoot,$atlasOldRelease,$atlasCaptures,$atlasBuilderCache)) { if (Test-Path -LiteralPath $atlasPath) { $atlasTargets.Add($atlasPath) } }
foreach ($atlasDirectory in Get-ChildItem -LiteralPath $atlasTempRoot -Directory -Filter 'atlas-*') {
    if ($atlasDirectory.Name -match '^atlas-[a-z-]+-[a-zA-Z0-9]{6}$' -and @($atlasPrefixes | Where-Object { $atlasDirectory.Name.StartsWith($_,[StringComparison]::Ordinal) }).Count) { $atlasTargets.Add($atlasDirectory.FullName) }
}
foreach ($atlasDirectory in Get-ChildItem -LiteralPath $atlasElectronCache -Directory -ErrorAction SilentlyContinue) {
    $atlasChildren = @(Get-ChildItem -LiteralPath $atlasDirectory.FullName -Force)
    if ($atlasChildren.Count -eq 1 -and $atlasChildren[0].Name -eq 'electron-v45.0.0-win32-x64.zip') { $atlasTargets.Add($atlasDirectory.FullName) }
}
foreach ($atlasDirectory in Get-ChildItem -LiteralPath $atlasTempRoot -Directory -Filter 'electron-download-*') {
    if (@(Get-ChildItem -LiteralPath $atlasDirectory.FullName -Force).Count -eq 0) { $atlasTargets.Add($atlasDirectory.FullName) }
}
if ($IncludeClipboard) { foreach ($atlasFile in Get-ChildItem -LiteralPath $atlasTempRoot -File -Filter 'codex-clipboard-*') { $atlasTargets.Add($atlasFile.FullName) } }
$atlasRemoved = [Collections.Generic.List[string]]::new()
$atlasSkipped = [Collections.Generic.List[object]]::new()
foreach ($atlasCandidate in $atlasTargets) {
    if (-not (Test-Path -LiteralPath $atlasCandidate)) { continue }
    $atlasItem = Get-Item -LiteralPath $atlasCandidate -Force
    $atlasAbsolute = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $atlasItem.FullName).ProviderPath).TrimEnd('\')
    $atlasParent = [IO.Path]::GetDirectoryName($atlasAbsolute)
    $atlasAllowed = ($IncludePackageDownloads -and $atlasAbsolute -eq $atlasPackageCache) -or $atlasAbsolute -in @($atlasBuildRoot,$atlasOldRelease,$atlasCaptures,$atlasBuilderCache) -or ($atlasParent -eq $atlasTempRoot -and ($atlasItem.Name -like 'atlas-*' -or $atlasItem.Name -like 'electron-download-*' -or $atlasItem.Name -like 'codex-clipboard-*')) -or ($atlasParent -eq $atlasElectronCache -and @((Get-ChildItem -LiteralPath $atlasAbsolute -File -Force -ErrorAction SilentlyContinue) | Where-Object Name -eq 'electron-v45.0.0-win32-x64.zip').Count -eq 1)
    $atlasOldInstallerAllowed = $RemoveOldInstallers -and $atlasParent -eq $atlasReleaseRoot -and $atlasItem.Name -match '^(?:Image-Atlas|ROMUS)-(\d+\.\d+\.\d+)-Setup\.exe$' -and [version]$Matches[1] -lt [version]$atlasVersion
    $atlasAllowed = $atlasAllowed -or $atlasOldInstallerAllowed
    if (-not $atlasAllowed -or $atlasAbsolute -eq $atlasProject -or $atlasAbsolute -eq $atlasTempRoot -or $atlasAbsolute -eq $atlasInstaller) { throw ('Alvo fora da limpeza autorizada: ' + $atlasAbsolute) }
    if (@($atlasProcesses | Where-Object { $_ -and $_.IndexOf($atlasAbsolute,[StringComparison]::OrdinalIgnoreCase) -ge 0 }).Count) { $atlasSkipped.Add(@{path=$atlasAbsolute;reason='Em uso por um processo'}); continue }
    if (($atlasItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { $atlasSkipped.Add(@{path=$atlasAbsolute;reason='Link ou ponto de análise'}); continue }
    if ($atlasItem.PSIsContainer -and @(Get-ChildItem -LiteralPath $atlasAbsolute -Recurse -Force -Attributes ReparsePoint -ErrorAction SilentlyContinue).Count) { $atlasSkipped.Add(@{path=$atlasAbsolute;reason='Contém links; preservado'}); continue }
    try {
        if ($atlasItem.PSIsContainer) { Remove-Item -LiteralPath $atlasAbsolute -Recurse -Force -ErrorAction Stop }
        else { Remove-Item -LiteralPath $atlasAbsolute -Force -ErrorAction Stop }
        $atlasRemoved.Add($atlasAbsolute)
        if ($atlasRemoved.Count % 30 -eq 0) { Write-Output ('Removidos ' + $atlasRemoved.Count + ' arquivos/pastas temporários.') }
    } catch { $atlasSkipped.Add(@{path=$atlasAbsolute;reason=$_.Exception.Message}) }
}
if ((Get-FileHash -LiteralPath $atlasInstaller -Algorithm SHA256).Hash -ne $atlasInstallerHash) { throw 'A integridade do instalador mudou.' }
$atlasFreeAfter = (Get-PSDrive -Name C).Free
$atlasReport = [PSCustomObject]@{Removed=$atlasRemoved.Count;Skipped=$atlasSkipped;ClipboardRemoved=@($atlasRemoved | Where-Object { [IO.Path]::GetFileName($_) -like 'codex-clipboard-*' }).Count;FreeBeforeGB=[Math]::Round($atlasFreeBefore/1GB,2);FreeAfterGB=[Math]::Round($atlasFreeAfter/1GB,2);RecoveredGB=[Math]::Round(($atlasFreeAfter-$atlasFreeBefore)/1GB,2);InstallerPreserved=$atlasInstaller;LibraryPreserved=(Test-Path -LiteralPath (Join-Path $env:APPDATA 'Image Atlas\libraries\default'));RemovedPaths=$atlasRemoved}
$atlasReport | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $atlasProject 'cleanup-report.json') -Encoding utf8
$atlasReport | Select-Object Removed,Skipped,ClipboardRemoved,FreeBeforeGB,FreeAfterGB,RecoveredGB,InstallerPreserved,LibraryPreserved | ConvertTo-Json -Depth 4
