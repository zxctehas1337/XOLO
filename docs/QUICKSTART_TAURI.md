# Быстрый старт с Tauri

## 1. Установка Rust (если еще не установлен)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

## 2. Установка системных зависимостей (Linux)

### Debian/Ubuntu:
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### Fedora:
```bash
sudo dnf install webkit2gtk4.0-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel
```

## 3. Установка Node.js зависимостей

```bash
npm install
```

## 4. Запуск в режиме разработки

```bash
npm run dev
```

## 5. Сборка production

```bash
npm run build
```

Готовое приложение будет в `src-tauri/target/release/bundle/`

## Что изменилось?

- ✅ Бэкенд переписан с Node.js на Rust
- ✅ Размер приложения уменьшен с ~150MB до ~5MB
- ✅ Потребление памяти снижено в 3-5 раз
- ✅ Фронтенд остался без изменений
- ✅ Все функции работают как раньше

## Возможные проблемы

### Ошибка "webkit2gtk not found"
Установите webkit2gtk-4.0-dev (см. шаг 2)

### Ошибка "cargo not found"
Перезапустите терминал после установки Rust или выполните:
```bash
source $HOME/.cargo/env
```

### Ошибка при сборке Rust
Обновите Rust:
```bash
rustup update
```

## Дополнительная информация

Полная документация по миграции: [MIGRATION_TAURI.md](./MIGRATION_TAURI.md)
