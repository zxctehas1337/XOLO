import React from 'react';
import { QUICK_SITES } from '../constants';

interface QuickSitesProps {
  onSiteClick: (url: string) => void;
}

export const QuickSites: React.FC<QuickSitesProps> = ({ onSiteClick }) => {
  return (
    <div className="zen-sidebar__quick-sites">
      {QUICK_SITES.map((site, idx) => (
        <button
          key={idx}
          className="zen-sidebar__quick-site"
          onClick={() => onSiteClick(site.url)}
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
  );
};
