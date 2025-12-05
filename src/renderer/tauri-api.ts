// Tauri API wrapper для Windows WebView2
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open as shellOpen } from '@tauri-apps/plugin-shell';

export const electronAPI = {
  // Window controls
  minimize: () => invoke('window_minimize'),
  maximize: () => invoke('window_maximize'),
  close: () => invoke('window_close'),
  fullscreen: () => invoke('window_fullscreen'),
  isFullscreen: () => invoke('is_fullscreen'),

  // Settings
  getSettings: () => invoke('get_settings'),
  setSettings: (settings: any) => invoke('set_settings', { settings }),

  // Bookmarks
  getBookmarks: () => invoke('get_bookmarks'),
  setBookmarks: (bookmarks: any[]) => invoke('set_bookmarks', { bookmarks }),

  // History
  getHistory: () => invoke('get_history'),
  addHistory: (entry: any) => invoke('add_history', { entry }),
  clearHistory: () => invoke('clear_history'),

  // External
  openExternal: (url: string) => shellOpen(url),
  showSaveDialog: (options: any) => invoke('show_save_dialog', { options }),
  showError: (title: string, message: string) => invoke('show_error', { title, message }),

  // Shortcuts listener
  onShortcut: (callback: (action: string) => void) => {
    const unlisten = listen('shortcut', (event: any) => {
      callback(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  },

  // Fullscreen change listener
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => {
    const unlisten = listen('fullscreen-change', (event: any) => {
      callback(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  },

  // Open URL in new tab
  onOpenUrl: (callback: (url: string) => void) => {
    const unlisten = listen('open-url', (event: any) => {
      callback(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  },

  // Import/Export bookmarks
  exportBookmarks: (bookmarks: any[]) => invoke('export_bookmarks', { bookmarks }),
  importBookmarks: () => invoke('import_bookmarks'),

  // Memory management - tab freezing
  freezeTab: (tabId: string) => invoke('freeze_tab', { tabId }),
  unfreezeTab: (tabId: string) => invoke('unfreeze_tab', { tabId }),
  isTabFrozen: (tabId: string) => invoke('is_tab_frozen', { tabId }),

  // Downloads
  getDownloads: () => invoke('get_downloads'),
  onDownloadUpdate: (callback: (download: any) => void) => {
    const unlisten = listen('download-update', (event: any) => {
      callback(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  },
  cancelDownload: (id: string) => invoke('cancel_download', { id }),
  openDownload: (path: string) => invoke('open_download', { path }),
  showDownloadInFolder: (path: string) => invoke('show_download_in_folder', { path }),
  clearCompletedDownloads: () => invoke('clear_completed_downloads'),

  // Browser import
  importFromBrowser: (browser: 'chrome' | 'firefox' | 'edge') => 
    invoke('import_from_browser', { browser }),

  // Auto-update
  checkForUpdates: () => invoke('check_for_updates'),
  onUpdateAvailable: (callback: (info: any) => void) => {
    const unlisten = listen('update-available', (event: any) => {
      callback(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  },
  onUpdateDownloaded: (callback: () => void) => {
    const unlisten = listen('update-downloaded', () => {
      callback();
    });
    return () => { unlisten.then(fn => fn()); };
  },
  installUpdate: () => invoke('install_update'),

  // Session restore
  saveSession: (sessionData: any) => invoke('save_session', { sessionData }),
  restoreSession: () => invoke('restore_session'),
  clearSession: () => invoke('clear_session'),

  // WebView2 commands
  createWebView: (id: string, url: string) => invoke('create_webview', { id, url }),
  closeWebView: (id: string) => invoke('close_webview', { id }),
  navigateWebView: (id: string, url: string) => invoke('navigate_webview', { id, url }),
  webViewGoBack: (id: string) => invoke('go_back', { id }),
  webViewGoForward: (id: string) => invoke('go_forward', { id }),
  webViewReload: (id: string) => invoke('reload_webview', { id }),
  webViewStop: (id: string) => invoke('stop_webview', { id }),
  getWebViewInfo: (id: string) => invoke('get_webview_info', { id }),
  executeScript: (id: string, script: string) => invoke('execute_script', { id, script }),
  setZoom: (id: string, zoom: number) => invoke('set_zoom', { id, zoom }),
  getWebViewUrl: (id: string) => invoke('get_webview_url', { id }),
  getWebViewTitle: (id: string) => invoke<string>('get_webview_title', { id }),
  webViewExists: (id: string) => invoke<boolean>('webview_exists', { id }),
  setWebViewVisible: (id: string, visible: boolean) => invoke('set_webview_visible', { id, visible }),
  updateWebViewBounds: (id: string, bounds: { x: number; y: number; width: number; height: number }) => 
    invoke('update_webview_bounds', { id, bounds }),

  // WebView URL change listener
  onWebViewUrlChanged: (callback: (data: { id: string; url?: string; title?: string; is_loading?: boolean }) => void) => {
    const unlisten = listen('webview-url-changed', (event: any) => {
      callback(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  },

  // Page info update listener (title, url from injected script)
  onPageInfoUpdate: (callback: (data: { id: string; title: string; url: string }) => void) => {
    const unlisten = listen('page-info-update', (event: any) => {
      callback(event.payload);
    });
    return () => { unlisten.then(fn => fn()); };
  },
};

// Экспортируем в window для совместимости
if (typeof window !== 'undefined') {
  (window as any).electronAPI = electronAPI;
}
