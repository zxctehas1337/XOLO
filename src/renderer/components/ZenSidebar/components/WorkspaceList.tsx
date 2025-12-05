import React, { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Workspace } from '../../../types';
import { ContextMenuPosition } from '../types';
import { 
  WORKSPACE_ICONS, 
  PlusIcon, 
  EditIcon, 
  IconPickerIcon, 
  TrashIcon 
} from '../icons';
import { useTranslation } from '../../../hooks/useTranslation';

interface WorkspaceListProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  style: 'default' | 'compact' | 'minimal';
  onWorkspaceSelect: (id: string) => void;
  onWorkspaceCreate: () => void;
  onWorkspaceDelete: (id: string) => void;
  onWorkspaceRename?: (id: string, name: string) => void;
  onWorkspaceIconChange?: (id: string, icon: string) => void;
  // Edit state
  editingWorkspaceId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  editInputRef: RefObject<HTMLInputElement>;
  onStartRename: (id: string, name: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  // Context menu state
  contextMenuWorkspace: ContextMenuPosition | null;
  showIconPicker: boolean;
  setShowIconPicker: (show: boolean) => void;
  contextMenuRef: RefObject<HTMLDivElement>;
  onOpenContextMenu: (e: React.MouseEvent, workspaceId: string) => void;
  onOpenIconPicker: () => void;
  onCloseContextMenu: () => void;
  language: 'ru' | 'en';
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  activeWorkspaceId,
  style,
  onWorkspaceSelect,
  onWorkspaceCreate,
  onWorkspaceDelete,
  onWorkspaceIconChange,
  editingWorkspaceId,
  editingName,
  setEditingName,
  editInputRef,
  onStartRename,
  onFinishRename,
  onCancelRename,
  contextMenuWorkspace,
  showIconPicker,
  setShowIconPicker,
  contextMenuRef,
  onOpenContextMenu,
  onOpenIconPicker,
  onCloseContextMenu,
  language,
}) => {
  const t = useTranslation(language);
  const handleIconSelect = (iconKey: string) => {
    if (contextMenuWorkspace && onWorkspaceIconChange) {
      onWorkspaceIconChange(contextMenuWorkspace.id, iconKey);
    }
    onCloseContextMenu();
  };

  const handleDeleteWorkspace = () => {
    if (contextMenuWorkspace) {
      onWorkspaceDelete(contextMenuWorkspace.id);
      onCloseContextMenu();
    }
  };

  return (
    <div className="zen-sidebar__workspaces">
      {workspaces.map(ws => {
        const iconKey = ws.icon || 'workspace';
        const IconComponent = WORKSPACE_ICONS[iconKey] || WORKSPACE_ICONS.workspace;
        
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
                onBlur={onFinishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onFinishRename();
                  if (e.key === 'Escape') onCancelRename();
                }}
              />
            ) : (
              <button
                className="zen-sidebar__workspace-btn"
                onClick={() => onWorkspaceSelect(ws.id)}
                onContextMenu={(e) => onOpenContextMenu(e, ws.id)}
                title={ws.name}
              >
                <span className="zen-sidebar__workspace-icon">
                  {IconComponent}
                </span>
                {style !== 'minimal' && (
                  <span className="zen-sidebar__workspace-name">{ws.name}</span>
                )}
              </button>
            )}
          </div>
        );
      })}
      
      <button 
        className="zen-sidebar__workspace-add" 
        onClick={onWorkspaceCreate} 
        title={t.common.newTab}
      >
        <PlusIcon />
      </button>
      
      {/* Context menu - rendered via portal */}
      {contextMenuWorkspace && createPortal(
        <>
          <div 
            className="zen-workspace-context-menu-overlay"
            onClick={onCloseContextMenu}
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
                  <span>{t.common.changeIcon}</span>
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
                    if (ws) {
                      onStartRename(ws.id, ws.name);
                      onCloseContextMenu();
                    }
                  }}
                >
                  <EditIcon />
                  {t.common.rename}
                </button>
                <button 
                  className="zen-workspace-context-menu__item"
                  onClick={onOpenIconPicker}
                >
                  <IconPickerIcon />
                  {t.common.changeIcon}
                </button>
                {workspaces.length > 1 && (
                  <button 
                    className="zen-workspace-context-menu__item zen-workspace-context-menu__item--danger"
                    onClick={handleDeleteWorkspace}
                  >
                    <TrashIcon />
                    {t.common.delete}
                  </button>
                )}
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
