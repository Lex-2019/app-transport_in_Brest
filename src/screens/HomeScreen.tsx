import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { COLORS, SIZES, FONT_SIZES, APP_NAME } from '../utils/constants';
import LargeButton from '../components/LargeButton';
import RouteCard from '../components/RouteCard';
import TransportService from '../services/transportService';
import { Route } from '../types';
import { searchRoutesByNumber } from '../utils/helpers';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const transportService = TransportService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchRoutesByNumber(routes, searchQuery);
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes(routes);
    }
  }, [searchQuery, routes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRoutes, favorites, updateTime] = await Promise.all([
        transportService.getRoutes(),
        transportService.getFavoriteRoutes(),
        transportService.getLastUpdateTime(),
      ]);
      
      setRoutes(allRoutes);
      setFavoriteRoutes(favorites);
      setLastUpdate(updateTime);
      setFilteredRoutes(allRoutes);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await transportService.refreshData();
      await loadData();
      Alert.alert('Успех', 'Данные обновлены');
    } catch (error) {
      console.error('Ошибка при обновлении:', error);
      Alert.alert('Ошибка', 'Не удалось обновить данные');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoutePress = (route: Route) => {
    Alert.alert(
      `Маршрут №${route.number}`,
      `${route.name}\n\n${route.description || ''}`,
      [
        { text: 'Закрыть', style: 'cancel' },
        { text: 'Подробнее', onPress: () => console.log('Подробнее о маршруте') },
      ]
    );
  };

  const handleFavoritePress = async (route: Route) => {
    try {
      const isFavorite = favoriteRoutes.some(fav => fav.id === route.id);
      
      if (isFavorite) {
        await transportService.removeFromFavorites(route.id);
        setFavoriteRoutes(prev => prev.filter(fav => fav.id !== route.id));
      } else {
        await transportService.addToFavorites(route.id);
        setFavoriteRoutes(prev => [...prev, route]);
      }
    } catch (error) {
      console.error('Ошибка при работе с избранным:', error);
      Alert.alert('Ошибка', 'Не удалось обновить избранное');
    }
  };

  const handleSearchRoutes = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Внимание', 'Введите номер маршрута для поиска');
      return;
    }
    // Поиск уже выполняется автоматически через useEffect
  };

  const handleShowFavorites = () => {
    if (favoriteRoutes.length === 0) {
      Alert.alert('Избранное', 'У вас пока нет избранных маршрутов');
      return;
    }
    setFilteredRoutes(favoriteRoutes);
    setSearchQuery('');
  };

  const handleShowAllRoutes = () => {
    setFilteredRoutes(routes);
    setSearchQuery('');
  };

  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return 'Неизвестно';
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Расписание транспорта</Text>
        </View>

        {/* Поиск */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Введите номер маршрута..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <LargeButton
            title="Найти"
            onPress={handleSearchRoutes}
            style={styles.searchButton}
          />
        </View>

        {/* Основные кнопки */}
        <View style={styles.buttonSection}>
          <LargeButton
            title="Все маршруты"
            onPress={handleShowAllRoutes}
            variant="primary"
            style={styles.mainButton}
          />
          
          <LargeButton
            title="Избранные маршруты"
            onPress={handleShowFavorites}
            variant="secondary"
            style={styles.mainButton}
          />
          
          <LargeButton
            title="Расписание остановок"
            onPress={() => navigation?.navigate('Schedule')}
            variant="secondary"
            style={styles.mainButton}
          />
          
          <LargeButton
            title="Обновить данные"
            onPress={handleRefresh}
            variant="outline"
            style={styles.mainButton}
          />
        </View>

        {/* Информация о последнем обновлении */}
        {lastUpdate && (
          <View style={styles.updateInfo}>
            <Text style={styles.updateText}>
              Последнее обновление: {formatLastUpdate(lastUpdate)}
            </Text>
          </View>
        )}

        {/* Результаты поиска */}
        {searchQuery.trim() && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              Результаты поиска ({filteredRoutes.length})
            </Text>
          </View>
        )}

        {/* Список маршрутов */}
        <View style={styles.routesSection}>
          {loading ? (
            <Text style={styles.loadingText}>Загрузка маршрутов...</Text>
          ) : filteredRoutes.length === 0 ? (
            <Text style={styles.noResultsText}>
              {searchQuery.trim() ? 'Маршруты не найдены' : 'Нет доступных маршрутов'}
            </Text>
          ) : (
            filteredRoutes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                onPress={() => handleRoutePress(route)}
                onFavoritePress={() => handleFavoritePress(route)}
                isFavorite={favoriteRoutes.some(fav => fav.id === route.id)}
              />
            ))
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
  buttonSection: {
    padding: SIZES.padding,
  },
  mainButton: {
    marginBottom: SIZES.margin,
  },
  updateInfo: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.borderRadius,
  },
  updateText: {
    fontSize: FONT_SIZES.small.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resultsSection: {
    paddingHorizontal: SIZES.padding,
    marginTop: SIZES.margin,
  },
  resultsTitle: {
    fontSize: FONT_SIZES.medium.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  routesSection: {
    padding: SIZES.padding,
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
});

export default HomeScreen; 