// Tauri API wrapper - заменяет Electron API
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open as shellOpen } from '@tauri-apps/plugin-shell';

// Создаем совместимый API с Electron
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
    return () => {
      unlisten.then(fn => fn());
    };
  },

  // Fullscreen change listener
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => {
    const unlisten = listen('fullscreen-change', (event: any) => {
      callback(event.payload);
    });
    return () => {
      unlisten.then(fn => fn());
    };
  },

  // Open URL in new tab (from main process)
  onOpenUrl: (callback: (url: string) => void) => {
    const unlisten = listen('open-url', (event: any) => {
      callback(event.payload);
    });
    return () => {
      unlisten.then(fn => fn());
    };
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
    return () => {
      unlisten.then(fn => fn());
    };
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
    return () => {
      unlisten.then(fn => fn());
    };
  },
  onUpdateDownloaded: (callback: () => void) => {
    const unlisten = listen('update-downloaded', () => {
      callback();
    });
    return () => {
      unlisten.then(fn => fn());
    };
  },
  installUpdate: () => invoke('install_update'),

  // Session restore
  saveSession: (sessionData: any) => invoke('save_session', { sessionData }),
  restoreSession: () => invoke('restore_session'),
  clearSession: () => invoke('clear_session'),

  // Partition sessions (не используется в Tauri, но оставляем для совместимости)
  getPartitionSession: (partition: string) => Promise.resolve(true),

  // Google OAuth
  googleOAuthLogin: (clientId: string, clientSecret: string) => 
    invoke('google_oauth_login', { clientId, clientSecret }),
  googleOAuthRefresh: () => invoke('google_oauth_refresh'),
  googleOAuthLogout: () => invoke('google_oauth_logout'),
  googleOAuthGetUser: () => invoke('google_oauth_get_user'),
  
  // Google Auth External Browser notification
  onGoogleAuthExternal: (callback: (data: any) => void) => {
    const unlisten = listen('google-auth-external', (event: any) => {
      callback(event.payload);
    });
    return () => {
      unlisten.then(fn => fn());
    };
  },
};

// Экспортируем в window для совместимости
if (typeof window !== 'undefined') {
  (window as any).electronAPI = electronAPI;
}
