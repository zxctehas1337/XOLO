import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Tab, HistoryEntry, TabError } from '../types';
import './WebViewContainer.css';

interface WebViewContainerProps {
  tab: Tab;
  isActive: boolean;
  onUpdate: (updates: Partial<Tab>) => void;
  onAddHistory: (entry: Omit<HistoryEntry, 'id' | 'visitedAt'>) => void;
  webviewRef: (ref: HTMLWebViewElement | null) => void;
  onOpenInNewTab?: (url: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  linkUrl?: string;
  selectedText?: string;
}

const WebViewContainer: React.FC<WebViewContainerProps> = ({
  tab, isActive, onUpdate, onAddHistory, webviewRef, onOpenInNewTab
}) => {
  const ref = useRef<HTMLWebViewElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [findBar, setFindBar] = useState({ visible: false, query: '', matches: 0, current: 0 });

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleFind = useCallback((_query: string) => {
    // iframe не поддерживает findInPage API
    // Можно использовать window.find() через postMessage, но это ограничено
    setFindBar(prev => ({ ...prev, matches: 0, current: 0 }));
  }, []);

  const handleFindNext = useCallback(() => {
    // iframe не поддерживает findInPage API
  }, []);

  const handleFindPrev = useCallback(() => {
    // iframe не поддерживает findInPage API
  }, []);

  const closeFindBar = useCallback(() => {
    setFindBar({ visible: false, query: '', matches: 0, current: 0 });
  }, []);

  useEffect(() => {
    const iframe = ref.current as HTMLIFrameElement | null;
    if (!iframe) return;
    webviewRef(iframe as any);

    // iframe имеет ограниченный API по сравнению с Electron webview
    // Большинство событий недоступны из-за same-origin policy
    
    const handleLoad = () => {
      onUpdate({ isLoading: false });
      try {
        // Попытка получить URL (работает только для same-origin)
        const iframeUrl = iframe.contentWindow?.location.href;
        if (iframeUrl && iframeUrl !== 'about:blank') {
          const isSecure = iframeUrl.startsWith('https://');
          onUpdate({
            url: iframeUrl,
            isSecure,
            error: null,
          });
        }
      } catch (e) {
        // Cross-origin - не можем получить доступ к contentWindow
        // Это нормально для iframe с внешними сайтами
      }
    };

    const handleError = () => {
      const error: TabError = {
        code: -1,
        description: 'Не удалось загрузить страницу',
      };
      onUpdate({ error, isLoading: false });
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Устанавливаем начальное состояние загрузки
    onUpdate({ isLoading: true, error: null });

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [tab.url, onUpdate, onAddHistory, webviewRef, onOpenInNewTab]);

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
    // iframe не поддерживает прямой вызов copy()
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
      <iframe 
        ref={ref as any} 
        src={tab.url} 
        className="webview"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        allow="geolocation; microphone; camera; midi; encrypted-media; autoplay; clipboard-read; clipboard-write"
      />
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

export default WebViewContainer;
