import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { formatDuration } from '../utils/geo';

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function HistoryScreen() {
  const nav = useNav();
  const { state, currentUser, getBikeById } = useAppData();
  const { theme } = useTheme();

  const items = useMemo(() => {
    if (!currentUser) {
      console.log('[History] No currentUser');
      return [];
    }
    console.log('[History] currentUser.id:', currentUser.id);
    console.log('[History] All rental userIds:', state.rentals.map(r => ({ id: r.id, userId: r.userId, status: r.status })));
    const filtered = state.rentals
      .filter((r) => r.userId === currentUser.id && r.status === 'finished' && r.endAt)
      .sort((a, b) => (b.endAt! - a.endAt!));
    console.log('[History] Filtered items:', filtered.length);
    return filtered;
  }, [state.rentals, currentUser?.id]);

  if (!items.length) {
    return (
      <Screen>
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="time-outline" size={64} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Istorija je prazna</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Vaše vožnje će se pojaviti ovde</Text>
        </View>
      </Screen>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const bike = getBikeById(item.bikeId);
          const dur = item.endAt ? item.endAt - item.startAt : 0;
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => nav.push({ name: 'RentalDetails', rentalId: item.id })}>
              <View style={styles.cardLeft}>
                <View style={[styles.bikeIcon, { backgroundColor: theme.primaryMuted }]}>
                  <Ionicons name="bicycle" size={24} color={theme.primary} />
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{bike?.label ?? item.bikeId}</Text>
                <Text style={[styles.cardSub, { color: theme.textMuted }]}>{fmtDate(item.endAt!)} • {formatDuration(dur)}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardPrice, { color: theme.success }]}>{item.totalPrice ?? 0}</Text>
                <Text style={[styles.cardCurrency, { color: theme.textMuted }]}>RSD</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
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
  emptyText: { fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12, gap: 12 },
  cardLeft: {},
  bikeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  cardSub: { fontSize: 13 },
  cardRight: { alignItems: 'flex-end' },
  cardPrice: { fontSize: 18, fontWeight: '800' },
  cardCurrency: { fontSize: 12 },
});
