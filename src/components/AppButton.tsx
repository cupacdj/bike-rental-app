import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  style?: ViewStyle;
};

export function AppButton({ title, onPress, disabled, variant = 'primary', icon, style }: Props) {
  const { theme } = useTheme();
  
  const getBackgroundColor = () => {
    if (variant === 'primary') return theme.primary;
    if (variant === 'secondary') return theme.surface;
    if (variant === 'danger') return theme.danger;
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'ghost') return theme.primary;
    if (variant === 'secondary') return theme.textPrimary;
    return '#FFFFFF';
  };

  const btnStyle = [
    styles.btn,
    { backgroundColor: getBackgroundColor() },
    variant === 'secondary' && { borderWidth: 1, borderColor: theme.border },
    disabled && styles.disabled,
    style,
  ];

  const textColor = getTextColor();

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      {icon && <Ionicons name={icon as any} size={20} color={disabled ? theme.textMuted : textColor} />}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
