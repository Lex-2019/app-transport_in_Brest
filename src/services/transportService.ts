import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransportData, Route, Stop, ScheduleItem } from '../types';
import { API_ENDPOINTS, CACHE_CONFIG } from '../utils/constants';
import { isOnline } from '../utils/helpers';

// Моковые данные для демонстрации
const MOCK_ROUTES: Route[] = [
  {
    id: '1',
    number: '1',
    type: 'bus',
    name: 'Центр - Вулька',
    description: 'Центр города - микрорайон Вулька',
  },
  {
    id: '2',
    number: '2',
    type: 'bus',
    name: 'Центр - Южный',
    description: 'Центр города - микрорайон Южный',
  },
  {
    id: '3',
    number: '3',
    type: 'trolleybus',
    name: 'Центр - Северный',
    description: 'Центр города - микрорайон Северный',
  },
  {
    id: '4',
    number: '4',
    type: 'bus',
    name: 'Вулька - Южный',
    description: 'Микрорайон Вулька - микрорайон Южный',
  },
  {
    id: '5',
    number: '5',
    type: 'trolleybus',
    name: 'Центр - Аэропорт',
    description: 'Центр города - Аэропорт',
  },
];

const MOCK_STOPS: Stop[] = [
  {
    id: '1',
    name: 'Центр',
    coordinates: { latitude: 52.0976, longitude: 23.7341 },
    routes: [MOCK_ROUTES[0], MOCK_ROUTES[1], MOCK_ROUTES[2], MOCK_ROUTES[4]],
  },
  {
    id: '2',
    name: 'Вулька',
    coordinates: { latitude: 52.1023, longitude: 23.7289 },
    routes: [MOCK_ROUTES[0], MOCK_ROUTES[3]],
  },
  {
    id: '3',
    name: 'Южный',
    coordinates: { latitude: 52.0921, longitude: 23.7398 },
    routes: [MOCK_ROUTES[1], MOCK_ROUTES[3]],
  },
  {
    id: '4',
    name: 'Северный',
    coordinates: { latitude: 52.1034, longitude: 23.7412 },
    routes: [MOCK_ROUTES[2]],
  },
  {
    id: '5',
    name: 'Аэропорт',
    coordinates: { latitude: 52.1087, longitude: 23.7156 },
    routes: [MOCK_ROUTES[4]],
  },
];

const MOCK_SCHEDULES: ScheduleItem[] = [
  // Маршрут 1
  { routeId: '1', stopId: '1', time: '06:00', direction: 'forward' },
  { routeId: '1', stopId: '1', time: '06:15', direction: 'forward' },
  { routeId: '1', stopId: '1', time: '06:30', direction: 'forward' },
  { routeId: '1', stopId: '2', time: '06:10', direction: 'forward' },
  { routeId: '1', stopId: '2', time: '06:25', direction: 'forward' },
  { routeId: '1', stopId: '2', time: '06:40', direction: 'forward' },
  
  // Маршрут 2
  { routeId: '2', stopId: '1', time: '06:05', direction: 'forward' },
  { routeId: '2', stopId: '1', time: '06:20', direction: 'forward' },
  { routeId: '2', stopId: '3', time: '06:15', direction: 'forward' },
  { routeId: '2', stopId: '3', time: '06:30', direction: 'forward' },
  
  // Маршрут 3
  { routeId: '3', stopId: '1', time: '06:10', direction: 'forward' },
  { routeId: '3', stopId: '4', time: '06:20', direction: 'forward' },
  
  // Маршрут 4
  { routeId: '4', stopId: '2', time: '06:12', direction: 'forward' },
  { routeId: '4', stopId: '3', time: '06:22', direction: 'forward' },
  
  // Маршрут 5
  { routeId: '5', stopId: '1', time: '06:08', direction: 'forward' },
  { routeId: '5', stopId: '5', time: '06:18', direction: 'forward' },
];

class TransportService {
  private static instance: TransportService;
  private cachedData: TransportData | null = null;
  private lastUpdate: number = 0;

  private constructor() {}

  static getInstance(): TransportService {
    if (!TransportService.instance) {
      TransportService.instance = new TransportService();
    }
    return TransportService.instance;
  }

