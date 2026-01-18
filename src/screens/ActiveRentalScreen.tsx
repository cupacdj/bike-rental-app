import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { formatDuration, money2, formatMeters } from '../utils/geo';

export function ActiveRentalScreen() {
  const nav = useNav();
  const { getActiveRental, getBikeById, isInsideAnyParking, nearestParkingFor } = useAppData();
  const { theme } = useTheme();
  const active = getActiveRental();
  const bike = active ? getBikeById(active.bikeId) : undefined;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = active ? now - active.startAt : 0;
  const currentPrice = useMemo(() => {
    if (!active || !bike) return 0;
    const hours = elapsedMs / 3600000;
    return money2(hours * bike.pricePerHour);
  }, [active?.id, bike?.id, elapsedMs]);

  async function requestAndGetLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lokacija je potrebna', 'Završetak iznajmljivanja zahteva proveru parking zone.', [
        { text: 'Otkaži', style: 'cancel' },
        { text: 'Podešavanja', onPress: () => Linking.openSettings() },
      ]);
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  async function onEndRental() {
    if (!active || !bike) return;

    const loc = await requestAndGetLocation();
    if (!loc) return;

    const inside = isInsideAnyParking(loc.lat, loc.lng);
    if (!inside) {
      const nearest = nearestParkingFor(loc.lat, loc.lng);
      Alert.alert(
        'Niste u parking zoni',
        nearest
          ? `Najbliža zona: ${nearest.zone.name} (${formatMeters(nearest.distanceM)})`
          : 'Nema definisanih parking zona.'
      );
      return;
    }

    nav.push({ name: 'CaptureReturnPhoto', rentalId: active.id, endLat: loc.lat, endLng: loc.lng });
  }

  if (!active || !bike) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="bicycle-outline" size={64} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Nema aktivnog iznajmljivanja</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Započnite vožnju skeniranjem QR koda sa bicikla</Text>
          <View style={{ height: 24 }} />
          <AppButton title="Skeniraj QR" onPress={() => nav.push({ name: 'QRScanner' })} icon="qr-code-outline" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Active Card */}
      <View style={[styles.activeCard, { backgroundColor: theme.primary }]}>
        <View style={styles.pulseRing} />
        <View style={styles.bikeIcon}>
          <Ionicons name="bicycle" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.bikeName}>{bike.label}</Text>
        <Text style={styles.bikeType}>{bike.type}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="time" size={24} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{formatDuration(elapsedMs)}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Trajanje</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="cash" size={24} color={theme.success} />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{currentPrice} RSD</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Trenutna cena</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="information-circle" size={18} color={theme.textMuted} />
        <Text style={[styles.infoText, { color: theme.textMuted }]}>Cena: {bike.pricePerHour} RSD/h</Text>
      </View>

      <View style={{ flex: 1 }} />

      <AppButton title="Završi iznajmljivanje" onPress={onEndRental} icon="checkmark-circle-outline" />
      <View style={{ height: 10 }} />
      <AppButton
        title="Prijavi problem"
        onPress={() => nav.push({ name: 'ReportIssue', bikeId: bike.id, rentalId: active.id })}
        variant="ghost"
        icon="warning-outline"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  activeCard: { borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' },
  pulseRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  bikeIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bikeName: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  bikeType: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  infoText: { fontSize: 14 },
});
