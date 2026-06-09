# Configurar codificación UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "      DESPLIEGUE AUTOMÁTICO"               -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# ----------------------------------------------
# 1. Cargar Configuración (.env local)
# ----------------------------------------------
$envFile = Join-Path $PSScriptRoot ".env"
if (!(Test-Path $envFile)) {
    Write-Host "Error: Archivo .env no encontrado." -ForegroundColor Red
    exit 1
}

# Cargar variables de entorno del archivo .env
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*#") { return }
    $parts = $_ -split "="
    if ($parts.Length -eq 2) { Set-Item "Env:$($parts[0].Trim())" ($parts[1].Trim()) }
}

$PROJECT_NAME = $Env:PROJECT_NAME
$REMOTE_BASE_DIR = if ($Env:REMOTE_BASE_DIR) { $Env:REMOTE_BASE_DIR } else { "/var/www/one" }

# ----------------------------------------------
# 2. Selección de Entorno
# ----------------------------------------------
Write-Host "`nSeleccione el entorno:"
Write-Host "  1) QA"
Write-Host "  2) Producción"

$choice = Read-Host "Opción"

if ($choice -eq "1") {
    $SERVER = $Env:HOST_QA; $USERNAME = $Env:USER_QA; $PASSWORD = $Env:PASS_QA; $BUILD_CMD = "npm run build"
}
elseif ($choice -eq "2") {
    $SERVER = $Env:HOST_PD; $USERNAME = $Env:USER_PD; $PASSWORD = $Env:PASS_PD; $BUILD_CMD = "npm run build"
}
else {
    Write-Host "Opción inválida." -ForegroundColor Red; exit 1
}

# ----------------------------------------------
# 3. Selección de Acción
# ----------------------------------------------
Write-Host "`nSeleccione la acción:"
Write-Host "  1) Copiar archivos de configuración"
Write-Host "  2) Desplegar aplicación"

$action = Read-Host "Opción"

if ($action -eq "1") {
    Write-Host "`nCopiando archivos de configuración..." -ForegroundColor Yellow
    # Lógica de copiar archivos de configuración (existente)
    Write-Host "Funcionalidad pendiente de implementar." -ForegroundColor Cyan
    exit 0
}
elseif ($action -ne "2") {
    Write-Host "Opción inválida." -ForegroundColor Red; exit 1
}

# ----------------------------------------------
# 4. Selección de Paso Inicial
# ----------------------------------------------
Write-Host "`n¿Desde qué paso desea iniciar?"
Write-Host "  1) [1/4] Build completo (default)"
Write-Host "  2) [2/4] Preparar servidor (requiere .output)"
Write-Host "  3) [3/4] Subir .output (requiere carpeta remota lista)"
Write-Host "  4) [4/4] Solo reiniciar PM2"

$startStepInput = Read-Host "Paso inicial"
if ($startStepInput -match "^[1-4]$") {
    $startStep = [int]$startStepInput
} else {
    $startStep = 1
    Write-Host "Entrada no válida, se usará paso 1 por defecto." -ForegroundColor Yellow
}

# Variables compartidas
$LOCAL_OUTPUT = Join-Path (Split-Path $PSScriptRoot -Parent) ".output"
$REMOTE_PATH = "$REMOTE_BASE_DIR/$PROJECT_NAME"

# ----------------------------------------------
# 5. Paso [1/4] - Build local (con verificación)
# ----------------------------------------------
if ($startStep -le 1) {
    $skipBuild = $false

    if (Test-Path $LOCAL_OUTPUT) {
        Write-Host "`n⚠ Ya existe una carpeta .output/ de un build anterior." -ForegroundColor Yellow
        $rebuild = Read-Host "¿Desea rehacer el build? (s/n)"
        if ($rebuild -ne "s" -and $rebuild -ne "S") {
            Write-Host "Saltando build. Usando .output existente..." -ForegroundColor Cyan
            $skipBuild = $true
        }
    }

    if (-not $skipBuild) {
        if (Test-Path $LOCAL_OUTPUT) {
            Write-Host "Eliminando .output/ anterior para evitar cache..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force $LOCAL_OUTPUT
        }

        Write-Host "`n[1/4] Ejecutando Build local..." -ForegroundColor Yellow
        $env:NODE_OPTIONS = "--max-old-space-size=4096 --no-deprecation"
        Invoke-Expression $BUILD_CMD
        $env:NODE_OPTIONS = ""

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error en el build." -ForegroundColor Red
            exit 1
        }
    }
}

# ----------------------------------------------
# 6. Paso [2/4] - Preparar servidor
# ----------------------------------------------
if ($startStep -le 2) {
    Write-Host "`n[2/4] Preparando servidor..." -ForegroundColor Yellow
    $cleanCmd = "sudo mkdir -p $REMOTE_PATH && sudo rm -rf $REMOTE_PATH/*"
    plink -ssh -batch "$USERNAME@${SERVER}" -pw "$PASSWORD" $cleanCmd

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error preparando el servidor." -ForegroundColor Red
        exit 1
    }
}

# ----------------------------------------------
# 7. Paso [3/4] - Subir .output (con validación)
# ----------------------------------------------
if ($startStep -le 3) {
    # Validación de precondición: .output debe existir localmente
    if (!(Test-Path $LOCAL_OUTPUT)) {
        Write-Host "`nError: No se encontró .output/ local." -ForegroundColor Red
        Write-Host "Ejecute desde el paso 1 para generar el build." -ForegroundColor Red
        exit 1
    }

    Write-Host "`n[3/4] Subiendo paquete .output..." -ForegroundColor Yellow
    pscp -pw "$PASSWORD" -r "$LOCAL_OUTPUT\*" "$USERNAME@${SERVER}:$REMOTE_PATH/"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error en la transferencia." -ForegroundColor Red
        exit 1
    }

    Write-Host "Subiendo ecosystem.config.js..." -ForegroundColor Yellow
    $ecosystemFile = Join-Path $PSScriptRoot "ecosystem.config.js"
    pscp -pw "$PASSWORD" "$ecosystemFile" "$USERNAME@${SERVER}:$REMOTE_PATH/.ecosystem.config.js"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error subiendo ecosystem.config.js." -ForegroundColor Red
        exit 1
    }
}

# ----------------------------------------------
# 8. Paso [4/4] - Reiniciar PM2 (con validación)
# ----------------------------------------------
if ($startStep -le 4) {
    # Validación de precondición: verificar que los archivos existen en el servidor
    $checkCmd = "test -f $REMOTE_PATH/server/index.mjs && echo OK || echo FAIL"
    $checkResult = plink -ssh -batch "$USERNAME@${SERVER}" -pw "$PASSWORD" $checkCmd

    if ($checkResult.Trim() -ne "OK") {
        Write-Host "`nError: No se encontró server/index.mjs en el servidor." -ForegroundColor Red
        Write-Host "Ejecute desde el paso 3 para subir los archivos." -ForegroundColor Red
        exit 1
    }

    Write-Host "`n[4/4] Reiniciando proceso en PM2..." -ForegroundColor Yellow
    $pm2Cmd = "cd $REMOTE_PATH && pm2 delete $PROJECT_NAME --silent || true && pm2 start .ecosystem.config.js"
    plink -ssh -batch "$USERNAME@${SERVER}" -pw "$PASSWORD" $pm2Cmd

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error reiniciando PM2." -ForegroundColor Red
        exit 1
    }
}

# ----------------------------------------------
# 9. Finalización
# ----------------------------------------------
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "     DESPLIEGUE COMPLETADO CON ÉXITO" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
