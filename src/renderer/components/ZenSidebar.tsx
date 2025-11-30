import React, { useState, useRef, useEffect } from 'react';
import { Tab, Workspace } from '../types';
import './ZenSidebar.css';

interface ZenSidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onWorkspaceSelect: (id: string) => void;
  onWorkspaceCreate: () => void;
  onWorkspaceDelete: (id: string) => void;
  onWorkspaceRename?: (id: string, name: string) => void;
  onWorkspaceIconChange?: (id: string, icon: string) => void;

  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;

  onShowHistory: () => void;
  onShowDownloads: () => void;
  onShowSettings?: () => void;
  
  // Navigation
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  onStop?: () => void;
  
  // Search
  onSearch?: (query: string) => void;
  
  // Resizable
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
}

// Красивые SVG иконки для workspace
const WORKSPACE_ICONS = {
  workspace: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  briefcase: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  shopping: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  music: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  game: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="11" x2="10" y2="11"/>
      <line x1="8" y1="9" x2="8" y2="13"/>
      <line x1="15" y1="12" x2="15.01" y2="12"/>
      <line x1="18" y1="10" x2="18.01" y2="10"/>
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>
    </svg>
  ),
  book: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  heart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  coffee: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  globe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

// Quick access sites grid - как на скриншоте Zen
const quickSites = [
  { name: 'Google', url: 'https://google.com', color: '#4285f4' },
  { name: 'Twitter', url: 'https://twitter.com', color: '#1da1f2' },
  { name: 'Opera', url: 'https://opera.com', color: '#ff1b2d' },
  { name: 'Reddit', url: 'https://reddit.com', color: '#ff4500' },
  { name: 'GitHub', url: 'https://github.com', color: '#6e5494' },
  { name: 'YouTube', url: 'https://youtube.com', color: '#ff0000' },
];

