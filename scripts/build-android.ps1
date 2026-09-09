$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$localTools = Join-Path $projectRoot 'work\android-tools'
if (-not $env:JAVA_HOME -and (Test-Path (Join-Path $localTools 'jdk21'))) {
    $env:JAVA_HOME = (Get-ChildItem (Join-Path $localTools 'jdk21') -Directory | Select-Object -First 1).FullName
}
if (-not $env:ANDROID_HOME -and (Test-Path (Join-Path $localTools 'sdk'))) {
    $env:ANDROID_HOME = Join-Path $localTools 'sdk'
}
if (-not $env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME = Join-Path $projectRoot 'work\gradle-cache' }
$socketTemp = Join-Path $projectRoot 'work\java-tmp'
New-Item -ItemType Directory -Force $socketTemp | Out-Null
$env:JAVA_TOOL_OPTIONS = "$env:JAVA_TOOL_OPTIONS `"-Djdk.net.unixdomain.tmpdir=$socketTemp`"".Trim()
Push-Location $projectRoot
try {
    npm.cmd run android:sync
    if ($LASTEXITCODE -ne 0) { throw "Mobile build/sync failed: $LASTEXITCODE" }
    Push-Location (Join-Path $projectRoot 'android')
    try {
        & .\gradlew.bat assembleDebug --no-daemon --max-workers=2
        if ($LASTEXITCODE -ne 0) { throw "Android build failed: $LASTEXITCODE" }
    } finally { Pop-Location }
    $builtApk = [IO.Path]::GetFullPath((Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk'))
    $outputDirectory = Join-Path $projectRoot 'outputs'
    $debugApk = [IO.Path]::GetFullPath((Join-Path $outputDirectory 'debug.apk'))
    $workspacePrefix = $projectRoot.TrimEnd('\') + '\'
    if (-not $builtApk.StartsWith($workspacePrefix) -or -not $debugApk.StartsWith($workspacePrefix)) {
        throw 'Unexpected APK output location'
    }
    New-Item -ItemType Directory -Force $outputDirectory | Out-Null
    Move-Item -LiteralPath $builtApk -Destination $debugApk -Force
    Write-Output "Updated $debugApk"
} finally { Pop-Location }
