import React, { useEffect, useState } from "react";
import { Alert, View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { clearServerUrl, getServerUrl, setServerUrl } from "../services/syncConfig";
import { AppButton } from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';

export default function SyncSettingsScreen({ onDone }: { onDone?: () => void }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await getServerUrl();
      setUrl(v ?? "");
      setLoaded(true);
    })();
  }, []);

  const save = async () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) {
      Alert.alert("Greška", "URL mora početi sa http:// ili https://");
      return;
    }
    await setServerUrl(u);
    Alert.alert("Sačuvano", "Server URL je sačuvan.");
    onDone?.();
  };

  const clear = async () => {
    await clearServerUrl();
    setUrl("");
    Alert.alert("Obrisano", "Server URL je obrisan.");
  };

  if (!loaded) return null;

  return (
    <View style={[styles.full, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="cloud-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Sync Settings</Text>
            <Text style={[styles.help, { color: theme.textMuted }]}>Unesi URL lokalnog servera (LAN IP)</Text>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Server URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.x.x:5055"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={{ height: 16 }} />
          <AppButton title="Sačuvaj" onPress={save} icon="save-outline" />
          <View style={{ height: 10 }} />
          <AppButton title="Obriši" onPress={clear} variant="ghost" icon="trash-outline" />
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
  help: { marginTop: 6, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
});
