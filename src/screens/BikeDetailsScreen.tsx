import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { haversineMeters, formatMeters } from '../utils/geo';

export function BikeDetailsScreen({ bikeId }: { bikeId: string }) {
  const nav = useNav();
  const { state, getBikeById } = useAppData();
  const { theme } = useTheme();
  const bike = getBikeById(bikeId);

  const nearest = useMemo(() => {
    if (!bike) return [];
    return state.parkingZones
      .map((z) => ({ z, d: haversineMeters(bike.lat, bike.lng, z.lat, z.lng) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
  }, [bike, state.parkingZones]);

  const statusColor = bike?.status === 'available' ? theme.success : bike?.status === 'rented' ? theme.textMuted : theme.warning;
  const statusText = bike?.status === 'available' ? 'Dostupan' : bike?.status === 'rented' ? 'Iznajmljen' : 'Održavanje';

  if (!bike) {
    return (
      <View style={[styles.full, { backgroundColor: theme.background }]}>
        <TopBar title="Detalji bicikla" onBack={() => nav.pop()} />
        <View style={styles.empty}>
          <Ionicons name="alert-circle" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Bicikl nije pronađen</Text>
          <AppButton title="Nazad" onPress={() => nav.pop()} variant="ghost" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title={`Bicikl ${bike.label}`} onBack={() => nav.pop()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.bikeIconWrap, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="bicycle" size={56} color={theme.primary} />
          </View>
          <Text style={[styles.bikeLabel, { color: theme.textPrimary }]}>{bike.label}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoItem, { backgroundColor: theme.surface }]}>
            <Ionicons name="pricetag" size={20} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Cena</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{bike.pricePerHour} RSD/h</Text>
          </View>
          <View style={[styles.infoItem, { backgroundColor: theme.surface }]}>
            <Ionicons name="speedometer" size={20} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Tip</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{bike.type}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Najbliže parking zone</Text>
          </View>
          {nearest.length === 0 ? (
            <Text style={[styles.emptyZones, { color: theme.textMuted }]}>Nema definisanih parking zona</Text>
          ) : (
            nearest.map(({ z, d }) => (
              <View key={z.id} style={[styles.zoneItem, { borderTopColor: theme.border }]}>
                <Ionicons name="navigate" size={16} color={theme.textMuted} />
                <Text style={[styles.zoneName, { color: theme.textSecondary }]}>{z.name}</Text>
                <Text style={[styles.zoneDist, { color: theme.primary }]}>{formatMeters(d)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 16 }} />
        <AppButton title="Skeniraj QR i iznajmi" onPress={() => nav.push({ name: 'QRScanner' })} disabled={bike.status !== 'available'} icon="qr-code-outline" />
        <View style={{ height: 10 }} />
        <AppButton title="Prijavi problem" onPress={() => nav.push({ name: 'ReportIssue', bikeId: bike.id })} variant="ghost" icon="warning-outline" />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16 },
  heroCard: { alignItems: 'center', borderRadius: 20, padding: 24, marginBottom: 20 },
  bikeIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bikeLabel: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontWeight: '600', fontSize: 14 },
  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  infoItem: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  emptyZones: { fontSize: 14 },
  zoneItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  zoneName: { flex: 1 },
  zoneDist: { fontWeight: '600' },
});
