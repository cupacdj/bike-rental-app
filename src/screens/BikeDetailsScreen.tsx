import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { haversineMeters, formatMeters } from '../utils/geo';
import { getServerUrl } from '../services/syncConfig';
import * as Location from 'expo-location';

export function BikeDetailsScreen({ bikeId }: { bikeId: string }) {
  const nav = useNav();
  const { state, getBikeById, startRental, isOnline } = useAppData();
  const { theme } = useTheme();
  const bike = getBikeById(bikeId);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [renting, setRenting] = useState(false);

  // Build QR code URL from server
  useEffect(() => {
    (async () => {
      try {
        const serverUrl = await getServerUrl();
        if (serverUrl && bike) {
          const base = serverUrl.replace(/\/+$/, '');
          setQrUrl(`${base}/api/bikes/${bike.id}/qr`);
        }
      } catch {
        // no server URL configured
      } finally {
        setQrLoading(false);
      }
    })();
  }, [bike?.id]);

  const handleQrPress = useCallback(async () => {
    if (!bike || bike.status !== 'available' || renting) return;

    Alert.alert(
      'Iznajmi bicikl',
      `Da li želite da iznajmite bicikl ${bike.label}?`,
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Iznajmi',
          onPress: async () => {
            setRenting(true);
            let startLat: number | undefined;
            let startLng: number | undefined;
            try {
              const { status } = await Location.getForegroundPermissionsAsync();
              if (status === 'granted') {
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                startLat = pos.coords.latitude;
                startLng = pos.coords.longitude;
              }
            } catch {}
            const res = await startRental({ bikeId: bike.id, startLat, startLng });
            setRenting(false);
            if (!res.ok) {
              Alert.alert('Neuspeh', res.error ?? 'Nije moguće započeti iznajmljivanje.');
              return;
            }
            nav.resetToTabs('Active');
          },
        },
      ]
    );
  }, [bike, renting, startRental, nav]);

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

        {/* QR Code Card */}
        <View style={[styles.qrCard, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="qr-code" size={20} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>QR kod bicikla</Text>
          </View>

          {qrLoading ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : qrUrl && isOnline ? (
            <TouchableOpacity
              onPress={handleQrPress}
              disabled={bike.status !== 'available' || renting}
              activeOpacity={0.7}
              style={styles.qrTouchable}
            >
              <View style={[styles.qrImageWrap, { borderColor: bike.status === 'available' ? theme.primary : theme.border }]}>
                <Image
                  source={{ uri: qrUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              {bike.status === 'available' ? (
                <View style={[styles.qrHint, { backgroundColor: theme.primaryMuted }]}>
                  <Ionicons name="finger-print" size={16} color={theme.primary} />
                  <Text style={[styles.qrHintText, { color: theme.primary }]}>
                    {renting ? 'Pokretanje...' : 'Dodirnite QR kod za iznajmljivanje'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.qrUnavailable, { color: theme.textMuted }]}>
                  Bicikl trenutno nije dostupan za iznajmljivanje
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="cloud-offline" size={32} color={theme.textMuted} />
              <Text style={[styles.qrOfflineText, { color: theme.textMuted }]}>
                Povežite se sa serverom da vidite QR kod
              </Text>
            </View>
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
  qrCard: { borderRadius: 16, padding: 16, marginTop: 20 },
  qrTouchable: { alignItems: 'center' },
  qrImageWrap: { width: 200, height: 200, borderRadius: 16, borderWidth: 2, overflow: 'hidden', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  qrImage: { width: 180, height: 180 },
  qrHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  qrHintText: { fontSize: 13, fontWeight: '600' },
  qrUnavailable: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  qrPlaceholder: { alignItems: 'center', justifyContent: 'center', height: 160, gap: 12 },
  qrOfflineText: { fontSize: 13, textAlign: 'center' },
});
