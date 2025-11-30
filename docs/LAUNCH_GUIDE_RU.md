# Руководство по запуску XOLO Browser

## Проблема с CEF библиотеками

При запуске браузера может возникнуть ошибка:
```
Не удалось создать браузер: Failed to initialize CEF
```

Это происходит потому, что CEF не может найти свои библиотеки.

## Решение 1: Использование скрипта запуска (Рекомендуется)

Самый простой способ - использовать скрипт `run-xolo.sh`:

```bash
./run-xolo.sh
```

Этот скрипт автоматически устанавливает `LD_LIBRARY_PATH` и запускает приложение.

## Решение 2: Ручная установка LD_LIBRARY_PATH

Если вы хотите запустить приложение напрямую:

```bash
export LD_LIBRARY_PATH="/home/onekill/Desktop/XOLO/src-tauri/target/release/cef:$LD_LIBRARY_PATH"
./src-tauri/target/release/xolo-browser
```

## Решение 3: Постоянная установка переменной окружения

Добавьте в `~/.bashrc` или `~/.profile`:

```bash
export LD_LIBRARY_PATH="/home/onekill/Desktop/XOLO/src-tauri/target/release/cef:$LD_LIBRARY_PATH"
```

Затем перезагрузите терминал или выполните:
```bash
source ~/.bashrc
```

## Проверка установки CEF

Убедитесь, что CEF библиотеки установлены:

```bash
ls -la src-tauri/target/release/cef/
```

Вы должны увидеть:
- `libcef.so` (основная библиотека CEF, ~1.4GB)
- `libEGL.so`
- `libGLESv2.so`
- `chrome-sandbox`
- `Resources/` (директория с ресурсами)
- и другие файлы

## Проверка RUNPATH

Проверьте, что RUNPATH установлен правильно:

```bash
readelf -d src-tauri/target/release/xolo-browser | grep RUNPATH
```

Должно быть:
```
0x000000000000001d (RUNPATH)            Library runpath: [$ORIGIN/cef]
```

## Проверка зависимостей

Проверьте, что все библиотеки найдены:

```bash
ldd src-tauri/target/release/xolo-browser | grep -i cef
```

Должно быть:
```
libcef.so => /path/to/XOLO/src-tauri/target/release/cef/libcef.so (0x...)
```

## Если CEF не установлен

Запустите скрипт установки:

```bash
./setup-cef.sh
```

Этот скрипт:
1. Скачает CEF для Linux
2. Распакует его
3. Скопирует библиотеки в правильное место
4. Пересоберет проект

## Разработка

При разработке используйте:

```bash
# Для сборки
cd src-tauri
cargo build --release

# Для запуска
cd ..
./run-xolo.sh
```

## Создание .desktop файла

Для запуска из меню приложений создайте `~/.local/share/applications/xolo-browser.desktop`:

```desktop
[Desktop Entry]
Name=XOLO Browser
Comment=Современный веб-браузер на базе CEF
Exec=/home/onekill/Desktop/XOLO/run-xolo.sh
Icon=/home/onekill/Desktop/XOLO/public/icon.png
Terminal=false
Type=Application
Categories=Network;WebBrowser;
```

Замените `/home/onekill/Desktop/XOLO` на ваш путь к проекту.

## Устранение неполадок

### Ошибка: libcef.so not found

Убедитесь, что:
1. CEF установлен: `ls src-tauri/target/release/cef/libcef.so`
2. RUNPATH установлен: `readelf -d src-tauri/target/release/xolo-browser | grep RUNPATH`
3. Используйте скрипт запуска: `./run-xolo.sh`

### Ошибка: Failed to initialize CEF

Проверьте:
1. Наличие директории `Resources`: `ls src-tauri/target/release/cef/Resources/`
2. Права на выполнение: `chmod +x src-tauri/target/release/xolo-browser`
3. Права на chrome-sandbox: `chmod 4755 src-tauri/target/release/cef/chrome-sandbox`

### Белый экран при загрузке

См. документацию: `docs/FIX_WHITE_SCREEN_RU.md`

### Проблемы с Google авторизацией

См. документацию: `docs/GOOGLE_LOGIN_RU.md`
