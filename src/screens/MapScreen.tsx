import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { haversineMeters } from '../utils/geo';

type Coord = { lat: number; lng: number };

export function MapScreen() {
  const nav = useNav();
  const { state } = useAppData();
  const { theme, mode } = useTheme();
  const [loc, setLoc] = useState<Coord | null>(null);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [nearOnly, setNearOnly] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  const region: Region = useMemo(() => {
    const center = loc ?? { lat: 44.8166, lng: 20.4602 };
    return { latitude: center.lat, longitude: center.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  }, [loc]);

  const bikesToShow = useMemo(() => {
    if (!loc || !nearOnly) return state.bikes;
    return state.bikes.filter((b) => haversineMeters(loc.lat, loc.lng, b.lat, b.lng) <= 4000);
  }, [state.bikes, loc, nearOnly]);

  const availableCount = bikesToShow.filter((b) => b.status === 'available').length;
  const totalCount = bikesToShow.length;

  function pinColor(status: string) {
    if (status === 'available') return theme.success;
    if (status === 'rented') return theme.textMuted;
    if (status === 'maintenance') return theme.warning;
    return theme.danger;
  }

  function onNeedLocation() {
    Alert.alert(
      'Lokacija potrebna',
      'Dozvolite pristup lokaciji da biste videli bicikle u vašoj blizini i koristili sve funkcije aplikacije.',
      [
        { text: 'Otkaži', style: 'cancel' },
        { text: 'Otvori podešavanja', onPress: () => Linking.openSettings() },
      ]
    );
  }

  async function centerOnUser() {
    if (permission === 'denied') {
      onNeedLocation();
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {}
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <View style={styles.mapWrap}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          region={region}
          showsUserLocation={permission === 'granted'}
          showsMyLocationButton={false}
          userInterfaceStyle={mode}
        >
          {state.parkingZones.map((z) => (
            <Circle
              key={z.id}
              center={{ latitude: z.lat, longitude: z.lng }}
              radius={z.radiusMeters}
              strokeWidth={2}
              strokeColor={theme.primary + 'CC'}
              fillColor={theme.primary + '1A'}
            />
          ))}
          {bikesToShow.map((b) => (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.lat, longitude: b.lng }}
              title={`${b.label} (${b.type})`}
              description={`${b.pricePerHour} RSD/h`}
              pinColor={pinColor(b.status)}
              onPress={() => nav.push({ name: 'BikeDetails', bikeId: b.id })}
            />
          ))}
        </MapView>

        {/* Top Stats Card */}
        <View style={styles.topOverlay}>
          <View style={[styles.statsCard, { backgroundColor: theme.surface, shadowColor: theme.textPrimary }]}>
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: theme.successMuted }]}>
                <Ionicons name="bicycle" size={18} color={theme.success} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{availableCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Dostupno</Text>
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="location" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{totalCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Ukupno</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Permission Warning */}
        {permission === 'denied' && (
          <View style={styles.warningOverlay}>
            <TouchableOpacity
              style={[styles.warningCard, { backgroundColor: theme.warningMuted, borderColor: theme.warning }]}
              onPress={onNeedLocation}
              activeOpacity={0.8}
            >
              <View style={[styles.warningIconWrap, { backgroundColor: theme.warning }]}>
                <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, { color: theme.textPrimary }]}>Lokacija nije dozvoljena</Text>
                <Text style={[styles.warningText, { color: theme.textSecondary }]}>Dodirnite za podešavanja</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.warning} />
            </TouchableOpacity>
          </View>
        )}

        {/* Map Control Buttons */}
        <View style={styles.mapControls}>
          {/* My Location Button */}
          <TouchableOpacity
            style={[styles.mapBtn, { backgroundColor: theme.surface, shadowColor: theme.textPrimary }]}
            onPress={centerOnUser}
            activeOpacity={0.8}
          >
            <Ionicons
              name={permission === 'granted' ? 'navigate' : 'navigate-outline'}
              size={22}
              color={permission === 'granted' ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>

          {/* Filter Button */}
          <TouchableOpacity
            style={[
              styles.mapBtn,
              { backgroundColor: nearOnly ? theme.primary : theme.surface, shadowColor: theme.textPrimary },
            ]}
            onPress={() => {
              if (permission === 'denied') return onNeedLocation();
              setNearOnly((v) => !v);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={nearOnly ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={nearOnly ? '#FFFFFF' : theme.textMuted}
            />
            {nearOnly && <Text style={styles.filterLabel}>4km</Text>}
          </TouchableOpacity>
        </View>

        {/* QR Scanner FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
          onPress={() => nav.push({ name: 'QRScanner' })}
          activeOpacity={0.9}
        >
          <View style={styles.fabInner}>
            <Ionicons name="qr-code" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.fabLabel}>Skeniraj</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  mapWrap: { flex: 1 },

  // Top Stats
  topOverlay: { position: 'absolute', top: 16, left: 16, right: 16 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: -2 },
  statDivider: { width: 1, height: 36, marginHorizontal: 12 },

  // Warning
  warningOverlay: { position: 'absolute', top: 88, left: 16, right: 16 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  warningIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: '700' },
  warningText: { fontSize: 12, marginTop: 2 },

  // Map Controls
  mapControls: { position: 'absolute', right: 16, top: '35%', gap: 12 },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabInner: {},
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
