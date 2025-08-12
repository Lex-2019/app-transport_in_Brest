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
import TransportTypeFilter, { TransportType } from '../components/TransportTypeFilter';
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
  const [selectedTransportType, setSelectedTransportType] = useState<TransportType>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'schedule'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const transportService = TransportService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Сброс активной вкладки при изменении маршрутов
    if (activeTab === 'favorites' && favoriteRoutes.length === 0) {
      setActiveTab('all');
    }
  }, [favoriteRoutes, activeTab]);

  useEffect(() => {
    let filtered = routes;
    
    // Фильтрация по типу транспорта
    if (selectedTransportType !== 'all') {
      filtered = filtered.filter(route => route.type === selectedTransportType);
    }
    
    // Фильтрация по поиску
    if (searchQuery.trim()) {
      filtered = searchRoutesByNumber(filtered, searchQuery);
    }
    
    setFilteredRoutes(filtered);
  }, [searchQuery, routes, selectedTransportType]);

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
      `${route.name}\n\n${route.description || 'Описание маршрута отсутствует'}\n\nТип: ${getTransportTypeText(route.type)}`,
      [
        { text: 'Закрыть', style: 'cancel' },
        { 
          text: 'Расписание', 
          onPress: () => {
            // Переходим к расписанию с предвыбранным маршрутом
            navigation?.navigate('Schedule', { selectedRoute: route });
          } 
        },
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
    setSelectedTransportType('all');
    setActiveTab('favorites');
  };

  const handleShowAllRoutes = () => {
    setFilteredRoutes(routes);
    setSearchQuery('');
    setSelectedTransportType('all');
    setActiveTab('all');
  };

  const handleShowSchedule = () => {
    setActiveTab('schedule');
    navigation?.navigate('Schedule');
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

  const getTransportTypeText = (type: 'bus' | 'trolleybus' | 'minibus') => {
    switch (type) {
      case 'bus':
        return 'Автобус';
      case 'trolleybus':
        return 'Троллейбус';
      case 'minibus':
        return 'Маршрутное такси';
      default:
        return 'Автобус';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
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
            keyboardType="default"
            returnKeyType="search"
            textContentType="none"
            autoComplete="off"
            spellCheck={false}
            multiline={false}
            maxLength={50}
            blurOnSubmit={true}
            onSubmitEditing={handleSearchRoutes}
            enablesReturnKeyAutomatically={true}
            clearButtonMode="while-editing"
            selectTextOnFocus={false}
          />
          <LargeButton
            title="Найти"
            onPress={handleSearchRoutes}
            style={styles.searchButton}
          />
        </View>

        {/* Фильтр по типу транспорта */}
        <TransportTypeFilter
          selectedType={selectedTransportType}
          onTypeSelect={setSelectedTransportType}
        />

        {/* Основные кнопки */}
        <View style={styles.buttonSection}>
          <LargeButton
            title="Все маршруты"
            onPress={handleShowAllRoutes}
            variant={activeTab === 'all' ? 'primary' : 'secondary'}
            style={activeTab === 'all' ? styles.activeMainButton : styles.mainButton}
          />
          
          <LargeButton
            title="Избранные маршруты"
            onPress={handleShowFavorites}
            variant={activeTab === 'favorites' ? 'primary' : 'secondary'}
            style={activeTab === 'favorites' ? styles.activeMainButton : styles.mainButton}
          />
          
          <LargeButton
            title="Расписание остановок"
            onPress={handleShowSchedule}
            variant={activeTab === 'schedule' ? 'primary' : 'secondary'}
            style={activeTab === 'schedule' ? styles.activeMainButton : styles.mainButton}
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
            <>
              <Text style={styles.routesCountText}>
                Найдено маршрутов: {filteredRoutes.length}
              </Text>
              {filteredRoutes.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onPress={() => handleRoutePress(route)}
                  onFavoritePress={() => handleFavoritePress(route)}
                  isFavorite={favoriteRoutes.some(fav => fav.id === route.id)}
                />
              ))}
            </>
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
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: SIZES.padding * 2,
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
  activeMainButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
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
    flex: 1,
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
  routesCountText: {
    fontSize: FONT_SIZES.medium.body,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.margin,
  },
});

export default HomeScreen; 