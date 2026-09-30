$ErrorActionPreference = 'Stop'
$raizProyecto = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pythonProyecto = Join-Path $raizProyecto '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $pythonProyecto)) {
    throw 'Primero cree .venv e instale backend/requirements.txt según el README.'
}
$valorBytecode = $env:PYTHONDONTWRITEBYTECODE
Push-Location $raizProyecto
try {
    $env:PYTHONDONTWRITEBYTECODE = '1'
    & $pythonProyecto backend/manage.py check
    if ($LASTEXITCODE -ne 0) { throw 'Falló django check.' }
    & $pythonProyecto backend/manage.py makemigrations --check --dry-run
    if ($LASTEXITCODE -ne 0) { throw 'Faltan migraciones.' }
    & $pythonProyecto backend/manage.py test inventario
    if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas del backend.' }
    Push-Location frontend
    try {
        & npm.cmd run lint
        if ($LASTEXITCODE -ne 0) { throw 'Falló lint.' }
        & npm.cmd test
        if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas del frontend.' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }
        & npm.cmd audit
        if ($LASTEXITCODE -ne 0) { throw 'La auditoría de dependencias requiere revisión.' }
    } finally { Pop-Location }
    Write-Host 'Verificación completa: OK'
} finally {
    $env:PYTHONDONTWRITEBYTECODE = $valorBytecode
    Pop-Location
}
