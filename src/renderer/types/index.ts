export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  pinned?: boolean;
  zoomLevel?: number;
  error?: TabError | null;
  isSecure?: boolean;
  isFrozen?: boolean; // Вкладка заморожена для экономии памяти
  lastActiveAt?: number; // Время последней активности
}

export interface TabError {
  code: number;
  description: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  activeTabId: string;
  tabs: Tab[];
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitedAt: number;
}

export interface Settings {
  searchEngine: 'google' | 'duckduckgo' | 'bing';
  theme: 'dark' | 'light' | 'custom';
  accentColor: string;
  fontSize: number;
  tabPosition: 'top' | 'bottom' | 'left' | 'right';
  showBookmarksBar: boolean;
  adBlockEnabled: boolean;
  readerModeEnabled: boolean;
  startPageBackground: string;
  showWeather: boolean;
  showQuotes: boolean;
  showTodos: boolean;
  wallpaperUrl: string; // URL фонового изображения
}

export interface QuickAccess {
  id: string;
  url: string;
  title: string;
  icon?: string;
}

export const defaultSettings: Settings = {
  searchEngine: 'google',
  theme: 'dark',
  accentColor: '#7c3aed',
  fontSize: 14,
  tabPosition: 'top',
  showBookmarksBar: true,
  adBlockEnabled: true,
  readerModeEnabled: false,
  startPageBackground: 'gradient',
  showWeather: true,
  showQuotes: false,
  showTodos: false,
  wallpaperUrl: '/walpaper1.jpg',
};

export interface Download {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  savePath?: string;
}

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      fullscreen: () => Promise<void>;
      isFullscreen: () => Promise<boolean>;
      getSettings: () => Promise<Settings>;
      setSettings: (settings: Settings) => Promise<void>;
      getBookmarks: () => Promise<Bookmark[]>;
      setBookmarks: (bookmarks: Bookmark[]) => Promise<void>;
      getHistory: () => Promise<HistoryEntry[]>;
      addHistory: (entry: HistoryEntry) => Promise<void>;
      clearHistory: () => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      showSaveDialog: (options: any) => Promise<any>;
      showError: (title: string, message: string) => Promise<void>;
      onShortcut: (callback: (action: string) => void) => () => void;
      onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void;
      onOpenUrl: (callback: (url: string) => void) => () => void;
      exportBookmarks: (bookmarks: Bookmark[]) => Promise<boolean>;
      importBookmarks: () => Promise<Bookmark[] | null>;
      // Memory management
      freezeTab: (tabId: string) => Promise<boolean>;
      unfreezeTab: (tabId: string) => Promise<boolean>;
      isTabFrozen: (tabId: string) => Promise<boolean>;
      // Downloads
      getDownloads: () => Promise<Download[]>;
      onDownloadUpdate: (callback: (download: Download) => void) => () => void;
      cancelDownload: (id: string) => Promise<void>;
      openDownload: (path: string) => Promise<void>;
      showDownloadInFolder: (path: string) => Promise<void>;
      clearCompletedDownloads: () => Promise<void>;
      // Browser import
      importFromBrowser: (browser: 'chrome' | 'firefox' | 'edge') => Promise<{ bookmarks: Bookmark[], history: HistoryEntry[] } | null>;
      // Auto-update
      checkForUpdates: () => Promise<void>;
      onUpdateAvailable: (callback: (info: any) => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      installUpdate: () => Promise<void>;
      // Session restore
      saveSession: (sessionData: any) => Promise<boolean>;
      restoreSession: () => Promise<any | null>;
      clearSession: () => Promise<boolean>;
      // Partition sessions
      getPartitionSession: (partition: string) => Promise<boolean>;
      // Google OAuth
      googleOAuthLogin: (clientId: string, clientSecret: string) => Promise<GoogleOAuthResult>;
      googleOAuthRefresh: () => Promise<GoogleOAuthRefreshResult>;
      googleOAuthLogout: () => Promise<{ success: boolean }>;
      googleOAuthGetUser: () => Promise<GoogleOAuthUserData | null>;
      onGoogleAuthExternal: (callback: (data: { message: string; url: string }) => void) => () => void;
    };
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface GoogleOAuthResult {
  success: boolean;
  userInfo?: GoogleUser;
  tokens?: GoogleTokens;
  error?: string;
}

export interface GoogleOAuthRefreshResult {
  success: boolean;
  tokens?: GoogleTokens;
  error?: string;
}

export interface GoogleOAuthUserData {
  userInfo: GoogleUser;
  tokens: GoogleTokens;
}
