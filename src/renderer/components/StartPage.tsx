import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Settings } from '../types';
import './StartPage.css';

interface StartPageProps {
  settings: Settings;
  onNavigate: (url: string) => void;
  recentSites?: Array<{ url: string; title: string; favicon?: string }>;
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  location: string;
}

const defaultSites = [
  { name: 'Google', url: 'https://google.com', icon: 'https://www.google.com/favicon.ico' },
  { name: 'YouTube', url: 'https://youtube.com', icon: 'https://www.youtube.com/favicon.ico' },
  { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
  { name: 'Reddit', url: 'https://reddit.com', icon: 'https://www.reddit.com/favicon.ico' },
  { name: 'StackOverFlow', url: 'https://stackoverflow.com', icon: 'https://stackoverflow.com/favicon.ico' }
];

const StartPage: React.FC<StartPageProps> = ({ settings, onNavigate, recentSites = [] }) => {
  const [searchValue, setSearchValue] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchWeather = async () => {
      try {
        // Получаем геолокацию через встроенный API браузера
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // Кэшируем на 5 минут
          });
        });

        if (!mounted) return;

        const { latitude, longitude } = position.coords;

        // Используем open-meteo.com - бесплатный API без ключа
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );

        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          const weatherCode = data.current_weather.weathercode;
          
          // Маппинг кодов погоды на описания и эмодзи
          const weatherMap: Record<number, { desc: string; emoji: string }> = {
            0: { desc: 'Ясно', emoji: '☀️' },
            1: { desc: 'Преимущественно ясно', emoji: '🌤️' },
            2: { desc: 'Переменная облачность', emoji: '⛅' },
            3: { desc: 'Пасмурно', emoji: '☁️' },
            45: { desc: 'Туман', emoji: '🌫️' },
            48: { desc: 'Туман', emoji: '🌫️' },
            51: { desc: 'Морось', emoji: '🌦️' },
            61: { desc: 'Дождь', emoji: '🌧️' },
            71: { desc: 'Снег', emoji: '🌨️' },
            95: { desc: 'Гроза', emoji: '⛈️' },
          };
          
          const weather = weatherMap[weatherCode] || weatherMap[0];
          
          // Получаем название города через обратное геокодирование
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`
          );
          
          if (!mounted) return;
          
          const geoData = await geoResponse.json();
          const location = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Неизвестно';

          setWeather({
            temp: Math.round(data.current_weather.temperature),
            description: weather.desc,
            icon: weather.emoji,
            location: location,
          });
        }
      } catch (error) {
        // Silently fail - weather is optional feature
        if (mounted) {
          console.debug('Weather unavailable:', error instanceof GeolocationPositionError ? 'Location denied' : 'Network error');
        }
      }
    };

    fetchWeather();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onNavigate(searchValue);
    }
  };

  // Функция для получения favicon
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  const displaySites = recentSites.length > 0 
    ? recentSites.slice(0, 8).map(s => ({ 
        name: s.title || new URL(s.url).hostname, 
        url: s.url, 
        icon: s.favicon || getFaviconUrl(s.url)
      }))
    : defaultSites;

  return (
    <div 
      className="start-page"
      style={{
        backgroundImage: settings.wallpaperUrl ? `url(${settings.wallpaperUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="search-container">
        {weather && (
          <div className="weather-widget">
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-info">
              <div className="weather-temp">{weather.temp}°C</div>
              <div className="weather-desc">{weather.description}</div>
              <div className="weather-location">{weather.location}</div>
            </div>
          </div>
        )}
        
        <div className="search-box">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Поиск или введите URL..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            autoFocus
          />
        </div>
      </div>

      {displaySites.length > 0 && (
        <div className="recent-sites">
          <div className="recent-sites-grid">
            {displaySites.map((site, index) => (
              <div
                key={index}
                className="recent-site-item"
                onClick={() => onNavigate(site.url)}
              >
                <div className="recent-site-icon">
                  {site.icon && <img src={site.icon} alt={site.name} onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }} />}
                </div>
                <div className="recent-site-name">{site.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StartPage;
