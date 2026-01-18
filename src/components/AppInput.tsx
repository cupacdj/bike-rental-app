import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type Props = TextInputProps & {
  label: string;
  icon?: string;
};

export function AppInput({ label, icon, style, ...rest }: Props) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon && <Ionicons name={icon as any} size={20} color={theme.textMuted} style={styles.icon} />}
        <TextInput
          style={[
            styles.input, 
            { backgroundColor: theme.surface, color: theme.textPrimary },
            icon && styles.inputWithIcon, 
            style
          ]}
          placeholderTextColor={theme.textMuted}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
});
