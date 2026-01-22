import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';
import * as Location from 'expo-location';

function parseBikeId(data: string): string | null {
  const t = (data ?? '').trim();
  if (!t) return null;
  if (t.startsWith('bike:')) return t.slice('bike:'.length);
  if (t.startsWith('BIKE:')) return t.slice('BIKE:'.length);
  return t;
}

export function QRScannerScreen() {
  const nav = useNav();
  const { startRental } = useAppData();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);

  const canScan = useMemo(() => !!permission?.granted && !scanned && !busy, [permission?.granted, scanned, busy]);

  async function tryStartFromCode(raw: string) {
    if (busy) return;
    const bikeId = parseBikeId(raw);
    if (!bikeId) {
      Alert.alert('Greška', 'QR kod nije validan.');
      return;
    }
    setBusy(true);
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
    const res = await startRental({ bikeId, startLat, startLng });
    setBusy(false);
    if (!res.ok) {
      Alert.alert('Neuspeh', res.error ?? 'Nije moguće započeti iznajmljivanje.');
      setScanned(false);
      return;
    }
    nav.resetToTabs('Active');
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Skeniraj QR" onBack={() => nav.pop()} />

      {!permission ? (
        <View style={styles.center}>
          <Ionicons name="camera" size={48} color={theme.textMuted} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Učitavanje kamere...</Text>
        </View>
      ) : !permission.granted ? (
        <Screen>
          <View style={styles.permissionCard}>
            <View style={[styles.permIconWrap, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="camera" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.permTitle, { color: theme.textPrimary }]}>Potrebna je kamera</Text>
            <Text style={[styles.permText, { color: theme.textMuted }]}>Kamera se koristi za skeniranje QR koda sa bicikla</Text>
            <AppButton title="Dozvoli kameru" onPress={() => requestPermission()} icon="camera-outline" />
            <View style={{ height: 10 }} />
            <AppButton title="Nazad" onPress={() => nav.pop()} variant="ghost" />
          </View>
        </Screen>
      ) : (
        <KeyboardAvoidingView 
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={canScan ? (ev) => { setScanned(true); tryStartFromCode(ev.data); } : undefined}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={styles.cameraOverlay}>
              <Text style={styles.overlayText}>Poravnajte QR kod u okvir</Text>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.cornerTL, { borderColor: theme.primary }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: theme.primary }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: theme.primary }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: theme.primary }]} />
              </View>
              {scanned && <Text style={[styles.processingText, { color: theme.primary }]}>Obrada...</Text>}
            </View>
          </View>

          <ScrollView 
            style={[styles.panel, { backgroundColor: theme.background, borderTopColor: theme.border }]}
            contentContainerStyle={styles.panelContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.manualLabel, { color: theme.textMuted }]}>Ili unesite kod ručno (ID ili oznaku bicikla):</Text>
            <View style={styles.manualRow}>
              <TextInput
                value={manual}
                onChangeText={setManual}
                placeholder="bike_1 ili BG-001"
                placeholderTextColor={theme.textMuted}
                style={[styles.manualInput, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={() => { Keyboard.dismiss(); tryStartFromCode(manual); }}
              />
              <AppButton title={busy ? '...' : 'Pokreni'} onPress={() => { Keyboard.dismiss(); tryStartFromCode(manual); }} disabled={busy} style={{ minWidth: 100 }} />
            </View>
            <AppButton title="Skeniraj ponovo" onPress={() => setScanned(false)} variant="ghost" icon="refresh-outline" />
            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16 },
  permissionCard: { alignItems: 'center', paddingTop: 40 },
  permIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  permTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  permText: { textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 16 },
  overlayText: { color: '#FFFFFF', fontWeight: '600', marginBottom: 24, fontSize: 16 },
  processingText: { fontWeight: '700', marginTop: 24 },
  frame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  panel: { borderTopWidth: 1, maxHeight: 200 },
  panelContent: { padding: 16 },
  manualLabel: { fontSize: 13, marginBottom: 10 },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  manualInput: { flex: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
});
