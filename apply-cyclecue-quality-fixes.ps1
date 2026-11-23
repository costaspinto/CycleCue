$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$PatchRoot = Join-Path $PSScriptRoot 'cyclecue-quality-fix-patch'
$PackageFile = Join-Path $ProjectRoot 'package.json'

Write-Host "`nCycleCue React/ESLint repair" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray

if (-not (Test-Path -LiteralPath $PackageFile)) {
    throw 'package.json was not found. Extract this patch into the CycleCue project root.'
}
if (-not (Test-Path -LiteralPath $PatchRoot)) {
    throw 'Patch files are missing. Re-extract the complete ZIP into the CycleCue project root.'
}

$RelativeFiles = @(
    'src\App.tsx',
    'src\auth\AuthProvider.tsx',
    'src\auth\AuthScreen.tsx',
    'src\auth\auth-context.ts',
    'src\components\ErrorBoundary.tsx',
    'src\components\HealthModules.tsx'
)

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupRoot = Join-Path $ProjectRoot ".cyclecue-backups\lint-fix-$Timestamp"
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

foreach ($RelativePath in $RelativeFiles) {
    $SourcePath = Join-Path $PatchRoot $RelativePath
    $TargetPath = Join-Path $ProjectRoot $RelativePath
    $BackupPath = Join-Path $BackupRoot $RelativePath

    if (-not (Test-Path -LiteralPath $SourcePath)) {
        throw "Patch source file is missing: $RelativePath"
    }

    $TargetDirectory = Split-Path -Parent $TargetPath
    New-Item -ItemType Directory -Path $TargetDirectory -Force | Out-Null

    if (Test-Path -LiteralPath $TargetPath) {
        $BackupDirectory = Split-Path -Parent $BackupPath
        New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
        Copy-Item -LiteralPath $TargetPath -Destination $BackupPath -Force
    }

    Copy-Item -LiteralPath $SourcePath -Destination $TargetPath -Force
    Write-Host "[UPDATED] $RelativePath" -ForegroundColor Green
}

# Keep the peer-compatible dependency versions already used for the successful install.
& npm pkg set 'devDependencies.typescript=^5.9.3'
if ($LASTEXITCODE -ne 0) { throw 'Could not update the TypeScript dependency.' }
& npm pkg set 'devDependencies.@eslint/js=^10.0.1'
if ($LASTEXITCODE -ne 0) { throw 'Could not update @eslint/js.' }

Write-Host "`nBackups saved to: $BackupRoot" -ForegroundColor Gray
Write-Host "`nRunning CycleCue quality checks..." -ForegroundColor Cyan

$Checks = @('typecheck', 'lint', 'test', 'build')
$Results = @()
foreach ($Check in $Checks) {
    Write-Host "`n========== npm run $Check ==========" -ForegroundColor Cyan
    & npm run $Check
    $ExitCode = $LASTEXITCODE
    $Results += [pscustomobject]@{ Check = $Check; Result = if ($ExitCode -eq 0) { 'PASS' } else { 'FAIL' }; ExitCode = $ExitCode }
    if ($ExitCode -eq 0) {
        Write-Host "[PASS] $Check" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Check (exit $ExitCode)" -ForegroundColor Red
    }
}

Write-Host "`nQuality check summary" -ForegroundColor Cyan
$Results | Format-Table -AutoSize

if ($Results.Where({ $_.Result -eq 'FAIL' }).Count -gt 0) {
    Write-Host 'One or more checks still need attention. Share the complete output.' -ForegroundColor Yellow
    exit 1
}

Write-Host "`nAll four checks passed. CycleCue is ready for manual browser testing." -ForegroundColor Green
