import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Settings, defaultSettings } from './types';
import { useTranslation } from './hooks/useTranslation';
import TitleBar from './components/TitleBar';
import AddressBar from './components/AddressBar';
import WebView2Container from './components/WebView2Container';
import StartPage from './components/StartPage';
import ZenSidebar from './components/ZenSidebar';
import NewTabModal from './components/NewTabModal';
import ImportDialog from './components/ImportDialog';
import TabSearch from './components/TabSearch';
import HistoryPage from './components/HistoryPage';
import DownloadsPage from './components/DownloadsPage';
import SettingsPage from './components/SettingsPage';
import { Toast } from './components/Toast';
import { INTERNAL_URLS } from './constants';
import { extractSearchQueries } from './utils/url';
import {
  useWorkspaces,
  useNavigation,
  useTabMemory,
  useHistory,
  useZoom,
  useBookmarks,
  useShortcuts,
  useSession,
  useWebViewVisibility,
} from './hooks';
import './styles/App.css';

const App: React.FC = () => {
  console.log('App component rendering...');
  
  // Базовые состояния
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTabSearch, setShowTabSearch] = useState(false);
  const [updateAvailable] = useState(false);
  const [updateDownloaded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const t = useTranslation(settings.language);
  
  // Состояния для StartPage сайтов
  const [hiddenSites, setHiddenSites] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenSites');
    return saved ? JSON.parse(saved) : [];
  });
  const [renamedSites, setRenamedSites] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('renamedSites');
    return saved ? JSON.parse(saved) : {};
  });
  
  const webviewRefs = useRef<Map<string, HTMLWebViewElement>>(new Map());

  // Хуки для управления данными
  const { history, setHistory, addToHistory, clearHistory } = useHistory();
  
  const {
    workspaces,
    setWorkspaces,
    workspacesRef,
    activeWorkspaceId,
    setActiveWorkspaceId,
    tabs,
    activeTabId,
    activeTab,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
    updateWorkspaceIcon,
    createNewTab,
    closeTab,
    restoreClosedTab,
    updateTab,
    setActiveTabInWorkspace,
    selectTabFromSearch,
  } = useWorkspaces({ settings, language: settings.language });

  const {
    activeTabIdRef,
    navigate,
    goBack,
    goForward,
    reloadTab,
    stopLoading,
    goHome,
    openInternalPage,
  } = useNavigation({
    settings,
    workspaces,
    activeWorkspaceId,
    activeTabId,
    updateTab,
    setWorkspaces,
  });

  const { unfreezeTab } = useTabMemory({
    workspaces,
    activeWorkspaceId,
    setWorkspaces,
  });

  const { zoomIn, zoomOut, zoomReset } = useZoom({
    workspaces,
    activeWorkspaceId,
    activeTabIdRef,
    webviewRefs,
    updateTab,
  });

  const { bookmarks, setBookmarks, addBookmark, handleImportFromBrowser } = useBookmarks({
    workspaces,
    activeWorkspaceId,
  });

  // Сессия и восстановление
  useSession({
    workspaces,
    activeWorkspaceId,
    setWorkspaces,
    setActiveWorkspaceId,
    setSettings,
    setBookmarks,
    setHistory,
    setSidebarWidth,
  });

  // Вспомогательные функции
  const toggleFullscreen = useCallback(() => {
    window.electronAPI.fullscreen();
  }, []);

  const openDevTools = useCallback(() => {
    console.log('DevTools: Press F12 to open DevTools for the entire window');
  }, []);

  const printPage = useCallback(() => {
    const iframe = webviewRefs.current.get(activeTabIdRef.current) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('Cannot print iframe content:', e);
        window.print();
      }
    }
  }, [activeTabIdRef]);

  const openNewTabModal = useCallback(() => {
    setShowNewTabModal(true);
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

  // Функции для управления сайтами на StartPage
  const handleHideSite = useCallback((url: string) => {
    setHiddenSites(prev => {
      const updated = [...prev, url];
      localStorage.setItem('hiddenSites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDeleteSite = useCallback((url: string) => {
    // Удаление = скрытие + удаление из истории
    setHiddenSites(prev => {
      const updated = [...prev, url];
      localStorage.setItem('hiddenSites', JSON.stringify(updated));
      return updated;
    });
    // Также удаляем переименование если было
    setRenamedSites(prev => {
      const updated = { ...prev };
      delete updated[url];
      localStorage.setItem('renamedSites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleRenameSite = useCallback((url: string, newName: string) => {
    setRenamedSites(prev => {
      const updated = { ...prev, [url]: newName };
      localStorage.setItem('renamedSites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Шорткаты
  useShortcuts({
    createNewTab,
    closeTab,
    activeTabIdRef,
    reloadTab,
    goHome,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleFullscreen,
    openDevTools,
    printPage,
    restoreClosedTab,
    addBookmark,
    openInternalPage,
    setShowTabSearch,
    setIsFullscreen,
    addToHistory,
    setWorkspaces,
  });

  // Видимость WebView
  const isModalOpen = showNewTabModal || showImportDialog || showTabSearch;
  
  useWebViewVisibility({
    workspaces,
    workspacesRef,
    activeWorkspaceId,
    isModalOpen,
  });

  // Вычисляемые значения
  const isBookmarked = activeTab ? bookmarks.some(b => b.url === activeTab.url) : false;
  const recentSearches = useMemo(() => extractSearchQueries(history), [history]);

  const handleSearch = useCallback((query: string) => {
    createNewTab(query);
  }, [createNewTab]);


  return (
    <div 
      className={`app ${isFullscreen ? 'app--fullscreen' : ''} ${isModalOpen ? 'modal-open' : ''}`}
      style={{ 
        '--accent': settings.accentColor, 
        fontSize: settings.fontSize,
        '--wallpaper-url': `url(${settings.wallpaperUrl || '/walpaper1.jpg'})`,
        '--wallpaper-blur': `${settings.wallpaperBlur || 0}px`,
        '--wallpaper-dim': `${settings.wallpaperDim || 20}%`,
      } as React.CSSProperties}
      data-radius={settings.borderRadius}
      data-font={settings.fontFamily}
      data-animations={settings.animationsEnabled}
      data-sidebar-position={settings.sidebarPosition}
      data-theme={settings.theme}
    >
      {updateAvailable && !updateDownloaded && <div className="update-banner" />}
      
      {updateDownloaded && (
        <div 
          className="update-banner update-ready" 
          onClick={() => window.electronAPI.installUpdate()} 
        />
      )}
      
      {!isFullscreen && <TitleBar />}
      
      <div className="browser-shell">
        <div className="main-area">
          {activeTab?.url && (
            <AddressBar
              url={activeTab.url}
              isLoading={activeTab.isLoading || false}
              canGoBack={activeTab.canGoBack || false}
              canGoForward={activeTab.canGoForward || false}
              isBookmarked={isBookmarked}
              isSecure={activeTab.isSecure}
              history={history}
              bookmarks={bookmarks}
              onNavigate={navigate}
              onBack={goBack}
              onForward={goForward}
              onReload={reloadTab}
              onStop={stopLoading}
              onBookmark={addBookmark}
              onHome={goHome}
            />
          )}
          
          <div className="content-area">
            <div className="webview-area">
              {/* WebView для всех воркспейсов */}
              {workspaces.map(workspace =>
                workspace.tabs.map(tab => {
                  const isCurrentWorkspace = workspace.id === activeWorkspaceId;
                  const isActiveTab = isCurrentWorkspace && tab.id === activeTabId;
                  const shouldRender = tab.url && !tab.url.startsWith('xolo://');

                  return (
                    <div
                      key={tab.id}
                      className={`webview-wrapper ${isActiveTab && shouldRender ? 'active' : 'hidden'}`}
                      style={{ display: isActiveTab && shouldRender ? 'flex' : 'none' }}
                    >
                      {shouldRender && (
                        <WebView2Container
                          tab={tab}
                          isActive={isActiveTab}
                          onUpdate={(updates) => updateTab(tab.id, updates)}
                          onAddHistory={addToHistory}
                          webviewRef={(ref) => {
                            if (ref) webviewRefs.current.set(tab.id, ref as any);
                          }}
                          onOpenInNewTab={createNewTab}
                        />
                      )}
                    </div>
                  );
                })
              )}
              
              {/* Внутренние страницы и стартовая */}
              {tabs.map(tab => {
                const isActiveTab = tab.id === activeTabId;
                const hasWebView = tab.url && !tab.url.startsWith('xolo://');
                const shouldShowContent = isActiveTab && !hasWebView;

                return (
                  <div
                    key={`content-${tab.id}`}
                    className={`webview-wrapper ${shouldShowContent ? 'active' : 'hidden'}`}
                    style={{ display: shouldShowContent ? 'flex' : 'none' }}
                  >
                    {shouldShowContent && (
                      tab.isFrozen ? (
                        <div className="frozen-tab-placeholder">
                          <div className="frozen-icon">❄️</div>
                          <p>{t.common.frozenForMemory}</p>
                          <button onClick={() => unfreezeTab(tab.id)}>{t.common.unfreeze}</button>
                        </div>
                      ) : tab.url === INTERNAL_URLS.history ? (
                        <HistoryPage
                          history={history}
                          onNavigate={navigate}
                          onClearHistory={clearHistory}
                          language={settings.language}
                        />
                      ) : tab.url === INTERNAL_URLS.downloads ? (
                        <DownloadsPage language={settings.language} />
                      ) : tab.url === INTERNAL_URLS.settings ? (
                        <SettingsPage settings={settings} onUpdate={updateSettings} />
                      ) : !tab.url ? (
                        <StartPage
                          settings={settings}
                          onNavigate={navigate}
                          recentSites={history.slice(0, 8).map(h => ({
                            url: h.url,
                            title: h.title,
                            favicon: h.favicon,
                          }))}
                          hiddenSites={hiddenSites}
                          renamedSites={renamedSites}
                          onHideSite={handleHideSite}
                          onDeleteSite={handleDeleteSite}
                          onRenameSite={handleRenameSite}
                        />
                      ) : null
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <ZenSidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={setActiveWorkspaceId}
          onWorkspaceCreate={() => createWorkspace()}
          onWorkspaceDelete={deleteWorkspace}
          onWorkspaceRename={renameWorkspace}
          onWorkspaceIconChange={updateWorkspaceIcon}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabInWorkspace}
          onTabClose={closeTab}
          onNewTab={openNewTabModal}
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
          onSearch={handleSearch}
          sidebarWidth={sidebarWidth}
          onSidebarWidthChange={handleSidebarWidthChange}
          // Customization from settings
          position={settings.sidebarPosition}
          style={settings.sidebarStyle}
          showQuickSites={settings.showSidebarQuickSites}
          showWorkspaces={settings.showSidebarWorkspaces}
          showNavigation={settings.showSidebarNavigation}
          tabCloseButton={settings.tabCloseButton}
          showTabFavicons={settings.showTabFavicons}
          language={settings.language}
        />
      </div>

      {/* Модальные окна */}
      {showNewTabModal && (
        <NewTabModal
          recentQueries={recentSearches}
          onSubmit={(q) => {
            createNewTab(q);
            setShowNewTabModal(false);
          }}
          onClose={() => setShowNewTabModal(false)}
        />
      )}
      
      {showImportDialog && (
        <ImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={(browser) => handleImportFromBrowser(browser, history, setHistory, setShowImportDialog)}
        />
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
