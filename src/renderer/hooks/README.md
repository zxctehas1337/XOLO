# Wallpaper Hook

## useWallpaper

Хук для автоматической смены обоев в браузере XOLO.

### Особенности:
- Автоматическая смена обоев каждые 10 минут
- Случайный выбор из 6 доступных обоев
- Смена обоев при перезапуске браузера
- Сохранение последних обоев в localStorage для плавного перехода

### Использование:
```tsx
import { useWallpaper } from '../hooks/useWallpaper';

const MyComponent = () => {
  const wallpaper = useWallpaper();
  
  return (
    <div style={{
      backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* content */}
    </div>
  );
};
```

### Обои:
Обои находятся в папке `/public/`:
- walpaper1.jpg
- walpaper2.jpg
- walpaper3.jpg
- walpaper4.jpg
- walpaper5.jpg
- walpaper6.jpg
