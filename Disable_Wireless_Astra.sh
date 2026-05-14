#!/bin/bash
echo -e "Убиватор беспроводных интерфейсов 3000 \v\rВерсия: Alpha 1"
echo ""
echo -n "Блокировка модулей ядра..."
echo "blacklist rtw89_pci" >> /etc/modprobe.d/blacklist-astra.conf
echo "install rtw89_pci /bin/false" >> /etc/modprobe.d/blacklist-astra.conf
echo "blacklist mt7601u" >> /etc/modprobe.d/blacklist-astra.conf

echo "Завершено"
echo -n "Обновление конфигурации ядра..."
update-initramfs -u -k all > /dev/null
echo "Завершено"
echo -e -n "Требуется перезагрузка системы для приминения изменений. \v\rВыполнить сейчас? (Y/N):"; read v1

if [ "$v1" == y ] || [ "$v1" == Y ]; then
	echo "Будет выполнена перезагрезка"
	systemctl reboot > /dev/null
else
	echo "Перезегрузка пропущена"
	exit 1
fi
