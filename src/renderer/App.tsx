import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Tab, Settings, Bookmark, HistoryEntry, Workspace, defaultSettings } from './types';
import TitleBar from './components/TitleBar';
import AddressBar from './components/AddressBar';
import CefViewContainer from './components/CefViewContainer';
import StartPage from './components/StartPage';
import ZenSidebar from './components/ZenSidebar';
import NewTabModal from './components/NewTabModal';
import ImportDialog from './components/ImportDialog';
import TabSearch from './components/TabSearch';
import HistoryPage from './components/HistoryPage';
import DownloadsPage from './components/DownloadsPage';
import SettingsPage from './components/SettingsPage';
import { Toast } from './components/Toast';
import './styles/App.css';

// Внутренние URL браузера
const INTERNAL_URLS = {
  history: 'xolo://history',
  downloads: 'xolo://downloads',
  settings: 'xolo://settings',
};

// Константы для управления памятью
const TAB_FREEZE_TIMEOUT = 5 * 60 * 1000; // 5 минут неактивности для заморозки
const MAX_ACTIVE_TABS = 5; // Максимум активных (не замороженных) вкладок

const App: React.FC = () => {
  console.log('App component rendering...');
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const webviewRefs = useRef<Map<string, HTMLWebViewElement>>(new Map());
  const activeTabIdRef = useRef<string>('');

  const [loadError, setLoadError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTabSearch, setShowTabSearch] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoadError(null);
      const [savedSettings, savedBookmarks, savedHistory] = await Promise.all([
        window.electronAPI.getSettings().catch(() => null),
        window.electronAPI.getBookmarks().catch(() => []),
        window.electronAPI.getHistory().catch(() => []),
      ]);
      if (savedSettings && Object.keys(savedSettings).length) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
      if (savedBookmarks) setBookmarks(savedBookmarks);
      if (savedHistory) setHistory(savedHistory);
    } catch (e) {
      console.error('Failed to load data:', e);
      setLoadError('Не удалось загрузить данные. Некоторые настройки могут быть сброшены.');
    }
  }, []);

  const createWorkspace = useCallback((options?: { name?: string; icon?: string; color?: string; initialUrl?: string }) => {
    const workspaceId = uuidv4();
    const initialTab: Tab = {
      id: uuidv4(),
      url: options?.initialUrl || '',
      title: 'Новая вкладка',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      zoomLevel: 1,
    };

    setWorkspaces(prev => {
      const workspace: Workspace = {
        id: workspaceId,
        name: options?.name ?? (prev.length === 0 ? 'Default' : `Workspace ${prev.length + 1}`),
        icon: options?.icon,
        color: options?.color,
        activeTabId: initialTab.id,
        tabs: [initialTab],
      };
      return [...prev, workspace];
    });
    setActiveWorkspaceId(workspaceId);
  }, []);

  const deleteWorkspace = useCallback((workspaceId: string) => {
    if (workspaces.length <= 1) return;
    setWorkspaces(prev => {
      const newWorkspaces = prev.filter(ws => ws.id !== workspaceId);
      if (workspaceId === activeWorkspaceId) {
        const newActiveWorkspace = newWorkspaces[0];
        if (newActiveWorkspace) setActiveWorkspaceId(newActiveWorkspace.id);
      }
      return newWorkspaces;
    });
  }, [workspaces.length, activeWorkspaceId]);

  const renameWorkspace = useCallback((workspaceId: string, newName: string) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId ? { ...ws, name: newName } : ws
    ));
  }, []);

  const updateWorkspaceIcon = useCallback((workspaceId: string, icon: string) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId ? { ...ws, icon } : ws
    ));
  }, []);

  const createNewTab = useCallback((urlOrQuery?: string) => {
    let finalUrl = '';
    if (urlOrQuery) {
      let s = urlOrQuery.trim();
      // Проверяем внутренние URL браузера
      if (s.startsWith('xolo://')) {
        finalUrl = s;
      } else if (!/^https?:\/\//i.test(s)) {
        if (s.includes('.') && !s.includes(' ')) {
          s = 'https://' + s;
        } else {
          const engines = { google: 'https://www.google.com/search?q=', duckduckgo: 'https://duckduckgo.com/?q=', bing: 'https://www.bing.com/search?q='} as const;
          s = engines[settings.searchEngine] + encodeURIComponent(s);
        }
        finalUrl = s;
      } else {
        finalUrl = s;
      }
    }

    if (!activeWorkspaceId) {
      createWorkspace({ initialUrl: finalUrl || undefined });
      return;
    }

    const newTab: Tab = {
      id: uuidv4(), url: finalUrl, title: 'Новая вкладка',
      isLoading: Boolean(finalUrl), canGoBack: false, canGoForward: false, zoomLevel: 1,
    };

    setWorkspaces(prev => prev.map(ws =>
      ws.id === activeWorkspaceId ? { ...ws, tabs: [...ws.tabs, newTab], activeTabId: newTab.id } : ws
    ));
  }, [activeWorkspaceId, createWorkspace, settings.searchEngine]);

  const closeTab = useCallback((tabId: string) => {
    // Сохраняем закрытую вкладку для восстановления
    const allTabs = workspaces.flatMap(ws => ws.tabs);
    const closedTab = allTabs.find(t => t.id === tabId);
    if (closedTab && closedTab.url) {
      setClosedTabs(prev => [closedTab, ...prev.slice(0, 9)]); // Храним до 10 закрытых вкладок
    }

    // Удаляем webview ref для предотвращения утечки памяти
    webviewRefs.current.delete(tabId);

    setWorkspaces(prev => prev.map(ws => {
      if (!ws.tabs.some(t => t.id === tabId)) return ws;
      const remaining = ws.tabs.filter(t => t.id !== tabId);
      if (remaining.length === 0) {
        const newTab: Tab = { id: uuidv4(), url: '', title: 'Новая вкладка', isLoading: false, canGoBack: false, canGoForward: false, zoomLevel: 1 };
        return { ...ws, tabs: [newTab], activeTabId: newTab.id };
      }
      let nextActiveId = ws.activeTabId;
      if (ws.activeTabId === tabId) {
        const idx = ws.tabs.findIndex(t => t.id === tabId);
        const newIndex = Math.min(idx, remaining.length - 1);
        nextActiveId = remaining[newIndex].id;
      }
      return { ...ws, tabs: remaining, activeTabId: nextActiveId };
    }));
  }, [workspaces]);

  // Восстановление закрытой вкладки
  const restoreClosedTab = useCallback(() => {
    if (closedTabs.length === 0) return;
    const [tabToRestore, ...remaining] = closedTabs;
    setClosedTabs(remaining);
    createNewTab(tabToRestore.url);
  }, [closedTabs, createNewTab]);

  // Заморозка неактивных вкладок для экономии памяти
  const freezeTab = useCallback((tabId: string) => {
    window.electronAPI.freezeTab(tabId);
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      tabs: ws.tabs.map(t => t.id === tabId ? { ...t, isFrozen: true } : t)
    })));
  }, []);

  const unfreezeTab = useCallback((tabId: string) => {
    window.electronAPI.unfreezeTab(tabId);
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      tabs: ws.tabs.map(t => t.id === tabId ? { ...t, isFrozen: false, lastActiveAt: Date.now() } : t)
    })));
  }, []);

  const setActiveTabInWorkspace = useCallback((tabId: string) => {
    if (!activeWorkspaceId) return;
    
    // Размораживаем вкладку при активации
    const workspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const tab = workspace?.tabs.find(t => t.id === tabId);
    if (tab?.isFrozen) {
      unfreezeTab(tabId);
    }
    
    // Обновляем время активности
    setWorkspaces(prev => prev.map(ws => 
      ws.id === activeWorkspaceId 
        ? { 
            ...ws, 
            activeTabId: tabId,
            tabs: ws.tabs.map(t => t.id === tabId ? { ...t, lastActiveAt: Date.now() } : t)
          } 
        : ws
    ));
  }, [activeWorkspaceId, workspaces, unfreezeTab]);

  // Переключение на вкладку из любого workspace (для поиска по вкладкам)
  const selectTabFromSearch = useCallback((workspaceId: string, tabId: string) => {
    // Сначала переключаем workspace если нужно
    if (workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
    
    // Размораживаем вкладку если нужно
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    const tab = workspace?.tabs.find(t => t.id === tabId);
    if (tab?.isFrozen) {
      unfreezeTab(tabId);
    }
    
    // Активируем вкладку
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId 
        ? { 
            ...ws, 
            activeTabId: tabId,
            tabs: ws.tabs.map(t => t.id === tabId ? { ...t, lastActiveAt: Date.now() } : t)
          } 
        : ws
    ));
  }, [activeWorkspaceId, workspaces, unfreezeTab]);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setWorkspaces(prev => prev.map(ws => ({
      ...ws, tabs: ws.tabs.map(t => (t.id === tabId ? { ...t, ...updates } : t)),
    })));
  }, []);

  const navigate = useCallback((url: string) => {
    const currentActiveId = activeTabIdRef.current;
    let finalUrl = url.trim();
    if (!finalUrl || !currentActiveId) return;

    // Проверяем внутренние URL браузера
    if (finalUrl.startsWith('xolo://')) {
      updateTab(currentActiveId, { url: finalUrl, isLoading: false, title: getInternalPageTitle(finalUrl) });
      return;
    }

    if (!finalUrl.match(/^https?:\/\//i)) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        const engines = { google: 'https://www.google.com/search?q=', duckduckgo: 'https://duckduckgo.com/?q=', bing: 'https://www.bing.com/search?q='} as const;
        finalUrl = engines[settings.searchEngine] + encodeURIComponent(finalUrl);
      }
    }
    updateTab(currentActiveId, { url: finalUrl, isLoading: true });
  }, [settings.searchEngine, updateTab]);

  // Получение заголовка для внутренних страниц
  const getInternalPageTitle = (url: string): string => {
    switch (url) {
      case INTERNAL_URLS.history: return 'История';
      case INTERNAL_URLS.downloads: return 'Загрузки';
      case INTERNAL_URLS.settings: return 'Настройки';
      default: return 'XOLO';
    }
  };

  // Открытие внутренних страниц с toggle функциональностью
  const openInternalPage = useCallback((page: 'history' | 'downloads' | 'settings') => {
    const url = INTERNAL_URLS[page];
    const title = getInternalPageTitle(url);
    
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id !== activeWorkspaceId) return ws;
      
      // Проверяем, есть ли уже открытая вкладка с этой страницей
      const existingTab = ws.tabs.find(t => t.url === url);
      
      // Если вкладка уже открыта и активна - закрываем её (toggle)
      if (existingTab && ws.activeTabId === existingTab.id) {
        const remaining = ws.tabs.filter(t => t.id !== existingTab.id);
        
        // Если это была последняя вкладка, создаем новую пустую
        if (remaining.length === 0) {
          const newTab: Tab = {
            id: uuidv4(),
            url: '',
            title: 'Новая вкладка',
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            zoomLevel: 1,
          };
          return { ...ws, tabs: [newTab], activeTabId: newTab.id };
        }
        
        // Переключаемся на предыдущую вкладку
        const idx = ws.tabs.findIndex(t => t.id === existingTab.id);
        const newIndex = Math.min(idx, remaining.length - 1);
        return { ...ws, tabs: remaining, activeTabId: remaining[newIndex].id };
      }
      
      // Если вкладка существует но не активна - активируем её
      if (existingTab) {
        return { ...ws, activeTabId: existingTab.id };
      }
      
      // Создаем новую вкладку с внутренней страницей
      const newTab: Tab = {
        id: uuidv4(),
        url,
        title,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        zoomLevel: 1,
      };
      
      return { ...ws, tabs: [...ws.tabs, newTab], activeTabId: newTab.id };
    }));
  }, [activeWorkspaceId]);

  // iframe не поддерживает goBack/goForward/reload API
  // Нужно управлять историей вручную или использовать другой подход
  const goBack = () => {
    const iframe = webviewRefs.current.get(activeTabIdRef.current) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.history.back();
      } catch (e) {
        console.warn('Cannot go back in iframe:', e);
      }
    }
  };
  
  const goForward = () => {
    const iframe = webviewRefs.current.get(activeTabIdRef.current) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.history.forward();
      } catch (e) {
        console.warn('Cannot go forward in iframe:', e);
      }
    }
  };
  
  const reloadTab = () => {
    const tabId = activeTabIdRef.current;
    const tab = workspaces.find(ws => ws.id === activeWorkspaceId)?.tabs.find(t => t.id === tabId);
    if (tab) {
      // Перезагружаем через изменение URL
      updateTab(tabId, { url: tab.url, isLoading: true });
    }
  };
  
  const stopLoading = () => {
    const iframe = webviewRefs.current.get(activeTabIdRef.current) as HTMLIFrameElement;
    if (iframe) {
      try {
        iframe.contentWindow?.stop();
      } catch (e) {
        console.warn('Cannot stop loading in iframe:', e);
      }
    }
  };
  
  const goHome = () => activeTabIdRef.current && updateTab(activeTabIdRef.current, { url: '' });

  // Zoom functions - iframe не поддерживает zoom API напрямую
  // Можно использовать CSS transform: scale() как альтернативу
  const zoomIn = useCallback(() => {
    const tabId = activeTabIdRef.current;
    const iframe = webviewRefs.current.get(tabId) as HTMLIFrameElement;
    const workspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const tab = workspace?.tabs.find(t => t.id === tabId);
    if (iframe && tab) {
      const currentZoom = tab.zoomLevel || 1;
      const newZoom = Math.min(currentZoom + 0.1, 3);
      iframe.style.transform = `scale(${newZoom})`;
      iframe.style.transformOrigin = 'top left';
      iframe.style.width = `${100 / newZoom}%`;
      iframe.style.height = `${100 / newZoom}%`;
      updateTab(tabId, { zoomLevel: newZoom });
    }
  }, [updateTab, workspaces, activeWorkspaceId]);

  const zoomOut = useCallback(() => {
    const tabId = activeTabIdRef.current;
    const iframe = webviewRefs.current.get(tabId) as HTMLIFrameElement;
    const workspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const tab = workspace?.tabs.find(t => t.id === tabId);
    if (iframe && tab) {
      const currentZoom = tab.zoomLevel || 1;
      const newZoom = Math.max(currentZoom - 0.1, 0.3);
      iframe.style.transform = `scale(${newZoom})`;
      iframe.style.transformOrigin = 'top left';
      iframe.style.width = `${100 / newZoom}%`;
      iframe.style.height = `${100 / newZoom}%`;
      updateTab(tabId, { zoomLevel: newZoom });
    }
  }, [updateTab, workspaces, activeWorkspaceId]);

  const zoomReset = useCallback(() => {
    const tabId = activeTabIdRef.current;
    const iframe = webviewRefs.current.get(tabId) as HTMLIFrameElement;
    if (iframe) {
      iframe.style.transform = 'scale(1)';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      updateTab(tabId, { zoomLevel: 1 });
    }
  }, [updateTab]);

  // DevTools - iframe не поддерживает openDevTools
  // В Tauri можно открыть DevTools для всего окна через F12
  const openDevTools = useCallback(() => {
    console.log('DevTools: Press F12 to open DevTools for the entire window');
    // В Tauri нельзя открыть DevTools для конкретного iframe
  }, []);

  // Print - iframe не поддерживает прямой вызов print
  const printPage = useCallback(() => {
    const iframe = webviewRefs.current.get(activeTabIdRef.current) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('Cannot print iframe content:', e);
        // Fallback: печать всего окна
        window.print();
      }
    }
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    window.electronAPI.fullscreen();
  }, []);

  const addBookmark = useCallback(() => {
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const tab = activeWorkspace?.tabs.find(t => t.id === activeWorkspace.activeTabId);
    if (!tab || !tab.url) return;
    const bookmark: Bookmark = { id: uuidv4(), url: tab.url, title: tab.title, favicon: tab.favicon, createdAt: Date.now() };
    const newBookmarks = [...bookmarks, bookmark];
    setBookmarks(newBookmarks);
    window.electronAPI.setBookmarks(newBookmarks);
  }, [workspaces, activeWorkspaceId, bookmarks]);

  // Импорт из других браузеров
  const handleImportFromBrowser = useCallback(async (browser: 'chrome' | 'firefox' | 'edge') => {
    setShowImportDialog(false);
    const result = await window.electronAPI.importFromBrowser(browser);
    if (result) {
      // Объединяем закладки
      const mergedBookmarks = [...bookmarks, ...result.bookmarks.filter(
        imported => !bookmarks.some(b => b.url === imported.url)
      )];
      setBookmarks(mergedBookmarks);
      window.electronAPI.setBookmarks(mergedBookmarks);
      
      // Объединяем историю
      const mergedHistory = [...result.history, ...history];
      setHistory(mergedHistory.slice(0, 500));
      
      alert(`Импортировано: ${result.bookmarks.length} закладок`);
    }
  }, [bookmarks, history]);

  const addToHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'visitedAt'>) => {
    const historyEntry: HistoryEntry = { ...entry, id: uuidv4(), visitedAt: Date.now() };
    window.electronAPI.addHistory(historyEntry);
    setHistory(prev => [historyEntry, ...prev.slice(0, 499)]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    window.electronAPI.setSettings(updated);
  }, [settings]);

  const handleSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('sidebarWidth', width.toString());
  }, []);

  // Shortcuts setup
  useEffect(() => {
    const handleShortcut = (action: string) => {
      switch (action) {
        case 'new-tab': createNewTab(); break;
        case 'close-tab': activeTabIdRef.current && closeTab(activeTabIdRef.current); break;
        case 'focus-url': document.querySelector<HTMLInputElement>('.address-input')?.focus(); break;
        case 'reload': reloadTab(); break;
        case 'home': goHome(); break;
        case 'find':
        case 'escape':
          window.dispatchEvent(new CustomEvent('webview-shortcut', { detail: action }));
          break;
        case 'zoom-in': zoomIn(); break;
        case 'zoom-out': zoomOut(); break;
        case 'zoom-reset': zoomReset(); break;
        case 'fullscreen': toggleFullscreen(); break;
        case 'devtools': openDevTools(); break;
        case 'print': printPage(); break;
        case 'restore-tab': restoreClosedTab(); break;
        case 'downloads': openInternalPage('downloads'); break;
        case 'bookmarks': addBookmark(); break;
        case 'history': openInternalPage('history'); break;
        case 'search-tabs': setShowTabSearch(true); break;
      }
    };

    const cleanupShortcut = window.electronAPI.onShortcut(handleShortcut);
    const cleanupFullscreen = window.electronAPI.onFullscreenChange(setIsFullscreen);
    const cleanupOpenUrl = window.electronAPI.onOpenUrl((url) => createNewTab(url));
    
    // Обработка обновлений
    const cleanupUpdateAvailable = window.electronAPI.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });
    
    const cleanupUpdateDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setUpdateDownloaded(true);
    });

    // Обработка внешней авторизации Google
    const cleanupGoogleAuthExternal = window.electronAPI.onGoogleAuthExternal?.((data: any) => {
      // Показываем уведомление пользователю
      setToastMessage(data.message);
    }) || (() => {});

    return () => {
      cleanupShortcut();
      cleanupFullscreen();
      cleanupOpenUrl();
      cleanupUpdateAvailable();
      cleanupUpdateDownloaded();
      cleanupGoogleAuthExternal();
    };
  }, [createNewTab, closeTab, zoomIn, zoomOut, zoomReset, toggleFullscreen, openDevTools, printPage, restoreClosedTab, addBookmark, createWorkspace, openInternalPage]);

  // Восстановление сессии при запуске
  useEffect(() => {
    let initialized = false;
    
    const initApp = async () => {
      if (initialized) return;
      initialized = true;
      
      await loadData();
      
      // Восстанавливаем ширину сайдбара из localStorage
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        setSidebarWidth(parseInt(savedWidth, 10));
      }
      
      // Пытаемся восстановить сессию
      const savedSession = await window.electronAPI.restoreSession();
      if (savedSession && savedSession.workspaces && savedSession.workspaces.length > 0) {
        setWorkspaces(savedSession.workspaces);
        setActiveWorkspaceId(savedSession.activeWorkspaceId || savedSession.workspaces[0].id);
        setSessionRestored(true);
        // Очищаем файл сессии после успешного восстановления
        window.electronAPI.clearSession();
      } else {
        // Создаем первый workspace
        const workspaceId = uuidv4();
        const initialTab: Tab = {
          id: uuidv4(),
          url: '',
          title: 'Новая вкладка',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          zoomLevel: 1,
        };

        const workspace: Workspace = {
          id: workspaceId,
          name: 'Default',
          icon: 'workspace',
          activeTabId: initialTab.id,
          tabs: [initialTab],
        };
        
        setWorkspaces([workspace]);
        setActiveWorkspaceId(workspaceId);
      }
    };
    
    initApp();
  }, []);



  // Автосохранение сессии каждые 30 секунд и при закрытии
  useEffect(() => {
    if (workspaces.length === 0) return;

    const saveCurrentSession = () => {
      const sessionData = {
        workspaces: workspaces.map(ws => ({
          ...ws,
          tabs: ws.tabs.map(t => ({
            id: t.id,
            url: t.url,
            title: t.title,
            favicon: t.favicon,
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            zoomLevel: t.zoomLevel || 1,
          }))
        })),
        activeWorkspaceId,
      };
      window.electronAPI.saveSession(sessionData);
    };

    // Сохраняем каждые 30 секунд
    const interval = setInterval(saveCurrentSession, 30000);

    // Сохраняем при закрытии окна
    const handleBeforeUnload = () => {
      saveCurrentSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [workspaces, activeWorkspaceId]);

  // Автоматическая заморозка неактивных вкладок для экономии памяти
  useEffect(() => {
    const checkAndFreezeTabs = () => {
      const now = Date.now();
      const allTabs = workspaces.flatMap(ws => 
        ws.tabs.map(t => ({ ...t, workspaceId: ws.id, isActive: t.id === ws.activeTabId && ws.id === activeWorkspaceId }))
      );
      
      // Сортируем по времени последней активности
      const sortedTabs = allTabs
        .filter(t => t.url && !t.isFrozen && !t.isActive)
        .sort((a, b) => (a.lastActiveAt || 0) - (b.lastActiveAt || 0));
      
      // Замораживаем вкладки старше TAB_FREEZE_TIMEOUT или если превышен лимит
      for (const tab of sortedTabs) {
        const inactiveTime = now - (tab.lastActiveAt || 0);
        const activeTabsCount = allTabs.filter(t => !t.isFrozen && t.url).length;
        
        if (inactiveTime > TAB_FREEZE_TIMEOUT || activeTabsCount > MAX_ACTIVE_TABS) {
          freezeTab(tab.id);
        }
      }
    };

    const interval = setInterval(checkAndFreezeTabs, 60000); // Проверяем каждую минуту
    return () => clearInterval(interval);
  }, [workspaces, activeWorkspaceId, freezeTab]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const tabs = activeWorkspace?.tabs ?? [];
  const activeTabId = activeWorkspace?.activeTabId ?? '';
  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  const isBookmarked = activeTab ? bookmarks.some(b => b.url === activeTab.url) : false;

  const recentSearches = useMemo(() => {
    const results: string[] = [];
    for (const h of history) {
      try {
        const u = new URL(h.url);
        const q = u.searchParams.get('q') || u.searchParams.get('text');
        if (q && (u.hostname.includes('google.') || u.hostname.includes('duckduckgo.com') || u.hostname.includes('bing.com'))) {
          results.push(decodeURIComponent(q));
        }
      } catch {}
      if (results.length > 32) break;
    }
    const seen = new Set<string>();
    return results.filter((s) => (seen.has(s) ? false : (seen.add(s), true))).slice(0, 8);
  }, [history]);

  const isModalOpen = showNewTabModal || showImportDialog || showTabSearch;

  return (
    <div className={`app ${isFullscreen ? 'app--fullscreen' : ''} ${isModalOpen ? 'modal-open' : ''}`}
      style={{ 
        '--accent': settings.accentColor, 
        fontSize: settings.fontSize,
        '--wallpaper-url': `url(${settings.wallpaperUrl || '/walpaper1.jpg'})`
      } as React.CSSProperties}>
      {loadError && (
        <div className="load-error-banner" onClick={() => setLoadError(null)}>
          {loadError} <span className="dismiss">✕</span>
        </div>
      )}
      {sessionRestored && (
        <div className="session-restored-banner" onClick={() => setSessionRestored(false)}>
         <span className="dismiss">✕</span>
        </div>
      )}
      {updateAvailable && !updateDownloaded && (
        <div className="update-banner">
        </div>
      )}
      {updateDownloaded && (
        <div className="update-banner update-ready" onClick={() => window.electronAPI.installUpdate()}>
        </div>
      )}
      {!isFullscreen && <TitleBar />}
      <div className="browser-shell">
        <ZenSidebar
          workspaces={workspaces} activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={setActiveWorkspaceId} 
          onWorkspaceCreate={() => createWorkspace()}
          onWorkspaceDelete={deleteWorkspace} 
          onWorkspaceRename={renameWorkspace}
          onWorkspaceIconChange={updateWorkspaceIcon}
          tabs={tabs} activeTabId={activeTabId}
          onTabSelect={setActiveTabInWorkspace} onTabClose={closeTab}
          onNewTab={() => setShowNewTabModal(true)} 
          onShowHistory={() => openInternalPage('history')}
          onShowDownloads={() => openInternalPage('downloads')}
          onShowSettings={() => openInternalPage('settings')}
          canGoBack={activeTab?.canGoBack || false}
          canGoForward={activeTab?.canGoForward || false}
          isLoading={activeTab?.isLoading || false}
          onBack={goBack}
          onForward={goForward}
          onReload={reloadTab}
          onStop={stopLoading}
          onSearch={navigate}
          sidebarWidth={sidebarWidth}
          onSidebarWidthChange={handleSidebarWidthChange}
        />
        <div className="main-area">
          {/* Показываем AddressBar только когда пользователь перешел на сайт */}
          {activeTab?.url && (
            <AddressBar
              url={activeTab.url} isLoading={activeTab.isLoading || false}
              canGoBack={activeTab.canGoBack || false} canGoForward={activeTab.canGoForward || false}
              isBookmarked={isBookmarked} isSecure={activeTab.isSecure}
              history={history} bookmarks={bookmarks}
              onNavigate={navigate} onBack={goBack} onForward={goForward}
              onReload={reloadTab} onStop={stopLoading} onBookmark={addBookmark}
              onHome={goHome}
            />
          )}
          <div className="content-area">
            <div className="webview-area">
              {/* Ленивая загрузка: рендерим только активную вкладку текущего workspace */}
              {tabs.map(tab => (
                <div key={tab.id} className={`webview-wrapper ${tab.id === activeTabId ? 'active' : 'hidden'}`}>
                  {tab.id === activeTabId && (
                    tab.isFrozen ? (
                      <div className="frozen-tab-placeholder">
                        <div className="frozen-icon">❄️</div>
                        <p>Вкладка заморожена для экономии памяти</p>
                        <button onClick={() => unfreezeTab(tab.id)}>Разморозить</button>
                      </div>
                    ) : tab.url === INTERNAL_URLS.history ? (
                      <HistoryPage
                        history={history}
                        onNavigate={(url) => { navigate(url); }}
                        onClearHistory={() => { window.electronAPI.clearHistory(); setHistory([]); }}
                      />
                    ) : tab.url === INTERNAL_URLS.downloads ? (
                      <DownloadsPage />
                    ) : tab.url === INTERNAL_URLS.settings ? (
                      <SettingsPage settings={settings} onUpdate={updateSettings} />
                    ) : tab.url ? (
                      <CefViewContainer
                        tab={tab} isActive={tab.id === activeTabId}
                        onUpdate={(updates) => updateTab(tab.id, updates)}
                        onAddHistory={addToHistory}
                        webviewRef={(ref) => { if (ref) webviewRefs.current.set(tab.id, ref as any); }}
                        onOpenInNewTab={createNewTab}
                      />
                    ) : (
                      <StartPage 
                        settings={settings} 
                        onNavigate={navigate}
                        recentSites={history.slice(0, 8).map(h => ({
                          url: h.url,
                          title: h.title,
                          favicon: h.favicon
                        }))}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showNewTabModal && (
        <NewTabModal recentQueries={recentSearches} onSubmit={(q) => { createNewTab(q); setShowNewTabModal(false); }} onClose={() => setShowNewTabModal(false)} />
      )}
      {showImportDialog && (
        <ImportDialog onClose={() => setShowImportDialog(false)} onImport={handleImportFromBrowser} />
      )}
      {showTabSearch && (
        <TabSearch
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectTab={selectTabFromSearch}
          onClose={() => setShowTabSearch(false)}
        />
      )}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default App;
