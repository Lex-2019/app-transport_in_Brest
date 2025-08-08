// Константы приложения "Транспорт Бреста"

export const APP_NAME = 'Транспорт Бреста';
export const APP_VERSION = '1.0.0';

// Цвета для пожилых пользователей (высокий контраст)
export const COLORS = {
  primary: '#FF6B35', // Оранжевый - хорошо видимый
  secondary: '#2E86AB', // Синий
  background: '#FFFFFF', // Белый фон
  surface: '#F8F9FA', // Светло-серый
  text: '#1A1A1A', // Почти черный текст
  textSecondary: '#666666', // Серый текст
  error: '#DC3545', // Красный для ошибок
  success: '#28A745', // Зеленый для успеха
  warning: '#FFC107', // Желтый для предупреждений
  disabled: '#CCCCCC', // Серый для неактивных элементов
  border: '#E0E0E0', // Светло-серый для границ
};

// Размеры шрифтов для пожилых пользователей
export const FONT_SIZES = {
  small: {
    title: 20,
    subtitle: 18,
    body: 16,
    caption: 14,
  },
  medium: {
    title: 24,
    subtitle: 20,
    body: 18,
    caption: 16,
  },
  large: {
    title: 28,
    subtitle: 24,
    body: 22,
    caption: 20,
  },
};

// Размеры кнопок и элементов для удобства пожилых пользователей
export const SIZES = {
  buttonHeight: 56, // Высокие кнопки для удобства нажатия
  inputHeight: 48,
  iconSize: 24,
  padding: 16,
  margin: 12,
  borderRadius: 8,
};

// Настройки геолокации
export const LOCATION_CONFIG = {
  timeout: 10000, // 10 секунд
  maximumAge: 60000, // 1 минута
  enableHighAccuracy: true,
  distanceFilter: 10, // 10 метров
};

// API endpoints
export const API_ENDPOINTS = {
  baseUrl: 'https://brestgortrans.by',
  routes: '/api/routes',
  stops: '/api/stops',
  schedule: '/api/schedule',
};

// Настройки кэширования
export const CACHE_CONFIG = {
  routesTTL: 24 * 60 * 60 * 1000, // 24 часа
  scheduleTTL: 60 * 60 * 1000, // 1 час
  locationTTL: 5 * 60 * 1000, // 5 минут
};

// Сообщения для голосового сопровождения
export const VOICE_MESSAGES = {
  welcome: 'Добро пожаловать в приложение Транспорт Бреста',
  routeFound: 'Найден маршрут',
  noRouteFound: 'Маршрут не найден',
  locationError: 'Ошибка определения местоположения',
  networkError: 'Ошибка сети',
  offlineMode: 'Режим оффлайн',
}; 