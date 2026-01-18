import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

function fmt(ts: number) {
  return new Date(ts).toLocaleString('sr-RS');
}

function getNotifIcon(title: string) {
  if (title.toLowerCase().includes('započ')) return 'play-circle';
  if (title.toLowerCase().includes('završ')) return 'checkmark-circle';
  if (title.toLowerCase().includes('problem')) return 'warning';
  return 'notifications';
}

export function NotificationsScreen() {
  const nav = useNav();
  const { notificationsForUser, state } = useAppData();
  const { theme } = useTheme();
  const list = notificationsForUser();

  if (!list.length) {
    return (
      <Screen>
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="notifications-outline" size={64} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Nema obaveštenja</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Obaveštenja o iznajmljivanjima će se pojaviti ovde</Text>
        </View>
      </Screen>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const iconName = getNotifIcon(item.title);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.surface }]}
              onPress={() => {
                if (!item.relatedRentalId) return;
                const rental = state.rentals.find((r) => r.id === item.relatedRentalId);
                if (rental?.status === 'active') {
                  nav.resetToTabs('Active');
                } else {
                  nav.push({ name: 'RentalDetails', rentalId: item.relatedRentalId });
                }
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name={iconName as any} size={24} color={theme.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardMsg, { color: theme.textSecondary }]}>{item.message}</Text>
                <Text style={[styles.cardTime, { color: theme.textMuted }]}>{fmt(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  card: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12, gap: 14 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
  cardMsg: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  cardTime: { fontSize: 12 },
});
