import React from 'react';
import { Tab } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { 
  PlusIcon, 
  CloseIcon, 
  GlobeIcon,
  HistoryTabIcon,
  DownloadsTabIcon,
  SettingsTabIcon,
  HomeTabIcon 
} from '../icons';

interface TabListProps {
  tabs: Tab[];
  activeTabId: string;
  style: 'default' | 'compact' | 'minimal';
  tabCloseButton: 'hover' | 'always' | 'never';
  showTabFavicons: boolean;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  language: 'ru' | 'en';
}

const getInternalIcon = (url?: string) => {
  if (!url) return <HomeTabIcon />; // StartPage
  if (url === 'xolo://history') return <HistoryTabIcon />;
  if (url === 'xolo://downloads') return <DownloadsTabIcon />;
  if (url === 'xolo://settings') return <SettingsTabIcon />;
  return null;
};

export const TabList: React.FC<TabListProps> = ({
  tabs,
  activeTabId,
  style,
  tabCloseButton,
  showTabFavicons,
  onTabSelect,
  onTabClose,
  onNewTab,
  language,
}) => {
  const t = useTranslation(language);

  const handleTabMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onTabClose(tabId);
    }
  };

  return (
    <div className="zen-sidebar__tabs">
      {tabs.map(tab => {
        const isInternalPage = !tab.url || tab.url?.startsWith('xolo://');

        return (
          <div
            key={tab.id}
            className={`zen-sidebar__tab ${tab.id === activeTabId ? 'is-active' : ''} ${tab.isFrozen ? 'is-frozen' : ''} ${isInternalPage ? 'is-internal' : ''}`}
            onClick={() => onTabSelect(tab.id)}
            onMouseDown={(e) => handleTabMouseDown(e, tab.id)}
            title={tab.title || t.common.newTab}
          >
            <div className="zen-sidebar__tab-icon">
              {showTabFavicons && (
                isInternalPage ? (
                  getInternalIcon(tab.url)
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" />
                ) : tab.isLoading ? (
                  <div className="zen-sidebar__tab-spinner" />
                ) : (
                  <GlobeIcon />
                )
              )}
            </div>
            {style !== 'minimal' && (
              <span className="zen-sidebar__tab-title">{tab.title || t.common.newTab}</span>
            )}
            {tabCloseButton !== 'never' && (
              <button
                className={`zen-sidebar__tab-close ${tabCloseButton === 'always' ? 'always-visible' : ''}`}
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
              >
                <CloseIcon />
              </button>
            )}
          </div>
        );
      })}
      
      <button className="zen-sidebar__new-tab" onClick={onNewTab}>
        <PlusIcon />
        <span>{t.common.newTab}</span>
      </button>
    </div>
  );
};
