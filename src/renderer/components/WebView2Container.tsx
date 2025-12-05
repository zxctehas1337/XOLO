import React, { useEffect, useRef, useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Tab, HistoryEntry } from '../types';
import './WebViewContainer.css';

interface WebView2ContainerProps {
  tab: Tab;
  isActive: boolean;
  onUpdate: (updates: Partial<Tab>) => void;
  onAddHistory: (entry: Omit<HistoryEntry, 'id' | 'visitedAt'>) => void;
  webviewRef: (ref: HTMLDivElement | null) => void;
  onOpenInNewTab?: (url: string) => void;
}

interface WebViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Глобальный кэш созданных WebView - сохраняется между ремаунтами компонента
const createdWebViews = new Set<string>();

// Функция для удаления WebView из кэша при закрытии вкладки
export const removeWebViewFromCache = (tabId: string) => {
  createdWebViews.delete(tabId);
};

// Кэш для favicon - избегаем повторных запросов
const faviconCache = new Map<string, string>();

// Получение favicon с кэшированием
const getFaviconUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    if (faviconCache.has(hostname)) {
      return faviconCache.get(hostname)!;
    }
    // Используем Google S2 для быстрого получения favicon
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    faviconCache.set(hostname, faviconUrl);
    return faviconUrl;
  } catch {
    return '';
  }
};

/**
 * WebView2Container - компонент для отображения веб-контента
 * Использует нативные WebView через Tauri для обхода ограничений iframe
 * Оптимизирован для быстрой загрузки и совместимости с Google
 */
