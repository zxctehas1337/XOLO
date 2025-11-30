# Миграция с WebView на CEF

## Обзор изменений

Этот документ описывает изменения, необходимые для миграции с iframe/WebView на CEF.

## Что изменилось?

### Backend (Rust)

#### Новые файлы

1. **src-tauri/src/cef_wrapper.rs** - FFI биндинги к CEF
2. **src-tauri/src/cef_commands.rs** - Tauri команды для CEF

#### Изменения в существующих файлах

**src-tauri/src/main.rs:**
```rust
// Добавлены модули
mod cef_wrapper;
mod cef_commands;

// Добавлен CEF менеджер в состояние
let cef_manager = Arc::new(CefManager::new());
.manage(cef_manager.clone())

// Добавлены команды CEF
.invoke_handler(tauri::generate_handler![
    // ... существующие команды
    cef_commands::cef_initialize,
    cef_commands::cef_create_browser,
    // ... другие CEF команды
])
```

**src-tauri/Cargo.toml:**
```toml
[dependencies]
# Добавлена зависимость
libc = "0.2"
```

**src-tauri/build.rs:**
```rust
// Добавлена линковка CEF библиотек
println!("cargo:rustc-link-search=native={}/Release", cef_path.display());
println!("cargo:rustc-link-lib=dylib=cef");
```

### Frontend (TypeScript/React)

#### Новые файлы

1. **src/renderer/cef-api.ts** - TypeScript API для работы с CEF
2. **src/renderer/components/CefViewContainer.tsx** - React компонент для CEF

#### Изменения в существующих файлах

**src/renderer/App.tsx:**
```tsx
// Было
import WebViewContainer from './components/WebViewContainer';

// Стало
import CefViewContainer from './components/CefViewContainer';

// Использование
<CefViewContainer
  tab={tab}
  isActive={tab.id === activeTabId}
  onUpdate={(updates) => updateTab(tab.id, updates)}
  onAddHistory={addToHistory}
  webviewRef={(ref) => { if (ref) webviewRefs.current.set(tab.id, ref as any); }}
  onOpenInNewTab={createNewTab}
/>
```

## Пошаговая миграция

### Шаг 1: Подготовка CEF

```bash
# Убедитесь, что CEF библиотеки находятся в src-tauri/cef/
ls -la src-tauri/cef/

# Запустите скрипт настройки
./setup-cef.sh
```

### Шаг 2: Обновление зависимостей

```bash
# Установите новые зависимости
npm install

# Обновите Rust зависимости
cd src-tauri
cargo update
cd ..
```

### Шаг 3: Тестирование

```bash
# Запустите в режиме разработки
npm run dev

# Проверьте основные функции:
# 1. Создание новой вкладки
# 2. Навигация по URL
# 3. Кнопки назад/вперед
# 4. Перезагрузка страницы
# 5. Открытие Google сервисов
```

### Шаг 4: Сборка

```bash
# Соберите приложение
npm run build

# Проверьте, что CEF библиотеки включены в сборку
ls -la src-tauri/target/release/cef/
```

## API изменения

### Создание браузера

**Было (WebView):**
```tsx
<iframe src={url} />
```

**Стало (CEF):**
```tsx
useEffect(() => {
  CefAPI.createBrowser(tabId, url);
  return () => CefAPI.closeBrowser(tabId);
}, [tabId, url]);
```

### Навигация

**Было (WebView):**
```tsx
iframe.contentWindow.location.href = url;
```

**Стало (CEF):**
```tsx
await CefAPI.navigate(tabId, url);
```

### История

**Было (WebView):**
```tsx
iframe.contentWindow.history.back();
iframe.contentWindow.history.forward();
```

**Стало (CEF):**
```tsx
await CefAPI.goBack(tabId);
await CefAPI.goForward(tabId);
```

### Перезагрузка

**Было (WebView):**
```tsx
iframe.contentWindow.location.reload();
```

**Стало (CEF):**
```tsx
await CefAPI.reload(tabId);
```

### Масштаб

**Было (WebView):**
```tsx
iframe.style.transform = `scale(${zoom})`;
```

**Стало (CEF):**
```tsx
await CefAPI.setZoomLevel(tabId, zoom);
```

