import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { formatDuration } from '../utils/geo';

export function RentalSummaryScreen({ rentalId }: { rentalId: string }) {
  const nav = useNav();
  const { state, getBikeById } = useAppData();
  const { theme } = useTheme();

  const rental = state.rentals.find((r) => r.id === rentalId);
  const bike = rental ? getBikeById(rental.bikeId) : undefined;

  const durationMs = useMemo(() => {
    if (!rental?.endAt) return 0;
    return rental.endAt - rental.startAt;
  }, [rental?.id]);

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Završetak" onBack={() => nav.resetToTabs('History')} />
      <Screen>
        {!rental || !bike ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={48} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>Detalji nisu pronađeni</Text>
          </View>
        ) : (
          <>
            <View style={[styles.successCard, { backgroundColor: theme.success }]}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Iznajmljivanje završeno!</Text>
              <Text style={styles.successText}>Hvala što koristite BikeRent</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Ionicons name="bicycle" size={24} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{bike.label}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{bike.type}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Ionicons name="time" size={24} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{formatDuration(durationMs)}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Trajanje</Text>
              </View>
            </View>

            <View style={[styles.totalCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Ukupno za naplatu</Text>
              <Text style={[styles.totalValue, { color: theme.success }]}>{rental.totalPrice ?? 0} RSD</Text>
            </View>

            {!!rental.returnPhotoUri && (
              <Image source={{ uri: rental.returnPhotoUri }} style={[styles.preview, { backgroundColor: theme.surface }]} />
            )}

            <View style={{ height: 16 }} />
            <AppButton title="Završi" onPress={() => nav.resetToTabs('History')} icon="checkmark-done-outline" />
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16 },
  successCard: { borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 20 },
  checkIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  successText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  totalCard: { borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 15 },
  totalValue: { fontSize: 24, fontWeight: '800' },
  preview: { width: '100%', height: 200, borderRadius: 16 },
});
