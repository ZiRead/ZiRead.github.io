#!/bin/bash
# Скрипт управления swap-файлом для ALT Linux
# Запускать от имени root: su - или sudo ./swap_manager.sh

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Проверка прав root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}Ошибка: скрипт должен выполняться от имени root.${NC}"
    echo "Используйте: su - или sudo $0"
    exit 1
fi

# Определение объёма ОЗУ в Мегабайтах (округление вверх)
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [[ -z "$RAM_MB" ]]; then
    RAM_MB=1024 # fallback
fi
DEFAULT_SWAP_SIZE="${RAM_MB}M"
DEFAULT_SWAP_FILE="/swapfile"

# Функция проверки поддержки status=progress в dd
DD_PROGRESS=""
if dd --help 2>&1 | grep -q "status=progress"; then
    DD_PROGRESS="status=progress"
fi

# Функция показа текущего состояния swap
show_status() {
    echo -e "\n${YELLOW}=== Текущее состояние swap ===${NC}"
    echo "Активные устройства подкачки:"
    swapon --show 2>/dev/null || echo "  (нет активных swap-устройств)"
    echo -e "\nИспользование памяти:"
    free -h
    echo -e "\nСодержимое /proc/swaps:"
    cat /proc/swaps 2>/dev/null || true
    echo ""
}

# Функция запроса параметров с возможностью изменения
ask_params() {
    local default_file="$1"
    local default_size="$2"
    local ask_size="$3"

    read -r -p "Путь к swap-файлу [${default_file}]: " user_file
    SWAP_FILE="${user_file:-$default_file}"

    if [[ "$ask_size" == "yes" ]]; then
        read -r -p "Размер swap (например, 1024M, 2G) [${default_size}]: " user_size
        SWAP_SIZE="${user_size:-$default_size}"
    else
        SWAP_SIZE="$default_size"
    fi
}

# Функция создания swap-файла
create_swap() {
    echo -e "\n${YELLOW}--- Создание swap-файла ---${NC}"
    ask_params "$DEFAULT_SWAP_FILE" "$DEFAULT_SWAP_SIZE" "yes"

    if [[ -e "$SWAP_FILE" ]]; then
        echo -e "${RED}Файл $SWAP_FILE уже существует.${NC}"
        read -r -p "Перезаписать? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo "Отменено."
            return
        fi
        swapoff "$SWAP_FILE" 2>/dev/null || true
        rm -f "$SWAP_FILE"
    fi

    # Проверка, не активен ли уже swap
    if swapon --show | grep -q "$SWAP_FILE"; then
        echo -e "${YELLOW}Внимание: $SWAP_FILE уже активен. Сначала отключите его.${NC}"
        return
    fi

    echo "Создание файла $SWAP_FILE размером $SWAP_SIZE ..."
    # Используем dd для создания файла (рекомендуется для swap)
    if ! dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$(echo "$SWAP_SIZE" | sed 's/[^0-9]//g') $DD_PROGRESS; then
        # Если размер задан с суффиксом (например, 2G), нужно преобразовать
        # Упрощённый вариант: если count не сработал, пробуем fallocate
        echo -e "${YELLOW}dd не удался, пробуем fallocate...${NC}"
        if ! fallocate -l "$SWAP_SIZE" "$SWAP_FILE"; then
            echo -e "${RED}Не удалось создать файл.${NC}"
            return
        fi
    fi

    chmod 600 "$SWAP_FILE"
    chown root:root "$SWAP_FILE"

    echo "Инициализация swap..."
    if ! mkswap "$SWAP_FILE"; then
        echo -e "${RED}Ошибка mkswap.${NC}"
        return
    fi

    echo "Включение swap..."
    if ! swapon "$SWAP_FILE"; then
        echo -e "${RED}Ошибка swapon.${NC}"
        return
    fi

    # Добавление в fstab, если записи ещё нет
    if ! grep -q "^$SWAP_FILE " /etc/fstab; then
        echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
        echo "Запись добавлена в /etc/fstab."
    else
        echo "Запись в /etc/fstab уже существует."
    fi

    echo -e "${GREEN}Swap-файл $SWAP_FILE успешно создан и включён.${NC}"
    show_status
}

