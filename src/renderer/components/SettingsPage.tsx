import React from 'react';
import { Settings } from '../types';
import { GoogleAuth } from './GoogleAuth';
import './SettingsPage.css';

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdate }) => {
  const wallpaperPresets = [
    '/walpaper1.jpg',
    '/walpaper2.jpg',
    '/walpaper3.jpg',
    '/walpaper4.jpg',
    '/walpaper5.jpg',
    '/walpaper6.jpg',
  ];

  const searchEngines = [
    {
      id: 'google',
      name: 'Google',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )
    },
    {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      icon: (
        <svg width="24" height="24" viewBox="0 0 192 192" fill="none">
          <circle cx="96" cy="96" r="74" fill="#DE5833" stroke="#DE5833" strokeWidth="8"/>
          <path d="M80 166 L64.844 94.354 C61.318 77.686 74.033 62 91.07 62 C103.371 62 114.093 70.372 117.076 82.305 L118 86 C124 114 90 100 98 126 C106 152 114 164 114 164" stroke="#FFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M90 62 C88 54 80 50 72 50" stroke="#FFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M118 100 C124 100 132 98 138 94" stroke="#FFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M104 112 C110 116 120 118 131 116" stroke="#FFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'bing',
      name: 'Bing',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 3v18l5-3 7 4V6.5L9 9.5V7l8-4H5z" fill="url(#bingGradient)"/>
          <defs>
            <linearGradient id="bingGradient" x1="5" y1="3" x2="17" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#37BDFF"/>
              <stop offset="0.18" stopColor="#33BFFD"/>
              <stop offset="0.36" stopColor="#28C5F5"/>
              <stop offset="0.53" stopColor="#15D0E7"/>
              <stop offset="0.55" stopColor="#12D1E5"/>
              <stop offset="0.59" stopColor="#1CD2E5"/>
              <stop offset="1" stopColor="#30D6E5"/>
            </linearGradient>
          </defs>
        </svg>
      )
    }
  ];

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1>Настройки</h1>
      </div>

      <div className="settings-page-content">
        <div className="settings-page-section">
          <h2>Поиск</h2>
          <div className="settings-page-item search-engine-item">
            <div className="settings-page-item-info">
              <label>Поисковая система по умолчанию</label>
              <span>Выберите поисковую систему для адресной строки</span>
            </div>
            <div className="search-engine-selector">
              {searchEngines.map((engine) => (
                <button
                  key={engine.id}
                  className={`search-engine-option ${settings.searchEngine === engine.id ? 'active' : ''}`}
                  onClick={() => onUpdate({ searchEngine: engine.id as Settings['searchEngine'] })}
                  title={engine.name}
                >
                  {engine.icon}
                  <span>{engine.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-page-section">
          <h2>Внешний вид</h2>
          <div className="settings-page-item">
            <div className="settings-page-item-info">
              <label>Акцентный цвет</label>
              <span>Основной цвет интерфейса</span>
            </div>
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
            />
          </div>
          <div className="settings-page-item">
            <div className="settings-page-item-info">
              <label>Размер шрифта</label>
              <span>Размер текста в интерфейсе: {settings.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="18"
              value={settings.fontSize}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="settings-page-section">
          <h2>Стартовая страница</h2>
          <div className="settings-page-item wallpaper-item">
            <div className="settings-page-item-info">
              <label>Обои</label>
              <span>Выберите одно из предустановленных изображений</span>
            </div>
            <div className="wallpaper-presets-grid">
              {wallpaperPresets.map((url, idx) => (
                <button
                  key={idx}
                  className={`wallpaper-preset-btn ${settings.wallpaperUrl === url ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${url})` }}
                  onClick={() => onUpdate({ wallpaperUrl: url })}
                />
              ))}
            </div>
          </div>
          <div className="settings-page-item toggle-item">
            <div className="settings-page-item-info">
              <label>Показывать погоду</label>
              <span>Отображать виджет погоды на стартовой странице</span>
            </div>
            <button
              className={`settings-toggle ${settings.showWeather ? 'active' : ''}`}
              onClick={() => onUpdate({ showWeather: !settings.showWeather })}
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </div>

        <div className="settings-page-section">
          <h2>Аккаунт</h2>
          <div className="settings-page-item">
            <div className="settings-page-item-info">
              <label>Google аккаунт</label>
              <span>Войдите для синхронизации закладок и настроек</span>
            </div>
            <GoogleAuth onAuthChange={(user) => {
              console.log('Auth changed:', user);
            }} />
          </div>
          
          <div className="settings-info-box">
            <div className="settings-info-icon"></div>
            <div className="settings-info-content">
              <strong></strong>
              <p>
              </p>
            </div>
          </div>
        </div>

        <div className="settings-page-section">
          <h2>Приватность</h2>
          <div className="settings-page-item toggle-item">
            <div className="settings-page-item-info">
              <label>Блокировка рекламы</label>
              <span>Блокировать рекламу и трекеры на веб-страницах</span>
            </div>
            <button
              className={`settings-toggle ${settings.adBlockEnabled ? 'active' : ''}`}
              onClick={() => onUpdate({ adBlockEnabled: !settings.adBlockEnabled })}
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
