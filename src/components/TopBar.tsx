import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  title: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
};

export function TopBar({ title, onBack, rightIcon, onRightPress }: Props) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      {onBack ? (
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface }]} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>{title}</Text>
      {rightIcon && onRightPress ? (
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.surface }]} onPress={onRightPress}>
          <Ionicons name={rightIcon as any} size={22} color={theme.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
