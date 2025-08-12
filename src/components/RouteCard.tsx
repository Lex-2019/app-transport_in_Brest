import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS, SIZES, FONT_SIZES } from '../utils/constants';
import { Route } from '../types';

interface RouteCardProps {
  route: Route;
  onPress: () => void;
  onFavoritePress: () => void;
  isFavorite: boolean;
  style?: ViewStyle;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onPress,
  onFavoritePress,
  isFavorite,
  style,
}) => {
  const getTransportIcon = (type: 'bus' | 'trolleybus' | 'minibus') => {
    switch (type) {
      case 'bus':
        return '🚌';
      case 'trolleybus':
        return '🚎';
      case 'minibus':
        return '🚐';
      default:
        return '🚌';
    }
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
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeNumber}>№{route.number}</Text>
            <Text style={styles.transportIcon}>
              {getTransportIcon(route.type)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && styles.favoriteActive]}
            onPress={onFavoritePress}
            activeOpacity={0.7}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.transportType}>
            {getTransportTypeText(route.type)}
          </Text>
          {route.description && (
            <Text style={styles.description}>{route.description}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    fontSize: FONT_SIZES.large.title,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: SIZES.margin,
  },
  transportIcon: {
    fontSize: FONT_SIZES.large.title,
  },
  favoriteButton: {
    padding: SIZES.padding / 2,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favoriteActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  favoriteIcon: {
    fontSize: FONT_SIZES.medium.body,
  },
  details: {
    flex: 1,
  },
  routeName: {
    fontSize: FONT_SIZES.medium.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  transportType: {
    fontSize: FONT_SIZES.small.body,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  description: {
    fontSize: FONT_SIZES.small.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default RouteCard;

