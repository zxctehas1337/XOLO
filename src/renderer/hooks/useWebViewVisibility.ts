import { useEffect, useRef } from 'react';
import { Workspace } from '../types';

interface UseWebViewVisibilityOptions {
  workspaces: Workspace[];
  workspacesRef: React.MutableRefObject<Workspace[]>;
  activeWorkspaceId: string;
  isModalOpen: boolean;
}

// Получаем bounds для WebView на основе текущего layout
const getWebViewBounds = () => {
  // Ищем webview-area контейнер
  const webviewArea = document.querySelector('.webview-area');
  if (webviewArea) {
    const rect = webviewArea.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }
  
  // Fallback: ищем content-area
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    const rect = contentArea.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }
  
  return null;
};

export const useWebViewVisibility = ({
  workspaces,
  workspacesRef,
  activeWorkspaceId,
  isModalOpen,
}: UseWebViewVisibilityOptions) => {
  const prevModalOpenRef = useRef(isModalOpen);

  // Скрываем WebView неактивных воркспейсов при переключении
  useEffect(() => {
    if (!activeWorkspaceId || workspaces.length === 0) return;

    const hideInactiveWebViews = async () => {
      for (const workspace of workspaces) {
        const isActiveWorkspace = workspace.id === activeWorkspaceId;
        
        for (const tab of workspace.tabs) {
          if (!tab.url || tab.url.startsWith('xolo://')) continue;
          
          const isActiveTab = isActiveWorkspace && tab.id === workspace.activeTabId;
          
          try {
            await window.electronAPI.setWebViewVisible?.(tab.id, isActiveTab);
          } catch (e) {
            // WebView может ещё не существовать
          }
        }
      }
    };

    hideInactiveWebViews();
  }, [activeWorkspaceId, workspaces]);

  // Скрываем все нативные WebView когда открыто модальное окно
  useEffect(() => {
    const wasModalOpen = prevModalOpenRef.current;
    const modalStateChanged = wasModalOpen !== isModalOpen;
    prevModalOpenRef.current = isModalOpen;
    
    const updateWebViewsVisibility = async () => {
      const currentWorkspaces = workspacesRef.current;
      const activeWorkspace = currentWorkspaces.find(ws => ws.id === activeWorkspaceId);
      const activeTabId = activeWorkspace?.activeTabId;
      
      if (isModalOpen) {
        // Скрываем ВСЕ WebView когда открыто модальное окно
        const hidePromises = [];
        for (const workspace of currentWorkspaces) {
          for (const tab of workspace.tabs) {
            if (tab.url && !tab.url.startsWith('xolo://')) {
              hidePromises.push(
                window.electronAPI.setWebViewVisible?.(tab.id, false).catch(() => {})
              );
            }
          }
        }
        await Promise.all(hidePromises);
      } else if (modalStateChanged) {
        // Модал только что закрылся - восстанавливаем видимость активного WebView
        // Ждём пока DOM обновится
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Получаем актуальные bounds
        const bounds = getWebViewBounds();
        
        for (const workspace of currentWorkspaces) {
          for (const tab of workspace.tabs) {
            if (!tab.url || tab.url.startsWith('xolo://')) continue;
            
            const isCurrentWorkspace = workspace.id === activeWorkspaceId;
            const isActiveTab = isCurrentWorkspace && tab.id === activeTabId;
            
            try {
              if (isActiveTab && bounds) {
                // Для активного таба: сначала обновляем bounds, потом показываем
                await window.electronAPI.updateWebViewBounds?.(tab.id, bounds);
                await window.electronAPI.setWebViewVisible?.(tab.id, true);
              } else {
                // Для неактивных табов: просто скрываем
                await window.electronAPI.setWebViewVisible?.(tab.id, false);
              }
            } catch (e) {
              // WebView может не существовать
            }
          }
        }
      }
    };

    updateWebViewsVisibility();
  }, [isModalOpen, activeWorkspaceId, workspacesRef]);
};
