#!/bin/bash
# Script para asegurar que el servidor web y PM2 tengan acceso
PROJECT_NAME=$1
PROJECT_ROOT="/var/www/flesanone/$PROJECT_NAME"

echo "Aplicando permisos a $PROJECT_ROOT"

# www-data suele ser el usuario de Apache
chown -R www-data:www-data $PROJECT_ROOT
# 775 permite que el grupo (donde debería estar tu usuario de despliegue) escriba
chmod -R 775 $PROJECT_ROOT

echo "Estructura de archivos actualizada:"
ls -la $PROJECT_ROOT