const WebView2Container: React.FC<WebView2ContainerProps> = ({
  tab, isActive, onUpdate, onAddHistory, webviewRef, onOpenInNewTab: _onOpenInNewTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const webviewCreatedRef = useRef(false);
  const lastUrlRef = useRef<string>('');
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const boundsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const createTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Оптимизированное обновление bounds с debounce
  const updateBoundsDebounced = useCallback((bounds: WebViewBounds) => {
    if (boundsUpdateTimeoutRef.current) {
      clearTimeout(boundsUpdateTimeoutRef.current);
    }
    boundsUpdateTimeoutRef.current = setTimeout(() => {
      if (webviewCreatedRef.current) {
        invoke('update_webview_bounds', { id: tab.id, bounds }).catch(console.error);
      }
    }, 16); // ~60fps
  }, [tab.id]);

  // Создание WebView при монтировании - оптимизировано для быстрой загрузки
  useEffect(() => {
    if (!tab.url || isCreating) return;

    const createOrRestoreWebView = async () => {
      // Проверяем, существует ли уже WebView (глобальный кэш)
      const alreadyCreated = createdWebViews.has(tab.id);
      
      if (alreadyCreated) {
        // WebView уже существует - просто восстанавливаем состояние
        webviewCreatedRef.current = true;
        lastUrlRef.current = tab.url;
        
        // Обновляем bounds и показываем если активен
        const container = containerRef.current;
        if (container && isActive) {
          const rect = container.getBoundingClientRect();
          const bounds: WebViewBounds = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
          await invoke('update_webview_bounds', { id: tab.id, bounds });
          await invoke('set_webview_visible', { id: tab.id, visible: true });
        }
        return;
      }

      // Дополнительная проверка через бэкенд
      try {
        const exists = await invoke<boolean>('webview_exists', { id: tab.id });
        if (exists) {
          createdWebViews.add(tab.id);
          webviewCreatedRef.current = true;
          lastUrlRef.current = tab.url;
          
          const container = containerRef.current;
          if (container && isActive) {
            const rect = container.getBoundingClientRect();
            const bounds: WebViewBounds = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            };
            await invoke('update_webview_bounds', { id: tab.id, bounds });
            await invoke('set_webview_visible', { id: tab.id, visible: true });
          }
          return;
        }
      } catch (e) {
        console.warn('Failed to check webview existence:', e);
      }

      // WebView не существует - создаём новый
      setIsCreating(true);
      
      try {
        const container = containerRef.current;
        if (!container) {
          setIsCreating(false);
          return;
        }

        const rect = container.getBoundingClientRect();
        const bounds: WebViewBounds = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };

        // Показываем индикатор загрузки сразу
        onUpdate({ isLoading: true, canGoBack: false, canGoForward: false });

        // Создаём WebView асинхронно
        await invoke('create_webview', {
          id: tab.id,
          url: tab.url,
          bounds,
        });

        createdWebViews.add(tab.id);
        webviewCreatedRef.current = true;
        lastUrlRef.current = tab.url;
        
        // Быстро скрываем индикатор - WebView загружается параллельно
        createTimeoutRef.current = setTimeout(() => {
          onUpdate({ isLoading: false, canGoBack: false });
        }, 50);

        // Добавляем в историю с кэшированным favicon
        onAddHistory({
          url: tab.url,
          title: tab.title || tab.url,
          favicon: getFaviconUrl(tab.url),
        });
      } catch (error) {
        console.error('Failed to create webview:', error);
        onUpdate({ isLoading: false });
      } finally {
        setIsCreating(false);
      }
    };

    // Запускаем создание/восстановление немедленно
    createOrRestoreWebView();

    return () => {
      // Очищаем timeouts при размонтировании
      if (boundsUpdateTimeoutRef.current) {
        clearTimeout(boundsUpdateTimeoutRef.current);
      }
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
      }
      // НЕ закрываем WebView при размонтировании - он будет переиспользован
      // WebView закрывается только при закрытии вкладки через closeTab
    };
  }, [tab.id, tab.url, isActive]);

  // Навигация при изменении URL - оптимизировано
  useEffect(() => {
    if (!webviewCreatedRef.current || !tab.url || tab.url === lastUrlRef.current) return;

    const navigate = async () => {
      try {
        // Показываем загрузку и обновляем canGoBack
        onUpdate({ isLoading: true, canGoBack: true });
        
        // Запускаем навигацию
        await invoke('navigate_webview', { id: tab.id, url: tab.url });
        lastUrlRef.current = tab.url;
        
        // Быстро скрываем индикатор - страница загружается параллельно
        setTimeout(() => {
          onUpdate({ isLoading: false });
        }, 30);

        // Добавляем в историю с кэшированным favicon
        onAddHistory({
          url: tab.url,
          title: tab.title || tab.url,
          favicon: getFaviconUrl(tab.url),
        });
      } catch (error) {
        console.error('Navigation failed:', error);
        onUpdate({ isLoading: false });
      }
    };

    navigate();
  }, [tab.url]);

  // Показываем/скрываем WebView в зависимости от активности
  useEffect(() => {
    if (!webviewCreatedRef.current && !createdWebViews.has(tab.id)) return;

    const updateVisibility = async () => {
      if (isActive) {
        // Сначала обновляем bounds, потом показываем
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const bounds: WebViewBounds = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
          await invoke('update_webview_bounds', { id: tab.id, bounds });
        }
      }
      await invoke('set_webview_visible', { id: tab.id, visible: isActive });
    };

    updateVisibility().catch(console.error);
  }, [isActive, tab.id]);

  // Обновляем размеры WebView при изменении контейнера (с debounce для производительности)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateBounds = () => {
      if (!webviewCreatedRef.current) return;

      const rect = container.getBoundingClientRect();
      const bounds: WebViewBounds = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };

      updateBoundsDebounced(bounds);
    };

    resizeObserverRef.current = new ResizeObserver(updateBounds);
    resizeObserverRef.current.observe(container);

    // Также обновляем при скролле окна
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);

    return () => {
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [tab.id, updateBoundsDebounced]);

  // Передаём ref контейнера
  useEffect(() => {
    webviewRef(containerRef.current);
  }, [webviewRef]);

  // Ошибки не показываем - просто рендерим контейнер
  // WebView сам обработает ошибки загрузки

  return (
    <div className="webview-container" ref={containerRef}>
      {tab.isLoading && <div className="loading-progress" />}
      {/* Нативный WebView отображается поверх этого контейнера */}
      <div className="webview-placeholder">
        {!webviewCreatedRef.current && (
          <div className="webview-loading">Загрузка...</div>
        )}
      </div>
    </div>
  );
};

export default WebView2Container;
