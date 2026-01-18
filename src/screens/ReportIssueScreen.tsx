import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { TopBar } from '../components/TopBar';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNav } from '../navigation/NavContext';

export function ReportIssueScreen({ bikeId, rentalId }: { bikeId?: string; rentalId?: string }) {
  const nav = useNav();
  const { reportIssue, getBikeById } = useAppData();
  const { theme } = useTheme();
  const bike = bikeId ? getBikeById(bikeId) : undefined;
  const [desc, setDesc] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Dozvola', 'Potrebna je dozvola za galeriju.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  }

  async function takeWithCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Dozvola', 'Potrebna je dozvola za kameru.'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  }

  async function submit() {
    if (busy) return;
    if (!desc.trim()) { Alert.alert('Greška', 'Opis problema je obavezan.'); return; }
    if (!photoUri) { Alert.alert('Greška', 'Fotografija problema je obavezna.'); return; }
    setBusy(true);
    const ok = await reportIssue({ bikeId, rentalId, description: desc.trim(), photoUri });
    setBusy(false);
    if (ok) nav.pop();
  }

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <TopBar title="Prijava problema" onBack={() => nav.pop()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.warningMuted }]}>
              <Ionicons name="warning" size={32} color={theme.warning} />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Prijavite problem</Text>
            {bike && <Text style={[styles.bikeInfo, { color: theme.textMuted }]}>Bicikl: {bike.label} ({bike.type})</Text>}
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Opis problema</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="npr. probušena guma, ne radi kočnica..."
            placeholderTextColor={theme.textMuted}
            style={[styles.textArea, { backgroundColor: theme.surface, color: theme.textPrimary }]}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Fotografija</Text>
          {photoUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photoUri }} style={[styles.preview, { backgroundColor: theme.surface }]} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setPhotoUri(null)}>
                <Ionicons name="close-circle" size={28} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.surface }]} onPress={takeWithCamera}>
                <Ionicons name="camera" size={28} color={theme.primary} />
                <Text style={[styles.photoBtnText, { color: theme.textSecondary }]}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.surface }]} onPress={pickFromGallery}>
                <Ionicons name="images" size={28} color={theme.primary} />
                <Text style={[styles.photoBtnText, { color: theme.textSecondary }]}>Galerija</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 24 }} />
          <AppButton title={busy ? 'Slanje...' : 'Pošalji prijavu'} onPress={submit} disabled={busy} icon="send-outline" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  bikeInfo: { marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  textArea: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, minHeight: 120, fontSize: 15, lineHeight: 22 },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: { flex: 1, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  photoBtnText: { fontSize: 14 },
  previewWrap: { position: 'relative' },
  preview: { width: '100%', height: 240, borderRadius: 16 },
  removeBtn: { position: 'absolute', top: 8, right: 8 },
});
