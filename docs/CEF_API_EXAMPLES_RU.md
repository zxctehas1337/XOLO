# Примеры использования CEF API

## Базовое использование

### Создание браузера

```typescript
import { CefAPI } from '../cef-api';

// Создать новый браузер
await CefAPI.createBrowser('tab-123', 'https://google.com');
```

### Навигация

```typescript
// Перейти на другой URL
await CefAPI.navigate('tab-123', 'https://github.com');

// Назад
await CefAPI.goBack('tab-123');

// Вперед
await CefAPI.goForward('tab-123');

// Перезагрузить
await CefAPI.reload('tab-123');

// Остановить загрузку
await CefAPI.stop('tab-123');
```

### Получение информации о браузере

```typescript
// Получить информацию о конкретном браузере
const info = await CefAPI.getBrowser('tab-123');
console.log(info);
// {
//   id: 'tab-123',
//   url: 'https://google.com',
//   title: 'Google',
//   is_loading: false,
//   can_go_back: true,
//   can_go_forward: false
// }

// Получить все браузеры
const allBrowsers = await CefAPI.getAllBrowsers();
```

### Закрытие браузера

```typescript
// Закрыть браузер и освободить ресурсы
await CefAPI.closeBrowser('tab-123');
```

## React компонент

### Базовый пример

```tsx
import React, { useEffect, useState } from 'react';
import { CefAPI, CefBrowserInfo } from '../cef-api';

const MyBrowser: React.FC = () => {
  const [browserId] = useState('my-browser-' + Date.now());
  const [info, setInfo] = useState<CefBrowserInfo | null>(null);

  useEffect(() => {
    // Создаем браузер при монтировании
    CefAPI.createBrowser(browserId, 'https://google.com');

    // Периодически обновляем информацию
    const interval = setInterval(async () => {
      const browserInfo = await CefAPI.getBrowser(browserId);
      setInfo(browserInfo);
    }, 500);

    // Очистка при размонтировании
    return () => {
      clearInterval(interval);
      CefAPI.closeBrowser(browserId);
    };
  }, [browserId]);

  return (
    <div>
      <h1>{info?.title || 'Загрузка...'}</h1>
      <p>URL: {info?.url}</p>
      <p>Загрузка: {info?.is_loading ? 'Да' : 'Нет'}</p>
      
      <button 
        onClick={() => CefAPI.goBack(browserId)}
        disabled={!info?.can_go_back}
      >
        Назад
      </button>
      
      <button 
        onClick={() => CefAPI.goForward(browserId)}
        disabled={!info?.can_go_forward}
      >
        Вперед
      </button>
      
      <button onClick={() => CefAPI.reload(browserId)}>
        Перезагрузить
      </button>
    </div>
  );
};
```

### Продвинутый пример с управлением

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { CefAPI, CefBrowserInfo } from '../cef-api';

interface BrowserTabProps {
  tabId: string;
  initialUrl: string;
  onClose: () => void;
}