const ZenSidebar: React.FC<ZenSidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onWorkspaceCreate,
  onWorkspaceDelete,
  onWorkspaceRename,
  onWorkspaceIconChange,
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  onShowHistory,
  onShowDownloads,
  onShowSettings,
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onReload,
  onStop,
  onSearch,
  sidebarWidth = 220,
  onSidebarWidthChange,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenuWorkspace, setContextMenuWorkspace] = useState<{ id: string; x: number; y: number } | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingWorkspaceId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingWorkspaceId]);

  // Закрытие контекстного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuWorkspace(null);
        setShowIconPicker(false);
      }
    };

    if (contextMenuWorkspace) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenuWorkspace]);

  // Resizing logic
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onSidebarWidthChange) return;
      
      const MIN_WIDTH = 180;
      const MAX_WIDTH = 400;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
      
      onSidebarWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onSidebarWidthChange]);

  const handleStartRename = (ws: Workspace) => {
    setEditingWorkspaceId(ws.id);
    setEditingName(ws.name);
    setContextMenuWorkspace(null);
  };

  const handleFinishRename = () => {
    if (editingWorkspaceId && editingName.trim() && onWorkspaceRename) {
      onWorkspaceRename(editingWorkspaceId, editingName.trim());
    }
    setEditingWorkspaceId(null);
    setEditingName('');
  };

  const handleContextMenu = (e: React.MouseEvent, ws: Workspace) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Размеры контекстного меню (примерные)
    const menuWidth = 220;
    const menuHeight = 200;
    
    // Получаем размеры и позицию сайдбара
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    if (!sidebarRect) return;
    
    // Позиционируем меню по центру сайдбара по горизонтали
    // и рядом с кликнутым элементом по вертикали
    let x = sidebarRect.left + (sidebarRect.width - menuWidth) / 2;
    let y = e.clientY;
    
    // Убеждаемся, что меню не выходит за правый край экрана
    if (x + menuWidth > window.innerWidth - 10) {
      x = window.innerWidth - menuWidth - 10;
    }
    
    // Убеждаемся, что меню не выходит за левый край экрана
    x = Math.max(10, x);
    
    // Проверяем, помещается ли меню снизу от курсора
    if (y + menuHeight > window.innerHeight - 10) {
      y = Math.max(10, window.innerHeight - menuHeight - 10);
    }
    
    // Убеждаемся, что меню не выходит за верхний край
    y = Math.max(10, y);
    
    setContextMenuWorkspace({ id: ws.id, x, y });
  };

  const handleIconSelect = (iconKey: string) => {
    if (contextMenuWorkspace && onWorkspaceIconChange) {
      onWorkspaceIconChange(contextMenuWorkspace.id, iconKey);
    }
    setShowIconPicker(false);
    setContextMenuWorkspace(null);
  };

  const handleShowIconPicker = () => {
    if (!contextMenuWorkspace) return;
    
    // Пересчитываем позицию для icon picker (он больше)
    const pickerWidth = 300;
    const pickerHeight = 350;
    
    // Получаем размеры и позицию сайдбара
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    if (!sidebarRect) return;
    
    // Позиционируем picker по центру сайдбара
    let x = sidebarRect.left + (sidebarRect.width - pickerWidth) / 2;
    let y = contextMenuWorkspace.y;
    
    // Убеждаемся, что picker не выходит за правый край экрана
    if (x + pickerWidth > window.innerWidth - 10) {
      x = window.innerWidth - pickerWidth - 10;
    }
    
    // Убеждаемся, что picker не выходит за левый край экрана
    x = Math.max(10, x);
    
    // Проверяем, помещается ли picker снизу
    if (y + pickerHeight > window.innerHeight - 10) {
      y = Math.max(10, window.innerHeight - pickerHeight - 10);
    }
    
    // Убеждаемся, что picker не выходит за верхний край
    y = Math.max(10, y);
    
    setContextMenuWorkspace({ ...contextMenuWorkspace, x, y });
    setShowIconPicker(true);
  };

  const handleDeleteWorkspace = () => {
    if (contextMenuWorkspace) {
      onWorkspaceDelete(contextMenuWorkspace.id);
      setContextMenuWorkspace(null);
    }
  };

  const handleTabMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onTabClose(tabId);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim() && onSearch) {
      onSearch(searchValue);
      setSearchValue('');
    }
  };

  const handleQuickSiteClick = (url: string) => {
    if (onSearch) {
      onSearch(url);
    }
  };

  return (
    <div 
      ref={sidebarRef}
      className="zen-sidebar"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Window controls (macOS style) */}
      <div className="zen-sidebar__window-controls">
        <button className="zen-window-btn zen-window-btn--close" onClick={() => window.electronAPI.close()} title="Закрыть" />
        <button className="zen-window-btn zen-window-btn--minimize" onClick={() => window.electronAPI.minimize()} title="Свернуть" />
        <button className="zen-window-btn zen-window-btn--maximize" onClick={() => window.electronAPI.maximize()} title="Развернуть" />
      </div>

      {/* Navigation buttons */}
      <div className="zen-sidebar__nav">
        <button className="zen-sidebar__nav-btn" onClick={onBack} disabled={!canGoBack} title="Назад">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button className="zen-sidebar__nav-btn" onClick={onForward} disabled={!canGoForward} title="Вперед">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
        <button className="zen-sidebar__nav-btn" onClick={isLoading ? onStop : onReload} title={isLoading ? "Стоп" : "Обновить"}>
          {isLoading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          )}
        </button>
      </div>

      {/* Search bar */}
      <div className="zen-sidebar__search">
        <svg className="zen-sidebar__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="zen-sidebar__search-input"
          placeholder="Search with Google o..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {/* Quick sites grid */}
      <div className="zen-sidebar__quick-sites">
        {quickSites.map((site, idx) => (
          <button
            key={idx}
            className="zen-sidebar__quick-site"
            onClick={() => handleQuickSiteClick(site.url)}
            title={site.name}
            style={{ '--site-color': site.color } as React.CSSProperties}
          >
            <img 
              src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=32`} 
              alt={site.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </button>
        ))}
      </div>

      {/* Workspaces */}
      <div className="zen-sidebar__workspaces">
        {workspaces.map(ws => {
          const iconKey = ws.icon || 'workspace';
          const IconComponent = WORKSPACE_ICONS[iconKey as keyof typeof WORKSPACE_ICONS] || WORKSPACE_ICONS.workspace;
          
          return (
            <div
              key={ws.id}
              className={`zen-sidebar__workspace ${ws.id === activeWorkspaceId ? 'is-active' : ''}`}
            >
              {editingWorkspaceId === ws.id ? (
                <input
                  ref={editInputRef}
                  className="zen-sidebar__workspace-edit"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename();
                    if (e.key === 'Escape') {
                      setEditingWorkspaceId(null);
                      setEditingName('');
                    }
                  }}
                />
              ) : (
                <button
                  className="zen-sidebar__workspace-btn"
                  onClick={() => onWorkspaceSelect(ws.id)}
                  onContextMenu={(e) => handleContextMenu(e, ws)}
                  title={ws.name}
                >
                  <span className="zen-sidebar__workspace-icon">
                    {IconComponent}
                  </span>
                  <span className="zen-sidebar__workspace-name">{ws.name}</span>
                </button>
              )}
            </div>
          );
        })}
        
        {/* Кнопка создания нового workspace */}
        <button className="zen-sidebar__workspace-add" onClick={onWorkspaceCreate} title="Создать workspace">
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      
      {/* Контекстное меню workspace */}
      {contextMenuWorkspace && (
        <>
          <div 
            className="zen-workspace-context-menu-overlay"
            onClick={() => {
              setContextMenuWorkspace(null);
              setShowIconPicker(false);
            }}
          />
          <div 
            ref={contextMenuRef}
            className="zen-workspace-context-menu"
            style={{ 
              left: `${contextMenuWorkspace.x}px`, 
              top: `${contextMenuWorkspace.y}px` 
            }}
          >
          {showIconPicker ? (
            <div className="zen-workspace-icon-picker">
              <div className="zen-workspace-icon-picker__header">
                <button 
                  className="zen-workspace-icon-picker__back"
                  onClick={() => setShowIconPicker(false)}
                >
                  ←
                </button>
                <span>Выбрать иконку</span>
              </div>
              <div className="zen-workspace-icon-picker__grid">
                {Object.entries(WORKSPACE_ICONS).map(([key, icon]) => (
                  <button
                    key={key}
                    className="zen-workspace-icon-picker__item"
                    onClick={() => handleIconSelect(key)}
                    title={key}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <button 
                className="zen-workspace-context-menu__item"
                onClick={() => {
                  const ws = workspaces.find(w => w.id === contextMenuWorkspace.id);
                  if (ws) handleStartRename(ws);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Переименовать
              </button>
              <button 
                className="zen-workspace-context-menu__item"
                onClick={handleShowIconPicker}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                </svg>
                Изменить иконку
              </button>
              {workspaces.length > 1 && (
                <button 
                  className="zen-workspace-context-menu__item zen-workspace-context-menu__item--danger"
                  onClick={handleDeleteWorkspace}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Удалить
                </button>
              )}
            </>
          )}
          </div>
        </>
      )}

      {/* Tabs list */}
      <div className="zen-sidebar__tabs">
        {tabs.map(tab => {
          // Определяем иконку для внутренних страниц
          const isInternalPage = tab.url?.startsWith('xolo://');
          const getInternalIcon = () => {
            if (tab.url === 'xolo://history') {
              return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              );
            }
            if (tab.url === 'xolo://downloads') {
              return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              );
            }
            if (tab.url === 'xolo://settings') {
              return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              );
            }
            return null;
          };

          return (
            <div
              key={tab.id}
              className={`zen-sidebar__tab ${tab.id === activeTabId ? 'is-active' : ''} ${tab.isFrozen ? 'is-frozen' : ''} ${isInternalPage ? 'is-internal' : ''}`}
              onClick={() => onTabSelect(tab.id)}
              onMouseDown={(e) => handleTabMouseDown(e, tab.id)}
              title={tab.title || 'New Tab'}
            >
              <div className="zen-sidebar__tab-icon">
                {isInternalPage ? (
                  getInternalIcon()
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" />
                ) : tab.isLoading ? (
                  <div className="zen-sidebar__tab-spinner" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>
              <span className="zen-sidebar__tab-title">{tab.title || 'New Tab'}</span>
              <button
                className="zen-sidebar__tab-close"
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          );
        })}
        
        {/* New tab button */}
        <button className="zen-sidebar__new-tab" onClick={onNewTab}>
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>New Tab</span>
        </button>
      </div>

      {/* Bottom toolbar */}
      <div className="zen-sidebar__bottom">
        <button className="zen-sidebar__bottom-btn" onClick={onShowSettings} title="Настройки">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button className="zen-sidebar__bottom-btn" title="Профиль">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
        <button className="zen-sidebar__bottom-btn" onClick={onShowHistory} title="История">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>
        <button className="zen-sidebar__bottom-btn" onClick={onShowDownloads} title="Загрузки">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>

      {/* Resize handle */}
      {onSidebarWidthChange && (
        <div 
          className="zen-sidebar__resize-handle"
          onMouseDown={() => setIsResizing(true)}
          title="Перетащите для изменения ширины"
        />
      )}
    </div>
  );
};

export default ZenSidebar;