  // Получение всех маршрутов
  async getRoutes(): Promise<Route[]> {
    const data = await this.getTransportData();
    return data.routes;
  }

  // Получение всех остановок
  async getStops(): Promise<Stop[]> {
    const data = await this.getTransportData();
    return data.stops;
  }

  // Получение расписания
  async getSchedules(): Promise<ScheduleItem[]> {
    const data = await this.getTransportData();
    return data.schedules;
  }

  // Получение избранных маршрутов
  async getFavoriteRoutes(): Promise<Route[]> {
    try {
      const favorites = await AsyncStorage.getItem('favoriteRoutes');
      if (favorites) {
        const favoriteIds = JSON.parse(favorites);
        const allRoutes = await this.getRoutes();
        return allRoutes.filter(route => favoriteIds.includes(route.id));
      }
    } catch (error) {
      console.error('Ошибка при получении избранных маршрутов:', error);
    }
    return [];
  }

  // Добавление маршрута в избранное
  async addToFavorites(routeId: string): Promise<void> {
    try {
      const favorites = await AsyncStorage.getItem('favoriteRoutes');
      const favoriteIds = favorites ? JSON.parse(favorites) : [];
      
      if (!favoriteIds.includes(routeId)) {
        favoriteIds.push(routeId);
        await AsyncStorage.setItem('favoriteRoutes', JSON.stringify(favoriteIds));
      }
    } catch (error) {
      console.error('Ошибка при добавлении в избранное:', error);
    }
  }

  // Удаление маршрута из избранного
  async removeFromFavorites(routeId: string): Promise<void> {
    try {
      const favorites = await AsyncStorage.getItem('favoriteRoutes');
      const favoriteIds = favorites ? JSON.parse(favorites) : [];
      
      const updatedFavorites = favoriteIds.filter((id: string) => id !== routeId);
      await AsyncStorage.setItem('favoriteRoutes', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Ошибка при удалении из избранного:', error);
    }
  }

  // Обновление данных
  async refreshData(): Promise<TransportData> {
    const online = await isOnline();
    
    if (online) {
      try {
        // В реальном приложении здесь был бы запрос к API
        // Пока используем моковые данные
        const newData: TransportData = {
          routes: MOCK_ROUTES,
          stops: MOCK_STOPS,
          schedules: MOCK_SCHEDULES,
          lastUpdated: new Date().toISOString(),
        };
        
        await this.cacheData(newData);
        this.cachedData = newData;
        this.lastUpdate = Date.now();
        
        return newData;
      } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
        throw error;
      }
    } else {
      // Оффлайн режим - возвращаем кэшированные данные
      const cachedData = await this.getCachedData();
      if (cachedData) {
        return cachedData;
      } else {
        throw new Error('Нет подключения к интернету и кэшированных данных');
      }
    }
  }

  // Получение транспортных данных (с кэшированием)
  private async getTransportData(): Promise<TransportData> {
    // Проверяем, нужно ли обновить кэш
    const now = Date.now();
    const cacheAge = now - this.lastUpdate;
    
    if (this.cachedData && cacheAge < CACHE_CONFIG.routesTTL) {
      return this.cachedData;
    }

    // Пытаемся получить кэшированные данные
    const cachedData = await this.getCachedData();
    if (cachedData) {
      this.cachedData = cachedData;
      return cachedData;
    }

    // Если нет кэшированных данных, обновляем
    return await this.refreshData();
  }

  // Кэширование данных
  private async cacheData(data: TransportData): Promise<void> {
    try {
      await AsyncStorage.setItem('transportData', JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка при кэшировании данных:', error);
    }
  }

  // Получение кэшированных данных
  private async getCachedData(): Promise<TransportData | null> {
    try {
      const cached = await AsyncStorage.getItem('transportData');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Ошибка при получении кэшированных данных:', error);
    }
    return null;
  }

  // Проверка статуса обновления данных
  async getLastUpdateTime(): Promise<Date | null> {
    try {
      const cached = await AsyncStorage.getItem('transportData');
      if (cached) {
        const data = JSON.parse(cached);
        return new Date(data.lastUpdated);
      }
    } catch (error) {
      console.error('Ошибка при получении времени обновления:', error);
    }
    return null;
  }
}

export default TransportService; 