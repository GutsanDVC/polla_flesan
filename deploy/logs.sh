#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Archivo .env no encontrado en $SCRIPT_DIR"
    exit 1
fi

while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    export "$key=$value"
done < "$ENV_FILE"

REMOTE_PATH="${REMOTE_BASE_DIR}/${PROJECT_NAME}"
APACHE_ERROR_LOG="/var/log/apache2/${PROJECT_NAME}_error.log"
APACHE_ACCESS_LOG="/var/log/apache2/${PROJECT_NAME}_access.log"

ssh_cmd() {
    local cmd="$1"
    sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "cd $REMOTE_PATH && $cmd"
}

ssh_cmd_direct() {
    local cmd="$1"
    sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "$cmd"
}

show_menu() {
    clear
    echo "========================================="
    echo "       CONSULTA DE LOGS - POLLAS"
    echo "========================================="
    echo ""
    echo "  Entorno: $ENV_NAME"
    echo "  Servidor: $USER@$HOST"
    echo "  Directorio: $REMOTE_PATH"
    echo ""
    echo "--- PM2 ---"
    echo "  1) Logs en tiempo real (últimas 50 líneas)"
    echo "  2) Últimas 100 líneas de logs"
    echo "  3) Solo errores de PM2"
    echo "  4) Estado de PM2"
    echo ""
    echo "--- APACHE ---"
    echo "  5) Log de errores de Apache"
    echo "  6) Log de acceso de Apache"
    echo "  7) Errores de Apache (últimas 100 líneas)"
    echo ""
    echo "--- HERRAMIENTAS ---"
    echo "  8) Buscar texto en logs PM2"
    echo "  9) Buscar texto en logs Apache"
    echo " 10) Logs PM2 por rango de fechas"
    echo ""
    echo "  0) Salir"
    echo ""
    echo "========================================="
}

select_env() {
    clear
    echo "========================================="
    echo "       SELECCIONAR ENTORNO"
    echo "========================================="
    echo ""
    echo "  1) QA"
    echo "  2) Producción"
    echo ""
    echo "========================================="

    read -p "Opción: " choice

    case $choice in
        1)
            HOST="$HOST_QA"; USER="$USER_QA"; PASS="$PASS_QA"; ENV_NAME="QA"
            ;;
        2)
            HOST="$HOST_PD"; USER="$USER_PD"; PASS="$PASS_PD"; ENV_NAME="Producción"
            ;;
        *)
            echo "Opción inválida."; exit 1
            ;;
    esac

    if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$PASS" ]; then
        echo "Error: Variables SSH no configuradas para $ENV_NAME en .env"
        exit 1
    fi
}

select_env

while true; do
    show_menu
    read -p "Selecciona una opción: " option
    echo ""

    case $option in
        1)
            echo ">> Logs en tiempo real (Ctrl+C para salir)..."
            echo "---------------------------------------------"
            ssh_cmd "pm2 logs $PROJECT_NAME --lines 50 --nostream"
            ;;
        2)
            echo ">> Últimas 100 líneas de logs:"
            echo "---------------------------------------------"
            ssh_cmd "pm2 logs $PROJECT_NAME --lines 100 --nostream"
            ;;
        3)
            echo ">> Errores de PM2:"
            echo "---------------------------------------------"
            ssh_cmd "pm2 logs $PROJECT_NAME --err --lines 100 --nostream"
            ;;
        4)
            echo ">> Estado de PM2:"
            echo "---------------------------------------------"
            ssh_cmd "pm2 status"
            ;;
        5)
            echo ">> Log de errores de Apache ($APACHE_ERROR_LOG):"
            echo "---------------------------------------------"
            ssh_cmd_direct "tail -n 100 $APACHE_ERROR_LOG 2>/dev/null || echo 'Archivo no encontrado'"
            ;;
        6)
            echo ">> Log de acceso de Apache ($APACHE_ACCESS_LOG):"
            echo "---------------------------------------------"
            ssh_cmd_direct "tail -n 100 $APACHE_ACCESS_LOG 2>/dev/null || echo 'Archivo no encontrado'"
            ;;
        7)
            echo ">> Últimas 100 líneas del log de errores de Apache:"
            echo "---------------------------------------------"
            ssh_cmd_direct "tail -n 100 $APACHE_ERROR_LOG 2>/dev/null || echo 'Archivo no encontrado'"
            ;;
        8)
            read -p "Texto a buscar en logs PM2: " search_text
            if [ -n "$search_text" ]; then
                echo ">> Buscando '$search_text' en logs PM2:"
                echo "---------------------------------------------"
                ssh_cmd "pm2 logs $PROJECT_NAME --nostream --lines 1000 | grep -i '$search_text'"
            fi
            ;;
        9)
            read -p "Texto a buscar en logs Apache: " search_text
            if [ -n "$search_text" ]; then
                echo ">> Buscando '$search_text' en logs de Apache:"
                echo "---------------------------------------------"
                ssh_cmd_direct "grep -i '$search_text' $APACHE_ERROR_LOG $APACHE_ACCESS_LOG 2>/dev/null | tail -n 100 || echo 'Sin resultados'"
            fi
            ;;
        10)
            read -p "Fecha inicio (YYYY-MM-DD HH:MM:SS): " date_from
            read -p "Fecha fin    (YYYY-MM-DD HH:MM:SS): " date_to
            if [ -n "$date_from" ] && [ -n "$date_to" ]; then
                echo ">> Logs PM2 entre $date_from y $date_to:"
                echo "---------------------------------------------"
                ssh_cmd "pm2 logs $PROJECT_NAME --nostream --lines 5000 | sed -n '/$date_from/,/$date_to/p'"
            fi
            ;;
        0)
            echo "Saliendo..."
            exit 0
            ;;
        *)
            echo "Opción inválida."
            ;;
    esac

    echo ""
    read -p "Presiona Enter para continuar..."
done
