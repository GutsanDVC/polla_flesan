# Configurar codificación UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "     FLESANONE: DESPLIEGUE AUTOMÁTICO" -ForegroundColor Cyan
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
$REMOTE_BASE_DIR = "/var/www/flesanone" # Directorio estándar para SSR

# ----------------------------------------------
# 2. Selección de Entorno
# ----------------------------------------------
Write-Host "Seleccione el entorno:"
Write-Host "1) QA"
Write-Host "2) Producción"
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
# 3. Ejecutar Build (Nuxt genera .output)
# ----------------------------------------------
Write-Host "`n[1/4] Ejecutando Build local..." -ForegroundColor Yellow
Invoke-Expression $BUILD_CMD
if ($LASTEXITCODE -ne 0) { Write-Host "Error en el build." -ForegroundColor Red; exit 1 }

# ----------------------------------------------
# 4. Preparar Servidor y Subir Archivos
# ----------------------------------------------
$LOCAL_OUTPUT = Join-Path (Split-Path $PSScriptRoot -Parent) ".output"
$REMOTE_PATH = "$REMOTE_BASE_DIR/$PROJECT_NAME"

Write-Host "`n[2/4] Limpiando carpeta remota y preparando directorios..." -ForegroundColor Yellow
$cleanCmd = "mkdir -p $REMOTE_PATH && rm -rf $REMOTE_PATH/*"
plink -ssh -batch "$USERNAME@$SERVER" -pw "$PASSWORD" $cleanCmd

Write-Host "`n[3/4] Subiendo paquete .output al servidor..." -ForegroundColor Yellow
pscp -pw "$PASSWORD" -r "$LOCAL_OUTPUT\*" "$USERNAME@${SERVER}:$REMOTE_PATH/"

if ($LASTEXITCODE -ne 0) { Write-Host "Error en la transferencia." -ForegroundColor Red; exit 1 }

# ----------------------------------------------
# 5. Reiniciar Proceso PM2 (Vital para Nuxt SSR)
# ----------------------------------------------
Write-Host "`n[4/4] Reiniciando proceso en PM2..." -ForegroundColor Yellow
# Intentamos reiniciar, si no existe, lo iniciamos por primera vez
$pm2Cmd = "cd $REMOTE_PATH && pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js"
plink -ssh -batch "$USERNAME@$SERVER" -pw "$PASSWORD" $pm2Cmd

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "     DESPLIEGUE COMPLETADO CON ÉXITO" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green