const BrowserTab: React.FC<BrowserTabProps> = ({ tabId, initialUrl, onClose }) => {
  const [info, setInfo] = useState<CefBrowserInfo | null>(null);
  const [urlInput, setUrlInput] = useState(initialUrl);

  useEffect(() => {
    CefAPI.createBrowser(tabId, initialUrl);

    const interval = setInterval(async () => {
      const browserInfo = await CefAPI.getBrowser(tabId);
      if (browserInfo) {
        setInfo(browserInfo);
        setUrlInput(browserInfo.url);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      CefAPI.closeBrowser(tabId);
    };
  }, [tabId, initialUrl]);

  const handleNavigate = useCallback(() => {
    CefAPI.navigate(tabId, urlInput);
  }, [tabId, urlInput]);

  const handleZoomIn = useCallback(() => {
    CefAPI.getZoomLevel(tabId).then(level => {
      CefAPI.setZoomLevel(tabId, level + 0.1);
    });
  }, [tabId]);

  const handleZoomOut = useCallback(() => {
    CefAPI.getZoomLevel(tabId).then(level => {
      CefAPI.setZoomLevel(tabId, Math.max(0.25, level - 0.1));
    });
  }, [tabId]);

  const handleExecuteJS = useCallback(() => {
    const code = prompt('Введите JavaScript код:');
    if (code) {
      CefAPI.executeJavaScript(tabId, code);
    }
  }, [tabId]);

  return (
    <div className="browser-tab">
      <div className="toolbar">
        <button onClick={() => CefAPI.goBack(tabId)} disabled={!info?.can_go_back}>
          ←
        </button>
        <button onClick={() => CefAPI.goForward(tabId)} disabled={!info?.can_go_forward}>
          →
        </button>
        <button onClick={() => CefAPI.reload(tabId)}>
          ⟳
        </button>
        <button onClick={() => CefAPI.stop(tabId)} disabled={!info?.is_loading}>
          ✕
        </button>
        
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
          style={{ flex: 1, margin: '0 10px' }}
        />
        
        <button onClick={handleNavigate}>Go</button>
        <button onClick={handleZoomOut}>-</button>
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleExecuteJS}>JS</button>
        <button onClick={onClose}>✕</button>
      </div>
      
      <div className="status-bar">
        <span>{info?.title || 'Загрузка...'}</span>
        {info?.is_loading && <span className="loading-spinner">⟳</span>}
      </div>
      
      <div className="browser-view" style={{ flex: 1 }}>
        {/* CEF рендерит здесь */}
      </div>
    </div>
  );
};
```

## Управление масштабом

```typescript
// Увеличить масштаб
const currentZoom = await CefAPI.getZoomLevel('tab-123');
await CefAPI.setZoomLevel('tab-123', currentZoom + 0.1);

// Уменьшить масштаб
const currentZoom = await CefAPI.getZoomLevel('tab-123');
await CefAPI.setZoomLevel('tab-123', currentZoom - 0.1);

// Сбросить масштаб
await CefAPI.setZoomLevel('tab-123', 1.0);
```

## Выполнение JavaScript

```typescript
// Простой пример
await CefAPI.executeJavaScript('tab-123', 'alert("Hello from CEF!")');

// Изменение DOM
await CefAPI.executeJavaScript('tab-123', `
  document.body.style.backgroundColor = 'lightblue';
`);

// Получение данных (требует callback механизм)
await CefAPI.executeJavaScript('tab-123', `
  console.log('Current URL:', window.location.href);
  console.log('Title:', document.title);
`);
```

## Обработка событий

```typescript
// Отслеживание загрузки
const checkLoading = async () => {
  const info = await CefAPI.getBrowser('tab-123');
  if (info?.is_loading) {
    console.log('Страница загружается...');
  } else {
    console.log('Загрузка завершена!');
  }
};

// Отслеживание изменения URL
let lastUrl = '';
const checkUrlChange = async () => {
  const info = await CefAPI.getBrowser('tab-123');
  if (info && info.url !== lastUrl) {
    console.log('URL изменился:', lastUrl, '->', info.url);
    lastUrl = info.url;
  }
};
```

## Множественные вкладки

```typescript
// Создать несколько вкладок
const tabs = [
  { id: 'tab-1', url: 'https://google.com' },
  { id: 'tab-2', url: 'https://github.com' },
  { id: 'tab-3', url: 'https://stackoverflow.com' },
];

// Создать все вкладки
await Promise.all(
  tabs.map(tab => CefAPI.createBrowser(tab.id, tab.url))
);

// Получить информацию о всех вкладках
const allBrowsers = await CefAPI.getAllBrowsers();
console.log('Всего вкладок:', allBrowsers.length);

// Закрыть все вкладки
await Promise.all(
  tabs.map(tab => CefAPI.closeBrowser(tab.id))
);
```

## Обработка ошибок

```typescript
try {
  await CefAPI.createBrowser('tab-123', 'https://example.com');
} catch (error) {
  console.error('Не удалось создать браузер:', error);
  // Показать сообщение пользователю
}

try {
  await CefAPI.navigate('tab-123', 'invalid-url');
} catch (error) {
  console.error('Неверный URL:', error);
}
```

## Оптимизация производительности

```typescript
// Ленивая загрузка вкладок
const createTabLazy = async (tabId: string, url: string) => {
  // Создаем браузер только когда вкладка становится активной
  if (isTabActive(tabId)) {
    await CefAPI.createBrowser(tabId, url);
  }
};

// Заморозка неактивных вкладок
const freezeInactiveTabs = async () => {
  const allBrowsers = await CefAPI.getAllBrowsers();
  
  for (const browser of allBrowsers) {
    if (!isTabActive(browser.id)) {
      // Закрываем браузер для экономии памяти
      await CefAPI.closeBrowser(browser.id);
    }
  }
};

// Размораживание при активации
const unfreezeTab = async (tabId: string, url: string) => {
  const browser = await CefAPI.getBrowser(tabId);
  
  if (!browser) {
    // Браузер был заморожен, создаем заново
    await CefAPI.createBrowser(tabId, url);
  }
};
```

## Интеграция с React Context

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CefAPI, CefBrowserInfo } from '../cef-api';

interface CefContextType {
  browsers: Map<string, CefBrowserInfo>;
  createBrowser: (id: string, url: string) => Promise<void>;
  closeBrowser: (id: string) => Promise<void>;
  navigate: (id: string, url: string) => Promise<void>;
}

const CefContext = createContext<CefContextType | null>(null);

export const CefProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [browsers, setBrowsers] = useState(new Map<string, CefBrowserInfo>());

  const createBrowser = useCallback(async (id: string, url: string) => {
    await CefAPI.createBrowser(id, url);
    // Обновляем состояние
    const info = await CefAPI.getBrowser(id);
    if (info) {
      setBrowsers(prev => new Map(prev).set(id, info));
    }
  }, []);

  const closeBrowser = useCallback(async (id: string) => {
    await CefAPI.closeBrowser(id);
    setBrowsers(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const navigate = useCallback(async (id: string, url: string) => {
    await CefAPI.navigate(id, url);
  }, []);

  return (
    <CefContext.Provider value={{ browsers, createBrowser, closeBrowser, navigate }}>
      {children}
    </CefContext.Provider>
  );
};

export const useCef = () => {
  const context = useContext(CefContext);
  if (!context) throw new Error('useCef must be used within CefProvider');
  return context;
};
```

## Полезные паттерны

### Автоматическое обновление информации

```typescript
const useBrowserInfo = (tabId: string) => {
  const [info, setInfo] = useState<CefBrowserInfo | null>(null);

  useEffect(() => {
    const updateInfo = async () => {
      const browserInfo = await CefAPI.getBrowser(tabId);
      setInfo(browserInfo);
    };

    updateInfo();
    const interval = setInterval(updateInfo, 500);

    return () => clearInterval(interval);
  }, [tabId]);

  return info;
};
```

### Кэширование состояния

```typescript
const browserCache = new Map<string, CefBrowserInfo>();

const getCachedBrowserInfo = async (tabId: string): Promise<CefBrowserInfo | null> => {
  // Проверяем кэш
  if (browserCache.has(tabId)) {
    return browserCache.get(tabId)!;
  }

  // Получаем из CEF
  const info = await CefAPI.getBrowser(tabId);
  if (info) {
    browserCache.set(tabId, info);
  }

  return info;
};
```

---

Эти примеры помогут вам быстро начать работу с CEF API в XOLO Browser!
