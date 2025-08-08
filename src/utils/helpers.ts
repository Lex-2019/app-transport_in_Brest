import { Route, Stop, ScheduleItem, UserLocation, NavigationRoute, NavigationStep } from '../types';

// Функция для поиска маршрутов по номеру
export const searchRoutesByNumber = (routes: Route[], query: string): Route[] => {
  const searchQuery = query.toLowerCase().trim();
  return routes.filter(route => 
    route.number.toLowerCase().includes(searchQuery) ||
    route.name.toLowerCase().includes(searchQuery)
  );
};

// Функция для поиска остановок по названию
export const searchStopsByName = (stops: Stop[], query: string): Stop[] => {
  const searchQuery = query.toLowerCase().trim();
  return stops.filter(stop => 
    stop.name.toLowerCase().includes(searchQuery)
  );
};

// Функция для получения ближайших остановок к пользователю
export const getNearestStops = (
  stops: Stop[], 
  userLocation: UserLocation, 
  maxDistance: number = 1000 // в метрах
): Stop[] => {
  return stops
    .map(stop => ({
      ...stop,
      distance: calculateDistance(userLocation, stop.coordinates)
    }))
    .filter(stop => stop.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
};

// Функция для расчета расстояния между двумя точками (формула гаверсинуса)
export const calculateDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number => {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Функция для получения расписания для конкретной остановки
export const getScheduleForStop = (
  schedules: ScheduleItem[],
  stopId: string,
  currentTime: string = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
): ScheduleItem[] => {
  return schedules
    .filter(schedule => schedule.stopId === stopId)
    .filter(schedule => schedule.time >= currentTime)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 10); // Показываем только ближайшие 10 отправлений
};

// Функция для форматирования времени
export const formatTime = (time: string): string => {
  return time;
};

// Функция для форматирования расстояния
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)} м`;
  } else {
    return `${(distance / 1000).toFixed(1)} км`;
  }
};

// Функция для форматирования длительности
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} мин`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}мин` : `${hours}ч`;
  }
};

// Функция для создания простого маршрута (прямой маршрут)
export const createSimpleRoute = (
  fromStop: Stop,
  toStop: Stop,
  routes: Route[]
): NavigationRoute | null => {
  // Ищем маршруты, которые проходят через обе остановки
  const directRoutes = routes.filter(route => {
    const fromStopRoutes = fromStop.routes.map(r => r.id);
    const toStopRoutes = toStop.routes.map(r => r.id);
    return fromStopRoutes.includes(route.id) && toStopRoutes.includes(route.id);
  });

  if (directRoutes.length === 0) {
    return null;
  }

  // Берем первый найденный маршрут
  const route = directRoutes[0];
  
  const steps: NavigationStep[] = [
    {
      type: 'walk',
      description: `Идите к остановке "${fromStop.name}"`,
      duration: 2, // Примерное время
    },
    {
      type: 'transport',
      description: `Садитесь на маршрут №${route.number}`,
      duration: 15, // Примерное время
      routeId: route.id,
      fromStop: fromStop.name,
      toStop: toStop.name,
    },
    {
      type: 'walk',
      description: `Идите к месту назначения`,
      duration: 3, // Примерное время
    },
  ];

  return {
    id: `route-${Date.now()}`,
    steps,
    totalDuration: steps.reduce((sum, step) => sum + step.duration, 0),
    totalDistance: calculateDistance(fromStop.coordinates, toStop.coordinates),
  };
};

// Функция для проверки подключения к интернету
export const isOnline = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch {
    return false;
  }
};

// Функция для получения текущего времени в формате HH:MM
export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

// Функция для проверки, является ли время в будущем
export const isTimeInFuture = (time: string): boolean => {
  const currentTime = getCurrentTime();
  return time > currentTime;
}; 