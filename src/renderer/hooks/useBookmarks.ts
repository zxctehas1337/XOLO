import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bookmark, Workspace, HistoryEntry } from '../types';

interface UseBookmarksOptions {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

export const useBookmarks = ({ workspaces, activeWorkspaceId }: UseBookmarksOptions) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const addBookmark = useCallback(() => {
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const tab = activeWorkspace?.tabs.find(t => t.id === activeWorkspace.activeTabId);
    if (!tab || !tab.url) return;
    
    const bookmark: Bookmark = { 
      id: uuidv4(), 
      url: tab.url, 
      title: tab.title, 
      favicon: tab.favicon, 
      createdAt: Date.now() 
    };
    const newBookmarks = [...bookmarks, bookmark];
    setBookmarks(newBookmarks);
    window.electronAPI.setBookmarks(newBookmarks);
  }, [workspaces, activeWorkspaceId, bookmarks]);

  const handleImportFromBrowser = useCallback(async (
    browser: 'chrome' | 'firefox' | 'edge',
    history: HistoryEntry[],
    setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>,
    setShowImportDialog: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
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
  }, [bookmarks]);

  return {
    bookmarks,
    setBookmarks,
    addBookmark,
    handleImportFromBrowser,
  };
};
