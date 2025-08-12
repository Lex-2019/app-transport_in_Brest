import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES, FONT_SIZES } from '../utils/constants';

export type TransportType = 'all' | 'bus' | 'trolleybus' | 'minibus';

interface TransportTypeFilterProps {
  selectedType: TransportType;
  onTypeSelect: (type: TransportType) => void;
}

const TransportTypeFilter: React.FC<TransportTypeFilterProps> = ({
  selectedType,
  onTypeSelect,
}) => {
  const getTypeIcon = (type: TransportType) => {
    switch (type) {
      case 'all':
        return '🚌🚎🚐';
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

  const getTypeLabel = (type: TransportType) => {
    switch (type) {
      case 'all':
        return 'Все';
      case 'bus':
        return 'Автобусы';
      case 'trolleybus':
        return 'Троллейбусы';
      case 'minibus':
        return 'Маршрутные такси';
      default:
        return 'Все';
    }
  };

  const types: TransportType[] = ['all', 'bus', 'trolleybus', 'minibus'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Тип транспорта:</Text>
      <View style={styles.filterContainer}>
        {types.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              selectedType === type && styles.filterButtonActive,
            ]}
            onPress={() => onTypeSelect(type)}
            activeOpacity={0.7}
          >
            <Text style={styles.typeIcon}>{getTypeIcon(type)}</Text>
            <Text
              style={[
                styles.typeLabel,
                selectedType === type && styles.typeLabelActive,
              ]}
            >
              {getTypeLabel(type)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.margin,
  },
  title: {
    fontSize: FONT_SIZES.medium.subtitle,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.margin,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  filterButton: {
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '48%',
    height: 90,
    justifyContent: 'center',
    marginBottom: SIZES.margin,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeIcon: {
    fontSize: FONT_SIZES.large.title,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: FONT_SIZES.small.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: COLORS.background,
    fontWeight: '600',
  },
});

export default TransportTypeFilter;
