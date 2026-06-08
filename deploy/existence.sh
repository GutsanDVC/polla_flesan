PROJECT_ROOT="/var/www/html/vue/$1"

if [ -d "$PROJECT_ROOT" ]; then
    rm -r "$PROJECT_ROOT"
fi

echo "Creando carpeta $PROJECT_ROOT"
mkdir -p "$PROJECT_ROOT" 