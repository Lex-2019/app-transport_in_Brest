import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES, FONT_SIZES } from '../utils/constants';
import LargeButton from '../components/LargeButton';
import TransportService from '../services/transportService';
import { Stop, ScheduleItem } from '../types';
import { searchStopsByName, getScheduleForStop, formatTime } from '../utils/helpers';

interface ScheduleScreenProps {
  navigation?: any;
}

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation }) => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [stopSchedules, setStopSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const transportService = TransportService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchStopsByName(stops, searchQuery);
      setFilteredStops(filtered);
    } else {
      setFilteredStops(stops);
    }
  }, [searchQuery, stops]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allStops, allSchedules] = await Promise.all([
        transportService.getStops(),
        transportService.getSchedules(),
      ]);
      
      setStops(allStops);
      setSchedules(allSchedules);
      setFilteredStops(allStops);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные остановок');
    } finally {
      setLoading(false);
    }
  };

  const handleStopPress = (stop: Stop) => {
    setSelectedStop(stop);
    const stopSchedules = getScheduleForStop(schedules, stop.id);
    setStopSchedules(stopSchedules);
  };

  const handleBackToStops = () => {
    setSelectedStop(null);
    setStopSchedules([]);
  };

  const handleSearchStops = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Внимание', 'Введите название остановки для поиска');
      return;
    }
    // Поиск уже выполняется автоматически через useEffect
  };

  const getRouteInfo = (routeId: string) => {
    const route = stops.flatMap(stop => stop.routes).find(r => r.id === routeId);
    return route;
  };

  const getTransportIcon = (type: string) => {
    return type === 'bus' ? '🚌' : '🚎';
  };

  const getTransportColor = (type: string) => {
    return type === 'bus' ? COLORS.primary : COLORS.secondary;
  };

  const renderStopItem = (stop: Stop) => (
    <TouchableOpacity
      key={stop.id}
      style={styles.stopItem}
      onPress={() => handleStopPress(stop)}
      activeOpacity={0.8}
    >
      <View style={styles.stopHeader}>
        <Text style={styles.stopName}>{stop.name}</Text>
        <Text style={styles.routesCount}>
          {stop.routes.length} маршрут(ов)
        </Text>
      </View>
      <View style={styles.routesPreview}>
        {stop.routes.slice(0, 3).map(route => (
          <View
            key={route.id}
            style={[styles.routeBadge, { backgroundColor: getTransportColor(route.type) }]}
          >
            <Text style={styles.routeNumber}>{route.number}</Text>
            <Text style={styles.routeIcon}>{getTransportIcon(route.type)}</Text>
          </View>
        ))}
        {stop.routes.length > 3 && (
          <Text style={styles.moreRoutes}>+{stop.routes.length - 3}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderScheduleItem = (schedule: ScheduleItem) => {
    const route = getRouteInfo(schedule.routeId);
    if (!route) return null;

    return (
      <View key={`${schedule.routeId}-${schedule.time}`} style={styles.scheduleItem}>
        <View style={styles.scheduleHeader}>
          <View style={[styles.routeBadge, { backgroundColor: getTransportColor(route.type) }]}>
            <Text style={styles.routeNumber}>{route.number}</Text>
            <Text style={styles.routeIcon}>{getTransportIcon(route.type)}</Text>
          </View>
          <Text style={styles.routeName}>{route.name}</Text>
        </View>
        <View style={styles.scheduleTime}>
          <Text style={styles.timeText}>{formatTime(schedule.time)}</Text>
          <Text style={styles.directionText}>
            {schedule.direction === 'forward' ? '→' : '←'}
          </Text>
        </View>
      </View>
    );
  };

  if (selectedStop) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Заголовок с кнопкой назад */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToStops}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Назад</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Расписание</Text>
          </View>

          {/* Информация об остановке */}
          <View style={styles.stopInfo}>
            <Text style={styles.stopTitle}>{selectedStop.name}</Text>
            <Text style={styles.stopSubtitle}>
              {selectedStop.routes.length} маршрут(ов)
            </Text>
          </View>

          {/* Расписание */}
          <View style={styles.scheduleSection}>
            <Text style={styles.scheduleTitle}>Ближайшие отправления:</Text>
            
            {stopSchedules.length === 0 ? (
              <Text style={styles.noScheduleText}>
                Нет отправлений в ближайшее время
              </Text>
            ) : (
              stopSchedules.map(renderScheduleItem)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>Остановки</Text>
          <Text style={styles.subtitle}>Выберите остановку для просмотра расписания</Text>
        </View>

        {/* Поиск */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Введите название остановки..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <LargeButton
            title="Найти"
            onPress={handleSearchStops}
            style={styles.searchButton}
          />
        </View>

        {/* Список остановок */}
        <View style={styles.stopsSection}>
          {loading ? (
            <Text style={styles.loadingText}>Загрузка остановок...</Text>
          ) : filteredStops.length === 0 ? (
            <Text style={styles.noResultsText}>
              {searchQuery.trim() ? 'Остановки не найдены' : 'Нет доступных остановок'}
            </Text>
          ) : (
            filteredStops.map(renderStopItem)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SIZES.padding,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  backButton: {
    position: 'absolute',
    left: SIZES.padding,
    top: SIZES.padding,
    padding: SIZES.padding / 2,
  },
  backButtonText: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.background,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT_SIZES.large.title,
    fontWeight: 'bold',
    color: COLORS.background,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.background,
    textAlign: 'center',
    marginTop: 4,
  },
  searchSection: {
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: SIZES.inputHeight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SIZES.padding,
    fontSize: FONT_SIZES.medium.body,
    backgroundColor: COLORS.surface,
    marginRight: SIZES.margin,
  },
  searchButton: {
    minWidth: 100,
  },
  stopsSection: {
    padding: SIZES.padding,
  },
  stopItem: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  stopName: {
    fontSize: FONT_SIZES.medium.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  routesCount: {
    fontSize: FONT_SIZES.small.caption,
    color: COLORS.textSecondary,
  },
  routesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding / 2,
    paddingVertical: 4,
    borderRadius: SIZES.borderRadius,
    marginRight: SIZES.margin / 2,
    marginBottom: SIZES.margin / 2,
  },
  routeNumber: {
    fontSize: FONT_SIZES.small.body,
    fontWeight: 'bold',
    color: COLORS.background,
    marginRight: 2,
  },
  routeIcon: {
    fontSize: FONT_SIZES.small.body,
  },
  moreRoutes: {
    fontSize: FONT_SIZES.small.caption,
    color: COLORS.textSecondary,
  },
  stopInfo: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    margin: SIZES.padding,
    borderRadius: SIZES.borderRadius,
  },
  stopTitle: {
    fontSize: FONT_SIZES.large.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  stopSubtitle: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  scheduleSection: {
    padding: SIZES.padding,
  },
  scheduleTitle: {
    fontSize: FONT_SIZES.medium.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  scheduleItem: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  routeName: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.text,
    marginLeft: SIZES.margin,
    flex: 1,
  },
  scheduleTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: FONT_SIZES.large.body,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  directionText: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.textSecondary,
  },
  loadingText: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SIZES.padding * 2,
  },
  noResultsText: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SIZES.padding * 2,
  },
  noScheduleText: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SIZES.padding * 2,
  },
});

export default ScheduleScreen; 