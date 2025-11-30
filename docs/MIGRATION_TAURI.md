# Миграция с Electron на Tauri

## Что изменилось

### Бэкенд
- **Electron (Node.js)** → **Tauri (Rust)**
- Все IPC команды переписаны на Rust
- Хранилище данных использует нативные файловые операции Rust
- OAuth реализован через Rust с использованием tiny_http
- Улучшена производительность и безопасность

### Фронтенд
- Минимальные изменения - только замена API слоя
- `window.electronAPI` теперь использует Tauri API под капотом
- Все React компоненты остались без изменений
- WebView функциональность сохранена

## Установка зависимостей

### 1. Установите Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Установите системные зависимости

#### Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

#### Linux (Fedora)
```bash
sudo dnf install webkit2gtk4.0-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel
```

#### macOS
```bash
xcode-select --install
```

#### Windows
Установите [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### 3. Установите Node.js зависимости
```bash
npm install
```

## Запуск

### Режим разработки
```bash
npm run dev
```

### Сборка production
```bash
npm run build
```

Готовые бинарники будут в папке `src-tauri/target/release/bundle/`

## Основные преимущества Tauri

### Производительность
- **Размер приложения**: ~3-5 MB (vs ~150 MB в Electron)
- **Потребление памяти**: ~50-100 MB (vs ~300-500 MB в Electron)
- **Время запуска**: В 2-3 раза быстрее

### Безопасность
- Rust обеспечивает memory safety
- Меньше поверхность атаки
- Нет Node.js runtime в production

### Нативность
- Использует системный WebView (WebKit на Linux/macOS, WebView2 на Windows)
- Лучшая интеграция с ОС
- Меньше зависимостей

## Что работает так же

✅ Все функции браузера (вкладки, закладки, история)
✅ Workspaces
✅ Горячие клавиши
✅ Управление окном (minimize, maximize, fullscreen)
✅ Настройки и темы
✅ Загрузки
✅ Google OAuth
✅ Импорт из других браузеров
✅ Сохранение/восстановление сессий

## Известные ограничения

⚠️ **WebView вместо Chromium**: Tauri использует системный WebView, а не встроенный Chromium. Это означает:
- На Linux используется WebKit (как в Safari)
- На Windows используется Edge WebView2
- Некоторые Chrome-специфичные API могут не работать

⚠️ **AdBlock**: Простой блокировщик рекламы на уровне доменов (без EasyList)

⚠️ **DevTools**: Доступны через системный WebView, но могут отличаться от Chrome DevTools

## Миграция данных

Все данные (закладки, история, настройки) автоматически мигрируют при первом запуске.

Расположение данных:
- **Linux**: `~/.local/share/xolo-browser/`
- **macOS**: `~/Library/Application Support/xolo-browser/`
- **Windows**: `%APPDATA%\xolo-browser\`

## Отладка

### Rust логи
```bash
RUST_LOG=debug npm run dev
```

### Открыть DevTools
Нажмите `Ctrl+Shift+I` или `F12` в приложении

## Структура проекта

```
xolo-browser/
├── src-tauri/           # Rust бэкенд
│   ├── src/
│   │   ├── main.rs      # Точка входа
│   │   ├── commands.rs  # IPC команды
│   │   ├── storage.rs   # Хранилище данных
│   │   ├── oauth.rs     # OAuth логика
│   │   └── downloads.rs # Управление загрузками
│   ├── Cargo.toml       # Rust зависимости
│   └── tauri.conf.json  # Конфигурация Tauri
├── src/renderer/        # React фронтенд (без изменений)
│   ├── components/
│   ├── tauri-api.ts     # Адаптер API
│   └── ...
└── package.json         # Node.js зависимости
```

## Дальнейшие улучшения

- [ ] Полноценный AdBlock с EasyList
- [ ] Автообновления через Tauri updater
- [ ] Расширения браузера
- [ ] Синхронизация между устройствами
- [ ] Встроенный VPN

## Поддержка

Если возникли проблемы при миграции, создайте issue в репозитории.
