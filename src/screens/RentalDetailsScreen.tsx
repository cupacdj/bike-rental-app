import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import { formatDuration } from '../utils/geo';

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString('sr-RS');
}

export function RentalDetailsScreen({ rentalId }: { rentalId: string }) {
  const nav = useNav();
  const { state, getBikeById } = useAppData();
  const { theme } = useTheme();

  const rental = state.rentals.find((r) => r.id === rentalId);
  const bike = rental ? getBikeById(rental.bikeId) : undefined;
  const dur = useMemo(() => {
    if (!rental?.endAt) return 0;
    return rental.endAt - rental.startAt;
  }, [rental?.id]);

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Detalji iznajmljivanja" onBack={() => nav.pop()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!rental || !bike ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={48} color={theme.textMuted} />
            <Text style={[styles.errorText, { color: theme.textMuted }]}>Detalji nisu pronađeni</Text>
          </View>
        ) : (
          <>
            <View style={[styles.bikeCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.bikeIcon, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="bicycle" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.bikeName, { color: theme.textPrimary }]}>{bike.label}</Text>
              <Text style={[styles.bikeType, { color: theme.textMuted }]}>{bike.type}</Text>
            </View>

            <View style={[styles.timeline, { backgroundColor: theme.surface }]}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: theme.success }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, { color: theme.textMuted }]}>Početak</Text>
                  <Text style={[styles.timelineValue, { color: theme.textPrimary }]}>{fmtDate(rental.startAt)}</Text>
                </View>
              </View>
              <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: theme.danger }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, { color: theme.textMuted }]}>Završetak</Text>
                  <Text style={[styles.timelineValue, { color: theme.textPrimary }]}>{rental.endAt ? fmtDate(rental.endAt) : '—'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Ionicons name="time" size={24} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{formatDuration(dur)}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Trajanje</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Ionicons name="cash" size={24} color={theme.success} />
                <Text style={[styles.statValue, { color: theme.textPrimary }]}>{rental.totalPrice ?? 0} RSD</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Ukupno</Text>
              </View>
            </View>

            {!!rental.returnPhotoUri && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Fotografija pri vraćanju</Text>
                <Image source={{ uri: rental.returnPhotoUri }} style={[styles.preview, { backgroundColor: theme.surface }]} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16 },
  errorText: { fontSize: 16 },
  bikeCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  bikeIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bikeName: { fontSize: 24, fontWeight: '800' },
  bikeType: { fontSize: 15, marginTop: 4 },
  timeline: { borderRadius: 16, padding: 20, marginBottom: 20 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, height: 24, marginLeft: 5, marginVertical: 4 },
  timelineContent: {},
  timelineLabel: { fontSize: 13 },
  timelineValue: { fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  preview: { width: '100%', height: 240, borderRadius: 16 },
});
