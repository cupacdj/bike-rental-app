import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
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
  const { getActiveRental, getBikeById, isInsideAnyParking, nearestParkingFor, refreshFromServer, isOnline } = useAppData();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isLandscape = width > height;

  const active = getActiveRental();
  const bike = active ? getBikeById(active.bikeId) : undefined;
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFromServer();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshFromServer]);

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

    setLoading(true);
    try {
      const loc = await requestAndGetLocation();
      if (!loc) {
        setLoading(false);
        return;
      }

      const inside = isInsideAnyParking(loc.lat, loc.lng);
      if (!inside) {
        const nearest = nearestParkingFor(loc.lat, loc.lng);
        Alert.alert(
          'Niste u parking zoni',
          nearest
            ? `Najbliža zona: ${nearest.zone.name} (${formatMeters(nearest.distanceM)})`
            : 'Nema definisanih parking zona.'
        );
        setLoading(false);
        return;
      }

      nav.push({ name: 'CaptureReturnPhoto', rentalId: active.id, endLat: loc.lat, endLng: loc.lng });
    } finally {
      setLoading(false);
    }
  }

  // Responsive sizes
  const iconSize = isSmallScreen ? 48 : 64;
  const cardIconSize = isSmallScreen ? 32 : 40;
  const titleSize = isSmallScreen ? 18 : 22;
  const bikeNameSize = isSmallScreen ? 22 : 28;
  const statValueSize = isSmallScreen ? 18 : 22;
  const cardPadding = isSmallScreen ? 20 : 32;

  if (!active || !bike) {
    return (
      <Screen>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.emptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.emptyIcon, { backgroundColor: theme.primaryMuted, width: iconSize * 1.8, height: iconSize * 1.8, borderRadius: iconSize * 0.9 }]}>
              <Ionicons name="bicycle-outline" size={iconSize} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary, fontSize: titleSize }]}>
              Nema aktivnog iznajmljivanja
            </Text>
            <Text style={[styles.emptyText, { color: theme.textMuted, fontSize: isSmallScreen ? 13 : 15 }]}>
              Započnite vožnju skeniranjem QR koda sa bicikla
            </Text>
            
            {/* Connection status */}
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? theme.success + '20' : theme.danger + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.success : theme.danger }]} />
              <Text style={[styles.statusText, { color: isOnline ? theme.success : theme.danger }]}>
                {isOnline ? 'Povezano sa serverom' : 'Offline režim'}
              </Text>
            </View>

            <View style={{ height: 24 }} />
            <AppButton 
              title="Skeniraj QR" 
              onPress={() => nav.push({ name: 'QRScanner' })} 
              icon="qr-code-outline" 
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && styles.landscapeContent
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Connection status indicator */}
          <View style={[styles.connectionBar, { backgroundColor: isOnline ? theme.success + '15' : theme.warning + '15' }]}>
            <Ionicons 
              name={isOnline ? 'cloud-done' : 'cloud-offline'} 
              size={16} 
              color={isOnline ? theme.success : theme.warning} 
            />
            <Text style={[styles.connectionText, { color: isOnline ? theme.success : theme.warning }]}>
              {isOnline ? 'Sinhronizovano' : 'Offline - podaci će se sinhronizovati'}
            </Text>
          </View>

          {/* Active Card */}
          <View style={[
            styles.activeCard, 
            { 
              backgroundColor: theme.primary,
              padding: cardPadding,
              borderRadius: isSmallScreen ? 18 : 24
            }
          ]}>
            <View style={styles.pulseRing} />
            <View style={[
              styles.bikeIcon, 
              { 
                width: cardIconSize * 2, 
                height: cardIconSize * 2, 
                borderRadius: cardIconSize 
              }
            ]}>
              <Ionicons name="bicycle" size={cardIconSize} color="#FFFFFF" />
            </View>
            <Text style={[styles.bikeName, { fontSize: bikeNameSize }]}>{bike.label}</Text>
            <Text style={[styles.bikeType, { fontSize: isSmallScreen ? 14 : 16 }]}>{bike.type}</Text>
          </View>

          {/* Stats */}
          <View style={[
            styles.statsRow, 
            isLandscape && styles.statsRowLandscape
          ]}>
            <View style={[
              styles.statCard, 
              { 
                backgroundColor: theme.surface,
                padding: isSmallScreen ? 14 : 20,
                borderRadius: isSmallScreen ? 12 : 16
              }
            ]}>
              <Ionicons name="time" size={isSmallScreen ? 20 : 24} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.textPrimary, fontSize: statValueSize }]}>
                {formatDuration(elapsedMs)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted, fontSize: isSmallScreen ? 11 : 13 }]}>
                Trajanje
              </Text>
            </View>
            <View style={[
              styles.statCard, 
              { 
                backgroundColor: theme.surface,
                padding: isSmallScreen ? 14 : 20,
                borderRadius: isSmallScreen ? 12 : 16
              }
            ]}>
              <Ionicons name="cash" size={isSmallScreen ? 20 : 24} color={theme.success} />
              <Text style={[styles.statValue, { color: theme.textPrimary, fontSize: statValueSize }]}>
                {currentPrice} RSD
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted, fontSize: isSmallScreen ? 11 : 13 }]}>
                Trenutna cena
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={isSmallScreen ? 16 : 18} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.textMuted, fontSize: isSmallScreen ? 12 : 14 }]}>
              Cena: {bike.pricePerHour} RSD/h
            </Text>
          </View>

          <View style={{ flex: 1, minHeight: 20 }} />

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <AppButton 
              title={loading ? "Učitavanje..." : "Završi iznajmljivanje"} 
              onPress={onEndRental} 
              icon={loading ? undefined : "checkmark-circle-outline"}
              disabled={loading}
            />
            {loading && (
              <ActivityIndicator 
                style={styles.loadingIndicator} 
                size="small" 
                color={theme.primary} 
              />
            )}
            <View style={{ height: 10 }} />
            <AppButton
              title="Prijavi problem"
              onPress={() => nav.push({ name: 'ReportIssue', bikeId: bike.id, rentalId: active.id })}
              variant="ghost"
              icon="warning-outline"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  landscapeContent: {
    paddingHorizontal: 40,
  },
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24 
  },
  emptyTitle: { 
    fontWeight: '700', 
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: { 
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeCard: { 
    alignItems: 'center', 
    marginBottom: 20, 
    position: 'relative', 
    overflow: 'hidden' 
  },
  pulseRing: { 
    position: 'absolute', 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  bikeIcon: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  bikeName: { 
    color: '#FFFFFF', 
    fontWeight: '800' 
  },
  bikeType: { 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 4 
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 16 
  },
  statsRowLandscape: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  statCard: { 
    flex: 1, 
    alignItems: 'center', 
    gap: 8 
  },
  statValue: { 
    fontWeight: '700' 
  },
  statLabel: {},
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 24 
  },
  infoText: {},
  buttonsContainer: {
    marginTop: 'auto',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 20,
    top: 15,
  },
});
