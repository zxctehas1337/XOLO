export type Language = 'ru' | 'en';

export interface Translations {
  // Settings page
  settings: {
    title: string;
    tabs: {
      appearance: string;
      sidebar: string;
      tabs: string;
      startpage: string;
      privacy: string;
      performance: string;
      advanced: string;
    };
    // Appearance
    search: string;
    searchEngine: string;
    searchEngineDesc: string;
    theme: string;
    colorScheme: string;
    colorSchemeDesc: string;
    themeDark: string;
    themeLight: string;
    accentColor: string;
    accentColorDesc: string;
    fontSize: string;
    fontFamily: string;
    fontFamilyDesc: string;
    fontSystem: string;
    borderRadius: string;
    borderRadiusDesc: string;
    radiusNone: string;
    radiusSmall: string;
    radiusMedium: string;
    radiusLarge: string;
    animations: string;
    animationsDesc: string;
    // Sidebar
    position: string;
    sidebarPosition: string;
    sidebarPositionDesc: string;
    positionLeft: string;
    positionRight: string;
    sidebarStyle: string;
    sidebarStyleDesc: string;
    styleDefault: string;
    styleCompact: string;
    styleMinimal: string;
    autoHide: string;
    autoHideDesc: string;
    sidebarElements: string;
    quickSites: string;
    quickSitesDesc: string;
    workspaces: string;
    workspacesDesc: string;
    navigation: string;
    navigationDesc: string;
    // Tabs
    tabsAppearance: string;
    tabStyle: string;
    tabStyleDesc: string;
    tabStyleDefault: string;
    tabStyleCompact: string;
    tabStylePills: string;
    showIcons: string;
    showIconsDesc: string;
    closeButton: string;
    closeButtonDesc: string;
    closeOnHover: string;
    closeAlways: string;
    closeNever: string;
    tabPreviews: string;
    tabPreviewsDesc: string;
    // Start page
    background: string;
    wallpaper: string;
    wallpaperDesc: string;
    backgroundBlur: string;
    backgroundDim: string;
    widgets: string;
    clock: string;
    clockDesc: string;
    timeFormat: string;
    timeFormatDesc: string;
    format24h: string;
    format12h: string;
    weather: string;
    weatherDesc: string;
    searchWidget: string;
    searchWidgetDesc: string;
    quickSitesWidget: string;
    quickSitesWidgetDesc: string;
    quickSitesView: string;
    quickSitesViewDesc: string;
    viewGrid: string;
    viewList: string;
    viewCompact: string;
    // Privacy
    protection: string;
    adBlock: string;
    adBlockDesc: string;
    trackingProtection: string;
    trackingProtectionDesc: string;
    httpsOnly: string;
    httpsOnlyDesc: string;
    data: string;
    clearOnExit: string;
    clearOnExitDesc: string;
    // Performance
    acceleration: string;
    hardwareAcceleration: string;
    hardwareAccelerationDesc: string;
    smoothScrolling: string;
    smoothScrollingDesc: string;
    preloadPages: string;
    preloadPagesDesc: string;
    memory: string;
    tabSuspension: string;
    tabSuspensionDesc: string;
    suspensionTimeout: string;
    suspensionTimeoutDesc: string;
    // Advanced
    interface: string;
    bookmarksBar: string;
    bookmarksBarDesc: string;
    readerMode: string;
    readerModeDesc: string;
    language: string;
    languageDesc: string;
    notifications: string;
    sounds: string;
    soundsDesc: string;
    notificationsEnabled: string;
    notificationsEnabledDesc: string;
    aboutBrowser: string;
    version: string;
    copyright: string;
  };
  // Common
  common: {
    yandex: string;
    newTab: string;
    home: string;
    history: string;
    downloads: string;
    settings: string;
    today: string;
    yesterday: string;
    noTitle: string;
    search: string;
    searchPlaceholder: string;
    clear: string;
    clearHistory: string;
    historyEmpty: string;
    downloadsEmpty: string;
    completed: string;
    cancelled: string;
    interrupted: string;
    cancel: string;
    open: string;
    showInFolder: string;
    clearCompleted: string;
    rename: string;
    changeIcon: string;
    delete: string;
    profile: string;
    frozen: string;
    unfreeze: string;
    frozenForMemory: string;
  };
}

