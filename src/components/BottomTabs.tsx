import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export type TabKey = 'Map' | 'Active' | 'History' | 'Notifs' | 'Profile';

type Props = {
  tab: TabKey;
  onSelect: (t: TabKey) => void;
};

const tabs: { key: TabKey; icon: string; activeIcon: string; label: string }[] = [
  { key: 'Map', icon: 'map-outline', activeIcon: 'map', label: 'Mapa' },
  { key: 'Active', icon: 'bicycle-outline', activeIcon: 'bicycle', label: 'Aktivno' },
  { key: 'History', icon: 'time-outline', activeIcon: 'time', label: 'Istorija' },
  { key: 'Notifs', icon: 'notifications-outline', activeIcon: 'notifications', label: 'Obaveštenja' },
  { key: 'Profile', icon: 'person-outline', activeIcon: 'person', label: 'Profil' },
];

export function BottomTabs({ tab, onSelect }: Props) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      {tabs.map((t) => {
        const isActive = tab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tab}
            onPress={() => onSelect(t.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, isActive && { backgroundColor: theme.primaryMuted }]}>
              <Ionicons
                name={(isActive ? t.activeIcon : t.icon) as any}
                size={22}
                color={isActive ? theme.primary : theme.textMuted}
              />
            </View>
            <Text style={[styles.label, { color: isActive ? theme.primary : theme.textMuted }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
