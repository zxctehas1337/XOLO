# Генерация иконок для Tauri

Tauri требует иконки в разных форматах для разных платформ.

## Автоматическая генерация

Используйте официальный инструмент Tauri:

```bash
npm install -g @tauri-apps/cli
cd src-tauri
tauri icon ../public/icon.png
```

Это создаст все необходимые иконки:
- 32x32.png
- 128x128.png
- 128x128@2x.png
- icon.icns (macOS)
- icon.ico (Windows)

## Ручная генерация

Если у вас есть ImageMagick:

```bash
# PNG иконки
convert ../public/icon.png -resize 32x32 32x32.png
convert ../public/icon.png -resize 128x128 128x128.png
convert ../public/icon.png -resize 256x256 128x128@2x.png

# ICO для Windows
convert ../public/icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico

# ICNS для macOS (требует png2icns)
png2icns icon.icns ../public/icon.png
```

## Временное решение

Пока иконки не сгенерированы, приложение будет использовать иконку по умолчанию.