export const translations: Record<Language, Translations> = {
  ru: {
    settings: {
      title: 'Настройки',
      tabs: {
        appearance: 'Внешний вид',
        sidebar: 'Сайдбар',
        tabs: 'Вкладки',
        startpage: 'Стартовая',
        privacy: 'Приватность',
        performance: 'Производительность',
        advanced: 'Дополнительно',
      },
      // Appearance
      search: 'Поиск',
      searchEngine: 'Поисковая система',
      searchEngineDesc: 'Выберите поисковую систему для адресной строки',
      theme: 'Тема',
      colorScheme: 'Цветовая схема',
      colorSchemeDesc: 'Выберите тему оформления',
      themeDark: 'Тёмная',
      themeLight: 'Светлая',
      accentColor: 'Акцентный цвет',
      accentColorDesc: 'Основной цвет интерфейса',
      fontSize: 'Размер шрифта',
      fontFamily: 'Шрифт интерфейса',
      fontFamilyDesc: 'Выберите шрифт для всего браузера',
      fontSystem: 'Системный',
      borderRadius: 'Скругление углов',
      borderRadiusDesc: 'Радиус скругления элементов',
      radiusNone: 'Нет',
      radiusSmall: 'Мало',
      radiusMedium: 'Средне',
      radiusLarge: 'Много',
      animations: 'Анимации',
      animationsDesc: 'Включить плавные анимации интерфейса',
      // Sidebar
      position: 'Расположение',
      sidebarPosition: 'Позиция сайдбара',
      sidebarPositionDesc: 'Выберите сторону экрана для сайдбара',
      positionLeft: 'Слева',
      positionRight: 'Справа',
      sidebarStyle: 'Стиль сайдбара',
      sidebarStyleDesc: 'Внешний вид боковой панели',
      styleDefault: 'Стандартный',
      styleCompact: 'Компактный',
      styleMinimal: 'Минимальный',
      autoHide: 'Автоскрытие',
      autoHideDesc: 'Скрывать сайдбар когда он не используется',
      sidebarElements: 'Элементы сайдбара',
      quickSites: 'Быстрые сайты',
      quickSitesDesc: 'Показывать сетку быстрого доступа',
      workspaces: 'Рабочие пространства',
      workspacesDesc: 'Показывать список воркспейсов',
      navigation: 'Навигация',
      navigationDesc: 'Показывать кнопки навигации',
      // Tabs
      tabsAppearance: 'Внешний вид вкладок',
      tabStyle: 'Стиль вкладок',
      tabStyleDesc: 'Выберите внешний вид вкладок',
      tabStyleDefault: 'Стандартный',
      tabStyleCompact: 'Компактный',
      tabStylePills: 'Пилюли',
      showIcons: 'Показывать иконки',
      showIconsDesc: 'Отображать favicon сайтов во вкладках',
      closeButton: 'Кнопка закрытия',
      closeButtonDesc: 'Когда показывать кнопку закрытия вкладки',
      closeOnHover: 'При наведении',
      closeAlways: 'Всегда',
      closeNever: 'Никогда',
      tabPreviews: 'Превью вкладок',
      tabPreviewsDesc: 'Показывать миниатюры при наведении',
      // Start page
      background: 'Фон',
      wallpaper: 'Обои',
      wallpaperDesc: 'Выберите фоновое изображение',
      backgroundBlur: 'Размытие фона',
      backgroundDim: 'Затемнение фона',
      widgets: 'Виджеты',
      clock: 'Часы',
      clockDesc: 'Показывать время на стартовой странице',
      timeFormat: 'Формат времени',
      timeFormatDesc: '12-часовой или 24-часовой формат',
      format24h: '24 часа',
      format12h: '12 часов',
      weather: 'Погода',
      weatherDesc: 'Показывать виджет погоды',
      searchWidget: 'Поиск',
      searchWidgetDesc: 'Показывать строку поиска',
      quickSitesWidget: 'Быстрые сайты',
      quickSitesWidgetDesc: 'Показывать часто посещаемые сайты',
      quickSitesView: 'Вид быстрых сайтов',
      quickSitesViewDesc: 'Как отображать быстрые сайты',
      viewGrid: 'Сетка',
      viewList: 'Список',
      viewCompact: 'Компактный',
      // Privacy
      protection: 'Защита',
      adBlock: 'Блокировка рекламы',
      adBlockDesc: 'Блокировать рекламу и трекеры',
      trackingProtection: 'Защита от отслеживания',
      trackingProtectionDesc: 'Блокировать скрипты отслеживания',
      httpsOnly: 'Только HTTPS',
      httpsOnlyDesc: 'Предупреждать о небезопасных сайтах',
      data: 'Данные',
      clearOnExit: 'Очищать при выходе',
      clearOnExitDesc: 'Удалять историю и кэш при закрытии браузера',
      // Performance
      acceleration: 'Ускорение',
      hardwareAcceleration: 'Аппаратное ускорение',
      hardwareAccelerationDesc: 'Использовать GPU для рендеринга',
      smoothScrolling: 'Плавная прокрутка',
      smoothScrollingDesc: 'Анимированная прокрутка страниц',
      preloadPages: 'Предзагрузка страниц',
      preloadPagesDesc: 'Загружать ссылки заранее',
      memory: 'Память',
      tabSuspension: 'Заморозка вкладок',
      tabSuspensionDesc: 'Выгружать неактивные вкладки из памяти',
      suspensionTimeout: 'Таймаут заморозки',
      suspensionTimeoutDesc: 'минут',
      // Advanced
      interface: 'Интерфейс',
      bookmarksBar: 'Панель закладок',
      bookmarksBarDesc: 'Показывать панель закладок',
      readerMode: 'Режим чтения',
      readerModeDesc: 'Включить режим чтения для статей',
      language: 'Язык интерфейса',
      languageDesc: 'Выберите язык браузера',
      notifications: 'Уведомления',
      sounds: 'Звуки',
      soundsDesc: 'Воспроизводить звуки уведомлений',
      notificationsEnabled: 'Уведомления',
      notificationsEnabledDesc: 'Показывать системные уведомления',
      aboutBrowser: 'О браузере',
      version: 'Версия',
      copyright: '© 2024 Xolo Team',
    },
    common: {
      yandex: 'Яндекс',
      newTab: 'Новая вкладка',
      home: 'Главная',
      history: 'История',
      downloads: 'Загрузки',
      settings: 'Настройки',
      today: 'Сегодня',
      yesterday: 'Вчера',
      noTitle: 'Без названия',
      search: 'Поиск',
      searchPlaceholder: 'Поиск в истории...',
      clear: 'Очистить',
      clearHistory: 'Очистить историю',
      historyEmpty: 'История пуста',
      downloadsEmpty: 'Нет загрузок',
      completed: 'Завершено',
      cancelled: 'Отменено',
      interrupted: 'Прервано',
      cancel: 'Отменить',
      open: 'Открыть',
      showInFolder: 'Показать в папке',
      clearCompleted: 'Очистить завершенные',
      rename: 'Переименовать',
      changeIcon: 'Изменить иконку',
      delete: 'Удалить',
      profile: 'Профиль',
      frozen: 'Вкладка заморожена',
      unfreeze: 'Разморозить',
      frozenForMemory: 'Вкладка заморожена для экономии памяти',
    },
  },
  en: {
    settings: {
      title: 'Settings',
      tabs: {
        appearance: 'Appearance',
        sidebar: 'Sidebar',
        tabs: 'Tabs',
        startpage: 'Start Page',
        privacy: 'Privacy',
        performance: 'Performance',
        advanced: 'Advanced',
      },
      // Appearance
      search: 'Search',
      searchEngine: 'Search Engine',
      searchEngineDesc: 'Choose search engine for address bar',
      theme: 'Theme',
      colorScheme: 'Color Scheme',
      colorSchemeDesc: 'Choose interface theme',
      themeDark: 'Dark',
      themeLight: 'Light',
      accentColor: 'Accent Color',
      accentColorDesc: 'Main interface color',
      fontSize: 'Font Size',
      fontFamily: 'Interface Font',
      fontFamilyDesc: 'Choose font for the browser',
      fontSystem: 'System',
      borderRadius: 'Border Radius',
      borderRadiusDesc: 'Element corner radius',
      radiusNone: 'None',
      radiusSmall: 'Small',
      radiusMedium: 'Medium',
      radiusLarge: 'Large',
      animations: 'Animations',
      animationsDesc: 'Enable smooth interface animations',
      // Sidebar
      position: 'Position',
      sidebarPosition: 'Sidebar Position',
      sidebarPositionDesc: 'Choose screen side for sidebar',
      positionLeft: 'Left',
      positionRight: 'Right',
      sidebarStyle: 'Sidebar Style',
      sidebarStyleDesc: 'Sidebar appearance',
      styleDefault: 'Default',
      styleCompact: 'Compact',
      styleMinimal: 'Minimal',
      autoHide: 'Auto Hide',
      autoHideDesc: 'Hide sidebar when not in use',
      sidebarElements: 'Sidebar Elements',
      quickSites: 'Quick Sites',
      quickSitesDesc: 'Show quick access grid',
      workspaces: 'Workspaces',
      workspacesDesc: 'Show workspaces list',
      navigation: 'Navigation',
      navigationDesc: 'Show navigation buttons',
      // Tabs
      tabsAppearance: 'Tabs Appearance',
      tabStyle: 'Tab Style',
      tabStyleDesc: 'Choose tabs appearance',
      tabStyleDefault: 'Default',
      tabStyleCompact: 'Compact',
      tabStylePills: 'Pills',
      showIcons: 'Show Icons',
      showIconsDesc: 'Display site favicons in tabs',
      closeButton: 'Close Button',
      closeButtonDesc: 'When to show tab close button',
      closeOnHover: 'On Hover',
      closeAlways: 'Always',
      closeNever: 'Never',
      tabPreviews: 'Tab Previews',
      tabPreviewsDesc: 'Show thumbnails on hover',
      // Start page
      background: 'Background',
      wallpaper: 'Wallpaper',
      wallpaperDesc: 'Choose background image',
      backgroundBlur: 'Background Blur',
      backgroundDim: 'Background Dim',
      widgets: 'Widgets',
      clock: 'Clock',
      clockDesc: 'Show time on start page',
      timeFormat: 'Time Format',
      timeFormatDesc: '12-hour or 24-hour format',
      format24h: '24 hours',
      format12h: '12 hours',
      weather: 'Weather',
      weatherDesc: 'Show weather widget',
      searchWidget: 'Search',
      searchWidgetDesc: 'Show search bar',
      quickSitesWidget: 'Quick Sites',
      quickSitesWidgetDesc: 'Show frequently visited sites',
      quickSitesView: 'Quick Sites View',
      quickSitesViewDesc: 'How to display quick sites',
      viewGrid: 'Grid',
      viewList: 'List',
      viewCompact: 'Compact',
      // Privacy
      protection: 'Protection',
      adBlock: 'Ad Blocker',
      adBlockDesc: 'Block ads and trackers',
      trackingProtection: 'Tracking Protection',
      trackingProtectionDesc: 'Block tracking scripts',
      httpsOnly: 'HTTPS Only',
      httpsOnlyDesc: 'Warn about insecure sites',
      data: 'Data',
      clearOnExit: 'Clear on Exit',
      clearOnExitDesc: 'Delete history and cache when closing browser',
      // Performance
      acceleration: 'Acceleration',
      hardwareAcceleration: 'Hardware Acceleration',
      hardwareAccelerationDesc: 'Use GPU for rendering',
      smoothScrolling: 'Smooth Scrolling',
      smoothScrollingDesc: 'Animated page scrolling',
      preloadPages: 'Preload Pages',
      preloadPagesDesc: 'Load links in advance',
      memory: 'Memory',
      tabSuspension: 'Tab Suspension',
      tabSuspensionDesc: 'Unload inactive tabs from memory',
      suspensionTimeout: 'Suspension Timeout',
      suspensionTimeoutDesc: 'minutes',
      // Advanced
      interface: 'Interface',
      bookmarksBar: 'Bookmarks Bar',
      bookmarksBarDesc: 'Show bookmarks bar',
      readerMode: 'Reader Mode',
      readerModeDesc: 'Enable reader mode for articles',
      language: 'Interface Language',
      languageDesc: 'Choose browser language',
      notifications: 'Notifications',
      sounds: 'Sounds',
      soundsDesc: 'Play notification sounds',
      notificationsEnabled: 'Notifications',
      notificationsEnabledDesc: 'Show system notifications',
      aboutBrowser: 'About Browser',
      version: 'Version',
      copyright: '© 2025 Xolo Team',
    },
    common: {
      yandex: 'Yandex',
      newTab: 'New Tab',
      home: 'Home',
      history: 'History',
      downloads: 'Downloads',
      settings: 'Settings',
      today: 'Today',
      yesterday: 'Yesterday',
      noTitle: 'No Title',
      search: 'Search',
      searchPlaceholder: 'Search in history...',
      clear: 'Clear',
      clearHistory: 'Clear History',
      historyEmpty: 'History is empty',
      downloadsEmpty: 'No downloads',
      completed: 'Completed',
      cancelled: 'Cancelled',
      interrupted: 'Interrupted',
      cancel: 'Cancel',
      open: 'Open',
      showInFolder: 'Show in Folder',
      clearCompleted: 'Clear Completed',
      rename: 'Rename',
      changeIcon: 'Change Icon',
      delete: 'Delete',
      profile: 'Profile',
      frozen: 'Tab is frozen',
      unfreeze: 'Unfreeze',
      frozenForMemory: 'Tab frozen to save memory',
    },
  },
};
