import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tab, HistoryEntry, TabError } from '../types';
import { CefAPI } from '../cef-api';
import './WebViewContainer.css';

interface CefViewContainerProps {
  tab: Tab;
  isActive: boolean;
  onUpdate: (updates: Partial<Tab>) => void;
  onAddHistory: (entry: Omit<HistoryEntry, 'id' | 'visitedAt'>) => void;
  webviewRef: (ref: HTMLElement | null) => void;
  onOpenInNewTab?: (url: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  linkUrl?: string;
  selectedText?: string;
}

const CefViewContainer: React.FC<CefViewContainerProps> = ({
  tab, isActive, onUpdate, onAddHistory, webviewRef, onOpenInNewTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [findBar, setFindBar] = useState({ visible: false, query: '', matches: 0, current: 0 });
  const [browserCreated, setBrowserCreated] = useState(false);

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Создание CEF браузера
  useEffect(() => {
    if (browserCreated) return;

    const createBrowser = async () => {
      try {
        await CefAPI.createBrowser(tab.id, tab.url);
        setBrowserCreated(true);
        
        // Запускаем периодическую проверку статуса
        const interval = setInterval(async () => {
          try {
            const info = await CefAPI.getBrowser(tab.id);
            if (info) {
              onUpdate({
                title: info.title || tab.title,
                isLoading: info.is_loading,
                canGoBack: info.can_go_back,
                canGoForward: info.can_go_forward,
                isSecure: info.url.startsWith('https://'),
              });
              
              // Добавляем в историю при завершении загрузки
              if (!info.is_loading && info.url !== tab.url) {
                onAddHistory({
                  url: info.url,
                  title: info.title || info.url,
                  favicon: '',
                });
              }
            }
          } catch (err) {
            console.error('Failed to get browser info:', err);
          }
        }, 500);

        return () => clearInterval(interval);
      } catch (err) {
        console.error('Failed to create CEF browser:', err);
        const error: TabError = {
          code: -1,
          description: `Не удалось создать браузер: ${err}`,
        };
        onUpdate({ error, isLoading: false });
      }
    };

    createBrowser();
  }, [tab.id, tab.url, browserCreated, onUpdate, onAddHistory]);

  // Навигация при изменении URL
  useEffect(() => {
    if (!browserCreated) return;
    
    const navigate = async () => {
      try {
        await CefAPI.navigate(tab.id, tab.url);
      } catch (err) {
        console.error('Failed to navigate:', err);
      }
    };

    navigate();
  }, [tab.url, browserCreated, tab.id]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (browserCreated) {
        CefAPI.closeBrowser(tab.id).catch(console.error);
      }
    };
  }, [tab.id, browserCreated]);

  useEffect(() => {
    if (containerRef.current) {
      webviewRef(containerRef.current);
    }
  }, [webviewRef]);

  const handleFind = useCallback((_query: string) => {
    // TODO: Реализовать поиск через CEF API
    setFindBar(prev => ({ ...prev, matches: 0, current: 0 }));
  }, []);

  const handleFindNext = useCallback(() => {
    // TODO: Реализовать через CEF API
  }, []);

  const handleFindPrev = useCallback(() => {
    // TODO: Реализовать через CEF API
  }, []);

  const closeFindBar = useCallback(() => {
    setFindBar({ visible: false, query: '', matches: 0, current: 0 });
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const handleShortcut = (e: CustomEvent<string>) => {
      if (e.detail === 'find') setFindBar(prev => ({ ...prev, visible: true }));
      else if (e.detail === 'escape' && findBar.visible) closeFindBar();
    };
    window.addEventListener('webview-shortcut', handleShortcut as EventListener);
    return () => window.removeEventListener('webview-shortcut', handleShortcut as EventListener);
  }, [isActive, findBar.visible, closeFindBar]);

  const handleCopy = () => {
    document.execCommand('copy');
  };
  const handlePaste = () => {
    document.execCommand('paste');
  };
  const handleCut = () => {
    document.execCommand('cut');
  };
  const handleSelectAll = () => {
    document.execCommand('selectAll');
  };
  const handleOpenLink = () => contextMenu.linkUrl && onOpenInNewTab?.(contextMenu.linkUrl);
  const handleCopyLink = () => contextMenu.linkUrl && navigator.clipboard.writeText(contextMenu.linkUrl);

  if (tab.error) {
    return (
      <div className="webview-error">
        <div className="error-icon">⚠️</div>
        <h2>Не удалось загрузить страницу</h2>
        <p className="error-url">{tab.url}</p>
        <p className="error-description">{tab.error.description}</p>
        <p className="error-code">Код ошибки: {tab.error.code}</p>
        <button onClick={() => onUpdate({ error: null, url: tab.url })}>Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="webview-container">
      {tab.isLoading && <div className="loading-progress" />}
      {findBar.visible && (
        <div className="find-bar">
          <input
            type="text" placeholder="Найти на странице..." value={findBar.query}
            onChange={(e) => { setFindBar(prev => ({ ...prev, query: e.target.value })); handleFind(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.shiftKey ? handleFindPrev() : handleFindNext();
              else if (e.key === 'Escape') closeFindBar();
            }}
            autoFocus
          />
          <span className="find-count">{findBar.matches > 0 ? `${findBar.current}/${findBar.matches}` : 'Не найдено'}</span>
          <button onClick={handleFindPrev} title="Предыдущий">▲</button>
          <button onClick={handleFindNext} title="Следующий">▼</button>
          <button onClick={closeFindBar} title="Закрыть">✕</button>
        </div>
      )}
      <div 
        ref={containerRef}
        className="cef-view"
        style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          position: 'relative',
        }}
      >
        {!browserCreated && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div className="loading-spinner" />
            <p>Инициализация браузера...</p>
          </div>
        )}
      </div>
      {contextMenu.visible && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.linkUrl && (<><button onClick={handleOpenLink}>Открыть в новой вкладке</button><button onClick={handleCopyLink}>Копировать ссылку</button><div className="context-menu-divider" /></>)}
          {contextMenu.selectedText && (<><button onClick={handleCopy}>Копировать</button><button onClick={handleCut}>Вырезать</button></>)}
          <button onClick={handlePaste}>Вставить</button>
          <button onClick={handleSelectAll}>Выделить всё</button>
        </div>
      )}
    </div>
  );
};

export default CefViewContainer;
