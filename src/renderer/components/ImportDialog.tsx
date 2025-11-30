import React, { useState } from 'react';
import './ImportDialog.css';

interface ImportDialogProps {
  onClose: () => void;
  onImport: (browser: 'chrome' | 'firefox' | 'edge') => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ onClose, onImport }) => {
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'firefox' | 'edge'>('chrome');

  return (
    <>
      <div className="import-dialog-overlay" onClick={onClose} />
      <div className="import-dialog-container" onClick={onClose}>
        <div className="import-dialog" onClick={e => e.stopPropagation()}>
        <div className="import-header">
          <h2>Импорт данных из другого браузера</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="import-content">
          <p>Выберите браузер для импорта закладок и истории:</p>
          <div className="browser-options">
            <label className={`browser-option ${selectedBrowser === 'chrome' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="browser"
                value="chrome"
                checked={selectedBrowser === 'chrome'}
                onChange={() => setSelectedBrowser('chrome')}
              />
              <div className="browser-icon">🌐</div>
              <span>Google Chrome</span>
            </label>
            <label className={`browser-option ${selectedBrowser === 'firefox' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="browser"
                value="firefox"
                checked={selectedBrowser === 'firefox'}
                onChange={() => setSelectedBrowser('firefox')}
              />
              <div className="browser-icon">🦊</div>
              <span>Mozilla Firefox</span>
            </label>
            <label className={`browser-option ${selectedBrowser === 'edge' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="browser"
                value="edge"
                checked={selectedBrowser === 'edge'}
                onChange={() => setSelectedBrowser('edge')}
              />
              <div className="browser-icon">🌊</div>
              <span>Microsoft Edge</span>
            </label>
          </div>
        </div>
        <div className="import-footer">
          <button onClick={onClose} className="btn-cancel">Отмена</button>
          <button onClick={() => onImport(selectedBrowser)} className="btn-import">Импортировать</button>
        </div>
      </div>
      </div>
    </>
  );
};

export default ImportDialog;
