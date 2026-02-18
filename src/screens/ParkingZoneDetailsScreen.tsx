import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { haversineMeters, formatMeters } from '../utils/geo';
import { AppButton } from '../components/AppButton';

export function ParkingZoneDetailsScreen({ zoneId }: { zoneId: string }) {
  const nav = useNav();
  const { state } = useAppData();
  const { theme } = useTheme();

  const zone = state.parkingZones.find((z) => z.id === zoneId);

  const bikesInZone = useMemo(() => {
    if (!zone) return [];
    return state.bikes.filter(
      (b) => haversineMeters(zone.lat, zone.lng, b.lat, b.lng) <= zone.radiusMeters
    );
  }, [zone, state.bikes]);

  const availableBikes = bikesInZone.filter((b) => b.status === 'available');
  const occupancy = zone ? bikesInZone.length : 0;
  const zoneCapacity = zone?.capacity ?? 10;
  const occupancyPercent = zoneCapacity > 0 ? Math.min(100, Math.round((occupancy / zoneCapacity) * 100)) : 0;

  if (!zone) {
    return (
      <View style={[styles.full, { backgroundColor: theme.background }]}>
        <TopBar title="Detalji zone" onBack={() => nav.pop()} />
        <View style={styles.empty}>
          <Ionicons name="alert-circle" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Zona nije pronađena</Text>
          <AppButton title="Nazad" onPress={() => nav.pop()} variant="ghost" />
        </View>
      </View>
    );
  }

  function statusColor(status: string) {
    if (status === 'available') return theme.success;
    if (status === 'rented') return theme.textMuted;
    if (status === 'maintenance') return theme.warning;
    return theme.danger;
  }

  function statusLabel(status: string) {
    if (status === 'available') return 'Dostupan';
    if (status === 'rented') return 'Iznajmljen';
    if (status === 'maintenance') return 'Održavanje';
    return 'Onemogućen';
  }

  function bikeTypeLabel(type: string) {
    if (type === 'E-BIKE') return 'E-Bike';
    if (type === 'MTB') return 'MTB';
    return 'Gradski';
  }

  const barColor =
    occupancyPercent >= 90 ? theme.danger : occupancyPercent >= 70 ? theme.warning : theme.success;

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title={zone.name} onBack={() => nav.pop()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Zone Info Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="location" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.zoneName, { color: theme.textPrimary }]}>{zone.name}</Text>
              <Text style={[styles.zoneCoords, { color: theme.textMuted }]}>
                {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* Info Rows */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="radio-button-on" size={16} color={theme.primary} />
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Radijus</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{zone.radiusMeters}m</Text>
            </View>
            <View style={[styles.infoSep, { backgroundColor: theme.border }]} />
            <View style={styles.infoItem}>
              <Ionicons name="bicycle" size={16} color={theme.primary} />
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Kapacitet</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{zoneCapacity}</Text>
            </View>
            <View style={[styles.infoSep, { backgroundColor: theme.border }]} />
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Dostupno</Text>
              <Text style={[styles.infoValue, { color: theme.success }]}>{availableBikes.length}</Text>
            </View>
          </View>
        </View>

        {/* Occupancy Card */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Popunjenost</Text>
          <View style={styles.occupancyHeader}>
            <Text style={[styles.occupancyText, { color: theme.textSecondary }]}>
              {occupancy} / {zoneCapacity} mesta zauzeto
            </Text>
            <Text style={[styles.occupancyPercent, { color: barColor }]}>{occupancyPercent}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            {occupancyPercent > 0 && (
              <View
                style={[
                  styles.progressFill,
                  { flex: occupancyPercent, backgroundColor: barColor },
                ]}
              />
            )}
            {occupancyPercent < 100 && (
              <View style={{ flex: 100 - occupancyPercent }} />
            )}
          </View>
        </View>

        {/* Bikes in Zone */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Bicikli u zoni ({bikesInZone.length})
          </Text>

          {bikesInZone.length === 0 ? (
            <View style={styles.noBikes}>
              <Ionicons name="bicycle-outline" size={36} color={theme.textMuted} />
              <Text style={[styles.noBikesText, { color: theme.textMuted }]}>
                Nema bicikala u ovoj zoni
              </Text>
            </View>
          ) : (
            bikesInZone.map((bike, idx) => {
              const distance = haversineMeters(zone.lat, zone.lng, bike.lat, bike.lng);
              return (
                <TouchableOpacity
                  key={bike.id}
                  style={[
                    styles.bikeRow,
                    idx < bikesInZone.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => nav.push({ name: 'BikeDetails', bikeId: bike.id })}
                >
                  <View style={[styles.bikeIcon, { backgroundColor: statusColor(bike.status) + '1A' }]}>
                    <Ionicons name="bicycle" size={20} color={statusColor(bike.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bikeLabel, { color: theme.textPrimary }]}>{bike.label}</Text>
                    <Text style={[styles.bikeInfo, { color: theme.textMuted }]}>
                      {bikeTypeLabel(bike.type)} · {bike.pricePerHour} RSD/h
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor(bike.status) + '1A' },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: statusColor(bike.status) }]} />
                      <Text style={[styles.statusText, { color: statusColor(bike.status) }]}>
                        {statusLabel(bike.status)}
                      </Text>
                    </View>
                    <Text style={[styles.distanceText, { color: theme.textMuted }]}>
                      {formatMeters(distance)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16 },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneName: { fontSize: 20, fontWeight: '700' },
  zoneCoords: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoSep: { width: 1, height: 40 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 18, fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occupancyText: { fontSize: 14 },
  occupancyPercent: { fontSize: 16, fontWeight: '700' },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  noBikes: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  noBikesText: { fontSize: 14 },

  bikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  bikeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeLabel: { fontSize: 15, fontWeight: '600' },
  bikeInfo: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  distanceText: { fontSize: 11, marginTop: 3 },
});
