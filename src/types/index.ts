// Типы данных для приложения "Транспорт Бреста"

export interface Route {
  id: string;
  number: string;
  type: 'bus' | 'trolleybus' | 'minibus';
  name: string;
  description?: string;
  isFavorite?: boolean;
}

export interface Stop {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  routes: Route[];
}

export interface ScheduleItem {
  routeId: string;
  stopId: string;
  time: string; // формат "HH:MM"
  direction: 'forward' | 'backward';
}

export interface Trip {
  id: string;
  routeId: string;
  fromStop: string;
  toStop: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // в минутах
}

export interface NavigationRoute {
  id: string;
  steps: NavigationStep[];
  totalDuration: number;
  totalDistance: number;
}

export interface NavigationStep {
  type: 'walk' | 'transport' | 'wait';
  description: string;
  duration: number;
  distance?: number;
  routeId?: string;
  fromStop?: string;
  toStop?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AppSettings {
  fontSize: 'small' | 'medium' | 'large';
  contrast: 'normal' | 'high';
  voiceEnabled: boolean;
  offlineMode: boolean;
  language: 'ru' | 'be';
}

export interface TransportData {
  routes: Route[];
  stops: Stop[];
  schedules: ScheduleItem[];
  lastUpdated: string;
} 