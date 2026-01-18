import React, { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

export function CaptureReturnPhotoScreen({ rentalId, endLat, endLng }: { rentalId: string; endLat?: number; endLng?: number }) {
  const nav = useNav();
  const { endRental } = useAppData();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function takePhoto() {
    try {
      const pic = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (pic?.uri) setPhotoUri(pic.uri);
    } catch (e) {
      Alert.alert('Greška', 'Neuspešno fotografisanje. Pokušajte ponovo.');
    }
  }

  async function finalize() {
    if (!photoUri) { Alert.alert('Greška', 'Fotografija je obavezna.'); return; }
    if (busy) return;
    setBusy(true);
    const res = await endRental({ rentalId, endLat, endLng, returnPhotoUri: photoUri });
    setBusy(false);
    if (!res.ok || !res.rental) { Alert.alert('Neuspeh', res.error ?? 'Nije moguće završiti iznajmljivanje.'); return; }
    nav.push({ name: 'RentalSummary', rentalId: res.rental.id });
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Fotografiši bicikl" onBack={() => nav.pop()} />

      {!permission ? (
        <View style={styles.center}>
          <Ionicons name="camera" size={48} color={theme.textMuted} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Učitavanje...</Text>
        </View>
      ) : !permission.granted ? (
        <Screen>
          <View style={styles.permCard}>
            <View style={[styles.permIcon, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="camera" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.permTitle, { color: theme.textPrimary }]}>Potrebna je kamera</Text>
            <Text style={[styles.permText, { color: theme.textMuted }]}>Fotografija bicikla je obavezna za završetak</Text>
            <AppButton title="Dozvoli kameru" onPress={() => requestPermission()} icon="camera-outline" />
          </View>
        </Screen>
      ) : photoUri ? (
        <Screen>
          <View style={styles.previewCard}>
            <Ionicons name="checkmark-circle" size={32} color={theme.success} style={{ marginBottom: 12 }} />
            <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>Provera fotografije</Text>
            <Text style={[styles.previewText, { color: theme.textMuted }]}>Ako je sve u redu, potvrdite završetak</Text>
          </View>
          <Image source={{ uri: photoUri }} style={[styles.preview, { backgroundColor: theme.surface }]} />
          <View style={{ height: 16 }} />
          <AppButton title={busy ? 'Završavanje...' : 'Sačuvaj i završi'} onPress={finalize} disabled={busy} icon="checkmark-circle-outline" />
          <View style={{ height: 10 }} />
          <AppButton title="Ponovi fotografiju" onPress={() => setPhotoUri(null)} variant="ghost" icon="camera-reverse-outline" />
        </Screen>
      ) : (
        <View style={styles.body}>
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
            <View style={styles.overlay}>
              <View style={[styles.guideFrame, { borderColor: theme.primary + '80' }]}>
                <Ionicons name="bicycle" size={48} color="rgba(255,255,255,0.5)" />
              </View>
              <Text style={styles.guideText}>Usmerite kameru ka biciklu</Text>
            </View>
          </View>
          <View style={[styles.panel, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            <AppButton title="Fotografiši" onPress={takePhoto} icon="camera-outline" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16 },
  permCard: { alignItems: 'center', paddingTop: 40 },
  permIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  permTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  permText: { textAlign: 'center', marginBottom: 24 },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guideFrame: { width: 200, height: 200, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guideText: { color: '#FFFFFF', fontWeight: '600' },
  panel: { padding: 16, borderTopWidth: 1 },
  previewCard: { alignItems: 'center', marginBottom: 16 },
  previewTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  previewText: {},
  preview: { width: '100%', height: 320, borderRadius: 16 },
});