### Выполнение JavaScript

**Было (WebView):**
```tsx
iframe.contentWindow.eval(code);
```

**Стало (CEF):**
```tsx
await CefAPI.executeJavaScript(tabId, code);
```

## Обратная совместимость

Если вам нужно сохранить поддержку WebView:

```tsx
// Условный рендеринг
const USE_CEF = true; // Флаг для переключения

{USE_CEF ? (
  <CefViewContainer {...props} />
) : (
  <WebViewContainer {...props} />
)}
```

## Производительность

### Потребление памяти

| Компонент | WebView | CEF |
|-----------|---------|-----|
| Одна вкладка | ~50MB | ~100MB |
| 5 вкладок | ~200MB | ~400MB |
| 10 вкладок | ~350MB | ~700MB |

### Рекомендации

1. **Ленивая загрузка** - создавайте браузеры только для активных вкладок
2. **Заморозка** - закрывайте браузеры для неактивных вкладок
3. **Лимиты** - ограничьте количество одновременно активных браузеров

```tsx
const MAX_ACTIVE_BROWSERS = 5;

const shouldCreateBrowser = (tabId: string) => {
  const activeBrowsers = await CefAPI.getAllBrowsers();
  return activeBrowsers.length < MAX_ACTIVE_BROWSERS || isTabActive(tabId);
};
```

## Отладка

### Проверка инициализации CEF

```tsx
useEffect(() => {
  CefAPI.initialize()
    .then(() => console.log('CEF инициализирован'))
    .catch(err => console.error('Ошибка инициализации CEF:', err));
}, []);
```

### Логирование событий

```tsx
const createBrowserWithLogging = async (tabId: string, url: string) => {
  console.log(`[CEF] Создание браузера ${tabId} для ${url}`);
  
  try {
    await CefAPI.createBrowser(tabId, url);
    console.log(`[CEF] Браузер ${tabId} создан`);
  } catch (err) {
    console.error(`[CEF] Ошибка создания браузера ${tabId}:`, err);
    throw err;
  }
};
```

### Remote Debugging

CEF запускается с remote debugging на порту 9222:

```bash
# Откройте в Chrome
chrome://inspect

# Или напрямую
http://localhost:9222
```

## Частые проблемы

### CEF не инициализируется

**Причина:** Библиотеки CEF не найдены

**Решение:**
```bash
./setup-cef.sh
```

### Браузеры не создаются

**Причина:** CEF не инициализирован

**Решение:**
```tsx
await CefAPI.initialize();
await CefAPI.createBrowser(tabId, url);
```

### Утечки памяти

**Причина:** Браузеры не закрываются

**Решение:**
```tsx
useEffect(() => {
  CefAPI.createBrowser(tabId, url);
  
  return () => {
    // ВАЖНО: закрывать браузер при размонтировании
    CefAPI.closeBrowser(tabId);
  };
}, [tabId, url]);
```

### Страницы не отображаются

**Причина:** Offscreen rendering не настроен

**Решение:** Убедитесь, что в `cef_wrapper.rs`:
```rust
window_info.windowless_rendering_enabled = 1;
```

## Откат на WebView

Если возникли критические проблемы:

```bash
# Откатите изменения в App.tsx
git checkout HEAD -- src/renderer/App.tsx

# Удалите CEF файлы
rm src/renderer/cef-api.ts
rm src/renderer/components/CefViewContainer.tsx
rm src-tauri/src/cef_wrapper.rs
rm src-tauri/src/cef_commands.rs

# Восстановите main.rs
git checkout HEAD -- src-tauri/src/main.rs
```

## Дальнейшие шаги

После успешной миграции:

1. Протестируйте все функции браузера
2. Проверьте работу Google сервисов
3. Оптимизируйте потребление памяти
4. Добавьте дополнительные CEF функции
5. Обновите документацию

## Поддержка

Если у вас возникли проблемы:

1. Проверьте [FAQ](./FAQ_TAURI.md)
2. Изучите [примеры API](./CEF_API_EXAMPLES_RU.md)
3. Откройте issue на GitHub
4. Напишите в Telegram чат

---

**Удачной миграции! 🚀**