# Функция включения существующего swap-файла
enable_swap() {
    echo -e "\n${YELLOW}--- Включение swap-файла ---${NC}"
    ask_params "$DEFAULT_SWAP_FILE" "" "no"

    if [[ ! -f "$SWAP_FILE" ]]; then
        echo -e "${RED}Файл $SWAP_FILE не найден.${NC}"
        return
    fi

    if swapon --show | grep -q "$SWAP_FILE"; then
        echo -e "${YELLOW}Swap-файл $SWAP_FILE уже активен.${NC}"
        return
    fi

    echo "Включение $SWAP_FILE ..."
    if swapon "$SWAP_FILE"; then
        echo -e "${GREEN}Swap-файл включён.${NC}"
        # Добавляем в fstab, если нет
        if ! grep -q "^$SWAP_FILE " /etc/fstab; then
            echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
            echo "Запись добавлена в /etc/fstab."
        fi
    else
        echo -e "${RED}Не удалось включить swap.${NC}"
    fi
    show_status
}

# Функция отключения swap-файла
disable_swap() {
    echo -e "\n${YELLOW}--- Отключение swap-файла ---${NC}"
    ask_params "$DEFAULT_SWAP_FILE" "" "no"

    if ! swapon --show | grep -q "$SWAP_FILE"; then
        echo -e "${YELLOW}Swap-файл $SWAP_FILE не активен.${NC}"
        return
    fi

    echo "Отключение $SWAP_FILE ..."
    if swapoff "$SWAP_FILE"; then
        echo -e "${GREEN}Swap-файл отключён.${NC}"
    else
        echo -e "${RED}Ошибка отключения (возможно, файл используется).${NC}"
    fi
    show_status
}

# Функция удаления swap-файла
delete_swap() {
    echo -e "\n${YELLOW}--- Удаление swap-файла ---${NC}"
    ask_params "$DEFAULT_SWAP_FILE" "" "no"

    if [[ ! -f "$SWAP_FILE" ]]; then
        echo -e "${YELLOW}Файл $SWAP_FILE не существует.${NC}"
        return
    fi

    # Отключаем, если активен
    if swapon --show | grep -q "$SWAP_FILE"; then
        echo "Отключение активного swap..."
        swapoff "$SWAP_FILE" || { echo -e "${RED}Не удалось отключить.${NC}"; return; }
    fi

    # Удаляем запись из fstab
    if grep -q "^$SWAP_FILE " /etc/fstab; then
        sed -i "\|^$SWAP_FILE |d" /etc/fstab
        echo "Запись удалена из /etc/fstab."
    fi

    # Удаляем файл
    if rm -f "$SWAP_FILE"; then
        echo -e "${GREEN}Файл $SWAP_FILE удалён.${NC}"
    else
        echo -e "${RED}Не удалось удалить файл.${NC}"
    fi
    show_status
}

# Функция отключения systemd-swap (если установлен), чтобы избежать конфликтов
disable_systemd_swap() {
    if systemctl is-active --quiet systemd-swap 2>/dev/null; then
        echo -e "${YELLOW}Обнаружен systemd-swap. Отключаем...${NC}"
        systemctl disable --now systemd-swap 2>/dev/null || true
    fi
}

# Главное меню
main_menu() {
    while true; do
        echo -e "\n${GREEN}========================================${NC}"
        echo -e "${GREEN}   Управление swap в ALT Linux${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo "1. Показать статус swap"
        echo "2. Создать swap-файл"
        echo "3. Включить swap-файл"
        echo "4. Отключить swap-файл"
        echo "5. Удалить swap-файл"
        echo "0. Выход"
        echo -e "${GREEN}========================================${NC}"
        read -r -p "Выберите действие: " choice

        case "$choice" in
            1) show_status ;;
            2) disable_systemd_swap; create_swap ;;
            3) enable_swap ;;
            4) disable_swap ;;
            5) delete_swap ;;
            0) echo "Выход."; exit 0 ;;
            *) echo -e "${RED}Неверный выбор.${NC}" ;;
        esac

        echo ""
        read -r -p "Нажмите Enter для продолжения..." dummy
    done
}

# Запуск
main_menu
