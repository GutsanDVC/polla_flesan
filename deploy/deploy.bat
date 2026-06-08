@echo off
REM Configuración fija

set SERVER=%DEPLOY_SERVER%
set USERNAME=%DEPLOY_USER%
set PASSWORD=%DEPLOY_PASS%
set PROJECT_NAME=%PROJECT_NAME%


echo %SERVER%
echo %USERNAME%
echo %PASSWORD%
echo %PROJECT_NAME%

set SCRIPT_DIR=%~dp0
set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%
for %%A in ("%SCRIPT_DIR%") do set BASE_DIR=%%~dpA

set LOCAL_DIR=%BASE_DIR%dist
echo "Local dir: %LOCAL_DIR%"

set REMOTE_DIR=/var/www/html/vue

set EXISTENCE_PROJECT=%BASE_DIR%deploy\existence.sh
set PERMISSIONS=%BASE_DIR%deploy/permissions.sh

plink -ssh -batch %USERNAME%@%SERVER% -pw %PASSWORD% exit
if %ERRORLEVEL% neq 0 (
    echo "Error: Fallo en la conexión SSH. Verifica el servidor, usuario y contraseña."
    exit /b %ERRORLEVEL%
) else (
    echo "Conexion exitosa. Iniciando despliegue..."
)

plink -ssh -batch %USERNAME%@%SERVER% -pw %PASSWORD% "bash -s -- '%PROJECT_NAME%'" < %EXISTENCE_PROJECT%

if %ERRORLEVEL% neq 0 (
    echo "Error: No se pudo ejecutar el script de existencia en el servidor."
    exit /b %ERRORLEVEL%
)

pscp -pw %PASSWORD% -r "%LOCAL_DIR%\*" %USERNAME%@%SERVER%:%REMOTE_DIR%/%PROJECT_NAME%/
if %ERRORLEVEL% neq 0 (
    echo "Error: No se pudieron subir los archivos al servidor."
    exit /b %ERRORLEVEL%
)

plink -ssh -batch %USERNAME%@%SERVER% -pw %PASSWORD% "bash -s -- '%PROJECT_NAME%'" < %PERMISSIONS%
if %ERRORLEVEL% neq 0 (
    echo "Error: No se pudo ejecutar el script de permisos en el servidor."
    exit /b %ERRORLEVEL%
)

echo "Despliegue completado con exito."